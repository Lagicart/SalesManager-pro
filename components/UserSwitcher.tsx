
import React from 'react';
import { Operatore } from '../types';
import { LogOut, ShieldCheck, User as UserIcon, Lock, Users, RotateCcw, LayoutGrid } from 'lucide-react';

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
      
      {/* Box Profilo Principale */}
      <div className={`p-4 rounded-2xl border transition-all ${isAdmin ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5' : 'bg-white/5 border-white/10'} flex items-center gap-3 mb-6`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20'}`}>
          {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate text-sm text-white uppercase">{currentUser.nome}</span>
          <span className={`text-[10px] truncate uppercase font-black tracking-tight ${isAdmin ? 'text-amber-500' : 'text-slate-500'}`}>{currentUser.role}</span>
        </div>
      </div>

      {/* SEZIONE PULSANTI NAVIGAZIONE PER ADMIN */}
      {isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Filtra Vista
            </label>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Pulsante Vista Totale */}
            <button
              onClick={() => onViewAsChange(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${!viewAsEmail ? 'bg-[#32964D] border-[#32964D] text-white shadow-lg shadow-[#32964D]/20' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${!viewAsEmail ? 'bg-white/20' : 'bg-slate-800'}`}>
                <LayoutGrid className="w-3 h-3" />
              </div>
              <span>TUTTA L'AZIENDA</span>
            </button>

            {/* Lista Operatori come Pulsanti */}
            {operatori
              .filter(o => o.role !== 'admin' || o.email !== currentUser.email)
              .map(op => (
                <button
                  key={op.id}
                  onClick={() => onViewAsChange(op.email)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${viewAsEmail === op.email ? 'bg-[#32964D] border-[#32964D] text-white shadow-lg shadow-[#32964D]/20 scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${viewAsEmail === op.email ? 'bg-white/20' : 'bg-slate-800 text-slate-500'}`}>
                    {op.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate uppercase">{op.nome}</span>
                </button>
              ))
            }
          </div>
          
          {viewAsEmail && (
            <p className="text-[9px] text-amber-500/70 italic leading-tight px-1 animate-pulse">
              ● Modalità simulazione attiva
            </p>
          )}
        </div>
      )}

      <div className="pt-4 mt-4 border-t border-white/5">
        <button
          onClick={() => {
            if (window.confirm("Sei sicuro di voler uscire?")) {
              onLogout();
            }
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] tracking-widest uppercase border border-rose-500/20"
        >
          <LogOut className="w-3 h-3" /> DISCONNETTI
        </button>
      </div>
    </div>
  );
};

export default UserSwitcher;
