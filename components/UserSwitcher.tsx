
import React from 'react';
import { Operatore } from '../types';
import { RefreshCcw, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: Operatore;
  operatori: Operatore[];
  onSwitch: (user: Operatore) => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, operatori, onSwitch }) => {
  const isAdmin = currentUser.role === 'admin';
  const visibleUsers = isAdmin 
    ? operatori 
    : operatori.filter(u => u.id === currentUser.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">
        <span>{isAdmin ? 'Gestione Sessioni' : 'Profilo Attivo'}</span>
        {isAdmin ? <RefreshCcw className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {visibleUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => isAdmin && onSwitch(u)}
            disabled={!isAdmin}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${currentUser.email === u.email ? 'bg-[#32964D]/20 text-[#32964D] ring-1 ring-[#32964D]/50' : 'hover:bg-slate-800/50 text-slate-400'} ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
              {u.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold truncate text-sm">{u.nome}</span>
              <span className="text-[10px] opacity-50 truncate">{u.email}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSwitcher;
