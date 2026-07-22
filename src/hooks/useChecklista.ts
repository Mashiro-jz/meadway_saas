"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { checklistaService } from "../services/checklistaService";
import {
  PoranekState,
  WieczorState,
  OgolneState,
  FinanseState,
  StatusyState,
} from "../types/checklista";

function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatujCiagDat(wybraneDni: any[]): string {
  if (wybraneDni.length === 0) return "";
  if (wybraneDni.length === 1)
    return new Date(wybraneDni[0].data).toLocaleDateString("pl-PL");
  const datyObj = wybraneDni.map((d) => new Date(d.data));
  const dni = datyObj.map((d) => String(d.getDate()).padStart(2, "0"));
  return `${dni[0]}-${dni[dni.length - 1]}.${String(datyObj[0].getMonth() + 1).padStart(2, "0")}.${datyObj[0].getFullYear()}`;
}

export function useChecklista(router: any) {
  const [user, setUser] = useState<any>(null);
  const [userProfil, setUserProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [stoiska, setStoiska] = useState<any[]>([]);
  const [selectedStoisko, setSelectedStoisko] = useState("");
  const [activeChecklista, setActiveChecklista] = useState<any>(null);

  const [aktywnaZakladka, setAktywnaZakladka] = useState<"handel" | "formatki" | "grafik">("handel");
  const [czySzufladaOtwarta, setCzySzufladaOtwarta] = useState(false);
  const [historiaChecklist, setHistoriaChecklist] = useState<any[]>([]);
  const [selectedChecklistIds, setSelectedChecklistIds] = useState<number[]>([]);

  const [dniGrafiku, setDniGrafiku] = useState<any[]>([]);
  const [wybranyMiesiac, setWybranyMiesiac] = useState(new Date().getMonth() + 1);
  const [wybranyRok, setWybranyRok] = useState(new Date().getFullYear());
  const [aktywnyPunktPopup, setAktywnyPunktPopup] = useState<any>(null);

  const [fileStanowisko, setFileStanowisko] = useState<File | null>(null);
  const [fileKasa, setFileKasa] = useState<File | null>(null);
  const [fileSumUp, setFileSumUp] = useState<File | null>(null);

  const [czyTrybEdycji, setCzyTrybEdycji] = useState(false);
  const [buforGrafiku, setBuforGrafiku] = useState<{ [dataStr: string]: string }>({});
  const [oryginalneWpisyZ_BD, setOryginalneWpisyZ_BD] = useState<any[]>([]);

  const [poranek, setPoranek] = useState<PoranekState>({
    butelkiPuste: "",
    butelkiProtocudak: "",
    butelkiPelne: "",
    sloikiPelne: "",
  });
  const [wieczor, setWieczor] = useState<WieczorState>({
    dostawa: "",
    probki: "",
    stluczki: "",
    butelkiSprzedane: "",
    sloikiSprzedane: "",
    koncowePuste: "",
    koncoweProtocudak: "",
    koncowePelne: "",
    koncoweSloiki: "",
  });
  const [ogolne, setOgolne] = useState<OgolneState>({
    godzinyHandlowe: "",
    godzinyNiehandlowe: "",
    numerKasy: "",
    uwagi: "",
  });
  const [finanse, setFinanse] = useState<FinanseState>({
    sztukKasa: "",
    kwotaBrutto: "",
    gotowka: "",
    sumup: "",
    waluty: "",
    trasa: "",
    kilometry: "",
    nocleg: "",
    kosztaInne: "",
    kosztaInneOpis: "",
  });
  const [statusy, setStatusy] = useState<StatusyState>({
    zdjcStan: false,
    zdjcDo: false,
    pracaPoza: false,
    otwartoZgodnie: false,
    zdjecieStan: false,
    zdjecieDo: false,
    raportyNaKasie: false,
    dyskKasa: false,
    dyskSumUp: false,
  });

  const tDataZazwyczaj = activeChecklista?.check_lista_towar?.[0] || activeChecklista?.check_lista_towar;
  const ranoButelki = Number(tDataZazwyczaj?.rano_butelki_pelne || 0);
  const oczekiwaneButelkiPelne = ranoButelki + Number(wieczor.dostawa || 0) - Number(wieczor.probki || 0) - Number(wieczor.stluczki || 0) - Number(wieczor.butelkiSprzedane || 0);
  const roznicaButelki = Number(wieczor.koncowePelne || 0) - oczekiwaneButelkiPelne;

  const ranoSloiki = Number(tDataZazwyczaj?.rano_sloiki_pelne || 0);
  const oczekiwaneSloikiPelne = ranoSloiki - Number(wieczor.sloikiSprzedane || 0);
  const roznicaSloiki = Number(wieczor.koncoweSloiki || 0) - oczekiwaneSloikiPelne;

  const generujDniMiesiaca = (rok: number, miesiac: number, daneZ_BD: any[]) => {
    setOryginalneWpisyZ_BD(daneZ_BD);
    const liczbaDni = new Date(rok, miesiac, 0).getDate();
    const tablicaDni = [];
    const dniTygodnia = ["nd", "pn", "wt", "śr", "czw", "pt", "sob"];

    for (let i = 1; i <= liczbaDni; i++) {
      const dataStr = `${rok}-${String(miesiac).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dzienTygIndex = new Date(rok, miesiac - 1, i).getDay();
      const istniejącyWpis = daneZ_BD.find((d) => d.data === dataStr);

      tablicaDni.push({
        data: dataStr,
        dzienMiesiaca: i,
        dzienTygodnia: dniTygodnia[dzienTygIndex],
        nrTygodnia: getWeekNumber(dataStr),
        dostepnosc: istniejącyWpis ? istniejącyWpis.dostepnosc : "nieznana",
        punkty_handlu: istniejącyWpis?.punkty_handlu || null,
        wymuszone: istniejącyWpis?.wymuszone || false,
      });
    }
    setDniGrafiku(tablicaDni);
  };

  const syncChecklistState = async (currentUser: any, stoiskoId?: string) => {
    if (!currentUser) return;
    try {
      const profil = await checklistaService.getProfil(currentUser.email);
      if (!profil) return;
      setUserProfil(profil);

      const dzis = new Date().toLocaleDateString("sv-SE");
      const checklisty = await checklistaService.getTodayChecklists(profil.id_uzytkownika, dzis);
      const historia = await checklistaService.getCompletedChecklists(profil.id_uzytkownika);
      setHistoriaChecklist(historia);

      const daneGrafiku = await checklistaService.getGrafikMiesiaca(profil.id_uzytkownika, wybranyRok, wybranyMiesiac);
      generujDniMiesiaca(wybranyRok, wybranyMiesiac, daneGrafiku);

      if (checklisty.length > 0) {
        const uncompleted = checklisty.find((c: any) => !c.data_wygenerowania_formatki);
        if (uncompleted) {
          setSelectedStoisko(uncompleted.id_lokalizacji.toString());
          setActiveChecklista(uncompleted);
          return;
        }
      }
      
      // Zabezpieczenie: Przy twardym przeładowaniu używamy bezpiecznego ID przekazanego z useEffect
      const targetId = stoiskoId || selectedStoisko;
      if (targetId) {
        setActiveChecklista(checklisty.find((c: any) => c.id_lokalizacji === parseInt(targetId)) || null);
      } else {
        setActiveChecklista(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const kliknijDzienWBuforze = (dataStr: string, obecnaDostepnosc: string) => {
    if (!czyTrybEdycji) return;
    const opcje = ["nieznana", "dostepny", "nd", "nz"];
    const stanWBuforze = buforGrafiku[dataStr] !== undefined ? buforGrafiku[dataStr] : obecnaDostepnosc;
    const nastepnyIndex = (opcje.indexOf(stanWBuforze) + 1) % opcje.length;
    
    setBuforGrafiku({
      ...buforGrafiku,
      [dataStr]: opcje[nastepnyIndex]
    });
  };

  const odpalTrybEdycji = () => {
    setBuforGrafiku({});
    setCzyTrybEdycji(true);
  };

  const anulujEdycje = () => {
    setBuforGrafiku({});
    setCzyTrybEdycji(false);
  };

  const zapiszEdycjeHurtowa = async () => {
    setSending(true);
    try {
      const wpisyDoZapisu: any[] = [];
      const datyDoUsuniecia: string[] = [];

      Object.entries(buforGrafiku).forEach(([dataStr, nowyStatus]) => {
        const oryginalnyWpis = oryginalneWpisyZ_BD.find(o => o.data === dataStr);
        
        if (nowyStatus === "nieznana") {
          if (oryginalnyWpis) datyDoUsuniecia.push(dataStr);
        } else {
          wpisyDoZapisu.push({
            id_uzytkownika: userProfil.id_uzytkownika,
            data: dataStr,
            dostepnosc: nowyStatus,
            id_lokalizacji: oryginalnyWpis?.id_lokalizacji || null
          });
        }
      });

      await checklistaService.zapiszGrafikHurtowo(userProfil.id_uzytkownika, wpisyDoZapisu, datyDoUsuniecia);
      
      const daneGrafiku = await checklistaService.getGrafikMiesiaca(userProfil.id_uzytkownika, wybranyRok, wybranyMiesiac);
      generujDniMiesiaca(wybranyRok, wybranyMiesiac, daneGrafiku);
      
      setCzyTrybEdycji(false);
      setBuforGrafiku({});
    } catch (err) {
      alert("Nie udało się zapisać zmian w grafiku.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (userProfil?.id_uzytkownika) {
      setCzyTrybEdycji(false);
      setBuforGrafiku({});
      checklistaService
        .getGrafikMiesiaca(userProfil.id_uzytkownika, wybranyRok, wybranyMiesiac)
        .then((dane) => generujDniMiesiaca(wybranyRok, wybranyMiesiac, dane));
    }
  }, [wybranyMiesiac, wybranyRok, userProfil]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      try {
        // ZMIANA: Najpierw pobieramy listę stoisk i ustalamy domyślne, 
        // a dopiero POTEM wywołujemy synchronizację z tym domyślnym ID.
        const stoiskaData = await checklistaService.getStoiska();
        let domyslneStoisko = "";
        
        if (stoiskaData.length > 0) {
          setStoiska(stoiskaData);
          domyslneStoisko = stoiskaData[0].id_lokalizacji.toString();
          setSelectedStoisko(domyslneStoisko);
        }
        
        // Bezpieczne przekazanie ustalonego stoiska rozwiązuje problem blokady po odświeżeniu
        await syncChecklistState(user, domyslneStoisko);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const toggleChecklistSelection = (id: number) => {
    setSelectedChecklistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const zmienDostepnoscDnia = async (dataStr: string, obecnaDostepnosc: string) => {
    const opcje = ["nieznana", "dostepny", "nd", "nz"];
    const nastepnyIndex = (opcje.indexOf(obecnaDostepnosc) + 1) % opcje.length;
    const nowaDostepnosc = opcje[nastepnyIndex];

    try {
      await checklistaService.zapiszDostepnosc(userProfil.id_uzytkownika, dataStr, nowaDostepnosc);
      const daneGrafiku = await checklistaService.getGrafikMiesiaca(userProfil.id_uzytkownika, wybranyRok, wybranyMiesiac);
      generujDniMiesiaca(wybranyRok, wybranyMiesiac, daneGrafiku);
    } catch (err) {
      alert("Nie udało się zapisać dostępności.");
    }
  };

  const handleStoiskoChange = async (id: string) => {
    setSelectedStoisko(id);
    setLoading(true);
    setSuccessMsg('');
    setPoranek({ butelkiPuste: "", butelkiProtocudak: "", butelkiPelne: "", sloikiPelne: "" });
    setOgolne({ godzinyHandlowe: "", godzinyNiehandlowe: "", numerKasy: "", uwagi: "" });
    setWieczor({ dostawa: "", probki: "", stluczki: "", butelkiSprzedane: "", sloikiSprzedane: "", koncowePuste: "", koncoweProtocudak: "", koncowePelne: "", koncoweSloiki: "" });
    setFinanse({ sztukKasa: "", kwotaBrutto: "", gotowka: "", sumup: "", waluty: "", trasa: "", kilometry: "", nocleg: "", kosztaInne: "", kosztaInneOpis: "" });
    setFileStanowisko(null);
    setFileKasa(null);
    setFileSumUp(null);
    
    await syncChecklistState(user, id);
    setLoading(false);
  };

  const handlePoranekSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileStanowisko) {
      alert("⚠️ Dodaj zdjęcie stoiska.");
      return;
    }
    setSending(true);
    try {
      const poranneStatusy = { ...statusy, zdjecieStan: true, zdjecieDo: true };
      const nowaChecklista = await checklistaService.zapiszPoranek(
        userProfil.id_uzytkownika,
        parseInt(selectedStoisko),
        new Date().toLocaleDateString("sv-SE"),
        poranek,
        poranneStatusy,
      );
      await checklistaService.uploadFoto(nowaChecklista.id_checklisty, "stanowisko", fileStanowisko);
      setSuccessMsg("Poranek został pomyślnie rozliczony! ☀️");
      await syncChecklistState(user, selectedStoisko);

      setPoranek({ butelkiPuste: "", butelkiProtocudak: "", butelkiPelne: "", sloikiPelne: "" });
      setFileStanowisko(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleWieczorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileKasa || !fileSumUp) {
      alert("⚠️ Brak załączników.");
      return;
    }
    setSending(true);
    try {
      const idC = activeChecklista.id_checklisty;
      await checklistaService.uploadFoto(idC, "kasa", fileKasa);
      await checklistaService.uploadFoto(idC, "sumup", fileSumUp);
      await checklistaService.zapiszWieczor(idC, ogolne, wieczor, finanse, {
        ...statusy,
        dyskKasa: true,
        dyskSumUp: true,
      });
      setSuccessMsg("Stoisko zamknięte i w pełni rozliczone! 🍯🌙");
      await syncChecklistState(user, selectedStoisko);

      setPoranek({ butelkiPuste: "", butelkiProtocudak: "", butelkiPelne: "", sloikiPelne: "" });
      setOgolne({ godzinyHandlowe: "", godzinyNiehandlowe: "", numerKasy: "", uwagi: "" });
      setWieczor({ dostawa: "", probki: "", stluczki: "", butelkiSprzedane: "", sloikiSprzedane: "", koncowePuste: "", koncoweProtocudak: "", koncowePelne: "", koncoweSloiki: "" });
      setFinanse({ sztukKasa: "", kwotaBrutto: "", gotowka: "", sumup: "", waluty: "", trasa: "", kilometry: "", nocleg: "", kosztaInne: "", kosztaInneOpis: "" });
      setFileStanowisko(null);
      setFileKasa(null);
      setFileSumUp(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const generujFormatkePDF = async () => {
    const wybraneDni = historiaChecklist
      .filter((c) => selectedChecklistIds.includes(c.id_checklisty))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const pierwszyDzien = wybraneDni[0];
    const STAWKA_PALIWOWA = 0.6;
    const STAWKA_GODZINOWA = 31.4;

    let totalGodzHandlowych = 0, totalGodzNiehandlowych = 0, totalButelkiSprzedane = 0, totalButelkiZuzyte = 0, totalPrezentyStluczki = 0, totalSloikiSprzedane = 0, totalWbiteSztuki = 0, totalWbiteBrutto = 0, totalGotowka = 0, totalSumUp = 0, totalWaluty = 0, totalKilometry = 0, totalNocleg = 0, totalInneKoszta = 0, totalPlacowe = 0;
    const kasuSet = new Set<string>(), trasySet = new Set<string>();
    const tablicaButelkiDni: string[] = [], tablicaGodzHandloweDni: string[] = [], tablicaGodzNiehandloweDni: string[] = [];

    wybraneDni.forEach((d) => {
      const t = d.check_lista_towar?.[0] || d.check_lista_towar;
      const f = d.check_lista_finanse?.[0] || d.check_lista_finanse;
      if (d.numer_kasy_fiskalnej) kasuSet.add(d.numer_kasy_fiskalnej);
      if (f?.trasa) trasySet.add(f.trasa);
      tablicaButelkiDni.push(String(t?.butelki_sprzedane || 0));
      tablicaGodzHandloweDni.push(String(d.ilosc_godzin_handlowych || 0));
      tablicaGodzNiehandloweDni.push(String(d.ilosc_godzin_niehandlowych || 0));
      totalGodzHandlowych += Number(d.ilosc_godzin_handlowych || 0);
      totalGodzNiehandlowych += Number(d.ilosc_godzin_niehandlowych || 0);
      totalButelkiSprzedane += t?.butelki_sprzedane || 0;
      totalButelkiZuzyte += t?.ilosc_probki || 0;
      totalPrezentyStluczki += t?.ilosc_prezenty_stluczki || 0;
      totalSloikiSprzedane += t?.sloiki_sprzedane || 0;
      totalWbiteSztuki += f?.ilosc_sztuk_wbita_na_kase || 0;
      totalWbiteBrutto += Number(f?.kwota_brutto_wbita_na_kase || 0);
      totalGotowka += Number(f?.przychod_gotowka_pln || 0);
      totalSumUp += Number(f?.przychod_sumup || 0);
      totalWaluty += Number(f?.przychod_inne_waluty || 0);
      totalKilometry += Number(f?.kilometry || 0);
      totalNocleg += Number(f?.nocleg || 0);
      totalInneKoszta += Number(f?.koszta_inne || 0);
      totalPlacowe += Number(d.punkty_handlu?.cena_stanowiska || 0);
    });

    const fTowarEarliest = wybraneDni[0].check_lista_towar?.[0] || wybraneDni[0].check_lista_towar;
    const fTowarLatest = wybraneDni[wybraneDni.length - 1].check_lista_towar?.[0] || wybraneDni[wybraneDni.length - 1].check_lista_towar;
    const totalPrzychodu = totalGotowka + totalSumUp + totalWaluty;
    const sredniaCena = totalButelkiSprzedane > 0 ? (totalPrzychodu / totalButelkiSprzedane).toFixed(2) : "0.00";
    const butelkiNaGodzine = totalGodzHandlowych > 0 ? (totalButelkiSprzedane / totalGodzHandlowych).toFixed(1) : "0.0";
    const kosztPaliwa = Number((totalKilometry * STAWKA_PALIWOWA).toFixed(2));
    const kosztySuma = kosztPaliwa + totalPlacowe + totalNocleg + totalInneKoszta;
    const podstawaPracownika = Number(((totalGodzHandlowych + totalGodzNiehandlowych) * STAWKA_GODZINOWA).toFixed(2));
    const doPrzekazaniaPLN = Number((totalGotowka - kosztySuma).toFixed(2));
    const nrTygodnia = getWeekNumber(pierwszyDzien.data);
    const stringDatHandlu = formatujCiagDat(wybraneDni);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const fontResponse = await fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer());
    const binary = new Uint8Array(fontResponse);
    let binaryStr = "";
    binary.forEach((b) => (binaryStr += String.fromCharCode(b)));
    doc.addFileToVFS("DejaVuSans.ttf", btoa(binaryStr));
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.setFont("DejaVuSans");

    doc.setFontSize(16); doc.text("FORMATKA OKRESOWA", 14, 20);
    doc.setFontSize(9); doc.text(`Data rozliczenia: ${new Date().toLocaleDateString("pl-PL")}`, 14, 26);
    doc.rect(14, 32, 182, 38); doc.line(14, 45, 196, 45); doc.line(14, 57, 196, 57); doc.line(75, 32, 75, 70); doc.line(135, 32, 135, 70);
    doc.text("Przed", 16, 37); doc.text("Koordynator:", 77, 37); doc.text("Miejsce handlu:", 137, 37);
    doc.text("Daty:", 16, 50); doc.text("Ilość dni:", 77, 50); doc.text("Nr Tygodnia:", 137, 50);
    doc.text("Numer kasy fiskalnej:", 16, 62); doc.text("Ilość sztuk na kasie:", 77, 62); doc.text("Kwota brutto na kasie:", 137, 62);

    doc.text(`${userProfil?.imie || ""} ${userProfil?.nazwisko || ""}`, 16, 41);
    doc.text("Leszek Strzałkowski", 77, 41); doc.text(`${pierwszyDzien.punkty_handlu?.nazwa || "Jarmark"}`, 137, 41);
    doc.text(stringDatHandlu, 16, 54); doc.text(`${wybraneDni.length}`, 77, 54); doc.text(`${nrTygodnia}`, 137, 54);
    doc.text(Array.from(kasuSet).join(", ") || "-", 16, 66); doc.text(`${totalWbiteSztuki} szt`, 77, 66); doc.text(`${totalWbiteBrutto} zł`, 137, 66);

    doc.rect(14, 76, 182, 36); doc.line(14, 88, 196, 88); doc.line(14, 100, 196, 100); doc.line(110, 76, 110, 112);
    doc.text("Wyniki z kolejnych dni:", 16, 81); doc.text("Wynik suma (butelki)", 112, 81);
    doc.text("handlowe godz. z kolejnych dni", 16, 93); doc.text("Suma godz:", 112, 93);
    doc.text("niehandlowe godz. z kolejnych dni", 16, 105); doc.text("Suma godz:", 112, 105);
    doc.text(tablicaButelkiDni.join(", "), 16, 85); doc.text(`${totalButelkiSprzedane} szt`, 112, 85);
    doc.text(tablicaGodzHandloweDni.join(", "), 16, 97); doc.text(`${totalGodzHandlowych} godz.`, 112, 97);
    doc.text(tablicaGodzNiehandloweDni.join(", "), 16, 109); doc.text(`${totalGodzNiehandlowych} godz.`, 112, 109);

    doc.text("INWENTARYZACJA I BILANS TOWAROWY", 14, 119);
    doc.rect(14, 122, 182, 50); doc.line(14, 132, 196, 132); doc.line(14, 142, 196, 142); doc.line(14, 152, 196, 152); doc.line(14, 162, 196, 162); doc.line(65, 122, 65, 172); doc.line(145, 122, 145, 172);
    doc.text("Nazwa Pola (Kolumny)", 16, 127); doc.text("Stan / ilość przed handlem", 67, 127); doc.text("Stan / ilość po handlu", 147, 127);
    doc.text("Butelki pełne", 16, 137); doc.text(`${fTowarEarliest?.rano_butelki_pelne || 0} szt`, 67, 137); doc.text(`${fTowarLatest?.wieczor_butelki_pelne || 0} szt`, 147, 137);
    doc.text("Słoików z miodem", 16, 147); doc.text(`${fTowarEarliest?.rano_sloiki_pelne || 0} szt`, 67, 147); doc.text(`${fTowarLatest?.wieczor_sloiki_pelne || 0} szt`, 147, 147);
    doc.text("Stan butelek puste", 16, 157); doc.text(`${fTowarEarliest?.rano_butelki_puste || 0} szt`, 67, 157); doc.text(`${fTowarLatest?.wieczor_butelki_puste || 0} szt`, 147, 157);
    doc.text("Stan butelek protocudak", 16, 167); doc.text(`${fTowarEarliest?.rano_butelki_protocudak || 0} szt`, 67, 167); doc.text(`${fTowarLatest?.wieczor_butelki_protocudaki || 0} szt`, 147, 167);

    doc.text(`Butelki sprzedane: ${totalButelkiSprzedane} szt`, 14, 178); doc.text(`Słoiki sprzedane: ${totalSloikiSprzedane} szt`, 75, 178);
    doc.text(`Stan butelki zużyte: ${totalButelkiZuzyte} szt`, 14, 183); doc.text(`prezenty, nagody / stłuczki: ${totalPrezentyStluczki} szt`, 75, 183);

    doc.rect(14, 188, 182, 38); doc.line(14, 201, 196, 201); doc.line(14, 213, 196, 213); doc.line(65, 188, 65, 226); doc.line(135, 188, 135, 226);
    doc.text("Przychód - sumup A", 16, 193); doc.text("Średnia cena", 67, 193); doc.text("Trasa:", 137, 193);
    doc.text("Przychód gotówka B", 16, 206); doc.text("Ilość butelek/godzinę", 67, 206); doc.text("Koszt paliwa / dodatek", 137, 206);
    doc.text("Przychód waluta C", 16, 218); doc.text("(A+B+C) Przychód suma:", 67, 218); doc.text("Koszt placowe / Inne:", 137, 218);
    doc.text(`${totalSumUp} zł`, 16, 197); doc.text(`${sredniaCena} zł`, 67, 197); doc.text(`${butelkiNaGodzine} szt/godz`, 67, 210); doc.text(`${totalGotowka} zł`, 16, 210); doc.text(`${totalWaluty} zł`, 16, 222); doc.text(`${totalPrzychodu} zł`, 67, 222);

    const unikalneTrasy = Array.from(trasySet);
    doc.text(unikalneTrasy.length <= 1 ? unikalneTrasy[0] || "-" : unikalneTrasy.slice(0, 2).join(" / "), 137, 197);
    doc.text(`${kosztPaliwa} zł (${totalKilometry} km)`, 137, 210); doc.text(`${totalPlacowe + totalInneKoszta + totalNocleg} zł`, 137, 222);

    doc.rect(14, 232, 182, 16); doc.line(105, 232, 105, 248);
    doc.text("Podstawa/prowizja informacyjnie:", 16, 237); doc.text("Do Przekazania: PLN:", 107, 237);
    doc.text(`${podstawaPracownika} zł`, 16, 243); doc.text(`${doPrzekazaniaPLN} zł`, 107, 243);

    doc.line(14, 272, 64, 272); doc.line(146, 272, 196, 272);
    doc.setFontSize(7); doc.text("Przekazano: (Podpis sprzedawcy)", 14, 276); doc.text("Data przekazania: (Podpis koordynatora)", 146, 276);

    const czystyPracownik = `${userProfil?.imie || "imie"}_${userProfil?.nazwisko || "nazwisko"}`.toLowerCase().replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z");
    doc.save(`formatka_${czystyPracownik}_${stringDatHandlu}.pdf`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return {
    user,
    loading,
    sending,
    successMsg,
    setSuccessMsg,
    stoiska,
    selectedStoisko,
    activeChecklista,
    poranek,
    setPoranek,
    wieczor,
    setWieczor,
    ogolne,
    setOgolne,
    finanse,
    setFinanse,
    statusy,
    setStatusy,
    handleStoiskoChange,
    handlePoranekSubmit,
    handleWieczorSubmit,
    handleLogout,
    roznicaButelki,
    roznicaSloiki,
    oczekiwaneButelkiPelne,
    oczekiwaneSloikiPelne,
    setFileStanowisko,
    setFileKasa,
    setFileSumUp,
    fileStanowisko,
    fileKasa,
    fileSumUp,
    aktywnaZakladka,
    setAktywnaZakladka,
    czySzufladaOtwarta,
    setCzySzufladaOtwarta,
    historiaChecklist,
    selectedChecklistIds,
    toggleChecklistSelection,
    generujFormatkePDF,

    // ZWRACANE WARTOŚCI MODUŁU GRAFIKU
    dniGrafiku,
    wybranyMiesiac,
    setWybranyMiesiac,
    wybranyRok,
    setWybranyRok,
    zmienDostepnoscDnia,
    aktywnyPunktPopup,
    setAktywnyPunktPopup,

    // PARAMETRY EDYCJI HURTOWEJ I BUFOROWANIA
    czyTrybEdycji,
    odpalTrybEdycji,
    anulujEdycje,
    zapiszEdycjeHurtowa,
    buforGrafiku,
    kliknijDzienWBuforze,

    userProfil,
  };
}