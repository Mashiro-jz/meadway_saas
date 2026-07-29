'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- Dodany import z Next.js
import { usePracownicy } from '../../hooks/usePracownicy';
// ProfilPracownika nie jest tu już potrzebny, bo zajmuje się nim strona w folderze [id]

export default function TabPracownicy() {
  const router = useRouter(); // <-- Inicjalizacja routera

  const {
    pracownicy, rejony, loading,
    szukanaFraza, setSzukanaFraza,
    filtrRejonu, setFiltrRejonu,
    filtrRoli, setFiltrRoli,
    sortowanie, setSortowanie,
    kierunekSortowania, setKierunekSortowania,
    isModalOpen, setIsModalOpen,
    edytowanyPracownik,
    otworzModalNowy, otworzModalEdycja,
    zapiszPracownika, usunPracownika
  } = usePracownicy();

  // Stan formularza w modalu
  const [formImie, setFormImie] = useState('');
  const [formNazwisko, setFormNazwisko] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefon, setFormTelefon] = useState('');
  const [formRola, setFormRola] = useState('pracownik');
  const [formRejon, setFormRejon] = useState('');

  // Synchronizacja danych przy otwieraniu modala
  const obsluzOtwarcieModala = (pracownik: any = null) => {
    if (pracownik) {
      otworzModalEdycja(pracownik);
      setFormImie(pracownik.imie || '');
      setFormNazwisko(pracownik.nazwisko || '');
      setFormEmail(pracownik.email || '');
      setFormTelefon(pracownik.numer_telefonu || '');
      setFormRola(pracownik.rola || 'pracownik');
      setFormRejon(pracownik.id_rejonu || '');
    } else {
      otworzModalNowy();
      setFormImie('');
      setFormNazwisko('');
      setFormEmail('');
      setFormTelefon('');
      setFormRola('pracownik');
      setFormRejon(rejony[0]?.id_rejonu || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    zapiszPracownika({
      imie: formImie,
      nazwisko: formNazwisko,
      email: formEmail,
      numer_telefonu: formTelefon,
      rola: formRola,
      id_rejonu: formRejon ? parseInt(formRejon) : null,
    }, edytowanyPracownik?.id_uzytkownika);
  };

  const getRoleBadge = (rola: string) => {
    switch (rola) {
      case 'admin': return <span className="bg-rose-100 text-rose-700 font-black px-2 py-1 rounded-md text-[9px] uppercase tracking-wider border border-rose-200">Admin</span>;
      case 'koordynator': return <span className="bg-indigo-100 text-indigo-700 font-black px-2 py-1 rounded-md text-[9px] uppercase tracking-wider border border-indigo-200">Koordynator</span>;
      default: return <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-wider border border-slate-200">Pracownik</span>;
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">Ładowanie bazy pracowników...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn">

      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-5 text-white flex justify-between items-center border-b border-slate-900">
        <div>
          <h1 className="text-lg font-black tracking-tight">Kadra i Użytkownicy 👥</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Zarządzanie kontami, rolami i przypisaniem do rejonów</p>
        </div>
        <button
          onClick={() => obsluzOtwarcieModala()}
          className="bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          + Dodaj pracownika
        </button>
      </div>

      {/* FILTRY I WYSZUKIWARKA */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Szukaj (Imię/Nazwisko):</label>
          <input
            type="text"
            placeholder="Wpisz frazę..."
            value={szukanaFraza}
            onChange={(e) => setSzukanaFraza(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-xl bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-medium"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rola:</label>
          <select
            value={filtrRoli}
            onChange={(e) => setFiltrRoli(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-xl bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer"
          >
            <option value="ALL">Wszystkie role</option>
            <option value="admin">Admin</option>
            <option value="koordynator">Koordynator</option>
            <option value="pracownik">Pracownik</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon:</label>
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
              <option value="nazwisko">Nazwisko</option>
              <option value="imie">Imię</option>
              <option value="rola">Rola</option>
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

      {/* LISTA PRACOWNIKÓW */}
      <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
        {pracownicy.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak pracowników spełniających kryteria.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Pracownik</th>
                <th className="py-2.5 px-3">Kontakt</th>
                <th className="py-2.5 px-3">Rola i Rejon</th>
                <th className="py-2.5 px-3 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pracownicy.map((p: any) => (
                <tr key={p.id_uzytkownika} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                      {p.imie?.charAt(0)}{p.nazwisko?.charAt(0)}
                    </div>
                    {/* ZMODYFIKOWANY KONTENER Z IMIENIEM I STRZAŁKĄ */}
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-800">{p.imie} {p.nazwisko}</p>
                      <button
                        // ZMIANA TUTAJ: Zamiast zmieniać stan, przekierowujemy na nowy adres URL!
                        onClick={() => router.push(`/admin/pracownicy/${p.id_uzytkownika}`)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all transform hover:translate-x-1 cursor-pointer"
                        title="Zobacz profil pracownika"
                      >
                        ➔
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-[11px] text-slate-600 font-medium break-all">{p.email || '-'}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.numer_telefonu || '-'}</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-1.5">
                      {getRoleBadge(p.rola)}
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        📍 {p.rejony?.nazwa || 'Brak rejonu'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => obsluzOtwarcieModala(p)}
                      className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => usunPracownika(p.id_uzytkownika)}
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
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default animate-slideUp">

            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800">
                {edytowanyPracownik ? 'Edytuj pracownika' : 'Nowy pracownik'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LEWA KOLUMNA: Dane personalne */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 mb-3">Dane personalne</h3>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Imię *</label>
                    <input type="text" required value={formImie} onChange={(e) => setFormImie(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwisko *</label>
                    <input type="text" required value={formNazwisko} onChange={(e) => setFormNazwisko(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Adres E-mail</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Numer telefonu</label>
                    <input type="text" value={formTelefon} onChange={(e) => setFormTelefon(e.target.value)} placeholder="+48..." className="w-full text-xs px-3 py-2 border rounded-xl font-mono font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition" />
                  </div>
                </div>

                {/* PRAWA KOLUMNA: Ustawienia systemowe */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 mb-3">Ustawienia systemowe</h3>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rola w systemie *</label>
                    <select value={formRola} onChange={(e) => setFormRola(e.target.value)} required className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer">
                      <option value="pracownik">Pracownik</option>
                      <option value="koordynator">Koordynator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Przypisany Rejon</label>
                    <select value={formRejon} onChange={(e) => setFormRejon(e.target.value)} className="w-full text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition cursor-pointer">
                      <option value="">Brak rejonu / Globalny</option>
                      <option value="null">Wyzeruj rejon</option> {/* Opcja bezpiecznego usunięcia rejonu */}
                      {rejony.map((r: any) => (
                        <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1.5 leading-tight">
                      * Skoczkowie powinni zostać przypisani do rejonu "Europa", aby byli widoczni dla wszystkich koordynatorów.
                    </p>
                  </div>
                </div>

              </div>

              {/* PRZYCISKI AKCJI */}
              <div className="pt-5 mt-6 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz profil</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}