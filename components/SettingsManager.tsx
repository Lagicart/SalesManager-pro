
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, BellRing, Copy } from 'lucide-react';

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

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, dbConfig, onDbConfigChange, onTestNotif }) => {
  const [nuovoMetodo, setNuovoMetodo] = useState('');
  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');
  const [showSql, setShowSql] = useState(false);

  const sqlCode = `-- UPDATE PER CHAT DI PRATICA AVANZATA
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS notizie TEXT;
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS nuove_notizie BOOLEAN DEFAULT FALSE;
ALTER TABLE vendite ADD COLUMN IF NOT EXISTS ultimo_mittente TEXT;

-- REPLICA IDENTITY FULL PER REALTIME CHAT
ALTER TABLE vendite REPLICA IDENTITY FULL;

-- SE NON HAI ANCORA CREATO LE TABELLE:
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
  nuove_notizie BOOLEAN DEFAULT FALSE,
  ultimo_mittente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`;

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    onDbConfigChange(tempUrl && tempKey ? { url: tempUrl, key: tempKey } : null);
    alert("Cloud aggiornato!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-[#32964D]" />
            <h3 className="text-xl font-bold">Cloud & Notifiche</h3>
          </div>
          <button onClick={() => setShowSql(!showSql)} className="text-xs font-bold bg-slate-100 px-4 py-2 rounded-xl">SQL Update</button>
        </div>
        {showSql && (
          <div className="mb-6 p-4 bg-slate-900 rounded-xl overflow-hidden">
            <pre className="text-[10px] text-emerald-400 overflow-x-auto">{sqlCode}</pre>
          </div>
        )}
        <form onSubmit={handleSaveDb} className="space-y-4">
          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="URL Supabase" value={tempUrl} onChange={e => setTempUrl(e.target.value)} />
          <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Anon Key" value={tempKey} onChange={e => setTempKey(e.target.value)} />
          <button type="submit" className="bg-[#32964D] text-white px-8 py-3 rounded-xl font-bold shadow-lg">Salva Configurazione</button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold mb-6">Metodi di Pagamento</h3>
        <div className="flex gap-2 mb-6">
          <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={nuovoMetodo} onChange={e => setNuovoMetodo(e.target.value)} placeholder="Aggiungi metodo..." />
          <button onClick={() => { onUpdate([...metodi, nuovoMetodo]); setNuovoMetodo(''); }} className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold"><Plus /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metodi.map(m => (
            <div key={m} className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-700">{m}</span>
              <button onClick={() => onUpdate(metodi.filter(x => x !== m))} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
