
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
  const lastFetchRef = useRef<number>(0);

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
    return saved ? JSON.parse(saved) : ['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti'];
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
    
    // PROTEZIONE CRITICA: Se c'è un avviso di "dati locali da salvare", 
    // NON scarichiamo nulla dal cloud per evitare di sovrascrivere il locale.
    if (!force && dataLossWarning) {
      console.log("Fetch sospesa: Dati locali prioritari in attesa di sincronizzazione.");
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) return; 
    lastFetchRef.current = now;

    setIsSyncing(true);
    try {
      const [vRes, aRes, oRes] = await Promise.all([
        supabase.from('vendite').select('*').order('created_at', { ascending: false }),
        supabase.from('agenti').select('*'),
        supabase.from('operatori').select('*')
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

      if (currentUser) {
        const { data: eData } = await supabase.from('configurazioni_email').select('*').eq('operatore_email', currentUser.email.toLowerCase()).maybeSingle();
        if (eData) setEmailConfig(eData);
      }
    } catch (e) { 
      console.error("Errore Sincronizzazione:", e); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [supabase, currentUser, dataLossWarning]);

  useEffect(() => {
    if (supabase && isLoggedIn && currentUser) {
      fetchData(true);
    }
  }, [supabase, isLoggedIn, currentUser]);

  const exportData = () => {
    const dataToExport = {
      vendite,
      agenti,
      operatori,
      metodi: metodiPagamento,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LAGICART_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast("Backup salvato correttamente");
    return true;
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.vendite && json.agenti) {
          setVendite(json.vendite);
          setAgenti(json.agenti);
          if (json.operatori) setOperatori(json.operatori);
          if (json.metodi) setMetodiPagamento(json.metodi);
          
          localStorage.setItem('sm_vendite', JSON.stringify(json.vendite));
          localStorage.setItem('sm_agenti', JSON.stringify(json.agenti));
          localStorage.setItem('sm_operatori', JSON.stringify(json.operatori));
          localStorage.setItem('sm_needs_sync', 'true');
          
          setDataLossWarning(true);
          addToast("Dati ricaricati dal file. Ora premi SINCRONIZZA CLOUD.", "info");
        }
      } catch (err) {
        addToast("Errore lettura file", "error");
      }
    };
    reader.readAsText(file);
  };

  const forcePushLocalToCloud = async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      // 1. Pulizia e Mapping rigoroso per evitare errori di schema
      const mappedVendite = vendite.map(v => ({
        id: v.id,
        data: v.data,
        cliente: v.cliente,
        importo: v.importo,
        metodo_pagamento: v.metodoPagamento,
        sconto: v.sconto || '',
        agente: v.agente,
        operatore_email: (v.operatoreEmail || '').toLowerCase(),
        incassato: !!v.incassato,
        verificare_pagamento: !!v.verificarePagamento,
        pagamento_verificato: !!v.pagamentoVerificato,
        note_amministrazione: v.noteAmministrazione || '',
        notizie: v.notizie || '',
        nuove_notizie: !!v.nuove_notizie,
        ultimo_mittente: v.ultimo_mittente || '',
        // created_at lo inviamo solo se valido, altrimenti lasciamo fare al DB
        ...(v.created_at && v.created_at.length > 5 ? { created_at: v.created_at } : {})
      }));

      const mappedAgenti = agenti.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email,
        operatore_email: (a.operatoreEmail || '').toLowerCase(),
        telefono: a.telefono || '',
        zona: a.zona || ''
      }));

      // Esecuzione Upsert
      const results = await Promise.all([
        supabase.from('operatori').upsert(operatori),
        supabase.from('agenti').upsert(mappedAgenti),
        supabase.from('vendite').upsert(mappedVendite)
      ]);

      // Controllo errori specifici
      const error = results.find(r => r.error);
      if (error) throw error.error;

      setDataLossWarning(false);
      localStorage.setItem('sm_needs_sync', 'false');
      addToast("SINCRONIZZAZIONE COMPLETATA!", "success");
      
      // Ora che siamo allineati, possiamo riprendere il fetch normale
      setTimeout(() => fetchData(true), 1000);
    } catch (e: any) {
      console.error("Errore Cloud:", e);
      alert(`ERRORE DI CARICAMENTO:\n${e.message || "Verifica le tabelle del database."}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      const payload: any = { ...data };
      if (table === 'vendite') {
        if (data.metodoPagamento) payload.metodo_pagamento = data.metodoPagamento;
        if (data.operatoreEmail) payload.operatore_email = (data.operatoreEmail || '').toLowerCase();
        if (data.noteAmministrazione !== undefined) payload.note_amministrazione = data.noteAmministrazione;
        if (data.verificarePagamento !== undefined) payload.verificare_pagamento = data.verificarePagamento;
        if (data.pagamentoVerificato !== undefined) payload.pagamento_verificato = data.pagamentoVerificato;
        delete payload.metodoPagamento;
        delete payload.operatoreEmail;
        delete payload.noteAmministrazione;
        delete payload.verificarePagamento;
        delete payload.pagamentoVerificato;
      }
      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw error;
      fetchData(false);
    } catch (e) { 
      addToast("Errore aggiornamento record", "error"); 
    }
  };

  const saveEmailConfig = async (config: EmailConfig) => {
    setEmailConfig(config);
    if (!supabase) return;
    try {
      await supabase.from('configurazioni_email').upsert(config);
      addToast("Impostazioni email salvate");
    } catch (e) { console.error(e); }
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

  if (!isLoggedIn || !currentUser) return <LoginScreen operatori={operatori} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} onConfigChange={setDbConfig} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 print:bg-white print:block">
      
      {dataLossWarning && (
        <div className="fixed top-0 left-0 w-full bg-[#7a1c1c] text-white z-[9999] p-4 shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-xl border border-white/20"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
              <div>
                <p className="font-black uppercase tracking-tighter text-lg leading-none">DATI LOCALI DA SINCRONIZZARE</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Hai caricato dei dati che non sono ancora sul Cloud.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportData} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/20 transition-all"><Download className="w-3 h-3" /> Backup</button>
              <button onClick={forcePushLocalToCloud} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg border border-emerald-500">
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} SINCRONIZZA ORA
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none no-print">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${t.type === 'error' ? 'bg-rose-600' : (t.type === 'info' ? 'bg-sky-600' : 'bg-slate-900')} text-white border border-white/10 pointer-events-auto animate-in slide-in-from-right`}>
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
            {isSyncing && <div className="flex items-center gap-2 text-emerald-600 font-bold animate-pulse"><RefreshCw className="w-4 h-4 animate-spin" /> SINCRONIZZAZIONE...</div>}
            <button onClick={() => setIsFormOpen(true)} className="bg-[#32964D] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Nuova Pratica</button>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8 bg-[#f1f5f9]/50">
          <div className="max-w-7xl mx-auto">
            {view === 'settings' && <SettingsManager metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} dbConfig={dbConfig} onDbConfigChange={setDbConfig} emailConfig={emailConfig || { operatore_email: currentUser.email, provider: 'local' }} onEmailConfigChange={saveEmailConfig} onEmergencyPush={forcePushLocalToCloud} onEmergencyExport={exportData} onEmergencyImport={importData} />}
            {view === 'statement' && emailConfig && <StatementOfAccount agenti={agenti} vendite={filteredVendite} metodiDisponibili={metodiPagamento} emailConfig={emailConfig} />}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'list' && <SalesTable vendite={filteredVendite} metodiDisponibili={metodiPagamento} isAdmin={currentUser.role === 'admin'} onIncasso={(id) => syncToCloud('vendite', {id, incassato: true})} onVerifyPayment={(id) => syncToCloud('vendite', {id, pagamentoVerificato: true})} onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }} onDelete={(id) => supabase?.from('vendite').delete().eq('id', id).then(() => fetchData(true))} onUpdateNotizie={(id, txt, neu, mit) => syncToCloud('vendite', {id, notizie: txt, nuove_notizie: neu, ultimo_mittente: mit})} currentUserNome={currentUser.nome} />}
            {view === 'agents' && <AgentManager agenti={agenti} operatori={operatori} isAdmin={currentUser.role === 'admin'} currentUser={currentUser} onUpdate={(a) => syncToCloud('agenti', a)} onDelete={(id) => supabase?.from('agenti').delete().eq('id', id).then(() => fetchData(true))} />}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <SalesForm onClose={() => { setIsFormOpen(false); setEditingVendita(null); }} onSubmit={(d) => syncToCloud('vendite', {...d, id: editingVendita?.id || Math.random().toString(36).substr(2, 9), operatoreEmail: currentUser.email}).then(() => setIsFormOpen(false))} userEmail={currentUser.email} availableAgentList={agenti} metodiDisponibili={metodiPagamento} initialData={editingVendita || undefined} isAdmin={currentUser.role === 'admin'} />
        </div>
      )}
    </div>
  );
};

export default App;
