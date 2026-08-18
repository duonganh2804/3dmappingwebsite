/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · genre: modern-minimal · macrostructure: Technical editorial · design-system: design.md · designed-as-app */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Crosshair,
  Globe2,
  Layers3,
  MapPinned,
  MousePointer2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import coordinateSurveyImage from '../assets/vn2000-gnss-survey.webp';
import coordinateUavImage from '../assets/vn2000-uav-control.webp';
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
  heroImageTag: string;
  panelTitle: string;
  panelItems: Item[];
  panelNote: string;

  contextEyebrow: string;
  contextTitle: string;
  contextBody: string;
  contextImageAlt: string;
  contextImageCaption: string;
  contexts: Item[];

  systemEyebrow: string;
  systemTitle: string;
  systemBody: string;
  systems: Item[];
  systemNote: string;

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

    eyebrow: 'NỀN TẢNG · VN-2000 & HỆ TỌA ĐỘ',
    heroTitle: 'Đặt dữ liệu khảo sát vào đúng bối cảnh tọa độ',
    heroBody:
      'Mỗi bộ dữ liệu khảo sát đều gắn với một hệ tọa độ và các tham số dự án cụ thể. Việc xác định đúng thông tin này giúp dữ liệu được hiểu và sử dụng đúng vị trí trong môi trường 3D GIS.',
    heroNote:
      'Không mô tả chuyển đổi VN-2000 tự động như một chức năng hoàn chỉnh khi dự án chưa có đủ cấu hình và tham số.',
    heroImageAlt: 'Kỹ thuật viên khảo sát GNSS xác định điểm khống chế tọa độ ngoài hiện trường',
    heroImageCaption: 'Khảo sát GNSS thực tế · Điểm khống chế tọa độ',
    heroImageTag: 'GNSS · VN-2000',
    panelTitle: 'Thông tin tọa độ cần xác nhận',
    panelItems: [
      {
        title: 'Hệ tọa độ',
        description: 'VN-2000, WGS 84 hoặc hệ được cung cấp theo hồ sơ dữ liệu.',
      },
      {
        title: 'Tham số dự án',
        description: 'Múi chiếu, kinh tuyến trục và các tham số liên quan khi có.',
      },
      {
        title: 'Nguồn dữ liệu',
        description: 'UAV, LiDAR hoặc nguồn khảo sát khác của dự án.',
      },
    ],
    panelNote:
      'Chỉ sử dụng dữ liệu sau khi thông tin tọa độ đã được xác nhận phù hợp với hồ sơ dự án.',

    contextEyebrow: 'BỐI CẢNH DỮ LIỆU',
    contextTitle: 'Hệ tọa độ không chỉ là một thông số kỹ thuật',
    contextBody:
      'Thông tin tọa độ quyết định cách dữ liệu được đặt vào không gian dự án. Nếu sai bối cảnh tọa độ, vị trí và phạm vi quan sát có thể không còn đúng với thực tế khảo sát.',
    contextImageAlt: 'Thiết bị UAV đặt trên mốc kiểm soát phục vụ khảo sát bản đồ',
    contextImageCaption: 'UAV và mốc kiểm soát · Chuẩn bị dữ liệu trước khi đưa vào 3D GIS',
    contexts: [
      {
        title: 'Vị trí',
        description: 'Xác định dữ liệu đang đại diện cho khu vực nào trong không gian địa lý.',
      },
      {
        title: 'Phạm vi',
        description: 'Giữ đúng vùng khảo sát khi dữ liệu được đưa vào dự án.',
      },
      {
        title: 'Đối chiếu',
        description: 'Hỗ trợ kiểm tra các lớp dữ liệu trong cùng bối cảnh không gian.',
      },
    ],

    systemEyebrow: 'HỆ TỌA ĐỘ',
    systemTitle: 'VN-2000, WGS 84 và tham số của từng dự án',
    systemBody:
      'Không có một cấu hình tọa độ duy nhất phù hợp cho mọi dự án. Nền tảng cần dựa vào thông tin đi kèm bộ dữ liệu để xác định cách dữ liệu được hiểu và sử dụng.',
    systems: [
      {
        title: 'VN-2000',
        description:
          'Hệ quy chiếu và hệ tọa độ quốc gia Việt Nam, thường gặp trong dữ liệu khảo sát trong nước.',
      },
      {
        title: 'WGS 84',
        description:
          'Hệ tọa độ địa lý phổ biến trong GNSS và nhiều nguồn dữ liệu bản đồ.',
      },
      {
        title: 'Tham số dự án',
        description:
          'Múi chiếu, kinh tuyến trục và các tham số liên quan cần theo đúng hồ sơ của từng dự án.',
      },
    ],
    systemNote:
      'Không giả định tự động chuyển đổi giữa VN-2000 và WGS 84 nếu chưa có cấu hình và tham số phù hợp.',

    workflowEyebrow: 'QUY TRÌNH KIỂM TRA',
    workflowTitle: 'Xác nhận tọa độ trước khi đưa dữ liệu vào không gian 3D GIS',
    workflowBody:
      'Quy trình tập trung vào việc xác nhận nguồn dữ liệu và thông tin tọa độ trước khi sử dụng dữ liệu trong dự án.',
    workflow: [
      {
        title: 'Kiểm tra nguồn dữ liệu',
        description: 'Xác định dữ liệu đến từ UAV, LiDAR hoặc nguồn khảo sát nào.',
      },
      {
        title: 'Xác nhận hệ tọa độ',
        description: 'Đối chiếu VN-2000, WGS 84 hoặc hệ tọa độ được cung cấp.',
      },
      {
        title: 'Xác nhận tham số',
        description: 'Kiểm tra múi chiếu, kinh tuyến trục và thông tin liên quan khi có.',
      },
      {
        title: 'Đưa vào dự án',
        description: 'Sử dụng dữ liệu trong 3D GIS sau khi bối cảnh tọa độ đã rõ.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Giảm rủi ro sai lệch vị trí khi làm việc với dữ liệu khảo sát',
    valueBody:
      'Một quy trình kiểm tra tọa độ rõ ràng giúp dữ liệu nhất quán hơn khi quan sát và đối chiếu trong dự án.',
    values: [
      'Biết rõ dữ liệu đang sử dụng hệ tọa độ nào',
      'Giữ đúng bối cảnh không gian của khu vực khảo sát',
      'Hạn chế nhầm lẫn giữa các nguồn dữ liệu khác nhau',
      'Hỗ trợ kiểm tra vị trí trước khi đối chiếu lớp dữ liệu',
      'Duy trì thông tin tọa độ theo hồ sơ từng dự án',
    ],

    finalTitle: 'Trao đổi cấu hình tọa độ phù hợp với dữ liệu dự án',
    finalBody:
      'Đăng ký Demo để trao đổi với SAOLATEK về dữ liệu, hệ tọa độ và cách tổ chức dự án 3D GIS phù hợp với nhu cầu thực tế.',
    footer: 'UAV · LiDAR · VN-2000 · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',

    eyebrow: 'PLATFORM · VN-2000 & COORDINATE SYSTEMS',
    heroTitle: 'Place survey data in the correct coordinate context',
    heroBody:
      'Every survey dataset is tied to a coordinate reference and project-specific parameters. Identifying them correctly helps the data retain the right location and spatial meaning in a 3D GIS environment.',
    heroNote:
      'Automatic VN-2000 transformation is not presented as a completed feature without the required project configuration and parameters.',
    heroImageAlt: 'Field technician using GNSS equipment to establish a survey control point',
    heroImageCaption: 'Field GNSS survey · Coordinate control point',
    heroImageTag: 'GNSS · VN-2000',
    panelTitle: 'Coordinate information to confirm',
    panelItems: [
      {
        title: 'Coordinate system',
        description: 'VN-2000, WGS 84, or the reference supplied with the project data.',
      },
      {
        title: 'Project parameters',
        description: 'Projection zone, central meridian, and related parameters when available.',
      },
      {
        title: 'Data source',
        description: 'UAV, LiDAR, or another survey source used for the project.',
      },
    ],
    panelNote:
      'Use the data only after its coordinate information has been confirmed against the project documentation.',

    contextEyebrow: 'DATA CONTEXT',
    contextTitle: 'A coordinate system is more than a technical field',
    contextBody:
      'Coordinate information determines how data is positioned in project space. If that context is wrong, the viewed location and extent may no longer match the surveyed area.',
    contextImageAlt: 'UAV positioned on a survey control target before mapping',
    contextImageCaption: 'UAV and control target · Preparing spatial data for 3D GIS',
    contexts: [
      {
        title: 'Location',
        description: 'Identify the geographic area represented by the dataset.',
      },
      {
        title: 'Extent',
        description: 'Preserve the surveyed area when data is added to the project.',
      },
      {
        title: 'Comparison',
        description: 'Support layer comparison within the same spatial context.',
      },
    ],

    systemEyebrow: 'COORDINATE SYSTEMS',
    systemTitle: 'VN-2000, WGS 84, and project-specific parameters',
    systemBody:
      'There is no single coordinate setup that fits every project. The platform should rely on the metadata and documentation supplied with the dataset.',
    systems: [
      {
        title: 'VN-2000',
        description:
          'Vietnam’s national geodetic reference and coordinate system, commonly used in domestic survey data.',
      },
      {
        title: 'WGS 84',
        description:
          'A widely used geographic reference system in GNSS and many mapping data sources.',
      },
      {
        title: 'Project parameters',
        description:
          'Projection zone, central meridian, and related parameters should follow each project’s documentation.',
      },
    ],
    systemNote:
      'Do not assume automatic transformation between VN-2000 and WGS 84 without the required project configuration and parameters.',

    workflowEyebrow: 'CHECKING WORKFLOW',
    workflowTitle: 'Confirm coordinate information before using data in 3D GIS',
    workflowBody:
      'The workflow focuses on verifying the data source and coordinate context before the dataset is used in a project.',
    workflow: [
      {
        title: 'Check the data source',
        description: 'Identify whether the dataset comes from UAV, LiDAR, or another survey source.',
      },
      {
        title: 'Confirm the coordinate system',
        description: 'Review whether the dataset uses VN-2000, WGS 84, or another supplied reference.',
      },
      {
        title: 'Confirm parameters',
        description: 'Check available projection-zone, central-meridian, and related information.',
      },
      {
        title: 'Use it in the project',
        description: 'Place the data in 3D GIS once the coordinate context is established.',
      },
    ],

    valueEyebrow: 'PRACTICAL VALUE',
    valueTitle: 'Reduce location errors when working with survey data',
    valueBody:
      'A clear coordinate-checking process helps keep data more consistent during project viewing and comparison.',
    values: [
      'Know which coordinate system a dataset uses',
      'Preserve the spatial context of the surveyed area',
      'Reduce confusion between different data sources',
      'Support location checks before comparing data layers',
      'Keep coordinate information aligned with each project record',
    ],

    finalTitle: 'Discuss a suitable coordinate setup for your project data',
    finalBody:
      'Request a Demo to discuss your survey data, coordinate system, and an appropriate 3D GIS project setup with SAOLATEK.',
    footer: 'UAV · LiDAR · VN-2000 · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',

    eyebrow: '平台 · VN-2000 与坐标系统',
    heroTitle: '将测绘数据放入正确的坐标背景中',
    heroBody:
      '每个测绘数据集都对应特定的坐标参考和项目参数。正确确认这些信息，有助于数据在三维 GIS 环境中保持正确的位置和空间含义。',
    heroNote:
      '在缺少所需项目配置和参数时，本页面不会将 VN-2000 自动转换描述为已完成的功能。',
    heroImageAlt: '现场技术人员使用 GNSS 设备建立测量控制点',
    heroImageCaption: '现场 GNSS 测量 · 坐标控制点',
    heroImageTag: 'GNSS · VN-2000',
    panelTitle: '需要确认的坐标信息',
    panelItems: [
      {
        title: '坐标系统',
        description: 'VN-2000、WGS 84 或项目数据资料中提供的坐标参考。',
      },
      {
        title: '项目参数',
        description: '投影带、中央经线及已有的相关参数。',
      },
      {
        title: '数据来源',
        description: '项目使用的无人机、LiDAR 或其他测绘来源。',
      },
    ],
    panelNote: '仅在坐标信息与项目资料确认一致后使用数据。',

    contextEyebrow: '数据背景',
    contextTitle: '坐标系统不仅是一个技术字段',
    contextBody:
      '坐标信息决定数据如何放置在项目空间中。如果坐标背景错误，查看的位置和范围可能与实际测区不一致。',
    contextImageAlt: '用于地图测绘的无人机与控制点标靶',
    contextImageCaption: '无人机与控制点 · 三维 GIS 数据准备',
    contexts: [
      {
        title: '位置',
        description: '确认数据所代表的实际地理区域。',
      },
      {
        title: '范围',
        description: '将数据加入项目时保持正确的测区范围。',
      },
      {
        title: '对照',
        description: '在同一空间背景中支持图层对照。',
      },
    ],

    systemEyebrow: '坐标系统',
    systemTitle: 'VN-2000、WGS 84 与项目专用参数',
    systemBody:
      '不存在适用于所有项目的单一坐标配置。平台应以数据集随附的元数据和项目资料为依据。',
    systems: [
      {
        title: 'VN-2000',
        description: '越南国家大地基准和坐标系统，常见于越南境内测绘数据。',
      },
      {
        title: 'WGS 84',
        description: 'GNSS 和多种地图数据来源中广泛使用的地理参考系统。',
      },
      {
        title: '项目参数',
        description: '投影带、中央经线及相关参数应以每个项目的资料为准。',
      },
    ],
    systemNote:
      '在缺少所需项目配置和参数时，不应假设 VN-2000 与 WGS 84 可以自动转换。',

    workflowEyebrow: '检查流程',
    workflowTitle: '在三维 GIS 中使用数据前先确认坐标信息',
    workflowBody:
      '流程重点是先确认数据来源和坐标背景，再将数据用于项目。',
    workflow: [
      {
        title: '检查数据来源',
        description: '确认数据来自无人机、LiDAR 或其他测绘来源。',
      },
      {
        title: '确认坐标系统',
        description: '核对数据采用 VN-2000、WGS 84 或其他提供的坐标参考。',
      },
      {
        title: '确认项目参数',
        description: '检查已有的投影带、中央经线及相关信息。',
      },
      {
        title: '用于项目',
        description: '在坐标背景确认清楚后，将数据用于三维 GIS。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '降低测绘数据使用过程中的位置偏差风险',
    valueBody:
      '清晰的坐标检查流程，有助于在项目查看和数据对照过程中保持更一致的数据背景。',
    values: [
      '明确数据所使用的坐标系统',
      '保持测区正确的空间背景',
      '减少不同数据来源之间的混淆',
      '在对照图层前支持位置检查',
      '按项目资料保留坐标信息',
    ],

    finalTitle: '为项目数据讨论合适的坐标配置',
    finalBody:
      '申请演示，与 SAOLATEK 沟通测绘数据、坐标系统及适合实际需求的三维 GIS 项目配置。',
    footer: 'UAV · LiDAR · VN-2000 · 三维 GIS',
  },
};

const CONTEXT_ICONS = [MapPinned, Crosshair, Layers3] as const;
const SYSTEM_ICONS = [Compass, Globe2, MapPinned] as const;
const WORKFLOW_ICONS = [MousePointer2, Compass, Crosshair, Globe2] as const;

export const CoordinateSystemsPage: React.FC = () => {
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
        <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,color-mix(in_oklch,var(--color-accent)_10%,transparent),transparent_34%)]" />

          <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 sm:py-14 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px]">
                {c.heroTitle}
              </h1>

              <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={demo}
                  disabled={isLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto"
                >
                  {c.demo}
                  <ArrowRight size={16} />
                </button>

                <p className="flex max-w-[410px] gap-2 text-xs leading-5 text-[var(--color-ink-muted)]">
                  <MousePointer2 size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  {c.heroNote}
                </p>
              </div>
            </div>

            <figure className="min-w-0">
              <div className="group relative overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.22)]">
                <img
                  src={coordinateSurveyImage}
                  alt={c.heroImageAlt}
                  className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold tracking-[.08em] text-white backdrop-blur-md sm:right-5 sm:top-5">
                  {c.heroImageTag}
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                  <div className="max-w-[420px]">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-cyan-300">
                      <Crosshair size={13} />
                      Survey control
                    </div>
                    <p className="text-sm font-medium leading-6 text-white sm:text-base">
                      {c.heroImageCaption}
                    </p>
                  </div>
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/35 text-cyan-300 backdrop-blur-md sm:flex">
                    <MapPinned size={20} />
                  </div>
                </figcaption>
              </div>
            </figure>
          </div>

          <div className="relative mx-auto max-w-[1320px] px-5 pb-12 md:px-8 md:pb-16 lg:px-12">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper-2)]">
              <div className="grid grid-cols-1 lg:grid-cols-[240px_repeat(3,minmax(0,1fr))]">
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-5 lg:border-b-0 lg:border-r">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                    <Compass size={19} />
                  </div>
                  <h2 className="text-sm font-semibold leading-5">{c.panelTitle}</h2>
                </div>

                {c.panelItems.map((item, index) => {
                  const Icon = SYSTEM_ICONS[index];
                  return (
                    <div
                      key={item.title}
                      className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 border-b border-[var(--color-border)] px-5 py-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-ink-muted)]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 border-t border-[var(--color-border)] px-5 py-3.5 text-xs leading-5 text-[var(--color-ink-muted)]">
                <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                {c.panelNote}
              </div>
            </div>
          </div>
        </section>

        {/* DATA CONTEXT */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto grid max-w-[1260px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(320px,.42fr)_minmax(0,.58fr)] lg:items-center lg:gap-16 lg:px-12">
            <figure className="relative min-w-0 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-black shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <img
                src={coordinateUavImage}
                alt={c.contextImageAlt}
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-cyan-300">
                  <Layers3 size={13} />
                  UAV mapping
                </div>
                <p className="max-w-[420px] text-sm font-medium leading-6 text-white sm:text-base">
                  {c.contextImageCaption}
                </p>
              </figcaption>
            </figure>

            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.contextEyebrow}
              </div>
              <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.contextTitle}
              </h2>
              <p className="mt-5 max-w-[680px] text-base leading-7 text-[var(--color-ink-muted)]">
                {c.contextBody}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {c.contexts.map((item, index) => {
                  const Icon = CONTEXT_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={18} />
                      </div>
                      <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{item.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* COORDINATE SYSTEMS */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16">
              <div>
                <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                  {c.systemEyebrow}
                </div>
                <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                  {c.systemTitle}
                </h2>
                <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">{c.systemBody}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {c.systems.map((item, index) => {
                  const Icon = SYSTEM_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper-2)] p-5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--color-accent)_36%,var(--color-border))]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={19} />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{item.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-muted)]">
              <Crosshair size={17} className="mt-1 shrink-0 text-[var(--color-accent)]" />
              {c.systemNote}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1260px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[820px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.workflowEyebrow}
              </div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.workflowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">{c.workflowBody}</p>
            </div>

            <div className="relative mt-9 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden border-t border-dashed border-[var(--color-border)] lg:block" />

              {c.workflow.map((item, index) => {
                const Icon = WORKFLOW_ICONS[index];
                return (
                  <article
                    key={item.title}
                    className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-5"
                  >
                    <div className="relative z-10 flex items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                        <Icon size={19} />
                      </div>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* VALUE */}
        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1260px] grid-cols-1 gap-9 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16 lg:px-12">
            <div>
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.valueEyebrow}
              </div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.valueTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--color-ink-muted)]">{c.valueBody}</p>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {c.values.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-muted)]"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                    <Check size={13} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-12 lg:px-12">
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-paper)] px-6 py-8 sm:px-8 md:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color-mix(in_oklch,var(--color-accent)_10%,transparent)] blur-3xl" />
              <div className="relative">
                <h2 className="max-w-[760px] text-[27px] font-semibold leading-tight tracking-[-.03em] md:text-[34px]">
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
                className="relative mt-6 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-accent)] px-6 text-sm font-bold text-[var(--color-accent-ink)] sm:w-auto lg:mt-0"
              >
                {c.demo}
                <ArrowRight size={16} />
              </button>
            </div>
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

export default CoordinateSystemsPage;