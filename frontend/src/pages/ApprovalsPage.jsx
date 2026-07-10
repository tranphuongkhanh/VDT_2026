import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { requestApi } from '../api/requestApi';
import { useToast } from '../hooks/useToast';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../utils/helpers';

const ACTION_CONFIG = {
  approve: {
    label: 'Phê duyệt',
    title: 'Xác nhận phê duyệt',
    icon: CheckCircle2,
    variant: 'success',
    color: 'emerald',
    placeholder: 'Nhận xét khi phê duyệt (tuỳ chọn)...',
  },
  reject: {
    label: 'Từ chối',
    title: 'Xác nhận từ chối',
    icon: XCircle,
    variant: 'danger',
    color: 'rose',
    placeholder: 'Lý do từ chối (bắt buộc)...',
    required: true,
  },
  return: {
    label: 'Trả lại',
    title: 'Trả lại để bổ sung',
    icon: RotateCcw,
    variant: 'ghost',
    color: 'amber',
    placeholder: 'Nội dung cần bổ sung...',
    required: true,
  },
};

export default function ApprovalsPage() {
  const { setPendingCount } = useOutletContext() || {};
  const toast = useToast();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type, item }
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await requestApi.getPendingApprovals();
      setPending(data || []);
      setPendingCount?.(data?.length ?? 0);
    } catch {
      toast('Không thể tải danh sách phê duyệt', 'error');
    } finally {
      setLoading(false);
    }
  }, [setPendingCount, toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const openActionModal = (type, item) => {
    setActionModal({ type, item });
    setComment('');
  };

  const handleAction = async () => {
    const { type, item } = actionModal;
    const config = ACTION_CONFIG[type];
    if (config.required && !comment.trim()) {
      toast('Vui lòng nhập nội dung bắt buộc', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const payload = { comment: comment.trim() || undefined };
      if (type === 'approve') await requestApi.approveRequest(item.requestId, payload);
      else if (type === 'reject') await requestApi.rejectRequest(item.requestId, payload);
      else if (type === 'return') await requestApi.returnRequest(item.requestId, payload);

      toast(
        type === 'approve' ? 'Đã phê duyệt thành công!' :
        type === 'reject'  ? 'Đã từ chối yêu cầu.' :
                             'Đã trả lại yêu cầu để bổ sung.',
        type === 'approve' ? 'success' : type === 'reject' ? 'error' : 'warning'
      );
      setActionModal(null);
      setSelected(null);
      fetchPending();
    } catch (err) {
      toast(err?.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner label="Đang tải hàng chờ phê duyệt..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">Hàng Chờ Phê Duyệt</h2>
          <p className="text-xs text-slate-400">
            {pending.length > 0
              ? `${pending.length} yêu cầu đang chờ xử lý`
              : 'Không có yêu cầu nào đang chờ'}
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Tất cả đã được xử lý!"
          description="Không có yêu cầu nào đang chờ bạn phê duyệt."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map((item) => (
            <div
              key={item.requestId}
              className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 transition-all cursor-pointer hover:border-indigo-500/40 ${
                selected?.requestId === item.requestId
                  ? 'border-indigo-500/60 bg-indigo-600/5'
                  : 'border-slate-700/40'
              }`}
              onClick={() => setSelected(item)}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-indigo-400 mb-0.5">{item.requestNo}</p>
                  <p className="font-bold text-white text-sm leading-snug">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.requesterFullName}
                    {item.requesterDepartment && ` · ${item.requesterDepartment}`}
                  </p>
                </div>
                <PriorityBadge priority={item.priority} />
              </div>

              {/* Step info */}
              <div className="bg-slate-800/50 rounded-xl px-3 py-2.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bước xử lý</span>
                  <span className="font-semibold text-slate-200">{item.currentStepName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loại yêu cầu</span>
                  <span className="text-slate-300">{item.requestTypeName || '—'}</span>
                </div>
                {item.timeLimitHours && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giới hạn thời gian</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timeLimitHours}h
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày nộp</span>
                  <span className="text-slate-300">{formatDate(item.submittedAt)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={(e) => { e.stopPropagation(); openActionModal('approve', item); }}
                  variant="success" icon={CheckCircle2} size="sm" className="flex-1"
                >
                  Duyệt
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); openActionModal('reject', item); }}
                  variant="danger" icon={XCircle} size="sm" className="flex-1"
                >
                  Từ chối
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); openActionModal('return', item); }}
                  variant="ghost" icon={RotateCcw} size="sm" className="flex-1"
                >
                  Trả lại
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <Modal
          isOpen
          onClose={() => setActionModal(null)}
          title={ACTION_CONFIG[actionModal.type].title}
          size="sm"
        >
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              actionModal.type === 'approve' ? 'bg-emerald-500/5 border-emerald-500/20' :
              actionModal.type === 'reject'  ? 'bg-rose-500/5 border-rose-500/20' :
                                               'bg-amber-500/5 border-amber-500/20'
            }`}>
              <p className="text-sm font-bold text-white">{actionModal.item.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {actionModal.item.requesterFullName} · {actionModal.item.requestNo}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nhận xét {ACTION_CONFIG[actionModal.type].required ? <span className="text-rose-400">*</span> : '(tuỳ chọn)'}
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={ACTION_CONFIG[actionModal.type].placeholder}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setActionModal(null)}>Hủy</Button>
              <Button
                variant={ACTION_CONFIG[actionModal.type].variant}
                icon={ACTION_CONFIG[actionModal.type].icon}
                loading={actionLoading}
                onClick={handleAction}
              >
                {ACTION_CONFIG[actionModal.type].label}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
