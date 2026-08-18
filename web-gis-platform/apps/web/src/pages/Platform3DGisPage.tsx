import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  Cloud,
  Eye,
  Image,
  Layers3,
  Maximize2,
  Pentagon,
  Ruler,
  ScanLine,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import viewerHeroImage from '../assets/3d-gis-viewer-hero.png';
import viewerOverviewImage from '../assets/3d-gis-viewer-overview.png';
import viewerAreaImage from '../assets/3d-gis-viewer-area.png';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

type Item = {
  title: string;
  description: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demoCta: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroNote: string;
  heroImageAlt: string;
  heroImageCaption: string;
  heroImageTag: string;
  heroBadges: string[];

  dataEyebrow: string;
  dataTitle: string;
  dataBody: string;
  data: [Item, Item, Item];
  overviewImageAlt: string;
  overviewCaption: string;

  viewEyebrow: string;
  viewTitle: string;
  viewBody: string;
  viewModes: string[];
  valueTitle: string;
  values: string[];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measures: [Item, Item, Item];
  measureImageAlt: string;
  measureCaption: string;

  finalTitle: string;
  finalBody: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demoCta: 'Đăng ký xem Demo',

    eyebrow: 'NỀN TẢNG · TRÌNH XEM 3D GIS',
    heroTitle: 'Quan sát dữ liệu dự án trong một không gian 3D trực quan',
    heroBody:
      'Tập trung Point Cloud, mô hình 3D và ảnh DOM trong cùng một Web GIS để quan sát hiện trạng, đổi góc nhìn và kiểm tra khu vực trực tiếp trên trình duyệt.',
    heroNote:
      'Hình ảnh Viewer thực tế từ dữ liệu 3D Mapping của dự án Nhiệt điện Long Phú.',
    heroImageAlt:
      'Trình xem 3D GIS hiển thị Point Cloud và công cụ đo khoảng cách, chênh cao trên dự án Nhiệt điện Long Phú',
    heroImageCaption: 'Viewer thực tế · Point Cloud & đo đạc 3D',
    heroImageTag: '3D GIS Viewer',
    heroBadges: ['Point Cloud', 'Đo khoảng cách', 'Chênh cao'],

    dataEyebrow: 'DỮ LIỆU TRONG VIEWER',
    dataTitle: 'Một project, nhiều lớp dữ liệu và cùng một bối cảnh không gian',
    dataBody:
      'Viewer giúp người dùng mở đúng dữ liệu cần kiểm tra mà vẫn giữ nguyên bối cảnh của toàn bộ dự án.',
    data: [
      {
        title: 'Point Cloud',
        description: 'Quan sát cấu trúc và hiện trạng khu vực từ dữ liệu đám mây điểm 3D.',
      },
      {
        title: 'Mô hình 3D',
        description: 'Quan sát công trình, bề mặt và bố cục tổng thể của khu vực dự án.',
      },
      {
        title: 'Ảnh DOM',
        description: 'Đối chiếu vị trí bằng ảnh trực giao và góc nhìn từ trên xuống.',
      },
    ],
    overviewImageAlt:
      'Góc nhìn tổng quan Point Cloud 3D của dự án Nhiệt điện Long Phú trong Viewer',
    overviewCaption: 'Góc nhìn phối cảnh · dữ liệu dự án trong cùng Viewer',

    viewEyebrow: 'GÓC QUAN SÁT',
    viewTitle: 'Chọn lớp dữ liệu và góc nhìn phù hợp với nội dung cần kiểm tra',
    viewBody:
      'Các chế độ quan sát cùng tồn tại trong một project. Người dùng chuyển qua lại giữa lớp dữ liệu và góc nhìn mà không cần rời khỏi Viewer.',
    viewModes: ['Tổng quan', 'Point Cloud', 'Mô hình 3D', 'Ảnh DOM', 'Phối cảnh', 'Từ trên xuống'],
    valueTitle: 'Giá trị trong workflow dự án',
    values: [
      'Tập trung dữ liệu dự án trong cùng một không gian',
      'Quan sát trực tiếp trên trình duyệt',
      'Chuyển nhanh giữa lớp dữ liệu và góc nhìn',
      'Hỗ trợ kiểm tra và trao đổi dữ liệu dự án',
    ],

    measureEyebrow: 'ĐO ĐẠC TRỰC TIẾP',
    measureTitle: 'Kiểm tra thông tin không gian ngay trên dữ liệu đang quan sát',
    measureBody:
      'Các công cụ đo trong Viewer hỗ trợ người dùng kiểm tra nhanh khoảng cách, chênh cao và diện tích của khu vực dự án.',
    measures: [
      {
        title: 'Khoảng cách',
        description: 'Đo một hoặc nhiều đoạn giữa các vị trí được chọn trực tiếp trên mô hình.',
      },
      {
        title: 'Chênh cao',
        description: 'Xác định chênh lệch độ cao giữa hai điểm trong không gian 3D.',
      },
      {
        title: 'Diện tích',
        description: 'Khoanh vùng và xác định diện tích của khu vực cần kiểm tra.',
      },
    ],
    measureImageAlt:
      'Trình xem 3D GIS đo diện tích trên Point Cloud dự án Nhiệt điện Long Phú',
    measureCaption: 'Đo diện tích trực tiếp trên dữ liệu Point Cloud',

    finalTitle: 'Đưa dữ liệu dự án vào đúng Viewer để quan sát và kiểm tra',
    finalBody:
      'Đăng ký Demo để trao đổi về loại dữ liệu, cách tổ chức project và workflow kiểm tra phù hợp với dự án của bạn.',
    footer: 'UAV · LiDAR · Point Cloud · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demoCta: 'Request Demo Access',

    eyebrow: 'PLATFORM · 3D GIS VIEWER',
    heroTitle: 'Explore project data in one visual 3D workspace',
    heroBody:
      'Bring Point Cloud, 3D models, and DOM imagery into one Web GIS workspace to inspect site conditions, switch views, and review project areas directly in the browser.',
    heroNote:
      'Real Viewer imagery from 3D Mapping data of the Long Phú Thermal Power Plant project.',
    heroImageAlt:
      '3D GIS Viewer showing point-cloud data with distance and height-difference measurements at the Long Phú Thermal Power Plant project',
    heroImageCaption: 'Real Viewer · Point Cloud & 3D measurement',
    heroImageTag: '3D GIS Viewer',
    heroBadges: ['Point Cloud', 'Distance', 'Height difference'],

    dataEyebrow: 'DATA IN THE VIEWER',
    dataTitle: 'One project, multiple data layers, one spatial context',
    dataBody:
      'The Viewer lets users open the right layer for the task while keeping the full project context visible.',
    data: [
      {
        title: 'Point Cloud',
        description: 'Inspect site structure and conditions using three-dimensional point-cloud data.',
      },
      {
        title: '3D Model',
        description: 'Review buildings, surfaces, and the overall spatial layout of the project area.',
      },
      {
        title: 'DOM Image',
        description: 'Compare locations using orthophotos and a top-down project view.',
      },
    ],
    overviewImageAlt:
      'Overview perspective of Long Phú Thermal Power Plant point-cloud data in the 3D GIS Viewer',
    overviewCaption: 'Perspective view · project data inside one Viewer',

    viewEyebrow: 'VIEWING OPTIONS',
    viewTitle: 'Choose the layer and viewing angle that fit the inspection task',
    viewBody:
      'Viewing modes coexist within one project. Users move between layers and camera angles without leaving the Viewer.',
    viewModes: ['Overview', 'Point Cloud', '3D Model', 'DOM Image', 'Perspective', 'Top-down'],
    valueTitle: 'Value in the project workflow',
    values: [
      'Keep project data in one workspace',
      'Review data directly in the browser',
      'Switch quickly between layers and views',
      'Support project-data inspection and discussion',
    ],

    measureEyebrow: 'DIRECT MEASUREMENT',
    measureTitle: 'Inspect spatial information directly on the data you are viewing',
    measureBody:
      'Viewer measurement tools support quick checks of distance, elevation difference, and selected-area size.',
    measures: [
      {
        title: 'Distance',
        description: 'Measure one or multiple segments between selected positions on the model.',
      },
      {
        title: 'Height difference',
        description: 'Determine the elevation difference between two points in 3D space.',
      },
      {
        title: 'Area',
        description: 'Define a region and calculate the area of the location being reviewed.',
      },
    ],
    measureImageAlt:
      '3D GIS Viewer measuring an area on point-cloud data from the Long Phú Thermal Power Plant project',
    measureCaption: 'Area measurement directly on Point Cloud data',

    finalTitle: 'Bring project data into the right Viewer for inspection',
    finalBody:
      'Request a Demo to discuss your data types, project structure, and the inspection workflow that fits your project.',
    footer: 'UAV · LiDAR · Point Cloud · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demoCta: '申请演示访问',

    eyebrow: '平台 · 三维 GIS 查看器',
    heroTitle: '在一个直观的三维空间中查看项目数据',
    heroBody:
      '将点云、三维模型和 DOM 影像集中到同一个 Web GIS 空间中，在浏览器内查看现场情况、切换视角并检查项目区域。',
    heroNote: '真实 Viewer 图像来自 Long Phú 火力发电厂项目的三维建图数据。',
    heroImageAlt:
      '三维 GIS Viewer 显示 Long Phú 火力发电厂项目的点云数据以及距离和高差测量',
    heroImageCaption: '真实 Viewer · 点云与三维测量',
    heroImageTag: '三维 GIS Viewer',
    heroBadges: ['点云', '距离测量', '高差'],

    dataEyebrow: 'VIEWER 中的数据',
    dataTitle: '一个项目、多种数据图层、同一个空间背景',
    dataBody: '用户可以打开适合当前检查任务的数据图层，同时保留完整的项目空间背景。',
    data: [
      {
        title: 'Point Cloud',
        description: '通过三维点云数据查看项目区域的结构与现场状态。',
      },
      {
        title: '三维模型',
        description: '查看建筑、地表以及项目区域的整体空间布局。',
      },
      {
        title: 'DOM 影像',
        description: '通过正射影像和俯视视角对照项目位置。',
      },
    ],
    overviewImageAlt: '三维 GIS Viewer 中 Long Phú 火力发电厂项目点云数据的整体透视图',
    overviewCaption: '透视视角 · 同一个 Viewer 中的项目数据',

    viewEyebrow: '查看方式',
    viewTitle: '根据检查内容选择合适的数据图层和视角',
    viewBody:
      '不同查看方式可在同一项目中共同使用。用户无需离开 Viewer 即可在图层和视角之间切换。',
    viewModes: ['总览', '点云', '三维模型', 'DOM 影像', '透视', '俯视'],
    valueTitle: '项目工作流程中的价值',
    values: [
      '在同一空间集中项目数据',
      '直接在浏览器中查看数据',
      '快速切换图层和视角',
      '支持项目数据检查与沟通',
    ],

    measureEyebrow: '直接测量',
    measureTitle: '直接在当前查看的数据上检查空间信息',
    measureBody: 'Viewer 中的测量工具可快速检查距离、高差以及所选区域的面积。',
    measures: [
      {
        title: '距离',
        description: '直接在模型上测量所选位置之间的一段或多段距离。',
      },
      {
        title: '高差',
        description: '确定三维空间中两个点之间的高程差。',
      },
      {
        title: '面积',
        description: '划定检查区域并计算所选位置的面积。',
      },
    ],
    measureImageAlt: '三维 GIS Viewer 在 Long Phú 火力发电厂项目点云数据上测量面积',
    measureCaption: '直接在点云数据上测量面积',

    finalTitle: '将项目数据放入正确的 Viewer 中进行查看与检查',
    finalBody: '申请演示，与我们沟通适合项目的数据类型、项目结构和检查流程。',
    footer: 'UAV · LiDAR · Point Cloud · 三维 GIS',
  },
};

const DATA_ICONS = [Cloud, ScanLine, Image] as const;
const MEASURE_ICONS = [Ruler, ArrowUpDown, Pentagon] as const;

export const Platform3DGisPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const c = COPY[currentLang];

  return (
    <div
      lang={currentLang}
      className="min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)] [&_button]:transition-opacity [&_button:hover]:opacity-90 [&_button:active]:opacity-75 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-[var(--color-accent)]"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-paper)_92%,transparent)] backdrop-blur-xl">
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
              className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 text-sm font-semibold text-[var(--color-ink-muted)] sm:inline-flex"
            >
              <ArrowLeft size={16} />
              {c.home}
            </button>

            <button
              type="button"
              onClick={openDemo}
              disabled={isDemoLoading}
              className="inline-flex h-11 w-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] text-sm font-bold text-[var(--color-paper)] md:w-auto md:px-4"
              aria-label={c.demoCta}
            >
              <span className="hidden md:inline">{c.demoCta}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1360px] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.44fr)_minmax(0,.56fr)] lg:items-center lg:gap-14 xl:gap-18">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                  {c.eyebrow}
                </div>

                <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.04] tracking-[-.045em] sm:text-[48px] lg:text-[58px]">
                  {c.heroTitle}
                </h1>

                <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                  {c.heroBody}
                </p>

                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-paper)] sm:w-auto"
                >
                  {c.demoCta}
                  <ArrowRight size={16} />
                </button>

                <p className="mt-4 max-w-[620px] text-xs leading-5 text-[var(--color-ink-muted)]">
                  {c.heroNote}
                </p>
              </div>

              <figure className="min-w-0">
                <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.24)] lg:rounded-[26px]">
                  <img
                    src={viewerHeroImage}
                    alt={c.heroImageAlt}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                    loading="eager"
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[.13em] text-white/70">
                        {c.heroImageTag}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                        {c.heroImageCaption}
                      </div>
                    </div>

                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/45 text-white backdrop-blur-md">
                      <Maximize2 size={17} />
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.heroBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-paper-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-muted)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                      {badge}
                    </span>
                  ))}
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* DATA */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                  {c.dataEyebrow}
                </div>

                <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                  {c.dataTitle}
                </h2>

                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.dataBody}
                </p>

                <div className="mt-8 border-y border-[var(--color-border)]">
                  {c.data.map((item, index) => {
                    const Icon = DATA_ICONS[index];

                    return (
                      <article
                        key={item.title}
                        className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 border-b border-[var(--color-border)] py-5 last:border-b-0"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">{item.title}</h3>
                          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <figure className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] shadow-[0_18px_50px_rgba(0,0,0,.14)] lg:rounded-[24px]">
                <img
                  src={viewerOverviewImage}
                  alt={c.overviewImageAlt}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs leading-5 text-[var(--color-ink-muted)] sm:px-5">
                  <span>{c.overviewCaption}</span>
                  <Eye size={15} className="shrink-0 text-[var(--color-accent)]" />
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* VIEW OPTIONS */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:gap-16">
              <div>
                <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                  {c.viewEyebrow}
                </div>
                <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                  {c.viewTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.viewBody}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {c.viewModes.map((mode) => (
                    <div
                      key={mode}
                      className="flex min-h-[82px] items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 py-4"
                    >
                      <Layers3 size={17} className="shrink-0 text-[var(--color-accent)]" />
                      <span className="text-sm font-semibold">{mode}</span>
                    </div>
                  ))}
                </div>

                <h3 className="mt-8 text-lg font-semibold">{c.valueTitle}</h3>
                <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {c.values.map((value) => (
                    <li
                      key={value}
                      className="flex gap-3 text-sm leading-6 text-[var(--color-ink-muted)]"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Check size={12} />
                      </span>
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* MEASUREMENT */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.56fr)_minmax(0,.44fr)] lg:items-center lg:gap-16">
              <figure className="order-2 min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] shadow-[0_18px_50px_rgba(0,0,0,.14)] lg:order-1 lg:rounded-[24px]">
                <img
                  src={viewerAreaImage}
                  alt={c.measureImageAlt}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs leading-5 text-[var(--color-ink-muted)] sm:px-5">
                  <span>{c.measureCaption}</span>
                  <Ruler size={15} className="shrink-0 text-[var(--color-accent)]" />
                </figcaption>
              </figure>

              <div className="order-1 lg:order-2">
                <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                  {c.measureEyebrow}
                </div>

                <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                  {c.measureTitle}
                </h2>

                <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                  {c.measureBody}
                </p>

                <div className="mt-7 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {c.measures.map((item, index) => {
                    const Icon = MEASURE_ICONS[index];

                    return (
                      <article
                        key={item.title}
                        className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 py-5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">{item.title}</h3>
                          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-6 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-.03em] md:text-[32px]">
                {c.finalTitle}
              </h2>
              <p className="mt-3 max-w-[700px] text-base leading-7 text-[var(--color-ink-muted)]">
                {c.finalBody}
              </p>
            </div>

            <button
              type="button"
              onClick={openDemo}
              disabled={isDemoLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-paper)] sm:w-auto"
            >
              {c.demoCta}
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

export default Platform3DGisPage;