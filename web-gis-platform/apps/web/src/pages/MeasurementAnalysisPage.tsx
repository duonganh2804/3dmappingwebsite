import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import measurementDistanceImage from '../assets/measurement-3d-hero.png';
import measurementAreaImage from '../assets/measurement-area.png';
import analysisSectionImage from '../assets/measurement-section-analysis.png';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

const THEME_STORAGE_KEY = 'saolatek_theme';

type Item = {
  title: string;
  description: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;
  demoLoading: string;
  switchToLight: string;
  switchToDark: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroImageAlt: string;
  heroImageCaption: string;

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measuresTitle: string;
  measures: Item[];
  areaImageAlt: string;
  areaImageCaption: string;

  analysisEyebrow: string;
  analysisTitle: string;
  analysisBody: string;
  analysesTitle: string;
  analyses: Item[];
  sectionImageAlt: string;
  sectionImageCaption: string;

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflow: Item[];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
  values: string[];

  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',
    demoLoading: 'Đang kiểm tra Demo...',
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',

    eyebrow: 'NỀN TẢNG · ĐO ĐẠC & PHÂN TÍCH 3D',
    heroTitle:
      'Đo trực tiếp trên dữ liệu 3D của project',
    heroBody:
      'Viewer hỗ trợ đo khoảng cách 2D, khoảng cách 3D và chênh cao trực tiếp trên dữ liệu Point Cloud để kiểm tra kích thước và vị trí trong cùng bối cảnh không gian của project.',
    heroImageAlt:
      'Đo khoảng cách 2D, khoảng cách 3D và chênh cao trên dữ liệu Point Cloud trong Viewer',
    heroImageCaption:
      'Đo khoảng cách và chênh cao trực tiếp trên dữ liệu Point Cloud',

    measureEyebrow: 'CÔNG CỤ ĐO',
    measureTitle:
      'Đo khoảng cách, chênh cao và diện tích ngay trên dữ liệu đang quan sát',
    measureBody:
      'Người dùng chọn điểm hoặc vùng trực tiếp trong Viewer và đọc kết quả trong cùng không gian dữ liệu.',
    measuresTitle: 'Các phép đo đang được sử dụng',
    measures: [
      {
        title: 'Khoảng cách 2D / 3D',
        description:
          'Đo khoảng cách theo mặt bằng và khoảng cách thực trong không gian giữa các vị trí được chọn.',
      },
      {
        title: 'Chênh cao',
        description:
          'Kiểm tra chênh lệch độ cao giữa các điểm đã chọn trên dữ liệu 3D.',
      },
      {
        title: 'Diện tích',
        description:
          'Khoanh vùng trực tiếp trên dữ liệu để xác định diện tích khu vực cần kiểm tra.',
      },
    ],
    areaImageAlt:
      'Đo diện tích một khu vực trên dữ liệu Point Cloud trong Viewer',
    areaImageCaption:
      'Đo diện tích trực tiếp trên dữ liệu Point Cloud',

    analysisEyebrow: 'MẶT CẮT & CAO ĐỘ',
    analysisTitle:
      'Quan sát mặt cắt để kiểm tra hình dạng và phân bố cao độ',
    analysisBody:
      'Dữ liệu Point Cloud có thể được xem theo mặt cắt để tập trung vào một vùng đã chọn và quan sát hình dạng cùng sự thay đổi cao độ trong khu vực đó.',
    analysesTitle: 'Trong thao tác mặt cắt',
    analyses: [
      {
        title: 'Chọn phạm vi',
        description:
          'Xác định khu vực dữ liệu cần tập trung thay vì quan sát toàn bộ project cùng lúc.',
      },
      {
        title: 'Quan sát mặt cắt',
        description:
          'Hiển thị dữ liệu theo mặt cắt để kiểm tra hình dạng công trình hoặc địa hình trong vùng đã chọn.',
      },
      {
        title: 'Đọc cao độ',
        description:
          'Quan sát sự thay đổi cao độ dựa trên trục và cách dữ liệu được hiển thị trong mặt cắt.',
      },
    ],
    sectionImageAlt:
      'Mặt cắt và cao độ của dữ liệu Point Cloud trong Viewer',
    sectionImageCaption:
      'Mặt cắt Point Cloud · quan sát hình dạng và phân bố cao độ',

    workflowEyebrow: 'LUỒNG THAO TÁC',
    workflowTitle:
      'Từ vị trí cần kiểm tra đến kết quả ngay trong Viewer',
    workflowBody:
      'Quy trình đo được giữ trong cùng không gian project để người dùng không phải chuyển sang công cụ rời rạc.',
    workflow: [
      {
        title: 'Mở dữ liệu project',
        description:
          'Mở project và lớp dữ liệu cần kiểm tra trong Viewer.',
      },
      {
        title: 'Chọn công cụ',
        description:
          'Chọn khoảng cách, chênh cao, diện tích hoặc mặt cắt theo nội dung cần kiểm tra.',
      },
      {
        title: 'Chọn vị trí hoặc vùng',
        description:
          'Đánh dấu điểm, đường hoặc khu vực trực tiếp trên dữ liệu 3D.',
      },
      {
        title: 'Đọc kết quả',
        description:
          'Xem thông tin đo hoặc mặt cắt ngay trong cùng không gian project.',
      },
    ],

    valueEyebrow: 'TRONG WORKFLOW 3D GIS',
    valueTitle:
      'Giữ nguyên bối cảnh dữ liệu khi kiểm tra kích thước và cao độ',
    valueBody:
      'Đo và xem mặt cắt trong cùng Viewer giúp người dùng tiếp tục quan sát dữ liệu project trong khi kiểm tra thông tin không gian.',
    values: [
      'Đo trực tiếp trên dữ liệu Point Cloud đang quan sát',
      'So sánh khoảng cách 2D và khoảng cách 3D',
      'Kiểm tra chênh lệch cao độ giữa các vị trí',
      'Khoanh vùng và đọc diện tích trên dữ liệu',
      'Quan sát mặt cắt để kiểm tra cấu trúc và cao độ',
    ],

    finalEyebrow: 'MEASUREMENT · 3D GIS',
    finalTitle:
      'Trải nghiệm công cụ đo trực tiếp trên dữ liệu 3D',
    finalBody:
      'Đăng ký Demo để mở dữ liệu mẫu và xem cách các công cụ đo, diện tích và mặt cắt được sử dụng trong Viewer.',
    footer:
      'Point Cloud · Measurement · Section · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',
    demoLoading: 'Checking Demo...',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    eyebrow: 'PLATFORM · 3D MEASUREMENT & ANALYSIS',
    heroTitle:
      'Measure directly on project 3D data',
    heroBody:
      'The Viewer supports 2D distance, 3D distance, and elevation-difference measurements directly on Point Cloud data while keeping the result in the same project context.',
    heroImageAlt:
      '2D distance, 3D distance, and elevation-difference measurement on Point Cloud data in the Viewer',
    heroImageCaption:
      'Distance and elevation measurement directly on Point Cloud data',

    measureEyebrow: 'MEASUREMENT TOOLS',
    measureTitle:
      'Measure distance, elevation difference, and area on the data being viewed',
    measureBody:
      'Users select points or regions directly in the Viewer and read the result inside the same data workspace.',
    measuresTitle: 'Measurement operations in use',
    measures: [
      {
        title: '2D / 3D distance',
        description:
          'Measure plan distance and spatial distance between selected positions.',
      },
      {
        title: 'Elevation difference',
        description:
          'Check the height difference between selected points on the 3D data.',
      },
      {
        title: 'Area',
        description:
          'Draw a region directly on the data to determine the area being inspected.',
      },
    ],
    areaImageAlt:
      'Area measurement on Point Cloud data inside the Viewer',
    areaImageCaption:
      'Area measurement directly on Point Cloud data',

    analysisEyebrow: 'SECTION & ELEVATION',
    analysisTitle:
      'Use a section view to inspect shape and elevation distribution',
    analysisBody:
      'Point Cloud data can be viewed as a section so users can focus on a selected region and review its shape together with elevation changes.',
    analysesTitle: 'During section inspection',
    analyses: [
      {
        title: 'Select a region',
        description:
          'Focus on the relevant portion of the dataset instead of viewing the full project at once.',
      },
      {
        title: 'Inspect the section',
        description:
          'Display the selected data as a section to inspect the shape of structures or terrain.',
      },
      {
        title: 'Read elevation',
        description:
          'Review elevation change using the section axis and the way the data is displayed.',
      },
    ],
    sectionImageAlt:
      'Section and elevation view of Point Cloud data inside the Viewer',
    sectionImageCaption:
      'Point Cloud section · shape and elevation distribution',

    workflowEyebrow: 'INTERACTION FLOW',
    workflowTitle:
      'From a location of interest to a result inside the Viewer',
    workflowBody:
      'The measurement workflow stays inside the same project workspace so users do not need to switch to a disconnected tool.',
    workflow: [
      {
        title: 'Open project data',
        description:
          'Open the project and data layer to inspect in the Viewer.',
      },
      {
        title: 'Choose a tool',
        description:
          'Select distance, elevation difference, area, or section based on the inspection task.',
      },
      {
        title: 'Select a position or region',
        description:
          'Mark points, a line, or an area directly on the 3D data.',
      },
      {
        title: 'Read the result',
        description:
          'Review the measurement or section inside the same project workspace.',
      },
    ],

    valueEyebrow: 'IN THE 3D GIS WORKFLOW',
    valueTitle:
      'Preserve data context while checking dimensions and elevation',
    valueBody:
      'Measuring and viewing sections in the same Viewer lets users continue reviewing project data while checking spatial information.',
    values: [
      'Measure directly on the Point Cloud being viewed',
      'Compare 2D distance with 3D distance',
      'Check elevation differences between locations',
      'Draw and read area on the data',
      'Use a section view to inspect structure and elevation',
    ],

    finalEyebrow: 'MEASUREMENT · 3D GIS',
    finalTitle:
      'Explore measurement tools directly on 3D data',
    finalBody:
      'Request Demo access to open sample data and see how distance, area, and section tools are used inside the Viewer.',
    footer:
      'Point Cloud · Measurement · Section · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',
    demoLoading: '正在检查 Demo...',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',

    eyebrow: '平台 · 三维测量与分析',
    heroTitle:
      '直接在项目三维数据上进行测量',
    heroBody:
      'Viewer 支持直接在 Point Cloud 数据上测量二维距离、三维距离和高差，并始终在同一个项目空间背景中查看结果。',
    heroImageAlt:
      'Viewer 中 Point Cloud 数据的二维距离、三维距离和高差测量',
    heroImageCaption:
      '直接在 Point Cloud 数据上测量距离与高差',

    measureEyebrow: '测量工具',
    measureTitle:
      '直接在当前数据上测量距离、高差和面积',
    measureBody:
      '用户可直接在 Viewer 中选择点位或区域，并在同一数据空间中读取结果。',
    measuresTitle: '当前使用的测量操作',
    measures: [
      {
        title: '二维 / 三维距离',
        description:
          '测量所选位置之间的平面距离和空间距离。',
      },
      {
        title: '高差',
        description:
          '检查三维数据上所选点之间的高度差。',
      },
      {
        title: '面积',
        description:
          '直接在数据上绘制区域，并计算需要检查范围的面积。',
      },
    ],
    areaImageAlt:
      'Viewer 中 Point Cloud 数据的面积测量',
    areaImageCaption:
      '直接在 Point Cloud 数据上测量面积',

    analysisEyebrow: '剖面与高程',
    analysisTitle:
      '通过剖面查看形状与高程分布',
    analysisBody:
      'Point Cloud 数据可以剖面方式查看，使用户聚焦选定区域并同时观察其形状和高程变化。',
    analysesTitle: '剖面查看过程中',
    analyses: [
      {
        title: '选择区域',
        description:
          '聚焦相关数据范围，而不是同时查看整个项目。',
      },
      {
        title: '查看剖面',
        description:
          '将所选数据以剖面方式显示，用于检查建筑或地形形状。',
      },
      {
        title: '读取高程',
        description:
          '根据剖面坐标轴和数据的显示方式观察高程变化。',
      },
    ],
    sectionImageAlt:
      'Viewer 中 Point Cloud 数据的剖面和高程视图',
    sectionImageCaption:
      'Point Cloud 剖面 · 形状与高程分布',

    workflowEyebrow: '操作流程',
    workflowTitle:
      '从关注位置到 Viewer 中的测量结果',
    workflowBody:
      '测量流程保留在同一个项目空间中，用户无需切换到独立工具。',
    workflow: [
      {
        title: '打开项目数据',
        description:
          '在 Viewer 中打开需要检查的项目和数据图层。',
      },
      {
        title: '选择工具',
        description:
          '根据检查内容选择距离、高差、面积或剖面工具。',
      },
      {
        title: '选择位置或区域',
        description:
          '直接在三维数据上标记点、线或区域。',
      },
      {
        title: '读取结果',
        description:
          '在同一个项目空间中查看测量结果或剖面。',
      },
    ],

    valueEyebrow: '三维 GIS 工作流程',
    valueTitle:
      '检查尺寸和高程时保持完整的数据背景',
    valueBody:
      '在同一个 Viewer 中进行测量和剖面查看，可以在检查空间信息的同时继续保持项目数据背景。',
    values: [
      '直接在当前 Point Cloud 数据上测量',
      '对比二维距离与三维距离',
      '检查不同位置之间的高差',
      '在数据上绘制并读取面积',
      '通过剖面检查结构与高程',
    ],

    finalEyebrow: 'MEASUREMENT · 3D GIS',
    finalTitle:
      '直接在三维数据上体验测量工具',
    finalBody:
      '申请演示访问，打开示例数据并查看距离、面积和剖面工具如何在 Viewer 中使用。',
    footer:
      'Point Cloud · Measurement · Section · 3D GIS',
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

  if (saved === 'light') return false;
  if (saved === 'dark') return true;

  return true;
};

const MediaFigure: React.FC<{
  src: string;
  alt: string;
  caption: string;
  eager?: boolean;
  hero?: boolean;
}> = ({
  src,
  alt,
  caption,
  eager = false,
  hero = false,
}) => (
  <figure className="min-w-0">
    <div className="maa-image-frame overflow-hidden rounded-xl border border-[var(--maa-border)] bg-black sm:rounded-2xl">
      <img
        src={src}
        alt={alt}
        loading={
          eager ? 'eager' : 'lazy'
        }
        className={
          hero
            ? 'aspect-[16/10] w-full object-cover lg:min-h-[500px] xl:min-h-[570px] 2xl:min-h-[610px]'
            : 'aspect-[16/10] w-full object-cover'
        }
      />
    </div>

    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--maa-muted)]">
      {caption}
    </figcaption>
  </figure>
);

export const MeasurementAnalysis3DPage: React.FC = () => {
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
      navigate('/login', {
        state: {
          returnTo: '/book-demo',
        },
      });
      return;
    }

    navigate('/book-demo');
  };

  const themeLabel =
    isDarkMode
      ? c.switchToLight
      : c.switchToDark;

  return (
    <>
      <style>{`
        .maa-root {
          --maa-bg: #050914;
          --maa-bg-2: #07101c;
          --maa-surface: #0b1523;

          --maa-ink: #f8fafc;
          --maa-muted: #94a3b8;
          --maa-soft: #64748b;

          --maa-border:
            rgba(255,255,255,.09);
          --maa-border-strong:
            rgba(255,255,255,.16);

          --maa-accent: #38bdf8;
          --maa-accent-strong: #0ea5e9;
          --maa-cta-ink: #03111d;

          --maa-header:
            rgba(5,9,20,.88);

          --maa-image-shadow:
            0 26px 80px
            rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .maa-root.maa-light {
          --maa-bg: #f8fafc;
          --maa-bg-2: #eef4f8;
          --maa-surface: #ffffff;

          --maa-ink: #0f172a;
          --maa-muted: #526174;
          --maa-soft: #64748b;

          --maa-border:
            rgba(15,23,42,.11);
          --maa-border-strong:
            rgba(15,23,42,.20);

          --maa-accent: #0369a1;
          --maa-accent-strong: #0284c7;
          --maa-cta-ink: #ffffff;

          --maa-header:
            rgba(248,250,252,.90);

          --maa-image-shadow:
            0 24px 65px
            rgba(15,23,42,.14);

          color-scheme: light;
        }

        .maa-root {
          min-height: 100vh;
          overflow-x: clip;

          background:
            var(--maa-bg);

          color:
            var(--maa-ink);

          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .maa-header {
          background:
            var(--maa-header);
        }

        .maa-focus:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 2px var(--maa-bg),
            0 0 0 4px var(--maa-accent);
        }

        .maa-image-frame {
          box-shadow:
            var(--maa-image-shadow);
        }

        .maa-image-frame img {
          transform: scale(1);

          transition:
            transform .5s
            cubic-bezier(.16,1,.3,1);
        }

        .maa-image-frame:hover img {
          transform: scale(1.01);
        }

        /* Landing-style day / night toggle */

        .maa-theme-toggle {
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

        .maa-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--maa-accent);

          outline-offset: 3px;
        }

        .maa-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .maa-theme-toggle__thumb {
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

        .maa-theme-toggle.is-dark
        .maa-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .maa-theme-toggle__clouds,
        .maa-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .maa-theme-toggle__clouds {
          opacity: 1;

          transition:
            opacity .35s ease;
        }

        .maa-theme-toggle.is-dark
        .maa-theme-toggle__clouds {
          opacity: 0;
        }

        .maa-theme-toggle__cloud {
          position: absolute;

          height: 8px;

          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .maa-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .maa-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .maa-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .maa-theme-toggle__stars {
          opacity: 0;

          transition:
            opacity .35s ease;
        }

        .maa-theme-toggle.is-dark
        .maa-theme-toggle__stars {
          opacity: 1;
        }

        .maa-theme-toggle__star {
          position: absolute;

          border-radius: 50%;

          background: #fff;

          animation:
            maa-star-pulse
            2s infinite ease-in-out;
        }

        .maa-theme-toggle__star-1 {
          top: 7px;
          left: 13px;

          width: 2px;
          height: 2px;
        }

        .maa-theme-toggle__star-2 {
          top: 17px;
          left: 27px;

          width: 2px;
          height: 2px;

          animation-delay: .5s;
        }

        .maa-theme-toggle__star-3 {
          top: 8px;
          left: 37px;

          width: 2px;
          height: 2px;

          animation-delay: 1s;
        }

        @keyframes maa-star-pulse {
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
          .maa-root *,
          .maa-root *::before,
          .maa-root *::after {
            scroll-behavior:
              auto !important;
            animation-duration:
              .01ms !important;
            animation-iteration-count:
              1 !important;
            transition-duration:
              .01ms !important;
          }

          .maa-image-frame:hover img {
            transform: none;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`maa-root ${
          isDarkMode
            ? ''
            : 'maa-light'
        }`}
      >
        <header className="maa-header sticky top-0 z-50 border-b border-[var(--maa-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="maa-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`maa-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="maa-theme-toggle__clouds">
                  <div className="maa-theme-toggle__cloud maa-theme-toggle__cloud-1" />
                  <div className="maa-theme-toggle__cloud maa-theme-toggle__cloud-2" />
                  <div className="maa-theme-toggle__cloud maa-theme-toggle__cloud-3" />
                </div>

                <div className="maa-theme-toggle__stars">
                  <div className="maa-theme-toggle__star maa-theme-toggle__star-1" />
                  <div className="maa-theme-toggle__star maa-theme-toggle__star-2" />
                  <div className="maa-theme-toggle__star maa-theme-toggle__star-3" />
                </div>

                <div className="maa-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="maa-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--maa-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--maa-muted)] transition-colors hover:border-[var(--maa-border-strong)] hover:text-[var(--maa-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={demo}
                disabled={isLoading}
                className="maa-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--maa-accent)] px-3.5 text-sm font-bold text-[var(--maa-cta-ink)] transition-colors hover:bg-[var(--maa-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isLoading
                    ? c.demoLoading
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
          <section className="flex min-h-[calc(100svh-68px)] items-center border-b border-[var(--maa-border)] bg-[var(--maa-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-10 sm:px-8 md:py-12 lg:px-10 lg:py-14 xl:px-12 xl:py-16">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-12 xl:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[12ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px] 2xl:text-[70px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--maa-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="maa-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--maa-accent)] px-6 text-sm font-bold text-[var(--maa-cta-ink)] transition-colors hover:bg-[var(--maa-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        {c.demoLoading}
                      </>
                    ) : (
                      <>
                        {c.demo}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                <MediaFigure
                  src={measurementDistanceImage}
                  alt={c.heroImageAlt}
                  caption={c.heroImageCaption}
                  eager
                  hero
                />
              </div>
            </div>
          </section>

          {/* MEASUREMENT TOOLS */}
          <section className="border-b border-[var(--maa-border)] bg-[var(--maa-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,.58fr)_minmax(0,.42fr)] lg:items-center lg:gap-16">
                <MediaFigure
                  src={measurementAreaImage}
                  alt={c.areaImageAlt}
                  caption={c.areaImageCaption}
                />

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                    {c.measureEyebrow}
                  </div>

                  <h2 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px]">
                    {c.measureTitle}
                  </h2>

                  <p className="mt-5 text-base leading-7 text-[var(--maa-muted)]">
                    {c.measureBody}
                  </p>

                  <h3 className="mt-9 text-sm font-semibold">
                    {c.measuresTitle}
                  </h3>

                  <div className="mt-4 border-y border-[var(--maa-border)]">
                    {c.measures.map((item) => (
                      <article
                        key={item.title}
                        className="border-b border-[var(--maa-border)] py-5 last:border-b-0"
                      >
                        <h4 className="text-base font-semibold">
                          {item.title}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-[var(--maa-muted)]">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION / ELEVATION */}
          <section className="border-b border-[var(--maa-border)] bg-[var(--maa-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                    {c.analysisEyebrow}
                  </div>

                  <h2 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px]">
                    {c.analysisTitle}
                  </h2>

                  <p className="mt-5 text-base leading-7 text-[var(--maa-muted)]">
                    {c.analysisBody}
                  </p>

                  <h3 className="mt-9 text-sm font-semibold">
                    {c.analysesTitle}
                  </h3>

                  <div className="mt-4 border-y border-[var(--maa-border)]">
                    {c.analyses.map((item) => (
                      <article
                        key={item.title}
                        className="border-b border-[var(--maa-border)] py-5 last:border-b-0"
                      >
                        <h4 className="text-base font-semibold">
                          {item.title}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-[var(--maa-muted)]">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <MediaFigure
                  src={analysisSectionImage}
                  alt={c.sectionImageAlt}
                  caption={c.sectionImageCaption}
                />
              </div>
            </div>
          </section>

          {/* WORKFLOW */}
          <section className="border-b border-[var(--maa-border)] bg-[var(--maa-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="max-w-[920px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                  {c.workflowEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.workflowTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--maa-muted)]">
                  {c.workflowBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--maa-border)] lg:grid-cols-4">
                {c.workflow.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--maa-border)] py-6 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                  >
                    <h3 className="text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--maa-muted)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* VALUE */}
          <section className="border-b border-[var(--maa-border)] bg-[var(--maa-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16 xl:gap-20">
                <div className="lg:self-start">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--maa-muted)]">
                    {c.valueBody}
                  </p>
                </div>

                <div className="border-y border-[var(--maa-border)]">
                  {c.values.map((value) => (
                    <div
                      key={value}
                      className="border-b border-[var(--maa-border)] py-5 last:border-b-0 sm:py-6"
                    >
                      <p className="max-w-[760px] text-[15px] leading-7 text-[var(--maa-muted)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--maa-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-18 xl:px-12">
              <div className="border-y border-[var(--maa-border)] py-9 sm:py-11">
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--maa-accent)]">
                      {c.finalEyebrow}
                    </div>

                    <h2 className="mt-3 max-w-[25ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[34px]">
                      {c.finalTitle}
                    </h2>

                    <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--maa-muted)]">
                      {c.finalBody}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="maa-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--maa-accent)] px-6 text-sm font-bold text-[var(--maa-cta-ink)] transition-colors hover:bg-[var(--maa-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        {c.demoLoading}
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

        <footer className="border-t border-[var(--maa-border)] bg-[var(--maa-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--maa-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default MeasurementAnalysis3DPage;