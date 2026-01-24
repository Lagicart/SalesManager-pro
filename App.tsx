
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, Cloud, CloudOff, RefreshCw, AlertCircle, UploadCloud, Clock, BookOpen, CheckCircle2, XCircle, Bell } from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import SalesTable from './components/SalesTable';
import SalesForm from './components/SalesForm';
import UserSwitcher from './components/UserSwitcher';
import Dashboard from './components/Dashboard';
import AgentManager from './components/AgentManager';
import OperatorManager from './components/OperatorManager';
import SettingsManager from './components/SettingsManager';
import LoginScreen from './components/LoginScreen';
import TechnicalManual from './components/TechnicalManual';

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
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
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
  const [view, setView] = useState<'dashboard' | 'list' | 'agents' | 'operators' | 'settings' | 'manual'>('dashboard');

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
          operatoreEmail: d.operatore_email, incassato: d.incassato, noteAmministrazione: d.note_amministrazione,
          created_at: d.created_at
        }));
        setVendite(cloudData);
      }
      
      if (aRes.data) {
        const cloudData: Agente[] = aRes.data.map(d => ({ 
          id: d.id, nome: d.nome, email: d.email, operatoreEmail: d.operatore_email,
          telefono: d.telefono, zona: d.zona
        }));
        setAgenti(cloudData);
      }

      if (oRes.data && oRes.data.length > 0) {
        const cloudData: Operatore[] = ensureAdmin(oRes.data as Operatore[]);
        setOperatori(cloudData);
      }
      setLastSyncTime(new Date().toLocaleTimeString('it-IT'));
    } catch (e) {
      console.error("Errore fetch Cloud:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [supabase, ensureAdmin]);

  // Gestione Notifiche Realtime - Solo per l'utente loggato
  useEffect(() => {
    if (supabase && isLoggedIn && currentUser) {
      const nSub = supabase
        .channel(`notifiche-${currentUser.email}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifiche',
          filter: `to_email=eq.${currentUser.email}`
        }, (payload) => {
          addToast(payload.new.message, 'notification');
        })
        .subscribe();
      
      return () => { supabase.removeChannel(nSub); };
    }
  }, [supabase, isLoggedIn, currentUser]);

  // Sincronizzazione Realtime per tutti i dati (fondamentale per Admin)
  useEffect(() => {
    if (supabase && isLoggedIn) {
      fetchData(true);
      const vSub = supabase.channel('v-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => {
        fetchData(true);
      }).subscribe();
      const oSub = supabase.channel('o-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'operatori' }, () => fetchData(true)).subscribe();
      const aSub = supabase.channel('a-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'agenti' }, () => fetchData(true)).subscribe();
      
      return () => { 
        supabase.removeChannel(vSub); 
        supabase.removeChannel(oSub); 
        supabase.removeChannel(aSub); 
      };
    }
  }, [supabase, fetchData, isLoggedIn]);

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
      setViewAsEmail(null);
    }
  }, [currentUser]);

  const handleLogin = (user: Operatore) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    addToast(`Bentornato, ${user.nome}!`, 'success');
    setTimeout(() => fetchData(true), 500);
  };

  const handleLogout = () => {
    addToast('Sessione chiusa correttamente', 'info');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setView('dashboard');
    localStorage.removeItem('sm_current_user');
    localStorage.setItem('sm_is_logged_in', 'false');
  };

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      const payload: any = { ...data };
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
      if (error) throw error;
      fetchData(true);
    } catch (e) {
      console.error(`Errore sync ${table}:`, e);
      addToast(`Errore durante il salvataggio cloud: ${table}`, 'error');
    }
  };

  const sendNotification = async (toEmail: string, message: string) => {
    if (!supabase) return;
    try {
      await supabase.from('notifiche').insert({
        to_email: toEmail,
        message: message,
        from_user: currentUser?.nome || 'Admin'
      });
    } catch (e) {
      console.error("Errore invio notifica:", e);
    }
  };

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

  const filteredAgenti = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' && viewAsEmail) {
      return agenti.filter(a => a.operatoreEmail.toLowerCase() === viewAsEmail.toLowerCase());
    }
    if (currentUser.role === 'admin') return agenti;
    return agenti.filter(a => a.operatoreEmail.toLowerCase() === currentUser.email.toLowerCase());
  }, [agenti, currentUser, viewAsEmail]);

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen operatori={operatori} onLogin={handleLogin} onConfigChange={setDbConfig} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none no-print">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border pointer-events-auto animate-in slide-in-from-right duration-300 ${
              toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-500/30' : 
              toast.type === 'error' ? 'bg-rose-900 text-white border-rose-500/30' : 
              toast.type === 'notification' ? 'bg-amber-600 text-white border-white/20' :
              'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : 
             toast.type === 'error' ? <XCircle className="w-5 h-5 text-rose-400" /> : 
             toast.type === 'notification' ? <Bell className="w-5 h-5 animate-bounce" /> :
             <AlertCircle className="w-5 h-5 text-sky-400" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 shadow-xl z-50 overflow-y-auto no-print">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10">
            <img src={BRAND_LOGO_DATA} alt="Logo" className="w-11 h-11" />
            <h1 className="text-xl font-bold tracking-tight">SalesManager</h1>
          </div>
          
          <nav className="space-y-1.5">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'text-slate-400 hover:text-white'}`}>
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'text-slate-400 hover:text-white'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Vendite</span>
            </button>
            <button onClick={() => setView('agents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'agents' ? 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'text-slate-400 hover:text-white'}`}>
              <Contact2 className="w-5 h-5" />
              <span className="font-medium">Anagrafica Agenti</span>
            </button>
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setView('operators')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'operators' ? 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'text-slate-400 hover:text-white'}`}>
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Operatori</span>
                </button>
                <button onClick={() => setView('manual')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'manual' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-white'}`}>
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Manuale Tecnico</span>
                </button>
                <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'text-slate-400 hover:text-white'}`}>
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Impostazioni</span>
                </button>
              </>
            )}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/10">
          <UserSwitcher 
            currentUser={currentUser} 
            operatori={operatori}
            onLogout={handleLogout} 
            viewAsEmail={viewAsEmail}
            onViewAsChange={setViewAsEmail}
          />
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
             {cloudStatus === 'connected' ? (
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                   <Cloud className="w-3 h-3" /> Cloud Attivo
                 </div>
                 {lastSyncTime && (
                   <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-medium">
                     <Clock className="w-2.5 h-2.5" /> Ultima sync: {lastSyncTime}
                   </div>
                 )}
               </div>
             ) : (
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                 <CloudOff className="w-3 h-3" /> Solo Locale (Offline)
               </div>
             )}
             {isSyncing && (
               <div className="flex items-center gap-2 text-[#32964D] text-[9px] font-bold animate-pulse">
                 <RefreshCw className="w-2.5 h-2.5 animate-spin" /> In Sincronia...
               </div>
             )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-shrink-0 no-print">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {view === 'list' ? 'Registro Vendite' : view === 'dashboard' ? 'Statistiche' : view === 'agents' ? 'Team Agenti' : view === 'settings' ? 'Configurazione' : view === 'manual' ? 'Documentazione Tecnica' : 'Operatori'}
            </h2>
            {viewAsEmail && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg shadow-sm border-dashed">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Vista: {operatori.find(o => o.email === viewAsEmail)?.nome || viewAsEmail}</span>
              </div>
            )}
            {cloudStatus === 'connected' && view !== 'manual' && (
              <button 
                onClick={() => { fetchData(true); addToast("Aggiornamento dati Cloud in corso..."); }}
                className="text-slate-400 hover:text-[#32964D] transition-colors p-2 rounded-lg hover:bg-emerald-50"
                title="Aggiorna dati dal Cloud"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
             {view === 'list' && (
              <button onClick={() => { setEditingVendita(null); setIsFormOpen(true); }} className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95 hover:bg-[#2b7e41]">
                <Plus className="w-5 h-5" /> Nuova Vendita
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8 bg-[#f1f5f9]/50">
          <div className="max-w-7xl mx-auto">
            {view === 'list' && (
              <SalesTable 
                vendite={filteredVendite} 
                metodiDisponibili={metodiPagamento}
                isAdmin={currentUser.role === 'admin'} 
                onIncasso={async (id) => {
                  const targetVendita = vendite.find(v => v.id === id);
                  if (!targetVendita) return;

                  const updated = vendite.map(v => v.id === id ? {...v, incassato: true, noteAmministrazione: 'OK MARILENA'} : v);
                  setVendite(updated);
                  
                  await syncToCloud('vendite', {...targetVendita, incassato: true, noteAmministrazione: 'OK MARILENA'});
                  
                  // Notifica l'operatore proprietario della vendita
                  await sendNotification(
                    targetVendita.operatoreEmail, 
                    `L'amministratore ha confermato l'incasso per ${targetVendita.cliente}.`
                  );
                  
                  addToast(`Incasso confermato per ${targetVendita.cliente}`, 'success');
                }} 
                onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }}
                onDelete={async (id) => {
                  if (window.confirm("Sei sicuro di voler eliminare questa vendita?")) {
                    setVendite(vendite.filter(v => v.id !== id));
                    if (supabase) await supabase.from('vendite').delete().eq('id', id);
                    addToast("Vendita eliminata", "info");
                  }
                }}
                onCopy={(text) => {
                  navigator.clipboard.writeText(text);
                  addToast("Dati copiati negli appunti", "info");
                }}
              />
            )}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'agents' && <AgentManager 
              agenti={filteredAgenti} 
              operatori={operatori} 
              isAdmin={currentUser.role === 'admin'} 
              onUpdate={async (a) => {
                const updated = agenti.find(x => x.id === a.id) ? agenti.map(x => x.id === a.id ? a : x) : [a, ...agenti];
                setAgenti(updated);
                await syncToCloud('agenti', a);
                addToast(`Profilo ${a.nome} aggiornato`, 'success');
              }} 
            />}
            {view === 'operators' && <OperatorManager 
              operatori={operatori} 
              onUpdate={async (o) => {
                const updated = operatori.find(x => x.id === o.id) 
                  ? operatori.map(x => x.id === o.id ? o : x)
                  : [...operatori, o];
                setOperatori(ensureAdmin(updated));
                await syncToCloud('operatori', o);
                addToast(`Account ${o.nome} salvato`, 'success');
              }} 
              onDelete={async (id) => {
                const updated = operatori.filter(o => o.id !== id);
                setOperatori(ensureAdmin(updated));
                if (supabase) {
                  const { error } = await supabase.from('operatori').delete().eq('id', id);
                  if (error) console.error("Errore eliminazione operatore:", error);
                }
                addToast("Account operatore rimosso", "info");
              }}
            />}
            {view === 'manual' && <TechnicalManual />}
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
              const opEmail = viewAsEmail || currentUser.email;
              const newV = editingVendita ? { ...editingVendita, ...data } : {
                ...data, id: Math.random().toString(36).substr(2, 9),
                data: new Date().toISOString().split('T')[0], operatoreEmail: opEmail
              };
              setVendite(editingVendita ? vendite.map(v => v.id === editingVendita.id ? newV : v) : [newV, ...vendite]);
              setIsFormOpen(false);
              await syncToCloud('vendite', newV);
              addToast(editingVendita ? "Registrazione aggiornata" : "Nuova pratica registrata", "success");
            }} 
            userEmail={viewAsEmail || currentUser.email} availableAgentList={filteredAgenti} metodiDisponibili={metodiPagamento}
            initialData={editingVendita || undefined} isAdmin={currentUser.role === 'admin'}
          />
        </div>
      )}
    </div>
  );
};

export default App;
