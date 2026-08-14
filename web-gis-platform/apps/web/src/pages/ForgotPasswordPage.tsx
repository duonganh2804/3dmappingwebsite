import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import logoImg from '../assets/logo.webp';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Yêu cầu thất bại.');
      }

      setSuccess(data.message || 'Yêu cầu thành công! Hướng dẫn đặt lại mật khẩu đã được gửi qua email của bạn.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-300 max-md:bg-[#11163e] max-md:overflow-hidden max-md:relative">
      
      {/* Back to Login Button */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer max-md:text-white max-md:hover:text-slate-300"
      >
        <ArrowLeft size={16} />
        <span>Back to Login</span>
      </button>

      {/* Mobile background curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden z-0">
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-2xl opacity-50" />
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-bl from-blue-500/20 to-indigo-500/20 blur-3xl opacity-50" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex overflow-hidden border border-slate-100 min-h-[600px] relative z-10 max-md:max-w-md max-md:p-0 max-md:border-none max-md:shadow-none max-md:bg-transparent">
        
        {/* Left Side: Brand Graphic Panel */}
        <div className="w-1/2 bg-[#11163e] p-12 relative overflow-hidden flex flex-col justify-between hidden md:flex select-none">
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -left-24 -bottom-24 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/10 blur-3xl" />
            <div className="absolute -right-24 -top-24 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-blue-600/30 to-indigo-600/10 blur-3xl" />
            <div className="absolute top-[35%] left-[15%] w-80 h-80 rounded-full bg-indigo-500/20 blur-2xl" />
          </div>

          <div className="relative z-10 space-y-6">
            <img src={logoImg} alt="Saolatek Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-[44px] font-extrabold text-white leading-[1.1] tracking-tight">
              Password<br />
              Recovery<br />
              Service
            </h1>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-[11px] text-white/60 font-medium max-w-[250px] leading-relaxed">
              Retrieve access to your 3D Web GIS project dashboard. Fast and secure verification.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative max-md:rounded-[32px] max-md:shadow-2xl">
          <div className="w-full max-w-sm mx-auto space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Forgot Password
              </h2>
              <p className="text-slate-400 text-sm">
                Enter your email address to receive password reset link
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
                <ShieldAlert size={16} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-600 flex items-start gap-2.5 font-medium leading-relaxed">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-[#434bed] hover:bg-[#343cc7] text-white font-semibold text-sm rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Go to Sign In</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="domat@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#434bed] hover:bg-[#343cc7] text-white font-semibold text-sm rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center text-xs text-slate-400 pt-2">
              Remembered your password?{' '}
              <Link to="/login" className="text-[#434bed] font-semibold hover:underline">
                Sign in
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
