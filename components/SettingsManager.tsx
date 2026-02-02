
import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Server, Mail, ShieldCheck, Globe, Key, User } from 'lucide-react';
import { EmailConfig } from '../types';

interface SettingsManagerProps {
  metodi: string[];
  onUpdate: (nuoviMetodi: string[]) => void;
  isAdmin: boolean;
  dbConfig: {url: string, key: string} | null;
  onDbConfigChange: (config: {url: string, key: string} | null) => void;
  emailConfig: EmailConfig;
  onEmailConfigChange: (config: EmailConfig) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ metodi, onUpdate, isAdmin, dbConfig, onDbConfigChange, emailConfig, onEmailConfigChange }) => {
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
      smtpServer: 'smtp.gmail.com',
      smtpPort: '465',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      
      {/* SEZIONE PERSONALE: CONFIGURAZIONE EMAIL (Per tutti) */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl"><Mail className="w-6 h-6 text-[#32964D]" /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">La tua Email (Google Workspace)</h3>
              <p className="text-xs text-slate-500 font-medium">Configura come invierai gli estratti conto agli agenti.</p>
            </div>
          </div>
          <button onClick={setGoogleDefaults} className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 uppercase">Parametri Gmail</button>
        </div>

        <form onSubmit={handleSaveEmail} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'local'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'local' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <User className="w-5 h-5" /><span className="text-xs font-black uppercase">Client Locale</span>
            </button>
            <button type="button" onClick={() => setTempEmailConfig({...tempEmailConfig, provider: 'smtp'})} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${tempEmailConfig.provider === 'smtp' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              <Globe className="w-5 h-5" /><span className="text-xs font-black uppercase">Invio Diretto (SMTP)</span>
            </button>
          </div>

          {tempEmailConfig.provider === 'smtp' && (
            <div className="space-y-4 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-4 mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-600 mt-1" />
                <p className="text-[10px] text-amber-700 leading-relaxed">Inserisci il tuo indirizzo email aziendale e la <b>"Password per le App"</b> generata dal tuo account Google. Questo permetterà all'app di inviare mail a tuo nome.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Il tuo Nome (In calce alla mail)</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.fromName || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, fromName: e.target.value})} placeholder="Es: Fabiana Rossi" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tua Email Aziendale</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.smtpUser || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtpUser: e.target.value})} placeholder="nome@lagicart.it" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password per le App Google</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold" value={tempEmailConfig.smtpPass || ''} onChange={e => setTempEmailConfig({...tempEmailConfig, smtpPass: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server SMTP</label>
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={tempEmailConfig.smtpServer || 'smtp.gmail.com'} disabled />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl active:scale-95 transition-all">Salva mie impostazioni Email</button>
        </form>
      </div>

      {/* SEZIONI ADMIN (Database e Metodi) */}
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

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><CreditCard className="w-6 h-6 text-slate-400" /> Metodi di Pagamento</h3>
            <div className="flex gap-2 mb-6">
              <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold uppercase" value={nuovoMetodo} onChange={e => setNuovoMetodo(e.target.value.toUpperCase())} placeholder="NUOVO METODO..." />
              <button onClick={() => { if(nuovoMetodo) onUpdate([...metodi, nuovoMetodo]); setNuovoMetodo(''); }} className="bg-[#32964D] text-white px-6 py-3 rounded-xl font-bold"><Plus /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metodi.map(m => (
                <div key={m} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <span className="font-bold text-slate-700 text-sm">{m}</span>
                  <button onClick={() => onUpdate(metodi.filter(x => x !== m))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsManager;
