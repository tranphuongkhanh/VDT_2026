import { useCallback, useEffect, useState } from 'react';
import { LayoutList, Plus, Edit2, ShieldOff, Save, FileCode, CheckCircle2, Trash2 } from 'lucide-react';
import { requestTypeApi } from '../api/requestTypeApi';
import { categoryApi } from '../api/categoryApi';
import { formApi } from '../api/formApi';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { parsePage, formatDate } from '../utils/helpers';

export default function RequestTypesPage() {
  const toast = useToast();

  // State
  const [typesPage, setTypesPage] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Modals
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', categoryId: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Forms Management Panel
  const [selectedType, setSelectedType] = useState(null); // { id, name }
  const [activeForm, setActiveForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [formName, setFormName] = useState('');

  const addField = () => {
    setFormFields([...formFields, {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: ''
    }]);
  };

  const updateField = (id, key, value) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const [typeRes, catRes] = await Promise.allSettled([
        requestTypeApi.getAll({ page, size: 10 }),
        categoryApi.getAll()
      ]);
      if (typeRes.status === 'fulfilled') setTypesPage(parsePage(typeRes.value.data));
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
    } catch {
      toast('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  // Request Type Actions
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name || !typeForm.categoryId) {
      toast('Vui lòng nhập tên và chọn danh mục', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        name: typeForm.name,
        description: typeForm.description,
        categoryId: Number(typeForm.categoryId),
      };
      if (editType) {
        await requestTypeApi.update(editType.id, payload);
        toast('Cập nhật loại yêu cầu thành công', 'success');
      } else {
        await requestTypeApi.create(payload);
        toast('Tạo loại yêu cầu thành công', 'success');
      }
      setShowTypeModal(false);
      fetchTypes();
    } catch (err) {
      toast(err?.response?.data?.message || 'Lỗi thao tác', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await requestTypeApi.deactivate(id);
      toast('Đã vô hiệu hóa loại yêu cầu', 'info');
      fetchTypes();
    } catch (err) {
      toast('Không thể vô hiệu hóa', 'error');
    }
  };

  // Form Management Actions
  const openFormManager = async (type) => {
    setSelectedType(type);
    setActiveForm(null);
    try {
      const { data } = await requestTypeApi.getActiveForm(type.id);
      setActiveForm(data);
    } catch (err) {
      // 404 means no active form, which is fine
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName) return toast('Vui lòng nhập tên form', 'warning');
    
    if (formFields.length === 0) {
      return toast('Vui lòng thêm ít nhất một trường cho biểu mẫu', 'warning');
    }

    for (const field of formFields) {
      if (!field.name || !field.label) {
        return toast('Vui lòng điền đầy đủ Tên hiển thị và Mã trường', 'warning');
      }
      if (field.type === 'select' && !field.options) {
        return toast(`Vui lòng nhập tùy chọn cho trường "${field.label}"`, 'warning');
      }
    }

    const parsedSchema = {
      fields: formFields.map(({ id, options, ...rest }) => ({
        ...rest,
        ...(rest.type === 'select' ? { options: options.split(',').map(o => o.trim()).filter(Boolean) } : {})
      }))
    };

    setActionLoading(true);
    try {
      await requestTypeApi.createForm(selectedType.id, {
        name: formName,
        schemaData: parsedSchema
      });
      toast('Đã tạo phiên bản biểu mẫu mới!', 'success');
      setShowFormModal(false);
      openFormManager(selectedType); // refresh active form
    } catch (err) {
      toast(err?.response?.data?.message || 'Lỗi tạo biểu mẫu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left: Request Types List ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/10">
              <LayoutList className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Quản Lý Loại Yêu Cầu</h2>
              <p className="text-xs text-slate-400">Thiết lập các loại yêu cầu & biểu mẫu</p>
            </div>
          </div>
          <Button onClick={() => { setEditType(null); setTypeForm({ name: '', description: '', categoryId: '' }); setShowTypeModal(true); }} icon={Plus}>
            Thêm loại yêu cầu
          </Button>
        </div>

        {/* Table */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <Spinner />
          ) : typesPage.content.length === 0 ? (
            <EmptyState icon={LayoutList} title="Chưa có dữ liệu" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Tên loại yêu cầu</th>
                  <th className="text-left px-4 py-3">Danh mục</th>
                  <th className="text-left px-4 py-3">Quy trình (Workflow)</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {typesPage.content.map((type) => (
                  <tr
                    key={type.id}
                    className={`transition-colors hover:bg-slate-800/40 cursor-pointer ${selectedType?.id === type.id ? 'bg-indigo-600/5 border-l-2 border-indigo-500' : ''}`}
                    onClick={() => openFormManager(type)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm">{type.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{type.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{type.categoryName}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {type.workflowName ? (
                        <span className="text-indigo-400">{type.workflowName} (v{type.workflowVersion})</span>
                      ) : (
                        <span className="text-slate-500 italic">Chưa gắn</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {type.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Hoạt động</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full">Đã vô hiệu</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditType(type); setTypeForm({ name: type.name, description: type.description, categoryId: type.categoryId }); setShowTypeModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {type.isActive && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeactivate(type.id); }} title="Vô hiệu hóa" className="p-1.5 text-slate-400 hover:text-rose-400">
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && typesPage.totalPages > 1 && (
          <Pagination page={typesPage.number} totalPages={typesPage.totalPages} totalElements={typesPage.totalElements} size={typesPage.size} onPageChange={setPage} />
        )}
      </div>

      {/* ── Right: Form Manager Panel ── */}
      {selectedType && (
        <div className="w-96 shrink-0 bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-6 shadow-xl">
          <div className="px-5 py-4 border-b border-slate-700/40 bg-slate-800/30">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" /> Biểu mẫu yêu cầu
            </h3>
            <p className="text-xs text-slate-400 mt-1">{selectedType.name}</p>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {activeForm ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Biểu mẫu đang dùng</span>
                    <span className="text-[10px] font-bold text-slate-400">Phiên bản {activeForm.version}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">{activeForm.name}</p>
                  <pre className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg overflow-x-auto border border-slate-800">
                    {JSON.stringify(activeForm.schemaData, null, 2)}
                  </pre>
                  <p className="text-[10px] text-slate-500 mt-2">Cập nhật: {formatDate(activeForm.createdAt)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">Chưa có biểu mẫu</p>
                <p className="text-xs text-slate-500 mt-1">Vui lòng tạo biểu mẫu mới để người dùng có thể nộp yêu cầu.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700/40">
            <Button onClick={() => { setFormName(''); setFormFields([]); setShowFormModal(true); }} className="w-full" icon={Plus}>
              Tạo phiên bản biểu mẫu mới
            </Button>
          </div>
        </div>
      )}

      {/* ── Type Modal ── */}
      <Modal isOpen={showTypeModal} onClose={() => setShowTypeModal(false)} title={editType ? 'Cập nhật loại yêu cầu' : 'Thêm loại yêu cầu'} size="md">
        <form onSubmit={handleSaveType} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên loại yêu cầu *</label>
            <input
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Danh mục *</label>
            <select
              value={typeForm.categoryId}
              onChange={(e) => setTypeForm({ ...typeForm, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Mô tả</label>
            <textarea
              rows={3}
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowTypeModal(false)}>Hủy</Button>
            <Button type="submit" loading={actionLoading}>Lưu</Button>
          </div>
        </form>
      </Modal>

      {/* ── Form Modal ── */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title="Tạo biểu mẫu mới" size="lg">
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            <p className="text-xs font-semibold text-amber-400">Lưu ý: Sau khi tạo, phiên bản này sẽ tự động trở thành biểu mẫu chính (Active) cho loại yêu cầu "{selectedType?.name}".</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên biểu mẫu *</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Form đề nghị thanh toán v2"
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase">Cấu trúc biểu mẫu *</label>
              <Button type="button" onClick={addField} variant="ghost" className="h-8 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" icon={Plus}>
                Thêm trường
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {formFields.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/30 border border-slate-700/50 border-dashed rounded-xl">
                  <FileCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Chưa có trường nào. Bấm "Thêm trường" để bắt đầu.</p>
                </div>
              ) : (
                formFields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-3 relative group">
                    <button type="button" onClick={() => removeField(field.id)} className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tên hiển thị (Label) *</label>
                        <input value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} placeholder="VD: Lý do" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã trường (Key) *</label>
                        <input value={field.name} onChange={e => updateField(field.id, 'name', e.target.value)} placeholder="VD: reason" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loại trường (Type)</label>
                        <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500">
                          <option value="text">Văn bản ngắn (Text)</option>
                          <option value="textarea">Văn bản dài (Textarea)</option>
                          <option value="number">Số (Number)</option>
                          <option value="date">Ngày tháng (Date)</option>
                          <option value="select">Danh sách chọn (Select)</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800" />
                          <span className="text-xs text-slate-300 font-medium">Bắt buộc nhập</span>
                        </label>
                      </div>
                    </div>
                    {field.type === 'select' && (
                      <div className="space-y-1.5 pt-3 border-t border-slate-700/50 mt-3">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Các tùy chọn (Options - cách nhau bởi dấu phẩy) *</label>
                        <input value={field.options} onChange={e => updateField(field.id, 'options', e.target.value)} placeholder="VD: Tùy chọn 1, Tùy chọn 2" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/40">
            <Button type="button" variant="ghost" onClick={() => setShowFormModal(false)}>Hủy</Button>
            <Button type="submit" loading={actionLoading} icon={Save}>Lưu biểu mẫu</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
