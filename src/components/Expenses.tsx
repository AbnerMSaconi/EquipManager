import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Search, Download, FileText, TrendingUp, Filter } from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
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

  const totalExpense = filteredLogs.reduce((acc, log) => {
    const value = (log.unitValue || 0) * log.quantity;
    return acc + value;
  }, 0);

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      'Data': format(new Date(log.timestamp!), 'dd/MM/yyyy HH:mm'),
      'Item': log.itemName,
      'Quantidade': log.quantity,
      'Valor Unitário': `R$ ${log.unitValue?.toFixed(2) || '0,00'}`,
      'Total': `R$ ${((log.unitValue || 0) * log.quantity).toFixed(2)}`,
      'Tipo': 'Compra/Entrada',
      'Origem/Destino': log.destination || '-',
      'Usuário': log.userIdentifier || log.userEmail,
      'Status': log.status || 'completed'
    }));
    exportToCSV(exportData, `relatorio_compras_${startDate || 'geral'}_${endDate || ''}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900">Monitoramento de Compras</h2>
        <button
          onClick={handleExport}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
        >
          <Download className="w-5 h-5" /> Gerar Relatório
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 font-bold mb-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filtros de Período
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Buscar Item/Usuário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar resultados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-zinc-500 uppercase">Total do Período</span>
          </div>
          <p className="text-2xl font-black text-zinc-900">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-zinc-500 uppercase">Movimentações</span>
          </div>
          <p className="text-2xl font-black text-zinc-900">{filteredLogs.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Origem/Destino</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase text-center">Qtd</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase text-right">Unitário</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    Nenhuma compra encontrada para este período.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-900">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {format(new Date(log.timestamp!), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-900">{log.itemName}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {log.userIdentifier || log.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600">
                        {log.destination || 'Entrada de Estoque'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-zinc-900">{log.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm text-zinc-500">
                      R$ {log.unitValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-zinc-900">
                      R$ {((log.unitValue || 0) * log.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
