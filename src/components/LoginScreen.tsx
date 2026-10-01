import React, { useState } from 'react';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  AlertCircle, 
  Sun, 
  Moon, 
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types/crm';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submission and validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);

    // Look for matching user by email
    const foundUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.active
    );

    if (!foundUser) {
      setIsSubmitting(false);
      setErrorMessage('Nenhuma conta ativa encontrada com este e-mail.');
      return;
    }

    // Password validation (matches user.password or default '123456')
    const validPassword = foundUser.password || '123456';
    if (cleanPass !== validPassword) {
      setIsSubmitting(false);
      setErrorMessage('Senha incorreta. Verifique os dados digitados e tente novamente.');
      return;
    }

    // Success login
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(foundUser);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-black dark:text-white flex flex-col justify-between transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            F
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-black dark:text-white block leading-tight">
              FluxoCRM
            </span>
            <span className="text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-blue-400">
              Sistema Comercial & Funil Kanban
            </span>
          </div>
        </div>

        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-2xs"
          title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Modo Escuro</span>
            </>
          )}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
          {/* Header Banner - Azul e Preto */}
          <div className="bg-black dark:bg-slate-950 p-6 sm:p-7 text-white border-b-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                Portal de Acesso
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Entrar no Sistema
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Informe seu e-mail e senha cadastrados para iniciar sua sessão comercial.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-tight font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Credentials Form (Email & Password Only) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-slate-200 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-black dark:text-slate-200">
                    Senha
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button: Azul e Preto */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-500">
        FluxoCRM · Sistema Comercial e Funil de Vendas Kanban · Design em Azul e Preto
      </footer>
    </div>
  );
};
