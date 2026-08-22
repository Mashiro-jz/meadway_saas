import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function useAdminChecklisty() {
  const [checklisty, setChecklisty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Paginacja Server-Side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filtry podstawowe
  const [szukanaFraza, setSzukanaFraza] = useState(''); // Punkt handlu
  const [filtrRejonu, setFiltrRejonu] = useState('ALL');
  const [dataOd, setDataOd] = useState('');
  const [dataDo, setDataDo] = useState('');

  // Filtry zaawansowane (Pracownik)
  const [szukaneImie, setSzukaneImie] = useState('');
  const [szukaneNazwisko, setSzukaneNazwisko] = useState('');
  
  // Sortowanie (Usunięto created_at, zostawiono tylko datę handlu, gotowe na dodanie kolejnych w przyszłości)
  const [sortowanie, setSortowanie] = useState('data');
  const [kierunekSortowania, setKierunekSortowania] = useState<'asc' | 'desc'>('desc');

  const [rejony, setRejony] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('rejony').select('id_rejonu, nazwa').order('nazwa').then(({ data }) => {
      if (data) setRejony(data);
    });
  }, []);

  // Debouncing na wszystkie filtry
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChecklisty();
    }, 300); 
    
    return () => clearTimeout(timer);
  }, [page, pageSize, szukanaFraza, szukaneImie, szukaneNazwisko, filtrRejonu, dataOd, dataDo, sortowanie, kierunekSortowania]);

  const fetchChecklisty = async () => {
    setLoading(true);

    let query = supabase
      .from('check_lista')
      .select(`
        id_checklisty,
        data,
        created_at,
        uwagi,
        uzytkownicy!inner ( id_uzytkownika, imie, nazwisko ),
        punkty_handlu!inner ( id_lokalizacji, nazwa, rejony!inner(id_rejonu, nazwa) ),
        check_lista_towar ( butelki_sprzedane, sloiki_sprzedane ),
        check_lista_finanse ( przychod_gotowka_pln, przychod_sumup )
      `, { count: 'exact' }); 

    // --- FILTRY ---
    if (szukanaFraza) {
      query = query.ilike('punkty_handlu.nazwa', `%${szukanaFraza}%`);
    }

    if (szukaneImie) {
      query = query.ilike('uzytkownicy.imie', `%${szukaneImie}%`);
    }

    if (szukaneNazwisko) {
      query = query.ilike('uzytkownicy.nazwisko', `%${szukaneNazwisko}%`);
    }

    if (filtrRejonu !== 'ALL') {
      query = query.eq('punkty_handlu.rejony.id_rejonu', filtrRejonu);
    }

    if (dataOd) query = query.gte('data', dataOd);
    if (dataDo) query = query.lte('data', dataDo);

    // --- SORTOWANIE ---
    query = query.order(sortowanie, { ascending: kierunekSortowania === 'asc' });

    // --- PAGINACJA ---
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (!error && data) {
      setChecklisty(data);
      if (count !== null) setTotalCount(count);
    } else {
      console.error('Błąd pobierania checklist:', error);
    }
    
    setLoading(false);
  };

  return {
    checklisty, loading, 
    page, setPage, pageSize, setPageSize, totalCount,
    szukanaFraza, setSzukanaFraza, 
    szukaneImie, setSzukaneImie,
    szukaneNazwisko, setSzukaneNazwisko,
    filtrRejonu, setFiltrRejonu, dataOd, setDataOd, dataDo, setDataDo,
    sortowanie, setSortowanie, kierunekSortowania, setKierunekSortowania,
    rejony
  };
}