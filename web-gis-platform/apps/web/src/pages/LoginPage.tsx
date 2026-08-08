import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, X, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import logoImg from '../assets/logo.webp';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập thất bại.');
      }

      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập Google thất bại.');
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
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-300 max-md:bg-[#11163e] max-md:overflow-hidden max-md:relative">
      
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer max-md:text-white max-md:hover:text-slate-300"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      {/* Mobile background curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden z-0">
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-2xl opacity-50" />
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-bl from-blue-500/20 to-indigo-500/20 blur-3xl opacity-50" />
        <div className="absolute top-[40%] left-[10%] w-72 h-72 rounded-full bg-indigo-600/10 blur-2xl opacity-30" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex overflow-hidden border border-slate-100 min-h-[600px] relative z-10 max-md:max-w-md max-md:p-0 max-md:border-none max-md:shadow-none max-md:bg-transparent">
        
        {/* Left Side: Brand Graphic Panel (Visible on Desktop) */}
        <div className="w-1/2 bg-[#11163e] p-12 relative overflow-hidden flex flex-col justify-between hidden md:flex select-none">
          {/* Abstract overlapping curved layers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Shapes & Rings */}
            <div className="absolute -left-24 -bottom-24 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/10 blur-3xl" />
            <div className="absolute -right-24 -top-24 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-blue-600/30 to-indigo-600/10 blur-3xl" />
            <div className="absolute top-[35%] left-[15%] w-80 h-80 rounded-full bg-indigo-500/20 blur-2xl" />
            
            {/* Ring indicators */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-indigo-400/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-indigo-400/5" />
          </div>

          {/* Top Section: Logo & Heading */}
          <div className="relative z-10 space-y-6">
            <img src={logoImg} alt="Saolatek Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-[44px] font-extrabold text-white leading-[1.1] tracking-tight">
              Start Your<br />
              Journey<br />
              with Us
            </h1>
          </div>

          {/* Bottom Section: Quote */}
          <div className="relative z-10 mt-auto">
            <p className="text-[11px] text-white/60 font-medium max-w-[250px] leading-relaxed">
              High-performance 3D Web GIS platform for reality capture, point clouds, and LiDAR analytics.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form (Form Modal Card on Mobile) */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative max-md:rounded-[32px] max-md:shadow-2xl">
          
          {/* Close button (returns to home) */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer max-md:text-white max-md:hover:bg-slate-800/40 max-md:-top-16 max-md:right-0 max-md:z-20"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-sm mx-auto space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-400 text-sm">
                Sign in to your account
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
                <ShieldAlert size={16} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">
                  Email
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

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 transition-colors placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options Section */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <span>Remeber me</span>
                </label>
                <Link to="/forgot-password" className="text-[#434bed] hover:underline font-semibold">
                  Forgot Password
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#434bed] hover:bg-[#343cc7] text-white font-semibold text-sm rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[11px] text-slate-300 font-medium uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Google Authentication */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Đăng nhập bằng Google thất bại.')}
                  theme="outline"
                  shape="pill"
                  text="signin_with"
                  width="340"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#434bed] font-semibold hover:underline">
                Sign up
              </Link>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
