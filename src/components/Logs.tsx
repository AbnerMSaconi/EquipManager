import React, { useState, useEffect } from 'react';
import { Log } from '../types';
import { format } from 'date-fns';
import {
  ArrowDownRight, ArrowUpRight, Wrench, Search, Filter,
  Download, User, MapPin, CalendarClock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import Pagination, { usePagination, type PageSize } from './Pagination';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACTION_CONFIG = {
  recebimento: { label: 'Entrada', icon: ArrowDownRight, bg: 'bg-blue-100', text: 'text-blue-700' },
  retirada: { label: 'Saida', icon: ArrowUpRight, bg: 'bg-amber-100', text: 'text-amber-700' },
  quebra: { label: 'Quebra', icon: Wrench, bg: 'bg-red-100', text: 'text-red-700' },
} as const;

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recebimento' | 'retirada' | 'quebra'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get('/logs');
        setLogs(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (log.userIdentifier || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.destination || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.actionType === filterType;
    return matchesSearch && matchesType;
  });

  const { paginated: pagedLogs, safePage } = usePagination(filteredLogs, page, pageSize);

  const handleExport = () => {
    exportToCSV(
      filteredLogs.map((log) => ({
        Acao: ACTION_CONFIG[log.actionType as keyof typeof ACTION_CONFIG]?.label || log.actionType,
        Item: log.itemName,
        Quantidade: log.quantity,
        Usuario: log.userIdentifier || log.userEmail,
        'Destino/Origem': log.destination || '',
        Data: log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm') : '',
        Observacoes: log.observations || '',
      })),
      'relatorio_movimentacoes.csv'
    );
  };

  const setFilter = (type: typeof filterType) => { setFilterType(type); setPage(1); };

  return (
    <div className="space-y-5">
      <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Historico de Movimentacoes</h2>

      {/* Filters bar */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
          {([
            { type: 'all', label: 'Todas' },
            { type: 'recebimento', label: 'Entradas' },
            { type: 'retirada', label: 'Saidas' },
            { type: 'quebra', label: 'Quebras' },
          ] as const).map(({ type, label }) => (
            <button key={type} onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
                filterType === type ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              )}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Buscar item, usuario, destino..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
        </div>
        <button onClick={handleExport}
          className="w-full sm:w-auto bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {!loading && (
        <p className="text-xs text-zinc-400">{filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
          <Filter className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Nenhuma movimentacao encontrada</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {pagedLogs.map((log) => {
              const cfg = ACTION_CONFIG[log.actionType as keyof typeof ACTION_CONFIG];
              const Icon = cfg?.icon || Wrench;
              return (
                <div key={log.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase', cfg?.bg, cfg?.text)}>
                      <Icon className="w-3 h-3" /> {cfg?.label || log.actionType}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 shrink-0">
                      <CalendarClock className="w-3 h-3" />
                      {log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yy HH:mm') : '-'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">{log.quantity}x {log.itemName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.userIdentifier || log.userEmail}
                    </span>
                    {log.destination && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {log.destination}
                      </span>
                    )}
                  </div>
                  {log.observations && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 line-clamp-2">
                      {log.observations}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-400 font-bold">
                  <th className="px-5 py-3.5">Acao</th>
                  <th className="px-5 py-3.5">Item</th>
                  <th className="px-5 py-3.5">Usuario</th>
                  <th className="px-5 py-3.5">Destino/Origem</th>
                  <th className="px-5 py-3.5">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pagedLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.actionType as keyof typeof ACTION_CONFIG];
                  const Icon = cfg?.icon || Wrench;
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase', cfg?.bg, cfg?.text)}>
                          <Icon className="w-3.5 h-3.5" /> {cfg?.label || log.actionType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-zinc-900">{log.itemName}</div>
                        <div className="text-xs text-zinc-400">Qtd: {log.quantity}</div>
                        {log.observations && (
                          <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 max-w-xs">
                            {log.observations}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-700">{log.userIdentifier || log.userEmail}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500">{log.destination || '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500">
                        {log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            total={filteredLogs.length} page={safePage} pageSize={pageSize}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}