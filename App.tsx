
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Vendita, Operatore, Agente, ADMIN_EMAIL, EmailConfig } from './types';
import { Plus, List, TrendingUp, Contact2, Users, Settings, FileText, CheckCircle2, AlertTriangle, RefreshCw, Upload, Download, ShieldAlert, FileJson } from 'lucide-react';
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
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [dbConfig, setDbConfig] = useState<{url: string, key: string} | null>(() => {
    const saved = localStorage.getItem('sm_db_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sm_is_logged_in') === 'true');
  const [currentUser, setCurrentUser] = useState<Operatore | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [vendite, setVendite] = useState<Vendita[]>([]);
  const [agenti, setAgenti] = useState<Agente[]>([]);
  const [metodiPagamento, setMetodiPagamento] = useState<string[]>(['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti', 'POS']);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendita, setEditingVendita] = useState<Vendita | null>(null);
  const [view, setView] = useState<'dashboard' | 'list' | 'statement' | 'agents' | 'operators' | 'settings'>('dashboard');
  const [viewAsEmail, setViewAsEmail] = useState<string | null>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    if (dbConfig?.url && dbConfig?.key) {
      setSupabase(createClient(dbConfig.url, dbConfig.key));
    }
  }, [dbConfig]);

  const fetchData = useCallback(async () => {
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
        setVendite(vRes.data.map(d => ({ 
          ...d, 
          importo: Number(d.importo), 
          metodoPagamento: d.metodo_pagamento, 
          operatoreEmail: (d.operatore_email || '').toLowerCase(),
          verificarePagamento: d.verificare_pagamento,
          pagamentoVerificato: d.pagamento_verificato,
          noteAmministrazione: d.note_amministrazione || ''
        })));
      }
      if (aRes.data) {
        setAgenti(aRes.data.map(d => ({ ...d, operatoreEmail: (d.operatore_email || '').toLowerCase() })));
      }
      if (oRes.data) setOperatori(oRes.data);
      if (eRes.data) setEmailConfig(eRes.data);
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  }, [supabase, currentUser]);

  useEffect(() => {
    if (!supabase || !isLoggedIn) return;
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendite' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agenti' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operatori' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, isLoggedIn, fetchData]);

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      // Creiamo un payload pulito mappando camelCase -> snake_case
      const payload: any = { ...data };
      
      if (table === 'vendite') {
        if ('metodoPagamento' in data) payload.metodo_pagamento = data.metodoPagamento;
        if ('operatoreEmail' in data) payload.operatore_email = (data.operatoreEmail || '').toLowerCase();
        if ('verificarePagamento' in data) payload.verificare_pagamento = !!data.verificarePagamento;
        if ('pagamentoVerificato' in data) payload.pagamento_verificato = !!data.pagamentoVerificato;
        if ('noteAmministrazione' in data) payload.note_amministrazione = data.noteAmministrazione;
        
        // Pulizia chiavi camelCase per evitare errori di schema Supabase
        delete payload.metodoPagamento;
        delete payload.operatoreEmail;
        delete payload.verificarePagamento;
        delete payload.pagamentoVerificato;
        delete payload.noteAmministrazione;
      } else if (table === 'agenti') {
        if ('operatoreEmail' in data) payload.operatore_email = (data.operatoreEmail || '').toLowerCase();
        delete payload.operatoreEmail;
      }

      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw error;
      
      addToast("Dati sincronizzati", "success");
      return true;
    } catch (e: any) {
      console.error("Errore sincronizzazione:", e);
      addToast("Errore database: " + e.message, "error");
      throw e;
    } finally { setIsSyncing(false); }
  };

  const forcePushLocalToCloud = async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      addToast("Allineamento Cloud in corso...", "info");
      
      // Operatori
      await supabase.from('operatori').upsert(operatori.map(o => ({
        id: o.id,
        nome: o.nome,
        email: o.email.toLowerCase(),
        password: o.password,
        role: o.role
      })), { onConflict: 'email' });

      // Agenti
      await supabase.from('agenti').upsert(agenti.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email.toLowerCase(),
        operatore_email: (a.operatoreEmail || '').toLowerCase(),
        telefono: a.telefono,
        zona: a.zona
      })));

      // Vendite
      const sales = vendite.map(v => ({
        id: v.id,
        data: v.data,
        cliente: v.cliente,
        importo: Number(v.importo),
        metodo_pagamento: v.metodoPagamento,
        agente: v.agente,
        operatore_email: (v.operatoreEmail || '').toLowerCase(),
        incassato: !!v.incassato,
        verificare_pagamento: !!v.verificarePagamento,
        pagamento_verificato: !!v.pagamentoVerificato,
        note_amministrazione: v.noteAmministrazione || '',
        notizie: v.notizie || '',
        nuove_notizie: !!v.nuove_notizie,
        ultimo_mittente: v.ultimo_mittente || '',
        created_at: v.created_at || new Date().toISOString()
      }));

      for (let i = 0; i < sales.length; i += 50) {
        await supabase.from('vendite').upsert(sales.slice(i, i + 50));
      }

      addToast("Cloud allineato con successo!", "success");
      fetchData();
    } catch (e: any) { addToast("Errore: " + e.message, "error"); }
    finally { setIsSyncing(false); }
  };

  const exportData = () => {
    const data = { vendite, agenti, operatori };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_lagicart.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.vendite) setVendite(data.vendite);
        if (data.agenti) setAgenti(data.agenti);
        addToast("Dati caricati nel sistema locale.");
      } catch (err) { addToast("File non valido", "error"); }
    };
    reader.readAsText(file);
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
          <UserSwitcher currentUser={currentUser} operatori={operatori} onLogout={() => { setCurrentUser(null); setIsLoggedIn(false); localStorage.removeItem('sm_is_logged_in'); }} viewAsEmail={viewAsEmail} onViewAsChange={setViewAsEmail} />
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
            {view === 'settings' && <SettingsManager metodi={metodiPagamento} onUpdate={setMetodiPagamento} isAdmin={currentUser.role === 'admin'} dbConfig={dbConfig} onDbConfigChange={setDbConfig} emailConfig={emailConfig || { operatore_email: currentUser.email, provider: 'local' }} onEmailConfigChange={(c) => syncToCloud('configurazioni_email', c)} onEmergencyPush={forcePushLocalToCloud} onEmergencyExport={exportData} onEmergencyImport={importData} />}
            {view === 'statement' && <StatementOfAccount agenti={filteredAgentiForForm} vendite={filteredVendite} metodiDisponibili={metodiPagamento} emailConfig={emailConfig || { operatore_email: currentUser.email, provider: 'local' }} />}
            {view === 'dashboard' && <Dashboard vendite={filteredVendite} isAdmin={currentUser.role === 'admin'} />}
            {view === 'list' && <SalesTable vendite={filteredVendite} metodiDisponibili={metodiPagamento} isAdmin={currentUser.role === 'admin'} onIncasso={(id) => syncToCloud('vendite', {id, incassato: true})} onVerifyPayment={(id) => syncToCloud('vendite', {id, pagamentoVerificato: true})} onEdit={(v) => { setEditingVendita(v); setIsFormOpen(true); }} onDelete={(id) => supabase?.from('vendite').delete().eq('id', id).then(() => fetchData())} onUpdateNotizie={(id, txt, neu, mit) => syncToCloud('vendite', {id, notizie: txt, nuove_notizie: neu, ultimo_mittente: mit})} currentUserNome={currentUser.nome} />}
            {view === 'agents' && <AgentManager agenti={agenti} operatori={operatori} isAdmin={currentUser.role === 'admin'} currentUser={currentUser} onUpdate={(a) => syncToCloud('agenti', a)} onDelete={(id) => supabase?.from('agenti').delete().eq('id', id).then(() => fetchData())} />}
            {view === 'operators' && currentUser.role === 'admin' && <OperatorManager operatori={operatori} onUpdate={(op) => syncToCloud('operatori', op)} onDelete={(id) => supabase?.from('operatori').delete().eq('id', id).then(() => fetchData())} onForceCloudSync={forcePushLocalToCloud} />}
          </div>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <SalesForm 
            onClose={() => { setIsFormOpen(false); setEditingVendita(null); }} 
            onSubmit={async (d) => {
              const newId = editingVendita?.id || Math.random().toString(36).substr(2, 9);
              try {
                await syncToCloud('vendite', { ...d, id: newId, operatoreEmail: currentUser.email, data: d.data || new Date().toISOString().split('T')[0] });
                setIsFormOpen(false);
                setEditingVendita(null);
              } catch(e) {}
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
