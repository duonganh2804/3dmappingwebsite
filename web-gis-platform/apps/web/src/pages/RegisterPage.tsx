import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, KeyRound, Mail, User, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { useAuthStore } from '../store/useAuthStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng ký tài khoản thất bại.');
      }

      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans geo-grid-bg relative flex items-center justify-center px-4 py-12">
      
      {/* HUD Frame Container */}
      <div className="w-full max-w-md tech-card corner-ticks p-8 bg-slate-950/90 border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative">
        
        {/* Header Telemetry */}
        <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400 border-b border-cyan-500/20 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Activity size={14} className="animate-pulse text-cyan-400" />
            <span>ACCOUNT REGISTRATION</span>
          </div>
          <span className="text-slate-500">ROLE: USER</span>
        </div>

        {/* Logo & Title */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex p-3 bg-cyan-950/80 border border-cyan-400/40 rounded text-cyan-400 mb-2">
            <Compass size={32} className="animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
            Đăng Ký Tài Khoản <span className="text-cyan-400">Web GIS</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono">
            Khởi tạo tài khoản quản lý và cộng tác dữ liệu không gian 3D.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/80 border border-red-500/40 font-mono text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase mb-1.5">
              Họ và Tên //
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase mb-1.5">
              Email Công Việc //
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gis-platform.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase mb-1.5">
              Mật Khẩu (Tối thiểu 6 ký tự) //
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs tracking-wider uppercase border border-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 rounded-none transition-all"
          >
            {loading ? 'Đang khởi tạo...' : 'TẠO TÀI KHOẢN MỚI'}
            <ArrowRight size={14} />
          </Button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-center font-mono text-xs text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Đăng nhập ngay →
          </Link>
        </div>

      </div>

    </div>
  );
};
