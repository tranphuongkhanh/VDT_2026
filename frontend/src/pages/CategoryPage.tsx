import React, { useEffect, useState } from 'react';
import { Plus, Edit, PowerOff, CheckCircle2, X, FolderTree, AlertCircle } from 'lucide-react';
import { categoryApi } from '../api/categoryApi';
import { useToast } from '../hooks/useToast';

interface Category {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

export default function CategoryPage(): React.JSX.Element {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const res = await categoryApi.getAll();
            setCategories(res.data);
        } catch (error) {
            showToast('Lỗi khi tải danh sách danh mục', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoryApi.update(editingCategory.id, formData);
                showToast('Cập nhật danh mục thành công', 'success');
            } else {
                await categoryApi.create(formData);
                showToast('Thêm danh mục mới thành công', 'success');
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
        }
    };

    const handleDeactivate = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa danh mục này?')) return;
        try {
            await categoryApi.deactivate(id);
            showToast('Đã vô hiệu hóa danh mục', 'success');
            fetchCategories();
        } catch (error) {
            showToast('Lỗi khi vô hiệu hóa danh mục', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <FolderTree className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Danh mục Yêu cầu</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Quản lý và phân loại các nhóm quy trình trong hệ thống
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={18} />
                    <span className="text-sm">Thêm danh mục</span>
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-[#0a0f1e]/80 border border-slate-800/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/40 text-slate-400 uppercase font-bold text-[11px] tracking-wider border-b border-slate-800/60">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Tên danh mục</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            Đang tải dữ liệu...
                                        </div>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FolderTree className="w-10 h-10 text-slate-700 mb-3" />
                                            Chưa có danh mục nào được thiết lập.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{cat.id}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-200">
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 truncate max-w-xs text-slate-400" title={cat.description}>
                                            {cat.description || <span className="text-slate-600 italic">Không có mô tả</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {cat.isActive !== false ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 size={14} /> Hoạt động
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                    <PowerOff size={14} /> Vô hiệu hóa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(cat)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Sửa danh mục"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {cat.isActive !== false && (
                                                    <button
                                                        onClick={() => handleDeactivate(cat.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Vô hiệu hóa"
                                                    >
                                                        <PowerOff size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm/Sửa (Dark Theme) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080d1a]/80 backdrop-blur-md">
                    <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 overflow-hidden transform transition-all">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                    <Edit className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                </h3>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Tên danh mục <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-600 transition-all outline-none"
                                    placeholder="VD: Đơn xin nghỉ phép..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Mô tả chi tiết
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-600 transition-all outline-none resize-none"
                                    placeholder="Nhập mô tả cho danh mục này..."
                                />
                            </div>

                            {/* Warning note */}
                            {!editingCategory && (
                                <div className="flex items-start gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-indigo-200/70 leading-relaxed">
                                        Sau khi tạo danh mục, bạn có thể phân loại các Loại yêu cầu (Request Types) vào danh mục này để dễ dàng quản lý.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}