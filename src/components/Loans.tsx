import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Calendar, User, MapPin, CheckCircle2, LayoutGrid, List, X } from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Loans() {
  const [loans, setLoans] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [returnModal, setReturnModal] = useState<Log | null>(null);
  const [returnData, setReturnData] = useState({ hasDamage: false, isBroken: false, observations: '' });

  const fetchLoans = async () => {
    try {
      const data = await api.get('/loans');
      setLoans(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal) return;
    try {
      await api.post(`/loans/${returnModal.id}/return`, {
        observations: returnData.hasDamage ? `Avaria: ${returnData.observations}` : null,
        isBroken: returnData.hasDamage && returnData.isBroken
      });
      setReturnModal(null);
      setReturnData({ hasDamage: false, isBroken: false, observations: '' });
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert('Erro ao processar devolução.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Empréstimos Ativos</h2>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}><LayoutGrid className="w-5 h-5" /></button>
          <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}><List className="w-5 h-5" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-600 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Nenhum item em empréstimo.</p>
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4")}>
          {loans.map(loan => {
            const isOverdue = loan.returnDeadline && new Date(loan.returnDeadline) < new Date();
            return (
              <div key={loan.id} className={cn("bg-white dark:bg-zinc-900 rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 transition-colors", isOverdue ? "border-red-200 dark:border-red-900/50" : "border-zinc-200 dark:border-zinc-800")}>
                <div className="flex items-center gap-3 md:hidden">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1">{loan.quantity}x {loan.itemName}</h3>
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="hidden md:block mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mr-2">Empréstimo</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Retirado: {loan.timestamp ? format(new Date(loan.timestamp), "dd/MM/yyyy") : '...'}</span>
                  </div>
                  <h3 className="hidden md:block text-base font-bold text-zinc-900 dark:text-zinc-100 truncate mb-2">{loan.quantity}x {loan.itemName}</h3>

                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded w-fit"><User className="w-3.5 h-3.5" />{loan.userIdentifier || loan.userEmail}</div>
                    {loan.destination && <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded w-fit"><MapPin className="w-3.5 h-3.5" />{loan.destination}</div>}
                    {loan.returnDeadline && (
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded w-fit", isOverdue ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20")}>
                        <Calendar className="w-3.5 h-3.5" /> {isOverdue ? 'Atrasado: ' : 'Devolução: '}{format(new Date(loan.returnDeadline), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => { setReturnData({ hasDamage: false, isBroken: false, observations: '' }); setReturnModal(loan); }} 
                  className="w-full md:w-auto bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-3 md:py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                  <CheckCircle2 className="w-5 h-5" /> Devolver
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {returnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden border dark:border-zinc-800">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Confirmar Devolução</h2>
                <button onClick={() => setReturnModal(null)}><X className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300" /></button>
              </div>
              <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2">
                    <input type="checkbox" id="damage" checked={returnData.hasDamage} onChange={(e) => setReturnData({...returnData, hasDamage: e.target.checked, isBroken: false})} className="w-4 h-4 text-emerald-600 rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700" />
                    <label htmlFor="damage" className="text-sm font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">Devolvido com avaria?</label>
                  </div>
                  {returnData.hasDamage && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/50">
                        <input type="checkbox" id="broken" checked={returnData.isBroken} onChange={(e) => setReturnData({...returnData, isBroken: e.target.checked})} className="w-4 h-4 text-red-600 rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700" />
                        <label htmlFor="broken" className="text-sm font-bold text-red-700 dark:text-red-400 cursor-pointer">Item inoperante (Registrar Quebra)</label>
                      </div>
                      <textarea required rows={2} placeholder="Descreva a avaria..." value={returnData.observations} onChange={(e) => setReturnData({...returnData, observations: e.target.value})} className="w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:ring-2 focus:ring-emerald-500 dark:text-zinc-100" />
                    </div>
                  )}
                </div>
                <button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl transition-colors", returnData.isBroken ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}>
                  {returnData.isBroken ? 'Confirmar Quebra' : 'Confirmar Devolução'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}