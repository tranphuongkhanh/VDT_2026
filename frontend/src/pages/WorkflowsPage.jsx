import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Plus, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { workflowApi } from '../api/workflowApi';
import { requestTypeApi } from '../api/requestTypeApi';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/helpers';
import WorkflowStepsModal from '../components/WorkflowStepsModal';

function WorkflowCard({ workflow, onActivate, onConfigureSteps }) {
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);

  const toggleSteps = async () => {
    if (!expanded) {
      setStepsLoading(true);
      try {
        const { data } = await workflowApi.getSteps(workflow.id);
        setSteps(data || []);
      } catch {
        // ignore
      } finally {
        setStepsLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden hover:border-slate-600/60 transition-colors">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${workflow.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${workflow.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {workflow.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">{workflow.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{workflow.requestTypeName}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500">Phiên bản</p>
            <p className="text-xs font-bold text-slate-300">v{workflow.version}</p>
          </div>
        </div>

        {workflow.description && (
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{workflow.description}</p>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Tạo bởi: {workflow.createdByUsername} · {formatDate(workflow.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <button
          onClick={toggleSteps}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Xem các bước
        </button>

        {!workflow.isActive && (
          <Button
            onClick={() => onActivate(workflow.id)}
            variant="ghost" size="sm" icon={Zap} className="ml-auto"
          >
            Kích hoạt
          </Button>
        )}
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4">
          {stepsLoading ? (
            <Spinner size="sm" label="Đang tải các bước..." />
          ) : steps.length === 0 ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-slate-500">Chưa có bước nào được cấu hình.</p>
              <Button onClick={() => onConfigureSteps(workflow.id)} size="sm" variant="secondary" icon={Plus}>
                Thiết lập bước
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Các bước:</p>
                <button type="button" onClick={() => onConfigureSteps(workflow.id)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Cấu hình các bước
                </button>
              </div>
              {steps.sort((a, b) => a.stepOrder - b.stepOrder).map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {step.stepOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{step.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {step.approverType} {step.timeLimitHours ? `· ${step.timeLimitHours}h` : ''}
                    </p>
                    {step.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 italic">{step.description}</p>
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="absolute left-3 mt-6 w-px h-4 bg-slate-700" style={{ position: 'relative', left: '-1.75rem', top: '1.25rem' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', requestTypeId: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Steps Modal State
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [selectedStepsWorkflowId, setSelectedStepsWorkflowId] = useState(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, rtRes] = await Promise.allSettled([
        workflowApi.getAll(),
        requestTypeApi.getAll({ size: 1000 })
      ]);
      if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value.data || []);
      if (rtRes.status === 'fulfilled') setRequestTypes(rtRes.value.data?.content || []);
    } catch {
      toast('Không thể tải danh sách quy trình', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleActivate = async (id) => {
    try {
      await workflowApi.activate(id);
      toast('Đã kích hoạt quy trình!', 'success');
      fetchWorkflows();
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể kích hoạt', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) { toast('Vui lòng nhập tên quy trình', 'warning'); return; }
    if (!createForm.requestTypeId) { toast('Vui lòng chọn loại yêu cầu', 'warning'); return; }
    setCreateLoading(true);
    try {
      const { data } = await workflowApi.create({
        name: createForm.name,
        description: createForm.description,
        requestTypeId: Number(createForm.requestTypeId),
      });
      toast('Đã tạo quy trình mới, đang mở thiết lập bước...', 'success');
      setShowCreate(false);
      setCreateForm({ name: '', description: '', requestTypeId: '' });
      fetchWorkflows();
      if (data?.id) {
        setSelectedStepsWorkflowId(data.id);
        setShowStepsModal(true);
      }
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể tạo quy trình', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <GitFork className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Quy Trình Phê Duyệt</h2>
            <p className="text-xs text-slate-400">{workflows.length} quy trình trong hệ thống</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={Plus}>Tạo quy trình</Button>
      </div>

      {loading ? (
        <Spinner label="Đang tải quy trình..." />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={GitFork}
          title="Chưa có quy trình nào"
          description="Tạo quy trình đầu tiên để bắt đầu cấu hình các bước phê duyệt."
          action={<Button onClick={() => setShowCreate(true)} icon={Plus}>Tạo quy trình</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onActivate={handleActivate}
              onConfigureSteps={(wfId) => {
                setSelectedStepsWorkflowId(wfId);
                setShowStepsModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tạo quy trình mới" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên quy trình *</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Quy trình mua sắm thiết bị"
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Loại yêu cầu *</label>
            <select
              value={createForm.requestTypeId}
              onChange={(e) => setCreateForm((f) => ({ ...f, requestTypeId: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">-- Chọn loại yêu cầu --</option>
              {requestTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} ({rt.code})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Mô tả</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về quy trình..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button type="submit" loading={createLoading}>Tạo các bước</Button>
          </div>
        </form>
      </Modal>

      {/* Workflow Steps Modal */}
      <WorkflowStepsModal
        isOpen={showStepsModal}
        onClose={() => {
          setShowStepsModal(false);
          fetchWorkflows();
        }}
        workflowId={selectedStepsWorkflowId}
      />
    </div>
  );
}
