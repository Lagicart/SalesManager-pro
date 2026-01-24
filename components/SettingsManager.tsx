import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Download, Upload, Database, Globe, HelpCircle, Copy, Check, Share2, Server, Monitor, Github, AlertCircle } from 'lucide-react';

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

  const sqlCode = `-- 1. COPIA QUESTO CODICE
-- 2. VAI SU SUPABASE → SQL EDITOR
-- 3. INCOLLA E PREMI "RUN"

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

-- Abilita la sincronizzazione in tempo reale
ALTER PUBLICATION supabase_realtime ADD TABLE vendite;`;

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
      alert("Configurazione salvata con successo!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* SEZIONE DISTRIBUZIONE */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#32964D] p-2.5 rounded-xl">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Come farla usare ai colleghi</h3>
            <p className="text-slate-400 text-sm">Pubblica l'app online gratuitamente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-white">
              <Github className="w-4 h-4" />
              <span className="font-bold text-sm">GitHub Pages</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Gratis solo se il progetto è <strong>Pubblico</strong> (Settings → General → Change Visibility).
            </p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-[#32964D]">
              <Globe className="w-4 h-4" />
              <span className="font-bold text-sm">Vercel / Netlify</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Migliore scelta: gratis anche per progetti <strong>Privati</strong>. Collega GitHub a Vercel.com.
            </p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <Monitor className="w-4 h-4" />
              <span className="font-bold text-sm">Locale</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Solo per test. Richiede <strong>Live Server</strong> per non avere la pagina bianca.
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-200">
            <strong>Attenzione:</strong> Se vedi "Upgrade to enable Pages" su GitHub, significa che il tuo progetto è Privato. Rendilo <strong>Public</strong> nelle impostazioni del repository per attivarlo gratis.
          </p>
        </div>
      </div>
      
      {/* SEZIONE SUPABASE */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#32964D] p-2.5 rounded-xl text-white shadow-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Configurazione Database (Cloud)</h3>
              <p className="text-slate-500 text-sm">Collega l'app a Supabase per sincronizzare i PC.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showHelp ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <HelpCircle className="w-4 h-4" /> {showHelp ? 'Chiudi Guida' : 'Come ottenere le chiavi?'}
          </button>
        </div>

        {showHelp && (
          <div className="mb-8 p-6 bg-slate-900 rounded-2xl text-slate-300 space-y-4 animate-in zoom-in-95">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-[#32964D]" /> Guida Rapida
            </h4>
            <ol className="text-xs space-y-3 list-decimal ml-4">
              <li>Apri il tuo progetto su <strong>Supabase.com</strong>.</li>
              <li>Vai in <strong>Settings (Ingranaggio)</strong> → <strong>API</strong>.</li>
              <li>Copia <strong>Project URL</strong> e <strong>anon public key</strong> e incollali qui sotto.</li>
              <li>Vai in <strong>SQL Editor</strong>, incolla il codice sotto e premi <strong>RUN</strong>.</li>
            </ol>
            
            <div className="mt-4 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Codice SQL:</span>
                <button onClick={copySql} className="flex items-center gap-1.5 text-[10px] font-bold text-[#32964D] hover:text-white transition-colors">
                  {copied ? <><Check className="w-3 h-3" /> Copiato!</> : <><Copy className="w-3 h-3" /> Copia Codice</>}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-white/5 text-emerald-400">
                {sqlCode}
              </pre>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveDb} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 ml-1">
                URL Progetto
              </label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none"
                placeholder="https://xyz.supabase.co"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 ml-1">
                Chiave API (anon public)
              </label>
              <input 
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none"
                placeholder="eyJhbGci..."
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
              />
            </div>
          </div>
          
          <button type="submit" className="w-full md:w-auto bg-[#32964D] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#2b7e41] transition-all active:scale-95">
            Salva e Attiva Cloud
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-2.5 rounded-xl text-white">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Backup Manuale</h3>
            <p className="text-slate-500 text-sm">Scarica o carica i dati tramite file JSON.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => {
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `SalesManager_Backup_${new Date().toISOString().split('T')[0]}.json`);
            link.click();
          }} className="flex items-center justify-center gap-2 p-4 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-bold hover:bg-slate-200 transition-all">
            <Download className="w-4 h-4" /> Esporta JSON
          </button>

          <label className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm font-bold text-[#32964D] hover:bg-emerald-100 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> Importa JSON
            <input type="file" accept=".json" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => onImport(JSON.parse(event.target?.result as string));
              reader.readAsText(file);
            }} />
          </label>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#32964D] p-2.5 rounded-xl text-white">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Metodi Pagamento</h3>
          </div>
        </div>

        <form onSubmit={aggiungiMetodo} className="flex gap-2 mb-8">
          <input 
            type="text"
            placeholder="Nuovo metodo..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none font-bold"
            value={nuovoMetodo}
            onChange={e => setNuovoMetodo(e.target.value)}
          />
          <button type="submit" className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
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