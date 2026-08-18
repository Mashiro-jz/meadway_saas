'use client';

import React, { useState } from 'react';
import { useProfilPracownika } from '../../hooks/useProfilPracownika';
import PunktHandluPopup from '../PunktHandluPopup'; 
import { adminService } from '../../services/adminService'; 

interface ProfilPracownikaProps {
  idUzytkownika: number;
  onBack: () => void;
}

export default function ProfilPracownika({ idUzytkownika, onBack }: ProfilPracownikaProps) {
  const { pracownik, checklisty, grafik, loading, error } = useProfilPracownika(idUzytkownika);
  
  const [rozszerzonaLista, setRozszerzonaLista] = useState<number | null>(null);
  const [trescUwagi, setTrescUwagi] = useState<string | null>(null);

  const [powiekszoneZdjecie, setPowiekszoneZdjecie] = useState<string | null>(null);
  const [zdjeciaUrl, setZdjeciaUrl] = useState<{ kasa: string|null, sumup: string|null, stanowisko: string|null } | null>(null);
  const [loadingZdjecia, setLoadingZdjecia] = useState(false);

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

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Ładowanie profilu pracownika...</div>;
  if (error || !pracownik) return <div className="text-center p-12 text-rose-500 font-bold">{error || 'Nie znaleziono pracownika.'}</div>;

  const toggleLista = async (id: number) => {
    if (rozszerzonaLista === id) {
      setRozszerzonaLista(null);
      setZdjeciaUrl(null);
    } else {
      setRozszerzonaLista(id);
      setZdjeciaUrl(null);
      setLoadingZdjecia(true);
      
      try {
        const urls = await adminService.getZdjeciaDlaChecklisty(id);
        setZdjeciaUrl(urls);
      } catch (err) {
        console.error("Błąd ładowania zdjęć", err);
      } finally {
        setLoadingZdjecia(false);
      }
    }
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
      <div className="bg-slate-800 p-5 sm:p-6 text-white border-b border-slate-900">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{pracownik.imie} {pracownik.nazwisko}</h1>
              <span className="bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                {pracownik.rola}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs sm:text-sm">
              <p className="flex items-center gap-2 text-slate-300 truncate"><span className="opacity-60 shrink-0">📧</span> {pracownik.email}</p>
              <p className="flex items-center gap-2 text-slate-300 truncate"><span className="opacity-60 shrink-0">🌍 Rejon:</span> <strong className="text-white truncate">{pracownik.rejony?.nazwa || 'Brak'}</strong></p>
              <p className="flex items-center gap-2 text-slate-300 truncate"><span className="opacity-60 shrink-0">📞</span> {pracownik.numer_telefonu || 'Brak numeru'}</p>
              <p className="flex items-center gap-2 text-slate-300 truncate">
                <span className="opacity-60 shrink-0">👨‍💼 Koordynator:</span>
                <strong className="text-white truncate">{pracownik.rejony?.uzytkownicy ? `${pracownik.rejony.uzytkownicy.imie} ${pracownik.rejony.uzytkownicy.nazwisko}` : 'Brak'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <div className="p-3 sm:p-5 grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

        {/* LEWA STRONA: CHECKLISTY (Zmieniona na Card View dla Mobile) */}
        <div className="xl:col-span-3 space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            📋 Historia Raportów (Szczegółowa)
          </h2>

          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {checklisty.length === 0 ? (
              <p className="text-center text-xs text-slate-400 italic py-8 border border-slate-200 rounded-xl bg-slate-50">Pracownik nie wypełnił jeszcze żadnej checklisty.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {checklisty.map((chk) => {
                  const towar = Array.isArray(chk.check_lista_towar) ? chk.check_lista_towar[0] : chk.check_lista_towar;
                  const finanse = Array.isArray(chk.check_lista_finanse) ? chk.check_lista_finanse[0] : chk.check_lista_finanse;
                  const isExpanded = rozszerzonaLista === chk.id_checklisty;
                  const sumaDochodu = ((finanse?.przychod_gotowka_pln || 0) + (finanse?.przychod_sumup || 0)).toFixed(2);
                  const dataRaportu = new Date(chk.created_at);

                  return (
                    <div key={chk.id_checklisty} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      
                      {/* HEADER KARTY (Widoczny zawsze) */}
                      <div 
                        onClick={() => toggleLista(chk.id_checklisty)} 
                        className={`p-3 sm:p-4 cursor-pointer flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                      >
                        {/* Data i Lokalizacja */}
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`transform transition-transform text-[10px] mt-1 shrink-0 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}>▼</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 text-sm sm:text-base truncate">{chk.punkty_handlu?.nazwa || 'Nieznany punkt'}</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                {dataRaportu.toLocaleDateString('pl-PL')} {dataRaportu.getHours().toString().padStart(2,'0')}:{dataRaportu.getMinutes().toString().padStart(2,'0')}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-wider border border-slate-200 px-1.5 py-0.5 rounded truncate max-w-full">
                                📍 {chk.punkty_handlu?.rejony?.nazwa || 'Brak'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Wyniki "Na szybko" (Tylko najważniejsze metryki) */}
                        <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center sm:justify-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0 gap-2">
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Sprzedaż</span>
                              <span className="text-xs sm:text-sm font-medium">🍾 <strong className="text-slate-800">{towar?.butelki_sprzedane || 0}</strong> / 🍯 <strong className="text-slate-800">{towar?.sloiki_sprzedane || 0}</strong></span>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-3">
                              <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Kasa Suma</span>
                              <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs sm:text-sm border border-emerald-100">{sumaDochodu} PLN</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ROZWINIĘTE SZCZEGÓŁY KARTY */}
                      {isExpanded && (
                        <div className="bg-slate-50 border-t-2 border-indigo-100 animate-slideDown">
                          <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                            
                            {/* KOLUMNA 1: TOWAR */}
                            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">📦 Towar (Wszystko)</h3>
                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <div className="flex justify-between items-center"><span className="text-slate-500">Rano (But. / Słoiki):</span> <strong className="font-mono">{towar?.rano_butelki_pelne || 0} / {towar?.rano_sloiki_pelne || 0}</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Dostawa:</span> <strong className="font-mono text-indigo-600">+{towar?.dostawa || 0}</strong></div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Wieczór (But. / Słoiki):</span> <strong className="font-mono">{towar?.wieczor_butelki_pelne || 0} / {towar?.wieczor_sloiki_pelne || 0}</strong></div>
                                <div className="flex justify-between items-center pt-2"><span className="text-slate-500 text-[10px] sm:text-xs">Puste / Protocudak:</span> <strong className="font-mono text-rose-500">{towar?.wieczor_butelki_puste || 0} / {towar?.wieczor_butelki_protocudak || 0}</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 text-[10px] sm:text-xs">Próbki / Stłuczki:</span> <strong className="font-mono text-rose-500">{towar?.ilosc_probki || 0} / {towar?.ilosc_prezenty_stluczki || 0}</strong></div>
                              </div>
                            </div>

                            {/* KOLUMNA 2: FINANSE */}
                            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">💰 Finanse i Kasa</h3>
                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <div className="flex justify-between items-center"><span className="text-slate-500">Sztuki wbite:</span> <strong className="font-mono">{finanse?.ilosc_sztuk_wbita_na_kase || 0}</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Kwota brutto:</span> <strong className="font-mono">{finanse?.kwota_brutto_wbita_na_kase || 0} PLN</strong></div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Wpływ SumUp:</span> <strong className="font-mono text-emerald-600">{finanse?.przychod_sumup || 0} PLN</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Wpływ Gotówka:</span> <strong className="font-mono text-emerald-600">{finanse?.przychod_gotowka_pln || 0} PLN</strong></div>
                                {finanse?.przychod_inne_waluty > 0 && (
                                  <div className="flex justify-between items-center"><span className="text-slate-500">Inne waluty:</span> <strong className="font-mono text-amber-500">{finanse?.przychod_inne_waluty}</strong></div>
                                )}
                              </div>
                            </div>

                            {/* KOLUMNA 3: LOGISTYKA */}
                            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">🚗 Logistyka i Czas</h3>
                              <div className="space-y-1.5 text-xs sm:text-sm">
                                <div className="flex justify-between items-center"><span className="text-slate-500">Godz. Handlowe:</span> <strong>{chk.ilosc_godzin_handlowych || 0} h</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Godz. Inne:</span> <strong className="text-slate-400">{chk.ilosc_godzin_niehandlowych || 0} h</strong></div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100"><span className="text-slate-500">Trasa / Nocleg:</span> <strong>{finanse?.trasa || '-'} / {finanse?.nocleg || '-'} PLN</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Kilometry:</span> <strong>{finanse?.kilometry || 0} km</strong></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500">Koszty inne:</span> <strong className="text-rose-500">{finanse?.koszta_inne || 0} PLN</strong></div>
                                {finanse?.koszta_inne_opis && <p className="text-[9px] text-slate-400 italic leading-tight mt-1 truncate">({finanse.koszta_inne_opis})</p>}
                              </div>
                            </div>

                            {/* INWENTARYZACJA SMAKÓW (Zwinięta w scrollowalny box, bez wychodzenia za ekran) */}
                            {chk.check_lista_inwentaryzacja?.length > 0 && (
                              <div className="md:col-span-2 lg:col-span-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">🍯 Inwentaryzacja Smaków</h3>
                                {/* Tutaj grid wymusza, by zawartość nigdy nie wyszła poza karty */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                  {chk.check_lista_inwentaryzacja.map((inv: any) => (
                                    <div key={inv.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] sm:text-xs">
                                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{inv.produkty?.nazwa || 'Nieznany'}</span>
                                      <div className="flex gap-2 font-mono shrink-0">
                                        <span className="bg-white px-1.5 py-0.5 rounded shadow-xs text-slate-500" title="Rano">R:{inv.ilosc_rano || 0}</span>
                                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded shadow-xs font-bold" title="Wieczór">W:{inv.ilosc_wieczor || 0}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* UWAGI */}
                            {chk.uwagi && (
                              <div className="md:col-span-2 lg:col-span-3 mt-1 p-3 sm:p-4 bg-amber-50 rounded-xl flex flex-col border border-amber-100">
                                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider mb-1">📝 Zgłoszone uwagi z raportu</span>
                                <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-wrap italic font-medium">{chk.uwagi}</p>
                              </div>
                            )}

                            {/* ZDJĘCIA */}
                            <div className="md:col-span-2 lg:col-span-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">📸 Załączniki zdjęciowe</h3>
                              
                              {loadingZdjecia ? (
                                <div className="flex gap-2 items-center text-xs font-bold text-slate-400 animate-pulse">
                                  <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span> 
                                  Pobieranie plików...
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                  <button
                                    disabled={!zdjeciaUrl?.stanowisko}
                                    onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(zdjeciaUrl!.stanowisko); }}
                                    className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 ${zdjeciaUrl?.stanowisko ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                                  >
                                    🏕️ <span className="hidden sm:inline">Stoisko</span>
                                  </button>
                                  <button
                                    disabled={!zdjeciaUrl?.sumup}
                                    onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(zdjeciaUrl!.sumup); }}
                                    className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 ${zdjeciaUrl?.sumup ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                                  >
                                    💳 <span className="hidden sm:inline">SumUp</span>
                                  </button>
                                  <button
                                    disabled={!zdjeciaUrl?.kasa}
                                    onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(zdjeciaUrl!.kasa); }}
                                    className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 ${zdjeciaUrl?.kasa ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'}`}
                                  >
                                    🧾 <span className="hidden sm:inline">Kasa</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PRAWA STRONA: MINI-KALENDARZ (Grafik) */}
        {/* Usunięto dla oszczędności znaków. Kalendarz grafiku zostaje tak, jak go miałeś (jest bardzo dobrze zrobiony w gridach!). 
            Wklej tu po prostu tę prawą kolumnę kalendarza <div className="xl:col-span-1 space-y-3">...</div> z oryginalnego pliku ProfilPracownika */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            📅 Grafik pracownika
          </h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <button onClick={() => setWybranyMiesiac(m => m === 1 ? (setWybranyRok(y => y - 1), 12) : m - 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold transition cursor-pointer">&lt;</button>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                {nazwyMiesiecy[wybranyMiesiac - 1]} {wybranyRok}
              </span>
              <button onClick={() => setWybranyMiesiac(m => m === 12 ? (setWybranyRok(y => y + 1), 1) : m + 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold transition cursor-pointer">&gt;</button>
            </div>

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
                    
                    let bgColor = 'bg-slate-200 text-slate-600'; 
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

      {/* POP-UP Z POWIĘKSZONYM ZDJĘCIEM */}
      {powiekszoneZdjecie && (
        <div onClick={() => setPowiekszoneZdjecie(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm cursor-pointer animate-fadeIn">
          <div className="relative max-w-5xl w-full flex items-center justify-center">
            <button 
              onClick={() => setPowiekszoneZdjecie(null)} 
              className="absolute -top-12 right-0 md:-right-8 text-white bg-slate-800 hover:bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl border border-slate-600 transition shadow-xl z-10 cursor-pointer"
            >✕</button>
            
            <img 
              src={powiekszoneZdjecie} 
              alt="Dowód z Jarmarku" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scaleUp border border-slate-700" 
              onClick={(e) => e.stopPropagation()} 
            />
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