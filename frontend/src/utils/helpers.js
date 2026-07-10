import { REQUEST_STATUS_LABEL, REQUEST_PRIORITY_LABEL } from './constants';

/**
 * Format ISO date string to Vietnamese locale date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format ISO datetime string to Vietnamese locale datetime
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Returns Tailwind CSS color classes for a given RequestStatus
 */
export const getStatusBadgeClasses = (status) => {
  const map = {
    DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    SUBMITTED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    IN_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    RETURNED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    CLOSED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    CANCELLED: 'bg-slate-600/15 text-slate-500 border-slate-600/30',
  };
  return map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
};

/**
 * Returns Tailwind CSS color classes for a given RequestPriority
 */
export const getPriorityBadgeClasses = (priority) => {
  const map = {
    LOW: 'bg-slate-500/15 text-slate-400',
    NORMAL: 'bg-indigo-500/15 text-indigo-400',
    HIGH: 'bg-amber-500/15 text-amber-400',
    URGENT: 'bg-rose-500/15 text-rose-400',
  };
  return map[priority] || 'bg-slate-500/15 text-slate-400';
};

/**
 * Translate status enum to Vietnamese label
 */
export const getStatusLabel = (status) => REQUEST_STATUS_LABEL[status] || status;

/**
 * Translate priority enum to Vietnamese label
 */
export const getPriorityLabel = (priority) => REQUEST_PRIORITY_LABEL[priority] || priority;

/**
 * Truncate string to n characters with ellipsis
 */
export const truncate = (str, n = 60) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
};

/**
 * Get initials from a full name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

/**
 * Calculate how long ago a date was
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

/**
 * Parse pageable object from Spring Page response
 */
export const parsePage = (pageData) => ({
  content: pageData?.content || [],
  totalElements: pageData?.totalElements || 0,
  totalPages: pageData?.totalPages || 0,
  number: pageData?.number || 0,
  size: pageData?.size || 20,
});
