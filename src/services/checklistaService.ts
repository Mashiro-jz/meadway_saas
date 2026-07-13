import { supabase } from '../../lib/supabase';
import { PoranekState, WieczorState, OgolneState, FinanseState, StatusyState } from '../types/checklista';

export const checklistaService = {
  async getProfil(email: string) {
    const { data, error } = await supabase.from('uzytkownicy').select('id_uzytkownika').eq('email', email).single();
    if (error) throw error;
    return data;
  },

  async getStoiska() {
    const { data, error } = await supabase.from('punkty_handlu').select('id_lokalizacji, nazwa, lokalizacja');
    if (error) throw error;
    return data || [];
  },

  async getTodayChecklists(idUzytkownika: number, dzis: string) {
    const { data, error } = await supabase
      .from('check_lista')
      .select('*, check_lista_towar(*), check_lista_finanse(*), check_lista_status(*)')
      .eq('id_uzytkownika', idUzytkownika)
      .eq('data', dzis)
      .order('id_checklisty', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Przesyłanie zdjęcia do dedykowanego magazynu Supabase Storage
  async uploadFoto(idChecklisty: number, typZdjecia: string, file: File) {
    const extension = file.name.split('.').pop() || 'jpg';
    const filePath = `${idChecklisty}_${typZdjecia}.${extension}`;

    const { data, error } = await supabase.storage
      .from('raporty')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return data.path;
  },

  async zapiszPoranek(idUzytkownika: number, idLokalizacji: number, dzis: string, poranek: PoranekState, statusy: StatusyState) {
    const { data: nowaChecklista, error: errC } = await supabase.from('check_lista').insert([{
      id_uzytkownika: idUzytkownika, id_lokalizacji: idLokalizacji, data: dzis,
      ilosc_godzin_handlowych: 0, ilosc_godzin_niehandlowych: 0, numer_kasy_fiskalnej: '',
    }]).select().single();

    if (errC || !nowaChecklista) throw new Error(errC?.message || 'Nie udało się założyć checklisty');
    const idC = nowaChecklista.id_checklisty;

    const { error: errT } = await supabase.from('check_lista_towar').insert([{
      id_checklisty: idC,
      rano_butelki_puste: parseInt(poranek.butelkiPuste),
      rano_butelki_protocudak: parseInt(poranek.butelkiProtocudak),
      rano_butelki_pelne: parseInt(poranek.butelkiPelne),
      rano_sloiki_pelne: parseInt(poranek.sloikiPelne),
    }]);
    if (errT) throw errT;

    const { error: errS } = await supabase.from('check_lista_status').insert([{
      id_checklisty: idC,
      czy_mozliwa_praca_poza_godzinami: statusy.pracaPoza,
      czy_otwarto_zgodnie_ze_standardami: statusy.otwartoZgodnie,
      czy_zrobiles_zdjecie_stanowiska: statusy.zdjecieStan,
      czy_wrzuciles_zdjecie_do_folderu: statusy.zdjecieDo,
      czy_zrobiles_raporty_na_kasie: false,
      czy_wrzuciles_na_dysk_zdjecie_z_kasy: false,
      czy_wrzuciles_na_dysk_zdjecie_z_sumup: false
    }]);
    if (errS) throw errS;

    const { error: errF } = await supabase.from('check_lista_finanse').insert([{
      id_checklisty: idC,
      ilosc_sztuk_wbita_na_kase: 0, kwota_brutto_wbita_na_kase: 0,
      przychod_gotowka_pln: 0, przychod_sumup: 0, przychod_inne_waluty: 0,
      trasa: '', kilometry: 0, nocleg: 0, koszta_inne: 0
    }]);
    if (errF) throw errF;

    return nowaChecklista;
  },

  async zapiszWieczor(idChecklisty: number, ogolne: OgolneState, wieczor: WieczorState, finanse: FinanseState, statusy: StatusyState) {
    const { error: errC } = await supabase.from('check_lista').update({
      ilosc_godzin_handlowych: parseFloat(ogolne.godzinyHandlowe),
      ilosc_godzin_niehandlowych: parseFloat(ogolne.godzinyNiehandlowe),
      numer_kasy_fiskalnej: ogolne.numerKasy,
      data_wyslania_do_koordynatora: new Date().toISOString(),
      uwagi: ogolne.uwagi,
    }).eq('id_checklisty', idChecklisty);
    if (errC) throw errC;

    const { error: errT } = await supabase.from('check_lista_towar').update({
      dostawa: parseInt(wieczor.dostawa),
      ilosc_probki: parseInt(wieczor.probki),
      ilosc_prezenty_stluczki: parseInt(wieczor.stluczki),
      butelki_sprzedane: parseInt(wieczor.butelkiSprzedane),
      sloiki_sprzedane: parseInt(wieczor.sloikiSprzedane),
      wieczor_butelki_puste: parseInt(wieczor.koncowePuste),
      wieczor_butelki_protocudaki: parseInt(wieczor.koncoweProtocudak),
      wieczor_butelki_pelne: parseInt(wieczor.koncowePelne),
      wieczor_sloiki_pelne: parseInt(wieczor.koncoweSloiki)
    }).eq('id_checklisty', idChecklisty);
    if (errT) throw errT;

    const { error: errF } = await supabase.from('check_lista_finanse').update({
      id_checklisty: idChecklisty,
      ilosc_sztuk_wbita_na_kase: parseInt(finanse.sztukKasa),
      kwota_brutto_wbita_na_kase: parseFloat(finanse.kwotaBrutto),
      przychod_gotowka_pln: parseFloat(finanse.gotowka),
      przychod_sumup: parseFloat(finanse.sumup),
      przychod_inne_waluty: parseFloat(finanse.waluty),
      trasa: finanse.trasa,
      kilometry: parseFloat(finanse.kilometry || '0'),
      nocleg: parseFloat(finanse.nocleg || '0'),
      koszta_inne: parseFloat(finanse.kosztaInne || '0')
    }).eq('id_checklisty', idChecklisty);
    if (errF) throw errF;

    const { error: errS } = await supabase.from('check_lista_status').update({
      czy_zrobiles_raporty_na_kasie: statusy.raportyNaKasie,
      czy_wrzuciles_na_dysk_zdjecie_z_kasy: statusy.dyskKasa,
      czy_wrzuciles_na_dysk_zdjecie_z_sumup: statusy.dyskSumUp
    }).eq('id_checklisty', idChecklisty);
    if (errS) throw errS;
  }
};