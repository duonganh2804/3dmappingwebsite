import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Cloud,
  Image as ImageIcon,
  Layers3,
  MapPinned,
  Mountain,
  Ruler,
  Share2,
  Sprout,
  SquareDashed,
  Workflow,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import agricultureHeroImage from '../assets/agriculture-hero.jpg';
import agricultureOverviewImage from '../assets/agriculture-uav.jpg';

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
  fieldCapture: string;
  uavSurvey: string;
  heroCaption: string;

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flowItems: [CardItem, CardItem, CardItem, CardItem];

  dataEyebrow: string;
  dataTitle: string;
  dataBody: string;
  surveyContext: string;
  overviewCaption: string;
  dataItems: [CardItem, CardItem, CardItem];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measureItems: [CardItem, CardItem, CardItem];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
  workflowLabel: string;
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
    platformLink: 'Xem nền tảng 3D GIS',

    eyebrow: 'GIẢI PHÁP NÔNG NGHIỆP',
    heroTitle1: 'Quan sát khu vực canh tác trong một không gian',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Tổ chức dữ liệu khảo sát UAV thành DOM, mô hình 3D và Point Cloud để quan sát hiện trạng, đo đạc khu vực và chia sẻ project trực tiếp trên trình duyệt.',
    heroTags: ['UAV Mapping', '3D GIS', 'Đo đạc trực tiếp'],
    fieldCapture: 'THU NHẬN DỮ LIỆU',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      'Khảo sát khu vực canh tác và chuẩn bị dữ liệu trước khi đưa vào project Web GIS 3D',

    flowEyebrow: 'QUY TRÌNH DỮ LIỆU',
    flowTitle: 'Từ khảo sát khu vực đến dữ liệu có thể quan sát trên Web GIS',
    flowBody:
      'Quy trình được tổ chức theo project để dữ liệu thu nhận ngoài hiện trường luôn có bối cảnh rõ ràng khi đưa vào Viewer.',
    flowItems: [
      {
        title: 'Khảo sát khu vực',
        body: 'Thu nhận dữ liệu hiện trạng từ UAV và các nguồn khảo sát phù hợp.',
      },
      {
        title: 'Tổ chức dữ liệu',
        body: 'Đưa DOM, 3D Mesh và Point Cloud vào cùng một project Web GIS.',
      },
      {
        title: 'Quan sát & đo đạc',
        body: 'Mở dữ liệu trên trình duyệt, đổi góc nhìn và kiểm tra trực tiếp trên Viewer.',
      },
      {
        title: 'Chia sẻ project',
        body: 'Phân quyền thành viên để cùng theo dõi dữ liệu trong đúng phạm vi dự án.',
      },
    ],

    dataEyebrow: 'DỮ LIỆU TRONG PROJECT',
    dataTitle: 'Một khu vực, nhiều lớp dữ liệu và cùng một bối cảnh không gian',
    dataBody:
      'Người dùng có thể chuyển giữa các lớp dữ liệu tùy theo nội dung cần quan sát mà không phải rời khỏi project.',
    surveyContext: 'BỐI CẢNH KHẢO SÁT',
    overviewCaption: 'Dữ liệu khảo sát được tổ chức thành nhiều lớp trong cùng project',
    dataItems: [
      {
        title: 'Ảnh trực giao DOM',
        body: 'Quan sát mặt bằng khu vực khảo sát theo góc nhìn từ trên xuống và giữ đúng bối cảnh địa lý của dự án.',
      },
      {
        title: 'Mô hình 3D Mesh',
        body: 'Theo dõi địa hình, bề mặt và cấu trúc không gian của khu vực canh tác bằng góc nhìn 3D trực quan.',
      },
      {
        title: 'Point Cloud',
        body: 'Kiểm tra chi tiết dữ liệu không gian tại những vị trí cần quan sát kỹ hơn trong cùng một Viewer.',
      },
    ],

    measureEyebrow: 'ĐO ĐẠC TRÊN VIEWER',
    measureTitle: 'Kiểm tra khu vực trực tiếp trên dữ liệu đang quan sát',
    measureBody:
      'Công cụ đo hỗ trợ kiểm tra nhanh các thông tin không gian cơ bản của vùng khảo sát ngay trên trình duyệt.',
    measureItems: [
      {
        title: 'Diện tích',
        body: 'Khoanh vùng và xác định diện tích khu vực cần kiểm tra.',
      },
      {
        title: 'Khoảng cách',
        body: 'Đo khoảng cách giữa các vị trí ngay trên dữ liệu dự án.',
      },
      {
        title: 'Chênh cao',
        body: 'Kiểm tra khác biệt cao độ giữa các điểm trong không gian 3D.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Giữ dữ liệu khảo sát dễ quan sát và dễ phối hợp trong cùng project',
    valueBody:
      'Web GIS giúp dữ liệu hiện trường không bị tách rời khỏi bối cảnh dự án và cho phép người dùng kiểm tra theo đúng nhu cầu.',
    workflowLabel: 'Workflow trong project',
    valueItems: [
      'Tập trung dữ liệu khảo sát trong cùng một project',
      'Quan sát trực tiếp trên trình duyệt, không cần phần mềm desktop riêng',
      'Chuyển nhanh giữa DOM, 3D Mesh và Point Cloud',
      'Đo đạc ngay trên dữ liệu đang quan sát',
      'Chia sẻ project theo quyền truy cập phù hợp',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      'Trải nghiệm cách dữ liệu khảo sát khu vực canh tác được tổ chức trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem trực tiếp cách dữ liệu được hiển thị, đo đạc và quản lý trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'UAV · Agriculture · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    platformLink: 'View 3D GIS platform',

    eyebrow: 'AGRICULTURE SOLUTION',
    heroTitle1: 'Monitor agricultural areas inside a',
    heroTitle2: '3D Web GIS workspace',
    heroBody:
      'Organize UAV survey data into orthophotos, 3D models and Point Cloud layers to inspect site conditions, measure areas and share projects directly in the browser.',
    heroTags: ['UAV Mapping', '3D GIS', 'Browser Measurement'],
    fieldCapture: 'FIELD DATA CAPTURE',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      'Survey agricultural areas and prepare data before loading it into a 3D Web GIS project',

    flowEyebrow: 'DATA WORKFLOW',
    flowTitle: 'From field survey to data that can be inspected in Web GIS',
    flowBody:
      'The workflow is organized by project so field data keeps clear spatial context when it enters the Viewer.',
    flowItems: [
      {
        title: 'Survey the area',
        body: 'Capture current-condition data using UAV and other suitable survey sources.',
      },
      {
        title: 'Organize data',
        body: 'Bring orthophotos, 3D Mesh and Point Cloud into the same Web GIS project.',
      },
      {
        title: 'Inspect & measure',
        body: 'Open data in the browser, switch viewpoints and inspect it directly in the Viewer.',
      },
      {
        title: 'Share the project',
        body: 'Assign member permissions so teams can access the correct project scope.',
      },
    ],

    dataEyebrow: 'PROJECT DATA',
    dataTitle: 'One area, multiple data layers and one shared spatial context',
    dataBody:
      'Users can switch between project layers according to the inspection task without leaving the project.',
    surveyContext: 'SURVEY CONTEXT',
    overviewCaption: 'Survey data is organized into multiple layers inside one project',
    dataItems: [
      {
        title: 'Orthophoto / DOM',
        body: 'Inspect the surveyed area from a top-down view while preserving the project geographic context.',
      },
      {
        title: '3D Mesh',
        body: 'Review terrain, surface conditions and spatial structure of the agricultural area in 3D.',
      },
      {
        title: 'Point Cloud',
        body: 'Inspect detailed spatial data at locations that require a closer look in the same Viewer.',
      },
    ],

    measureEyebrow: 'MEASUREMENT IN VIEWER',
    measureTitle: 'Check agricultural areas directly on the data being viewed',
    measureBody:
      'Measurement tools provide quick checks of key spatial information for the surveyed area directly in the browser.',
    measureItems: [
      {
        title: 'Area',
        body: 'Draw a region and calculate the area that needs to be checked.',
      },
      {
        title: 'Distance',
        body: 'Measure distances between positions directly on project data.',
      },
      {
        title: 'Elevation difference',
        body: 'Check elevation differences between points in the 3D workspace.',
      },
    ],

    valueEyebrow: 'OPERATIONAL VALUE',
    valueTitle: 'Keep survey data easy to inspect and coordinate inside one project',
    valueBody:
      'Web GIS keeps field data connected to project context and lets users inspect information according to their operational needs.',
    workflowLabel: 'Project workflow',
    valueItems: [
      'Survey data centralized in one project',
      'Browser-based viewing without separate desktop software',
      'Fast switching between orthophoto, 3D Mesh and Point Cloud',
      'Measurements directly on displayed data',
      'Project sharing with appropriate access permissions',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      'Experience how agricultural survey data is organized inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and see how data is visualized, measured and managed directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'UAV · Agriculture · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    platformLink: '查看 3D GIS 平台',

    eyebrow: '农业解决方案',
    heroTitle1: '在一个空间中查看农业区域',
    heroTitle2: '3D Web GIS',
    heroBody:
      '将无人机测绘数据组织为正射影像、3D 模型和点云，用于查看现场情况、测量区域，并直接在浏览器中共享项目。',
    heroTags: ['UAV Mapping', '3D GIS', '在线测量'],
    fieldCapture: '现场数据采集',
    uavSurvey: 'UAV SURVEY',
    heroCaption:
      '对农业区域进行测绘，并在数据进入 3D Web GIS 项目之前完成准备',

    flowEyebrow: '数据流程',
    flowTitle: '从现场测绘到可在 Web GIS 中查看的数据',
    flowBody:
      '工作流程按项目组织，使现场采集的数据进入 Viewer 后仍保持清晰的空间背景。',
    flowItems: [
      {
        title: '区域测绘',
        body: '通过无人机和其他合适的数据源采集现场现状数据。',
      },
      {
        title: '组织数据',
        body: '将正射影像、3D Mesh 和点云集中到同一个 Web GIS 项目。',
      },
      {
        title: '查看与测量',
        body: '直接在浏览器中打开数据、切换视角并在 Viewer 中进行检查。',
      },
      {
        title: '共享项目',
        body: '根据项目范围为成员分配适当的访问权限。',
      },
    ],

    dataEyebrow: '项目数据',
    dataTitle: '一个区域、多种数据图层、统一的空间背景',
    dataBody:
      '用户可以根据检查目标在不同图层之间切换，而无需离开当前项目。',
    surveyContext: '测绘背景',
    overviewCaption: '测绘数据在同一个项目中被组织为多个图层',
    dataItems: [
      {
        title: '正射影像 DOM',
        body: '通过自上而下的视角查看测绘区域，并保持正确的项目地理背景。',
      },
      {
        title: '3D Mesh 模型',
        body: '通过 3D 视图查看农业区域的地形、表面和空间结构。',
      },
      {
        title: 'Point Cloud 点云',
        body: '在同一个 Viewer 中检查需要更详细查看位置的空间数据。',
      },
    ],

    measureEyebrow: 'VIEWER 中的测量',
    measureTitle: '直接在当前数据上检查农业区域',
    measureBody:
      '测量工具可以直接在浏览器中快速检查测绘区域的重要空间信息。',
    measureItems: [
      {
        title: '面积',
        body: '框选需要检查的区域并计算其面积。',
      },
      {
        title: '距离',
        body: '直接在项目数据上测量不同位置之间的距离。',
      },
      {
        title: '高程差',
        body: '检查 3D 空间中不同点之间的高程差。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '让测绘数据在同一项目中更容易查看和协同',
    valueBody:
      'Web GIS 让现场数据与项目背景保持连接，并允许用户根据实际需求查看和检查数据。',
    workflowLabel: '项目工作流程',
    valueItems: [
      '测绘数据集中在同一个项目中',
      '直接在浏览器中查看，无需独立桌面软件',
      '快速切换正射影像、3D Mesh 和点云',
      '直接在当前显示的数据上测量',
      '按适当的访问权限共享项目',
    ],

    finalEyebrow: 'AGRICULTURE · WEB GIS 3D',
    finalTitle:
      '体验农业测绘数据如何在 3D GIS 项目中进行组织',
    finalBody:
      '申请演示以打开示例项目，并查看数据如何直接在浏览器中显示、测量和管理。',
    finalButton: '打开演示',
    footer: 'UAV · Agriculture · 3D GIS',
  },
};

const DATA_ICONS = [ImageIcon, Box, Cloud] as const;
const MEASURE_ICONS = [SquareDashed, Ruler, Mountain] as const;

export const AgricultureSolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const c = COPY[currentLang];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050914] font-sans text-white selection:bg-emerald-400/30">
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-[#04110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              <span className="hidden sm:inline">{c.demo}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,.12),transparent_34%),radial-gradient(circle_at_86%_70%,rgba(14,165,233,.08),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.44fr)_minmax(0,.56fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold tracking-[.14em] text-emerald-300">
                <Sprout size={14} />
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px]">
                {c.heroTitle1}
                <span className="block text-emerald-400">{c.heroTitle2}</span>
              </h1>

              <p className="mt-6 max-w-[60ch] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 text-sm font-bold text-[#04110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <Check size={14} className="shrink-0 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <figure className="min-w-0">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_26px_80px_rgba(0,0,0,.34)]">
                <img
                  src={agricultureHeroImage}
                  alt={c.fieldCapture}
                  className="aspect-[16/11] w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-emerald-300 backdrop-blur">
                  {c.fieldCapture}
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.14em] text-emerald-300">
                    <MapPinned size={13} />
                    {c.uavSurvey}
                  </div>
                  <p className="max-w-[520px] text-sm font-medium leading-6 text-white sm:text-base">
                    {c.heroCaption}
                  </p>
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[820px]">
              <div className="text-xs font-bold tracking-[.16em] text-emerald-400">
                {c.flowEyebrow}
              </div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.flowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.flowBody}</p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {c.flowItems.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-[#09131f] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/25"
                >
                  <div className="text-[11px] font-bold tracking-[.16em] text-emerald-400">
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
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.56fr)_minmax(0,.44fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <img
                  src={agricultureOverviewImage}
                  alt={c.surveyContext}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-[.14em] text-emerald-300">
                      {c.surveyContext}
                    </div>
                    <p className="mt-1 text-sm font-medium text-white">
                      {c.overviewCaption}
                    </p>
                  </div>
                  <span className="hidden rounded-xl border border-white/15 bg-black/40 p-3 text-emerald-300 backdrop-blur sm:flex">
                    <Layers3 size={18} />
                  </span>
                </div>
              </div>
            </figure>

            <div>
              <div className="text-xs font-bold tracking-[.16em] text-emerald-400">
                {c.dataEyebrow}
              </div>
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
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
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
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-14">
              <div>
                <div className="text-xs font-bold tracking-[.16em] text-sky-400">
                  {c.measureEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                  {c.measureTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-400">{c.measureBody}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {c.measureItems.map((item, index) => {
                  const Icon = MEASURE_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-[#09131f] p-5 transition hover:border-emerald-300/25"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                        <Icon size={19} />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-14 lg:px-12">
            <div>
              <div className="text-xs font-bold tracking-[.16em] text-emerald-400">
                {c.valueEyebrow}
              </div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.valueTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.valueBody}</p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#09131f]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Workflow size={17} className="text-emerald-400" />
                  {c.workflowLabel}
                </div>
                <span className="text-[10px] font-bold tracking-[.12em] text-slate-500">
                  WEB GIS 3D
                </span>
              </div>

              <ul className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2">
                {c.valueItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 bg-[#09131f] px-5 py-5 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Check size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#07101c]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,.13),transparent_42%)]" />

          <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 gap-7 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-emerald-400">
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
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 text-sm font-bold text-[#04110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

export default AgricultureSolutionPage;