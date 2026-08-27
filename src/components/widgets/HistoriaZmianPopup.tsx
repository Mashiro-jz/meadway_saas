'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

interface HistoriaZmianPopupProps {
  nazwaTabeli: string; // np. 'punkty_handlu'
  idRekordu: number | string; // np. 5
  tytul: string; // np. 'Zamek Bolków'
  onClose: () => void;
}

// Słownik tłumaczący surowe kolumny bazy danych na język polski
const SLOWNIK_KOLUMN: Record<string, string> = {
  nazwa: 'Nazwa',
  lokalizacja: 'Adres punktu',
  lokalizacja_namiotu: 'Lokalizacja namiotu / Link GPS',
  godziny_otwarcia: 'Godziny otwarcia',
  cena_stanowiska: 'Cena stanowiska (PLN)',
  uwagi: 'Wskazówki logistyczne',
  id_rejonu: 'Przydział Rejonu',
  id_koordynatora: 'Przypisany Koordynator',
  imie: 'Imię',
  nazwisko: 'Nazwisko',
  numer_telefonu: 'Numer telefonu',
  email: 'Adres E-mail',
  rola: 'Rola w systemie'
};

export default function HistoriaZmianPopup({ nazwaTabeli, idRekordu, tytul, onClose }: HistoriaZmianPopupProps) {
  const [historia, setHistoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoria = async () => {
      try {
        const data = await adminService.getHistoriaRekordu(nazwaTabeli, idRekordu);
        setHistoria(data);
      } catch (err) {
        console.error("Błąd pobierania historii", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoria();
  }, [nazwaTabeli, idRekordu]);

  // Funkcja porównująca stary i nowy JSON
  const generujRoznice = (stare: any, nowe: any) => {
    const zmiany: React.JSX.Element[] = [];
    
    // Zbieramy wszystkie klucze, ignorując te systemowe, które nas nie interesują
    const ignorowaneKlucze = ['updated_at', 'updated_by', 'created_at', 'id_lokalizacji', 'id_rejonu', 'id_uzytkownika'];
    const wszystkieKlucze = new Set([...Object.keys(stare || {}), ...Object.keys(nowe || {})]);

    wszystkieKlucze.forEach(klucz => {
      if (ignorowaneKlucze.includes(klucz)) return;

      const staraWartosc = stare?.[klucz];
      const nowaWartosc = nowe?.[klucz];

      // Jeśli wartość uległa zmianie (i nie jest to zmiana z null na pusty string)
      if (staraWartosc !== nowaWartosc && !(staraWartosc == null && nowaWartosc === '')) {
        const nazwaLudzska = SLOWNIK_KOLUMN[klucz] || klucz;

        zmiany.push(
          <li key={klucz} className="mb-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
              {nazwaLudzska}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {stare && (
                <>
                  <span className="line-through text-slate-500 bg-slate-100 px-2 py-1 rounded break-words max-w-full">
                    {staraWartosc ? String(staraWartosc) : 'Brak'}
                  </span>
                  <span className="text-slate-300 font-black">➔</span>
                </>
              )}
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded break-words max-w-full">
                {nowaWartosc ? String(nowaWartosc) : 'Pusto / Usunięto'}
              </span>
            </div>
          </li>
        );
      }
    });

    return zmiany;
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] cursor-default animate-slideUp"
      >
        
        {/* NAGŁÓWEK */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="pr-4">
            <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
              <span className="text-lg">🕵️‍♂️</span> Historia zmian (7 dni)
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
              Dotyczy: <span className="text-indigo-600">{tytul}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* LISTA ZMIAN (TIMELINE) */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-slate-50/50 flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></span>
            </div>
          ) : historia.length === 0 ? (
            <p className="text-center text-sm text-slate-500 italic py-8 font-medium">Brak historii zmian dla tego rekordu w ciągu ostatnich 7 dni.</p>
          ) : (
            <div className="relative border-l-2 border-indigo-100 ml-3 pl-5 space-y-6">
              {historia.map((wpis, index) => {
                const czyNajnowsza = index === 0;
                
                return (
                  <div key={wpis.id_zmiany} className="relative">
                    {/* KROPECZKA NA OSI CZASU */}
                    <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white ${czyNajnowsza ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300'}`}></div>
                    
                    {/* TYTUŁ WPISU */}
                    <div className="mb-2">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {new Date(wpis.data_zmiany).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${wpis.akcja === 'INSERT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {wpis.akcja === 'INSERT' ? 'Utworzono' : 'Edycja'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-1">
                        Zmienione przez: <strong className="text-slate-800">{wpis.edytor?.imie || 'Nieznany'} {wpis.edytor?.nazwisko || 'Użytkownik'}</strong>
                      </p>
                    </div>

                    {/* SZCZEGÓŁY ZMIAN (RÓŻNICE) */}
                    <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                      {wpis.akcja === 'INSERT' ? (
                        <p className="text-xs text-slate-500 italic font-medium">Rekord został po raz pierwszy wprowadzony do bazy danych.</p>
                      ) : (
                        <ul className="m-0 p-0 list-none">
                          {generujRoznice(wpis.stare_dane, wpis.nowe_dane).length > 0 
                            ? generujRoznice(wpis.stare_dane, wpis.nowe_dane) 
                            : <li className="text-xs text-slate-400 italic">Brak widocznych modyfikacji w monitorowanych polach.</li>
                          }
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}