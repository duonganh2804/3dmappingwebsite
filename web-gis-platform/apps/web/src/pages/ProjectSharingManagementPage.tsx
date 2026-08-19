import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import projectSharingImage from '../assets/project-sharing-long-phu.png';
import projectSharingOverviewImage from '../assets/project-sharing-overview.png';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
    publicLabel: string;
    privateLabel: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
    publicLabel: 'PUBLIC',
    privateLabel: 'PRIVATE',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
    publicLabel: 'PUBLIC',
    privateLabel: 'PRIVATE',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
    publicLabel: 'PUBLIC',
    privateLabel: 'PRIVATE',
  },
};

const readInitialTheme = () => {
  if (typeof window === 'undefined') return true;

  const saved =
    window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (saved === 'light') return false;
  if (saved === 'dark') return true;

  return true;
};

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


export const ProjectSharingManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    isAuthenticated,
    isLoading,
  } = useAuthStore();

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(readInitialTheme);

  const c = COPY[currentLang];
  const themeCopy = THEME_COPY[currentLang];

  useEffect(() => {
    const theme =
      isDarkMode ? 'dark' : 'light';

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );

    document.documentElement.dataset.saolatekTheme =
      theme;
  }, [isDarkMode]);

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        THEME_STORAGE_KEY
      ) {
        return;
      }

      if (event.newValue === 'dark') {
        setIsDarkMode(true);
      }

      if (event.newValue === 'light') {
        setIsDarkMode(false);
      }
    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  const demo = () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/book-demo' } });
      return;
    }

    navigate('/book-demo');
  };

  const themeLabel =
    isDarkMode
      ? themeCopy.switchToLight
      : themeCopy.switchToDark;

  return (
    <>
      <style>{`
        .psm-root {
          --color-paper: #050914;
          --color-paper-2: #07101c;
          --color-paper-3: #0b1523;

          --color-ink: #f8fafc;
          --color-ink-muted: #94a3b8;

          --color-border:
            rgba(255,255,255,.09);
          --color-border-cyan:
            rgba(56,189,248,.26);

          --color-accent: #38bdf8;
          --color-accent-strong: #0ea5e9;
          --color-accent-ink: #03111d;

          --psm-header:
            rgba(5,9,20,.88);

          --psm-shadow:
            0 26px 80px
            rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .psm-root.psm-light {
          --color-paper: #f8fafc;
          --color-paper-2: #eef4f8;
          --color-paper-3: #ffffff;

          --color-ink: #0f172a;
          --color-ink-muted: #526174;

          --color-border:
            rgba(15,23,42,.11);
          --color-border-cyan:
            rgba(2,132,199,.28);

          --color-accent: #0369a1;
          --color-accent-strong: #0284c7;
          --color-accent-ink: #ffffff;

          --psm-header:
            rgba(248,250,252,.90);

          --psm-shadow:
            0 24px 65px
            rgba(15,23,42,.14);

          color-scheme: light;
        }

        .psm-root {
          min-height: 100vh;
          overflow-x: clip;

          background:
            var(--color-paper);

          color:
            var(--color-ink);

          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .psm-header {
          background:
            var(--psm-header);
        }

        .psm-media {
          box-shadow:
            var(--psm-shadow);
        }

        .psm-focus:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 2px var(--color-paper),
            0 0 0 4px var(--color-accent);
        }

        /* Landing-style day / night toggle */

        .psm-theme-toggle {
          position: relative;

          width: 76px;
          height: 32px;

          flex-shrink: 0;
          overflow: hidden;

          display: flex;
          align-items: center;

          padding: 0;
          cursor: pointer;

          border-radius: 9999px;

          border:
            1px solid
            rgba(255,255,255,.20);

          background:
            linear-gradient(
              180deg,
              #2a80f1 0%,
              #70a7ff 100%
            );

          box-shadow:
            inset 0 2px 4px
              rgba(0,0,0,.10),
            0 1px 2px
              rgba(255,255,255,.05);

          transition:
            background .4s
              cubic-bezier(.16,1,.3,1),
            border-color .4s
              cubic-bezier(.16,1,.3,1);
        }

        .psm-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--color-accent);

          outline-offset: 3px;
        }

        .psm-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .psm-theme-toggle__thumb {
          position: absolute;

          left: 4px;
          top: 4px;

          width: 24px;
          height: 24px;

          z-index: 3;

          border-radius: 50%;
          background: #ffd34e;

          box-shadow:
            0 0 10px
            rgba(255,211,78,.75);

          transition:
            transform .4s
              cubic-bezier(.16,1,.3,1),
            background .4s
              cubic-bezier(.16,1,.3,1),
            box-shadow .4s
              cubic-bezier(.16,1,.3,1);
        }

        .psm-theme-toggle.is-dark
        .psm-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .psm-theme-toggle__clouds,
        .psm-theme-toggle__stars {
          position: absolute;
          inset: 0;

          pointer-events: none;
        }

        .psm-theme-toggle__clouds {
          opacity: 1;
          transition:
            opacity .35s ease;
        }

        .psm-theme-toggle.is-dark
        .psm-theme-toggle__clouds {
          opacity: 0;
        }

        .psm-theme-toggle__cloud {
          position: absolute;

          height: 8px;
          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .psm-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .psm-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .psm-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .psm-theme-toggle__stars {
          opacity: 0;
          transition:
            opacity .35s ease;
        }

        .psm-theme-toggle.is-dark
        .psm-theme-toggle__stars {
          opacity: 1;
        }

        .psm-theme-toggle__star {
          position: absolute;

          width: 2px;
          height: 2px;

          border-radius: 50%;
          background: #fff;

          animation:
            psm-star-pulse
            2s infinite ease-in-out;
        }

        .psm-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .psm-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .psm-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes psm-star-pulse {
          0%,
          100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .psm-root *,
          .psm-root *::before,
          .psm-root *::after {
            scroll-behavior:
              auto !important;
            animation-duration:
              .01ms !important;
            animation-iteration-count:
              1 !important;
            transition-duration:
              .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`psm-root ${
          isDarkMode
            ? ''
            : 'psm-light'
        }`}
      >
        <header className="psm-header sticky top-0 z-50 border-b border-[var(--color-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="psm-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
              aria-label={c.home}
            >
              <img
                src={logoImg}
                alt="SAOLATEK"
                className="h-8 w-auto object-contain sm:h-9"
              />
            </button>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <SolutionLanguageSwitcher
                currentLang={currentLang}
                onChange={setCurrentLang}
                ariaLabel={
                  c.languageLabel
                }
              />

              <button
                type="button"
                onClick={() =>
                  setIsDarkMode(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  themeLabel
                }
                title={themeLabel}
                aria-pressed={
                  isDarkMode
                }
                className={`psm-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="psm-theme-toggle__clouds">
                  <div className="psm-theme-toggle__cloud psm-theme-toggle__cloud-1" />
                  <div className="psm-theme-toggle__cloud psm-theme-toggle__cloud-2" />
                  <div className="psm-theme-toggle__cloud psm-theme-toggle__cloud-3" />
                </div>

                <div className="psm-theme-toggle__stars">
                  <div className="psm-theme-toggle__star psm-theme-toggle__star-1" />
                  <div className="psm-theme-toggle__star psm-theme-toggle__star-2" />
                  <div className="psm-theme-toggle__star psm-theme-toggle__star-3" />
                </div>

                <div className="psm-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="psm-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={demo}
                disabled={isLoading}
                className="psm-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-3.5 text-sm font-bold text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isLoading
                    ? themeCopy.demoLoading
                    : c.demo}
                </span>

                {isLoading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowRight size={15} />
                )}
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[12ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <div className="mt-7 max-w-[680px] border-l border-[var(--color-border)] pl-5">
                    {c.heroFacts.map((fact) => (
                      <p
                        key={fact}
                        className="border-b border-[var(--color-border)] py-3 text-sm leading-6 text-[var(--color-ink-muted)] last:border-b-0"
                      >
                        {fact}
                      </p>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="psm-focus mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {themeCopy.demoLoading}
                      </>
                    ) : (
                      <>
                        {c.demo}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                <figure className="min-w-0">
                  <div className="psm-media overflow-hidden rounded-xl border border-[var(--color-border)] bg-black sm:rounded-2xl">
                    <img
                      src={projectSharingImage}
                      alt={c.heroImageAlt}
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--color-ink-muted)]">
                    {c.heroImageCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* VISUAL STORY */}
          <section className="border-b border-[var(--color-border)] bg-[var(--color-paper-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.60fr)_minmax(0,.40fr)] lg:items-center lg:gap-16">
                <figure className="min-w-0">
                  <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-black sm:rounded-2xl">
                    <img
                      src={projectSharingOverviewImage}
                      alt={c.heroImageAlt}
                      className="aspect-[16/9] w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--color-ink-muted)]">
                    {c.heroImageCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                    {c.projectEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.projectTitle}
                  </h2>

                  <p className="mt-5 max-w-[640px] text-base leading-7 text-[var(--color-ink-muted)]">
                    {c.projectBody}
                  </p>

                  <div className="mt-8 space-y-6">
                    {c.projectItems.map((item) => (
                      <article
                        key={item.title}
                        className="border-t border-[var(--color-border)] pt-5"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[var(--color-ink-muted)]">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ACCESS COMPARISON */}
          <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[960px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                  {c.matrixEyebrow}
                </div>

                <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.matrixTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.matrixBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="border-t-2 border-[var(--color-accent)] pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--color-accent)]">
                        {themeCopy.publicLabel}
                      </div>
                      <h3 className="mt-1 text-xl font-semibold">
                        {c.matrixPublic}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 border-y border-[var(--color-border)]">
                    {c.matrixRows.map((row) => (
                      <div
                        key={`public-${row.label}`}
                        className="grid grid-cols-[150px_minmax(0,1fr)] gap-5 border-b border-[var(--color-border)] py-4 last:border-b-0"
                      >
                        <span className="text-xs font-semibold">
                          {row.label}
                        </span>

                        <span className="text-sm leading-6 text-[var(--color-ink-muted)]">
                          {row.publicProject}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border-t-2 border-[var(--color-border)] pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--color-ink-muted)]">
                        {themeCopy.privateLabel}
                      </div>
                      <h3 className="mt-1 text-xl font-semibold">
                        {c.matrixPrivate}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 border-y border-[var(--color-border)]">
                    {c.matrixRows.map((row) => (
                      <div
                        key={`private-${row.label}`}
                        className="grid grid-cols-[150px_minmax(0,1fr)] gap-5 border-b border-[var(--color-border)] py-4 last:border-b-0"
                      >
                        <span className="text-xs font-semibold">
                          {row.label}
                        </span>

                        <span className="text-sm leading-6 text-[var(--color-ink-muted)]">
                          {row.privateProject}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>

          {/* ACCESS JOURNEY */}
          <section className="border-b border-[var(--color-border)] bg-[var(--color-paper-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.34fr)_minmax(0,.66fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                    {c.flowEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[16ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.flowTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--color-ink-muted)]">
                    {c.flowBody}
                  </p>
                </div>

                <div className="relative border-l border-[var(--color-border)] pl-6 sm:pl-8">
                  {c.flowItems.map((item) => (
                    <article
                      key={item.title}
                      className="relative border-b border-[var(--color-border)] py-6 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span className="absolute -left-[29px] top-7 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] sm:-left-[37px]" />

                      <h3 className="text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-2 max-w-[760px] text-sm leading-7 text-[var(--color-ink-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CURRENT SCOPE */}
          <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                  {c.scopeEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.scopeTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.scopeBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.52fr)_minmax(0,.48fr)] lg:gap-16">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-accent)]">
                    {c.supportedTitle}
                  </h3>

                  <div className="mt-4">
                    {c.supportedItems.map((item) => (
                      <div
                        key={item}
                        className="border-t border-[var(--color-border)] py-4 text-sm leading-6 text-[var(--color-ink-muted)]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l border-[var(--color-border)] pl-0 lg:pl-10">
                  <h3 className="text-sm font-semibold">
                    {c.notClaimedTitle}
                  </h3>

                  <div className="mt-4">
                    {c.notClaimedItems.map((item) => (
                      <div
                        key={item}
                        className="border-t border-[var(--color-border)] py-4 text-sm leading-6 text-[var(--color-ink-muted)]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE / CTA */}
          <section className="bg-[var(--color-paper-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-18 xl:px-12">
              <div className="grid grid-cols-1 gap-12 border-y border-[var(--color-border)] py-10 lg:grid-cols-[minmax(0,.58fr)_minmax(0,.42fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>

                  <p className="mt-5 max-w-[640px] text-base leading-7 text-[var(--color-ink-muted)]">
                    {c.valueBody}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                    {c.values.map((value) => (
                      <span key={value}>
                        {value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:text-right">
                  <h2 className="text-[26px] font-semibold leading-tight tracking-[-.03em] md:text-[32px]">
                    {c.finalTitle}
                  </h2>

                  <p className="mt-3 max-w-[620px] text-base leading-7 text-[var(--color-ink-muted)] lg:ml-auto">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="psm-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {themeCopy.demoLoading}
                      </>
                    ) : (
                      <>
                        {c.demo}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--color-border)] bg-[var(--color-paper-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SAOLATEK"
                className="h-7 w-auto"
              />

              <span>
                {c.footer}
              </span>
            </div>

            <span>
              © 2026 SAOLATEK
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProjectSharingManagementPage;