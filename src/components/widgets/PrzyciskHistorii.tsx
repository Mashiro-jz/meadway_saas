'use client';
import React from 'react';

interface PrzyciskHistoriiProps {
  updatedAt: string | null;
  updatedBy: number | string | null | undefined; // <--- NOWY PARAMETR
  onClick: (e: React.MouseEvent) => void;
}

export default function PrzyciskHistorii({ updatedAt, updatedBy, onClick }: PrzyciskHistoriiProps) {
  // 1. ZASADA: Brak daty LUB brak autora (zmiana systemowa/migracja) -> NIE MA PRZYCISKU
  if (!updatedAt || updatedBy === null || updatedBy === undefined) return null;

  const dataZmiany = new Date(updatedAt).getTime();
  const dzisiaj = new Date().getTime();
  const roznicaWDniach = (dzisiaj - dataZmiany) / (1000 * 3600 * 24);

  const czySwiezaZmiana = roznicaWDniach <= 7;

  return (
    <button 
      onClick={onClick} 
      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-black transition shadow-sm cursor-pointer text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 ${
        czySwiezaZmiana 
          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 animate-pulse' 
          : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
      }`}
      title={czySwiezaZmiana ? "Świeże zmiany z ostatnich 7 dni" : "Historia zmian"}
    >
      <span className={czySwiezaZmiana ? "" : "grayscale opacity-60"}>🔔</span> Zmiany
    </button>
  );
}