
import React, { useState, useRef, useMemo } from 'react';
import { Agente, Operatore } from '../types';
import { UserCheck, Mail, ShieldAlert, UserCog, X, Save, FileUp, Phone, MapPin, UploadCloud, Info, Trash2, Search, Filter, RotateCcw } from 'lucide-react';

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

    return list;
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
      operatoreEmail: currentUser.email, // Default al corrente
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
      
      const idxLastName = headers.findIndex(h => h.includes('last name') || h.includes('cognome') || h.includes('family'));
      const idxFirstName = headers.findIndex(h => h.includes('first name') || h.includes('nome') || h.includes('given'));
      const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
      const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cellulare'));
      const idxRegione = headers.findIndex(h => h.includes('regione') || h.includes('region') || h.includes('zona') || h.includes('area'));

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(/[,;]/).map(c => c.trim().replace(/^["'](.+)["']$/, '$1'));
        const lastName = idxLastName !== -1 ? columns[idxLastName] : '';
        const firstName = idxFirstName !== -1 ? columns[idxFirstName] : '';
        const nomeCompleto = `${lastName} ${firstName}`.trim();
        const email = idxEmail !== -1 ? columns[idxEmail] : '';
        const telefono = idxPhone !== -1 ? columns[idxPhone] : '';
        const zona = idxRegione !== -1 ? columns[idxRegione] : '';

        if (nomeCompleto) {
          const agent: Agente = {
            id: Math.random().toString(36).substr(2, 9),
            nome: nomeCompleto,
            email: email || `${nomeCompleto.toLowerCase().replace(/\s+/g, '.')}@azienda.it`,
            telefono,
            zona,
            operatoreEmail: currentUser.email // Assegna all'operatore che importa
          };
          onUpdate(agent);
          importedCount++;
        }
      }
      alert(`Importazione completata: ${importedCount} agenti aggiunti.`);
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
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Team Agenti</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Gestione portafoglio e mappatura contatti.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"><FileUp className="w-4 h-4" /> Importa CSV</button>
            <button onClick={handleAddNew} className="bg-[#32964D] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#2b7e41] transition-all shadow-lg active:scale-95"><UserCog className="w-4 h-4" /> Nuovo Agente</button>
          </div>
        </div>

        {/* Filtri Avanzati */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Nome o Email..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#32964D]/10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold appearance-none outline-none"
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
            >
              <option value="all">TUTTE LE ZONE</option>
              {availableZones.map(z => <option key={z} value={z}>{z.toUpperCase()}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold appearance-none outline-none"
                value={operatorFilter}
                onChange={e => setOperatorFilter(e.target.value)}
              >
                <option value="all">TUTTI GLI OPERATORI</option>
                {operatori.map(op => <option key={op.id} value={op.email}>{op.nome.toUpperCase()}</option>)}
              </select>
            </div>
          )}
          <button 
            onClick={() => { setSearchTerm(''); setZoneFilter('all'); setOperatorFilter('all'); }}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Filtri
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgentList.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <UploadCloud className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nessun agente trovato</p>
            </div>
          ) : (
            filteredAgentList.map((agente) => (
              <div key={agente.id} className="group bg-white border border-slate-100 p-6 rounded-3xl hover:border-[#32964D] hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-colors ${agente.zona ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-[#32964D]'}`}>
                    {agente.nome.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-black text-slate-900 text-lg truncate uppercase leading-tight tracking-tight">{agente.nome}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                       {agente.zona && (
                         <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                           <MapPin className="w-2.5 h-2.5" /> {agente.zona}
                         </span>
                       )}
                       {!agente.zona && <span className="text-[9px] text-slate-300 uppercase font-black tracking-widest">Nessuna Zona</span>}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-300" /> <span className="truncate">{agente.email}</span>
                  </div>
                  {agente.telefono && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-300" /> <span>{agente.telefono}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-3 text-[10px] text-[#32964D] font-black uppercase bg-emerald-50/50 p-3 rounded-2xl border border-emerald-50">
                      <UserCheck className="w-4 h-4 opacity-40" /> Ref: {agente.operatoreEmail}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    onClick={() => handleEdit(agente)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#32964D] hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-emerald-50"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#32964D] p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserCog className="w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">{editingAgent ? 'Aggiorna Agente' : 'Nuovo Ingresso'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl"><X /></button>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regione Competenza</label>
                <input placeholder="ES: PUGLIA, LAZIO..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black uppercase outline-none" value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value.toUpperCase()})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operatore Responsabile</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black uppercase outline-none" value={formData.operatoreEmail} onChange={e => setFormData({...formData, operatoreEmail: e.target.value})} disabled={!isAdmin}>
                  {operatori.map(op => <option key={op.id} value={op.email}>{op.nome} ({op.email})</option>)}
                </select>
              </div>

              <button className="w-full bg-[#32964D] hover:bg-[#2b7e41] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">
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
