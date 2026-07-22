import React from 'react';

export default function TabHandel(props: any) {
  const {
    stoiska, selectedStoisko, handleStoiskoChange, activeChecklista, successMsg, setSuccessMsg,
    poranek, setPoranek, wieczor, setWieczor, ogolne, setOgolne, finanse, setFinanse,
    fileStanowisko, setFileStanowisko, fileKasa, setFileKasa, fileSumUp, setFileSumUp,
    handlePoranekSubmit, handleWieczorSubmit, sending,
    oczekiwaneButelkiPelne, roznicaButelki, oczekiwaneSloikiPelne, roznicaSloiki
  } = props;

  const czyFormatkaWygenerowana = !!activeChecklista && !!activeChecklista.data_wygenerowania_formatki;
  const czyLokalizacjaZablokowana = !!activeChecklista && !activeChecklista.data_wygenerowania_formatki;

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border overflow-hidden mb-8 border-slate-200">
      
      {successMsg && (
        <div className="p-6 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">🎉</div>
          <p className="text-sm font-bold text-slate-800 px-2">{successMsg}</p>
          
          {successMsg.includes('wieczór') || successMsg.includes('rozliczone') ? (
            <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-green-700 text-xs font-bold mt-2">
              ✔️ Zamknięto pomyślnie handel. Następną checklistę w tej lokalizacji można utworzyć od nowego dnia.
            </div>
          ) : (
            <button 
              onClick={() => setSuccessMsg('')} 
              className="w-full bg-slate-800 text-white font-extrabold py-3 rounded-xl shadow-md text-xs hover:bg-slate-900 transition cursor-pointer"
            >
              📊 Przejdź do formularza wieczornego
            </button>
          )}
        </div>
      )}

      {!successMsg && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lokalizacja handlowa</label>
          <select value={selectedStoisko} onChange={(e) => handleStoiskoChange(e.target.value)} disabled={czyLokalizacjaZablokowana} className="w-full text-base px-3 py-2 border rounded-xl bg-white outline-none font-medium text-slate-800 border-slate-200">
            {stoiska.map((s: any) => (<option key={s.id_lokalizacji} value={s.id_lokalizacji}>{s.nazwa} ({s.lokalizacja})</option>))}
          </select>
          
          {czyFormatkaWygenerowana && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold animate-fadeIn flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5"><span className="text-sm">🛑</span><span className="uppercase tracking-wider">Rozliczenie zamknięte</span></div>
              <span className="font-medium text-rose-600">Raport dobowy dla tej lokalizacji został w pełni zatwierdzony. Nie możesz go wysłać ponownie w tym samym dniu.</span>
            </div>
          )}
        </div>
      )}

      {/* RAPORT PORANNY */}
      {!activeChecklista && !successMsg && !czyFormatkaWygenerowana && (
        <form onSubmit={handlePoranekSubmit} className="p-5 space-y-4 animate-fadeIn">
          <div className="bg-amber-500 -mx-5 -mt-5 p-4 text-white text-center mb-2"><h1 className="text-xl font-bold tracking-tight">Raport Poranny ☀️</h1></div>
          <div className="space-y-2">
            {[
              { label: 'Stan butelek puste', key: 'butelkiPuste' },
              { label: 'Stan wejściowy protocudak', key: 'butelkiProtocudak' },
              { label: 'Stan towaru butelek pełnych', key: 'butelkiPelne' },
              { label: 'Stan słoików z miodem przed', key: 'sloikiPelne' }
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                <input type="number" min="0" required placeholder = "0" value={(poranek as any)[f.key]} onChange={(e) => setPoranek({ ...poranek, [f.key]: e.target.value })} className="w-16 text-center font-extrabold px-2 py-1.5 border rounded-lg bg-white outline-none text-slate-800 border-slate-300 focus:border-amber-500 transition-colors"/>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition cursor-pointer text-center ${fileStanowisko ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
              <span className="text-xl mb-1">{fileStanowisko ? '✅' : '📸'}</span>
              <span className="text-xs font-bold text-slate-700">{fileStanowisko ? fileStanowisko.name : 'Dodaj zdjęcie stanowiska (Otwarcie)'}</span>
              <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileStanowisko(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={sending} className="w-full mt-2 bg-amber-500 text-white font-black py-3 rounded-xl shadow-md hover:bg-amber-600 transition active:scale-95 cursor-pointer text-sm disabled:opacity-50">☀️ Otwórz stoisko</button>
        </form>
      )}

      {/* RAPORT WIECZORNY */}
      {activeChecklista && !activeChecklista.data_wygenerowania_formatki && !successMsg && (
        <form onSubmit={handleWieczorSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto animate-fadeIn">
          <div className="bg-indigo-600 -mx-5 -mt-5 p-3 text-white text-center mb-1"><h1 className="text-lg font-bold tracking-tight">Raport Wieczorny 🌙</h1></div>
          
          {/* SEKCJA 1: CZAS PRACY I KASA */}
          <div className="pt-1">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">⏱️ 1. Czas pracy i fiskalizacja</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Godz. handlowe</span>
                <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyHandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyHandlowe: e.target.value })} className="w-14 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Godz. inne</span>
                <input type="number" placeholder="0" min="0" step="0.5" required value={ogolne.godzinyNiehandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyNiehandlowe: e.target.value })} className="w-14 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-extrabold text-slate-800">Numer kasy fiskalnej</span>
                <input type="text" placeholder="#1" required value={ogolne.numerKasy} onChange={(e) => setOgolne({ ...ogolne, numerKasy: e.target.value })} className="w-28 text-center border p-1 rounded-lg bg-white font-black text-xs border-slate-300 outline-none focus:border-indigo-500 uppercase transition-colors" />
              </div>
            </div>
          </div>

          {/* Ruch Towarowy */}
          <div className="border-t border-slate-100 pt-3 mt-3">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">📦 2. Ruch towarowy w ciągu dnia</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Dostawa', key: 'dostawa', bold: false },
                { label: 'Próbki', key: 'probki', bold: false },
                { label: 'Prezenty / Stłuczki', key: 'stluczki', bold: false },
                { label: 'Sprzedane (Kasa)', key: 'butelkiSprzedane', bold: true },
                { label: 'Sprzedane Słoiki', key: 'sloikiSprzedane', bold: true },
              ].map(t => (
                <div key={t.key} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className={`text-xs ${t.bold ? 'font-extrabold text-slate-800' : 'font-medium text-slate-600'}`}>{t.label}</span>
                  <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-12 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Inwentaryzacja */}
          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">🔒 3. Inwentaryzacja końcowa</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Puste koniec', key: 'koncowePuste' },
                { label: 'Protocudak koniec', key: 'koncoweProtocudak' },
                { label: 'Pełne koniec', key: 'koncowePelne' },
                { label: 'Słoiki koniec', key: 'koncoweSloiki' }
              ].map(t => (
                <div key={t.key} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-700 font-semibold">{t.label}</span>
                  <input type="number" min="0" placeholder="0" required value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-12 text-center border p-1 rounded-lg bg-white font-extrabold text-xs border-slate-300 outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Matryca Zgodności */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-xs">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Butelki pełne</p>
                <p className="font-mono text-slate-500 mt-0.5">Oczekiwane: {oczekiwaneButelkiPelne}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-black ${roznicaButelki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  Różnica: {roznicaButelki > 0 ? `+${roznicaButelki}` : roznicaButelki}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-xs">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Słoiki pełne</p>
                <p className="font-mono text-slate-500 mt-0.5">Oczekiwane: {oczekiwaneSloikiPelne}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-black ${roznicaSloiki === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  Różnica: {roznicaSloiki > 0 ? `+${roznicaSloiki}` : roznicaSloiki}
                </span>
              </div>
            </div>
          </div>

          {/* Finanse */}
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">💰 4. Finanse & Logistyka</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" required placeholder="Sztuk (Kasa)" value={finanse.sztukKasa} onChange={(e) => setFinanse({ ...finanse, sztukKasa: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
              <input type="number" min="0" step="0.01" required placeholder="Kwota brutto" value={finanse.kwotaBrutto} onChange={(e) => setFinanse({ ...finanse, kwotaBrutto: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="0" step="0.01" required placeholder="Gotówka" value={finanse.gotowka} onChange={(e) => setFinanse({ ...finanse, gotowka: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
              <input type="number" min="0" step="0.01" required placeholder="SumUp" value={finanse.sumup} onChange={(e) => setFinanse({ ...finanse, sumup: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
              <input type="number" min="0" step="0.01" required placeholder="Waluty" value={finanse.waluty} onChange={(e) => setFinanse({ ...finanse, waluty: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required placeholder="Trasa logistyczna" value={finanse.trasa} onChange={(e) => setFinanse({ ...finanse, trasa: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
              <input type="number" min="0" required placeholder="Kilometry" value={finanse.kilometry} onChange={(e) => setFinanse({ ...finanse, kilometry: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
            </div>
            
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <input type="number" min="0" step="0.01" placeholder="Suma kosztów" value={finanse.kosztaInne} onChange={(e) => setFinanse({ ...finanse, kosztaInne: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-bold focus:border-indigo-500 transition-colors" />
              <input type="text" placeholder="Opis (np. woda - 20 zł)" value={finanse.kosztaInneOpis} onChange={(e) => setFinanse({ ...finanse, kosztaInneOpis: e.target.value })} className="w-full p-2 border rounded-xl text-xs bg-white border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
            </div>

            <textarea placeholder="Uwagi końcowe do dnia handlowego..." value={ogolne.uwagi} onChange={(e) => setOgolne({ ...ogolne, uwagi: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs bg-white min-h-[50px] border-slate-300 outline-none font-medium focus:border-indigo-500 transition-colors" />
          </div>

          {/* DOWODY WIECZORNE */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-1">📸 5. Wymagane Zdjęcia</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-2 transition cursor-pointer text-center ${fileKasa ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                <span className="text-lg mb-0.5">{fileKasa ? '✅' : '🧾'}</span>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">Raport kasy</span>
                <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileKasa(e.target.files?.[0] || null)} className="hidden" />
              </label>

              <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-2 transition cursor-pointer text-center ${fileSumUp ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                <span className="text-lg mb-0.5">{fileSumUp ? '✅' : '💳'}</span>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">Terminal SumUp</span>
                <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileSumUp(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
          </div>

          <button type="submit" disabled={sending} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-md hover:bg-indigo-700 transition active:scale-95 cursor-pointer text-sm disabled:opacity-50">Zamknij Dzień 🌙</button>
        </form>
      )}
    </div>
  );
}