import { FileSearch } from 'lucide-react';

/**
 * Empty state placeholder — shown when a list has no items
 */
export default function EmptyState({ title = 'Không có dữ liệu', description, icon: Icon = FileSearch, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4">
      <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-500">
        <Icon className="w-10 h-10" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-300">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-1 max-w-[300px]">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
