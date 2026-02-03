
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL, EmailConfig } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, FileText, CheckCircle2, BellRing, LifeBuoy, AlertTriangle, RefreshCw, Download, Upload, ShieldAlert, FileJson, ShieldCheck } from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import SalesTable from './components/SalesTable';
import SalesForm from './components/SalesForm';
import UserSwitcher from './components/UserSwitcher';
import Dashboard from './components/Dashboard';
import AgentManager from './components/AgentManager';
import OperatorManager from './components/OperatorManager';
import SettingsManager from './components/SettingsManager';
import LoginScreen from './components/LoginScreen';
import StatementOfAccount from './components/StatementOfAccount';

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
  const [dataLossWarning, setDataLossWarning] = useState(() => localStorage.getItem('sm_needs_sync') === 'true');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sm_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<Operatore | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'notification' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const [viewAsEmail, setViewAsEmail] = useState<string | null>(null);

  const [operatori, setOperatori] = useState<Operatore[]>(() => {
    const saved = localStorage.getItem('sm_operatori');
    return saved ? JSON.parse(saved) : [];
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
    return saved ? JSON.parse(saved) : ['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti', 'POS'];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendita, setEditingVendita] = useState<Vendita | null>(null);
  const [view, setView] = useState<'dashboard' | 'list' | 'statement' | 'agents' | 'operators' | 'settings'>('dashboard');

  useEffect(() => {
    if (dbConfig?.url && dbConfig?.key) {
      setSupabase(createClient(dbConfig.url, dbConfig.key));
    }
  }, [dbConfig]);

  const fetchData = useCallback(async (force = false) => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      const [vRes, aRes, oRes, eRes] = await Promise.all([
        supabase.from('vendite').select('*').order('created_at', { ascending: false }),
        supabase.from('agenti').select('*'),
        supabase.from('operatori').select('*'),
        currentUser ? supabase.from('configurazioni_email').select('*').eq('operatore_email', currentUser.email.toLowerCase()).maybeSingle() : Promise.resolve({data: null})
      ]);

      if (vRes.data) {
        const mappedVendite = vRes.data.map(d => ({ 
          ...d, 
          importo: Number(d.importo), 
          metodoPagamento: d.metodo_pagamento, 
          operatoreEmail: (d.operatore_email || '').toLowerCase(),
          verificarePagamento: d.verificare_pagamento,
          pagamentoVerificato: d.pagamento_verificato,
          noteAmministrazione: d.note_amministrazione || ''
        }));
        setVendite(mappedVendite);
        localStorage.setItem('sm_vendite', JSON.stringify(mappedVendite));
      }
      
      if (aRes.data) {
        const mappedAgenti = aRes.data.map(d => ({ 
          ...d, 
          operatoreEmail: (d.operatore_email || '').toLowerCase() 
        }));
        setAgenti(mappedAgenti);
        localStorage.setItem('sm_agenti', JSON.stringify(mappedAgenti));
      }

      if (oRes.data) {
        setOperatori(oRes.data as Operatore[]);
        localStorage.setItem('sm_operatori', JSON.stringify(oRes.data));
      }

      if (eRes.data) {
        setEmailConfig(eRes.data);
      }
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  }, [supabase, currentUser]);

  useEffect(() => {
    if (supabase && isLoggedIn) {
      fetchData();
      
      // Real-time opzionale: se volessimo proprio il top, potremmo aggiungere una subscription qui.
      // Per ora rinfreschiamo ad ogni azione di scrittura.
    }
  }, [supabase, isLoggedIn, fetchData]);

  const forcePushLocalToCloud = async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      addToast("Sincronizzazione globale in corso...", "info");
      
      // Upsert Operatori
      const ops = operatori.map(o => ({ ...o, email: o.email.toLowerCase() }));
      await supabase.from('operatori').upsert(ops, { onConflict: 'email' });

      // Upsert Agenti
      const ags = agenti.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email.toLowerCase(),
        operatore_email: a.operatoreEmail.toLowerCase(),
        telefono: a.telefono || '',
        zona: a.zona || ''
      }));
      await supabase.from('agenti').upsert(ags);

      // Upsert Vendite
      const sales = vendite.map(v => ({
        id: v.id,
        data: v.data,
        cliente: v.cliente,
        importo: v.importo,
        metodo_pagamento: v.metodoPagamento,
        agente: v.agente,
        operatore_email: v.operatoreEmail.toLowerCase(),
        incassato: v.incassato,
        verificare_pagamento: v.verificarePagamento,
        pagamento_verificato: v.pagamentoVerificato,
        notizie: v.notizie || '',
        nuove_notizie: !!v.nuove_notizie,
        ultimo_mittente: v.ultimo_mittente || '',
        created_at: v.created_at || new Date().toISOString()
      }));

      for (let i = 0; i < sales.length; i += 50) {
        await supabase.from('vendite').upsert(sales.slice(i, i + 50));
      }

      setDataLossWarning(false);
      localStorage.setItem('sm_needs_sync', 'false');
      addToast("Cloud allineato con successo!", "success");
      fetchData(true);
    } catch (e: any) {
      addToast("Errore durante la sincronizzazione: " + e.message, "error");
    } finally { setIsSyncing(false); }
  };

  // LOGICA CLOUD-FIRST: Scrive prima sul Cloud, poi aggiorna il locale
  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) {
      addToast("Errore: Database Cloud non collegato!", "error");
      return;
    }

    try {
      setIsSyncing(true);
      const payload: any = { ...data };
      
      if (table === 'vendite') {
        if (data.metodoPagamento) payload.metodo_pagamento = data.metodoPagamento;
        if (data.operatoreEmail) payload.operatore_email = (data.operatoreEmail || '').toLowerCase();
        delete payload.metodoPagamento;
        delete payload.operatoreEmail;
      } else if (table === 'agenti') {
        if (data.operatoreEmail) payload.operatore_email = (data.operatoreEmail || '').toLowerCase();
        delete payload.operatoreEmail;
      }

      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw error;

      // DOPO IL SUCCESSO SUL CLOUD, AGGIORNIAMO IL LOCALE
      addToast("Salvato correttamente sul Cloud", "success");
      await fetchData(true); // Forza il ricaricamento per vedere le modifiche
      
      return true;
    } catch (e: any) {
      console.error(e);
      addToast("ERRORE CLOUD: " + e.message + ". Riprova tra poco.", "error");
      throw e; // Rilanciamo l'errore per il form
    } finally {
      setIsSyncing(false);
    }
  };

  const saveEmailConfig = async (config: EmailConfig) => {
    setEmailConfig(config);
    if (supabase) {
      try {
        await supabase.from('configurazioni_email').upsert(config, { onConflict: 'operatore_email' });
        addToast("Configurazione email salvata.");
      } catch (e) { addToast("Errore salvataggio email config", "error"); }
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.vendite) setVendite(data.vendite);
        if (data.agenti) setAgenti(data.agenti);
        if (data.operatori) setOperatori(data.operatori);
        setDataLossWarning(true);
        localStorage.setItem('sm_needs_sync', 'true');
        addToast("Dati caricati nel sistema locale. Ora premi il banner in alto per inviarli al Cloud.");
      } catch (err) { addToast("File JSON non valido", "error"); }
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    const data = { vendite, agenti, operatori, metodi: metodiPagamento };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_lagicart_completo.json`;
    a.click();
  };

  const filteredVendite = useMemo(() => {
    if (!currentUser) return [];
    let list = [...vendite];
    if (currentUser.role === 'admin' && viewAsEmail) {
      list = list.filter(v => (v.operatoreEmail || '').toLowerCase() === viewAsEmail.toLowerCase());
    } else if (currentUser.role !== 'admin') {
      list = list.filter(v => (v.operatoreEmail || '').toLowerCase() === currentUser.email.toLowerCase());
    }
    return list;
  }, [vendite, currentUser, viewAsEmail]);

  const filteredAgentiForForm = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return agenti;
    return agenti.filter(a => (a.operatoreEmail || '').toLowerCase() === currentUser.email.toLowerCase());
  }, [agenti, currentUser]);

  if (!isLoggedIn || !currentUser) return <LoginScreen operatori={operatori} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} onConfigChange={setDbConfig} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      {dataLossWarning && (
        <div className="fixed top-0 left-0 w-full bg-[#421111] text-white z-[9999] p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-emerald-500 animate-pulse">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="font-black uppercase tracking-tighter text-lg leading-none">ALLINEAMENTO CLOUD RICHIESTO</p>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Sono stati rilevati nuovi dati locali. Sincronizza ora per renderli visibili a tutti.</p>
            </div>
          </div>
          <button onClick={forcePushLocalToCloud} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg border-2 border-emerald-400">
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-5 h-5" />} SINCRONIZZA ORA
          </button>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none no-print">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${t.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'} text-white border border-white/10 pointer-events-auto animate-in slide-in-from-right`}>
            {t.type === 'error' ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            <span className="text-sm font-bold">{t.message}</span>
          </div>
        ))}
      </div>

      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 shadow-xl z-50 overflow-y-auto no-print">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10">
            <img src={BRAND_LOGO_DATA} alt="Logo" className="w-11 h-11" />
            <h1 className="text-xl font-bold tracking-tight">Lagicart</h1>
          </div>
          <nav className="space-y-1.5">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><TrendingUp className="w-5 h-5" /><span className="font-medium">Dashboard</span></button>
            <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><List className="w-5 h-5" /><span className="font-medium">Vendite</span></button>
            <button onClick={() => setView('statement')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'statement' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><FileText className="w-5 h-5" /><span className="font-medium">Estratto Conto</span></button>
            <button onClick={() => setView('agents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'agents' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Contact2 className="w-5 h-5" /><span className="font-medium">Agenti</span></button>
            {currentUser.role === 'admin' && (
              <button onClick={() => setView('operators')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'operators' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Users className="w-5 h-5" /><span className="font-medium">Operatori</span></button>
            )}
            <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-[#32964D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Settings className="w-5 h-5" /><span className="font-medium">Impostazioni</span></button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/10">
          <UserSwitcher currentUser={currentUser} operatori={operatori} onLogout={() => { setCurrentUser(null); setIsLoggedIn(false); }} viewAsEmail={viewAsEmail} onViewAsChange={setViewAsEmail} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden pt-12 md:pt-0">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 flex-shrink-0 no-print">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{view.toUpperCase()}</h2>
          <div className="flex items-center gap-4">
            {isSyncing && <div className="flex items-center gap-2 text-emerald-600 font-bold animate-pulse"><RefreshCw className="w-4 h-4 animate-spin" /> AZIONE IN CORSO...</div>}
            <button onClick={() => setIsFormOpen(true)} className="bg-[#32964D] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Nuova Pratica</button>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8 bg-[#f1f5f9]/50">
          <div className="max-w-7xl mx-auto">
            {view === 'settings' && <SettingsManager metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} dbConfig={dbConfig} onDbConfigChange={setDbConfig} emailConfig={emailConfig || { operatore_email: currentUser.email, provider: 'local' }} onEmailConfigChange={saveEmailConfig} onEmergencyPush={forcePushLocalToCloud} onEmergencyExport={exportData} onEmergencyImport={importData} />}
            {view === 'statement' && <StatementOfAccount agenti={filteredAgentiForForm} vendite={filteredVendite} metodiDisponibili={metodiPagamento} emailConfig={emailConfig || { operatore_email: currentUser.email, provider: 'local' }} />}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'list' && <SalesTable vendite={filteredVendite} metodiDisponibili={metodiPagamento} isAdmin={currentUser.role === 'admin'} onIncasso={(id) => syncToCloud('vendite', {id, incassato: true})} onVerifyPayment={(id) => syncToCloud('vendite', {id, pagamentoVerificato: true})} onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }} onDelete={(id) => supabase?.from('vendite').delete().eq('id', id).then(() => fetchData(true))} onUpdateNotizie={(id, txt, neu, mit) => syncToCloud('vendite', {id, notizie: txt, nuove_notizie: neu, ultimo_mittente: mit})} currentUserNome={currentUser.nome} />}
            {view === 'agents' && <AgentManager agenti={agenti} operatori={operatori} isAdmin={currentUser.role === 'admin'} currentUser={currentUser} onUpdate={(a) => syncToCloud('agenti', a)} onDelete={(id) => supabase?.from('agenti').delete().eq('id', id).then(() => fetchData(true))} />}
            {view === 'operators' && currentUser.role === 'admin' && <OperatorManager operatori={operatori} onUpdate={(op) => syncToCloud('operatori', op)} onDelete={(id) => supabase?.from('operatori').delete().eq('id', id).then(() => fetchData(true))} onForceCloudSync={forcePushLocalToCloud} />}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <SalesForm 
            onClose={() => { setIsFormOpen(false); setEditingVendita(null); }} 
            onSubmit={async (d) => {
              try {
                const newId = editingVendita?.id || Math.random().toString(36).substr(2, 9);
                await syncToCloud('vendite', {
                  ...d, 
                  id: newId, 
                  operatoreEmail: currentUser.email,
                  data: d.data || new Date().toISOString().split('T')[0]
                });
                setIsFormOpen(false);
                setEditingVendita(null);
              } catch (e) {
                // L'errore è già gestito dai toast, teniamo il form aperto per permettere il retry
              }
            }} 
            userEmail={currentUser.email} 
            availableAgentList={filteredAgentiForForm} 
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
