import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import agricultureHeroImage from '../assets/agriculture-hero.jpg';
import agricultureOverviewImage from '../assets/agriculture-uav.jpg';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
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

type CardItem = {
  title: string;
  body: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;
  openDemo3D: string;
  platformLink: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroTags: [string, string, string];
  fieldCapture: string;
  uavSurvey: string;
  heroCaption: string;

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flowItems: [CardItem, CardItem, CardItem, CardItem];

  dataEyebrow: string;
  dataTitle: string;
  dataBody: string;
  surveyContext: string;
  overviewCaption: string;
  dataItems: [CardItem, CardItem, CardItem];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measureItems: [CardItem, CardItem, CardItem];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
  workflowLabel: string;
  valueItems: [string, string, string, string, string];

  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  finalButton: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',
    openDemo3D: 'Mở Demo 3D',
    platformLink: 'Xem nền tảng 3D GIS',

    eyebrow: 'GIẢI PHÁP NÔNG NGHIỆP',
    heroTitle1: 'Quan sát khu vực canh tác trong một không gian',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Tổ chức dữ liệu khảo sát UAV thành DOM, mô hình 3D và Point Cloud để quan sát hiện trạng, đo đạc khu vực và chia sẻ project trực tiếp trên trình duyệt.',
    heroTags: ['UAV Mapping', '3D GIS', 'Đo đạc trực tiếp'],
    fieldCapture: 'THU NHẬN DỮ LIỆU',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      'Khảo sát khu vực canh tác và chuẩn bị dữ liệu trước khi đưa vào project Web GIS 3D',

    flowEyebrow: 'QUY TRÌNH DỮ LIỆU',
    flowTitle: 'Từ khảo sát khu vực đến dữ liệu có thể quan sát trên Web GIS',
    flowBody:
      'Quy trình được tổ chức theo project để dữ liệu thu nhận ngoài hiện trường luôn có bối cảnh rõ ràng khi đưa vào Viewer.',
    flowItems: [
      {
        title: 'Khảo sát khu vực',
        body: 'Thu nhận dữ liệu hiện trạng từ UAV và các nguồn khảo sát phù hợp.',
      },
      {
        title: 'Tổ chức dữ liệu',
        body: 'Đưa DOM, 3D Mesh và Point Cloud vào cùng một project Web GIS.',
      },
      {
        title: 'Quan sát & đo đạc',
        body: 'Mở dữ liệu trên trình duyệt, đổi góc nhìn và kiểm tra trực tiếp trên Viewer.',
      },
      {
        title: 'Chia sẻ project',
        body: 'Chia sẻ project theo phạm vi truy cập đã được thiết lập trong hệ thống.',
      },
    ],

    dataEyebrow: 'DỮ LIỆU TRONG PROJECT',
    dataTitle: 'Một khu vực, nhiều lớp dữ liệu và cùng một bối cảnh không gian',
    dataBody:
      'Người dùng có thể chuyển giữa các lớp dữ liệu tùy theo nội dung cần quan sát mà không phải rời khỏi project.',
    surveyContext: 'BỐI CẢNH KHẢO SÁT',
    overviewCaption: 'Dữ liệu khảo sát được tổ chức thành nhiều lớp trong cùng project',
    dataItems: [
      {
        title: 'Ảnh trực giao DOM',
        body: 'Quan sát mặt bằng khu vực khảo sát theo góc nhìn từ trên xuống và giữ đúng bối cảnh địa lý của dự án.',
      },
      {
        title: 'Mô hình 3D Mesh',
        body: 'Theo dõi địa hình, bề mặt và cấu trúc không gian của khu vực canh tác bằng góc nhìn 3D trực quan.',
      },
      {
        title: 'Point Cloud',
        body: 'Kiểm tra chi tiết dữ liệu không gian tại những vị trí cần quan sát kỹ hơn trong cùng một Viewer.',
      },
    ],

    measureEyebrow: 'ĐO ĐẠC TRÊN VIEWER',
    measureTitle: 'Kiểm tra khu vực trực tiếp trên dữ liệu đang quan sát',
    measureBody:
      'Công cụ đo hỗ trợ kiểm tra nhanh các thông tin không gian cơ bản của vùng khảo sát ngay trên trình duyệt.',
    measureItems: [
      {
        title: 'Diện tích',
        body: 'Khoanh vùng và xác định diện tích khu vực cần kiểm tra.',
      },
      {
        title: 'Khoảng cách',
        body: 'Đo khoảng cách giữa các vị trí ngay trên dữ liệu dự án.',
      },
      {
        title: 'Chênh cao',
        body: 'Kiểm tra khác biệt cao độ giữa các điểm trong không gian 3D.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Giữ dữ liệu khảo sát dễ quan sát và dễ phối hợp trong cùng project',
    valueBody:
      'Web GIS giúp dữ liệu hiện trường không bị tách rời khỏi bối cảnh dự án và cho phép người dùng kiểm tra theo đúng nhu cầu.',
    workflowLabel: 'Workflow trong project',
    valueItems: [
      'Tập trung dữ liệu khảo sát trong cùng một project',
      'Quan sát trực tiếp trên trình duyệt, không cần phần mềm desktop riêng',
      'Chuyển nhanh giữa DOM, 3D Mesh và Point Cloud',
      'Đo đạc ngay trên dữ liệu đang quan sát',
      'Chia sẻ project theo quyền truy cập phù hợp',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      'Trải nghiệm cách dữ liệu khảo sát khu vực canh tác được tổ chức trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem trực tiếp cách dữ liệu được hiển thị, đo đạc và quản lý trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'UAV · Agriculture · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    platformLink: 'View 3D GIS platform',

    eyebrow: 'AGRICULTURE SOLUTION',
    heroTitle1: 'Monitor agricultural areas inside a',
    heroTitle2: '3D Web GIS workspace',
    heroBody:
      'Organize UAV survey data into orthophotos, 3D models and Point Cloud layers to inspect site conditions, measure areas and share projects directly in the browser.',
    heroTags: ['UAV Mapping', '3D GIS', 'Browser Measurement'],
    fieldCapture: 'FIELD DATA CAPTURE',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      'Survey agricultural areas and prepare data before loading it into a 3D Web GIS project',

    flowEyebrow: 'DATA WORKFLOW',
    flowTitle: 'From field survey to data that can be inspected in Web GIS',
    flowBody:
      'The workflow is organized by project so field data keeps clear spatial context when it enters the Viewer.',
    flowItems: [
      {
        title: 'Survey the area',
        body: 'Capture current-condition data using UAV and other suitable survey sources.',
      },
      {
        title: 'Organize data',
        body: 'Bring orthophotos, 3D Mesh and Point Cloud into the same Web GIS project.',
      },
      {
        title: 'Inspect & measure',
        body: 'Open data in the browser, switch viewpoints and inspect it directly in the Viewer.',
      },
      {
        title: 'Share the project',
        body: 'Share the project according to the access scope configured in the system.',
      },
    ],

    dataEyebrow: 'PROJECT DATA',
    dataTitle: 'One area, multiple data layers and one shared spatial context',
    dataBody:
      'Users can switch between project layers according to the inspection task without leaving the project.',
    surveyContext: 'SURVEY CONTEXT',
    overviewCaption: 'Survey data is organized into multiple layers inside one project',
    dataItems: [
      {
        title: 'Orthophoto / DOM',
        body: 'Inspect the surveyed area from a top-down view while preserving the project geographic context.',
      },
      {
        title: '3D Mesh',
        body: 'Review terrain, surface conditions and spatial structure of the agricultural area in 3D.',
      },
      {
        title: 'Point Cloud',
        body: 'Inspect detailed spatial data at locations that require a closer look in the same Viewer.',
      },
    ],

    measureEyebrow: 'MEASUREMENT IN VIEWER',
    measureTitle: 'Check agricultural areas directly on the data being viewed',
    measureBody:
      'Measurement tools provide quick checks of key spatial information for the surveyed area directly in the browser.',
    measureItems: [
      {
        title: 'Area',
        body: 'Draw a region and calculate the area that needs to be checked.',
      },
      {
        title: 'Distance',
        body: 'Measure distances between positions directly on project data.',
      },
      {
        title: 'Elevation difference',
        body: 'Check elevation differences between points in the 3D workspace.',
      },
    ],

    valueEyebrow: 'OPERATIONAL VALUE',
    valueTitle: 'Keep survey data easy to inspect and coordinate inside one project',
    valueBody:
      'Web GIS keeps field data connected to project context and lets users inspect information according to their operational needs.',
    workflowLabel: 'Project workflow',
    valueItems: [
      'Survey data centralized in one project',
      'Browser-based viewing without separate desktop software',
      'Fast switching between orthophoto, 3D Mesh and Point Cloud',
      'Measurements directly on displayed data',
      'Project sharing with appropriate access permissions',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      'Experience how agricultural survey data is organized inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and see how data is visualized, measured and managed directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'UAV · Agriculture · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    platformLink: '查看 3D GIS 平台',

    eyebrow: '农业解决方案',
    heroTitle1: '在一个空间中查看农业区域',
    heroTitle2: '3D Web GIS',
    heroBody:
      '将无人机测绘数据组织为正射影像、3D 模型和点云，用于查看现场情况、测量区域，并直接在浏览器中共享项目。',
    heroTags: ['UAV Mapping', '3D GIS', '在线测量'],
    fieldCapture: '现场数据采集',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      '对农业区域进行测绘，并在数据进入 3D Web GIS 项目之前完成准备',

    flowEyebrow: '数据流程',
    flowTitle: '从现场测绘到可在 Web GIS 中查看的数据',
    flowBody:
      '工作流程按项目组织，使现场采集的数据进入 Viewer 后仍保持清晰的空间背景。',
    flowItems: [
      {
        title: '区域测绘',
        body: '通过无人机和其他合适的数据源采集现场现状数据。',
      },
      {
        title: '组织数据',
        body: '将正射影像、3D Mesh 和点云集中到同一个 Web GIS 项目。',
      },
      {
        title: '查看与测量',
        body: '直接在浏览器中打开数据、切换视角并在 Viewer 中进行检查。',
      },
      {
        title: '共享项目',
        body: '根据系统中已配置的访问范围共享项目。',
      },
    ],

    dataEyebrow: '项目数据',
    dataTitle: '一个区域、多种数据图层、统一的空间背景',
    dataBody:
      '用户可以根据检查目标在不同图层之间切换，而无需离开当前项目。',
    surveyContext: '测绘背景',
    overviewCaption: '测绘数据在同一个项目中被组织为多个图层',
    dataItems: [
      {
        title: '正射影像 DOM',
        body: '通过自上而下的视角查看测绘区域，并保持正确的项目地理背景。',
      },
      {
        title: '3D Mesh 模型',
        body: '通过 3D 视图查看农业区域的地形、表面和空间结构。',
      },
      {
        title: 'Point Cloud 点云',
        body: '在同一个 Viewer 中检查需要更详细查看位置的空间数据。',
      },
    ],

    measureEyebrow: 'VIEWER 中的测量',
    measureTitle: '直接在当前数据上检查农业区域',
    measureBody:
      '测量工具可以直接在浏览器中快速检查测绘区域的重要空间信息。',
    measureItems: [
      {
        title: '面积',
        body: '框选需要检查的区域并计算其面积。',
      },
      {
        title: '距离',
        body: '直接在项目数据上测量不同位置之间的距离。',
      },
      {
        title: '高程差',
        body: '检查 3D 空间中不同点之间的高程差。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '让测绘数据在同一项目中更容易查看和协同',
    valueBody:
      'Web GIS 让现场数据与项目背景保持连接，并允许用户根据实际需求查看和检查数据。',
    workflowLabel: '项目工作流程',
    valueItems: [
      '测绘数据集中在同一个项目中',
      '直接在浏览器中查看，无需独立桌面软件',
      '快速切换正射影像、3D Mesh 和点云',
      '直接在当前显示的数据上测量',
      '按适当的访问权限共享项目',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      '体验农业测绘数据如何在 3D GIS 项目中进行组织',
    finalBody:
      '申请演示以打开示例项目，并查看数据如何直接在浏览器中显示、测量和管理。',
    finalButton: '打开演示',
    footer: 'UAV · Agriculture · 3D GIS',
  },
};


export const AgricultureSolutionPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    openDemo,
    isDemoLoading,
  } = useDemoNavigation();

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

  const themeLabel =
    isDarkMode
      ? themeCopy.switchToLight
      : themeCopy.switchToDark;

  return (
    <>
      <style>{`
        .agr-root {
          --agr-bg: #050914;
          --agr-bg-2: #07101c;
          --agr-surface: #0b1523;

          --agr-ink: #f8fafc;
          --agr-muted: #94a3b8;
          --agr-soft: #64748b;

          --agr-border: rgba(255,255,255,.09);
          --agr-border-strong: rgba(255,255,255,.16);

          --agr-accent: #38bdf8;
          --agr-accent-strong: #0ea5e9;
          --agr-cta-ink: #03111d;

          --agr-header: rgba(5,9,20,.88);
          --agr-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .agr-root.agr-light {
          --agr-bg: #f8fafc;
          --agr-bg-2: #eef4f8;
          --agr-surface: #ffffff;

          --agr-ink: #0f172a;
          --agr-muted: #526174;
          --agr-soft: #64748b;

          --agr-border: rgba(15,23,42,.11);
          --agr-border-strong: rgba(15,23,42,.20);

          --agr-accent: #0369a1;
          --agr-accent-strong: #0284c7;
          --agr-cta-ink: #ffffff;

          --agr-header: rgba(248,250,252,.90);
          --agr-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .agr-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--agr-bg);
          color: var(--agr-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .agr-header {
          background: var(--agr-header);
        }

        .agr-media {
          box-shadow: var(--agr-shadow);
        }

        .agr-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--agr-bg),
            0 0 0 4px var(--agr-accent);
        }

        .agr-theme-toggle {
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
          border: 1px solid rgba(255,255,255,.20);
          background:
            linear-gradient(
              180deg,
              #2a80f1 0%,
              #70a7ff 100%
            );
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,.10),
            0 1px 2px rgba(255,255,255,.05);
          transition:
            background .4s cubic-bezier(.16,1,.3,1),
            border-color .4s cubic-bezier(.16,1,.3,1);
        }

        .agr-theme-toggle:focus-visible {
          outline: 2px solid var(--agr-accent);
          outline-offset: 3px;
        }

        .agr-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .agr-theme-toggle__thumb {
          position: absolute;
          left: 4px;
          top: 4px;
          width: 24px;
          height: 24px;
          z-index: 3;
          border-radius: 50%;
          background: #ffd34e;
          box-shadow:
            0 0 10px rgba(255,211,78,.75);
          transition:
            transform .4s cubic-bezier(.16,1,.3,1),
            background .4s cubic-bezier(.16,1,.3,1),
            box-shadow .4s cubic-bezier(.16,1,.3,1);
        }

        .agr-theme-toggle.is-dark
        .agr-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .agr-theme-toggle__clouds,
        .agr-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .agr-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .agr-theme-toggle.is-dark
        .agr-theme-toggle__clouds {
          opacity: 0;
        }

        .agr-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .agr-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .agr-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .agr-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .agr-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .agr-theme-toggle.is-dark
        .agr-theme-toggle__stars {
          opacity: 1;
        }

        .agr-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            agr-star-pulse
            2s infinite ease-in-out;
        }

        .agr-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .agr-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .agr-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes agr-star-pulse {
          0%, 100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .agr-root *,
          .agr-root *::before,
          .agr-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`agr-root ${
          isDarkMode ? '' : 'agr-light'
        }`}
      >
        <header className="agr-header sticky top-0 z-50 border-b border-[var(--agr-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="agr-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                ariaLabel={c.languageLabel}
              />

              <button
                type="button"
                onClick={() =>
                  setIsDarkMode(
                    (current) => !current
                  )
                }
                aria-label={themeLabel}
                title={themeLabel}
                aria-pressed={isDarkMode}
                className={`agr-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="agr-theme-toggle__clouds">
                  <div className="agr-theme-toggle__cloud agr-theme-toggle__cloud-1" />
                  <div className="agr-theme-toggle__cloud agr-theme-toggle__cloud-2" />
                  <div className="agr-theme-toggle__cloud agr-theme-toggle__cloud-3" />
                </div>

                <div className="agr-theme-toggle__stars">
                  <div className="agr-theme-toggle__star agr-theme-toggle__star-1" />
                  <div className="agr-theme-toggle__star agr-theme-toggle__star-2" />
                  <div className="agr-theme-toggle__star agr-theme-toggle__star-3" />
                </div>

                <div className="agr-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="agr-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--agr-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--agr-muted)] transition-colors hover:text-[var(--agr-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="agr-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--agr-accent)] px-3.5 text-sm font-bold text-[var(--agr-cta-ink)] transition-colors hover:bg-[var(--agr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isDemoLoading
                    ? themeCopy.demoLoading
                    : c.demo}
                </span>

                {isDemoLoading ? (
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
          <section className="border-b border-[var(--agr-border)] bg-[var(--agr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--agr-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--agr-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="agr-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--agr-accent)] px-6 text-sm font-bold text-[var(--agr-cta-ink)] transition-colors hover:bg-[var(--agr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDemoLoading ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          {themeCopy.demoLoading}
                        </>
                      ) : (
                        <>
                          {c.openDemo3D}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/platform/3d-gis')
                      }
                      className="agr-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--agr-border)] bg-transparent px-6 text-sm font-semibold text-[var(--agr-ink)] transition-colors hover:border-[var(--agr-border-strong)]"
                    >
                      {c.platformLink}
                    </button>
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="agr-media overflow-hidden rounded-xl border border-[var(--agr-border)] bg-black sm:rounded-2xl">
                    <img
                      src={agricultureHeroImage}
                      alt={c.fieldCapture}
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--agr-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* FIELD-TO-PROJECT JOURNEY */}
          <section className="border-b border-[var(--agr-border)] bg-[var(--agr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                    {c.flowEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.flowTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--agr-muted)]">
                    {c.flowBody}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
                  {c.flowItems.map((item) => (
                    <article
                      key={item.title}
                      className="border-t border-[var(--agr-border)] py-6"
                    >
                      <h3 className="text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[var(--agr-muted)]">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PROJECT DATA SHOWCASE */}
          <section className="border-b border-[var(--agr-border)] bg-[var(--agr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.62fr)_minmax(0,.38fr)] lg:items-start lg:gap-16">
                <figure className="min-w-0">
                  <div className="agr-media overflow-hidden rounded-xl border border-[var(--agr-border)] bg-black sm:rounded-2xl">
                    <img
                      src={agricultureOverviewImage}
                      alt={c.surveyContext}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--agr-muted)]">
                    {c.overviewCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                    {c.dataEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.dataTitle}
                  </h2>

                  <p className="mt-5 max-w-[600px] text-base leading-7 text-[var(--agr-muted)]">
                    {c.dataBody}
                  </p>

                  <div className="mt-8">
                    {c.dataItems.map((item) => (
                      <article
                        key={item.title}
                        className="border-t border-[var(--agr-border)] py-5"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[var(--agr-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MEASUREMENT BAND */}
          <section className="border-b border-[var(--agr-border)] bg-[var(--agr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                  {c.measureEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.measureTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--agr-muted)]">
                  {c.measureBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--agr-border)] lg:grid-cols-3">
                {c.measureItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--agr-border)] py-6 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                  >
                    <h3 className="text-lg font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-[var(--agr-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* PROJECT OPERATING VALUE */}
          <section className="border-b border-[var(--agr-border)] bg-[var(--agr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--agr-muted)]">
                    {c.valueBody}
                  </p>
                </div>

                <div className="border-y border-[var(--agr-border)]">
                  {c.valueItems.map((item) => (
                    <div
                      key={item}
                      className="border-b border-[var(--agr-border)] py-5 text-sm leading-7 text-[var(--agr-muted)] last:border-b-0"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--agr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-[72px] xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--agr-border)] py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--agr-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[24ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[36px]">
                    {c.finalTitle}
                  </h2>

                  <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--agr-muted)]">
                    {c.finalBody}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="agr-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--agr-accent)] px-6 text-sm font-bold text-[var(--agr-cta-ink)] transition-colors hover:bg-[var(--agr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isDemoLoading ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      {themeCopy.demoLoading}
                    </>
                  ) : (
                    <>
                      {c.finalButton}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--agr-border)] bg-[var(--agr-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--agr-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default AgricultureSolutionPage;