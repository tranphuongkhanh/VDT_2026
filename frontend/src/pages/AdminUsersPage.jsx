import { useCallback, useEffect, useState } from 'react';
import { Users, Search, UserX, Eye, Edit2, Plus, Shield, Trash2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import { departmentApi } from '../api/departmentApi';
import { roleApi } from '../api/roleApi';
import { useToast } from '../hooks/useToast';
import { RoleBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { formatDate, getInitials, parsePage } from '../utils/helpers';

function UserRow({ user, onDeactivate, onEdit, onViewDetails, onManageRoles }) {
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(user.fullName || user.username)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.fullName || '—'}</p>
            <p className="text-xs text-slate-400">{user.username} {user.employeeCode ? `• ${user.employeeCode}` : ''}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {user.position || '—'} {user.manager?.fullName ? `(QL: ${user.manager.fullName})` : ''}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{user.email}</td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {user.department?.name || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.roles?.length > 0
            ? user.roles.map((r) => <RoleBadge key={r} role={r} />)
            : <span className="text-xs text-slate-600">—</span>
          }
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${user.isActive
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-slate-700/40 text-slate-500'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {user.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* View Details */}
          <button
            onClick={() => onViewDetails(user)}
            title="Xem chi tiết"
            className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit User */}
          <button
            onClick={() => onEdit(user)}
            title="Chỉnh sửa"
            className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/50 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Manage Roles */}
          <button
            onClick={() => onManageRoles(user)}
            title="Quản lý vai trò"
            className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Deactivate User */}
          {user.isActive && (
            <button
              onClick={() => onDeactivate(user.id, user.fullName || user.username)}
              title="Vô hiệu hóa"
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptId, setDeptId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modals state
  const [deactivateModal, setDeactivateModal] = useState(null); // { id, name }
  const [detailUser, setDetailUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    departmentId: '',
    managerId: '',
    employeeCode: '',
    position: '',
  });

  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (search.trim()) params.search = search.trim();
      if (deptId) params.departmentId = Number(deptId);
      if (statusFilter !== '') params.isActive = statusFilter === 'true';

      const { data } = await userApi.getUsers(params);
      setPageData(parsePage(data));
    } catch {
      toast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, deptId, statusFilter, toast]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await departmentApi.getTree();
      setDepartments(data || []);
    } catch {
      toast('Không thể tải danh sách phòng ban', 'error');
    }
  }, [toast]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data } = await userApi.getUsers({ size: 1000, isActive: true });
      setAllUsers(data?.content || []);
    } catch {
      // Ignore
    }
  }, []);

  const fetchAvailableRoles = useCallback(async () => {
    try {
      const { data } = await roleApi.getAll();
      setAvailableRoles(data || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDepartments();
    fetchAllUsers();
    fetchAvailableRoles();
  }, [fetchDepartments, fetchAllUsers, fetchAvailableRoles]);

  const handleDeactivate = async () => {
    if (!deactivateModal) return;
    setActionLoading(true);
    try {
      await userApi.deactivateUser(deactivateModal.id);
      toast(`Đã vô hiệu hóa tài khoản ${deactivateModal.name}`, 'info');
      setDeactivateModal(null);
      fetchUsers();
      fetchAllUsers();
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể vô hiệu hóa', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () => {
    setEditUser(null);
    setEditForm({
      username: '',
      password: '',
      fullName: '',
      email: '',
      departmentId: '',
      managerId: '',
      employeeCode: '',
      position: '',
    });
    setShowCreate(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      username: user.username || '',
      password: '',
      fullName: user.fullName || '',
      email: user.email || '',
      departmentId: user.department?.id || '',
      managerId: user.manager?.id || '',
      employeeCode: user.employeeCode || '',
      position: user.position || '',
    });
    setShowCreate(false);
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!editForm.fullName || !editForm.email) {
      toast('Vui lòng nhập đầy đủ họ tên và email', 'warning');
      return;
    }

    if (!editUser && (!editForm.username || !editForm.password)) {
      toast('Vui lòng nhập tên đăng nhập và mật khẩu', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        email: editForm.email,
        departmentId: editForm.departmentId ? Number(editForm.departmentId) : null,
        managerId: editForm.managerId ? Number(editForm.managerId) : null,
        employeeCode: editForm.employeeCode || null,
        position: editForm.position || null,
      };

      if (editUser) {
        await userApi.updateUser(editUser.id, payload);
        toast('Cập nhật người dùng thành công', 'success');
        setEditUser(null);
      } else {
        const createPayload = {
          ...payload,
          username: editForm.username,
          password: editForm.password,
        };
        await userApi.createUser(createPayload);
        toast('Tạo người dùng mới thành công', 'success');
        setShowCreate(false);
      }
      fetchUsers();
      fetchAllUsers();
    } catch (err) {
      toast(err?.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedRoleId) {
      toast('Vui lòng chọn vai trò để gán', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        roleId: Number(selectedRoleId),
        expiresAt: expiresAt ? `${expiresAt}T23:59:59` : null,
      };
      await userApi.assignRole(roleModalUser.id, payload);
      toast('Gán vai trò thành công', 'success');

      setSelectedRoleId('');
      setExpiresAt('');
      fetchUsers();

      // Update local state to reflect changes in current modal
      const updatedUserRes = await userApi.getById(roleModalUser.id);
      setRoleModalUser(updatedUserRes.data);
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể gán vai trò', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!confirmRemoveRole) return;
    const roleObj = availableRoles.find(r => r.code === confirmRemoveRole.code);
    if (!roleObj) {
      toast('Không tìm thấy thông tin cấu hình cho vai trò này', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await userApi.removeRole(roleModalUser.id, roleObj.id);
      toast('Đã xóa vai trò thành công', 'success');
      setConfirmRemoveRole(null);
      fetchUsers();

      // Update local state to reflect changes in current modal
      const updatedUserRes = await userApi.getById(roleModalUser.id);
      setRoleModalUser(updatedUserRes.data);
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể xóa vai trò', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Flatten departments for dropdown
  const flattenDepartments = (nodes, result = [], level = 0) => {
    nodes.forEach(node => {
      result.push({ ...node, level });
      if (node.children) flattenDepartments(node.children, result, level + 1);
    });
    return result;
  };
  const flatDepts = flattenDepartments(departments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Quản Lý Người Dùng</h2>
            <p className="text-xs text-slate-400">Tổng số {pageData.totalElements} tài khoản</p>
          </div>
        </div>
        <Button onClick={openCreate} icon={Plus}>Thêm người dùng</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
          <span className="shrink-0"><Search className="w-4 h-4 text-slate-500" /></span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm theo tên, username, email"
            className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1"
          />
        </div>

        {/* Filter Department */}
        <div className="w-full md:w-56">
          <select
            value={deptId}
            onChange={(e) => { setDeptId(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="">Tất cả phòng ban</option>
            {flatDepts.map(d => (
              <option key={d.id} value={d.id}>
                {'—'.repeat(d.level)} {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <Spinner />
        ) : pageData.content.length === 0 ? (
          <EmptyState icon={Users} title="Không tìm thấy người dùng" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Người dùng</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phòng ban</th>
                  <th className="text-left px-4 py-3">Vai trò</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onDeactivate={(id, name) => setDeactivateModal({ id, name })}
                    onEdit={openEdit}
                    onViewDetails={setDetailUser}
                    onManageRoles={setRoleModalUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pageData.totalPages >= 1 && (
        <Pagination
          page={pageData.number}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          size={pageData.size}
          onPageChange={setPage}
        />
      )}

      {/* Detail User Modal */}
      <Modal
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="Thông tin chi tiết người dùng"
        size="md"
      >
        {detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {getInitials(detailUser.fullName || detailUser.username)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{detailUser.fullName || '—'}</h3>
                <p className="text-xs text-indigo-400 font-medium">@{detailUser.username}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 mt-2 rounded-full ${detailUser.isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-slate-700/40 text-slate-500'
                  }`}>
                  {detailUser.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Mã nhân viên</p>
                <p className="text-white font-medium">{detailUser.employeeCode || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Vị trí / Chức danh</p>
                <p className="text-white font-medium">{detailUser.position || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
                <p className="text-white font-medium">{detailUser.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Phòng ban</p>
                <p className="text-white font-medium">{detailUser.department?.name || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Người quản lý</p>
                <p className="text-white font-medium">{detailUser.manager?.fullName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Vai trò</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {detailUser.roles?.length > 0
                    ? detailUser.roles.map((r) => <RoleBadge key={r} role={r} />)
                    : <span className="text-xs text-slate-400">—</span>
                  }
                </div>
              </div>
              <div className="space-y-1 col-span-2 border-t border-slate-800/80 pt-3 flex justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Ngày tạo</p>
                  <p className="text-xs text-slate-300 font-medium">{formatDate(detailUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase text-right">Ngày sửa cuối</p>
                  <p className="text-xs text-slate-300 font-medium text-right">{formatDate(detailUser.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetailUser(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={showCreate || !!editUser}
        onClose={() => { setShowCreate(false); setEditUser(null); }}
        title={editUser ? 'Chỉnh sửa thông tin người dùng' : 'Tạo người dùng mới'}
        size="md"
      >
        {(showCreate || editUser) && (
          <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">

            {/* Conditional fields for Create Mode */}
            {!editUser && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Tên đăng nhập *</label>
                  <input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="VD: nguyenvanan"
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Mật khẩu *</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Họ và tên *</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Email *</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Nhập địa chỉ email"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Mã nhân viên</label>
                <input
                  value={editForm.employeeCode}
                  onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                  placeholder="VD: NV012"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Vị trí / Chức danh</label>
                <input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="VD: Trưởng phòng"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Phòng ban</label>
              <select
                value={editForm.departmentId}
                onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value, managerId: '' })}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="">(Không thuộc phòng ban nào)</option>
                {flatDepts.map(d => (
                  <option key={d.id} value={d.id}>
                    {'—'.repeat(d.level)} {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Người quản lý trực tiếp</label>
              <select
                value={editForm.managerId}
                onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="">(Chưa có người quản lý)</option>
                {allUsers
                  .filter(u => !editUser || u.id !== editUser.id) // Cannot be own manager
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username}){u.position ? ` — ${u.position}` : ''}{u.department?.name ? ` (${u.department.name})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setEditUser(null); }}>Hủy</Button>
              <Button type="submit" loading={actionLoading}>
                {editUser ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate confirm modal */}
      <Modal
        isOpen={!!deactivateModal}
        onClose={() => setDeactivateModal(null)}
        title="Xác nhận vô hiệu hóa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Vô hiệu hóa tài khoản <span className="font-bold text-white">"{deactivateModal?.name}"</span>?
            Người dùng này sẽ không thể đăng nhập cho đến khi được kích hoạt lại.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeactivateModal(null)}>Hủy</Button>
            <Button variant="danger" icon={UserX} loading={actionLoading} onClick={handleDeactivate}>
              Vô hiệu hóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage User Roles Modal */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => { setRoleModalUser(null); setSelectedRoleId(''); setExpiresAt(''); }}
        title={`Quản lý vai trò: ${roleModalUser?.fullName || roleModalUser?.username}`}
        size="md"
      >
        {roleModalUser && (
          <div className="space-y-6">
            {/* List of current roles */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vai trò hiện tại</h4>
              {roleModalUser.roles && roleModalUser.roles.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {roleModalUser.roles.map((r) => {
                    const roleDetails = availableRoles.find(ar => ar.code === r);
                    return (
                      <div key={r} className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/30 rounded-xl text-xs">
                        <div>
                          <p className="text-sm font-semibold text-white">{roleDetails?.name || r}</p>
                          <p className="text-[10px] text-indigo-400 font-mono">{r}</p>
                          {roleDetails?.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{roleDetails.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setConfirmRemoveRole({ code: r, name: roleDetails?.name || r })}
                          disabled={actionLoading}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Xóa vai trò"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Người dùng chưa có vai trò nào</p>
              )}
            </div>

            {/* Form to assign a new role */}
            <div className="border-t border-slate-800/80 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gán vai trò mới</h4>
              <form onSubmit={handleAssignRole} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-medium">Chọn vai trò</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {availableRoles
                      .filter(ar => !roleModalUser.roles?.includes(ar.code))
                      .map(ar => (
                        <option key={ar.id} value={ar.id}>
                          {ar.name} ({ar.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-medium">Hạn sử dụng vai trò (Không bắt buộc)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={actionLoading}>Gán vai trò</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm remove role modal */}
      <Modal
        isOpen={!!confirmRemoveRole}
        onClose={() => setConfirmRemoveRole(null)}
        title="Xác nhận xóa vai trò"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Xóa vai trò <span className="font-bold text-white">"{confirmRemoveRole?.name}"</span> khỏi người dùng <span className="font-bold text-white">"{roleModalUser?.fullName || roleModalUser?.username}"</span>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmRemoveRole(null)}>Hủy</Button>
            <Button variant="danger" icon={Trash2} loading={actionLoading} onClick={handleRemoveRole}>
              Xóa vai trò
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
