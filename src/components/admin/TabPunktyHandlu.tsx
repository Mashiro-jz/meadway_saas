'use client';

import React, { useState } from 'react';
import { usePunktyHandlu } from '../../hooks/usePunktyHandlu';

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

  // Stan formularza w modalu
  const [formNazwa, setFormNazwa] = useState('');
  const [formLokalizacja, setFormLokalizacja] = useState('');
  const [formNamiot, setFormNamiot] = useState('');
  const [formGodziny, setFormGodziny] = useState('');
  const [formCena, setFormCena] = useState('');
  const [formRejon, setFormRejon] = useState('');
  const [formUwagi, setFormUwagi] = useState('');

  // Synchronizacja danych przy otwieraniu modala
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

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">Ładowanie punktów handlu...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn">
      
      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-5 text-white flex justify-between items-center border-b border-slate-900">
        <div>
          <h1 className="text-lg font-black tracking-tight">Zarządzanie Punktami Handlu 🎪</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Baza jarmarków, lokalizacji i kosztów stanowisk</p>
        </div>
        <button 
          onClick={() => obsluzOtwarcieModala()} 
          className="bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
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
            className="w-full text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-medium"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Filtruj po rejonie:</label>
          <select 
            value={filtrRejonu} 
            onChange={(e) => setFiltrRejonu(e.target.value)} 
            className="w-full text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
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
              className="flex-1 text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
            >
              <option value="nazwa">Nazwa</option>
              <option value="rejon">Rejon</option>
              <option value="cena_stanowiska">Cena stanowiska</option>
            </select>
            <button 
              onClick={() => setKierunekSortowania((k: string) => k === 'asc' ? 'desc' : 'asc')}
              className="px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Zmień kierunek sortowania"
            >
              {kierunekSortowania === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* LISTA PUNKTÓW */}
      <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
        {punkty.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak punktów handlowych spełniających kryteria.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Nazwa / Adres</th>
                <th className="py-2.5 px-3">Rejon</th>
                <th className="py-2.5 px-3">Godziny</th>
                <th className="py-2.5 px-3 text-right">Cena st.</th>
                <th className="py-2.5 px-3 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {punkty.map((p: any) => (
                <tr key={p.id_lokalizacji} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-3">
                    <p className="font-extrabold text-slate-800">{p.nazwa}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{p.lokalizacja || 'Brak adresu'}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-md text-[10px] border border-slate-200">
                      {p.rejony?.nazwa || 'Brak rejonu'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium whitespace-pre-line max-w-xs">
                    {p.godziny_otwarcia || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    {p.cena_stanowiska ? `${p.cena_stanowiska} PLN` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center space-x-1.5 flex justify-center">
                    <button 
                      onClick={() => obsluzOtwarcieModala(p)} 
                      className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Edytuj
                    </button>
                    <button 
                      onClick={() => usunPunkt(p.id_lokalizacji)} 
                      className="bg-white text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* OKNO MODALNE (FORMULARZ DODAWANIA / EDYCJI) */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] cursor-default animate-slideUp">
            
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800">
                {edytowanyPunkt ? 'Edytuj punkt handlu' : 'Nowy punkt handlu'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
              {/* DWUKOLUMNOWY UKŁAD (GRID) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* LEWA KOLUMNA: Dane podstawowe i finansowe */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwa wydarzenia / jarmarku *</label>
                    <input type="text" required value={formNazwa} onChange={(e) => setFormNazwa(e.target.value)} placeholder="np. Jarmark Bożonarodzeniowy" className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon *</label>
                    <select value={formRejon} onChange={(e) => setFormRejon(e.target.value)} required className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer">
                      {rejony.map((r: any) => (
                        <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Adres jarmarku</label>
                    <input type="text" value={formLokalizacja} onChange={(e) => setFormLokalizacja(e.target.value)} placeholder="np. Rynek Główny 5, Wrocław 58-099" className="w-full text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Lokalizacja namiotu / Link do Google Maps</label>
                    <input type="text" value={formNamiot} onChange={(e) => setFormNamiot(e.target.value)} placeholder="np. https://maps.google.com/... lub Sektor B" className="w-full text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Cena stanowiska (PLN)</label>
                    <input type="number" step="0.01" value={formCena} onChange={(e) => setFormCena(e.target.value)} placeholder="np. 1500" className="w-full text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>
                </div>

                {/* PRAWA KOLUMNA: Godziny (textarea) i duze pole Uwagi */}
                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Godziny otwarcia</label>
                    <textarea 
                      rows={4} 
                      value={formGodziny} 
                      onChange={(e) => setFormGodziny(e.target.value)} 
                      placeholder={"Pn-Pt: 10:00 - 20:00\nSob-Nd: 09:00 - 21:00"} 
                      className="w-full text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition resize-none font-mono" 
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Wskazówki i uwagi dla ekipy</label>
                    <textarea 
                      rows={6} 
                      value={formUwagi} 
                      onChange={(e) => setFormUwagi(e.target.value)} 
                      placeholder="Wpisz pełne instrukcje logistyczne, kontakt do organizatora, zasady wjazdu itp..." 
                      className="w-full flex-1 text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition resize-none leading-relaxed" 
                    />
                  </div>
                </div>

              </div>

              {/* PRZYCISKI AKCJI */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz punkt</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}