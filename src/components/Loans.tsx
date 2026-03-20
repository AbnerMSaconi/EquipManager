import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Calendar, User, MapPin, Clock, CheckCircle2, LayoutGrid, List, Download, X, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Loans() {
  const [loans, setLoans] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showReturnModal, setShowReturnModal] = useState<Log | null>(null);
  const [returnData, setReturnData] = useState({ isDamaged: false, damageDescription: '', isOperational: true });

  const fetchLoans = async () => {
    try {
      const data = await api.get('/loans');
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;

    try {
      await api.post(`/loans/${showReturnModal.id}/return`, returnData);
      fetchLoans();
      setShowReturnModal(null);
      setReturnData({ isDamaged: false, damageDescription: '', isOperational: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const exportData = loans.map(log => ({
      'ID do Item': log.itemId,
      'Nome do Item': log.itemName,
      'Quantidade': log.quantity,
      'Usuário': log.userIdentifier || log.userEmail,
      'Ação': log.actionType,
      'Local de Destino': log.destination || '',
      'Data de Devolução': log.returnDeadline ? format(new Date(log.returnDeadline), 'dd/MM/yyyy') : '',
      'Status da Devolução': log.status || ''
    }));
    exportToCSV(exportData, 'emprestimos.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900">Empréstimos Ativos</h2>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" /> Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum item em empréstimo no momento.</p>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "flex flex-col gap-4"
        )}>
          {loans.map(loan => {
            const isOverdue = loan.returnDeadline && new Date(loan.returnDeadline) < new Date();
            return (
              <div
                key={loan.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow flex",
                  viewMode === 'list' ? "flex-col md:flex-row md:items-center gap-4" : "flex-col gap-4",
                  isOverdue ? "border-red-200" : "border-zinc-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-zinc-100 text-zinc-900">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  
                  {viewMode === 'grid' && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          Empréstimo
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 truncate">
                        {loan.quantity}x {loan.itemName}
                      </h3>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {viewMode === 'list' && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          Empréstimo
                        </span>
                        <span className="text-xs text-zinc-400">
                          Retirado em: {loan.timestamp ? format(new Date(loan.timestamp), "dd/MM/yyyy", { locale: ptBR }) : '...'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 truncate">
                        {loan.quantity}x {loan.itemName}
                      </h3>
                    </>
                  )}
                  
                  {viewMode === 'grid' && (
                    <div className="text-xs text-zinc-400 mb-2">
                      Retirado em: {loan.timestamp ? format(new Date(loan.timestamp), "dd/MM/yyyy", { locale: ptBR }) : '...'}
                    </div>
                  )}

                  <div className={cn("flex flex-wrap gap-4", viewMode === 'list' ? "mt-2" : "mt-0 flex-col gap-2")}>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <User className="w-3.5 h-3.5" />
                      {loan.userIdentifier || loan.userEmail}
                    </div>
                    {loan.destination && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {loan.destination}
                      </div>
                    )}
                    {loan.returnDeadline && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs font-medium",
                        isOverdue ? "text-red-600" : "text-amber-600"
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                        {isOverdue ? 'Atrasado: ' : 'Devolução: '}
                        {format(new Date(loan.returnDeadline), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowReturnModal(loan);
                    setReturnData({ isDamaged: false, damageDescription: '', isOperational: true });
                  }}
                  className={cn(
                    "bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                    viewMode === 'list' ? "w-full md:w-auto" : "w-full mt-2"
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" /> Devolver
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">Confirmar Devolução</h2>
                <button onClick={() => setShowReturnModal(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100">
                <p className="text-sm text-zinc-500">Equipamento:</p>
                <p className="font-bold text-zinc-900">{showReturnModal.quantity}x {showReturnModal.itemName}</p>
                <p className="text-xs text-zinc-400 mt-1">Responsável: {showReturnModal.userIdentifier || showReturnModal.userEmail}</p>
              </div>
              <form onSubmit={handleReturn} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        returnData.isDamaged ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {returnData.isDamaged ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Houve avaria?</p>
                        <p className="text-xs text-zinc-500">{returnData.isDamaged ? 'Sim, o item possui danos' : 'Não, o item está íntegro'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReturnData({ ...returnData, isDamaged: !returnData.isDamaged })}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        returnData.isDamaged ? "bg-red-600" : "bg-zinc-200"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        returnData.isDamaged ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {returnData.isDamaged && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição da Avaria</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Descreva o dano ocorrido..."
                          value={returnData.damageDescription}
                          onChange={(e) => setReturnData({ ...returnData, damageDescription: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            returnData.isOperational ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                          )}>
                            {returnData.isOperational ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">Ainda está operante?</p>
                            <p className="text-xs text-zinc-500">{returnData.isOperational ? 'Sim, pode ser usado' : 'Não, precisa de reparo/descarte'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReturnData({ ...returnData, isOperational: !returnData.isOperational })}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            returnData.isOperational ? "bg-emerald-600" : "bg-zinc-200"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            returnData.isOperational ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-zinc-100 transition-all"
                >
                  Confirmar Devolução
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
