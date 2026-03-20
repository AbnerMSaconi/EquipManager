import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PageSize = 10 | 20 | 'all';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: PageSize;
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: PageSize) => void;
}

export function usePagination<T>(items: T[], page: number, pageSize: PageSize) {
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === 'all'
    ? items
    : items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { paginated, totalPages, safePage };
}

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / pageSize));

  // Build page numbers to show (window of 5 around current)
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const from = pageSize === 'all' ? 1 : Math.min((page - 1) * pageSize + 1, total);
  const to = pageSize === 'all' ? total : Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
      {/* Left: count + page size selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400">
          {total === 0 ? '0 registros' : `${from}–${to} de ${total}`}
        </span>
        <div className="flex bg-zinc-100 p-0.5 rounded-lg">
          {([10, 20, 'all'] as PageSize[]).map((ps) => (
            <button
              key={String(ps)}
              onClick={() => { onPageSizeChange(ps); onPageChange(1); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                pageSize === ps
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {ps === 'all' ? 'Todos' : ps}
            </button>
          ))}
        </div>
      </div>

      {/* Right: page nav — hide when showing all or only 1 page */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPages().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-zinc-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'min-w-[30px] h-[30px] px-1 rounded-lg text-xs font-semibold transition-all',
                  page === p
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                    : 'text-zinc-600 hover:bg-zinc-100'
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}