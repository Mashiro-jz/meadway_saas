'use client';

import React, { useState } from 'react';
import { useAdminChecklisty } from '../../hooks/useAdminChecklisty';
import { useRouter } from 'next/navigation';

export default function TabChecklisty() {
  const router = useRouter();
  
  // Sterowanie panelem filtrów zaawansowanych
  const [rozwinieteFiltry, setRozwinieteFiltry] = useState(false);

  const {
    checklisty, loading, 
    page, setPage, pageSize, setPageSize, totalCount,
    szukanaFraza, setSzukanaFraza, 
    szukaneImie, setSzukaneImie,
    szukaneNazwisko, setSzukaneNazwisko,
    filtrRejonu, setFiltrRejonu, dataOd, setDataOd, dataDo, setDataDo,
    sortowanie, setSortowanie, kierunekSortowania, setKierunekSortowania,
    rejony
  } = useAdminChecklisty();

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const wyczyscFiltry = () => {
    setSzukanaFraza('');
    setSzukaneImie('');
    setSzukaneNazwisko('');
    setFiltrRejonu('ALL');
    setDataOd('');
    setDataDo('');
    setSortowanie('data');
    setKierunekSortowania('desc');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn w-full">
      
      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-lg font-black tracking-tight">Baza Raportów i Checklist 📑</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Archiwum inwentaryzacji z całego systemu</p>
        </div>
        <div className="bg-slate-700/50 px-4 py-2 rounded-xl text-xs font-mono font-bold text-indigo-300 shadow-inner">
          W bazie: <span className="text-white">{totalCount}</span>
        </div>
      </div>

      {/* PANEL FILTRÓW */}
      <div className="bg-slate-50 border-b border-slate-200">
        
        {/* PODSTAWOWE FILTRY (Zawsze widoczne) */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Lokalizacja / Punkt:</label>
            <input 
              type="text" 
              placeholder="Nazwa jarmarku..." 
              value={szukanaFraza} 
              onChange={(e) => { setSzukanaFraza(e.target.value); setPage(1); }} 
              className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-indigo-500 focus:ring-1 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon:</label>
            <select 
              value={filtrRejonu} 
              onChange={(e) => { setFiltrRejonu(e.target.value); setPage(1); }} 
              className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-indigo-500 focus:ring-1 transition cursor-pointer"
            >
              <option value="ALL">Wszystkie</option>
              {rejony.map((r: any) => (
                <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider truncate">Data Od:</label>
            <input 
              type="date" 
              value={dataOd} 
              onChange={(e) => { setDataOd(e.target.value); setPage(1); }} 
              className="w-full max-w-full appearance-none min-w-0 text-base sm:text-xs px-2 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-1 focus:ring-indigo-500 transition box-border" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider truncate">Data Do:</label>
            <input 
              type="date" 
              value={dataDo} 
              onChange={(e) => { setDataDo(e.target.value); setPage(1); }} 
              className="w-full max-w-full appearance-none min-w-0 text-base sm:text-xs px-2 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-1 focus:ring-indigo-500 transition box-border" 
            />
          </div>
        </div>

        {/* PRZYCISK ROZWIJANIA */}
        <div className="px-4 pb-3 flex justify-between items-center">
          <button 
            onClick={() => setRozwinieteFiltry(!rozwinieteFiltry)}
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition"
          >
            {rozwinieteFiltry ? '▲ Ukryj zaawansowane' : '▼ Filtry zaawansowane'}
          </button>
          
          {/* Szybki przycisk czyszczenia na wypadek, gdyby filtry były zwinięte */}
          <button onClick={wyczyscFiltry} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider underline">
            Wyczyść wszystko
          </button>
        </div>

        {/* ZAAWANSOWANE FILTRY (Rozwijane) */}
        {rozwinieteFiltry && (
          <div className="p-4 border-t border-slate-200 bg-slate-100/50 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Sekcja Pracownika */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                  Wyszukiwanie po pracowniku
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Imię:</label>
                  <input 
                    type="text" 
                    placeholder="np. Jan" 
                    value={szukaneImie} 
                    onChange={(e) => { setSzukaneImie(e.target.value); setPage(1); }} 
                    className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white outline-none border-slate-300 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nazwisko:</label>
                  <input 
                    type="text" 
                    placeholder="np. Kowalski" 
                    value={szukaneNazwisko} 
                    onChange={(e) => { setSzukaneNazwisko(e.target.value); setPage(1); }} 
                    className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white outline-none border-slate-300 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Sekcja Sortowania */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">
                  Parametry wyświetlania
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sortuj według:</label>
                  <select 
                    value={sortowanie} 
                    onChange={(e) => setSortowanie(e.target.value)} 
                    className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 transition cursor-pointer"
                  >
                    <option value="data">Data handlu</option>
                    {/* Tutaj łatwo w przyszłości dodasz np. przychód_suma */}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Kierunek:</label>
                  <button 
                    onClick={() => setKierunekSortowania(k => k === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-700 transition cursor-pointer flex justify-between items-center"
                  >
                    <span>{kierunekSortowania === 'asc' ? 'Od najstarszych' : 'Od najnowszych'}</span>
                    <span>{kierunekSortowania === 'asc' ? '⬆️' : '⬇️'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* LISTA RAPORTÓW */}
      <div className="p-3 sm:p-5 bg-slate-50/50 min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10 rounded-b-2xl">
            <span className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></span>
          </div>
        )}

        {checklisty.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-4xl opacity-50 mb-2 block">📭</span>
            <p className="text-sm font-bold text-slate-500">Brak raportów spełniających kryteria.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {checklisty.map((chk: any) => {
              const towar = Array.isArray(chk.check_lista_towar) ? chk.check_lista_towar[0] : chk.check_lista_towar;
              const finanse = Array.isArray(chk.check_lista_finanse) ? chk.check_lista_finanse[0] : chk.check_lista_finanse;
              const uzytkownik = chk.uzytkownicy;
              const sumaDochodu = ((finanse?.przychod_gotowka_pln || 0) + (finanse?.przychod_sumup || 0)).toFixed(2);
              
              return (
                <div 
                  key={chk.id_checklisty} 
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 flex flex-col sm:flex-row justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base sm:text-lg font-black text-slate-800 truncate">
                        {chk.punkty_handlu?.nazwa || 'Nieznany Punkt'}
                      </h3>
                      {chk.uwagi && <span className="text-amber-500 text-xs" title="Raport zawiera uwagi">📝</span>}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200 shadow-sm">
                        {new Date(chk.data).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="bg-slate-50 text-slate-500 uppercase tracking-wider font-black px-2 py-0.5 rounded text-[9px] border border-slate-200 truncate max-w-[120px]">
                        📍 {chk.punkty_handlu?.rejony?.nazwa || 'Brak'}
                      </span>
                      <span 
                        className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-100 flex items-center gap-1 cursor-pointer hover:bg-indigo-100 transition shadow-sm" 
                        onClick={() => router.push(`/admin/pracownicy/${uzytkownik?.id_uzytkownika}`)}
                        title="Przejdź do profilu"
                      >
                        👤 {uzytkownik?.imie} {uzytkownik?.nazwisko}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                    <div className="text-right">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Sprzedaż</span>
                      <span className="text-xs sm:text-sm font-medium">🍾 <strong className="text-slate-800">{towar?.butelki_sprzedane || 0}</strong> / 🍯 <strong className="text-slate-800">{towar?.sloiki_sprzedane || 0}</strong></span>
                    </div>
                    
                    <div className="text-right border-l border-slate-200 pl-4">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Kasa Suma</span>
                      <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-100 block shadow-sm">
                        {sumaDochodu} PLN
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KONTROLKI PAGINACJI SERVER-SIDE */}
      <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Wierszy:</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-slate-50 font-bold text-slate-800 outline-none border-slate-200 transition cursor-pointer shadow-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1 || loading} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition cursor-pointer shadow-sm active:scale-95"
          >
            &lt; Poprz.
          </button>
          
          <span className="text-xs font-bold text-slate-600 px-2 font-mono">
            {page} / {totalPages}
          </span>
          
          <button 
            disabled={page >= totalPages || loading} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition cursor-pointer shadow-sm active:scale-95"
          >
            Nast. &gt;
          </button>
        </div>

      </div>

    </div>
  );
}