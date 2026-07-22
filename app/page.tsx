'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../src/hooks/useChecklista';
import { useAdmin } from '../src/hooks/useAdmin';
import TabHandel from '../src/components/TabHandel';
import TabFormatki from '../src/components/TabFormatki';
import TabGrafik from '../src/components/TabGrafik';
import TabAdmin from '../src/components/TabAdmin';

export default function Home() {
  const router = useRouter();

  // Wczytanie wszystkich danych z logiki
  const checklistaStany = useChecklista(router);
  const adminStany = useAdmin(checklistaStany.userProfil);

  const {
    loading, aktywnaZakladka, setAktywnaZakladka, czySzufladaOtwarta, setCzySzufladaOtwarta,
    handleLogout, userProfil, aktywnyPunktPopup, setAktywnyPunktPopup, setSuccessMsg
  } = checklistaStany;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-amber-800 font-bold animate-pulse text-lg">Synchronizacja struktury SaaS...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-8 relative">

      {/* MENU HAMBURGER */}
      <button
        onClick={() => setCzySzufladaOtwarta(true)}
        className="fixed top-4 left-4 z-40 bg-white text-slate-700 p-2.5 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* 📑 SZUFLADA NAWIGACJI */}
      <div className={`fixed inset-0 z-50 transition-visibility duration-300 ${czySzufladaOtwarta ? 'visible' : 'invisible'}`}>
        <div onClick={() => setCzySzufladaOtwarta(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
        <div className={`absolute top-0 left-0 bottom-0 w-64 bg-white p-6 flex flex-col justify-between transition-transform duration-300 ${czySzufladaOtwarta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="space-y-6">
            <span className="block font-extrabold text-slate-800 text-lg border-b pb-3">Panel Operacyjny</span>
            <div className="space-y-2">
              <button onClick={() => { setAktywnaZakladka('handel'); setCzySzufladaOtwarta(false); setSuccessMsg(''); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${aktywnaZakladka === 'handel' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>🎪 Bieżący Handel</button>
              <button onClick={() => { setAktywnaZakladka('formatki'); setCzySzufladaOtwarta(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${aktywnaZakladka === 'formatki' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>📄 Rozliczenia / Formatki</button>
              <button onClick={() => { setAktywnaZakladka('grafik'); setCzySzufladaOtwarta(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${aktywnaZakladka === 'grafik' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>📅 Twój Grafik</button>
              {userProfil && (userProfil.rola === 'admin' || userProfil.rola === 'koordynator') && (
                <button onClick={() => { setAktywnaZakladka('admin' as any); setCzySzufladaOtwarta(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-black border border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 shadow-xs cursor-pointer">💼 Zarządzanie Składem</button>
              )}
            </div>
          </div>
          <div className="text-center text-[10px] font-mono text-slate-300 border-t pt-4">Meadway Core v2.4</div>
        </div>
      </div>

      {/* Profil bar - CZYSTE, KLASYCZNE NAPISY */}
      <div className="max-w-md mx-auto bg-white p-4 rounded-xl shadow-sm mb-4 flex justify-between items-center border border-slate-200">
        <div className="pl-12 flex flex-col justify-center">
          <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            {userProfil?.imie || 'Wczytywanie...'} {userProfil?.nazwisko}
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase mt-1">
            {userProfil?.rola || '...'} • {userProfil?.rejony?.nazwa || 'Brak rejonu'}
          </span>
        </div>

        <button 
          onClick={handleLogout} 
          className="bg-rose-50 text-rose-600 font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-rose-100 transition active:scale-95 border border-rose-100 cursor-pointer"
        >
          Wyloguj
        </button>
      </div>

      {/* RENDEROWANIE WŁAŚCIWEJ ZAKŁADKI I PRZEKAZANIE DO NIEJ JEJ STANU */}
      {aktywnaZakladka === 'handel' && <TabHandel {...checklistaStany} />}
      {aktywnaZakladka === 'formatki' && <TabFormatki {...checklistaStany} />}
      {aktywnaZakladka === 'grafik' && <TabGrafik {...checklistaStany} />}
      {aktywnaZakladka === 'admin' as any && <TabAdmin {...adminStany} />}
    </main>
  );
}