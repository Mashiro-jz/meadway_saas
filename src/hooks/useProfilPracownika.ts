'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export function useProfilPracownika(idUzytkownika: number) {
  const [pracownik, setPracownik] = useState<any>(null);
  const [checklisty, setChecklisty] = useState<any[]>([]);
  const [grafik, setGrafik] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pobierzWszystko = async () => {
      setLoading(true);
      setError(null);
      try {
        const [daneUsera, daneChecklist, daneGrafiku] = await Promise.all([
          adminService.getSzczegolyPracownika(idUzytkownika),
          adminService.getChecklistyPracownika(idUzytkownika),
          adminService.getGrafikPracownika(idUzytkownika)
        ]);

        setPracownik(daneUsera);
        setChecklisty(daneChecklist);
        setGrafik(daneGrafiku);
      } catch (err: any) {
        console.error(err);
        setError("Nie udało się załadować profilu pracownika.");
      } finally {
        setLoading(false);
      }
    };

    if (idUzytkownika !== null && idUzytkownika !== undefined) {
      pobierzWszystko();
    }
  }, [idUzytkownika]);

  return { pracownik, checklisty, grafik, loading, error };
}