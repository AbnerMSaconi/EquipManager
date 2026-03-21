import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PageSize = 10 | 20 | 50 | 999999;

export function usePagination<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { paginated, safePage, totalPages };
}

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: PageSize) => void;
}

export function PageSizeSelector({ pageSize, onPageSizeChange }: PageSizeSelectorProps) {
  const options: { label: string; value: PageSize }[] = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: 'Todos', value: 999999 },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Itens por pág:</span>
      <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPageSizeChange(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
              pageSize === opt.value
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ total, page, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.ceil(total / pageSize);
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Mostrando <span className="font-bold text-zinc-900 dark:text-zinc-100">{start}-{end}</span> de <span className="font-bold text-zinc-900 dark:text-zinc-100">{total}</span>
      </p>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors shadow-sm"
          >
            Anterior
          </button>
          <div className="px-3 text-xs font-bold text-zinc-400 dark:text-zinc-500">
            Pág {page} de {totalPages}
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors shadow-sm"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}