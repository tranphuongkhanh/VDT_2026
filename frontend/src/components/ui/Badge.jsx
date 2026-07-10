import { getStatusBadgeClasses, getStatusLabel, getPriorityBadgeClasses, getPriorityLabel } from '../../utils/helpers';

/**
 * Status badge — maps RequestStatus enum to a styled pill
 */
export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide ${getStatusBadgeClasses(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

/**
 * Priority badge — maps RequestPriority enum to a styled pill
 */
export function PriorityBadge({ priority }) {
  const dot = {
    LOW: '●',
    NORMAL: '●',
    HIGH: '●',
    URGENT: '⬆',
  }[priority] || '●';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getPriorityBadgeClasses(priority)}`}>
      <span>{dot}</span>
      <span>{getPriorityLabel(priority)}</span>
    </span>
  );
}

/**
 * Role badge — simple colored chip for role names
 */
export function RoleBadge({ role }) {
  const label = role?.replace('ROLE_', '') ?? role;
  const colorMap = {
    ADMIN: 'bg-violet-500/15 text-violet-400',
    MANAGER: 'bg-blue-500/15 text-blue-400',
    HR: 'bg-pink-500/15 text-pink-400',
    FINANCE: 'bg-emerald-500/15 text-emerald-400',
    USER: 'bg-slate-500/15 text-slate-400',
  };
  const cls = colorMap[label] || 'bg-slate-500/15 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}
