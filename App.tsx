
import React, { useState, useEffect, useMemo } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, Cloud, CloudOff, RefreshCw, Database } from 'lucide-react';
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

  const [operatori, setOperatori] = useState<Operatore[]>(() => {
    const saved = localStorage.getItem('sm_operatori');
    const defaultOps = [
      { id: 'op1', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' },
      { id: 'op2', nome: 'Marco Operatore 1', email: 'agente1@example.com', role: 'agent', password: '123' }
    ];
    if (saved) {
      const parsed = JSON.parse(saved);
      const combined = [...parsed];
      defaultOps.forEach(d => {
        if (!combined.find(o => o.email === d.email)) combined.push(d);
      });
      return combined;
    }
    return defaultOps;
  });

  const [vendite, setVendite] = useState<Vendita[]>([]);
  const [agenti, setAgenti] = useState<Agente[]>([]);
  const [metodiPagamento, setMetodiPagamento] = useState<string[]>(['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti']);
  
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

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        const savedVendite = localStorage.getItem('sm_vendite');
        const savedAgenti = localStorage.getItem('sm_agenti');
        const savedMetodi = localStorage.getItem('sm_metodi');
        const savedOps = localStorage.getItem('sm_operatori');
        
        if (savedVendite) setVendite(JSON.parse(savedVendite));
        if (savedAgenti) setAgenti(JSON.parse(savedAgenti));
        if (savedMetodi) setMetodiPagamento(JSON.parse(savedMetodi));
        if (savedOps) setOperatori(JSON.parse(savedOps));
        return;
      }

      setIsSyncing(true);
      try {
        const [vRes, aRes, oRes] = await Promise.all([
          supabase.from('vendite').select('*').order('data', { ascending: false }),
          supabase.from('agenti').select('*'),
          supabase.from('operatori').select('*')
        ]);

        if (vRes.data) {
          setVendite(vRes.data.map(d => ({
            id: d.id, data: d.data, cliente: d.cliente, importo: Number(d.importo),
            metodoPagamento: d.metodo_pagamento, sconto: d.sconto, agente: d.agente,
            operatoreEmail: d.operatore_email, incassato: d.incassato, noteAmministrazione: d.note_amministrazione
          })));
        }
        if (aRes.data) {
          setAgenti(aRes.data.map(d => ({ 
            id: d.id, nome: d.nome, email: d.email, operatoreEmail: d.operatore_email,
            telefono: d.telefono, zona: d.zona
          })));
        }
        if (oRes.data && oRes.data.length > 0) {
          setOperatori(oRes.data);
        }
      } catch (e) {
        console.error("Errore fetch Cloud:", e);
        setCloudStatus('error');
      }
      setIsSyncing(false);
    };

    fetchData();

    if (supabase) {
      const vSub = supabase.channel('v-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => fetchData()).subscribe();
      const oSub = supabase.channel('o-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'operatori' }, () => fetchData()).subscribe();
      const aSub = supabase.channel('a-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'agenti' }, () => fetchData()).subscribe();
      return () => { supabase.removeChannel(vSub); supabase.removeChannel(oSub); supabase.removeChannel(aSub); };
    }
  }, [supabase]);

  useEffect(() => { localStorage.setItem('sm_vendite', JSON.stringify(vendite)); }, [vendite]);
  useEffect(() => { localStorage.setItem('sm_agenti', JSON.stringify(agenti)); }, [agenti]);
  useEffect(() => { localStorage.setItem('sm_operatori', JSON.stringify(operatori)); }, [operatori]);
  useEffect(() => { localStorage.setItem('sm_metodi', JSON.stringify(metodiPagamento)); }, [metodiPagamento]);
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

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      // Mapping dei nomi colonne per Supabase (snake_case)
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
      await supabase.from(table).upsert(payload);
    } catch (e) {
      console.error(`Errore sync ${table}:`, e);
    }
  };

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
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
             {cloudStatus === 'connected' ? (
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                 <Cloud className="w-3 h-3" /> Cloud Attivo
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                 <CloudOff className="w-3 h-3" /> Locale
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
             {isSyncing && <RefreshCw className="w-4 h-4 text-[#32964D] animate-spin" />}
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
                  if (target) await syncToCloud('vendite', {
                    ...target,
                    incassato: true,
                    noteAmministrazione: 'OK MARILENA'
                  });
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
              setOperatori(updated);
              await syncToCloud('operatori', o);
            }} />}
            {view === 'settings' && (
              <SettingsManager 
                metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} 
                data={{vendite, agenti, operatori, metodi: metodiPagamento}} onImport={(d) => setVendite(d.vendite || [])}
                dbConfig={dbConfig} onDbConfigChange={setDbConfig}
              />
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
