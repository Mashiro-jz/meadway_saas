import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService'; 

export default function TabDzisiejszyHandelAdmin() {
  const [daneHandlowe, setDaneHandlowe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [szukanaFraza, setSzukanaFraza] = useState('');
  const [rozwiniecia, setRozwiniecia] = useState<number[]>([]);

  // Stany do zarządzania widokiem zdjęć
  const [aktywneZdjecieUrl, setAktywneZdjecieUrl] = useState<string | null>(null);
  const [ladowanieZdjeciaId, setLadowanieZdjeciaId] = useState<number | null>(null);

  // ŁADOWANIE DANYCH GŁÓWNYCH
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

  // OBSŁUGA ROZWIJANIA WIERSZY
  const toggleRozwiniecie = (idGrafiku: number) => {
    setRozwiniecia(prev => 
      prev.includes(idGrafiku) 
        ? prev.filter(id => id !== idGrafiku) 
        : [...prev, idGrafiku]
    );
  };

  // POBIERANIE ZDJĘCIA Z CHMURY
  const otworzZdjecie = async (idChecklisty: number, typZdjecia: 'stanowisko' | 'kasa' | 'sumup') => {
    try {
      setLadowanieZdjeciaId(idChecklisty);
      const urls = await adminService.getZdjeciaDlaChecklisty(idChecklisty);
      const docelowyUrl = urls[typZdjecia];

      if (docelowyUrl) {
        setAktywneZdjecieUrl(docelowyUrl);
      } else {
        alert('❌ Zdjęcie jeszcze nie zostało wgrane do systemu lub jest w trakcie przetwarzania.');
      }
    } catch (error) {
      console.error('Błąd otwierania zdjęcia:', error);
      alert('Błąd pobierania zdjęcia z serwera.');
    } finally {
      setLadowanieZdjeciaId(null);
    }
  };

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
          <h2 className="text-xl font-black text-slate-800">Dzisiejszy Handel 📍</h2>
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

            const rawTowar = raport?.check_lista_towar;
            const dbTowar = rawTowar ? (Array.isArray(rawTowar) ? rawTowar[0] : rawTowar) : {};

            const rawFinanse = raport?.check_lista_finanse;
            const dbFinanse = rawFinanse ? (Array.isArray(rawFinanse) ? rawFinanse[0] : rawFinanse) : {};

            return (
              <div key={item.id_grafiku} className={`border rounded-xl transition-all duration-200 overflow-hidden ${jestRozwiniety ? 'border-indigo-300 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                
                {/* WIDOK ZWINIĘTY (Karta) */}
                <div 
                  onClick={() => toggleRozwiniecie(item.id_grafiku)}
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

                {/* WIDOK ROZWINIĘTY (Szczegóły) */}
                {jestRozwiniety && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 animate-slideDown text-sm">
                    {!raport ? (
                      <div className="text-center py-6 text-slate-500 font-medium flex flex-col items-center gap-2">
                        <span className="text-3xl grayscale opacity-50">😴</span>
                        Pracownik nie utworzył jeszcze raportu porannego.<br/>
                        Stoisko jest zamknięte w systemie.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-2 border-b pb-1">☀️ Otwarcie</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Puste weszły:</span> <span className="font-bold">{dbTowar.rano_butelki_puste ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Protocudaki weszły:</span> <span className="font-bold">{dbTowar.rano_butelki_protocudak ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Pełne weszły:</span> <span className="font-bold">{dbTowar.rano_butelki_pelne ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Słoiki weszły:</span> <span className="font-bold">{dbTowar.rano_sloiki_pelne ?? 0}</span></div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-2 border-b pb-1">📦 Sprzedaż / Magazyn</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Sprzedane butelki:</span> <span className="font-bold text-emerald-600">{dbTowar.butelki_sprzedane ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Sprzedane słoiki:</span> <span className="font-bold text-emerald-600">{dbTowar.sloiki_sprzedane ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Dostawa:</span> <span className="font-bold">{dbTowar.dostawa ?? 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Próbki / Stłuczki:</span> <span className="font-bold">{dbTowar.ilosc_probki ?? 0} / {dbTowar.ilosc_prezenty_stluczki ?? 0}</span></div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2 border-b pb-1">💰 Finanse ({raport.numer_kasy_fiskalnej || 'Brak kasy'})</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Brutto:</span> <span className="font-bold text-slate-800">{dbFinanse.kwota_brutto_wbita_na_kase ?? 0} zł</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">SumUp:</span> <span className="font-bold text-slate-800">{dbFinanse.przychod_sumup ?? 0} zł</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Gotówka:</span> <span className="font-bold text-slate-800">{dbFinanse.przychod_gotowka_pln ?? 0} zł</span></div>
                            <div className="flex justify-between"><span className="text-rose-500">Koszty:</span> <span className="font-bold text-rose-600">{dbFinanse.koszta_inne ?? 0} zł</span></div>
                          </div>
                        </div>

                        {/* SEKCJA: ZDJĘCIA */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 relative">
                          <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-wider mb-1 border-b pb-1">📸 Dokumentacja</h4>
                          
                          {/* Wskaźnik ładowania dla TEGO konkretnego raportu */}
                          {ladowanieZdjeciaId === raport.id_checklisty && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10 backdrop-blur-sm">
                               <div className="w-5 h-5 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
                            </div>
                          )}

                          <button 
                            disabled={!raport || ladowanieZdjeciaId !== null} 
                            onClick={() => otworzZdjecie(raport.id_checklisty, 'stanowisko')}
                            className="text-[10px] font-bold py-1.5 px-2 rounded bg-sky-50 text-sky-700 disabled:opacity-40 hover:bg-sky-100 transition text-left cursor-pointer"
                          >
                            {raport ? '🖼️ Zobacz Otwarcie Stoiska' : '✖️ Brak zdjęcia stoiska'}
                          </button>
                          
                          <button 
                            disabled={!raport?.data_wygenerowania_formatki || ladowanieZdjeciaId !== null} 
                            onClick={() => otworzZdjecie(raport.id_checklisty, 'kasa')}
                            className="text-[10px] font-bold py-1.5 px-2 rounded bg-sky-50 text-sky-700 disabled:opacity-40 hover:bg-sky-100 transition text-left cursor-pointer"
                          >
                            {raport?.data_wygenerowania_formatki ? '🧾 Zobacz Raport Kasy' : '✖️ Brak zdjęcia kasy'}
                          </button>
                          
                          <button 
                            disabled={!raport?.data_wygenerowania_formatki || ladowanieZdjeciaId !== null} 
                            onClick={() => otworzZdjecie(raport.id_checklisty, 'sumup')}
                            className="text-[10px] font-bold py-1.5 px-2 rounded bg-sky-50 text-sky-700 disabled:opacity-40 hover:bg-sky-100 transition text-left cursor-pointer"
                          >
                            {raport?.data_wygenerowania_formatki ? '💳 Zobacz Terminal SumUp' : '✖️ Brak zdjęcia terminala'}
                          </button>
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

      {/* POPUP / MODAL ZE ZDJĘCIEM - IDEALNE DOPASOWANIE */}
      {aktywneZdjecieUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 sm:p-8 animate-fadeIn"
          onClick={() => setAktywneZdjecieUrl(null)} 
        >
          <div 
            className="relative max-w-5xl w-full h-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Nagłówek okienka */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-700">Podgląd dokumentacji</h3>
              <button 
                onClick={() => setAktywneZdjecieUrl(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            {/* Kontener na zdjęcie - naprawione dopasowanie */}
            <div className="flex-1 p-2 sm:p-4 bg-slate-900/5 flex items-center justify-center overflow-hidden">
              <img 
                src={aktywneZdjecieUrl} 
                alt="Dokumentacja fotograficzna" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}