import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import viewerHeroImage from '../../assets/3d-gis-viewer-hero.png';
import viewerOverviewImage from '../../assets/3d-gis-viewer-overview.png';
import viewerAreaImage from '../../assets/3d-gis-viewer-area.png';
import agricultureHeroImage from '../../assets/agriculture-hero.jpg';

import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../../hooks/useLanguage';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';

type DemoProject = {
  name: string;
  type: string;
  description: string;
  data: string[];
  caption: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroPrimary: string;
  heroCaption: string;

  projectsEyebrow: string;
  projectsTitle: string;
  projectsBody: string;
  projects: [DemoProject, DemoProject];

  inspectEyebrow: string;
  inspectTitle: string;
  inspectBody: string;
  inspectItems: {
    title: string;
    body: string;
  }[];

  accessEyebrow: string;
  accessTitle: string;
  accessBody: string;
  accessItems: string[];

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

    eyebrow: 'TÀI NGUYÊN · DEMO MAPS',
    heroTitle1: 'Xem project 3D',
    heroTitle2: 'trong bối cảnh dữ liệu thực tế',
    heroBody:
      'Demo Maps cho phép người dùng quan sát dữ liệu sau xử lý theo đúng bối cảnh project: Point Cloud, mô hình 3D, lớp dữ liệu không gian và các thao tác đo trực tiếp trên Viewer.',
    heroPrimary: 'Mở Demo 3D',
    heroCaption:
      'Viewer dùng để quan sát và khai thác dữ liệu 3D theo project',

    projectsEyebrow: 'PROJECT SHOWCASE',
    projectsTitle: 'Hai bối cảnh project để xem cách dữ liệu được tổ chức',
    projectsBody:
      'Mỗi project đại diện cho một bối cảnh khảo sát khác nhau. Mục tiêu là giúp người xem hiểu dữ liệu được tổ chức như thế nào trước khi đi sâu vào các lớp và công cụ trong Viewer.',
    projects: [
      {
        name: 'Long Phú Thermal Power Plant',
        type: 'Industrial 3D Mapping',
        description:
          'Bối cảnh công nghiệp quy mô lớn, phù hợp để quan sát hiện trạng, cấu trúc công trình và dữ liệu 3D trong cùng một project.',
        data: [
          'Point Cloud / 3D scene',
          'Đo khoảng cách và diện tích',
          'Kiểm tra hiện trạng công trình'
        ],
        caption:
          'Dữ liệu 3D khu vực Nhiệt điện Long Phú trong Viewer'
      },
      {
        name: 'Queen Farm',
        type: 'Agriculture & Terrain Mapping',
        description:
          'Bối cảnh nông nghiệp / địa hình, dùng để minh họa cách phạm vi khảo sát, lớp mặt bằng và dữ liệu 3D được tổ chức trong cùng project.',
        data: [
          'Phạm vi khảo sát',
          'Dữ liệu mặt bằng / bề mặt',
          'Project layers trên Web GIS'
        ],
        caption:
          'Bối cảnh khảo sát nông nghiệp và địa hình trong workflow 3D Mapping'
      }
    ],

    inspectEyebrow: 'TRONG VIEWER',
    inspectTitle: 'Những thao tác chính cần nhìn thấy trong một Demo Map',
    inspectBody:
      'Demo không chỉ để xem mô hình. Người dùng cần thấy được cách dữ liệu được điều hướng, chuyển lớp và đo đạc trong cùng một bối cảnh project.',
    inspectItems: [
      {
        title: 'Điều hướng project 3D',
        body:
          'Xoay, phóng to, thu nhỏ và thay đổi góc nhìn để kiểm tra toàn bộ khu vực hoặc tập trung vào một vị trí.'
      },
      {
        title: 'Bật / tắt lớp dữ liệu',
        body:
          'Chuyển đổi giữa các lớp được cấp trong project để đối chiếu dữ liệu theo mục đích kiểm tra.'
      },
      {
        title: 'Đo đạc trực tiếp',
        body:
          'Thực hiện các phép đo hỗ trợ kiểm tra khoảng cách, diện tích hoặc vị trí trên dữ liệu đang hiển thị.'
      },
      {
        title: 'Kiểm tra cùng một bối cảnh',
        body:
          'Người có quyền truy cập có thể mở cùng project thay vì xử lý nhiều file đầu ra rời rạc.'
      }
    ],

    accessEyebrow: 'DEMO ACCESS',
    accessTitle: 'Quyền Demo gắn với tài khoản và project được cấp',
    accessBody:
      'Người chưa có quyền sẽ đi qua form đăng ký Demo. Tài khoản đã được cấp quyền có thể mở trực tiếp project Demo hiện có.',
    accessItems: [
      'Không cần tải toàn bộ bộ dữ liệu về máy để xem trước project',
      'Quyền Demo được quản lý theo từng tài khoản',
      'Project hiển thị phụ thuộc dữ liệu Demo đã được cấp',
      'Có thể quay lại Viewer sau khi tài khoản đã có quyền'
    ],

    finalEyebrow: 'DEMO ACCESS',
    finalTitle: 'Đăng ký quyền Demo để mở project 3D trên Viewer',
    finalBody:
      'Sau khi được cấp quyền, bạn có thể mở project Demo và kiểm tra cách Point Cloud, mô hình 3D và các lớp dữ liệu được hiển thị và đo đạc trên trình duyệt.',
    finalButton: 'Đăng ký xem Demo',
    footer: 'Demo Maps · 3D Viewer · Project Showcase'
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',

    eyebrow: 'RESOURCES · DEMO MAPS',
    heroTitle1: 'Explore a 3D project',
    heroTitle2: 'inside a real data context',
    heroBody:
      'Demo Maps lets users inspect processed project data in context: Point Cloud, 3D models, spatial layers and direct measurement tools inside the Viewer.',
    heroPrimary: 'Open 3D Demo',
    heroCaption:
      'The Viewer used to inspect and work with project-based 3D data',

    projectsEyebrow: 'PROJECT SHOWCASE',
    projectsTitle: 'Two project contexts showing how data is organized',
    projectsBody:
      'Each project represents a different survey context. The goal is to show how data is structured before users move deeper into layers and Viewer tools.',
    projects: [
      {
        name: 'Long Phú Thermal Power Plant',
        type: 'Industrial 3D Mapping',
        description:
          'A large industrial context for reviewing existing conditions, structural context and 3D data inside the same project.',
        data: [
          'Point Cloud / 3D scene',
          'Distance and area measurements',
          'Industrial site review'
        ],
        caption:
          'Long Phú Thermal Power Plant 3D data inside the Viewer'
      },
      {
        name: 'Queen Farm',
        type: 'Agriculture & Terrain Mapping',
        description:
          'An agriculture / terrain context showing how survey extent, plan-view data and 3D layers are organized inside one project.',
        data: [
          'Survey extent',
          'Plan / surface data',
          'Project layers in Web GIS'
        ],
        caption:
          'Agriculture and terrain mapping context inside the 3D Mapping workflow'
      }
    ],

    inspectEyebrow: 'INSIDE THE VIEWER',
    inspectTitle: 'The main interactions a Demo Map should make clear',
    inspectBody:
      'A Demo is not only about seeing a model. Users should understand how project data is navigated, layered and measured inside one project context.',
    inspectItems: [
      {
        title: 'Navigate the 3D project',
        body:
          'Rotate, zoom and change viewpoints to review the full site or focus on a selected location.'
      },
      {
        title: 'Control data layers',
        body:
          'Switch between available project layers to compare spatial information for different inspection needs.'
      },
      {
        title: 'Measure directly',
        body:
          'Use Viewer tools to support distance, area or location checks on the displayed data.'
      },
      {
        title: 'Review one project context',
        body:
          'Users with access can open the same project instead of handling multiple disconnected output files.'
      }
    ],

    accessEyebrow: 'DEMO ACCESS',
    accessTitle: 'Demo access is tied to the account and assigned project',
    accessBody:
      'Users without access are sent through the Demo request form. Accounts that already have access can open the available Demo project directly.',
    accessItems: [
      'Preview a project without downloading the full dataset',
      'Demo access is associated with the current account',
      'Visible projects depend on the Demo data assigned to the account',
      'Return to the Viewer after Demo access has been granted'
    ],

    finalEyebrow: 'DEMO ACCESS',
    finalTitle: 'Request Demo access to open a 3D project in the Viewer',
    finalBody:
      'Once access is granted, open the Demo project and inspect how Point Cloud, 3D models and spatial layers are displayed and measured directly in the browser.',
    finalButton: 'Request Demo',
    footer: 'Demo Maps · 3D Viewer · Project Showcase'
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',

    eyebrow: '资源 · DEMO MAPS',
    heroTitle1: '在真实数据环境中',
    heroTitle2: '查看三维项目',
    heroBody:
      'Demo Maps 用于查看处理后的项目数据：点云、三维模型、空间图层，以及 Viewer 中的直接测量工具。',
    heroPrimary: '打开 3D Demo',
    heroCaption:
      '用于查看和使用项目三维数据的 Viewer',

    projectsEyebrow: '项目展示',
    projectsTitle: '两个项目场景，展示数据如何组织',
    projectsBody:
      '每个项目代表一种不同的测绘背景，重点展示数据如何被组织，以及用户如何继续进入 Viewer 的图层与工具。',
    projects: [
      {
        name: 'Long Phú Thermal Power Plant',
        type: 'Industrial 3D Mapping',
        description:
          '大型工业场景，用于在同一个项目中查看现场现状、结构环境和三维数据。',
        data: [
          '点云 / 三维场景',
          '距离与面积测量',
          '工业现场检查'
        ],
        caption:
          'Long Phú 火力发电厂三维数据在 Viewer 中的展示'
      },
      {
        name: 'Queen Farm',
        type: 'Agriculture & Terrain Mapping',
        description:
          '农业 / 地形场景，展示测绘范围、平面数据和三维图层如何组织在同一个项目中。',
        data: [
          '测绘范围',
          '平面 / 表面数据',
          'Web GIS 项目图层'
        ],
        caption:
          '三维建图流程中的农业与地形测绘场景'
      }
    ],

    inspectEyebrow: 'VIEWER 功能',
    inspectTitle: 'Demo Map 中应该清晰展示的主要操作',
    inspectBody:
      'Demo 不只是查看模型，更要让用户理解如何浏览项目、切换图层并在同一个项目背景中进行测量。',
    inspectItems: [
      {
        title: '浏览三维项目',
        body:
          '旋转、缩放并切换视角，查看整个区域或聚焦到特定位置。'
      },
      {
        title: '控制数据图层',
        body:
          '切换项目中可用的图层，用于不同检查目的的数据对比。'
      },
      {
        title: '直接测量',
        body:
          '使用 Viewer 工具进行距离、面积或位置检查。'
      },
      {
        title: '在同一项目背景中检查',
        body:
          '拥有访问权限的用户可以打开同一个项目，而无需处理多个彼此独立的成果文件。'
      }
    ],

    accessEyebrow: 'DEMO 权限',
    accessTitle: 'Demo 权限与账号及被分配的项目关联',
    accessBody:
      '没有权限的用户会进入 Demo 申请表。已经获得权限的账号可以直接打开可用的 Demo 项目。',
    accessItems: [
      '无需下载完整数据集即可预览项目',
      'Demo 权限与当前账号关联',
      '可见项目取决于账号被分配的 Demo 数据',
      '获得权限后可再次进入 Viewer'
    ],

    finalEyebrow: 'DEMO 权限',
    finalTitle: '申请 Demo 权限，在 Viewer 中打开三维项目',
    finalBody:
      '获得权限后，可以直接在浏览器中查看点云、三维模型和空间图层的显示与测量方式。',
    finalButton: '申请演示',
    footer: 'Demo Maps · 3D Viewer · Project Showcase'
  }
};


const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
    projectLabel: string;
    contextLabel: string;
    dataLabel: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
    projectLabel: 'PROJECT',
    contextLabel: 'BỐI CẢNH',
    dataLabel: 'DỮ LIỆU / THAO TÁC',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
    projectLabel: 'PROJECT',
    contextLabel: 'CONTEXT',
    dataLabel: 'DATA / ACTIONS',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
    projectLabel: 'PROJECT',
    contextLabel: '场景',
    dataLabel: '数据 / 操作',
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

/*
 * Hallmark
 * component: demo-maps-page
 * genre: technical-editorial / project-showcase-index
 * theme: saolatek-product-dna
 * visual-anchor: project-viewer-imagery
 * density: medium
 *
 * layout:
 * - editorial hero + panoramic Viewer image
 * - project comparison index
 * - dual project visuals
 * - Viewer operations rail
 * - Demo access panel
 * - compact CTA
 *
 * business logic:
 * - preserve useDemoNavigation()
 * - preserve Demo access flow
 * - preserve VI / EN / ZH
 */

export const DemoMapsPage: React.FC = () => {
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
        .dmp-root {
          --dmp-bg: #050914;
          --dmp-bg-2: #07101c;
          --dmp-surface: #0b1523;

          --dmp-ink: #f8fafc;
          --dmp-muted: #94a3b8;
          --dmp-soft: #64748b;

          --dmp-border: rgba(255,255,255,.09);
          --dmp-border-strong: rgba(255,255,255,.16);

          --dmp-accent: #38bdf8;
          --dmp-accent-strong: #0ea5e9;
          --dmp-cta-ink: #03111d;

          --dmp-header: rgba(5,9,20,.88);
          --dmp-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .dmp-root.dmp-light {
          --dmp-bg: #f8fafc;
          --dmp-bg-2: #eef4f8;
          --dmp-surface: #ffffff;

          --dmp-ink: #0f172a;
          --dmp-muted: #526174;
          --dmp-soft: #64748b;

          --dmp-border: rgba(15,23,42,.11);
          --dmp-border-strong: rgba(15,23,42,.20);

          --dmp-accent: #0369a1;
          --dmp-accent-strong: #0284c7;
          --dmp-cta-ink: #ffffff;

          --dmp-header: rgba(248,250,252,.90);
          --dmp-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .dmp-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--dmp-bg);
          color: var(--dmp-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .dmp-header {
          background: var(--dmp-header);
        }

        .dmp-media {
          box-shadow: var(--dmp-shadow);
        }

        .dmp-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--dmp-bg),
            0 0 0 4px var(--dmp-accent);
        }

        .dmp-theme-toggle {
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

        .dmp-theme-toggle:focus-visible {
          outline: 2px solid var(--dmp-accent);
          outline-offset: 3px;
        }

        .dmp-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .dmp-theme-toggle__thumb {
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

        .dmp-theme-toggle.is-dark
        .dmp-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .dmp-theme-toggle__clouds,
        .dmp-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .dmp-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .dmp-theme-toggle.is-dark
        .dmp-theme-toggle__clouds {
          opacity: 0;
        }

        .dmp-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .dmp-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .dmp-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .dmp-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .dmp-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .dmp-theme-toggle.is-dark
        .dmp-theme-toggle__stars {
          opacity: 1;
        }

        .dmp-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            dmp-star-pulse
            2s infinite ease-in-out;
        }

        .dmp-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .dmp-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .dmp-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes dmp-star-pulse {
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
          .dmp-root *,
          .dmp-root *::before,
          .dmp-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`dmp-root ${
          isDarkMode ? '' : 'dmp-light'
        }`}
      >
        <header className="dmp-header sticky top-0 z-50 border-b border-[var(--dmp-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="dmp-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`dmp-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="dmp-theme-toggle__clouds">
                  <div className="dmp-theme-toggle__cloud dmp-theme-toggle__cloud-1" />
                  <div className="dmp-theme-toggle__cloud dmp-theme-toggle__cloud-2" />
                  <div className="dmp-theme-toggle__cloud dmp-theme-toggle__cloud-3" />
                </div>

                <div className="dmp-theme-toggle__stars">
                  <div className="dmp-theme-toggle__star dmp-theme-toggle__star-1" />
                  <div className="dmp-theme-toggle__star dmp-theme-toggle__star-2" />
                  <div className="dmp-theme-toggle__star dmp-theme-toggle__star-3" />
                </div>

                <div className="dmp-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="dmp-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--dmp-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--dmp-muted)] transition-colors hover:text-[var(--dmp-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="dmp-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--dmp-accent)] px-3.5 text-sm font-bold text-[var(--dmp-cta-ink)] transition-colors hover:bg-[var(--dmp-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--dmp-border)] bg-[var(--dmp-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dmp-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--dmp-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--dmp-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="dmp-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--dmp-accent)] px-6 text-sm font-bold text-[var(--dmp-cta-ink)] transition-colors hover:bg-[var(--dmp-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                        {c.heroPrimary}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                <figure className="min-w-0">
                  <div className="dmp-media overflow-hidden rounded-xl border border-[var(--dmp-border)] bg-black sm:rounded-2xl">
                    <img
                      src={viewerHeroImage}
                      alt={c.heroCaption}
                      className="aspect-[16/10] w-full object-cover lg:min-h-[520px] xl:min-h-[580px]"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--dmp-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* PROJECT INDEX */}
          <section className="border-b border-[var(--dmp-border)] bg-[var(--dmp-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1040px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dmp-accent)]">
                  {c.projectsEyebrow}
                </div>

                <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.projectsTitle}
                </h2>

                <p className="mt-5 max-w-[780px] text-base leading-7 text-[var(--dmp-muted)]">
                  {c.projectsBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto border-y border-[var(--dmp-border)]">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)] border-b border-[var(--dmp-border)]">
                    <div className="py-5 pr-6 font-mono text-[10px] font-bold tracking-[.12em] text-[var(--dmp-soft)]">
                      {themeCopy.projectLabel}
                    </div>

                    {c.projects.map((project) => (
                      <div
                        key={project.name}
                        className="border-l border-[var(--dmp-border)] px-6 py-5"
                      >
                        <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--dmp-accent)]">
                          {project.type}
                        </div>

                        <h3 className="mt-2 text-xl font-semibold">
                          {project.name}
                        </h3>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)] border-b border-[var(--dmp-border)]">
                    <div className="py-6 pr-6 font-mono text-[10px] font-bold tracking-[.12em] text-[var(--dmp-soft)]">
                      {themeCopy.contextLabel}
                    </div>

                    {c.projects.map((project) => (
                      <p
                        key={`${project.name}-context`}
                        className="border-l border-[var(--dmp-border)] px-6 py-6 text-sm leading-7 text-[var(--dmp-muted)]"
                      >
                        {project.description}
                      </p>
                    ))}
                  </div>

                  <div className="grid grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="py-6 pr-6 font-mono text-[10px] font-bold tracking-[.12em] text-[var(--dmp-soft)]">
                      {themeCopy.dataLabel}
                    </div>

                    {c.projects.map((project) => (
                      <div
                        key={`${project.name}-data`}
                        className="border-l border-[var(--dmp-border)] px-6 py-6"
                      >
                        {project.data.map((item) => (
                          <p
                            key={item}
                            className="border-t border-[var(--dmp-border)] py-3 text-sm leading-6 text-[var(--dmp-muted)] first:border-t-0 first:pt-0 last:pb-0"
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PROJECT VISUALS */}
          <section className="border-b border-[var(--dmp-border)] bg-[var(--dmp-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8">
                <figure className="min-w-0">
                  <div className="dmp-media overflow-hidden rounded-xl border border-[var(--dmp-border)] bg-black sm:rounded-2xl">
                    <img
                      src={viewerOverviewImage}
                      alt={c.projects[0].caption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--dmp-muted)]">
                    {c.projects[0].caption}
                  </figcaption>
                </figure>

                <figure className="min-w-0">
                  <div className="dmp-media overflow-hidden rounded-xl border border-[var(--dmp-border)] bg-black sm:rounded-2xl">
                    <img
                      src={agricultureHeroImage}
                      alt={c.projects[1].caption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--dmp-muted)]">
                    {c.projects[1].caption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* VIEWER OPERATIONS */}
          <section className="border-b border-[var(--dmp-border)] bg-[var(--dmp-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.58fr)_minmax(300px,.42fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dmp-accent)]">
                    {c.inspectEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.inspectTitle}
                  </h2>
                </div>

                <p className="max-w-[620px] text-base leading-7 text-[var(--dmp-muted)] lg:justify-self-end">
                  {c.inspectBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--dmp-border)] md:grid-cols-2 xl:grid-cols-4">
                {c.inspectItems.map((item, index) => (
                  <article
                    key={item.title}
                    className={`border-b border-[var(--dmp-border)] py-6 md:px-6 ${
                      index % 2 === 0
                        ? 'md:border-r'
                        : ''
                    } xl:min-h-[180px] xl:border-b-0 xl:border-r ${
                      index === 0
                        ? 'xl:pl-0'
                        : ''
                    } ${
                      index === c.inspectItems.length - 1
                        ? 'xl:border-r-0 xl:pr-0'
                        : ''
                    }`}
                  >
                    <h3 className="max-w-[17ch] text-lg font-semibold leading-7">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[var(--dmp-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* DEMO ACCESS */}
          <section className="border-b border-[var(--dmp-border)] bg-[var(--dmp-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.34fr)_minmax(0,.34fr)_minmax(0,.32fr)] lg:items-center lg:gap-10">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dmp-accent)]">
                    {c.accessEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.accessTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--dmp-muted)]">
                    {c.accessBody}
                  </p>
                </div>

                <figure className="min-w-0">
                  <div className="overflow-hidden rounded-xl border border-[var(--dmp-border)] bg-black sm:rounded-2xl">
                    <img
                      src={viewerAreaImage}
                      alt={c.heroCaption}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </figure>

                <div className="border-y border-[var(--dmp-border)]">
                  {c.accessItems.map((item) => (
                    <p
                      key={item}
                      className="border-b border-[var(--dmp-border)] py-4 text-sm leading-7 text-[var(--dmp-muted)] last:border-b-0"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="bg-[var(--dmp-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--dmp-border)] py-9 lg:grid-cols-[minmax(0,.62fr)_minmax(300px,.38fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dmp-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--dmp-muted)]">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="dmp-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--dmp-accent)] px-6 text-sm font-bold text-[var(--dmp-cta-ink)] transition-colors hover:bg-[var(--dmp-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--dmp-border)] bg-[var(--dmp-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--dmp-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default DemoMapsPage;