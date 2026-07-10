import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination control for Spring Page responses
 */
export default function Pagination({ page, totalPages, onPageChange, totalElements, size }) {
  if (totalPages <= 0) return null;

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  const pages = [];
  const delta = 2;
  for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-700/40">
      <p className="text-xs text-slate-500">
        Hiển thị <span className="font-semibold text-slate-300">{from}–{to}</span> / {totalElements} mục
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
