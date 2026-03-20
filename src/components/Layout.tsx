import React from 'react';
import { auth } from '../firebase';
import { LogOut, Package, History, User as UserIcon, ArrowLeftRight, DollarSign } from 'lucide-react';
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
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">EquipManager</h1>
          </div>

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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                activeTab === 'inventory'
                  ? "border-emerald-600 text-emerald-600"
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
                  ? "border-emerald-600 text-emerald-600"
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
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              <History className="w-4 h-4" />
              Logs de Movimentação
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'expenses'
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Compras
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                    activeTab === 'users'
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <UserIcon className="w-4 h-4" />
                  Usuários
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} EquipManager - Controle de Equipamentos
        </div>
      </footer>
    </div>
  );
}
