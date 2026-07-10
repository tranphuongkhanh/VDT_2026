/**
 * Full-page centered loading spinner
 */
export default function Spinner({ size = 'md', label = 'Đang tải...' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-9 h-9 border-[3px]', lg: 'w-14 h-14 border-4' };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className={`${sizes[size]} border-indigo-500 border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
    </div>
  );
}

/**
 * Inline spinner (no label, no wrapper padding)
 */
export function InlineSpinner({ className = 'w-4 h-4' }) {
  return (
    <span className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
