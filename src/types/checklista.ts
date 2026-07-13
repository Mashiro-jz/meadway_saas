export interface PoranekState {
  butelkiPuste: string;
  butelkiProtocudak: string;
  butelkiPelne: string;
  sloikiPelne: string;
}

export interface WieczorState {
  dostawa: string;
  probki: string;
  stluczki: string;
  butelkiSprzedane: string;
  sloikiSprzedane: string;
  koncowePuste: string;
  koncoweProtocudak: string;
  koncowePelne: string;
  koncoweSloiki: string;
}

export interface OgolneState {
  godzinyHandlowe: string;
  godzinyNiehandlowe: string;
  numerKasy: string;
  uwagi: string;
}

export interface FinanseState {
  sztukKasa: string;
  kwotaBrutto: string;
  gotowka: string;
  sumup: string;
  waluty: string;
  trasa: string;
  kilometry: string;
  nocleg: string;
  kosztaInne: string;
}

export interface StatusyState {
  pracaPoza: boolean;
  otwartoZgodnie: boolean;
  zdjecieStan: boolean;
  zdjecieDo: boolean;
  raportyNaKasie: boolean;
  dyskKasa: boolean;
  dyskSumUp: boolean;
}