
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, Cloud, CloudOff, RefreshCw, AlertCircle, UploadCloud, Clock, BookOpen, CheckCircle2, XCircle, Bell, BellRing } from 'lucide-react';
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'notification';
}

const App: React.FC = () => {
  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'none'>('none');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const lastFetchRef = useRef<number>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'notification' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (type === 'notification' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("Lagicart SalesManager", {
          body: message,
          icon: BRAND_LOGO_DATA,
        });
      } catch (e) { console.error(e); }
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sm_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<Operatore | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [viewAsEmail, setViewAsEmail] = useState<string | null>(null);

  const ensureAdmin = useCallback((list: Operatore[]): Operatore[] => {
    const hasAdmin = list.find(o => o.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!hasAdmin) {
      const adminOp: Operatore = { id: 'op-admin', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' };
      return [adminOp, ...list];
    }
    return list;
  }, []);

  const [operatori, setOperatori] = useState<Operatore[]>(() => {
    const saved = localStorage.getItem('sm_operatori');
    const defaultOps: Operatore[] = [{ id: 'op1', nome: 'Amministratore', email: ADMIN_EMAIL, role: 'admin', password: 'admin' }];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Operatore[];
        return Array.isArray(parsed) ? ensureAdmin(parsed) : defaultOps;
      } catch { return defaultOps; }
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
      } catch (e) { setCloudStatus('error'); }
    }
  }, [dbConfig]);

  const fetchData = useCallback(async (force = false) => {
    if (!supabase) return;
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 2000) return; 
    lastFetchRef.current = now;

    setIsSyncing(true);
    try {
      const [vRes, aRes, oRes] = await Promise.all([
        supabase.from('vendite').select('*').order('created_at', { ascending: false }),
        supabase.from('agenti').select('*'),
        supabase.from('operatori').select('*')
      ]);

      if (vRes.data) {
        const cloudData: Vendita[] = vRes.data.map(d => ({
          id: d.id, data: d.data, cliente: d.cliente, importo: Number(d.importo),
          metodoPagamento: d.metodo_pagamento, sconto: d.sconto, agente: d.agente,
          operatoreEmail: d.operatore_email.toLowerCase(),
          incassato: d.incassato, 
          verificarePagamento: d.verificare_pagamento,
          pagamentoVerificato: d.pagamento_verificato,
          noteAmministrazione: d.note_amministrazione || '',
          notizie: d.notizie || '',
          nuove_notizie: d.nuove_notizie || false,
          ultimo_mittente: d.ultimo_mittente || '',
          created_at: d.created_at
        }));
        setVendite(cloudData);
      }
      
      if (aRes.data) {
        setAgenti(aRes.data.map(d => ({ 
          id: d.id, nome: d.nome, email: d.email, operatoreEmail: d.operatore_email.toLowerCase(),
          telefono: d.telefono, zona: d.zona
        })));
      }

      if (oRes.data) setOperatori(ensureAdmin(oRes.data as Operatore[]));
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  }, [supabase, ensureAdmin]);

  useEffect(() => {
    if (supabase && isLoggedIn && currentUser) {
      const userEmail = currentUser.email.toLowerCase();
      const nSub = supabase.channel('realtime-notifiche').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifiche' }, (payload) => {
        if (payload.new.to_email.toLowerCase() === userEmail) addToast(payload.new.message, 'notification');
      }).subscribe();
      const vSub = supabase.channel('realtime-data').on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => fetchData(true)).subscribe();
      return () => { supabase.removeChannel(nSub); supabase.removeChannel(vSub); };
    }
  }, [supabase, isLoggedIn, currentUser, fetchData]);

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
    addToast(`Bentornato, ${user.nome}!`, 'success');
    setTimeout(() => fetchData(true), 500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setViewAsEmail(null);
  };

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      const payload: any = { ...data };
      if (table === 'vendite') {
        payload.metodo_pagamento = data.metodoPagamento;
        payload.operatore_email = data.operatoreEmail.toLowerCase();
        payload.note_amministrazione = data.noteAmministrazione;
        payload.ultimo_mittente = data.ultimo_mittente;
        payload.verificare_pagamento = data.verificarePagamento;
        payload.pagamento_verificato = data.pagamentoVerificato;
        delete payload.metodoPagamento;
        delete payload.operatoreEmail;
        delete payload.noteAmministrazione;
        delete payload.verificarePagamento;
        delete payload.pagamentoVerificato;
      }
      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw error;
      fetchData(true);
    } catch (e) { console.error(e); }
  };

  // AGENTI FILTRATI PER PRIVACY
  const filteredAgenti = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' && !viewAsEmail) return agenti;
    const targetEmail = (viewAsEmail || currentUser.email).toLowerCase();
    return agenti.filter(a => a.operatoreEmail.toLowerCase() === targetEmail);
  }, [agenti, currentUser, viewAsEmail]);

  const filteredVendite = useMemo(() => {
    if (!currentUser) return [];
    let list = [...vendite];
    if (currentUser.role === 'admin' && viewAsEmail) {
      list = list.filter(v => v.operatoreEmail.toLowerCase() === viewAsEmail.toLowerCase());
    } else if (currentUser.role !== 'admin') {
      list = list.filter(v => v.operatoreEmail.toLowerCase() === currentUser.email.toLowerCase());
    }
    return list;
  }, [vendite, currentUser, viewAsEmail]);

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen operatori={operatori} onLogin={handleLogin} onConfigChange={setDbConfig} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none no-print">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border pointer-events-auto animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-500/30' : toast.type === 'error' ? 'bg-rose-900 text-white border-rose-500/30' : toast.type === 'notification' ? 'bg-amber-600 text-white border-white/20' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'notification' ? <BellRing className="w-5 h-5 animate-bounce" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 shadow-xl z-50 overflow-y-auto no-print">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10">
            <img src={BRAND_LOGO_DATA} alt="Logo" className="w-11 h-11" />
            <h1 className="text-xl font-bold tracking-tight">Lagicart SalesManager</h1>
          </div>
          <nav className="space-y-1.5">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><TrendingUp className="w-5 h-5" /><span className="font-medium">Dashboard</span></button>
            <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><List className="w-5 h-5" /><span className="font-medium">Vendite</span></button>
            <button onClick={() => setView('agents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'agents' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Contact2 className="w-5 h-5" /><span className="font-medium">Anagrafica Agenti</span></button>
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setView('operators')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'operators' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Users className="w-5 h-5" /><span className="font-medium">Operatori</span></button>
                <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Settings className="w-5 h-5" /><span className="font-medium">Impostazioni</span></button>
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/10">
          <UserSwitcher currentUser={currentUser} operatori={operatori} onLogout={handleLogout} viewAsEmail={viewAsEmail} onViewAsChange={setViewAsEmail} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-shrink-0 no-print">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            {view === 'list' ? 'Registro Vendite' : view === 'dashboard' ? 'Statistiche' : view === 'agents' ? 'Team Agenti' : view === 'settings' ? 'Configurazione' : 'Operatori'}
          </h2>
          {view === 'list' && <button onClick={() => { setEditingVendita(null); setIsFormOpen(true); }} className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-[#2b7e41] transition-all"><Plus className="w-5 h-5" /> Nuova Vendita</button>}
        </header>

        <section className="flex-1 overflow-auto p-8 bg-[#f1f5f9]/50">
          <div className="max-w-7xl mx-auto">
            {view === 'list' && (
              <SalesTable 
                vendite={filteredVendite} 
                metodiDisponibili={metodiPagamento}
                isAdmin={currentUser.role === 'admin'} 
                onIncasso={async (id) => {
                  const target = vendite.find(v => v.id === id);
                  if (!target) return;
                  const updated = {...target, incassato: true };
                  setVendite(vendite.map(v => v.id === id ? updated : v));
                  await syncToCloud('vendite', updated);
                  addToast(`Incasso confermato`, 'success');
                }} 
                onVerifyPayment={async (id) => {
                   if (currentUser.role !== 'admin') {
                     addToast("Azione non consentita", "error");
                     return;
                   }
                   const target = vendite.find(v => v.id === id);
                   if (!target) return;
                   const updated = { ...target, pagamentoVerificato: true };
                   setVendite(vendite.map(v => v.id === id ? updated : v));
                   await syncToCloud('vendite', updated);
                   addToast(`Pagamento verificato - Via libera merce`, 'success');
                }}
                onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }}
                onUpdateNotizie={async (id, notizia, nuoveNotizie, mittente) => {
                   const target = vendite.find(v => v.id === id);
                   if (!target) return;
                   const updated = { ...target, notizie: notizia, nuove_notizie: nuoveNotizie, ultimo_mittente: mittente };
                   setVendite(vendite.map(v => v.id === id ? updated : v));
                   await syncToCloud('vendite', updated);
                }}
                currentUserNome={currentUser.nome}
                onDelete={async (id) => {
                  if (window.confirm("Eliminare?")) {
                    setVendite(vendite.filter(v => v.id !== id));
                    if (supabase) await supabase.from('vendite').delete().eq('id', id);
                  }
                }}
              />
            )}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'agents' && (
              <AgentManager 
                agenti={filteredAgenti} 
                operatori={operatori} 
                isAdmin={currentUser.role === 'admin'} 
                currentUser={currentUser} 
                onUpdate={async (a) => {
                  setAgenti(agenti.find(x => x.id === a.id) ? agenti.map(x => x.id === a.id ? a : x) : [a, ...agenti]);
                  await syncToCloud('agenti', a);
                }} 
              />
            )}
            {view === 'operators' && <OperatorManager operatori={operatori} onUpdate={async (o) => {
              setOperatori(ensureAdmin(operatori.find(x => x.id === o.id) ? operatori.map(x => x.id === o.id ? o : x) : [...operatori, o]));
              await syncToCloud('operatori', o);
            }} onDelete={async (id) => {
              setOperatori(ensureAdmin(operatori.filter(o => o.id !== id)));
              if (supabase) await supabase.from('operatori').delete().eq('id', id);
            }} />}
            {view === 'settings' && <SettingsManager metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} dbConfig={dbConfig} onDbConfigChange={setDbConfig} onTestNotif={() => addToast("Test Notifica!", "notification")} data={null} onImport={() => {}} />}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
          <SalesForm 
            onClose={() => setIsFormOpen(false)} 
            onSubmit={async (data) => {
              const opEmail = (viewAsEmail || currentUser.email).toLowerCase();
              const newV = editingVendita ? { ...editingVendita, ...data } : {
                ...data, id: Math.random().toString(36).substr(2, 9),
                data: new Date().toISOString().split('T')[0], 
                operatoreEmail: opEmail,
                created_at: new Date().toISOString()
              };
              setVendite(editingVendita ? vendite.map(v => v.id === editingVendita.id ? newV : v) : [newV, ...vendite]);
              setIsFormOpen(false);
              await syncToCloud('vendite', newV);
              addToast(editingVendita ? "Aggiornato" : "Registrato", "success");
            }} 
            userEmail={viewAsEmail || currentUser.email} 
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
