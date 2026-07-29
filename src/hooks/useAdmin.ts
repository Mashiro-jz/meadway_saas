'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const getSafeDateStr = (dt: Date) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const znormalizujDate = (dataZ_Bazy: string) => {
  if (!dataZ_Bazy) return "";
  return dataZ_Bazy.split('T')[0]; 
};

export function useAdmin(userProfil: any) {
  const [jarmarki, setJarmarki] = useState<any[]>([]);
  const [wybranyJarmark, setWybranyJarmark] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Stany dla filtrowania rejonu (Tylko dla Admina)
  const [listaRejonow, setListaRejonow] = useState<any[]>([]);
  const [filtrRejonu, setFiltrRejonu] = useState<string>('ALL');

  const [pewniacy, setPewniacy] = useState<any[]>([]);
  const [doObgadania, setDoObgadania] = useState<any[]>([]);
  const [resztaPracownikow, setResztaPracownikow] = useState<any[]>([]);
  const [przypisaniPracownicy, setPrzypisaniPracownicy] = useState<any[]>([]);
  
  // NOWY STAN: Lista osób przypisanych w tym samym czasie gdzie indziej
  const [zajeciPracownicy, setZajeciPracownicy] = useState<any[]>([]);
  
  const [szukanaFraza, setSzukanaFraza] = useState('');
  
  const getNastepnyWeekend = (typ: 'sobota' | 'niedziela') => {
    const d = new Date();
    const dniDoSoboty = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + (typ === 'sobota' ? dniDoSoboty : dniDoSoboty + 1));
    return getSafeDateStr(d);
  };

  const [dataOd, setDataOd] = useState(getNastepnyWeekend('sobota'));
  const [dataDo, setDataDo] = useState(getNastepnyWeekend('niedziela'));

  const pobierzTabliceDatZakresu = (start: string, koniec: string): string[] => {
    const daty: string[] = [];
    const dt = new Date(`${start}T12:00:00`);
    const end = new Date(`${koniec}T12:00:00`);
    while (dt <= end) {
      daty.push(getSafeDateStr(dt));
      dt.setDate(dt.getDate() + 1);
    }
    return daty;
  };

  const zaladujDaneMenedzerskie = async () => {
    if (!userProfil || userProfil.rola === 'pracownik') return;
    setLoadingAdmin(true);
    try {
      if (userProfil.rola === 'admin') {
        const rej = await adminService.getRejony();
        setListaRejonow(rej);
      }

      const listaJarmarkow = await adminService.getJarmarkiZarzadzane(userProfil.rola, userProfil.id_rejonu);
      setJarmarki(listaJarmarkow);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Filtrowanie jarmarków z wybranego rejonu
  const widoczneJarmarki = jarmarki.filter((j: any) => 
    filtrRejonu === 'ALL' ? true : j.id_rejonu === parseInt(filtrRejonu)
  );

  useEffect(() => {
    if (widoczneJarmarki.length > 0) {
      const czyJest = widoczneJarmarki.find(j => j.id_lokalizacji === wybranyJarmark?.id_lokalizacji);
      if (!czyJest) setWybranyJarmark(widoczneJarmarki[0]);
    } else {
      setWybranyJarmark(null);
    }
  }, [filtrRejonu, jarmarki]);

  const analizujDostepnoscIPrzeliczGrupy = async () => {
    if (!wybranyJarmark || !userProfil || userProfil.rola === 'pracownik') return;

    const zakresDatHandlu = pobierzTabliceDatZakresu(dataOd, dataDo);
    const startQueryDt = new Date(`${dataOd}T12:00:00`); startQueryDt.setDate(startQueryDt.getDate() - 2);
    const koniecQueryDt = new Date(`${dataDo}T12:00:00`); koniecQueryDt.setDate(koniecQueryDt.getDate() + 2);

    const dniOkoliczne: string[] = [];
    const tempPrzed = new Date(`${dataOd}T12:00:00`); tempPrzed.setDate(tempPrzed.getDate() - 2);
    for(let i=0; i<2; i++) { dniOkoliczne.push(getSafeDateStr(tempPrzed)); tempPrzed.setDate(tempPrzed.getDate() + 1); }
    const tempPo = new Date(`${dataDo}T12:00:00`); tempPo.setDate(tempPo.getDate() + 1);
    for(let i=0; i<2; i++) { dniOkoliczne.push(getSafeDateStr(tempPo)); tempPo.setDate(tempPo.getDate() + 1); }

    try {
      const { ludzie, wpisyGrafiku } = await adminService.getDostepnoscLudziNaJarmark(
        userProfil.rola,
        userProfil.id_rejonu,
        getSafeDateStr(startQueryDt),
        getSafeDateStr(koniecQueryDt)
      );

      const przefiltrowaniLudzie = ludzie.filter((p: any) => {
        const czyPasujeNazwa = `${p.imie} ${p.nazwisko}`.toLowerCase().includes(szukanaFraza.toLowerCase());
        
        if (userProfil.rola === 'admin' && filtrRejonu !== 'ALL') {
          const czyPasujeRejon = p.id_rejonu === parseInt(filtrRejonu) || p.id_rejonu === 2;
          return czyPasujeNazwa && czyPasujeRejon;
        }
        return czyPasujeNazwa;
      });

      const grupaPewniacy: any[] = [];
      const grupaDoObgadania: any[] = [];
      const grupaReszta: any[] = [];
      const listaPrzypisanych: any[] = [];
      const grupaZajeci: any[] = []; // NOWA GRUPA

      przefiltrowaniLudzie.forEach((pracownik: any) => {
        const idPrac = Number(pracownik.id_uzytkownika);
        const wpisyPracownika = wpisyGrafiku.filter((w: any) => Number(w.id_uzytkownika) === idPrac);

        // 1. Sprawdzamy czy jest z nami na aktualnie wybranym jarmarku
        const czyPrzypisany = wpisyPracownika.some((w: any) => 
            Number(w.id_lokalizacji) === Number(wybranyJarmark.id_lokalizacji) && 
            zakresDatHandlu.includes(znormalizujDate(w.data))
        );
        if (czyPrzypisany) { listaPrzypisanych.push(pracownik); return; }

        const wpisyWDniachHandlu = wpisyPracownika.filter((w: any) => zakresDatHandlu.includes(znormalizujDate(w.data)));

        // 2. NOWOŚĆ: Sprawdzamy, czy pracownik dostał już przydział, ale GDZIE INDZIEJ (id_lokalizacji != null)
        const wpisZajetyGdzieIndziej = wpisyWDniachHandlu.find((w: any) => 
            w.id_lokalizacji && Number(w.id_lokalizacji) !== Number(wybranyJarmark.id_lokalizacji)
        );

        if (wpisZajetyGdzieIndziej) {
            // Dodajemy nazwę lokalizacji, do której został wysłany
            const pracownikZZajetymDniem = {
                ...pracownik,
                gdzieWyslany: wpisZajetyGdzieIndziej.punkty_handlu?.nazwa || 'Inny Jarmark'
            };
            grupaZajeci.push(pracownikZZajetymDniem);
            return; // Zamykamy sprawdzanie tej osoby, by nie trafiła do Pewniaków
        }

        // 3. Skoro nie jest nigdzie wysłany, sprawdzamy dostępność
        const iloscDniDostepnych = wpisyWDniachHandlu.filter((w: any) => w.dostepnosc?.trim().toLowerCase() === 'dostepny').length;

        if (iloscDniDostepnych === zakresDatHandlu.length && zakresDatHandlu.length > 0) { grupaPewniacy.push(pracownik); return; }

        const czyDostepnyWOkolicy = wpisyPracownika.some((w: any) => 
            w.dostepnosc?.trim().toLowerCase() === 'dostepny' && dniOkoliczne.includes(znormalizujDate(w.data))
        );
        if ((iloscDniDostepnych > 0 && iloscDniDostepnych < zakresDatHandlu.length) || czyDostepnyWOkolicy) { grupaDoObgadania.push(pracownik); return; }

        // 4. Jeśli nie pasuje nigdzie wyżej, ląduje w reszcie
        grupaReszta.push(pracownik);
      });

      setPewniacy(grupaPewniacy); 
      setDoObgadania(grupaDoObgadania); 
      setResztaPracownikow(grupaReszta); 
      setPrzypisaniPracownicy(listaPrzypisanych);
      setZajeciPracownicy(grupaZajeci);
      
    } catch (err) { console.error(err); }
  };

  useEffect(() => { zaladujDaneMenedzerskie(); }, [userProfil]);
  useEffect(() => { analizujDostepnoscIPrzeliczGrupy(); }, [wybranyJarmark, dataOd, dataDo, szukanaFraza, filtrRejonu]);

  const przypiszPracownika = async (idUzytkownika: number, wymuszone: boolean = false) => {
    if (!wybranyJarmark) return;
    const zakresDatHandlu = pobierzTabliceDatZakresu(dataOd, dataDo);
    try {
      for (const dataStr of zakresDatHandlu) {
        await adminService.przypiszPracownikaDoJarmarku(idUzytkownika, dataStr, wybranyJarmark.id_lokalizacji, wymuszone);
      }
      await analizujDostepnoscIPrzeliczGrupy();
    } catch (err: any) { alert(`Błąd przypisywania. Supabase zwraca: ${err.message}`); }
  };

  const usunPrzypisaniePracownika = async (idUzytkownika: number) => {
    const zakresDatHandlu = pobierzTabliceDatZakresu(dataOd, dataDo);
    try {
      for (const dataStr of zakresDatHandlu) await adminService.przypiszPracownikaDoJarmarku(idUzytkownika, dataStr, null);
      await analizujDostepnoscIPrzeliczGrupy();
    } catch (err: any) { alert(`Błąd usuwania przypisania. Supabase zwraca: ${err.message}`); }
  };

  return {
    widoczneJarmarki, wybranyJarmark, setWybranyJarmark, loadingAdmin,
    pewniacy, doObgadania, resztaPracownikow, przypisaniPracownicy, zajeciPracownicy, // WYEKSPORTOWANO STAN!
    dataOd, setDataOd, dataDo, setDataDo,
    szukanaFraza, setSzukanaFraza, przypiszPracownika, usunPrzypisaniePracownika,
    userProfil, listaRejonow, filtrRejonu, setFiltrRejonu
  };
}