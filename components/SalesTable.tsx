
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { CheckCircle, Clock, Calendar, Search, Filter, RotateCcw, Pencil, Trash2, ChevronDown, Check, Download, Printer, User, Copy, ArrowUp, ArrowDown } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
  onCopy?: (text: string) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onEdit, onDelete, onCopy }) => {
  const [filters, setFilters] = useState({
    cliente: '',
    agente: '',
    data: '',
    metodiSelezionati: [] as string[],
    status: 'all' as 'all' | 'incassato' | 'pendente',
    noteType: 'all' as 'all' | 'ok-marilena' | 'empty'
  });

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

    // Ordinamento migliorato: usa created_at per distinguere pratiche della stessa giornata
    return list.sort((a, b) => {
      const dateA = new Date(a.created_at || a.data).getTime();
      const dateB = new Date(b.created_at || b.data).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
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

  const copyRowData = (v: Vendita) => {
    const text = `PRATICA: ${v.cliente}\nIMPORTO: € ${v.importo.toLocaleString('it-IT')}\nDATA: ${new Date(v.data).toLocaleDateString('it-IT')}\nMETODO: ${v.metodoPagamento}\nAGENTE: ${v.agente}`;
    onCopy?.(text);
  };

  const hasActiveFilters = filters.cliente || filters.agente || filters.data || filters.metodiSelezionati.length > 0 || filters.status !== 'all' || filters.noteType !== 'all';

  return (
    <div className="space-y-4">
      {/* Pannello Filtri ... (omesso per brevità, rimane lo stesso) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 filter-panel no-print">
        {/* ... contenuti filtri ... */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Filter className="w-4 h-4 text-[#32964D]" />
            <span>Filtri e Ricerca</span>
          </div>
          <button onClick={resetFilters} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${hasActiveFilters ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'}`}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filtri
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th 
                  className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors"
                  onClick={toggleSort}
                >
                  <div className="flex items-center gap-2">
                    Data 
                    <div className="flex flex-col">
                      {sortDirection === 'desc' ? (
                        <ArrowDown className="w-3 h-3 text-[#32964D]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#32964D]" />
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metodo</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right no-print">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${v.incassato ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{v.cliente}</span>
                      <button onClick={() => copyRowData(v)} className="no-print p-1.5 text-slate-300 hover:text-[#32964D] rounded-lg">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 italic">{v.agente}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold uppercase tracking-tight bg-slate-100 px-2 py-1 rounded-lg text-slate-600 border border-slate-200">{v.metodoPagamento}</span></td>
                  <td className="px-6 py-4">
                    {v.incassato ? (
                      <div className="flex items-center gap-1.5 text-[#32964D] font-bold text-xs"><CheckCircle className="w-3.5 h-3.5" /> Incassato</div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs"><Clock className="w-3.5 h-3.5" /> Pendente</div>
                    )}
                  </td>
                  <td className="px-6 py-4 no-print text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin ? (
                        <>
                          {!v.incassato && (
                            <button onClick={() => onIncasso(v.id)} className="bg-[#32964D] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2b7e41] shadow-sm">Incassa</button>
                          )}
                          <button onClick={() => onEdit(v)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(v.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        v.incassato ? <CheckCircle className="w-5 h-5 text-[#32964D]" /> : <Clock className="w-5 h-5 text-slate-300" />
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
