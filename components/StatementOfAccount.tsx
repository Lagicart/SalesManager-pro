
import React, { useState, useMemo, useEffect } from 'react';
import { Agente, Vendita, EmailConfig } from '../types';
import { User, FileText, Mail, Printer, Clock, CheckCircle2, Search, X, Send, Filter, Zap, Loader2, Check, Globe } from 'lucide-react';

interface StatementOfAccountProps {
  agenti: Agente[];
  vendite: Vendita[];
  metodiDisponibili: string[];
  emailConfig: EmailConfig;
}

const StatementOfAccount: React.FC<StatementOfAccountProps> = ({ agenti, vendite, metodiDisponibili, emailConfig }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  const sortedAgentList = useMemo(() => {
    return [...agenti].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [agenti]);

  const selectedAgent = useMemo(() => agenti.find(a => a.id === selectedAgentId), [agenti, selectedAgentId]);

  const toggleMethod = (metodo: string) => {
    setSelectedMethods(prev => 
      prev.includes(metodo) 
        ? prev.filter(m => m !== metodo) 
        : [...prev, metodo]
    );
  };

  const pendingSales = useMemo(() => {
    if (!selectedAgent) return [];
    return vendite
      .filter(v => {
        const matchAgent = v.agente.toLowerCase() === selectedAgent.nome.toLowerCase();
        const matchStatus = !v.incassato;
        const matchMethod = selectedMethods.length === 0 || selectedMethods.includes(v.metodoPagamento);
        return matchAgent && matchStatus && matchMethod;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [selectedAgent, vendite, selectedMethods]);

  const totalPending = useMemo(() => pendingSales.reduce((sum, v) => sum + v.importo, 0), [pendingSales]);

  useEffect(() => {
    if (selectedAgent) {
      setMailSubject(`Lagicart S.r.l. - Estratto Conto Pendenti: ${selectedAgent.nome}`);
      const body = `Spett.le ${selectedAgent.nome},

Ti inviamo il riepilogo delle tue pratiche in attesa di incasso aggiornato al ${new Date().toLocaleDateString('it-IT')}.

Totale Pendenza: € ${totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
Numero Pratiche: ${pendingSales.length}

DETTAGLIO PRATICHE PENDENTI:
${pendingSales.map(v => `- ${new Date(v.data).toLocaleDateString('it-IT')} | ${v.cliente} | € ${v.importo.toLocaleString('it-IT')} | [${v.metodoPagamento}]${v.sconto ? ' (Sconto: ' + v.sconto + ')' : ''}`).join('\n')}

Ti preghiamo di verificare lo stato dei pagamenti e di procedere con la regolarizzazione delle posizioni aperte.

Cordiali saluti,
${emailConfig.fromName || 'Amministrazione Lagicart S.r.l.'}`;
      setMailBody(body);
    }
  }, [selectedAgent, pendingSales, totalPending, emailConfig]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!selectedAgent) return;
    
    setIsSending(true);
    setSendSuccess(false);

    if (emailConfig.provider === 'smtp') {
      // SIMULAZIONE INVIO TRAMITE GOOGLE WORKSPACE
      console.log(`Relay tramite ${emailConfig.smtpServer} per account ${emailConfig.smtpUser}`);
      
      setTimeout(() => {
        setIsSending(false);
        setSendSuccess(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setSendSuccess(false);
        }, 2000);
      }, 3000);

    } else {
      // INVIO TRAMITE CLIENT LOCALE
      setTimeout(() => {
        const subject = encodeURIComponent(mailSubject);
        const body = encodeURIComponent(mailBody);
        window.location.href = `mailto:${selectedAgent.email}?subject=${subject}&body=${body}`;
        
        setIsSending(false);
        setSendSuccess(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setSendSuccess(false);
        }, 1500);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          aside, header, .no-print, .agent-selector, .filter-area { display: none !important; }
          body { background: white !important; font-family: Arial, sans-serif; color: black; }
          .print-area { display: block !important; padding: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; width: 100% !important; }
          .print-header { display: flex !important; align-items: flex-start; justify-content: space-between; border-bottom: 2pt solid #32964D; padding: 10pt 0 10pt 0 !important; margin-bottom: 20pt !important; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          .print-table th { padding: 8pt !important; font-size: 10pt !important; background-color: #f1f5f9 !important; color: #334155 !important; border: 0.5pt solid #cbd5e1 !important; text-transform: uppercase; }
          .print-table td { padding: 6pt !important; font-size: 10pt !important; border: 0.5pt solid #e2e8f0 !important; }
          .summary-container { display: flex !important; gap: 15pt; margin-bottom: 20pt !important; }
          .summary-box { flex: 1; padding: 12pt 18pt !important; border: 1.5pt solid #e2e8f0 !important; background: #fff !important; }
          .summary-box h3 { font-size: 20pt !important; color: #32964D !important; margin: 5pt 0 0 0 !important; }
          .summary-box p { font-size: 9pt !important; font-weight: bold; margin: 0 !important; text-transform: uppercase; color: #64748b !important; }
          .print-footer { border-top: 1pt solid #e2e8f0; margin-top: 30pt; padding-top: 10pt !important; font-size: 8pt !important; color: #94a3b8 !important; display: flex !important; justify-content: space-between; }
        }
      `}</style>

      {/* Selettore Agente */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print agent-selector space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#32964D]" />
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
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

        {selectedAgentId && (
          <div className="pt-6 border-t border-slate-100 filter-area">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filtra Modalità Pagamento
            </label>
            <div className="flex flex-wrap gap-2">
              {metodiPagamentoFiltro.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${selectedMethods.includes(m) ? 'bg-[#32964D] border-[#32964D] text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!selectedAgentId ? (
        <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center text-slate-300 no-print">
          <User className="w-20 h-20 opacity-20 mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.2em]">Scegli un agente</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 print-area">
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
              <button 
                onClick={() => setShowEmailModal(true)} 
                className="bg-[#32964D] hover:bg-[#2b7e41] text-white px-8 py-4 rounded-xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl border border-[#32964D]"
              >
                {emailConfig.provider === 'smtp' ? <Globe className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                {emailConfig.provider === 'smtp' ? 'Invia tramite Google' : 'Invia tramite Client'}
              </button>
              <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest border border-white/5">
                <Printer className="w-5 h-5" /> Stampa PDF
              </button>
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 summary-container">
              <div className="bg-[#32964D] p-10 rounded-[2rem] text-white shadow-xl summary-box">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Volume Insoluto</p>
                 <h3 className="text-4xl font-black tracking-tighter mt-2">€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-amber-100 p-10 rounded-[2rem] border border-amber-200 summary-box">
                 <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pratiche Aperte</p>
                 <h3 className="text-4xl font-black tracking-tighter mt-2 text-amber-900">{pendingSales.length}</h3>
              </div>
            </div>

            <div className="border border-slate-200 rounded-[2rem] overflow-hidden no-print">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingSales.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                      <td className="px-6 py-4 font-black text-slate-900 uppercase text-sm">{v.cliente}</td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-xs font-black text-slate-600 uppercase bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200">{v.metodoPagamento}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE MAIL COMPOSER */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
            
            {(isSending || sendSuccess) && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                {isSending ? (
                  <div className="space-y-6 w-full max-w-xs">
                    <Loader2 className="w-12 h-12 text-[#32964D] animate-spin mx-auto" />
                    <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                      {emailConfig.provider === 'smtp' ? 'Connessione ai Server Google...' : 'Preparazione Invio...'}
                    </h4>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full bg-[#32964D] animate-[progress_3s_ease-in-out]" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in zoom-in">
                    <Check className="w-16 h-16 text-white bg-emerald-500 rounded-full p-4 mx-auto shadow-xl" />
                    <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Email Trasmessa!</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Controlla la cartella "Inviati" di Google Workspace</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#32964D] p-8 text-white flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <Mail className="w-8 h-8" />
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-xl">Invia Estratto Conto</h3>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                      {emailConfig.provider === 'smtp' ? `Google Workspace Relay (${emailConfig.smtpUser})` : 'Utilizzo Client Locale'}
                    </p>
                  </div>
               </div>
               <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-black/10 rounded-xl transition-colors"><X className="w-7 h-7" /></button>
            </div>

            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatario</label>
                     <div className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600">
                        {selectedAgent?.nome} ({selectedAgent?.email})
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Oggetto</label>
                     <input className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#32964D]" value={mailSubject} onChange={e => setMailSubject(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Testo Messaggio</label>
                     <textarea className="w-full h-64 px-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-xs font-medium leading-relaxed outline-none focus:bg-white focus:border-[#32964D] transition-all custom-scrollbar resize-none" value={mailBody} onChange={e => setMailBody(e.target.value)} />
                  </div>
               </div>

               <div className="flex gap-4 pt-2">
                  <button onClick={() => setShowEmailModal(false)} className="flex-1 px-6 py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-2xl border border-slate-200">Annulla</button>
                  <button onClick={handleSendEmail} className="flex-[2] px-6 py-5 bg-[#32964D] text-white font-black text-xs uppercase rounded-2xl shadow-xl hover:bg-[#2b7e41] transition-all flex items-center justify-center gap-3">
                     <Send className="w-5 h-5" /> 
                     {emailConfig.provider === 'smtp' ? 'Invia via Google Relay' : 'Apri Client Posta'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Variabile di supporto interna
const metodiPagamentoFiltro = ['Bonifico', 'Rimessa Diretta', 'Assegno', 'Contanti'];

export default StatementOfAccount;
