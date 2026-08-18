import PunktHandluPopup from './PunktHandluPopup';

export default function TabGrafik(props: any) {
  const {
    dniGrafiku, wybranyMiesiac, setWybranyMiesiac, wybranyRok, setWybranyRok,
    czyTrybEdycji, odpalTrybEdycji, anulujEdycje, zapiszEdycjeHurtowa, sending,
    buforGrafiku, kliknijDzienWBuforze, aktywnyPunktPopup, setAktywnyPunktPopup
  } = props;

  const nazwyMiesiecy = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  const dzisiaj = new Date().toLocaleDateString('en-CA');

  const getISOWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const zlozTygodnieGrafiku = () => {
    const mapaDni = new Map(dniGrafiku.map((d: any) => [d.data, d]));
    const pierwszy = new Date(wybranyRok, wybranyMiesiac - 1, 1);
    const ostatni = new Date(wybranyRok, wybranyMiesiac, 0);
    const start = new Date(pierwszy);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);

    const tygodnie: any[] = [];
    const current = new Date(start);

    while (current <= ostatni || (current.getDay() || 7) !== 1) {
      const dni: any[] = [];
      const nrTygodnia = String(getISOWeek(new Date(current)));

      for (let i = 0; i < 7; i++) {
        const r = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const dz = String(current.getDate()).padStart(2, "0");
        const dataStr = `${r}-${m}-${dz}`;

        if (current.getMonth() !== wybranyMiesiac - 1) {
          dni.push(null);
        } else {
          const wpisZ_BD = mapaDni.get(dataStr);
          if (wpisZ_BD) {
            dni.push(wpisZ_BD);
          } else {
            dni.push({
              data: dataStr, dzienMiesiaca: current.getDate(), nrTygodnia: nrTygodnia, dostepnosc: 'nieznana', punkty_handlu: null
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
      tygodnie.push({ nrTygodnia, dni });
    }
    return tygodnie;
  };

  const przypisaneWyjazdyMiesiaca = dniGrafiku.filter((d: any) => d.punkty_handlu !== null);

  return (
    <div className="w-[calc(100%-2rem)] md:w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 mb-8 animate-fadeIn my-4 md:my-8">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Twój miesięczny grafik</h1>
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
          <button onClick={() => setWybranyMiesiac((m: number) => m === 1 ? (setWybranyRok((y: number) => y - 1), 12) : m - 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-700 transition active:scale-95 cursor-pointer shrink-0">&lt;</button>
          <span className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-wide font-mono w-[140px] sm:w-[160px]">{nazwyMiesiecy[wybranyMiesiac - 1]} {wybranyRok}</span>
          <button onClick={() => setWybranyMiesiac((m: number) => m === 12 ? (setWybranyRok((y: number) => y + 1), 1) : m + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-700 transition active:scale-95 cursor-pointer shrink-0">&gt;</button>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        {!czyTrybEdycji ? (
          <>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 text-center sm:text-left">Przeglądasz aktualny grafik</span>
            <button onClick={odpalTrybEdycji} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-sm transition active:scale-95 cursor-pointer">✏️ Edytuj grafik</button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-amber-600 animate-pulse text-center sm:text-left">🔴 Masz niezapisane zmiany!</span>
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button onClick={anulujEdycje} className="flex-1 sm:flex-none bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg hover:bg-slate-300 transition cursor-pointer">Anuluj</button>
              <button onClick={zapiszEdycjeHurtowa} disabled={sending} className="flex-1 sm:flex-none bg-emerald-600 text-white font-black text-xs py-2 px-3 rounded-lg hover:bg-emerald-700 shadow-sm transition cursor-pointer">Zapisz</button>
            </div>
          </>
        )}
      </div>

      {/* KALENDARZ - IDEALNIE DOPASOWANY DO MOBILE */}
      <div className="w-full">
        {/* Usunięto overlow-x-auto i min-w-[340px], zrobiono zwarty układ flex */}
        <div className="w-full space-y-1.5 sm:space-y-2">
          {/* Nagłówki Dni */}
          <div className="flex items-center text-center text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">
            {/* Tydzień zajmuje malutko miejsca */}
            <div className="w-6 sm:w-10 shrink-0 text-left pl-1" title="Numer Tygodnia">Nr.</div>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (<div key={d} className="flex-1">{d}</div>))}
          </div>

          {/* Dni Kalendarza */}
          {zlozTygodnieGrafiku().map((tydz, idx) => (
            <div key={`${wybranyRok}-${wybranyMiesiac}-w-${tydz.nrTygodnia}-${idx}`} className="flex items-center text-center py-0.5">
              {/* Numer Tygodnia */}
              <div className="w-6 sm:w-10 shrink-0 text-left font-black text-slate-400 text-[10px] sm:text-sm font-mono pl-1 sm:pl-2">
                {tydz.nrTygodnia}
              </div>
              
              {/* Dni */}
              {tydz.dni.map((d: any, dIdx: number) => {
                if (d === null) return <div key={`empty-${dIdx}`} className="flex-1 h-8 sm:h-10 m-0.5" />;
                
                const statusDnia = buforGrafiku[d.data] !== undefined ? buforGrafiku[d.data] : d.dostepnosc;
                const maPrzypisanyHandel = d.punkty_handlu !== null;
                const czyToDzisiaj = d.data === dzisiaj;

                let klasyKoloru = '';
                if (statusDnia === 'dostepny') {
                  klasyKoloru = czyToDzisiaj ? 'bg-emerald-700 text-white' : 'bg-emerald-500 text-white';
                } else if (statusDnia === 'nd') {
                  klasyKoloru = czyToDzisiaj ? 'bg-rose-700 text-white' : 'bg-rose-500 text-white';
                } else if (statusDnia === 'nz') {
                  klasyKoloru = czyToDzisiaj ? 'bg-orange-700 text-white' : 'bg-orange-500 text-white';
                } else {
                  klasyKoloru = czyToDzisiaj ? 'bg-slate-400 text-white' : 'bg-slate-200 text-slate-600';
                }

                return (
                  <div
                    key={d.data}
                    onClick={() => {
                      if (maPrzypisanyHandel) {
                        setAktywnyPunktPopup(d.punkty_handlu);
                      } else {
                        kliknijDzienWBuforze(d.data, d.dostepnosc);
                      }
                    }}
                    className={`flex-1 h-8 sm:h-10 m-0.5 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm transition relative select-none cursor-pointer active:scale-90 touch-manipulation ${
                      maPrzypisanyHandel ? 'ring-1 sm:ring-2 ring-offset-1 sm:hover:scale-105' : ''
                    } ${klasyKoloru} ${czyToDzisiaj ? 'scale-100 z-10 shadow-sm sm:shadow-md' : ''}`}
                  >
                    {d.dzienMiesiaca}

                    {/* Czerwony wykrzyknik dla wymuszonych przypisań */}
                    {d.wymuszone && (
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-black shadow-sm ring-1 sm:ring-2 ring-white" title="Wymuszono przez Koordynatora">
                        !
                      </span>
                    )}

                    {/* Kropka handlu */}
                    {maPrzypisanyHandel && (<span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-900 rounded-full ring-1 ring-white" />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* LEGENDA */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 mt-6 text-[10px] sm:text-[11px] font-bold text-slate-500 justify-items-center sm:flex sm:flex-wrap sm:justify-center">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-200 block" /> Nieznana</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 block" /> Dostępny</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 block" /> Niedostępny</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 block" /> Żądanie</div>

        <div className="col-span-2 flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 w-full justify-center text-rose-600 sm:border-none sm:pt-0 sm:mt-0 sm:w-auto sm:ml-4">
          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-sm">!</span>
          Wymuszone przypisanie
        </div>
      </div>

      {/* LISTA WYJAZDÓW */}
      <div className="mt-6 sm:mt-8 border-t border-slate-200 pt-5 sm:pt-6">
        <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1">📍 Przypisane wyjazdy w tym miesiącu ({przypisaneWyjazdyMiesiaca.length})</h3>
        {przypisaneWyjazdyMiesiaca.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed text-xs text-slate-400 font-medium">Koordynator nie przypisał Ci jeszcze żadnych stoisk na ten miesiąc.</div>
        ) : (
          <div className="space-y-2">
            {przypisaneWyjazdyMiesiaca.map((w: any) => (
              <div key={w.data} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                <div>
                  <p className="font-extrabold text-slate-800">{new Date(w.data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</p>
                  <p className="text-[11px] text-slate-400 font-semibold">{w.punkty_handlu.lokalizacja}</p>
                </div>
                <button type="button" onClick={() => setAktywnyPunktPopup(w.punkty_handlu)} className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black px-3 py-1.5 rounded-lg border border-indigo-100 transition active:scale-95 cursor-pointer truncate">📍 {w.punkty_handlu.nazwa}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {aktywnyPunktPopup && (
        <PunktHandluPopup
          punkt={aktywnyPunktPopup}
          onClose={() => setAktywnyPunktPopup(null)}
        />
      )}
    </div>
  );
}