
import React, { useState, useMemo } from 'react';
import { Agente, Vendita } from '../types';
import { User, FileText, Download, Mail, Euro, Clock, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface StatementOfAccountProps {
  agenti: Agente[];
  vendite: Vendita[];
}

const StatementOfAccount: React.FC<StatementOfAccountProps> = ({ agenti, vendite }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const selectedAgent = useMemo(() => agenti.find(a => a.id === selectedAgentId), [agenti, selectedAgentId]);

  const pendingSales = useMemo(() => {
    if (!selectedAgent) return [];
    return vendite
      .filter(v => v.agente.toLowerCase() === selectedAgent.nome.toLowerCase() && !v.incassato)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()); // Dal più vecchio
  }, [selectedAgent, vendite]);

  const totalPending = useMemo(() => pendingSales.reduce((sum, v) => sum + v.importo, 0), [pendingSales]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!selectedAgent) return;
    const subject = encodeURIComponent(`Lagicart SalesManager - Sollecito Estratto Conto: ${selectedAgent.nome}`);
    const body = encodeURIComponent(
      `Gentile ${selectedAgent.nome},\n\nTi inviamo il riepilogo delle tue pratiche in attesa di incasso aggiornato ad oggi.\n\n` +
      `Totale Pendenza: € ${totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}\n` +
      `Numero Pratiche: ${pendingSales.length}\n\n` +
      `DETTAGLIO PENDENZE:\n` +
      pendingSales.map(v => `- ${new Date(v.data).toLocaleDateString('it-IT')} | ${v.cliente} | € ${v.importo.toLocaleString('it-IT')} | [${v.metodoPagamento}]`).join('\n') +
      `\n\nTi preghiamo di verificare e procedere con la chiusura delle pratiche appena possibile.\n\nCordiali saluti,\nAmministrazione Lagicart`
    );
    window.location.href = `mailto:${selectedAgent.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          aside, header, .no-print, .agent-selector { display: none !important; }
          body { background: white !important; }
          .print-area { display: block !important; padding: 0 !important; border: none !important; shadow: none !important; }
          .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 2rem; }
        }
      `}</style>

      {/* Selettore Agente */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print agent-selector">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#32964D]" />
              Estratto Conto Agente
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Situazione pendenze per agente</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-[#32964D] appearance-none"
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
            >
              <option value="">Seleziona Agente...</option>
              {agenti.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedAgentId ? (
        <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center text-slate-300 no-print">
          <User className="w-20 h-20 opacity-20 mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.2em]">Seleziona un agente per visualizzare le pendenze</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 print-area">
          {/* Header Report */}
          <div className="bg-slate-900 p-10 text-white flex justify-between items-center no-print">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[2rem] bg-[#32964D] flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedAgent?.nome}</h2>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">{selectedAgent?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSendEmail} className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                <Mail className="w-5 h-5" /> Invia Email
              </button>
              <button onClick={handlePrint} className="bg-[#32964D] hover:bg-[#2b7e41] text-white p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20">
                <Download className="w-5 h-5" /> Esporta PDF
              </button>
            </div>
          </div>

          {/* Header Print Only */}
          <div className="hidden print-header p-10">
             <div>
                <h1 className="text-4xl font-black text-[#32964D]">LAGICART</h1>
                <p className="text-xs font-bold uppercase text-slate-400">Sales & Collection Management</p>
             </div>
             <div className="text-right">
                <h2 className="text-2xl font-black uppercase leading-none">{selectedAgent?.nome}</h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Estratto Conto Pendenti - {new Date().toLocaleDateString('it-IT')}</p>
             </div>
          </div>

          <div className="p-10 space-y-10">
            {/* Riepilogo Volume */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#32964D] p-8 rounded-[2rem] text-white shadow-xl">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Totale Pendenza</p>
                 <h3 className="text-4xl font-black tracking-tighter mt-1">€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-amber-100 p-8 rounded-[2rem] border border-amber-200">
                 <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pratiche Aperte</p>
                 <h3 className="text-4xl font-black tracking-tighter mt-1 text-amber-900">{pendingSales.length}</h3>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex items-center justify-center">
                 <div className="text-center">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Ordinamento cronologico</p>
                 </div>
              </div>
            </div>

            {/* Tabella Dettaglio */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Elenco Dettagliato Pratiche</h4>
              <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metodo</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ritardo</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSales.length > 0 ? pendingSales.map((v) => {
                      const days = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-xs font-black text-slate-400">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                          <td className="px-8 py-5">
                            <span className="font-black text-slate-900 uppercase text-sm tracking-tighter">{v.cliente}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <span className="text-[10px] font-black text-slate-500 uppercase">{v.metodoPagamento}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${days > 15 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Clock className="w-3 h-3" /> {days} giorni
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-emerald-500">
                              <CheckCircle2 className="w-16 h-16 opacity-20" />
                              <p className="text-xs font-black uppercase tracking-widest">Nessuna pendenza per questo agente</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {pendingSales.length > 0 && (
                    <tfoot>
                       <tr className="bg-slate-900 text-white">
                          <td colSpan={4} className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-right">TOTALE DOVUTO:</td>
                          <td className="px-8 py-6 text-xl font-black text-right">€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                       </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
               <span>Documento generato da Lagicart SalesManager</span>
               <span>Ref: {selectedAgentId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementOfAccount;
