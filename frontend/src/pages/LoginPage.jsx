import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    try {
      await login(form.username, form.password);
      toast('Đăng nhập thành công! Chào mừng trở lại.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const apiMsg = err?.response?.data?.message;
      let msg = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      if (apiMsg === 'Invalid username/email or password' || apiMsg === 'Bad credentials') {
        msg = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      } else if (apiMsg) {
        msg = apiMsg;
      }
      setError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 bg-gradient-to-br from-[#0d1224] via-[#0f172a] to-[#0d1224] border-r border-slate-800/60 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-white leading-none">VDT 2026</p>
            <p className="text-[11px] text-indigo-400 font-bold tracking-widest uppercase">Approval System</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-5">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Hệ Thống Quản Lý<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Yêu Cầu & Phê Duyệt
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Quy trình phê duyệt tự động, minh bạch và hiệu quả. Theo dõi mọi yêu cầu theo thời gian thực.
          </p>

          <div className="flex flex-col gap-3">
            {[
              '✓  Tạo và theo dõi yêu cầu dễ dàng',
              '✓  Quy trình phê duyệt nhiều bước linh hoạt',
            ].map((item) => (
              <p key={item} className="text-xs text-slate-400 font-medium">{item}</p>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-slate-600">© 2026 VDT Team. All rights reserved.</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-extrabold text-white text-lg">VDT 2026</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-white">Đăng nhập</h1>
            <p className="text-slate-400 text-sm mt-1">Nhập thông tin tài khoản của bạn để tiếp tục.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                placeholder="Nhập email hoặc username của bạn"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Forgot password */}
            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-3 text-sm"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
