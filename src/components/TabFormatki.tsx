import React from 'react';

export default function TabFormatki(props: any) {
  const { historiaChecklist, selectedChecklistIds, toggleChecklistSelection, generujFormatkePDF } = props;

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6 space-y-4 border-slate-200">
      <div className="bg-slate-800 -mx-6 -mt-6 p-4 text-white text-center"><h1 className="text-xl font-bold">Formatki PDF 📄</h1></div>
      <p className="text-xs text-slate-500 font-medium">Zaznacz zamknięte raporty, z których system automatycznie wygeneruje oficjalną formatkę PDF.</p>

      {historiaChecklist.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-sm text-slate-400 font-medium my-4">
          Brak archiwalnych, zamkniętych dni handlowych do wyświetlenia.
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          {historiaChecklist.map((c: any) => (
            <div key={c.id_checklisty} onClick={() => toggleChecklistSelection(c.id_checklisty)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${selectedChecklistIds.includes(c.id_checklisty) ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedChecklistIds.includes(c.id_checklisty)} readOnly className="accent-amber-500" />
                <div><p className="text-sm font-bold">{new Date(c.data).toLocaleDateString('pl-PL')}</p><p className="text-xs text-slate-400">{c.punkty_handlu?.nazwa}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={generujFormatkePDF} disabled={selectedChecklistIds.length === 0} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md disabled:opacity-40 cursor-pointer text-sm">📥 Pobierz Formatkę PDF</button>
    </div>
  );
}