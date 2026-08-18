import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Cloud,
  Image as ImageIcon,
  MapPinned,
  Mountain,
  Plane,
  Ruler,
  ScanLine,
  Share2,
  SquareDashed,
  Workflow,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import lidarHeroImage from '../assets/point-cloud-lidar-hero.png';
import lidarOverviewImage from '../assets/point-cloud-lidar-overview.png';
import lidarTopViewImage from '../assets/point-cloud-lidar-topview.png';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

type CardItem = {
  title: string;
  body: string;
};

type SourceItem = CardItem & {
  eyebrow: string;
  tags: [string, string];
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;
  openDemo3D: string;
  pointCloudLink: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroTags: [string, string, string];
  viewerLabel: string;
  pointCloudLabel: string;
  projectData: string;
  heroCaption: string;

  sourceEyebrow: string;
  sourceTitle: string;
  sourceBody: string;
  sources: [SourceItem, SourceItem];

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflowItems: [CardItem, CardItem, CardItem, CardItem];

  viewerEyebrow: string;
  viewerTitle: string;
  viewerBody: string;
  overviewLabel: string;
  overviewCaption: string;
  viewerItems: [CardItem, CardItem, CardItem];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  topViewLabel: string;
  topViewCaption: string;
  measureItems: [CardItem, CardItem, CardItem];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
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
    pointCloudLink: 'Xem Point Cloud & LiDAR',

    eyebrow: 'GIẢI PHÁP UAV MAPPING & LiDAR',
    heroTitle1: 'Từ dữ liệu khảo sát đến một project',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Tập trung dữ liệu UAV và LiDAR thành DOM, mô hình 3D và Point Cloud để quan sát, đo đạc và chia sẻ dữ liệu dự án trực tiếp trên trình duyệt.',
    heroTags: ['UAV Mapping', 'LiDAR', 'Web GIS 3D'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: 'DỮ LIỆU DỰ ÁN',
    heroCaption: 'Quan sát dữ liệu LiDAR trong cùng bối cảnh project Web GIS 3D',

    sourceEyebrow: 'NGUỒN DỮ LIỆU',
    sourceTitle: 'UAV và LiDAR bổ sung cho nhau trong cùng một workflow dữ liệu',
    sourceBody:
      'Mỗi nguồn khảo sát tạo ra loại dữ liệu khác nhau, nhưng đều được tổ chức trong cùng một project để người dùng quan sát thống nhất.',
    sources: [
      {
        eyebrow: 'UAV MAPPING',
        title: 'Ảnh khảo sát → DOM & 3D Mesh',
        body: 'Dữ liệu ảnh từ UAV được tổ chức thành lớp ảnh trực giao và mô hình 3D để quan sát mặt bằng, địa hình và bối cảnh dự án.',
        tags: ['DOM', '3D Mesh'],
      },
      {
        eyebrow: 'LiDAR',
        title: 'Quét không gian → Point Cloud',
        body: 'Dữ liệu LiDAR được đưa vào Viewer dưới dạng Point Cloud để kiểm tra cấu trúc không gian và các khu vực cần quan sát chi tiết.',
        tags: ['Point Cloud', '3D View'],
      },
    ],

    workflowEyebrow: 'WORKFLOW',
    workflowTitle: 'Từ khảo sát đến dữ liệu có thể sử dụng trên Viewer',
    workflowBody:
      'Quy trình được tổ chức theo project, giúp dữ liệu luôn giữ đúng bối cảnh khi chuyển từ hiện trường lên nền tảng.',
    workflowItems: [
      {
        title: 'Thu nhận dữ liệu',
        body: 'Khảo sát bằng UAV hoặc LiDAR theo phạm vi và mục tiêu của dự án.',
      },
      {
        title: 'Xử lý dữ liệu',
        body: 'Tổ chức dữ liệu thành DOM, 3D Mesh và Point Cloud phù hợp cho Web GIS.',
      },
      {
        title: 'Đưa vào project',
        body: 'Tập trung các lớp dữ liệu trong cùng một không gian dự án 3D.',
      },
      {
        title: 'Quan sát & chia sẻ',
        body: 'Kiểm tra dữ liệu trên Viewer và chia sẻ project theo quyền truy cập.',
      },
    ],

    viewerEyebrow: 'DỮ LIỆU TRONG VIEWER',
    viewerTitle: 'Một project, nhiều lớp dữ liệu và cùng một bối cảnh không gian',
    viewerBody:
      'Người dùng có thể chuyển giữa các lớp dữ liệu để kiểm tra dự án mà không cần rời khỏi Viewer.',
    overviewLabel: 'TỔNG QUAN PROJECT',
    overviewCaption: 'Quan sát tổng thể phạm vi dữ liệu trong cùng một Viewer',
    viewerItems: [
      {
        title: 'Point Cloud',
        body: 'Quan sát dữ liệu điểm 3D và tập trung camera vào khu vực cần kiểm tra.',
      },
      {
        title: '3D Mesh',
        body: 'Theo dõi hình dạng, bề mặt và cấu trúc tổng thể của khu vực dự án.',
      },
      {
        title: 'DOM',
        body: 'Đối chiếu mặt bằng dự án theo góc nhìn trực giao từ trên xuống.',
      },
    ],

    measureEyebrow: 'ĐO ĐẠC & GÓC NHÌN',
    measureTitle: 'Kiểm tra dữ liệu từ nhiều góc nhìn ngay trên trình duyệt',
    measureBody:
      'Viewer hỗ trợ góc nhìn phối cảnh và từ trên xuống, kết hợp với các công cụ đo để kiểm tra nhanh thông tin không gian.',
    topViewLabel: 'GÓC NHÌN TỪ TRÊN',
    topViewCaption: 'Góc nhìn từ trên xuống trong cùng project 3D',
    measureItems: [
      {
        title: 'Khoảng cách',
        body: 'Đo khoảng cách giữa các vị trí ngay trên dữ liệu đang quan sát.',
      },
      {
        title: 'Chênh cao',
        body: 'Kiểm tra chênh lệch cao độ giữa hai điểm trong không gian 3D.',
      },
      {
        title: 'Diện tích',
        body: 'Khoanh vùng và xác định diện tích khu vực cần kiểm tra.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Tập trung dữ liệu khảo sát để dễ quan sát và dễ phối hợp hơn',
    valueBody:
      'Web GIS giúp các lớp dữ liệu từ UAV và LiDAR được đưa vào cùng một workflow thay vì nằm rời rạc ở nhiều công cụ khác nhau.',
    valueItems: [
      'DOM, 3D Mesh và Point Cloud trong cùng một project',
      'Quan sát trực tiếp trên trình duyệt',
      'Chuyển giữa góc nhìn phối cảnh và từ trên xuống',
      'Đo đạc ngay trên dữ liệu đang hiển thị',
      'Chia sẻ project theo quyền thành viên',
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: 'Trải nghiệm cách dữ liệu UAV & LiDAR được tổ chức trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem trực tiếp Point Cloud, 3D Mesh, DOM và các công cụ đo trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'UAV · LiDAR · 3D Mapping',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    pointCloudLink: 'View Point Cloud & LiDAR',

    eyebrow: 'UAV MAPPING & LiDAR SOLUTION',
    heroTitle1: 'From survey capture to a',
    heroTitle2: '3D Web GIS project',
    heroBody:
      'Bring UAV and LiDAR data together as orthophotos, 3D models and Point Cloud layers for browser-based viewing, measurement and project sharing.',
    heroTags: ['UAV Mapping', 'LiDAR', 'Web GIS 3D'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: 'PROJECT DATA',
    heroCaption: 'Inspect LiDAR data inside the spatial context of the same 3D Web GIS project',

    sourceEyebrow: 'DATA SOURCES',
    sourceTitle: 'UAV and LiDAR complement each other in one data workflow',
    sourceBody:
      'Each survey source produces different data, but all outputs are organized in the same project for consistent inspection.',
    sources: [
      {
        eyebrow: 'UAV MAPPING',
        title: 'Survey imagery → Orthophoto & 3D Mesh',
        body: 'UAV imagery is organized into orthophoto and 3D model layers for reviewing site layout, terrain and project context.',
        tags: ['Orthophoto', '3D Mesh'],
      },
      {
        eyebrow: 'LiDAR',
        title: 'Spatial scanning → Point Cloud',
        body: 'LiDAR data is loaded into the Viewer as Point Cloud for checking spatial structures and locations that require detailed inspection.',
        tags: ['Point Cloud', '3D View'],
      },
    ],

    workflowEyebrow: 'WORKFLOW',
    workflowTitle: 'From survey capture to data ready for the Viewer',
    workflowBody:
      'The workflow is organized by project so data preserves the correct context as it moves from field capture to the platform.',
    workflowItems: [
      {
        title: 'Capture data',
        body: 'Survey with UAV or LiDAR according to the project scope and objectives.',
      },
      {
        title: 'Process data',
        body: 'Organize outputs into orthophoto, 3D Mesh and Point Cloud suitable for Web GIS.',
      },
      {
        title: 'Load into project',
        body: 'Centralize data layers inside the same 3D project workspace.',
      },
      {
        title: 'Inspect & share',
        body: 'Review project data in the Viewer and share access according to permissions.',
      },
    ],

    viewerEyebrow: 'DATA IN VIEWER',
    viewerTitle: 'One project, multiple data layers and one shared spatial context',
    viewerBody:
      'Users can switch between data layers for project inspection without leaving the Viewer.',
    overviewLabel: 'PROJECT OVERVIEW',
    overviewCaption: 'Review the overall data extent inside the same Viewer',
    viewerItems: [
      {
        title: 'Point Cloud',
        body: 'Inspect 3D point data and focus the camera on areas that require closer review.',
      },
      {
        title: '3D Mesh',
        body: 'Review site shape, surfaces and the overall spatial structure of the project area.',
      },
      {
        title: 'Orthophoto / DOM',
        body: 'Compare project layout from an accurate top-down orthographic view.',
      },
    ],

    measureEyebrow: 'MEASUREMENT & VIEWPOINTS',
    measureTitle: 'Inspect data from multiple viewpoints directly in the browser',
    measureBody:
      'The Viewer supports perspective and top-down views together with measurement tools for quick spatial checks.',
    topViewLabel: 'TOP VIEW',
    topViewCaption: 'Top-down view inside the same 3D project',
    measureItems: [
      {
        title: 'Distance',
        body: 'Measure distances between positions directly on the data being viewed.',
      },
      {
        title: 'Elevation difference',
        body: 'Check height differences between two points in 3D space.',
      },
      {
        title: 'Area',
        body: 'Draw a region and calculate the area that needs to be checked.',
      },
    ],

    valueEyebrow: 'OPERATIONAL VALUE',
    valueTitle: 'Centralize survey data for easier inspection and coordination',
    valueBody:
      'Web GIS brings UAV and LiDAR outputs into one workflow instead of leaving them separated across different tools.',
    valueItems: [
      'Orthophoto, 3D Mesh and Point Cloud in one project',
      'Browser-based viewing',
      'Switch between perspective and top-down views',
      'Measurements directly on displayed data',
      'Project sharing based on member access',
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: 'Experience how UAV & LiDAR data is organized inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and explore Point Cloud, 3D Mesh, orthophoto and measurement tools directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'UAV · LiDAR · 3D Mapping',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    pointCloudLink: '查看 Point Cloud & LiDAR',

    eyebrow: 'UAV MAPPING 与 LiDAR 解决方案',
    heroTitle1: '从测绘数据采集到一个',
    heroTitle2: '3D Web GIS 项目',
    heroBody:
      '将无人机与 LiDAR 数据统一组织为正射影像、3D 模型和点云，用于直接在浏览器中查看、测量和共享项目数据。',
    heroTags: ['UAV Mapping', 'LiDAR', 'Web GIS 3D'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: '项目数据',
    heroCaption: '在同一个 3D Web GIS 项目的空间背景中查看 LiDAR 数据',

    sourceEyebrow: '数据来源',
    sourceTitle: 'UAV 与 LiDAR 在同一数据流程中相互补充',
    sourceBody:
      '不同测绘方式会生成不同的数据类型，但所有成果都可以组织在同一个项目中进行统一查看。',
    sources: [
      {
        eyebrow: 'UAV MAPPING',
        title: '测绘影像 → 正射影像与 3D Mesh',
        body: '无人机影像被组织为正射影像和 3D 模型图层，用于查看场地平面、地形和项目背景。',
        tags: ['Orthophoto', '3D Mesh'],
      },
      {
        eyebrow: 'LiDAR',
        title: '空间扫描 → Point Cloud',
        body: 'LiDAR 数据以点云形式加载到 Viewer，用于检查空间结构和需要详细查看的位置。',
        tags: ['Point Cloud', '3D View'],
      },
    ],

    workflowEyebrow: '工作流程',
    workflowTitle: '从测绘采集到可在 Viewer 中使用的数据',
    workflowBody:
      '工作流程按项目组织，使数据从现场进入平台后仍保持正确的项目背景。',
    workflowItems: [
      {
        title: '采集数据',
        body: '根据项目范围和目标使用 UAV 或 LiDAR 进行测绘。',
      },
      {
        title: '处理数据',
        body: '将成果组织为适用于 Web GIS 的正射影像、3D Mesh 和点云。',
      },
      {
        title: '加载到项目',
        body: '将多个数据图层集中到同一个 3D 项目空间。',
      },
      {
        title: '查看与共享',
        body: '在 Viewer 中检查项目数据，并根据权限共享项目。',
      },
    ],

    viewerEyebrow: 'VIEWER 中的数据',
    viewerTitle: '一个项目、多种数据图层、统一的空间背景',
    viewerBody:
      '用户可以在不离开 Viewer 的情况下，在不同数据图层之间切换并检查项目。',
    overviewLabel: '项目总览',
    overviewCaption: '在同一个 Viewer 中查看整体数据范围',
    viewerItems: [
      {
        title: 'Point Cloud 点云',
        body: '查看 3D 点数据，并将相机聚焦到需要详细检查的区域。',
      },
      {
        title: '3D Mesh 模型',
        body: '查看项目区域的形状、表面和整体空间结构。',
      },
      {
        title: '正射影像 DOM',
        body: '通过准确的自上而下视角对比项目平面。',
      },
    ],

    measureEyebrow: '测量与视角',
    measureTitle: '直接在浏览器中从多个视角检查数据',
    measureBody:
      'Viewer 支持透视视角和俯视视角，并结合测量工具快速检查空间信息。',
    topViewLabel: '俯视图',
    topViewCaption: '同一个 3D 项目中的俯视视角',
    measureItems: [
      {
        title: '距离',
        body: '直接在当前查看的数据上测量不同位置之间的距离。',
      },
      {
        title: '高程差',
        body: '检查 3D 空间中两个点之间的高度差。',
      },
      {
        title: '面积',
        body: '框选需要检查的区域并计算其面积。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '集中管理测绘数据，让查看和协同更加高效',
    valueBody:
      'Web GIS 将 UAV 与 LiDAR 成果统一到一个工作流程中，而不是分散在多个不同工具中。',
    valueItems: [
      '正射影像、3D Mesh 和点云位于同一项目',
      '直接在浏览器中查看',
      '在透视和俯视视角之间切换',
      '直接在当前数据上进行测量',
      '按成员访问权限共享项目',
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: '体验 UAV 与 LiDAR 数据如何在 3D GIS 项目中进行组织',
    finalBody:
      '申请演示以打开示例项目，并直接在浏览器中查看点云、3D Mesh、正射影像和测量工具。',
    finalButton: '打开演示',
    footer: 'UAV · LiDAR · 3D Mapping',
  },
};

const SOURCE_ICONS = [Plane, ScanLine] as const;
const VIEWER_ICONS = [Cloud, Box, ImageIcon] as const;
const MEASURE_ICONS = [Ruler, Mountain, SquareDashed] as const;

export const UavMappingLidarSolutionPage: React.FC = () => {
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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(14,165,233,.12),transparent_34%),radial-gradient(circle_at_82%_68%,rgba(139,92,246,.10),transparent_31%)]" />

          <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-bold tracking-[.14em] text-sky-300">
                <ScanLine size={14} />
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
                  onClick={() => navigate('/platform/point-cloud-lidar')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  {c.pointCloudLink}
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
                  src={lidarHeroImage}
                  alt={c.heroCaption}
                  className="aspect-[16/11] w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-sky-300 backdrop-blur">
                    {c.viewerLabel}
                  </span>
                  <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-violet-300 backdrop-blur">
                    {c.pointCloudLabel}
                  </span>
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.14em] text-sky-300">
                    <MapPinned size={13} />
                    {c.projectData}
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
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.sourceEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.sourceTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.sourceBody}</p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {c.sources.map((item, index) => {
                const Icon = SOURCE_ICONS[index];
                const isViolet = index === 1;

                return (
                  <article
                    key={item.eyebrow}
                    className={`rounded-[24px] border p-6 ${
                      isViolet
                        ? 'border-violet-300/15 bg-violet-400/[0.045]'
                        : 'border-sky-300/15 bg-sky-400/[0.045]'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        isViolet
                          ? 'bg-violet-400/10 text-violet-300'
                          : 'bg-sky-400/10 text-sky-300'
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <div
                      className={`mt-5 text-[10px] font-bold tracking-[.14em] ${
                        isViolet ? 'text-violet-300' : 'text-sky-300'
                      }`}
                    >
                      {item.eyebrow}
                    </div>

                    <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold tracking-[.08em] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)] lg:gap-14">
              <div>
                <div className="text-xs font-bold tracking-[.16em] text-violet-300">{c.workflowEyebrow}</div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                  {c.workflowTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-400">{c.workflowBody}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {c.workflowItems.map((item, index) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[#09131f] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                        <Workflow size={18} />
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

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.57fr)_minmax(0,.43fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <img
                  src={lidarOverviewImage}
                  alt={c.overviewCaption}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold tracking-[.14em] text-sky-300">{c.overviewLabel}</div>
                  <p className="mt-1 text-sm font-medium text-white">{c.overviewCaption}</p>
                </div>
              </div>
            </figure>

            <div>
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.viewerEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.viewerTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.viewerBody}</p>

              <div className="mt-7 space-y-3">
                {c.viewerItems.map((item, index) => {
                  const Icon = VIEWER_ICONS[index];
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

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div>
              <div className="text-xs font-bold tracking-[.16em] text-violet-300">{c.measureEyebrow}</div>
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
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
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
                  src={lidarTopViewImage}
                  alt={c.topViewCaption}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold tracking-[.14em] text-violet-300">{c.topViewLabel}</div>
                  <p className="mt-1 text-sm font-medium text-white">{c.topViewCaption}</p>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#09131f]">
              <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,.4fr)_minmax(0,.6fr)] lg:gap-14 lg:p-10">
                <div>
                  <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.valueEyebrow}</div>
                  <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.035em] md:text-[36px]">
                    {c.valueTitle}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-400">{c.valueBody}</p>
                </div>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {c.valueItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-slate-300"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
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

        <section className="relative overflow-hidden bg-[#050914]">
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

export default UavMappingLidarSolutionPage;