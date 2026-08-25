import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

// Brak parametru - interfejs nie musi wiedzieć nic o profilu!
export function usePracownicy() {
  const [pracownicyBD, setPracownicyBD] = useState<any[]>([]);
  const [rejony, setRejony] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [szukanaFraza, setSzukanaFraza] = useState('');
  const [filtrRejonu, setFiltrRejonu] = useState('ALL');
  const [filtrRoli, setFiltrRoli] = useState('ALL');
  const [sortowanie, setSortowanie] = useState<'nazwisko' | 'imie' | 'rola'>('nazwisko');
  const [kierunekSortowania, setKierunekSortowania] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edytowanyPracownik, setEdytowanyPracownik] = useState<any>(null);

  const pobierzDane = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        adminService.getWszyscyPracownicy(),
        adminService.getRejony()
      ]);
      setPracownicyBD(u);
      setRejony(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pobierzDane();
  }, []);

  const otworzModalNowy = () => {
    setEdytowanyPracownik(null);
    setIsModalOpen(true);
  };

  const otworzModalEdycja = (pracownik: any) => {
    setEdytowanyPracownik(pracownik);
    setIsModalOpen(true);
  };

  const zapiszPracownika = async (formData: any, idUzytkownika?: number) => {
    try {
      // Wywołujemy po prostu serwis (a on w tle załatwia całą sprawę audytu)
      await adminService.savePracownik(formData, idUzytkownika);
      setIsModalOpen(false);
      setEdytowanyPracownik(null);
      await pobierzDane();
    } catch (err: any) {
      alert(`Błąd zapisu w bazie: ${err.message}`);
    }
  };

  const usunPracownika = async (idUzytkownika: number) => {
    if (confirm("Czy na pewno chcesz usunąć tego pracownika? Ta akcja jest nieodwracalna.")) {
      try {
        await adminService.deletePracownik(idUzytkownika);
        await pobierzDane();
      } catch (err: any) {
        alert(`Błąd usuwania z bazy: ${err.message}`);
      }
    }
  };

  const pracownicy = pracownicyBD
    .filter(p => {
      const imieNazwisko = `${p.imie || ''} ${p.nazwisko || ''}`.toLowerCase();
      const pasujeFraza = imieNazwisko.includes(szukanaFraza.toLowerCase()) || (p.email && p.email.toLowerCase().includes(szukanaFraza.toLowerCase()));
      const pasujeRejon = filtrRejonu === 'ALL' || String(p.id_rejonu) === filtrRejonu;
      const pasujeRola = filtrRoli === 'ALL' || p.rola === filtrRoli;
      return pasujeFraza && pasujeRejon && pasujeRola;
    })
    .sort((a, b) => {
      let valA = a[sortowanie] ? a[sortowanie].toLowerCase() : '';
      let valB = b[sortowanie] ? b[sortowanie].toLowerCase() : '';

      if (valA < valB) return kierunekSortowania === 'asc' ? -1 : 1;
      if (valA > valB) return kierunekSortowania === 'asc' ? 1 : -1;
      return 0;
    });

  return {
    pracownicy, rejony, loading,
    szukanaFraza, setSzukanaFraza,
    filtrRejonu, setFiltrRejonu,
    filtrRoli, setFiltrRoli,
    sortowanie, setSortowanie,
    kierunekSortowania, setKierunekSortowania,
    isModalOpen, setIsModalOpen,
    edytowanyPracownik,
    otworzModalNowy, otworzModalEdycja,
    zapiszPracownika, usunPracownika
  };
}