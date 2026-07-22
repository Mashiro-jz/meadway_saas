import React, { useState } from 'react';

export default function TabAdmin(props: any) {
  const {
    widoczneJarmarki, wybranyJarmark, setWybranyJarmark, dataOd, setDataOd, dataDo, setDataDo,
    szukanaFraza, setSzukanaFraza, przypisaniPracownicy, usunPrzypisaniePracownika,
    pewniacy, doObgadania, resztaPracownikow, przypiszPracownika,
    userProfil, listaRejonow, filtrRejonu, setFiltrRejonu
  } = props;

  const [skopiowano, setSkopiowano] = useState(false);

  const skopiujDoSchowka = (tekst: string) => {
    navigator.clipboard.writeText(tekst);
    setSkopiowano(true);
    setTimeout(() => setSkopiowano(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8 animate-fadeIn">

      {/* NAGŁÓWEK */}
      <div className="bg-indigo-700 p-4 text-white text-center">
        <h1 className="text-lg font-black">Panel Zarządzania Obsadą Jarmarków 💼</h1>
        <p className="text-[11px] text-indigo-200">System Logistyczny • Filtrowanie Pracowników i Dat Handlu</p>
      </div>

      {/* FILTR REJONU - POKAZYWANY TYLKO ADMINOWI */}
      {userProfil?.rola === 'admin' && (
        <div className="bg-indigo-50 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">🌍 Podgląd Rejonu</span>
          <select
            value={filtrRejonu}
            onChange={(e) => setFiltrRejonu(e.target.value)}
            className="text-xs px-2 py-1.5 border rounded-lg font-bold text-indigo-900 outline-none bg-white border-indigo-200 shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Wszystkie Rejony (Global)</option>
            {listaRejonow.map((r: any) => (
              <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
            ))}
          </select>
        </div>
      )}

      {/* KONTROLKI WYSZUKIWANIA */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">A. Wybierz wydarzenie:</label>
          <select value={wybranyJarmark?.id_lokalizacji || ''} onChange={(e) => setWybranyJarmark(widoczneJarmarki.find((j: any) => j.id_lokalizacji === parseInt(e.target.value)))} className="w-full text-xs px-3 py-2 border rounded-xl font-bold text-slate-800 outline-none bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500">
            {widoczneJarmarki.map((j: any) => (<option key={j.id_lokalizacji} value={j.id_lokalizacji}>{j.nazwa} ({j.lokalizacja})</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">B. Data handlu od:</label>
            <input type="date" value={dataOd} onChange={(e) => setDataOd(e.target.value)} className="w-full text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">C. Data handlu do:</label>
            <input type="date" value={dataDo} onChange={(e) => setDataDo(e.target.value)} className="w-full text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">D. Wyszukaj sprzedawcę:</label>
          <input type="text" placeholder="Wpisz imię lub nazwisko pracownika..." value={szukanaFraza} onChange={(e) => setSzukanaFraza(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">

        {/* GRUPA 1: ZATRUDNIENI */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">🔒 Aktualna Obsada ({przypisaniPracownicy?.length || 0})</h3>
          {(!przypisaniPracownicy || przypisaniPracownicy.length === 0) ? (<p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed">Brak przypisanych sprzedawców.</p>) : (
            <div className="grid grid-cols-1 gap-1.5">{przypisaniPracownicy.map((p: any) => (
              <div key={p.id_uzytkownika} className="flex justify-between items-center bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-900">
                <span className="truncate flex-1">👤 {p.imie} {p.nazwisko} <span className="text-[10px] text-indigo-400 font-medium ml-1">({p.rejony?.nazwa || 'Brak'})</span></span>
                <button type="button" onClick={() => usunPrzypisaniePracownika(p.id_uzytkownika)} className="text-[10px] bg-white border border-rose-300 text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 font-black transition cursor-pointer">Zdejmij</button>
              </div>
            ))}</div>
          )}
        </div>

        {/* GRUPA 2: PEWNIACY */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">🟢 Pewniacy - Dostępni ({pewniacy?.length || 0})</h3>
          {(!pewniacy || pewniacy.length === 0) ? (<p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed">Brak w pełni wolnych osób.</p>) : (
            <div className="grid grid-cols-1 gap-1.5">{pewniacy.map((p: any) => (
              <div key={p.id_uzytkownika} className="flex justify-between items-center bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-800">
                <span className="truncate flex-1">👤 {p.imie} {p.nazwisko} <span className="text-[10px] text-slate-400 font-medium ml-1">({p.rejony?.nazwa || 'Brak'})</span></span>
                <button type="button" onClick={() => przypiszPracownika(p.id_uzytkownika)} className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 font-black transition shadow-xs cursor-pointer">Wpisz</button>
              </div>
            ))}</div>
          )}
        </div>

        {/* GRUPA 3: DO OBGADANIA */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">📞 Do Obgadania (+/- 2 dni) ({doObgadania?.length || 0})</h3>
          {(!doObgadania || doObgadania.length === 0) ? (<p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed">Brak osób.</p>) : (
            <div className="grid grid-cols-1 gap-1.5">{doObgadania.map((p: any) => (
              <div key={p.id_uzytkownika} className="flex justify-between items-center bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 text-xs font-bold text-slate-800">
                <div className="flex flex-col truncate flex-1 pr-2">
                  <span className="truncate">👤 {p.imie} {p.nazwisko} <span className="text-[10px] text-slate-400 font-medium ml-1">({p.rejony?.nazwa || 'Brak'})</span></span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">Tel: {p.numer_telefonu || 'Brak'}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {p.numer_telefonu && (<button type="button" onClick={() => skopiujDoSchowka(p.numer_telefonu)} className="text-[10px] bg-white border px-2 py-1 rounded-lg hover:bg-slate-100 font-bold text-slate-600 cursor-pointer">{skopiowano ? '✓' : '📋'}</button>)}
                  <button type="button" onClick={() => przypiszPracownika(p.id_uzytkownika)} className="text-[10px] bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600 font-black transition shadow-xs cursor-pointer">Wpisz</button>
                </div>
              </div>
            ))}</div>
          )}
        </div>

        {/* GRUPA 4: RESZTA LUDZI - TU WYMUSZAMY Z PARAMETREM 'TRUE' */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">⚪ Pozostali (Brak danych / Niedostępni) ({resztaPracownikow?.length || 0})</h3>
          {(!resztaPracownikow || resztaPracownikow.length === 0) ? (<p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed">Brak innych pracowników.</p>) : (
            <div className="grid grid-cols-1 gap-1.5">{resztaPracownikow.map((p: any) => (
              <div key={p.id_uzytkownika} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <div className="flex flex-col truncate flex-1">
                  <span className="truncate">👤 {p.imie} {p.nazwisko} <span className="text-[10px] text-slate-400 font-medium ml-1">({p.rejony?.nazwa || 'Brak'})</span></span>
                </div>
                {/* ZMIANA: Dodano 'true' jako drugi argument funkcji */}
                <button type="button" onClick={() => przypiszPracownika(p.id_uzytkownika, true)} className="text-[10px] bg-slate-800 text-white px-2.5 py-1 rounded-lg hover:bg-slate-900 font-black transition shadow-xs cursor-pointer shrink-0">Wymuś przypisanie</button>
              </div>
            ))}</div>
          )}
        </div>

      </div>
    </div>
  );
}