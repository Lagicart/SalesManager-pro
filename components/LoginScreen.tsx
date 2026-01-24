import React, { useState } from 'react';
import { Operatore } from '../types';
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  operatori: Operatore[];
  onLogin: (user: Operatore) => void;
}

const BRAND_LOGO_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2332964D'/%3E%3Cpath d='M30 70 L70 30 M45 30 L70 30 L70 55' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const LoginScreen: React.FC<LoginScreenProps> = ({ operatori, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = operatori.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || (!u.password && password === '123')));

    if (user) {
      onLogin(user);
    } else {
      setError('Credenziali non valide. Riprova o contatta l\'amministratore.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img src={BRAND_LOGO_DATA} alt="Logo" className="w-20 h-20 mx-auto mb-6 shadow-2xl rounded-3xl" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">SalesManager</h1>
          <p className="text-slate-400 mt-2 font-medium">Accesso Area Riservata Operatori</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Aziendale</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="nome@azienda.it"
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
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-[#32964D]/10 focus:border-[#32964D] outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-[#32964D]/20 transition-all active:scale-95 group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              ENTRA NEL SISTEMA
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Connessione Crittografata
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          In caso di smarrimento password, rivolgersi all'Amministrazione.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;