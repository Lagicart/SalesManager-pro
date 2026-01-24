
import React from 'react';
import { Operatore } from '../types';
import { LogOut, ShieldCheck, User as UserIcon, Lock, Users, RotateCcw } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: Operatore;
  operatori: Operatore[];
  onLogout: () => void;
  viewAsEmail: string | null;
  onViewAsChange: (email: string | null) => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, operatori, onLogout, viewAsEmail, onViewAsChange }) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 px-1">
        <span>Sessione Attiva</span>
        <Lock className="w-3 h-3" />
      </div>
      
      <div className={`p-4 rounded-2xl border transition-all ${isAdmin ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'} flex items-center gap-3`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20'}`}>
          {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate text-sm text-white">{currentUser.nome}</span>
          <span className={`text-[10px] truncate uppercase font-bold tracking-tight ${isAdmin ? 'text-amber-500' : 'text-slate-500'}`}>{currentUser.role}</span>
        </div>
      </div>

      {/* SELETTORE VISTA PER ADMIN */}
      {isAdmin && (
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Filtra Vista Per
            </label>
            {viewAsEmail && (
              <button 
                onClick={() => onViewAsChange(null)}
                className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
            )}
          </div>
          <select 
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-amber-500 transition-all cursor-pointer"
            value={viewAsEmail || ''}
            onChange={(e) => onViewAsChange(e.target.value || null)}
          >
            <option value="">Tutta l'Azienda</option>
            {operatori.filter(o => o.role !== 'admin' || o.email !== currentUser.email).map(op => (
              <option key={op.id} value={op.email}>{op.nome}</option>
            ))}
          </select>
          {viewAsEmail && (
            <p className="text-[9px] text-amber-500/70 italic leading-tight">
              Stai visualizzando l'app come se fossi l'operatore selezionato.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (window.confirm("Sei sicuro di voler uscire?")) {
            onLogout();
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-bold text-xs"
      >
        <LogOut className="w-4 h-4" /> DISCONNETTI
      </button>
    </div>
  );
};

export default UserSwitcher;
