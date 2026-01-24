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

const BRAND_LOGO_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2332964D'/%3E%3Cpath d='M30 70 L70 30 M45 30 L70 30 L70 55' stroke='white' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const App: React.FC = () => {
  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'none'>('none');

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

  const [operatori, setOperatori] = useState<Operatore[]>(() => {
    const saved = localStorage.getItem('sm_operatori');
    return saved ? JSON.parse(saved) : [
      { id: 'op1', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' },
      { id: 'op2', nome: 'Marco Operatore 1', email: 'agente1@example.com', role: 'agent', password: '123' },
      { id: 'op3', nome: 'Luca Operatore 2', email: 'agente2@example.com', role: 'agent', password: '123' }
    ];
  });

  const [metodiPagamento, setMetodiPagamento] = useState<string[]>(() => {
    const saved = localStorage.getItem('sm_metodi');
    return saved ? JSON.parse(saved) : ['Bonifico', 'Rimessa Diretta', 'Bonifico Anticipato', 'Assegno', 'Contanti'];
  });

  const [currentUser, setCurrentUser] = useState<Operatore>(operatori[0]);
  const [vendite, setVendite] = useState<Vendita[]>([]);
  
  const [agenti, setAgenti] = useState<Agente[]>(() => {
    const saved = localStorage.getItem('sm_agenti');
    return saved ? JSON.parse(saved) : [
      { id: 'a1', nome: 'Roberto Rossi', email: 'roberto@rossi.it', operatoreEmail: 'agente1@example.com' },
      { id: 'a2', nome: 'Giuseppe Verdi', email: 'giuseppe@verdi.it', operatoreEmail: 'agente1@example.com' }
    ];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendita, setEditingVendita] = useState<Vendita | null>(null);
  const [view, setView] = useState<'dashboard' | 'list' | 'agents' | 'operators' | 'settings'>('dashboard');
  const [notifications, setNotifications] = useState<{msg: string, type: 'info' | 'success'}[]>([]);

  useEffect(() => {
    if (!supabase) {
      const saved = localStorage.getItem('sm_vendite');
      if (saved) setVendite(JSON.parse(saved));
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      const { data, error } = await supabase.from('vendite').select('*').order('data', { ascending: false });
      if (!error && data) {
        const mappedData: Vendita[] = data.map(d => ({
          id: d.id,
          data: d.data,
          cliente: d.cliente,
          importo: Number(d.importo),
          metodoPagamento: d.metodo_pagamento,
          sconto: d.sconto,
          agente: d.agente,
          operatoreEmail: d.operatore_email,
          incassato: d.incassato,
          noteAmministrazione: d.note_amministrazione
        }));
        setVendite(mappedData);
        localStorage.setItem('sm_vendite', JSON.stringify(mappedData));
      } else if (error) {
        setCloudStatus('error');
      }
      setIsSyncing(false);
    };

    fetchData();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => { localStorage.setItem('sm_operatori', JSON.stringify(operatori)); }, [operatori]);
  useEffect(() => { localStorage.setItem('sm_agenti', JSON.stringify(agenti)); }, [agenti]);
  useEffect(() => { localStorage.setItem('sm_metodi', JSON.stringify(metodiPagamento)); }, [metodiPagamento]);
  useEffect(() => { localStorage.setItem('sm_db_config', JSON.stringify(dbConfig)); }, [dbConfig]);

  const addNotification = (msg: string, type: 'info' | 'success') => {
    setNotifications(prev => [{ msg, type }, ...prev].slice(0, 3));
    setTimeout(() => setNotifications(prev => prev.slice(0, -1)), 4000);
  };

  const syncToCloud = async (v: Vendita) => {
    if (!supabase) return;
    setIsSyncing(true);
    const { error } = await supabase.from('vendite').upsert({
      id: v.id,
      data: v.data,
      cliente: v.cliente,
      importo: v.importo,
      metodo_pagamento: v.metodoPagamento,
      sconto: v.sconto,
      agente: v.agente,
      operatore_email: v.operatoreEmail,
      incassato: v.incassato,
      note_amministrazione: v.noteAmministrazione
    });
    if (error) addNotification("Errore sincronizzazione cloud", "info");
    setIsSyncing(false);
  };

  const filteredVendite = useMemo(() => {
    if (currentUser.email === ADMIN_EMAIL) return vendite;
    return vendite.filter(v => v.operatoreEmail === currentUser.email);
  }, [vendite, currentUser]);

  const filteredAgenti = useMemo(() => {
    if (currentUser.email === ADMIN_EMAIL) return agenti;
    return agenti.filter(a => a.operatoreEmail === currentUser.email);
  }, [agenti, currentUser]);

  const handleVenditaSubmit = async (data: any) => {
    let newVendita: Vendita;
    if (editingVendita) {
      newVendita = { ...editingVendita, ...data };
      setVendite(prev => prev.map(v => v.id === editingVendita.id ? newVendita : v));
      addNotification(`Aggiornato: ${data.cliente}`, 'success');
      setEditingVendita(null);
    } else {
      newVendita = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        data: new Date().toISOString().split('T')[0],
        operatoreEmail: currentUser.email,
        incassato: data.incassato || false,
        noteAmministrazione: data.noteAmministrazione || ''
      };
      setVendite([newVendita, ...vendite]);
      addNotification(`Registrato: ${newVendita.cliente}`, 'success');
    }
    setIsFormOpen(false);
    if (supabase) await syncToCloud(newVendita);
    else localStorage.setItem('sm_vendite', JSON.stringify([newVendita, ...vendite]));
  };

  const deleteVendita = async (id: string) => {
    if (currentUser.role !== 'admin') return;
    if (window.confirm("Eliminare definitivamente?")) {
      setVendite(prev => prev.filter(v => v.id !== id));
      if (supabase) {
        await supabase.from('vendite').delete().eq('id', id);
      }
      addNotification('Eliminato', 'info');
    }
  };

  const handleIncassoAction = async (id: string) => {
    if (currentUser.role !== 'admin') return;
    const updatedVendite = vendite.map(v => {
      if (v.id === id) {
        const updated = { ...v, incassato: true, noteAmministrazione: v.noteAmministrazione || 'OK MARILENA' };
        if (supabase) syncToCloud(updated);
        return updated;
      }
      return v;
    });
    setVendite(updatedVendite);
    addNotification('Incasso registrato', 'success');
  };

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
          <UserSwitcher currentUser={currentUser} operatori={operatori} onSwitch={setCurrentUser} />
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
             {cloudStatus === 'connected' ? (
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                 <Cloud className="w-3 h-3" /> Database Cloud Attivo
               </div>
             ) : cloudStatus === 'error' ? (
               <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                 <Database className="w-3 h-3" /> Errore Cloud! Controlla chiavi
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                 <CloudOff className="w-3 h-3" /> Solo Memoria Locale
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
          <div className="fixed bottom-8 right-8 z-[110] space-y-3 no-print">
            {notifications.map((n, i) => (
              <div key={i} className={`px-6 py-4 rounded-2xl shadow-2xl border-l-4 flex items-center gap-3 bg-white border-${n.type === 'success' ? '[#32964D]' : 'slate'}-500 text-slate-800`}>
                <span className="font-bold text-sm">{n.msg}</span>
              </div>
            ))}
          </div>

          <div className="max-w-7xl mx-auto">
            {view === 'list' && (
              <SalesTable 
                vendite={filteredVendite} 
                metodiDisponibili={metodiPagamento}
                isAdmin={currentUser.role === 'admin'} 
                onIncasso={handleIncassoAction} 
                onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }}
                onDelete={deleteVendita}
              />
            )}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'agents' && <AgentManager agenti={filteredAgenti} operatori={operatori} isAdmin={currentUser.role === 'admin'} onUpdate={(a) => setAgenti(prev => [...prev.filter(x => x.id !== a.id), a])} />}
            {view === 'operators' && <OperatorManager operatori={operatori} onUpdate={(o) => setOperatori(prev => [...prev.filter(x => x.id !== o.id), o])} />}
            {view === 'settings' && (
              <SettingsManager 
                metodi={metodiPagamento} 
                onUpdate={setMetodiPagamento} 
                isAdmin={currentUser.role === 'admin'} 
                data={{vendite, agenti, operatori, metodi: metodiPagamento}} 
                onImport={(data) => {
                  if (window.confirm("Sovrascrivere tutto?")) {
                    setVendite(data.vendite || []);
                    setAgenti(data.agenti || []);
                    setOperatori(data.operatori || []);
                    setMetodiPagamento(data.metodi || []);
                    if (supabase && data.vendite) {
                       data.vendite.forEach((v: Vendita) => syncToCloud(v));
                    }
                  }
                }}
                dbConfig={dbConfig}
                onDbConfigChange={setDbConfig}
              />
            )}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <SalesForm 
            onClose={() => { setIsFormOpen(false); setEditingVendita(null); }} 
            onSubmit={handleVenditaSubmit} 
            userEmail={currentUser.email} 
            availableAgentList={filteredAgenti}
            metodiDisponibili={metodiPagamento}
            initialData={editingVendita || undefined}
            isAdmin={currentUser.role === 'admin'}
          />
        </div>
      )}
    </div>
  );
};

export default App;