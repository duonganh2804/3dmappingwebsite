import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import constructionHeroImage from '../assets/construction-hero.png';
import constructionOverviewImage from '../assets/construction-overview.png';
import constructionMeasurementImage from '../assets/construction-measurement.png';

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
  projectOverview: string;
  mapping3D: string;
  siteContext: string;
  heroCaption: string;

  contextEyebrow: string;
  contextTitle: string;
  contextBody: string;
  contexts: [CardItem, CardItem, CardItem];

  dataEyebrow: string;
  dataTitle: string;
  dataBody: string;
  projectData: string;
  overviewCaption: string;
  dataItems: [CardItem, CardItem, CardItem];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measurementLabel: string;
  measurementCaption: string;
  measureItems: [CardItem, CardItem, CardItem];

  collaborationEyebrow: string;
  collaborationTitle: string;
  collaborationBody: string;
  valueItems: [string, string, string, string, string];
  workflowItems: [CardItem, CardItem, CardItem, CardItem];

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

    eyebrow: 'GIẢI PHÁP XÂY DỰNG & HẠ TẦNG',
    heroTitle1: 'Kiểm tra hiện trạng công trình trong một không gian',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Tập trung DOM, mô hình 3D và Point Cloud của công trình để quan sát hiện trạng, đo đạc khu vực và phối hợp dữ liệu dự án trực tiếp trên trình duyệt.',
    heroTags: ['Xây dựng', 'Hạ tầng', 'Khu công nghiệp'],
    projectOverview: 'TỔNG QUAN DỰ ÁN',
    mapping3D: '3D MAPPING',
    siteContext: 'BỐI CẢNH CÔNG TRÌNH',
    heroCaption:
      'Quan sát tổng thể công trình và hạ tầng trong cùng một project 3D',

    contextEyebrow: 'BỐI CẢNH DỰ ÁN',
    contextTitle: 'Một workflow dữ liệu cho nhiều loại công trình và hạ tầng',
    contextBody:
      'Dữ liệu khảo sát được tổ chức theo project để hỗ trợ quan sát và trao đổi trong từng bối cảnh triển khai thực tế.',
    contexts: [
      {
        title: 'Công trình xây dựng',
        body: 'Quan sát tổng thể khu vực thi công, kiểm tra cấu trúc và các vị trí cần trao đổi trên dữ liệu 3D.',
      },
      {
        title: 'Hạ tầng & tuyến',
        body: 'Theo dõi mặt bằng dọc tuyến, đối chiếu vị trí và kiểm tra các khoảng cách quan trọng trong cùng project.',
      },
      {
        title: 'Nhà máy & khu công nghiệp',
        body: 'Tập trung dữ liệu khảo sát của khu vực nhà máy để các bên cùng xem, đo đạc và phối hợp trên một nguồn thông tin.',
      },
    ],

    dataEyebrow: 'DỮ LIỆU PHỤC VỤ KIỂM TRA',
    dataTitle: 'Chuyển giữa các lớp dữ liệu tùy nội dung cần quan sát',
    dataBody:
      'DOM, 3D Mesh và Point Cloud cung cấp các góc nhìn khác nhau nhưng vẫn giữ chung bối cảnh không gian của dự án.',
    projectData: 'DỮ LIỆU DỰ ÁN',
    overviewCaption: 'Góc nhìn phối cảnh của dữ liệu hiện trạng trong cùng Viewer',
    dataItems: [
      {
        title: 'Ảnh trực giao DOM',
        body: 'Quan sát mặt bằng tổng thể và phạm vi công trình theo góc nhìn từ trên xuống.',
      },
      {
        title: 'Mô hình 3D Mesh',
        body: 'Quan sát hình dạng, bề mặt và cấu trúc công trình theo góc nhìn phối cảnh.',
      },
      {
        title: 'Point Cloud',
        body: 'Kiểm tra dữ liệu điểm 3D chi tiết tại những khu vực cần đánh giá kỹ hơn.',
      },
    ],

    measureEyebrow: 'KIỂM TRA & ĐO ĐẠC',
    measureTitle: 'Kiểm tra thông tin không gian ngay trên hiện trạng công trình',
    measureBody:
      'Các phép đo trực tiếp trên Viewer hỗ trợ trao đổi nhanh hơn khi cần kiểm tra khoảng cách, phạm vi hoặc vị trí trong khu vực dự án.',
    measurementLabel: 'MEASUREMENT',
    measurementCaption: 'Đo khoảng cách trực tiếp trên dữ liệu hiện trạng 3D',
    measureItems: [
      {
        title: 'Khoảng cách',
        body: 'Đo khoảng cách giữa các vị trí trên dữ liệu 3D.',
      },
      {
        title: 'Diện tích',
        body: 'Khoanh vùng và xác định diện tích khu vực cần kiểm tra.',
      },
      {
        title: 'Đối chiếu vị trí',
        body: 'Tập trung camera vào vị trí cần trao đổi và giữ đúng bối cảnh dự án.',
      },
    ],

    collaborationEyebrow: 'PHỐI HỢP DỰ ÁN',
    collaborationTitle: 'Một nguồn dữ liệu chung cho các bên liên quan',
    collaborationBody:
      'Project Web GIS giúp các bên cùng quan sát một nguồn dữ liệu và thực hiện các thao tác kiểm tra trong cùng bối cảnh.',
    valueItems: [
      'Tập trung dữ liệu hiện trạng trong cùng một project',
      'Quan sát trực tiếp trên trình duyệt',
      'Chuyển nhanh giữa mặt bằng tổng thể và dữ liệu 3D chi tiết',
      'Đo đạc ngay trên dữ liệu đang hiển thị',
      'Các bên cùng quan sát một nguồn dữ liệu project',
    ],
    workflowItems: [
      {
        title: 'Mở project',
        body: 'Truy cập dữ liệu đã được tổ chức theo đúng phạm vi dự án.',
      },
      {
        title: 'Chọn lớp dữ liệu',
        body: 'Chuyển giữa DOM, 3D Mesh và Point Cloud tùy nội dung cần kiểm tra.',
      },
      {
        title: 'Quan sát & đo đạc',
        body: 'Kiểm tra hiện trạng, đo khoảng cách, diện tích và các thông tin không gian cần thiết.',
      },
      {
        title: 'Chia sẻ',
        body: 'Chia sẻ project theo phạm vi truy cập đã được thiết lập trong hệ thống.',
      },
    ],

    finalEyebrow: 'CONSTRUCTION · INFRASTRUCTURE · 3D GIS',
    finalTitle:
      'Trải nghiệm cách dữ liệu hiện trạng công trình được tổ chức trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem trực tiếp dữ liệu 3D, các lớp thông tin và công cụ đo trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'Xây dựng · Hạ tầng · 3D Mapping',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    platformLink: 'View 3D GIS platform',

    eyebrow: 'CONSTRUCTION & INFRASTRUCTURE SOLUTION',
    heroTitle1: 'Inspect site conditions inside a',
    heroTitle2: '3D Web GIS workspace',
    heroBody:
      'Bring orthophotos, 3D models and Point Cloud data into one project to inspect current conditions, measure site information and coordinate project data directly in the browser.',
    heroTags: ['Construction', 'Infrastructure', 'Industrial Site'],
    projectOverview: 'PROJECT OVERVIEW',
    mapping3D: '3D MAPPING',
    siteContext: 'SITE CONTEXT',
    heroCaption:
      'Review construction and infrastructure conditions inside the same 3D project',

    contextEyebrow: 'PROJECT CONTEXTS',
    contextTitle: 'One data workflow for multiple construction and infrastructure scenarios',
    contextBody:
      'Survey data is organized by project so teams can inspect and discuss information within the correct operational context.',
    contexts: [
      {
        title: 'Construction sites',
        body: 'Review the overall work area, inspect structures and focus on locations that need discussion in 3D.',
      },
      {
        title: 'Infrastructure & corridors',
        body: 'Follow linear infrastructure, compare positions and check important distances within the same project.',
      },
      {
        title: 'Plants & industrial sites',
        body: 'Centralize site survey data so stakeholders can inspect, measure and coordinate from one shared source.',
      },
    ],

    dataEyebrow: 'DATA FOR INSPECTION',
    dataTitle: 'Switch between data layers according to the inspection task',
    dataBody:
      'Orthophotos, 3D Mesh and Point Cloud provide different views while preserving the same project spatial context.',
    projectData: 'PROJECT DATA',
    overviewCaption: 'Perspective view of current-condition data inside the same Viewer',
    dataItems: [
      {
        title: 'Orthophoto / DOM',
        body: 'Inspect overall site layout and project extent from a top-down view.',
      },
      {
        title: '3D Mesh',
        body: 'Inspect project shape, surfaces and structures from a 3D perspective.',
      },
      {
        title: 'Point Cloud',
        body: 'Review detailed 3D point data in areas that require closer assessment.',
      },
    ],

    measureEyebrow: 'INSPECTION & MEASUREMENT',
    measureTitle: 'Check spatial information directly on current site data',
    measureBody:
      'Viewer-based measurements make discussions faster when teams need to check distances, extents or positions inside the project.',
    measurementLabel: 'MEASUREMENT',
    measurementCaption: 'Measure distances directly on current-condition 3D data',
    measureItems: [
      {
        title: 'Distance',
        body: 'Measure distances between positions directly on 3D project data.',
      },
      {
        title: 'Area',
        body: 'Draw a region and calculate the area that needs to be checked.',
      },
      {
        title: 'Position review',
        body: 'Focus the camera on a discussion point while preserving its project context.',
      },
    ],

    collaborationEyebrow: 'PROJECT COORDINATION',
    collaborationTitle: 'One shared source of project data for all stakeholders',
    collaborationBody:
      'A Web GIS project allows stakeholders to inspect the same source of information and perform review tasks in the same spatial context.',
    valueItems: [
      'Current-condition data centralized in one project',
      'Browser-based viewing',
      'Fast switching between overview and detailed 3D data',
      'Measurements directly on displayed data',
      'Stakeholders review the same project data source',
    ],
    workflowItems: [
      {
        title: 'Open project',
        body: 'Access data organized according to the correct project scope.',
      },
      {
        title: 'Choose data layer',
        body: 'Switch between orthophoto, 3D Mesh and Point Cloud depending on the task.',
      },
      {
        title: 'Inspect & measure',
        body: 'Review current conditions and check distance, area and other spatial information.',
      },
      {
        title: 'Share',
        body: 'Share the project according to the access scope configured in the system.',
      },
    ],

    finalEyebrow: 'CONSTRUCTION · INFRASTRUCTURE · 3D GIS',
    finalTitle:
      'Experience how current-condition construction data is organized inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and explore 3D data, project layers and measurement tools directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'Construction · Infrastructure · 3D Mapping',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    platformLink: '查看 3D GIS 平台',

    eyebrow: '建筑与基础设施解决方案',
    heroTitle1: '在一个空间中检查工程现状',
    heroTitle2: '3D Web GIS',
    heroBody:
      '将正射影像、3D 模型和点云集中到同一项目中，用于查看现场现状、测量空间信息，并直接在浏览器中协调项目数据。',
    heroTags: ['建筑工程', '基础设施', '工业园区'],
    projectOverview: '项目总览',
    mapping3D: '3D MAPPING',
    siteContext: '现场背景',
    heroCaption:
      '在同一个 3D 项目中查看建筑与基础设施的整体情况',

    contextEyebrow: '项目场景',
    contextTitle: '一个数据工作流程适用于多种建筑与基础设施场景',
    contextBody:
      '测绘数据按项目组织，使团队能够在正确的业务背景下查看和讨论现场信息。',
    contexts: [
      {
        title: '建筑工程',
        body: '查看整体施工区域、检查结构，并在 3D 数据中聚焦需要讨论的位置。',
      },
      {
        title: '基础设施与线路',
        body: '沿线路查看项目范围、对比位置并检查同一项目中的关键距离。',
      },
      {
        title: '工厂与工业园区',
        body: '集中现场测绘数据，使相关方能够基于同一数据源查看、测量和协同。',
      },
    ],

    dataEyebrow: '检查所需数据',
    dataTitle: '根据检查目标在不同数据图层之间切换',
    dataBody:
      '正射影像、3D Mesh 和点云提供不同的查看方式，同时保持相同的项目空间背景。',
    projectData: '项目数据',
    overviewCaption: '在同一个 Viewer 中查看工程现状数据的透视视图',
    dataItems: [
      {
        title: '正射影像 DOM',
        body: '通过自上而下的视角查看项目整体平面和工程范围。',
      },
      {
        title: '3D Mesh 模型',
        body: '通过 3D 透视视角查看工程形状、表面和结构。',
      },
      {
        title: 'Point Cloud 点云',
        body: '在需要更详细评估的位置查看高密度 3D 点数据。',
      },
    ],

    measureEyebrow: '检查与测量',
    measureTitle: '直接在工程现状数据上检查空间信息',
    measureBody:
      'Viewer 中的测量工具可以帮助团队快速检查项目中的距离、范围和位置。',
    measurementLabel: '测量',
    measurementCaption: '直接在 3D 工程现状数据上测量距离',
    measureItems: [
      {
        title: '距离',
        body: '直接在 3D 项目数据上测量不同位置之间的距离。',
      },
      {
        title: '面积',
        body: '框选需要检查的区域并计算面积。',
      },
      {
        title: '位置检查',
        body: '将相机聚焦到需要讨论的位置，同时保持项目空间背景。',
      },
    ],

    collaborationEyebrow: '项目协同',
    collaborationTitle: '为所有相关方提供统一的项目数据源',
    collaborationBody:
      'Web GIS 项目让所有相关方基于同一份数据进行查看、检查和协同。',
    valueItems: [
      '工程现状数据集中在同一个项目中',
      '直接在浏览器中查看',
      '快速切换整体视图和 3D 细节数据',
      '直接在当前数据上进行测量',
      '相关方基于同一项目数据源进行查看',
    ],
    workflowItems: [
      {
        title: '打开项目',
        body: '访问已按照正确项目范围组织的数据。',
      },
      {
        title: '选择数据图层',
        body: '根据检查内容在正射影像、3D Mesh 和点云之间切换。',
      },
      {
        title: '查看与测量',
        body: '检查现场现状，并测量距离、面积和其他空间信息。',
      },
      {
        title: '共享',
        body: '根据系统中已配置的访问范围共享项目。',
      },
    ],

    finalEyebrow: 'CONSTRUCTION · INFRASTRUCTURE · 3D GIS',
    finalTitle:
      '体验工程现状数据如何在 3D GIS 项目中进行组织',
    finalBody:
      '申请演示以打开示例项目，并直接在浏览器中查看 3D 数据、项目图层和测量工具。',
    finalButton: '打开演示',
    footer: '建筑 · 基础设施 · 3D Mapping',
  },
};


export const ConstructionInfrastructureSolutionPage: React.FC = () => {
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
        .cis-root {
          --cis-bg: #050914;
          --cis-bg-2: #07101c;
          --cis-surface: #0b1523;

          --cis-ink: #f8fafc;
          --cis-muted: #94a3b8;
          --cis-soft: #64748b;

          --cis-border: rgba(255,255,255,.09);
          --cis-border-strong: rgba(255,255,255,.16);

          --cis-accent: #38bdf8;
          --cis-accent-strong: #0ea5e9;
          --cis-cta-ink: #03111d;

          --cis-header: rgba(5,9,20,.88);
          --cis-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .cis-root.cis-light {
          --cis-bg: #f8fafc;
          --cis-bg-2: #eef4f8;
          --cis-surface: #ffffff;

          --cis-ink: #0f172a;
          --cis-muted: #526174;
          --cis-soft: #64748b;

          --cis-border: rgba(15,23,42,.11);
          --cis-border-strong: rgba(15,23,42,.20);

          --cis-accent: #0369a1;
          --cis-accent-strong: #0284c7;
          --cis-cta-ink: #ffffff;

          --cis-header: rgba(248,250,252,.90);
          --cis-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .cis-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--cis-bg);
          color: var(--cis-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .cis-header {
          background: var(--cis-header);
        }

        .cis-media {
          box-shadow: var(--cis-shadow);
        }

        .cis-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--cis-bg),
            0 0 0 4px var(--cis-accent);
        }

        .cis-theme-toggle {
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

        .cis-theme-toggle:focus-visible {
          outline: 2px solid var(--cis-accent);
          outline-offset: 3px;
        }

        .cis-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .cis-theme-toggle__thumb {
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

        .cis-theme-toggle.is-dark
        .cis-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .cis-theme-toggle__clouds,
        .cis-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .cis-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .cis-theme-toggle.is-dark
        .cis-theme-toggle__clouds {
          opacity: 0;
        }

        .cis-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .cis-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .cis-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .cis-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .cis-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .cis-theme-toggle.is-dark
        .cis-theme-toggle__stars {
          opacity: 1;
        }

        .cis-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            cis-star-pulse
            2s infinite ease-in-out;
        }

        .cis-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .cis-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .cis-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes cis-star-pulse {
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
          .cis-root *,
          .cis-root *::before,
          .cis-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`cis-root ${
          isDarkMode ? '' : 'cis-light'
        }`}
      >
        <header className="cis-header sticky top-0 z-50 border-b border-[var(--cis-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cis-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`cis-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="cis-theme-toggle__clouds">
                  <div className="cis-theme-toggle__cloud cis-theme-toggle__cloud-1" />
                  <div className="cis-theme-toggle__cloud cis-theme-toggle__cloud-2" />
                  <div className="cis-theme-toggle__cloud cis-theme-toggle__cloud-3" />
                </div>

                <div className="cis-theme-toggle__stars">
                  <div className="cis-theme-toggle__star cis-theme-toggle__star-1" />
                  <div className="cis-theme-toggle__star cis-theme-toggle__star-2" />
                  <div className="cis-theme-toggle__star cis-theme-toggle__star-3" />
                </div>

                <div className="cis-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="cis-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--cis-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--cis-muted)] transition-colors hover:text-[var(--cis-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="cis-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--cis-accent)] px-3.5 text-sm font-bold text-[var(--cis-cta-ink)] transition-colors hover:bg-[var(--cis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--cis-border)] bg-[var(--cis-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--cis-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--cis-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="cis-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--cis-accent)] px-6 text-sm font-bold text-[var(--cis-cta-ink)] transition-colors hover:bg-[var(--cis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
                        navigate(
                          '/platform/3d-gis'
                        )
                      }
                      className="cis-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--cis-border)] bg-transparent px-6 text-sm font-semibold text-[var(--cis-ink)] transition-colors hover:border-[var(--cis-border-strong)]"
                    >
                      {c.platformLink}
                    </button>
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="cis-media overflow-hidden rounded-xl border border-[var(--cis-border)] bg-black sm:rounded-2xl">
                    <img
                      src={constructionHeroImage}
                      alt={c.siteContext}
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--cis-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* PROJECT CONTEXT BAND */}
          <section className="border-b border-[var(--cis-border)] bg-[var(--cis-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1000px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                  {c.contextEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.contextTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--cis-muted)]">
                  {c.contextBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--cis-border)] lg:grid-cols-3">
                {c.contexts.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--cis-border)] py-6 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                  >
                    <h3 className="text-lg font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[var(--cis-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* DATA INSPECTION */}
          <section className="border-b border-[var(--cis-border)] bg-[var(--cis-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                  {c.dataEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.dataTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--cis-muted)]">
                  {c.dataBody}
                </p>
              </div>

              <figure className="mt-10 min-w-0">
                <div className="cis-media overflow-hidden rounded-xl border border-[var(--cis-border)] bg-black sm:rounded-2xl">
                  <img
                    src={constructionOverviewImage}
                    alt={c.projectData}
                    className="aspect-[21/9] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--cis-muted)]">
                  {c.overviewCaption}
                </figcaption>
              </figure>

              <div className="mt-8 grid grid-cols-1 border-y border-[var(--cis-border)] md:grid-cols-3">
                {c.dataItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--cis-border)] py-5 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  >
                    <h3 className="text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--cis-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* MEASUREMENT SPLIT */}
          <section className="border-b border-[var(--cis-border)] bg-[var(--cis-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.40fr)_minmax(0,.60fr)] lg:items-center lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                    {c.measureEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.measureTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--cis-muted)]">
                    {c.measureBody}
                  </p>

                  <div className="mt-8 border-y border-[var(--cis-border)]">
                    {c.measureItems.map((item) => (
                      <article
                        key={item.title}
                        className="grid grid-cols-1 gap-2 border-b border-[var(--cis-border)] py-5 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7"
                      >
                        <h3 className="text-sm font-semibold">
                          {item.title}
                        </h3>

                        <p className="text-sm leading-6 text-[var(--cis-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="cis-media overflow-hidden rounded-xl border border-[var(--cis-border)] bg-black sm:rounded-2xl">
                    <img
                      src={constructionMeasurementImage}
                      alt={c.measurementCaption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--cis-muted)]">
                    {c.measurementCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* PROJECT COORDINATION */}
          <section className="border-b border-[var(--cis-border)] bg-[var(--cis-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.34fr)_minmax(0,.66fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                    {c.collaborationEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.collaborationTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--cis-muted)]">
                    {c.collaborationBody}
                  </p>

                  <div className="mt-7 space-y-3 text-sm leading-6 text-[var(--cis-muted)]">
                    {c.valueItems.map((item) => (
                      <p key={item}>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  {c.workflowItems.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast =
                      index === c.workflowItems.length - 1;

                    const dotTop =
                      isFirst
                        ? 'top-[8px]'
                        : 'top-[32px]';

                    const dotCenterTop =
                      isFirst
                        ? 'top-[13px]'
                        : 'top-[37px]';

                    return (
                      <article
                        key={item.title}
                        className="grid grid-cols-[18px_minmax(0,1fr)] gap-4 border-b border-[var(--cis-border)] last:border-b-0 sm:gap-5"
                      >
                        <div className="relative">
                          {!isFirst && (
                            <span className="absolute left-[5px] top-0 h-[37px] w-px bg-[var(--cis-border)]" />
                          )}

                          <span
                            className={`absolute left-0 ${dotTop} h-2.5 w-2.5 rounded-full bg-[var(--cis-accent)]`}
                          />

                          {!isLast && (
                            <span
                              className={`absolute bottom-0 left-[5px] ${dotCenterTop} w-px bg-[var(--cis-border)]`}
                            />
                          )}
                        </div>

                        <div
                          className={`${
                            isFirst
                              ? 'pb-6'
                              : isLast
                                ? 'pt-6'
                                : 'py-6'
                          }`}
                        >
                          <h3 className="text-lg font-semibold leading-7">
                            {item.title}
                          </h3>

                          <p className="mt-2 max-w-[760px] text-sm leading-7 text-[var(--cis-muted)]">
                            {item.body}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--cis-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-[72px] xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--cis-border)] py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--cis-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[24ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[36px]">
                    {c.finalTitle}
                  </h2>

                  <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--cis-muted)]">
                    {c.finalBody}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="cis-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--cis-accent)] px-6 text-sm font-bold text-[var(--cis-cta-ink)] transition-colors hover:bg-[var(--cis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        <footer className="border-t border-[var(--cis-border)] bg-[var(--cis-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--cis-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default ConstructionInfrastructureSolutionPage;