
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, Mail, ShieldCheck, Globe, Key, User, LifeBuoy, AlertTriangle, CloudUpload, Download, FileJson, ShieldAlert } from 'lucide-react';
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
      
      {/* SEZIONE SICUREZZA SEMPRE VISIBILE IN ALTO */}
      <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
          <div className="bg-rose-600 p-4 rounded-2xl text-white shadow-lg shadow-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Strumenti di Protezione Dati</h3>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-widest opacity-70">Usa questi tasti per mettere al sicuro il tuo lavoro su questo PC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={onEmergencyExport}
            className="bg-white text-rose-700 border-2 border-rose-200 font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-md hover:bg-rose-100 hover:border-rose-300 transition-all uppercase tracking-widest text-xs"
          >
            <Download className="w-5 h-5" /> Scarica Backup sul PC (.json)
          </button>
          
          <label className="bg-rose-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs cursor-pointer active:scale-95">
            <FileJson className="w-5 h-5" /> Carica Backup da PC (.json)
            <input type="file" accept=".json" onChange={onEmergencyImport} className="hidden" />
          </label>
        </div>
        
        <p className="mt-6 text-[10px] text-rose-800/50 font-black uppercase text-center tracking-[0.2em]">
          Si consiglia di scaricare un backup ogni sera prima di chiudere
        </p>
      </div>

      {/* SEZIONE PERSONALE: CONFIGURAZIONE EMAIL */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl"><Mail className="w-6 h-6 text-[#32964D]" /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Configurazione Invio Email</h3>
              <p className="text-xs text-slate-500 font-medium">Imposta come vuoi inviare gli estratti conto ai tuoi agenti.</p>
            </div>
          </div>
          <button onClick={setGoogleDefaults} className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 uppercase">Parametri Gmail</button>
        </div>

        <form onSubmit={handleSaveEmail} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'local'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'local' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <User className="w-5 h-5" /><span className="text-xs font-black uppercase">App Mail (Outlook/Mail)</span>
            </button>
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'smtp'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'smtp' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <Globe className="w-5 h-5" /><span className="text-xs font-black uppercase">Direct SMTP (Consigliato)</span>
            </button>
          </div>

          {tempEmailConfig.provider === 'smtp' && (
            <div className="space-y-4 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tuo Nome (Mittente)</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.from_name || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, from_name: e.target.value})} placeholder="Es: Mario Rossi" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Username)</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.smtp_user || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtp_user: e.target.value})} placeholder="nome@gmail.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password per le App</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold" value={tempEmailConfig.smtp_pass || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtp_pass: e.target.value})} placeholder="16 caratteri" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server SMTP</label>
                   <input className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400" value={tempEmailConfig.smtp_server || 'smtp.gmail.com'} disabled />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">Salva mie impostazioni Email</button>
        </form>
      </div>

      {isAdmin && (
        <>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6"><Server className="w-6 h-6 text-[#32964D]" /><h3 className="text-xl font-bold text-slate-900">Database Cloud Aziendale</h3></div>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="Supabase URL" />
              <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="API Key" />
              <button onClick={() => onDbConfigChange({url: tempUrl, key: tempKey})} className="w-full bg-[#32964D] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Collega l'ufficio al Cloud</button>
            </div>
          </div>

          <div className="bg-emerald-900 p-8 rounded-3xl border border-emerald-800 shadow-xl">
             <div className="flex items-center gap-4 mb-6 text-white">
                <CloudUpload className="w-8 h-8 text-emerald-400" />
                <h3 className="text-xl font-black uppercase tracking-tight">Sincronizzazione Forzata</h3>
             </div>
             <p className="text-emerald-100/70 text-xs font-medium mb-6 leading-relaxed">
                Usa questo pulsante solo se sei sicuro che i dati che vedi su questo PC siano quelli corretti e vuoi "sovrascrivere" il cloud per tutti gli altri utenti.
             </p>
             <button 
                onClick={onEmergencyPush}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all uppercase tracking-widest text-xs"
              >
                Invia dati di questo PC al Cloud
              </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsManager;
