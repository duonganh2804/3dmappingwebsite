import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import publicSurveyImage from '../assets/IMG_1074.jpg';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

const THEME_STORAGE_KEY = 'saolatek_theme';

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
  demoLoading: string;
  switchToLight: string;
  switchToDark: string;

  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroImageAlt: string;
  heroCaption: string;

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

    eyebrow: 'NỀN TẢNG · QUẢN LÝ LỚP DỮ LIỆU',
    heroTitle:
      'Quản lý nhiều lớp dữ liệu trong cùng một project 3D GIS',
    heroBody:
      'Các lớp dữ liệu của project được tổ chức trong cùng một không gian để người dùng có thể bật, tắt, điều chỉnh độ trong suốt và thay đổi thứ tự hiển thị mà không rời khỏi khu vực đang quan sát.',
    heroImageAlt:
      'Đội khảo sát và thiết bị UAV trong quá trình thu thập dữ liệu hiện trường',
    heroCaption:
      'Thu thập dữ liệu hiện trường phục vụ project 3D Mapping',

    layerEyebrow: 'LỚP DỮ LIỆU',
    layerTitle:
      'Các lớp có thể cùng tồn tại trong một project',
    layerBody:
      'Tùy dữ liệu của từng project, Viewer có thể chứa Point Cloud, 3D Mesh và Orthophoto / DOM trong cùng một bối cảnh không gian.',
    layers: [
      {
        title: 'Point Cloud',
        description:
          'Lớp dữ liệu điểm 3D dùng để quan sát cấu trúc không gian và vị trí của khu vực khảo sát.',
      },
      {
        title: '3D Mesh',
        description:
          'Khi project có dữ liệu Mesh, người dùng có thể quan sát mô hình bề mặt và hình dạng của khu vực.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'Khi project có ảnh trực giao, người dùng có thể đối chiếu vị trí và bố cục khu vực theo góc nhìn trên xuống.',
      },
    ],

    interactiveEyebrow: 'MINH HỌA ĐIỀU KHIỂN LỚP',
    interactiveTitle:
      'Bật / tắt, điều chỉnh opacity và thay đổi thứ tự hiển thị',
    interactiveBody:
      'Panel bên dưới mô phỏng cách người dùng thao tác với trạng thái hiển thị của từng lớp. Thay đổi được phản ánh ngay trong phần preview.',
    interactiveNote:
      'Phần này là preview tương tác trên trang giới thiệu. Nó minh họa hành vi giao diện quản lý lớp, không phải Viewer dữ liệu thật.',
    panelTitle: 'Lớp dữ liệu',
    visibleLabel: 'Hiển thị',
    opacityLabel: 'Opacity',
    moveUpLabel: 'Đưa lớp lên trên',
    moveDownLabel: 'Đưa lớp xuống dưới',
    resetLabel: 'Đặt lại',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'Orthophoto / DOM',
    },
    layerMeta: {
      pointCloud: 'Preview lớp điểm 3D',
      mesh: 'Preview lớp bề mặt',
      dom: 'Preview ảnh trực giao',
    },

    controlEyebrow: 'KIỂM SOÁT HIỂN THỊ',
    controlTitle:
      'Điều chỉnh lớp theo nội dung đang cần kiểm tra',
    controlBody:
      'Thao tác lớp tập trung vào ba việc chính: chọn lớp cần quan sát, điều chỉnh mức hiển thị và thay đổi thứ tự giữa các lớp.',
    controls: [
      {
        title: 'Bật / tắt lớp',
        description:
          'Ẩn lớp không cần thiết để tập trung vào dữ liệu đang kiểm tra.',
      },
      {
        title: 'Điều chỉnh opacity',
        description:
          'Giảm độ hiển thị của một lớp để quan sát lớp dữ liệu nằm phía dưới.',
      },
      {
        title: 'Thay đổi thứ tự lớp',
        description:
          'Đưa lớp lên hoặc xuống để thay đổi thứ tự ưu tiên trong phần hiển thị.',
      },
    ],

    flowEyebrow: 'LUỒNG THAO TÁC',
    flowTitle:
      'Từ project đến lớp dữ liệu cần quan sát',
    flowBody:
      'Người dùng giữ nguyên bối cảnh project trong khi thay đổi lớp dữ liệu phù hợp với nội dung đang kiểm tra.',
    flow: [
      {
        title: 'Mở project',
        description:
          'Mở project và khu vực cần quan sát trong Viewer.',
      },
      {
        title: 'Chọn lớp dữ liệu',
        description:
          'Chọn Point Cloud, 3D Mesh hoặc Orthophoto / DOM khi project có lớp tương ứng.',
      },
      {
        title: 'Tinh chỉnh hiển thị',
        description:
          'Bật / tắt lớp, thay đổi opacity và thứ tự hiển thị.',
      },
      {
        title: 'Đối chiếu dữ liệu',
        description:
          'Quan sát cùng một khu vực mà không thay đổi bối cảnh không gian của project.',
      },
    ],

    valueEyebrow: 'TRONG WORKFLOW 3D GIS',
    valueTitle:
      'Giữ dữ liệu project trong cùng một bối cảnh quan sát',
    valueBody:
      'Quản lý theo lớp giúp người dùng thay đổi dữ liệu đang hiển thị mà vẫn giữ nguyên vị trí và góc quan sát của project.',
    values: [
      'Tập trung vào lớp dữ liệu cần kiểm tra',
      'Giảm nhiễu khi nhiều lớp cùng được hiển thị',
      'Đối chiếu Point Cloud, 3D Mesh và Orthophoto / DOM khi project có dữ liệu tương ứng',
      'Điều chỉnh mức hiển thị mà không thay đổi khu vực đang quan sát',
      'Thực hiện thao tác trực tiếp trong môi trường Web GIS',
    ],

    finalEyebrow: 'DATA LAYERS · 3D GIS',
    finalTitle:
      'Trải nghiệm quản lý lớp dữ liệu trong project 3D GIS',
    finalBody:
      'Đăng ký Demo để xem cách các lớp dữ liệu được tổ chức, bật / tắt và đối chiếu trong cùng một project.',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · Data Layers · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',
    demoLoading: 'Checking Demo...',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    eyebrow: 'PLATFORM · DATA LAYER MANAGEMENT',
    heroTitle:
      'Manage multiple data layers inside one 3D GIS project',
    heroBody:
      'Project data layers stay in the same workspace so users can show, hide, adjust opacity, and change display order without leaving the area being inspected.',
    heroImageAlt:
      'Survey team and UAV equipment during field data collection',
    heroCaption:
      'Field data collection for a 3D Mapping project',

    layerEyebrow: 'DATA LAYERS',
    layerTitle:
      'Layers that can coexist inside one project',
    layerBody:
      'Depending on project data, the Viewer can contain Point Cloud, 3D Mesh, and Orthophoto / DOM layers in the same spatial context.',
    layers: [
      {
        title: 'Point Cloud',
        description:
          'A 3D point layer used to review spatial structure and location across the surveyed area.',
      },
      {
        title: '3D Mesh',
        description:
          'When Mesh data is available, users can inspect the surface model and the shape of the area.',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          'When orthographic imagery is available, users can compare locations and site layout from a top-down view.',
      },
    ],

    interactiveEyebrow: 'LAYER CONTROL PREVIEW',
    interactiveTitle:
      'Toggle visibility, adjust opacity, and change display order',
    interactiveBody:
      'The panel below simulates how users change the display state of each layer. Changes are reflected immediately in the preview.',
    interactiveNote:
      'This is an interactive preview on the product page. It demonstrates layer-management interface behavior and is not the live project Viewer.',
    panelTitle: 'Data layers',
    visibleLabel: 'Visible',
    opacityLabel: 'Opacity',
    moveUpLabel: 'Move layer up',
    moveDownLabel: 'Move layer down',
    resetLabel: 'Reset',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'Orthophoto / DOM',
    },
    layerMeta: {
      pointCloud: '3D point-layer preview',
      mesh: 'Surface-layer preview',
      dom: 'Orthographic-image preview',
    },

    controlEyebrow: 'DISPLAY CONTROL',
    controlTitle:
      'Adjust layers for the current inspection task',
    controlBody:
      'Layer operations focus on three tasks: selecting the data to view, adjusting its display level, and changing the order between layers.',
    controls: [
      {
        title: 'Show / hide a layer',
        description:
          'Hide unnecessary data so the current layer remains easier to inspect.',
      },
      {
        title: 'Adjust opacity',
        description:
          'Reduce the visibility of one layer so data underneath remains visible.',
      },
      {
        title: 'Change layer order',
        description:
          'Move a layer up or down to change its display priority.',
      },
    ],

    flowEyebrow: 'WORKFLOW',
    flowTitle:
      'From the project to the data layer you need',
    flowBody:
      'Users preserve the project context while switching to the data layer that matches the current inspection task.',
    flow: [
      {
        title: 'Open the project',
        description:
          'Open the project and the area that needs inspection in the Viewer.',
      },
      {
        title: 'Choose a data layer',
        description:
          'Select Point Cloud, 3D Mesh, or Orthophoto / DOM when the corresponding layer exists in the project.',
      },
      {
        title: 'Tune the display',
        description:
          'Toggle visibility, change opacity, and adjust display order.',
      },
      {
        title: 'Compare data',
        description:
          'Review the same area without changing the project spatial context.',
      },
    ],

    valueEyebrow: 'IN THE 3D GIS WORKFLOW',
    valueTitle:
      'Keep project data in one viewing context',
    valueBody:
      'Layer management lets users change the data being displayed while preserving the project location and camera context.',
    values: [
      'Focus on the layer relevant to the inspection task',
      'Reduce clutter when several layers are visible',
      'Compare Point Cloud, 3D Mesh, and Orthophoto / DOM when corresponding project data exists',
      'Adjust display level without changing the area being viewed',
      'Work directly inside the Web GIS environment',
    ],

    finalEyebrow: 'DATA LAYERS · 3D GIS',
    finalTitle:
      'Explore data-layer management inside a 3D GIS project',
    finalBody:
      'Request Demo access to see how data layers are organized, shown, hidden, and compared inside the same project.',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · Data Layers · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',
    demoLoading: '正在检查 Demo...',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',

    eyebrow: '平台 · 数据图层管理',
    heroTitle:
      '在同一个三维 GIS 项目中管理多个数据图层',
    heroBody:
      '项目数据图层保留在同一个工作空间中，用户可以显示、隐藏、调整透明度和改变显示顺序，同时保持当前查看区域不变。',
    heroImageAlt:
      '外业数据采集过程中的测绘团队和 UAV 设备',
    heroCaption:
      '三维建图项目的外业数据采集',

    layerEyebrow: '数据图层',
    layerTitle:
      '可在同一个项目中同时存在的数据图层',
    layerBody:
      '根据项目数据情况，Viewer 可在同一个空间背景中包含 Point Cloud、3D Mesh 和 Orthophoto / DOM。',
    layers: [
      {
        title: 'Point Cloud',
        description:
          '用于查看测区空间结构和位置关系的三维点数据图层。',
      },
      {
        title: '3D Mesh',
        description:
          '当项目具备 Mesh 数据时，可查看区域表面模型与形态。',
      },
      {
        title: 'Orthophoto / DOM',
        description:
          '当项目具备正射影像时，可从俯视角度对照位置与区域布局。',
      },
    ],

    interactiveEyebrow: '图层控制预览',
    interactiveTitle:
      '控制显示、透明度和图层顺序',
    interactiveBody:
      '下方面板模拟用户如何调整各图层的显示状态，每次修改都会立即反映在预览中。',
    interactiveNote:
      '这是产品页面上的交互预览，用于说明图层管理界面的行为，并非真实项目 Viewer。',
    panelTitle: '数据图层',
    visibleLabel: '显示',
    opacityLabel: '透明度',
    moveUpLabel: '上移图层',
    moveDownLabel: '下移图层',
    resetLabel: '重置',
    layerNames: {
      pointCloud: 'Point Cloud',
      mesh: '3D Mesh',
      dom: 'Orthophoto / DOM',
    },
    layerMeta: {
      pointCloud: '三维点图层预览',
      mesh: '表面图层预览',
      dom: '正射影像预览',
    },

    controlEyebrow: '显示控制',
    controlTitle:
      '根据当前检查任务调整数据图层',
    controlBody:
      '图层操作集中在三项任务：选择需要查看的数据、调整显示程度，以及改变图层之间的顺序。',
    controls: [
      {
        title: '显示 / 隐藏图层',
        description:
          '隐藏不需要的数据，使当前检查内容更加清晰。',
      },
      {
        title: '调整透明度',
        description:
          '降低某一图层的显示程度，使下方数据保持可见。',
      },
      {
        title: '调整图层顺序',
        description:
          '上移或下移图层，以改变其显示优先级。',
      },
    ],

    flowEyebrow: '操作流程',
    flowTitle:
      '从项目进入需要查看的数据图层',
    flowBody:
      '用户在切换数据图层时保持项目空间背景不变。',
    flow: [
      {
        title: '打开项目',
        description:
          '在 Viewer 中打开项目和需要检查的区域。',
      },
      {
        title: '选择数据图层',
        description:
          '当项目具备相应数据时，选择 Point Cloud、3D Mesh 或 Orthophoto / DOM。',
      },
      {
        title: '调整显示',
        description:
          '控制图层显示状态、透明度和显示顺序。',
      },
      {
        title: '对照数据',
        description:
          '在不改变项目空间背景的情况下查看同一区域。',
      },
    ],

    valueEyebrow: '三维 GIS 工作流程',
    valueTitle:
      '在同一个查看背景中保留项目数据',
    valueBody:
      '图层管理使用户在改变当前显示数据时，仍可保持项目位置和相机背景。',
    values: [
      '聚焦当前检查任务需要的数据图层',
      '在多个图层同时显示时减少视觉干扰',
      '当项目具备相应数据时对照 Point Cloud、3D Mesh 和 Orthophoto / DOM',
      '调整显示程度时保持当前查看区域',
      '直接在 Web GIS 环境中完成操作',
    ],

    finalEyebrow: 'DATA LAYERS · 3D GIS',
    finalTitle:
      '体验三维 GIS 项目中的数据图层管理',
    finalBody:
      '申请演示访问，了解数据图层如何在同一个项目中进行组织、显示、隐藏和对照。',
    footer:
      'Point Cloud · 3D Mesh · Orthophoto / DOM · Data Layers · 3D GIS',
  },
};

const INITIAL_LAYERS: DemoLayer[] = [
  {
    id: 'pointCloud',
    visible: true,
    opacity: 78,
  },
  {
    id: 'mesh',
    visible: true,
    opacity: 44,
  },
  {
    id: 'dom',
    visible: true,
    opacity: 100,
  },
];

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

export const DataLayerManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    isAuthenticated,
    isLoading,
  } = useAuthStore();

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(readInitialTheme);

  const [
    demoLayers,
    setDemoLayers,
  ] = useState<DemoLayer[]>(
    INITIAL_LAYERS
  );

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

  const toggleLayer = (
    id: LayerId
  ) => {
    setDemoLayers((layers) =>
      layers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              visible:
                !layer.visible,
            }
          : layer
      )
    );
  };

  const setLayerOpacity = (
    id: LayerId,
    opacity: number
  ) => {
    setDemoLayers((layers) =>
      layers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              opacity,
            }
          : layer
      )
    );
  };

  const moveLayer = (
    index: number,
    direction: -1 | 1
  ) => {
    setDemoLayers((layers) => {
      const nextIndex =
        index + direction;

      if (
        nextIndex < 0 ||
        nextIndex >=
          layers.length
      ) {
        return layers;
      }

      const next = [...layers];

      const [current] =
        next.splice(index, 1);

      next.splice(
        nextIndex,
        0,
        current
      );

      return next;
    });
  };

  const resetLayers = () => {
    setDemoLayers(
      INITIAL_LAYERS
    );
  };

  const getLayer = (
    id: LayerId
  ) =>
    demoLayers.find(
      (layer) =>
        layer.id === id
    ) ??
    INITIAL_LAYERS.find(
      (layer) =>
        layer.id === id
    )!;

  const domLayer =
    getLayer('dom');

  const meshLayer =
    getLayer('mesh');

  const pointCloudLayer =
    getLayer('pointCloud');

  const themeLabel =
    isDarkMode
      ? c.switchToLight
      : c.switchToDark;

  return (
    <>
      <style>{`
        .dlm-root {
          --dlm-bg: #050914;
          --dlm-bg-2: #07101c;
          --dlm-surface: #0b1523;
          --dlm-surface-2: #0d1826;

          --dlm-ink: #f8fafc;
          --dlm-muted: #94a3b8;
          --dlm-soft: #64748b;

          --dlm-border:
            rgba(255,255,255,.09);
          --dlm-border-strong:
            rgba(255,255,255,.16);

          --dlm-accent: #38bdf8;
          --dlm-accent-strong: #0ea5e9;
          --dlm-cta-ink: #03111d;

          --dlm-header:
            rgba(5,9,20,.88);

          --dlm-shadow:
            0 26px 80px
            rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .dlm-root.dlm-light {
          --dlm-bg: #f8fafc;
          --dlm-bg-2: #eef4f8;
          --dlm-surface: #ffffff;
          --dlm-surface-2: #f3f7fa;

          --dlm-ink: #0f172a;
          --dlm-muted: #526174;
          --dlm-soft: #64748b;

          --dlm-border:
            rgba(15,23,42,.11);
          --dlm-border-strong:
            rgba(15,23,42,.20);

          --dlm-accent: #0369a1;
          --dlm-accent-strong: #0284c7;
          --dlm-cta-ink: #ffffff;

          --dlm-header:
            rgba(248,250,252,.90);

          --dlm-shadow:
            0 24px 65px
            rgba(15,23,42,.14);

          color-scheme: light;
        }

        .dlm-root {
          min-height: 100vh;
          overflow-x: clip;

          background:
            var(--dlm-bg);

          color:
            var(--dlm-ink);

          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .dlm-header {
          background:
            var(--dlm-header);
        }

        .dlm-focus:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 2px var(--dlm-bg),
            0 0 0 4px var(--dlm-accent);
        }

        .dlm-media {
          box-shadow:
            var(--dlm-shadow);
        }

        .dlm-theme-toggle {
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

          border:
            1px solid
            rgba(255,255,255,.20);

          background:
            linear-gradient(
              180deg,
              #2a80f1 0%,
              #70a7ff 100%
            );

          box-shadow:
            inset 0 2px 4px
              rgba(0,0,0,.10),
            0 1px 2px
              rgba(255,255,255,.05);

          transition:
            background .4s
              cubic-bezier(.16,1,.3,1),
            border-color .4s
              cubic-bezier(.16,1,.3,1);
        }

        .dlm-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--dlm-accent);

          outline-offset: 3px;
        }

        .dlm-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .dlm-theme-toggle__thumb {
          position: absolute;

          left: 4px;
          top: 4px;

          width: 24px;
          height: 24px;

          z-index: 3;

          border-radius: 50%;

          background: #ffd34e;

          box-shadow:
            0 0 10px
            rgba(255,211,78,.75);

          transition:
            transform .4s
              cubic-bezier(.16,1,.3,1),
            background .4s
              cubic-bezier(.16,1,.3,1),
            box-shadow .4s
              cubic-bezier(.16,1,.3,1);
        }

        .dlm-theme-toggle.is-dark
        .dlm-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .dlm-theme-toggle__clouds,
        .dlm-theme-toggle__stars {
          position: absolute;
          inset: 0;

          pointer-events: none;
        }

        .dlm-theme-toggle__clouds {
          opacity: 1;

          transition:
            opacity .35s ease;
        }

        .dlm-theme-toggle.is-dark
        .dlm-theme-toggle__clouds {
          opacity: 0;
        }

        .dlm-theme-toggle__cloud {
          position: absolute;

          height: 8px;

          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .dlm-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .dlm-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .dlm-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .dlm-theme-toggle__stars {
          opacity: 0;

          transition:
            opacity .35s ease;
        }

        .dlm-theme-toggle.is-dark
        .dlm-theme-toggle__stars {
          opacity: 1;
        }

        .dlm-theme-toggle__star {
          position: absolute;

          border-radius: 50%;

          background: #fff;

          animation:
            dlm-star-pulse
            2s infinite ease-in-out;
        }

        .dlm-theme-toggle__star-1 {
          top: 7px;
          left: 13px;

          width: 2px;
          height: 2px;
        }

        .dlm-theme-toggle__star-2 {
          top: 17px;
          left: 27px;

          width: 2px;
          height: 2px;

          animation-delay: .5s;
        }

        .dlm-theme-toggle__star-3 {
          top: 8px;
          left: 37px;

          width: 2px;
          height: 2px;

          animation-delay: 1s;
        }

        @keyframes dlm-star-pulse {
          0%,
          100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .dlm-root *,
          .dlm-root *::before,
          .dlm-root *::after {
            scroll-behavior:
              auto !important;
            animation-duration:
              .01ms !important;
            animation-iteration-count:
              1 !important;
            transition-duration:
              .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`dlm-root ${
          isDarkMode
            ? ''
            : 'dlm-light'
        }`}
      >
        <header className="dlm-header sticky top-0 z-50 border-b border-[var(--dlm-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="dlm-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                ariaLabel={
                  c.languageLabel
                }
              />

              <button
                type="button"
                onClick={() =>
                  setIsDarkMode(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  themeLabel
                }
                title={
                  themeLabel
                }
                aria-pressed={
                  isDarkMode
                }
                className={`dlm-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="dlm-theme-toggle__clouds">
                  <div className="dlm-theme-toggle__cloud dlm-theme-toggle__cloud-1" />
                  <div className="dlm-theme-toggle__cloud dlm-theme-toggle__cloud-2" />
                  <div className="dlm-theme-toggle__cloud dlm-theme-toggle__cloud-3" />
                </div>

                <div className="dlm-theme-toggle__stars">
                  <div className="dlm-theme-toggle__star dlm-theme-toggle__star-1" />
                  <div className="dlm-theme-toggle__star dlm-theme-toggle__star-2" />
                  <div className="dlm-theme-toggle__star dlm-theme-toggle__star-3" />
                </div>

                <div className="dlm-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="dlm-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--dlm-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--dlm-muted)] transition-colors hover:border-[var(--dlm-border-strong)] hover:text-[var(--dlm-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={demo}
                disabled={isLoading}
                className="dlm-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--dlm-accent)] px-3.5 text-sm font-bold text-[var(--dlm-cta-ink)] transition-colors hover:bg-[var(--dlm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isLoading
                    ? c.demoLoading
                    : c.demo}
                </span>

                {isLoading ? (
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
          <section className="flex min-h-[calc(100svh-68px)] items-center border-b border-[var(--dlm-border)] bg-[var(--dlm-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-10 sm:px-8 md:py-12 lg:px-10 lg:py-14 xl:px-12 xl:py-16">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-12 xl:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[12ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px] 2xl:text-[70px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--dlm-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="dlm-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--dlm-accent)] px-6 text-sm font-bold text-[var(--dlm-cta-ink)] transition-colors hover:bg-[var(--dlm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

                <figure className="min-w-0">
                  <div className="dlm-media overflow-hidden rounded-xl border border-[var(--dlm-border)] bg-black sm:rounded-2xl">
                    <img
                      src={publicSurveyImage}
                      alt={c.heroImageAlt}
                      className="aspect-[16/10] w-full object-cover lg:min-h-[500px] xl:min-h-[570px] 2xl:min-h-[610px]"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--dlm-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* DATA LAYERS */}
          <section className="border-b border-[var(--dlm-border)] bg-[var(--dlm-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.34fr)_minmax(0,.66fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                    {c.layerEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[14ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.layerTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--dlm-muted)]">
                    {c.layerBody}
                  </p>
                </div>

                <div className="border-t border-[var(--dlm-border)]">
                  {c.layers.map((item) => (
                    <article
                      key={item.title}
                      className="grid grid-cols-1 gap-2 border-b border-[var(--dlm-border)] py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
                    >
                      <h3 className="text-base font-semibold">
                        {item.title}
                      </h3>

                      <p className="text-sm leading-6 text-[var(--dlm-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* INTERACTIVE PREVIEW */}
          <section className="border-b border-[var(--dlm-border)] bg-[var(--dlm-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12 xl:py-22">
              <div className="max-w-[920px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                  {c.interactiveEyebrow}
                </div>

                <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.interactiveTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--dlm-muted)]">
                  {c.interactiveBody}
                </p>
              </div>

              <div className="dlm-media mt-10 grid grid-cols-1 overflow-hidden rounded-xl border border-[var(--dlm-border)] bg-[var(--dlm-surface)] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
                <div className="relative min-h-[420px] overflow-hidden bg-black sm:min-h-[520px] lg:min-h-[620px]">
                  <img
                    src={publicSurveyImage}
                    alt={c.heroImageAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      opacity:
                        domLayer.visible
                          ? Math.max(
                              domLayer.opacity / 100,
                              0.08
                            )
                          : 0.08,
                      filter:
                        domLayer.visible
                          ? 'none'
                          : 'grayscale(1) brightness(.45)',
                    }}
                  />

                  {meshLayer.visible && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        opacity:
                          meshLayer.opacity /
                          100,
                        backgroundImage:
                          'linear-gradient(28deg, transparent 0 36%, rgba(0,229,255,.28) 36.5% 37%, transparent 37.5% 68%, rgba(0,229,255,.20) 68.5% 69%, transparent 69.5%), linear-gradient(152deg, transparent 0 42%, rgba(24,196,255,.22) 42.5% 43%, transparent 43.5% 74%, rgba(24,196,255,.18) 74.5% 75%, transparent 75.5%)',
                        mixBlendMode:
                          'screen',
                      }}
                    />
                  )}

                  {pointCloudLayer.visible && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        opacity:
                          pointCloudLayer.opacity /
                          100,
                        backgroundImage:
                          'radial-gradient(circle, rgba(61,230,255,.95) 0 1.1px, transparent 1.35px)',
                        backgroundSize:
                          '17px 17px',
                        mixBlendMode:
                          'screen',
                        WebkitMaskImage:
                          'linear-gradient(to bottom right, transparent 0%, black 18%, black 82%, transparent 100%)',
                        maskImage:
                          'linear-gradient(to bottom right, transparent 0%, black 18%, black 82%, transparent 100%)',
                      }}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[.08em] text-white/80">
                    {demoLayers
                      .filter(
                        (layer) =>
                          layer.visible
                      )
                      .map((layer) => (
                        <span
                          key={layer.id}
                        >
                          {
                            c.layerNames[
                              layer.id
                            ]
                          }{' '}
                          ·{' '}
                          {
                            layer.opacity
                          }
                          %
                        </span>
                      ))}
                  </div>
                </div>

                <aside className="border-t border-[var(--dlm-border)] bg-[var(--dlm-surface)] p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-6">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--dlm-border)] pb-5">
                    <div>
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[var(--dlm-accent)]">
                        LAYERS
                      </div>

                      <h3 className="mt-1 text-xl font-semibold">
                        {c.panelTitle}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={resetLayers}
                      className="dlm-focus inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--dlm-border)] bg-transparent px-3 text-xs font-semibold text-[var(--dlm-muted)] transition-colors hover:border-[var(--dlm-border-strong)] hover:text-[var(--dlm-ink)]"
                    >
                      <RotateCcw
                        size={14}
                      />
                      {c.resetLabel}
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--dlm-border)]">
                    {demoLayers.map(
                      (
                        layer,
                        index
                      ) => (
                        <article
                          key={layer.id}
                          className="py-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold">
                                {
                                  c
                                    .layerNames[
                                    layer.id
                                  ]
                                }
                              </h4>

                              <p className="mt-1 text-xs leading-5 text-[var(--dlm-muted)]">
                                {
                                  c
                                    .layerMeta[
                                    layer.id
                                  ]
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleLayer(
                                  layer.id
                                )
                              }
                              aria-pressed={
                                layer.visible
                              }
                              aria-label={`${c.visibleLabel}: ${c.layerNames[layer.id]}`}
                              className={`dlm-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                layer.visible
                                  ? 'border-[var(--dlm-accent)] text-[var(--dlm-accent)]'
                                  : 'border-[var(--dlm-border)] text-[var(--dlm-muted)]'
                              }`}
                            >
                              {layer.visible ? (
                                <Eye
                                  size={
                                    17
                                  }
                                />
                              ) : (
                                <EyeOff
                                  size={
                                    17
                                  }
                                />
                              )}
                            </button>
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                              <span className="text-[var(--dlm-muted)]">
                                {
                                  c.opacityLabel
                                }
                              </span>

                              <span className="font-semibold">
                                {
                                  layer.opacity
                                }
                                %
                              </span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={
                                layer.opacity
                              }
                              disabled={
                                !layer.visible
                              }
                              onChange={(
                                event
                              ) =>
                                setLayerOpacity(
                                  layer.id,
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-full accent-[var(--dlm-accent)] disabled:opacity-35"
                              aria-label={`${c.opacityLabel}: ${c.layerNames[layer.id]}`}
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                moveLayer(
                                  index,
                                  -1
                                )
                              }
                              disabled={
                                index === 0
                              }
                              className="dlm-focus inline-flex h-9 items-center justify-center rounded-lg border border-[var(--dlm-border)] bg-transparent text-[var(--dlm-muted)] transition-colors hover:border-[var(--dlm-border-strong)] hover:text-[var(--dlm-ink)] disabled:opacity-30"
                              aria-label={`${c.moveUpLabel}: ${c.layerNames[layer.id]}`}
                            >
                              <ChevronUp
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveLayer(
                                  index,
                                  1
                                )
                              }
                              disabled={
                                index ===
                                demoLayers.length -
                                  1
                              }
                              className="dlm-focus inline-flex h-9 items-center justify-center rounded-lg border border-[var(--dlm-border)] bg-transparent text-[var(--dlm-muted)] transition-colors hover:border-[var(--dlm-border-strong)] hover:text-[var(--dlm-ink)] disabled:opacity-30"
                              aria-label={`${c.moveDownLabel}: ${c.layerNames[layer.id]}`}
                            >
                              <ChevronDown
                                size={15}
                              />
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </aside>
              </div>

              <p className="mt-4 max-w-[900px] text-xs leading-5 text-[var(--dlm-soft)]">
                {c.interactiveNote}
              </p>
            </div>
          </section>

          {/* DISPLAY CONTROL */}
          <section className="border-b border-[var(--dlm-border)] bg-[var(--dlm-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(320px,.36fr)_minmax(0,.64fr)] lg:gap-16 xl:gap-20">
                <div className="lg:sticky lg:top-[108px] lg:self-start">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                    {c.controlEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[15ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.controlTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--dlm-muted)]">
                    {c.controlBody}
                  </p>
                </div>

                <div className="space-y-8">
                  {c.controls.map((item) => (
                    <article
                      key={item.title}
                      className="border-t border-[var(--dlm-border)] pt-6"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8">
                        <h3 className="text-lg font-semibold">
                          {item.title}
                        </h3>

                        <p className="text-sm leading-7 text-[var(--dlm-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* WORKFLOW */}
          <section className="border-b border-[var(--dlm-border)] bg-[var(--dlm-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[920px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                  {c.flowEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.1] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.flowTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--dlm-muted)]">
                  {c.flowBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto border-y border-[var(--dlm-border)]">
                <div className="grid min-w-[900px] grid-cols-4">
                  {c.flow.map((item) => (
                    <article
                      key={item.title}
                      className="min-h-[180px] border-r border-[var(--dlm-border)] px-6 py-7 first:pl-0 last:border-r-0 last:pr-0"
                    >
                      <h3 className="text-base font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[var(--dlm-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* VALUE */}
          <section className="border-b border-[var(--dlm-border)] bg-[var(--dlm-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1100px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                  {c.valueEyebrow}
                </div>

                <h2 className="mt-4 max-w-[20ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.valueTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--dlm-muted)]">
                  {c.valueBody}
                </p>
              </div>

              <div className="mt-10 border-t border-[var(--dlm-border)]">
                {c.values.map((value) => (
                  <div
                    key={value}
                    className="border-b border-[var(--dlm-border)] py-5 sm:py-6"
                  >
                    <p className="max-w-[980px] text-[15px] leading-7 text-[var(--dlm-muted)]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--dlm-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-18 xl:px-12">
              <div className="border-y border-[var(--dlm-border)] py-9 sm:py-11">
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--dlm-accent)]">
                      {c.finalEyebrow}
                    </div>

                    <h2 className="mt-3 max-w-[25ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[34px]">
                      {c.finalTitle}
                    </h2>

                    <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--dlm-muted)]">
                      {c.finalBody}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="dlm-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--dlm-accent)] px-6 text-sm font-bold text-[var(--dlm-cta-ink)] transition-colors hover:bg-[var(--dlm-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        <footer className="border-t border-[var(--dlm-border)] bg-[var(--dlm-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--dlm-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export const LayerManagementPage =
  DataLayerManagementPage;

export default DataLayerManagementPage;