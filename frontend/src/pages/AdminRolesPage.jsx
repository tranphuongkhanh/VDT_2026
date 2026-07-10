import { useEffect, useState, useCallback } from 'react';
import { Shield, Plus, Edit2 } from 'lucide-react';
import { roleApi } from '../api/roleApi';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/helpers';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

export default function AdminRolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await roleApi.getAll();
      setRoles(data || []);
    } catch {
      toast('Không thể tải danh sách vai trò', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreate = () => {
    setEditRole(null);
    setForm({
      code: '',
      name: '',
      description: '',
    });
    setShowCreate(true);
  };

  const openEdit = (role) => {
    setEditRole(role);
    setForm({
      code: role.code,
      name: role.name || '',
      description: role.description || '',
    });
    setShowCreate(false);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast('Vui lòng điền mã và tên vai trò', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (editRole) {
        await roleApi.update(editRole.id, {
          name: payload.name,
          description: payload.description,
        });
        toast('Cập nhật vai trò thành công', 'success');
        setEditRole(null);
      } else {
        await roleApi.create(payload);
        toast('Tạo vai trò mới thành công', 'success');
        setShowCreate(false);
      }
      fetchRoles();
    } catch (err) {
      toast(err?.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Quản Lý Vai Trò</h2>
            <p className="text-xs text-slate-400">Tổng số {roles.length} vai trò trong hệ thống</p>
          </div>
        </div>
        <Button onClick={openCreate} icon={Plus}>Thêm vai trò</Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <Spinner />
        ) : roles.length === 0 ? (
          <EmptyState icon={Shield} title="Chưa có vai trò nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-3.5">Mã vai trò</th>
                  <th className="text-left px-6 py-3.5">Tên vai trò</th>
                  <th className="text-left px-6 py-3.5">Mô tả</th>
                  <th className="text-left px-6 py-3.5">Loại</th>
                  <th className="text-left px-6 py-3.5">Ngày tạo</th>
                  <th className="text-left px-6 py-3.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-bold">
                      {role.code}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">
                      {role.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {role.isSystem ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                          Hệ thống
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          Tự định nghĩa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {formatDate(role.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEdit(role)}
                        title="Chỉnh sửa"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showCreate || !!editRole}
        onClose={() => { setShowCreate(false); setEditRole(null); }}
        title={editRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
        size="md"
      >
        {(showCreate || editRole) && (
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Mã vai trò *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VD: HR, FINANCE..."
                disabled={!!editRole}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Tên vai trò *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Người kiểm toán"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Nhập mô tả cho vai trò..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setEditRole(null); }}>Hủy</Button>
              <Button type="submit" loading={actionLoading}>
                {editRole ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
