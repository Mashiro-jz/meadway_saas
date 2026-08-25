"use client";

import { useState, useEffect } from "react";
import { adminService } from "../services/adminService";

// Brak parametru
export function usePunktyHandlu() {
  const [punkty, setPunkty] = useState<any[]>([]);
  const [rejony, setRejony] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [szukanaFraza, setSzukanaFraza] = useState("");
  const [filtrRejonu, setFiltrRejonu] = useState("ALL");
  const [sortowanie, setSortowanie] = useState<"nazwa" | "rejon" | "cena">(
    "nazwa",
  );
  const [kierunekSortowania, setKierunekSortowania] = useState<"asc" | "desc">(
    "asc",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [edytowanyPunkt, setEdytowanyPunkt] = useState<any>(null); 

  const pobierzDane = async () => {
    setLoading(true);
    try {
      const [pData, rData] = await Promise.all([
        adminService.getAllPunktyHandlu(),
        adminService.getRejony(),
      ]);
      setPunkty(pData);
      setRejony(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pobierzDane();
  }, []);

  const zapiszPunkt = async (formData: any, idPunktu?: number) => {
    try {
      await adminService.savePunktHandlu(formData, idPunktu);
      setIsModalOpen(false);
      setEdytowanyPunkt(null);
      await pobierzDane();
    } catch (err: any) {
      alert(`Błąd zapisu w bazie: ${err.message}`);
    }
  };

  const usunPunkt = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten punkt handlu?")) return;
    try {
      await adminService.deletePunktHandlu(id);
      await pobierzDane();
    } catch (err: any) {
      alert(`Błąd usuwania: ${err.message}`);
    }
  };

  const przefiltrowaneIPosortowane = punkty
    .filter((p) => {
      const matchNazwa = `${p.nazwa} ${p.lokalizacja}`
        .toLowerCase()
        .includes(szukanaFraza.toLowerCase());
      const matchRejon =
        filtrRejonu === "ALL" || String(p.id_rejonu) === filtrRejonu;
      return matchNazwa && matchRejon;
    })
    .sort((a, b) => {
      let valA = a[sortowanie];
      let valB = b[sortowanie];

      if (sortowanie === "rejon") {
        valA = a.rejony?.nazwa || "";
        valB = b.rejony?.nazwa || "";
      }

      if (typeof valA === "string") {
        return kierunekSortowania === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return kierunekSortowania === "asc"
        ? (valA || 0) - (valB || 0)
        : (valB || 0) - (valA || 0);
    });

  return {
    punkty: przefiltrowaneIPosortowane,
    rejony,
    loading,
    szukanaFraza,
    setSzukanaFraza,
    filtrRejonu,
    setFiltrRejonu,
    sortowanie,
    setSortowanie,
    kierunekSortowania,
    setKierunekSortowania,
    isModalOpen,
    setIsModalOpen,
    edytowanyPunkt,
    otworzModalNowy: () => {
      setEdytowanyPunkt(null);
      setIsModalOpen(true);
    },
    otworzModalEdycja: (p: any) => {
      setEdytowanyPunkt(p);
      setIsModalOpen(true);
    },
    zapiszPunkt,
    usunPunkt,
  };
}