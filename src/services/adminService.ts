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
    // ZMIANA: Dodano "rejony!uzytkownicy_id_rejonu_fkey(nazwa)" aby pobrać nazwę rejonu
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
      // Przy usuwaniu przypisania czyścimy też ewentualną flagę "wymuszone"
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

    // ZMIANA: Jeśli admin wymusza, zmieniamy status pracownika na "dostepny" i zapisujemy flagę
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
};
