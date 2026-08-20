import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import surveyingFieldImage from '../assets/surveying-field-team.jpg';
import surveyingFlightPlanImage from '../assets/surveying-flight-plan.jpg';
import surveyingVideo from '../assets/videos/surveying-shtp.mp4';

import { SolutionLanguageSwitcher } from '../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';

const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
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


type CardItem = {
  title: string;
  body: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;
  openDemo3D: string;
  measurementLink: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroTags: [string, string, string];
  fieldSurvey: string;
  uavMapping: string;
  fieldOperations: string;
  heroCaption: string;

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflowItems: [CardItem, CardItem, CardItem, CardItem];

  fieldEyebrow: string;
  fieldTitle: string;
  fieldBody: string;
  missionPlanning: string;
  missionCaption: string;
  fieldItems: [CardItem, CardItem, CardItem];

  outputEyebrow: string;
  outputTitle: string;
  outputBody: string;
  outputItems: [CardItem, CardItem, CardItem];
  projectView: string;
  projectName: string;

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  measureItems: [CardItem, CardItem, CardItem];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
  valueItems: [string, string, string, string, string];
  surveyWorkflow: string;

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
    measurementLink: 'Xem công cụ đo đạc',

    eyebrow: 'GIẢI PHÁP KHẢO SÁT & ĐO ĐẠC',
    heroTitle1: 'Từ hiện trường đến một project',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Kết nối dữ liệu thu nhận từ UAV và LiDAR với DOM, mô hình 3D và Point Cloud để quan sát, đo đạc và chia sẻ dữ liệu khảo sát trực tiếp trên trình duyệt.',
    heroTags: ['UAV / LiDAR', '3D Mapping', 'Đo đạc'],
    fieldSurvey: 'KHẢO SÁT HIỆN TRƯỜNG',
    uavMapping: 'UAV MAPPING',
    fieldOperations: 'VẬN HÀNH HIỆN TRƯỜNG',
    heroCaption:
      'Thiết lập nhiệm vụ và kiểm soát quá trình thu nhận dữ liệu ngay tại hiện trường',

    workflowEyebrow: 'WORKFLOW KHẢO SÁT',
    workflowTitle: 'Một luồng dữ liệu liên tục từ hiện trường đến Viewer',
    workflowBody:
      'Quy trình được tổ chức theo project để dữ liệu thu nhận ngoài hiện trường luôn giữ đúng bối cảnh khi đưa lên nền tảng.',
    workflowItems: [
      {
        title: 'Khảo sát hiện trường',
        body: 'Thu nhận dữ liệu khu vực bằng UAV, LiDAR và các thiết bị phù hợp với phạm vi khảo sát.',
      },
      {
        title: 'Chuẩn bị dữ liệu',
        body: 'Xử lý và tổ chức dữ liệu khảo sát thành các lớp phù hợp cho project Web GIS.',
      },
      {
        title: 'Đưa lên Viewer',
        body: 'Tập trung DOM, 3D Mesh và Point Cloud trong cùng một không gian dự án.',
      },
      {
        title: 'Đo đạc & chia sẻ',
        body: 'Kiểm tra dữ liệu trực tiếp trên trình duyệt và chia sẻ project theo quyền truy cập.',
      },
    ],

    fieldEyebrow: 'VẬN HÀNH HIỆN TRƯỜNG',
    fieldTitle: 'Kiểm soát phạm vi khảo sát trước khi dữ liệu đi vào pipeline 3D',
    fieldBody:
      'Việc tổ chức nhiệm vụ ngay từ hiện trường giúp phạm vi dữ liệu rõ ràng hơn khi đưa sang bước xử lý và hiển thị trên Web GIS.',
    missionPlanning: 'LẬP KẾ HOẠCH NHIỆM VỤ',
    missionCaption:
      'Theo dõi phạm vi nhiệm vụ và khu vực thu nhận dữ liệu tại hiện trường',
    fieldItems: [
      {
        title: 'Thiết lập phạm vi bay',
        body: 'Xác định khu vực khảo sát, lộ trình và phạm vi dữ liệu cần thu nhận trước khi triển khai.',
      },
      {
        title: 'Theo dõi nhiệm vụ',
        body: 'Kiểm tra trạng thái nhiệm vụ và phạm vi thu nhận trực tiếp trên thiết bị điều khiển tại hiện trường.',
      },
      {
        title: 'Đồng bộ dữ liệu đầu vào',
        body: 'Tổ chức dữ liệu hiện trường để phục vụ các bước xử lý DOM, 3D Mesh và Point Cloud.',
      },
    ],

    outputEyebrow: 'DỮ LIỆU ĐẦU RA',
    outputTitle: 'Dữ liệu khảo sát được tổ chức thành các lớp có thể khai thác trực tiếp',
    outputBody:
      'Sau xử lý, dữ liệu có thể được đưa vào project dưới nhiều lớp để người dùng lựa chọn góc nhìn phù hợp với mục tiêu kiểm tra.',
    outputItems: [
      {
        title: 'Ảnh trực giao DOM',
        body: 'Quan sát mặt bằng tổng thể và phạm vi khảo sát theo góc nhìn từ trên xuống.',
      },
      {
        title: 'Mô hình 3D Mesh',
        body: 'Quan sát hình dạng, bề mặt và bối cảnh không gian của khu vực khảo sát.',
      },
      {
        title: 'Point Cloud',
        body: 'Kiểm tra dữ liệu điểm 3D tại các vị trí cần quan sát chi tiết hơn.',
      },
    ],
    projectView: 'PROJECT VIEW',
    projectName: 'Dữ liệu khảo sát Vườn Ươm SHTP',

    measureEyebrow: 'ĐO ĐẠC TRÊN VIEWER',
    measureTitle: 'Kiểm tra thông tin không gian ngay trên dữ liệu khảo sát',
    measureBody:
      'Các phép đo được thực hiện trực tiếp trên dữ liệu đang quan sát, giúp quá trình kiểm tra và trao đổi nhanh hơn.',
    measureItems: [
      {
        title: 'Khoảng cách',
        body: 'Đo khoảng cách giữa nhiều vị trí trực tiếp trên dữ liệu dự án.',
      },
      {
        title: 'Diện tích',
        body: 'Khoanh vùng và xác định diện tích khu vực cần kiểm tra.',
      },
      {
        title: 'Đối chiếu vị trí',
        body: 'Tập trung camera vào vị trí cần trao đổi và giữ đúng bối cảnh không gian.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ CUỐI QUY TRÌNH',
    valueTitle: 'Một không gian dữ liệu chung cho đội khảo sát và đội dự án',
    valueBody:
      'Dữ liệu hiện trường, lớp dữ liệu 3D và các phép đo được tập trung theo project để việc kiểm tra và phối hợp thống nhất hơn.',
    valueItems: [
      'Dữ liệu hiện trường và dữ liệu 3D trong cùng một workflow',
      'DOM, 3D Mesh và Point Cloud trong cùng project',
      'Quan sát và đo đạc trực tiếp trên trình duyệt',
      'Chuyển nhanh giữa góc nhìn tổng thể và chi tiết',
      'Chia sẻ project theo quyền thành viên',
    ],
    surveyWorkflow: 'Quy trình khảo sát',

    finalEyebrow: 'SURVEYING · UAV · LiDAR · WEB GIS',
    finalTitle: 'Trải nghiệm toàn bộ luồng dữ liệu khảo sát trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem trực tiếp cách dữ liệu khảo sát được hiển thị, đo đạc và chia sẻ trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'Khảo sát · UAV · LiDAR · 3D Mapping',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    measurementLink: 'View measurement tools',

    eyebrow: 'SURVEYING & MEASUREMENT SOLUTION',
    heroTitle1: 'From field operations to a',
    heroTitle2: '3D Web GIS project',
    heroBody:
      'Connect UAV and LiDAR capture with orthophotos, 3D models and Point Cloud data so teams can inspect, measure and share survey information directly in the browser.',
    heroTags: ['UAV / LiDAR', '3D Mapping', 'Measurement'],
    fieldSurvey: 'FIELD SURVEY',
    uavMapping: 'UAV MAPPING',
    fieldOperations: 'FIELD OPERATIONS',
    heroCaption:
      'Plan missions and control data capture directly at the survey site',

    workflowEyebrow: 'SURVEY WORKFLOW',
    workflowTitle: 'A continuous data flow from the field to the Viewer',
    workflowBody:
      'The workflow is organized by project so captured field data keeps the correct context when it moves into the platform.',
    workflowItems: [
      {
        title: 'Field survey',
        body: 'Capture the site with UAV, LiDAR and other equipment appropriate to the survey scope.',
      },
      {
        title: 'Prepare data',
        body: 'Process and organize survey data into layers that are ready for a Web GIS project.',
      },
      {
        title: 'Load into Viewer',
        body: 'Bring orthophotos, 3D Mesh and Point Cloud into the same project space.',
      },
      {
        title: 'Measure & share',
        body: 'Inspect data in the browser and share the project according to access permissions.',
      },
    ],

    fieldEyebrow: 'FIELD OPERATIONS',
    fieldTitle: 'Control survey coverage before data enters the 3D pipeline',
    fieldBody:
      'Organizing the mission at the field stage makes the survey extent clearer when data moves into processing and Web GIS visualization.',
    missionPlanning: 'MISSION PLANNING',
    missionCaption:
      'Track mission coverage and capture areas directly in the field',
    fieldItems: [
      {
        title: 'Define flight coverage',
        body: 'Set the survey area, route and required capture extent before deployment.',
      },
      {
        title: 'Monitor the mission',
        body: 'Check mission status and capture coverage on the field controller.',
      },
      {
        title: 'Synchronize input data',
        body: 'Organize field data for orthophoto, 3D Mesh and Point Cloud processing.',
      },
    ],

    outputEyebrow: 'SURVEY OUTPUTS',
    outputTitle: 'Survey data becomes layers that can be used directly in the Viewer',
    outputBody:
      'After processing, data can be loaded as multiple project layers so users can choose the most appropriate view for each inspection task.',
    outputItems: [
      {
        title: 'Orthophoto / DOM',
        body: 'Inspect overall site coverage from an accurate top-down view.',
      },
      {
        title: '3D Mesh',
        body: 'Inspect shape, surface and spatial context of the surveyed area.',
      },
      {
        title: 'Point Cloud',
        body: 'Review detailed 3D point data at locations that require closer inspection.',
      },
    ],
    projectView: 'PROJECT VIEW',
    projectName: 'SHTP Incubation Center survey data',

    measureEyebrow: 'MEASUREMENT IN VIEWER',
    measureTitle: 'Check spatial information directly on survey data',
    measureBody:
      'Measurements are performed on the data being viewed, making inspection and project discussions faster.',
    measureItems: [
      {
        title: 'Distance',
        body: 'Measure distances between multiple positions directly in project data.',
      },
      {
        title: 'Area',
        body: 'Draw a region and calculate the area that needs to be checked.',
      },
      {
        title: 'Position review',
        body: 'Focus the camera on a discussion point while preserving its spatial context.',
      },
    ],

    valueEyebrow: 'END-TO-END VALUE',
    valueTitle: 'One shared data space for survey and project teams',
    valueBody:
      'Field data, 3D layers and measurements stay organized by project so inspection and coordination remain consistent.',
    valueItems: [
      'Field data and 3D data in one workflow',
      'Orthophoto, 3D Mesh and Point Cloud in one project',
      'Browser-based viewing and measurement',
      'Fast switching between overview and detail',
      'Project sharing based on member access',
    ],
    surveyWorkflow: 'Survey workflow',

    finalEyebrow: 'SURVEYING · UAV · LiDAR · WEB GIS',
    finalTitle: 'Experience the full survey-data workflow inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and see how survey data is visualized, measured and shared directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'Surveying · UAV · LiDAR · 3D Mapping',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    measurementLink: '查看测量工具',

    eyebrow: '测绘与测量解决方案',
    heroTitle1: '从现场作业到一个',
    heroTitle2: '3D Web GIS 项目',
    heroBody:
      '将无人机与 LiDAR 采集的数据连接到正射影像、3D 模型和点云，使团队能够直接在浏览器中查看、测量和共享测绘数据。',
    heroTags: ['UAV / LiDAR', '3D Mapping', '测量'],
    fieldSurvey: '现场测绘',
    uavMapping: 'UAV MAPPING',
    fieldOperations: '现场作业',
    heroCaption:
      '在测绘现场规划任务并控制数据采集过程',

    workflowEyebrow: '测绘工作流程',
    workflowTitle: '从现场到 Viewer 的连续数据流程',
    workflowBody:
      '工作流程以项目为单位组织，使现场采集的数据在进入平台后仍保持正确的项目背景。',
    workflowItems: [
      {
        title: '现场测绘',
        body: '使用无人机、LiDAR 和适合测绘范围的设备采集区域数据。',
      },
      {
        title: '准备数据',
        body: '处理并组织测绘数据，使其成为适用于 Web GIS 项目的数据图层。',
      },
      {
        title: '加载到 Viewer',
        body: '将正射影像、3D Mesh 和点云集中到同一项目空间。',
      },
      {
        title: '测量与共享',
        body: '直接在浏览器中检查数据，并根据访问权限共享项目。',
      },
    ],

    fieldEyebrow: '现场作业',
    fieldTitle: '在数据进入 3D 处理流程前控制测绘范围',
    fieldBody:
      '在现场阶段组织任务，可以让数据进入处理和 Web GIS 可视化之前拥有更清晰的采集范围。',
    missionPlanning: '任务规划',
    missionCaption:
      '在现场跟踪任务范围和数据采集区域',
    fieldItems: [
      {
        title: '设置飞行范围',
        body: '在实施前确定测绘区域、飞行路线和需要采集的数据范围。',
      },
      {
        title: '监控任务',
        body: '在现场控制设备上检查任务状态和采集覆盖范围。',
      },
      {
        title: '同步输入数据',
        body: '组织现场数据，为正射影像、3D Mesh 和点云处理做好准备。',
      },
    ],

    outputEyebrow: '测绘成果',
    outputTitle: '测绘数据被组织为可直接使用的项目图层',
    outputBody:
      '数据处理完成后，可以作为多个项目图层加载，使用户能够针对不同检查任务选择合适的查看方式。',
    outputItems: [
      {
        title: '正射影像 DOM',
        body: '通过自上而下的视角查看整体区域和测绘范围。',
      },
      {
        title: '3D Mesh 模型',
        body: '查看测绘区域的形状、表面和空间背景。',
      },
      {
        title: 'Point Cloud 点云',
        body: '在需要更详细检查的位置查看 3D 点数据。',
      },
    ],
    projectView: '项目视图',
    projectName: 'SHTP 孵化中心测绘数据',

    measureEyebrow: 'VIEWER 中的测量',
    measureTitle: '直接在测绘数据上检查空间信息',
    measureBody:
      '测量直接作用于当前查看的数据，使检查和项目沟通更加高效。',
    measureItems: [
      {
        title: '距离',
        body: '直接在项目数据上测量多个位置之间的距离。',
      },
      {
        title: '面积',
        body: '框选需要检查的区域并计算其面积。',
      },
      {
        title: '位置检查',
        body: '将相机聚焦到需要讨论的位置，同时保留其空间背景。',
      },
    ],

    valueEyebrow: '完整流程价值',
    valueTitle: '为测绘团队和项目团队提供统一的数据空间',
    valueBody:
      '现场数据、3D 图层和测量结果都按项目集中管理，使检查和协同更加一致。',
    valueItems: [
      '现场数据与 3D 数据位于同一工作流程',
      '正射影像、3D Mesh 和点云位于同一项目',
      '直接在浏览器中查看和测量',
      '快速切换整体视图和细节视图',
      '按成员访问权限共享项目',
    ],
    surveyWorkflow: '测绘工作流程',

    finalEyebrow: 'SURVEYING · UAV · LiDAR · WEB GIS',
    finalTitle: '在 3D GIS 项目中体验完整的测绘数据流程',
    finalBody:
      '申请演示以打开示例项目，并查看测绘数据如何直接在浏览器中显示、测量和共享。',
    finalButton: '打开演示',
    footer: '测绘 · UAV · LiDAR · 3D Mapping',
  },
};


export const SurveyingSolutionPage: React.FC = () => {
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

  const themeLabel =
    isDarkMode
      ? themeCopy.switchToLight
      : themeCopy.switchToDark;

  return (
    <>
      <style>{`
        .survey-root {
          --survey-bg: #050914;
          --survey-bg-2: #07101c;
          --survey-surface: #0b1523;

          --survey-ink: #f8fafc;
          --survey-muted: #94a3b8;
          --survey-soft: #64748b;

          --survey-border:
            rgba(255,255,255,.09);
          --survey-border-strong:
            rgba(255,255,255,.16);

          --survey-accent: #38bdf8;
          --survey-accent-strong: #0ea5e9;
          --survey-cta-ink: #03111d;

          --survey-header:
            rgba(5,9,20,.88);

          --survey-shadow:
            0 26px 80px
            rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .survey-root.survey-light {
          --survey-bg: #f8fafc;
          --survey-bg-2: #eef4f8;
          --survey-surface: #ffffff;

          --survey-ink: #0f172a;
          --survey-muted: #526174;
          --survey-soft: #64748b;

          --survey-border:
            rgba(15,23,42,.11);
          --survey-border-strong:
            rgba(15,23,42,.20);

          --survey-accent: #0369a1;
          --survey-accent-strong: #0284c7;
          --survey-cta-ink: #ffffff;

          --survey-header:
            rgba(248,250,252,.90);

          --survey-shadow:
            0 24px 65px
            rgba(15,23,42,.14);

          color-scheme: light;
        }

        .survey-root {
          min-height: 100vh;
          overflow-x: clip;

          background:
            var(--survey-bg);

          color:
            var(--survey-ink);

          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .survey-header {
          background:
            var(--survey-header);
        }

        .survey-focus:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 2px var(--survey-bg),
            0 0 0 4px var(--survey-accent);
        }

        .survey-media {
          box-shadow:
            var(--survey-shadow);
        }

        .survey-theme-toggle {
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

        .survey-theme-toggle:focus-visible {
          outline:
            2px solid
            var(--survey-accent);

          outline-offset: 3px;
        }

        .survey-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );

          border-color:
            rgba(255,255,255,.10);
        }

        .survey-theme-toggle__thumb {
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

        .survey-theme-toggle.is-dark
        .survey-theme-toggle__thumb {
          transform:
            translateX(43px);

          background: #eef2ff;

          box-shadow:
            inset -6px -2px 0
              #c7d2fe,
            0 0 9px
              rgba(224,231,255,.5);
        }

        .survey-theme-toggle__clouds,
        .survey-theme-toggle__stars {
          position: absolute;
          inset: 0;

          pointer-events: none;
        }

        .survey-theme-toggle__clouds {
          opacity: 1;
          transition:
            opacity .35s ease;
        }

        .survey-theme-toggle.is-dark
        .survey-theme-toggle__clouds {
          opacity: 0;
        }

        .survey-theme-toggle__cloud {
          position: absolute;

          height: 8px;
          border-radius: 999px;

          background:
            rgba(255,255,255,.82);
        }

        .survey-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .survey-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .survey-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .survey-theme-toggle__stars {
          opacity: 0;
          transition:
            opacity .35s ease;
        }

        .survey-theme-toggle.is-dark
        .survey-theme-toggle__stars {
          opacity: 1;
        }

        .survey-theme-toggle__star {
          position: absolute;

          width: 2px;
          height: 2px;

          border-radius: 50%;
          background: #fff;

          animation:
            survey-star-pulse
            2s infinite ease-in-out;
        }

        .survey-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .survey-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .survey-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes survey-star-pulse {
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
          .survey-root *,
          .survey-root *::before,
          .survey-root *::after {
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
        className={`survey-root ${
          isDarkMode
            ? ''
            : 'survey-light'
        }`}
      >
        <header className="survey-header sticky top-0 z-50 border-b border-[var(--survey-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="survey-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`survey-theme-toggle ${
                  isDarkMode
                    ? 'is-dark'
                    : ''
                }`}
              >
                <div className="survey-theme-toggle__clouds">
                  <div className="survey-theme-toggle__cloud survey-theme-toggle__cloud-1" />
                  <div className="survey-theme-toggle__cloud survey-theme-toggle__cloud-2" />
                  <div className="survey-theme-toggle__cloud survey-theme-toggle__cloud-3" />
                </div>

                <div className="survey-theme-toggle__stars">
                  <div className="survey-theme-toggle__star survey-theme-toggle__star-1" />
                  <div className="survey-theme-toggle__star survey-theme-toggle__star-2" />
                  <div className="survey-theme-toggle__star survey-theme-toggle__star-3" />
                </div>

                <div className="survey-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/')
                }
                className="survey-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--survey-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--survey-muted)] transition-colors hover:text-[var(--survey-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="survey-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--survey-accent)] px-3.5 text-sm font-bold text-[var(--survey-cta-ink)] transition-colors hover:bg-[var(--survey-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--survey-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--survey-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="survey-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--survey-accent)] px-6 text-sm font-bold text-[var(--survey-cta-ink)] transition-colors hover:bg-[var(--survey-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
                          {c.openDemo3D}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          '/platform/measurement-analysis'
                        )
                      }
                      className="survey-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--survey-border)] bg-transparent px-6 text-sm font-semibold text-[var(--survey-ink)] transition-colors hover:border-[var(--survey-border-strong)]"
                    >
                      {c.measurementLink}
                    </button>
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="survey-media overflow-hidden rounded-xl border border-[var(--survey-border)] bg-black sm:rounded-2xl">
                    <img
                      src={surveyingFieldImage}
                      alt={c.fieldSurvey}
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--survey-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* WORKFLOW RIBBON */}
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[960px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                  {c.workflowEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.workflowTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--survey-muted)]">
                  {c.workflowBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto border-y border-[var(--survey-border)]">
                <div className="grid min-w-[980px] grid-cols-4">
                  {c.workflowItems.map((item) => (
                    <article
                      key={item.title}
                      className="min-h-[190px] border-r border-[var(--survey-border)] px-6 py-7 first:pl-0 last:border-r-0 last:pr-0"
                    >
                      <h3 className="text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[var(--survey-muted)]">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FIELD OPERATIONS */}
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.62fr)_minmax(0,.38fr)] lg:items-center lg:gap-16">
                <figure className="min-w-0">
                  <div className="survey-media overflow-hidden rounded-xl border border-[var(--survey-border)] bg-black sm:rounded-2xl">
                    <img
                      src={surveyingFlightPlanImage}
                      alt={c.missionPlanning}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--survey-muted)]">
                    {c.missionCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                    {c.fieldEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.fieldTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--survey-muted)]">
                    {c.fieldBody}
                  </p>

                  <div className="mt-8 space-y-6">
                    {c.fieldItems.map((item) => (
                      <article
                        key={item.title}
                        className="border-t border-[var(--survey-border)] pt-5"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[var(--survey-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* OUTPUT SHOWCASE */}
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:items-start lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                    {c.outputEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.outputTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--survey-muted)]">
                    {c.outputBody}
                  </p>

                  <div className="mt-9 border-y border-[var(--survey-border)]">
                    {c.outputItems.map((item) => (
                      <article
                        key={item.title}
                        className="grid grid-cols-1 gap-2 border-b border-[var(--survey-border)] py-5 last:border-b-0 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="text-sm leading-6 text-[var(--survey-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 lg:sticky lg:top-[96px]">
                  <div className="survey-media overflow-hidden rounded-xl border border-[var(--survey-border)] bg-black sm:rounded-2xl">
                    <div className="border-b border-[var(--survey-border)] bg-[var(--survey-surface)] px-4 py-3">
                      <div className="font-mono text-[10px] font-bold tracking-[.14em] text-[var(--survey-accent)]">
                        {c.projectView}
                      </div>

                      <div className="mt-1 text-sm font-semibold">
                        {c.projectName}
                      </div>
                    </div>

                    <video
                      className="aspect-[16/10] w-full bg-black object-cover"
                      src={surveyingVideo}
                      muted
                      loop
                      autoPlay
                      playsInline
                      controls
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MEASUREMENT BAND */}
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[960px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                  {c.measureEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.measureTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--survey-muted)]">
                  {c.measureBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--survey-border)] lg:grid-cols-3">
                {c.measureItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--survey-border)] py-6 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                  >
                    <h3 className="text-lg font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-[var(--survey-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* PROJECT VALUE */}
          <section className="border-b border-[var(--survey-border)] bg-[var(--survey-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-18 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.54fr)_minmax(0,.46fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                    {c.valueEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.valueTitle}
                  </h2>

                  <p className="mt-5 max-w-[640px] text-base leading-7 text-[var(--survey-muted)]">
                    {c.valueBody}
                  </p>
                </div>

                <div className="border-y border-[var(--survey-border)]">
                  {c.valueItems.map((item) => (
                    <div
                      key={item}
                      className="border-b border-[var(--survey-border)] py-5 text-sm leading-7 text-[var(--survey-muted)] last:border-b-0"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--survey-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-18 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--survey-border)] py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--survey-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[24ch] text-[28px] font-semibold leading-[1.12] tracking-[-.035em] md:text-[36px]">
                    {c.finalTitle}
                  </h2>

                  <p className="mt-4 max-w-[720px] text-base leading-7 text-[var(--survey-muted)]">
                    {c.finalBody}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="survey-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--survey-accent)] px-6 text-sm font-bold text-[var(--survey-cta-ink)] transition-colors hover:bg-[var(--survey-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                      {c.finalButton}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--survey-border)] bg-[var(--survey-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--survey-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default SurveyingSolutionPage;