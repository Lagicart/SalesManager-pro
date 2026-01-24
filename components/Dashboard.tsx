import React, { useMemo } from 'react';
import { Vendita } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, PieChart, TrendingUp, AlertTriangle, Clock, Calendar, Users } from 'lucide-react';

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

  const methodChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    vendite.forEach(v => {
      groups[v.metodoPagamento] = (groups[v.metodoPagamento] || 0) + v.importo;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [vendite]);

  const agentChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    vendite.forEach(v => {
      groups[v.agente] = (groups[v.agente] || 0) + v.importo;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [vendite]);

  const COLORS = ['#32964D', '#2d8444', '#28753c', '#1f5a2e', '#4ade80', '#166534'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* SEZIONE ALERT SCADENZE */}
      {isAdmin && pendentiOrdinati.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-rose-500/5 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-lg shadow-rose-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Crediti Prioritari in Sospeso</h3>
                <p className="text-slate-500 text-xs mt-0.5">Le pratiche più datate che richiedono incasso immediato.</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dal</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendentiOrdinati.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-slate-600">{new Date(v.data).toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900">{v.cliente}</td>
                    <td className="px-4 py-4 text-sm font-black text-rose-600">€ {v.importo.toLocaleString('it-IT')}</td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500 italic">{v.agente}</td>
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Da Incassare</p>
              <h4 className="text-2xl font-black text-rose-600">€ {stats.pendente.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl text-slate-600"><PieChart className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pratiche</p>
              <h4 className="text-2xl font-black text-slate-900">{stats.count}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* GRAFICI DETTAGLIATI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* VOLUME PER AGENTE */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-8">
            <Users className="w-5 h-5 text-[#32964D]" />
            <h3 className="text-lg font-bold text-slate-800">Volume Vendite per Agente</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {agentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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

        {/* LIQUIDITÀ */}
        <div className="lg:col-span-2 bg-emerald-900 p-8 rounded-3xl shadow-xl text-white">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-widest text-emerald-400">Analisi Liquidità Aziendale</h3>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Attualmente hai incassato il <b>{((stats.incassato / stats.total) * 100 || 0).toFixed(1)}%</b> del fatturato registrato nel periodo selezionato.
            </p>
            <div className="relative pt-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest mb-3 text-emerald-400">
                <span>Efficienza Incasso</span>
                <span>{((stats.incassato / stats.total) * 100 || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 h-6 rounded-full overflow-hidden border border-white/5 p-1">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full transition-all duration-1000 shadow-lg" 
                  style={{ width: `${(stats.incassato / stats.total) * 100 || 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;