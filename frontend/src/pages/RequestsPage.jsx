import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, FileText, Clock, CheckCircle2, Send, Trash2, X, RotateCcw } from 'lucide-react';
import { requestApi } from '../api/requestApi';
import { useToast } from '../hooks/useToast';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { formatDate, formatDateTime, truncate, parsePage } from '../utils/helpers';
import { REQUEST_STATUS } from '../utils/constants';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: REQUEST_STATUS.DRAFT, label: 'Bản nháp' },
  { value: REQUEST_STATUS.SUBMITTED, label: 'Đã nộp' },
  { value: REQUEST_STATUS.IN_REVIEW, label: 'Đang xem xét' },
  { value: REQUEST_STATUS.APPROVED, label: 'Đã duyệt' },
  { value: REQUEST_STATUS.REJECTED, label: 'Từ chối' },
  { value: REQUEST_STATUS.RETURNED, label: 'Trả lại' },
];

export default function RequestsPage() {
  const context = useOutletContext();
  const { showCreateModal, setShowCreateModal } = context || {};
  const toast = useToast();

  // List state
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [approvals, setApprovals] = useState([]);

  // Create form state
  const [createForm, setCreateForm] = useState({ title: '', requestTypeId: '', note: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState(null); // { type: 'submit'|'cancel'|'delete', id, title }

  const searchTimer = useRef(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await requestApi.getMyRequests(params);
      setPageData(parsePage(data));
    } catch {
      toast('Không thể tải danh sách yêu cầu', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSearchChange = (e) => {
    clearTimeout(searchTimer.current);
    setSearch(e.target.value);
    searchTimer.current = setTimeout(() => { setPage(0); fetchRequests(); }, 500);
  };

  // Open detail panel
  const openDetail = async (req) => {
    setSelected(req);
    setDetailLoading(true);
    try {
      const [logsRes, approvalsRes] = await Promise.allSettled([
        requestApi.getRequestLogs(req.id),
        requestApi.getRequestApprovals(req.id),
      ]);
      setLogs(logsRes.status === 'fulfilled' ? logsRes.value.data : []);
      setApprovals(approvalsRes.status === 'fulfilled' ? approvalsRes.value.data : []);
    } finally {
      setDetailLoading(false);
    }
  };

  // Actions
  const handleSubmit = async (id) => {
    try {
      await requestApi.submitRequest(id);
      toast('Đã nộp yêu cầu thành công!', 'success');
      setActionModal(null);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể nộp yêu cầu', 'error');
    }
  };

  const handleCancel = async (id) => {
    try {
      await requestApi.cancelRequest(id);
      toast('Đã hủy yêu cầu.', 'info');
      setActionModal(null);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể hủy yêu cầu', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await requestApi.deleteRequest(id);
      toast('Đã xóa yêu cầu.', 'info');
      setActionModal(null);
      fetchRequests();
      setSelected(null);
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể xóa yêu cầu', 'error');
    }
  };

  // Create request
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) { toast('Vui lòng nhập tiêu đề', 'warning'); return; }
    setCreateLoading(true);
    try {
      await requestApi.createRequest({
        title: createForm.title,
        note: createForm.note,
        requestTypeId: createForm.requestTypeId ? Number(createForm.requestTypeId) : undefined,
        formData: {},
      });
      toast('Đã tạo yêu cầu mới (bản nháp)!', 'success');
      setShowCreateModal?.(false);
      setCreateForm({ title: '', requestTypeId: '', note: '' });
      setPage(0);
      fetchRequests();
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể tạo yêu cầu', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredContent = search
    ? pageData.content.filter(
        (r) =>
          r.title?.toLowerCase().includes(search.toLowerCase()) ||
          r.requestNo?.toLowerCase().includes(search.toLowerCase())
      )
    : pageData.content;

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left: List ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm theo tiêu đề, mã..."
              className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <Button onClick={() => setShowCreateModal?.(true)} icon={Plus} size="sm">
              Tạo mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
          {loading ? (
            <Spinner />
          ) : filteredContent.length === 0 ? (
            <EmptyState
              title="Không có yêu cầu nào"
              description="Tạo yêu cầu mới để bắt đầu quy trình phê duyệt."
              action={<Button onClick={() => setShowCreateModal?.(true)} icon={Plus} size="sm">Tạo yêu cầu</Button>}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Mã / Tiêu đề</th>
                  <th className="text-left px-4 py-3">Loại</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Ưu tiên</th>
                  <th className="text-left px-4 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContent.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => openDetail(req)}
                    className={`cursor-pointer transition-colors hover:bg-slate-800/40 ${
                      selected?.id === req.id ? 'bg-indigo-600/5 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-bold text-indigo-400">{req.requestNo}</p>
                      <p className="font-semibold text-white mt-0.5">{truncate(req.title, 50)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{req.requestTypeName || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && pageData.totalPages > 1 && (
          <Pagination
            page={pageData.number}
            totalPages={pageData.totalPages}
            totalElements={pageData.totalElements}
            size={pageData.size}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Right: Detail Panel ── */}
      {selected && (
        <div className="w-80 shrink-0 bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-6">
          {/* Detail header */}
          <div className="px-5 py-4 border-b border-slate-700/40 flex items-start justify-between gap-2 shrink-0">
            <div>
              <p className="text-[11px] font-bold text-indigo-400">{selected.requestNo}</p>
              <p className="text-sm font-bold text-white mt-0.5 leading-snug">{selected.title}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {detailLoading ? (
            <Spinner size="sm" />
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
              {/* Meta */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ưu tiên</span>
                  <PriorityBadge priority={selected.priority} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quy trình</span>
                  <span className="text-slate-300 font-semibold">{selected.workflowName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bước hiện tại</span>
                  <span className="text-slate-300 font-semibold">{selected.currentStep ?? '—'}</span>
                </div>
                {selected.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hạn xử lý</span>
                    <span className="text-amber-400 font-semibold">{formatDate(selected.dueDate)}</span>
                  </div>
                )}
              </div>

              {selected.note && (
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-slate-400 font-semibold mb-1">Ghi chú</p>
                  <p className="text-slate-300 leading-relaxed">{selected.note}</p>
                </div>
              )}

              {/* Approval timeline */}
              {approvals.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử phê duyệt</p>
                  <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-700">
                    {approvals.map((a, idx) => (
                      <div key={idx} className="flex gap-3 relative z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          a.action === 'APPROVE' ? 'bg-emerald-500 text-white' :
                          a.action === 'REJECT'  ? 'bg-rose-500 text-white' :
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

              {/* Audit logs */}
              {logs.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-3">Nhật ký</p>
                  <div className="space-y-2">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Clock className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-300 font-semibold">{log.action}</p>
                          <p className="text-slate-500">{log.actorFullName} · {formatDateTime(log.createdAt)}</p>
                          {log.note && <p className="text-slate-500 italic">{log.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="px-5 py-4 border-t border-slate-700/40 space-y-2 shrink-0">
            {selected.status === 'DRAFT' && (
              <>
                <Button
                  onClick={() => setActionModal({ type: 'submit', id: selected.id, title: selected.title })}
                  icon={Send} size="sm" className="w-full"
                >
                  Nộp yêu cầu
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setActionModal({ type: 'delete', id: selected.id, title: selected.title })}
                    variant="danger" icon={Trash2} size="sm" className="flex-1"
                  >
                    Xóa
                  </Button>
                </div>
              </>
            )}
            {['SUBMITTED', 'IN_REVIEW'].includes(selected.status) && (
              <Button
                onClick={() => setActionModal({ type: 'cancel', id: selected.id, title: selected.title })}
                variant="ghost" icon={RotateCcw} size="sm" className="w-full"
              >
                Hủy yêu cầu
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Create Request Modal ── */}
      <Modal
        isOpen={!!showCreateModal}
        onClose={() => setShowCreateModal?.(false)}
        title="Tạo yêu cầu mới"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tiêu đề yêu cầu *</label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Nhập tiêu đề ngắn gọn..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Ghi chú (tuỳ chọn)</label>
            <textarea
              rows={4}
              value={createForm.note}
              onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Mô tả chi tiết yêu cầu..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal?.(false)}>Hủy</Button>
            <Button type="submit" loading={createLoading}>Tạo bản nháp</Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Action Modal ── */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'submit' ? 'Xác nhận nộp yêu cầu' :
          actionModal?.type === 'cancel' ? 'Xác nhận hủy yêu cầu' :
          'Xác nhận xóa yêu cầu'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {actionModal?.type === 'submit'
              ? `Nộp yêu cầu "${truncate(actionModal?.title, 50)}" vào quy trình phê duyệt?`
              : actionModal?.type === 'cancel'
              ? `Hủy yêu cầu "${truncate(actionModal?.title, 50)}"? Hành động này không thể hoàn tác.`
              : `Xóa vĩnh viễn yêu cầu "${truncate(actionModal?.title, 50)}"?`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Quay lại</Button>
            <Button
              variant={actionModal?.type === 'submit' ? 'primary' : 'danger'}
              onClick={() => {
                if (actionModal?.type === 'submit') handleSubmit(actionModal.id);
                else if (actionModal?.type === 'cancel') handleCancel(actionModal.id);
                else handleDelete(actionModal.id);
              }}
            >
              {actionModal?.type === 'submit' ? 'Nộp ngay' :
               actionModal?.type === 'cancel' ? 'Hủy yêu cầu' : 'Xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
