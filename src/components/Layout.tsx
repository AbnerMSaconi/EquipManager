import React, { useState } from 'react';
import { LogOut, Package, History, User as UserIcon, ArrowLeftRight, Receipt, Settings } from 'lucide-react';
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
  onUserUpdate: (user: any, token: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onLogout, onUserUpdate }: LayoutProps) {
  const [showProfile, setShowProfile] = useState(false);

  const tabs = [
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'loans', label: 'Empréstimos', icon: ArrowLeftRight },
    { id: 'logs', label: 'Movimentações', icon: History },
    ...(user?.role === 'admin' ? [
      { id: 'users', label: 'Usuários', icon: UserIcon },
      { id: 'expenses', label: 'Compras', icon: Receipt },
    ] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="w-full px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3 relative">
          
          {/* 1. Lado Esquerdo (Vazio para equilibrar o flex) */}
          <div className="flex-1">
          <img src="logo.svg" alt="Logo" className="h-7 w-auto shrink-0" />
          </div>
          {/* 2. Centro Absoluto (Logo e H1 centralizados) */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 min-w-0 cursor-pointer" 
            onClick={() => setActiveTab('inventory')}
          >
            <h1 className="text-base font-bold text-zinc-900 tracking-tight hidden sm:block">
              EquipManager
            </h1>
          </div>

          {/* 3. Lado Direito (Perfil do usuário, botão de sair) */}
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2">
              {/* User pill - desktop */}
              <button
                onClick={() => setShowProfile(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full border border-zinc-200 transition-colors group"
              >
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white uppercase">
                    {(user?.username || user?.rf || '?')[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-zinc-700 max-w-[120px] truncate">
                  {user?.username || user?.rf}
                </span>
                <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />
              </button>

              {/* Settings - mobile only */}
              <button
                onClick={() => setShowProfile(true)}
                className="sm:hidden p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                title="Meu Perfil"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Nav Tabs */}
      <div className="bg-white border-b border-zinc-200">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide gap-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={cn(
                  "flex items-center gap-1.5 py-3.5 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors shrink-0",
                  activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">{label}</span>
                <span className="xs:hidden sm:hidden">{activeTab === id ? label : ''}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-100 py-4">
        <div className="w-full px-4 text-center text-zinc-400 text-xs">
          &copy; {new Date().getFullYear()} EquipManager
        </div>
      </footer>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onUserUpdate={(u, t) => {
              onUserUpdate(u, t);
              setShowProfile(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}