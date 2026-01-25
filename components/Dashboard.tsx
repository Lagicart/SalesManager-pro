
import React, { useMemo } from 'react';
import { Vendita } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Clock, Zap } from 'lucide-react';

interface DashboardProps {
  vendite: Vendita[];
  isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ vendite, isAdmin }) => {
  // Statistiche calcolate in tempo reale
  const stats = useMemo(() => {
    const total = vendite.reduce((acc, v) => acc + v.importo, 0);
    const incassato = vendite.filter(v => v.incassato).reduce((acc, v) => acc + v.importo, 0);
    const pendente = total - incassato;
    const count = vendite.length;

    // Statistiche specifiche per lo sconto (Fast Pay)
    const praticheScontatePendenti = vendite.filter(v => !v.incassato && v.sconto && v.sconto.trim() !== '');
    const volumeScontatiPendenti = praticheScontatePendenti.reduce((acc, v) => acc + v.importo, 0);
    
    return { total, incassato, pendente, count, fastPayCount: praticheScontatePendenti.length, fastPayVolume: volumeScontatiPendenti };
  }, [vendite]);

  // Ordinamento per priorità di incasso
  const pendentiOrdinati = useMemo(() => {
    return vendite
      .filter(v => !v.incassato)
      .sort((a, b) => {
        // Priorità alle pratiche scontate (Fast Pay)
        if (a.sconto && !b.sconto) return -1;
        if (!a.sconto && b.sconto) return 1;
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      });
  }, [vendite]);

  // Dati per il grafico dei metodi di pagamento
  const methodChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    vendite.forEach(v => {
      groups[v.metodoPagamento] = (groups[v.metodoPagamento] || 0) + v.importo;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [vendite]);

  const COLORS = ['#32964D', '#2d8444', '#28753c', '#1f5a2e', '#4ade80', '#166534'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* SEZIONE ALERT PRIORITÀ (SCADENZE + FAST PAY) */}
      {isAdmin && pendentiOrdinati.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-rose-500/5 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Priorità di Incasso (Sconti Attivi)</h3>
                <p className="text-slate-500 text-xs mt-0.5">Pratiche con sconto applicato: il cliente ha scelto il pagamento veloce.</p>
              </div>
            </div>
            {stats.fastPayCount > 0 && (
              <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
                {stats.fastPayCount} Pratiche Fast-Pay
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dal</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sconto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendentiOrdinati.slice(0, 5).map((v) => (
                  <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${v.sconto ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-4">
                      {v.sconto ? <Zap className="w-4 h-4 text-amber-500" /> : <Clock className="w-4 h-4 text-slate-300" />}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase">{v.cliente}</td>
                    <td className="px-4 py-4 text-sm font-black text-rose-600">€ {v.importo.toLocaleString('it-IT')}</td>
                    <td className="px-4 py-4">
                       {v.sconto ? (
                         <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">{v.sconto}</span>
                       ) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOX STATISTICHE PRINCIPALI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-2xl text-[#32964D]"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume Totale</p>
              <h4 className="text-2xl font-black text-slate-900">€ {stats.total.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-[#32964D] p-3 rounded-2xl text-white"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Incassato</p>
              <h4 className="text-2xl font-black text-[#32964D]">€ {stats.incassato.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 bg-gradient-to-br from-white to-amber-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-500/20"><Zap className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Fast-Pay Pendenti</p>
              <h4 className="text-2xl font-black text-amber-700">€ {stats.fastPayVolume.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Totale Da Incassare</p>
              <h4 className="text-2xl font-black text-rose-600">€ {stats.pendente.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* GRAFICI DETTAGLIATI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* VOLUME PER METODO */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-8">
            <DollarSign className="w-5 h-5 text-[#32964D]" />
            <h3 className="text-lg font-bold text-slate-800">Volume per Metodo Pagamento</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {methodChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ANALISI LIQUIDITÀ */}
        <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-center">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-widest text-emerald-400">Efficienza Incasso Totale</h3>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Hai incassato il <b>{((stats.incassato / stats.total) * 100 || 0).toFixed(1)}%</b> del fatturato totale.
            </p>
            <div className="w-full bg-emerald-950/50 h-4 rounded-full overflow-hidden border border-emerald-800/50">
              <div 
                className="bg-emerald-400 h-full transition-all duration-1000 shadow-[0_0_20px_rgba(52,211,153,0.4)]" 
                style={{ width: `${(stats.incassato / stats.total) * 100 || 0}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400/60">
               <span>Inizio</span>
               <span>Obiettivo 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
