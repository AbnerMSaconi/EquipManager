import React, { useState, useEffect } from 'react';
import { Log } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownRight, ArrowUpRight, Wrench, Search, Filter, Download, User, MapPin, CalendarClock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recebimento' | 'retirada' | 'quebra'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get('/logs');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (log.userIdentifier || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.actionType === filterType;
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      'Ação': log.actionType === 'recebimento' ? 'Entrada' : log.actionType === 'quebra' ? 'Quebra' : 'Saída',
      'Item': log.itemName,
      'Quantidade': log.quantity,
      'Usuário': log.userIdentifier || log.userEmail,
      'Destino/Origem': log.destination || '',
      'Data': log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm') : '',
      'Observações': log.observations || ''
    }));
    exportToCSV(exportData, 'relatorio_movimentacoes.csv');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900">Histórico de Movimentações</h2>

      {/* Menu de Filtros Horizontal com Scroll Suave no Celular */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200 flex flex-col xl:flex-row gap-3 items-center">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto hide-scrollbar snap-x">
          <button onClick={() => setFilterType('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap snap-start", filterType === 'all' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500")}>Todas</button>
          <button onClick={() => setFilterType('recebimento')} className={cn("px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap snap-start", filterType === 'recebimento' ? "bg-white text-blue-700 shadow-sm" : "text-zinc-500")}>Entradas</button>
          <button onClick={() => setFilterType('retirada')} className={cn("px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap snap-start", filterType === 'retirada' ? "bg-white text-amber-700 shadow-sm" : "text-zinc-500")}>Saídas</button>
          <button onClick={() => setFilterType('quebra')} className={cn("px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap snap-start", filterType === 'quebra' ? "bg-white text-red-700 shadow-sm" : "text-zinc-500")}>Quebras</button>
        </div>

        <div className="relative w-full xl:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" />
        </div>

        <button onClick={handleExport} className="w-full xl:w-auto bg-white border border-zinc-200 text-zinc-700 px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
          <Download className="w-5 h-5" /> <span className="xl:hidden">Exportar PDF/CSV</span> <span className="hidden xl:inline">Exportar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <Filter className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhuma movimentação.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visualização Mobile (Cards) */}
          <div className="block lg:hidden space-y-3">
            {filteredLogs.map(log => {
              const isRec = log.actionType === 'recebimento';
              const isQuebra = log.actionType === 'quebra';
              
              return (
                <div key={log.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase", isRec ? "bg-blue-100 text-blue-700" : isQuebra ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {isRec ? <ArrowDownRight className="w-3 h-3" /> : isQuebra ? <Wrench className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isRec ? 'Entrada' : isQuebra ? 'Quebra' : 'Saída'}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1"><CalendarClock className="w-3 h-3"/> {log.timestamp ? format(new Date(log.timestamp), "dd/MM/yy HH:mm") : '-'}</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-sm">{log.quantity}x {log.itemName}</h4>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-zinc-600"><User className="w-3.5 h-3.5" /> {log.userIdentifier}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600"><MapPin className="w-3.5 h-3.5" /> {log.destination || '-'}</div>
                  </div>
                  
                  {log.observations && (
                    <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 line-clamp-2">
                      {log.observations}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Visualização Desktop (Tabela) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-xs uppercase text-zinc-500 font-bold border-b border-zinc-200">
                  <th className="p-4">Ação</th>
                  <th className="p-4">Item</th>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Destino/Origem</th>
                  <th className="p-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.map(log => {
                  const isRec = log.actionType === 'recebimento';
                  const isQuebra = log.actionType === 'quebra';
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50">
                      <td className="p-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase", isRec ? "bg-blue-100 text-blue-700" : isQuebra ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                          {isRec ? <ArrowDownRight className="w-3.5 h-3.5" /> : isQuebra ? <Wrench className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isRec ? 'Entrada' : isQuebra ? 'Quebra' : 'Saída'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">{log.itemName}</div>
                        <div className="text-xs text-zinc-500">Qtd: {log.quantity}</div>
                        {log.observations && <div className="mt-1 text-xs text-red-600 bg-red-50 p-1.5 rounded-md border border-red-100 inline-block">{log.observations}</div>}
                      </td>
                      <td className="p-4 text-sm font-medium text-zinc-700">{log.userIdentifier}</td>
                      <td className="p-4 text-sm text-zinc-500">{log.destination || '-'}</td>
                      <td className="p-4 text-sm text-zinc-500">{log.timestamp ? format(new Date(log.timestamp), "dd/MM/yyyy HH:mm") : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}