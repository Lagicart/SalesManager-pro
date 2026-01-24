
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { CheckCircle, Clock, Calendar, Search, Filter, RotateCcw, Pencil, Trash2, ChevronDown, Check, Download, Printer, User, Copy, ArrowUp, ArrowDown, X, Smartphone, Image as ImageIcon, Camera, MessageSquare, Send } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
  onCopy?: (text: string) => void;
  onUpdateNotizie?: (id: string, notizia: string) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onEdit, onDelete, onCopy, onUpdateNotizie }) => {
  const [filters, setFilters] = useState({
    cliente: '',
    agente: '',
    data: '',
    metodiSelezionati: [] as string[],
    status: 'all' as 'all' | 'incassato' | 'pendente',
    noteType: 'all' as 'all' | 'ok-marilena' | 'empty'
  });

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedReceipt, setSelectedReceipt] = useState<Vendita | null>(null);
  const [activeNotePratica, setActiveNotePratica] = useState<Vendita | null>(null);
  const [tempNotizia, setTempNotizia] = useState('');

  const [isMetodoDropdownOpen, setIsMetodoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMetodoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    let list = [...vendite].filter(v => {
      const matchCliente = v.cliente.toLowerCase().includes(filters.cliente.toLowerCase());
      const matchAgente = v.agente.toLowerCase().includes(filters.agente.toLowerCase());
      const matchData = filters.data ? v.data.includes(filters.data) : true;
      const matchMetodo = filters.metodiSelezionati.length > 0 
        ? filters.metodiSelezionati.includes(v.metodoPagamento) 
        : true;
      const matchStatus = filters.status === 'all' 
        ? true 
        : filters.status === 'incassato' ? v.incassato : !v.incassato;
      
      let matchNote = true;
      if (filters.noteType === 'ok-marilena') {
        matchNote = v.noteAmministrazione?.includes('OK MARILENA');
      } else if (filters.noteType === 'empty') {
        matchNote = !v.noteAmministrazione || v.noteAmministrazione.trim() === '';
      }
      
      return matchCliente && matchAgente && matchData && matchMetodo && matchStatus && matchNote;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.data).getTime();
      const timeB = new Date(b.created_at || b.data).getTime();
      if (timeA === timeB) {
        return sortDirection === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      }
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [vendite, filters, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setFilters({
      cliente: '',
      agente: '',
      data: '',
      metodiSelezionati: [],
      status: 'all',
      noteType: 'all'
    });
    setSortDirection('desc');
  };

  const handleSaveNotizia = () => {
    if (activeNotePratica && onUpdateNotizie) {
      onUpdateNotizie(activeNotePratica.id, tempNotizia);
      setActiveNotePratica(null);
    }
  };

  const hasActiveFilters = filters.cliente || filters.agente || filters.data || filters.metodiSelezionati.length > 0 || filters.status !== 'all' || filters.noteType !== 'all';

  return (
    <div className="space-y-4">
      {/* Receipt Modal (Per la foto) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 no-print animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 flex gap-4">
             <button 
              onClick={() => {
                const text = `PRATICA: ${selectedReceipt.cliente}\nIMPORTO: € ${selectedReceipt.importo.toLocaleString('it-IT')}\nDATA: ${new Date(selectedReceipt.data).toLocaleDateString('it-IT')}\nMETODO: ${selectedReceipt.metodoPagamento}\nAGENTE: ${selectedReceipt.agente}`;
                onCopy?.(text);
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"
              title="Copia Testo"
            >
              <Copy className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-[0_0_100px_rgba(50,150,77,0.3)] overflow-hidden border-[12px] border-emerald-50 transform scale-100 md:scale-110">
            <div className="bg-[#32964D] p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 text-[#32964D]" />
              </div>
              <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">Conferma Incasso Ufficiale</h4>
              <p className="text-emerald-100/70 text-[10px] font-bold mt-1">SISTEMA DI GESTIONE VENDITE</p>
            </div>

            <div className="p-10 space-y-8 text-center">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cliente</p>
                <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">{selectedReceipt.cliente}</h2>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Importo Totale</p>
                <h1 className="text-5xl font-black text-[#32964D] tracking-tighter">€ {selectedReceipt.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h1>
              </div>

              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Data Operazione</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#32964D]" /> {new Date(selectedReceipt.data).toLocaleDateString('it-IT')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Metodo</p>
                  <p className="text-sm font-bold text-slate-800">{selectedReceipt.metodoPagamento}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Agente</p>
                  <p className="text-sm font-bold text-slate-800 italic">{selectedReceipt.agente}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Stato</p>
                  <div className={`text-xs font-black uppercase flex items-center gap-1.5 ${selectedReceipt.incassato ? 'text-[#32964D]' : 'text-orange-500'}`}>
                    {selectedReceipt.incassato ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {selectedReceipt.incassato ? 'CONFERMATO' : 'PENDENTE'}
                  </div>
                </div>
              </div>

              {selectedReceipt.noteAmministrazione && (
                <div className="pt-6 border-t border-dashed border-slate-200">
                  <div className="bg-emerald-900 text-white px-6 py-4 rounded-2xl shadow-xl transform -rotate-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Nota Ufficiale</p>
                    <p className="text-lg font-black tracking-widest uppercase">{selectedReceipt.noteAmministrazione}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <p className="text-[9px] text-slate-300 font-medium italic">Doc. id: {selectedReceipt.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notizie/Note Pratica */}
      {activeNotePratica && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6 no-print animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-sky-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold">Notizie sulla Pratica</h3>
              </div>
              <button onClick={() => setActiveNotePratica(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dettagli per: {activeNotePratica.cliente}</p>
              <textarea 
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-medium"
                placeholder="Inserisci qui notizie, solleciti o particolarità su questo pagamento..."
                value={tempNotizia}
                onChange={e => setTempNotizia(e.target.value)}
              />
              <button 
                onClick={handleSaveNotizia}
                className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" /> Aggiorna Notizia
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 filter-panel no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Filter className="w-4 h-4 text-[#32964D]" />
            <span>Filtri e Ricerca</span>
          </div>
          <button onClick={resetFilters} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${hasActiveFilters ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'}`}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <input 
            type="text" placeholder="Cliente..."
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#32964D]/20"
            value={filters.cliente}
            onChange={e => setFilters({...filters, cliente: e.target.value})}
          />
          <input 
            type="text" placeholder="Agente..."
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#32964D]/20"
            value={filters.agente}
            onChange={e => setFilters({...filters, agente: e.target.value})}
          />
          <input 
            type="date"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#32964D]/20"
            value={filters.data}
            onChange={e => setFilters({...filters, data: e.target.value})}
          />
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value as any})}
          >
            <option value="all">Tutti</option>
            <option value="incassato">Incassati</option>
            <option value="pendente">Pendenti</option>
          </select>
          <select 
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-[#32964D] outline-none"
            value={filters.noteType}
            onChange={e => setFilters({...filters, noteType: e.target.value as any})}
          >
            <option value="all">Note Admin</option>
            <option value="ok-marilena">Solo OK MARILENA</option>
            <option value="empty">Senza Note</option>
          </select>
          <button 
            onClick={() => setIsMetodoDropdownOpen(!isMetodoDropdownOpen)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium flex justify-between items-center"
          >
            Metodo <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer" onClick={toggleSort}>
                  Data {sortDirection === 'desc' ? '↓' : '↑'}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Notizie</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right no-print">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${v.incassato ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{v.cliente}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 italic">{v.agente}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => { setActiveNotePratica(v); setTempNotizia(v.notizie || ''); }}
                      className={`p-2 rounded-xl transition-all ${v.notizie ? 'bg-sky-100 text-sky-600' : 'text-slate-300 hover:text-slate-500'}`}
                      title={v.notizie || 'Aggiungi notizie sulla pratica'}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {v.incassato ? (
                      <span className="text-[#32964D] font-bold text-xs uppercase">OK</span>
                    ) : (
                      <span className="text-orange-500 font-bold text-xs uppercase italic">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 no-print text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setSelectedReceipt(v)} 
                        className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-[#32964D] rounded-xl transition-all"
                        title="Ricevuta per foto"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onEdit(v)} 
                        className="p-2.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => onDelete(v.id)} 
                          className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
