import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { checklistaService } from '../services/checklistaService';

export default function TabHandel(props: any) {
  const {
    stoiska, selectedStoisko, handleStoiskoChange, activeChecklista, successMsg, setSuccessMsg,
    poranek, setPoranek, wieczor, setWieczor, ogolne, setOgolne, finanse, setFinanse,
    fileStanowisko, setFileStanowisko, fileKasa, setFileKasa, fileSumUp, setFileSumUp,
    handlePoranekSubmit, handleWieczorSubmit, sending,
    oczekiwaneButelkiPelne, roznicaButelki, oczekiwaneSloikiPelne, roznicaSloiki
  } = props;

  const [dzisiejszyHandel, setDzisiejszyHandel] = useState<any>(null);
  const [loadingDzis, setLoadingDzis] = useState(true);
  const [widokFormularza, setWidokFormularza] = useState(false);
  
  // Bezpiecznik
  const [wlasnaChecklista, setWlasnaChecklista] = useState<any>(null);
  const bezpiecznaChecklista = activeChecklista || wlasnaChecklista;
  const czyFormatkaWygenerowana = !!bezpiecznaChecklista && !!bezpiecznaChecklista.data_wygenerowania_formatki;

  // CZYSTA ARCHITEKTURA
  const [daneRaportu, setDaneRaportu] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function start() {
      setLoadingDzis(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email || !isMounted) return;

        const profil = await checklistaService.getProfil(user.email);
        if (!profil || !isMounted) return;

        const dzis = new Date().toLocaleDateString('en-CA');
        
        const dzisiejszeRaporty = await checklistaService.getTodayChecklists(profil.id_uzytkownika, dzis);
        const grafik = await checklistaService.getDzisiejszyGrafik(profil.id_uzytkownika);
        
        if (grafik && grafik.id_lokalizacji && isMounted) {
          setDzisiejszyHandel(grafik);
          handleStoiskoChange(String(grafik.id_lokalizacji)); 

          const znaleziona = dzisiejszeRaporty.find((c: any) => String(c.id_lokalizacji) === String(grafik.id_lokalizacji));
          if (znaleziona) {
            setWlasnaChecklista(znaleziona);
          }
        }
      } catch (error) {
        console.error("Błąd ładowania danych startowych:", error);
      } finally {
        if (isMounted) setLoadingDzis(false);
      }
    }
    
    start();
    return () => { isMounted = false; };
  }, []);

  // POBIERANIE ŚWIEŻYCH DANYCH - używa teraz bezpiecznaChecklista!
  useEffect(() => {
    async function fetchFreshData() {
      if (bezpiecznaChecklista?.id_checklisty && czyFormatkaWygenerowana) {
        try {
          const freshData = await checklistaService.getSzczegolyChecklisty(bezpiecznaChecklista.id_checklisty);
          setDaneRaportu(freshData);
        } catch (error) {
          console.error('Błąd pobierania odświeżonych danych z bazy:', error);
        }
      }
    }
    fetchFreshData();
  }, [bezpiecznaChecklista?.id_checklisty, czyFormatkaWygenerowana, successMsg]);

  const nazwaStoiska = dzisiejszyHandel?.punkty_handlu?.nazwa 
    || stoiska?.find((s: any) => String(s.id_lokalizacji) === String(bezpiecznaChecklista?.id_lokalizacji))?.nazwa 
    || 'Stoisko handlowe';

  // LOGIKA WYŚWIETLANIA: Bezpieczne pobieranie najświeższych danych
  const getDisplayData = () => {
    const source = daneRaportu || bezpiecznaChecklista || {};

    // ZABEZPIECZENIE: Supabase potrafi zwracać dane jako tablicę [{...}] lub pojedynczy obiekt {...}
    const rawFinanse = source.check_lista_finanse;
    const dbFinanse = Array.isArray(rawFinanse) ? (rawFinanse[0] || {}) : (rawFinanse || {});

    const rawTowar = source.check_lista_towar;
    const dbTowar = Array.isArray(rawTowar) ? (rawTowar[0] || {}) : (rawTowar || {});

    return {
      brutto: dbFinanse.kwota_brutto_wbita_na_kase ?? '0',
      sumup: dbFinanse.przychod_sumup ?? '0',
      gotowka: dbFinanse.przychod_gotowka_pln ?? '0',
      koszty: dbFinanse.koszta_inne ?? '0',
      butelki: dbTowar.butelki_sprzedane ?? '0',
      sloiki: dbTowar.sloiki_sprzedane ?? '0',
      godzHandlowe: source.ilosc_godzin_handlowych ?? '0',
      godzInne: source.ilosc_godzin_niehandlowych ?? '0',
      km: dbFinanse.kilometry ?? '0',
      uwagi: source.uwagi ?? '',
      numerKasy: source.numer_kasy_fiskalnej ?? '#1'
    };
  };

  const displayData = getDisplayData();

  return (
    <div className="max-w-md mx-auto mb-8">
      
      {/* WIDOK 1: DASHBOARD */}
      {!widokFormularza && !successMsg && (
        <div className="bg-white rounded-2xl shadow-lg border p-6 border-slate-200 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 text-center">Twój dzień handlowy</h2>

          {loadingDzis ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold animate-pulse">Sprawdzam kalendarz...</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              
              {czyFormatkaWygenerowana ? (
                <>
                  <div className="text-5xl mb-2">✅</div>
                  <h3 className="text-xl font-black text-emerald-600">Dobra robota!</h3>
                  <p className="text-sm text-slate-500 font-medium">Raport z lokalizacji <strong>{nazwaStoiska}</strong> został pomyślnie wysłany i zamknięty.</p>
                  <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => setWidokFormularza(true)} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer transition">
                      Podejrzyj przesłane dane
                    </button>
                  </div>
                </>
              ) : bezpiecznaChecklista ? (
                <>
                  <div className="text-5xl mb-2">🌙</div>
                  <h3 className="text-xl font-black text-indigo-600">Jesteś w trakcie pracy</h3>
                  <p className="text-sm text-slate-500 font-medium">Twoje stanowisko: <strong className="text-slate-700">{nazwaStoiska}</strong></p>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => setWidokFormularza(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer">
                      Przejdź do raportu wieczornego
                    </button>
                  </div>
                </>
              ) : dzisiejszyHandel ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full text-3xl mb-2 shadow-inner">🏕️</div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jesteś przypisany na stoisko:</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1 leading-tight">{dzisiejszyHandel.punkty_handlu?.nazwa}</h3>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => setWidokFormularza(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer">
                      🚀 Otwórz stoisko
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🏖️</div>
                  <h3 className="text-xl font-black text-slate-800">Masz dzisiaj wolne!</h3>
                  <p className="text-sm text-slate-500 font-medium px-4">
                    Nie jesteś dzisiaj przypisany do żadnego punktu handlowego. Odpoczywaj i ładuj baterie! 🔋
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* WIDOK 2: FORMULARZ LUB PODGLĄD */}
      {(widokFormularza || successMsg) && (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden border-slate-200 animate-slideUp">
          
          {successMsg ? (
            <div className="p-6 text-center space-y-4 animate-fadeIn bg-white">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">🎉</div>
              <p className="text-sm font-bold text-slate-800 px-2">{successMsg}</p>
              
              {successMsg.includes('wieczór') || successMsg.includes('rozliczone') ? (
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-green-700 text-xs font-bold mt-2">
                  ✔️ Zamknięto pomyślnie handel.
                </div>
              ) : (
                <button onClick={() => setSuccessMsg('')} className="w-full bg-slate-800 text-white font-extrabold py-3 rounded-xl shadow-md text-xs hover:bg-slate-900 transition cursor-pointer">
                  📊 Przejdź do formularza wieczornego
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Nagłówek */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Twoja lokalizacja</p>
                    <p className="text-sm font-bold text-slate-800">{nazwaStoiska}</p>
                  </div>
                </div>
                <button onClick={() => setWidokFormularza(false)} className="text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                  Wróć
                </button>
              </div>

              {/* Widok zamkniętego raportu */}
              {czyFormatkaWygenerowana ? (
                <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50">
                  
                  <div className="p-3 bg-slate-200/50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="text-sm">🔒</span>
                      <span className="uppercase tracking-wider">Dzień Rozliczony</span>
                    </div>
                    <span className="font-medium text-slate-600">Raport został pomyślnie zapisany. Poniżej znajduje się podgląd wprowadzonych danych z dzisiejszego dnia.</span>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Sekcja 1: Finanse */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2 border-b pb-1">💰 Finanse i Kasa</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Kasa (Brutto)</span>
                          <span className="font-black text-slate-800">{displayData.brutto} zł</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Terminal SumUp</span>
                          <span className="font-black text-slate-800">{displayData.sumup} zł</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Gotówka</span>
                          <span className="font-black text-slate-800">{displayData.gotowka} zł</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Inne Koszty</span>
                          <span className="font-black text-rose-600">{displayData.koszty} zł</span>
                        </div>
                      </div>
                    </div>

                    {/* Sekcja 2: Ruch towarowy */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-2 border-b pb-1">📦 Sprzedany Towar</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                          <span className="block text-[9px] text-emerald-600 uppercase font-bold">Butelki sztuki</span>
                          <span className="font-black text-emerald-700 text-base">{displayData.butelki}</span>
                        </div>
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                          <span className="block text-[9px] text-emerald-600 uppercase font-bold">Słoiki sztuki</span>
                          <span className="font-black text-emerald-700 text-base">{displayData.sloiki}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sekcja 3: Dane ogólne */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">⏱️ Informacje Dodatkowe</h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Godziny handlowe:</span>
                          <span className="font-bold text-slate-800">{displayData.godzHandlowe}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Godziny inne:</span>
                          <span className="font-bold text-slate-800">{displayData.godzInne}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Trasa (km):</span>
                          <span className="font-bold text-slate-800">{displayData.km} km</span>
                        </div>
                        {displayData.uwagi && (
                          <div className="mt-2 pt-2 border-t border-dashed">
                            <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Uwagi z raportu:</span>
                            <span className="text-slate-600 italic">"{displayData.uwagi}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* Formularze w trakcie edycji */
                <>
                  {!bezpiecznaChecklista ? (
                    /* Raport Poranny */
                    <form onSubmit={handlePoranekSubmit} className="p-5 space-y-4">
                      <div className="bg-amber-500 -mx-5 -mt-5 p-4 text-white text-center mb-2">
                        <h1 className="text-xl font-bold tracking-tight">Raport Poranny ☀️</h1>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Stan butelek puste', key: 'butelkiPuste' },
                          { label: 'Stan wejściowy protocudak', key: 'butelkiProtocudak' },
                          { label: 'Stan towaru butelek pełnych', key: 'butelkiPelne' },
                          { label: 'Stan słoików z miodem przed', key: 'sloikiPelne' }
                        ].map(f => (
                          <div key={f.key} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                            <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                            <input 
                              type="number" 
                              min="0" 
                              required 
                              placeholder="0" 
                              value={(poranek as any)[f.key]} 
                              onChange={(e) => setPoranek({ ...poranek, [f.key]: e.target.value })} 
                              className="w-16 text-center font-extrabold px-2 py-1.5 border rounded-lg bg-white outline-none text-slate-800 border-slate-300 focus:border-amber-500 transition-colors"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition cursor-pointer text-center ${fileStanowisko ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                          <span className="text-xl mb-1">{fileStanowisko ? '✅' : '📸'}</span>
                          <span className="text-xs font-bold text-slate-700">{fileStanowisko ? fileStanowisko.name : 'Dodaj zdjęcie stanowiska (Otwarcie)'}</span>
                          <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileStanowisko(e.target.files?.[0] || null)} className="hidden" />
                        </label>
                      </div>

                      <button type="submit" disabled={sending} className="w-full mt-2 bg-amber-500 text-white font-black py-3 rounded-xl shadow-md hover:bg-amber-600 transition active:scale-95 cursor-pointer text-sm disabled:opacity-50">
                        ☀️ Otwórz stoisko
                      </button>
                    </form>
                  ) : (
                    /* Raport Wieczorny */
                    <form onSubmit={handleWieczorSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                      <div className="bg-indigo-600 -mx-5 -mt-5 p-3 text-white text-center mb-1">
                        <h1 className="text-lg font-bold tracking-tight">Raport Wieczorny 🌙</h1>
                      </div>
                      
                      <div className="pt-1">
                        <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">⏱️ 1. Czas pracy i fiskalizacja</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-xs font-medium text-slate-600">Godz. handlowe</span>
                            <input 
                              type="number" 
                              placeholder="0" 
                              min="0" 
                              step="0.5" 
                              required 
                              value={ogolne.godzinyHandlowe} 
                              onChange={(e) => setOgolne({ ...ogolne, godzinyHandlowe: e.target.value })} 
                              className="w-14 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" 
                            />
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-xs font-medium text-slate-600">Godz. inne</span>
                            <input 
                              type="number" 
                              placeholder="0" 
                              min="0" 
                              step="0.5" 
                              required 
                              value={ogolne.godzinyNiehandlowe} 
                              onChange={(e) => setOgolne({ ...ogolne, godzinyNiehandlowe: e.target.value })} 
                              className="w-14 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" 
                            />
                          </div>
                          <div className="col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-xs font-extrabold text-slate-800">Numer kasy</span>
                            <input 
                              type="text" 
                              placeholder="#1" 
                              required 
                              value={ogolne.numerKasy} 
                              onChange={(e) => setOgolne({ ...ogolne, numerKasy: e.target.value })} 
                              className="w-28 text-center border p-1 rounded-lg bg-white font-black text-xs border-slate-300 outline-none focus:border-indigo-500 uppercase transition-colors" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 mt-3">
                        <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">📦 2. Ruch towarowy</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Dostawa', key: 'dostawa', bold: false },
                            { label: 'Próbki', key: 'probki', bold: false },
                            { label: 'Prezenty / Stłuczki', key: 'stluczki', bold: false },
                            { label: 'Sprzedane (Kasa)', key: 'butelkiSprzedane', bold: true },
                            { label: 'Sprzedane Słoiki', key: 'sloikiSprzedane', bold: true },
                          ].map(t => (
                            <div key={t.key} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <span className={`text-xs ${t.bold ? 'font-extrabold text-slate-800' : 'font-medium text-slate-600'}`}>{t.label}</span>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-12 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">🔒 3. Inwentaryzacja</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Puste koniec', key: 'koncowePuste' },
                            { label: 'Protocudak koniec', key: 'koncoweProtocudak' },
                            { label: 'Pełne koniec', key: 'koncowePelne' },
                            { label: 'Słoiki koniec', key: 'koncoweSloiki' }
                          ].map(t => (
                            <div key={t.key} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <span className="text-xs text-slate-700 font-semibold">{t.label}</span>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-12 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-xs">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Butelki pełne</p>
                            <p className="font-mono text-slate-500 mt-0.5">Oczekiwane: {oczekiwaneButelkiPelne}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-black ${roznicaButelki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaButelki > 0 ? `+${roznicaButelki}` : roznicaButelki}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-xs">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Słoiki pełne</p>
                            <p className="font-mono text-slate-500 mt-0.5">Oczekiwane: {oczekiwaneSloikiPelne}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-black ${roznicaSloiki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaSloiki > 0 ? `+${roznicaSloiki}` : roznicaSloiki}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                        <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">💰 4. Finanse & Logistyka</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" min="0" required placeholder="Sztuk (Kasa)" value={finanse.sztukKasa} onChange={(e) => setFinanse({ ...finanse, sztukKasa: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                          <input type="number" min="0" step="0.01" required placeholder="Kwota brutto" value={finanse.kwotaBrutto} onChange={(e) => setFinanse({ ...finanse, kwotaBrutto: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input type="number" min="0" step="0.01" required placeholder="Gotówka" value={finanse.gotowka} onChange={(e) => setFinanse({ ...finanse, gotowka: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                          <input type="number" min="0" step="0.01" required placeholder="SumUp" value={finanse.sumup} onChange={(e) => setFinanse({ ...finanse, sumup: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                          <input type="number" min="0" step="0.01" required placeholder="Waluty" value={finanse.waluty} onChange={(e) => setFinanse({ ...finanse, waluty: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" required placeholder="Trasa logistyczna" value={finanse.trasa} onChange={(e) => setFinanse({ ...finanse, trasa: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
                          <input type="number" min="0" required placeholder="Kilometry" value={finanse.kilometry} onChange={(e) => setFinanse({ ...finanse, kilometry: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
                        </div>
                        
                        <div className="grid grid-cols-[1fr_2fr] gap-2">
                          <input type="number" min="0" step="0.01" placeholder="Suma kosztów" value={finanse.kosztaInne} onChange={(e) => setFinanse({ ...finanse, kosztaInne: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
                          <input type="text" placeholder="Opis (np. woda - 20 zł)" value={finanse.kosztaInneOpis} onChange={(e) => setFinanse({ ...finanse, kosztaInneOpis: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
                        </div>

                        <textarea placeholder="Uwagi końcowe do dnia..." value={ogolne.uwagi} onChange={(e) => setOgolne({ ...ogolne, uwagi: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs bg-white min-h-[50px] border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">📸 5. Wymagane Zdjęcia</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-2 transition cursor-pointer text-center ${fileKasa ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                            <span className="text-lg mb-0.5">{fileKasa ? '✅' : '🧾'}</span>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">Raport kasy</span>
                            <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileKasa(e.target.files?.[0] || null)} className="hidden" />
                          </label>

                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-2 transition cursor-pointer text-center ${fileSumUp ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                            <span className="text-lg mb-0.5">{fileSumUp ? '✅' : '💳'}</span>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">Terminal SumUp</span>
                            <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileSumUp(e.target.files?.[0] || null)} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <button type="submit" disabled={sending} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-md hover:bg-indigo-700 transition active:scale-95 cursor-pointer text-sm disabled:opacity-50">Zamknij Dzień 🌙</button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}