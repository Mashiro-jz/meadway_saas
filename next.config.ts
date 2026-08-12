import type { NextConfig } from "next";

// Tworzymy pustą tablicę i ładujemy do niej to, co znajdzie w pliku .env.local
const devOrigins: string[] = [];

if (process.env.LOCAL_IP) devOrigins.push(process.env.LOCAL_IP);
if (process.env.NGROK_URL) devOrigins.push(process.env.NGROK_URL);

const nextConfig: NextConfig = {
  // Jeśli jesteśmy w trybie developerskim, wrzucamy mu te adresy. 
  // W produkcji (na Vercelu) tablica może być pusta.
  allowedDevOrigins: devOrigins.length > 0 ? devOrigins : undefined,
};

export default nextConfig;