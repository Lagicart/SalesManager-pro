
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, HelpCircle, Copy, Check, Server, AlertTriangle, Save, BellRing } from 'lucide-react';

interface SettingsManagerProps {
  metodi: string[];
  onUpdate: (nuoviMetodi: string[]) => void;
  isAdmin: boolean;
  data: any;
  onImport: (data: any) => void;
  dbConfig: {url: string, key: string} | null;
  onDbConfigChange: (config: {url: string, key: string} | null) => void;
  onTestNotif?: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, dbConfig, onDbConfigChange, onTestNotif }) => {
  const [nuovoMetodo, setNuovoMetodo] = useState('');
  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- SETUP TABLES
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
  note_amministrazione TEXT,
  notizie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE vendite ADD COLUMN IF NOT EXISTS notizie TEXT;

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

ALTER TABLE vendite REPLICA IDENTITY FULL;
ALTER TABLE agenti REPLICA IDENTITY FULL;
ALTER TABLE operatori REPLICA IDENTITY FULL;
ALTER TABLE notifiche REPLICA IDENTITY FULL;

ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE vendite TO anon;
GRANT ALL ON TABLE agenti TO anon;
GRANT ALL ON TABLE operatori TO anon;
GRANT ALL ON TABLE notifiche TO anon;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime SET TABLE vendite, agenti, operatori, notifiche;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE vendite, agenti, operatori, notifiche;
  END IF;
END $$;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aggiungiMetodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoMetodo.trim()) return;
    onUpdate([...metodi, nuovoMetodo.trim()]);
    setNuovoMetodo('');
  };

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    onDbConfigChange(tempUrl && tempKey ? { url: tempUrl, key: tempKey } : null);
    alert("Cloud collegato!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#32964D] p-2.5 rounded-xl text-white shadow-lg"><Server className="w-5 h-5" /></div>
            <h3 className="text-xl font-bold text-slate-900">Configurazione Cloud</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onTestNotif}
              className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-all"
            >
              <BellRing className="w-4 h-4" /> Test Notifiche
            </button>
            <button onClick={() => setShowHelp(!showHelp)} className="text-xs font-bold bg-slate-100 px-4 py-2 rounded-xl text-slate-600">SQL</button>
          </div>
        </div>

        {showHelp && (
          <div className="mb-8 p-6 bg-slate-900 rounded-2xl text-slate-300">
             <button onClick={copySql} className="text-[10px] font-black text-[#32964D] bg-white px-2 py-1 rounded mb-4">COPIA SQL AGGIORNATO</button>
             <pre className="text-[9px] font-mono h-32 overflow-y-auto text-emerald-400">{sqlCode}</pre>
          </div>
        )}

        <form onSubmit={handleSaveDb} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Supabase URL" value={tempUrl} onChange={e => setTempUrl(e.target.value)} />
            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Anon Key" value={tempKey} onChange={e => setTempKey(e.target.value)} />
          </div>
          <button type="submit" className="bg-[#32964D] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">Applica Configurazione</button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#32964D] p-2.5 rounded-xl text-white"><CreditCard className="w-5 h-5" /></div>
          <h3 className="text-xl font-bold text-slate-900">Metodi Pagamento</h3>
        </div>
        <form onSubmit={aggiungiMetodo} className="flex gap-2 mb-8">
          <input placeholder="Nuovo metodo..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={nuovoMetodo} onChange={e => setNuovoMetodo(e.target.value)} />
          <button type="submit" className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold"><Plus className="w-4 h-4" /></button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metodi.map(m => (
            <div key={m} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <span className="font-bold text-slate-700 text-sm">{m}</span>
              <button onClick={() => onUpdate(metodi.filter(x => x !== m))} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
