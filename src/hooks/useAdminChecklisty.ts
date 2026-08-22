import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { adminService } from '../services/adminService';

export function useAdminChecklisty() {
  const [checklisty, setChecklisty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [szukanaFraza, setSzukanaFraza] = useState('');
  const [szukaneImie, setSzukaneImie] = useState('');
  const [szukaneNazwisko, setSzukaneNazwisko] = useState('');
  const [filtrRejonu, setFiltrRejonu] = useState('ALL');
  const [dataOd, setDataOd] = useState('');
  const [dataDo, setDataDo] = useState('');
  
  const [sortowanie, setSortowanie] = useState('data');
  const [kierunekSortowania, setKierunekSortowania] = useState<'asc' | 'desc'>('desc');

  const [rejony, setRejony] = useState<any[]>([]);

  // STANY DLA SZCZEGÓŁÓW CHECKLISTY
  const [rozszerzonaLista, setRozszerzonaLista] = useState<number | null>(null);
  const [szczegoly, setSzczegoly] = useState<Record<number, { inwentaryzacja: any[], zdjecia: any }>>({});
  const [loadingSzczegoly, setLoadingSzczegoly] = useState<Record<number, boolean>>({});

  useEffect(() => {
    supabase.from('rejony').select('id_rejonu, nazwa').order('nazwa').then(({ data }) => {
      if (data) setRejony(data);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchChecklisty(); }, 300); 
    return () => clearTimeout(timer);
  }, [page, pageSize, szukanaFraza, szukaneImie, szukaneNazwisko, filtrRejonu, dataOd, dataDo, sortowanie, kierunekSortowania]);

  const fetchChecklisty = async () => {
    setLoading(true);

    let query = supabase.from('widok_raportow_admina').select('*', { count: 'exact' }); 

    if (szukanaFraza) query = query.ilike('nazwa_punktu', `%${szukanaFraza}%`);
    if (szukaneImie) query = query.ilike('imie', `%${szukaneImie}%`);
    if (szukaneNazwisko) query = query.ilike('nazwisko', `%${szukaneNazwisko}%`);
    if (filtrRejonu !== 'ALL') query = query.eq('id_rejonu', filtrRejonu);
    if (dataOd) query = query.gte('data', dataOd);
    if (dataDo) query = query.lte('data', dataDo);

    query = query.order(sortowanie, { ascending: kierunekSortowania === 'asc' });

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;

    if (!error && data) {
      setChecklisty(data);
      if (count !== null) setTotalCount(count);
    } else {
      console.error('Błąd pobierania checklist:', error);
    }
    
    setLoading(false);
  };

  // FUNKCJA DOCIĄGAJĄCA DETALE (Teraz jest w Hooku!)
  const toggleLista = async (id: number) => {
    if (rozszerzonaLista === id) {
      setRozszerzonaLista(null);
      return;
    }
    
    setRozszerzonaLista(id);

    if (!szczegoly[id]) {
      setLoadingSzczegoly(prev => ({ ...prev, [id]: true }));
      try {
        const { data: inw } = await supabase
          .from('check_lista_inwentaryzacja')
          .select('id, ilosc_rano, ilosc_wieczor, produkty(nazwa)')
          .eq('id_checklisty', id)
          .order('id', { ascending: true });

        const zdj = await adminService.getZdjeciaDlaChecklisty(id);

        setSzczegoly(prev => ({ 
          ...prev, 
          [id]: { inwentaryzacja: inw || [], zdjecia: zdj } 
        }));
      } catch (err) {
        console.error("Błąd pobierania detali:", err);
      } finally {
        setLoadingSzczegoly(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  return {
    checklisty, loading, 
    page, setPage, pageSize, setPageSize, totalCount,
    szukanaFraza, setSzukanaFraza, szukaneImie, setSzukaneImie, szukaneNazwisko, setSzukaneNazwisko,
    filtrRejonu, setFiltrRejonu, dataOd, setDataOd, dataDo, setDataDo,
    sortowanie, setSortowanie, kierunekSortowania, setKierunekSortowania,
    rejony,
    // NOWE POLA DLA SZCZEGÓŁÓW
    rozszerzonaLista,
    szczegoly,
    loadingSzczegoly,
    toggleLista
  };
}