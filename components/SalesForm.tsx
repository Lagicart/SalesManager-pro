
import React, { useState, useEffect } from 'react';
import { Vendita, Agente } from '../types';
import { X, Send, UserCheck, Plus, Euro, Percent, CreditCard } from 'lucide-react';

interface SalesFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  userEmail: string;
  availableAgentList: Agente[];
  metodiDisponibili: string[];
  initialData?: Vendita;
  isAdmin?: boolean;
}

const SalesForm: React.FC<SalesFormProps> = ({ onClose, onSubmit, userEmail, availableAgentList, metodiDisponibili, initialData, isAdmin }) => {
  const [formData, setFormData] = useState({
    cliente: '',
    importo: 0,
    metodoPagamento: metodiDisponibili[0] || '',
    sconto: '',
    agente: '',
    incassato: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        cliente: initialData.cliente,
        importo: initialData.importo,
        metodoPagamento: initialData.metodoPagamento,
        sconto: initialData.sconto,
        agente: initialData.agente,
        incassato: initialData.incassato
      });
    } else if (availableAgentList.length === 1) {
      setFormData(f => ({ ...f, agente: availableAgentList[0].nome }));
    }
  }, [initialData, availableAgentList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente || formData.importo <= 0 || !formData.agente || !formData.metodoPagamento) return;
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
      <div className={`p-8 text-white ${initialData ? 'bg-amber-600' : 'bg-[#32964D]'} relative`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            {initialData ? 'Modifica Pratica' : 'Nuova Registrazione'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Inserisci i dati della vendita</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operatore</label>
            <input type="text" value={initialData ? initialData.operatoreEmail : userEmail} disabled className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-400 text-xs font-bold italic" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
            <input type="text" value={initialData ? new Date(initialData.data).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT')} disabled className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-400 text-xs font-bold" />
          </div>
        </div>

        <div className="space-y-1.5 p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 shadow-inner">
          <label className="flex items-center gap-2 text-[10px] font-black text-[#32964D] uppercase tracking-widest mb-2">
            <UserCheck className="w-4 h-4" /> Agente Incaricato
          </label>
          <select
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-emerald-500/10"
            value={formData.agente}
            onChange={e => setFormData(f => ({...f, agente: e.target.value}))}
          >
            <option value="" disabled>Seleziona Agente...</option>
            {availableAgentList.map(agent => (
              <option key={agent.id} value={agent.nome}>{agent.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
          <input required type="text" placeholder="Nome Cliente" className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black uppercase outline-none focus:border-[#32964D] transition-all" value={formData.cliente} onChange={e => setFormData(f => ({...f, cliente: e.target.value.toUpperCase()}))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Euro className="w-3 h-3" /> Importo</label>
            <input required type="number" step="0.01" className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-[#32964D]" value={formData.importo || ''} onChange={e => setFormData(f => ({...f, importo: parseFloat(e.target.value)}))} />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Percent className="w-3 h-3" /> Sconto</label>
            <input type="text" className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-[#32964D]" value={formData.sconto} onChange={e => setFormData(f => ({...f, sconto: e.target.value}))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><CreditCard className="w-3 h-3" /> Metodo Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {metodiDisponibili.map((m) => (
              <button
                key={m} type="button" onClick={() => setFormData(f => ({...f, metodoPagamento: m}))}
                className={`py-3 px-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.metodoPagamento === m ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && initialData && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
             <input type="checkbox" id="inc-check" className="w-5 h-5 accent-emerald-600 cursor-pointer" checked={formData.incassato} onChange={e => setFormData(f => ({...f, incassato: e.target.checked}))} />
             <label htmlFor="inc-check" className="text-xs font-black uppercase text-slate-600 cursor-pointer">Segna come Incassato</label>
          </div>
        )}

        <button type="submit" className={`w-full text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase tracking-[0.2em] text-xs ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#32964D] hover:bg-[#2b7e41]'}`}>
          {initialData ? <Send className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {initialData ? 'Salva Modifiche' : 'Registra Pratica'}
        </button>
      </form>
    </div>
  );
};

export default SalesForm;
