import React, { useState } from 'react';

export default function PunktHandluPopup({ punkt, onClose }: { punkt: any, onClose: () => void }) {
  const [skopiowano, setSkopiowano] = useState(false);

  if (!punkt) return null;

  // Kopiowanie do schowka
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(punkt.lokalizacja);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch (err) {
      console.error('Błąd kopiowania:', err);
    }
  };

  // Sprawdzanie czy tekst to link (prosty check na start z http)
  const czyToLink = (tekst: string) => {
    if (!tekst) return false;
    return tekst.trim().startsWith('http://') || tekst.trim().startsWith('https://');
  };

  // Formatowanie ściany tekstu na czytelną listę
  const formatujUwagi = (tekst: string) => {
    if (!tekst) return <span className="italic text-slate-400">Brak dodatkowych uwag.</span>;
    
    // Rozbijamy tekst po kropce (z uwzględnieniem spacji)
    const zdania = tekst.split(/\.\s+/).filter(z => z.trim().length > 0);
    
    return (
      <ul className="space-y-2 text-sm text-slate-600">
        {zdania.map((zdanie, idx) => (
          <li key={idx} className="flex gap-2 items-start">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span className="leading-relaxed">
              {zdanie.trim()}
              {!zdanie.trim().endsWith('.') && !zdanie.trim().endsWith('!') && !zdanie.trim().endsWith('?') ? '.' : ''}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    /* ZMIANA: Dodano onClose na tło z warunkiem, żeby klikać tylko w samo tło */
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      {/* ZMIANA: e.stopPropagation() zapobiega zamykaniu po kliknięciu w treść popupa */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-slideUp cursor-default"
      >
        
        {/* Nagłówek */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="text-xl">📍</span> {punkt.nazwa}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition active:scale-95 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Ciało Popupu */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* Adres i Kopiowanie */}
          <div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">1. Adres Jarmarku</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-medium text-slate-700 break-words">
                {punkt.lokalizacja || 'Brak danych'}
              </div>
              <button 
                onClick={handleCopy}
                className={`px-4 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-w-[70px] ${skopiowano ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'} border cursor-pointer`}
              >
                <span className="text-sm">{skopiowano ? '✅' : '📋'}</span>
                <span>{skopiowano ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
            </div>
          </div>

          {/* Lokalizacja namiotu */}
          <div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">2. Lokalizacja namiotu / Stoiska</p>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-medium text-slate-700">
              {czyToLink(punkt.lokalizacja_namiotu) ? (
                <a 
                  href={punkt.lokalizacja_namiotu} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-lg font-bold hover:bg-blue-100 transition"
                >
                  🗺️ Otwórz w Google Maps
                </a>
              ) : (
                <span>{punkt.lokalizacja_namiotu || 'Brak dokładnych instrukcji'}</span>
              )}
            </div>
          </div>

          {/* Godziny */}
          <div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">3. Godziny otwarcia</p>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-bold text-slate-800">
              🕒 {punkt.godziny_otwarcia || 'Nie podano godzin'}
            </div>
          </div>

          {/* Uwagi */}
          <div>
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">4. Wskazówki i Uwagi</p>
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
              {formatujUwagi(punkt.uwagi)}
            </div>
          </div>

        </div>

        {/* Stopka */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={onClose} 
            className="w-full bg-slate-800 text-white font-extrabold py-3.5 rounded-xl hover:bg-slate-950 shadow-md transition active:scale-95 text-sm cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}