/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · genre: restrained enterprise · macrostructure: Project access overview → access matrix → project context → access flow → current scope · designed-as-app */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  FolderOpen,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  KeyRound,
  Database,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import projectSharingImage from '../assets/project-sharing-long-phu.png';
import projectSharingOverviewImage from '../assets/project-sharing-overview.png';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

type Item = {
  title: string;
  description: string;
};

type AccessRow = {
  label: string;
  publicProject: string;
  privateProject: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroNote: string;
  heroFacts: string[];
  heroImageAlt: string;
  heroImageCaption: string;
  heroImageTag: string;

  matrixEyebrow: string;
  matrixTitle: string;
  matrixBody: string;
  matrixPublic: string;
  matrixPrivate: string;
  matrixRows: AccessRow[];

  projectEyebrow: string;
  projectTitle: string;
  projectBody: string;
  projectItems: Item[];

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flowItems: Item[];

  scopeEyebrow: string;
  scopeTitle: string;
  scopeBody: string;
  supportedTitle: string;
  supportedItems: string[];
  notClaimedTitle: string;
  notClaimedItems: string[];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
  values: string[];

  finalTitle: string;
  finalBody: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',

    eyebrow: 'NỀN TẢNG · CHIA SẺ & QUẢN LÝ DỰ ÁN',
    heroTitle: 'Quản lý project theo phạm vi truy cập rõ ràng',
    heroBody:
      'Mỗi project có bối cảnh dữ liệu và phạm vi truy cập riêng. Hệ thống xác định project là public hay private, kiểm tra quyền khi cần và chỉ sau đó mới tải dữ liệu vào Viewer.',
    heroNote:
      'Trang này chỉ mô tả các hành vi truy cập đã được xác nhận trong hệ thống; không giả lập collaboration, comment hoặc tính năng chia sẻ nâng cao.',
    heroFacts: [
      'Public project có thể mở mà không cần đăng nhập',
      'Private project cần tài khoản và quyền phù hợp',
      'Viewer luôn mở theo một project cụ thể',
    ],
    heroImageAlt: 'Dữ liệu 3D thực tế của dự án Nhiệt điện Long Phú',
    heroImageCaption: 'Dữ liệu 3D thực tế · Nhiệt điện Long Phú',
    heroImageTag: 'Dữ liệu dự án',

    matrixEyebrow: 'MÔ HÌNH TRUY CẬP',
    matrixTitle: 'Public và Private khác nhau ở cách dữ liệu được mở',
    matrixBody:
      'Bảng dưới đây mô tả ngắn gọn cách hệ thống xử lý hai phạm vi truy cập chính của project.',
    matrixPublic: 'Public project',
    matrixPrivate: 'Private project',
    matrixRows: [
      {
        label: 'Đăng nhập',
        publicProject: 'Không bắt buộc',
        privateProject: 'Bắt buộc',
      },
      {
        label: 'Kiểm tra quyền project',
        publicProject: 'Không yêu cầu quyền thành viên',
        privateProject: 'Có kiểm tra quyền phù hợp',
      },
      {
        label: 'Truy cập dữ liệu',
        publicProject: 'Được phép khi project đang public',
        privateProject: 'Chỉ sau khi xác thực quyền',
      },
      {
        label: 'Mở Viewer',
        publicProject: 'Mở theo project public',
        privateProject: 'Mở sau khi access check thành công',
      },
    ],

    projectEyebrow: 'QUẢN LÝ THEO PROJECT',
    projectTitle: 'Project là đơn vị giữ dữ liệu và quyền truy cập cùng một chỗ',
    projectBody:
      'Thay vì tách dữ liệu khỏi ngữ cảnh, hệ thống lấy project làm điểm bắt đầu. Người dùng mở đúng project, dữ liệu thuộc project đó được tải và quyền truy cập được kiểm tra trong cùng bối cảnh.',
    projectItems: [
      {
        title: 'Project',
        description:
          'Xác định dự án cụ thể mà người dùng muốn truy cập và là ngữ cảnh chính cho Viewer.',
      },
      {
        title: 'Dữ liệu dự án',
        description:
          'Các lớp dữ liệu và nội dung quan sát được gắn với project đang mở, không phải một Viewer dùng chung không có ngữ cảnh.',
      },
      {
        title: 'Quyền truy cập',
        description:
          'Với project private, quyền được kiểm tra trước khi dữ liệu dự án được trả về cho người dùng.',
      },
    ],

    flowEyebrow: 'LUỒNG MỞ PROJECT',
    flowTitle: 'Từ yêu cầu truy cập đến Viewer',
    flowBody:
      'Luồng được giữ ngắn và dễ kiểm tra để người dùng chỉ vào Viewer khi project cho phép.',
    flowItems: [
      {
        title: 'Mở project',
        description: 'Người dùng chọn hoặc truy cập đúng project cần quan sát.',
      },
      {
        title: 'Xác định phạm vi',
        description: 'Hệ thống kiểm tra project đang ở trạng thái public hay private.',
      },
      {
        title: 'Kiểm tra quyền khi cần',
        description: 'Nếu project private, tài khoản và quyền project được xác thực.',
      },
      {
        title: 'Tải dữ liệu vào Viewer',
        description: 'Viewer chỉ nhận dữ liệu sau khi điều kiện truy cập được chấp nhận.',
      },
    ],

    scopeEyebrow: 'PHẠM VI HIỆN TẠI',
    scopeTitle: 'Mô tả đúng những gì hệ thống đang có',
    scopeBody:
      'Trang public nên phản ánh đúng năng lực hiện tại thay vì quảng cáo các chức năng cộng tác chưa được xác nhận.',
    supportedTitle: 'Đang có trong phạm vi',
    supportedItems: [
      'Project public có thể truy cập mà không cần đăng nhập',
      'Project private yêu cầu xác thực và quyền phù hợp',
      'Quyền được kiểm tra theo project trước khi trả dữ liệu',
      'Viewer hoạt động theo projectId cụ thể',
    ],
    notClaimedTitle: 'Chưa mô tả như chức năng hoàn chỉnh',
    notClaimedItems: [
      'Comment hoặc thảo luận trực tiếp trong project',
      'Mời thành viên bằng email từ trang public',
      'Chia sẻ bằng link có thời hạn',
      'Ma trận quyền nâng cao nhiều cấp trên giao diện public',
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Giữ đúng dữ liệu cho đúng người dùng',
    valueBody:
      'Quản lý truy cập theo project giúp dữ liệu luôn ở đúng bối cảnh và giảm rủi ro mở nhầm dữ liệu ngoài phạm vi.',
    values: [
      'Phân biệt rõ project công khai và riêng tư',
      'Kiểm tra quyền trước khi mở dữ liệu cần bảo vệ',
      'Giữ dữ liệu trong đúng bối cảnh project',
      'Hạn chế chia sẻ dữ liệu rời rạc ngoài hệ thống',
      'Đưa người dùng vào đúng Viewer được phép truy cập',
    ],

    finalTitle: 'Trao đổi cách tổ chức project và quyền truy cập',
    finalBody:
      'Đăng ký Demo để trao đổi với SAOLATEK về cách tổ chức dữ liệu, project và phạm vi truy cập phù hợp với nhu cầu sử dụng thực tế.',
    footer: '3D GIS · Project Access · Viewer',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',

    eyebrow: 'PLATFORM · PROJECT SHARING & MANAGEMENT',
    heroTitle: 'Manage projects with a clear access scope',
    heroBody:
      'Each project has its own data context and access scope. The system determines whether a project is public or private, validates access when required, and only then loads project data into the Viewer.',
    heroNote:
      'This page only describes access behavior already verified in the system; it does not simulate collaboration, comments, or advanced sharing features.',
    heroFacts: [
      'Public projects may open without sign-in',
      'Private projects require an account and appropriate access',
      'The Viewer always opens in the context of a specific project',
    ],
    heroImageAlt: 'Real-world 3D data from the Long Phú Thermal Power Plant project',
    heroImageCaption: 'Real-world 3D data · Long Phú Thermal Power Plant',
    heroImageTag: 'Project data',

    matrixEyebrow: 'ACCESS MODEL',
    matrixTitle: 'Public and Private differ in how project data is opened',
    matrixBody:
      'The table below summarizes how the system handles the two main project access scopes.',
    matrixPublic: 'Public project',
    matrixPrivate: 'Private project',
    matrixRows: [
      {
        label: 'Sign-in',
        publicProject: 'Not required',
        privateProject: 'Required',
      },
      {
        label: 'Project permission check',
        publicProject: 'No project-member permission required',
        privateProject: 'Appropriate access is checked',
      },
      {
        label: 'Data access',
        publicProject: 'Allowed while the project is public',
        privateProject: 'Only after access validation',
      },
      {
        label: 'Open Viewer',
        publicProject: 'Opens in the public project context',
        privateProject: 'Opens after the access check succeeds',
      },
    ],

    projectEyebrow: 'PROJECT-BASED MANAGEMENT',
    projectTitle: 'The project keeps data and access in the same context',
    projectBody:
      'Instead of separating data from context, the project is the starting point. Users open the correct project, its data is loaded, and access is evaluated within the same scope.',
    projectItems: [
      {
        title: 'Project',
        description:
          'Identifies the specific project a user is trying to access and provides the main context for the Viewer.',
      },
      {
        title: 'Project data',
        description:
          'Layers and viewing content remain associated with the project being opened rather than a generic context-free Viewer.',
      },
      {
        title: 'Access',
        description:
          'For private projects, permission is checked before project data is returned to the user.',
      },
    ],

    flowEyebrow: 'PROJECT ACCESS FLOW',
    flowTitle: 'From an access request to the Viewer',
    flowBody:
      'The flow stays short and auditable so a user reaches the Viewer only when the project allows it.',
    flowItems: [
      {
        title: 'Open a project',
        description: 'The user selects or opens the project they need to inspect.',
      },
      {
        title: 'Determine access scope',
        description: 'The system checks whether the project is public or private.',
      },
      {
        title: 'Validate access when required',
        description: 'For a private project, the account and project permission are checked.',
      },
      {
        title: 'Load data into the Viewer',
        description: 'The Viewer receives project data only after access conditions are accepted.',
      },
    ],

    scopeEyebrow: 'CURRENT SCOPE',
    scopeTitle: 'Describe only what the system currently supports',
    scopeBody:
      'The public page should reflect the verified product scope instead of advertising collaboration features that have not been confirmed.',
    supportedTitle: 'Currently in scope',
    supportedItems: [
      'Public projects may be accessed without sign-in',
      'Private projects require authentication and appropriate access',
      'Project access is checked before protected data is returned',
      'The Viewer operates with a specific projectId',
    ],
    notClaimedTitle: 'Not presented as completed features',
    notClaimedItems: [
      'Comments or project discussions',
      'Email member invitations from the public page',
      'Expiring share links',
      'Advanced multi-level permission matrices in the public UI',
    ],

    valueEyebrow: 'PRACTICAL VALUE',
    valueTitle: 'Keep the right data with the right users',
    valueBody:
      'Project-based access keeps data in the correct context and reduces the risk of exposing data outside its intended scope.',
    values: [
      'Clearly separate public and private projects',
      'Check access before opening protected data',
      'Keep data inside the correct project context',
      'Reduce disconnected sharing outside the system',
      'Open the correct Viewer for the project a user may access',
    ],

    finalTitle: 'Discuss project organization and access scope',
    finalBody:
      'Request a Demo to discuss how SAOLATEK can organize project data and access scope for your operational needs.',
    footer: '3D GIS · Project Access · Viewer',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',

    eyebrow: '平台 · 项目共享与管理',
    heroTitle: '以清晰的访问范围管理项目',
    heroBody:
      '每个项目都有独立的数据背景和访问范围。系统会判断项目是公开还是私有，在需要时验证访问权限，然后再将项目数据加载到 Viewer。',
    heroNote:
      '本页面仅描述系统中已确认的访问逻辑，不模拟尚未确认的协作、评论或高级共享功能。',
    heroFacts: [
      '公开项目可以无需登录即可打开',
      '私有项目需要账户和相应访问权限',
      'Viewer 始终在具体项目背景中打开',
    ],
    heroImageAlt: 'Long Phú 火力发电厂项目的真实 3D 数据',
    heroImageCaption: '真实 3D 数据 · Long Phú 火力发电厂',
    heroImageTag: '项目数据',

    matrixEyebrow: '访问模型',
    matrixTitle: 'Public 与 Private 在打开项目数据时采用不同处理方式',
    matrixBody:
      '下表概括系统如何处理两种主要的项目访问范围。',
    matrixPublic: 'Public project',
    matrixPrivate: 'Private project',
    matrixRows: [
      {
        label: '登录',
        publicProject: '不要求',
        privateProject: '要求',
      },
      {
        label: '项目权限检查',
        publicProject: '不要求项目成员权限',
        privateProject: '检查相应访问权限',
      },
      {
        label: '数据访问',
        publicProject: '项目处于公开状态时允许访问',
        privateProject: '仅在访问验证通过后',
      },
      {
        label: '打开 Viewer',
        publicProject: '在公开项目背景中打开',
        privateProject: '访问检查通过后打开',
      },
    ],

    projectEyebrow: '按项目管理',
    projectTitle: '项目将数据和访问权限保持在同一背景中',
    projectBody:
      '系统以项目为起点，而不是把数据与背景分离。用户打开正确的项目，项目数据被加载，同时访问权限在相同范围内进行判断。',
    projectItems: [
      {
        title: 'Project',
        description:
          '确定用户正在访问的具体项目，并为 Viewer 提供主要上下文。',
      },
      {
        title: '项目数据',
        description:
          '图层和查看内容与当前打开的项目保持关联，而不是进入没有项目背景的通用 Viewer。',
      },
      {
        title: '访问权限',
        description:
          '对于私有项目，在向用户返回项目数据之前先检查权限。',
      },
    ],

    flowEyebrow: '项目访问流程',
    flowTitle: '从访问请求到 Viewer',
    flowBody:
      '流程保持简短且清晰，只有项目允许访问时用户才进入 Viewer。',
    flowItems: [
      {
        title: '打开项目',
        description: '用户选择或打开需要查看的项目。',
      },
      {
        title: '确定访问范围',
        description: '系统检查项目是公开还是私有。',
      },
      {
        title: '必要时验证权限',
        description: '对于私有项目，检查账户和项目权限。',
      },
      {
        title: '在 Viewer 中加载数据',
        description: '只有访问条件通过后，Viewer 才接收项目数据。',
      },
    ],

    scopeEyebrow: '当前范围',
    scopeTitle: '只描述系统当前真正支持的能力',
    scopeBody:
      '公开页面应反映已确认的产品范围，而不是宣传尚未确认的协作功能。',
    supportedTitle: '当前范围内',
    supportedItems: [
      '公开项目可无需登录访问',
      '私有项目需要身份验证和相应访问权限',
      '受保护数据返回前会检查项目访问权限',
      'Viewer 使用具体的 projectId',
    ],
    notClaimedTitle: '尚不作为完整功能描述',
    notClaimedItems: [
      '项目评论或讨论',
      '从公开页面发送成员邀请邮件',
      '带有效期的共享链接',
      '公开界面中的高级多层权限矩阵',
    ],

    valueEyebrow: '使用价值',
    valueTitle: '让正确的数据提供给正确的用户',
    valueBody:
      '按项目管理访问权限，有助于保持正确的数据背景，并降低数据被开放到错误范围的风险。',
    values: [
      '明确区分公开项目和私有项目',
      '在打开受保护数据前检查访问权限',
      '将数据保持在正确的项目背景中',
      '减少系统之外的零散共享',
      '打开与用户可访问项目对应的正确 Viewer',
    ],

    finalTitle: '讨论项目组织与访问范围',
    finalBody:
      '申请演示，与 SAOLATEK 沟通如何根据实际使用需求组织项目数据和访问范围。',
    footer: '3D GIS · 项目访问 · Viewer',
  },
};

const PROJECT_ICONS = [FolderOpen, Eye, ShieldCheck] as const;

export const ProjectSharingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { isAuthenticated, isLoading } = useAuthStore();
  const c = COPY[currentLang];

  const demo = () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/book-demo' } });
      return;
    }

    navigate('/book-demo');
  };

  return (
    <div
      lang={currentLang}
      className="min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)] [--color-accent-ink:var(--color-paper)]"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-paper)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-5 md:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 border-0 bg-transparent p-0"
            aria-label={c.home}
          >
            <img src={logoImg} alt="SAOLATEK" className="h-8 w-auto object-contain sm:h-9" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <div className="[&_button]:min-w-[44px]">
              <SolutionLanguageSwitcher
                currentLang={currentLang}
                onChange={setCurrentLang}
                ariaLabel={c.languageLabel}
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 text-sm font-semibold text-[var(--color-ink-muted)] sm:inline-flex"
            >
              <ArrowLeft size={16} />
              {c.home}
            </button>

            <button
              type="button"
              onClick={demo}
              disabled={isLoading}
              className="inline-flex h-11 w-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-ink)] sm:h-10 md:w-auto md:px-4"
              aria-label={c.demo}
            >
              <span className="hidden md:inline">{c.demo}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="pointer-events-none absolute -right-32 top-8 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-[.035] blur-3xl" />

          <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[14ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px]">
                {c.heroTitle}
              </h1>

              <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-7 grid max-w-[620px] gap-2">
                {c.heroFacts.map((fact, index) => {
                  const Icon = [Globe2, LockKeyhole, Eye][index] ?? Check;
                  return (
                    <div
                      key={fact}
                      className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-3.5 py-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={16} />
                      </span>
                      <span className="text-sm leading-6 text-[var(--color-ink-muted)]">{fact}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={demo}
                  disabled={isLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
                >
                  {c.demo}
                  <ArrowRight size={16} />
                </button>

                <p className="max-w-[420px] text-xs leading-5 text-[var(--color-ink-muted)]">
                  {c.heroNote}
                </p>
              </div>
            </div>

            <figure className="min-w-0">
              <div className="group relative overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.22)]">
                <img
                  src={projectSharingImage}
                  alt={c.heroImageAlt}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-5 sm:top-5">
                  <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-white backdrop-blur">
                    PROJECT VIEW
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-semibold text-cyan-300 backdrop-blur">
                    {c.heroImageTag}
                  </span>
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-cyan-300">
                        <FolderOpen size={13} />
                        Project context
                      </div>
                      <p className="max-w-[520px] text-sm font-medium leading-6 text-white sm:text-base">
                        {c.heroImageCaption}
                      </p>
                    </div>

                    <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/35 text-cyan-300 backdrop-blur sm:flex">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        {/* ACCESS MATRIX */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-14">
              <div>
                <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                  {c.matrixEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                  {c.matrixTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.matrixBody}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <article className="overflow-hidden rounded-2xl border border-[var(--color-border-cyan)] bg-[var(--color-paper)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-paper-3)] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper)] text-[var(--color-accent)]">
                        <Globe2 size={18} />
                      </span>
                      <h3 className="text-base font-semibold">{c.matrixPublic}</h3>
                    </div>
                    <span className="rounded-full border border-[var(--color-border-cyan)] px-2.5 py-1 text-[10px] font-bold tracking-[.1em] text-[var(--color-accent)]">
                      PUBLIC
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--color-border)]">
                    {c.matrixRows.map((row) => (
                      <div key={`pub-${row.label}`} className="px-5 py-4">
                        <div className="text-xs font-semibold text-[var(--color-ink)]">{row.label}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {row.publicProject}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-paper-2)] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <LockKeyhole size={18} />
                      </span>
                      <h3 className="text-base font-semibold">{c.matrixPrivate}</h3>
                    </div>
                    <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-bold tracking-[.1em] text-[var(--color-ink-muted)]">
                      PRIVATE
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--color-border)]">
                    {c.matrixRows.map((row) => (
                      <div key={`pri-${row.label}`} className="px-5 py-4">
                        <div className="text-xs font-semibold text-[var(--color-ink)]">{row.label}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {row.privateProject}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECT CONTEXT */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1300px] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.56fr)_minmax(0,.44fr)] lg:items-center lg:gap-14">
              <figure className="min-w-0">
                <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-black shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <img
                    src={projectSharingOverviewImage}
                    alt={c.heroImageAlt}
                    className="aspect-[16/10] w-full object-contain"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold tracking-[.12em] text-cyan-300">
                        PROJECT DATA
                      </div>
                      <p className="mt-1 text-sm font-medium leading-5 text-white">
                        3D project overview · Viewer context
                      </p>
                    </div>
                    <span className="hidden rounded-lg border border-white/15 bg-black/40 p-2.5 text-cyan-300 backdrop-blur sm:inline-flex">
                      <Database size={18} />
                    </span>
                  </div>
                </div>
              </figure>

              <div>
                <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                  {c.projectEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                  {c.projectTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.projectBody}
                </p>

                <div className="mt-7 space-y-3">
                  {c.projectItems.map((item, index) => {
                    const Icon = PROJECT_ICONS[index];
                    return (
                      <article
                        key={item.title}
                        className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                          <Icon size={18} />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESS FLOW */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[820px]">
              <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                {c.flowEyebrow}
              </div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                {c.flowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.flowBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {c.flowItems.map((item, index) => {
                const Icon = [FolderOpen, Globe2, UserCheck, Eye][index] ?? Check;
                return (
                  <article
                    key={item.title}
                    className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CURRENT SCOPE */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-14">
              <div>
                <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                  {c.scopeEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                  {c.scopeTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.scopeBody}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[var(--color-border-cyan)] bg-[var(--color-paper-3)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper)] text-[var(--color-accent)]">
                      <ShieldCheck size={18} />
                    </span>
                    <h3 className="text-base font-semibold">{c.supportedTitle}</h3>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {c.supportedItems.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                        <Check size={15} className="mt-1 shrink-0 text-[var(--color-accent)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper-2)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
                      <KeyRound size={18} />
                    </span>
                    <h3 className="text-base font-semibold">{c.notClaimedTitle}</h3>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {c.notClaimedItems.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-muted)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-paper)]">
              <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-14 lg:p-10">
                <div>
                  <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                    {c.valueEyebrow}
                  </div>
                  <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.035em] md:text-[36px]">
                    {c.valueTitle}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                    {c.valueBody}
                  </p>
                </div>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {c.values.map((item) => (
                    <li
                      key={item}
                      className="flex min-w-0 gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4 text-sm leading-6 text-[var(--color-ink-muted)]"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Check size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-6 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-.03em] md:text-[32px]">
                {c.finalTitle}
              </h2>
              <p className="mt-3 max-w-[680px] text-base leading-7 text-[var(--color-ink-muted)]">
                {c.finalBody}
              </p>
            </div>

            <button
              type="button"
              onClick={demo}
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
            >
              {c.demo}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-paper-2)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-sm text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="SAOLATEK" className="h-7 w-auto" />
            <span>{c.footer}</span>
          </div>
          <span>© 2026 SAOLATEK</span>
        </div>
      </footer>
    </div>
  );
};

export default ProjectSharingManagementPage;