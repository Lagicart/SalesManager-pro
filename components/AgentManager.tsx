
import React, { useState, useRef, useMemo } from 'react';
import { Agente, Operatore } from '../types';
// Added Plus to the import list from lucide-react
import { UserCheck, Mail, ShieldAlert, UserCog, X, Save, FileUp, Phone, MapPin, UploadCloud, Info, Trash2, Search, Filter, RotateCcw, Pencil, UserCircle, Plus } from 'lucide-react';

interface AgentManagerProps {
  agenti: Agente[];
  operatori: Operatore[];
  isAdmin: boolean;
  currentUser: Operatore;
  onUpdate: (agente: Agente) => void;
  onReset?: () => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({ agenti, operatori, isAdmin, currentUser, onUpdate, onReset }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agente | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtri locali
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

  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    agenti.forEach(a => { if (a.zona) zones.add(a.zona); });
    return Array.from(zones).sort();
  }, [agenti]);

  const filteredAgentList = useMemo(() => {
    // 1. Privacy: Se non admin, vedi solo i tuoi
    let list = [...agenti];
    if (!isAdmin) {
      list = list.filter(a => a.operatoreEmail.toLowerCase() === currentUser.email.toLowerCase());
    }

    // 2. Filtro Ricerca Testuale
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(s) || a.email.toLowerCase().includes(s));
    }

    // 3. Filtro Zona
    if (zoneFilter !== 'all') {
      list = list.filter(a => a.zona === zoneFilter);
    }

    // 4. Filtro Operatore (solo Admin)
    if (isAdmin && operatorFilter !== 'all') {
      list = list.filter(a => a.operatoreEmail.toLowerCase() === operatorFilter.toLowerCase());
    }

    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [agenti, isAdmin, currentUser.email, searchTerm, zoneFilter, operatorFilter]);

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

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
      const idxLastName = headers.findIndex(h => h.includes('last name') || h.includes('cognome'));
      const idxFirstName = headers.findIndex(h => h.includes('first name') || h.includes('nome'));
      const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
      const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('tel'));
      const idxRegione = headers.findIndex(h => h.includes('regione') || h.includes('zona'));

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(/[,;]/).map(c => c.trim().replace(/^["'](.+)["']$/, '$1'));
        const lastName = idxLastName !== -1 ? columns[idxLastName] : '';
        const firstName = idxFirstName !== -1 ? columns[idxFirstName] : '';
        const nomeCompleto = `${lastName} ${firstName}`.trim();
        if (nomeCompleto) {
          onUpdate({
            id: Math.random().toString(36).substr(2, 9),
            nome: nomeCompleto,
            email: idxEmail !== -1 ? columns[idxEmail] : '',
            telefono: idxPhone !== -1 ? columns[idxPhone] : '',
            zona: idxRegione !== -1 ? columns[idxRegione] : '',
            operatoreEmail: currentUser.email
          });
          importedCount++;
        }
      }
      alert(`Importati ${importedCount} agenti.`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...formData, id: editingAgent?.id || Math.random().toString(36).substr(2, 9) });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filtri */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-[#32964D]" />
              Anagrafica Team Agenti
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              {isAdmin ? 'Gestione Globale' : `I Tuoi Agenti: ${filteredAgentList.length}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all shadow-sm"><FileUp className="w-5 h-5" /></button>
            <button onClick={handleAddNew} className="bg-[#32964D] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#2b7e41] transition-all"><Plus className="w-4 h-4" /> Nuovo Agente</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cerca..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold appearance-none" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
            <option value="all">Tutte le Zone</option>
            {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          {isAdmin && (
            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold appearance-none" value={operatorFilter} onChange={e => setOperatorFilter(e.target.value)}>
              <option value="all">Tutti gli Operatori</option>
              {operatori.map(op => <option key={op.id} value={op.email}>{op.nome}</option>)}
            </select>
          )}
          <button onClick={() => { setSearchTerm(''); setZoneFilter('all'); setOperatorFilter('all'); }} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"><RotateCcw className="w-4 h-4" /> Reset</button>
        </div>
      </div>

      {/* Tabella Lineare */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominativo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefono</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zona</th>
                {isAdmin && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operatore</th>}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgentList.length > 0 ? filteredAgentList.map((agente) => (
                <tr key={agente.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#32964D] flex items-center justify-center font-black text-xs shadow-inner">
                        {agente.nome.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 uppercase text-xs tracking-tight">{agente.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{agente.email}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{agente.telefono || '-'}</td>
                  <td className="px-6 py-4">
                    {agente.zona ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                        {agente.zona}
                      </span>
                    ) : <span className="text-slate-300 text-[10px] italic">Nessuna</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-black text-[#32964D] opacity-70 uppercase tracking-tight truncate max-w-[120px]">
                        {agente.operatoreEmail.split('@')[0]}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(agente)} className="p-2 text-slate-300 hover:text-[#32964D] hover:bg-emerald-50 rounded-lg transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest">Nessun agente trovato</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#32964D] p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserCog className="w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">{editingAgent ? 'Modifica Agente' : 'Nuovo Agente'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-black/10 p-2 rounded-xl transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anagrafica Completa</label>
                <input required placeholder="ES: BIANCHI MARCO" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" placeholder="m.bianchi@agente.it" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefono</label>
                  <input type="tel" placeholder="333..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zona di Competenza</label>
                <input placeholder="ES: LAZIO, PUGLIA..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black uppercase outline-none" value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value.toUpperCase()})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operatore Responsabile</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black uppercase outline-none" value={formData.operatoreEmail} onChange={e => setFormData({...formData, operatoreEmail: e.target.value})} disabled={!isAdmin}>
                  {operatori.map(op => <option key={op.id} value={op.email}>{op.nome} ({op.email})</option>)}
                </select>
              </div>

              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">
                <Save className="w-5 h-5" /> Salva Anagrafica
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
