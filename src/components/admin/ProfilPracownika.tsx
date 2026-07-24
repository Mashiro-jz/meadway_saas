'use client';

import React, { useState } from 'react';
import { useProfilPracownika } from '../../hooks/useProfilPracownika';
import PunktHandluPopup from '../PunktHandluPopup'; 

interface ProfilPracownikaProps {
  idUzytkownika: number;
  onBack: () => void;
}

export default function ProfilPracownika({ idUzytkownika, onBack }: ProfilPracownikaProps) {
  const { pracownik, checklisty, grafik, loading, error } = useProfilPracownika(idUzytkownika);
  
  const [rozszerzonaLista, setRozszerzonaLista] = useState<number | null>(null);
  const [trescUwagi, setTrescUwagi] = useState<string | null>(null);

  // --- STANY I LOGIKA DLA MINI-KALENDARZA ---
  const [wybranyMiesiac, setWybranyMiesiac] = useState(new Date().getMonth() + 1);
  const [wybranyRok, setWybranyRok] = useState(new Date().getFullYear());
  const [aktywnyPunktPopup, setAktywnyPunktPopup] = useState<any>(null);

  const nazwyMiesiecy = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  const getISOWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const zlozTygodnieGrafiku = () => {
    const mapaDni = new Map(grafik.map((d: any) => [d.data, d]));
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
          const wpisZ_BD = mapaDni.get(dataStr);
          if (wpisZ_BD) {
            dni.push(wpisZ_BD);
          } else {
            dni.push({
              data: dataStr, dzienMiesiaca: current.getDate(), dostepnosc: 'nieznana', punkty_handlu: null
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
      tygodnie.push({ nrTygodnia, dni });
    }
    return tygodnie;
  };
  // ------------------------------------------

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Ładowanie profilu pracownika...</div>;
  if (error || !pracownik) return <div className="text-center p-12 text-rose-500 font-bold">{error || 'Nie znaleziono pracownika.'}</div>;

  const toggleLista = (id: number) => {
    setRozszerzonaLista(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn relative">

      {/* PASEK NAWIGACJI */}
      <div className="bg-slate-100 p-3 px-5 flex items-center border-b border-slate-200">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer">
          <span>←</span> Wróć do listy pracowników
        </button>
      </div>

      {/* NAGŁÓWEK KARTY PRACOWNIKA */}
      <div className="bg-slate-800 p-6 text-white border-b border-slate-900">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black tracking-tight">{pracownik.imie} {pracownik.nazwisko}</h1>
              <span className="bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                {pracownik.rola}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
              <p className="flex items-center gap-2 text-slate-300"><span className="opacity-60">📧</span> {pracownik.email}</p>
              <p className="flex items-center gap-2 text-slate-300"><span className="opacity-60">🌍 Rejon:</span> <strong className="text-white">{pracownik.rejony?.nazwa || 'Brak przypisanego rejonu'}</strong></p>
              <p className="flex items-center gap-2 text-slate-300"><span className="opacity-60">📞</span> {pracownik.numer_telefonu || 'Brak numeru'}</p>
              <p className="flex items-center gap-2 text-slate-300">
                <span className="opacity-60">👨‍💼 Koordynator:</span>
                <strong className="text-white">{pracownik.rejony?.uzytkownicy ? `${pracownik.rejony.uzytkownicy.imie} ${pracownik.rejony.uzytkownicy.nazwisko}` : 'Brak'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GŁÓWNA ZAWARTOŚĆ (Podział 3:1) */}
      <div className="p-5 grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

        {/* LEWA STRONA (3/4): CHECKLISTY */}
        <div className="xl:col-span-3 space-y-3 overflow-x-auto">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            📋 Historia Checklist (Szczegółowa)
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            {checklisty.length === 0 ? (
              <p className="text-center text-xs text-slate-400 italic py-8">Pracownik nie wypełnił jeszcze żadnej checklisty.</p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Data i Czas</th>
                    <th className="py-3 px-4">Jarmark & Rejon</th>
                    <th className="py-3 px-4">Godziny (Hand. / Niehand.)</th>
                    <th className="py-3 px-4">Sprzedaż (Butelki / Słoiki)</th>
                    <th className="py-3 px-4">Przychód (Suma)</th>
                    <th className="py-3 px-4 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {checklisty.map((chk) => {
                    const towar = Array.isArray(chk.check_lista_towar) ? chk.check_lista_towar[0] : chk.check_lista_towar;
                    const finanse = Array.isArray(chk.check_lista_finanse) ? chk.check_lista_finanse[0] : chk.check_lista_finanse;
                    const isExpanded = rozszerzonaLista === chk.id_checklisty;
                    const sumaDochodu = ((finanse?.przychod_gotowka_pln || 0) + (finanse?.przychod_sumup || 0)).toFixed(2);

                    return (
                      <React.Fragment key={chk.id_checklisty}>
                        {/* GŁÓWNY WIERSZ */}
                        <tr className={`transition cursor-pointer ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`} onClick={() => toggleLista(chk.id_checklisty)}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {new Date(chk.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800">{chk.punkty_handlu?.nazwa || 'Nieznany punkt'}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">📍 {chk.punkty_handlu?.rejony?.nazwa || 'Brak rejonu'}</p>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <span className="text-emerald-600 font-bold">{chk.ilosc_godzin_handlowych || 0}h</span> / <span className="text-slate-400">{chk.ilosc_godzin_niehandlowych || 0}h</span>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            🍾 <strong className="text-slate-800">{towar?.butelki_sprzedane || 0}</strong> szt. &nbsp;|&nbsp; 🍯 <strong className="text-slate-800">{towar?.sloiki_sprzedane || 0}</strong> szt.
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{sumaDochodu} PLN</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[10px] uppercase font-black tracking-wider text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded transition cursor-pointer">
                              {isExpanded ? 'Zwiń ✕' : 'Szczegóły ➔'}
                            </button>
                          </td>
                        </tr>

                        {/* ROZWIJANY WIERSZ ZE SZCZEGÓŁAMI */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b-2 border-indigo-100">
                            <td colSpan={6} className="p-0">
                              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideDown cursor-default">
                                {/* KOLUMNA 1: TOWAR */}
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">📦 Stany Towarowe</h3>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between"><span className="text-slate-500">Stan poranny (Butelki):</span> <strong className="font-mono">{towar?.rano_butelki_pelne || 0}</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Stan poranny (Słoiki):</span> <strong className="font-mono">{towar?.rano_sloiki_pelne || 0}</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Dostawa:</span> <strong className="font-mono text-indigo-600">+{towar?.dostawa || 0}</strong></div>
                                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Stan wieczorny (Butelki):</span> <strong className="font-mono">{towar?.wieczor_butelki_pelne || 0}</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Stan wieczorny (Słoiki):</span> <strong className="font-mono">{towar?.wieczor_sloiki_pelne || 0}</strong></div>
                                    <div className="flex justify-between pt-2"><span className="text-slate-500">Butelki Puste / Protocudak:</span> <strong className="font-mono">{towar?.wieczor_butelki_puste || 0} / {towar?.wieczor_butelki_protocudak || 0}</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Próbki / Prezenty / Stłuczki:</span> <strong className="font-mono">{towar?.ilosc_probki || 0} / {towar?.ilosc_prezenty_stluczki || 0}</strong></div>
                                  </div>
                                </div>
                                {/* KOLUMNA 2: FINANSE */}
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">💰 Finanse i Kasa</h3>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between"><span className="text-slate-500">Sztuki wbite na kasę:</span> <strong className="font-mono">{finanse?.ilosc_sztuk_wbita_na_kase || 0}</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Kwota brutto na kasie:</span> <strong className="font-mono">{finanse?.kwota_brutto_wbita_na_kase || 0} PLN</strong></div>
                                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Wpływ SumUp (Karta):</span> <strong className="font-mono text-emerald-600">{finanse?.przychod_sumup || 0} PLN</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Wpływ Gotówka:</span> <strong className="font-mono text-emerald-600">{finanse?.przychod_gotowka_pln || 0} PLN</strong></div>
                                    {finanse?.przychod_inne_waluty > 0 && (
                                      <div className="flex justify-between"><span className="text-slate-500">Inne waluty:</span> <strong className="font-mono text-amber-500">{finanse?.przychod_inne_waluty}</strong></div>
                                    )}
                                  </div>
                                </div>
                                {/* KOLUMNA 3: LOGISTYKA I UWAGI */}
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">🚗 Logistyka i Dodatki</h3>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between"><span className="text-slate-500">Trasa / Nocleg:</span> <strong>{finanse?.trasa || '-'} / {finanse?.nocleg || '-'} PLN</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Przejechane Kilometry:</span> <strong>{finanse?.kilometry || 0} km</strong></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Koszty inne:</span> <strong className="text-rose-500">{finanse?.koszta_inne || 0} PLN</strong></div>
                                    {finanse?.koszta_inne_opis && <p className="text-[10px] text-slate-400 italic mb-2 leading-tight">({finanse.koszta_inne_opis})</p>}
                                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Kasa fiskalna:</span> <strong className="font-mono text-[10px]">{chk.numer_kasy_fiskalnej || '-'}</strong></div>
                                    
                                    {chk.uwagi && (
                                      <div className="mt-2 p-2 bg-amber-50 rounded-lg flex items-center justify-between border border-amber-100">
                                        <span className="text-[11px] font-bold text-amber-800">📝 Zgłoszono uwagi</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setTrescUwagi(chk.uwagi); }}
                                          className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                                        >Przeczytaj</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PRAWA STRONA (1/4): MINI-KALENDARZ */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            📅 Grafik pracownika
          </h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            {/* Wybór miesiąca */}
            <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <button onClick={() => setWybranyMiesiac(m => m === 1 ? (setWybranyRok(y => y - 1), 12) : m - 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold transition cursor-pointer">&lt;</button>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                {nazwyMiesiecy[wybranyMiesiac - 1]} {wybranyRok}
              </span>
              <button onClick={() => setWybranyMiesiac(m => m === 12 ? (setWybranyRok(y => y + 1), 1) : m + 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold transition cursor-pointer">&gt;</button>
            </div>

            {/* Skompresowana Siatka Kalendarza */}
            <div className="w-full">
              <div className="flex items-center text-center text-[9px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5 mb-1.5">
                <div className="w-6 shrink-0"></div>
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (<div key={d} className="flex-1">{d}</div>))}
              </div>

              {zlozTygodnieGrafiku().map((tydz, idx) => (
                <div key={`w-${tydz.nrTygodnia}-${idx}`} className="flex items-center text-center py-0.5">
                  <div className="w-6 shrink-0 text-[9px] font-black text-slate-400">{tydz.nrTygodnia}</div>
                  {tydz.dni.map((d: any, dIdx: number) => {
                    if (d === null) return <div key={`empty-${dIdx}`} className="flex-1 h-7 m-0.5" />;
                    const maPrzypisanyHandel = d.punkty_handlu !== null;
                    
                    // Kolory dostępności w mini-widoku
                    let bgColor = 'bg-slate-200 text-slate-600'; // nieznana
                    if (d.dostepnosc === 'dostepny') bgColor = 'bg-emerald-500 text-white';
                    if (d.dostepnosc === 'nd') bgColor = 'bg-rose-500 text-white';
                    if (d.dostepnosc === 'nz') bgColor = 'bg-orange-500 text-white';
                    return (
                      <div
                        key={d.data}
                        onClick={() => {
                          if (maPrzypisanyHandel) setAktywnyPunktPopup(d.punkty_handlu);
                        }}
                        className={`flex-1 h-7 m-0.5 rounded-md flex items-center justify-center font-bold text-[10px] transition relative select-none ${
                          maPrzypisanyHandel ? 'ring-1 ring-offset-1 cursor-pointer hover:scale-105' : ''
                        } ${bgColor}`}
                        title={maPrzypisanyHandel ? `Kliknij, aby zobaczyć szczegóły: ${d.punkty_handlu.nazwa}` : ''}
                      >
                        {new Date(d.data).getDate()}
                        {maPrzypisanyHandel && (<span className="absolute top-0 right-0 w-1.5 h-1.5 bg-indigo-900 rounded-full" />)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-y-1.5 text-[9px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Dostępny</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Niedz.</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Żądanie</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm ring-1 ring-offset-1 bg-slate-200" /> Handel (Klik)</div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL (POP-UP) Z TREŚCIĄ UWAGI */}
      {trescUwagi && (
        <div onClick={() => setTrescUwagi(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden cursor-default animate-slideUp">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2"><span>📝</span> Uwagi do zmiany</h3>
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

      {/* MODAL (POP-UP) Z INFORMACJĄ O PUNKCIE HANDLOWYM */}
      {aktywnyPunktPopup && (
        <PunktHandluPopup
          punkt={aktywnyPunktPopup}
          onClose={() => setAktywnyPunktPopup(null)}
        />
      )}

    </div>
  );
}