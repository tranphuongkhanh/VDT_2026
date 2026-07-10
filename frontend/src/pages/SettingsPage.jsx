import { useEffect, useState } from 'react';
import { Settings, User, Briefcase, Mail, ShieldCheck, Building2, Key, AlertCircle } from 'lucide-react';
import { userApi } from '../api/userApi';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getInitials } from '../utils/helpers';
import Button from '../components/ui/Button';

export default function SettingsPage() {
  const toast = useToast();
  const { user: authUser, updateLocalUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    position: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await userApi.getMe();
        setProfile(data);
        setForm({
          fullName: data.fullName || '',
          position: data.position || '',
          avatarUrl: data.avatarUrl || '',
        });
      } catch {
        toast('Không thể tải thông tin cá nhân', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast('Họ và tên không được để trống', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { data } = await userApi.updateMe({
        fullName: form.fullName.trim(),
        position: form.position.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
      });
      setProfile(data);
      if (updateLocalUser) {
        updateLocalUser(data);
      }
      toast('Cập nhật thông tin cá nhân thành công', 'success');
    } catch (err) {
      toast(err?.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">Cài Đặt Tài Khoản</h2>
          <p className="text-xs text-slate-400">Xem và cập nhật thông tin cá nhân của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 flex flex-col items-center text-center shadow-xl">
            <div className="relative group">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/50"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-indigo-500/30">
                  {getInitials(profile?.fullName || profile?.username)}
                </div>
              )}
            </div>

            <h3 className="mt-4 text-base font-extrabold text-white">{profile?.fullName || '—'}</h3>
            <p className="text-xs text-indigo-400 font-medium">@{profile?.username}</p>
            <p className="text-xs text-slate-500 mt-1">{profile?.position || 'Chưa thiết lập chức danh'}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {profile?.roles?.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin hệ thống</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã nhân viên</span>
                <span className="text-white font-semibold">{profile?.employeeCode || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  Đang hoạt động
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thành viên từ</span>
                <span className="text-slate-300 font-medium">{formatDate(profile?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Details and Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Cập Nhật Thông Tin Cá Nhân
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Họ và tên *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vị trí / Chức danh</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <input
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="VD: Trưởng phòng"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Ảnh đại diện (Avatar URL)</label>
                  <input
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>Lưu thay đổi</Button>
              </div>
            </form>
          </div>

          {/* Account information (Read-only) */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Thông Tin Tổ Chức
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Phòng ban</p>
                <p className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.department?.name || 'Chưa chỉ định'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Người quản lý trực tiếp</p>
                <p className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.manager?.fullName || 'Chưa có người quản lý'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Địa chỉ Email</p>
                <p className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.email}
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tên đăng nhập hệ thống</p>
                <p className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Nếu thông tin tổ chức của bạn không chính xác, vui lòng liên hệ quản trị viên (Admin) để cập nhật.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
