import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { CheckCircle, Clock, Calendar, Search, Filter, RotateCcw, Pencil, Trash2, ChevronDown, Check, Download, Printer, User } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({
    cliente: '',
    agente: '',
    data: '',
    metodiSelezionati: [] as string[],
    status: 'all' as 'all' | 'incassato' | 'pendente',
    noteType: 'all' as 'all' | 'ok-marilena' | 'empty'
  });

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
    return vendite.filter(v => {
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
  }, [vendite, filters]);

  const toggleMetodo = (m: string) => {
    setFilters(prev => ({
      ...prev,
      metodiSelezionati: prev.metodiSelezionati.includes(m)
        ? prev.metodiSelezionati.filter(x => x !== m)
        : [...prev.metodiSelezionati, m]
    }));
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
  };

  const exportToExcel = (e: React.MouseEvent) => {
    e.preventDefault();
    const headers = ["Data", "Cliente", "Importo", "Metodo Pagamento", "Status", "Agente", "Note Amministrazione"];
    const rows = filteredData.map(v => [
      new Date(v.data).toLocaleDateString('it-IT'),
      v.cliente,
      v.importo.toFixed(2).replace('.', ','),
      v.metodoPagamento,
      v.incassato ? "INCASSATO" : "PENDENTE",
      v.agente,
      v.noteAmministrazione || ""
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_Vendite_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const hasActiveFilters = filters.cliente || filters.agente || filters.data || filters.metodiSelezionati.length > 0 || filters.status !== 'all' || filters.noteType !== 'all';

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          aside, header, footer, .no-print, button, .filter-panel, .fixed {
            display: none !important;
          }
          body, html, #root, main, section {
            overflow: visible !important;
            height: auto !important;
            width: auto !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          main { display: block !important; }
          .print-only { display: block !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; font-size: 10px !important; color: black !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="print-only mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Report Registro Vendite</h1>
        <div className="flex justify-between mt-2 text-sm font-bold text-slate-600">
          <span>Data Report: {new Date().toLocaleString('it-IT')}</span>
          <span>Totale Pratiche: {filteredData.length}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 filter-panel no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Filter className="w-4 h-4 text-[#32964D]" />
            <span>Filtri e Ricerca</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200">
              <Download className="w-3.5 h-3.5" /> Esporta CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#32964D] rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm">
              <Printer className="w-3.5 h-3.5" /> Stampa
            </button>
            <button onClick={resetFilters} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${hasActiveFilters ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'}`}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cerca Cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none"
              value={filters.cliente}
              onChange={e => setFilters({...filters, cliente: e.target.value})}
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cerca Agente..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none"
              value={filters.agente}
              onChange={e => setFilters({...filters, agente: e.target.value})}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#32964D]/20 outline-none"
              value={filters.data}
              onChange={e => setFilters({...filters, data: e.target.value})}
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              type="button"
              onClick={() => setIsMetodoDropdownOpen(!isMetodoDropdownOpen)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <span className="truncate">
                {filters.metodiSelezionati.length === 0 ? 'Tutti i Metodi' : `${filters.metodiSelezionati.length} Selezionati`}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMetodoDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMetodoDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                {metodiDisponibili.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMetodo(m)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${filters.metodiSelezionati.includes(m) ? 'bg-emerald-50 text-[#32964D] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {m}
                    {filters.metodiSelezionati.includes(m) && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium appearance-none cursor-pointer"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value as any})}
          >
            <option value="all">Tutti gli Stati</option>
            <option value="incassato">Solo Incassati</option>
            <option value="pendente">Solo Pendenti</option>
          </select>

          <select 
            className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-[#32964D] appearance-none cursor-pointer"
            value={filters.noteType}
            onChange={e => setFilters({...filters, noteType: e.target.value as any})}
          >
            <option value="all">Tutte le Note</option>
            <option value="ok-marilena">Solo OK MARILENA</option>
            <option value="empty">Senza Note</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
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
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{v.cliente}</td>
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
                          <button onClick={() => onEdit(v)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(v.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        v.incassato ? <CheckCircle className="w-5 h-5 text-[#32964D]" /> : <Clock className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-6 py-5 text-sm text-slate-500 uppercase tracking-widest font-bold">Totale Filtrato</td>
                  <td className="px-6 py-5 text-xl text-[#32964D]">
                    € {filteredData.reduce((acc, curr) => acc + curr.importo, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;