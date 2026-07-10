import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { departmentApi } from '../api/departmentApi';
import { userApi } from '../api/userApi';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function DepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [form, setForm] = useState({ code: '', name: '', parentId: '', managerId: '' });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await departmentApi.getTree();
      setDepartments(data || []);
    } catch {
      toast('Không thể tải danh sách phòng ban', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await userApi.getUsers({ size: 1000, isActive: true });
      setUsers(data?.content || []);
    } catch {
      toast('Không thể tải danh sách nhân viên', 'error');
    }
  }, [toast]);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  const openCreate = () => {
    setForm({ code: '', name: '', parentId: '', managerId: '' });
    setShowCreate(true);
  };

  const openEdit = (dept) => {
    setForm({
      code: dept.code,
      name: dept.name,
      parentId: dept.parentId || '',
      managerId: dept.manager?.id || '',
    });
    setEditDept(dept);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast('Vui lòng nhập mã và tên phòng ban', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        parentId: form.parentId ? Number(form.parentId) : null,
        managerId: form.managerId ? Number(form.managerId) : null,
      };
      
      if (editDept) {
        await departmentApi.update(editDept.id, payload);
        toast('Cập nhật phòng ban thành công', 'success');
      } else {
        await departmentApi.create(payload);
        toast('Thêm phòng ban thành công', 'success');
      }
      
      setShowCreate(false);
      setEditDept(null);
      fetchDepartments();
    } catch (err) {
      toast(err?.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    setActionLoading(true);
    try {
      await departmentApi.delete(deleteDept.id);
      toast('Xóa phòng ban thành công', 'info');
      setDeleteDept(null);
      fetchDepartments();
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể xóa phòng ban', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to render tree
  const renderTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;
    return nodes.map(node => (
      <div key={node.id} className="w-full">
        <div 
          className="flex items-center justify-between p-3 border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors"
          style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {level === 0 ? (
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <div className="w-3 h-3 border-l-2 border-b-2 border-slate-600 shrink-0 ml-1 opacity-50" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{node.name}</p>
                {node.manager && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                    QL: {node.manager.fullName}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{node.code}</p>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(node)} className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 rounded-lg">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDeleteDept(node)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/50 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Recursively render children */}
        {node.children && node.children.length > 0 && (
          <div className="w-full">
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Flatten departments for Parent dropdown
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
          <div className="p-2 rounded-xl bg-indigo-500/10">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Quản Lý Phòng Ban</h2>
            <p className="text-xs text-slate-400">Cơ cấu tổ chức của hệ thống</p>
          </div>
        </div>
        <Button onClick={openCreate} icon={Plus}>Thêm phòng ban</Button>
      </div>

      {/* Tree View */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <Spinner label="Đang tải sơ đồ tổ chức..." />
        ) : departments.length === 0 ? (
          <EmptyState icon={Building2} title="Chưa có phòng ban nào" action={<Button onClick={openCreate}>Tạo mới</Button>} />
        ) : (
          <div className="flex flex-col w-full">
            {renderTree(departments)}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal 
        isOpen={showCreate || !!editDept} 
        onClose={() => { setShowCreate(false); setEditDept(null); }} 
        title={editDept ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
        size="md"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Phòng ban cấp trên</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="">(Không có - Cấp Root)</option>
              {flatDepts.map(d => (
                <option key={d.id} value={d.id} disabled={editDept?.id === d.id}>
                  {'—'.repeat(d.level)} {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Mã phòng ban *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VD: IT, HR..."
              disabled={!!editDept}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên phòng ban *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Phòng Công Nghệ Thông Tin"
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Người quản lý</label>
            <select
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="">(Chưa có người quản lý)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.username}){u.position ? ` — ${u.position}` : ''}{u.department?.name ? ` (${u.department.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setEditDept(null); }}>Hủy</Button>
            <Button type="submit" loading={actionLoading}>
              {editDept ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} title="Xác nhận xóa" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Xóa phòng ban <span className="font-bold text-white">"{deleteDept?.name}"</span>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteDept(null)}>Hủy</Button>
            <Button variant="danger" icon={Trash2} loading={actionLoading} onClick={handleDelete}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
