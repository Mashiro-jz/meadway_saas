'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useChecklista } from '../../src/hooks/useChecklista';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    loading, czySzufladaOtwarta, setCzySzufladaOtwarta,
    handleLogout, userProfil
  } = useChecklista(router);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-amber-800 font-bold animate-pulse text-lg">Synchronizacja struktury SaaS...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-8 relative">

      {/* 🍔 MENU HAMBURGER */}
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
        <div onClick={() => setCzySzufladaOtwarta(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer" />
        <div className={`absolute top-0 left-0 bottom-0 w-72 bg-white p-6 flex flex-col justify-between transition-transform duration-300 overflow-y-auto ${czySzufladaOtwarta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="space-y-6">
            <span className="block font-extrabold text-slate-800 text-lg border-b pb-3">Meadway Sp. z o.o.</span>

            <div className="space-y-2">
              <Link href="/" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${pathname === '/' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-lg">🎪</span> Bieżący Handel
              </Link>
              <Link href="/formatki" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${pathname === '/formatki' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-lg">📄</span> Rozliczenia / Formatki
              </Link>
              <Link href="/grafik" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${pathname === '/grafik' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-lg">📅</span> Twój Grafik
              </Link>
            </div>

            {/* SEKCJA PANEL ADMINISTRATORA */}
            {userProfil && (userProfil.rola === 'admin' || userProfil.rola === 'koordynator') && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="block text-[11px] font-black text-indigo-600 uppercase tracking-wider px-1 mb-2">Panel Administratora</span>

                <Link href="/admin/dzisiejszy-handel" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/dzisiejszy-handel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">🏪</span> Dzisiejszy Handel
                </Link>
                  <Link href="/admin/checklisty" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/checklisty' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">🏪</span> Checklisty
                </Link>
                <Link href="/admin/obsada" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/obsada' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">📌</span> Tworzenie miejsca handlu
                </Link>
                <Link href="/admin/grafik-punktu" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/grafik-punktu' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">📅</span> Grafik punktu
                </Link>
                <Link href="/admin/punkty-handlu" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/punkty-handlu' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">🎪</span> Punkty handlu
                </Link>
                <Link href="/admin/rejony" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname === '/admin/rejony' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">🌍</span> Rejony
                </Link>
                <Link href="/admin/pracownicy" onClick={() => setCzySzufladaOtwarta(false)} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${pathname.includes('/admin/pracownicy') ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">👤</span> Pracownicy
                </Link>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] font-mono text-slate-300 border-t pt-4">Meadway Core v2.5</div>
        </div>
      </div>

      {/* Profil bar */}
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

      <div className="mt-4 animate-fadeIn">
        {children}
      </div>

    </main>
  );
}