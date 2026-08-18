import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Crosshair,
  Image as ImageIcon,
  Layers3,
  MapPinned,
  Ruler,
  Share2,
  SquareDashed,
  Users,
  Workflow,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import constructionHeroImage from '../assets/construction-hero.png';
import constructionOverviewImage from '../assets/construction-overview.png';
import constructionMeasurementImage from '../assets/construction-measurement.png';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

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
      'Phối hợp nhiều bên trên cùng một nguồn thông tin',
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
        body: 'Mời thành viên tham gia project và phân quyền truy cập theo vai trò.',
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
      'Multi-stakeholder coordination from the same source',
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
        body: 'Invite project members and assign access permissions according to their roles.',
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
      '多方基于同一数据源协同',
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
        body: '邀请项目成员，并根据角色分配访问权限。',
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

const DATA_ICONS = [ImageIcon, Box, Layers3] as const;
const MEASURE_ICONS = [Ruler, SquareDashed, Crosshair] as const;

export const ConstructionInfrastructureSolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const c = COPY[currentLang];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050914] text-white selection:bg-sky-400/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/92 backdrop-blur-xl">
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
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:inline-flex"
            >
              <ArrowLeft size={16} />
              {c.home}
            </button>

            <button
              type="button"
              onClick={openDemo}
              disabled={isDemoLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              <span className="hidden sm:inline">{c.demo}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(14,165,233,.12),transparent_34%),radial-gradient(circle_at_82%_64%,rgba(245,158,11,.08),transparent_31%)]" />

          <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-bold tracking-[.14em] text-sky-300">
                <Crosshair size={14} />
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px]">
                {c.heroTitle1}
                <span className="block text-sky-400">{c.heroTitle2}</span>
              </h1>

              <p className="mt-6 max-w-[60ch] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-400 px-6 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {c.openDemo3D}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/platform/3d-gis')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  {c.platformLink}
                </button>
              </div>

              <div className="mt-8 grid max-w-[620px] grid-cols-1 gap-2 sm:grid-cols-3">
                {c.heroTags.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-xs font-semibold text-slate-300"
                  >
                    <Check size={14} className="shrink-0 text-sky-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <figure className="min-w-0">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_26px_80px_rgba(0,0,0,.34)]">
                <img
                  src={constructionHeroImage}
                  alt={c.siteContext}
                  className="aspect-[16/11] w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-sky-300 backdrop-blur">
                    {c.projectOverview}
                  </span>
                  <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-amber-300 backdrop-blur">
                    {c.mapping3D}
                  </span>
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.14em] text-sky-300">
                    <MapPinned size={13} />
                    {c.siteContext}
                  </div>
                  <p className="max-w-[540px] text-sm font-medium leading-6 text-white sm:text-base">
                    {c.heroCaption}
                  </p>
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[840px]">
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.contextEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.contextTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.contextBody}</p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
              {c.contexts.map((item, index) => (
                <article
                  key={item.title}
                  className={`rounded-[22px] border p-5 ${
                    index === 1
                      ? 'border-amber-300/15 bg-amber-400/[0.035]'
                      : 'border-white/10 bg-[#09131f]'
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-[.16em] text-slate-600">
                    0{index + 1}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.57fr)_minmax(0,.43fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <img
                  src={constructionOverviewImage}
                  alt={c.projectData}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold tracking-[.14em] text-sky-300">{c.projectData}</div>
                  <p className="mt-1 text-sm font-medium text-white">{c.overviewCaption}</p>
                </div>
              </div>
            </figure>

            <div>
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.dataEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.dataTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.dataBody}</p>

              <div className="mt-7 space-y-3">
                {c.dataItems.map((item, index) => {
                  const Icon = DATA_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 rounded-xl border border-white/10 bg-[#09131f] p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div>
              <div className="text-xs font-bold tracking-[.16em] text-amber-300">{c.measureEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.measureTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.measureBody}</p>

              <div className="mt-7 grid grid-cols-1 gap-3">
                {c.measureItems.map((item, index) => {
                  const Icon = MEASURE_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 rounded-xl border border-white/10 bg-[#09131f] p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <img
                  src={constructionMeasurementImage}
                  alt={c.measurementCaption}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold tracking-[.14em] text-amber-300">
                    {c.measurementLabel}
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">{c.measurementCaption}</p>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.4fr)_minmax(0,.6fr)] lg:gap-14">
              <div>
                <div className="text-xs font-bold tracking-[.16em] text-sky-400">
                  {c.collaborationEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                  {c.collaborationTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-400">
                  {c.collaborationBody}
                </p>

                <ul className="mt-7 space-y-3">
                  {c.valueItems.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                        <Check size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {c.workflowItems.map((item, index) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[#09131f] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                        {index === 3 ? <Users size={18} /> : <Workflow size={18} />}
                      </span>
                      <span className="text-[10px] font-bold tracking-[.16em] text-slate-600">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#07101c]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(14,165,233,.15),transparent_42%)]" />

          <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 gap-7 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-sky-400">
                <Share2 size={14} />
                {c.finalEyebrow}
              </div>

              <h2 className="mt-4 max-w-[760px] text-[28px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                {c.finalTitle}
              </h2>

              <p className="mt-4 max-w-[720px] text-base leading-7 text-slate-400">
                {c.finalBody}
              </p>
            </div>

            <button
              type="button"
              onClick={openDemo}
              disabled={isDemoLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-6 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {c.finalButton}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#03060d]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="SAOLATEK" className="h-7 w-auto object-contain" />
            <span>{c.footer}</span>
          </div>
          <span>© 2026 SAOLATEK</span>
        </div>
      </footer>
    </div>
  );
};

export default ConstructionInfrastructureSolutionPage;