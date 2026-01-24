
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { Clock, X, Printer, Camera, MessageSquare, Send, CheckCircle2, UserCheck, Smartphone, ShieldAlert, Check, Pencil, Trash2, RotateCcw } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
  onUpdateNotizie?: (id: string, notizia: string, nuoveNotizie: boolean, mittente: string) => void;
  currentUserNome?: string;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onEdit, onDelete, onUpdateNotizie, currentUserNome }) => {
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

  const calculateDaysPending = (dateStr: string) => {
    const start = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
      {/* Receipt Modal (OTTIMIZZATA PER CELLULARE E SCREENSHOT) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 no-print animate-in fade-in duration-300">
          <button onClick={() => setSelectedReceipt(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all"><X className="w-8 h-8" /></button>
          
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden border-[16px] border-emerald-50/50 relative shadow-emerald-900/40">
            {/* Header Ricevuta */}
            <div className={`p-10 text-center ${selectedReceipt.incassato ? 'bg-[#32964D]' : 'bg-amber-600'}`}>
              <div className="bg-white/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                {selectedReceipt.incassato ? <CheckCircle2 className="w-12 h-12 text-white" /> : <Clock className="w-12 h-12 text-white" />}
              </div>
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">
                Documento di Vendita
              </h4>
              <h2 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">
                {selectedReceipt.incassato ? 'Transazione Inviata' : 'Registrazione Pendente'}
              </h2>
            </div>

            {/* Corpo Ricevuta */}
            <div className="p-10 space-y-8">
              <div className="space-y-1.5 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nominativo Cliente</p>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight break-words">{selectedReceipt.cliente}</h3>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 text-center border-2 border-slate-100/50 shadow-inner">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Valore Pratica</p>
                <h1 className={`text-5xl font-black tracking-tighter ${selectedReceipt.incassato ? 'text-[#32964D]' : 'text-slate-900'}`}>
                  € {selectedReceipt.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </h1>
                {selectedReceipt.sconto && (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
                    Sconto: {selectedReceipt.sconto}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Data</p>
                  <p className="text-xs font-black text-slate-800">{new Date(selectedReceipt.data).toLocaleDateString('it-IT')}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Metodo</p>
                  <p className="text-xs font-black text-slate-800 uppercase">{selectedReceipt.metodoPagamento}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Agente</p>
                  <p className="text-xs font-black text-slate-800 uppercase leading-tight">{selectedReceipt.agente}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pendenza</p>
                  <p className={`text-xs font-black uppercase ${selectedReceipt.incassato ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedReceipt.incassato ? 'Chiusa' : `${calculateDaysPending(selectedReceipt.data)} Giorni`}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-slate-50 text-center space-y-3">
                 <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-100 rounded-2xl">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ref: {selectedReceipt.id}</span>
                 </div>
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] block">Sincronizzato Cloud ● SalesManager</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#e5ddd5] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-white/20">
            <div className="bg-[#075e54] p-6 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><MessageSquare className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-lg leading-tight truncate max-w-[180px] uppercase tracking-tighter">{activeChat.cliente}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Comunicazioni Pratica</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-black/10 p-2 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeChat.notizie ? activeChat.notizie.split('\n').filter(l => l.trim()).map((line, i) => {
                const parts = line.match(/\[(.*)\|(.*)\] (.*)/);
                if (!parts) return <div key={i} className="text-xs bg-white/90 p-4 rounded-2xl shadow-sm border border-slate-200 font-bold">{line}</div>;
                const [_, sender, time, text] = parts;
                const isMe = sender === currentUserNome;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm relative ${isMe ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                      {!isMe && <p className="text-[10px] font-black uppercase tracking-widest text-[#075e54] mb-1.5">{sender}</p>}
                      <p className="text-sm font-bold leading-relaxed break-words">{text}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-2 opacity-50">
                        <span className="text-[10px] font-black">{time}</span>
                        {isMe && <Check className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-30">
                  <MessageSquare className="w-16 h-16" />
                  <p className="text-sm font-black uppercase tracking-widest text-center">Nessun messaggio<br/>per questa pratica</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 bg-[#f0f0f0] border-t border-slate-200">
              <div className="flex gap-3">
                <input 
                  type="text" placeholder="Scrivi un messaggio..."
                  className="flex-1 bg-white border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none shadow-sm"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="bg-[#075e54] text-white p-4 rounded-2xl shadow-lg hover:bg-[#128c7e] transition-all"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 filter-panel no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Cliente..." className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-[#32964D]" value={filters.cliente} onChange={e => setFilters({...filters, cliente: e.target.value})} />
          <input type="text" placeholder="Agente..." className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-[#32964D]" value={filters.agente} onChange={e => setFilters({...filters, agente: e.target.value})} />
          <input type="date" className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-[#32964D]" value={filters.data} onChange={e => setFilters({...filters, data: e.target.value})} />
          <div className="flex gap-2">
            <select className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-tight outline-none" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}><option value="all">Tutti</option><option value="incassato">Incassati</option><option value="pendente">Pendenti</option></select>
            <button onClick={resetFilters} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"><RotateCcw className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente / Agente</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Chat</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Stato / GG</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Importo</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right no-print">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => {
                const hasUnread = v.nuove_notizie && v.ultimo_mittente !== currentUserNome;
                const days = calculateDaysPending(v.data);

                return (
                  <tr key={v.id} className={`hover:bg-slate-50/80 transition-all ${v.incassato ? 'bg-emerald-50/20' : ''}`}>
                    <td className="px-6 py-5 text-xs font-black text-slate-400">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 truncate max-w-[200px] uppercase leading-none tracking-tighter text-sm mb-1">{v.cliente}</div>
                      <div className="text-[10px] font-black text-[#32964D] uppercase tracking-widest opacity-70">{v.agente}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => handleOpenChat(v)}
                        className={`p-3 rounded-2xl transition-all relative ${hasUnread ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : (v.notizie ? 'bg-slate-100 text-slate-600' : 'text-slate-100 text-slate-200 hover:text-slate-400')}`}
                      >
                        <MessageSquare className={`w-5 h-5 ${hasUnread ? 'animate-pulse' : ''}`} />
                        {hasUnread && <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white">!</span>}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {v.incassato ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Incassato
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 ${days > 7 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-orange-100 text-orange-700 border-orange-200'} rounded-full text-[10px] font-black uppercase tracking-widest border animate-pulse`}>
                            <Clock className="w-3.5 h-3.5" /> Pendente
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${days > 15 ? 'text-rose-600' : 'text-slate-400'}`}>Da {days} giorni</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className={`text-base font-black ${v.incassato ? 'text-emerald-700' : 'text-slate-900'}`}>€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-5 no-print text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!v.incassato && (
                          <button 
                            onClick={() => onIncasso(v.id)} 
                            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm border border-emerald-100"
                            title="Conferma Incasso"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => setSelectedReceipt(v)} className="p-3 text-slate-300 hover:text-[#32964D] hover:bg-slate-50 rounded-2xl transition-all" title="Ricevuta Digitale"><Camera className="w-5 h-5" /></button>
                        <button onClick={() => onEdit(v)} className="p-3 text-slate-300 hover:text-amber-500 hover:bg-slate-50 rounded-2xl transition-all" title="Modifica"><Pencil className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => onDelete(v.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-slate-50 rounded-2xl transition-all" title="Elimina"><Trash2 className="w-4 h-4" /></button>}
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
