import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, FileText, Clock, CheckCircle2, Send, Trash2, X, RotateCcw, Edit2, Paperclip } from 'lucide-react';
import { requestApi } from '../api/requestApi';
import { requestTypeApi } from '../api/requestTypeApi';
import { formApi } from '../api/formApi';
import { attachmentApi } from '../api/attachmentApi';
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
  const [selectedFormSchema, setSelectedFormSchema] = useState(null);
  const [selectedFormLoading, setSelectedFormLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Create form state
  const [createForm, setCreateForm] = useState({ title: '', requestTypeId: '', note: '' });
  const [createPriority, setCreatePriority] = useState('NORMAL');
  const [createDueDate, setCreateDueDate] = useState('');
  const [formDataValues, setFormDataValues] = useState({});
  const [formFiles, setFormFiles] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const [requestTypes, setRequestTypes] = useState([]);
  const [activeSchema, setActiveSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editRequestId, setEditRequestId] = useState(null);

  // Action modal state
  const [actionModal, setActionModal] = useState(null); // { type: 'submit'|'cancel'|'delete', id, title }

  const fetchRequestTypes = useCallback(async () => {
    try {
      const { data } = await requestTypeApi.getAll({ page: 0, size: 100 });
      setRequestTypes(parsePage(data).content || []);
    } catch (err) {
      console.error('Failed to load request types', err);
    }
  }, []);

  useEffect(() => {
    fetchRequestTypes();
  }, [fetchRequestTypes]);

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
    setSearch(e.target.value);
    setPage(0);
  };

  // Open detail panel
  const openDetail = async (req) => {
    setDetailLoading(true);
    setSelectedFormLoading(true);
    setSelectedFormSchema(null);
    setAttachments([]);
    try {
      const { data: fullReq } = await requestApi.getRequestById(req.id);
      setSelected(fullReq);

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
      setLogs(logsRes.status === 'fulfilled' ? logsRes.value.data : []);
      setApprovals(approvalsRes.status === 'fulfilled' ? approvalsRes.value.data : []);

      const fetchedForm = formRes.status === 'fulfilled' ? formRes.value : null;
      setSelectedFormSchema(fetchedForm?.schemaData || null);

      setAttachments(attachmentsRes.status === 'fulfilled' ? attachmentsRes.value.data : []);
    } catch (err) {
      console.error('Failed to load request details', err);
      toast('Không thể tải chi tiết yêu cầu', 'error');
    } finally {
      setDetailLoading(false);
      setSelectedFormLoading(false);
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



  // Request Type Select Action
  const handleRequestTypeChange = async (typeId) => {
    setCreateForm((f) => ({ ...f, requestTypeId: typeId }));
    setActiveSchema(null);
    setFormDataValues({});
    setFormFiles({});
    setFormErrors({});

    if (!typeId) return;

    setSchemaLoading(true);
    try {
      const { data } = await requestTypeApi.getActiveForm(typeId);
      setActiveSchema(data?.schemaData || null);
    } catch (err) {
      toast('Không tìm thấy biểu mẫu cho loại yêu cầu này', 'warning');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleDynamicChange = (name, value) => {
    setFormDataValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (name, file) => {
    setFormFiles((prev) => ({ ...prev, [name]: file }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Edit draft or returned request
  const handleStartEdit = async (req) => {
    setIsEditing(true);
    setEditRequestId(req.id);
    setCreateForm({
      title: req.title,
      requestTypeId: req.requestTypeId,
      note: req.note || '',
    });
    setCreatePriority(req.priority || 'NORMAL');
    setCreateDueDate(req.dueDate || '');

    setSchemaLoading(true);
    try {
      let schema = null;
      if (req.formId) {
        const { data } = await formApi.getById(req.formId);
        schema = data?.schemaData;
      } else {
        const { data } = await requestTypeApi.getActiveForm(req.requestTypeId);
        schema = data?.schemaData;
      }
      setActiveSchema(schema || null);
      setFormDataValues(req.formData || {});
      setFormFiles({});
      setFormErrors({});
      setShowCreateModal?.(true);
    } catch (err) {
      toast('Không tìm thấy biểu mẫu cho yêu cầu này', 'warning');
    } finally {
      setSchemaLoading(false);
    }
  };

  // Create/Update request
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) { toast('Vui lòng nhập tiêu đề', 'warning'); return; }
    if (!createForm.requestTypeId) { toast('Vui lòng chọn loại yêu cầu', 'warning'); return; }

    // Run dynamic fields validation
    const errors = {};
    if (activeSchema?.fields) {
      activeSchema.fields.forEach((field) => {
        if (field.required) {
          const val = formDataValues[field.name];
          const fileVal = formFiles[field.name];
          if (field.type === 'file') {
            if (!fileVal && !val) {
              errors[field.name] = `Vui lòng tải lên tập tin`;
            }
          } else if (['checkbox', 'multiselect'].includes(field.type) && field.options) {
            if (!val || val.length === 0) {
              errors[field.name] = `Vui lòng chọn ít nhất một tùy chọn`;
            }
          } else {
            if (val === undefined || val === null || String(val).trim() === '') {
              errors[field.name] = `Vui lòng điền thông tin`;
            }
          }
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast('Vui lòng điền đầy đủ các trường bắt buộc', 'warning');
      return;
    }

    setCreateLoading(true);
    try {
      const submitData = {
        title: createForm.title.trim(),
        note: createForm.note,
        requestTypeId: Number(createForm.requestTypeId),
        priority: createPriority,
        dueDate: createDueDate || undefined,
        formData: {},
      };

      // Construct initial formData without new files
      const cleanFormData = {};
      if (activeSchema?.fields) {
        activeSchema.fields.forEach((field) => {
          if (field.type !== 'file') {
            cleanFormData[field.name] = formDataValues[field.name] ?? '';
          } else {
            cleanFormData[field.name] = formDataValues[field.name] ?? ''; // keep old file details if editing
          }
        });
      }
      submitData.formData = cleanFormData;

      let createdReq;
      if (isEditing && editRequestId) {
        const { data } = await requestApi.updateRequest(editRequestId, submitData);
        createdReq = data;
      } else {
        const { data } = await requestApi.createRequest(submitData);
        createdReq = data;
      }

      const reqId = createdReq.id;

      // Upload files
      let hasFiles = false;
      const finalFormData = { ...cleanFormData };

      for (const fieldName of Object.keys(formFiles)) {
        const fileObj = formFiles[fieldName];
        if (fileObj) {
          hasFiles = true;
          const uploadRes = await attachmentApi.upload(reqId, fileObj);
          finalFormData[fieldName] = {
            id: uploadRes.data.id,
            fileName: uploadRes.data.fileName,
            fileType: uploadRes.data.fileType,
            fileSize: uploadRes.data.fileSize,
          };
        }
      }

      // Update if there were file uploads
      if (hasFiles) {
        await requestApi.updateRequest(reqId, {
          title: submitData.title,
          note: submitData.note,
          priority: submitData.priority,
          dueDate: submitData.dueDate,
          formData: finalFormData,
        });
      }

      toast(isEditing ? 'Đã cập nhật yêu cầu thành công!' : 'Đã tạo yêu cầu mới (bản nháp)!', 'success');
      setShowCreateModal?.(false);

      // Reset state
      setCreateForm({ title: '', requestTypeId: '', note: '' });
      setFormDataValues({});
      setFormFiles({});
      setFormErrors({});
      setCreatePriority('NORMAL');
      setCreateDueDate('');
      setActiveSchema(null);
      setIsEditing(false);
      setEditRequestId(null);

      setPage(0);
      fetchRequests();
      if (selected && selected.id === reqId) {
        openDetail({ ...createdReq, formData: hasFiles ? finalFormData : cleanFormData });
      }
    } catch (err) {
      toast(err?.response?.data?.message || 'Không thể lưu yêu cầu', 'error');
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

            <Button
              onClick={() => {
                setIsEditing(false);
                setEditRequestId(null);
                setCreateForm({ title: '', requestTypeId: '', note: '' });
                setFormDataValues({});
                setFormFiles({});
                setFormErrors({});
                setCreatePriority('NORMAL');
                setCreateDueDate('');
                setActiveSchema(null);
                setShowCreateModal?.(true);
              }}
              icon={Plus} size="sm"
            >
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
              action={
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditRequestId(null);
                    setCreateForm({ title: '', requestTypeId: '', note: '' });
                    setFormDataValues({});
                    setFormFiles({});
                    setFormErrors({});
                    setCreatePriority('NORMAL');
                    setCreateDueDate('');
                    setActiveSchema(null);
                    setShowCreateModal?.(true);
                  }}
                  icon={Plus} size="sm"
                >
                  Tạo yêu cầu
                </Button>
              }
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
                    className={`cursor-pointer transition-colors hover:bg-slate-800/40 ${selected?.id === req.id ? 'bg-indigo-600/5 border-l-2 border-indigo-500' : ''
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

              {/* Form Data Schema rendering */}
              {selectedFormLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : selectedFormSchema?.fields && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 space-y-4">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Thông tin chi tiết biểu mẫu</p>
                  <div className="space-y-3">
                    {selectedFormSchema.fields.map((field) => {
                      const value = selected.formData?.[field.name];
                      return (
                        <div key={field.name} className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-500">{field.label}</p>
                          <div className="text-slate-200 font-medium">
                            {field.type === 'file' ? (
                              value?.fileName ? (
                                <button
                                  onClick={() => attachmentApi.downloadFile(value.id, value.fileName)}
                                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors font-semibold hover:underline"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span>{value.fileName}</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 italic">Không có tập tin</span>
                              )
                            ) : field.type === 'checkbox' || field.type === 'multiselect' ? (
                              Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {value.map((v, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded text-[10px] border border-slate-600/40">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              ) : value === true ? (
                                <span className="text-emerald-400">✓ Đã chọn</span>
                              ) : value === false ? (
                                <span className="text-slate-500">✕ Không chọn</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : value !== undefined && value !== null && value !== '' ? (
                              <span className="whitespace-pre-wrap leading-relaxed">{String(value)}</span>
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

              {/* Attachments Section */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tập tin đính kèm ({attachments.length})</p>
                  <div className="space-y-1.5 bg-slate-800/20 border border-slate-700/20 rounded-xl p-3">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => attachmentApi.downloadFile(att.id, att.fileName)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-left hover:underline truncate max-w-[200px]"
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
              {selected.workflowSteps && selected.workflowSteps.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-700/40">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Luồng phê duyệt</p>
                  <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-700/60">
                    {selected.workflowSteps.map((step) => {
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
              {approvals.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử phê duyệt</p>
                  <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-700">
                    {approvals.map((a, idx) => (
                      <div key={idx} className="flex gap-3 relative z-10">
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
                    onClick={() => handleStartEdit(selected)}
                    variant="secondary" icon={Edit2} size="sm" className="flex-1"
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    onClick={() => setActionModal({ type: 'cancel', id: selected.id, title: selected.title })}
                    variant="ghost" icon={RotateCcw} size="sm" className="flex-1"
                  >
                    Hủy yêu cầu
                  </Button>
                </div>
              </>
            )}
            {selected.status === 'RETURNED' && (
              <>
                <Button
                  onClick={() => setActionModal({ type: 'submit', id: selected.id, title: selected.title })}
                  icon={Send} size="sm" className="w-full"
                >
                  Nộp lại yêu cầu
                </Button>
                <Button
                  onClick={() => handleStartEdit(selected)}
                  variant="secondary" icon={Edit2} size="sm" className="w-full"
                >
                  Chỉnh sửa bổ sung
                </Button>
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
        onClose={() => {
          setShowCreateModal?.(false);
          setIsEditing(false);
          setEditRequestId(null);
          setCreateForm({ title: '', requestTypeId: '', note: '' });
          setFormDataValues({});
          setFormFiles({});
          setFormErrors({});
          setCreatePriority('NORMAL');
          setCreateDueDate('');
          setActiveSchema(null);
        }}
        title={isEditing ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu mới"}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Tiêu đề yêu cầu *</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề ngắn gọn..."
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Loại yêu cầu *</label>
              <select
                value={createForm.requestTypeId}
                onChange={(e) => handleRequestTypeChange(e.target.value)}
                disabled={isEditing}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="">-- Chọn loại yêu cầu --</option>
                {requestTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Mức độ ưu tiên</label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="LOW" className="bg-slate-900 text-white">Thấp (LOW)</option>
                <option value="NORMAL" className="bg-slate-900 text-white">Bình thường (NORMAL)</option>
                <option value="HIGH" className="bg-slate-900 text-white">Cao (HIGH)</option>
                <option value="URGENT" className="bg-slate-900 text-white">Khẩn cấp (URGENT)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Hạn xử lý (nếu có)</label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Ghi chú (tuỳ chọn)</label>
            <textarea
              rows={2}
              value={createForm.note}
              onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Mô tả chi tiết yêu cầu..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Dynamic fields container */}
          {createForm.requestTypeId && (
            <div className="border-t border-slate-700/50 pt-4 space-y-4">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Thông tin chi tiết biểu mẫu</p>

              {schemaLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : activeSchema?.fields && activeSchema.fields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSchema.fields.map((field) => {
                    const error = formErrors[field.name];
                    return (
                      <div key={field.name} className={`space-y-1.5 ${['textarea'].includes(field.type) ? 'md:col-span-2' : ''}`}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>

                        {/* Dynamic component picker */}
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={formDataValues[field.name] || ''}
                            onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                            placeholder="Nhập nội dung chi tiết..."
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formDataValues[field.name] || ''}
                            onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                          >
                            <option value="">-- Chọn --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt} className="bg-slate-900 text-white">{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'radio' ? (
                          <div className="flex flex-wrap gap-4 pt-1">
                            {field.options?.map((opt, i) => (
                              <label key={i} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={opt}
                                  checked={formDataValues[field.name] === opt}
                                  onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                                  className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'checkbox' ? (
                          field.options && field.options.length > 0 ? (
                            <div className="flex flex-wrap gap-4 pt-1">
                              {field.options.map((opt, i) => {
                                const currentSelected = Array.isArray(formDataValues[field.name]) ? formDataValues[field.name] : [];
                                const isChecked = currentSelected.includes(opt);
                                return (
                                  <label key={i} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      value={opt}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newVal = e.target.checked
                                          ? [...currentSelected, opt]
                                          : currentSelected.filter((v) => v !== opt);
                                        handleDynamicChange(field.name, newVal);
                                      }}
                                      className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                                    />
                                    {opt}
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={!!formDataValues[field.name]}
                                onChange={(e) => handleDynamicChange(field.name, e.target.checked)}
                                className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                              />
                              Đồng ý / Xác nhận
                            </label>
                          )
                        ) : field.type === 'multiselect' ? (
                          <div className="flex flex-wrap gap-4 pt-1">
                            {field.options?.map((opt, i) => {
                              const currentSelected = Array.isArray(formDataValues[field.name]) ? formDataValues[field.name] : [];
                              const isChecked = currentSelected.includes(opt);
                              return (
                                <label key={i} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    value={opt}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newVal = e.target.checked
                                        ? [...currentSelected, opt]
                                        : currentSelected.filter((v) => v !== opt);
                                      handleDynamicChange(field.name, newVal);
                                    }}
                                    className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                                  />
                                  {opt}
                                </label>
                              );
                            })}
                          </div>
                        ) : field.type === 'file' ? (
                          <div className="flex items-center gap-3 bg-slate-800/40 p-3 border border-slate-700/40 rounded-xl">
                            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg cursor-pointer text-xs text-indigo-400 font-semibold transition-colors">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Chọn tập tin</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileChange(field.name, file);
                                  }
                                }}
                              />
                            </label>
                            <span className="text-xs text-slate-400 truncate max-w-[200px]">
                              {formFiles[field.name]?.name || formDataValues[field.name]?.fileName || 'Chưa chọn file'}
                            </span>
                            {(formFiles[field.name] || formDataValues[field.name]) && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleFileChange(field.name, null);
                                  handleDynamicChange(field.name, '');
                                }}
                                className="text-rose-500 hover:text-rose-400 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : field.type === 'time' ? 'time' : 'text'}
                            value={formDataValues[field.name] || ''}
                            onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                            placeholder="Nhập..."
                            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        )}

                        {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-800/20 border border-slate-700/40 rounded-xl">
                  <p className="text-xs text-slate-400 italic">Loại yêu cầu này không có trường dữ liệu biểu mẫu bổ sung.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-700/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal?.(false);
                setIsEditing(false);
                setEditRequestId(null);
                setCreateForm({ title: '', requestTypeId: '', note: '' });
                setFormDataValues({});
                setFormFiles({});
                setFormErrors({});
                setCreatePriority('NORMAL');
                setCreateDueDate('');
                setActiveSchema(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" loading={createLoading}>
              {isEditing ? "Lưu thay đổi" : "Tạo bản nháp"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Action Modal ── */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'submit' ? 'Xác nhận nộp yêu cầu' : 'Xác nhận hủy yêu cầu'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {actionModal?.type === 'submit'
              ? `Nộp yêu cầu "${truncate(actionModal?.title, 50)}" vào quy trình phê duyệt?`
              : `Hủy yêu cầu "${truncate(actionModal?.title, 50)}"? Hành động này không thể hoàn tác.`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Quay lại</Button>
            <Button
              variant={actionModal?.type === 'submit' ? 'primary' : 'danger'}
              onClick={() => {
                if (actionModal?.type === 'submit') handleSubmit(actionModal.id);
                else handleCancel(actionModal.id);
              }}
            >
              {actionModal?.type === 'submit' ? 'Nộp ngay' : 'Hủy yêu cầu'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

