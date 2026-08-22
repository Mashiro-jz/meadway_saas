'use client';

import React, { useState } from 'react';
import { useAdminChecklisty } from '../../hooks/useAdminChecklisty';
import { useRouter } from 'next/navigation';

export default function TabChecklisty() {
  const router = useRouter();
  
  // W komponencie zostawiamy tylko "UI State"
  const [rozwinieteFiltry, setRozwinieteFiltry] = useState(false);
  const [powiekszoneZdjecie, setPowiekszoneZdjecie] = useState<string | null>(null);

  const {
    checklisty, loading, 
    page, setPage, pageSize, setPageSize, totalCount,
    szukanaFraza, setSzukanaFraza, 
    szukaneImie, setSzukaneImie,
    szukaneNazwisko, setSzukaneNazwisko,
    filtrRejonu, setFiltrRejonu, dataOd, setDataOd, dataDo, setDataDo,
    sortowanie, setSortowanie, kierunekSortowania, setKierunekSortowania,
    rejony,
    rozszerzonaLista, szczegoly, loadingSzczegoly, toggleLista
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
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Lokalizacja / Punkt:</label>
            <input 
              type="text" placeholder="Nazwa jarmarku..." value={szukanaFraza} 
              onChange={(e) => { setSzukanaFraza(e.target.value); setPage(1); }} 
              className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-indigo-500 focus:ring-1 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon:</label>
            <select 
              value={filtrRejonu} onChange={(e) => { setFiltrRejonu(e.target.value); setPage(1); }} 
              className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-indigo-500 focus:ring-1 transition cursor-pointer"
            >
              <option value="ALL">Wszystkie</option>
              {rejony.map((r: any) => (<option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider truncate">Data Od:</label>
            <input type="date" value={dataOd} onChange={(e) => { setDataOd(e.target.value); setPage(1); }} className="w-full max-w-full appearance-none min-w-0 text-base sm:text-xs px-2 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-1 focus:ring-indigo-500 transition box-border" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider truncate">Data Do:</label>
            <input type="date" value={dataDo} onChange={(e) => { setDataDo(e.target.value); setPage(1); }} className="w-full max-w-full appearance-none min-w-0 text-base sm:text-xs px-2 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:ring-1 focus:ring-indigo-500 transition box-border" />
          </div>
        </div>

        <div className="px-4 pb-3 flex justify-between items-center">
          <button onClick={() => setRozwinieteFiltry(!rozwinieteFiltry)} className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition">
            {rozwinieteFiltry ? '▲ Ukryj zaawansowane' : '▼ Filtry zaawansowane'}
          </button>
          <button onClick={wyczyscFiltry} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider underline">Wyczyść wszystko</button>
        </div>

        {/* ZAAWANSOWANE FILTRY */}
        {rozwinieteFiltry && (
          <div className="p-4 border-t border-slate-200 bg-slate-100/50 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">Wyszukiwanie po pracowniku</div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Imię:</label>
                  <input type="text" placeholder="np. Jan" value={szukaneImie} onChange={(e) => { setSzukaneImie(e.target.value); setPage(1); }} className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white outline-none border-slate-300 focus:border-indigo-500 transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nazwisko:</label>
                  <input type="text" placeholder="np. Kowalski" value={szukaneNazwisko} onChange={(e) => { setSzukaneNazwisko(e.target.value); setPage(1); }} className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white outline-none border-slate-300 focus:border-indigo-500 transition" />
                </div>
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">Parametry wyświetlania</div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sortuj według:</label>
                  <select value={sortowanie} onChange={(e) => setSortowanie(e.target.value)} className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 transition cursor-pointer">
                    <option value="data">Data handlu</option>
                    <option value="butelki_sprzedane">Butelki Sprzedane</option>
                    <option value="sloiki_sprzedane">Słoiki Sprzedane</option>
                    <option value="przychod_suma">Wygenerowany Zarobek</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Kierunek:</label>
                  <button onClick={() => setKierunekSortowania(k => k === 'asc' ? 'desc' : 'asc')} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-700 transition cursor-pointer flex justify-between items-center">
                    <span>{kierunekSortowania === 'asc' ? 'Rosnąco' : 'Malejąco'}</span>
                    <span>{kierunekSortowania === 'asc' ? '⬆️' : '⬇️'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTA RAPORTÓW (GŁÓWNY WIDOK) */}
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
              const isExpanded = rozszerzonaLista === chk.id_checklisty;
              const isLoadingSzczegoly = loadingSzczegoly[chk.id_checklisty];
              const detale = szczegoly[chk.id_checklisty];
              
              return (
                <div key={chk.id_checklisty} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden">
                  
                  {/* KLIKALNY NAGŁÓWEK KARTY */}
                  <div 
                    onClick={() => toggleLista(chk.id_checklisty)} 
                    className={`p-3 sm:p-4 cursor-pointer flex flex-col sm:flex-row justify-between gap-4 transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                      <span className={`transform transition-transform mt-1 shrink-0 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}>▼</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base sm:text-lg font-black text-slate-800 truncate">{chk.nazwa_punktu}</h3>
                          {chk.uwagi && <span className="text-amber-500 text-xs" title="Raport zawiera uwagi">📝</span>}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200 shadow-sm">{new Date(chk.data).toLocaleDateString('pl-PL')}</span>
                          <span className="bg-slate-50 text-slate-500 uppercase tracking-wider font-black px-2 py-0.5 rounded text-[9px] border border-slate-200 truncate max-w-[120px]">📍 {chk.nazwa_rejonu}</span>
                          <span 
                            className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-100 flex items-center gap-1 cursor-pointer hover:bg-indigo-100 transition shadow-sm" 
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/pracownicy/${chk.id_uzytkownika}`); }}
                          >
                            👤 {chk.imie} {chk.nazwisko}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                      <div className="text-right">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Sprzedaż</span>
                        <span className="text-xs sm:text-sm font-medium">🍾 <strong className="text-slate-800">{chk.butelki_sprzedane}</strong> / 🍯 <strong className="text-slate-800">{chk.sloiki_sprzedane}</strong></span>
                      </div>
                      <div className="text-right border-l border-slate-200 pl-4">
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Kasa Suma</span>
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-100 block shadow-sm">{chk.przychod_suma.toFixed(2)} PLN</span>
                      </div>
                    </div>
                  </div>

                  {/* WIDOK ROZSZERZONY (Szczegóły) */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t-2 border-indigo-100 animate-slideDown p-3 sm:p-5">
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* 1. Towar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">📦 Towar (Wszystko)</h3>
                          <div className="space-y-1.5 text-xs font-medium text-slate-600">
                            <div className="flex justify-between"><span>Rano (But. / Słoiki):</span> <strong className="text-slate-800 font-mono">{chk.rano_butelki_pelne || 0} / {chk.rano_sloiki_pelne || 0}</strong></div>
                            <div className="flex justify-between"><span>Dostawa:</span> <strong className="text-indigo-600 font-mono">+{chk.dostawa || 0}</strong></div>
                            <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-50"><span>Wieczór (But. / Słoiki):</span> <strong className="text-slate-800 font-mono">{chk.wieczor_butelki_pelne || 0} / {chk.wieczor_sloiki_pelne || 0}</strong></div>
                            <div className="flex justify-between pt-1.5 text-[11px]"><span className="text-slate-400">Puste / Protocudak:</span> <strong className="text-rose-500 font-mono">{chk.wieczor_butelki_puste || 0} / {chk.wieczor_butelki_protocudak || 0}</strong></div>
                            <div className="flex justify-between text-[11px]"><span className="text-slate-400">Próbki / Stłuczki:</span> <strong className="text-rose-500 font-mono">{chk.ilosc_probki || 0} / {chk.ilosc_prezenty_stluczki || 0}</strong></div>
                          </div>
                        </div>

                        {/* 2. Finanse */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">💰 Finanse i Kasa</h3>
                          <div className="space-y-1.5 text-xs font-medium text-slate-600">
                            <div className="flex justify-between"><span>Sztuki wbite:</span> <strong className="text-slate-800 font-mono">{chk.ilosc_sztuk_wbita_na_kase || 0}</strong></div>
                            <div className="flex justify-between"><span>Kwota brutto:</span> <strong className="text-slate-800 font-mono">{chk.kwota_brutto_wbita_na_kase || 0} PLN</strong></div>
                            <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-50"><span>Wpływ SumUp:</span> <strong className="text-emerald-600 font-mono">{chk.przychod_sumup || 0} PLN</strong></div>
                            <div className="flex justify-between"><span>Wpływ Gotówka:</span> <strong className="text-emerald-600 font-mono">{chk.przychod_gotowka_pln || 0} PLN</strong></div>
                            {chk.przychod_inne_waluty > 0 && (
                              <div className="flex justify-between text-[11px]"><span>Inne waluty:</span> <strong className="text-amber-500 font-mono">{chk.przychod_inne_waluty}</strong></div>
                            )}
                          </div>
                        </div>

                        {/* 3. Logistyka */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">🚗 Logistyka i Czas</h3>
                          <div className="space-y-1.5 text-xs font-medium text-slate-600">
                            <div className="flex justify-between"><span>Godz. Handlowe:</span> <strong className="text-slate-800">{chk.ilosc_godzin_handlowych || 0} h</strong></div>
                            <div className="flex justify-between"><span>Godz. Inne:</span> <strong className="text-slate-400">{chk.ilosc_godzin_niehandlowych || 0} h</strong></div>
                            <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-50"><span>Trasa / Nocleg:</span> <strong className="text-slate-800">{chk.trasa || '-'} / {chk.nocleg || '-'} PLN</strong></div>
                            <div className="flex justify-between"><span>Kilometry:</span> <strong className="text-slate-800">{chk.kilometry || 0} km</strong></div>
                            <div className="flex justify-between"><span>Koszty inne:</span> <strong className="text-rose-500">{chk.koszta_inne || 0} PLN</strong></div>
                            {chk.koszta_inne_opis && <p className="text-[10px] text-slate-400 italic leading-tight truncate">({chk.koszta_inne_opis})</p>}
                          </div>
                        </div>
                      </div>

                      {/* INWENTARYZACJA SMAKÓW (DESIGN WG TWOJEGO SCREENA) */}
                      <div className="mt-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          🍯 Inwentaryzacja Smaków
                        </h3>
                        {isLoadingSzczegoly ? (
                          <div className="flex gap-2 items-center text-xs font-bold text-slate-400 animate-pulse py-4">
                            <span className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span> 
                            Pobieranie stanów magazynowych...
                          </div>
                        ) : (
                          <div className="max-h-[260px] overflow-y-auto pr-1 sm:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {detale?.inwentaryzacja?.map(inv => (
                                <div 
                                  key={inv.id} 
                                  className="flex justify-between items-center bg-[#f8f9fa] p-3 rounded-xl border border-slate-100 transition-colors"
                                >
                                  <span className="text-xs font-extrabold text-slate-800 truncate pr-2">
                                    {inv.produkty?.nazwa || 'Nieznany'}
                                  </span>
                                  <div className="flex gap-1.5 shrink-0">
                                    <span className="text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 text-[10px] font-bold" title="Stan Rano">
                                      R:{inv.ilosc_rano || 0}
                                    </span>
                                    <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1" title="Stan Wieczór">
                                      W:{inv.ilosc_wieczor || 0}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* UWAGI */}
                      {chk.uwagi && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl flex flex-col border border-amber-100">
                          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider mb-1">📝 Zgłoszone uwagi z raportu</span>
                          <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-wrap italic font-medium">{chk.uwagi}</p>
                        </div>
                      )}

                      {/* ZAŁĄCZNIKI */}
                      <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">📸 Załączniki Zdjęciowe</h3>
                        {isLoadingSzczegoly ? (
                          <div className="flex gap-2 items-center text-xs font-bold text-slate-400 animate-pulse py-2">
                            <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></span> Szukanie plików w chmurze...
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            <button disabled={!detale?.zdjecia?.stanowisko} onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(detale.zdjecia.stanowisko); }} className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${detale?.zdjecia?.stanowisko ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}`}>
                              🏕️ Stoisko
                            </button>
                            <button disabled={!detale?.zdjecia?.sumup} onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(detale.zdjecia.sumup); }} className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${detale?.zdjecia?.sumup ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}`}>
                              💳 SumUp
                            </button>
                            <button disabled={!detale?.zdjecia?.kasa} onClick={(e) => { e.stopPropagation(); setPowiekszoneZdjecie(detale.zdjecia.kasa); }} className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${detale?.zdjecia?.kasa ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'}`}>
                              🧾 Kasa
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KONTROLKI PAGINACJI */}
      <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Wierszy:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-slate-50 font-bold text-slate-800 outline-none border-slate-200 transition cursor-pointer shadow-sm">
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page === 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-black disabled:opacity-50 hover:bg-slate-200 transition cursor-pointer shadow-sm active:scale-95">&lt; Poprz.</button>
          <span className="text-xs font-bold text-slate-600 px-2 font-mono">{page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-black disabled:opacity-50 hover:bg-slate-200 transition cursor-pointer shadow-sm active:scale-95">Nast. &gt;</button>
        </div>
      </div>

      {/* POP-UP ZE ZDJĘCIEM */}
      {powiekszoneZdjecie && (
        <div onClick={() => setPowiekszoneZdjecie(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm cursor-pointer animate-fadeIn">
          <div className="relative max-w-5xl w-full flex items-center justify-center">
            <button onClick={() => setPowiekszoneZdjecie(null)} className="absolute -top-12 right-0 md:-right-8 text-white bg-slate-800 hover:bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl border border-slate-600 transition shadow-xl z-10 cursor-pointer">✕</button>
            <img src={powiekszoneZdjecie} alt="Załącznik" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scaleUp border border-slate-700" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

    </div>
  );
}