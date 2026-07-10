import { useState, useEffect, useRef } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/notificationApi';
import { useToast } from '../hooks/useToast';
import { timeAgo } from '../utils/helpers';
import Button from '../components/ui/Button';

const PAGE_TITLES = {
  '/dashboard': 'Bảng Điều Khiển',
  '/requests': 'Yêu Cầu Của Tôi',
  '/approvals': 'Hàng Chờ Phê Duyệt',
  '/workflows': 'Quản Lý Quy Trình',
  '/admin/users': 'Quản Lý Người Dùng',
  '/admin/roles': 'Quản Lý Vai Trò',
  '/settings': 'Cài Đặt',
};

export default function Header({ onCreateRequest }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'VDT 2026';

  // Fetch unread count periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await notificationApi.getUnreadCount();
        setUnreadCount(data.count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch notifications list when panel opens
  useEffect(() => {
    if (!showNotifs) return;
    notificationApi.getAll({ page: 0, size: 10 })
      .then(({ data }) => setNotifications(data.content ?? []))
      .catch(() => { });
  }, [showNotifs]);

  // Click outside to close notification panel
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast('Đã đánh dấu tất cả là đã đọc', 'success');
    } catch {
      toast('Không thể cập nhật thông báo', 'error');
    }
  };

  const handleMarkAsRead = async (n) => {
    if (n.isRead) {
      handleNavigation(n);
      return;
    }
    try {
      await notificationApi.markAsRead(n.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      handleNavigation(n);
    } catch {
      toast('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleNavigation = (n) => {
    setShowNotifs(false);
    if (!n.requestId) return;
    if (n.type === 'PENDING_APPROVAL') {
      navigate('/approvals');
    } else {
      navigate('/requests');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#080d1a]/80 backdrop-blur-xl border-b border-slate-800/60 px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: page title */}
      <div>
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Approval System</p>
        <h1 className="text-lg font-extrabold text-white leading-tight">{title}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Create request shortcut */}
        {onCreateRequest && (
          <Button onClick={onCreateRequest} icon={Plus} size="sm">
            Tạo yêu cầu
          </Button>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
                <p className="text-sm font-bold text-white">Thông báo</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">Không có thông báo</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n)}
                      className={`px-4 py-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/40 ${n.isRead ? 'text-slate-500' : 'text-slate-200 bg-indigo-500/5'}`}
                    >
                      <p className="font-semibold leading-snug">{n.title || n.message}</p>
                      <p className="text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-700/40">
                <button
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  onClick={() => { setShowNotifs(false); navigate('/notifications'); }}
                >
                  Xem tất cả →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
