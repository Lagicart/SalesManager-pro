
import React, { useState, useEffect } from 'react';
import { Operatore } from '../types';
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, Info, RefreshCw, User, Cloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LoginScreenProps {
  operatori: Operatore[];
  onLogin: (user: Operatore) => void;
}

const BRAND_LOGO_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2332964D'/%3E%3Cpath d='M30 70 L70 30 M45 30 L70 30 L70 55' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const LoginScreen: React.FC<LoginScreenProps> = ({ operatori, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Recupera configurazione DB per check diretto
  const dbConfig = (() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Inserisci sia email che password.');
      setIsLoading(false);
      return;
    }

    // 1. Cerca localmente
    let user = operatori.find(u => u.email.toLowerCase() === cleanEmail);

    // 2. Se non trovato localmente e abbiamo il Cloud, prova check diretto (Last Resort)
    if (!user && dbConfig?.url && dbConfig?.key) {
      try {
        const supabase = createClient(dbConfig.url, dbConfig.key);
        const { data, error: dbError } = await supabase
          .from('operatori')
          .select('*')
          .eq('email', cleanEmail)
          .single();
        
        if (data && !dbError) {
          user = data as Operatore;
        }
      } catch (e) {
        console.error("Errore check cloud diretto:", e);
      }
    }

    if (!user) {
      setError(`Utente "${cleanEmail}" non trovato. Verifica che l'account sia stato creato o attendi la sincronizzazione.`);
      setIsLoading(false);
      return;
    }

    const isPasswordCorrect = user.password === cleanPass || (!user.password && cleanPass === '123');

    if (isPasswordCorrect) {
      onLogin(user);
    } else {
      setError('Password errata.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img src={BRAND_LOGO_DATA} alt="Logo" className="w-20 h-20 mx-auto mb-6 shadow-2xl rounded-3xl" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">SalesManager</h1>
          <p className="text-slate-400 mt-2 font-medium italic">Gestione Vendite & Incassi</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/10 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex flex-col gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowDebug(!showDebug)} 
                  className="text-[10px] text-rose-400 underline uppercase tracking-widest hover:text-rose-600 transition-colors text-left ml-8"
                >
                  {showDebug ? "Nascondi Diagnostica" : "Mostra Utenti Registrati sul PC"}
                </button>
              </div>
            )}

            {showDebug && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Info className="w-3 h-3 text-sky-500" /> Utenti in Memoria Locale
                  </div>
                  <button 
                    type="button" 
                    onClick={() => window.location.reload()} 
                    className="text-[10px] font-bold text-[#32964D] flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Forza Sincronizzazione
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {operatori.map(op => (
                    <div key={op.id} className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <User className="w-3 h-3 text-slate-300" />
                        <span className="font-bold text-slate-700 truncate">{op.email}</span>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${op.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {op.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="nome.cognome@gmail.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-[#32964D]/10 focus:border-[#32964D] outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-[#32964D]/10 focus:border-[#32964D] outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#32964D] hover:bg-[#2b7e41] disabled:bg-slate-300 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
              {isLoading ? 'VERIFICA IN CORSO...' : 'ACCEDI'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
              Protetto
            </div>
            {dbConfig && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                <Cloud className="w-3.5 h-3.5" /> Cloud ON
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
