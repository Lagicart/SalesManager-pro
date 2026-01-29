
import React, { useMemo } from 'react';
import { Vendita } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Clock, Users, User, ArrowUpRight, ListOrdered } from 'lucide-react';

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
    const countPendenti = vendite.filter(v => !v.incassato).length;
    
    return { total, incassato, pendente, countPendenti };
  }, [vendite]);

  // Priorità di incasso: dal più vecchio al più recente (solo pendenti)
  const pendentiOrdinati = useMemo(() => {
    return vendite
      .filter(v => !v.incassato)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [vendite]);

  // Classifica Agenti per Volume Vendite (Incassato + Pendente)
  const agentChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    vendite.forEach(v => {
      groups[v.agente] = (groups[v.agente] || 0) + v.importo;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Primi 10 agenti
  }, [vendite]);

  // Top 8 Clienti con debito più alto (Pendente)
  const topDebitori = useMemo(() => {
    const clients: Record<string, { importo: number, agente: string }> = {};
    vendite.filter(v => !v.incassato).forEach(v => {
      if (!clients[v.cliente]) {
        clients[v.cliente] = { importo: 0, agente: v.agente };
      }
      clients[v.cliente].importo += v.importo;
    });
    
    return Object.entries(clients)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.importo - a.importo)
      .slice(0, 8);
  }, [vendite]);

  const COLORS = ['#32964D', '#2d8444', '#28753c', '#1f5a2e', '#4ade80', '#166534', '#064e3b', '#065f46'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* BOX STATISTICHE PRINCIPALI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-2xl text-[#32964D]"><ArrowUpRight className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume Vendite</p>
              <h4 className="text-2xl font-black text-slate-900">€ {stats.total.toLocaleString('it-IT')}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-[#32964D] p-3 rounded-2xl text-white"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume Incassato</p>
              <h4 className="text-2xl font-black text-[#32964D]">€ {stats.incassato.toLocaleString('it-IT')}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Volume Pendente</p>
              <h4 className="text-2xl font-black text-rose-600">€ {stats.pendente.toLocaleString('it-IT')}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl text-slate-400"><ListOrdered className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pratiche Aperte</p>
              <h4 className="text-2xl font-black text-slate-600">{stats.countPendenti}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE PRIORITÀ INCASSI */}
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Priorità di Incasso</h3>
            <p className="text-slate-500 text-xs font-bold mt-0.5 uppercase tracking-wide">Pratiche pendenti ordinate per anzianità (dalle più vecchie)</p>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sconto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendentiOrdinati.length > 0 ? pendentiOrdinati.map((v) => {
                  const days = Math.floor((new Date().getTime() - new Date(v.data).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-600">{new Date(v.data).toLocaleDateString('it-IT')}</div>
                        <div className={`text-[9px] font-black uppercase ${days > 15 ? 'text-rose-500' : 'text-amber-500'}`}>{days} giorni fa</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900 uppercase tracking-tight">{v.cliente}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                          <User className="w-3 h-3" /> {v.agente}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {v.sconto ? (
                          <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">{v.sconto}</span>
                        ) : <span className="text-slate-200">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">€ {v.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Nessuna pratica pendente in archivio</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GRAFICI E CLASSIFICHE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP AGENTI PER VENDITE */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-8">
            <Users className="w-5 h-5 text-[#32964D]" />
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Performance Team Agenti</h3>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {agentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP 8 DEBITORI (CLIENTI) */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
          <div className="flex items-center gap-2 mb-8">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold uppercase tracking-tighter">Top 8 Clienti per Debito</h3>
          </div>
          <div className="space-y-4">
            {topDebitori.length > 0 ? topDebitori.map((deb, i) => (
              <div key={deb.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">{i + 1}</div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight truncate max-w-[140px]">{deb.name}</h4>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{deb.agente}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-400">€ {deb.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Pendente</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-500 italic uppercase font-black text-xs tracking-widest">Nessun debito rilevato</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
