
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, Mail, ShieldCheck, Globe, Key, User, LifeBuoy, AlertTriangle, CloudUpload, Download, FileJson } from 'lucide-react';
import { EmailConfig } from '../types';

interface SettingsManagerProps {
  metodi: string[];
  onUpdate: (nuoviMetodi: string[]) => void;
  isAdmin: boolean;
  dbConfig: {url: string, key: string} | null;
  onDbConfigChange: (config: {url: string, key: string} | null) => void;
  emailConfig: EmailConfig;
  onEmailConfigChange: (config: EmailConfig) => void;
  onEmergencyPush?: () => Promise<void>;
  onEmergencyExport?: () => void;
  onEmergencyImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, dbConfig, onDbConfigChange, emailConfig, onEmailConfigChange, onEmergencyPush, onEmergencyExport, onEmergencyImport }) => {
  const [nuovoMetodo, setNuovoMetodo] = useState('');
  const [tempUrl, setTempUrl] = useState(dbConfig?.url || '');
  const [tempKey, setTempKey] = useState(dbConfig?.key || '');
  const [tempEmailConfig, setTempEmailConfig] = useState<EmailConfig>(emailConfig);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    onEmailConfigChange(tempEmailConfig);
  };

  const setGoogleDefaults = () => {
    setTempEmailConfig({
      ...tempEmailConfig,
      provider: 'smtp',
      smtp_server: 'smtp.gmail.com',
      smtp_port: '465',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      
      {/* SEZIONE PERSONALE: CONFIGURAZIONE EMAIL */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl"><Mail className="w-6 h-6 text-[#32964D]" /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">La tua Email</h3>
              <p className="text-xs text-slate-500 font-medium">Configura i parametri per l'invio degli estratti conto.</p>
            </div>
          </div>
          <button onClick={setGoogleDefaults} className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 uppercase">Predefiniti Gmail</button>
        </div>

        <form onSubmit={handleSaveEmail} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'local'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'local' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <User className="w-5 h-5" /><span className="text-xs font-black uppercase">Client Locale</span>
            </button>
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'smtp'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'smtp' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <Globe className="w-5 h-5" /><span className="text-xs font-black uppercase">Direct SMTP (Google)</span>
            </button>
          </div>

          {tempEmailConfig.provider === 'smtp' && (
            <div className="space-y-4 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-4 mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-600 mt-1" />
                <p className="text-[10px] text-amber-700 leading-relaxed">Inserisci il tuo indirizzo email e la <b>"Password per le App"</b> di Google.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Il tuo Nome</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.from_name || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, from_name: e.target.value})} placeholder="Es: Fabiana Rossi" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tua Email</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.smtp_user || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtp_user: e.target.value})} placeholder="nome@esempio.it" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password per le App</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold" value={tempEmailConfig.smtp_pass || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtp_pass: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server SMTP</label>
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.smtp_server || 'smtp.gmail.com'} disabled />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl active:scale-95 transition-all">Salva mie impostazioni Email</button>
        </form>
      </div>

      {isAdmin && (
        <>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6"><Server className="w-6 h-6 text-[#32964D]" /><h3 className="text-xl font-bold text-slate-900">Database Cloud (Solo Admin)</h3></div>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="Supabase URL" />
              <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="API Key" />
              <button onClick={() => onDbConfigChange({url: tempUrl, key: tempKey})} className="w-full bg-[#32964D] text-white py-4 rounded-xl font-bold">Salva Connessione Cloud Aziendale</button>
            </div>
          </div>

          <div className="bg-rose-50 p-8 rounded-3xl border border-rose-200 shadow-lg animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-rose-100 p-3 rounded-2xl text-rose-600"><LifeBuoy className="w-8 h-8" /></div>
              <div>
                <h3 className="text-xl font-black text-rose-800 uppercase tracking-tight">CENTRO RECUPERO EMERGENZA</h3>
                <p className="text-xs text-rose-600 font-bold uppercase tracking-widest">Usa per recuperare dati persi</p>
              </div>
            </div>
            
            <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-rose-700 leading-relaxed font-medium">
                <p className="mb-2">Se vedi i nomi spariti, usa il file backup che hai scaricato:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li><b>Carica Backup</b>: Seleziona il file .json scaricato in precedenza.</li>
                  <li><b>Ripristina Cloud</b>: Carica i dati del file sul server online.</li>
                </ol>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={onEmergencyExport}
                className="bg-white text-rose-600 border-2 border-rose-200 font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-rose-50 transition-all uppercase tracking-widest text-[10px]"
              >
                <Download className="w-4 h-4" /> Esporta Backup (.json)
              </button>
              
              <label className="bg-rose-100 text-rose-800 border-2 border-rose-200 font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-rose-200 transition-all uppercase tracking-widest text-[10px] cursor-pointer">
                <FileJson className="w-4 h-4" /> Carica Backup (.json)
                <input type="file" accept=".json" onChange={onEmergencyImport} className="hidden" />
              </label>

              <button 
                onClick={onEmergencyPush}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]"
              >
                <CloudUpload className="w-4 h-4" /> Ripristina Cloud da qui
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsManager;
