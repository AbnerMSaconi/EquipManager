import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Calendar, User, MapPin, CheckCircle2, LayoutGrid, List, Download, X, AlertTriangle } from 'lucide-react';
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
  const [returnModal, setReturnModal] = useState<Log | null>(null);
  const [returnData, setReturnData] = useState({ hasDamage: false, isBroken: false, observations: '' });

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

  const openReturnModal = (loan: Log) => {
    setReturnData({ hasDamage: false, isBroken: false, observations: '' });
    setReturnModal(loan);
  };

  return (
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900">Empréstimos Ativos</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum item em empréstimo.</p>
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2")}>
  {loans.map(loan => {
    const isOverdue = loan.returnDeadline && new Date(loan.returnDeadline) < new Date();
    return (
      <div key={loan.id} className={cn(
        "bg-white rounded-xl border px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3",
        isOverdue ? "border-red-200" : "border-zinc-200"
      )}>

        {/* Ícone */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
          <ArrowUpRight className="w-4 h-4" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Linha 1: Badge + Nome */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              Empréstimo
            </span>
            <h3 className="text-sm font-bold text-zinc-900 truncate">{loan.quantity}x {loan.itemName}</h3>
          </div>

          {/* Linha 2: Metadados inline */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[120px]">{loan.userIdentifier || loan.userEmail}</span>
            </div>
            {loan.destination && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[100px]">{loan.destination}</span>
              </div>
            )}
            {loan.timestamp && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <span>Ret: {format(new Date(loan.timestamp), "dd/MM/yy")}</span>
              </div>
            )}
            {loan.returnDeadline && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", isOverdue ? "text-red-600" : "text-amber-600")}>
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{isOverdue ? 'Atrasado: ' : 'Dev: '}{format(new Date(loan.returnDeadline), 'dd/MM/yy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão Devolver */}
        <button
          onClick={() => openReturnModal(loan)}
          className="shrink-0 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Devolver
        </button>
      </div>
    );
  })}
</div>
      )}

      {/* Modal mantido inalterado */}
      <AnimatePresence>
        {returnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden"><div className="px-6 py-4 border-b flex justify-between"><h2 className="font-bold">Confirmar Devolução</h2><button onClick={() => setReturnModal(null)}><X className="w-5 h-5" /></button></div><form onSubmit={handleReturnSubmit} className="p-6 space-y-4"><div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200"><div className="flex gap-2"><input type="checkbox" id="damage" checked={returnData.hasDamage} onChange={(e) => setReturnData({...returnData, hasDamage: e.target.checked, isBroken: false})} className="w-4 h-4 text-blue-600 rounded" /><label htmlFor="damage" className="text-sm font-bold cursor-pointer">Devolvido com avaria?</label></div>{returnData.hasDamage && (<div className="mt-4 space-y-3"><div className="flex gap-2 bg-red-50 p-2 rounded border border-red-100"><input type="checkbox" id="broken" checked={returnData.isBroken} onChange={(e) => setReturnData({...returnData, isBroken: e.target.checked})} className="w-4 h-4 text-red-600 rounded" /><label htmlFor="broken" className="text-sm font-bold text-red-700 cursor-pointer">Item inoperante (Registrar Quebra)</label></div><textarea required rows={2} placeholder="Descreva a avaria..." value={returnData.observations} onChange={(e) => setReturnData({...returnData, observations: e.target.value})} className="w-full p-2 border rounded outline-none" /></div>)}</div><button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl", returnData.isBroken ? "bg-red-600" : "bg-blue-600")}>{returnData.isBroken ? 'Confirmar Quebra' : 'Confirmar Devolução'}</button></form></motion.div></div>
        )}
      </AnimatePresence>
    </div>
  );
}