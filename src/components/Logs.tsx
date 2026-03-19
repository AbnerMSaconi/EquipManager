import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, User, MapPin, Clock, Download } from 'lucide-react';
import { Log } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<'all' | 'retirada' | 'recebimento'>('all');
  const [loading, setLoading] = useState(true);

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

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.actionType === filter);

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      'ID do Item': log.itemId,
      'Nome do Item': log.itemName,
      'Quantidade': log.quantity,
      'Usuário': log.userIdentifier || log.userEmail,
      'Ação': log.actionType,
      'Local de Destino': log.destination || '',
      'Data de Devolução': log.returnDeadline ? format(new Date(log.returnDeadline), 'dd/MM/yyyy') : '',
      'Status da Devolução': log.status || ''
    }));
    exportToCSV(exportData, 'logs.csv');
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
              filter === 'all' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('recebimento')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
              filter === 'recebimento' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Recebimentos
          </button>
          <button
            onClick={() => setFilter('retirada')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
              filter === 'retirada' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Retiradas
          </button>
        </div>
        <button
          onClick={handleExport}
          className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" /> Exportar Logs
        </button>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                log.actionType === 'recebimento' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-900"
              )}>
                {log.actionType === 'recebimento' ? (
                  <ArrowDownLeft className="w-6 h-6" />
                ) : (
                  <ArrowUpRight className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    log.actionType === 'recebimento' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"
                  )}>
                    {log.actionType === 'recebimento' ? 'Entrada' : 'Saída'}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {log.timestamp ? format(new Date(log.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'Processando...'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 truncate">
                  {log.quantity}x {log.itemName}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User className="w-3.5 h-3.5" />
                    {log.userIdentifier || log.userEmail}
                  </div>
                  {log.destination && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {log.destination}
                    </div>
                  )}
                  {log.returnDeadline && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      Devolução: {format(new Date(log.returnDeadline), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
