import React from 'react';
import { Operatore } from '../types';
import { LogOut, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: Operatore;
  onLogout: () => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 px-1">
        <span>Sessione Attiva</span>
        <Lock className="w-3 h-3" />
      </div>
      
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${currentUser.role === 'admin' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[#32964D] text-white shadow-lg shadow-[#32964D]/20'}`}>
          {currentUser.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate text-sm text-white">{currentUser.nome}</span>
          <span className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tight">{currentUser.role}</span>
        </div>
      </div>

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