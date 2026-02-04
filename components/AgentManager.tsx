
import React, { useState, useMemo } from 'react';
import { Agente, Operatore } from '../types';
import { UserCog, X, Save, Trash2, Search, RotateCcw, Pencil, UserCircle, Plus, Filter, Users, AlertTriangle } from 'lucide-react';

interface AgentManagerProps {
  agenti: Agente[];
  operatori: Operatore[];
  isAdmin: boolean;
  currentUser: Operatore;
  onUpdate: (agente: Agente) => void;
  onDelete: (id: string) => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({ agenti, operatori, isAdmin, currentUser, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');

  const [formData, setFormData] = useState<Omit<Agente, 'id'>>({
    nome: '', email: '', operatoreEmail: '', telefono: '', zona: ''
  });

  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    agenti.forEach(a => { if (a.zona) zones.add(a.zona); });
    return Array.from(zones).sort();
  }, [agenti]);

  const filteredAgentList = useMemo(() => {
    let list = [...agenti];
    
    // FILTRO RIGOROSO: Se non è admin, vede solo i propri
    if (!isAdmin) {
      list = list.filter(a => (a.operatoreEmail || '').toLowerCase() === currentUser.email.toLowerCase());
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(s) || a.email.toLowerCase().includes(s));
    }
    
    if (zoneFilter !== 'all') list = list.filter(a => a.zona === zoneFilter);
    
    // Filtro per operatore disponibile solo per l'admin
    if (isAdmin && operatorFilter !== 'all') {
      list = list.filter(a => a.operatoreEmail.toLowerCase() === operatorFilter.toLowerCase());
    }
    
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [agenti, searchTerm, zoneFilter, operatorFilter, isAdmin, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingAgent = agenti.find(a => a.id === editingAgent?.id);
    
    if (isAdmin && existingAgent && 
        existingAgent.operatoreEmail && 
        existingAgent.operatoreEmail.toLowerCase() !== formData.operatoreEmail.toLowerCase()) {
      
      const currentOp = operatori.find(o => o.email.toLowerCase() === existingAgent.operatoreEmail.toLowerCase());
      const confirmMsg = `ATTENZIONE: Questo agente è già assegnato a ${currentOp?.nome || existingAgent.operatoreEmail}. \n\nVuoi davvero trasferire la responsabilità di questo agente?`;
      
      if (!window.confirm(confirmMsg)) return;
    }

    onUpdate({ ...formData, id: editingAgent?.id || Math.random().toString(36).substr(2, 9) });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><UserCircle className="w-8 h-8 text-[#32964D]" /> Gestione Team Agenti</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              {isAdmin ? 'Anagrafica centralizzata aziendale' : `I tuoi agenti referenti`}
            </p>
          </div>
          <button onClick={() => { setEditingAgent(null); setFormData({ nome: '', email: '', operatoreEmail: currentUser.email, telefono: '', zona: '' }); setIsModalOpen(true); }} className="bg-[#32964D] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-[#2b7e41] transition-all"><Plus className="w-5 h-5" /> Nuovo Agente</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="relative md:col-span-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Cerca per nome o email..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#32964D]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:border-[#32964D]" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}><option value="all">Tutte le Zone</option>{availableZones.map(z => <option key={z} value={z}>{z}</option>)}</select>
          
          {isAdmin ? (
            <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:border-[#32964D]" value={operatorFilter} onChange={e => setOperatorFilter(e.target.value)}>
              <option value="all">Tutti gli Operatori</option>
              {operatori.map(op => <option key={op.email} value={op.email}>{op.nome}</option>)}
            </select>
          ) : (
            <div className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 flex items-center">
              Filtro operatore disabilitato
            </div>
          )}

          <button onClick={() => { setSearchTerm(''); setZoneFilter('all'); setOperatorFilter('all'); }} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#32964D] transition-colors"><RotateCcw className="w-4 h-4" /> Reset Filtri</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agente</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatti</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsabile</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgentList.length > 0 ? filteredAgentList.map((agente) => {
                const op = operatori.find(o => o.email.toLowerCase() === agente.operatoreEmail.toLowerCase());
                return (
                  <tr key={agente.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#32964D] flex items-center justify-center font-black">{agente.nome.charAt(0)}</div><span className="font-black text-slate-900 uppercase text-sm tracking-tighter">{agente.nome}</span></div></td>
                    <td className="px-8 py-5"><div className="text-xs font-bold text-slate-500">{agente.email}</div><div className="text-[10px] font-black text-slate-400">{agente.telefono || '-'}</div></td>
                    <td className="px-8 py-5"><div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${op ? 'bg-slate-100' : 'bg-rose-50 text-rose-500'}`}><Users className="w-3 h-3" /><span className="text-[10px] font-black uppercase">{op?.nome || 'NON ASSEGNATO'}</span></div></td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingAgent(agente); setFormData({ nome: agente.nome, email: agente.email, operatoreEmail: agente.operatoreEmail || currentUser.email, telefono: agente.telefono || '', zona: agente.zona || '' }); setIsModalOpen(true); }} className="p-3 text-slate-400 hover:text-[#32964D] hover:bg-emerald-50 rounded-xl transition-all" title="Modifica">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => { if(window.confirm('Eliminare definitivamente questo agente?')) onDelete(agente.id) }} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Elimina (Solo Admin)">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-50">Nessun agente trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-[#32964D] p-10 text-white flex justify-between items-center relative">
               <div className="flex items-center gap-4"><div className="bg-white/20 p-3 rounded-2xl"><UserCog className="w-6 h-6" /></div><h3 className="text-2xl font-black uppercase tracking-tighter">{editingAgent ? 'Modifica' : 'Nuovo'} Agente</h3></div>
               <button onClick={() => setIsModalOpen(false)} className="hover:bg-black/10 p-2 rounded-2xl transition-all"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome e Cognome</label><input required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-[#32964D]" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label><input required type="email" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefono</label><input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assegna a Operatore</label>
                {isAdmin ? (
                  <select required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-[#32964D]" value={formData.operatoreEmail} onChange={e => setFormData({...formData, operatoreEmail: e.target.value})}>
                    {operatori.map(op => <option key={op.id} value={op.email}>{op.nome}</option>)}
                  </select>
                ) : (
                  <input className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-400 italic" value={currentUser.nome} disabled />
                )}
              </div>
              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-2xl transition-all uppercase tracking-widest text-xs"><Save className="w-5 h-5" /> Salva Agente</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
