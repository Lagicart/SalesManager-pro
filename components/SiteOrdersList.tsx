import React, { useState, useMemo } from 'react';
import { OrdineSito, Operatore, StoricoModificaOrdineSito } from '../types';
import { 
  ShoppingBag, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Pencil, 
  History, 
  Euro, 
  User, 
  Clock, 
  AlertCircle, 
  X, 
  Check, 
  FileText,
  TrendingUp,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface SiteOrdersListProps {
  ordini: OrdineSito[];
  currentUser: Operatore;
  onUpdateOrdine: (ordine: OrdineSito) => Promise<void>;
  onOpenNewModal: () => void;
}

const SiteOrdersList: React.FC<SiteOrdersListProps> = ({
  ordini,
  currentUser,
  onUpdateOrdine,
  onOpenNewModal
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State for Edit Amount Modal
  const [editingOrder, setEditingOrder] = useState<OrdineSito | null>(null);
  const [newAmount, setNewAmount] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // State for History Modal
  const [viewHistoryOrder, setViewHistoryOrder] = useState<OrdineSito | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  const formattedSelectedMonth = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const str = format(date, 'MMMM yyyy', { locale: it });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Filter orders by month and search term
  const filteredOrdini = useMemo(() => {
    return ordini
      .filter(o => {
        const matchMonth = o.mese_riferimento === selectedMonth;
        const matchSearch = searchTerm.trim() === '' || 
          o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.operatore_nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchMonth && matchSearch;
      })
      .sort((a, b) => new Date(b.data_inserimento).getTime() - new Date(a.data_inserimento).getTime());
  }, [ordini, selectedMonth, searchTerm]);

  // Calculations for summary box
  const stats = useMemo(() => {
    const totalAmount = filteredOrdini.reduce((sum, o) => sum + Number(o.importo || 0), 0);
    const totalCount = filteredOrdini.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    return { totalAmount, totalCount, averageAmount };
  }, [filteredOrdini]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: it });
    } catch {
      return dateStr;
    }
  };

  // Open Edit Amount
  const startEditAmount = (ordine: OrdineSito) => {
    setEditingOrder(ordine);
    setNewAmount(ordine.importo.toString());
    setEditError('');
  };

  // Save Edit Amount with history tracking
  const handleSaveAmount = async () => {
    if (!editingOrder) return;
    const parsed = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setEditError('Inserisci un importo valido superiore a 0');
      return;
    }

    if (parsed === editingOrder.importo) {
      setEditingOrder(null);
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    try {
      const now = new Date().toISOString();
      const nuovaModifica: StoricoModificaOrdineSito = {
        data: now,
        operatore: currentUser.nome,
        vecchio_importo: editingOrder.importo,
        nuovo_importo: parsed
      };

      const updatedHistory = [...(editingOrder.storico_modifiche || []), nuovaModifica];
      const importoOriginale = editingOrder.importo_originale !== undefined 
        ? editingOrder.importo_originale 
        : editingOrder.importo;

      const updatedOrder: OrdineSito = {
        ...editingOrder,
        importo: parsed,
        importo_originale: importoOriginale,
        storico_modifiche: updatedHistory,
        updated_at: now
      };

      await onUpdateOrdine(updatedOrder);
      setEditingOrder(null);
    } catch (e: any) {
      setEditError(e?.message || "Errore durante l'aggiornamento dell'importo");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Ordini Sito</h3>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  E-Commerce / Web
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Gestione autonoma ordini per mese di riferimento con tracciamento modifiche
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewModal}
            className="self-start md:self-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Nuovo Ordine Sito
          </button>
        </div>

        {/* Toolbar: Month Navigation & Search */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Month Controller */}
          <div className="md:col-span-7 flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white text-slate-600 rounded-xl transition-colors"
                title="Mese Precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-black text-slate-800 tracking-tight">
                  {formattedSelectedMonth}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white text-slate-600 rounded-xl transition-colors"
                title="Mese Successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Month Selector */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
              title="Seleziona mese specifico"
            />

            {selectedMonth !== currentMonthStr && (
              <button
                onClick={handleCurrentMonth}
                className="px-3 py-2 text-xs font-black uppercase text-amber-600 hover:bg-amber-50 rounded-2xl transition-colors border border-amber-200"
              >
                Mese Corrente
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cerca per cliente o operatore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">2. Importo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Data Inserimento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Operatore</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrdini.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
                    <p className="text-sm font-bold text-slate-600">Nessun ordine sito trovato per {formattedSelectedMonth}</p>
                    <p className="text-xs text-slate-400 mt-1">Usa il pulsante in alto per aggiungere il primo ordine</p>
                  </td>
                </tr>
              ) : (
                filteredOrdini.map((ord) => {
                  const hasModifications = (ord.storico_modifiche && ord.storico_modifiche.length > 0);
                  const lastMod = hasModifications ? ord.storico_modifiche![ord.storico_modifiche!.length - 1] : null;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Cliente */}
                      <td className="px-6 py-4">
                        <div className="font-black text-sm text-slate-900">{ord.cliente}</div>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Mese rif: {ord.mese_riferimento}</span>
                        </div>
                      </td>

                      {/* 2. Importo */}
                      <td className="px-6 py-4 text-right">
                        <div className="text-base font-black text-slate-900 tracking-tight">
                          € {Number(ord.importo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {hasModifications && (
                          <button
                            onClick={() => setViewHistoryOrder(ord)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 mt-1 transition-colors"
                            title="Clicca per visualizzare lo storico delle modifiche"
                          >
                            <History className="w-3 h-3 text-amber-600" />
                            <span>Modificato (orig. € {Number(ord.importo_originale).toLocaleString('it-IT', { minimumFractionDigits: 2 })})</span>
                          </button>
                        )}
                      </td>

                      {/* 3. Data Inserimento */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(ord.data_inserimento)}</span>
                        </div>
                      </td>

                      {/* 4. Operatore */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black uppercase border border-slate-200">
                            {ord.operatore_nome.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{ord.operatore_nome}</div>
                            {ord.operatore_email && (
                              <div className="text-[10px] text-slate-400">{ord.operatore_email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Azioni */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditAmount(ord)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-200"
                            title="Modifica Importo (tracciato)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {hasModifications && (
                            <button
                              onClick={() => setViewHistoryOrder(ord)}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                              title="Storico Modifiche"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Box Riassuntivo a Fondo Pagina (Richiesto dal prompt) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-7 md:p-8 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Riepilogo {formattedSelectedMonth}
              </span>
            </div>
            <h4 className="text-lg font-black tracking-tight text-slate-100">
              Totale Ordini del Mese Selezionato
            </h4>
            <p className="text-xs text-slate-400">
              Calcolato in tempo reale su tutti gli ordini registrati per questo periodo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Box Conteggio */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Ordini Totali
              </span>
              <span className="text-2xl font-black text-white">
                {stats.totalCount}
              </span>
            </div>

            {/* Box Media */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Media per Ordine
              </span>
              <span className="text-2xl font-black text-slate-200">
                € {stats.averageAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Box Totale Importo */}
            <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                Totale Importo
              </span>
              <span className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
                € {stats.totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Modifica Importo (Con Tracciamento) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black">Modifica Importo</h4>
                  <p className="text-xs text-slate-400">Cliente: {editingOrder.cliente}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Informazione tracciamento */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Tracciamento Modifiche Attivo
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  L&apos;importo precedente (€ {Number(editingOrder.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}) verrà registrato nello storico con la data e il nome dell&apos;operatore ({currentUser.nome}).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Nuovo Importo (€)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Euro className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveAmount}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingEdit ? 'Salvataggio...' : (
                    <>
                      <Check className="w-4 h-4" />
                      Conferma Modifica
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Visualizzazione Storico Modifiche */}
      {viewHistoryOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black">Storico Modifiche</h4>
                  <p className="text-xs text-slate-400">Cliente: {viewHistoryOrder.cliente}</p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Importo Originale di Creazione:</span>
                <span className="font-black text-slate-800">
                  € {Number(viewHistoryOrder.importo_originale ?? viewHistoryOrder.importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Elenco Revisioni
                </span>
                {(!viewHistoryOrder.storico_modifiche || viewHistoryOrder.storico_modifiche.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Nessuna modifica registrata.</p>
                ) : (
                  viewHistoryOrder.storico_modifiche.map((mod, idx) => (
                    <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-amber-800">
                          <User className="w-3.5 h-3.5" />
                          Modificato da: {mod.operatore}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {formatDate(mod.data)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500 line-through">
                          € {Number(mod.vecchio_importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400">➔</span>
                        <span className="font-black text-amber-700">
                          € {Number(mod.nuovo_importo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewHistoryOrder(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteOrdersList;
