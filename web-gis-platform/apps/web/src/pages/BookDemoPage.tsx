import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitDemoLead } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import logoImg from '../assets/logo.webp';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles, Building2, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const BookDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    message: '',
    source: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.email.trim()) {
      errs.email = 'Must be valid email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Must be valid email.';
    }

    if (!formData.jobTitle.trim()) {
      errs.jobTitle = 'Job title is required.';
    }

    if (!formData.message.trim()) {
      errs.message = 'Please share additional context.';
    }

    if (!formData.source.trim()) {
      errs.source = 'Please let us know how you heard about us.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerMessage('');

    const res = await submitDemoLead({
      email: formData.email.trim(),
      fullName: formData.fullName.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      message: formData.message.trim(),
      source: formData.source.trim() || undefined
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setServerMessage(res.message || 'Yêu cầu Demo của bạn đã được gửi thành công!');
    } else {
      alert(res.message || 'Không thể gửi yêu cầu demo. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Radial Glow & Grid Pattern */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(37,99,235,0.18),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.1),transparent_50%)] pointer-events-none" 
      />
      <div 
        className="absolute inset-0 opacity-[0.15] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" 
      />

      {/* Top Header Navigation (SAOLATEK Brand Topbar) */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="SAOLATEK" className="h-8 w-auto object-contain" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Platform</Link>
            <Link to="/" className="hover:text-white transition-colors">Solutions</Link>
            <Link to="/" className="hover:text-white transition-colors">Resources</Link>
            <Link to="/" className="hover:text-white transition-colors">Connect</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Dashboard ({user?.fullName ? user.fullName.split(' ')[0] : 'SAOLATEK'})</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                Đăng nhập
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full transition-all shadow-lg shadow-blue-600/30"
            >
              Vào Platform 3D
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 sm:py-12 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Hero Content */}
        <div className="lg:col-span-6 space-y-8 pt-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-500/30 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>• Book a demo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            One platform for reality capture
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
            Contact sales to see how our 3D GIS Platform can give your teams the power to document, analyze, and visualize your sites from the air and ground — all in one AI-powered platform.
          </p>

          <div className="pt-6 space-y-4 border-t border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Full-Stack 3D GIS Engine</h4>
                <p className="text-xs text-slate-400">Xem ảnh DOM chính xác cao, 3D Mesh GLB và 238M điểm Point Cloud siêu mượt.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                <Building2 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Enterprise Permission & Storage</h4>
                <p className="text-xs text-slate-400">Phân quyền chi tiết (Owner, Editor, Viewer) đồng bộ tức thì trên cơ sở dữ liệu.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Hỗ trợ Kỹ thuật Trực tiếp</h4>
                <p className="text-xs text-slate-400">Đội ngũ chuyên gia tư vấn triển khai hạ tầng dữ liệu không gian cho dự án lớn.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: White Form Card (Matching Screenshot) */}
        <div className="lg:col-span-6">
          <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 relative">
            
            {isSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Thank you!</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  {serverMessage}
                </p>
                <div className="pt-6">
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({ email: '', fullName: '', jobTitle: '', company: '', phone: '', message: '', source: '' });
                    }}
                    className="text-xs font-mono font-bold text-blue-600 hover:text-blue-700 underline"
                  >
                    Gửi thêm yêu cầu khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Contact Sales
                </h2>

                {/* Business Email */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    {errors.email && (
                      <span className="text-[11px] font-mono text-red-500">{errors.email}</span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="example@yourdomain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full bg-transparent border-b py-2 text-sm text-slate-900 focus:outline-none transition-colors ${
                      errors.email ? 'border-red-500 placeholder-red-300' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* Full Name & Job Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyen Van A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-300 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono font-bold text-slate-700">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      {errors.jobTitle && (
                        <span className="text-[10px] font-mono text-red-500">Required</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="GIS Manager / Surveyor"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className={`w-full bg-transparent border-b py-2 text-sm text-slate-900 focus:outline-none transition-colors ${
                        errors.jobTitle ? 'border-red-500' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enterprise Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-300 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+84 901 234 567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-300 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    {errors.message && (
                      <span className="text-[10px] font-mono text-red-500">Required</span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Please share additional context so we can route your request to the right person"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full bg-slate-50 border p-3 rounded-lg text-sm text-slate-900 focus:outline-none transition-colors ${
                      errors.message ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* How did you hear about us? */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-mono font-bold text-slate-700">
                      How did you hear about us? <span className="text-red-500">*</span>
                    </label>
                    {errors.source && (
                      <span className="text-[10px] font-mono text-red-500">Required</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Please provide as much detail as possible"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={`w-full bg-slate-50 border p-3 rounded-lg text-sm text-slate-900 focus:outline-none transition-colors ${
                      errors.source ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* Privacy Policy terms */}
                <p className="text-[11px] text-slate-500 leading-normal pt-1">
                  By submitting, you confirm that you have reviewed 3D GIS Platform's <span className="underline hover:text-slate-800 cursor-pointer">Privacy Policy</span> and agree to its terms.
                </p>

                {/* Submit Pill Button (Matching Screenshot) */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      'Book a demo'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs font-mono text-slate-500">
        © 2026 3D GIS Platform. All rights reserved. • Contact: <span className="text-slate-400">duongnguyen280403@gmail.com</span>
      </footer>
    </div>
  );
};

export default BookDemoPage;
