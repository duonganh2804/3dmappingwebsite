import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import pointCloudHeroImage from '../assets/point-cloud-lidar-hero.png';
import pointCloudOverviewImage from '../assets/point-cloud-lidar-overview.png';
import pointCloudTopViewImage from '../assets/point-cloud-lidar-topview.png';

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
  heroCaption: string;
  heroAlt: string;

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flow: Item[];

  contextEyebrow: string;
  contextTitle: string;
  contextBody: string;
  overviewCaption: string;
  overviewAlt: string;
  layersTitle: string;
  layers: Item[];

  capEyebrow: string;
  capTitle: string;
  capBody: string;
  topViewCaption: string;
  topViewAlt: string;
  capsTitle: string;
  caps: Item[];

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

    eyebrow: 'NỀN TẢNG · POINT CLOUD & LiDAR',
    heroTitle:
      'Quan sát dữ liệu Point Cloud trong không gian 3D',
    heroBody:
      'Đưa dữ liệu Point Cloud của project vào môi trường Web GIS để quan sát cấu trúc không gian, thay đổi góc nhìn và kiểm tra khu vực trực tiếp trên trình duyệt.',
    heroCaption:
      'Point Cloud trong góc nhìn phối cảnh 3D của Viewer',
    heroAlt:
      'Góc nhìn phối cảnh dữ liệu Point Cloud của khu vực khảo sát trong Viewer',

    flowEyebrow: 'DÒNG DỮ LIỆU',
    flowTitle:
      'Từ dữ liệu LiDAR đến Point Cloud trong Viewer',
    flowBody:
      'Dữ liệu LiDAR sau xử lý có thể được tổ chức thành Point Cloud và đưa vào project để quan sát trong môi trường Web GIS.',
    flow: [
      {
        title: 'LiDAR',
        description:
          'Nguồn dữ liệu khảo sát phục vụ tạo dữ liệu điểm ba chiều của khu vực.',
      },
      {
        title: 'Point Cloud',
        description:
          'Tập hợp điểm 3D biểu diễn hình học và vị trí của bề mặt hoặc đối tượng trong khu vực khảo sát.',
      },
      {
        title: 'Project Web GIS',
        description:
          'Point Cloud được tổ chức trong project cùng các lớp dữ liệu khác khi project có dữ liệu tương ứng.',
      },
      {
        title: 'Quan sát 3D',
        description:
          'Người dùng thay đổi vị trí camera, xoay, pan và zoom để kiểm tra dữ liệu từ các góc nhìn khác nhau.',
      },
    ],

    contextEyebrow: 'BỐI CẢNH PROJECT',
    contextTitle:
      'Quan sát toàn bộ Point Cloud trước khi tập trung vào khu vực cần kiểm tra',
    contextBody:
      'Góc nhìn tổng quan giúp người dùng nhận biết phạm vi dữ liệu và bố cục không gian trước khi chuyển tới vị trí cần xem chi tiết.',
    overviewCaption:
      'Góc nhìn tổng quan của dữ liệu Point Cloud trong project',
    overviewAlt:
      'Góc nhìn tổng quan dữ liệu Point Cloud của khu vực dự án trong Viewer',
    layersTitle: 'Các lớp dữ liệu có thể được đối chiếu',
    layers: [
      {
        title: 'Point Cloud',
        description:
          'Lớp dữ liệu điểm 3D dùng để quan sát cấu trúc không gian của khu vực.',
      },
      {
        title: '3D Mesh',
        description:
          'Khi project có dữ liệu Mesh, người dùng có thể chuyển sang mô hình bề mặt để đối chiếu hình dạng.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'Khi project có ảnh trực giao, người dùng có thể đối chiếu vị trí và bố cục khu vực theo góc nhìn trên xuống.',
      },
    ],

    capEyebrow: 'KHẢ NĂNG QUAN SÁT',
    capTitle:
      'Kiểm tra cùng dữ liệu từ nhiều góc nhìn',
    capBody:
      'Viewer cho phép thay đổi góc camera và lớp dữ liệu đang hiển thị trong khi vẫn giữ bối cảnh của cùng một project.',
    topViewCaption:
      'Góc nhìn trên xuống của cùng dữ liệu Point Cloud',
    topViewAlt:
      'Góc nhìn từ trên xuống của dữ liệu Point Cloud trong Viewer',
    capsTitle: 'Trong quá trình quan sát',
    caps: [
      {
        title: 'Quan sát Point Cloud',
        description:
          'Xem cấu trúc điểm 3D của khu vực trực tiếp trong Viewer.',
      },
      {
        title: 'Điều hướng không gian',
        description:
          'Thay đổi vị trí và góc nhìn để kiểm tra khu vực từ các hướng khác nhau.',
      },
      {
        title: 'Chuyển lớp dữ liệu',
        description:
          'Chuyển giữa các lớp có trong project khi cần đối chiếu Point Cloud với dữ liệu khác.',
      },
      {
        title: 'Tập trung khu vực',
        description:
          'Di chuyển tới vị trí cần quan sát và giữ góc nhìn phù hợp cho việc kiểm tra.',
      },
    ],

    valueEyebrow: 'TRONG WORKFLOW PROJECT',
    valueTitle:
      'Point Cloud là một phần của bối cảnh dữ liệu 3D',
    valueBody:
      'Việc quan sát Point Cloud trong cùng project giúp người dùng duy trì bối cảnh không gian khi thay đổi góc nhìn hoặc đối chiếu với lớp dữ liệu khác.',
    values: [
      'Quan sát cấu trúc không gian của khu vực khảo sát',
      'Kiểm tra cùng khu vực từ nhiều góc nhìn',
      'Tập trung nhanh vào vị trí cần quan sát',
      'Đối chiếu với lớp dữ liệu khác khi project có dữ liệu tương ứng',
      'Truy cập Viewer trực tiếp trên trình duyệt',
    ],

    finalEyebrow: 'POINT CLOUD · 3D GIS',
    finalTitle:
      'Trải nghiệm dữ liệu Point Cloud trực tiếp trong Viewer',
    finalBody:
      'Đăng ký Demo để mở dữ liệu mẫu và xem cách Point Cloud được quan sát, điều hướng và đối chiếu trong một project 3D GIS.',
    footer:
      'LiDAR · Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',
    demoLoading: 'Checking Demo...',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    eyebrow: 'PLATFORM · POINT CLOUD & LiDAR',
    heroTitle:
      'Review Point Cloud data in a 3D workspace',
    heroBody:
      'Bring project Point Cloud data into a Web GIS workspace to review spatial structure, change the viewing angle, and inspect an area directly in the browser.',
    heroCaption:
      'Point Cloud in a 3D perspective view inside the Viewer',
    heroAlt:
      'Perspective view of Point Cloud survey data inside the Viewer',

    flowEyebrow: 'DATA FLOW',
    flowTitle:
      'From LiDAR data to Point Cloud in the Viewer',
    flowBody:
      'Processed LiDAR data can be organized as Point Cloud data and added to a project for browser-based inspection in the Web GIS environment.',
    flow: [
      {
        title: 'LiDAR',
        description:
          'Survey data source used to produce three-dimensional point data for the area.',
      },
      {
        title: 'Point Cloud',
        description:
          'A collection of 3D points representing the geometry and position of surfaces or objects in the surveyed area.',
      },
      {
        title: 'Web GIS project',
        description:
          'Point Cloud data is organized inside a project together with other layers when those datasets are available.',
      },
      {
        title: '3D viewing',
        description:
          'Users change camera position, rotate, pan, and zoom to inspect the data from different viewpoints.',
      },
    ],

    contextEyebrow: 'PROJECT CONTEXT',
    contextTitle:
      'Review the full Point Cloud before focusing on an area of interest',
    contextBody:
      'An overview helps users understand the data extent and spatial layout before moving to a location that requires closer inspection.',
    overviewCaption:
      'Overview of Point Cloud data inside the project',
    overviewAlt:
      'Overview of project Point Cloud data inside the Viewer',
    layersTitle: 'Data layers that can be compared',
    layers: [
      {
        title: 'Point Cloud',
        description:
          'The 3D point layer used to review the spatial structure of the area.',
      },
      {
        title: '3D Mesh',
        description:
          'When Mesh data is available in the project, users can switch to the surface model to compare shape.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'When orthographic imagery is available, users can compare locations and site layout from a top-down view.',
      },
    ],

    capEyebrow: 'VIEWING CAPABILITIES',
    capTitle:
      'Inspect the same data from multiple viewpoints',
    capBody:
      'The Viewer allows users to change the camera angle and visible data layer while keeping the context of the same project.',
    topViewCaption:
      'Top-down view of the same Point Cloud data',
    topViewAlt:
      'Top-down view of Point Cloud data inside the Viewer',
    capsTitle: 'During inspection',
    caps: [
      {
        title: 'View Point Cloud',
        description:
          'Review the three-dimensional point structure of the area directly in the Viewer.',
      },
      {
        title: 'Navigate in 3D',
        description:
          'Change position and viewing angle to inspect the area from different directions.',
      },
      {
        title: 'Switch data layers',
        description:
          'Move between layers available in the project when comparing Point Cloud with other data.',
      },
      {
        title: 'Focus on an area',
        description:
          'Move to a location of interest and keep a useful viewpoint for inspection.',
      },
    ],

    valueEyebrow: 'IN THE PROJECT WORKFLOW',
    valueTitle:
      'Point Cloud remains part of the wider 3D project context',
    valueBody:
      'Reviewing Point Cloud inside the same project helps users preserve spatial context while changing viewpoints or comparing available data layers.',
    values: [
      'Review the spatial structure of the surveyed area',
      'Inspect the same area from multiple viewpoints',
      'Move quickly to a location of interest',
      'Compare with other layers when corresponding project data is available',
      'Access the Viewer directly in the browser',
    ],

    finalEyebrow: 'POINT CLOUD · 3D GIS',
    finalTitle:
      'Explore Point Cloud data directly in the Viewer',
    finalBody:
      'Request Demo access to open sample data and see how Point Cloud is viewed, navigated, and compared inside a 3D GIS project.',
    footer:
      'LiDAR · Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',
    demoLoading: '正在检查 Demo...',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',

    eyebrow: '平台 · POINT CLOUD & LiDAR',
    heroTitle:
      '在三维空间中查看 Point Cloud 数据',
    heroBody:
      '将项目 Point Cloud 数据放入 Web GIS 空间中，直接在浏览器内查看空间结构、切换视角并检查目标区域。',
    heroCaption:
      'Viewer 中 Point Cloud 的三维透视视角',
    heroAlt:
      'Viewer 中测区 Point Cloud 数据的三维透视视图',

    flowEyebrow: '数据流程',
    flowTitle:
      '从 LiDAR 数据到 Viewer 中的 Point Cloud',
    flowBody:
      '经过处理的 LiDAR 数据可组织为 Point Cloud，并加入项目，在 Web GIS 环境中通过浏览器进行查看。',
    flow: [
      {
        title: 'LiDAR',
        description:
          '用于生成测区三维点数据的测绘数据来源。',
      },
      {
        title: 'Point Cloud',
        description:
          '由三维点构成，用于表示测区表面或对象的几何形态与位置。',
      },
      {
        title: 'Web GIS 项目',
        description:
          'Point Cloud 可与项目中已有的其他数据图层一起组织和查看。',
      },
      {
        title: '三维查看',
        description:
          '用户可以改变相机位置，并通过旋转、平移和缩放从不同视角检查数据。',
      },
    ],

    contextEyebrow: '项目背景',
    contextTitle:
      '先查看完整 Point Cloud，再聚焦需要检查的区域',
    contextBody:
      '整体视角有助于了解数据范围和空间布局，然后再移动到需要进一步检查的位置。',
    overviewCaption:
      '项目中 Point Cloud 数据的整体视图',
    overviewAlt:
      'Viewer 中项目 Point Cloud 数据的整体视图',
    layersTitle: '可用于对照的数据图层',
    layers: [
      {
        title: 'Point Cloud',
        description:
          '用于查看区域空间结构的三维点数据图层。',
      },
      {
        title: '3D Mesh',
        description:
          '当项目具备 Mesh 数据时，可切换到表面模型进行形态对照。',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          '当项目具备正射影像时，可从俯视角度对照位置与区域布局。',
      },
    ],

    capEyebrow: '查看能力',
    capTitle:
      '从多个视角检查同一份数据',
    capBody:
      'Viewer 支持改变相机角度和当前显示的数据图层，同时保持在同一个项目空间背景中。',
    topViewCaption:
      '同一 Point Cloud 数据的俯视视角',
    topViewAlt:
      'Viewer 中 Point Cloud 数据的俯视图',
    capsTitle: '查看过程中',
    caps: [
      {
        title: '查看 Point Cloud',
        description:
          '直接在 Viewer 中查看区域的三维点结构。',
      },
      {
        title: '三维导航',
        description:
          '改变位置和视角，从不同方向检查区域。',
      },
      {
        title: '切换数据图层',
        description:
          '在项目已有的数据图层之间切换，用于与 Point Cloud 进行对照。',
      },
      {
        title: '聚焦目标区域',
        description:
          '移动到关注位置，并保持适合检查的视角。',
      },
    ],

    valueEyebrow: '项目工作流程',
    valueTitle:
      'Point Cloud 是项目三维数据背景的一部分',
    valueBody:
      '在同一个项目中查看 Point Cloud，有助于在切换视角或对照其他数据图层时保持空间背景。',
    values: [
      '查看测区的空间结构',
      '从多个视角检查同一区域',
      '快速移动到关注位置',
      '当项目具备相应数据时与其他图层进行对照',
      '直接在浏览器中访问 Viewer',
    ],

    finalEyebrow: 'POINT CLOUD · 3D GIS',
    finalTitle:
      '直接在 Viewer 中体验 Point Cloud 数据',
    finalBody:
      '申请演示访问，打开示例数据并查看 Point Cloud 如何在三维 GIS 项目中进行查看、导航与对照。',
    footer:
      'LiDAR · Point Cloud · 3D Mesh · Orthophoto / DOM · 3D GIS',
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

export const PointCloudLidarPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
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

  return (
    <>
      <style>{`
        .pcl-root {
          --pcl-bg: #050914;
          --pcl-bg-2: #07101c;
          --pcl-surface: #0b1523;
          --pcl-ink: #f8fafc;
          --pcl-muted: #94a3b8;
          --pcl-soft: #64748b;
          --pcl-border: rgba(255,255,255,.09);
          --pcl-border-strong: rgba(255,255,255,.16);
          --pcl-accent: #38bdf8;
          --pcl-accent-strong: #0ea5e9;
          --pcl-cta-ink: #03111d;
          --pcl-image-shadow: 0 28px 80px rgba(0,0,0,.34);
          color-scheme: dark;
        }

        .pcl-root.pcl-light {
          --pcl-bg: #f8fafc;
          --pcl-bg-2: #eef4f8;
          --pcl-surface: #ffffff;
          --pcl-ink: #0f172a;
          --pcl-muted: #526174;
          --pcl-soft: #64748b;
          --pcl-border: rgba(15,23,42,.11);
          --pcl-border-strong: rgba(15,23,42,.20);
          --pcl-accent: #0369a1;
          --pcl-accent-strong: #0284c7;
          --pcl-cta-ink: #ffffff;
          --pcl-image-shadow: 0 24px 65px rgba(15,23,42,.14);
          color-scheme: light;
        }

        .pcl-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--pcl-bg);
          color: var(--pcl-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .pcl-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--pcl-bg),
            0 0 0 4px var(--pcl-accent);
        }

        .pcl-media {
          overflow: hidden;
          border: 1px solid var(--pcl-border);
          border-radius: 18px;
          background: #000;
          box-shadow: var(--pcl-image-shadow);
        }

        .pcl-media img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pcl-hero {
          border-bottom:
            1px solid var(--pcl-border);
          background:
            var(--pcl-bg);
        }

        .pcl-hero__inner {
          display: flex;
          min-height:
            calc(100svh - 68px);
          align-items: center;
        }

        .pcl-hero__grid {
          display: grid;
          width: 100%;
          grid-template-columns:
            minmax(420px,.78fr)
            minmax(0,1.22fr);
          gap: 64px;
          align-items: center;
        }

        .pcl-hero__content {
          min-width: 0;
        }

        .pcl-hero__figure {
          min-width: 0;
        }

        .pcl-hero__figure-frame {
          overflow: hidden;
          border:
            1px solid var(--pcl-border);
          border-radius: 18px;
          background: #000;
          box-shadow:
            var(--pcl-image-shadow);
        }

        .pcl-hero__figure-frame img {
          display: block;
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          object-position: center;
        }

        .pcl-hero__caption {
          margin-top: 14px;
          color: var(--pcl-muted);
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }

        .pcl-flow {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          border-top: 1px solid var(--pcl-border);
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-flow__item {
          position: relative;
          min-height: 190px;
          padding: 28px 28px 26px;
          border-right: 1px solid var(--pcl-border);
        }

        .pcl-flow__item:first-child {
          padding-left: 0;
        }

        .pcl-flow__item:last-child {
          padding-right: 0;
          border-right: 0;
        }

        .pcl-flow__item:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 33px;
          right: -4px;
          width: 7px;
          height: 7px;
          border-top: 1px solid var(--pcl-accent);
          border-right: 1px solid var(--pcl-accent);
          transform: rotate(45deg);
          background: var(--pcl-bg-2);
        }

        .pcl-dossier {
          display: grid;
          grid-template-columns: minmax(0,.31fr) minmax(0,.69fr);
          gap: 56px;
          align-items: start;
        }

        .pcl-dossier__aside {
          position: sticky;
          top: 96px;
        }

        .pcl-layer-table {
          border-top: 1px solid var(--pcl-border);
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-layer-row {
          display: grid;
          grid-template-columns: 190px minmax(0,1fr);
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-layer-row:last-child {
          border-bottom: 0;
        }

        .pcl-layer-row__name {
          padding: 19px 24px 19px 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--pcl-ink);
        }

        .pcl-layer-row__desc {
          padding: 19px 0 19px 24px;
          border-left: 1px solid var(--pcl-border);
          color: var(--pcl-muted);
          font-size: 14px;
          line-height: 1.75;
        }

        .pcl-view-layout {
          display: grid;
          grid-template-columns: minmax(0,.62fr) minmax(0,.38fr);
          gap: 56px;
          align-items: center;
        }

        .pcl-cap-list {
          border-top: 1px solid var(--pcl-border);
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-cap-row {
          padding: 18px 0;
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-cap-row:last-child {
          border-bottom: 0;
        }

        .pcl-value-grid {
          display: grid;
          grid-template-columns: repeat(5,minmax(0,1fr));
          border-top: 1px solid var(--pcl-border);
          border-bottom: 1px solid var(--pcl-border);
        }

        .pcl-value-grid__item {
          min-height: 130px;
          padding: 22px 24px;
          border-right: 1px solid var(--pcl-border);
          color: var(--pcl-muted);
          font-size: 14px;
          line-height: 1.72;
        }

        .pcl-value-grid__item:first-child {
          padding-left: 0;
        }

        .pcl-value-grid__item:last-child {
          padding-right: 0;
          border-right: 0;
        }

        @media (max-width: 1100px) {
          .pcl-dossier,
          .pcl-view-layout {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .pcl-dossier__aside {
            position: static;
          }

          .pcl-flow {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .pcl-flow__item:nth-child(2) {
            border-right: 0;
          }

          .pcl-flow__item:nth-child(-n+2) {
            border-bottom: 1px solid var(--pcl-border);
          }

          .pcl-flow__item:nth-child(2)::after {
            display: none;
          }

          .pcl-value-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .pcl-value-grid__item {
            border-bottom: 1px solid var(--pcl-border);
          }

          .pcl-value-grid__item:nth-child(2n) {
            border-right: 0;
          }

          .pcl-value-grid__item:last-child {
            grid-column: 1 / -1;
            border-bottom: 0;
          }
        }

        @media (max-width: 760px) {
          .pcl-hero__grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .pcl-flow,
          .pcl-value-grid {
            grid-template-columns: 1fr;
          }

          .pcl-flow__item,
          .pcl-flow__item:first-child,
          .pcl-flow__item:last-child {
            min-height: 0;
            padding: 22px 0;
            border-right: 0;
            border-bottom: 1px solid var(--pcl-border);
          }

          .pcl-flow__item::after {
            display: none;
          }

          .pcl-flow__item:last-child {
            border-bottom: 0;
          }

          .pcl-layer-row {
            grid-template-columns: 1fr;
          }

          .pcl-layer-row__name {
            padding: 16px 0 6px;
          }

          .pcl-layer-row__desc {
            padding: 0 0 16px;
            border-left: 0;
          }

          .pcl-value-grid__item,
          .pcl-value-grid__item:first-child,
          .pcl-value-grid__item:last-child {
            grid-column: auto;
            min-height: 0;
            padding: 18px 0;
            border-right: 0;
            border-bottom: 1px solid var(--pcl-border);
          }

          .pcl-value-grid__item:last-child {
            border-bottom: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pcl-root *,
          .pcl-root *::before,
          .pcl-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`pcl-root ${
          isDarkMode
            ? ''
            : 'pcl-light'
        }`}
      >
        <main>
          <section className="pcl-hero">
            <div className="pcl-hero__inner mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="pcl-hero__grid">
                <div className="pcl-hero__content">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[12ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px] 2xl:text-[70px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--pcl-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="pcl-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--pcl-accent)] px-6 text-sm font-bold text-[var(--pcl-cta-ink)] transition-colors hover:bg-[var(--pcl-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

                <figure className="pcl-hero__figure">
                  <div className="pcl-hero__figure-frame">
                    <img
                      src={pointCloudHeroImage}
                      alt={c.heroAlt}
                      loading="eager"
                    />
                  </div>

                  <figcaption className="pcl-hero__caption">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          <section className="border-b border-[var(--pcl-border)] bg-[var(--pcl-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.flowEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.flowTitle}
                  </h2>
                </div>

                <p className="max-w-[680px] text-base leading-7 text-[var(--pcl-muted)] lg:justify-self-end">
                  {c.flowBody}
                </p>
              </div>

              <div className="pcl-flow mt-10">
                {c.flow.map((item) => (
                  <article
                    key={item.title}
                    className="pcl-flow__item"
                  >
                    <h3 className="text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[var(--pcl-muted)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-[var(--pcl-border)] bg-[var(--pcl-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="pcl-dossier">
                <aside className="pcl-dossier__aside">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.contextEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[20ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.contextTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--pcl-muted)]">
                    {c.contextBody}
                  </p>
                </aside>

                <div>
                  <figure>
                    <div className="pcl-media aspect-[16/9]">
                      <img
                        src={pointCloudOverviewImage}
                        alt={c.overviewAlt}
                        loading="lazy"
                      />
                    </div>

                    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--pcl-muted)]">
                      {c.overviewCaption}
                    </figcaption>
                  </figure>

                  <div className="mt-10">
                    <h3 className="text-sm font-semibold">
                      {c.layersTitle}
                    </h3>

                    <div className="pcl-layer-table mt-4">
                      {c.layers.map((item) => (
                        <div
                          key={item.title}
                          className="pcl-layer-row"
                        >
                          <div className="pcl-layer-row__name">
                            {item.title}
                          </div>

                          <div className="pcl-layer-row__desc">
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[var(--pcl-border)] bg-[var(--pcl-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="pcl-view-layout">
                <figure>
                  <div className="pcl-media aspect-[16/10]">
                    <img
                      src={pointCloudTopViewImage}
                      alt={c.topViewAlt}
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--pcl-muted)]">
                    {c.topViewCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.capEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.capTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--pcl-muted)]">
                    {c.capBody}
                  </p>

                  <h3 className="mt-9 text-sm font-semibold">
                    {c.capsTitle}
                  </h3>

                  <div className="pcl-cap-list mt-4">
                    {c.caps.map((item) => (
                      <article
                        key={item.title}
                        className="pcl-cap-row"
                      >
                        <h4 className="text-base font-semibold">
                          {item.title}
                        </h4>

                        <p className="mt-2 text-sm leading-7 text-[var(--pcl-muted)]">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[var(--pcl-border)] bg-[var(--pcl-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>
                </div>

                <p className="max-w-[720px] text-base leading-7 text-[var(--pcl-muted)] lg:justify-self-end">
                  {c.valueBody}
                </p>
              </div>

              <div className="pcl-value-grid mt-10">
                {c.values.map((value) => (
                  <div
                    key={value}
                    className="pcl-value-grid__item"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[var(--pcl-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--pcl-border)] py-9 lg:grid-cols-[minmax(0,.62fr)_minmax(300px,.38fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--pcl-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--pcl-muted)]">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="pcl-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--pcl-accent)] px-6 text-sm font-bold text-[var(--pcl-cta-ink)] transition-colors hover:bg-[var(--pcl-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        <footer className="border-t border-[var(--pcl-border)] bg-[var(--pcl-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--pcl-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default PointCloudLidarPage;