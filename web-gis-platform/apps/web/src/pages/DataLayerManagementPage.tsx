import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  MousePointer2,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import publicSurveyImage from '../assets/IMG_1074.jpg';
import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

type Item = {
  title: string;
  description: string;
};

type LayerId = 'pointCloud' | 'mesh' | 'dom';

type DemoLayer = {
  id: LayerId;
  visible: boolean;
  opacity: number;
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
  heroCaption: string;
  heroBadge: string;

  layerEyebrow: string;
  layerTitle: string;
  layerBody: string;
  layers: Item[];

  interactiveEyebrow: string;
  interactiveTitle: string;
  interactiveBody: string;
  interactiveNote: string;
  panelTitle: string;
  visibleLabel: string;
  opacityLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  resetLabel: string;
  layerNames: Record<LayerId, string>;
  layerMeta: Record<LayerId, string>;

  controlEyebrow: string;
  controlTitle: string;
  controlBody: string;
  controls: Item[];

  flowEyebrow: string;
  flowTitle: string;
  flowBody: string;
  flow: Item[];

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

    eyebrow: 'NỀN TẢNG · QUẢN LÝ LỚP DỮ LIỆU',
    heroTitle: 'Quản lý nhiều lớp dữ liệu trong cùng một không gian 3D GIS',
    heroBody:
      'Tổ chức dữ liệu khảo sát theo từng lớp để người dùng có thể bật, tắt, điều chỉnh độ trong suốt và thay đổi thứ tự quan sát mà vẫn giữ nguyên bối cảnh không gian của dự án.',
    heroNote:
      'Ảnh minh họa sử dụng từ thư mục PUBLIC; phần điều khiển lớp bên dưới là mô phỏng tương tác front-end để minh họa luồng sử dụng.',
    heroImageAlt: 'Đội khảo sát và thiết bị UAV trong quá trình thu thập dữ liệu hiện trường',
    heroCaption: 'Thu thập dữ liệu hiện trường · UAV Survey',
    heroBadge: 'PUBLIC DATA',

    layerEyebrow: 'LỚP DỮ LIỆU',
    layerTitle: 'Các lớp thường gặp trong một dự án 3D Mapping',
    layerBody:
      'Tùy dữ liệu dự án, Viewer có thể tập trung nhiều lớp vào cùng một không gian để người dùng chuyển đổi góc nhìn mà không rời khỏi khu vực đang kiểm tra.',
    layers: [
      {
        title: 'Point Cloud',
        description:
          'Dữ liệu điểm 3D từ khảo sát LiDAR hoặc quy trình xử lý ảnh, phù hợp để kiểm tra cấu trúc không gian và cao độ.',
      },
      {
        title: '3D Mesh',
        description:
          'Mô hình bề mặt có texture giúp quan sát hình dạng công trình, địa hình và hiện trạng trực quan hơn.',
      },
      {
        title: 'Ảnh DOM',
        description:
          'Ảnh trực giao phục vụ đối chiếu mặt bằng, vị trí và ranh giới trong cùng bối cảnh dự án.',
      },
    ],

    interactiveEyebrow: 'MINH HỌA TƯƠNG TÁC',
    interactiveTitle: 'Bật / tắt, điều chỉnh opacity và sắp xếp thứ tự lớp',
    interactiveBody:
      'Thử trực tiếp panel bên phải. Mỗi thay đổi sẽ cập nhật phần minh họa ngay trên ảnh mà không tải lại trang.',
    interactiveNote:
      'Đây là mô phỏng giao diện quản lý lớp trên trang giới thiệu, không thay thế engine Cesium/Viewer thật. Khi tích hợp vào Viewer, cùng trạng thái này có thể được nối với visibility, alpha và layer order của dữ liệu thực.',
    panelTitle: 'Lớp dữ liệu',
    visibleLabel: 'Hiển thị',
    opacityLabel: 'Độ trong suốt',
    moveUpLabel: 'Đưa lớp lên trên',
    moveDownLabel: 'Đưa lớp xuống dưới',
    resetLabel: 'Đặt lại',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'Ảnh DOM',
    },
    layerMeta: {
      pointCloud: 'Mô phỏng lớp điểm 3D',
      mesh: 'Mô phỏng lớp bề mặt',
      dom: 'Ảnh UAV / orthophoto',
    },

    controlEyebrow: 'KIỂM SOÁT HIỂN THỊ',
    controlTitle: 'Giữ quyền kiểm soát dữ liệu ngay trong Viewer',
    controlBody:
      'Thao tác lớp tập trung vào những việc người dùng thực sự cần khi kiểm tra dự án: nhìn đúng dữ liệu, đúng thứ tự và đúng mức độ hiển thị.',
    controls: [
      {
        title: 'Bật / tắt lớp',
        description:
          'Tạm ẩn lớp không cần thiết để giảm nhiễu và tập trung vào nội dung đang kiểm tra.',
      },
      {
        title: 'Điều chỉnh opacity',
        description:
          'Giảm độ đậm của lớp phía trên để đối chiếu dữ liệu với lớp nằm bên dưới.',
      },
      {
        title: 'Thay đổi thứ tự',
        description:
          'Đưa lớp lên hoặc xuống để kiểm soát thứ tự hiển thị trong bối cảnh dự án.',
      },
    ],

    flowEyebrow: 'LUỒNG THAO TÁC',
    flowTitle: 'Từ mở project đến lớp dữ liệu cần kiểm tra',
    flowBody:
      'Một luồng ngắn để người dùng nhanh chóng tập trung vào dữ liệu phù hợp với công việc hiện tại.',
    flow: [
      {
        title: 'Mở project',
        description: 'Truy cập đúng dự án và khu vực cần quan sát.',
      },
      {
        title: 'Chọn lớp',
        description: 'Xác định Point Cloud, 3D Mesh hoặc DOM cần sử dụng.',
      },
      {
        title: 'Tinh chỉnh hiển thị',
        description: 'Bật/tắt, thay đổi opacity và thứ tự lớp theo mục tiêu kiểm tra.',
      },
      {
        title: 'Đối chiếu dữ liệu',
        description: 'Quan sát cùng một khu vực trong bối cảnh không gian không đổi.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Tập trung dữ liệu dự án trong một không gian quan sát',
    valueBody:
      'Quản lý theo lớp giúp người dùng giảm nhiễu thị giác, đối chiếu dữ liệu nhanh hơn và duy trì đúng vị trí khi chuyển giữa các nguồn dữ liệu.',
    values: [
      'Tập trung đúng lớp dữ liệu cần kiểm tra',
      'Giảm nhiễu khi nhiều lớp cùng tồn tại',
      'Đối chiếu Point Cloud, 3D Mesh và DOM',
      'Điều chỉnh mức hiển thị mà không đổi vị trí quan sát',
      'Duy trì một workflow trực tiếp trên trình duyệt',
    ],

    finalTitle: 'Trải nghiệm quản lý lớp dữ liệu trong 3D GIS',
    finalBody:
      'Đăng ký Demo để xem cách SAOLATEK tổ chức, hiển thị và đối chiếu các lớp dữ liệu khảo sát trong một project thực tế.',
    footer: 'UAV · LiDAR · Data Layers · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',

    eyebrow: 'PLATFORM · DATA LAYER MANAGEMENT',
    heroTitle: 'Manage multiple data layers in one 3D GIS workspace',
    heroBody:
      'Organize survey data by layer so users can show, hide, adjust opacity, and change visual order while preserving the spatial context of the project.',
    heroNote:
      'The image comes from the PUBLIC folder; the layer controls below are an interactive front-end simulation of the workflow.',
    heroImageAlt: 'Survey team and UAV equipment during field data collection',
    heroCaption: 'Field data collection · UAV Survey',
    heroBadge: 'PUBLIC DATA',

    layerEyebrow: 'DATA LAYERS',
    layerTitle: 'Common layers in a 3D Mapping project',
    layerBody:
      'Depending on project data, the Viewer can bring multiple layers into one workspace so users can change the view without leaving the area under inspection.',
    layers: [
      {
        title: 'Point Cloud',
        description:
          '3D point data from LiDAR or photogrammetry workflows for reviewing spatial structure and elevation.',
      },
      {
        title: '3D Mesh',
        description:
          'A textured surface model that makes structures, terrain, and current site conditions easier to interpret.',
      },
      {
        title: 'DOM Imagery',
        description:
          'Orthophoto imagery for comparing plan view, location, and boundaries within the same project context.',
      },
    ],

    interactiveEyebrow: 'INTERACTIVE PREVIEW',
    interactiveTitle: 'Toggle visibility, adjust opacity, and reorder layers',
    interactiveBody:
      'Use the panel on the right. Each change updates the visualization immediately without reloading the page.',
    interactiveNote:
      'This is a marketing-page simulation of layer controls, not the live Cesium/Viewer engine. In the Viewer, the same state can be connected to real visibility, alpha, and layer-order controls.',
    panelTitle: 'Data layers',
    visibleLabel: 'Visible',
    opacityLabel: 'Opacity',
    moveUpLabel: 'Move layer up',
    moveDownLabel: 'Move layer down',
    resetLabel: 'Reset',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'DOM Imagery',
    },
    layerMeta: {
      pointCloud: '3D point overlay simulation',
      mesh: 'Surface overlay simulation',
      dom: 'UAV / orthophoto image',
    },

    controlEyebrow: 'VISIBILITY CONTROL',
    controlTitle: 'Keep control of project data inside the Viewer',
    controlBody:
      'Layer controls focus on practical inspection tasks: showing the right data, in the right order, with the right visual intensity.',
    controls: [
      {
        title: 'Show / hide layers',
        description:
          'Temporarily hide unnecessary layers to reduce clutter and focus on the current inspection task.',
      },
      {
        title: 'Adjust opacity',
        description:
          'Reduce the intensity of an upper layer so the data below can remain visible for comparison.',
      },
      {
        title: 'Change layer order',
        description:
          'Move a layer up or down to control its visual priority in the project context.',
      },
    ],

    flowEyebrow: 'WORKFLOW',
    flowTitle: 'From opening a project to the layer you need',
    flowBody:
      'A short workflow for quickly focusing on the data that matches the current inspection task.',
    flow: [
      {
        title: 'Open the project',
        description: 'Access the correct project and the area that needs inspection.',
      },
      {
        title: 'Choose a layer',
        description: 'Identify the Point Cloud, 3D Mesh, or DOM layer you need.',
      },
      {
        title: 'Tune visibility',
        description: 'Toggle visibility, change opacity, and adjust layer order.',
      },
      {
        title: 'Compare data',
        description: 'Review the same area without losing its spatial context.',
      },
    ],

    valueEyebrow: 'PRACTICAL VALUE',
    valueTitle: 'Keep project data together in one viewing workspace',
    valueBody:
      'Layer-based management reduces visual clutter, speeds up comparison, and preserves location while switching between data sources.',
    values: [
      'Focus on the layer relevant to the current task',
      'Reduce clutter when several layers exist',
      'Compare Point Cloud, 3D Mesh, and DOM',
      'Adjust visibility without changing camera context',
      'Keep the workflow directly in the browser',
    ],

    finalTitle: 'Explore data-layer management in 3D GIS',
    finalBody:
      'Request a Demo to see how SAOLATEK organizes, displays, and compares survey-data layers in a real project.',
    footer: 'UAV · LiDAR · Data Layers · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',

    eyebrow: '平台 · 数据图层管理',
    heroTitle: '在同一三维 GIS 空间中管理多个数据图层',
    heroBody:
      '按图层组织测绘数据，使用户能够显示、隐藏、调整透明度和改变显示顺序，同时保持项目的空间背景。',
    heroNote:
      '页面使用 PUBLIC 文件夹中的图片；下方图层控制是用于说明工作流程的前端交互模拟。',
    heroImageAlt: '外业数据采集过程中的测绘团队和 UAV 设备',
    heroCaption: '外业数据采集 · UAV Survey',
    heroBadge: 'PUBLIC DATA',

    layerEyebrow: '数据图层',
    layerTitle: '三维建图项目中的常见数据图层',
    layerBody:
      '根据项目数据情况，Viewer 可将多个图层集中到同一空间中，使用户在检查区域时无需离开当前位置。',
    layers: [
      {
        title: 'Point Cloud',
        description: '来自 LiDAR 或摄影测量流程的三维点数据，用于检查空间结构和高程。',
      },
      {
        title: '3D Mesh',
        description: '带纹理的表面模型，便于理解建筑、地形和现场现状。',
      },
      {
        title: 'DOM 影像',
        description: '用于对照平面、位置和边界关系的正射影像。',
      },
    ],

    interactiveEyebrow: '交互预览',
    interactiveTitle: '控制显示、透明度和图层顺序',
    interactiveBody: '使用右侧面板。每次修改都会立即更新图像显示，无需重新加载页面。',
    interactiveNote:
      '这是官网页面中的图层控制模拟，并非实时 Cesium/Viewer 引擎。在实际 Viewer 中，可将同样的状态连接到真实图层的 visibility、alpha 和顺序。',
    panelTitle: '数据图层',
    visibleLabel: '显示',
    opacityLabel: '透明度',
    moveUpLabel: '上移图层',
    moveDownLabel: '下移图层',
    resetLabel: '重置',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'DOM 影像',
    },
    layerMeta: {
      pointCloud: '三维点覆盖模拟',
      mesh: '表面覆盖模拟',
      dom: 'UAV / 正射影像',
    },

    controlEyebrow: '显示控制',
    controlTitle: '直接在 Viewer 中控制项目数据',
    controlBody:
      '图层控制围绕实际检查任务：显示正确的数据、正确的顺序以及合适的可视强度。',
    controls: [
      {
        title: '显示 / 隐藏图层',
        description: '暂时隐藏不需要的图层，减少视觉干扰并聚焦当前任务。',
      },
      {
        title: '调整透明度',
        description: '降低上层数据的显示强度，以便同时查看下方数据进行对照。',
      },
      {
        title: '调整图层顺序',
        description: '上移或下移图层，控制其在项目中的显示优先级。',
      },
    ],

    flowEyebrow: '操作流程',
    flowTitle: '从打开项目到定位所需图层',
    flowBody: '通过简短流程快速聚焦与当前检查任务匹配的数据。',
    flow: [
      {
        title: '打开项目',
        description: '进入正确的项目和需要检查的区域。',
      },
      {
        title: '选择图层',
        description: '选择需要使用的 Point Cloud、3D Mesh 或 DOM。',
      },
      {
        title: '调整显示',
        description: '控制显示状态、透明度和图层顺序。',
      },
      {
        title: '对照数据',
        description: '在保持空间背景的情况下检查同一区域。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '在同一查看空间中集中项目数据',
    valueBody:
      '按图层管理可以减少视觉干扰、提高对照效率，并在切换数据源时保持当前位置。',
    values: [
      '聚焦当前任务需要的数据图层',
      '在多个图层存在时减少视觉干扰',
      '对照 Point Cloud、3D Mesh 和 DOM',
      '调整显示状态时保持相机位置',
      '直接在浏览器中完成查看流程',
    ],

    finalTitle: '体验三维 GIS 数据图层管理',
    finalBody: '申请演示访问，了解 SAOLATEK 如何在真实项目中组织、显示并对照测绘数据图层。',
    footer: 'UAV · LiDAR · Data Layers · 三维 GIS',
  },
};

const LAYER_ICONS = [Cloud, Box, ImageIcon] as const;
const CONTROL_ICONS = [Eye, SlidersHorizontal, Layers3] as const;
const FLOW_ICONS = [MousePointer2, Layers3, SlidersHorizontal, ScanLine] as const;

const INITIAL_LAYERS: DemoLayer[] = [
  { id: 'pointCloud', visible: true, opacity: 78 },
  { id: 'mesh', visible: true, opacity: 44 },
  { id: 'dom', visible: true, opacity: 100 },
];

const layerIcon = (id: LayerId) => {
  if (id === 'pointCloud') return Cloud;
  if (id === 'mesh') return Box;
  return ImageIcon;
};

export const DataLayerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { isAuthenticated, isLoading } = useAuthStore();
  const c = COPY[currentLang];

  const [demoLayers, setDemoLayers] = React.useState<DemoLayer[]>(INITIAL_LAYERS);

  const demo = () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/book-demo' } });
      return;
    }

    navigate('/book-demo');
  };

  const toggleLayer = (id: LayerId) => {
    setDemoLayers((layers) =>
      layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  const setLayerOpacity = (id: LayerId, opacity: number) => {
    setDemoLayers((layers) =>
      layers.map((layer) => (layer.id === id ? { ...layer, opacity } : layer)),
    );
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    setDemoLayers((layers) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= layers.length) return layers;

      const next = [...layers];
      const [current] = next.splice(index, 1);
      next.splice(nextIndex, 0, current);
      return next;
    });
  };

  const resetLayers = () => {
    setDemoLayers(INITIAL_LAYERS);
  };

  const getLayer = (id: LayerId) =>
    demoLayers.find((layer) => layer.id === id) ??
    INITIAL_LAYERS.find((layer) => layer.id === id)!;

  const domLayer = getLayer('dom');
  const meshLayer = getLayer('mesh');
  const pointCloudLayer = getLayer('pointCloud');

  return (
    <div
      lang={currentLang}
      className="min-h-screen overflow-x-clip bg-[var(--color-paper)] text-[var(--color-ink)] [--color-accent-ink:var(--color-paper)] [&_button]:transition-opacity [&_button:hover]:opacity-90 [&_button:active]:opacity-75 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-[var(--color-accent)]"
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
        <section className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="mx-auto grid max-w-[1340px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[16ch] text-[38px] font-semibold leading-[1.04] tracking-[-.045em] sm:text-[48px] lg:text-[58px]">
                {c.heroTitle}
              </h1>

              <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg sm:leading-8">
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
              <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,.22)] lg:rounded-[28px]">
                <img
                  src={publicSurveyImage}
                  alt={c.heroImageAlt}
                  className="aspect-[16/10] w-full object-cover"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                  <figcaption className="max-w-[72%] text-sm font-semibold leading-5 text-white">
                    {c.heroCaption}
                  </figcaption>
                  <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-bold tracking-[.08em] text-white backdrop-blur">
                    {c.heroBadge}
                  </span>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[760px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.layerEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.layerTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.layerBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
              {c.layers.map((item, index) => {
                const Icon = LAYER_ICONS[index];
                return (
                  <article key={item.title} className="bg-[var(--color-paper)] p-6 md:p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--color-border)] bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1340px] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
            <div className="max-w-[820px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.interactiveEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.interactiveTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.interactiveBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper-2)] shadow-[0_20px_60px_rgba(0,0,0,.12)] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
              <div className="relative min-h-[420px] overflow-hidden bg-black sm:min-h-[500px]">
                <img
                  src={publicSurveyImage}
                  alt={c.heroImageAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    opacity: domLayer.visible ? Math.max(domLayer.opacity / 100, 0.08) : 0.08,
                    filter: domLayer.visible ? 'none' : 'grayscale(1) brightness(.45)',
                  }}
                />

                {meshLayer.visible && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      opacity: meshLayer.opacity / 100,
                      backgroundImage:
                        'linear-gradient(28deg, transparent 0 36%, rgba(0,229,255,.28) 36.5% 37%, transparent 37.5% 68%, rgba(0,229,255,.20) 68.5% 69%, transparent 69.5%), linear-gradient(152deg, transparent 0 42%, rgba(24,196,255,.22) 42.5% 43%, transparent 43.5% 74%, rgba(24,196,255,.18) 74.5% 75%, transparent 75.5%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                )}

                {pointCloudLayer.visible && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      opacity: pointCloudLayer.opacity / 100,
                      backgroundImage:
                        'radial-gradient(circle, rgba(61,230,255,.95) 0 1.1px, transparent 1.35px)',
                      backgroundSize: '17px 17px',
                      mixBlendMode: 'screen',
                      WebkitMaskImage:
                        'linear-gradient(to bottom right, transparent 0%, black 18%, black 82%, transparent 100%)',
                      maskImage:
                        'linear-gradient(to bottom right, transparent 0%, black 18%, black 82%, transparent 100%)',
                    }}
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {demoLayers
                    .filter((layer) => layer.visible)
                    .map((layer) => (
                      <span
                        key={layer.id}
                        className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                      >
                        {c.layerNames[layer.id]} · {layer.opacity}%
                      </span>
                    ))}
                </div>

                <div className="absolute bottom-4 left-4 rounded-xl border border-white/15 bg-black/55 px-4 py-3 text-xs leading-5 text-white/90 backdrop-blur">
                  UAV · 3D GIS · Layer preview
                </div>
              </div>

              <aside className="border-t border-[var(--color-border)] bg-[var(--color-paper)] p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold tracking-[.12em] text-[var(--color-accent)]">
                      LAYERS
                    </div>
                    <h3 className="mt-1 text-xl font-semibold">{c.panelTitle}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={resetLayers}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-2)] px-3 text-xs font-semibold text-[var(--color-ink-muted)]"
                  >
                    <RotateCcw size={14} />
                    {c.resetLabel}
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {demoLayers.map((layer, index) => {
                    const Icon = layerIcon(layer.id);

                    return (
                      <article
                        key={layer.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-2)] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical
                            size={16}
                            className="mt-2 shrink-0 text-[var(--color-ink-muted)]"
                            aria-hidden="true"
                          />

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                            <Icon size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-semibold">
                                  {c.layerNames[layer.id]}
                                </h4>
                                <p className="mt-1 text-xs leading-5 text-[var(--color-ink-muted)]">
                                  {c.layerMeta[layer.id]}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleLayer(layer.id)}
                                aria-pressed={layer.visible}
                                aria-label={`${c.visibleLabel}: ${c.layerNames[layer.id]}`}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                                  layer.visible
                                    ? 'border-[var(--color-accent)] bg-[var(--color-paper-3)] text-[var(--color-accent)]'
                                    : 'border-[var(--color-border)] text-[var(--color-ink-muted)]'
                                }`}
                              >
                                {layer.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                              </button>
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                <span className="text-[var(--color-ink-muted)]">
                                  {c.opacityLabel}
                                </span>
                                <span className="font-semibold">{layer.opacity}%</span>
                              </div>

                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={layer.opacity}
                                disabled={!layer.visible}
                                onChange={(event) =>
                                  setLayerOpacity(layer.id, Number(event.target.value))
                                }
                                className="w-full accent-[var(--color-accent)] disabled:opacity-35"
                                aria-label={`${c.opacityLabel}: ${c.layerNames[layer.id]}`}
                              />
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moveLayer(index, -1)}
                                disabled={index === 0}
                                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink-muted)]"
                                aria-label={`${c.moveUpLabel}: ${c.layerNames[layer.id]}`}
                              >
                                <ChevronUp size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => moveLayer(index, 1)}
                                disabled={index === demoLayers.length - 1}
                                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-xs font-semibold text-[var(--color-ink-muted)]"
                                aria-label={`${c.moveDownLabel}: ${c.layerNames[layer.id]}`}
                              >
                                <ChevronDown size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </aside>
            </div>

            <p className="mt-4 max-w-[900px] text-xs leading-5 text-[var(--color-ink-muted)]">
              {c.interactiveNote}
            </p>
          </div>
        </section>

        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[760px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.controlEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.controlTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.controlBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-3">
              {c.controls.map((item, index) => {
                const Icon = CONTROL_ICONS[index];

                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-paper-3)] text-[var(--color-accent)]">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-paper)]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[780px]">
              <div className="text-xs font-semibold tracking-[.14em] text-[var(--color-accent)]">
                {c.flowEyebrow}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-.03em] md:text-[36px]">
                {c.flowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
                {c.flowBody}
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-4">
              {c.flow.map((item, index) => {
                const Icon = FLOW_ICONS[index];

                return (
                  <article key={item.title} className="bg-[var(--color-paper-2)] p-6">
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

        <section className="border-t border-[var(--color-border)] bg-[var(--color-paper)]">
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

        <section className="bg-[var(--color-paper-2)]">
          <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
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

export const LayerManagementPage = DataLayerManagementPage;
export default DataLayerManagementPage;