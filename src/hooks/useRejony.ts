import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

// Brak parametru
export function useRejony() {
  const [rejonyBD, setRejonyBD] = useState<any[]>([]);
  const [koordynatorzy, setKoordynatorzy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [szukanaFraza, setSzukanaFraza] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edytowanyRejon, setEdytowanyRejon] = useState<any>(null);

  const pobierzDane = async () => {
    setLoading(true);
    try {
      const [r, k] = await Promise.all([
        adminService.getRejonyZKoordynatorami(),
        adminService.getDostepniKoordynatorzy()
      ]);
      setRejonyBD(r);
      setKoordynatorzy(k);
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
    setEdytowanyRejon(null);
    setIsModalOpen(true);
  };

  const otworzModalEdycja = (rejon: any) => {
    setEdytowanyRejon(rejon);
    setIsModalOpen(true);
  };

  const zapiszRejon = async (formData: any, idRejonu?: number) => {
    try {
      await adminService.saveRejon(formData, idRejonu);
      setIsModalOpen(false);
      setEdytowanyRejon(null);
      await pobierzDane();
    } catch (err: any) {
      alert(`Błąd zapisu w bazie: ${err.message}`);
    }
  };

  const usunRejon = async (idRejonu: number) => {
    if (confirm("Czy na pewno chcesz usunąć ten rejon? Usunięcie powiązanego rejonu może wpłynąć na konta pracowników!")) {
      try {
        await adminService.deleteRejon(idRejonu);
        await pobierzDane();
      } catch (err: any) {
        alert(`Błąd usuwania z bazy: ${err.message}`);
      }
    }
  };

  const rejony = rejonyBD.filter(r => 
    r.nazwa.toLowerCase().includes(szukanaFraza.toLowerCase())
  );

  return {
    rejony, koordynatorzy, loading,
    szukanaFraza, setSzukanaFraza,
    isModalOpen, setIsModalOpen,
    edytowanyRejon,
    otworzModalNowy, otworzModalEdycja,
    zapiszRejon, usunRejon
  };
}