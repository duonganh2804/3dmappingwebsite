import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import viewerHeroImage from '../../assets/3d-gis-viewer-hero.png';
import viewerAreaImage from '../../assets/3d-gis-viewer-area.png';

import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../../hooks/useLanguage';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';

type OutputItem = {
  name: string;
  format: string;
  summary: string;
  use: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroPrimary: string;
  heroSecondary: string;
  heroCaption: string;

  overviewEyebrow: string;
  overviewTitle: string;
  overviewBody: string;
  outputs: OutputItem[];

  detailEyebrow: string;
  detailTitle: string;
  detailBody: string;
  detailItems: {
    title: string;
    body: string;
  }[];
  detailCaption: string;

  webgisEyebrow: string;
  webgisTitle: string;
  webgisBody: string;
  webgisItems: string[];
  webgisCaption: string;

  qualityEyebrow: string;
  qualityTitle: string;
  qualityBody: string;
  qualityItems: string[];

  finalTitle: string;
  finalBody: string;
  workflowButton: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',

    eyebrow: 'TÀI NGUYÊN · DỮ LIỆU ĐẦU RA 3D',
    heroTitle1: 'Dữ liệu đầu ra cho',
    heroTitle2: '3D Mapping & Web GIS',
    heroBody:
      'Sau xử lý, dữ liệu khảo sát được tổ chức thành các lớp phục vụ quan sát, đo đạc, kiểm tra hiện trạng và khai thác trực tiếp trên Web GIS.',
    heroPrimary: 'Xem các loại dữ liệu',
    heroSecondary: 'Đăng ký xem Demo',
    heroCaption:
      'Project 3D sau khi các lớp dữ liệu được chuẩn hóa và đưa vào Viewer',

    overviewEyebrow: 'CÁC NHÓM DỮ LIỆU CHÍNH',
    overviewTitle: 'Bốn loại dữ liệu đầu ra chính',
    overviewBody:
      'Mỗi loại dữ liệu phục vụ một mục đích khác nhau. Đầu ra cuối cùng phụ thuộc mục tiêu khảo sát, cảm biến và yêu cầu bàn giao.',
    outputs: [
      {
        name: 'Orthophoto / DOM',
        format: 'Raster map',
        summary:
          'Ảnh trực giao đã hiệu chỉnh hình học và gắn đúng vị trí không gian.',
        use:
          'Kiểm tra mặt bằng, ranh giới và vị trí đối tượng.'
      },
      {
        name: 'Point Cloud / COPC',
        format: '3D points',
        summary:
          'Tập hợp điểm 3D mang thông tin vị trí và cao độ.',
        use:
          'Kiểm tra hình học, cao độ và chi tiết dữ liệu điểm.'
      },
      {
        name: '3D Mesh',
        format: 'Textured model',
        summary:
          'Mô hình bề mặt có texture, tái hiện công trình và bối cảnh khu vực.',
        use:
          'Quan sát hiện trạng và trao đổi trực quan trong dự án.'
      },
      {
        name: 'DEM / DSM',
        format: 'Elevation raster',
        summary:
          'Mô hình cao độ biểu diễn địa hình hoặc bề mặt có vật thể.',
        use:
          'Đọc cao độ, kiểm tra địa hình và phân tích bề mặt.'
      }
    ],

    detailEyebrow: 'TỔ CHỨC DỮ LIỆU',
    detailTitle: 'Từ output đến Web GIS',
    detailBody:
      'Các lớp đầu ra được chuẩn hóa trong cùng hệ tọa độ để người dùng chuyển đổi giữa ảnh, mô hình, dữ liệu điểm và lớp cao độ trong cùng một project.',
    detailItems: [
      {
        title: 'Orthophoto để đọc mặt bằng',
        body:
          'Phù hợp khi cần nhìn nhanh toàn khu vực, xác định ranh giới và đối chiếu vị trí theo mặt phẳng.'
      },
      {
        title: 'Point Cloud để đọc hình học',
        body:
          'Giữ cấu trúc điểm 3D chi tiết hơn, phù hợp khi cần kiểm tra hình dạng, cao độ hoặc mật độ dữ liệu.'
      },
      {
        title: '3D Mesh để hiểu bối cảnh',
        body:
          'Cho cảm giác trực quan về công trình và địa hình, hữu ích khi review hiện trạng hoặc trao đổi với người không chuyên GIS.'
      },
      {
        title: 'DEM / DSM để phân tích bề mặt',
        body:
          'Dùng khi cần biểu diễn cao độ liên tục và thực hiện các phân tích liên quan đến địa hình hoặc bề mặt.'
      }
    ],
    detailCaption:
      'Các lớp dữ liệu được tổ chức trong cùng bối cảnh không gian để so sánh và kiểm tra',

    webgisEyebrow: 'ĐƯA VÀO WEB GIS',
    webgisTitle: 'Giá trị nằm ở cách các lớp dữ liệu được sử dụng cùng nhau',
    webgisBody:
      'Sau khi xử lý, dữ liệu được tổ chức theo project để Viewer hiển thị các lớp tương ứng. Người dùng có thể bật/tắt lớp, đo đạc và truy cập cùng một bối cảnh dữ liệu theo phạm vi đã thiết lập.',
    webgisItems: [
      'Bật / tắt từng lớp dữ liệu theo nhu cầu kiểm tra',
      'Đối chiếu Point Cloud, 3D Mesh, DOM và lớp cao độ khi project có các lớp dữ liệu tương ứng',
      'Thực hiện các phép đo trực tiếp trên dữ liệu đang hiển thị',
      'Truy cập project theo phạm vi quyền đã thiết lập thay vì xử lý từng file đầu ra riêng lẻ'
    ],
    webgisCaption:
      'Viewer hiển thị dữ liệu theo lớp để người dùng chuyển đổi nhanh giữa các loại đầu ra',

    qualityEyebrow: 'LƯU Ý KHI BÀN GIAO',
    qualityTitle: 'Kiểm tra trước khi bàn giao',
    qualityBody:
      'File xuất thành công chưa đồng nghĩa với dữ liệu sẵn sàng bàn giao. Trước khi đưa vào Web GIS hoặc gửi khách hàng, cần kiểm tra tính đầy đủ và tính nhất quán của toàn bộ bộ dữ liệu.',
    qualityItems: [
      'Kiểm tra phạm vi dữ liệu và vùng thiếu trước khi xuất bản',
      'Giữ thống nhất hệ tọa độ giữa các lớp đầu ra',
      'Kiểm tra trực quan DOM, Mesh, Point Cloud và DEM / DSM',
      'Đặt tên và tổ chức file rõ ràng để dễ quản lý theo project'
    ],

    finalTitle: 'Xem các lớp dữ liệu này trong một project 3D Mapping thực tế',
    finalBody:
      'Mở Demo để xem cách dữ liệu khảo sát sau xử lý được tổ chức thành các lớp và khai thác trực tiếp trên nền tảng Web GIS.',
    workflowButton: 'Xem quy trình 3D Mapping',
    footer: '3D Data Outputs · Point Cloud · Mesh · DOM · DEM/DSM'
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',

    eyebrow: 'RESOURCES · 3D DATA OUTPUTS',
    heroTitle1: '3D Mapping outputs for',
    heroTitle2: 'Web GIS projects',
    heroBody:
      'Processed survey data is organized into layers for inspection, measurement, site review and direct use in Web GIS.',
    heroPrimary: 'Explore output types',
    heroSecondary: 'Request Demo',
    heroCaption:
      '3D project after processed layers are standardized and published to the Viewer',

    overviewEyebrow: 'CORE OUTPUT TYPES',
    overviewTitle: 'Four core output types',
    overviewBody:
      'Each layer supports a different task. The selected outputs depend on the survey objective, capture sensor and project delivery requirements.',
    outputs: [
      {
        name: 'Orthophoto / DOM',
        format: 'Raster map',
        summary:
          'A geometrically corrected top-down image aligned to the project spatial reference.',
        use:
          'Review site layout, boundaries, object positions and the overall survey area.'
      },
      {
        name: 'Point Cloud / COPC',
        format: '3D points',
        summary:
          'A set of 3D points carrying position and elevation, suitable for LiDAR or reconstructed point-cloud data.',
        use:
          'Inspect geometry, elevation and detailed point data directly in the Viewer.'
      },
      {
        name: '3D Mesh',
        format: 'Textured model',
        summary:
          'A textured surface representation of terrain, structures and the surrounding site context.',
        use:
          'Review existing conditions and communicate project context visually.'
      },
      {
        name: 'DEM / DSM',
        format: 'Elevation raster',
        summary:
          'Elevation models representing terrain or top surfaces for continuous surface analysis.',
        use:
          'Review elevation, terrain conditions and support surface-based analysis.'
      }
    ],

    detailEyebrow: 'DATA ORGANIZATION',
    detailTitle: 'From outputs to Web GIS',
    detailBody:
      'A project can contain several output layers at once. Instead of reviewing files separately, layers can share the same coordinate reference and be switched according to the inspection task.',
    detailItems: [
      {
        title: 'Orthophoto for plan-view inspection',
        body:
          'Useful when the priority is site-wide coverage, boundaries and positions from a top-down view.'
      },
      {
        title: 'Point Cloud for geometry',
        body:
          'Retains detailed 3D point structure and is useful for reviewing shape, elevation and point density.'
      },
      {
        title: '3D Mesh for context',
        body:
          'Provides an intuitive representation of structures and terrain for site review and project communication.'
      },
      {
        title: 'DEM / DSM for surface analysis',
        body:
          'Useful when the task requires a continuous elevation surface for terrain or surface-based analysis.'
      }
    ],
    detailCaption:
      'Output layers organized in the same spatial context for comparison and review',

    webgisEyebrow: 'PUBLISH TO WEB GIS',
    webgisTitle: 'The value comes from using the layers together',
    webgisBody:
      'After processing, outputs are organized by project so the Viewer can display the corresponding layers. Users can switch layers, measure data and access the same project context according to the configured scope.',
    webgisItems: [
      'Turn individual data layers on or off as needed',
      'Compare Point Cloud, 3D Mesh, DOM and elevation layers when the corresponding project layers are available',
      'Perform measurements directly on the displayed data',
      'Access the project according to the configured scope instead of handling each output file separately'
    ],
    webgisCaption:
      'The Viewer organizes outputs as layers so users can switch quickly between data types',

    qualityEyebrow: 'DELIVERY CHECK',
    qualityTitle: 'Check before delivery',
    qualityBody:
      'A successful export does not automatically mean the dataset is ready for delivery. Coverage, coordinate reference and dataset consistency should be checked before publication.',
    qualityItems: [
      'Review data coverage and missing areas before publishing',
      'Keep the coordinate reference consistent across outputs',
      'Visually inspect DOM, Mesh, Point Cloud and DEM / DSM',
      'Use a clear file and layer naming structure for project management'
    ],

    finalTitle: 'See these outputs inside a real 3D Mapping project',
    finalBody:
      'Open the Demo to see how processed survey data is organized into layers and used directly in the Web GIS platform.',
    workflowButton: 'View 3D Mapping workflow',
    footer: '3D Data Outputs · Point Cloud · Mesh · DOM · DEM/DSM'
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',

    eyebrow: '资源 · 三维数据成果',
    heroTitle1: '三维建图成果用于',
    heroTitle2: 'Web GIS 项目',
    heroBody:
      '三维建图流程并不止于生成一个视觉模型。处理后的数据需要组织成适合检查、测量、现场核查和 Web GIS 使用的空间图层。',
    heroPrimary: '查看成果类型',
    heroSecondary: '申请演示',
    heroCaption:
      '处理后的数据图层经过标准化并发布到 Viewer 中的三维项目',

    overviewEyebrow: '主要成果类型',
    overviewTitle: '四类主要数据成果',
    overviewBody:
      '不同图层对应不同使用目的。最终交付内容取决于测绘目标、采集传感器以及项目要求。',
    outputs: [
      {
        name: '正射影像 / DOM',
        format: '栅格地图',
        summary:
          '经过几何校正并匹配项目空间参考的俯视影像。',
        use:
          '用于查看场地平面、边界、对象位置和整体测区。'
      },
      {
        name: '点云 / COPC',
        format: '三维点',
        summary:
          '包含位置和高程信息的三维点集合，可来自 LiDAR 或重建点云。',
        use:
          '用于检查几何、高程以及 Viewer 中的详细点数据。'
      },
      {
        name: '3D Mesh',
        format: '纹理模型',
        summary:
          '带纹理的表面模型，用于表达地形、建筑物和周边环境。',
        use:
          '用于现场现状查看以及更直观的项目沟通。'
      },
      {
        name: 'DEM / DSM',
        format: '高程栅格',
        summary:
          '连续表达地形或表面高程的数据模型。',
        use:
          '用于高程检查、地形核查和基于表面的分析。'
      }
    ],

    detailEyebrow: '数据组织',
    detailTitle: '从成果到 Web GIS',
    detailBody:
      '一个项目可以同时包含多个成果图层。通过统一坐标参考，用户可以在影像、模型和点数据之间快速切换。',
    detailItems: [
      {
        title: '正射影像用于平面检查',
        body:
          '适合快速查看整个测区、边界和俯视位置关系。'
      },
      {
        title: '点云用于几何检查',
        body:
          '保留更详细的三维点结构，适合查看形状、高程和点密度。'
      },
      {
        title: '3D Mesh 用于理解环境',
        body:
          '提供直观的建筑和地形表现，适合现场审查和项目沟通。'
      },
      {
        title: 'DEM / DSM 用于表面分析',
        body:
          '当任务需要连续高程表面进行地形或表面分析时使用。'
      }
    ],
    detailCaption:
      '多个成果图层在同一空间背景下组织，用于比较和检查',

    webgisEyebrow: '发布到 WEB GIS',
    webgisTitle: '真正的价值来自多种图层的组合使用',
    webgisBody:
      '数据处理完成后，成果按项目组织，使 Viewer 能够显示相应图层。用户可以切换图层、直接测量，并根据已配置的访问范围使用同一项目背景。',
    webgisItems: [
      '根据需要开关不同数据图层',
      '当项目具备相应图层时，在同一项目中比较点云、3D Mesh、DOM 和高程数据',
      '直接在当前显示的数据上进行测量',
      '根据已配置的访问范围使用项目，而无需分别处理每个成果文件'
    ],
    webgisCaption:
      'Viewer 以图层方式组织成果，方便用户快速切换数据类型',

    qualityEyebrow: '交付检查',
    qualityTitle: '交付前检查',
    qualityBody:
      '成功导出文件并不代表数据已经可以交付。在发布前仍需检查覆盖范围、坐标参考以及不同成果之间的一致性。',
    qualityItems: [
      '发布前检查覆盖范围和缺失区域',
      '确保所有成果采用一致的坐标参考',
      '直观检查 DOM、Mesh、点云和 DEM / DSM',
      '使用清晰的文件和图层命名方式管理项目'
    ],

    finalTitle: '在真实三维建图项目中查看这些成果',
    finalBody:
      '打开 Demo，查看处理后的测绘数据如何组织成图层并直接用于 Web GIS 平台。',
    workflowButton: '查看 3D Mapping 流程',
    footer: '3D Data Outputs · Point Cloud · Mesh · DOM · DEM/DSM'
  }
};


const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
    outputLabel: string;
    typeLabel: string;
    purposeLabel: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
    outputLabel: 'OUTPUT',
    typeLabel: 'DATA TYPE',
    purposeLabel: 'MỤC ĐÍCH',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
    outputLabel: 'OUTPUT',
    typeLabel: 'DATA TYPE',
    purposeLabel: 'USE',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
    outputLabel: 'OUTPUT',
    typeLabel: 'DATA TYPE',
    purposeLabel: '用途',
  },
};

const readInitialTheme = () => {
  if (typeof window === 'undefined') return true;

  const saved =
    window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (saved === 'light') return false;
  if (saved === 'dark') return true;

  return true;
};

/*
 * Hallmark
 * component: output-3d-data-page
 * genre: technical-editorial / data-atlas
 * theme: saolatek-product-dna
 * visual-anchor: viewer-data-layers
 * density: medium
 *
 * layout:
 * - hero
 * - output family bands
 * - layer-stack visual
 * - output reading guide
 * - Web GIS usage strip
 * - delivery quality gate
 * - compact CTA
 *
 * business logic:
 * - preserve useDemoNavigation()
 * - preserve workflow route
 * - preserve VI / EN / ZH
 */

export const Output3DDataPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    openDemo,
    isDemoLoading,
  } = useDemoNavigation();

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(readInitialTheme);

  const c = COPY[currentLang];
  const themeCopy = THEME_COPY[currentLang];

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

  const scrollToOutputs = () => {
    document.getElementById('output-types')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const themeLabel =
    isDarkMode
      ? themeCopy.switchToLight
      : themeCopy.switchToDark;

  return (
    <>
      <style>{`
        .out-root {
          --out-bg: #050914;
          --out-bg-2: #07101c;
          --out-surface: #0b1523;

          --out-ink: #f8fafc;
          --out-muted: #94a3b8;
          --out-soft: #64748b;

          --out-border: rgba(255,255,255,.09);
          --out-border-strong: rgba(255,255,255,.16);

          --out-accent: #38bdf8;
          --out-accent-strong: #0ea5e9;
          --out-cta-ink: #03111d;

          --out-header: rgba(5,9,20,.88);
          --out-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .out-root.out-light {
          --out-bg: #f8fafc;
          --out-bg-2: #eef4f8;
          --out-surface: #ffffff;

          --out-ink: #0f172a;
          --out-muted: #526174;
          --out-soft: #64748b;

          --out-border: rgba(15,23,42,.11);
          --out-border-strong: rgba(15,23,42,.20);

          --out-accent: #0369a1;
          --out-accent-strong: #0284c7;
          --out-cta-ink: #ffffff;

          --out-header: rgba(248,250,252,.90);
          --out-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .out-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--out-bg);
          color: var(--out-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .out-header {
          background: var(--out-header);
        }

        .out-media {
          box-shadow: var(--out-shadow);
        }

        .out-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--out-bg),
            0 0 0 4px var(--out-accent);
        }

        .out-theme-toggle {
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
          border: 1px solid rgba(255,255,255,.20);
          background:
            linear-gradient(
              180deg,
              #2a80f1 0%,
              #70a7ff 100%
            );
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,.10),
            0 1px 2px rgba(255,255,255,.05);
          transition:
            background .4s cubic-bezier(.16,1,.3,1),
            border-color .4s cubic-bezier(.16,1,.3,1);
        }

        .out-theme-toggle:focus-visible {
          outline: 2px solid var(--out-accent);
          outline-offset: 3px;
        }

        .out-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .out-theme-toggle__thumb {
          position: absolute;
          left: 4px;
          top: 4px;
          width: 24px;
          height: 24px;
          z-index: 3;
          border-radius: 50%;
          background: #ffd34e;
          box-shadow:
            0 0 10px rgba(255,211,78,.75);
          transition:
            transform .4s cubic-bezier(.16,1,.3,1),
            background .4s cubic-bezier(.16,1,.3,1),
            box-shadow .4s cubic-bezier(.16,1,.3,1);
        }

        .out-theme-toggle.is-dark
        .out-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .out-theme-toggle__clouds,
        .out-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .out-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .out-theme-toggle.is-dark
        .out-theme-toggle__clouds {
          opacity: 0;
        }

        .out-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .out-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .out-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .out-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .out-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .out-theme-toggle.is-dark
        .out-theme-toggle__stars {
          opacity: 1;
        }

        .out-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            out-star-pulse
            2s infinite ease-in-out;
        }

        .out-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .out-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .out-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes out-star-pulse {
          0%, 100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .out-root *,
          .out-root *::before,
          .out-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`out-root ${
          isDarkMode ? '' : 'out-light'
        }`}
      >
        <header className="out-header sticky top-0 z-50 border-b border-[var(--out-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="out-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                ariaLabel={c.languageLabel}
              />

              <button
                type="button"
                onClick={() =>
                  setIsDarkMode(
                    (current) => !current
                  )
                }
                aria-label={themeLabel}
                title={themeLabel}
                aria-pressed={isDarkMode}
                className={`out-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="out-theme-toggle__clouds">
                  <div className="out-theme-toggle__cloud out-theme-toggle__cloud-1" />
                  <div className="out-theme-toggle__cloud out-theme-toggle__cloud-2" />
                  <div className="out-theme-toggle__cloud out-theme-toggle__cloud-3" />
                </div>

                <div className="out-theme-toggle__stars">
                  <div className="out-theme-toggle__star out-theme-toggle__star-1" />
                  <div className="out-theme-toggle__star out-theme-toggle__star-2" />
                  <div className="out-theme-toggle__star out-theme-toggle__star-3" />
                </div>

                <div className="out-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="out-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--out-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--out-muted)] transition-colors hover:text-[var(--out-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="out-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--out-accent)] px-3.5 text-sm font-bold text-[var(--out-cta-ink)] transition-colors hover:bg-[var(--out-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isDemoLoading
                    ? themeCopy.demoLoading
                    : c.demo}
                </span>

                {isDemoLoading ? (
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
          <section className="border-b border-[var(--out-border)] bg-[var(--out-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.80fr)_minmax(0,1.20fr)] lg:items-center lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--out-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--out-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--out-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={scrollToOutputs}
                      className="out-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--out-accent)] px-6 text-sm font-bold text-[var(--out-cta-ink)] transition-colors hover:bg-[var(--out-accent-strong)]"
                    >
                      {c.heroPrimary}
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="out-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--out-border)] px-6 text-sm font-semibold text-[var(--out-ink)] transition-colors hover:border-[var(--out-border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDemoLoading
                        ? themeCopy.demoLoading
                        : c.heroSecondary}
                    </button>
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="out-media overflow-hidden rounded-xl border border-[var(--out-border)] bg-black sm:rounded-2xl">
                    <img
                      src={viewerHeroImage}
                      alt={c.heroCaption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--out-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* OUTPUT FAMILIES */}
          <section
            id="output-types"
            className="scroll-mt-[88px] border-b border-[var(--out-border)] bg-[var(--out-bg-2)]"
          >
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--out-accent)]">
                  {c.overviewEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.overviewTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--out-muted)]">
                  {c.overviewBody}
                </p>
              </div>

              <div className="mt-10 border-y border-[var(--out-border)]">
                {c.outputs.map((item) => (
                  <article
                    key={item.name}
                    className="grid grid-cols-1 gap-5 border-b border-[var(--out-border)] py-6 last:border-b-0 md:grid-cols-[190px_150px_minmax(0,1fr)] md:gap-8"
                  >
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--out-accent)]">
                        {themeCopy.outputLabel}
                      </div>

                      <h3 className="mt-2 text-lg font-semibold">
                        {item.name}
                      </h3>
                    </div>

                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--out-soft)]">
                        {themeCopy.typeLabel}
                      </div>

                      <div className="mt-2 text-sm font-semibold text-[var(--out-accent)]">
                        {item.format}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-8">
                      <p className="text-sm leading-7 text-[var(--out-muted)]">
                        {item.summary}
                      </p>

                      <div>
                        <div className="font-mono text-[10px] font-bold tracking-[.12em] text-[var(--out-soft)] lg:hidden">
                          {themeCopy.purposeLabel}
                        </div>

                        <p className="mt-2 text-sm leading-7 text-[var(--out-muted)] lg:mt-0">
                          {item.use}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* LAYER STACK VISUAL */}
          <section className="border-b border-[var(--out-border)] bg-[var(--out-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.56fr)_minmax(300px,.44fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--out-accent)]">
                    {c.detailEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.detailTitle}
                  </h2>
                </div>

                <p className="max-w-[650px] text-base leading-7 text-[var(--out-muted)] lg:justify-self-end">
                  {c.detailBody}
                </p>
              </div>

              <figure className="mt-10 min-w-0">
                <div className="out-media overflow-hidden rounded-xl border border-[var(--out-border)] bg-black sm:rounded-2xl">
                  <img
                    src={viewerAreaImage}
                    alt={c.detailCaption}
                    className="aspect-[21/9] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--out-muted)]">
                  {c.detailCaption}
                </figcaption>
              </figure>
            </div>
          </section>

          {/* OUTPUT READING GUIDE */}
          <section className="border-b border-[var(--out-border)] bg-[var(--out-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-x-12 border-t border-[var(--out-border)] md:grid-cols-2">
                {c.detailItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--out-border)] py-7"
                  >
                    <h3 className="max-w-[24ch] text-xl font-semibold leading-7">
                      {item.title}
                    </h3>

                    <p className="mt-3 max-w-[620px] text-sm leading-7 text-[var(--out-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* WEB GIS USAGE */}
          <section className="border-b border-[var(--out-border)] bg-[var(--out-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--out-accent)]">
                    {c.webgisEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.webgisTitle}
                  </h2>

                  <p className="mt-5 max-w-[600px] text-base leading-7 text-[var(--out-muted)]">
                    {c.webgisBody}
                  </p>
                </div>

                <div className="grid grid-cols-1 border-y border-[var(--out-border)] sm:grid-cols-2">
                  {c.webgisItems.map((item, index) => (
                    <p
                      key={item}
                      className={`min-h-[116px] border-b border-[var(--out-border)] py-5 text-sm leading-7 text-[var(--out-muted)] ${
                        index % 2 === 0
                          ? 'sm:border-r sm:pr-6'
                          : 'sm:pl-6'
                      }`}
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DELIVERY QUALITY GATE */}
          <section className="border-b border-[var(--out-border)] bg-[var(--out-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1080px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--out-accent)]">
                  {c.qualityEyebrow}
                </div>

                <h2 className="mt-4 max-w-[20ch] text-[32px] font-semibold leading-[1.06] tracking-[-.04em] md:text-[42px] lg:text-[48px]">
                  {c.qualityTitle}
                </h2>

                <p className="mt-5 max-w-[780px] text-base leading-7 text-[var(--out-muted)]">
                  {c.qualityBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-x-12 border-t border-[var(--out-border)] md:grid-cols-2">
                {c.qualityItems.map((item) => (
                  <p
                    key={item}
                    className="border-b border-[var(--out-border)] py-5 text-sm leading-7 text-[var(--out-muted)]"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--out-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--out-border)] py-9 lg:grid-cols-[minmax(0,.60fr)_minmax(320px,.40fr)] lg:items-end lg:gap-16">
                <div>
                  <h2 className="max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--out-muted)]">
                    {c.finalBody}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          '/resources/3d-mapping-workflow'
                        )
                      }
                      className="out-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--out-border)] px-6 text-sm font-semibold text-[var(--out-ink)] transition-colors hover:border-[var(--out-border-strong)]"
                    >
                      {c.workflowButton}
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="out-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--out-accent)] px-6 text-sm font-bold text-[var(--out-cta-ink)] transition-colors hover:bg-[var(--out-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDemoLoading ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          {themeCopy.demoLoading}
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
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--out-border)] bg-[var(--out-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--out-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default Output3DDataPage;