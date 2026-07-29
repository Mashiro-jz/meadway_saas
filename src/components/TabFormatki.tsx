import React from 'react';

export default function TabFormatki(props: any) {
  const { historiaChecklist, selectedChecklistIds, toggleChecklistSelection, generujFormatkePDF } = props;

  return (
    <div className="w-[calc(100%-2rem)] md:w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-5 md:p-6 space-y-4 border-slate-200 animate-fadeIn my-4 md:my-8">
      
      {/* Dopasowane marginesy nagłówka, żeby idealnie łączył się z krawędziami */}
      <div className="bg-slate-800 -mx-5 md:-mx-6 -mt-5 md:-mt-6 p-4 text-white text-center rounded-t-2xl">
        <h1 className="text-xl font-bold">Archiwum i PDF 📄</h1>
      </div>
      
      <p className="text-xs text-slate-500 font-medium text-center px-2">
        Zaznacz zamknięte raporty, z których system automatycznie wygeneruje oficjalną formatkę PDF.
      </p>

      {historiaChecklist.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 font-medium my-4">
          Brak archiwalnych, zamkniętych dni handlowych do wyświetlenia.
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
          {historiaChecklist.map((c: any) => (
            <div 
              key={c.id_checklisty} 
              onClick={() => toggleChecklistSelection(c.id_checklisty)} 
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${selectedChecklistIds.includes(c.id_checklisty) ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedChecklistIds.includes(c.id_checklisty)} 
                  readOnly 
                  className="accent-amber-500 w-4 h-4 cursor-pointer" 
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{new Date(c.data).toLocaleDateString('pl-PL')}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">{c.punkty_handlu?.nazwa}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={generujFormatkePDF} 
        disabled={selectedChecklistIds.length === 0} 
        className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md disabled:opacity-40 hover:bg-slate-900 transition cursor-pointer text-sm mt-2"
      >
        📥 Pobierz Formatkę PDF
      </button>
    </div>
  );
}