
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vendita } from '../types';
import { Clock, X, Camera, MessageSquare, Send, CheckCircle2, ThumbsUp, Pencil, Trash2, RotateCcw, AlertTriangle, Euro, CreditCard } from 'lucide-react';

interface SalesTableProps {
  vendite: Vendita[];
  metodiDisponibili: string[];
  isAdmin: boolean;
  onIncasso: (id: string) => void;
  onVerifyPayment: (id: string) => void;
  onEdit: (v: Vendita) => void;
  onDelete: (id: string) => void;
  onUpdateNotizie?: (id: string, notizia: string, nuoveNotizie: boolean, mittente: string) => void;
  currentUserNome?: string;
}

const SalesTable: React.FC<SalesTableProps> = ({ vendite, metodiDisponibili, isAdmin, onIncasso, onVerifyPayment, onEdit, onDelete, onUpdateNotizie, currentUserNome }) => {
  const [filters, setFilters] = useState({
    importo: '', agente: '', data: '', metodo: 'all', status: 'all' as 'all' | 'incassato' | 'pendente'
  });

  const [selectedReceipt, setSelectedReceipt] = useState<Vendita | null>(null);
  const [activeChat, setActiveChat] = useState<Vendita | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [activeChat]);

  const filteredData = useMemo(() => {
    let list = [...vendite].filter(v => {
      const matchImporto = filters.importo ? Number(v.importo) === Number(filters.importo) : true;
      const matchAgente = v.agente.toLowerCase().includes(filters.agente.toLowerCase());
      const matchData = filters.data ? v.data.includes(filters.data) : true;
      const matchMetodo = filters.metodo === 'all' ? true : v.metodoPagamento === filters.metodo;
      const matchStatus = filters.status === 'all' ? true : filters.status === 'incassato' ? v.incassato : !v.incassato;
      return matchImporto && matchAgente && matchData && matchStatus && matchMetodo;
    });
    return list.sort((a, b) => new Date(b.created_at || b.data).getTime() - new Date(a.created_at || a.data).getTime());
  }, [vendite, filters]);

  const totalPendingSum = useMemo(() => {
    return filteredData.filter(v => !v.incassato).reduce((sum, v) => sum + v.importo, 0);
  }, [filteredData]);

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
      {/* Somma Totale Pendenti */}
      <div className="bg-[#32964D] text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between no-print animate-in slide-in-from-top-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl"><Euro className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Totale Pendenti (da filtri)</p>
            <h3 className="text-3xl font-black tracking-tighter">€ {totalPendingSum.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="hidden md:block text-right">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Pratiche filtrate</p>
           <p className="text-xl font-black">{filteredData.length}</p>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="number" step="0.01" placeholder="Importo..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-[#32964D]" value={filters.importo} onChange={e => setFilters({...filters, importo: e.target.value})} />
          </div>
          <input type="text" placeholder="Agente..." className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-[#32964D]" value={filters.agente} onChange={e => setFilters({...filters, agente: e.target.value})} />
          <select className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-[#32964D]" value={filters.metodo} onChange={e => setFilters({...filters, metodo: e.target.value})}>
             <option value="all">Tutti i Metodi</option>
             {metodiDisponibili.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-[#32964D]" value={filters.data} onChange={e => setFilters({...filters, data: e.target.value})} />
          <div className="flex gap-2">
            <select className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}><option value="all">Stato</option><option value="incassato">Incassati</option><option value="pendente">Pendenti</option></select>
            <button onClick={() => setFilters({importo: '', agente: '', data: '', metodo: 'all', status: 'all'})} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"><RotateCcw className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Agente</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metodo</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chat</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Verifica</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stato</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Importo</th>
                {isAdmin && <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right no-print">Azioni Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v) => {
                const hasUnread = v.nuove_notizie && v.ultimo_mittente !== currentUserNome;
                const days = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={v.id} className={`hover:bg-slate-50/80 transition-all ${v.incassato ? 'bg-emerald-50/20' : ''}`}>
                    <td className="px-6 py-5 text-xs font-black text-slate-400">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 truncate max-w-[200px] uppercase text-sm mb-1">{v.cliente}</div>
                      <div className="text-[10px] font-black text-[#32964D] uppercase tracking-widest opacity-70">{v.agente}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="text-xs font-black text-slate-600 uppercase bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">{v.metodoPagamento}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => { setActiveChat(v); if (hasUnread && onUpdateNotizie) onUpdateNotizie(v.id, v.notizie || '', false, v.ultimo_mittente || ''); }} className={`p-3 rounded-2xl transition-all relative ${hasUnread ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : (v.notizie ? 'bg-slate-100 text-slate-600' : 'text-slate-200 hover:text-slate-400')}`}><MessageSquare className={`w-5 h-5 ${hasUnread ? 'animate-pulse' : ''}`} />{hasUnread && <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white">!</span>}</button>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {v.verificarePagamento ? (
                        v.pagamentoVerificato ? (
                          <div className="flex justify-center"><ThumbsUp className="w-6 h-6 text-emerald-500 drop-shadow-sm" /></div>
                        ) : (
                          <button 
                            onClick={() => isAdmin && onVerifyPayment(v.id)} 
                            className={`p-2 rounded-xl transition-all ${isAdmin ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                            title={isAdmin ? "Clicca per verificare pagamento" : "Pagamento da verificare"}
                          >
                            <AlertTriangle className="w-7 h-7 text-amber-500 animate-pulse" />
                          </button>
                        )
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {v.incassato ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200"><CheckCircle2 className="w-4 h-4" /> Incassato</span>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-4 py-2 ${days > 15 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-orange-100 text-orange-700 border-orange-200'} rounded-full text-xs font-black uppercase tracking-widest border animate-pulse`}>
                          <Clock className="w-4 h-4" /> {days} GG
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className={`text-sm font-black ${v.incassato ? 'text-emerald-700' : 'text-slate-900'}`}>€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-5 no-print text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!v.incassato && <button onClick={() => onIncasso(v.id)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-emerald-100 shadow-sm" title="Conferma Incasso"><CheckCircle2 className="w-5 h-5" /></button>}
                          <button onClick={() => onEdit(v)} className="p-3 text-slate-300 hover:text-amber-500 hover:bg-slate-50 rounded-2xl transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(v.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-slate-50 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Chat (minimal) */}
      {activeChat && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-[#e5ddd5] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="bg-[#075e54] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><MessageSquare className="w-6 h-6" /></div>
                <div><h3 className="font-black text-lg uppercase tracking-tighter truncate max-w-[150px]">{activeChat.cliente}</h3><p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Chat Pratica</p></div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-black/10 p-2 rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeChat.notizie ? activeChat.notizie.split('\n').map((line, i) => {
                const parts = line.match(/\[(.*)\|(.*)\] (.*)/);
                const isMe = parts ? parts[1] === currentUserNome : false;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                      {!isMe && parts && <p className="text-[10px] font-black text-[#075e54] mb-1 uppercase">{parts[1]}</p>}
                      <p className="text-sm font-bold">{parts ? parts[3] : line}</p>
                      {parts && <p className="text-[9px] text-slate-400 mt-1 text-right">{parts[2]}</p>}
                    </div>
                  </div>
                );
              }) : <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30"><MessageSquare className="w-16 h-16" /><p className="text-xs font-black uppercase">Nessun messaggio</p></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 bg-[#f0f0f0]">
              <div className="flex gap-3">
                <input type="text" placeholder="Messaggio..." className="flex-1 bg-white rounded-2xl px-6 py-4 text-sm font-bold outline-none" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} className="bg-[#075e54] text-white p-4 rounded-2xl"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTable;
