import React from 'react';
import { LogOut, Package, History, User as UserIcon, ArrowLeftRight, Receipt } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header Expandido */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="logo.svg" alt="Logo EquipManager" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">EquipManager</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full border border-zinc-200">
              <UserIcon className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700">{user?.username || user?.rf || user?.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Expandido */}
      <div className="bg-white border-b border-zinc-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-10 overflow-x-auto hide-scrollbar align-middle">
            <button
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'inventory'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              <Package className="w-4 h-4" />
              Estoque
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'loans'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Empréstimos
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'logs'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              <History className="w-4 h-4" />
              Logs de Movimentação
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'users'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <UserIcon className="w-4 h-4" />
                  Usuários
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'expenses'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <Receipt className="w-4 h-4" />
                  Compras
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Expandido */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer Expandido */}
      <footer className="bg-white border-t border-zinc-200 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} EquipManager - Controle de Equipamentos
        </div>
      </footer>
    </div>
  );
}