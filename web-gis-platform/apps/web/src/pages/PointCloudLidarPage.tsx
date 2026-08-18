import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Cloud,
  Eye,
  Focus,
  Image as ImageIcon,
  Layers3,
  Map,
  MousePointer2,
  ScanLine,
  Waypoints,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import pointCloudHeroImage from '../assets/point-cloud-lidar-hero.png';
import pointCloudOverviewImage from '../assets/point-cloud-lidar-overview.png';
import pointCloudTopViewImage from '../assets/point-cloud-lidar-topview.png';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

type Item = {
  title: string;
  description: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroCaption: string;
  heroAlt: string;
  heroTags: string[];

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flow: Item[];

  contextEyebrow: string;
  contextTitle: string;
  contextBody: string;
  overviewCaption: string;
  overviewAlt: string;
  layers: Item[];

  capEyebrow: string;
  capTitle: string;
  capBody: string;
  topViewCaption: string;
  topViewAlt: string;
  caps: Item[];

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

    eyebrow: 'NỀN TẢNG · POINT CLOUD & LiDAR',
    heroTitle: 'Quan sát dữ liệu LiDAR trong không gian Point Cloud 3D',
    heroBody:
      'Trực quan hóa dữ liệu Point Cloud từ khảo sát LiDAR, điều hướng trong không gian 3D và kiểm tra cấu trúc khu vực trực tiếp trên nền tảng Web GIS.',
    heroCaption: 'Point Cloud · góc nhìn phối cảnh 3D',
    heroAlt: 'Góc nhìn phối cảnh dữ liệu Point Cloud của khu vực khảo sát',
    heroTags: ['LiDAR', 'Point Cloud', 'Web GIS'],

    flowEyebrow: 'DÒNG DỮ LIỆU',
    flowTitle: 'Từ dữ liệu LiDAR đến không gian Web GIS',
    flowBody:
      'Một luồng ngắn, rõ ràng để đưa dữ liệu khảo sát vào môi trường quan sát 3D trên trình duyệt.',
    flow: [
      {
        title: 'LiDAR',
        description: 'Thu thập thông tin hình học và cao độ của khu vực khảo sát.',
      },
      {
        title: 'Point Cloud',
        description: 'Biểu diễn bề mặt và đối tượng bằng tập hợp điểm trong không gian 3D.',
      },
      {
        title: 'Web GIS',
        description: 'Tập trung dữ liệu dự án trong một không gian truy cập trên web.',
      },
      {
        title: 'Quan sát 3D',
        description: 'Xoay, pan và zoom để kiểm tra dữ liệu từ nhiều góc nhìn.',
      },
    ],

    contextEyebrow: 'BỐI CẢNH DỰ ÁN',
    contextTitle: 'Đọc toàn bộ Point Cloud trước khi đi vào chi tiết',
    contextBody:
      'Góc nhìn tổng thể giúp xác định phạm vi khảo sát, cấu trúc khu vực và vị trí các đối tượng trước khi người dùng tập trung vào từng khu vực cần kiểm tra.',
    overviewCaption: 'Overview · phạm vi và cấu trúc tổng thể của dữ liệu',
    overviewAlt: 'Góc nhìn tổng thể dữ liệu Point Cloud của khu vực dự án',
    layers: [
      {
        title: 'Point Cloud',
        description: 'Lớp dữ liệu điểm 3D chính dùng để kiểm tra cấu trúc không gian.',
      },
      {
        title: '3D Mesh',
        description: 'Mô hình bề mặt dùng để đối chiếu hình dạng khi project có dữ liệu.',
      },
      {
        title: 'DOM',
        description: 'Ảnh trực giao hỗ trợ đối chiếu mặt bằng và vị trí.',
      },
    ],

    capEyebrow: 'KHẢ NĂNG QUAN SÁT',
    capTitle: 'Một bộ dữ liệu, nhiều góc nhìn kiểm tra',
    capBody:
      'Thay đổi camera và lớp hiển thị mà không làm mất bối cảnh không gian của project.',
    topViewCaption: 'Top view · quan sát bố cục khu vực trên cùng dữ liệu 3D',
    topViewAlt: 'Góc nhìn từ trên xuống của dữ liệu Point Cloud',
    caps: [
      {
        title: 'Quan sát Point Cloud',
        description: 'Xem trực tiếp cấu trúc điểm 3D của khu vực trong Viewer.',
      },
      {
        title: 'Điều hướng không gian',
        description: 'Thay đổi vị trí và góc nhìn để kiểm tra khu vực từ nhiều hướng.',
      },
      {
        title: 'Bật / tắt lớp dữ liệu',
        description: 'Kiểm soát Point Cloud khi cần đối chiếu với dữ liệu khác.',
      },
      {
        title: 'Tập trung vị trí',
        description: 'Đi tới khu vực quan tâm và giữ góc nhìn phù hợp cho việc kiểm tra.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Point Cloud trong quá trình kiểm tra dữ liệu dự án',
    valueBody:
      'Giữ bối cảnh không gian xuyên suốt quá trình quan sát và giảm việc chuyển qua nhiều công cụ rời rạc.',
    values: [
      'Quan sát cấu trúc không gian của khu vực khảo sát',
      'Kiểm tra cùng khu vực từ nhiều góc nhìn',
      'Xác định nhanh phạm vi và vị trí cần quan tâm',
      'Đối chiếu Point Cloud với các lớp dữ liệu khác',
      'Truy cập dữ liệu trực tiếp trên trình duyệt',
    ],

    finalTitle: 'Trải nghiệm Point Cloud trên nền tảng 3D GIS',
    finalBody:
      'Đăng ký Demo để trực tiếp quan sát và kiểm tra dữ liệu Point Cloud trong nền tảng 3D GIS của SAOLATEK.',
    footer: 'UAV · LiDAR · Point Cloud · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',

    eyebrow: 'PLATFORM · POINT CLOUD & LiDAR',
    heroTitle: 'Explore LiDAR data in a 3D Point Cloud workspace',
    heroBody:
      'Visualize LiDAR Point Clouds, navigate the 3D workspace, and inspect site structure directly in a browser-based Web GIS platform.',
    heroCaption: 'Point Cloud · 3D perspective view',
    heroAlt: 'Perspective view of Point Cloud survey data',
    heroTags: ['LiDAR', 'Point Cloud', 'Web GIS'],

    flowEyebrow: 'DATA FLOW',
    flowTitle: 'From LiDAR data to a Web GIS workspace',
    flowBody:
      'A concise workflow for bringing survey data into a browser-based 3D viewing environment.',
    flow: [
      {
        title: 'LiDAR',
        description: 'Captures geometry and elevation across the surveyed area.',
      },
      {
        title: 'Point Cloud',
        description: 'Represents surfaces and objects as points in three-dimensional space.',
      },
      {
        title: 'Web GIS',
        description: 'Brings project data into a browser-accessible workspace.',
      },
      {
        title: '3D viewing',
        description: 'Rotate, pan, and zoom to inspect the data from multiple viewpoints.',
      },
    ],

    contextEyebrow: 'PROJECT CONTEXT',
    contextTitle: 'Understand the full Point Cloud before inspecting details',
    contextBody:
      'The overview helps users understand survey coverage, site structure, and object locations before moving into specific areas for closer inspection.',
    overviewCaption: 'Overview · survey coverage and overall data structure',
    overviewAlt: 'Overview of Point Cloud project data',
    layers: [
      {
        title: 'Point Cloud',
        description: 'The primary 3D point layer for reviewing spatial structure.',
      },
      {
        title: '3D Mesh',
        description: 'A surface model for shape comparison when available in the project.',
      },
      {
        title: 'DOM',
        description: 'Orthophoto imagery for plan-view and location comparison.',
      },
    ],

    capEyebrow: 'VIEWING CAPABILITIES',
    capTitle: 'One dataset, multiple inspection viewpoints',
    capBody:
      'Change the camera and visible layers while preserving the spatial context of the project.',
    topViewCaption: 'Top view · inspect site layout using the same 3D dataset',
    topViewAlt: 'Top-down view of Point Cloud data',
    caps: [
      {
        title: 'View Point Cloud',
        description: 'Inspect the 3D point structure directly in the Viewer.',
      },
      {
        title: 'Navigate in 3D',
        description: 'Change position and viewing angle to inspect the site from different directions.',
      },
      {
        title: 'Toggle data layers',
        description: 'Control Point Cloud visibility when comparing it with other project data.',
      },
      {
        title: 'Focus on a location',
        description: 'Move to a location of interest and keep a useful inspection viewpoint.',
      },
    ],

    valueEyebrow: 'PRACTICAL VALUE',
    valueTitle: 'Point Cloud in the project inspection workflow',
    valueBody:
      'Preserve spatial context throughout inspection and reduce the need to move between disconnected tools.',
    values: [
      'Review the spatial structure of the surveyed area',
      'Inspect the same area from multiple viewpoints',
      'Identify survey coverage and locations of interest',
      'Compare Point Cloud with other project layers',
      'Access project data directly in the browser',
    ],

    finalTitle: 'Explore Point Cloud in the 3D GIS platform',
    finalBody:
      'Request a Demo to inspect Point Cloud data directly in SAOLATEK’s 3D GIS platform.',
    footer: 'UAV · LiDAR · Point Cloud · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',

    eyebrow: '平台 · POINT CLOUD & LiDAR',
    heroTitle: '在三维 Point Cloud 空间中查看 LiDAR 数据',
    heroBody:
      '在浏览器 Web GIS 平台中可视化 LiDAR Point Cloud、进行三维导航并检查测区空间结构。',
    heroCaption: 'Point Cloud · 三维透视视图',
    heroAlt: 'Point Cloud 测绘数据的三维透视视图',
    heroTags: ['LiDAR', 'Point Cloud', 'Web GIS'],

    flowEyebrow: '数据流程',
    flowTitle: '从 LiDAR 数据到 Web GIS 空间',
    flowBody: '通过清晰简洁的流程，将测绘数据带入浏览器三维查看环境。',
    flow: [
      {
        title: 'LiDAR',
        description: '获取测区的几何结构与高程信息。',
      },
      {
        title: 'Point Cloud',
        description: '以三维空间中的点集合表示表面与对象。',
      },
      {
        title: 'Web GIS',
        description: '将项目数据集中到可通过浏览器访问的空间中。',
      },
      {
        title: '三维查看',
        description: '通过旋转、平移和缩放从多个视角检查数据。',
      },
    ],

    contextEyebrow: '项目背景',
    contextTitle: '先查看完整 Point Cloud，再深入检查细节',
    contextBody:
      '整体视角有助于了解测绘覆盖范围、现场结构和对象位置，然后再进一步检查具体区域。',
    overviewCaption: 'Overview · 测绘范围与整体数据结构',
    overviewAlt: '项目 Point Cloud 数据整体视图',
    layers: [
      {
        title: 'Point Cloud',
        description: '用于检查空间结构的主要三维点数据图层。',
      },
      {
        title: '3D Mesh',
        description: '项目具备相应数据时用于形状对照的表面模型。',
      },
      {
        title: 'DOM',
        description: '用于对照平面与位置的正射影像。',
      },
    ],

    capEyebrow: '查看能力',
    capTitle: '同一份数据，多种检查视角',
    capBody: '改变相机与显示图层，同时保持项目的空间背景。',
    topViewCaption: 'Top view · 使用同一三维数据检查场地布局',
    topViewAlt: 'Point Cloud 数据俯视图',
    caps: [
      {
        title: '查看 Point Cloud',
        description: '直接在 Viewer 中检查三维点结构。',
      },
      {
        title: '三维导航',
        description: '改变位置与视角，从不同方向检查区域。',
      },
      {
        title: '控制数据图层',
        description: '在与其他项目数据对照时控制 Point Cloud 的显示。',
      },
      {
        title: '聚焦目标位置',
        description: '移动到关注区域并保持适合检查的视角。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '项目数据核查流程中的 Point Cloud',
    valueBody:
      '在整个检查过程中保持空间背景，并减少在多个独立工具之间切换。',
    values: [
      '查看测区的空间结构',
      '从多个视角检查同一区域',
      '识别测绘范围和关注位置',
      '将 Point Cloud 与其他项目图层对照',
      '直接在浏览器中访问项目数据',
    ],

    finalTitle: '在三维 GIS 平台中体验 Point Cloud',
    finalBody:
      '申请演示访问，直接在 SAOLATEK 三维 GIS 平台中查看并检查 Point Cloud 数据。',
    footer: 'UAV · LiDAR · Point Cloud · 三维 GIS',
  },
};

const FLOW_ICONS = [ScanLine, Cloud, Map, Eye] as const;
const LAYER_ICONS = [Cloud, Box, ImageIcon] as const;
const CAP_ICONS = [Eye, Waypoints, Layers3, Focus] as const;

const MediaPanel: React.FC<{
  src: string;
  alt: string;
  caption: string;
  eager?: boolean;
  className?: string;
}> = ({ src, alt, caption, eager = false, className = '' }) => (
  <figure className={`min-w-0 ${className}`}>
    <div className="group relative overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.24)]">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-bold tracking-[.12em] text-white/90 backdrop-blur">
          3D VIEW
        </span>
      </div>

      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        className="aspect-[16/10] w-full object-contain transition-transform duration-500 group-hover:scale-[1.015] motion-reduce:transition-none"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <figcaption className="absolute bottom-4 left-4 right-4 text-xs font-medium leading-5 text-white/90">
        {caption}
      </figcaption>
    </div>
  </figure>
);

export const PointCloudLidarPage: React.FC = () => {
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
      className="min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)] [--color-accent-ink:var(--color-paper)] [&_button]:transition-opacity [&_button:hover]:opacity-90 [&_button:active]:opacity-75 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-[var(--color-accent)] motion-reduce:[&_button]:transition-none"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-paper)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 md:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 border-0 bg-transparent p-0"
            aria-label={c.home}
          >
            <img
              src={logoImg}
              alt="SAOLATEK"
              className="h-8 w-auto object-contain sm:h-9"
            />
          </button>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <SolutionLanguageSwitcher
              currentLang={currentLang}
              onChange={setCurrentLang}
              ariaLabel={c.languageLabel}
            />

            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 text-sm font-semibold text-[var(--color-ink-muted)] sm:inline-flex"
            >
              <ArrowLeft size={16} />
              {c.home}
            </button>

            <button
              type="button"
              onClick={demo}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-accent-ink)] md:px-5"
            >
              <span className="hidden sm:inline">{c.demo}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-[var(--color-accent)] opacity-[.035] blur-3xl" />

          <div className="mx-auto grid max-w-[1380px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="relative z-10 min-w-0">
              <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[15ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[58px]">
                {c.heroTitle}
              </h1>

              <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {c.heroTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--color-border-cyan)] bg-[var(--color-paper-3)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={demo}
                  disabled={isLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)]"
                >
                  {c.demo}
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                  <MousePointer2 size={14} className="text-[var(--color-accent)]" />
                  Browser-based 3D GIS
                </div>
              </div>
            </div>

            <div className="relative min-w-0">
              <MediaPanel
                src={pointCloudHeroImage}
                alt={c.heroAlt}
                caption={c.heroCaption}
                eager
              />

              <div className="pointer-events-none absolute -bottom-5 -left-5 hidden rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-paper)_90%,transparent)] p-4 shadow-xl backdrop-blur lg:block">
                <div className="text-[10px] font-bold tracking-[.14em] text-[var(--color-accent)]">
                  POINT CLOUD
                </div>
                <div className="mt-1 text-sm font-semibold">3D spatial dataset</div>
              </div>
            </div>
          </div>
        </section>

        {/* FLOW */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)] lg:gap-14">
              <div>
                <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                  {c.flowEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                  {c.flowTitle}
                </h2>
                <p className="mt-4 max-w-[560px] text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.flowBody}
                </p>
              </div>

              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {c.flow.map((item, index) => {
                  const Icon = FLOW_ICONS[index] ?? Eye;

                  return (
                    <li
                      key={item.title}
                      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-5 transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                          <Icon size={18} />
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                          0{index + 1}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                        {item.description}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* CONTEXT */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.60fr)_minmax(0,.40fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <MediaPanel
              src={pointCloudOverviewImage}
              alt={c.overviewAlt}
              caption={c.overviewCaption}
            />

            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                {c.contextEyebrow}
              </div>

              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                {c.contextTitle}
              </h2>

              <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.contextBody}
              </p>

              <div className="mt-8 space-y-3">
                {c.layers.map((item, index) => {
                  const Icon = LAYER_ICONS[index] ?? Cloud;
                  const active = index === 0;

                  return (
                    <article
                      key={item.title}
                      className={`rounded-xl border p-4 ${
                        active
                          ? 'border-[var(--color-border-cyan)] bg-[var(--color-paper-3)]'
                          : 'border-[var(--color-border)] bg-[var(--color-paper-2)]'
                      }`}
                    >
                      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            active
                              ? 'bg-[var(--color-paper)] text-[var(--color-accent)]'
                              : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]'
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{item.title}</h3>
                            {active && (
                              <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[9px] font-bold tracking-[.08em] text-[var(--color-accent-ink)]">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-14">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[.16em] text-[var(--color-accent)]">
                  {c.capEyebrow}
                </div>

                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[38px]">
                  {c.capTitle}
                </h2>

                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.capBody}
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {c.caps.map((item, index) => {
                    const Icon = CAP_ICONS[index] ?? Eye;

                    return (
                      <article
                        key={item.title}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] p-4"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                          <Icon size={17} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {item.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <MediaPanel
                src={pointCloudTopViewImage}
                alt={c.topViewAlt}
                caption={c.topViewCaption}
              />
            </div>
          </div>
        </section>

        {/* VALUE */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-border-cyan)] bg-[var(--color-paper-3)]">
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
                      className="flex min-w-0 gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] p-4 text-sm leading-6 text-[var(--color-ink-muted)]"
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
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-5 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <h2 className="text-[28px] font-semibold leading-tight tracking-[-.035em] md:text-[34px]">
                {c.finalTitle}
              </h2>
              <p className="mt-3 max-w-[720px] text-base leading-7 text-[var(--color-ink-muted)]">
                {c.finalBody}
              </p>
            </div>

            <button
              type="button"
              onClick={demo}
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
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

export default PointCloudLidarPage;