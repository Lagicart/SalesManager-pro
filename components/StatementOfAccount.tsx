
import React, { useState, useMemo } from 'react';
import { Agente, Vendita } from '../types';
import { User, FileText, Mail, Printer, Clock, CheckCircle2, Search, X, Send } from 'lucide-react';

interface StatementOfAccountProps {
  agenti: Agente[];
  vendite: Vendita[];
}

const StatementOfAccount: React.FC<StatementOfAccountProps> = ({ agenti, vendite }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const sortedAgentList = useMemo(() => {
    return [...agenti].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [agenti]);

  const selectedAgent = useMemo(() => agenti.find(a => a.id === selectedAgentId), [agenti, selectedAgentId]);

  const pendingSales = useMemo(() => {
    if (!selectedAgent) return [];
    return vendite
      .filter(v => v.agente.toLowerCase() === selectedAgent.nome.toLowerCase() && !v.incassato)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [selectedAgent, vendite]);

  const totalPending = useMemo(() => pendingSales.reduce((sum, v) => sum + v.importo, 0), [pendingSales]);

  const emailText = useMemo(() => {
    if (!selectedAgent) return "";
    return `Spett.le ${selectedAgent.nome},

Ti inviamo il riepilogo delle tue pratiche in attesa di incasso aggiornato al ${new Date().toLocaleDateString('it-IT')}.

Totale Pendenza: € ${totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
Numero Pratiche: ${pendingSales.length}

DETTAGLIO PRATICHE PENDENTI:
${pendingSales.map(v => `- ${new Date(v.data).toLocaleDateString('it-IT')} | ${v.cliente} | € ${v.importo.toLocaleString('it-IT')} | [${v.metodoPagamento}]`).join('\n')}

Ti preghiamo di verificare lo stato dei pagamenti e di procedere con la regolarizzazione delle posizioni aperte.

Cordiali saluti,
Amministrazione Lagicart S.r.l.`;
  }, [selectedAgent, pendingSales, totalPending]);

  const handlePrint = () => {
    window.print();
  };

  const confirmSendEmail = () => {
    if (!selectedAgent) return;
    const subject = encodeURIComponent(`Lagicart S.r.l. - Estratto Conto Pendenti: ${selectedAgent.nome}`);
    const body = encodeURIComponent(emailText);
    window.location.href = `mailto:${selectedAgent.email}?subject=${subject}&body=${body}`;
    setShowEmailPreview(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          aside, header, .no-print, .agent-selector { display: none !important; }
          body { background: white !important; font-family: Arial, sans-serif; color: black; }
          
          .print-area { 
            display: block !important; 
            padding: 0 !important; 
            border: none !important; 
            box-shadow: none !important; 
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          
          .print-header { 
            display: flex !important; 
            align-items: flex-start; 
            justify-content: space-between; 
            border-bottom: 2pt solid #32964D; 
            padding: 10pt 0 10pt 0 !important; 
            margin-bottom: 20pt !important;
          }

          .print-table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          .print-table th { 
            padding: 8pt !important; 
            font-size: 10pt !important; 
            background-color: #f1f5f9 !important; 
            color: #334155 !important;
            border: 0.5pt solid #cbd5e1 !important;
            text-transform: uppercase;
            -webkit-print-color-adjust: exact; 
          }
          .print-table td { 
            padding: 6pt !important; 
            font-size: 10pt !important; 
            border: 0.5pt solid #e2e8f0 !important; 
          }
          
          .summary-container { display: flex !important; gap: 15pt; margin-bottom: 20pt !important; }
          .summary-box { 
            flex: 1;
            padding: 12pt 18pt !important; 
            border: 1.5pt solid #e2e8f0 !important;
            background: #fff !important;
          }
          .summary-box h3 { font-size: 20pt !important; color: #32964D !important; margin: 5pt 0 0 0 !important; }
          .summary-box p { font-size: 9pt !important; font-weight: bold; margin: 0 !important; text-transform: uppercase; color: #64748b !important; }
          
          .print-footer { border-top: 1pt solid #e2e8f0; margin-top: 30pt; padding-top: 10pt !important; font-size: 8pt !important; color: #94a3b8 !important; display: flex !important; justify-content: space-between; }
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
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-[#32964D] appearance-none"
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
            >
              <option value="">Seleziona Agente...</option>
              {sortedAgentList.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedAgentId ? (
        <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center text-slate-300 no-print">
          <User className="w-20 h-20 opacity-20 mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.2em]">Seleziona un agente per visualizzare i dettagli</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 print-area">
          {/* Header Report (Schermo) */}
          <div className="bg-slate-900 p-8 text-white flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#32964D] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{selectedAgent?.nome}</h2>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2">{selectedAgent?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setShowEmailPreview(true)} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest border border-white/5">
                <Mail className="w-5 h-5" /> Anteprima Email
              </button>
              <button onClick={handlePrint} className="bg-[#32964D] hover:bg-[#2b7e41] text-white px-10 py-4 rounded-xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl">
                <Printer className="w-5 h-5" /> Stampa / Esporta PDF
              </button>
            </div>
          </div>

          {/* Header Lagicart (Solo Stampa) */}
          <div className="hidden print-header">
             <div>
                <h1 className="text-2xl font-black text-[#32964D] leading-none" style={{ margin: 0 }}>LAGICART S.R.L.</h1>
                <p className="text-[10pt] font-bold text-slate-500 mt-1" style={{ margin: 0 }}>ingrosso specializzato in articoli di cartoleria</p>
             </div>
             <div className="text-right">
                <h2 className="text-lg font-black uppercase leading-none" style={{ margin: 0 }}>{selectedAgent?.nome}</h2>
                <p className="text-[9pt] font-bold text-slate-400 mt-1 uppercase" style={{ margin: 0 }}>Estratto Conto - {new Date().toLocaleDateString('it-IT')}</p>
             </div>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            {/* Riepilogo Volume */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 summary-container">
              <div className="bg-[#32964D] p-6 md:p-10 rounded-[2rem] text-white shadow-xl summary-box">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Volume Insoluto</p>
                 <h3 className="text-3xl md:text-4xl font-black tracking-tighter mt-2">€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-amber-100 p-6 md:p-10 rounded-[2rem] border border-amber-200 summary-box">
                 <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pratiche Aperte</p>
                 <h3 className="text-3xl md:text-4xl font-black tracking-tighter mt-2 text-amber-900">{pendingSales.length}</h3>
              </div>
              <div className="hidden md:flex bg-slate-50 p-10 rounded-[2rem] border border-slate-100 items-center justify-center no-print">
                 <div className="text-center">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Ordinate per data pratica</p>
                 </div>
              </div>
            </div>

            {/* Tabella Dettaglio (Alta Leggibilità) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 no-print">Dettaglio pendenze</h4>
              
              <div className="border border-slate-200 rounded-[2rem] overflow-hidden no-print">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Ritardo</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSales.length > 0 ? pendingSales.map((v) => {
                      const days = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                          <td className="px-6 py-4">
                            <span className="font-black text-slate-900 uppercase tracking-tighter text-sm">{v.cliente}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="text-xs font-black text-slate-600 uppercase bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">{v.metodoPagamento}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className={`inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-black uppercase border ${days > 15 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {days} GIORNI
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">Nessuna pendenza</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tabella Versione Stampa */}
              <div className="hidden print:block">
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Data</th>
                      <th style={{ textAlign: 'left' }}>Cliente</th>
                      <th className="text-center">Pagamento</th>
                      <th className="text-center">Ritardo</th>
                      <th style={{ textAlign: 'right' }}>Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((v) => {
                      const days = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={v.id}>
                          <td>{new Date(v.data).toLocaleDateString('it-IT')}</td>
                          <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{v.cliente}</td>
                          <td className="text-center">{v.metodoPagamento}</td>
                          <td className="text-center">{days} GG</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                       <td colSpan={4} style={{ textAlign: 'right', fontWeight: '900', textTransform: 'uppercase', padding: '12pt' }}>Saldo Totale Dovuto:</td>
                       <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '14pt', padding: '12pt', color: '#32964D' }}>€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-300 italic print-footer">
               <span>Lagicart S.r.l. - Gestione Crediti SalesManager</span>
               <span>Generato il {new Date().toLocaleString('it-IT')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anteprima Email */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#32964D] p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  <h3 className="font-black uppercase tracking-tighter text-lg">Anteprima Email</h3>
               </div>
               <button onClick={() => setShowEmailPreview(false)} className="p-2 hover:bg-black/10 rounded-xl transition-colors"><X /></button>
            </div>
            <div className="p-8 space-y-5">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="mb-4 pb-4 border-b border-slate-200 flex flex-col gap-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oggetto:</p>
                     <p className="text-sm font-bold text-slate-900">Lagicart S.r.l. - Estratto Conto Pendenti: {selectedAgent?.nome}</p>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap text-slate-700 leading-relaxed max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                     {emailText}
                  </pre>
               </div>
               <div className="flex gap-4 pt-2">
                  <button onClick={() => setShowEmailPreview(false)} className="flex-1 px-6 py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-2xl hover:bg-slate-200 transition-all">
                     Annulla
                  </button>
                  <button onClick={confirmSendEmail} className="flex-[2] px-6 py-5 bg-[#32964D] text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:bg-[#2b7e41] transition-all flex items-center justify-center gap-3">
                     <Send className="w-5 h-5" /> Invia Email
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementOfAccount;
