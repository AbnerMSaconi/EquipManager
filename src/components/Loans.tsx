import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight, Calendar, User, MapPin, CheckCircle2, X, AlertTriangle
} from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import Pagination, { usePagination, type PageSize } from './Pagination';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Loans() {
  const [loans, setLoans] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModal, setReturnModal] = useState<Log | null>(null);
  const [returnData, setReturnData] = useState({ hasDamage: false, isBroken: false, observations: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const fetchLoans = async () => {
    try {
      const data = await api.get('/loans');
      setLoans(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal) return;
    try {
      await api.post(`/loans/${returnModal.id}/return`, {
        observations: returnData.hasDamage ? `Avaria: ${returnData.observations}` : null,
        isBroken: returnData.hasDamage && returnData.isBroken,
      });
      setReturnModal(null);
      setReturnData({ hasDamage: false, isBroken: false, observations: '' });
      fetchLoans();
    } catch { alert('Erro ao processar devolução.'); }
  };

  const overdueCount = loans.filter(l => l.returnDeadline && new Date(l.returnDeadline) < new Date()).length;
  const { paginated: pagedLoans } = usePagination(loans, page, pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Empréstimos Ativos</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loans.length} ativo{loans.length !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <span className="text-red-500 font-semibold"> · {overdueCount} em atraso</span>
            )}
          </p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{overdueCount}</strong> empréstimo{overdueCount !== 1 ? 's' : ''} com prazo vencido</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
          <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Nenhum item em empréstimo</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {pagedLoans.map((loan) => {
              const isOverdue = loan.returnDeadline && new Date(loan.returnDeadline) < new Date();
              return (
                <div key={loan.id} className={cn(
                  "flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50/60 transition-colors",
                  isOverdue && "bg-red-50/40"
                )}>
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    isOverdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                  )}>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900 truncate">
                        {loan.quantity}x {loan.itemName}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          Atrasado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {loan.userIdentifier || loan.userEmail}
                      </span>
                      {loan.destination && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{loan.destination}</span>
                        </span>
                      )}
                      {loan.returnDeadline && (
                        <span className={cn(
                          "text-xs font-medium flex items-center gap-1",
                          isOverdue ? "text-red-600" : "text-amber-600"
                        )}>
                          <Calendar className="w-3 h-3" />
                          Dev: {format(new Date(loan.returnDeadline), 'dd/MM/yy')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Devolver button */}
                  <button
                    onClick={() => {
                      setReturnData({ hasDamage: false, isBroken: false, observations: '' });
                      setReturnModal(loan);
                    }}
                    className="shrink-0 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Devolver</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {loans.length > 0 && (
        <Pagination
          total={loans.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
        />
      )}

      {/* Return Modal */}
      <AnimatePresence>
        {returnModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Confirmar Devolução</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{returnModal.quantity}x {returnModal.itemName}</p>
                </div>
                <button onClick={() => setReturnModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
                {/* Damage checkbox */}
                <label className="flex items-start gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={returnData.hasDamage}
                    onChange={(e) => setReturnData({ ...returnData, hasDamage: e.target.checked, isBroken: false })}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-zinc-800">Item devolvido com avaria?</span>
                    <p className="text-xs text-zinc-400 mt-0.5">Marque se o item apresenta algum dano</p>
                  </div>
                </label>

                {returnData.hasDamage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <label className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={returnData.isBroken}
                        onChange={(e) => setReturnData({ ...returnData, isBroken: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-red-600 rounded"
                      />
                      <div>
                        <span className="text-sm font-bold text-red-700">Item inoperante (Registrar Quebra)</span>
                        <p className="text-xs text-red-500 mt-0.5">Item não retorna ao estoque</p>
                      </div>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Descreva a avaria..."
                      value={returnData.observations}
                      onChange={(e) => setReturnData({ ...returnData, observations: e.target.value })}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl resize-none text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={cn(
                    "w-full text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors",
                    returnData.isBroken ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
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