
import React, { useState, useMemo } from 'react';
import { Agente, Operatore } from '../types';
import { UserCog, X, Save, Trash2, Search, RotateCcw, Pencil, UserCircle, Plus, Filter, Users } from 'lucide-react';

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
    nome: '',
    email: '',
    operatoreEmail: '',
    telefono: '',
    zona: ''
  });

  // Estrae le zone uniche dagli agenti esistenti
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    agenti.forEach(a => { if (a.zona) zones.add(a.zona); });
    return Array.from(zones).sort();
  }, [agenti]);

  // Filtra la lista in base ai criteri selezionati
  const filteredAgentList = useMemo(() => {
    let list = [...agenti];
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(s) || a.email.toLowerCase().includes(s));
    }

    if (zoneFilter !== 'all') {
      list = list.filter(a => a.zona === zoneFilter);
    }

    if (operatorFilter !== 'all') {
      list = list.filter(a => a.operatoreEmail.toLowerCase() === operatorFilter.toLowerCase());
    }

    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [agenti, searchTerm, zoneFilter, operatorFilter]);

  const handleEdit = (agent: Agente) => {
    setEditingAgent(agent);
    setFormData({
      nome: agent.nome,
      email: agent.email,
      operatoreEmail: agent.operatoreEmail,
      telefono: agent.telefono || '',
      zona: agent.zona || ''
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAgent(null);
    setFormData({ 
      nome: '', 
      email: '', 
      operatoreEmail: currentUser.email,
      telefono: '',
      zona: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...formData, id: editingAgent?.id || Math.random().toString(36).substr(2, 9) });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header e Filtri */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-[#32964D]" />
              Gestione Team Agenti
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Anagrafica centralizzata accessibile a tutti gli operatori
            </p>
          </div>
          <button onClick={handleAddNew} className="bg-[#32964D] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-emerald-900/10 hover:bg-[#2b7e41] active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> Nuovo Agente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cerca nome o email..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#32964D] transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase appearance-none outline-none focus:border-[#32964D]" 
              value={zoneFilter} 
              onChange={e => setZoneFilter(e.target.value)}
            >
              <option value="all">Tutte le Zone</option>
              {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase appearance-none outline-none focus:border-[#32964D]" 
              value={operatorFilter} 
              onChange={e => setOperatorFilter(e.target.value)}
            >
              <option value="all">Tutti gli Operatori</option>
              {operatori.map(op => (
                <option key={op.email} value={op.email}>{op.nome}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setZoneFilter('all'); setOperatorFilter('all'); }} 
            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#32964D] transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset Filtri
          </button>
        </div>
      </div>

      {/* Tabella Agenti */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agente</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatti</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creato Da</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgentList.length > 0 ? filteredAgentList.map((agente) => {
                const opReferente = operatori.find(o => o.email.toLowerCase() === agente.operatoreEmail.toLowerCase());
                
                return (
                  <tr key={agente.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#32964D] flex items-center justify-center font-black text-lg shadow-inner border border-emerald-100/50">
                          {agente.nome.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 uppercase text-sm tracking-tighter">{agente.nome}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-slate-500">{agente.email}</div>
                      <div className="text-[10px] font-black text-slate-400 mt-0.5">{agente.telefono || '-'}</div>
                    </td>
                    <td className="px-8 py-5">
                      {agente.zona ? (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-tight border border-amber-100">
                          {agente.zona}
                        </span>
                      ) : <span className="text-slate-300 text-[10px] italic">Nessuna zona</span>}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                          {opReferente?.nome.charAt(0) || '?'}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">
                          {opReferente?.nome || 'Sistema'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(agente)} className="p-3 text-slate-400 hover:text-[#32964D] hover:bg-emerald-50 rounded-xl transition-all" title="Modifica">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(agente.id)} 
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                          title="Elimina Anagrafica (Le vendite rimarranno integre)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Users className="w-16 h-16 opacity-10" />
                      <p className="text-sm font-black uppercase tracking-widest">Nessun agente trovato</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inserimento/Modifica */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="bg-[#32964D] p-10 text-white flex justify-between items-center relative">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><UserCog className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{editingAgent ? 'Modifica' : 'Nuovo'} Agente</h3>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Dati anagrafici team</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-black/10 p-2 rounded-2xl transition-all"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome e Cognome</label>
                <input required placeholder="MARIO ROSSI" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-[#32964D] transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" placeholder="email@agente.it" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefono</label>
                  <input type="tel" placeholder="333..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zona</label>
                <input placeholder="ES: NORD, CENTRO..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none" value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value.toUpperCase()})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referente Operativo</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-[#32964D] transition-all"
                  value={formData.operatoreEmail}
                  onChange={e => setFormData({...formData, operatoreEmail: e.target.value})}
                >
                  {operatori.map(op => (
                    <option key={op.id} value={op.email}>{op.nome}</option>
                  ))}
                </select>
              </div>

              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all uppercase tracking-widest text-xs">
                <Save className="w-5 h-5" /> Salva Agente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
