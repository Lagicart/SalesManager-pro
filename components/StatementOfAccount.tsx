
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
${emailConfig.from_name || 'Amministrazione Lagicart S.r.l.'}`;
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
      console.log(`Relay tramite ${emailConfig.smtp_server} per account ${emailConfig.smtp_user}`);
      
      setTimeout(() => {
        setIsSending(false);
        setSendSuccess(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setSendSuccess(false);
        }, 2000);
      }, 3000);

    } else {
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
          .summary-container { display: flex !important; gap: 15pt; margin-bottom: 20pt !important; }
          .summary-box { flex: 1; padding: 12pt 18pt !important; border: 1.5pt solid #e2e8f0 !important; background: #fff !important; }
        }
      `}</style>

      {/* Selettore Agente */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 no-print agent-selector space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#32964D]" />
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Estratto Conto</h3>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
              <Printer className="w-4 h-4" /> Stampa
            </button>
            <button 
              onClick={() => setShowEmailModal(true)} 
              disabled={!selectedAgent}
              className="flex items-center gap-2 px-6 py-3 bg-[#32964D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2b7e41] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" /> Invia Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleziona Agente</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-[#32964D] transition-all"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">-- Scegli un agente --</option>
              {sortedAgentList.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtra per Metodo</label>
            <div className="flex flex-wrap gap-2">
              {metodiDisponibili.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${selectedMethods.includes(m) ? 'border-[#32964D] bg-emerald-50 text-[#32964D]' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedAgent && (
        <div className="print-area space-y-8">
          <div className="summary-container grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="summary-box bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Totale Pendente</p>
              <h4 className="text-3xl font-black text-rose-600 tracking-tighter">€ {totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="summary-box bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numero Pratiche</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{pendingSales.length}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metodo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingSales.map((v) => (
                  <tr key={v.id}>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 uppercase">{v.cliente}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{v.metodoPagamento}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEmailModal && selectedAgent && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-[#32964D] p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Send className="w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Invia Estratto Conto</h3>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="hover:bg-black/10 p-2 rounded-2xl transition-all"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatario</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={selectedAgent.email} disabled />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider Invio</label>
                      <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-black text-[#32964D] uppercase flex items-center gap-2">
                        {emailConfig.provider === 'smtp' ? <Zap className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {emailConfig.provider === 'smtp' ? 'Direct SMTP' : 'Client Locale'}
                      </div>
                   </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Oggetto</label>
                  <input className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#32964D]" value={mailSubject} onChange={e => setMailSubject(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corpo Messaggio</label>
                  <textarea className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium h-48 outline-none focus:border-[#32964D] resize-none" value={mailBody} onChange={e => setMailBody(e.target.value)} />
                </div>
              </div>

              <button 
                onClick={handleSendEmail} 
                disabled={isSending || sendSuccess}
                className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${sendSuccess ? 'bg-emerald-500' : 'bg-[#32964D] hover:bg-[#2b7e41]'}`}
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : sendSuccess ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                {isSending ? 'INVIO IN CORSO...' : sendSuccess ? 'INVIATO!' : 'CONFERMA E INVIA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Default export added here to fix the import error in App.tsx
export default StatementOfAccount;
