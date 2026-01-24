
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, BellRing, Copy, DatabaseZap, BookOpen, Printer, ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsManagerProps {
  metodi: string[];
  onUpdate: (nuoviMetodi: string[]) => void;
  isAdmin: boolean;
  dbConfig: {url: string, key: string} | null;
  onDbConfigChange: (config: {url: string, key: string} | null) => void;
  onTestNotif?: () => void;
  data: any;
  onImport: (data: any) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, dbConfig, onDbConfigChange }) => {
  const [nuovoMetodo, setNuovoMetodo] = useState('');
  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');
  const [showManual, setShowManual] = useState(false);

  const sqlCode = `-- TABELLE PRINCIPALI
CREATE TABLE IF NOT EXISTS vendite (
  id TEXT PRIMARY KEY,
  data DATE DEFAULT CURRENT_DATE,
  cliente TEXT,
  importo DECIMAL,
  metodo_pagamento TEXT,
  sconto TEXT,
  agente TEXT,
  operatore_email TEXT,
  incassato BOOLEAN DEFAULT FALSE,
  verificare_pagamento BOOLEAN DEFAULT FALSE,
  pagamento_verificato BOOLEAN DEFAULT FALSE,
  note_amministrazione TEXT,
  notizie TEXT,
  nuove_notizie BOOLEAN DEFAULT FALSE,
  ultimo_mittente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS agenti (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT,
  operatore_email TEXT,
  telefono TEXT,
  zona TEXT
);

CREATE TABLE IF NOT EXISTS operatori (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS notifiche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT,
  message TEXT,
  from_user TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- REPLICA IDENTITY FULL (OBBLIGATORIO PER REALTIME NOTIFICHE)
ALTER TABLE vendite REPLICA IDENTITY FULL;
ALTER TABLE agenti REPLICA IDENTITY FULL;
ALTER TABLE operatori REPLICA IDENTITY FULL;
ALTER TABLE notifiche REPLICA IDENTITY FULL;

-- DISABILITAZIONE RLS
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE vendite TO anon;
GRANT ALL ON TABLE agenti TO anon;
GRANT ALL ON TABLE operatori TO anon;
GRANT ALL ON TABLE notifiche TO anon;

-- CONFIGURAZIONE REALTIME
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime SET TABLE vendite, agenti, operatori, notifiche;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE vendite, agenti, operatori, notifiche;
  END IF;
END $$;`;

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    onDbConfigChange(tempUrl && tempKey ? { url: tempUrl, key: tempKey } : null);
    alert("Configurazione Cloud salvata!");
  };

  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <style>{`
        @media print {
          aside, header, .no-print, button, .filter-panel { display: none !important; }
          body { background: white !important; }
          .print-section { display: block !important; padding: 2cm !important; }
          pre { font-size: 8px !important; white-space: pre-wrap !important; }
        }
      `}</style>

      {/* 1. CONFIGURAZIONE CLOUD */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 no-print">
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-[#32964D]" />
          <h3 className="text-xl font-bold text-slate-900">Configurazione Cloud Supabase</h3>
        </div>
        
        <form onSubmit={handleSaveDb} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key (Anon Public)</label>
            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="eyJ..." />
          </div>
          <button type="submit" className="w-full bg-[#32964D] text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/10 hover:bg-[#2b7e41] active:scale-95 transition-all">Salva e Connetti</button>
        </form>
      </div>

      {/* 2. METODI DI PAGAMENTO */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 no-print">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><CreditCard className="w-6 h-6 text-slate-400" /> Metodi di Pagamento</h3>
        <div className="flex gap-2 mb-6">
          <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold uppercase" value={nuovoMetodo} onChange={e => setNuovoMetodo(e.target.value.toUpperCase())} placeholder="NUOVO METODO..." />
          <button onClick={() => { if(nuovoMetodo) onUpdate([...metodi, nuovoMetodo]); setNuovoMetodo(''); }} className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold"><Plus /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metodi.map(m => (
            <div key={m} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <span className="font-bold text-slate-700 text-sm tracking-tight">{m}</span>
              <button onClick={() => onUpdate(metodi.filter(x => x !== m))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MANUALE TECNICO & SQL (SEZIONE ESPANDIBILE) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <button 
          onClick={() => setShowManual(!showManual)}
          className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <BookOpen className={`w-6 h-6 ${showManual ? 'text-amber-600' : 'text-slate-400'}`} />
            <div className="text-left">
              <h3 className="text-xl font-bold text-slate-900">Manuale Tecnico e SQL</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Script Database e Documentazione Interna</p>
            </div>
          </div>
          {showManual ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showManual && (
          <div className="p-8 border-t border-slate-100 space-y-8 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-amber-50 p-6 rounded-2xl border border-amber-100">
               <div className="flex items-center gap-4">
                  <div className="bg-amber-600 p-2.5 rounded-xl text-white">
                    <DatabaseZap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Documentazione di Sincronizzazione</h4>
                    <p className="text-xs text-amber-700 font-medium">Usa lo script qui sotto per configurare il database Supabase.</p>
                  </div>
               </div>
               <button 
                onClick={handlePrintManual}
                className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50"
               >
                 <Printer className="w-4 h-4" /> Stampa PDF
               </button>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Script SQL Consigliato</h5>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(sqlCode); alert("Script copiato!"); }}
                    className="flex items-center gap-2 text-[10px] font-black text-[#32964D] uppercase tracking-widest hover:underline"
                  >
                    <Copy className="w-3 h-3" /> Copia Codice
                  </button>
               </div>
               <div className="bg-slate-900 p-6 rounded-2xl overflow-x-auto shadow-inner">
                  <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed">
                    {sqlCode}
                  </pre>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuove Installazioni</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Incolla lo script nell'<b>SQL Editor</b> di Supabase per creare tutte le tabelle, disabilitare RLS e attivare il tempo reale.</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-3 flex items-center gap-2"><BellRing className="w-4 h-4" /> Notifiche</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Assicurati che <b>REPLICA IDENTITY FULL</b> sia attivo. Senza questo, le notifiche istantanee della chat non funzioneranno.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* SEZIONE PRINT-ONLY PER MANUALE */}
      <div className="hidden print-section space-y-12">
        <div className="text-center pb-8 border-b-4 border-slate-900">
           <h1 className="text-4xl font-black uppercase tracking-tighter">Manuale Tecnico Lagicart SalesManager</h1>
           <p className="font-bold text-slate-500 mt-2">Documentazione di Manutenzione e Sincronizzazione Database</p>
        </div>
        <div>
           <h2 className="text-2xl font-black uppercase mb-4">1. Schema Database Supabase</h2>
           <div className="bg-slate-100 p-8 rounded-xl border border-slate-300">
              <pre className="text-[10px] font-mono whitespace-pre-wrap">{sqlCode}</pre>
           </div>
        </div>
        <div className="pt-10 border-t border-slate-200 text-[10px] italic text-slate-400 text-center">
           Documentazione generata automaticamente il {new Date().toLocaleDateString('it-IT')}
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
