
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, BellRing, Copy, DatabaseZap } from 'lucide-react';

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
  const [showSql, setShowSql] = useState(false);

  const sqlCode = `-- 🚀 UPDATE DEFINITIVO PER CHAT E VERIFICA PAGAMENTI
-- 1. Aggiunge le colonne per la chat e lo stato notifiche
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS notizie TEXT;
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS nuove_notizie BOOLEAN DEFAULT FALSE;
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS ultimo_mittente TEXT;

-- 2. Aggiunge le colonne per la verifica amministrativa dei pagamenti
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS verificare_pagamento BOOLEAN DEFAULT FALSE;
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS pagamento_verificato BOOLEAN DEFAULT FALSE;

-- 3. Importante: permette al Cloud di inviare aggiornamenti istantanei
ALTER TABLE vendite REPLICA IDENTITY FULL;

-- 4. Schema completo per nuove installazioni:
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
);`;

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    onDbConfigChange(tempUrl && tempKey ? { url: tempUrl, key: tempKey } : null);
    alert("Configurazione Cloud salvata!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-[#32964D]" />
            <h3 className="text-xl font-bold text-slate-900">Configurazione Cloud</h3>
          </div>
          <button 
            onClick={() => setShowSql(!showSql)} 
            className="text-[10px] font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <DatabaseZap className="w-3.5 h-3.5" /> {showSql ? 'Nascondi SQL' : 'Ottieni Script SQL'}
          </button>
        </div>

        {showSql && (
          <div className="mb-6 animate-in slide-in-from-top-2">
             <div className="bg-slate-900 p-6 rounded-2xl relative">
                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-4 opacity-50">Copia ed esegui nell'SQL Editor di Supabase:</p>
                <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {sqlCode}
                </pre>
                <button 
                  onClick={() => { navigator.clipboard.writeText(sqlCode); alert("Copiato!"); }}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
             </div>
             <p className="mt-2 text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
               <BellRing className="w-4 h-4" /> 
               Dopo aver eseguito lo script, ricarica l'app su tutti i PC.
             </p>
          </div>
        )}

        <form onSubmit={handleSaveDb} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key (Anon)</label>
            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="eyJ..." />
          </div>
          <button type="submit" className="w-full bg-[#32964D] text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/10 hover:bg-[#2b7e41] active:scale-95 transition-all">Salva e Connetti</button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
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
    </div>
  );
};

export default SettingsManager;
