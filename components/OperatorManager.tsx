
import React, { useState } from 'react';
import { Operatore, ADMIN_EMAIL } from '../types';
import { UserPlus, Shield, Key, Mail, X, Save, User, Trash2, Pencil } from 'lucide-react';

interface OperatorManagerProps {
  operatori: Operatore[];
  onUpdate: (op: Operatore) => void;
  onDelete: (id: string) => void;
}

const OperatorManager: React.FC<OperatorManagerProps> = ({ operatori, onUpdate, onDelete }) => {
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

  const handleDelete = (op: Operatore) => {
    if (op.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      alert("L'account amministratore principale non può essere eliminato per motivi di sicurezza.");
      return;
    }

    if (window.confirm(`Sei sicuro di voler eliminare definitivamente l'account di ${op.nome}? Questa azione non può essere annullata.`)) {
      onDelete(op.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Gestione Account Operatori</h3>
            <p className="text-slate-500 text-sm mt-1">Configura gli accessi e assegna i permessi amministrativi.</p>
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${op.role === 'admin' ? 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-200' : 'bg-emerald-50 text-[#32964D]'}`}>
                        {op.nome.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{op.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{op.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${op.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-[#32964D] border border-emerald-200'}`}>
                      {op.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {op.role === 'admin' ? 'Amministratore' : 'Operatore'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(op)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-200"
                        title="Modifica Account"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(op)}
                        className={`p-2 rounded-lg transition-all border border-transparent ${op.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'text-slate-200 cursor-not-allowed' : 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'}`}
                        title="Elimina Account"
                        disabled={op.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
            <div className={`p-6 text-white flex justify-between items-center ${formData.role === 'admin' ? 'bg-amber-600' : 'bg-[#32964D]'}`}>
              <div className="flex items-center gap-3">
                {formData.role === 'admin' ? <Shield className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                <h3 className="text-xl font-bold">{editingOp ? 'Modifica Account' : 'Nuovo Account'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-black/10 p-1 rounded-lg transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nome Utente</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    placeholder="Es: Maria Rossi"
                    className="w-full border-2 border-slate-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#32964D] outline-none font-bold transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Login</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="email"
                    placeholder="email@azienda.it"
                    className="w-full border-2 border-slate-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#32964D] outline-none font-medium transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full border-2 border-slate-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#32964D] outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Ruolo e Permessi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'agent'})}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.role === 'agent' ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Operatore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.role === 'admin' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Admin</span>
                  </button>
                </div>
              </div>

              <button className={`w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-95 transition-all ${formData.role === 'admin' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#32964D] hover:bg-[#2b7e41]'}`}>
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
