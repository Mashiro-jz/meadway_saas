'use client';

import React, { useState } from 'react';
import { useRejony } from '../../hooks/useRejony';

export default function TabRejony() {
  const {
    rejony, koordynatorzy, loading,
    szukanaFraza, setSzukanaFraza,
    isModalOpen, setIsModalOpen,
    edytowanyRejon,
    otworzModalNowy, otworzModalEdycja,
    zapiszRejon, usunRejon
  } = useRejony();

  const [formNazwa, setFormNazwa] = useState('');
  const [formKoordynator, setFormKoordynator] = useState('');

  const obsluzOtwarcieModala = (rejon: any = null) => {
    if (rejon) {
      otworzModalEdycja(rejon);
      setFormNazwa(rejon.nazwa || '');
      setFormKoordynator(rejon.id_koordynatora ? String(rejon.id_koordynatora) : '');
    } else {
      otworzModalNowy();
      setFormNazwa('');
      setFormKoordynator('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    zapiszRejon({
      nazwa: formNazwa,
      id_koordynatora: formKoordynator ? parseInt(formKoordynator) : null,
    }, edytowanyRejon?.id_rejonu);
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">Ładowanie rejonów...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn">
      
      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-5 text-white flex justify-between items-center border-b border-slate-900">
        <div>
          <h1 className="text-lg font-black tracking-tight">Zarządzanie Rejonami 🌍</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Podział terytorialny i przypisani koordynatorzy</p>
        </div>
        <button 
          onClick={() => obsluzOtwarcieModala()} 
          className="bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          + Dodaj rejon
        </button>
      </div>

      {/* WYSZUKIWARKA */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Szukaj rejonu:</label>
        <input 
          type="text" 
          placeholder="Nazwa rejonu..." 
          value={szukanaFraza} 
          onChange={(e) => setSzukanaFraza(e.target.value)} 
          className="w-full sm:text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-medium"
        />
      </div>

      {/* LISTA REJONÓW */}
      <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
        {rejony.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak rejonów w bazie.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Nazwa Rejonu</th>
                <th className="py-2.5 px-3">Główny Koordynator</th>
                <th className="py-2.5 px-3 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rejony.map((r: any) => (
                <tr key={r.id_rejonu} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-400">#{r.id_rejonu}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-800">{r.nazwa}</td>
                  <td className="py-3 px-3">
                    {r.uzytkownicy ? (
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px] border border-indigo-100">
                        {r.uzytkownicy.imie} {r.uzytkownicy.nazwisko}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">- Brak koordynatora -</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center space-x-1.5 whitespace-nowrap">
                    <button 
                      onClick={() => obsluzOtwarcieModala(r)} 
                      className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Edytuj
                    </button>
                    {/* Zabezpieczenie przed usunięciem skoczków, jeśli to ID=2 (zależnie od Twojej logiki) */}
                    <button 
                      onClick={() => usunRejon(r.id_rejonu)} 
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

      {/* OKNO MODALNE */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col cursor-default animate-slideUp">
            
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800">
                {edytowanyRejon ? 'Edytuj rejon' : 'Nowy rejon'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwa Rejonu *</label>
                <input type="text" required value={formNazwa} onChange={(e) => setFormNazwa(e.target.value)} placeholder="np. Europa, Polska Południowa..." className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Główny Koordynator</label>
                <select value={formKoordynator} onChange={(e) => setFormKoordynator(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer">
                  <option value="">-- Brak / Pozostaw puste --</option>
                  {koordynatorzy.map((k: any) => (
                    <option key={k.id_uzytkownika} value={k.id_uzytkownika}>
                      {k.imie} {k.nazwisko} ({k.rola})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
                  Wskazanie koordynatora powiąże go z pracownikami tego rejonu.
                </p>
              </div>

              <div className="pt-5 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz rejon</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}