
import React, { useState, useEffect } from 'react';
import { Vendita, Agente } from '../types';
import { X, Send, UserCheck, ChevronDown, FileText, Plus, MessageSquare } from 'lucide-react';

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
    noteAmministrazione: '',
    notizie: '',
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
        noteAmministrazione: initialData.noteAmministrazione || '',
        notizie: initialData.notizie || '',
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
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
      <div className={`p-8 text-white ${initialData ? 'bg-amber-600' : 'bg-[#32964D]'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold tracking-tight">
            {initialData ? 'Modifica Pratica' : 'Nuova Registrazione'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-white/70 text-sm">Inserisci i dati della vendita e le eventuali comunicazioni.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operatore</label>
            <input type="text" value={initialData ? initialData.operatoreEmail : userEmail} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-400 text-xs italic" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data</label>
            <input type="text" value={initialData ? new Date(initialData.data).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT')} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-400 text-xs" />
          </div>
        </div>

        <div className="space-y-1.5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <label className="flex items-center gap-2 text-xs font-bold text-[#32964D] uppercase tracking-wider mb-2"><UserCheck className="w-4 h-4" /> Agente Incaricato</label>
          <select
            required
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
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
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Cliente</label>
          <input required type="text" placeholder="Nome Cliente" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold" value={formData.cliente} onChange={e => setFormData(f => ({...f, cliente: e.target.value.toUpperCase()}))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Importo (€)</label>
            <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold" value={formData.importo || ''} onChange={e => setFormData(f => ({...f, importo: parseFloat(e.target.value)}))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Sconto</label>
            <input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm" value={formData.sconto} onChange={e => setFormData(f => ({...f, sconto: e.target.value}))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Metodo Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {metodiDisponibili.map((m) => (
              <button
                key={m} type="button" onClick={() => setFormData(f => ({...f, metodoPagamento: m}))}
                className={`py-2 px-3 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${formData.metodoPagamento === m ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" /> Notizie / Note Pratica
          </label>
          <textarea 
            placeholder="Aggiungi notizie sulla pratica (visibili a tutti)..."
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm h-20 outline-none focus:border-sky-500 transition-all"
            value={formData.notizie}
            onChange={e => setFormData(f => ({...f, notizie: e.target.value}))}
          />
        </div>

        {isAdmin && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#32964D]" /> Nota Amministrazione
              </label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="inc-check" checked={formData.incassato} onChange={e => setFormData(f => ({...f, incassato: e.target.checked}))} />
                <label htmlFor="inc-check" className="text-xs font-bold text-slate-600">Incassato</label>
              </div>
            </div>
            <textarea placeholder="OK MARILENA" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm italic h-16 outline-none" value={formData.noteAmministrazione} onChange={e => setFormData(f => ({...f, noteAmministrazione: e.target.value}))} />
          </div>
        )}

        <button type="submit" className={`w-full text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#32964D] hover:bg-[#2b7e41] shadow-lg'}`}>
          {initialData ? <Send className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {initialData ? 'Salva Modifiche' : 'Registra Pratica'}
        </button>
      </form>
    </div>
  );
};

export default SalesForm;
