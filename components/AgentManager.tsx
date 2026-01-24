
import React, { useState, useRef } from 'react';
import { Agente, Operatore } from '../types';
import { UserCheck, Mail, ShieldAlert, UserCog, X, Save, FileUp, Phone, MapPin, UploadCloud, Info } from 'lucide-react';

interface AgentManagerProps {
  agenti: Agente[];
  operatori: Operatore[];
  isAdmin: boolean;
  onUpdate: (agente: Agente) => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({ agenti, operatori, isAdmin, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agente | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Agente, 'id'>>({
    nome: '',
    email: '',
    operatoreEmail: '',
    telefono: '',
    zona: ''
  });

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
      operatoreEmail: operatori[0]?.email || '',
      telefono: '',
      zona: ''
    });
    setIsModalOpen(true);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
      
      // Mappatura intelligente delle colonne di Google Workspace
      const idxNome = headers.findIndex(h => h.includes('name') || h.includes('nome') || h.includes('given'));
      const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
      const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('mobile'));

      const newAgents: Agente[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(/[,;]/).map(c => c.trim().replace(/^["'](.+)["']$/, '$1'));
        
        const nome = idxNome !== -1 ? columns[idxNome] : '';
        const email = idxEmail !== -1 ? columns[idxEmail] : '';
        const telefono = idxPhone !== -1 ? columns[idxPhone] : '';

        if (nome) {
          const agent: Agente = {
            id: Math.random().toString(36).substr(2, 9),
            nome,
            email: email || `${nome.toLowerCase().replace(/\s/g, '.')}@azienda.it`,
            telefono,
            zona: '',
            operatoreEmail: operatori[0]?.email || ''
          };
          onUpdate(agent);
        }
      }
      alert(`Importazione completata!`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Anagrafica Team Agenti</h3>
            <p className="text-slate-500 text-sm mt-1">Gestione e importazione rapida dei collaboratori.</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleCsvImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 active:scale-95"
            >
              <FileUp className="w-4 h-4" /> Importa CSV Google
            </button>
            {isAdmin && (
              <button 
                onClick={handleAddNew}
                className="bg-[#32964D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#2b7e41] transition-all shadow-lg active:scale-95"
              >
                <UserCog className="w-4 h-4" /> Nuovo Agente
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agenti.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium italic text-lg">Nessun agente presente.</p>
              <p className="text-slate-400 text-sm mt-2">Usa il tasto Importa CSV per caricare i contatti da Google Workspace.</p>
            </div>
          ) : (
            agenti.map((agente) => (
              <div key={agente.id} className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#32964D] hover:shadow-xl hover:shadow-[#32964D]/5 transition-all duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-[#32964D] group-hover:text-white transition-colors shadow-sm ${agente.zona ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#32964D]'}`}>
                    {agente.nome.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 text-lg truncate">{agente.nome}</h4>
                    <div className="flex items-center gap-1.5">
                       {agente.zona && (
                         <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                           Zona: {agente.zona}
                         </span>
                       )}
                       {!agente.zona && <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Agente Senior</span>}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate font-medium">{agente.email}</span>
                  </div>
                  {agente.telefono && (
                    <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{agente.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-[#32964D] bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-50">
                    <UserCheck className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                    <span className="uppercase font-bold tracking-tight">Ref. <strong className="ml-1">{agente.operatoreEmail}</strong></span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Attivo</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEdit(agente)}
                      className="text-xs text-[#32964D] font-bold hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-emerald-100"
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
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#32964D] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserCog className="w-6 h-6" />
                <h3 className="text-xl font-bold">{editingAgent ? 'Modifica Agente' : 'Nuovo Agente'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nome Completo</label>
                <input 
                  required
                  placeholder="Es: Luigi Verdi"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-bold"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email</label>
                  <input 
                    required
                    type="email"
                    placeholder="email@agente.it"
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-medium text-sm"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Telefono</label>
                  <input 
                    type="tel"
                    placeholder="+39..."
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-medium text-sm"
                    value={formData.telefono}
                    onChange={e => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Zona di Competenza</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    placeholder="Es: Milano Centro, Puglia, Estero..."
                    className="w-full border-2 border-slate-100 rounded-xl pl-11 pr-4 py-3 focus:border-amber-500 outline-none font-bold"
                    value={formData.zona}
                    onChange={e => setFormData({...formData, zona: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Operatore di Riferimento</label>
                <select
                  required
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-[#32964D] outline-none font-bold"
                  value={formData.operatoreEmail}
                  onChange={e => setFormData({...formData, operatoreEmail: e.target.value})}
                >
                  {operatori.map(op => (
                    <option key={op.id} value={op.email}>{op.nome} ({op.email})</option>
                  ))}
                </select>
              </div>

              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-95 transition-all">
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
