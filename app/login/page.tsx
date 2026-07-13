'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError('Błędny e-mail lub hasło. Spróbuj ponownie.');
        setLoading(false);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd sieciowy.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-amber-50/40">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 max-w-md w-full border border-slate-100/80">
        
        {/* Sekcja Brandingowa */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl text-3xl mb-3 shadow-inner">
            🍯
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Meadway SaaS</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">System Rozliczeń Jarmarkowych</p>
        </div>
        
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100 animate-headShake">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* POLE: E-MAIL */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">E-mail pracownika</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                </svg>
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="aleksander@miody.pl"
              />
            </div>
          </div>

          {/* POLE: HASŁO */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Hasło dostępu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="••••••••"
              />
              {/* Przełącznik oka widoczności hasła */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition touch-manipulation"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3.15 3.15m-3.15-3.15-2.047-2.047m-3.65-3.65a3.75 3.75 0 1 1-5.304-5.304m5.304 5.304 1.28-1.28" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 cursor-pointer text-sm mt-2"
          >
            {loading ? 'Uwierzytelnianie...' : 'Zaloguj się do systemu'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-[10px] font-mono text-slate-300">Meadway Core Node v2.0 • Secure Auth</p>
        </div>
      </div>
    </main>
  );
}