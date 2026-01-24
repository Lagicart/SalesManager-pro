
import React, { useState } from 'react';
import { Agente, Operatore } from '../types';
import { UserCheck, Mail, ShieldAlert, UserCog, X, Save } from 'lucide-react';

interface AgentManagerProps {
  agenti: Agente[];
  operatori: Operatore[];
  isAdmin: boolean;
  onUpdate: (agente: Agente) => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({ agenti, operatori, isAdmin, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agente | null>(null);

  const [formData, setFormData] = useState<Omit<Agente, 'id'>>({
    nome: '',
    email: '',
    operatoreEmail: ''
  });

  const handleEdit = (agent: Agente) => {
    setEditingAgent(agent);
    setFormData({
      nome: agent.nome,
      email: agent.email,
      operatoreEmail: agent.operatoreEmail
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAgent(null);
    setFormData({ nome: '', email: '', operatoreEmail: operatori[1]?.email || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const agentData: Agente = {
      ...formData,
      id: editingAgent?.id || Math.random().toString(36).substr(2, 9)
    };
    onUpdate(agentData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Anagrafica Team Agenti</h3>
            <p className="text-slate-500 text-sm mt-1">Gestione dei collaboratori per la riscossione sul campo.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={handleAddNew}
              className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#2b7e41] transition-all shadow-lg active:scale-95"
            >
              <UserCog className="w-4 h-4" /> Aggiungi Nuovo Agente
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agenti.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium italic text-lg">Nessun agente configurato.</p>
            </div>
          ) : (
            agenti.map((agente) => (
              <div key={agente.id} className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#32964D] hover:shadow-xl hover:shadow-[#32964D]/5 transition-all duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#32964D] font-bold text-xl group-hover:bg-[#32964D] group-hover:text-white transition-colors shadow-sm">
                    {agente.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{agente.nome}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-slate-50 px-2 py-0.5 rounded">Agente Riscossore</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate font-medium">{agente.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-emerald-50/30 p-2 rounded-lg">
                    <UserCheck className="w-4 h-4 text-[#32964D]/50" />
                    <span className="text-xs">Associato a: <strong className="text-[#32964D] font-bold">{agente.operatoreEmail}</strong></span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Attivo</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEdit(agente)}
                      className="text-sm text-[#32964D] font-bold hover:text-[#2b7e41] transition-colors px-3 py-1 hover:bg-emerald-50 rounded-lg"
                    >
                      Modifica
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingAgent ? 'Modifica Agente' : 'Nuovo Agente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-800 p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <input 
                  required
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-bold"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Agente</label>
                <input 
                  required
                  type="email"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg">
                <Save className="w-5 h-5" /> Salva Informazioni
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
