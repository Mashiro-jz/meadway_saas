import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService'; 

export default function TabDzisiejszyHandelAdmin() {
  const [daneHandlowe, setDaneHandlowe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [szukanaFraza, setSzukanaFraza] = useState('');
  
  // ZARZĄDZANIE WIDOKIEM
  const [rozwiniecia, setRozwiniecia] = useState<number[]>([]);
  const [trescUwagi, setTrescUwagi] = useState<string | null>(null);

  // ZARZĄDZANIE ZDJĘCIAMI
  const [aktywneZdjecieUrl, setAktywneZdjecieUrl] = useState<string | null>(null);
  
  // Przechowuje pobrane URL zdjęć dla danej checklisty (np. { 35: { kasa: 'url', ... } })
  const [zdjeciaRaportow, setZdjeciaRaportow] = useState<Record<number, any>>({});
  const [ladowanieZdjec, setLadowanieZdjec] = useState<Record<number, boolean>>({});

  // 1. ŁADOWANIE DANYCH GŁÓWNYCH
  useEffect(() => {
    async function fetchDane() {
      try {
        setLoading(true);
        const data = await adminService.getDzisiejszyHandelAdmin();
        setDaneHandlowe(data || []);
      } catch (error) {
        console.error("Błąd ładowania panelu dzisiejszego handlu:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDane();
  }, []);

  // 2. OBSŁUGA ROZWIJANIA I POBIERANIA ZDJĘĆ W TLE
  const toggleRozwiniecie = async (idGrafiku: number, idChecklisty?: number) => {
    const isExpanding = !rozwiniecia.includes(idGrafiku);
    
    // Zwijanie/rozwijanie elementu wizualnie
    setRozwiniecia(prev => 
      isExpanding 
        ? [...prev, idGrafiku] 
        : prev.filter(id => id !== idGrafiku)
    );

    // Jeśli rozwijamy i mamy idChecklisty, a zdjęcia nie są jeszcze pobrane
    if (isExpanding && idChecklisty && !zdjeciaRaportow[idChecklisty]) {
      setLadowanieZdjec(prev => ({ ...prev, [idChecklisty]: true }));
      try {
        const urls = await adminService.getZdjeciaDlaChecklisty(idChecklisty);
        setZdjeciaRaportow(prev => ({ ...prev, [idChecklisty]: urls }));
      } catch (error) {
        console.error("Błąd ładowania zdjęć", error);
      } finally {
        setLadowanieZdjec(prev => ({ ...prev, [idChecklisty]: false }));
      }
    }
  };

  // 3. FILTROWANIE DANYCH
  const przefiltrowaneDane = useMemo(() => {
    if (!szukanaFraza) return daneHandlowe;
    const fraza = szukanaFraza.toLowerCase();
    
    return daneHandlowe.filter(item => {
      const pracownik = `${item.uzytkownicy?.imie || ''} ${item.uzytkownicy?.nazwisko || ''}`.toLowerCase();
      const stoisko = (item.punkty_handlu?.nazwa || '').toLowerCase();
      const rejon = (item.uzytkownicy?.rejony?.nazwa || '').toLowerCase();

      return pracownik.includes(fraza) || stoisko.includes(fraza) || rejon.includes(fraza);
    });
  }, [daneHandlowe, szukanaFraza]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 border-slate-200 animate-fadeIn min-h-[50vh] relative">
      
      {/* NAGŁÓWEK I WYSZUKIWARKA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Dzisiejszy Handel 📊</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">Podgląd na żywo działań ze stoisk ({new Date().toLocaleDateString('pl-PL')})</p>
        </div>
        
        <div className="w-full md:w-72 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Szukaj (osoba, rejon, stoisko)..." 
            value={szukanaFraza}
            onChange={(e) => setSzukanaFraza(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-slate-50 border-slate-200 outline-none focus:border-indigo-500 focus:bg-white transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* STAN ŁADOWANIA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm font-bold animate-pulse">Pobieranie danych na żywo...</p>
        </div>
      ) : przefiltrowaneDane.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 font-medium">
          Brak zaplanowanego handlu na dzisiaj lub brak wyników wyszukiwania.
        </div>
      ) : (
        /* LISTA HANDLU */
        <div className="space-y-3">
          {przefiltrowaneDane.map((item) => {
            const raport = item.raport_z_dnia;
            const jestRozwiniety = rozwiniecia.includes(item.id_grafiku);
            
            // Określanie statusu
            let statusIkonka = "🔴";
            let statusTekst = "Nie zaczęto";
            let statusKolor = "text-rose-600 bg-rose-50 border-rose-200";

            if (raport) {
              if (raport.data_wygenerowania_formatki) {
                statusIkonka = "🟢";
                statusTekst = "Zakończone";
                statusKolor = "text-emerald-700 bg-emerald-50 border-emerald-200";
              } else {
                statusIkonka = "🟡";
                statusTekst = "W trakcie";
                statusKolor = "text-amber-700 bg-amber-50 border-amber-200";
              }
            }

            // Wydobycie danych ze zwracanej tablicy/obiektu
            const rawTowar = raport?.check_lista_towar;
            const dbTowar = rawTowar ? (Array.isArray(rawTowar) ? rawTowar[0] : rawTowar) : {};

            const rawFinanse = raport?.check_lista_finanse;
            const dbFinanse = rawFinanse ? (Array.isArray(rawFinanse) ? rawFinanse[0] : rawFinanse) : {};

            // URL zdjęć pobrane dla tego konkretnego raportu
            const zdjeciaUrl = raport ? zdjeciaRaportow[raport.id_checklisty] : null;
            const isLadowanieZdjec = raport ? ladowanieZdjec[raport.id_checklisty] : false;

            return (
              <div key={item.id_grafiku} className={`border rounded-xl transition-all duration-200 overflow-hidden ${jestRozwiniety ? 'border-indigo-300 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                
                {/* WIDOK ZWINIĘTY (Karta) */}
                <div 
                  onClick={() => toggleRozwiniecie(item.id_grafiku, raport?.id_checklisty)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 gap-3"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shrink-0 ${statusKolor}`}>
                      <span>{statusIkonka}</span> {statusTekst}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.punkty_handlu?.nazwa}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[200px] md:max-w-xs">{item.punkty_handlu?.lokalizacja}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between w-full md:w-auto border-t md:border-t-0 pt-2 md:mt-0">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold text-slate-700">{item.uzytkownicy?.imie} {item.uzytkownicy?.nazwisko}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.uzytkownicy?.rejony?.nazwa}</p>
                    </div>
                    <div className={`transform transition-transform ${jestRozwiniety ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* WIDOK ROZWINIĘTY (Szczegóły - Zmieniony na 3 kolumny jak w ProfilPracownika) */}
                {jestRozwiniety && (
                  <div className="p-0 border-t border-slate-100 animate-slideDown text-sm bg-slate-50">
                    {!raport ? (
                      <div className="text-center py-8 text-slate-500 font-medium flex flex-col items-center gap-2">
                        <span className="text-4xl grayscale opacity-50">😴</span>
                        Pracownik nie utworzył jeszcze raportu porannego.<br/>
                        Stoisko jest zamknięte w systemie.
                      </div>
                    ) : (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 cursor-default">
                        
                        {/* KOLUMNA 1: TOWAR */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">📦 Stany Towarowe</h3>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Stan poranny (Butelki):</span> <strong className="font-mono">{dbTowar?.rano_butelki_pelne || 0}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Stan poranny (Słoiki):</span> <strong className="font-mono">{dbTowar?.rano_sloiki_pelne || 0}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Dostawa:</span> <strong className="font-mono text-indigo-600">+{dbTowar?.dostawa || 0}</strong></div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Stan wieczorny (Butelki):</span> <strong className="font-mono">{dbTowar?.wieczor_butelki_pelne || 0}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Stan wieczorny (Słoiki):</span> <strong className="font-mono">{dbTowar?.wieczor_sloiki_pelne || 0}</strong></div>
                            <div className="flex justify-between pt-2"><span className="text-slate-500">Butelki Puste / Protocudak:</span> <strong className="font-mono text-rose-500">{dbTowar?.wieczor_butelki_puste || 0} / {dbTowar?.wieczor_butelki_protocudak || 0}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Próbki / Prezenty / Stłuczki:</span> <strong className="font-mono text-rose-500">{dbTowar?.ilosc_probki || 0} / {dbTowar?.ilosc_prezenty_stluczki || 0}</strong></div>
                          </div>
                        </div>
                        
                        {/* KOLUMNA 2: FINANSE */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">💰 Finanse i Kasa</h3>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Sztuki wbite na kasę:</span> <strong className="font-mono">{dbFinanse?.ilosc_sztuk_wbita_na_kase || 0}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Kwota brutto na kasie:</span> <strong className="font-mono">{dbFinanse?.kwota_brutto_wbita_na_kase || 0} PLN</strong></div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Wpływ SumUp (Karta):</span> <strong className="font-mono text-emerald-600">{dbFinanse?.przychod_sumup || 0} PLN</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Wpływ Gotówka:</span> <strong className="font-mono text-emerald-600">{dbFinanse?.przychod_gotowka_pln || 0} PLN</strong></div>
                            {dbFinanse?.przychod_inne_waluty > 0 && (
                              <div className="flex justify-between"><span className="text-slate-500">Inne waluty:</span> <strong className="font-mono text-amber-500">{dbFinanse?.przychod_inne_waluty}</strong></div>
                            )}
                          </div>
                        </div>
                        
                        {/* KOLUMNA 3: LOGISTYKA I UWAGI */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">🚗 Logistyka i Dodatki</h3>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Trasa / Nocleg:</span> <strong>{dbFinanse?.trasa || '-'} / {dbFinanse?.nocleg || '-'} PLN</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Przejechane Kilometry:</span> <strong>{dbFinanse?.kilometry || 0} km</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Koszty inne:</span> <strong className="text-rose-500">{dbFinanse?.koszta_inne || 0} PLN</strong></div>
                            {dbFinanse?.koszta_inne_opis && <p className="text-[10px] text-slate-400 italic mb-2 leading-tight">({dbFinanse.koszta_inne_opis})</p>}
                            <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Kasa fiskalna:</span> <strong className="font-mono text-[10px]">{raport.numer_kasy_fiskalnej || '-'}</strong></div>
                            
                            {raport.uwagi && (
                              <div className="mt-2 p-2 bg-amber-50 rounded-lg flex items-center justify-between border border-amber-100">
                                <span className="text-[11px] font-bold text-amber-800">📝 Zgłoszono uwagi</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setTrescUwagi(raport.uwagi); }}
                                  className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                                >Przeczytaj</button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SEKCJA ZE ZDJĘCIAMI (Rozciągnięta na dół ekranu 3 kolumny) */}
                        <div className="md:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-2">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">📸 Dowody i Załączniki</h3>
                          
                          {isLadowanieZdjec ? (
                            <div className="flex gap-2 items-center text-xs font-bold text-slate-400 animate-pulse">
                              <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span> 
                              Szukanie plików w bazie...
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              <button
                                disabled={!zdjeciaUrl?.stanowisko}
                                onClick={(e) => { e.stopPropagation(); setAktywneZdjecieUrl(zdjeciaUrl!.stanowisko); }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 ${zdjeciaUrl?.stanowisko ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                              >
                                🏕️ Stoisko
                              </button>
                              <button
                                disabled={!zdjeciaUrl?.sumup}
                                onClick={(e) => { e.stopPropagation(); setAktywneZdjecieUrl(zdjeciaUrl!.sumup); }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 ${zdjeciaUrl?.sumup ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                              >
                                💳 SumUp
                              </button>
                              <button
                                disabled={!zdjeciaUrl?.kasa}
                                onClick={(e) => { e.stopPropagation(); setAktywneZdjecieUrl(zdjeciaUrl!.kasa); }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 ${zdjeciaUrl?.kasa ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                              >
                                🧾 Raport Kasowy
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP / MODAL Z PŁYWAJĄCYM ZDJĘCIEM (Zgodnie z wymogami - styl z sukienką) */}
      {aktywneZdjecieUrl && (
        <div 
          onClick={() => setAktywneZdjecieUrl(null)} 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-5xl w-full flex items-center justify-center">
            {/* Pływający Przycisk zamknięcia poza obrazkiem */}
            <button 
              onClick={() => setAktywneZdjecieUrl(null)} 
              className="absolute -top-12 right-0 md:-right-8 text-white bg-slate-800 hover:bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl border border-slate-600 transition shadow-xl z-10 cursor-pointer"
            >✕</button>
            
            {/* Obraz bez białego tła */}
            <img 
              src={aktywneZdjecieUrl} 
              alt="Dowód z Jarmarku" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scaleUp border border-slate-700" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* MODAL (POP-UP) Z TREŚCIĄ UWAGI */}
      {trescUwagi && (
        <div onClick={() => setTrescUwagi(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden cursor-default animate-slideUp">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2"><span>📝</span> Uwagi z raportu</h3>
              <button onClick={() => setTrescUwagi(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-200/50 hover:bg-amber-200 text-amber-800 font-bold transition cursor-pointer">✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{trescUwagi}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setTrescUwagi(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm">Zamknij</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}