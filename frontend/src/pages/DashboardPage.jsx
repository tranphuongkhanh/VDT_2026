import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, XCircle, RotateCcw,
  GitFork, ArrowRight, AlertTriangle, X,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { requestApi } from '../api/requestApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import StatCard from '../components/ui/StatCard';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, truncate } from '../utils/helpers';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const context = useOutletContext();
  const { setPendingCount } = context || {};

  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [personalRes] = await Promise.allSettled([
          dashboardApi.getPersonalDashboard(),
        ]);

        if (personalRes.status === 'fulfilled') {
          setStats(personalRes.value.data);
          const pendingCount = personalRes.value.data?.pendingMyApproval ?? 0;
          setPendingCount?.(pendingCount);
        }

        if (hasRole(ROLES.ADMIN)) {
          const sysRes = await dashboardApi.getSystemDashboard();
          setSystemStats(sysRes.data);
        }

        const pendingRes = await requestApi.getPendingApprovals();
        setPending(pendingRes.data?.slice(0, 5) || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [hasRole, setPendingCount]);

  if (loading) return <Spinner label="Đang tải bảng điều khiển..." />;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-transparent border border-indigo-500/20 rounded-2xl p-6">
        <div className="absolute right-4 top-4 opacity-10 text-indigo-400">
          <GitFork className="w-24 h-24" />
        </div>
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Chào mừng trở lại</p>
        <h2 className="text-xl font-extrabold text-white">{user?.fullName || user?.username} 👋</h2>
        <p className="text-sm text-slate-400 mt-1">
          {stats?.pendingMyApproval > 0
            ? `Bạn có ${stats.pendingMyApproval} yêu cầu đang chờ phê duyệt.`
            : 'Không có yêu cầu nào đang chờ xử lý.'}
        </p>
      </div>

      {/* Personal stats grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Thống kê cá nhân</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Tổng yêu cầu"   value={stats?.totalMyRequests}    icon={FileText}     accent="indigo" />
          <StatCard label="Bản nháp"        value={stats?.myDraftRequests}    icon={FileText}     accent="violet" />
          <StatCard label="Đang xử lý"     value={stats?.myPendingRequests}  icon={Clock}        accent="amber"  />
          <StatCard label="Đã duyệt"        value={stats?.myApprovedRequests} icon={CheckCircle2} accent="emerald"/>
          <StatCard label="Từ chối"         value={stats?.myRejectedRequests} icon={XCircle}      accent="rose"   />
          <StatCard label="Trả lại"         value={stats?.myReturnedRequests} icon={RotateCcw}    accent="sky"    />
          <StatCard label="Đã hủy"          value={stats?.myCancelledRequests} icon={X}           accent="slate"  />
        </div>
      </div>

      {/* System stats (admin only) */}
      {hasRole(ROLES.ADMIN) && systemStats && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Thống kê hệ thống</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tổng hệ thống" value={systemStats.totalRequests} icon={FileText} accent="indigo" />
            {Object.entries(systemStats.requestsByStatus || {}).slice(0, 3).map(([status, count]) => (
              <StatCard key={status} label={status} value={count} icon={FileText} accent="violet" />
            ))}
          </div>
        </div>
      )}

      {/* Two-column bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Chờ tôi phê duyệt</h3>
              </div>
              <Link to="/approvals" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {pending.map((item) => (
                <div key={item.requestId} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-400">{item.requestNo}</p>
                    <p className="text-sm text-white font-semibold truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.requesterFullName} · {item.currentStepName}</p>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent requests */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Yêu cầu gần đây</h3>
            <Link to="/requests" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!stats?.recentRequests?.length ? (
            <EmptyState title="Chưa có yêu cầu nào" description="Tạo yêu cầu đầu tiên để bắt đầu." />
          ) : (
            <div className="space-y-3">
              {stats.recentRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-400">{req.requestNo}</p>
                    <p className="text-sm text-white font-semibold truncate">{truncate(req.title, 45)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(req.createdAt)}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
