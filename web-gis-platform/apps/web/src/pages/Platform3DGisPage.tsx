import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import viewerHeroImage from '../assets/3d-gis-viewer-hero.png';
import viewerOverviewImage from '../assets/3d-gis-viewer-overview.png';
import viewerAreaImage from '../assets/3d-gis-viewer-area.png';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

const THEME_STORAGE_KEY = 'saolatek_theme';

type Item = {
  title: string;
  description: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demoCta: string;
  demoLoading: string;
  switchToLight: string;
  switchToDark: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroImageAlt: string;
  heroCaption: string;

  dataEyebrow: string;
  dataTitle: string;
  dataBody: string;
  data: Item[];
  overviewImageAlt: string;
  overviewCaption: string;

  viewEyebrow: string;
  viewTitle: string;
  viewBody: string;
  viewModesTitle: string;
  viewModes: string[];
  valueTitle: string;
  values: string[];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measures: Item[];
  measureImageAlt: string;
  measureCaption: string;

  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demoCta: 'Đăng ký xem Demo',
    demoLoading: 'Đang kiểm tra Demo...',
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',

    eyebrow: 'NỀN TẢNG · 3D GIS VIEWER',
    heroTitle:
      'Quan sát dữ liệu dự án trong cùng một không gian 3D',
    heroBody:
      '3D GIS Viewer tập trung các lớp dữ liệu của project trong cùng một không gian Web GIS để người dùng quan sát khu vực, thay đổi góc nhìn và kiểm tra dữ liệu trực tiếp trên trình duyệt.',
    heroImageAlt:
      '3D GIS Viewer hiển thị dữ liệu Point Cloud của dự án Nhiệt điện Long Phú',
    heroCaption:
      'Dữ liệu dự án được quan sát trực tiếp trong 3D GIS Viewer',

    dataEyebrow: 'DỮ LIỆU TRONG VIEWER',
    dataTitle:
      'Nhiều lớp dữ liệu trong cùng một bối cảnh project',
    dataBody:
      'Khi project có các lớp dữ liệu tương ứng, người dùng có thể chuyển giữa Point Cloud, 3D Mesh và Orthophoto / DOM mà không cần rời khỏi Viewer.',
    data: [
      {
        title: 'Point Cloud',
        description:
          'Quan sát dữ liệu điểm 3D của khu vực khảo sát và tập trung vào vị trí cần kiểm tra.',
      },
      {
        title: '3D Mesh',
        description:
          'Quan sát bề mặt và cấu trúc không gian của khu vực khi project có lớp mô hình tương ứng.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'Đối chiếu vị trí và bố cục khu vực từ ảnh trực giao theo góc nhìn trên xuống.',
      },
    ],
    overviewImageAlt:
      'Góc nhìn tổng quan dữ liệu dự án Nhiệt điện Long Phú trong 3D GIS Viewer',
    overviewCaption:
      'Góc nhìn tổng quan của dữ liệu project trong cùng Viewer',

    viewEyebrow: 'GÓC QUAN SÁT',
    viewTitle:
      'Thay đổi lớp dữ liệu và góc nhìn theo nội dung cần kiểm tra',
    viewBody:
      'Viewer hỗ trợ quan sát project từ nhiều góc nhìn. Người dùng có thể chuyển giữa góc phối cảnh và góc nhìn trên xuống, đồng thời bật lớp dữ liệu phù hợp với nội dung đang kiểm tra.',
    viewModesTitle: 'Các chế độ quan sát',
    viewModes: [
      'Góc nhìn tổng quan',
      'Point Cloud',
      '3D Mesh',
      'Orthophoto / DOM',
      'Góc nhìn phối cảnh',
      'Góc nhìn trên xuống',
    ],
    valueTitle: 'Trong workflow kiểm tra project',
    values: [
      'Tập trung dữ liệu trong cùng một không gian project',
      'Quan sát dữ liệu trực tiếp trên trình duyệt',
      'Chuyển giữa các lớp dữ liệu khi project có lớp tương ứng',
      'Giữ nguyên bối cảnh không gian khi thay đổi góc nhìn',
    ],

    measureEyebrow: 'ĐO ĐẠC TRÊN VIEWER',
    measureTitle:
      'Kiểm tra thông tin không gian trên dữ liệu đang quan sát',
    measureBody:
      'Các công cụ đo hiện có trong Viewer hỗ trợ kiểm tra khoảng cách, chênh cao và diện tích trên dữ liệu project.',
    measures: [
      {
        title: 'Khoảng cách',
        description:
          'Đo khoảng cách giữa các vị trí được chọn trên dữ liệu đang hiển thị.',
      },
      {
        title: 'Chênh cao',
        description:
          'Kiểm tra chênh lệch độ cao giữa hai điểm trong không gian 3D.',
      },
      {
        title: 'Diện tích',
        description:
          'Tạo vùng đo và xác định diện tích của khu vực được chọn.',
      },
    ],
    measureImageAlt:
      '3D GIS Viewer hiển thị thao tác đo diện tích trên dữ liệu Point Cloud dự án Nhiệt điện Long Phú',
    measureCaption:
      'Đo diện tích trực tiếp trên dữ liệu Point Cloud trong Viewer',

    finalEyebrow: '3D GIS VIEWER',
    finalTitle:
      'Trải nghiệm cách dữ liệu project được tổ chức và kiểm tra trong Viewer',
    finalBody:
      'Đăng ký Demo để mở dữ liệu mẫu và xem cách Point Cloud, 3D Mesh, Orthophoto / DOM và các công cụ đo được sử dụng trong cùng một project.',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demoCta: 'Request Demo Access',
    demoLoading: 'Checking Demo...',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    eyebrow: 'PLATFORM · 3D GIS VIEWER',
    heroTitle:
      'Review project data inside one 3D workspace',
    heroBody:
      'The 3D GIS Viewer brings project data layers into one Web GIS workspace so users can inspect an area, change the viewing angle, and review data directly in the browser.',
    heroImageAlt:
      '3D GIS Viewer displaying Point Cloud data from the Long Phú Thermal Power Plant project',
    heroCaption:
      'Project data viewed directly inside the 3D GIS Viewer',

    dataEyebrow: 'DATA IN THE VIEWER',
    dataTitle:
      'Multiple data layers in one project context',
    dataBody:
      'When the corresponding layers are available in a project, users can move between Point Cloud, 3D Mesh, and Orthophoto / DOM without leaving the Viewer.',
    data: [
      {
        title: 'Point Cloud',
        description:
          'Review three-dimensional point data from the surveyed area and focus on locations that require inspection.',
      },
      {
        title: '3D Mesh',
        description:
          'Review surface geometry and the spatial structure of the area when the project includes the corresponding model layer.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'Compare positions and project layout using orthographic imagery from a top-down view.',
      },
    ],
    overviewImageAlt:
      'Overview of Long Phú Thermal Power Plant project data inside the 3D GIS Viewer',
    overviewCaption:
      'Overview of project data inside the same Viewer',

    viewEyebrow: 'VIEWING OPTIONS',
    viewTitle:
      'Change the data layer and viewing angle for the inspection task',
    viewBody:
      'The Viewer supports multiple ways to inspect a project. Users can move between perspective and top-down views while displaying the data layer relevant to the current task.',
    viewModesTitle: 'Viewing modes',
    viewModes: [
      'Project overview',
      'Point Cloud',
      '3D Mesh',
      'Orthophoto / DOM',
      'Perspective view',
      'Top-down view',
    ],
    valueTitle: 'In the project inspection workflow',
    values: [
      'Keep project data inside one workspace',
      'Review data directly in the browser',
      'Switch between available project layers',
      'Preserve spatial context while changing the viewing angle',
    ],

    measureEyebrow: 'MEASUREMENT IN THE VIEWER',
    measureTitle:
      'Check spatial information on the data being viewed',
    measureBody:
      'The measurement tools currently available in the Viewer support checks of distance, elevation difference, and area on project data.',
    measures: [
      {
        title: 'Distance',
        description:
          'Measure the distance between selected positions on the displayed data.',
      },
      {
        title: 'Elevation difference',
        description:
          'Check the height difference between two points in 3D space.',
      },
      {
        title: 'Area',
        description:
          'Draw a measurement region and calculate the area of the selected location.',
      },
    ],
    measureImageAlt:
      '3D GIS Viewer showing an area measurement on Point Cloud data from the Long Phú Thermal Power Plant project',
    measureCaption:
      'Area measurement directly on Point Cloud data in the Viewer',

    finalEyebrow: '3D GIS VIEWER',
    finalTitle:
      'Explore how project data is organized and inspected in the Viewer',
    finalBody:
      'Request Demo access to open sample data and see how Point Cloud, 3D Mesh, Orthophoto / DOM, and measurement tools are used inside one project.',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demoCta: '申请演示访问',
    demoLoading: '正在检查 Demo...',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',

    eyebrow: '平台 · 3D GIS VIEWER',
    heroTitle:
      '在同一个三维空间中查看项目数据',
    heroBody:
      '3D GIS Viewer 将项目数据图层集中到同一个 Web GIS 空间中，用户可以直接在浏览器中查看区域、切换视角并检查数据。',
    heroImageAlt:
      '3D GIS Viewer 显示 Long Phú 火力发电厂项目的 Point Cloud 数据',
    heroCaption:
      '直接在 3D GIS Viewer 中查看项目数据',

    dataEyebrow: 'VIEWER 中的数据',
    dataTitle:
      '在同一个项目空间背景中查看多个数据图层',
    dataBody:
      '当项目具备相应数据图层时，用户可以在 Viewer 中切换 Point Cloud、3D Mesh 和 Orthophoto / DOM，无需离开当前项目。',
    data: [
      {
        title: 'Point Cloud',
        description:
          '查看测区的三维点数据，并聚焦需要进一步检查的位置。',
      },
      {
        title: '3D Mesh',
        description:
          '当项目具备相应模型图层时，可查看区域表面形态与空间结构。',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          '通过正射影像和俯视视角对照位置与项目平面布局。',
      },
    ],
    overviewImageAlt:
      '3D GIS Viewer 中 Long Phú 火力发电厂项目数据的整体视图',
    overviewCaption:
      '在同一个 Viewer 中查看项目数据整体范围',

    viewEyebrow: '查看方式',
    viewTitle:
      '根据检查任务切换数据图层和查看视角',
    viewBody:
      'Viewer 支持从不同角度检查项目。用户可以在透视视角和俯视视角之间切换，并显示与当前任务相关的数据图层。',
    viewModesTitle: '查看方式',
    viewModes: [
      '项目总览',
      'Point Cloud',
      '3D Mesh',
      'Orthophoto / DOM',
      '透视视角',
      '俯视视角',
    ],
    valueTitle: '在项目检查流程中',
    values: [
      '将项目数据集中在同一个工作空间',
      '直接在浏览器中查看数据',
      '在项目已有的数据图层之间切换',
      '切换视角时保持项目空间背景',
    ],

    measureEyebrow: 'VIEWER 中的测量',
    measureTitle:
      '直接在当前查看的数据上检查空间信息',
    measureBody:
      'Viewer 当前提供的测量工具支持在项目数据上检查距离、高差和面积。',
    measures: [
      {
        title: '距离',
        description:
          '测量当前显示数据上所选位置之间的距离。',
      },
      {
        title: '高差',
        description:
          '检查三维空间中两个点之间的高度差。',
      },
      {
        title: '面积',
        description:
          '绘制测量区域并计算所选位置的面积。',
      },
    ],
    measureImageAlt:
      '3D GIS Viewer 在 Long Phú 火力发电厂项目 Point Cloud 数据上显示面积测量',
    measureCaption:
      '直接在 Viewer 的 Point Cloud 数据上测量面积',

    finalEyebrow: '3D GIS VIEWER',
    finalTitle:
      '体验项目数据如何在 Viewer 中组织与检查',
    finalBody:
      '申请演示访问，打开示例数据并查看 Point Cloud、3D Mesh、Orthophoto / DOM 和测量工具如何在同一个项目中使用。',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
  },
};

const readInitialTheme = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const saved =
    window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (saved === 'light') {
    return false;
  }

  if (saved === 'dark') {
    return true;
  }

  return true;
};

export const Platform3DGisPage: React.FC = () => {
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
      ? c.switchToLight
      : c.switchToDark;

  const DemoButtonContent = () => {
    if (isDemoLoading) {
      return (
        <>
          <Loader2
            size={15}
            className="animate-spin"
          />
          <span>{c.demoLoading}</span>
        </>
      );
    }

    return (
      <>
        <span>{c.demoCta}</span>
        <ArrowRight size={15} />
      </>
    );
  };

  return (
    <>
      <style>{`
        .p3g-root {
          --p3g-bg: #050914;
          --p3g-bg-2: #07101c;
          --p3g-surface: #0b1523;

          --p3g-ink: #f8fafc;
          --p3g-muted: #94a3b8;
          --p3g-soft: #64748b;

          --p3g-border:
            rgba(255, 255, 255, .09);
          --p3g-border-strong:
            rgba(255, 255, 255, .16);

          --p3g-accent: #38bdf8;
          --p3g-accent-strong: #0ea5e9;
          --p3g-cta-ink: #03111d;

          --p3g-header:
            rgba(5, 9, 20, .88);

          --p3g-image-shadow:
            0 26px 80px
            rgba(0, 0, 0, .34);

          color-scheme: dark;
        }

        .p3g-root.p3g-light {
          --p3g-bg: #f8fafc;
          --p3g-bg-2: #eef4f8;
          --p3g-surface: #ffffff;

          --p3g-ink: #0f172a;
          --p3g-muted: #526174;
          --p3g-soft: #64748b;

          --p3g-border:
            rgba(15, 23, 42, .11);
          --p3g-border-strong:
            rgba(15, 23, 42, .20);

          --p3g-accent: #0369a1;
          --p3g-accent-strong: #0284c7;
          --p3g-cta-ink: #ffffff;

          --p3g-header:
            rgba(248, 250, 252, .90);

          --p3g-image-shadow:
            0 24px 65px
            rgba(15, 23, 42, .14);

          color-scheme: light;
        }

        .p3g-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--p3g-bg);
          color: var(--p3g-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .p3g-header {
          background:
            var(--p3g-header);
        }

        .p3g-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px
              var(--p3g-bg),
            0 0 0 4px
              var(--p3g-accent);
        }

        .p3g-image-frame {
          box-shadow:
            var(--p3g-image-shadow);
        }

        .p3g-image-frame img {
          transform: scale(1);
          transition:
            transform .5s
            cubic-bezier(.16,1,.3,1);
        }

        .p3g-image-frame:hover img {
          transform:
            scale(1.01);
        }

        /* ====================================== */
        /* DAY / NIGHT TOGGLE · Landing style    */
        /* ====================================== */

        .p3g-theme-toggle {
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

        .p3g-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--p3g-accent);
          outline-offset: 3px;
        }

        .p3g-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .p3g-theme-toggle__thumb {
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

        .p3g-theme-toggle.is-dark
        .p3g-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .p3g-theme-toggle__clouds,
        .p3g-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .p3g-theme-toggle__clouds {
          opacity: 1;
          transition:
            opacity .35s ease;
        }

        .p3g-theme-toggle.is-dark
        .p3g-theme-toggle__clouds {
          opacity: 0;
        }

        .p3g-theme-toggle__cloud {
          position: absolute;

          height: 8px;

          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .p3g-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .p3g-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .p3g-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .p3g-theme-toggle__stars {
          opacity: 0;

          transition:
            opacity .35s ease;
        }

        .p3g-theme-toggle.is-dark
        .p3g-theme-toggle__stars {
          opacity: 1;
        }

        .p3g-theme-toggle__star {
          position: absolute;

          border-radius: 50%;

          background: #fff;

          animation:
            p3g-star-pulse
            2s infinite ease-in-out;
        }

        .p3g-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
          width: 2px;
          height: 2px;
        }

        .p3g-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          width: 2px;
          height: 2px;
          animation-delay: .5s;
        }

        .p3g-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          width: 2px;
          height: 2px;
          animation-delay: 1s;
        }

        @keyframes p3g-star-pulse {
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
          .p3g-root *,
          .p3g-root *::before,
          .p3g-root *::after {
            scroll-behavior:
              auto !important;
            animation-duration:
              .01ms !important;
            animation-iteration-count:
              1 !important;
            transition-duration:
              .01ms !important;
          }

          .p3g-image-frame:hover img {
            transform: none;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`p3g-root ${
          isDarkMode
            ? ''
            : 'p3g-light'
        }`}
      >
        <header className="p3g-header sticky top-0 z-50 border-b border-[var(--p3g-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="p3g-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                title={
                  themeLabel
                }
                aria-pressed={
                  isDarkMode
                }
                className={`p3g-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="p3g-theme-toggle__clouds">
                  <div className="p3g-theme-toggle__cloud p3g-theme-toggle__cloud-1" />
                  <div className="p3g-theme-toggle__cloud p3g-theme-toggle__cloud-2" />
                  <div className="p3g-theme-toggle__cloud p3g-theme-toggle__cloud-3" />
                </div>

                <div className="p3g-theme-toggle__stars">
                  <div className="p3g-theme-toggle__star p3g-theme-toggle__star-1" />
                  <div className="p3g-theme-toggle__star p3g-theme-toggle__star-2" />
                  <div className="p3g-theme-toggle__star p3g-theme-toggle__star-3" />
                </div>

                <div className="p3g-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="p3g-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--p3g-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--p3g-muted)] transition-colors hover:border-[var(--p3g-border-strong)] hover:text-[var(--p3g-ink)] sm:inline-flex"
              >
                <ArrowLeft
                  size={15}
                />
                {c.home}
              </button>

              <button
                type="button"
                onClick={
                  openDemo
                }
                disabled={
                  isDemoLoading
                }
                className="p3g-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--p3g-accent)] px-3.5 text-sm font-bold text-[var(--p3g-cta-ink)] transition-colors hover:bg-[var(--p3g-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  c.demoCta
                }
              >
                <span className="hidden md:inline">
                  {isDemoLoading
                    ? c.demoLoading
                    : c.demoCta}
                </span>

                {isDemoLoading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowRight
                    size={15}
                  />
                )}
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="flex min-h-[calc(100svh-68px)] items-center border-b border-[var(--p3g-border)] bg-[var(--p3g-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-10 xl:px-12 py-10 md:py-12 lg:py-14 xl:py-16">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-12 xl:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--p3g-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[12ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px] 2xl:text-[70px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--p3g-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={
                      openDemo
                    }
                    disabled={
                      isDemoLoading
                    }
                    className="p3g-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--p3g-accent)] px-6 text-sm font-bold text-[var(--p3g-cta-ink)] transition-colors hover:bg-[var(--p3g-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <DemoButtonContent />
                  </button>

                </div>

                <figure className="min-w-0">
                  <div className="p3g-image-frame overflow-hidden rounded-xl border border-[var(--p3g-border)] bg-black sm:rounded-2xl">
                    <img
                      src={
                        viewerHeroImage
                      }
                      alt={
                        c.heroImageAlt
                      }
                      className="aspect-[16/10] w-full object-cover lg:min-h-[500px] xl:min-h-[570px] 2xl:min-h-[610px]"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--p3g-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* DATA */}
          <section className="border-b border-[var(--p3g-border)] bg-[var(--p3g-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-10 xl:px-12 py-14 md:py-18 lg:py-20 xl:py-22">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-start lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--p3g-accent)]">
                    {c.dataEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[16ch] text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px]">
                    {c.dataTitle}
                  </h2>

                  <p className="mt-5 max-w-[56ch] text-base leading-7 text-[var(--p3g-muted)]">
                    {c.dataBody}
                  </p>

                  <div className="mt-8 border-y border-[var(--p3g-border)]">
                    {c.data.map(
                      (item) => (
                        <article
                          key={
                            item.title
                          }
                          className="border-b border-[var(--p3g-border)] py-5 last:border-b-0"
                        >
                          <h3 className="text-base font-semibold">
                            {
                              item.title
                            }
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-[var(--p3g-muted)]">
                            {
                              item.description
                            }
                          </p>
                        </article>
                      )
                    )}
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="p3g-image-frame overflow-hidden rounded-xl border border-[var(--p3g-border)] bg-[var(--p3g-surface)] sm:rounded-2xl">
                    <img
                      src={
                        viewerOverviewImage
                      }
                      alt={
                        c.overviewImageAlt
                      }
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--p3g-muted)]">
                    {c.overviewCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* VIEWING */}
          <section className="border-b border-[var(--p3g-border)] bg-[var(--p3g-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--p3g-accent)]">
                  {c.viewEyebrow}
                </div>

                <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.viewTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--p3g-muted)]">
                  {c.viewBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-10 border-t border-[var(--p3g-border)] pt-8 lg:grid-cols-2 lg:gap-16 xl:gap-20">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--p3g-ink)]">
                    {c.viewModesTitle}
                  </h3>

                  <div className="mt-4 grid grid-cols-1 border-y border-[var(--p3g-border)] sm:grid-cols-2">
                    {c.viewModes.map((mode, index) => (
                      <div
                        key={mode}
                        className={`flex min-h-[64px] items-center border-[var(--p3g-border)] py-3 text-sm font-semibold ${
                          index % 2 === 0
                            ? 'sm:border-r sm:pr-6'
                            : 'sm:pl-6'
                        } ${
                          index < c.viewModes.length - 2
                            ? 'border-b'
                            : ''
                        }`}
                      >
                        {mode}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--p3g-ink)]">
                    {c.valueTitle}
                  </h3>

                  <div className="mt-4 border-y border-[var(--p3g-border)]">
                    {c.values.map((value) => (
                      <div
                        key={value}
                        className="border-b border-[var(--p3g-border)] py-4 text-sm leading-6 text-[var(--p3g-muted)] last:border-b-0"
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MEASUREMENT */}
          <section className="border-b border-[var(--p3g-border)] bg-[var(--p3g-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-10 xl:px-12 py-14 md:py-18 lg:py-20 xl:py-22">
              <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,.58fr)_minmax(0,.42fr)] lg:items-center lg:gap-16">
                <figure className="order-2 min-w-0 lg:order-1">
                  <div className="p3g-image-frame overflow-hidden rounded-xl border border-[var(--p3g-border)] bg-[var(--p3g-surface)] sm:rounded-2xl">
                    <img
                      src={
                        viewerAreaImage
                      }
                      alt={
                        c.measureImageAlt
                      }
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--p3g-muted)]">
                    {c.measureCaption}
                  </figcaption>
                </figure>

                <div className="order-1 lg:order-2">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--p3g-accent)]">
                    {
                      c.measureEyebrow
                    }
                  </div>

                  <h2 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px]">
                    {
                      c.measureTitle
                    }
                  </h2>

                  <p className="mt-5 text-base leading-7 text-[var(--p3g-muted)]">
                    {
                      c.measureBody
                    }
                  </p>

                  <div className="mt-8 border-y border-[var(--p3g-border)]">
                    {c.measures.map(
                      (item) => (
                        <article
                          key={
                            item.title
                          }
                          className="border-b border-[var(--p3g-border)] py-5 last:border-b-0"
                        >
                          <h3 className="text-base font-semibold">
                            {
                              item.title
                            }
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-[var(--p3g-muted)]">
                            {
                              item.description
                            }
                          </p>
                        </article>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--p3g-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-10 xl:px-12 py-14 md:py-16 lg:py-18">
              <div className="border-y border-[var(--p3g-border)] py-9 sm:py-11">
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--p3g-accent)]">
                      {
                        c.finalEyebrow
                      }
                    </div>

                    <h2 className="mt-3 max-w-[24ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[34px]">
                      {
                        c.finalTitle
                      }
                    </h2>

                    <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--p3g-muted)]">
                      {
                        c.finalBody
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      openDemo
                    }
                    disabled={
                      isDemoLoading
                    }
                    className="p3g-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--p3g-accent)] px-6 text-sm font-bold text-[var(--p3g-cta-ink)] transition-colors hover:bg-[var(--p3g-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <DemoButtonContent />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--p3g-border)] bg-[var(--p3g-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--p3g-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default Platform3DGisPage;