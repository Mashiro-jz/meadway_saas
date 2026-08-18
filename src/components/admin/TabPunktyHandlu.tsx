'use client';

import React, { useState } from 'react';
import { usePunktyHandlu } from '../../hooks/usePunktyHandlu';
import { adminService } from '../../services/adminService';

// NOWA FUNKCJA: Prosty parser dla uwag (Nowe linie, pogrubienia i kursywy)
const formatujTekst = (tekst: string) => {
  if (!tekst) return null;
  
  // Rozdzielamy tekst szukając fraz otoczonych podwójnymi gwiazdkami **tekst**
  const czesci = tekst.split(/(\*\*.*?\*\*)/g);
  
  return czesci.map((czesc, index) => {
    // Jeśli fragment zaczyna się i kończy na **, renderujemy jako pogrubienie
    if (czesc.startsWith('**') && czesc.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-amber-950">
          {czesc.slice(2, -2)}
        </strong>
      );
    }
    // Zwykły tekst
    return <React.Fragment key={index}>{czesc}</React.Fragment>;
  });
};

export default function TabPunktyHandlu() {
  const {
    punkty, rejony, loading,
    szukanaFraza, setSzukanaFraza,
    filtrRejonu, setFiltrRejonu,
    sortowanie, setSortowanie,
    kierunekSortowania, setKierunekSortowania,
    isModalOpen, setIsModalOpen,
    edytowanyPunkt,
    otworzModalNowy, otworzModalEdycja,
    zapiszPunkt, usunPunkt
  } = usePunktyHandlu();

  const [formNazwa, setFormNazwa] = useState('');
  const [formLokalizacja, setFormLokalizacja] = useState('');
  const [formNamiot, setFormNamiot] = useState('');
  const [formGodziny, setFormGodziny] = useState('');
  const [formCena, setFormCena] = useState('');
  const [formRejon, setFormRejon] = useState('');
  const [formUwagi, setFormUwagi] = useState('');

  const [rozwiniecia, setRozwiniecia] = useState<number[]>([]);
  const [ostatnieRaporty, setOstatnieRaporty] = useState<Record<number, any>>({});
  const [loadingRaport, setLoadingRaport] = useState<Record<number, boolean>>({});

  const obsluzOtwarcieModala = (punkt: any = null) => {
    if (punkt) {
      otworzModalEdycja(punkt);
      setFormNazwa(punkt.nazwa || '');
      setFormLokalizacja(punkt.lokalizacja || '');
      setFormNamiot(punkt.lokalizacja_namiotu || '');
      setFormGodziny(punkt.godziny_otwarcia || '');
      setFormCena(punkt.cena_stanowiska || '');
      setFormRejon(punkt.id_rejonu || (rejony[0]?.id_rejonu || ''));
      setFormUwagi(punkt.uwagi || '');
    } else {
      otworzModalNowy();
      setFormNazwa('');
      setFormLokalizacja('');
      setFormNamiot('');
      setFormGodziny('');
      setFormCena('');
      setFormRejon(rejony[0]?.id_rejonu || '');
      setFormUwagi('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    zapiszPunkt({
      nazwa: formNazwa,
      lokalizacja: formLokalizacja,
      lokalizacja_namiotu: formNamiot,
      godziny_otwarcia: formGodziny,
      cena_stanowiska: formCena ? parseFloat(formCena) : null,
      id_rejonu: formRejon ? parseInt(formRejon) : null,
      uwagi: formUwagi
    }, edytowanyPunkt?.id_lokalizacji);
  };

  const toggleRozwiniecie = async (idLokalizacji: number) => {
    const isExpanding = !rozwiniecia.includes(idLokalizacji);
    setRozwiniecia(prev =>
      isExpanding ? [...prev, idLokalizacji] : prev.filter(id => id !== idLokalizacji)
    );

    if (isExpanding && !ostatnieRaporty[idLokalizacji]) {
      setLoadingRaport(prev => ({ ...prev, [idLokalizacji]: true }));
      try {
        const raport = await adminService.getNajnowszaChecklistaDlaPunktu(idLokalizacji);
        setOstatnieRaporty(prev => ({ ...prev, [idLokalizacji]: raport || 'BRAK' }));
      } catch (error) {
        console.error("Błąd pobierania raportu", error);
      } finally {
        setLoadingRaport(prev => ({ ...prev, [idLokalizacji]: false }));
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">Ładowanie punktów handlu...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn w-full">
      
      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-lg font-black tracking-tight">Zarządzanie Punktami Handlu 🎪</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Baza jarmarków, lokalizacji i kosztów stanowisk</p>
        </div>
        <button 
          onClick={() => obsluzOtwarcieModala()} 
          className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          + Dodaj nowy punkt
        </button>
      </div>

      {/* FILTRY I WYSZUKIWARKA */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Szukaj punktu:</label>
          <input 
            type="text" 
            placeholder="Nazwa lub adres..." 
            value={szukanaFraza} 
            onChange={(e) => setSzukanaFraza(e.target.value)} 
            className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-medium"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Filtruj po rejonie:</label>
          <select 
            value={filtrRejonu} 
            onChange={(e) => setFiltrRejonu(e.target.value)} 
            className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
          >
            <option value="ALL">Wszystkie rejony</option>
            {rejony.map((r: any) => (
              <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Sortowanie:</label>
          <div className="flex gap-1">
            <select 
              value={sortowanie} 
              onChange={(e) => setSortowanie(e.target.value as any)} 
              className="flex-1 text-base sm:text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
            >
              <option value="nazwa">Nazwa</option>
              <option value="rejon">Rejon</option>
              <option value="cena_stanowiska">Cena stanowiska</option>
            </select>
            <button 
              onClick={() => setKierunekSortowania((k: string) => k === 'asc' ? 'desc' : 'asc')}
              className="px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
              title="Zmień kierunek sortowania"
            >
              {kierunekSortowania === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* ZMODYFIKOWANA LISTA PUNKTÓW (Card View dla Mobile) */}
      <div className="p-2 sm:p-4 max-h-[65vh] overflow-y-auto">
        {punkty.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak punktów handlowych spełniających kryteria.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {punkty.map((p: any) => {
              const isExpanded = rozwiniecia.includes(p.id_lokalizacji);
              const raport = ostatnieRaporty[p.id_lokalizacji];
              const isLoading = loadingRaport[p.id_lokalizacji];

              return (
                <div key={p.id_lokalizacji} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* WIDOK ZWIJANY KARTY (Card Header) */}
                  <div 
                    onClick={() => toggleRozwiniecie(p.id_lokalizacji)}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                      <span className={`transform transition-transform text-[10px] mt-1 shrink-0 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'}`}>▼</span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-800 truncate">{p.nazwa}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{p.lokalizacja || 'Brak adresu'}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[9px] border border-slate-200 uppercase tracking-wider">
                            {p.rejony?.nazwa || 'Brak rejonu'}
                          </span>
                          {p.cena_stanowiska && (
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[9px] border border-emerald-100 uppercase tracking-wider">
                              💰 {p.cena_stanowiska} PLN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:shrink-0 justify-end mt-2 sm:mt-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); obsluzOtwarcieModala(p); }} 
                        className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                      >
                        Edytuj
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); usunPunkt(p.id_lokalizacji); }} 
                        className="bg-white text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>

                  {/* WIDOK ROZWINIĘTY */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 animate-slideDown">
                      {/* Sekcja Informacyjna */}
                      <div className="p-4 px-4 sm:px-6 border-b border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Szczegóły operacyjne</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Godziny otwarcia:</span>
                            {/* ZMIANA: whitespace-pre-wrap zachowuje entery */}
                            <p className="text-xs text-slate-700 font-medium bg-white p-3 border border-slate-200 rounded-lg shadow-sm whitespace-pre-wrap leading-relaxed">
                              {p.godziny_otwarcia || 'Brak danych o godzinach'}
                            </p>
                          </div>
                          {p.uwagi && (
                            <div>
                              <span className="block text-[9px] text-amber-500 font-bold uppercase mb-1">Wskazówki logistyczne:</span>
                              {/* ZMIANA: Usunięto 'italic', dodano funkcję formatujTekst i whitespace-pre-wrap */}
                              <div className="text-xs text-amber-900 font-medium bg-amber-50 p-3 border border-amber-200 rounded-lg shadow-sm whitespace-pre-wrap leading-relaxed">
                                {formatujTekst(p.uwagi)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sekcja Raportu */}
                      <div className="p-4 px-4 sm:px-6 border-l-4 border-indigo-500 shadow-inner">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-3">Ostatnia inwentaryzacja z tego punktu</h4>
                        
                        {isLoading ? (
                          <div className="flex gap-2 items-center text-xs font-bold text-slate-400 animate-pulse my-4">
                            <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span> 
                            Pobieranie historii...
                          </div>
                        ) : raport === 'BRAK' ? (
                          <div className="text-slate-500 italic text-xs mb-2">Brak jakichkolwiek zaraportowanych dni handlowych na tym stoisku.</div>
                        ) : raport && (
                          <div className="space-y-4">
                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                              <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">Data: {new Date(raport.data).toLocaleDateString('pl-PL')}</span>
                              <span>Handlował/a: <strong>{raport.uzytkownicy?.imie} {raport.uzytkownicy?.nazwisko}</strong></span>
                            </div>
                            
                            {raport.check_lista_inwentaryzacja?.length > 0 ? (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-full sm:max-w-lg overflow-x-auto">
                                <table className="w-full text-left min-w-[300px]">
                                  <thead className="bg-slate-100">
                                    <tr className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                      <th className="px-3 py-2 border-b border-slate-200">Smak Miodu</th>
                                      <th className="px-3 py-2 border-b border-slate-200 text-center">Rano</th>
                                      <th className="px-3 py-2 border-b border-slate-200 text-center">Wieczór</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {raport.check_lista_inwentaryzacja.map((inv: any) => (
                                      <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-1.5 font-semibold text-slate-700 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px]">{inv.produkty?.nazwa || 'Nieznany'}</td>
                                        <td className="px-3 py-1.5 text-center font-mono text-slate-800 bg-slate-50/50 text-xs sm:text-sm">{inv.ilosc_rano || 0}</td>
                                        <td className="px-3 py-1.5 text-center font-mono text-indigo-700 bg-indigo-50/50 font-bold text-xs sm:text-sm">{inv.ilosc_wieczor || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic">Brak zapisanych smaków (raport sprzed aktualizacji systemu).</div>
                            )}
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

      {/* OKNO MODALNE (FORMULARZ DODAWANIA / EDYCJI) */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] cursor-default animate-slideUp">
            
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800">
                {edytowanyPunkt ? 'Edytuj punkt handlu' : 'Nowy punkt handlu'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwa wydarzenia / jarmarku *</label>
                    <input type="text" required value={formNazwa} onChange={(e) => setFormNazwa(e.target.value)} placeholder="np. Jarmark Bożonarodzeniowy" className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon *</label>
                    <select value={formRejon} onChange={(e) => setFormRejon(e.target.value)} required className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer">
                      {rejony.map((r: any) => (
                        <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Adres jarmarku</label>
                    <input type="text" value={formLokalizacja} onChange={(e) => setFormLokalizacja(e.target.value)} placeholder="np. Rynek Główny 5, Wrocław" className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Link do Google Maps / Namiot</label>
                    <input type="text" value={formNamiot} onChange={(e) => setFormNamiot(e.target.value)} placeholder="np. https://maps.google.com/..." className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Cena stanowiska (PLN)</label>
                    <input type="number" step="0.01" value={formCena} onChange={(e) => setFormCena(e.target.value)} placeholder="np. 1500" className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Godziny otwarcia</label>
                    <textarea 
                      rows={4} 
                      value={formGodziny} 
                      onChange={(e) => setFormGodziny(e.target.value)} 
                      placeholder={"Pn-Pt: 10:00 - 20:00\nSob-Nd: 09:00 - 21:00"} 
                      className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition resize-none font-mono" 
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Wskazówki i uwagi dla ekipy</label>
                    <textarea 
                      rows={5} 
                      value={formUwagi} 
                      onChange={(e) => setFormUwagi(e.target.value)} 
                      placeholder="Wpisz pełne instrukcje logistyczne, kontakt do organizatora, zasady wjazdu itp..." 
                      className="w-full flex-1 text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition resize-none leading-relaxed" 
                    />
                    {/* PODPOWIEDŹ DLA UŻYTKOWNIKA */}
                    <p className="text-[9px] text-slate-400 mt-1.5 font-medium">
                      💡 Użyj <strong className="text-slate-600">**tekst**</strong> aby pogrubić ważne informacje. Nowe linie (Enter) utworzą się automatycznie.
                    </p>
                  </div>
                </div>

              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 sm:py-4 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 sm:py-4 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz punkt</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}