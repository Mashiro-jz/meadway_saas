import { supabase } from "../../lib/supabase";
import {
  PoranekState,
  WieczorState,
  OgolneState,
  FinanseState,
} from "../types/checklista";

export const checklistaService = {
  // Pobieranie profilu pracownika
  async getProfil(email: string) {
    const { data, error } = await supabase
      .from("uzytkownicy")
      .select(
        `
        *,
        rejony!uzytkownicy_id_rejonu_fkey (
          nazwa
        )
      `,
      )
      .eq("email", email)
      .single();

    if (error) throw error;
    return data;
  },

  // Pobieranie dostępnych stoisk
  async getStoiska() {
    const { data, error } = await supabase
      .from("punkty_handlu")
      .select("*")
      .order("nazwa", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Pobieranie aktywnych produktów (smaków)
  async getProdukty() {
    const { data, error } = await supabase
      .from("produkty")
      .select("*")
      .order("id_produktu", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTodayChecklists(idUzytkownika: number, dzis: string) {
    const { data, error } = await supabase
      .from("check_lista")
      .select(
        "*, check_lista_towar(*), check_lista_finanse(*), check_lista_inwentaryzacja(*)",
      )
      .eq("id_uzytkownika", idUzytkownika)
      .eq("data", dzis)
      .order("id_checklisty", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCompletedChecklists(idUzytkownika: number) {
    const { data, error } = await supabase
      .from("check_lista")
      .select(
        "*, punkty_handlu(*), check_lista_towar(*), check_lista_finanse(*), check_lista_inwentaryzacja(*)",
      )
      .eq("id_uzytkownika", idUzytkownika)
      .not("data_wygenerowania_formatki", "is", null)
      .order("data", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadFoto(idChecklisty: number, typZdjecia: string, file: File) {
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${idChecklisty}_${typZdjecia}.${extension}`;

    const { data, error } = await supabase.storage
      .from("raporty")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;
    return data.path;
  },

  async zapiszPoranek(
    idUzytkownika: number,
    idLokalizacji: number,
    dzis: string,
    poranek: PoranekState,
    inwentaryzacjaRano: { id_produktu: number; ilosc_rano: number }[]
  ) {
    const { data: nowaChecklista, error: errC } = await supabase
      .from("check_lista")
      .insert([
        {
          id_uzytkownika: idUzytkownika,
          id_lokalizacji: idLokalizacji,
          data: dzis,
          ilosc_godzin_handlowych: 0,
          ilosc_godzin_niehandlowych: 0,
          numer_kasy_fiskalnej: "",
          updated_by: idUzytkownika // <--- ZMIANA: Audyt
        },
      ])
      .select()
      .single();

    if (errC || !nowaChecklista)
      throw new Error(errC?.message || "Nie udało się założyć checklisty");

    const idC = nowaChecklista.id_checklisty;

    // Przygotowanie danych do inwentaryzacji (ustawiamy id_checklisty)
    const inwentaryzacjaDoBazy = inwentaryzacjaRano.map(item => ({
      id_checklisty: idC,
      id_produktu: item.id_produktu,
      ilosc_rano: item.ilosc_rano,
      ilosc_wieczor: 0
    }));

    // Zapisywanie starych tabel oraz nowej tabeli ze smakami
    const [errT, errF, errI] = await Promise.all([
      supabase.from("check_lista_towar").insert([
        {
          id_checklisty: idC,
          rano_butelki_puste: parseInt(poranek.butelkiPuste || "0", 10),
          rano_butelki_protocudak: parseInt(
            poranek.butelkiProtocudak || "0",
            10,
          ),
          rano_butelki_pelne: parseInt(poranek.butelkiPelne || "0", 10),
          rano_sloiki_pelne: parseInt(poranek.sloikiPelne || "0", 10),
        },
      ]),
      supabase.from("check_lista_finanse").insert([
        {
          id_checklisty: idC,
          ilosc_sztuk_wbita_na_kase: 0,
          kwota_brutto_wbita_na_kase: 0,
          przychod_gotowka_pln: 0,
          przychod_sumup: 0,
          przychod_inne_waluty: 0,
          trasa: "",
          kilometry: 0,
          nocleg: 0,
          koszta_inne: 0,
          koszta_inne_opis: "",
        },
      ]),
      // Wykonujemy wstawienie tylko wtedy, gdy są jakieś smaki
      inwentaryzacjaDoBazy.length > 0 
        ? supabase.from("check_lista_inwentaryzacja").insert(inwentaryzacjaDoBazy)
        : Promise.resolve({ error: null })
    ]);

    if (errT.error) throw errT.error;
    if (errF.error) throw errF.error;
    if (errI.error) throw errI.error;

    return nowaChecklista;
  },

  async zapiszWieczor(
    idChecklisty: number,
    ogolne: OgolneState,
    wieczor: WieczorState,
    finanse: FinanseState,
    inwentaryzacjaWieczor: { id_produktu: number; ilosc_wieczor: number }[],
    idUzytkownika: number // <--- ZMIANA: Audyt
  ) {
    
    // Tworzymy promisy do zaktualizowania wieczornych stanów dla każdego ze smaków.
    const updateInwentaryzacjiPromisy = inwentaryzacjaWieczor.map(item => 
      supabase
        .from("check_lista_inwentaryzacja")
        .update({ ilosc_wieczor: item.ilosc_wieczor })
        .eq("id_checklisty", idChecklisty)
        .eq("id_produktu", item.id_produktu)
    );

    const [errC, errT, errF, ...errInwentaryzacja] = await Promise.all([
      supabase
        .from("check_lista")
        .update({
          ilosc_godzin_handlowych: parseFloat(ogolne.godzinyHandlowe || "0"),
          ilosc_godzin_niehandlowych: parseFloat(
            ogolne.godzinyNiehandlowe || "0",
          ),
          numer_kasy_fiskalnej: ogolne.numerKasy,
          data_wygenerowania_formatki: new Date().toISOString(),
          uwagi: ogolne.uwagi,
          updated_by: idUzytkownika // <--- ZMIANA: Audyt
        })
        .eq("id_checklisty", idChecklisty),

      supabase
        .from("check_lista_towar")
        .update({
          dostawa: parseInt(wieczor.dostawa || "0", 10),
          ilosc_probki: parseInt(wieczor.probki || "0", 10),
          ilosc_prezenty_stluczki: parseInt(wieczor.stluczki || "0", 10),
          butelki_sprzedane: parseInt(wieczor.butelkiSprzedane || "0", 10),
          sloiki_sprzedane: parseInt(wieczor.sloikiSprzedane || "0", 10),
          wieczor_butelki_puste: parseInt(wieczor.koncowePuste || "0", 10),
          wieczor_butelki_protocudaki: parseInt(
            wieczor.koncoweProtocudak || "0",
            10,
          ),
          wieczor_butelki_pelne: parseInt(wieczor.koncowePelne || "0", 10),
          wieczor_sloiki_pelne: parseInt(wieczor.koncoweSloiki || "0", 10),
        })
        .eq("id_checklisty", idChecklisty),

      supabase
        .from("check_lista_finanse")
        .update({
          ilosc_sztuk_wbita_na_kase: parseInt(finanse.sztukKasa || "0", 10),
          kwota_brutto_wbita_na_kase: parseFloat(finanse.kwotaBrutto || "0"),
          przychod_gotowka_pln: parseFloat(finanse.gotowka || "0"),
          przychod_sumup: parseFloat(finanse.sumup || "0"),
          przychod_inne_waluty: parseFloat(finanse.waluty || "0"),
          trasa: finanse.trasa,
          kilometry: parseFloat(finanse.kilometry || "0"),
          nocleg: parseFloat(finanse.nocleg || "0"),
          koszta_inne: parseFloat(finanse.kosztaInne || "0"),
          koszta_inne_opis: finanse.kosztaInneOpis || "",
        })
        .eq("id_checklisty", idChecklisty),
        
      ...updateInwentaryzacjiPromisy
    ]);

    if (errC.error) throw errC.error;
    if (errT.error) throw errT.error;
    if (errF.error) throw errF.error;
    
    // Szukamy czy aktualizacja jakiegokolwiek smaku wyrzuciła błąd
    const bladSmaku = errInwentaryzacja.find(err => err.error);
    if (bladSmaku) throw bladSmaku.error;
  },

  async getGrafikMiesiaca(idUzytkownika: number, rok: number, miesiac: number) {
    const startData = `${rok}-${String(miesiac).padStart(2, "0")}-01`;
    const ostatniDzien = new Date(rok, miesiac, 0).getDate();
    const koniecData = `${rok}-${String(miesiac).padStart(2, "0")}-${String(ostatniDzien).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("grafik")
      .select("*, punkty_handlu(*)")
      .eq("id_uzytkownika", idUzytkownika)
      .gte("data", startData)
      .lte("data", koniecData);

    if (error) throw error;
    return data || [];
  },

  async zapiszGrafikHurtowo(
    idUzytkownika: number,
    wpisyDoZapisu: any[],
    datyDoUsuniecia: string[],
  ) {
    if (datyDoUsuniecia.length > 0) {
      const { error: deleteError } = await supabase
        .from("grafik")
        .delete()
        .eq("id_uzytkownika", idUzytkownika)
        .in("data", datyDoUsuniecia);

      if (deleteError) throw deleteError;
    }

    if (wpisyDoZapisu.length > 0) {
      const { error: upsertError } = await supabase
        .from("grafik")
        .upsert(wpisyDoZapisu, { onConflict: "id_uzytkownika,data" });

      if (upsertError) throw upsertError;
    }
    return true;
  },

  async zapiszDostepnosc(
    idUzytkownika: number,
    dataStr: string,
    dostepnosc: string,
  ) {
    if (dostepnosc === "nieznana") {
      const { error } = await supabase
        .from("grafik")
        .delete()
        .eq("id_uzytkownika", idUzytkownika)
        .eq("data", dataStr);

      if (error) throw error;
      return null;
    }

    const { data, error } = await supabase.from("grafik").upsert(
      {
        id_uzytkownika: idUzytkownika,
        data: dataStr,
        dostepnosc: dostepnosc,
      },
      { onConflict: "id_uzytkownika,data" },
    );

    if (error) throw error;
    return data;
  },

  // Pobieranie informacji, czy pracownik ma na dzisiaj zaplanowany wyjazd
  async getDzisiejszyGrafik(idUzytkownika: number) {
    // Generujemy dzisiejszą datę w formacie YYYY-MM-DD
    const dzis = new Date().toLocaleDateString('en-CA'); 

    const { data, error } = await supabase
      .from("grafik")
      .select("*, punkty_handlu(*)")
      .eq("id_uzytkownika", idUzytkownika)
      .eq("data", dzis)
      .maybeSingle(); // maybeSingle nie wyrzuci błędu, jeśli nie ma wpisu (ma wolne)

    if (error) throw error;
    return data;
  },
  
  async getSzczegolyChecklisty(idChecklisty: number) {
    const { data, error } = await supabase
      .from("check_lista")
      .select("*, check_lista_towar(*), check_lista_finanse(*), check_lista_inwentaryzacja(*)")
      .eq("id_checklisty", idChecklisty)
      .single();

    if (error) throw error;
    return data;
  },
};