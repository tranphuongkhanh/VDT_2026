import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { useToast } from '../hooks/useToast';
import { timeAgo, formatDateTime } from '../utils/helpers';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function NotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });

  const fetchNotifications = async (page = 0) => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll({ page, size: 10 });
      setNotifications(data.content ?? []);
      setPagination({
        page: data.number ?? 0,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0,
      });
    } catch {
      toast('Không thể tải danh sách thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);
  }, []);

  const handleMarkAsRead = async (n) => {
    if (n.isRead) {
      handleNavigation(n);
      return;
    }
    try {
      await notificationApi.markAsRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      handleNavigation(n);
    } catch {
      toast('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast('Đã đánh dấu tất cả là đã đọc', 'success');
    } catch {
      toast('Không thể cập nhật thông báo', 'error');
    }
  };

  const handleNavigation = (n) => {
    if (!n.requestId) return;
    if (n.type === 'PENDING_APPROVAL') {
      navigate('/approvals');
    } else {
      navigate('/requests');
    }
  };

  if (loading && notifications.length === 0) {
    return <Spinner label="Đang tải thông báo..." />;
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Thông Báo Của Tôi</h2>
            <p className="text-xs text-slate-400">Xem và quản lý tất cả thông báo của bạn</p>
          </div>
        </div>

        {hasUnread && (
          <Button onClick={handleMarkAllRead} variant="secondary" size="sm" icon={CheckSquare}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo nào"
          description="Hộp thư thông báo của bạn trống."
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden divide-y divide-slate-800 shadow-xl">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n)}
                className={`p-4 flex gap-4 transition-colors cursor-pointer hover:bg-slate-800/45 ${
                  n.isRead ? 'opacity-70 bg-transparent' : 'bg-indigo-600/[0.03] border-l-2 border-indigo-500'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    n.type === 'PENDING_APPROVAL'
                      ? 'bg-amber-500/10 text-amber-400'
                      : n.type === 'REQUEST_APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : n.type === 'REQUEST_REJECTED'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-indigo-500/10 text-indigo-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatDateTime(n.createdAt)} ({timeAgo(n.createdAt)})
                    </span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                Hiển thị {notifications.length} trên {pagination.totalElements} thông báo
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                >
                  Trước
                </Button>
                <span className="flex items-center px-3 text-xs text-slate-200 bg-slate-800 border border-slate-700/60 rounded-xl">
                  Trang {pagination.page + 1} / {pagination.totalPages}
                </span>
                <Button
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages - 1}
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
