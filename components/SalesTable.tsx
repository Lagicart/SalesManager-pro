
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { CheckCircle, Clock, Calendar, Search, Filter, RotateCcw, Pencil, Trash2, ChevronDown, Check, Download, Printer, User, Copy, ArrowUp, ArrowDown, X, Smartphone, Image as ImageIcon, Camera, MessageSquare, Send, UserCircle, CheckCircle2 } from 'lucide-react';

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

  const resetFilters = () => {
    setFilters({ cliente: '', agente: '', data: '', status: 'all' });
  };

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
    if (v.nuove_notizie && v.ultimo_mittente !== currentUserNome && onUpdateNotizie) {
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
      {/* Receipt Modal (Anteprima) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 no-print animate-in fade-in duration-300">
          <button onClick={() => setSelectedReceipt(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-emerald-50 text-center p-10 space-y-8">
            <div className={`p-6 -m-10 mb-6 flex flex-col items-center ${selectedReceipt.incassato ? 'bg-[#32964D]' : 'bg-orange-500'}`}>
              <Camera className="w-10 h-10 text-white mb-2" />
              <h4 className="text-white text-xs font-black uppercase tracking-widest">
                {selectedReceipt.incassato ? 'Ricevuta Incasso Confermata' : 'Anteprima Pratica Pendente'}
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cliente</p>
              <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">{selectedReceipt.cliente}</h2>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Importo</p>
              <h1 className={`text-5xl font-black tracking-tighter ${selectedReceipt.incassato ? 'text-[#32964D]' : 'text-slate-900'}`}>
                € {selectedReceipt.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </h1>
            </div>
            {selectedReceipt.noteAmministrazione && (
              <div className="bg-emerald-900 text-white p-4 rounded-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Amministrazione</p>
                 <p className="font-bold">{selectedReceipt.noteAmministrazione}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#e5ddd5] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-white/20">
            <div className="bg-[#075e54] p-5 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-2xl"><MessageSquare className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate max-w-[180px] uppercase">{activeChat.cliente}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Chat Pratica</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-black/10 p-2 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {activeChat.notizie ? activeChat.notizie.split('\n').filter(l => l.trim()).map((line, i) => {
                const parts = line.match(/\[(.*)\|(.*)\] (.*)/);
                if (!parts) return <div key={i} className="text-xs bg-white/80 p-3 rounded-2xl shadow-sm border border-slate-200">{line}</div>;
                const [_, sender, time, text] = parts;
                const isMe = sender === currentUserNome;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm relative ${isMe ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                      {!isMe && <p className="text-[10px] font-black uppercase tracking-widest text-[#075e54] mb-1">{sender}</p>}
                      <p className="text-sm font-medium leading-relaxed break-words">{text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                        <span className="text-[9px] font-bold">{time}</span>
                        {isMe && <Check className="w-3 h-3 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-30">
                  <MessageSquare className="w-16 h-16" />
                  <p className="text-sm font-bold uppercase tracking-widest">Nessun messaggio</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-5 bg-[#f0f0f0] border-t border-slate-200">
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Scrivi un messaggio..."
                  className="flex-1 bg-white border-none rounded-full px-6 py-4 text-sm font-bold outline-none shadow-sm"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="bg-[#075e54] text-white p-4 rounded-full shadow-lg hover:bg-[#128c7e] transition-all"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 filter-panel no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Cliente..." className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.cliente} onChange={e => setFilters({...filters, cliente: e.target.value})} />
          <input type="text" placeholder="Agente..." className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.agente} onChange={e => setFilters({...filters, agente: e.target.value})} />
          <input type="date" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.data} onChange={e => setFilters({...filters, data: e.target.value})} />
          <div className="flex gap-2">
            <select className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}><option value="all">Tutti</option><option value="incassato">Incassati</option><option value="pendente">Pendenti</option></select>
            <button onClick={resetFilters} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><RotateCcw className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Chat</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Stato</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right no-print">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => {
                const hasUnread = v.nuove_notizie && v.ultimo_mittente !== currentUserNome;

                return (
                  <tr key={v.id} className={`hover:bg-slate-50/80 transition-colors ${v.incassato ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 truncate max-w-[200px] uppercase leading-tight">{v.cliente}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{v.agente}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenChat(v)}
                        className={`p-3 rounded-2xl transition-all relative ${hasUnread ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : (v.notizie ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500')}`}
                      >
                        <MessageSquare className={`w-5 h-5 ${hasUnread ? 'animate-pulse' : ''}`} />
                        {hasUnread && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black">!</span>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {v.incassato ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Incassato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200 animate-pulse">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-black ${v.incassato ? 'text-emerald-700' : 'text-slate-900'}`}>€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-4 no-print text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!v.incassato && (
                          <button 
                            onClick={() => onIncasso(v.id)} 
                            className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100"
                            title="Conferma Incasso"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => setSelectedReceipt(v)} className="p-2.5 text-slate-300 hover:text-[#32964D] hover:bg-slate-100 rounded-xl transition-all" title="Anteprima Ricevuta"><Camera className="w-5 h-5" /></button>
                        <button onClick={() => onEdit(v)} className="p-2.5 text-slate-300 hover:text-amber-500 hover:bg-slate-100 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => onDelete(v.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
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
