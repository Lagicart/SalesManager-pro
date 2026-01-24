
import React, { useState } from 'react';
import { Operatore } from '../types';
import { UserPlus, Shield, Key, Mail, X, Save, User } from 'lucide-react';

interface OperatorManagerProps {
  operatori: Operatore[];
  onUpdate: (op: Operatore) => void;
}

const OperatorManager: React.FC<OperatorManagerProps> = ({ operatori, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operatore | null>(null);
  const [formData, setFormData] = useState<Omit<Operatore, 'id'>>({
    nome: '',
    email: '',
    password: '',
    role: 'agent'
  });

  const handleEdit = (op: Operatore) => {
    setEditingOp(op);
    setFormData({
      nome: op.nome,
      email: op.email,
      password: op.password || '',
      role: op.role
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingOp(null);
    setFormData({ nome: '', email: '', password: '', role: 'agent' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      id: editingOp?.id || Math.random().toString(36).substr(2, 9)
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Gestione Account Operatori</h3>
            <p className="text-slate-500 text-sm mt-1">Configura gli accessi per il team di data entry.</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#2b7e41] transition-all shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Crea Nuovo Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Utente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email Accesso</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ruolo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {operatori.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${op.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-[#32964D]'}`}>
                        {op.nome.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{op.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{op.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${op.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-[#32964D] border border-emerald-200'}`}>
                      {op.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {op.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(op)}
                      className="text-xs font-bold text-[#32964D] hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Modifica Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#32964D] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingOp ? 'Modifica Account' : 'Nuovo Account Operatore'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-[#2b7e41] p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><User className="w-3 h-3" /> Nome Utente</label>
                <input 
                  required
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-bold"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Login</label>
                <input 
                  required
                  type="email"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-medium"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Key className="w-3 h-3" /> Password Accesso</label>
                <input 
                  required
                  type="password"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-95">
                <Save className="w-5 h-5" /> Salva Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorManager;
