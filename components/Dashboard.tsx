
import React, { useMemo } from 'react';
import { Vendita } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, PieChart, TrendingUp, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface DashboardProps {
  vendite: Vendita[];
  isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ vendite, isAdmin }) => {
  const stats = useMemo(() => {
    const total = vendite.reduce((acc, v) => acc + v.importo, 0);
    const incassato = vendite.filter(v => v.incassato).reduce((acc, v) => acc + v.importo, 0);
    const pendente = total - incassato;
    const count = vendite.length;
    
    return { total, incassato, pendente, count };
  }, [vendite]);

  const pendentiOrdinati = useMemo(() => {
    return vendite
      .filter(v => !v.incassato)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [vendite]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    vendite.forEach(v => {
      groups[v.metodoPagamento] = (groups[v.metodoPagamento] || 0) + v.importo;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [vendite]);

  const COLORS = ['#32964D', '#2d8444', '#28753c', '#1f5a2e'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {isAdmin && (
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-rose-500/5 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-lg shadow-rose-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Scadenzario Crediti Prioritari</h3>
                <p className="text-slate-500 text-xs mt-0.5">I crediti più vecchi richiedono attenzione immediata.</p>
              </div>
            </div>
            <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold border border-rose-200">
              {pendentiOrdinati.length} in sospeso
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">In sospeso dal</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priorità</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendentiOrdinati.map((v) => {
                  const diffDays = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 3600 * 24));
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4 text-sm font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(v.data).toLocaleDateString('it-IT')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">{v.cliente}</td>
                      <td className="px-4 py-4 text-sm font-black text-rose-600">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500">{v.agente}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${diffDays > 30 ? 'bg-rose-600 text-white' : diffDays > 15 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-50'}`}>
                          {diffDays > 30 ? 'Critica' : diffDays > 15 ? 'Alta' : 'Recente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-[#32964D]"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Totale Vendite</p>
              <h4 className="text-2xl font-black text-slate-900">€ {stats.total.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100/50 p-3 rounded-xl text-[#32964D]"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Incassato</p>
              <h4 className="text-2xl font-black text-slate-900">€ {stats.incassato.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pendente</p>
              <h4 className="text-2xl font-black text-slate-900">€ {stats.pendente.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-xl text-slate-600"><PieChart className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pratiche</p>
              <h4 className="text-2xl font-black text-slate-900">{stats.count}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Volume per Metodo Pagamento</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Analisi Liquidità</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">Attualmente hai incassato il <b>{((stats.incassato / stats.total) * 100 || 0).toFixed(1)}%</b> del fatturato registrato.</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-600 tracking-tight">Efficienza Riscossione</span>
              <span className="text-[#32964D]">{((stats.incassato / stats.total) * 100 || 0).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div className="bg-[#32964D] h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(stats.incassato / stats.total) * 100 || 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
