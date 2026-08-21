import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchDemoAccess, submitDemoLead } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  useLanguage,
  type Language
} from '../hooks/useLanguage';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import logoImg from '../assets/logo.webp';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Building2,
  ShieldCheck
} from 'lucide-react';

type Copy = {
  languageLabel: string;

  navPlatform: string;
  navSolutions: string;
  navResources: string;
  navConnect: string;
  dashboard: string;
  login: string;
  enterPlatform: string;

  checkingAccess: string;

  eyebrow: string;
  title: string;
  body: string;

  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  feature3Title: string;
  feature3Body: string;

  formTitle: string;
  businessEmail: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  phoneNumber: string;
  message: string;
  source: string;

  emailPlaceholder: string;
  fullNamePlaceholder: string;
  jobTitlePlaceholder: string;
  companyPlaceholder: string;
  phonePlaceholder: string;
  messagePlaceholder: string;
  sourcePlaceholder: string;

  required: string;
  invalidEmail: string;
  messageRequired: string;
  sourceRequired: string;

  privacyBefore: string;
  privacyPolicy: string;
  privacyAfter: string;

  submit: string;
  submitting: string;
  openingDemo: string;
  success: string;
  submitError: string;

  footerRights: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',

    navPlatform: 'Nền tảng',
    navSolutions: 'Giải pháp',
    navResources: 'Tài nguyên',
    navConnect: 'Kết nối',
    dashboard: 'Bảng điều khiển',
    login: 'Đăng nhập',
    enterPlatform: 'Vào Platform 3D',

    checkingAccess: 'Đang kiểm tra quyền Demo...',

    eyebrow: 'ĐĂNG KÝ DEMO',
    title: 'Một nền tảng cho toàn bộ dữ liệu thực địa 3D',
    body:
      'Đăng ký Demo để xem cách 3D GIS Platform hỗ trợ nhóm của bạn quản lý, phân tích và trực quan hóa dữ liệu khảo sát từ UAV, LiDAR và hiện trường trong cùng một hệ thống.',

    feature1Title: '3D GIS Engine toàn diện',
    feature1Body:
      'Xem ảnh DOM chính xác cao, 3D Mesh GLB và Point Cloud dung lượng lớn trực tiếp trên nền tảng.',
    feature2Title: 'Phân quyền & lưu trữ doanh nghiệp',
    feature2Body:
      'Phân quyền Owner, Editor, Viewer và quản lý dữ liệu project tập trung trên hệ thống.',
    feature3Title: 'Hỗ trợ kỹ thuật trực tiếp',
    feature3Body:
      'Đội ngũ kỹ thuật hỗ trợ trao đổi workflow, hạ tầng dữ liệu và phương án triển khai cho dự án.',

    formTitle: 'Đăng ký xem Demo',
    businessEmail: 'Email công việc',
    fullName: 'Họ và tên',
    jobTitle: 'Chức danh',
    companyName: 'Công ty / đơn vị',
    phoneNumber: 'Số điện thoại',
    message: 'Nội dung cần trao đổi',
    source: 'Bạn biết đến SAOLATEK từ đâu?',

    emailPlaceholder: 'example@yourdomain.com',
    fullNamePlaceholder: 'Nguyễn Văn A',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    companyPlaceholder: 'Tên công ty hoặc đơn vị',
    phonePlaceholder: '+84 901 234 567',
    messagePlaceholder:
      'Cho chúng tôi biết thêm về dự án, loại dữ liệu hoặc nhu cầu Demo để chuyển yêu cầu đúng nhóm phụ trách.',
    sourcePlaceholder:
      'Ví dụ: Google, LinkedIn, đối tác, giới thiệu, sự kiện...',

    required: 'Bắt buộc',
    invalidEmail: 'Email chưa hợp lệ',
    messageRequired: 'Vui lòng chia sẻ thêm thông tin.',
    sourceRequired: 'Vui lòng cho biết bạn biết đến chúng tôi từ đâu.',

    privacyBefore: 'Khi gửi biểu mẫu, bạn xác nhận đã xem',
    privacyPolicy: 'Chính sách bảo mật',
    privacyAfter: 'và đồng ý với các điều khoản liên quan.',

    submit: 'Đăng ký xem Demo',
    submitting: 'Đang gửi...',
    openingDemo: 'Đang mở Demo Showcase...',
    success:
      'Cảm ơn bạn! Yêu cầu Demo đã được gửi thành công. Đang mở Demo Showcase...',
    submitError:
      'Không thể gửi yêu cầu Demo. Vui lòng thử lại.',

    footerRights: '© 2026 3D GIS Platform. All rights reserved.'
  },

  en: {
    languageLabel: 'Select language',

    navPlatform: 'Platform',
    navSolutions: 'Solutions',
    navResources: 'Resources',
    navConnect: 'Connect',
    dashboard: 'Dashboard',
    login: 'Log in',
    enterPlatform: 'Enter 3D Platform',

    checkingAccess: 'Checking Demo access...',

    eyebrow: 'BOOK A DEMO',
    title: 'One platform for reality capture',
    body:
      'Book a Demo to see how the 3D GIS Platform helps your team document, analyze and visualize UAV, LiDAR and field survey data in one system.',

    feature1Title: 'Full-Stack 3D GIS Engine',
    feature1Body:
      'View high-accuracy DOM imagery, GLB 3D Mesh and large Point Cloud datasets directly in the platform.',
    feature2Title: 'Enterprise Permission & Storage',
    feature2Body:
      'Manage Owner, Editor and Viewer permissions together with centralized project data.',
    feature3Title: 'Direct Technical Support',
    feature3Body:
      'Work with the technical team on workflows, data infrastructure and deployment options for your project.',

    formTitle: 'Book a Demo',
    businessEmail: 'Business Email',
    fullName: 'Full Name',
    jobTitle: 'Job Title',
    companyName: 'Company / Organization',
    phoneNumber: 'Phone Number',
    message: 'Message',
    source: 'How did you hear about SAOLATEK?',

    emailPlaceholder: 'example@yourdomain.com',
    fullNamePlaceholder: 'Nguyen Van A',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    companyPlaceholder: 'Company or organization name',
    phonePlaceholder: '+84 901 234 567',
    messagePlaceholder:
      'Share your project context, data type or Demo needs so we can route your request to the right team.',
    sourcePlaceholder:
      'For example: Google, LinkedIn, partner, referral, event...',

    required: 'Required',
    invalidEmail: 'Invalid email',
    messageRequired: 'Please share additional context.',
    sourceRequired: 'Please let us know how you heard about us.',

    privacyBefore: 'By submitting, you confirm that you have reviewed the',
    privacyPolicy: 'Privacy Policy',
    privacyAfter: 'and agree to its terms.',

    submit: 'Book a Demo',
    submitting: 'Submitting...',
    openingDemo: 'Opening Demo Showcase...',
    success:
      'Thank you! Your Demo request has been submitted successfully. Opening Demo Showcase...',
    submitError:
      'Unable to submit the Demo request. Please try again.',

    footerRights: '© 2026 3D GIS Platform. All rights reserved.'
  },

  zh: {
    languageLabel: '选择语言',

    navPlatform: '平台',
    navSolutions: '解决方案',
    navResources: '资源',
    navConnect: '联系',
    dashboard: '控制台',
    login: '登录',
    enterPlatform: '进入 3D 平台',

    checkingAccess: '正在检查 Demo 权限...',

    eyebrow: '申请 DEMO',
    title: '一个平台管理完整的实景三维数据',
    body:
      '申请 Demo，了解 3D GIS Platform 如何帮助团队在同一系统中管理、分析和可视化 UAV、LiDAR 与现场测绘数据。',

    feature1Title: '完整的 3D GIS Engine',
    feature1Body:
      '直接查看高精度 DOM 影像、GLB 3D Mesh 与大规模 Point Cloud 数据。',
    feature2Title: '企业级权限与存储',
    feature2Body:
      '集中管理 Owner、Editor、Viewer 权限以及项目数据。',
    feature3Title: '直接技术支持',
    feature3Body:
      '技术团队可协助沟通工作流程、数据基础设施以及项目部署方案。',

    formTitle: '申请 Demo',
    businessEmail: '工作邮箱',
    fullName: '姓名',
    jobTitle: '职位',
    companyName: '公司 / 单位',
    phoneNumber: '电话号码',
    message: '需求说明',
    source: '您从哪里了解到 SAOLATEK？',

    emailPlaceholder: 'example@yourdomain.com',
    fullNamePlaceholder: 'Nguyen Van A',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    companyPlaceholder: '公司或单位名称',
    phonePlaceholder: '+84 901 234 567',
    messagePlaceholder:
      '请说明项目背景、数据类型或 Demo 需求，以便我们将请求转给合适的团队。',
    sourcePlaceholder:
      '例如：Google、LinkedIn、合作伙伴、推荐、活动...',

    required: '必填',
    invalidEmail: '邮箱格式不正确',
    messageRequired: '请补充项目背景信息。',
    sourceRequired: '请告诉我们您从哪里了解到我们。',

    privacyBefore: '提交即表示您已阅读',
    privacyPolicy: '隐私政策',
    privacyAfter: '并同意相关条款。',

    submit: '申请 Demo',
    submitting: '正在提交...',
    openingDemo: '正在打开 Demo Showcase...',
    success:
      '感谢您！Demo 申请已成功提交。正在打开 Demo Showcase...',
    submitError:
      '无法提交 Demo 申请，请稍后重试。',

    footerRights: '© 2026 3D GIS Platform. All rights reserved.'
  }
};

export const BookDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } =
    useAuthStore();

  const { currentLang, setCurrentLang } =
    useLanguage('vi');
  const c = COPY[currentLang];

  const readTheme = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.localStorage.getItem(
        'saolatek_theme'
      ) === 'dark'
    );
  };

  const [isDarkMode, setIsDarkMode] =
    useState(readTheme);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    message: '',
    source: ''
  });

  const [errors, setErrors] =
    useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [serverMessage, setServerMessage] =
    useState('');
  const [serverMessageType, setServerMessageType] =
    useState<'success' | 'error' | ''>('');
  const [isRedirecting, setIsRedirecting] =
    useState(false);
  const [isCheckingAccess, setIsCheckingAccess] =
    useState(true);

  const openGrantedDemo = useCallback(() => {
    navigate('/dashboard?tab=demo', {
      replace: true
    });
  }, [navigate]);

  useEffect(() => {
    const syncTheme = () => {
      setIsDarkMode(readTheme());
    };

    const syncCustomTheme = (
      event: Event
    ) => {
      const detail = (
        event as CustomEvent<
          'light' | 'dark'
        >
      ).detail;

      if (detail === 'dark') {
        setIsDarkMode(true);
      }

      if (detail === 'light') {
        setIsDarkMode(false);
      }
    };

    window.addEventListener(
      'storage',
      syncTheme
    );
    window.addEventListener(
      'saolatek-theme-change',
      syncCustomTheme
    );

    return () => {
      window.removeEventListener(
        'storage',
        syncTheme
      );
      window.removeEventListener(
        'saolatek-theme-change',
        syncCustomTheme
      );
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { returnTo: '/book-demo' }
      });
      return;
    }

    if (user?.role === 'SUPERADMIN') {
      navigate('/dashboard', {
        replace: true
      });
      return;
    }

    setFormData((current) => ({
      ...current,
      email:
        current.email || user?.email || '',
      fullName:
        current.fullName ||
        user?.fullName ||
        ''
    }));

    let cancelled = false;

    const checkExistingDemoAccess = async () => {
      setIsCheckingAccess(true);

      const demoAccess =
        await fetchDemoAccess();

      if (cancelled) return;

      if (
        demoAccess.success &&
        demoAccess.hasAccess
      ) {
        openGrantedDemo();
        return;
      }

      setIsCheckingAccess(false);
    };

    void checkExistingDemoAccess();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    openGrantedDemo,
    user?.email,
    user?.fullName,
    user?.role
  ]);

  const handleEnterPlatform = async () => {
    if (
      isLoading ||
      isCheckingAccess
    ) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          returnTo: '/book-demo'
        }
      });
      return;
    }

    if (user?.role === 'SUPERADMIN') {
      navigate('/dashboard');
      return;
    }

    setIsCheckingAccess(true);

    const demoAccess =
      await fetchDemoAccess();

    if (
      demoAccess.success &&
      demoAccess.hasAccess
    ) {
      openGrantedDemo();
      return;
    }

    setIsCheckingAccess(false);

    document
      .getElementById('demo-form')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.email.trim()) {
      errs.email = c.invalidEmail;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      errs.email = c.invalidEmail;
    }

    if (!formData.jobTitle.trim()) {
      errs.jobTitle = c.required;
    }

    if (!formData.message.trim()) {
      errs.message = c.messageRequired;
    }

    if (!formData.source.trim()) {
      errs.source = c.sourceRequired;
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (user?.role === 'SUPERADMIN') {
      navigate('/dashboard', {
        replace: true
      });
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setServerMessage('');
    setServerMessageType('');

    const res = await submitDemoLead({
      email: formData.email.trim(),
      fullName:
        formData.fullName.trim() ||
        undefined,
      jobTitle:
        formData.jobTitle.trim() ||
        undefined,
      company:
        formData.company.trim() ||
        undefined,
      phone:
        formData.phone.trim() ||
        undefined,
      message: formData.message.trim(),
      source:
        formData.source.trim() ||
        undefined
    });

    setIsSubmitting(false);

    if (res.success) {
      setServerMessage(c.success);
      setServerMessageType('success');
      setIsRedirecting(true);

      window.setTimeout(() => {
        openGrantedDemo();
      }, 1500);

      return;
    }

    setServerMessageType('error');
    setServerMessage(
      res.message || c.submitError
    );
  };

  if (
    isLoading ||
    isCheckingAccess
  ) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDarkMode
            ? 'bg-[#080c14] text-white'
            : 'bg-[#f3f6fa] text-slate-900'
        }`}
      >
        <div
          className={`flex items-center gap-3 text-sm ${
            isDarkMode
              ? 'text-slate-300'
              : 'text-slate-600'
          }`}
        >
          <Loader2
            size={18}
            className="animate-spin text-blue-400"
          />
          <span>{c.checkingAccess}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white ${
        isDarkMode
          ? 'bg-[#080c14] text-white'
          : 'bg-[#f3f6fa] text-slate-900'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDarkMode
            ? 'bg-[radial-gradient(circle_at_20%_35%,rgba(37,99,235,0.18),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.1),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_18%_30%,rgba(2,132,199,0.10),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(14,165,233,0.06),transparent_42%)]'
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] ${
          isDarkMode
            ? 'text-slate-800 opacity-[0.15]'
            : 'text-slate-300 opacity-[0.20]'
        }`}
      />

      <header
        className={`relative z-20 w-full border-b backdrop-blur-md ${
          isDarkMode
            ? 'border-slate-800/80 bg-slate-950/70'
            : 'border-slate-200/90 bg-white/90'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5"
          >
            <img
              src={logoImg}
              alt="SAOLATEK"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${
              isDarkMode
                ? 'text-slate-300'
                : 'text-slate-600'
            }`}>
            <Link
              to="/"
              className={`transition-colors ${
                isDarkMode
                  ? 'hover:text-white'
                  : 'hover:text-slate-950'
              }`}
            >
              {c.navPlatform}
            </Link>

            <Link
              to="/"
              className={`transition-colors ${
                isDarkMode
                  ? 'hover:text-white'
                  : 'hover:text-slate-950'
              }`}
            >
              {c.navSolutions}
            </Link>

            <Link
              to="/"
              className={`transition-colors ${
                isDarkMode
                  ? 'hover:text-white'
                  : 'hover:text-slate-950'
              }`}
            >
              {c.navResources}
            </Link>

            <Link
              to="/"
              className={`transition-colors ${
                isDarkMode
                  ? 'hover:text-white'
                  : 'hover:text-slate-950'
              }`}
            >
              {c.navConnect}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <SolutionLanguageSwitcher
              currentLang={currentLang}
              onChange={setCurrentLang}
              ariaLabel={c.languageLabel}
            />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() =>
                  navigate('/dashboard')
                }
                className={`hidden items-center gap-1.5 text-xs font-medium transition-colors sm:flex ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>
                  {c.dashboard}
                  {user?.fullName
                    ? ` (${user.fullName.split(' ')[0]})`
                    : ''}
                </span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  navigate('/login')
                }
                className={`hidden text-xs transition-colors sm:block ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {c.login}
              </button>
            )}

            <button
              type="button"
              onClick={handleEnterPlatform}
              disabled={
                isLoading ||
                isCheckingAccess ||
                isRedirecting
              }
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {c.enterPlatform}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-grow grid-cols-1 items-start gap-12 px-5 py-8 sm:px-6 sm:py-12 lg:grid-cols-12">
        <div className="space-y-8 pt-4 lg:col-span-6">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${
            isDarkMode
              ? 'border-blue-500/30 bg-blue-950/60 text-blue-400'
              : 'border-sky-200 bg-sky-50 text-sky-700'
          }`}>
            <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
            <span>{c.eyebrow}</span>
          </div>

          <h1 className={`text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl ${
            isDarkMode
              ? 'text-white'
              : 'text-slate-950'
          }`}>
            {c.title}
          </h1>

          <p className={`max-w-xl text-base leading-relaxed sm:text-lg ${
            isDarkMode
              ? 'text-slate-300'
              : 'text-slate-600'
          }`}>
            {c.body}
          </p>

          <div className={`space-y-4 border-t pt-6 ${
            isDarkMode
              ? 'border-slate-800/80'
              : 'border-slate-200'
          }`}>
            {[
              {
                Icon: Sparkles,
                title: c.feature1Title,
                body: c.feature1Body
              },
              {
                Icon: Building2,
                title: c.feature2Title,
                body: c.feature2Body
              },
              {
                Icon: ShieldCheck,
                title: c.feature3Title,
                body: c.feature3Body
              }
            ].map(
              ({ Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3"
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isDarkMode
                      ? 'border-blue-500/40 bg-blue-950 text-blue-400'
                      : 'border-sky-200 bg-sky-50 text-sky-700'
                  }`}>
                    <Icon size={16} />
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold ${
                      isDarkMode
                        ? 'text-white'
                        : 'text-slate-900'
                    }`}>
                      {title}
                    </h4>

                    <p className={`text-xs leading-5 ${
                      isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}>
                      {body}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div
          id="demo-form"
          className="scroll-mt-24 lg:col-span-6"
        >
          <div className={`relative rounded-3xl border p-8 shadow-2xl sm:p-10 ${
            isDarkMode
              ? 'border-slate-700/70 bg-slate-900/95 text-slate-100 shadow-black/30'
              : 'border-slate-200 bg-white text-slate-900 shadow-slate-300/40'
          }`}>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <h2 className={`text-2xl font-bold tracking-tight ${
                isDarkMode
                  ? 'text-white'
                  : 'text-slate-900'
              }`}>
                {c.formTitle}
              </h2>

              {serverMessage && (
                <div
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    serverMessageType ===
                    'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {serverMessageType ===
                      'success' && (
                      <Loader2
                        size={15}
                        className="shrink-0 animate-spin"
                      />
                    )}

                    <span>
                      {serverMessage}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.businessEmail}{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  {errors.email && (
                    <span className="text-[11px] font-mono text-red-500">
                      {errors.email}
                    </span>
                  )}
                </div>

                <input
                  type="email"
                  placeholder={
                    c.emailPlaceholder
                  }
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value
                    })
                  }
                  className={`w-full border-b bg-transparent py-2 text-sm outline-none transition-colors ${
                    errors.email
                      ? isDarkMode
                        ? 'border-red-500 text-red-100 placeholder:text-red-300/60'
                        : 'border-red-500 text-slate-900 placeholder-red-300'
                      : isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.fullName}
                  </label>

                  <input
                    type="text"
                    placeholder={
                      c.fullNamePlaceholder
                    }
                    value={
                      formData.fullName
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fullName:
                          e.target.value
                      })
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                      {c.jobTitle}{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    {errors.jobTitle && (
                      <span className="text-[10px] font-mono text-red-500">
                        {
                          errors.jobTitle
                        }
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder={
                      c.jobTitlePlaceholder
                    }
                    value={
                      formData.jobTitle
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobTitle:
                          e.target.value
                      })
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition-colors ${
                      errors.jobTitle
                        ? isDarkMode
                          ? 'border-red-500 text-red-100'
                          : 'border-red-500 text-slate-900'
                        : isDarkMode
                          ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                          : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.companyName}
                  </label>

                  <input
                    type="text"
                    placeholder={
                      c.companyPlaceholder
                    }
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company:
                          e.target.value
                      })
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.phoneNumber}
                  </label>

                  <input
                    type="tel"
                    placeholder={
                      c.phonePlaceholder
                    }
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone:
                          e.target.value
                      })
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.message}{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  {errors.message && (
                    <span className="text-[10px] font-mono text-red-500">
                      {errors.message}
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  placeholder={
                    c.messagePlaceholder
                  }
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message:
                        e.target.value
                    })
                  }
                  className={`w-full rounded-lg border p-3 text-sm outline-none transition-colors ${
                    errors.message
                      ? isDarkMode
                      ? 'border-red-500/70 bg-red-950/30 text-red-100 placeholder:text-red-300/60'
                      : 'border-red-500 bg-red-50/50 text-slate-900'
                      : isDarkMode
                      ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.source}{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  {errors.source && (
                    <span className="text-[10px] font-mono text-red-500">
                      {errors.source}
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  placeholder={
                    c.sourcePlaceholder
                  }
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      source:
                        e.target.value
                    })
                  }
                  className={`w-full rounded-lg border p-3 text-sm outline-none transition-colors ${
                    errors.source
                      ? isDarkMode
                      ? 'border-red-500/70 bg-red-950/30 text-red-100 placeholder:text-red-300/60'
                      : 'border-red-500 bg-red-50/50 text-slate-900'
                      : isDarkMode
                      ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <p className={`pt-1 text-[11px] leading-normal ${
                isDarkMode
                  ? 'text-slate-500'
                  : 'text-slate-500'
              }`}>
                {c.privacyBefore}{' '}
                <span className={`cursor-pointer underline ${
                  isDarkMode
                    ? 'hover:text-slate-200'
                    : 'hover:text-slate-800'
                }`}>
                  {c.privacyPolicy}
                </span>{' '}
                {c.privacyAfter}
              </p>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isRedirecting
                  }
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      {c.openingDemo}
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      {c.submitting}
                    </>
                  ) : (
                    c.submit
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-6 text-center text-xs font-mono ${
        isDarkMode
          ? 'border-slate-900 text-slate-500'
          : 'border-slate-200 text-slate-500'
      }`}>
        {c.footerRights}
      </footer>
    </div>
  );
};

export default BookDemoPage;