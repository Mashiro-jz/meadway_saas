'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function TabGrafikPunktu() {
  const router = useRouter(); // Dodajemy router do przekierowań na profil pracownika

  const [punkty, setPunkty] = useState<any[]>([]);
  const [wybranyPunktId, setWybranyPunktId] = useState<string>('');
  
  const [wybranyMiesiac, setWybranyMiesiac] = useState(new Date().getMonth() + 1);
  const [wybranyRok, setWybranyRok] = useState(new Date().getFullYear());
  
  const [grafikPunktu, setGrafikPunktu] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // Pop-up z obsadą
  const [aktywnyDzien, setAktywnyDzien] = useState<{ data: string, ekipa: any[] } | null>(null);

  const nazwyMiesiecy = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  // 1. Pobranie listy punktów
  useEffect(() => {
    async function fetchPunkty() {
      const { data } = await supabase.from('punkty_handlu').select('id_lokalizacji, nazwa, lokalizacja').order('nazwa');
      if (data) {
        setPunkty(data);
        if (data.length > 0) setWybranyPunktId(String(data[0].id_lokalizacji));
      }
    }
    fetchPunkty();
  }, []);

  // 2. Pobieranie obsady dla wybranego punktu
  useEffect(() => {
    if (!wybranyPunktId) return;

    async function fetchGrafikPunktu() {
      setLoading(true);
      
      const pierwszyDzien = `${wybranyRok}-${String(wybranyMiesiac).padStart(2, '0')}-01`;
      const ostatniDzien = new Date(wybranyRok, wybranyMiesiac, 0).toLocaleDateString('en-CA');

      // ZMIANA: Dodano 'email' do zapytania!
      const { data, error } = await supabase
        .from('grafik')
        .select(`
          data,
          uzytkownicy ( id_uzytkownika, imie, nazwisko, email, numer_telefonu, rola )
        `)
        .eq('id_lokalizacji', wybranyPunktId)
        .gte('data', pierwszyDzien)
        .lte('data', ostatniDzien);

      if (error) {
        console.error("Błąd pobierania obsady punktu:", error);
      } else if (data) {
        const zgrupowane: Record<string, any[]> = {};
        data.forEach((wpis: any) => {
          if (!zgrupowane[wpis.data]) zgrupowane[wpis.data] = [];
          if (wpis.uzytkownicy) zgrupowane[wpis.data].push(wpis.uzytkownicy);
        });
        setGrafikPunktu(zgrupowane);
      }
      
      setLoading(false);
    }

    fetchGrafikPunktu();
  }, [wybranyPunktId, wybranyMiesiac, wybranyRok]);

  // --- LOGIKA KALENDARZA ---
  const getISOWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const zlozTygodnieGrafiku = () => {
    const pierwszy = new Date(wybranyRok, wybranyMiesiac - 1, 1);
    const ostatni = new Date(wybranyRok, wybranyMiesiac, 0);
    const start = new Date(pierwszy);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);

    const tygodnie: any[] = [];
    const current = new Date(start);

    while (current <= ostatni || (current.getDay() || 7) !== 1) {
      const dni: any[] = [];
      const nrTygodnia = String(getISOWeek(new Date(current)));

      for (let i = 0; i < 7; i++) {
        const r = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const dz = String(current.getDate()).padStart(2, "0");
        const dataStr = `${r}-${m}-${dz}`;

        if (current.getMonth() !== wybranyMiesiac - 1) {
          dni.push(null);
        } else {
          const ekipaTegoDnia = grafikPunktu[dataStr] || [];
          dni.push({
            data: dataStr, 
            dzienMiesiaca: current.getDate(),
            ekipa: ekipaTegoDnia
          });
        }
        current.setDate(current.getDate() + 1);
      }
      tygodnie.push({ nrTygodnia, dni });
    }
    return tygodnie;
  };

  const dzisiaj = new Date().toLocaleDateString('en-CA');
  const aktualnyPunkt = punkty.find(p => String(p.id_lokalizacji) === wybranyPunktId);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn w-full">
      
      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-lg font-black tracking-tight">Grafik Lokalizacji 🏰</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sprawdź obsadę konkretnego punktu w miesiącu</p>
        </div>
      </div>

      {/* PASEK WYBORU */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/2">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-wider pl-1">Wybierz Punkt Handlu:</label>
          <select 
            value={wybranyPunktId} 
            onChange={(e) => setWybranyPunktId(e.target.value)}
            className="w-full text-base sm:text-sm px-4 py-2.5 border rounded-xl bg-white font-black text-slate-800 outline-none border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer shadow-sm"
          >
            {punkty.map((p: any) => (
              <option key={p.id_lokalizacji} value={p.id_lokalizacji}>{p.nazwa} ({p.lokalizacja})</option>
            ))}
          </select>
        </div>

        {/* STEROWANIE KALENDARZEM */}
        <div className="flex items-center justify-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button onClick={() => setWybranyMiesiac(m => m === 1 ? (setWybranyRok(y => y - 1), 12) : m - 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-700 transition active:scale-95 cursor-pointer shrink-0">&lt;</button>
          <span className="text-sm font-black text-slate-800 uppercase tracking-wide font-mono w-[130px] text-center">
            {nazwyMiesiecy[wybranyMiesiac - 1]} {wybranyRok}
          </span>
          <button onClick={() => setWybranyMiesiac(m => m === 12 ? (setWybranyRok(y => y + 1), 1) : m + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-700 transition active:scale-95 cursor-pointer shrink-0">&gt;</button>
        </div>
      </div>

      {/* KALENDARZ */}
      <div className="p-3 sm:p-5 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10 rounded-b-2xl">
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
              <span className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pobieranie grafiku...</span>
            </div>
          </div>
        )}

        <div className="w-full space-y-1.5 sm:space-y-2">
          {/* Nagłówki Dni */}
          <div className="flex items-center text-center text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider border-b pb-2">
            <div className="w-6 sm:w-10 shrink-0 text-left pl-1">Nr.</div>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (<div key={d} className="flex-1">{d}</div>))}
          </div>

          {/* Dni Kalendarza */}
          {zlozTygodnieGrafiku().map((tydz, idx) => (
            <div key={`${wybranyRok}-${wybranyMiesiac}-w-${tydz.nrTygodnia}-${idx}`} className="flex items-center text-center py-0.5">
              <div className="w-6 sm:w-10 shrink-0 text-left font-black text-slate-400 text-[10px] sm:text-sm font-mono pl-1 sm:pl-2">
                {tydz.nrTygodnia}
              </div>
              
              {tydz.dni.map((d: any, dIdx: number) => {
                if (d === null) return <div key={`empty-${dIdx}`} className="flex-1 h-10 sm:h-12 m-0.5" />;
                
                const jestObsada = d.ekipa.length > 0;
                const czyToDzisiaj = d.data === dzisiaj;

                let klasyKoloru = jestObsada ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-100 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all' : 'bg-slate-50 text-slate-400 border border-slate-100/50';
                if (czyToDzisiaj && !jestObsada) klasyKoloru = 'bg-slate-200 text-slate-700 font-black border border-slate-300';
                if (czyToDzisiaj && jestObsada) klasyKoloru = 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-200 cursor-pointer hover:-translate-y-0.5 transition-all';

                return (
                  <div
                    key={d.data}
                    onClick={() => {
                      if (jestObsada) setAktywnyDzien(d);
                    }}
                    className={`flex-1 h-10 sm:h-14 m-0.5 sm:m-1 rounded-xl flex flex-col items-center justify-center font-bold text-xs sm:text-base relative select-none touch-manipulation ${klasyKoloru} ${czyToDzisiaj ? 'z-10 scale-105' : ''}`}
                  >
                    <span>{d.dzienMiesiaca}</span>
                    
                    {/* Kropeczki reprezentujące ilość przypisanych pracowników */}
                    {jestObsada && (
                      <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                        {d.ekipa.map((_: any, i: number) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${czyToDzisiaj ? 'bg-white opacity-90' : 'bg-indigo-400'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* LEGENDA */}
        <div className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-200 pt-5 mt-6 text-[10px] sm:text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-md bg-slate-50 block border border-slate-200" /> Brak Handlu</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-md bg-indigo-100 block border border-indigo-200" /> Zaplanowany Handel (Kliknij)</div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-md bg-indigo-600 block shadow-md" /> Dzisiejszy Dzień</div>
        </div>
      </div>

      {/* POP-UP Z OBSADĄ NA DANY DZIEŃ - CAŁKOWICIE PRZEBUDOWANY UI */}
      {aktywnyDzien && (
        <div onClick={() => setAktywnyDzien(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col cursor-default animate-slideUp border border-slate-200">
            
            {/* Header Popup'u */}
            <div className="px-6 py-6 border-b border-indigo-100 bg-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div className="pr-4">
                  <span className="inline-block bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">
                    Obsada Stoiska
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight mb-1">{aktualnyPunkt?.nazwa}</h2>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="text-indigo-400">📅</span> 
                    {new Date(aktywnyDzien.data).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setAktywnyDzien(null)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer shadow-sm">✕</button>
              </div>
            </div>

            {/* Lista Pracowników (Wizytówki) */}
            <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
                Kto jest dzisiaj na miejscu? ({aktywnyDzien.ekipa.length})
              </h4>
              
              <div className="flex flex-col gap-3">
                {aktywnyDzien.ekipa.map((pracownik, idx) => (
                  <div key={pracownik.id_uzytkownika || idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                    
                    {/* Ozdobny pasek z boku wskazujący rolę */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pracownik.rola === 'koordynator' ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                    
                    {/* INFO PRACOWNIKA */}
                    <div className="flex items-center gap-3.5 min-w-0 pl-2">
                      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-black text-lg shrink-0 shadow-inner border border-slate-100">
                        {pracownik.imie?.charAt(0)}{pracownik.nazwisko?.charAt(0)}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-extrabold text-slate-800 truncate text-sm sm:text-base">{pracownik.imie} {pracownik.nazwisko}</p>
                          {pracownik.rola === 'koordynator' ? (
                            <span className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 shrink-0">Koordynator</span>
                          ) : (
                            <span className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 shrink-0">Pracownik</span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                          {/* ZMIANA: Wyświetlanie maila */}
                          {pracownik.email && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                              <span className="opacity-60">✉️</span> {pracownik.email}
                            </p>
                          )}
                          {pracownik.numer_telefonu && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                              <span className="opacity-60">📞</span> {pracownik.numer_telefonu}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AKCJE (Przyciski jako "pill" na prawo/dole) */}
                    <div className="flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      {pracownik.numer_telefonu && (
                        <a 
                          href={`tel:${pracownik.numer_telefonu}`}
                          className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition flex items-center justify-center gap-1 border border-emerald-200"
                        >
                          📞 Dzwoń
                        </a>
                      )}
                      <button 
                        onClick={() => router.push(`/admin/pracownicy/${pracownik.id_uzytkownika}`)}
                        className="flex-1 sm:flex-none bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        👤 Profil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}