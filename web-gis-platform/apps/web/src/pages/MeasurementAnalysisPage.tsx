import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  Crosshair,
  Eye,
  Focus,
  Layers3,
  MousePointer2,
  Pentagon,
  Ruler,
  ScanLine,
  Waypoints,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import measurementDistanceImage from '../assets/measurement-3d-hero.png';
import measurementAreaImage from '../assets/measurement-area.png';
import analysisSectionImage from '../assets/measurement-section-analysis.png';
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
  heroNote: string;
  heroImageAlt: string;
  heroImageCaption: string;
  heroTags: string[];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measures: Item[];
  areaImageAlt: string;
  areaImageCaption: string;

  analysisEyebrow: string;
  analysisTitle: string;
  analysisBody: string;
  analyses: Item[];
  sectionImageAlt: string;
  sectionImageCaption: string;
  analysisNote: string;

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflow: Item[];

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

    eyebrow: 'NỀN TẢNG · ĐO ĐẠC & PHÂN TÍCH 3D',
    heroTitle: 'Đo trực tiếp trên dữ liệu 3D của dự án',
    heroBody:
      'Thực hiện các phép đo khoảng cách 2D, khoảng cách 3D và chênh cao ngay trên dữ liệu Point Cloud để kiểm tra kích thước và vị trí trong đúng bối cảnh không gian của dự án.',
    heroNote:
      'Kết quả đo phụ thuộc vào dữ liệu, điểm chọn và bối cảnh dự án đang mở trong Viewer.',
    heroImageAlt:
      'Đo khoảng cách 2D, khoảng cách 3D và chênh cao trên dữ liệu Point Cloud tại dự án Nhiệt điện Long Phú',
    heroImageCaption: 'Đo khoảng cách & chênh cao · Point Cloud dự án thực tế',
    heroTags: ['2D', '3D', 'Chênh cao'],

    measureEyebrow: 'CÔNG CỤ ĐO',
    measureTitle: 'Các phép đo tập trung vào thông tin cần kiểm tra ngay trên mô hình',
    measureBody:
      'Người dùng chọn vị trí hoặc vùng cần đo trực tiếp trên Viewer. Kết quả được hiển thị ngay trong cùng không gian dữ liệu, giúp giảm việc chuyển qua công cụ rời rạc.',
    measures: [
      {
        title: 'Khoảng cách 2D / 3D',
        description:
          'Đo khoảng cách theo mặt bằng và khoảng cách thực trong không gian giữa các vị trí được chọn.',
      },
      {
        title: 'Chênh cao',
        description:
          'Kiểm tra chênh lệch độ cao giữa các điểm trên dữ liệu 3D của khu vực.',
      },
      {
        title: 'Diện tích',
        description:
          'Khoanh vùng trực tiếp trên dữ liệu để xác định diện tích khu vực cần kiểm tra.',
      },
    ],
    areaImageAlt:
      'Đo diện tích một khu vực trên dữ liệu Point Cloud của dự án Nhiệt điện Long Phú',
    areaImageCaption: 'Đo diện tích trực tiếp trên dữ liệu · 72,447.632 m² trong ảnh minh họa',

    analysisEyebrow: 'PHÂN TÍCH 3D',
    analysisTitle: 'Kiểm tra mặt cắt và cao độ trong cùng bối cảnh dữ liệu',
    analysisBody:
      'Ngoài các phép đo cơ bản, dữ liệu Point Cloud có thể được xem theo mặt cắt để kiểm tra hình dạng và phân bố cao độ của khu vực đã chọn.',
    analyses: [
      {
        title: 'Chọn phạm vi phân tích',
        description:
          'Xác định vùng dữ liệu cần tập trung thay vì quan sát toàn bộ project cùng lúc.',
      },
      {
        title: 'Quan sát mặt cắt',
        description:
          'Hiển thị dữ liệu theo mặt cắt để kiểm tra hình dạng công trình hoặc địa hình trong vùng chọn.',
      },
      {
        title: 'Đọc cao độ',
        description:
          'Quan sát sự thay đổi cao độ theo trục và màu hiển thị của dữ liệu mặt cắt.',
      },
    ],
    sectionImageAlt:
      'Phân tích mặt cắt và cao độ của dữ liệu Point Cloud tại dự án Nhiệt điện Long Phú',
    sectionImageCaption: 'Mặt cắt Point Cloud · Quan sát hình dạng và phân bố cao độ',
    analysisNote:
      'Trang này chỉ mô tả các thao tác đo và mặt cắt thể hiện trong dữ liệu dự án; không giả định các mô-đun phân tích nâng cao khác nếu chưa được xác nhận.',

    workflowEyebrow: 'LUỒNG THAO TÁC',
    workflowTitle: 'Từ vị trí cần kiểm tra đến kết quả đo',
    workflowBody:
      'Quy trình được giữ ngắn để người dùng tập trung vào dữ liệu đang quan sát và đọc kết quả ngay trong Viewer.',
    workflow: [
      {
        title: 'Mở dữ liệu dự án',
        description: 'Chọn project và lớp dữ liệu cần kiểm tra trong Viewer.',
      },
      {
        title: 'Chọn công cụ',
        description: 'Chọn khoảng cách, chênh cao, diện tích hoặc mặt cắt phù hợp với mục tiêu kiểm tra.',
      },
      {
        title: 'Đánh dấu vị trí',
        description: 'Chọn điểm, đường hoặc vùng trực tiếp trên dữ liệu 3D.',
      },
      {
        title: 'Đọc kết quả',
        description: 'Xem thông tin đo ngay trong cùng không gian dự án.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Đưa việc kiểm tra kích thước vào ngay trong workflow 3D GIS',
    valueBody:
      'Đo và phân tích trong cùng Viewer giúp giữ nguyên bối cảnh dữ liệu khi kiểm tra hiện trạng và trao đổi thông tin dự án.',
    values: [
      'Đo trực tiếp trên dữ liệu Point Cloud đang quan sát',
      'So sánh khoảng cách 2D và khoảng cách thực 3D',
      'Kiểm tra chênh lệch cao độ giữa các vị trí',
      'Khoanh vùng và đọc diện tích ngay trên dữ liệu',
      'Quan sát mặt cắt để hiểu rõ hơn cấu trúc không gian',
    ],

    finalTitle: 'Trải nghiệm đo đạc trực tiếp trên dữ liệu 3D thực tế',
    finalBody:
      'Đăng ký Demo để kiểm tra các công cụ đo và cách chúng hoạt động trên dữ liệu dự án thực tế trong nền tảng 3D GIS của SAOLATEK.',
    footer: 'Point Cloud · Measurement · 3D Analysis',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',

    eyebrow: 'PLATFORM · 3D MEASUREMENT & ANALYSIS',
    heroTitle: 'Measure directly on project 3D data',
    heroBody:
      'Measure 2D distance, true 3D distance, and height difference directly on Point Cloud data while keeping every result in the spatial context of the project.',
    heroNote:
      'Measurement results depend on the source data, selected points, and the project context currently open in the Viewer.',
    heroImageAlt:
      '2D distance, 3D distance, and height-difference measurement on Point Cloud data from the Long Phú Thermal Power Plant project',
    heroImageCaption: 'Distance & height measurement · Real project Point Cloud',
    heroTags: ['2D', '3D', 'Height'],

    measureEyebrow: 'MEASUREMENT TOOLS',
    measureTitle: 'Measure the information you need directly on the model',
    measureBody:
      'Users select positions or regions directly in the Viewer. Results remain visible in the same data workspace, reducing the need to move between disconnected tools.',
    measures: [
      {
        title: '2D / 3D distance',
        description:
          'Measure plan distance and true spatial distance between selected positions.',
      },
      {
        title: 'Height difference',
        description:
          'Check elevation differences between selected points on the project 3D data.',
      },
      {
        title: 'Area',
        description:
          'Draw a region directly on the data to determine the area that needs to be checked.',
      },
    ],
    areaImageAlt:
      'Area measurement on Point Cloud data from the Long Phú Thermal Power Plant project',
    areaImageCaption: 'Area measurement on project data · 72,447.632 m² shown in the example',

    analysisEyebrow: '3D ANALYSIS',
    analysisTitle: 'Inspect sections and elevation in the same data context',
    analysisBody:
      'Beyond basic measurements, Point Cloud data can be viewed as a section to inspect shape and elevation distribution within a selected area.',
    analyses: [
      {
        title: 'Select an analysis area',
        description:
          'Focus on the relevant portion of the dataset instead of viewing the entire project at once.',
      },
      {
        title: 'Inspect a section',
        description:
          'View the selected data as a section to inspect the shape of structures or terrain.',
      },
      {
        title: 'Read elevation',
        description:
          'Review elevation changes using the section axis and the displayed height coloring.',
      },
    ],
    sectionImageAlt:
      'Section and elevation analysis of Point Cloud data from the Long Phú Thermal Power Plant project',
    sectionImageCaption: 'Point Cloud section · Shape and elevation distribution',
    analysisNote:
      'This page describes measurement and section operations visible in the project data; it does not claim additional advanced analysis modules that have not been verified.',

    workflowEyebrow: 'INTERACTION FLOW',
    workflowTitle: 'From a location of interest to a measurement result',
    workflowBody:
      'The workflow stays short so users can focus on the current data and read results directly in the Viewer.',
    workflow: [
      {
        title: 'Open project data',
        description: 'Select the project and data layer to inspect in the Viewer.',
      },
      {
        title: 'Choose a tool',
        description: 'Select distance, height, area, or section based on the inspection task.',
      },
      {
        title: 'Mark geometry',
        description: 'Select points, a line, or a region directly on the 3D data.',
      },
      {
        title: 'Read the result',
        description: 'Review the measurement in the same project workspace.',
      },
    ],

    valueEyebrow: 'PRACTICAL VALUE',
    valueTitle: 'Bring dimensional checks into the 3D GIS workflow',
    valueBody:
      'Measuring and reviewing sections in the same Viewer preserves the data context during site inspection and project discussions.',
    values: [
      'Measure directly on the Point Cloud being viewed',
      'Compare 2D distance with true 3D distance',
      'Check elevation difference between locations',
      'Draw and read area directly on project data',
      'Use sections to better understand spatial structure',
    ],

    finalTitle: 'Try measurement tools on real 3D project data',
    finalBody:
      'Request a Demo to inspect the measurement tools and see how they work with real project data in SAOLATEK’s 3D GIS platform.',
    footer: 'Point Cloud · Measurement · 3D Analysis',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',

    eyebrow: '平台 · 三维测量与分析',
    heroTitle: '直接在项目三维数据上进行测量',
    heroBody:
      '直接在 Point Cloud 数据上测量二维距离、真实三维距离和高差，并始终在项目的空间背景中查看结果。',
    heroNote:
      '测量结果取决于源数据、所选点位以及 Viewer 中当前打开的项目背景。',
    heroImageAlt:
      '在 Long Phú 火力发电厂项目 Point Cloud 数据上测量二维距离、三维距离和高差',
    heroImageCaption: '距离与高差测量 · 真实项目 Point Cloud',
    heroTags: ['2D', '3D', '高差'],

    measureEyebrow: '测量工具',
    measureTitle: '直接在模型上获取需要检查的尺寸信息',
    measureBody:
      '用户可直接在 Viewer 中选择位置或区域，测量结果保留在同一数据空间中，减少在多个独立工具之间切换。',
    measures: [
      {
        title: '二维 / 三维距离',
        description: '测量所选位置之间的平面距离和真实空间距离。',
      },
      {
        title: '高差',
        description: '检查项目三维数据中所选点之间的高程差。',
      },
      {
        title: '面积',
        description: '直接在数据上绘制区域，以确定需要检查范围的面积。',
      },
    ],
    areaImageAlt: '在 Long Phú 火力发电厂项目 Point Cloud 数据上测量区域面积',
    areaImageCaption: '项目数据面积测量 · 示例中显示 72,447.632 m²',

    analysisEyebrow: '三维分析',
    analysisTitle: '在同一数据背景中检查剖面与高程',
    analysisBody:
      '除基础测量外，还可以通过 Point Cloud 剖面查看所选区域的形状和高程分布。',
    analyses: [
      {
        title: '选择分析范围',
        description: '聚焦相关数据区域，而不是同时查看整个项目。',
      },
      {
        title: '查看剖面',
        description: '以剖面方式查看所选数据，检查建筑或地形形状。',
      },
      {
        title: '读取高程',
        description: '通过剖面坐标轴和高度颜色查看高程变化。',
      },
    ],
    sectionImageAlt: 'Long Phú 火力发电厂项目 Point Cloud 数据的剖面与高程分析',
    sectionImageCaption: 'Point Cloud 剖面 · 形状与高程分布',
    analysisNote:
      '本页面仅描述项目数据中已显示的测量和剖面操作，不将尚未确认的其他高级分析模块描述为现有功能。',

    workflowEyebrow: '操作流程',
    workflowTitle: '从需要检查的位置到测量结果',
    workflowBody:
      '流程保持简洁，使用户能够专注于当前数据，并直接在 Viewer 中读取结果。',
    workflow: [
      {
        title: '打开项目数据',
        description: '在 Viewer 中选择需要检查的项目和数据图层。',
      },
      {
        title: '选择工具',
        description: '按照检查目标选择距离、高差、面积或剖面工具。',
      },
      {
        title: '标记几何位置',
        description: '直接在三维数据上选择点、线或区域。',
      },
      {
        title: '读取结果',
        description: '在同一项目空间中查看测量信息。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '将尺寸检查纳入三维 GIS 工作流程',
    valueBody:
      '在同一 Viewer 中完成测量和剖面检查，可以在现场核查和项目沟通过程中保持完整的数据背景。',
    values: [
      '直接在当前 Point Cloud 数据上测量',
      '对比二维距离与真实三维距离',
      '检查不同位置之间的高差',
      '直接在项目数据上绘制并读取面积',
      '通过剖面更清楚地理解空间结构',
    ],

    finalTitle: '在真实三维项目数据上体验测量工具',
    finalBody:
      '申请演示访问，查看测量工具并了解其如何在 SAOLATEK 三维 GIS 平台的真实项目数据中工作。',
    footer: 'Point Cloud · 测量 · 三维分析',
  },
};

const MEASURE_ICONS = [Ruler, ArrowUpDown, Pentagon] as const;
const ANALYSIS_ICONS = [Focus, ScanLine, Crosshair] as const;
const WORKFLOW_ICONS = [Layers3, MousePointer2, Waypoints, Eye] as const;

export const MeasurementAnalysis3DPage: React.FC = () => {
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
      className="min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)] [--color-accent-ink:var(--color-paper)]"
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
              onClick={demo}
              disabled={isLoading}
              className="inline-flex h-11 w-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-ink)] sm:h-10 md:w-auto md:px-4"
              aria-label={c.demo}
            >
              <span className="hidden md:inline">{c.demo}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1340px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[14ch] text-[38px] font-semibold leading-[1.04] tracking-[-.045em] sm:text-[48px] lg:text-[58px]">
                {c.heroTitle}
              </h1>

              <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <button
                type="button"
                onClick={demo}
                disabled={isLoading}
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
              >
                {c.demo}
                <ArrowRight size={16} />
              </button>

              <p className="mt-4 flex max-w-[620px] gap-2 text-xs leading-5 text-[var(--color-ink-muted)]">
                <MousePointer2 size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                {c.heroNote}
              </p>
            </div>

            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.24)] lg:rounded-[28px]">
                <img
                  src={measurementDistanceImage}
                  alt={c.heroImageAlt}
                  className="aspect-[16/10] w-full object-cover"
                  loading="eager"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="max-w-[70%] text-sm font-semibold leading-5 text-white">
                    {c.heroImageCaption}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {c.heroTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </section>

        {/* MEASUREMENT */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.56fr)_minmax(0,.44fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <figure className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_18px_50px_rgba(0,0,0,.16)]">
              <img
                src={measurementAreaImage}
                alt={c.areaImageAlt}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="border-t border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3 text-xs leading-5 text-[var(--color-ink-muted)]">
                {c.areaImageCaption}
              </figcaption>
            </figure>

            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.measureEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.measureTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.measureBody}
              </p>

              <div className="mt-8 border-y border-[var(--color-border)]">
                {c.measures.map((item, index) => {
                  const Icon = MEASURE_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-b border-[var(--color-border)] py-5 last:border-b-0"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ANALYSIS */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.analysisEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.analysisTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.analysisBody}
              </p>

              <div className="mt-8 space-y-5">
                {c.analyses.map((item, index) => {
                  const Icon = ANALYSIS_ICONS[index];
                  return (
                    <article key={item.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={17} />
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

              <p className="mt-7 border-l-2 border-[var(--color-accent)] pl-4 text-xs leading-5 text-[var(--color-ink-muted)]">
                {c.analysisNote}
              </p>
            </div>

            <figure className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_18px_50px_rgba(0,0,0,.16)]">
              <img
                src={analysisSectionImage}
                alt={c.sectionImageAlt}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="border-t border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 py-3 text-xs leading-5 text-[var(--color-ink-muted)]">
                {c.sectionImageCaption}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[800px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.workflowEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.workflowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.workflowBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-4">
              {c.workflow.map((item, index) => {
                const Icon = WORKFLOW_ICONS[index];
                return (
                  <article key={item.title} className="bg-[var(--color-paper)] px-5 py-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* VALUE */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:gap-16 lg:px-12">
            <div>
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.valueEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.valueTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.valueBody}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {c.values.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 gap-3 text-sm leading-6 text-[var(--color-ink-muted)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-.03em] md:text-[32px]">
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
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
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

export default MeasurementAnalysis3DPage;