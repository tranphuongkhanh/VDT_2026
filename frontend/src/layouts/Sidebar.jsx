import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  GitFork,
  Users,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
  Activity,
  Building2,
  LayoutList,
  History,
  Shield,
  FolderTree,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { useToast } from '../hooks/useToast';

const NAV_GROUPS = [
  {
    group: 'Cá nhân',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: [] },
      { to: '/requests', label: 'Yêu cầu của tôi', icon: FileSpreadsheet, roles: [] },
      { to: '/approvals', label: 'Phê duyệt', icon: CheckSquare, roles: [] },
    ]
  },
  {
    group: 'Quản trị hệ thống',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard hệ thống', icon: Activity, roles: [ROLES.ADMIN] },
      { to: '/admin/departments', label: 'Phòng ban', icon: Building2, roles: [ROLES.ADMIN] },
      { to: '/admin/users', label: 'Người dùng', icon: Users, roles: [ROLES.ADMIN] },
      { to: '/admin/roles', label: 'Vai trò', icon: Shield, roles: [ROLES.ADMIN] },
      { to: '/admin/categories', label: 'Danh mục', icon: FolderTree, roles: [ROLES.ADMIN] },
      { to: '/admin/request-types', label: 'Loại yêu cầu', icon: LayoutList, roles: [ROLES.ADMIN] },
      { to: '/workflows', label: 'Cấu hình Workflow', icon: GitFork, roles: [ROLES.ADMIN] },
      { to: '/admin/audit-log', label: 'Nhật ký hệ thống', icon: History, roles: [ROLES.ADMIN] },
    ]
  }
];

export default function Sidebar({ pendingCount = 0 }) {
  const { user, hasAnyRole, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast('Đã đăng xuất thành công', 'info');
    navigate('/login', { replace: true });
  };

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.length === 0 || hasAnyRole(item.roles))
  })).filter(group => group.items.length > 0);

  return (
    <aside className="w-64 shrink-0 bg-[#0a0f1e]/80 border-r border-slate-800/60 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-wide leading-none">VDT 2026</p>
            <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Approval System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {visibleGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{group.group}</p>
            {group.items.map(({ to, label, icon: Icon, roles: _roles }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="flex-1">{label}</span>
                    {to === '/approvals' && pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800/60 space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-indigo-600/15 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Cài đặt</span>
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(user?.fullName || user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.fullName || user?.username}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
