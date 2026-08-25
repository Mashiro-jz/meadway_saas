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
      <div className="bg-slate-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-lg font-black tracking-tight">Zarządzanie Rejonami 🌍</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Podział terytorialny i przypisani koordynatorzy</p>
        </div>
        <button
          onClick={() => obsluzOtwarcieModala()}
          className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
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
          /* ZMIANA: Zabezpieczenie przed zoomem na iOS */
          className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-medium"
        />
      </div>

      {/* LISTA REJONÓW - RESPONSYWNY WIDOK */}
      <div className="p-2 sm:p-4 max-h-[60vh] overflow-y-auto">
        {rejony.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak rejonów w bazie.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rejony.map((r: any) => (
              <div
                key={r.id_rejonu}
                className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6"
              >
                {/* Informacje o rejonie */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1 overflow-hidden">

                  {/* ID i Nazwa */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-300 text-[10px] sm:text-xs bg-slate-50 px-2 py-1 rounded">#{r.id_rejonu}</span>
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base truncate">{r.nazwa}</span>
                  </div>

                  {/* Koordynator */}
                  <div className="flex items-center sm:ml-auto">
                    {r.uzytkownicy ? (
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md text-[10px] sm:text-[11px] border border-indigo-100 truncate max-w-[200px]">
                        👤 {r.uzytkownicy.imie} {r.uzytkownicy.nazwisko}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px] sm:text-[11px]">- Brak koordynatora -</span>
                    )}
                  </div>

                </div>

                {/* Przyciski Akcji */}
                <div className="flex gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <button
                    onClick={() => obsluzOtwarcieModala(r)}
                    className="flex-1 sm:flex-none bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider text-center"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => usunRejon(r.id_rejonu)}
                    className="flex-1 sm:flex-none bg-white text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider text-center"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwa Rejonu *</label>
                <input
                  type="text"
                  required
                  value={formNazwa}
                  onChange={(e) => setFormNazwa(e.target.value)}
                  placeholder="np. Europa, Polska Południowa..."
                  /* ZMIANA: Zabezpieczenie przed zoomem na iOS */
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Główny Koordynator</label>
                <select
                  value={formKoordynator}
                  onChange={(e) => setFormKoordynator(e.target.value)}
                  /* ZMIANA: Zabezpieczenie przed zoomem na iOS */
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
                >
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

              {edytowanyRejon?.updated_at && (
                <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span>🕒 Ostatnia modyfikacja:</span>
                  <span className="font-black text-slate-500">
                    {new Date(edytowanyRejon.updated_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span>przez</span>
                  <span className="font-black text-slate-500">
                    {edytowanyRejon.edytor?.imie || 'Nieznany'} {edytowanyRejon.edytor?.nazwisko || 'Użytkownik'}
                  </span>
                </div>
              )}
              <div className="pt-5 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 sm:py-4 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 sm:py-4 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz rejon</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}