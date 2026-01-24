
import React, { useState, useEffect } from 'react';
import { Operatore, ADMIN_EMAIL } from '../types';
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, Info, RefreshCw, User, Cloud, DatabaseZap, Settings, X, Save, Server } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LoginScreenProps {
  operatori: Operatore[];
  onLogin: (user: Operatore) => void;
  onConfigChange: (config: {url: string, key: string} | null) => void;
}

const BRAND_LOGO_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2332964D'/%3E%3Cpath d='M30 70 L70 30 M45 30 L70 30 L70 55' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const LoginScreen: React.FC<LoginScreenProps> = ({ operatori, onLogin, onConfigChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [cloudUsers, setCloudUsers] = useState<{email: string, nome: string}[]>([]);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Carichiamo la config dal localStorage per la modale di setup
  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');

  const saveConfig = () => {
    const newConfig = tempUrl && tempKey ? { url: tempUrl, key: tempKey } : null;
    onConfigChange(newConfig);
    setDbConfig(newConfig);
    setShowConfig(false);
    alert("Configurazione Cloud aggiornata. Ora puoi provare il login.");
    window.location.reload(); // Ricarichiamo per inizializzare il client Supabase globale
  };

  const checkCloudUsers = async () => {
    if (!dbConfig?.url || !dbConfig?.key) {
      alert("Configurazione Cloud mancante.");
      return;
    }
    setIsCheckingCloud(true);
    try {
      const supabase = createClient(dbConfig.url, dbConfig.key);
      const { data, error: dbError } = await supabase.from('operatori').select('email, nome');
      if (dbError) throw dbError;
      setCloudUsers(data || []);
      setShowDebug(true);
    } catch (e: any) {
      alert("Errore accesso Cloud: " + (e.message || "Verifica le chiavi API"));
    } finally {
      setIsCheckingCloud(false);
    }
  };

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

    // 1. Check Emergenza Admin (Sempre possibile se password è 'admin')
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === 'admin') {
      const adminUser: Operatore = { id: 'op-admin', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' };
      onLogin(adminUser);
      setIsLoading(false);
      return;
    }

    // 2. Prova localmente (se Fabiana è già stata scaricata prima)
    let user = operatori.find(u => u.email.toLowerCase() === cleanEmail);

    // 3. Se non trovato localmente, prova un check FORZATO sul Cloud (fondamentale per PC nuovi)
    if (!user && dbConfig?.url && dbConfig?.key) {
      try {
        const supabase = createClient(dbConfig.url, dbConfig.key);
        const { data, error: dbError } = await supabase
          .from('operatori')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        
        if (data && !dbError) {
          user = data as Operatore;
        }
      } catch (e) {
        console.error("Errore check cloud diretto:", e);
      }
    }

    if (!user) {
      setError(`Utente "${cleanEmail}" non trovato. Se sei su un nuovo PC, clicca sull'ingranaggio in alto a destra per collegare il database Cloud.`);
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
      <div className="max-w-md w-full relative">
        
        {/* Tasto Setup Cloud */}
        <button 
          onClick={() => setShowConfig(true)}
          className="absolute -top-12 right-0 p-3 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/10"
          title="Configura Database Cloud"
        >
          <Settings className="w-6 h-6" />
        </button>

        <div className="text-center mb-10">
          <img src={BRAND_LOGO_DATA} alt="Logo" className="w-20 h-20 mx-auto mb-6 shadow-2xl rounded-3xl" />
          <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">Lagicart SalesManager</h1>
          <p className="text-slate-400 mt-2 font-medium">Accesso Team</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/10 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex flex-col gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {dbConfig && (
                  <button 
                    type="button" 
                    onClick={checkCloudUsers} 
                    className="flex items-center gap-2 text-[10px] text-rose-500 bg-white border border-rose-200 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-rose-100 transition-colors ml-8"
                  >
                    {isCheckingCloud ? <RefreshCw className="w-3 h-3 animate-spin" /> : <DatabaseZap className="w-3 h-3" />}
                    Verifica Database Remoto
                  </button>
                )}
              </div>
            )}

            {showDebug && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3 h-3 text-sky-500" /> Operatori su Supabase
                  </div>
                  <button onClick={() => setShowDebug(false)} className="text-slate-300 hover:text-slate-500 font-bold">X</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cloudUsers.length > 0 ? cloudUsers.map(u => (
                    <div key={u.email} className="flex flex-col p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-800">{u.nome}</span>
                      <span className="text-[10px] text-slate-500">{u.email}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 italic p-4 text-center">Nessun operatore configurato nel Cloud.</p>
                  )}
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
                  placeholder="tua.email@esempio.it"
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
              {isLoading ? 'VERIFICA...' : 'ACCEDI'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
              Protetto
            </div>
            {dbConfig ? (
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                <Cloud className="w-3.5 h-3.5" /> Cloud Pronto
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                <Cloud className="w-3.5 h-3.5" /> Solo Locale
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Configurazione Database */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-[#32964D]" />
                <h3 className="font-bold">Setup Database Cloud</h3>
              </div>
              <button onClick={() => setShowConfig(false)} className="p-1 hover:bg-white/10 rounded-lg"><X /></button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">Inserisci le chiavi del tuo progetto Supabase per sincronizzare questo PC con gli altri dell'ufficio.</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Supabase URL</label>
                <input 
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#32964D]"
                  placeholder="https://xyz.supabase.co"
                  value={tempUrl}
                  onChange={e => setTempUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Supabase Anon Key</label>
                <input 
                  type="password"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#32964D]"
                  placeholder="eyJ..."
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                />
              </div>

              <button 
                onClick={saveConfig}
                className="w-full bg-[#32964D] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg hover:bg-[#2b7e41]"
              >
                <Save className="w-4 h-4" /> Collega PC al Cloud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
