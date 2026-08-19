import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import coordinateSurveyImage from '../assets/vn2000-gnss-survey.webp';
import coordinateUavImage from '../assets/vn2000-uav-control.webp';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';

const THEME_STORAGE_KEY = 'saolatek_theme';

type Item = {
  title: string;
  description: string;
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
  heroImageCaption: string;

  metadataTitle: string;
  panelItems: Item[];

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

    eyebrow: 'NỀN TẢNG · VN-2000 & HỆ TỌA ĐỘ',
    heroTitle:
      'Đặt dữ liệu khảo sát vào đúng bối cảnh tọa độ',
    heroBody:
      'Mỗi bộ dữ liệu khảo sát gắn với một hệ tọa độ và các tham số dự án cụ thể. Việc xác nhận đúng thông tin này giúp dữ liệu được hiểu và sử dụng đúng vị trí trong môi trường 3D GIS.',
    heroImageAlt:
      'Kỹ thuật viên khảo sát GNSS xác định điểm khống chế tọa độ ngoài hiện trường',
    heroImageCaption:
      'Khảo sát GNSS · xác lập bối cảnh tọa độ cho dữ liệu dự án',

    metadataTitle:
      'Thông tin cần xác nhận trước khi sử dụng dữ liệu',
    panelItems: [
      {
        title: 'Hệ tọa độ',
        description:
          'VN-2000, WGS 84 hoặc hệ tọa độ được cung cấp trong hồ sơ dữ liệu.',
      },
      {
        title: 'Tham số dự án',
        description:
          'Múi chiếu, kinh tuyến trục và các tham số liên quan khi hồ sơ dự án có cung cấp.',
      },
      {
        title: 'Nguồn dữ liệu',
        description:
          'UAV, LiDAR hoặc nguồn khảo sát khác của project.',
      },
    ],

    contextEyebrow: 'BỐI CẢNH DỮ LIỆU',
    contextTitle:
      'Thông tin tọa độ quyết định dữ liệu được đặt ở đâu trong project',
    contextBody:
      'Khi bối cảnh tọa độ không đúng, vị trí và phạm vi dữ liệu có thể không còn phù hợp với khu vực khảo sát. Vì vậy, thông tin tọa độ cần được kiểm tra cùng hồ sơ project trước khi đưa dữ liệu vào 3D GIS.',
    contextImageAlt:
      'Thiết bị UAV và mốc kiểm soát phục vụ khảo sát bản đồ',
    contextImageCaption:
      'UAV và mốc kiểm soát · chuẩn bị dữ liệu trước khi đưa vào 3D GIS',
    contexts: [
      {
        title: 'Vị trí',
        description:
          'Xác định khu vực địa lý mà dữ liệu đang đại diện.',
      },
      {
        title: 'Phạm vi',
        description:
          'Giữ đúng vùng khảo sát khi dữ liệu được đưa vào project.',
      },
      {
        title: 'Đối chiếu',
        description:
          'Hỗ trợ kiểm tra nhiều lớp dữ liệu trong cùng một bối cảnh không gian.',
      },
    ],

    systemEyebrow: 'HỆ TỌA ĐỘ & THAM SỐ',
    systemTitle:
      'Không có một cấu hình tọa độ duy nhất cho mọi project',
    systemBody:
      'VN-2000, WGS 84 và các tham số chiếu cần được hiểu theo hồ sơ dữ liệu của từng project. Nền tảng không nên tự giả định cấu hình khi thông tin đầu vào chưa đầy đủ.',
    systems: [
      {
        title: 'VN-2000',
        description:
          'Hệ quy chiếu và hệ tọa độ quốc gia Việt Nam, thường gặp trong dữ liệu đo đạc và bản đồ tại Việt Nam.',
      },
      {
        title: 'WGS 84',
        description:
          'Hệ quy chiếu địa lý được sử dụng rộng rãi trong GNSS và nhiều nguồn dữ liệu không gian.',
      },
      {
        title: 'Tham số project',
        description:
          'Múi chiếu, kinh tuyến trục và các tham số liên quan cần theo đúng hồ sơ của dữ liệu đang sử dụng.',
      },
    ],
    systemNote:
      'Không giả định tự động chuyển đổi giữa VN-2000 và WGS 84 nếu chưa có đầy đủ cấu hình và tham số phù hợp.',

    workflowEyebrow: 'QUY TRÌNH KIỂM TRA',
    workflowTitle:
      'Xác nhận thông tin tọa độ trước khi đưa dữ liệu vào 3D GIS',
    workflowBody:
      'Luồng kiểm tra tập trung vào nguồn dữ liệu, hệ tọa độ và tham số đi kèm trước khi dữ liệu được sử dụng trong project.',
    workflow: [
      {
        title: 'Kiểm tra nguồn dữ liệu',
        description:
          'Xác định dữ liệu đến từ UAV, LiDAR hoặc nguồn khảo sát nào.',
      },
      {
        title: 'Xác nhận hệ tọa độ',
        description:
          'Đối chiếu VN-2000, WGS 84 hoặc hệ tọa độ được cung cấp trong hồ sơ.',
      },
      {
        title: 'Xác nhận tham số',
        description:
          'Kiểm tra múi chiếu, kinh tuyến trục và thông tin liên quan khi có.',
      },
      {
        title: 'Sử dụng trong project',
        description:
          'Đưa dữ liệu vào 3D GIS sau khi bối cảnh tọa độ đã được xác nhận.',
      },
    ],

    valueEyebrow: 'TRONG WORKFLOW DỮ LIỆU',
    valueTitle:
      'Giảm rủi ro sai vị trí khi làm việc với dữ liệu khảo sát',
    valueBody:
      'Một quy trình kiểm tra tọa độ rõ ràng giúp duy trì bối cảnh không gian nhất quán khi quan sát và đối chiếu dữ liệu trong project.',
    values: [
      'Biết rõ hệ tọa độ của bộ dữ liệu đang sử dụng',
      'Giữ đúng bối cảnh không gian của khu vực khảo sát',
      'Hạn chế nhầm lẫn giữa các nguồn dữ liệu khác nhau',
      'Kiểm tra vị trí trước khi đối chiếu nhiều lớp dữ liệu',
      'Giữ thông tin tọa độ gắn với hồ sơ của từng project',
    ],

    finalEyebrow: 'COORDINATE CONTEXT · 3D GIS',
    finalTitle:
      'Trao đổi cấu hình tọa độ phù hợp với dữ liệu project',
    finalBody:
      'Đăng ký Demo để trao đổi về dữ liệu khảo sát, hệ tọa độ và cách tổ chức project 3D GIS phù hợp với nhu cầu thực tế.',
    footer:
      'UAV · LiDAR · VN-2000 · WGS 84 · 3D GIS',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo Access',
    demoLoading: 'Checking Demo...',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    eyebrow: 'PLATFORM · VN-2000 & COORDINATE SYSTEMS',
    heroTitle:
      'Place survey data in the correct coordinate context',
    heroBody:
      'Every survey dataset is associated with a coordinate reference and project-specific parameters. Confirming them correctly helps preserve the intended location and spatial meaning of the data inside a 3D GIS environment.',
    heroImageAlt:
      'Field technician using GNSS equipment to establish a survey control point',
    heroImageCaption:
      'GNSS survey · establishing coordinate context for project data',

    metadataTitle:
      'Information to confirm before using the data',
    panelItems: [
      {
        title: 'Coordinate system',
        description:
          'VN-2000, WGS 84, or the coordinate reference supplied with the dataset.',
      },
      {
        title: 'Project parameters',
        description:
          'Projection zone, central meridian, and related parameters when they are provided in project documentation.',
      },
      {
        title: 'Data source',
        description:
          'UAV, LiDAR, or another survey source used for the project.',
      },
    ],

    contextEyebrow: 'DATA CONTEXT',
    contextTitle:
      'Coordinate information determines where project data is placed',
    contextBody:
      'When the coordinate context is incorrect, the location and extent of the data may no longer match the surveyed area. Coordinate information should therefore be checked against the project documentation before data is used in 3D GIS.',
    contextImageAlt:
      'UAV equipment and a survey control target used for mapping',
    contextImageCaption:
      'UAV and survey control · preparing data before 3D GIS use',
    contexts: [
      {
        title: 'Location',
        description:
          'Identify the geographic area represented by the dataset.',
      },
      {
        title: 'Extent',
        description:
          'Preserve the surveyed area when the data is added to the project.',
      },
      {
        title: 'Comparison',
        description:
          'Support review of multiple data layers inside the same spatial context.',
      },
    ],

    systemEyebrow: 'COORDINATE SYSTEMS & PARAMETERS',
    systemTitle:
      'There is no single coordinate setup for every project',
    systemBody:
      'VN-2000, WGS 84, and projection parameters should be interpreted according to the documentation supplied with each dataset. The platform should not infer a setup when input information is incomplete.',
    systems: [
      {
        title: 'VN-2000',
        description:
          'Vietnam’s national geodetic reference and coordinate system, commonly encountered in surveying and mapping data in Vietnam.',
      },
      {
        title: 'WGS 84',
        description:
          'A geographic reference system widely used in GNSS and many spatial-data sources.',
      },
      {
        title: 'Project parameters',
        description:
          'Projection zone, central meridian, and related parameters should follow the documentation for the dataset being used.',
      },
    ],
    systemNote:
      'Do not assume automatic transformation between VN-2000 and WGS 84 without the required configuration and parameters.',

    workflowEyebrow: 'CHECKING WORKFLOW',
    workflowTitle:
      'Confirm coordinate information before using data in 3D GIS',
    workflowBody:
      'The checking flow focuses on the data source, coordinate reference, and related parameters before the dataset is used in a project.',
    workflow: [
      {
        title: 'Check the data source',
        description:
          'Identify whether the dataset comes from UAV, LiDAR, or another survey source.',
      },
      {
        title: 'Confirm the coordinate system',
        description:
          'Review whether the dataset uses VN-2000, WGS 84, or another reference supplied in the documentation.',
      },
      {
        title: 'Confirm project parameters',
        description:
          'Check projection-zone, central-meridian, and related information when available.',
      },
      {
        title: 'Use the data in the project',
        description:
          'Add the dataset to 3D GIS after its coordinate context has been confirmed.',
      },
    ],

    valueEyebrow: 'IN THE DATA WORKFLOW',
    valueTitle:
      'Reduce location errors when working with survey data',
    valueBody:
      'A clear coordinate-checking process helps maintain a consistent spatial context when reviewing and comparing project data.',
    values: [
      'Know which coordinate system the dataset uses',
      'Preserve the spatial context of the surveyed area',
      'Reduce confusion between different data sources',
      'Check location before comparing multiple data layers',
      'Keep coordinate information associated with each project record',
    ],

    finalEyebrow: 'COORDINATE CONTEXT · 3D GIS',
    finalTitle:
      'Discuss an appropriate coordinate setup for your project data',
    finalBody:
      'Request Demo access to discuss your survey data, coordinate reference, and an appropriate 3D GIS project setup.',
    footer:
      'UAV · LiDAR · VN-2000 · WGS 84 · 3D GIS',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示访问',
    demoLoading: '正在检查 Demo...',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',

    eyebrow: '平台 · VN-2000 与坐标系统',
    heroTitle:
      '将测绘数据放入正确的坐标背景中',
    heroBody:
      '每个测绘数据集都对应特定的坐标参考和项目参数。正确确认这些信息，有助于数据在三维 GIS 环境中保持预期的位置和空间含义。',
    heroImageAlt:
      '现场技术人员使用 GNSS 设备建立测量控制点',
    heroImageCaption:
      'GNSS 测量 · 建立项目数据的坐标背景',

    metadataTitle:
      '使用数据前需要确认的信息',
    panelItems: [
      {
        title: '坐标系统',
        description:
          'VN-2000、WGS 84 或数据资料中提供的坐标参考。',
      },
      {
        title: '项目参数',
        description:
          '项目资料中提供的投影带、中央经线及相关参数。',
      },
      {
        title: '数据来源',
        description:
          '项目使用的无人机、LiDAR 或其他测绘来源。',
      },
    ],

    contextEyebrow: '数据背景',
    contextTitle:
      '坐标信息决定项目数据被放置在什么位置',
    contextBody:
      '如果坐标背景不正确，数据的位置和范围可能与实际测区不一致。因此，在数据用于三维 GIS 之前，应根据项目资料核对坐标信息。',
    contextImageAlt:
      '用于地图测绘的无人机设备和测量控制点',
    contextImageCaption:
      '无人机与测量控制 · 三维 GIS 使用前的数据准备',
    contexts: [
      {
        title: '位置',
        description:
          '确认数据所代表的实际地理区域。',
      },
      {
        title: '范围',
        description:
          '数据加入项目时保持正确的测区范围。',
      },
      {
        title: '对照',
        description:
          '支持在同一个空间背景中检查多个数据图层。',
      },
    ],

    systemEyebrow: '坐标系统与参数',
    systemTitle:
      '不存在适用于所有项目的单一坐标配置',
    systemBody:
      'VN-2000、WGS 84 和投影参数应根据每个数据集随附的资料进行理解。当输入信息不完整时，不应自动推断坐标配置。',
    systems: [
      {
        title: 'VN-2000',
        description:
          '越南国家大地基准和坐标系统，常见于越南境内的测量和地图数据。',
      },
      {
        title: 'WGS 84',
        description:
          'GNSS 和多种空间数据来源中广泛使用的地理参考系统。',
      },
      {
        title: '项目参数',
        description:
          '投影带、中央经线及相关参数应以当前数据集的项目资料为准。',
      },
    ],
    systemNote:
      '在缺少所需配置和参数时，不应假设 VN-2000 与 WGS 84 可以自动转换。',

    workflowEyebrow: '检查流程',
    workflowTitle:
      '在三维 GIS 中使用数据前先确认坐标信息',
    workflowBody:
      '检查流程聚焦于数据来源、坐标参考和相关参数，然后再将数据用于项目。',
    workflow: [
      {
        title: '检查数据来源',
        description:
          '确认数据来自无人机、LiDAR 或其他测绘来源。',
      },
      {
        title: '确认坐标系统',
        description:
          '核对数据采用 VN-2000、WGS 84 或资料中提供的其他坐标参考。',
      },
      {
        title: '确认项目参数',
        description:
          '检查已有的投影带、中央经线及相关信息。',
      },
      {
        title: '用于项目',
        description:
          '在坐标背景确认后，将数据加入三维 GIS。',
      },
    ],

    valueEyebrow: '数据工作流程',
    valueTitle:
      '降低使用测绘数据时的位置偏差风险',
    valueBody:
      '清晰的坐标检查流程，有助于在项目查看和数据对照过程中保持一致的空间背景。',
    values: [
      '明确数据所使用的坐标系统',
      '保持测区正确的空间背景',
      '减少不同数据来源之间的混淆',
      '在对照多个图层前检查位置',
      '按项目资料保留坐标信息',
    ],

    finalEyebrow: 'COORDINATE CONTEXT · 3D GIS',
    finalTitle:
      '为项目数据讨论合适的坐标配置',
    finalBody:
      '申请演示访问，沟通测绘数据、坐标参考以及适合项目的三维 GIS 配置。',
    footer:
      'UAV · LiDAR · VN-2000 · WGS 84 · 三维 GIS',
  },
};

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

const MediaFigure: React.FC<{
  src: string;
  alt: string;
  caption: string;
  hero?: boolean;
}> = ({
  src,
  alt,
  caption,
  hero = false,
}) => (
  <figure className="min-w-0">
    <div className="coord-media overflow-hidden rounded-xl border border-[var(--coord-border)] bg-black sm:rounded-2xl">
      <img
        src={src}
        alt={alt}
        loading={hero ? 'eager' : 'lazy'}
        className={
          hero
            ? 'aspect-[4/3] w-full object-cover lg:min-h-[520px] xl:min-h-[580px]'
            : 'aspect-[4/3] w-full object-cover'
        }
      />
    </div>

    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--coord-muted)]">
      {caption}
    </figcaption>
  </figure>
);

export const CoordinateSystemsPage: React.FC = () => {
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

  const themeLabel =
    isDarkMode
      ? c.switchToLight
      : c.switchToDark;

  return (
    <>
      <style>{`
        .coord-root {
          --coord-bg: #050914;
          --coord-bg-2: #07101c;
          --coord-surface: #0b1523;

          --coord-ink: #f8fafc;
          --coord-muted: #94a3b8;
          --coord-soft: #64748b;

          --coord-border:
            rgba(255,255,255,.09);
          --coord-border-strong:
            rgba(255,255,255,.16);

          --coord-accent: #38bdf8;
          --coord-accent-strong: #0ea5e9;
          --coord-cta-ink: #03111d;

          --coord-header:
            rgba(5,9,20,.88);

          --coord-shadow:
            0 26px 80px
            rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .coord-root.coord-light {
          --coord-bg: #f8fafc;
          --coord-bg-2: #eef4f8;
          --coord-surface: #ffffff;

          --coord-ink: #0f172a;
          --coord-muted: #526174;
          --coord-soft: #64748b;

          --coord-border:
            rgba(15,23,42,.11);
          --coord-border-strong:
            rgba(15,23,42,.20);

          --coord-accent: #0369a1;
          --coord-accent-strong: #0284c7;
          --coord-cta-ink: #ffffff;

          --coord-header:
            rgba(248,250,252,.90);

          --coord-shadow:
            0 24px 65px
            rgba(15,23,42,.14);

          color-scheme: light;
        }

        .coord-root {
          min-height: 100vh;
          overflow-x: clip;

          background:
            var(--coord-bg);

          color:
            var(--coord-ink);

          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .coord-header {
          background:
            var(--coord-header);
        }

        .coord-focus:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 2px var(--coord-bg),
            0 0 0 4px var(--coord-accent);
        }

        .coord-media {
          box-shadow:
            var(--coord-shadow);
        }

        .coord-theme-toggle {
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

        .coord-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--coord-accent);

          outline-offset: 3px;
        }

        .coord-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .coord-theme-toggle__thumb {
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

        .coord-theme-toggle.is-dark
        .coord-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .coord-theme-toggle__clouds,
        .coord-theme-toggle__stars {
          position: absolute;
          inset: 0;

          pointer-events: none;
        }

        .coord-theme-toggle__clouds {
          opacity: 1;
          transition:
            opacity .35s ease;
        }

        .coord-theme-toggle.is-dark
        .coord-theme-toggle__clouds {
          opacity: 0;
        }

        .coord-theme-toggle__cloud {
          position: absolute;
          height: 8px;

          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .coord-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .coord-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .coord-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .coord-theme-toggle__stars {
          opacity: 0;
          transition:
            opacity .35s ease;
        }

        .coord-theme-toggle.is-dark
        .coord-theme-toggle__stars {
          opacity: 1;
        }

        .coord-theme-toggle__star {
          position: absolute;

          width: 2px;
          height: 2px;

          border-radius: 50%;
          background: #fff;

          animation:
            coord-star-pulse
            2s infinite ease-in-out;
        }

        .coord-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .coord-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .coord-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes coord-star-pulse {
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
          .coord-root *,
          .coord-root *::before,
          .coord-root *::after {
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
        className={`coord-root ${
          isDarkMode
            ? ''
            : 'coord-light'
        }`}
      >
        <header className="coord-header sticky top-0 z-50 border-b border-[var(--coord-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="coord-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                title={themeLabel}
                aria-pressed={
                  isDarkMode
                }
                className={`coord-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="coord-theme-toggle__clouds">
                  <div className="coord-theme-toggle__cloud coord-theme-toggle__cloud-1" />
                  <div className="coord-theme-toggle__cloud coord-theme-toggle__cloud-2" />
                  <div className="coord-theme-toggle__cloud coord-theme-toggle__cloud-3" />
                </div>

                <div className="coord-theme-toggle__stars">
                  <div className="coord-theme-toggle__star coord-theme-toggle__star-1" />
                  <div className="coord-theme-toggle__star coord-theme-toggle__star-2" />
                  <div className="coord-theme-toggle__star coord-theme-toggle__star-3" />
                </div>

                <div className="coord-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="coord-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--coord-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--coord-muted)] transition-colors hover:border-[var(--coord-border-strong)] hover:text-[var(--coord-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={demo}
                disabled={isLoading}
                className="coord-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--coord-accent)] px-3.5 text-sm font-bold text-[var(--coord-cta-ink)] transition-colors hover:bg-[var(--coord-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--coord-border)] bg-[var(--coord-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-14 xl:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px]">
                    {c.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--coord-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="coord-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--coord-accent)] px-6 text-sm font-bold text-[var(--coord-cta-ink)] transition-colors hover:bg-[var(--coord-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

                <MediaFigure
                  src={coordinateSurveyImage}
                  alt={c.heroImageAlt}
                  caption={c.heroImageCaption}
                  hero
                />
              </div>

              <div className="mt-12 border-y border-[var(--coord-border)]">
                <div className="py-5">
                  <h2 className="text-sm font-semibold">
                    {c.metadataTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 border-t border-[var(--coord-border)] lg:grid-cols-3">
                  {c.panelItems.map((item) => (
                    <article
                      key={item.title}
                      className="border-b border-[var(--coord-border)] py-5 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                    >
                      <h3 className="text-sm font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[var(--coord-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DATA CONTEXT */}
          <section className="border-b border-[var(--coord-border)] bg-[var(--coord-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] lg:items-center lg:gap-16">
                <MediaFigure
                  src={coordinateUavImage}
                  alt={c.contextImageAlt}
                  caption={c.contextImageCaption}
                />

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                    {c.contextEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.contextTitle}
                  </h2>

                  <p className="mt-5 max-w-[680px] text-base leading-7 text-[var(--coord-muted)]">
                    {c.contextBody}
                  </p>

                  <div className="mt-9 border-y border-[var(--coord-border)]">
                    {c.contexts.map((item) => (
                      <article
                        key={item.title}
                        className="grid grid-cols-1 gap-2 border-b border-[var(--coord-border)] py-5 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7"
                      >
                        <h3 className="text-sm font-semibold">
                          {item.title}
                        </h3>

                        <p className="text-sm leading-6 text-[var(--coord-muted)]">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COORDINATE SYSTEMS */}
          <section className="border-b border-[var(--coord-border)] bg-[var(--coord-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1050px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                  {c.systemEyebrow}
                </div>

                <h2 className="mt-4 max-w-[21ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.systemTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--coord-muted)]">
                  {c.systemBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto border-y border-[var(--coord-border)]">
                <div className="grid min-w-[860px] grid-cols-3">
                  {c.systems.map((item) => (
                    <article
                      key={item.title}
                      className="min-h-[190px] border-r border-[var(--coord-border)] px-7 py-7 first:pl-0 last:border-r-0 last:pr-0"
                    >
                      <h3 className="text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[var(--coord-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <p className="mt-5 max-w-[900px] border-l-2 border-[var(--coord-accent)] pl-4 text-sm leading-6 text-[var(--coord-muted)]">
                {c.systemNote}
              </p>
            </div>
          </section>

          {/* WORKFLOW */}
          <section className="border-b border-[var(--coord-border)] bg-[var(--coord-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                    {c.workflowEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.workflowTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--coord-muted)]">
                    {c.workflowBody}
                  </p>
                </div>

                <div className="border-t border-[var(--coord-border)]">
                  {c.workflow.map((item) => (
                    <article
                      key={item.title}
                      className="grid grid-cols-1 gap-2 border-b border-[var(--coord-border)] py-6 sm:grid-cols-[210px_minmax(0,1fr)] sm:gap-8"
                    >
                      <h3 className="text-base font-semibold">
                        {item.title}
                      </h3>

                      <p className="text-sm leading-7 text-[var(--coord-muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* VALUE */}
          <section className="border-b border-[var(--coord-border)] bg-[var(--coord-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--coord-muted)]">
                    {c.valueBody}
                  </p>
                </div>

                <div className="border-y border-[var(--coord-border)]">
                  {c.values.map((value) => (
                    <div
                      key={value}
                      className="border-b border-[var(--coord-border)] py-5 last:border-b-0 sm:py-6"
                    >
                      <p className="max-w-[760px] text-[15px] leading-7 text-[var(--coord-muted)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--coord-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-18 xl:px-12">
              <div className="border-y border-[var(--coord-border)] py-9 sm:py-11">
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--coord-accent)]">
                      {c.finalEyebrow}
                    </div>

                    <h2 className="mt-3 max-w-[25ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[34px]">
                      {c.finalTitle}
                    </h2>

                    <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--coord-muted)]">
                      {c.finalBody}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={demo}
                    disabled={isLoading}
                    className="coord-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--coord-accent)] px-6 text-sm font-bold text-[var(--coord-cta-ink)] transition-colors hover:bg-[var(--coord-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        <footer className="border-t border-[var(--coord-border)] bg-[var(--coord-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--coord-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default CoordinateSystemsPage;