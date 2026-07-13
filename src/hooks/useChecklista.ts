'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { checklistaService } from '../services/checklistaService';
import { PoranekState, WieczorState, OgolneState, FinanseState, StatusyState } from '../types/checklista';

export function useChecklista(router: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [stoiska, setStoiska] = useState<any[]>([]);
  const [selectedStoisko, setSelectedStoisko] = useState('');
  const [activeChecklista, setActiveChecklista] = useState<any>(null);

  // Fizyczne pliki przechwytywane z aparatu fotograficznego smartfona
  const [fileStanowisko, setFileStanowisko] = useState<File | null>(null);
  const [fileKasa, setFileKasa] = useState<File | null>(null);
  const [fileSumUp, setFileSumUp] = useState<File | null>(null);

  const [poranek, setPoranek] = useState<PoranekState>({ butelkiPuste: '0', butelkiProtocudak: '0', butelkiPelne: '0', sloikiPelne: '0' });
  const [wieczor, setWieczor] = useState<WieczorState>({ dostawa: '0', probki: '0', stluczki: '0', butelkiSprzedane: '0', sloikiSprzedane: '0', koncowePuste: '0', koncoweProtocudak: '0', koncowePelne: '0', koncoweSloiki: '0' });
  const [ogolne, setOgolne] = useState<OgolneState>({ godzinyHandlowe: '', godzinyNiehandlowe: '', numerKasy: '', uwagi: '' });
  const [finanse, setFinanse] = useState<FinanseState>({ sztukKasa: '', kwotaBrutto: '', gotowka: '', sumup: '', waluty: '', trasa: '', kilometry: '', nocleg: '', kosztaInne: '' });
  const [statusy, setStatusy] = useState<StatusyState>({ pracaPoza: false, otwartoZgodnie: false, zdjecieStan: false, zdjecieDo: false, raportyNaKasie: false, dyskKasa: false, dyskSumUp: false });

  // Uproszczona, bezpieczna walidacja towaru (według Twoich ostatnich wytycznych)
  const tDataZazwyczaj = activeChecklista?.check_lista_towar?.[0] || activeChecklista?.check_lista_towar;
  
  const ranoButelki = Number(tDataZazwyczaj?.rano_butelki_pelne || 0);
  const oczekiwaneButelkiPelne = ranoButelki + Number(wieczor.dostawa || 0) - Number(wieczor.probki || 0) - Number(wieczor.stluczki || 0) - Number(wieczor.butelkiSprzedane || 0);
  const roznicaButelki = Number(wieczor.koncowePelne || 0) - oczekiwaneButelkiPelne;

  const ranoSloiki = Number(tDataZazwyczaj?.rano_sloiki_pelne || 0);
  const oczekiwaneSloikiPelne = ranoSloiki - Number(wieczor.sloikiSprzedane || 0);
  const roznicaSloiki = Number(wieczor.koncoweSloiki || 0) - oczekiwaneSloikiPelne;

  const syncChecklistState = async (currentUser: any, stoiskoId?: string) => {
    if (!currentUser) return;
    try {
      const profil = await checklistaService.getProfil(currentUser.email);
      if (!profil) return;

      const dzis = new Date().toLocaleDateString('sv-SE');
      const checklisty = await checklistaService.getTodayChecklists(profil.id_uzytkownika, dzis);

      if (checklisty.length > 0) {
        const uncompleted = checklisty.find(c => !c.data_wyslania_do_koordynatora);
        if (uncompleted) {
          setSelectedStoisko(uncompleted.id_lokalizacji.toString());
          setActiveChecklista(uncompleted);

          const s = uncompleted.check_lista_status?.[0] || uncompleted.check_lista_status;
          if (s) {
            setStatusy({
              pracaPoza: s.czy_mozliwa_praca_poza_godzinami,
              otwartoZgodnie: s.czy_otwarto_zgodnie_ze_standardami,
              zdjecieStan: s.czy_zrobiles_zdjecie_stanowiska,
              zdjecieDo: s.czy_wrzuciles_zdjecie_do_folderu,
              raportyNaKasie: s.czy_zrobiles_raporty_na_kasie,
              dyskKasa: s.czy_wrzuciles_na_dysk_zdjecie_z_kasy,
              dyskSumUp: s.czy_wrzuciles_na_dysk_zdjecie_z_sumup
            });
          }
          return;
        }
      }
      const targetId = stoiskoId || selectedStoisko;
      setActiveChecklista(checklisty.find(c => c.id_lokalizacji === parseInt(targetId)) || null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      try {
        const stoiskaData = await checklistaService.getStoiska();
        if (stoiskaData.length > 0) {
          setStoiska(stoiskaData);
          const defaultId = stoiskaData[0].id_lokalizacji.toString();
          setSelectedStoisko(defaultId);
          await syncChecklistState(user, defaultId);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleStoiskoChange = async (id: string) => {
    setSelectedStoisko(id);
    setLoading(true);
    await syncChecklistState(user, id);
    setLoading(false);
  };

  const handlePoranekSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileStanowisko) {
      alert('⚠️ Blokada: Musisz wykonać zdjęcie stanowiska przed otwarciem jarmarku!');
      return;
    }
    setSending(true);
    try {
      const profil = await checklistaService.getProfil(user.email);
      if (!profil) throw new Error('Profil pracownika nie istnieje.');
      const dzis = new Date().toLocaleDateString('sv-SE');

      const poranneStatusy = { ...statusy, zdjecieStan: true, zdjecieDo: true };
      const nowaChecklista = await checklistaService.zapiszPoranek(profil.id_uzytkownika, parseInt(selectedStoisko), dzis, poranek, poranneStatusy);
      
      // Przesłanie zdjęcia porannego
      await checklistaService.uploadFoto(nowaChecklista.id_checklisty, 'stanowisko', fileStanowisko);

      setSuccessMsg('Poranek rozliczony, zdjęcie zapisane w Supabase! ☀️');
      await syncChecklistState(user, selectedStoisko);
    } catch (err: any) { alert(err.message); } finally { setSending(false); }
  };

  const handleWieczorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileKasa || !fileSumUp) {
      alert('⚠️ Blokada: Musisz dodać zdjęcie raportu kasowego oraz zrzut ekranu SumUp!');
      return;
    }
    setSending(true);

    if (roznicaButelki !== 0 || roznicaSloiki !== 0) {
      let alertMsg = '⚠️ ROZBIEŻNOŚĆ TOWAROWA:\n\n';
      if (roznicaButelki !== 0) alertMsg += `• Butelki pełne: Różnica ${roznicaButelki} szt.\n`;
      if (roznicaSloiki !== 0) alertMsg += `• Słoiki pełne: Różnica ${roznicaSloiki} szt.\n`;
      alertMsg += '\nCzy na pewno chcesz wysłać raport końcowy do koordynatora?';
      if (!window.confirm(alertMsg)) { setSending(false); return; }
    }

    try {
      const idC = activeChecklista.id_checklisty;

      // Przesyłanie plików wieczornych
      await checklistaService.uploadFoto(idC, 'kasa', fileKasa);
      await checklistaService.uploadFoto(idC, 'sumup', fileSumUp);

      const wieczorneStatusy = { ...statusy, dyskKasa: true, dyskSumUp: true };
      await checklistaService.zapiszWieczor(idC, ogolne, wieczor, finanse, wieczorneStatusy);

      setSuccessMsg('Dzień jarmarku zamknięty. Wszystkie 3 zdjęcia zabezpieczone w chmurze! 🍯🌙');
      await syncChecklistState(user, selectedStoisko);
    } catch (err: any) { alert(err.message); } finally { setSending(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return {
    user, loading, sending, successMsg, setSuccessMsg, stoiska, selectedStoisko, activeChecklista,
    poranek, setPoranek, wieczor, setWieczor, ogolne, setOgolne, finanse, setFinanse, statusy, setStatusy,
    handleStoiskoChange, handlePoranekSubmit, handleWieczorSubmit, handleLogout,
    roznicaButelki, roznicaSloiki, oczekiwaneButelkiPelne, oczekiwaneSloikiPelne,
    setFileStanowisko, setFileKasa, setFileSumUp, fileStanowisko, fileKasa, fileSumUp
  };
}