import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Optymalizacja czcionek: display: "swap" zapobiega blokowaniu renderowania strony (poprawia wskaźnik LCP)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Profesjonalne metadane dostosowane pod Twój SaaS (wpływa na SEO i czytelność zakładek)
export const metadata: Metadata = {
  title: "Meadway SaaS — System Raportów Jarmarkowych",
  description: "Aplikacja do sprawnego rozliczania poranków i wieczorów na stoiskach handlowych",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // className="h-full" na tagu html jest kluczowa dla mobilnych przeglądarek, aby zapobiec skakaniu ekranu
    <html lang="pl" className="h-full" suppressHydrationWarning>
      <body 
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          min-h-screen 
          bg-slate-100 
          text-slate-900 
          flex 
          flex-col
        `}
      >
        {/* Kontener główny izolujący aplikację, ułatwiający utrzymanie równego układu na telefonach */}
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </body>
    </html>
  );
}