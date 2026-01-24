
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, Cloud, CloudOff, RefreshCw, AlertCircle, UploadCloud } from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import SalesTable from './components/SalesTable';
import SalesForm from './components/SalesForm';
import UserSwitcher from './components/UserSwitcher';
import Dashboard from './components/Dashboard';
import AgentManager from './components/AgentManager';
import OperatorManager from './components/OperatorManager';
import SettingsManager from './components/SettingsManager';
import LoginScreen from './components/LoginScreen';

const BRAND_LOGO_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2332964D'/%3E%3Cpath d='M30 70 L70 30 M45 30 L70 30 L70 55' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const App: React.FC = () => {
  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'none'>('none');

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sm_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<Operatore | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const ensureAdmin = (list: Operatore[]): Operatore[] => {
    const hasAdmin = list.find(o => o.email === ADMIN_EMAIL);
    if (!hasAdmin) {
      const adminOp: Operatore = { id: 'op-admin', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' };
      return [adminOp, ...list];
    }
    return list;
  };

  const [operatori, setOperatori] = useState<Operatore[]>(() => {
    const saved = localStorage.getItem('sm_operatori');
    const defaultOps: Operatore[] = [{ id: 'op1', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' }];
    if (saved) {
      try {
        return ensureAdmin(JSON.parse(saved) as Operatore[]);
      } catch {
        return defaultOps;
      }
    }
    return defaultOps;
  });

  const [vendite, setVendite] = useState<Vendita[]>(() => {
    const saved = localStorage.getItem('sm_vendite');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [agenti, setAgenti] = useState<Agente[]>(() => {
    const saved = localStorage.getItem('sm_agenti');
    return saved ? JSON.parse(saved) : [];
  });

  const [metodiPagamento, setMetodiPagamento] = useState<string[]>(() => {
    const saved = localStorage.getItem('sm_metodi');
    return saved ? JSON.parse(saved) : ['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti'];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendita, setEditingVendita] = useState<Vendita | null>(null);
  const [view, setView] = useState<'dashboard' | 'list' | 'agents' | 'operators' | 'settings'>('dashboard');

  useEffect(() => {
    if (dbConfig?.url && dbConfig?.key) {
      try {
        const client = createClient(dbConfig.url, dbConfig.key);
        setSupabase(client);
        setCloudStatus('connected');
      } catch (e) {
        setCloudStatus('error');
      }
    } else {
      setSupabase(null);
      setCloudStatus('none');
    }
  }, [dbConfig]);

  const fetchData = useCallback(async () => {
    if (!supabase) return;

    setIsSyncing(true);
    try {
      const [vRes, aRes, oRes] = await Promise.all([
        supabase.from('vendite').select('*').order('data', { ascending: false }),
        supabase.from('agenti').select('*'),
        supabase.from('operatori').select('*')
      ]);

      if (vRes.data) {
        const fetched = vRes.data.map(d => ({
          id: d.id, data: d.data, cliente: d.cliente, importo: Number(d.importo),
          metodoPagamento: d.metodo_pagamento, sconto: d.sconto, agente: d.agente,
          operatoreEmail: d.operatore_email, incassato: d.incassato, noteAmministrazione: d.note_amministrazione
        }));
        if (fetched.length > 0) setVendite(fetched);
      }
      
      if (aRes.data) {
        const fetched = aRes.data.map(d => ({ 
          id: d.id, nome: d.nome, email: d.email, operatoreEmail: d.operatore_email,
          telefono: d.telefono, zona: d.zona
        }));
        if (fetched.length > 0) setAgenti(fetched);
      }

      if (oRes.data) {
        const fetched = ensureAdmin(oRes.data as Operatore[]);
        if (fetched.length > 0) setOperatori(fetched);
      }
    } catch (e) {
      console.error("Errore fetch Cloud:", e);
      setCloudStatus('error');
    }
    setIsSyncing(false);
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      fetchData();
      const vSub = supabase.channel('v-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => fetchData()).subscribe();
      const oSub = supabase.channel('o-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'operatori' }, () => fetchData()).subscribe();
      const aSub = supabase.channel('a-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'agenti' }, () => fetchData()).subscribe();
      return () => { supabase.removeChannel(vSub); supabase.removeChannel(oSub); supabase.removeChannel(aSub); };
    }
  }, [supabase, fetchData]);

  useEffect(() => { localStorage.setItem('sm_vendite', JSON.stringify(vendite)); }, [vendite]);
  useEffect(() => { localStorage.setItem('sm_agenti', JSON.stringify(agenti)); }, [agenti]);
  useEffect(() => { localStorage.setItem('sm_operatori', JSON.stringify(operatori)); }, [operatori]);
  useEffect(() => { localStorage.setItem('sm_metodi', JSON.stringify(metodiPagamento)); }, [metodiPagamento]);
  useEffect(() => { localStorage.setItem('sm_db_config', JSON.stringify(dbConfig)); }, [dbConfig]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sm_current_user', JSON.stringify(currentUser));
      localStorage.setItem('sm_is_logged_in', 'true');
    } else {
      localStorage.removeItem('sm_current_user');
      localStorage.setItem('sm_is_logged_in', 'false');
    }
  }, [currentUser]);

  const handleLogin = (user: Operatore) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setView('dashboard');
  };

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      const payload = { ...data };
      if (table === 'vendite') {
        payload.metodo_pagamento = data.metodoPagamento;
        payload.operatore_email = data.operatoreEmail;
        payload.note_amministrazione = data.noteAmministrazione;
        delete payload.metodoPagamento;
        delete payload.operatoreEmail;
        delete payload.noteAmministrazione;
      }
      if (table === 'agenti') {
        payload.operatore_email = data.operatoreEmail;
        delete payload.operatoreEmail;
      }
      const { error } = await supabase.from(table).upsert(payload);
      if (error) {
        // Se c'è un errore di violazione di unicità (email già esistente con altro ID)
        if (error.code === '23505') {
          alert(`Errore: L'email "${data.email}" è già registrata nel database Cloud con un altro account.`);
        } else {
          console.error(`Errore Supabase (${table}):`, error);
        }
        throw error;
      }
    } catch (e) {
      console.error(`Errore sync ${table}:`, e);
    }
  };

  const forcePushAllToCloud = async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      for (const op of operatori) await syncToCloud('operatori', op);
      for (const ag of agenti) await syncToCloud('agenti', ag);
      for (const ve of vendite) await syncToCloud('vendite', ve);
      alert("Tutti i dati locali sono stati caricati nel Cloud!");
      fetchData();
    } catch (e) {
      alert("Errore durante l'upload massivo. Controlla la console.");
    }
    setIsSyncing(false);
  };

  const filteredVendite = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return vendite;
    return vendite.filter(v => v.operatoreEmail === currentUser.email);
  }, [vendite, currentUser]);

  const filteredAgenti = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return agenti;
    return agenti.filter(a => a.operatoreEmail === currentUser.email);
  }, [agenti, currentUser]);

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen operatori={operatori} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 shadow-xl z-50 overflow-y-auto no-print">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10">
            <img src={BRAND_LOGO_DATA} alt="Logo" className="w-11 h-11" />
            <h1 className="text-xl font-bold tracking-tight">SalesManager</h1>
          </div>
          
          <nav className="space-y-1.5">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#32964D] text-white' : 'text-slate-400 hover:text-white'}`}>
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-[#32964D] text-white' : 'text-slate-400 hover:text-white'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Vendite</span>
            </button>
            <button onClick={() => setView('agents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'agents' ? 'bg-[#32964D] text-white' : 'text-slate-400 hover:text-white'}`}>
              <Contact2 className="w-5 h-5" />
              <span className="font-medium">Anagrafica Agenti</span>
            </button>
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setView('operators')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'operators' ? 'bg-[#32964D] text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Operatori</span>
                </button>
                <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-[#32964D] text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Impostazioni</span>
                </button>
              </>
            )}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/10">
          <UserSwitcher currentUser={currentUser} onLogout={handleLogout} />
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
             {cloudStatus === 'connected' ? (
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                 <Cloud className="w-3 h-3" /> Cloud Sincronizzato
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                 <CloudOff className="w-3 h-3" /> Solo Locale (Backup ON)
               </div>
             )}
             {isSyncing && (
               <div className="flex items-center gap-2 text-emerald-400 text-[9px] animate-pulse">
                 <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Aggiornamento in corso...
               </div>
             )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-shrink-0 no-print">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter">
              {view === 'list' ? 'Registro Vendite' : view === 'dashboard' ? 'Statistiche' : view === 'agents' ? 'Team Agenti' : view === 'settings' ? 'Personalizzazione' : 'Operatori'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             {view === 'list' && (
              <button onClick={() => { setEditingVendita(null); setIsFormOpen(true); }} className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95">
                <Plus className="w-5 h-5" /> Nuova Vendita
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {view === 'list' && (
              <SalesTable 
                vendite={filteredVendite} 
                metodiDisponibili={metodiPagamento}
                isAdmin={currentUser.role === 'admin'} 
                onIncasso={async (id) => {
                  const updated = vendite.map(v => v.id === id ? {...v, incassato: true, noteAmministrazione: 'OK MARILENA'} : v);
                  setVendite(updated);
                  const target = updated.find(v => v.id === id);
                  if (target) await syncToCloud('vendite', target);
                }} 
                onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }}
                onDelete={async (id) => {
                  if (window.confirm("Eliminare?")) {
                    setVendite(vendite.filter(v => v.id !== id));
                    if (supabase) await supabase.from('vendite').delete().eq('id', id);
                  }
                }}
              />
            )}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'agents' && <AgentManager agenti={filteredAgenti} operatori={operatori} isAdmin={currentUser.role === 'admin'} onUpdate={async (a) => {
              const updated = agenti.find(x => x.id === a.id) ? agenti.map(x => x.id === a.id ? a : x) : [a, ...agenti];
              setAgenti(updated);
              await syncToCloud('agenti', a);
            }} />}
            {view === 'operators' && <OperatorManager operatori={operatori} onUpdate={async (o) => {
              const updated = operatori.find(x => x.id === o.id) 
                ? operatori.map(x => x.id === o.id ? o : x)
                : [...operatori, o];
              setOperatori(ensureAdmin(updated));
              await syncToCloud('operatori', o);
            }} />}
            {view === 'settings' && (
              <div className="space-y-8">
                {currentUser.role === 'admin' && cloudStatus === 'connected' && (
                  <div className="bg-emerald-900 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold flex items-center gap-2 text-emerald-400">
                        <UploadCloud className="w-5 h-5" /> Strumenti Emergenza Cloud
                      </h4>
                      <p className="text-xs text-emerald-100/70 mt-1">Usa questo tasto solo se vedi che il Cloud ha perso dei dati che hai sul PC.</p>
                    </div>
                    <button 
                      onClick={forcePushAllToCloud}
                      className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl font-bold text-sm border border-white/10 transition-all active:scale-95"
                    >
                      Carica Dati Locali su Cloud
                    </button>
                  </div>
                )}
                <SettingsManager 
                  metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} 
                  data={{vendite, agenti, operatori, metodi: metodiPagamento}} onImport={(d) => setVendite(d.vendite || [])}
                  dbConfig={dbConfig} onDbConfigChange={setDbConfig}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <SalesForm 
            onClose={() => setIsFormOpen(false)} 
            onSubmit={async (data) => {
              const newV = editingVendita ? { ...editingVendita, ...data } : {
                ...data, id: Math.random().toString(36).substr(2, 9),
                data: new Date().toISOString().split('T')[0], operatoreEmail: currentUser.email
              };
              setVendite(editingVendita ? vendite.map(v => v.id === editingVendita.id ? newV : v) : [newV, ...vendite]);
              setIsFormOpen(false);
              await syncToCloud('vendite', newV);
            }} 
            userEmail={currentUser.email} availableAgentList={filteredAgenti} metodiDisponibili={metodiPagamento}
            initialData={editingVendita || undefined} isAdmin={currentUser.role === 'admin'}
          />
        </div>
      )}
    </div>
  );
};

export default App;
