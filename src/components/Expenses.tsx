import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Search, Download, FileText, TrendingUp, Filter } from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import Pagination, { usePagination, type PageSize } from './Pagination';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Expenses() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const data = await api.get(`/expenses?${params.toString()}`);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const filteredLogs = logs.filter(log =>
    log.itemName.toLowerCase().includes(search.toLowerCase()) ||
    log.userIdentifier?.toLowerCase().includes(search.toLowerCase()) ||
    log.actionType.toLowerCase().includes(search.toLowerCase())
  );

  const { paginated: pagedLogs } = usePagination(filteredLogs, page, pageSize);

  const totalExpense = filteredLogs.reduce((acc, log) => {
    return acc + (log.unitValue || 0) * log.quantity;
  }, 0);

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      'Data': format(new Date(log.timestamp!), 'dd/MM/yyyy HH:mm'),
      'Item': log.itemName,
      'Quantidade': log.quantity,
      'Valor Unitário': `R$ ${log.unitValue?.toFixed(2) || '0,00'}`,
      'Total': `R$ ${((log.unitValue || 0) * log.quantity).toFixed(2)}`,
      'Origem/Destino': log.destination || '-',
      'Usuário': log.userIdentifier || log.userEmail,
    }));
    exportToCSV(exportData, `relatorio_compras_${startDate || 'geral'}_${endDate || ''}.csv`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Monitoramento de Compras</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleExport}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-100 transition-all"
        >
          <Download className="w-4 h-4" /> Gerar Relatório
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-1">
          <Filter className="w-4 h-4 text-blue-600" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Buscar Item/Usuário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar resultados..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-zinc-400 uppercase leading-tight">Total do Período</span>
          </div>
          <p className="text-lg font-black text-zinc-900">
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-zinc-400 uppercase leading-tight">Movimentações</span>
          </div>
          <p className="text-lg font-black text-zinc-900">{filteredLogs.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-400 font-bold">
                <th className="px-5 py-3.5">Data</th>
                <th className="px-5 py-3.5">Item</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">Origem/Destino</th>
                <th className="px-5 py-3.5 text-center">Qtd</th>
                <th className="px-5 py-3.5 text-right hidden sm:table-cell">Unitário</th>
                <th className="px-5 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : pagedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-400">
                    Nenhuma compra encontrada para este período.
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {format(new Date(log.timestamp!), 'dd/MM/yy')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-zinc-900">{log.itemName}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3" />
                        {log.userIdentifier || log.userEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-zinc-500">{log.destination || 'Entrada de Estoque'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm font-medium text-zinc-700">{log.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-zinc-400 hidden sm:table-cell">
                      {log.unitValue != null
                        ? `R$ ${log.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-zinc-900">
                      {log.unitValue != null
                        ? `R$ ${(log.unitValue * log.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <Pagination
          total={filteredLogs.length}
          page={page}
          pageSize={pageSize}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
        />
      )}
    </div>
  );
}