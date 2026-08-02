import React, { useEffect, useState, useMemo } from 'react';
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

  // POBIERANIE DANYCH STARTOWYCH
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

  // POBIERANIE ŚWIEŻYCH DANYCH Z BAZY PO ZAMKNIĘCIU
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

  // OPTYMALIZACJA: useMemo zapobiega przeliczaniu widoku przy każdym naciśnięciu klawisza w formularzu
  const displayData = useMemo(() => {
    const source = daneRaportu || bezpiecznaChecklista || {};

    const rawFinanse = source.check_lista_finanse;
    const dbFinanse = Array.isArray(rawFinanse) ? (rawFinanse[0] || {}) : (rawFinanse || {});

    const rawTowar = source.check_lista_towar;
    const dbTowar = Array.isArray(rawTowar) ? (rawTowar[0] || {}) : (rawTowar || {});

    return {
      sztukKasa: dbFinanse.ilosc_sztuk_wbita_na_kase ?? '0',
      brutto: dbFinanse.kwota_brutto_wbita_na_kase ?? '0',
      sumup: dbFinanse.przychod_sumup ?? '0',
      gotowka: dbFinanse.przychod_gotowka_pln ?? '0',
      waluty: dbFinanse.przychod_inne_waluty ?? '0',
      koszty: dbFinanse.koszta_inne ?? '0',
      kosztyOpis: dbFinanse.koszta_inne_opis ?? '',
      
      km: dbFinanse.kilometry ?? '0',
      trasa: dbFinanse.trasa ?? '-',
      nocleg: dbFinanse.nocleg ?? '0',
      godzHandlowe: source.ilosc_godzin_handlowych ?? '0',
      godzInne: source.ilosc_godzin_niehandlowych ?? '0',
      numerKasy: source.numer_kasy_fiskalnej ?? '#1',
      uwagi: source.uwagi ?? '',

      ranoPuste: dbTowar.rano_butelki_puste ?? '0',
      ranoProtocudak: dbTowar.rano_butelki_protocudak ?? '0',
      ranoPelne: dbTowar.rano_butelki_pelne ?? '0',
      ranoSloiki: dbTowar.rano_sloiki_pelne ?? '0',

      dostawa: dbTowar.dostawa ?? '0',
      probki: dbTowar.ilosc_probki ?? '0',
      stluczki: dbTowar.ilosc_prezenty_stluczki ?? '0',
      butelkiSprzedane: dbTowar.butelki_sprzedane ?? '0',
      sloikiSprzedane: dbTowar.sloiki_sprzedane ?? '0',

      wieczorPuste: dbTowar.wieczor_butelki_puste ?? '0',
      wieczorProtocudak: dbTowar.wieczor_butelki_protocudak ?? '0',
      wieczorPelne: dbTowar.wieczor_butelki_pelne ?? '0',
      wieczorSloiki: dbTowar.wieczor_sloiki_pelne ?? '0'
    };
  }, [daneRaportu, bezpiecznaChecklista]);

  return (
    <div className="max-w-lg mx-auto mb-12 px-4 sm:px-6 w-full">

      {/* WIDOK 1: DASHBOARD (Podsumowanie dnia) */}
      {!widokFormularza && !successMsg && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>

          <div className="p-6 sm:p-8">
            <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider mb-6 text-center">Twój dzień handlowy</h2>

            {loadingDzis ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-slate-400">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-sm font-bold animate-pulse">Sprawdzam kalendarz...</p>
              </div>
            ) : (
              <div className="text-center space-y-5">
                {czyFormatkaWygenerowana ? (
                  <>
                    <div className="text-6xl mb-3 transform hover:scale-110 transition-transform duration-300">✅</div>
                    <h3 className="text-2xl font-black text-emerald-600 tracking-tight">Dobra robota!</h3>
                    <p className="text-sm text-slate-500 font-medium px-2">Raport z lokalizacji <strong className="text-slate-800">{nazwaStoiska}</strong> został pomyślnie wysłany i zamknięty.</p>
                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <button onClick={() => setWidokFormularza(true)} className="text-sm font-bold text-slate-400 hover:text-indigo-600 underline cursor-pointer transition-colors">
                        Podejrzyj przesłane dane
                      </button>
                    </div>
                  </>
                ) : bezpiecznaChecklista ? (
                  <>
                    <div className="text-6xl mb-3 transform hover:scale-110 transition-transform duration-300">🌙</div>
                    <h3 className="text-2xl font-black text-indigo-600 tracking-tight">Jesteś w trakcie pracy</h3>
                    <p className="text-sm text-slate-500 font-medium">Twoje stanowisko: <strong className="text-slate-800">{nazwaStoiska}</strong></p>

                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <button onClick={() => setWidokFormularza(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1 cursor-pointer">
                        Przejdź do raportu wieczornego
                      </button>
                    </div>
                  </>
                ) : dzisiejszyHandel ? (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 text-amber-500 rounded-full text-4xl mb-3 shadow-inner ring-4 ring-amber-100">🏕️</div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jesteś przypisany na stoisko:</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 leading-tight tracking-tight">{dzisiejszyHandel.punkty_handlu?.nazwa}</h3>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <button onClick={() => setWidokFormularza(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-amber-200 transition transform hover:-translate-y-1 cursor-pointer text-sm sm:text-base">
                        🚀 Otwórz stoisko
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-5 transform hover:scale-110 transition-transform duration-300">🏖️</div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Masz dzisiaj wolne!</h3>
                    <p className="text-sm sm:text-base text-slate-500 font-medium px-4 leading-relaxed">
                      Nie jesteś dzisiaj przypisany do żadnego punktu handlowego. Odpoczywaj i ładuj baterie! 🔋
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WIDOK 2: FORMULARZ LUB PODGLĄD DANYCH */}
      {(widokFormularza || successMsg) && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp relative">

          {/* NAKŁADKA ŁADOWANIA (OVERLAY) */}
          {sending && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md animate-fadeIn">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin mb-6 shadow-sm"></div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest animate-pulse">Przetwarzanie</h3>
              <p className="text-xs font-bold text-slate-500 mt-2 text-center px-6 leading-relaxed">
                Wysyłanie formularza i zdjęć do chmury.<br/>Może to potrwać kilka sekund...
              </p>
            </div>
          )}

          {successMsg ? (
            <div className="p-8 sm:p-10 text-center space-y-5 animate-fadeIn bg-white">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-emerald-100">🎉</div>
              <p className="text-base font-bold text-slate-800 px-2">{successMsg}</p>

              {successMsg.includes('wieczór') || successMsg.includes('rozliczone') ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 text-sm font-bold mt-4 shadow-sm">
                  ✔️ Zamknięto pomyślnie handel.
                </div>
              ) : (
                <button onClick={() => setSuccessMsg('')} className="w-full bg-slate-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg text-sm hover:bg-slate-900 transition transform hover:-translate-y-0.5 cursor-pointer mt-4">
                  📊 Przejdź do formularza wieczornego
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Pływający Nagłówek Powrotny */}
              <div className="p-4 sm:p-5 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">📍</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lokalizacja</p>
                    <p className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{nazwaStoiska}</p>
                  </div>
                </div>
                <button onClick={() => setWidokFormularza(false)} className="text-[10px] sm:text-xs font-black uppercase text-slate-600 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer">
                  Wróć
                </button>
              </div>

              {/* WIDOK ZAMKNIĘTEGO RAPORTU (PODGLĄD KART) */}
              {czyFormatkaWygenerowana ? (
                <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50/50 scroll-smooth">

                  <div className="p-4 bg-slate-200/40 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-lg">🔒</span>
                      <span className="uppercase tracking-wider font-black text-sm">Dzień Rozliczony</span>
                    </div>
                    <span className="font-medium text-slate-500 leading-relaxed">Raport został pomyślnie zapisany w systemie. Poniżej znajduje się pełny podgląd zadeklarowanych danych z tego dnia.</span>
                  </div>

                  <div className="space-y-4">
                    {/* 1. SEKCJA PORANNA */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">☀️ Otwarcie (Poranek)</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Puste weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoPuste}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Protocudaki weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoProtocudak}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Pełne weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoPelne}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Słoiki weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoSloiki}</strong></div>
                      </div>
                    </div>

                    {/* 2. RUCH TOWAROWY I SPRZEDAŻ */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">📦 Ruch Towarowy i Sprzedaż</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Sprzedane butelki:</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.butelkiSprzedane}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Sprzedane słoiki:</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.sloikiSprzedane}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Dostawa w trakcie dnia:</span> <strong className="font-mono text-indigo-600">+{displayData.dostawa}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Próbki / Stłuczki:</span> <strong className="font-mono text-rose-500">{displayData.probki} / {displayData.stluczki}</strong></div>
                      </div>
                    </div>

                    {/* 3. INWENTARYZACJA WIECZORNA */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">🔒 Stan Wieczorny (Zamknięcie)</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Pełne na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorPelne}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Słoiki na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorSloiki}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Puste na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorPuste}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Protocudaki na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorProtocudak}</strong></div>
                      </div>
                    </div>

                    {/* 4. FINANSE */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">💰 Finanse i Kasa</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Numer kasy:</span> <strong className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{displayData.numerKasy}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Sztuki na kasie:</span> <strong className="font-mono text-slate-800">{displayData.sztukKasa}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Kwota brutto:</span> <strong className="font-mono text-slate-800 text-sm">{displayData.brutto} zł</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Terminal SumUp:</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.sumup} zł</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Gotówka (fizycznie):</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.gotowka} zł</strong></div>
                        {Number(displayData.waluty) > 0 && <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Inne waluty:</span> <strong className="font-mono text-amber-500">{displayData.waluty}</strong></div>}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Koszty operacyjne:</span> <strong className="font-mono text-rose-600">{displayData.koszty} zł</strong></div>
                        {displayData.kosztyOpis && <div className="text-[11px] text-slate-400 italic text-right bg-slate-50 p-2 rounded-lg mt-1">Opis: {displayData.kosztyOpis}</div>}
                      </div>
                    </div>

                    {/* 5. LOGISTYKA I CZAS */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">🚗 Logistyka i Czas</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Godz. (Handlowe / Inne):</span> <strong className="font-mono text-slate-800">{displayData.godzHandlowe}h / {displayData.godzInne}h</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Trasa / Nocleg:</span> <strong className="font-mono text-slate-800">{displayData.trasa} / {displayData.nocleg} PLN</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Przejechane kilometry:</span> <strong className="font-mono text-slate-800">{displayData.km} km</strong></div>
                      </div>
                      
                      {displayData.uwagi && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-2">Wysłane uwagi dodatkowe:</span>
                          <div className="bg-amber-50 text-amber-800 p-3 rounded-xl italic text-xs leading-relaxed border border-amber-100">
                            "{displayData.uwagi}"
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                /* ----------------------------------------------------------- */
                /* FORMULARZE W TRAKCIE EDYCJI (PRZED WYSŁANIEM)               */
                /* ----------------------------------------------------------- */
                <>
                  {!bezpiecznaChecklista ? (
                    
                    /* --- FORMULARZ PORANNY --- */
                    <form onSubmit={handlePoranekSubmit} className="p-4 sm:p-6 space-y-5">
                      <div className="bg-amber-500 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-5 sm:p-6 text-white text-center mb-2 shadow-sm">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight drop-shadow-sm">Raport Poranny ☀️</h1>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'Puste butelki (wejście)', key: 'butelkiPuste' },
                          { label: 'Protocudak (wejście)', key: 'butelkiProtocudak' },
                          { label: 'Pełne butelki (towar)', key: 'butelkiPelne' },
                          { label: 'Pełne słoiki (towar)', key: 'sloikiPelne' }
                        ].map(f => (
                          <div key={f.key} className="flex items-center justify-between bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 transition-colors focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400">
                            <span className="text-xs sm:text-sm font-semibold text-slate-700">{f.label}</span>
                            <input
                              type="number"
                              min="0"
                              required
                              placeholder="0"
                              value={(poranek as any)[f.key]}
                              onChange={(e) => setPoranek({ ...poranek, [f.key]: e.target.value })}
                              className="w-20 sm:w-24 text-center font-extrabold text-sm px-3 py-2 border rounded-xl bg-white outline-none text-slate-800 border-slate-200 focus:border-amber-500 transition-colors shadow-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center ${fileStanowisko ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-amber-400'}`}>
                          <span className="text-3xl mb-2 drop-shadow-sm">{fileStanowisko ? '✅' : '📸'}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-700">{fileStanowisko ? fileStanowisko.name : 'Zrób zdjęcie stanowiska (Otwarcie)'}</span>
                          <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileStanowisko(e.target.files?.[0] || null)} className="hidden" />
                        </label>
                      </div>

                      <button type="submit" disabled={sending} className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed">
                        {sending ? 'WYSYŁANIE...' : '☀️ Otwórz stoisko'}
                      </button>
                    </form>
                  ) : (
                    
                    /* --- FORMULARZ WIECZORNY --- */
                    <form onSubmit={handleWieczorSubmit} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto scroll-smooth">
                      <div className="bg-indigo-600 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-4 sm:p-5 text-white text-center shadow-sm">
                        <h1 className="text-xl font-bold tracking-tight drop-shadow-sm">Raport Wieczorny 🌙</h1>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[11px] sm:text-xs font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">⏱️ 1. Czas i fiskalizacja</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 gap-1.5 focus-within:border-indigo-400">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase">Godz. handlowe</span>
                            <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyHandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyHandlowe: e.target.value })} className="w-full text-center border p-2 rounded-xl bg-white font-extrabold text-sm border-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 gap-1.5 focus-within:border-indigo-400">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase">Godz. inne</span>
                            <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyNiehandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyNiehandlowe: e.target.value })} className="w-full text-center border p-2 rounded-xl bg-white font-extrabold text-sm border-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                          <div className="col-span-2 flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 focus-within:border-indigo-400">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-800">Numer kasy z raportu</span>
                            <input type="text" placeholder="#1" required value={ogolne.numerKasy} onChange={(e) => setOgolne({ ...ogolne, numerKasy: e.target.value })} className="w-24 sm:w-32 text-center border p-2 rounded-xl bg-white font-black text-sm sm:text-base border-slate-200 outline-none focus:border-indigo-500 uppercase transition-colors shadow-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <h3 className="text-[11px] sm:text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">📦 2. Ruch towarowy w dniu</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { label: 'Dostawa towaru', key: 'dostawa', bold: false },
                            { label: 'Wydane Próbki', key: 'probki', bold: false },
                            { label: 'Prezenty / Stłuczki', key: 'stluczki', bold: false },
                            { label: 'Sprzedano Butelek', key: 'butelkiSprzedane', bold: true },
                            { label: 'Sprzedano Słoików', key: 'sloikiSprzedane', bold: true },
                          ].map(t => (
                            <div key={t.key} className="flex justify-between items-center bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 focus-within:border-indigo-400">
                              <span className={`text-xs ${t.bold ? 'font-extrabold text-slate-800' : 'font-medium text-slate-600'}`}>{t.label}</span>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-16 sm:w-20 text-center border p-2 rounded-xl bg-white font-extrabold text-sm border-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-sm" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <h3 className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">🔒 3. Inwentaryzacja Wieczorna</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { label: 'Zostało Pustych', key: 'koncowePuste' },
                            { label: 'Zostało Protocudaków', key: 'koncoweProtocudak' },
                            { label: 'Zostało Pełnych', key: 'koncowePelne' },
                            { label: 'Zostało Słoików', key: 'koncoweSloiki' }
                          ].map(t => (
                            <div key={t.key} className="flex justify-between items-center bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 focus-within:border-indigo-400">
                              <span className="text-xs sm:text-sm text-slate-700 font-semibold">{t.label}</span>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-16 sm:w-20 text-center border p-2 rounded-xl bg-white font-extrabold text-sm border-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-sm" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MATEMATYKA - SPRAWDZENIE */}
                      <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200">
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mb-3">Weryfikacja systemowa</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Oczekiwane Pełne</p>
                            <p className="font-mono text-xl sm:text-2xl text-slate-700 mt-1 mb-1 font-black">{oczekiwaneButelkiPelne}</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${roznicaButelki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaButelki > 0 ? `+${roznicaButelki}` : roznicaButelki}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Oczekiwane Słoiki</p>
                            <p className="font-mono text-xl sm:text-2xl text-slate-700 mt-1 mb-1 font-black">{oczekiwaneSloikiPelne}</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${roznicaSloiki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaSloiki > 0 ? `+${roznicaSloiki}` : roznicaSloiki}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <h3 className="text-[11px] sm:text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">💰 4. Finanse & Logistyka</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Sztuk:</span>
                            <input type="number" min="0" required placeholder="Wbite na kasę" value={finanse.sztukKasa} onChange={(e) => setFinanse({ ...finanse, sztukKasa: e.target.value })} className="w-full p-3 pl-14 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Brutto:</span>
                            <input type="number" min="0" step="0.01" required placeholder="Kwota z kasy" value={finanse.kwotaBrutto} onChange={(e) => setFinanse({ ...finanse, kwotaBrutto: e.target.value })} className="w-full p-3 pl-14 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-black">GOT:</span>
                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={finanse.gotowka} onChange={(e) => setFinanse({ ...finanse, gotowka: e.target.value })} className="w-full p-3 pl-12 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-emerald-500 transition-colors shadow-sm" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-indigo-500 font-black">KARTA:</span>
                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={finanse.sumup} onChange={(e) => setFinanse({ ...finanse, sumup: e.target.value })} className="w-full p-3 pl-14 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                          <div className="relative col-span-2 sm:col-span-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-black">INNE:</span>
                            <input type="number" min="0" step="0.01" required placeholder="Waluty" value={finanse.waluty} onChange={(e) => setFinanse({ ...finanse, waluty: e.target.value })} className="w-full p-3 pl-12 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-amber-500 transition-colors shadow-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" required placeholder="Trasa (np. z Hotelu na Rynek)" value={finanse.trasa} onChange={(e) => setFinanse({ ...finanse, trasa: e.target.value })} className="w-full p-3 border rounded-xl text-sm bg-white border-slate-200 outline-none font-medium focus:border-indigo-500 transition-colors shadow-sm" />
                          <div className="relative">
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">km</span>
                            <input type="number" min="0" step="0.1" required placeholder="Przejechane kilometry" value={finanse.kilometry} onChange={(e) => setFinanse({ ...finanse, kilometry: e.target.value })} className="w-full p-3 pr-10 border rounded-xl text-sm bg-white border-slate-200 outline-none font-medium focus:border-indigo-500 transition-colors shadow-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 bg-rose-50/30 p-3 rounded-2xl border border-rose-100">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-rose-500 font-bold">Wydatki:</span>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={finanse.kosztaInne} onChange={(e) => setFinanse({ ...finanse, kosztaInne: e.target.value })} className="w-full p-3 pl-16 border rounded-xl text-sm bg-white border-slate-200 outline-none font-bold focus:border-rose-400 transition-colors shadow-sm text-rose-600" />
                          </div>
                          <input type="text" placeholder="Opis wydatków (np. woda, parking)" value={finanse.kosztaInneOpis} onChange={(e) => setFinanse({ ...finanse, kosztaInneOpis: e.target.value })} className="w-full p-3 border rounded-xl text-sm bg-white border-slate-200 outline-none font-medium focus:border-rose-400 transition-colors shadow-sm" />
                        </div>

                        <textarea placeholder="Dodatkowe uwagi dla administratora..." value={ogolne.uwagi} onChange={(e) => setOgolne({ ...ogolne, uwagi: e.target.value })} className="w-full px-4 py-3 border rounded-2xl text-sm bg-white min-h-[80px] border-slate-200 outline-none font-medium focus:border-indigo-500 transition-colors shadow-sm" />
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <h3 className="text-[11px] sm:text-xs font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">📸 5. Wymagane Zdjęcia</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all duration-200 cursor-pointer text-center ${fileKasa ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}>
                            <span className="text-3xl mb-2 drop-shadow-sm">{fileKasa ? '✅' : '🧾'}</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">Raport kasy z drukarki</span>
                            <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileKasa(e.target.files?.[0] || null)} className="hidden" />
                          </label>

                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all duration-200 cursor-pointer text-center ${fileSumUp ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}>
                            <span className="text-3xl mb-2 drop-shadow-sm">{fileSumUp ? '✅' : '💳'}</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">Podsumowanie SumUp</span>
                            <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileSumUp(e.target.files?.[0] || null)} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed mt-4">
                        {sending ? 'WYSYŁANIE...' : 'Zamknij Dzień 🌙'}
                      </button>
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