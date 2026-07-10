import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle, Eye, Paperclip } from 'lucide-react';
import { requestApi } from '../api/requestApi';
import { formApi } from '../api/formApi';
import { requestTypeApi } from '../api/requestTypeApi';
import { attachmentApi } from '../api/attachmentApi';
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

  const [detailModal, setDetailModal] = useState(null); // Full request object to show details
  const [detailLogs, setDetailLogs] = useState([]);
  const [detailApprovals, setDetailApprovals] = useState([]);
  const [detailFormSchema, setDetailFormSchema] = useState(null);
  const [detailAttachments, setDetailAttachments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetailModal = async (item) => {
    setDetailLoading(true);
    setDetailModal(item);
    setDetailFormSchema(null);
    setDetailAttachments([]);
    setDetailLogs([]);
    setDetailApprovals([]);
    try {
      const { data: fullReq } = await requestApi.getRequestById(item.requestId);
      setDetailModal(fullReq);

      let formPromise;
      if (fullReq.formId) {
        formPromise = formApi.getById(fullReq.formId).then(res => res.data);
      } else if (fullReq.requestTypeId) {
        formPromise = requestTypeApi.getActiveForm(fullReq.requestTypeId).then(res => res.data);
      } else {
        formPromise = Promise.reject('No form template found');
      }

      const [logsRes, approvalsRes, formRes, attachmentsRes] = await Promise.allSettled([
        requestApi.getRequestLogs(fullReq.id),
        requestApi.getRequestApprovals(fullReq.id),
        formPromise,
        attachmentApi.getByRequestId(fullReq.id),
      ]);

      setDetailLogs(logsRes.status === 'fulfilled' ? logsRes.value.data : []);
      setDetailApprovals(approvalsRes.status === 'fulfilled' ? approvalsRes.value.data : []);
      setDetailFormSchema(formRes.status === 'fulfilled' ? formRes.value?.schemaData || null : null);
      setDetailAttachments(attachmentsRes.status === 'fulfilled' ? attachmentsRes.value.data : []);
    } catch (err) {
      console.error('Failed to load request details', err);
      toast('Không thể tải chi tiết yêu cầu', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

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
          type === 'reject' ? 'Đã từ chối yêu cầu.' :
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
              className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 transition-all cursor-pointer hover:border-indigo-500/40 ${selected?.requestId === item.requestId
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
              <div className="space-y-2">
                <Button
                  onClick={(e) => { e.stopPropagation(); openDetailModal(item); }}
                  variant="secondary" icon={Eye} size="sm" className="w-full justify-center"
                >
                  Xem chi tiết
                </Button>
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
            <div className={`p-4 rounded-xl border ${actionModal.type === 'approve' ? 'bg-emerald-500/5 border-emerald-500/20' :
                actionModal.type === 'reject' ? 'bg-rose-500/5 border-rose-500/20' :
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
      {/* ── Detail Modal ── */}
      {detailModal && (
        <Modal
          isOpen
          onClose={() => setDetailModal(null)}
          title={`Chi tiết yêu cầu: ${detailModal.requestNo || ''}`}
          size="lg"
        >
          {detailLoading ? (
            <Spinner label="Đang tải chi tiết..." />
          ) : (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-800/40 p-4 border border-slate-700/30 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Tiêu đề</span>
                  <span className="font-bold text-white text-sm">{detailModal.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Độ ưu tiên</span>
                  <PriorityBadge priority={detailModal.priority} />
                </div>
                <div>
                  <span className="text-slate-500 block">Người yêu cầu</span>
                  <span className="font-semibold text-slate-200">{detailModal.requesterFullName} ({detailModal.requesterUsername})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phòng ban</span>
                  <span className="text-slate-300">{detailModal.requesterDepartment || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trạng thái</span>
                  <StatusBadge status={detailModal.status} />
                </div>
                <div>
                  <span className="text-slate-500 block">Hạn xử lý</span>
                  <span className="text-slate-300">{detailModal.dueDate ? formatDate(detailModal.dueDate) : '—'}</span>
                </div>
              </div>

              {/* Form fields */}
              {detailFormSchema?.fields && detailFormSchema.fields.length > 0 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Thông tin chi tiết biểu mẫu</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-850/20 border border-slate-700/20 rounded-xl p-4">
                    {detailFormSchema.fields.map((field) => {
                      const val = detailModal.formData?.[field.name];
                      const isFile = field.type === 'file';
                      const formattedVal = Array.isArray(val) ? val.join(', ') : (val === true ? 'Có/Đồng ý' : (val === false ? 'Không' : val));

                      return (
                        <div key={field.name} className="space-y-1">
                          <span className="text-slate-500 block text-[11px] font-medium">{field.label}</span>
                          <div className="text-xs text-white">
                            {isFile ? (
                              val?.fileName ? (
                                <span className="text-indigo-400 italic">Xem tập tin đính kèm phía dưới</span>
                              ) : (
                                <span className="text-slate-500 italic">Không đính kèm file</span>
                              )
                            ) : formattedVal !== undefined && formattedVal !== '' ? (
                              <span className="font-semibold">{formattedVal}</span>
                            ) : (
                              <span className="text-slate-500 italic">Trống</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note / Description */}
              {detailModal.note && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Ghi chú</p>
                  <div className="bg-slate-800/20 border border-slate-700/20 rounded-xl p-3 text-xs text-slate-300">
                    {detailModal.note}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {detailAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tập tin đính kèm ({detailAttachments.length})</p>
                  <div className="space-y-1.5 bg-slate-800/20 border border-slate-700/20 rounded-xl p-3">
                    {detailAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => attachmentApi.downloadFile(att.id, att.fileName)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-left hover:underline truncate max-w-[300px]"
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{att.fileName}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Workflow Steps */}
              {detailModal.workflowSteps && detailModal.workflowSteps.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-700/40">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Luồng phê duyệt</p>
                  <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-700/60">
                    {detailModal.workflowSteps.map((step) => {
                      const isApproved = step.status === 'APPROVED';
                      const isPending = step.status === 'PENDING';
                      const isRejected = step.status === 'REJECTED';
                      const isReturned = step.status === 'RETURNED';

                      let iconColor = 'bg-slate-800 text-slate-500 border border-slate-700';
                      let textColor = 'text-slate-400';
                      let badge = null;

                      if (isApproved) {
                        iconColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
                        textColor = 'text-slate-200';
                      } else if (isPending) {
                        iconColor = 'bg-amber-500/25 text-amber-400 border border-amber-500/50 ring-2 ring-amber-500/10';
                        textColor = 'text-white font-semibold';
                        badge = <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 ml-2 animate-pulse">Đang xử lý</span>;
                      } else if (isRejected) {
                        iconColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
                        textColor = 'text-rose-400';
                        badge = <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 ml-2">Từ chối</span>;
                      } else if (isReturned) {
                        iconColor = 'bg-sky-500/20 text-sky-400 border border-sky-500/40';
                        textColor = 'text-sky-400';
                        badge = <span className="text-[9px] font-bold bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 ml-2">Trả lại</span>;
                      }

                      return (
                        <div key={step.id} className="relative flex gap-3.5 items-start pl-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shrink-0 ${iconColor}`}>
                            {isApproved ? '✓' : isRejected ? '✕' : isReturned ? '↩' : step.stepOrder}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className={`text-xs ${textColor}`}>{step.name}</p>
                              {badge}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Vai trò: <span className="text-slate-400 font-medium">{step.approverType}</span>
                            </p>
                            {step.resolvedApprovers && step.resolvedApprovers.length > 0 && (
                              <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
                                <span className="text-slate-500 shrink-0">Người duyệt:</span>
                                <span className="font-semibold text-indigo-300 truncate" title={step.resolvedApprovers.join(', ')}>
                                  {step.resolvedApprovers.join(', ')}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Approval timeline */}
              {detailApprovals.length > 0 && (
                <div className="pt-3 border-t border-slate-700/40">
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-3 text-[10px]">Lịch sử phê duyệt</p>
                  <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-700">
                    {detailApprovals.map((a, idx) => (
                      <div key={idx} className="flex gap-3 relative z-10 text-xs">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${a.action === 'APPROVE' ? 'bg-emerald-500 text-white' :
                            a.action === 'REJECT' ? 'bg-rose-500 text-white' :
                              'bg-amber-500 text-white'
                          }`}>
                          {a.action === 'APPROVE' ? '✓' : a.action === 'REJECT' ? '✕' : '↩'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{a.approverFullName || a.approverUsername}</p>
                          <p className="text-slate-500">{formatDateTime(a.actionAt)}</p>
                          {a.comment && <p className="text-slate-400 mt-0.5 italic">"{a.comment}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-slate-700/40 mt-6">
            <Button variant="ghost" onClick={() => setDetailModal(null)}>Đóng</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
