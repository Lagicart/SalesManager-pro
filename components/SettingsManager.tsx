import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Download, Upload, Database, HelpCircle, Copy, Check, Server } from 'lucide-react';

interface SettingsManagerProps {
  metodi: string[];
  onUpdate: (nuoviMetodi: string[]) => void;
  isAdmin: boolean;
  data: any;
  onImport: (data: any) => void;
  dbConfig: {url: string, key: string} | null;
  onDbConfigChange: (config: {url: string, key: string} | null) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, data, onImport, dbConfig, onDbConfigChange }) => {
  const [nuovoMetodo, setNuovoMetodo] = useState('');
  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- COPIA TUTTO QUESTO CODICE E ESEGUILO IN SUPABASE > SQL EDITOR

-- 1. Tabella Vendite
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
  note_amministrazione TEXT
);

-- 2. Tabella Agenti
CREATE TABLE IF NOT EXISTS agenti (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT,
  operatore_email TEXT
);

-- 3. Tabella Operatori (Account Login)
CREATE TABLE IF NOT EXISTS operatori (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
);

-- Disabilita protezioni per accesso semplificato
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;

-- Abilita Sincronizzazione Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE vendite, agenti, operatori;`;

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
    if (!tempUrl || !tempKey) {
      onDbConfigChange(null);
      alert("Configurazione Cloud rimossa.");
    } else {
      onDbConfigChange({ url: tempUrl, key: tempKey });
      alert("Configurazione Cloud salvata con successo!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#32964D] p-2.5 rounded-xl text-white shadow-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Sincronizzazione Account e Dati</h3>
              <p className="text-slate-500 text-sm">Configura Supabase per sincronizzare login e vendite in tutto l'ufficio.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showHelp ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <HelpCircle className="w-4 h-4" /> {showHelp ? 'Nascondi Guida' : 'Guida SQL'}
          </button>
        </div>

        {showHelp && (
          <div className="mb-8 p-6 bg-slate-900 rounded-2xl text-slate-300 space-y-4 animate-in zoom-in-95">
            <h4 className="font-bold text-white flex items-center gap-2 italic">
              Aggiornamento Database Necessario
            </h4>
            <p className="text-xs">Per abilitare il login sincronizzato, devi eseguire il nuovo codice SQL nel tuo pannello Supabase.</p>
            
            <div className="mt-4 relative">
              <button onClick={copySql} className="absolute right-4 top-4 flex items-center gap-1.5 text-[10px] font-bold text-[#32964D] hover:text-white transition-colors bg-white/5 px-2 py-1 rounded">
                {copied ? <><Check className="w-3 h-3" /> Copiato!</> : <><Copy className="w-3 h-3" /> Copia Codice SQL</>}
              </button>
              <pre className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-white/5 text-emerald-400 pt-10 h-48">
                {sqlCode}
              </pre>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveDb} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 ml-1">URL Progetto</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#32964D]/20 font-bold"
                placeholder="https://xyz.supabase.co"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 ml-1">Chiave API (anon)</label>
              <input 
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#32964D]/20 font-bold"
                placeholder="Inserisci la chiave anon public"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="bg-[#32964D] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#2b7e41] transition-all">
            Salva e Connetti Cloud
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#32964D] p-2.5 rounded-xl text-white">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Metodi Pagamento</h3>
        </div>

        <form onSubmit={aggiungiMetodo} className="flex gap-2 mb-8">
          <input 
            type="text"
            placeholder="Aggiungi metodo (es: Assegno)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none font-bold"
            value={nuovoMetodo}
            onChange={e => setNuovoMetodo(e.target.value)}
          />
          <button type="submit" className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2b7e41] transition-all"><Plus className="w-4 h-4" /></button>
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