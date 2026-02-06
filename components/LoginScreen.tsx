
import React, { useState, useEffect } from 'react';
import { Operatore, ADMIN_EMAIL } from '../types';
import { Lock, Mail, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff, RefreshCw, Cloud, DatabaseZap, Settings, X, Save, Server, CheckCircle2 } from 'lucide-react';
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
  const [showConfig, setShowConfig] = useState(false);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');

  const saveConfig = () => {
    if (!tempUrl || !tempKey) {
      alert("Inserire sia URL che Chiave API.");
      return;
    }
    const newConfig = { url: tempUrl, key: tempKey };
    
    // CRITICO: Scrittura manuale prima del reload per nuovi PC
    localStorage.setItem('sm_db_config', JSON.stringify(newConfig));
    onConfigChange(newConfig);
    
    alert("Configurazione Cloud salvata con successo. La pagina verrà ricaricata per applicare i parametri.");
    window.location.reload();
  };

  const testConnection = async () => {
    if (!tempUrl || !tempKey) return;
    setIsCheckingCloud(true);
    setCloudStatus('idle');
    try {
      const supabase = createClient(tempUrl, tempKey);
      const { data, error: dbError } = await supabase.from('operatori').select('count', { count: 'exact', head: true });
      if (dbError) throw dbError;
      setCloudStatus('success');
    } catch (e: any) {
      setCloudStatus('error');
      alert("Connessione fallita: verifica URL e Chiave API (Supabase).");
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

    // 1. Emergenza Admin locale
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === 'admin') {
      onLogin({ id: 'op-admin', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin' });
      return;
    }

    // 2. Check Cloud Forzato (per nuovi PC che non hanno ancora snapshot)
    if (dbConfig?.url && dbConfig?.key) {
      try {
        const supabase = createClient(dbConfig.url, dbConfig.key);
        const { data, error: dbError } = await supabase
          .from('operatori')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        
        if (data && !dbError) {
          if (data.password === cleanPass || (!data.password && cleanPass === '123')) {
            onLogin(data as Operatore);
            return;
          } else {
            setError('Password errata.');
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Errore cloud:", e);
      }
    }

    // 3. Fallback locale (se presente in snapshot)
    const user = operatori.find(u => u.email.toLowerCase() === cleanEmail);
    if (user && (user.password === cleanPass || (!user.password && cleanPass === '123'))) {
      onLogin(user);
    } else if (!user) {
      setError(`Utente "${cleanEmail}" non trovato. Se sei su un nuovo PC, clicca sulla rotella in alto a destra per configurare il Cloud.`);
    } else {
      setError('Password errata.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <button onClick={() => setShowConfig(true)} className="absolute -top-12 right-0 p-3 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/10" title="Setup Cloud"><Settings className="w-6 h-6" /></button>

        <div className="text-center mb-10">
          <img src={BRAND_LOGO_DATA} alt="Logo" className="w-20 h-20 mx-auto mb-6 shadow-2xl rounded-3xl" />
          <h1 className="text-4xl font-black text-white tracking-tighter">Lagicart Sales</h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Gestione Vendite Aziendale</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Utente</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" required placeholder="email@azienda.it" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-[#32964D] outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-[#32964D] outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95">
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? 'ACCESSO...' : 'ACCEDI AL SISTEMA'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Accesso Sicuro</div>
            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${dbConfig ? 'text-emerald-600' : 'text-amber-500'}`}><Cloud className="w-3.5 h-3.5" /> {dbConfig ? 'Cloud Attivo' : 'Offline Mode'}</div>
          </div>
        </div>
      </div>

      {/* Setup Cloud Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3"><Server className="w-5 h-5 text-[#32964D]" /><h3 className="font-bold uppercase tracking-tight">Database Cloud Setup</h3></div>
              <button onClick={() => setShowConfig(false)} className="p-1 hover:bg-white/10 rounded-lg"><X /></button>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Inserisci le chiavi Supabase per collegare questo PC.</p>
              
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL</label><input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#32964D]" placeholder="https://xyz.supabase.co" value={tempUrl} onChange={e => setTempUrl(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">API Anon Key</label><input type="password" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#32964D]" placeholder="eyJ..." value={tempKey} onChange={e => setTempKey(e.target.value)} /></div>

              <div className="flex flex-col gap-3 pt-2">
                <button onClick={testConnection} disabled={isCheckingCloud || !tempUrl || !tempKey} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all border ${cloudStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}>
                  {isCheckingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : cloudStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <DatabaseZap className="w-3.5 h-3.5" />}
                  {isCheckingCloud ? 'VERIFICA...' : cloudStatus === 'success' ? 'CONNESSIONE OK' : 'TESTA CONNESSIONE'}
                </button>
                <button onClick={saveConfig} className="w-full bg-[#32964D] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-[#2b7e41] uppercase tracking-widest text-[11px]">
                  <Save className="w-4 h-4" /> Salva e Collega PC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
