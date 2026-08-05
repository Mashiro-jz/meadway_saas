import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { checklistaService } from '../services/checklistaService';

export default function TabHandel(props: any) {
  const {
    stoiska, selectedStoisko, handleStoiskoChange, activeChecklista, successMsg, setSuccessMsg,
    poranek, setPoranek, wieczor, setWieczor, ogolne, setOgolne, finanse, setFinanse,
    fileStanowisko, setFileStanowisko, fileKasa, setFileKasa, fileSumUp, setFileSumUp,
    handlePoranekSubmit, handleWieczorSubmit, sending,
    oczekiwaneButelkiPelne, roznicaButelki, oczekiwaneSloikiPelne, roznicaSloiki,
    produkty, inwentaryzacjaRano, setInwentaryzacjaRano, inwentaryzacjaWieczor, setInwentaryzacjaWieczor,
    ranoSumaButelki, ranoSumaSloiki, wieczorSumaButelki, wieczorSumaSloiki
  } = props;

  const [dzisiejszyHandel, setDzisiejszyHandel] = useState<any>(null);
  const [loadingDzis, setLoadingDzis] = useState(true);
  const [widokFormularza, setWidokFormularza] = useState(false);

  const [wlasnaChecklista, setWlasnaChecklista] = useState<any>(null);
  const bezpiecznaChecklista = activeChecklista || wlasnaChecklista;
  const czyFormatkaWygenerowana = !!bezpiecznaChecklista && !!bezpiecznaChecklista.data_wygenerowania_formatki;

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

  const displayData = useMemo(() => {
    const source = daneRaportu || bezpiecznaChecklista || {};

    const rawFinanse = source.check_lista_finanse;
    const dbFinanse = Array.isArray(rawFinanse) ? (rawFinanse[0] || {}) : (rawFinanse || {});

    const rawTowar = source.check_lista_towar;
    const dbTowar = Array.isArray(rawTowar) ? (rawTowar[0] || {}) : (rawTowar || {});
    
    const dbInwentaryzacja = source.check_lista_inwentaryzacja || [];

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
      wieczorSloiki: dbTowar.wieczor_sloiki_pelne ?? '0',

      stanySmakow: dbInwentaryzacja
    };
  }, [daneRaportu, bezpiecznaChecklista]);

  return (
    <div className="max-w-lg mx-auto mb-12 px-4 w-full">

      {/* WIDOK 1: DASHBOARD */}
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

      {/* WIDOK 2: FORMULARZE / PODGLĄD */}
      {(widokFormularza || successMsg) && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp relative">

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
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 text-sm font-bold mt-4 shadow-sm">✔️ Zamknięto pomyślnie handel.</div>
              ) : (
                <button onClick={() => setSuccessMsg('')} className="w-full bg-slate-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg text-sm hover:bg-slate-900 transition transform hover:-translate-y-0.5 cursor-pointer mt-4">
                  📊 Przejdź do formularza wieczornego
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Pasek Powrotu */}
              <div className="p-4 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lokalizacja</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[200px]">{nazwaStoiska}</p>
                  </div>
                </div>
                <button onClick={() => setWidokFormularza(false)} className="text-[10px] font-black uppercase text-slate-600 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl hover:bg-slate-100 transition active:scale-95 cursor-pointer">
                  Wróć
                </button>
              </div>

              {czyFormatkaWygenerowana ? (
                /* WIDOK ZAMKNIĘTEGO RAPORTU */
                <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50/50 scroll-smooth">
                  <div className="p-4 bg-slate-200/40 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-600"><span className="text-lg">🔒</span><span className="uppercase tracking-wider font-black text-sm">Dzień Rozliczony</span></div>
                    <span className="font-medium text-slate-500 leading-relaxed">Raport został pomyślnie zapisany w systemie. Poniżej znajduje się pełny podgląd danych z tego dnia.</span>
                  </div>

                  <div className="space-y-4">
                    {/* Sekcje Podglądu zostawiam w formie lekkich gridów dla czytelności (one są tylko do odczytu) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">☀️ Otwarcie (Poranek)</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Suma Pełnych:</span> <strong className="font-mono text-slate-800">{displayData.ranoPelne}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Suma Słoików:</span> <strong className="font-mono text-slate-800">{displayData.ranoSloiki}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Puste weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoPuste}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Protocudaki weszły:</span> <strong className="font-mono text-slate-800">{displayData.ranoProtocudak}</strong></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">📦 Sprzedaż i Towar</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Sprzedane butelki:</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.butelkiSprzedane}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Sprzedane słoiki:</span> <strong className="font-mono text-emerald-600 text-sm">{displayData.sloikiSprzedane}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Dostawa w dniu:</span> <strong className="font-mono text-indigo-600">+{displayData.dostawa}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Próbki / Stłuczki:</span> <strong className="font-mono text-rose-500">{displayData.probki} / {displayData.stluczki}</strong></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">🔒 Stan Wieczorny (Zamknięcie)</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Suma Pełnych:</span> <strong className="font-mono text-slate-800">{displayData.wieczorPelne}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Suma Słoików:</span> <strong className="font-mono text-slate-800">{displayData.wieczorSloiki}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Puste na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorPuste}</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Protocudaki na koniec:</span> <strong className="font-mono text-slate-800">{displayData.wieczorProtocudak}</strong></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">💰 Finanse i Logistyka</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Numer kasy:</span> <strong className="font-mono bg-slate-100 px-2 py-0.5 rounded">{displayData.numerKasy}</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Brutto / SumUp / Gotówka:</span> <strong className="font-mono text-slate-800 text-sm">{displayData.brutto} / {displayData.sumup} / {displayData.gotowka} zł</strong></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Koszty operacyjne:</span> <strong className="font-mono text-rose-600">{displayData.koszty} zł</strong></div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50"><span className="text-slate-500 font-medium">Trasa / Nocleg:</span> <strong className="font-mono">{displayData.trasa} / {displayData.nocleg} PLN</strong></div>
                      </div>
                      {displayData.uwagi && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-2">Uwagi z raportu:</span>
                          <div className="bg-amber-50 text-amber-800 p-3 rounded-xl italic text-xs leading-relaxed border border-amber-100">"{displayData.uwagi}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!bezpiecznaChecklista ? (
                    /* ----------------------------------------------------------- */
                    /* FORMULARZ PORANNY - W 100% RESPONSYWNY Z ETYKIETAMI         */
                    /* ----------------------------------------------------------- */
                    <form onSubmit={handlePoranekSubmit} className="p-4 sm:p-6 space-y-6">
                      <div className="bg-amber-500 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-5 sm:p-6 text-white text-center shadow-sm">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight drop-shadow-sm">Raport Poranny ☀️</h1>
                      </div>
                      
                      {/* SEKCJA DYNAMICZNYCH SMAKÓW */}
                      <div>
                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">🍯 1. Stan towaru (Pełne Miodki)</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {produkty.map((p: any) => (
                            <div key={p.id_produktu} className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 shadow-sm transition-all">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 truncate">
                                {p.nazwa}
                              </label>
                              <input
                                type="number" min="0" placeholder="0" required
                                value={inwentaryzacjaRano[p.id_produktu] || ""}
                                onChange={(e) => setInwentaryzacjaRano({ ...inwentaryzacjaRano, [p.id_produktu]: e.target.value })}
                                className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                              />
                            </div>
                          ))}
                        </div>

                        {/* SUMATOR */}
                        <div className="flex justify-between items-center bg-amber-50 p-3 rounded-2xl border border-amber-200 mt-4 shadow-inner">
                          <div className="text-center w-full border-r border-amber-200/50">
                            <span className="block text-[9px] font-black text-amber-600 uppercase mb-1">Suma Butelek</span>
                            <span className="text-xl font-black text-amber-900">{ranoSumaButelki}</span>
                          </div>
                          <div className="text-center w-full">
                            <span className="block text-[9px] font-black text-amber-600 uppercase mb-1">Suma Słoików</span>
                            <span className="text-xl font-black text-amber-900">{ranoSumaSloiki}</span>
                          </div>
                        </div>
                      </div>

                      {/* PUSTE I PROTOCUDAKI */}
                      <div className="pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">📦 2. Puste i Protocudaki</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Puste (szt)', key: 'butelkiPuste' },
                            { label: 'Protocudaki (szt)', key: 'butelkiProtocudak' },
                          ].map(f => (
                            <div key={f.key} className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-amber-400 shadow-sm transition-all">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{f.label}</label>
                              <input
                                type="number" min="0" required placeholder="0"
                                value={(poranek as any)[f.key]}
                                onChange={(e) => setPoranek({ ...poranek, [f.key]: e.target.value })}
                                className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ZDJĘCIE */}
                      <div className="pt-2 border-t border-slate-100">
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
                    
                    /* ----------------------------------------------------------- */
                    /* FORMULARZ WIECZORNY     */
                    /* ----------------------------------------------------------- */
                    <form onSubmit={handleWieczorSubmit} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto scroll-smooth">
                      <div className="bg-indigo-600 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-4 sm:p-5 text-white text-center shadow-sm">
                        <h1 className="text-xl font-bold tracking-tight drop-shadow-sm">Raport Wieczorny 🌙</h1>
                      </div>

                      {/* 1. Czas i fiskalizacja */}
                      <div>
                        <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">⏱️ 1. Czas i fiskalizacja</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Godz. handlowe</label>
                            <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyHandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyHandlowe: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Godz. inne</label>
                            <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyNiehandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyNiehandlowe: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                          <div className="col-span-2 flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Numer Kasy Fiskalnej</label>
                            <input type="text" placeholder="#1" required value={ogolne.numerKasy} onChange={(e) => setOgolne({ ...ogolne, numerKasy: e.target.value })} className="w-full text-center sm:text-left bg-white border border-slate-200 p-2.5 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-500 uppercase transition-colors" />
                          </div>
                        </div>
                      </div>

                      {/* 2. Ruch towarowy */}
                      <div className="border-t border-slate-100 pt-5">
                        <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">📦 2. Ruch towarowy w dniu</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Dostawa towaru', key: 'dostawa' },
                            { label: 'Wydane Próbki', key: 'probki' },
                            { label: 'Prezenty / Stłuczki', key: 'stluczki' },
                            { label: 'Sprzedano Butelek', key: 'butelkiSprzedane' },
                            { label: 'Sprzedano Słoików', key: 'sloikiSprzedane' },
                          ].map((t, i) => (
                            <div key={t.key} className={`flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{t.label}</label>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Inwentaryzacja dynamiczna */}
                      <div className="border-t border-slate-100 pt-5">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">🔒 3. Inwentaryzacja Wieczorna</h3>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner mb-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Stany Pełne (Pozostałe smaki na koniec)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {produkty.map((p: any) => (
                              <div key={p.id_produktu} className="flex flex-col bg-white p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 shadow-sm transition-all">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 truncate">
                                  {p.nazwa}
                                </label>
                                <input
                                  type="number" min="0" placeholder="0" required
                                  value={inwentaryzacjaWieczor[p.id_produktu] || ""}
                                  onChange={(e) => setInwentaryzacjaWieczor({ ...inwentaryzacjaWieczor, [p.id_produktu]: e.target.value })}
                                  className="w-full text-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 mt-4">
                            <div className="text-center w-full border-r border-indigo-200/50">
                              <span className="block text-[9px] font-black text-indigo-500 uppercase mb-1">Suma Butelek</span>
                              <span className="text-xl font-black text-indigo-900">{wieczorSumaButelki}</span>
                            </div>
                            <div className="text-center w-full">
                              <span className="block text-[9px] font-black text-indigo-500 uppercase mb-1">Suma Słoików</span>
                              <span className="text-xl font-black text-indigo-900">{wieczorSumaSloiki}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {[
                            { label: 'Zostało Pustych', key: 'koncowePuste' },
                            { label: 'Zostało Protocudaków', key: 'koncoweProtocudak' },
                          ].map(t => (
                            <div key={t.key} className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{t.label}</label>
                              <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MATEMATYKA - SPRAWDZENIE */}
                      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 shadow-inner">
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mb-4">Weryfikacja systemowa</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Oczekiwane Butelek</p>
                            <p className="font-mono text-3xl text-slate-700 mt-2 mb-2 font-black">{oczekiwaneButelkiPelne}</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${roznicaButelki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaButelki > 0 ? `+${roznicaButelki}` : roznicaButelki}
                            </span>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Oczekiwane Słoików</p>
                            <p className="font-mono text-3xl text-slate-700 mt-2 mb-2 font-black">{oczekiwaneSloikiPelne}</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${roznicaSloiki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Różnica: {roznicaSloiki > 0 ? `+${roznicaSloiki}` : roznicaSloiki}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Finanse & Logistyka */}
                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">💰 4. Finanse & Logistyka</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Sztuk (Z Kasy)</label>
                            <input type="number" min="0" required placeholder="0" value={finanse.sztukKasa} onChange={(e) => setFinanse({ ...finanse, sztukKasa: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Brutto (Z Kasy) zł</label>
                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={finanse.kwotaBrutto} onChange={(e) => setFinanse({ ...finanse, kwotaBrutto: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-emerald-50 p-3 rounded-2xl border border-emerald-100 focus-within:border-emerald-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">Gotówka (Fizycznie) zł</label>
                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={finanse.gotowka} onChange={(e) => setFinanse({ ...finanse, gotowka: e.target.value })} className="w-full text-center bg-white border border-emerald-200 p-2.5 rounded-xl font-bold text-emerald-800 outline-none focus:border-emerald-500 transition-colors" />
                          </div>
                          <div className="flex flex-col bg-indigo-50 p-3 rounded-2xl border border-indigo-100 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-2">Karta (SumUp) zł</label>
                            <input type="number" min="0" step="0.01" required placeholder="0.00" value={finanse.sumup} onChange={(e) => setFinanse({ ...finanse, sumup: e.target.value })} className="w-full text-center bg-white border border-indigo-200 p-2.5 rounded-xl font-bold text-indigo-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                          <div className="col-span-2 flex flex-col bg-amber-50 p-3 rounded-2xl border border-amber-100 focus-within:border-amber-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">Inne Waluty (Niestandardowe)</label>
                            <input type="number" min="0" step="0.01" required placeholder="Wartość przeliczona / waluta" value={finanse.waluty} onChange={(e) => setFinanse({ ...finanse, waluty: e.target.value })} className="w-full text-center sm:text-left bg-white border border-amber-200 p-2.5 rounded-xl font-bold text-amber-800 outline-none focus:border-amber-500 transition-colors" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Trasa Logistyczna</label>
                            <input type="text" required placeholder="Skąd dokąd" value={finanse.trasa} onChange={(e) => setFinanse({ ...finanse, trasa: e.target.value })} className="w-full text-center sm:text-left bg-white border border-slate-200 p-2.5 rounded-xl font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                          <div className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-400 shadow-sm transition-all">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Przejechane Kilometry</label>
                            <input type="number" min="0" step="0.1" required placeholder="0.0" value={finanse.kilometry} onChange={(e) => setFinanse({ ...finanse, kilometry: e.target.value })} className="w-full text-center bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-rose-50/50 p-4 rounded-3xl border border-rose-100 shadow-inner">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-2 pl-1">Suma Kosztów Operacyjnych</label>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={finanse.kosztaInne} onChange={(e) => setFinanse({ ...finanse, kosztaInne: e.target.value })} className="w-full text-center bg-white border border-rose-200 p-2.5 rounded-xl font-bold text-rose-700 outline-none focus:border-rose-400 transition-colors shadow-sm" />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-2 pl-1">Opis kosztów</label>
                            <input type="text" placeholder="np. woda 5zł, parking 20zł" value={finanse.kosztaInneOpis} onChange={(e) => setFinanse({ ...finanse, kosztaInneOpis: e.target.value })} className="w-full text-center sm:text-left bg-white border border-rose-200 p-2.5 rounded-xl font-medium text-slate-800 outline-none focus:border-rose-400 transition-colors shadow-sm" />
                          </div>
                        </div>

                        <div className="flex flex-col pt-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 pl-1">Uwagi dodatkowe do raportu</label>
                          <textarea placeholder="Wpisz tutaj wszelkie niestandardowe zdarzenia z tego dnia..." value={ogolne.uwagi} onChange={(e) => setOgolne({ ...ogolne, uwagi: e.target.value })} className="w-full px-4 py-3 border rounded-2xl text-sm bg-slate-50 min-h-[100px] border-slate-200 outline-none font-medium focus:border-indigo-400 focus:bg-white transition-colors shadow-sm" />
                        </div>
                      </div>

                      {/* ZDJĘCIA */}
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">📸 5. Wymagane Zdjęcia</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center ${fileKasa ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}>
                            <span className="text-3xl mb-2 drop-shadow-sm">{fileKasa ? '✅' : '🧾'}</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">Raport kasy z drukarki</span>
                            <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileKasa(e.target.files?.[0] || null)} className="hidden" />
                          </label>

                          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center ${fileSumUp ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}>
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