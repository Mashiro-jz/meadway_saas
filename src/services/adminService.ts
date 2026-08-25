import { supabase } from "../../lib/supabase";

export const adminService = {
  // HELPER: Prywatna funkcja serwisu do pobierania ID zalogowanego edytora (do Audytu)
  async getCurrentAdminId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;
    const { data } = await supabase.from('uzytkownicy').select('id_uzytkownika').eq('email', user.email).single();
    return data?.id_uzytkownika;
  },

  // Pobieranie listy rejonów
  async getRejony() {
    const { data, error } = await supabase
      .from("rejony")
      .select("*")
      .order("nazwa", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Pobieranie listy pracowników podległych
  async getPodleglychPracownikow(rola: string, idRejonu: number | null) {
    let query = supabase
      .from("uzytkownicy")
      .select("id_uzytkownika, imie, nazwisko, rola, email, id_rejonu");

    if (rola === "koordynator") {
      if (!idRejonu) return [];
      query = query.or(`id_rejonu.eq.${idRejonu},id_rejonu.eq.2`);
    } else if (rola === "pracownik") {
      return [];
    }

    const { data, error } = await query.order("nazwisko", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Pobieranie nadchodzących jarmarków
  async getJarmarkiZarzadzane(rola: string, idRejonu: number | null) {
    let query = supabase
      .from("punkty_handlu")
      .select("*")
      .order("nazwa", { ascending: true });

    if (rola === "koordynator") {
      if (!idRejonu) return [];
      query = query.eq("id_rejonu", idRejonu);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Pobieranie dostępności pracowników
  async getDostepnoscLudziNaJarmark(
    rola: string,
    idRejonu: number | null,
    startData: string,
    koniecData: string,
  ) {
    let uzytkownicyQuery = supabase
      .from("uzytkownicy")
      // ZMIANA SKŁADNI NA ODPORNĄ (!id_rejonu)
      .select(
        "id_uzytkownika, imie, nazwisko, rola, numer_telefonu, id_rejonu, rejony!id_rejonu(nazwa)",
      );

    if (rola === "koordynator") {
      if (!idRejonu) return { ludzie: [], wpisyGrafiku: [] };
      uzytkownicyQuery = uzytkownicyQuery.or(
        `id_rejonu.eq.${idRejonu},id_rejonu.eq.2`,
      );
    }

    const { data: ludzie, error: errU } = await uzytkownicyQuery;
    if (errU) throw errU;

    const { data: wpisyGrafiku, error: errG } = await supabase
      .from("grafik")
      .select("*, punkty_handlu(*)")
      .gte("data", startData)
      .lte("data", koniecData);
    if (errG) throw errG;

    return { ludzie: ludzie || [], wpisyGrafiku: wpisyGrafiku || [] };
  },

  // Zapisanie przypisania pracownika
  async przypiszPracownikaDoJarmarku(
    idUzytkownika: number,
    dataStr: string,
    idLokalizacji: number | null,
    wymuszone: boolean = false,
  ) {
    if (idLokalizacji === null) {
      const { data: obecny } = await supabase
        .from("grafik")
        .select("dostepnosc")
        .eq("id_uzytkownika", idUzytkownika)
        .eq("data", dataStr)
        .maybeSingle();
      if (!obecny || obecny.dostepnosc === "nieznana") {
        await supabase
          .from("grafik")
          .delete()
          .eq("id_uzytkownika", idUzytkownika)
          .eq("data", dataStr);
        return;
      }
      await supabase
        .from("grafik")
        .update({ id_lokalizacji: null, wymuszone: false })
        .eq("id_uzytkownika", idUzytkownika)
        .eq("data", dataStr);
      return;
    }

    const { data: istniejacy } = await supabase
      .from("grafik")
      .select("dostepnosc, wymuszone")
      .eq("id_uzytkownika", idUzytkownika)
      .eq("data", dataStr)
      .maybeSingle();
    let statusDostepnosci = istniejacy ? istniejacy.dostepnosc : "nieznana";
    let czyBoloWymuszone = istniejacy ? istniejacy.wymuszone || false : false;

    if (wymuszone) {
      statusDostepnosci = "dostepny";
      czyBoloWymuszone = true;
    }

    const { error } = await supabase.from("grafik").upsert(
      {
        id_uzytkownika: idUzytkownika,
        data: dataStr,
        dostepnosc: statusDostepnosci,
        id_lokalizacji: idLokalizacji,
        wymuszone: czyBoloWymuszone,
      },
      { onConflict: "id_uzytkownika,data" },
    );

    if (error) throw error;
  },

  // Pobranie wszystkich punktów
  async getAllPunktyHandlu() {
    const { data, error } = await supabase
      .from("punkty_handlu")
      // ZMIANA SKŁADNI NA ODPORNĄ (!id_rejonu, !updated_by)
      .select(
        "*, rejony!id_rejonu(nazwa), edytor:uzytkownicy!updated_by(imie, nazwisko)",
      )
      .order("nazwa", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Zapisanie punktu handlu
  async savePunktHandlu(punktData: any, idLokalizacji?: number) {
    const idAdmina = await this.getCurrentAdminId(); 
    const dataWithAudit = { ...punktData, updated_by: idAdmina };
    
    if (idLokalizacji) {
      const { data, error } = await supabase.from("punkty_handlu").update(dataWithAudit).eq("id_lokalizacji", idLokalizacji).select().single();
      if (error) throw error; 
      if (!data) throw new Error("Baza odrzuciła zapis (prawdopodobnie brak polisy RLS UPDATE).");
    } else {
      const { error } = await supabase.from("punkty_handlu").insert([dataWithAudit]).select().single();
      if (error) throw error;
    }
  },

  async deletePunktHandlu(idLokalizacji: number) {
    const { error } = await supabase
      .from("punkty_handlu")
      .delete()
      .eq("id_lokalizacji", idLokalizacji);
    if (error) throw error;
  },

  // Pobranie wszystkich użytkowników dla panelu Admina
  async getWszyscyPracownicy() {
    const { data, error } = await supabase
      .from("uzytkownicy")
      // ZMIANA SKŁADNI NA ODPORNĄ (!id_rejonu, !updated_by)
      .select(
        "*, rejony!id_rejonu(nazwa), edytor:uzytkownicy!updated_by(imie, nazwisko)",
      )
      .order("nazwisko", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Zapis pracownika
  async savePracownik(pracownikData: any, idUzytkownika?: number) {
    const idAdmina = await this.getCurrentAdminId(); 
    const dataWithAudit = { ...pracownikData, updated_by: idAdmina };
    
    if (idUzytkownika) {
      const { data, error } = await supabase.from("uzytkownicy").update(dataWithAudit).eq("id_uzytkownika", idUzytkownika).select().single();
      if (error) throw error; 
      if (!data) throw new Error("Brak uprawnień do edycji pracownika (RLS blokuje).");
    } else {
      const { error } = await supabase.from("uzytkownicy").insert([dataWithAudit]).select().single();
      if (error) throw error;
    }
  },

  async deletePracownik(idUzytkownika: number) {
    const { error } = await supabase
      .from("uzytkownicy")
      .delete()
      .eq("id_uzytkownika", idUzytkownika);

    if (error) throw error;
  },

  // Pobranie listy rejonów z koordynatorami
  async getRejonyZKoordynatorami() {
    const { data, error } = await supabase
      .from("rejony")
      // ZMIANA SKŁADNI NA ODPORNĄ (!id_koordynatora, !updated_by)
      .select("*, uzytkownicy!id_koordynatora(imie, nazwisko), edytor:uzytkownicy!updated_by(imie, nazwisko)")
      .order("nazwa", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDostepniKoordynatorzy() {
    const { data, error } = await supabase
      .from("uzytkownicy")
      .select("id_uzytkownika, imie, nazwisko, rola")
      .in("rola", ["koordynator", "admin"])
      .order("nazwisko", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Zapis rejonu
  async saveRejon(rejonData: any, idRejonu?: number) {
    const idAdmina = await this.getCurrentAdminId(); 
    const dataWithAudit = { ...rejonData, updated_by: idAdmina };
    
    if (idRejonu) {
      const { data, error } = await supabase.from("rejony").update(dataWithAudit).eq("id_rejonu", idRejonu).select().single();
      if (error) throw error; 
      if (!data) throw new Error("Brak uprawnień do edycji rejonu (RLS blokuje).");
    } else {
      const { error } = await supabase.from("rejony").insert([dataWithAudit]).select().single();
      if (error) throw error;
    }
  },

  async deleteRejon(idRejonu: number) {
    const { error } = await supabase
      .from("rejony")
      .delete()
      .eq("id_rejonu", idRejonu);

    if (error) throw error;
  },

  // Pobranie szczegółów użytkownika
  async getSzczegolyPracownika(idUzytkownika: number) {
    const { data, error } = await supabase
      .from("uzytkownicy")
      // ZMIANA SKŁADNI NA ODPORNĄ
      .select(
        `
        *,
        rejony!id_rejonu(
          nazwa,
          uzytkownicy!id_koordynatora(imie, nazwisko)
        )
      `,
      )
      .eq("id_uzytkownika", idUzytkownika)
      .single();

    if (error) throw error;
    return data;
  },

  // Pobranie checklist
  async getChecklistyPracownika(idUzytkownika: number) {
    const { data, error } = await supabase
      .from("check_lista")
      .select(
        `
        *,
        punkty_handlu (
          nazwa,
          rejony (nazwa)
        ),
        check_lista_towar (*),
        check_lista_finanse (*),
        check_lista_inwentaryzacja (*, produkty (*))
      `,
      )
      .eq("id_uzytkownika", idUzytkownika)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getGrafikPracownika(idUzytkownika: number) {
    const { data, error } = await supabase
      .from("grafik")
      .select(
        `
        *,
        punkty_handlu(*)
      `,
      )
      .eq("id_uzytkownika", idUzytkownika)
      .order("data", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getZdjeciaDlaChecklisty(idChecklisty: number) {
    const { data, error } = await supabase.storage.from("raporty").list("", {
      search: `${idChecklisty}_`,
    });

    if (error) {
      console.error("Błąd pobierania zdjęć:", error);
      return { kasa: null, sumup: null, stanowisko: null };
    }

    const urls = {
      kasa: null as string | null,
      sumup: null as string | null,
      stanowisko: null as string | null,
    };

    if (data && data.length > 0) {
      for (const plik of data) {
        const publicUrl = supabase.storage
          .from("raporty")
          .getPublicUrl(plik.name).data.publicUrl;
        const nazwa = plik.name.toLowerCase();

        if (nazwa.includes("_kasa")) urls.kasa = publicUrl;
        else if (nazwa.includes("_sumup")) urls.sumup = publicUrl;
        else if (nazwa.includes("_stanowisko")) urls.stanowisko = publicUrl;
      }
    }

    return urls;
  },

  async getDzisiejszyHandelAdmin() {
    const dzis = new Date().toLocaleDateString("en-CA");

    const { data: grafiki, error: errG } = await supabase
      .from("grafik")
      // ZMIANA SKŁADNI NA ODPORNĄ
      .select(
        `
        *,
        uzytkownicy (
          imie, 
          nazwisko, 
          id_rejonu, 
          rejony:rejony!id_rejonu(nazwa)
        ),
        punkty_handlu (nazwa, lokalizacja)
      `,
      )
      .eq("data", dzis)
      .not("id_lokalizacji", "is", null);

    if (errG) throw errG;

    const { data: raporty, error: errR } = await supabase
      .from("check_lista")
      .select(
        `
        *,
        check_lista_towar (*),
        check_lista_finanse (*),
        check_lista_inwentaryzacja (*, produkty (*))
      `,
      )
      .eq("data", dzis);

    if (errR) throw errR;

    const zlaczoneDane = grafiki.map((g: any) => {
      const raport = raporty?.find(
        (r: any) =>
          r.id_uzytkownika === g.id_uzytkownika &&
          r.id_lokalizacji === g.id_lokalizacji,
      );
      return { ...g, raport_z_dnia: raport || null };
    });

    return zlaczoneDane;
  },

  async getNajnowszaChecklistaDlaPunktu(idLokalizacji: number) {
    const { data, error } = await supabase
      .from("check_lista")
      // ZMIANA SKŁADNI NA ODPORNĄ (!id_uzytkownika)
      .select(
        `
        *,
        check_lista_towar (*),
        check_lista_finanse (*),
        check_lista_inwentaryzacja (*, produkty (*)),
        uzytkownicy!id_uzytkownika (imie, nazwisko) 
      `,
      )
      .eq("id_lokalizacji", idLokalizacji)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};