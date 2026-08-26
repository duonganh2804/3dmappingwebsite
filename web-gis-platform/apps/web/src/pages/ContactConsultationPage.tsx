import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Loader2,
  Map,
  Send,
  ShieldCheck
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import { submitConsultationLead } from '../services/api';
import {
  useLanguage,
  type Language
} from '../hooks/useLanguage';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';


type FormData = {
  email: string;
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  topic: string;
  message: string;
};

type Copy = {
  languageLabel: string;
  home: string;
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
  formBody: string;
  email: string;
  emailPlaceholder: string;
  fullName: string;
  fullNamePlaceholder: string;
  jobTitle: string;
  jobTitlePlaceholder: string;
  company: string;
  companyPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  topic: string;
  topicPlaceholder: string;
  topicOptions: string[];
  message: string;
  messagePlaceholder: string;
  privacy: string;
  submit: string;
  submitting: string;

  required: string;
  invalidEmail: string;
  success: string;
  submitError: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    eyebrow: 'KẾT NỐI · LIÊN HỆ TƯ VẤN',
    title: 'Trao đổi về dự án 3D Mapping & Web GIS của bạn',
    body:
      'Cho chúng tôi biết bạn đang làm loại dự án nào, dữ liệu hiện có và mục tiêu cần giải quyết. Đội ngũ SAOLATEK sẽ dựa trên thông tin đó để trao đổi đúng trọng tâm.',

    feature1Title: 'Khảo sát & thu nhận dữ liệu',
    feature1Body:
      'Trao đổi về UAV Mapping, LiDAR, GNSS / GCP, phạm vi khảo sát và cách tổ chức workflow hiện trường.',
    feature2Title: 'Xử lý & khai thác dữ liệu 3D',
    feature2Body:
      'Tư vấn cách làm việc với Point Cloud, 3D Mesh, Orthophoto, DEM / DSM và các lớp dữ liệu sau xử lý.',
    feature3Title: 'Triển khai 3D Web GIS',
    feature3Body:
      'Trao đổi về Viewer, phân quyền, chia sẻ project, hạ tầng dữ liệu và cách đưa hệ thống vào quy trình làm việc.',

    formTitle: 'Thông tin cần tư vấn',
    formBody:
      'Không cần đăng nhập. Chỉ cần điền ngắn gọn bối cảnh dự án để chúng tôi hiểu nhu cầu trước khi liên hệ lại. Thông tin sẽ được lưu vào hệ thống để đội ngũ SAOLATEK tiếp nhận và xử lý.',
    email: 'Email công việc',
    emailPlaceholder: 'example@yourdomain.com',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'Nguyễn Văn A',
    jobTitle: 'Chức danh',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    company: 'Công ty / đơn vị',
    companyPlaceholder: 'Tên công ty hoặc đơn vị',
    phone: 'Số điện thoại',
    phonePlaceholder: '+84 901 234 567',
    topic: 'Bạn cần tư vấn về',
    topicPlaceholder: 'Chọn nội dung phù hợp nhất',
    topicOptions: [
      'UAV Mapping & lập kế hoạch khảo sát',
      'LiDAR / Point Cloud',
      '3D Mesh / Orthophoto / DEM / DSM',
      '3D Web GIS & Viewer',
      'Đo đạc & phân tích trên dữ liệu 3D',
      'Quản lý / chia sẻ project',
      'Tích hợp & triển khai hệ thống',
      'Khác'
    ],
    message: 'Mô tả nhu cầu / dự án',
    messagePlaceholder:
      'Ví dụ: loại dự án, diện tích / quy mô, dữ liệu đang có, sản phẩm đầu ra mong muốn, vấn đề hiện tại hoặc nội dung bạn muốn được tư vấn...',
    privacy:
      'Thông tin này chỉ được dùng để hiểu nhu cầu dự án và phản hồi yêu cầu tư vấn của bạn.',
    submit: 'Gửi thông tin tư vấn',
    submitting: 'Đang gửi thông tin...',

    required: 'Bắt buộc',
    invalidEmail: 'Email chưa hợp lệ',
    success:
      'Thông tin tư vấn đã được gửi thành công. Đội ngũ SAOLATEK sẽ liên hệ lại sau khi xem nội dung dự án.',
    submitError: 'Không thể gửi thông tin tư vấn. Vui lòng thử lại.',
    footer: 'Contact Consultation · 3D Web GIS'
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    eyebrow: 'CONNECT · CONSULTATION',
    title: 'Discuss your 3D Mapping & Web GIS project',
    body:
      'Tell us what type of project you are working on, what data you already have and what outcome you need. The SAOLATEK team can then focus the discussion on the right technical scope.',

    feature1Title: 'Survey & data capture',
    feature1Body:
      'Discuss UAV Mapping, LiDAR, GNSS / GCP, survey extent and field workflow.',
    feature2Title: '3D data processing & use',
    feature2Body:
      'Discuss Point Cloud, 3D Mesh, Orthophoto, DEM / DSM and processed project outputs.',
    feature3Title: '3D Web GIS deployment',
    feature3Body:
      'Discuss Viewer workflows, permissions, project sharing, data infrastructure and system adoption.',

    formTitle: 'Project consultation details',
    formBody:
      'No sign-in is required. Share the key project context so we can understand your needs before following up. The information will be stored in the system for the SAOLATEK team to review and manage.',
    email: 'Business Email',
    emailPlaceholder: 'example@yourdomain.com',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Nguyen Van A',
    jobTitle: 'Job Title',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    company: 'Company / Organization',
    companyPlaceholder: 'Company or organization name',
    phone: 'Phone Number',
    phonePlaceholder: '+84 901 234 567',
    topic: 'What do you need advice on?',
    topicPlaceholder: 'Select the closest topic',
    topicOptions: [
      'UAV Mapping & survey planning',
      'LiDAR / Point Cloud',
      '3D Mesh / Orthophoto / DEM / DSM',
      '3D Web GIS & Viewer',
      'Measurement & 3D analysis',
      'Project management / sharing',
      'System integration & deployment',
      'Other'
    ],
    message: 'Project needs / context',
    messagePlaceholder:
      'For example: project type, area / scale, existing data, expected outputs, current problem or the topic you want to discuss...',
    privacy:
      'This information is used only to understand your project needs and respond to the consultation request.',
    submit: 'Send consultation details',
    submitting: 'Sending details...',

    required: 'Required',
    invalidEmail: 'Invalid email',
    success:
      'Your consultation details have been submitted successfully. The SAOLATEK team will review them and follow up.',
    submitError: 'Unable to submit the consultation request. Please try again.',
    footer: 'Contact Consultation · 3D Web GIS'
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    eyebrow: '联系 · 咨询',
    title: '沟通您的 3D Mapping 与 Web GIS 项目',
    body:
      '请说明项目类型、现有数据以及希望解决的问题。SAOLATEK 团队将根据这些信息聚焦最相关的技术内容。',

    feature1Title: '测绘与数据采集',
    feature1Body:
      '讨论 UAV Mapping、LiDAR、GNSS / GCP、测区范围与现场工作流程。',
    feature2Title: '三维数据处理与应用',
    feature2Body:
      '讨论 Point Cloud、3D Mesh、Orthophoto、DEM / DSM 以及处理后的项目成果。',
    feature3Title: '3D Web GIS 部署',
    feature3Body:
      '讨论 Viewer、权限、项目共享、数据基础设施以及系统如何进入团队工作流程。',

    formTitle: '项目咨询信息',
    formBody:
      '无需登录。请简要填写项目背景，以便我们在联系前理解您的需求。信息将保存到系统中，供 SAOLATEK 团队查看和处理。',
    email: '工作邮箱',
    emailPlaceholder: 'example@yourdomain.com',
    fullName: '姓名',
    fullNamePlaceholder: 'Nguyen Van A',
    jobTitle: '职位',
    jobTitlePlaceholder: 'GIS Manager / Surveyor',
    company: '公司 / 单位',
    companyPlaceholder: '公司或单位名称',
    phone: '电话号码',
    phonePlaceholder: '+84 901 234 567',
    topic: '需要咨询的内容',
    topicPlaceholder: '选择最接近的主题',
    topicOptions: [
      'UAV Mapping 与测绘规划',
      'LiDAR / Point Cloud',
      '3D Mesh / Orthophoto / DEM / DSM',
      '3D Web GIS & Viewer',
      '测量与三维分析',
      '项目管理 / 共享',
      '系统集成与部署',
      '其他'
    ],
    message: '项目需求 / 背景',
    messagePlaceholder:
      '例如：项目类型、面积 / 规模、现有数据、期望成果、当前问题或希望咨询的内容...',
    privacy:
      '以上信息仅用于了解项目需求并回复本次咨询请求。',
    submit: '发送咨询信息',
    submitting: '正在发送信息...',

    required: '必填',
    invalidEmail: '邮箱格式不正确',
    success:
      '咨询信息已成功提交。SAOLATEK 团队查看项目内容后将与您联系。',
    submitError: '无法提交咨询信息，请稍后重试。',
    footer: 'Contact Consultation · 3D Web GIS'
  }
};

export const ContactConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
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

  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    topic: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

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

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      nextErrors.email = c.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = c.invalidEmail;
    }

    if (!formData.fullName.trim()) {
      nextErrors.fullName = c.required;
    }

    if (!formData.topic.trim()) {
      nextErrors.topic = c.required;
    }

    if (!formData.message.trim()) {
      nextErrors.message = c.required;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setServerMessage('');

    const result = await submitConsultationLead({
      email: formData.email.trim(),
      fullName: formData.fullName.trim(),
      jobTitle: formData.jobTitle.trim() || undefined,
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      topic: formData.topic,
      message: formData.message.trim()
    });

    if (!result.success) {
      setServerMessage(result.message || c.submitError);
      setIsSubmitting(false);
      return;
    }

    setServerMessage(c.success);
    setFormData({
      email: '',
      fullName: '',
      jobTitle: '',
      company: '',
      phone: '',
      topic: '',
      message: ''
    });
    setErrors({});
    setIsSubmitting(false);
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-x-hidden selection:bg-blue-600 selection:text-white ${
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
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src={logoImg}
              alt="SAOLATEK"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <SolutionLanguageSwitcher
              currentLang={currentLang}
              onChange={setCurrentLang}
              ariaLabel={c.languageLabel}
            />

            <button
              type="button"
              onClick={() => navigate('/')}
              className={`hidden items-center gap-1.5 text-xs font-semibold transition sm:flex ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {c.home}
            </button>


          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-grow grid-cols-1 items-start gap-12 px-5 py-9 sm:px-6 sm:py-12 lg:grid-cols-12">
        <section className="space-y-8 pt-2 lg:col-span-6 lg:pt-5">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono ${
            isDarkMode
              ? 'border-blue-500/30 bg-blue-950/60 text-blue-400'
              : 'border-sky-200 bg-sky-50 text-sky-700'
          }`}>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>{c.eyebrow}</span>
          </div>

          <div>
            <h1 className={`max-w-[760px] text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[58px] ${
              isDarkMode
                ? 'text-white'
                : 'text-slate-950'
            }`}>
              {c.title}
            </h1>

            <p className={`mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${
              isDarkMode
                ? 'text-slate-300'
                : 'text-slate-600'
            }`}>
              {c.body}
            </p>
          </div>

          <div className={`space-y-5 border-t pt-7 ${
            isDarkMode
              ? 'border-slate-800/80'
              : 'border-slate-200'
          }`}>
            {[
              {
                Icon: Map,
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
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  isDarkMode
                    ? 'border-blue-500/35 bg-blue-950 text-blue-400'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
                }`}>
                  <Icon size={17} />
                </div>
                <div>
                  <h2 className={`text-sm font-bold ${
                    isDarkMode
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}>
                    {title}
                  </h2>
                  <p className={`mt-1 max-w-lg text-xs leading-5 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </section>

        <section className="scroll-mt-24 lg:col-span-6">
          <div className={`rounded-3xl border p-7 shadow-2xl sm:p-10 ${
            isDarkMode
              ? 'border-slate-700/70 bg-slate-900/95 text-slate-100 shadow-black/30'
              : 'border-slate-200 bg-white text-slate-900 shadow-slate-300/40'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className={`text-2xl font-bold tracking-tight ${
                  isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
                }`}>
                  {c.formTitle}
                </h2>
                <p className={`mt-2 text-sm leading-6 ${
                  isDarkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}>
                  {c.formBody}
                </p>
              </div>

              {serverMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  {serverMessage}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.email} <span className="text-red-500">*</span>
                  </label>
                  {errors.email && (
                    <span className="text-[10px] font-mono text-red-500">
                      {errors.email}
                    </span>
                  )}
                </div>

                <input
                  type="email"
                  value={formData.email}
                  placeholder={c.emailPlaceholder}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value
                    }))
                  }
                  className={`w-full border-b bg-transparent py-2 text-sm outline-none transition ${
                    errors.email
                      ? isDarkMode
                        ? 'border-red-500 text-red-100 placeholder:text-red-300/60'
                        : 'border-red-500 text-slate-900'
                      : isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                      {c.fullName} <span className="text-red-500">*</span>
                    </label>
                    {errors.fullName && (
                      <span className="text-[10px] font-mono text-red-500">
                        {errors.fullName}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={formData.fullName}
                    placeholder={c.fullNamePlaceholder}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        fullName: event.target.value
                      }))
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm text-slate-900 outline-none transition ${
                      errors.fullName
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.jobTitle}
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    placeholder={c.jobTitlePlaceholder}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        jobTitle: event.target.value
                      }))
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.company}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    placeholder={c.companyPlaceholder}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        company: event.target.value
                      }))
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition ${
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
                    {c.phone}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    placeholder={c.phonePlaceholder}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone: event.target.value
                      }))
                    }
                    className={`w-full border-b bg-transparent py-2 text-sm outline-none transition ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.topic} <span className="text-red-500">*</span>
                  </label>
                  {errors.topic && (
                    <span className="text-[10px] font-mono text-red-500">
                      {errors.topic}
                    </span>
                  )}
                </div>

                <select
                  value={formData.topic}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      topic: event.target.value
                    }))
                  }
                  className={`w-full border-b bg-transparent py-2 text-sm outline-none transition ${
                    errors.topic
                      ? isDarkMode
                        ? 'border-red-500 text-red-100'
                        : 'border-red-500 text-slate-900'
                      : isDarkMode
                        ? 'border-slate-700 text-slate-100 focus:border-sky-400'
                        : 'border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option
                    value=""
                    className={
                      isDarkMode
                        ? 'bg-slate-900 text-slate-100'
                        : 'bg-white text-slate-900'
                    }
                  >
                    {c.topicPlaceholder}
                  </option>
                  {c.topicOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className={
                        isDarkMode
                          ? 'bg-slate-900 text-slate-100'
                          : 'bg-white text-slate-900'
                      }
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <label className={`block text-xs font-mono font-bold ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}>
                    {c.message} <span className="text-red-500">*</span>
                  </label>
                  {errors.message && (
                    <span className="text-[10px] font-mono text-red-500">
                      {errors.message}
                    </span>
                  )}
                </div>

                <textarea
                  rows={5}
                  value={formData.message}
                  placeholder={c.messagePlaceholder}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      message: event.target.value
                    }))
                  }
                  className={`w-full rounded-xl border p-3 text-sm outline-none transition ${
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

              <p className={`text-[11px] leading-5 ${
                isDarkMode
                  ? 'text-slate-500'
                  : 'text-slate-500'
              }`}>
                {c.privacy}
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {c.submitting}
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    {c.submit}
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className={`relative z-10 border-t py-6 text-center text-xs ${
        isDarkMode
          ? 'border-slate-900 text-slate-500'
          : 'border-slate-200 text-slate-500'
      }`}>
        © 2026 SAOLATEK · {c.footer}
      </footer>
    </div>
  );
};

export default ContactConsultationPage;