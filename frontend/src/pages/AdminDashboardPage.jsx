import { useEffect, useState } from 'react';
import { FileText, Building2, UserCircle2, Activity, Zap } from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const { data } = await dashboardApi.getSystemDashboard();
        setStats(data);
      } catch {
        toast('Không thể tải thống kê hệ thống', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSystemStats();
  }, [toast]);

  if (loading) return <Spinner label="Đang tải dữ liệu hệ thống..." />;

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-transparent border border-violet-500/20 rounded-2xl p-6">
        <div className="absolute right-4 top-4 opacity-10 text-violet-400">
          <Activity className="w-24 h-24" />
        </div>
        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">Quản Trị Hệ Thống</p>
        <h2 className="text-xl font-extrabold text-white">Dashboard Tổng Quan</h2>
        <p className="text-sm text-slate-400 mt-1">
          Theo dõi số liệu và hiệu suất xử lý yêu cầu trên toàn bộ hệ thống.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Tình trạng yêu cầu (Hôm nay)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Tổng Hệ Thống" value={stats.totalRequests} icon={FileText} accent="indigo" />
          <StatCard label="Đang Xử Lý" value={stats.requestsByStatus?.IN_REVIEW || 0} icon={Activity} accent="amber" />
          <StatCard label="Đã Phê Duyệt" value={stats.requestsByStatus?.APPROVED || 0} icon={UserCircle2} accent="emerald" />
          <StatCard label="Từ Chối" value={stats.requestsByStatus?.REJECTED || 0} icon={FileText} accent="rose" />
        </div>
      </div>

      {/* Two-Column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Phân bổ theo phòng ban
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.requestsByDepartment || {}).length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có dữ liệu phòng ban</p>
            ) : (
              Object.entries(stats.requestsByDepartment).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <span className="text-sm text-slate-300 font-semibold">{dept}</span>
                  <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Request Type */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-fuchsia-400" /> Phân bổ theo loại yêu cầu
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.requestsByType || {}).length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có dữ liệu loại yêu cầu</p>
            ) : (
              Object.entries(stats.requestsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <span className="text-sm text-slate-300 font-semibold">{type}</span>
                  <span className="text-sm font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-1 rounded-lg">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
