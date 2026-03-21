import React, { useState, useEffect } from 'react';
import { LogOut, Package, History, User as UserIcon, ArrowLeftRight, Receipt, Sun, Moon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence } from 'motion/react';
import ProfileModal from './ProfileModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'inventory' | 'logs' | 'loans' | 'users' | 'expenses';
  setActiveTab: (tab: 'inventory' | 'logs' | 'loans' | 'users' | 'expenses') => void;
  user: any;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Tema Noturno
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleUserUpdate = (updatedUser: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (token) {
      localStorage.setItem('token', token);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="logo.svg" alt="Logo EquipManager" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">EquipManager</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Tag do Usuário que abre o ProfileModal original */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full border border-zinc-200 dark:border-zinc-700 transition-colors duration-200 group"
              title="Editar Meu Perfil"
            >
              <UserIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{user?.username || user?.rf || user?.email}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'inventory'
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Package className="w-4 h-4" /> Estoque
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'loans'
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <ArrowLeftRight className="w-4 h-4" /> Empréstimos
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'logs'
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <History className="w-4 h-4" /> Movimentações
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'users'
                      ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <UserIcon className="w-4 h-4" /> Usuários
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'expenses'
                      ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <Receipt className="w-4 h-4" /> Compras
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-6 transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
          &copy; {new Date().getFullYear()} EquipManager - Controle de Equipamentos
        </div>
      </footer>

      {/* Componente Dedicado: Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}