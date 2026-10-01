import React from 'react';
import { User } from '../types/crm';
import { ShieldCheck, UserCheck, LogOut, Sun, Moon } from 'lucide-react';
import { getInitials } from '../utils/formatters';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const isGestor = currentUser.role === 'gestor';

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-black/10 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Azul e Preto) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            F
          </div>
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight text-black dark:text-white block">
              FluxoCRM
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold block">
              Funil Comercial Kanban
            </span>
          </div>
        </div>

        {/* Zone 2: Contextual Role Status Indicator */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {isGestor ? (
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
            <span className="font-bold text-black dark:text-white">
              {isGestor ? 'Gestão Comercial' : 'Executivo de Vendas'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              {isGestor
                ? 'Funil Kanban, Vendedores & Homologação CNAE'
                : 'Funil Kanban, Tarefas & Atualização de Clientes'}
            </span>
          </div>
        </div>

        {/* Zone 3: Dark Mode, Active User Profile & Logout Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600" />
            )}
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 p-1.5 pl-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-black dark:text-white block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                {isGestor ? 'Gestor' : 'Vendedor'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-black dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {getInitials(currentUser.name)}
            </div>
          </div>

          {/* Logout Button (Takes user back to Login Screen) */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
            title="Sair do sistema e voltar para a tela de login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
