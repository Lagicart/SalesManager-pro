import React, { useState } from 'react';
import { X, ShoppingBag, Calendar, User, Euro, AlertCircle } from 'lucide-react';
import { Operatore } from '../types';

interface SiteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { cliente: string; importo: number; mese_riferimento: string }) => Promise<void>;
  currentUser: Operatore;
}

const SiteOrderModal: React.FC<SiteOrderModalProps> = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  
  const [cliente, setCliente] = useState('');
  const [importo, setImporto] = useState('');
  const [meseRiferimento, setMeseRiferimento] = useState(currentMonthStr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCliente = cliente.trim();
    const cleanImporto = parseFloat(importo.replace(',', '.'));

    if (!cleanCliente) {
      setError('Inserisci il nome del cliente');
      return;
    }

    if (isNaN(cleanImporto) || cleanImporto <= 0) {
      setError('Inserisci un importo valido superiore a zero');
      return;
    }

    if (!meseRiferimento) {
      setError('Seleziona il mese di riferimento');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        cliente: cleanCliente,
        importo: cleanImporto,
        mese_riferimento: meseRiferimento
      });
      // reset form on success
      setCliente('');
      setImporto('');
      setMeseRiferimento(currentMonthStr);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ambra/Arancio */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Nuovo Ordine Sito</h3>
              <p className="text-xs text-amber-100 font-medium">Registra un ordine e-commerce / web</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Cliente */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Nome Cliente <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Es. Mario Rossi / Azienda Srl"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Importo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Importo (€) <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Euro className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Mese Riferimento */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Mese di Riferimento <span className="text-amber-500">*</span>
              </label>
              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                Preimpostato mese corrente
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="month"
                required
                value={meseRiferimento}
                onChange={(e) => setMeseRiferimento(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Info Automatiche Badge */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Operatore: <strong className="text-slate-700">{currentUser.nome}</strong></span>
            </div>
            <span className="text-[11px] text-slate-400">Inserimento automatico</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Ordine Sito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteOrderModal;
