'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePracownicy } from '../../hooks/usePracownicy';

export default function TabPracownicy() {
  const router = useRouter();

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

  const [formImie, setFormImie] = useState('');
  const [formNazwisko, setFormNazwisko] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefon, setFormTelefon] = useState('');
  const [formRola, setFormRola] = useState('pracownik');
  const [formRejon, setFormRejon] = useState('');

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
      case 'admin': return <span className="bg-rose-100 text-rose-700 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border border-rose-200">Admin</span>;
      case 'koordynator': return <span className="bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border border-indigo-200">Koordynator</span>;
      default: return <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border border-slate-200">Pracownik</span>;
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">Ładowanie bazy pracowników...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fadeIn w-full">

      {/* NAGŁÓWEK */}
      <div className="bg-slate-800 p-4 text-white flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-lg font-black tracking-tight">Kadra i Użytkownicy 👥</h1>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Zarządzanie kontami i rejonami</p>
        </div>
        <button
          onClick={() => obsluzOtwarcieModala()}
          className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
        >
          + Dodaj pracownika
        </button>
      </div>

      {/* FILTRY I WYSZUKIWARKA (Mniejsze paddingi i grid-cols-2 na mobile) */}
      <div className="p-3 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Szukaj:</label>
            <input
              type="text"
              placeholder="Imię/Nazwisko..."
              value={szukanaFraza}
              onChange={(e) => setSzukanaFraza(e.target.value)}
              className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rola:</label>
            <select
              value={filtrRoli}
              onChange={(e) => setFiltrRoli(e.target.value)}
              className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 transition cursor-pointer"
            >
              <option value="ALL">Wszystko</option>
              <option value="admin">Admin</option>
              <option value="koordynator">Koordynator</option>
              <option value="pracownik">Pracownik</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rejon:</label>
            <select
              value={filtrRejonu}
              onChange={(e) => setFiltrRejonu(e.target.value)}
              className="w-full text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 transition cursor-pointer"
            >
              <option value="ALL">Wszystkie</option>
              {rejony.map((r: any) => (
                <option key={r.id_rejonu} value={r.id_rejonu}>{r.nazwa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-wider">Sortowanie:</label>
            <div className="flex gap-1">
              <select
                value={sortowanie}
                onChange={(e) => setSortowanie(e.target.value as any)}
                className="flex-1 text-base sm:text-xs px-2 py-1.5 border rounded-lg bg-white font-bold text-slate-800 outline-none border-slate-300 focus:border-slate-500 focus:ring-1 transition cursor-pointer"
              >
                <option value="nazwisko">Nazwisko</option>
                <option value="imie">Imię</option>
                <option value="rola">Rola</option>
              </select>
              <button
                onClick={() => setKierunekSortowania((k: string) => k === 'asc' ? 'desc' : 'asc')}
                className="px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              >
                {kierunekSortowania === 'asc' ? '⬆️' : '⬇️'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROZPISKA PRACOWNIKÓW - PODEJŚCIE HYBRYDOWE */}
      <div className="max-h-[65vh] overflow-y-auto bg-white relative">
        {pracownicy.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic py-8">Brak pracowników spełniających kryteria.</p>
        ) : (
          <>
            {/* WIDOK 1: KLASYCZNA TABELA (Ukryta na telefonach, widoczna na tabletach i PC) */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Pracownik</th>
                  <th className="py-2.5 px-4">Kontakt</th>
                  <th className="py-2.5 px-4">Rola i Rejon</th>
                  <th className="py-2.5 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pracownicy.map((p: any) => (
                  <tr key={p.id_uzytkownika} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200">
                        {p.imie?.charAt(0)}{p.nazwisko?.charAt(0)}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-800 text-sm">{p.imie} {p.nazwisko}</p>
                        <button
                          onClick={() => router.push(`/admin/pracownicy/${p.id_uzytkownika}`)}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 transition-all transform hover:translate-x-1 cursor-pointer"
                          title="Zobacz profil"
                        >
                          ➔
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-slate-600 font-medium">{p.email || '-'}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.numer_telefonu || '-'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        {getRoleBadge(p.rola)}
                        <span className="text-[10px] text-slate-500 font-bold">📍 {p.rejony?.nazwa || 'Brak'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button onClick={() => obsluzOtwarcieModala(p)} className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider">Edytuj</button>
                      <button onClick={() => usunPracownika(p.id_uzytkownika)} className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider">Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* WIDOK 2: PŁASKA LISTA MOBILNA (Widoczna tylko na smartfonach) */}
            <div className="md:hidden divide-y divide-slate-100">
              {pracownicy.map((p: any) => (
                <div key={`mob-${p.id_uzytkownika}`} className="p-3 bg-white hover:bg-slate-50 transition flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200 mt-1">
                      {p.imie?.charAt(0)}{p.nazwisko?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm truncate">{p.imie} {p.nazwisko}</span>
                        <button onClick={() => router.push(`/admin/pracownicy/${p.id_uzytkownika}`)} className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors shrink-0">➔</button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                        {p.email || '-'} • <span className="font-mono">{p.numer_telefonu || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between ml-11">
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(p.rola)}
                      <span className="text-[9px] text-slate-500 font-bold truncate max-w-[90px]">📍 {p.rejony?.nazwa || 'Brak'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => obsluzOtwarcieModala(p)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 uppercase transition active:bg-slate-100">Edytuj</button>
                      <button onClick={() => usunPracownika(p.id_uzytkownika)} className="px-2.5 py-1.5 border border-rose-100 rounded-lg text-[9px] font-bold text-rose-600 uppercase bg-rose-50 transition active:bg-rose-100">Usuń</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* OKNO MODALNE (FORMULARZ DODAWANIA / EDYCJI) */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default animate-slideUp">

            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm sm:text-base font-black text-slate-800">
                {edytowanyPracownik ? 'Edytuj pracownika' : 'Nowy pracownik'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

                {/* LEWA KOLUMNA */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 mb-2">Dane personalne</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Imię *</label>
                    <input type="text" required value={formImie} onChange={(e) => setFormImie(e.target.value)} className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Nazwisko *</label>
                    <input type="text" required value={formNazwisko} onChange={(e) => setFormNazwisko(e.target.value)} className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Adres E-mail</label>
                    <input type="email" required maxLength={100} value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Numer telefonu</label>
                    <input type="tel" required maxLength={15} value={formTelefon} onChange={(e) => setFormTelefon(e.target.value.replace(/[^\d+ \-]/g, ''))} placeholder="+48..." className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-mono font-medium bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition" />
                  </div>
                </div>

                {/* PRAWA KOLUMNA */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 mb-2">Ustawienia systemowe</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Rola w systemie *</label>
                    <select value={formRola} onChange={(e) => setFormRola(e.target.value)} required className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition cursor-pointer">
                      <option value="pracownik">Pracownik</option>
                      <option value="koordynator">Koordynator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-wider">Przypisany Rejon</label>
                    <select value={formRejon} onChange={(e) => setFormRejon(e.target.value)} className="w-full text-base sm:text-xs px-3 py-2 border rounded-xl font-bold bg-white border-slate-300 outline-none focus:border-slate-500 focus:ring-1 transition cursor-pointer">
                      <option value="">Brak rejonu / Globalny</option>
                      <option value="null">Wyzeruj rejon</option>
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
              {edytowanyPracownik?.updated_at && (
                <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span>🕒 Ostatnia modyfikacja:</span>
                  <span className="font-black text-slate-500">
                    {new Date(edytowanyPracownik.updated_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span>przez</span>
                  <span className="font-black text-slate-500">
                    {(() => {
                      const idEdytora = edytowanyPracownik.updated_by;
                      const edytorZListy = pracownicy.find(p => p.id_uzytkownika === idEdytora);

                      if (edytorZListy) {
                        return `${edytorZListy.imie || ''} ${edytorZListy.nazwisko || ''}`;
                      }
                      return `Użytkownik (ID: ${idEdytora})`;
                    })()}
                  </span>
                </div>
              )}
              <div className="pt-4 mt-5 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 sm:py-3.5 rounded-xl hover:bg-slate-200 transition text-xs cursor-pointer">Anuluj</button>
                <button type="submit" className="flex-1 bg-slate-800 text-white font-black py-3 sm:py-3.5 rounded-xl hover:bg-slate-900 transition text-xs shadow-md cursor-pointer">Zapisz profil</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}