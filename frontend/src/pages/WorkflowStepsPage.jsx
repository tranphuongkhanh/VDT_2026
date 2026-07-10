import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Save, GitFork, AlertCircle, CheckCircle } from 'lucide-react';
import { workflowApi } from '../api/workflowApi';
import { userApi } from '../api/userApi';
import { roleApi } from '../api/roleApi';
import { departmentApi } from '../api/departmentApi';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

export default function WorkflowStepsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form options data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modals
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState({
    name: '',
    approverType: 'ROLE',
    approverRefId: '',
    actionOnApprove: 'NEXT_STEP',
    roleApprovalMode: 'ANY_ONE',
    roleApprovalThreshold: 1,
    timeLimitHours: '',
    notifyOnEnter: true,
    description: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, stepsRes, usersRes, rolesRes, deptRes] = await Promise.allSettled([
        workflowApi.getById(id),
        workflowApi.getSteps(id),
        userApi.getUsers({ size: 1000 }),
        roleApi.getAll(),
        departmentApi.getTree()
      ]);

      if (wfRes.status === 'fulfilled') setWorkflow(wfRes.value.data);
      if (stepsRes.status === 'fulfilled') setSteps(stepsRes.value.data || []);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data?.content || []);
      if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.data || []);
      if (deptRes.status === 'fulfilled') {
        // Flat the tree if needed, or use as is
        setDepartments(deptRes.value.data || []);
      }
    } catch {
      toast('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingStep(null);
    setStepForm({
      name: '',
      approverType: 'ROLE',
      approverRefId: '',
      actionOnApprove: 'NEXT_STEP',
      roleApprovalMode: 'ANY_ONE',
      roleApprovalThreshold: 1,
      timeLimitHours: '',
      notifyOnEnter: true,
      description: ''
    });
    setShowStepModal(true);
  };

  const handleOpenEdit = (step) => {
    setEditingStep(step);
    setStepForm({
      name: step.name,
      approverType: step.approverType,
      approverRefId: step.approverRefId || '',
      actionOnApprove: step.actionOnApprove,
      roleApprovalMode: step.roleApprovalMode || 'ANY_ONE',
      roleApprovalThreshold: step.roleApprovalThreshold || 1,
      timeLimitHours: step.timeLimitHours || '',
      notifyOnEnter: step.notifyOnEnter ?? true,
      description: step.description || ''
    });
    setShowStepModal(true);
  };

  const handleSaveStep = async (e) => {
    e.preventDefault();
    if (!stepForm.name.trim()) return toast('Vui lòng nhập tên bước', 'warning');
    if (['ROLE', 'USER', 'SPECIFIC_DEPARTMENT_HEAD'].includes(stepForm.approverType) && !stepForm.approverRefId) {
      return toast('Vui lòng chọn đối tượng phê duyệt tương ứng', 'warning');
    }

    const payload = {
      name: stepForm.name.trim(),
      approverType: stepForm.approverType,
      approverRefId: stepForm.approverRefId ? Number(stepForm.approverRefId) : null,
      actionOnApprove: stepForm.actionOnApprove,
      roleApprovalMode: stepForm.approverType === 'ROLE' ? stepForm.roleApprovalMode : null,
      roleApprovalThreshold: stepForm.approverType === 'ROLE' && stepForm.roleApprovalMode === 'THRESHOLD' ? Number(stepForm.roleApprovalThreshold) : null,
      timeLimitHours: stepForm.timeLimitHours ? Number(stepForm.timeLimitHours) : null,
      notifyOnEnter: stepForm.notifyOnEnter,
      description: stepForm.description.trim()
    };

    setActionLoading(true);
    try {
      if (editingStep) {
        await workflowApi.updateStep(id, editingStep.id, payload);
        toast('Cập nhật bước phê duyệt thành công!', 'success');
      } else {
        await workflowApi.addStep(id, payload);
        toast('Thêm bước phê duyệt thành công!', 'success');
      }
      setShowStepModal(false);
      // reload steps
      const { data } = await workflowApi.getSteps(id);
      setSteps(data || []);
    } catch (err) {
      toast(err?.response?.data?.message || 'Lỗi lưu bước phê duyệt', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bước này?')) return;
    try {
      await workflowApi.deleteStep(id, stepId);
      toast('Xóa bước phê duyệt thành công', 'success');
      setSteps(steps.filter(s => s.id !== stepId));
    } catch (err) {
      toast('Không thể xóa bước', 'error');
    }
  };

  const handleMove = async (index, direction) => {
    const newSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === newSteps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // Swap
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Send reorder request
    try {
      const stepIds = newSteps.map(s => s.id);
      await workflowApi.reorderSteps(id, { stepIds });
      // Update local state orders
      const updatedSteps = newSteps.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
      setSteps(updatedSteps);
      toast('Đã thay đổi thứ tự các bước', 'success');
    } catch {
      toast('Lỗi khi thay đổi thứ tự các bước', 'error');
    }
  };

  const getApproverLabel = (step) => {
    if (step.approverType === 'USER') {
      const u = users.find(x => x.id === step.approverRefId);
      return `Thành viên: ${u ? u.fullName : `ID ${step.approverRefId}`}`;
    }
    if (step.approverType === 'ROLE') {
      const r = roles.find(x => x.id === step.approverRefId);
      return `Vai trò: ${r ? r.name : `ID ${step.approverRefId}`}`;
    }
    if (step.approverType === 'SPECIFIC_DEPARTMENT_HEAD') {
      const d = departments.find(x => x.id === step.approverRefId);
      return `Trưởng phòng: ${d ? d.name : `ID ${step.approverRefId}`}`;
    }
    if (step.approverType === 'DEPARTMENT_HEAD') return 'Trưởng phòng người tạo';
    if (step.approverType === 'DIRECT_MANAGER') return 'Quản lý trực tiếp';
    return step.approverType;
  };

  if (loading) return <div className="p-8"><Spinner label="Đang tải cấu hình..." /></div>;
  if (!workflow) return <div className="p-8 text-center text-rose-400">Không tìm thấy quy trình yêu cầu.</div>;

  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-extrabold text-white">Cấu Hình Bước Phê Duyệt</h2>
            </div>
            <p className="text-xs text-slate-400">Quy trình: <span className="text-indigo-400 font-bold">{workflow.name}</span> (v{workflow.version})</p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} icon={Plus}>Thêm bước phê duyệt</Button>
      </div>

      {/* Description card */}
      <div className="bg-slate-900/60 border border-slate-700/40 p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-2">Thông tin quy trình</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{workflow.description || 'Chưa có mô tả cho quy trình này.'}</p>
        <div className="flex gap-4 mt-3 text-[11px] text-slate-500">
          <span>Loại yêu cầu: <span className="text-indigo-400 font-semibold">{workflow.requestTypeName}</span></span>
          <span>Trạng thái: <span className={workflow.isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-semibold'}>{workflow.isActive ? 'Đang hoạt động' : 'Không hoạt động'}</span></span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {sortedSteps.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-750 border-dashed rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Chưa cấu hình bước phê duyệt nào</p>
            <p className="text-xs text-slate-500 mt-1">Bấm "Thêm bước phê duyệt" để thiết lập luồng duyệt cho quy trình.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSteps.map((step, index) => (
              <div key={step.id} className="flex gap-4 items-start bg-slate-900/65 border border-slate-750 p-4 rounded-xl relative group transition-colors hover:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {step.stepOrder}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm">{step.name}</h4>
                    {step.actionOnApprove === 'COMPLETE' && (
                      <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Bước cuối
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-300 font-medium">{getApproverLabel(step)}</p>
                  {step.description && <p className="text-xs text-slate-400 italic">{step.description}</p>}
                  
                  <div className="flex gap-3 text-[10px] text-slate-500 pt-1">
                    {step.timeLimitHours ? <span>Hạn xử lý: {step.timeLimitHours}h</span> : <span>Không giới hạn thời gian</span>}
                    <span>·</span>
                    <span>Thông báo: {step.notifyOnEnter ? 'Có' : 'Không'}</span>
                    {step.approverType === 'ROLE' && (
                      <>
                        <span>·</span>
                        <span>Duyệt theo vai trò: {step.roleApprovalMode} {step.roleApprovalThreshold ? `(Ngưỡng: ${step.roleApprovalThreshold})` : ''}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleMove(index, 'down')} disabled={index === sortedSteps.length - 1} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleOpenEdit(step)} className="p-1.5 text-slate-400 hover:text-indigo-400">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteStep(step.id)} className="p-1.5 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step Modal */}
      <Modal isOpen={showStepModal} onClose={() => setShowStepModal(false)} title={editingStep ? 'Cập nhật bước phê duyệt' : 'Thêm bước phê duyệt'} size="md">
        <form onSubmit={handleSaveStep} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên bước *</label>
            <input
              value={stepForm.name}
              onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
              placeholder="VD: Trưởng phòng duyệt"
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Loại người duyệt *</label>
              <select
                value={stepForm.approverType}
                onChange={(e) => setStepForm({ ...stepForm, approverType: e.target.value, approverRefId: '' })}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ROLE">Theo vai trò (Role)</option>
                <option value="USER">Thành viên cụ thể (User)</option>
                <option value="DEPARTMENT_HEAD">Trưởng phòng người tạo</option>
                <option value="DIRECT_MANAGER">Quản lý trực tiếp</option>
                <option value="SPECIFIC_DEPARTMENT_HEAD">Trưởng phòng cụ thể</option>
              </select>
            </div>

            {/* Conditionally show Ref ID selector based on approverType */}
            {stepForm.approverType === 'ROLE' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Chọn Vai trò *</label>
                <select
                  value={stepForm.approverRefId}
                  onChange={(e) => setStepForm({ ...stepForm, approverRefId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}

            {stepForm.approverType === 'USER' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Chọn Thành viên *</label>
                <select
                  value={stepForm.approverRefId}
                  onChange={(e) => setStepForm({ ...stepForm, approverRefId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn user --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>)}
                </select>
              </div>
            )}

            {stepForm.approverType === 'SPECIFIC_DEPARTMENT_HEAD' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Chọn Phòng ban *</label>
                <select
                  value={stepForm.approverRefId}
                  onChange={(e) => setStepForm({ ...stepForm, approverRefId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* If ROLE, show role approval mode settings */}
          {stepForm.approverType === 'ROLE' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-750">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Chế độ duyệt vai trò</label>
                <select
                  value={stepForm.roleApprovalMode}
                  onChange={(e) => setStepForm({ ...stepForm, roleApprovalMode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ANY_ONE">Bất kỳ ai (Any One)</option>
                  <option value="ALL">Tất cả mọi người (All)</option>
                  <option value="THRESHOLD">Đạt số lượng tối thiểu (Threshold)</option>
                </select>
              </div>

              {stepForm.roleApprovalMode === 'THRESHOLD' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Số người duyệt tối thiểu</label>
                  <input
                    type="number"
                    min={1}
                    value={stepForm.roleApprovalThreshold}
                    onChange={(e) => setStepForm({ ...stepForm, roleApprovalThreshold: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-750">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Hành động khi duyệt</label>
              <select
                value={stepForm.actionOnApprove}
                onChange={(e) => setStepForm({ ...stepForm, actionOnApprove: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="NEXT_STEP">Chuyển bước tiếp theo</option>
                <option value="COMPLETE">Hoàn thành quy trình (Phê duyệt xong)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Thời gian xử lý tối đa (Giờ)</label>
              <input
                type="number"
                min={1}
                placeholder="Để trống nếu không giới hạn"
                value={stepForm.timeLimitHours}
                onChange={(e) => setStepForm({ ...stepForm, timeLimitHours: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stepForm.notifyOnEnter}
                onChange={(e) => setStepForm({ ...stepForm, notifyOnEnter: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
              />
              <span className="text-xs text-slate-300 font-medium">Gửi thông báo khi quy trình vào bước này</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Mô tả bước</label>
            <textarea
              rows={2}
              value={stepForm.description}
              onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
              placeholder="VD: Kiểm tra hóa đơn, chứng từ đi kèm..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowStepModal(false)}>Hủy</Button>
            <Button type="submit" loading={actionLoading} icon={Save}>Lưu bước</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
