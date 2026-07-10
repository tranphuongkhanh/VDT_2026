/**
 * Dashboard metric card
 * accent: 'indigo' | 'amber' | 'emerald' | 'rose' | 'violet'
 */
export default function StatCard({ label, value, icon: Icon, accent = 'indigo', sub, trend }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    amber:  'bg-amber-500/10  text-amber-400',
    emerald:'bg-emerald-500/10 text-emerald-400',
    rose:   'bg-rose-500/10   text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
    sky:    'bg-sky-500/10    text-sky-400',
    slate:  'bg-slate-500/10  text-slate-400',
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-600/60 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${colors[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-extrabold text-white leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        {trend && (
          <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% so với tháng trước
          </p>
        )}
      </div>
    </div>
  );
}
