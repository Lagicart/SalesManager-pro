
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { CheckCircle, Clock, Calendar, Search, Filter, RotateCcw, Pencil, Trash2, ChevronDown, Check, Download, Printer, User, Copy, ArrowUp, ArrowDown, X, Smartphone, Image as ImageIcon, Camera, MessageSquare, Send, UserCircle } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
  onCopy?: (text: string) => void;
  onUpdateNotizie?: (id: string, notizia: string, nuoveNotizie: boolean, mittente: string) => void;
  currentUserNome?: string;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onEdit, onDelete, onCopy, onUpdateNotizie, currentUserNome }) => {
  const [filters, setFilters] = useState({
    cliente: '', agente: '', data: '', status: 'all' as 'all' | 'incassato' | 'pendente'
  });

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedReceipt, setSelectedReceipt] = useState<Vendita | null>(null);
  const [activeChat, setActiveChat] = useState<Vendita | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat, activeChat?.notizie]);

  const filteredData = useMemo(() => {
    let list = [...vendite].filter(v => {
      const matchCliente = v.cliente.toLowerCase().includes(filters.cliente.toLowerCase());
      const matchAgente = v.agente.toLowerCase().includes(filters.agente.toLowerCase());
      const matchData = filters.data ? v.data.includes(filters.data) : true;
      const matchStatus = filters.status === 'all' ? true : filters.status === 'incassato' ? v.incassato : !v.incassato;
      return matchCliente && matchAgente && matchData && matchStatus;
    });
    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.data).getTime();
      const timeB = new Date(b.created_at || b.data).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [vendite, filters, sortDirection]);

  const handleOpenChat = (v: Vendita) => {
    setActiveChat(v);
    // Se ci sono nuove notizie e io non sono il mittente, le segno come lette aprendo il popup
    if (v.nuove_notizie && onUpdateNotizie) {
      onUpdateNotizie(v.id, v.notizie || '', false, v.ultimo_mittente || '');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat || !onUpdateNotizie || !currentUserNome) return;
    
    const timestamp = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const formattedMsg = `[${currentUserNome}|${timestamp}] ${newMessage.trim()}`;
    const updatedNotizie = activeChat.notizie ? `${activeChat.notizie}\n${formattedMsg}` : formattedMsg;
    
    onUpdateNotizie(activeChat.id, updatedNotizie, true, currentUserNome);
    setNewMessage('');
    setActiveChat({...activeChat, notizie: updatedNotizie, nuove_notizie: true, ultimo_mittente: currentUserNome});
  };

  return (
    <div className="space-y-4">
      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 no-print animate-in fade-in duration-300">
          <button onClick={() => setSelectedReceipt(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-emerald-50 text-center p-10 space-y-8">
            <div className="bg-[#32964D] p-6 -m-10 mb-6 flex flex-col items-center">
              <Camera className="w-10 h-10 text-white mb-2" />
              <h4 className="text-white text-xs font-black uppercase tracking-widest">Conferma Incasso Ufficiale</h4>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cliente</p>
              <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">{selectedReceipt.cliente}</h2>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Importo Totale</p>
              <h1 className="text-5xl font-black text-[#32964D] tracking-tighter">€ {selectedReceipt.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h1>
            </div>
            <div className="grid grid-cols-2 gap-6 text-left text-sm font-bold text-slate-800">
              <div><p className="text-slate-400 text-[9px] font-black uppercase">Data</p>{new Date(selectedReceipt.data).toLocaleDateString('it-IT')}</div>
              <div><p className="text-slate-400 text-[9px] font-black uppercase">Metodo</p>{selectedReceipt.metodoPagamento}</div>
              <div className="col-span-2 text-center pt-4 border-t border-slate-100 italic opacity-60">Agente: {selectedReceipt.agente}</div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6 no-print animate-in zoom-in-95">
          <div className="bg-[#f0f2f5] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] border border-white/20">
            <div className="bg-sky-600 p-6 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl"><MessageSquare className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate max-w-[200px]">{activeChat.cliente}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Chat Pratica attiva</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-black/10 p-2 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeChat.notizie ? activeChat.notizie.split('\n').filter(l => l.trim()).map((line, i) => {
                const parts = line.match(/\[(.*)\|(.*)\] (.*)/);
                if (!parts) return <div key={i} className="text-xs bg-white p-3 rounded-2xl shadow-sm border border-slate-100">{line}</div>;
                const [_, sender, time, text] = parts;
                const isMe = sender === currentUserNome;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-${isMe ? 'right' : 'left'}-2 duration-200`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative ${isMe ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                      {!isMe && <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-1">{sender}</p>}
                      <p className="text-sm font-medium leading-relaxed">{text}</p>
                      <p className={`text-[9px] mt-2 opacity-50 text-right font-bold ${isMe ? 'text-white' : 'text-slate-400'}`}>{time}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic space-y-2 opacity-30">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-sm">Nessuna notizia registrata.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Invia una notizia..."
                  className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-sky-600 text-white p-4 rounded-2xl shadow-lg hover:bg-sky-700 active:scale-90 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 filter-panel no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Cliente..." className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.cliente} onChange={e => setFilters({...filters, cliente: e.target.value})} />
          <input type="text" placeholder="Agente..." className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.agente} onChange={e => setFilters({...filters, agente: e.target.value})} />
          <input type="date" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.data} onChange={e => setFilters({...filters, data: e.target.value})} />
          <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}><option value="all">Tutti</option><option value="incassato">Incassati</option><option value="pendente">Pendenti</option></select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Chat</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stato</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right no-print">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => {
                // Logica Pallino Rosso: solo se ci sono nuove notizie e l'ultimo mittente NON sono io
                const hasNewForMe = v.nuove_notizie && v.ultimo_mittente !== currentUserNome;
                
                return (
                  <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${v.incassato ? 'bg-emerald-50/20' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{v.cliente}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenChat(v)}
                        className={`p-2.5 rounded-2xl transition-all relative ${hasNewForMe ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : (v.notizie ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500')}`}
                      >
                        <MessageSquare className={`w-5 h-5 ${hasNewForMe ? 'animate-pulse' : ''}`} />
                        {hasNewForMe && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full"></span>}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {v.incassato ? <span className="text-[#32964D] font-bold text-xs uppercase">OK</span> : <span className="text-orange-500 font-bold text-xs uppercase italic">Pendente</span>}
                    </td>
                    <td className="px-6 py-4 no-print text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedReceipt(v)} className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-[#32964D] rounded-xl transition-all" title="Genera Ricevuta"><Camera className="w-5 h-5" /></button>
                        <button onClick={() => onEdit(v)} className="p-2.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => onDelete(v.id)} className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
