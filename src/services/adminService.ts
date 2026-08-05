import { supabase } from "../../lib/supabase";

export const adminService = {
  // Pobieranie listy rejonów (potrzebne Adminowi do filtrowania widoku)
  async getRejony() {
    const { data, error } = await supabase
      .from("rejony")
      .select("*")
      .order("nazwa", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Pobieranie listy pracowników podległych pod zalogowanego koordynatora (po rejonie + Europa id: 2)
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

  // Pobieranie nadchodzących jarmarków dla danego rejonu
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

  // Pobieranie dostępności pracowników (z dociągnięciem nazwy rejonu)
  async getDostepnoscLudziNaJarmark(
    rola: string,
    idRejonu: number | null,
    startData: string,
    koniecData: string,
  ) {
    let uzytkownicyQuery = supabase
      .from("uzytkownicy")
      .select(
        "id_uzytkownika, imie, nazwisko, rola, numer_telefonu, id_rejonu, rejony!uzytkownicy_id_rejonu_fkey(nazwa)",
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

  // Zapisanie przypisania pracownika (z flagą 'wymuszone')
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

  // Pobranie wszystkich punktów wraz z nazwą rejonu
  async getAllPunktyHandlu() {
    const { data, error } = await supabase
      .from("punkty_handlu")
      .select("*, rejony!punkty_handlu_id_rejonu_fkey(nazwa)")
      .order("nazwa", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Zapisanie lub edycja punktu handlu
  async savePunktHandlu(punktData: any, idLokalizacji?: number) {
    if (idLokalizacji) {
      const { data, error } = await supabase
        .from("punkty_handlu")
        .update(punktData)
        .eq("id_lokalizacji", idLokalizacji)
        .select()
        .single();

      if (error) throw error;
      if (!data)
        throw new Error(
          "Baza odrzuciła zapis (prawdopodobnie brak polisy RLS UPDATE).",
        );
    } else {
      const { data, error } = await supabase
        .from("punkty_handlu")
        .insert([punktData])
        .select()
        .single();

      if (error) throw error;
    }
  },

  // Usunięcie punktu handlu
  async deletePunktHandlu(idLokalizacji: number) {
    const { error } = await supabase
      .from("punkty_handlu")
      .delete()
      .eq("id_lokalizacji", idLokalizacji);
    if (error) throw error;
  },

  // ==========================================
  // ZARZĄDZANIE PRACOWNIKAMI (CRUD)
  // ==========================================

  // Pobranie wszystkich użytkowników dla panelu Admina
  async getWszyscyPracownicy() {
    const { data, error } = await supabase
      .from("uzytkownicy")
      .select("*, rejony!uzytkownicy_id_rejonu_fkey(nazwa)")
      .order("nazwisko", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Zapis pracownika (z rzucaniem błędu przy blokadzie RLS)
  async savePracownik(pracownikData: any, idUzytkownika?: number) {
    if (idUzytkownika) {
      const { data, error } = await supabase
        .from("uzytkownicy")
        .update(pracownikData)
        .eq("id_uzytkownika", idUzytkownika)
        .select()
        .single();

      if (error) throw error;
      if (!data)
        throw new Error("Brak uprawnień do edycji pracownika (RLS blokuje).");
    } else {
      const { data, error } = await supabase
        .from("uzytkownicy")
        .insert([pracownikData])
        .select()
        .single();

      if (error) throw error;
    }
  },

  // Usuwanie pracownika
  async deletePracownik(idUzytkownika: number) {
    const { error } = await supabase
      .from("uzytkownicy")
      .delete()
      .eq("id_uzytkownika", idUzytkownika);

    if (error) throw error;
  },

  // ==========================================
  // ZARZĄDZANIE REJONAMI (CRUD)
  // ==========================================

  // Pobranie listy rejonów wraz z imieniem i nazwiskiem koordynatora
  async getRejonyZKoordynatorami() {
    const { data, error } = await supabase
      .from("rejony")
      .select("*, uzytkownicy!rejony_id_koordynatora_fkey(imie, nazwisko)")
      .order("nazwa", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Pobranie listy użytkowników, którzy mogą zostać przypisani jako szefowie rejonu
  async getDostepniKoordynatorzy() {
    const { data, error } = await supabase
      .from("uzytkownicy")
      .select("id_uzytkownika, imie, nazwisko, rola")
      .in("rola", ["koordynator", "admin"])
      .order("nazwisko", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Zapis rejonu (wymusza odpowiedź przez .single() aby złapać blokady RLS)
  async saveRejon(rejonData: any, idRejonu?: number) {
    if (idRejonu) {
      const { data, error } = await supabase
        .from("rejony")
        .update(rejonData)
        .eq("id_rejonu", idRejonu)
        .select()
        .single();

      if (error) throw error;
      if (!data)
        throw new Error("Brak uprawnień do edycji rejonu (RLS blokuje).");
    } else {
      const { data, error } = await supabase
        .from("rejony")
        .insert([rejonData])
        .select()
        .single();

      if (error) throw error;
    }
  },

  // Usuwanie rejonu
  async deleteRejon(idRejonu: number) {
    const { error } = await supabase
      .from("rejony")
      .delete()
      .eq("id_rejonu", idRejonu);

    if (error) throw error;
  },

  // ==========================================
  // PROFIL PRACOWNIKA (Szczegóły, Checklisty, Grafik)
  // ==========================================

  // 1. Pobranie szczegółów użytkownika wraz z rejonem i koordynatorem
  async getSzczegolyPracownika(idUzytkownika: number) {
    const { data, error } = await supabase
      .from("uzytkownicy")
      .select(
        `
        *,
        rejony!uzytkownicy_id_rejonu_fkey(
          nazwa,
          uzytkownicy!rejony_id_koordynatora_fkey(imie, nazwisko)
        )
      `,
      )
      .eq("id_uzytkownika", idUzytkownika)
      .single();

    if (error) throw error;
    return data;
  },

  // 2. Pobranie wszystkich checklist wykonanych przez tego pracownika
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

  // 3. Pobranie grafiku pracownika (np. od dziś w przód, lub ogólnie)
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

  // 4. Pobranie linków do zdjęć z konkretnej checklisty
  async getZdjeciaDlaChecklisty(idChecklisty: number) {
    const { data, error } = await supabase.storage.from("raporty").list("", {
      search: `${idChecklisty}_`,
    });

    if (error) {
      console.error("Błąd pobierania zdjęć z Supabase:", error);
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

  // POBIERANIE DZISIEJSZEGO HANDLU DLA ADMINISTRATORA
  async getDzisiejszyHandelAdmin() {
    const dzis = new Date().toLocaleDateString("en-CA");

    // 1. Pobieramy cały dzisiejszy grafik z twardym WSKAZANIEM klucza obcego dla rejonów
    const { data: grafiki, error: errG } = await supabase
      .from("grafik")
      .select(
        `
        *,
        uzytkownicy (
          imie, 
          nazwisko, 
          id_rejonu, 
          rejony:rejony!uzytkownicy_id_rejonu_fkey(nazwa)
        ),
        punkty_handlu (nazwa, lokalizacja)
      `,
      )
      .eq("data", dzis)
      .not("id_lokalizacji", "is", null);

    if (errG) {
      console.error("Błąd pobierania grafiku (Supabase):", errG);
      throw errG;
    }

    // 2. Pobieramy wszystkie dzisiejsze checklisty ze wszystkimi szczegółami z uwzględnieniem inwentaryzacji
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

    if (errR) {
      console.error("Błąd pobierania raportów (Supabase):", errR);
      throw errR;
    }

    // 3. Łączymy dane
    const zlaczoneDane = grafiki.map((g: any) => {
      const raport = raporty?.find(
        (r: any) =>
          r.id_uzytkownika === g.id_uzytkownika &&
          r.id_lokalizacji === g.id_lokalizacji,
      );

      return {
        ...g,
        raport_z_dnia: raport || null,
      };
    });

    return zlaczoneDane;
  },
  // Pobieranie najnowszego raportu dla danego punktu handlowego
  async getNajnowszaChecklistaDlaPunktu(idLokalizacji: number) {
    const { data, error } = await supabase
      .from("check_lista")
      .select(
        `
        *,
        check_lista_towar (*),
        check_lista_finanse (*),
        check_lista_inwentaryzacja (*, produkty (*)),
        uzytkownicy (imie, nazwisko)
      `,
      )
      .eq("id_lokalizacji", idLokalizacji)
      // Sortujemy najpierw po dacie, potem po czasie utworzenia
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
