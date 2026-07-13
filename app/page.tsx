'use client';

import { useRouter } from 'next/navigation';
import { useChecklista } from '../src/hooks/useChecklista';

export default function Home() {
  const router = useRouter();
  const {
    user, loading, sending, successMsg, setSuccessMsg, stoiska, selectedStoisko, activeChecklista,
    poranek, setPoranek, wieczor, setWieczor, ogolne, setOgolne, finanse, setFinanse, statusy, setStatusy,
    handleStoiskoChange, handlePoranekSubmit, handleWieczorSubmit, handleLogout,
    roznicaButelki, roznicaSloiki, oczekiwaneButelkiPelne, oczekiwaneSloikiPelne,
    setFileStanowisko, setFileKasa, setFileSumUp, fileStanowisko, fileKasa, fileSumUp
  } = useChecklista(router);

  const czyLokalizacjaZablokowana = !!activeChecklista && !activeChecklista.data_wyslania_do_koordynatora;

  // Bezpieczne mapowanie danych dla widoku archiwalnego (Faza 3)
  const tData = activeChecklista?.check_lista_towar?.[0] || activeChecklista?.check_lista_towar;
  const fData = activeChecklista?.check_lista_finanse?.[0] || activeChecklista?.check_lista_finanse;
  const sData = activeChecklista?.check_lista_status?.[0] || activeChecklista?.check_lista_status;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-amber-800 font-bold animate-pulse text-lg">Synchronizacja struktury SaaS...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Pasek profilu pracownika */}
      <div className="max-w-md mx-auto bg-white p-4 rounded-xl shadow-sm mb-4 flex justify-between items-center border border-slate-200">
        <div className="text-left">
          <p className="text-xs text-slate-500 font-medium">Pracownik:</p>
          <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-50 text-red-600 font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-red-100 transition">
          Wyloguj
        </button>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        
        {/* Selektor stoiska handlowego */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lokalizacja handlowa</label>
          <select 
            value={selectedStoisko} 
            onChange={(e) => handleStoiskoChange(e.target.value)} 
            disabled={czyLokalizacjaZablokowana}
            className={`w-full text-base px-3 py-2 border rounded-xl font-medium text-slate-800 outline-none transition ${czyLokalizacjaZablokowana ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-amber-500'}`}
          >
            {stoiska.map((s) => (
              <option key={s.id_lokalizacji} value={s.id_lokalizacji}>{s.nazwa} ({s.lokalizacja})</option>
            ))}
          </select>
          {czyLokalizacjaZablokowana && (
            <p className="text-[11px] text-amber-600 font-semibold mt-1">🔒 Blokada: Trwa rozliczanie dnia dla tej lokalizacji. Nadaj raport wieczorny.</p>
          )}
        </div>

        {successMsg && (
          <div className="p-6 text-center bg-emerald-50 text-emerald-800 font-medium border-b border-emerald-200">
            {successMsg}
            <button onClick={() => setSuccessMsg('')} className="block mt-3 mx-auto bg-amber-500 text-white font-bold py-2 px-6 rounded-lg text-sm hover:bg-amber-600 transition shadow-sm">Przejdź dalej</button>
          </div>
        )}

        {/* FAZA 1: WIDOK PORANNY (☀️) */}
        {!activeChecklista && !successMsg && (
          <form onSubmit={handlePoranekSubmit} className="p-6 space-y-5">
            <div className="bg-amber-500 -mx-6 -mt-6 p-4 text-white text-center mb-2">
              <h1 className="text-xl font-bold">Raport Poranny ☀️</h1>
              <p className="text-amber-100 text-xs">Otwarcie stoiska jarmarku</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">A. Inwentaryzacja wejściowa</label>
              {[
                { label: 'Stan butelek puste', key: 'butelkiPuste' },
                { label: 'Stan wejściowy protocudak', key: 'butelkiProtocudak' },
                { label: 'Stan towaru butelek pełnych', key: 'butelkiPelne' },
                { label: 'Stan słoików z miodem przed', key: 'sloikiPelne' }
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                  <input type="number" min="0" required value={(poranek as any)[f.key]} onChange={(e) => setPoranek({ ...poranek, [f.key]: e.target.value })} className="w-20 text-center font-bold px-2 py-1 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500"/>
                </div>
              ))}
            </div>

            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">B. Zdjęcie i Weryfikacja Otwarcia</label>
              
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-3 cursor-pointer">
                <input type="checkbox" checked={statusy.pracaPoza} onChange={(e) => setStatusy({ ...statusy, pracaPoza: e.target.checked })} className="accent-amber-500 h-4 w-4"/> Czy możliwa jest praca poza godzinami punktu?
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-4 cursor-pointer">
                <input type="checkbox" checked={statusy.otwartoZgodnie} onChange={(e) => setStatusy({ ...statusy, otwartoZgodnie: e.target.checked })} className="accent-amber-500 h-4 w-4"/> Czy otworzyłeś/aś stanowisko zgodnie ze standardami?
              </label>

              {/* ZDJĘCIE 1: Stanowisko rano z wymuszeniem aparatu tylnego */}
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-600">Zrób zdjęcie gotowego stoiska:</span>
                <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileStanowisko(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
                {fileStanowisko && <p className="text-[11px] text-emerald-600 font-bold">📸 Zdjęcie załadowane: {fileStanowisko.name}</p>}
              </div>
            </div>

            <button type="submit" disabled={sending} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-sm transition">
              {sending ? 'Wysyłanie poranka i zdjęcia...' : '☀️ Zatwierdź poranek i rozpocznij dzień'}
            </button>
          </form>
        )}

        {/* FAZA 2: INTERFEJS WIECZORNY (🌙) */}
        {activeChecklista && !activeChecklista.data_wyslania_do_koordynatora && !successMsg && (
          <form onSubmit={handleWieczorSubmit} className="p-6 space-y-5 max-h-[73vh] overflow-y-auto">
            <div className="bg-indigo-600 -mx-6 -mt-6 p-4 text-white text-center mb-2">
              <h1 className="text-xl font-bold">Raport Wieczorny 🌙</h1>
              <p className="text-indigo-100 text-xs">Zamknięcie i rozliczenie końcowe</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Czas i Parametry</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.5" required placeholder="Godz. handlowe" value={ogolne.godzinyHandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyHandlowe: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input type="number" step="0.5" required placeholder="Godz. niehandlowe" value={ogolne.godzinyNiehandlowe} onChange={(e) => setOgolne({ ...ogolne, godzinyNiehandlowe: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input type="text" required placeholder="Numer kasy fiskalnej #" value={ogolne.numerKasy} onChange={(e) => setOgolne({ ...ogolne, numerKasy: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">2. Obieg Towaru i Sprzedaż</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Dostawa (sztuki)', key: 'dostawa', bold: false },
                  { label: 'Ilość miodów na próbki', key: 'probki', bold: false },
                  { label: 'Prezenty / nagrody / stłuczki / placowe', key: 'stluczki', bold: false },
                  { label: 'Butelki sprzedane (F)', key: 'butelkiSprzedane', bold: true },
                  { label: 'Słoiki sprzedane', key: 'sloikiSprzedane', bold: true },
                ].map(t => (
                  <div key={t.key} className="flex justify-between items-center">
                    <span className={t.bold ? 'font-bold text-slate-800' : 'text-slate-600'}>{t.label}</span>
                    <input type="number" value={(wieczor as any)[t.key]} onChange={(e) => setWieczor({ ...wieczor, [t.key]: e.target.value })} className="w-16 text-center border p-1 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                ))}
                
                <hr className="border-slate-200 my-2" />
                
                <div className="flex justify-between items-center text-slate-600">
                  <span>Stan KOŃCOWY puste butelki</span>
                  <input type="number" value={wieczor.koncowePuste} onChange={(e) => setWieczor({ ...wieczor, koncowePuste: e.target.value })} className="w-16 text-center border p-1 rounded bg-white" />
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Stan KOŃCOWY protocudak (Beczki)</span>
                  <input type="number" value={wieczor.koncoweProtocudak} onChange={(e) => setWieczor({ ...wieczor, koncoweProtocudak: e.target.value })} className="w-16 text-center border p-1 rounded bg-white" />
                </div>

                {/* Walidacja Butelek Pełnych (Uproszczona) */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Stan KOŃCOWY butelki pełne</span>
                    <input type="number" value={wieczor.koncowePelne} onChange={(e) => setWieczor({ ...wieczor, koncowePelne: e.target.value })} className="w-16 text-center border font-bold p-1 rounded bg-white" />
                  </div>
                  <div className="text-[11px] text-right">
                    {roznicaButelki === 0 ? (
                      <span className="text-emerald-600 font-medium">✅ Zgodność towaru (Oczekiwano: {oczekiwaneButelkiPelne})</span>
                    ) : (
                      <span className={roznicaButelki < 0 ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>
                        {roznicaButelki < 0 ? `⚠️ Manko: ${roznicaButelki} szt.` : `⚠️ Superata: +${roznicaButelki} szt.`} (Oczekiwano: {oczekiwaneButelkiPelne})
                      </span>
                    )}
                  </div>
                </div>

                {/* Walidacja Słoików Pełnych */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Stan KOŃCOWY słoiki pełne</span>
                    <input type="number" value={wieczor.koncoweSloiki} onChange={(e) => setWieczor({ ...wieczor, koncoweSloiki: e.target.value })} className="w-16 text-center border font-bold p-1 rounded bg-white" />
                  </div>
                  <div className="text-[11px] text-right">
                    {roznicaSloiki === 0 ? (
                      <span className="text-emerald-600 font-medium">✅ Zgodność towaru (Oczekiwano: {oczekiwaneSloikiPelne})</span>
                    ) : (
                      <span className={roznicaSloiki < 0 ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>
                        {roznicaSloiki < 0 ? `⚠️ Manko: ${roznicaSloiki} szt.` : `⚠️ Superata: +${roznicaSloiki} szt.`} (Oczekiwano: {oczekiwaneSloikiPelne})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">3. Utarg i Finanse</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required placeholder="Sztuk na kasę" value={finanse.sztukKasa} onChange={(e) => setFinanse({ ...finanse, sztukKasa: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-sm" />
                <input type="number" step="0.01" required placeholder="Kwota brutto" value={finanse.kwotaBrutto} onChange={(e) => setFinanse({ ...finanse, kwotaBrutto: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-1">
                <input type="number" step="0.01" required placeholder="Gotówka PLN" value={finanse.gotowka} onChange={(e) => setFinanse({ ...finanse, gotowka: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                <input type="number" step="0.01" required placeholder="SumUp" value={finanse.sumup} onChange={(e) => setFinanse({ ...finanse, sumup: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                <input type="number" step="0.01" required placeholder="Waluty" value={finanse.waluty} onChange={(e) => setFinanse({ ...finanse, waluty: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Trasa logistyczna" value={finanse.trasa} onChange={(e) => setFinanse({ ...finanse, trasa: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="number" placeholder="Kilometry" value={finanse.kilometry} onChange={(e) => setFinanse({ ...finanse, kilometry: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Koszt noclegu" value={finanse.nocleg} onChange={(e) => setFinanse({ ...finanse, nocleg: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                <input type="number" placeholder="Inne koszta" value={finanse.kosztaInne} onChange={(e) => setFinanse({ ...finanse, kosztaInne: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
              </div>
            </div>

            {/* SEKCJA MULTIMEDIALNA: 2 Multimedia Wieczorne */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">4. Zdjęcia i Procedury Końcowe</h3>
              
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-3 cursor-pointer">
                <input type="checkbox" checked={statusy.raportyNaKasie} onChange={(e) => setStatusy({ ...statusy, raportyNaKasie: e.target.checked })} className="accent-indigo-600 h-4 w-4"/> Czy zrobiłeś/aś raport dobowy na kasie?
              </label>

              {/* ZDJĘCIE 2: Fizyczne zdjęcie raportu z kasy (wymuszony aparat) */}
              <div className="space-y-1 mb-3">
                <span className="block text-xs font-bold text-slate-600">Zrób zdjęcie raportu z Kasy Fiskalnej:</span>
                <input type="file" accept="image/*" capture="environment" required onChange={(e) => setFileKasa(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                {fileKasa && <p className="text-[11px] text-emerald-600 font-bold">📸 Zdjęcie Z-Raportu załadowane</p>}
              </div>

              {/* ZDJĘCIE 3: Screenshot z aplikacji SumUp (brak capture="environment" -> włącza galerię) */}
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-600">Dodaj zrzut ekranu z aplikacji SumUp:</span>
                <input type="file" accept="image/*" required onChange={(e) => setFileSumUp(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                {fileSumUp && <p className="text-[11px] text-emerald-600 font-bold">📸 Screenshot SumUp załadowany</p>}
              </div>
            </div>

            <textarea placeholder="Uwagi z dnia..." value={ogolne.uwagi} onChange={(e) => setOgolne({ ...ogolne, uwagi: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" rows={2} />

            <button type="submit" disabled={sending} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md transition disabled:opacity-50">
              {sending ? 'Przesyłanie dowodów zdjęciowych...' : '🌙 Zamknij dzień i prześlij rozliczenie'}
            </button>
          </form>
        )}

        {/* WIDOK 3: PODSUMOWANIE DNIA (🔒 BLOKADA TYLKO ODCZYT) */}
        {activeChecklista && activeChecklista.data_wyslania_do_koordynatora && !successMsg && (
          <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            <div className="bg-emerald-600 -mx-6 -mt-6 p-4 text-white text-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl mb-1 shadow-inner">🔒</div>
              <h2 className="text-lg font-bold">Dzień Rozliczony i Zablokowany</h2>
              <p className="text-[11px] text-emerald-100">Przesłano koordynatorowi o {new Date(activeChecklista.data_wyslania_do_koordynatora).toLocaleTimeString()}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide">☀️ Inwentaryzacja Wejściowa</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>Puste butelki: <span className="font-bold text-slate-800">{tData?.rano_butelki_puste}</span></div>
                <div>Protocudak: <span className="font-bold text-slate-800">{tData?.rano_butelki_protocudak}</span></div>
                <div>Pełne butelki: <span className="font-bold text-slate-800">{tData?.rano_butelki_pelne}</span></div>
                <div>Pełne słoiki: <span className="font-bold text-slate-800">{tData?.rano_sloiki_pelne}</span></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide">📦 Obieg Towaru i Sprzedaż</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                <div>Dostawa w ciągu dnia: <span className="font-medium text-slate-800">{tData?.dostawa} szt.</span></div>
                <div>Próbki (Zlane): <span className="font-medium text-slate-800">{tData?.ilosc_probki} szt.</span></div>
                <div>Prezenty/stłuczki: <span className="font-medium text-slate-800">{tData?.ilosc_prezenty_stluczki} szt.</span></div>
                <hr className="col-span-2 border-slate-200" />
                <div className="font-semibold text-indigo-700">Butelki sprzedane (F): <span className="font-bold text-indigo-900">{tData?.butelki_sprzedane} szt.</span></div>
                <div className="font-semibold text-indigo-700">Słoiki sprzedane: <span className="font-bold text-indigo-900">{tData?.sloiki_sprzedane} szt.</span></div>
                <hr className="col-span-2 border-slate-200" />
                <div>Koniec puste: <span className="font-bold text-slate-700">{tData?.wieczor_butelki_puste}</span></div>
                {/* Prawidłowe czytanie Twojej nowej kolumny wieczor_butelki_protocudaki */}
                <div>Koniec protocudak: <span className="font-bold text-slate-700">{tData?.wieczor_butelki_protocudaki}</span></div>
                <div>Koniec pełne: <span className="font-bold text-slate-700">{tData?.wieczor_butelki_pelne}</span></div>
                <div>Koniec słoiki: <span className="font-bold text-slate-700">{tData?.wieczor_sloiki_pelne}</span></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide">📸 Cyfrowe Archiwum Multimedialne</h4>
              <div className="text-xs font-mono space-y-1 text-slate-600">
                <p>{sData?.czy_zrobiles_zdjecie_stanowiska ? '📸 ✅ Plik stoiska zabezpieczony w chmurze' : '❌ Brak pliku'}</p>
                <p>{sData?.czy_wrzuciles_na_dysk_zdjecie_z_kasy ? '📸 ✅ Raport Z-Fiskalny wgrany' : '❌ Brak pliku'}</p>
                <p>{sData?.czy_wrzuciles_na_dysk_zdjecie_z_sumup ? '📸 ✅ Screenshot SumUp zweryfikowany' : '❌ Brak pliku'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}