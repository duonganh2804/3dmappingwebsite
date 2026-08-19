import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import measurementAreaImage from '../../assets/measurement-area.png';
import measurementSectionImage from '../../assets/measurement-section-analysis.png';
import projectSharingOverviewImage from '../../assets/project-sharing-overview.png';

import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../../hooks/useLanguage';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';

type GuideItem = {
  category: string;
  title: string;
  body: string;
  keywords: string[];
};

type TermItem = {
  term: string;
  meaning: string;
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
  searchPlaceholder: string;
  searchEmpty: string;
  heroCaption: string;

  quickEyebrow: string;
  quickTitle: string;
  quickBody: string;
  guideItems: GuideItem[];

  startEyebrow: string;
  startTitle: string;
  startBody: string;
  startSteps: {
    title: string;
    body: string;
  }[];

  viewerEyebrow: string;
  viewerTitle: string;
  viewerBody: string;
  viewerItems: string[];
  viewerCaption: string;

  termsEyebrow: string;
  termsTitle: string;
  termsBody: string;
  terms: TermItem[];

  accessEyebrow: string;
  accessTitle: string;
  accessBody: string;
  accessItems: string[];
  accessCaption: string;

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

    eyebrow: 'TÀI NGUYÊN · TÀI LIỆU HƯỚNG DẪN',
    heroTitle1: 'Hướng dẫn sử dụng',
    heroTitle2: '3D Web GIS theo từng tác vụ',
    heroBody:
      'Tài liệu được tổ chức theo cách người dùng làm việc với project: mở dữ liệu, điều hướng Viewer, quản lý lớp, đo đạc và hiểu các loại dữ liệu 3D đang hiển thị.',
    searchPlaceholder: 'Tìm hướng dẫn: Viewer, Point Cloud, đo diện tích...',
    searchEmpty: 'Chưa có hướng dẫn phù hợp với từ khóa này.',
    heroCaption:
      'Ví dụ thao tác đo diện tích trực tiếp trên dữ liệu project trong Viewer',

    quickEyebrow: 'HƯỚNG DẪN NHANH',
    quickTitle: 'Tìm đúng thao tác trước khi đi sâu vào project',
    quickBody:
      'Các hướng dẫn dưới đây tập trung vào những thao tác thường dùng nhất trên nền tảng.',
    guideItems: [
      {
        category: 'PROJECT',
        title: 'Mở và đọc cấu trúc một project',
        body:
          'Xác định phạm vi project, nhóm dữ liệu đang có và lớp nào cần bật trước khi bắt đầu kiểm tra.',
        keywords: ['project', 'mở project', 'cấu trúc', 'phạm vi']
      },
      {
        category: 'VIEWER',
        title: 'Điều hướng trong 3D Viewer',
        body:
          'Xoay, zoom, thay đổi góc nhìn và tập trung camera vào khu vực cần kiểm tra.',
        keywords: ['viewer', 'xoay', 'zoom', 'camera', 'góc nhìn']
      },
      {
        category: 'LAYERS',
        title: 'Bật / tắt và đối chiếu lớp dữ liệu',
        body:
          'Chuyển giữa Point Cloud, 3D Mesh và các lớp không gian khác khi project có dữ liệu tương ứng để so sánh cùng một vị trí.',
        keywords: ['layer', 'lớp', 'point cloud', 'mesh', 'bật tắt']
      },
      {
        category: 'MEASUREMENT',
        title: 'Đo khoảng cách và diện tích',
        body:
          'Sử dụng công cụ đo trên dữ liệu đang hiển thị để kiểm tra khoảng cách, diện tích hoặc vị trí cần đối chiếu.',
        keywords: ['đo', 'khoảng cách', 'diện tích', 'measurement']
      },
      {
        category: 'DATA',
        title: 'Phân biệt Point Cloud, 3D Mesh và DOM',
        body:
          'Hiểu mỗi loại dữ liệu dùng cho góc nhìn nào để chọn lớp phù hợp khi kiểm tra project.',
        keywords: ['point cloud', '3d mesh', 'dom', 'orthophoto', 'dữ liệu']
      },
      {
        category: 'DEMO ACCESS',
        title: 'Đăng ký và mở project Demo',
        body:
          'Người chưa có quyền đi qua form đăng ký; tài khoản đã được cấp quyền có thể quay lại Viewer để mở project Demo.',
        keywords: ['demo', 'đăng ký', 'quyền', 'tài khoản', 'viewer']
      }
    ],

    startEyebrow: 'BẮT ĐẦU',
    startTitle: 'Một luồng cơ bản khi mở project lần đầu',
    startBody:
      'Không cần bật mọi lớp ngay từ đầu. Nên đi từ tổng quan đến chi tiết để giữ đúng bối cảnh dữ liệu.',
    startSteps: [
      {
        title: 'Mở project và xem toàn cảnh',
        body:
          'Xác định ranh giới dữ liệu, khu vực khảo sát và các lớp đang sẵn sàng trong project.'
      },
      {
        title: 'Chọn lớp dữ liệu cần kiểm tra',
        body:
          'Bật lớp phù hợp với mục tiêu: mặt bằng, mô hình 3D, Point Cloud hoặc lớp Web GIS khác.'
      },
      {
        title: 'Điều hướng đến khu vực quan tâm',
        body:
          'Thay đổi góc nhìn và tập trung camera vào vị trí cần kiểm tra trước khi đo đạc.'
      },
      {
        title: 'Đo và đối chiếu trong cùng project',
        body:
          'Thực hiện phép đo cần thiết rồi đối chiếu với các lớp khác trong cùng bối cảnh không gian.'
      }
    ],

    viewerEyebrow: 'VIEWER',
    viewerTitle: 'Những nguyên tắc giúp đọc dữ liệu 3D dễ hơn',
    viewerBody:
      'Viewer có thể chứa nhiều lớp cùng lúc. Cách đọc hiệu quả là giữ ít lớp cần thiết, chọn đúng góc nhìn và chỉ đo sau khi đã xác định đúng đối tượng.',
    viewerItems: [
      'Dùng góc nhìn tổng quan để xác định vị trí trước khi zoom sâu',
      'Không bật quá nhiều lớp nếu chúng che lẫn nhau',
      'Với Point Cloud, kiểm tra mật độ điểm và hình học trước khi đo',
      'Với 3D Mesh, ưu tiên quan sát hình dạng và bối cảnh bề mặt',
      'Với DOM / Orthophoto, dùng góc nhìn từ trên xuống để đối chiếu mặt bằng'
    ],
    viewerCaption:
      'Ví dụ phân tích mặt cắt / hình học trong quá trình kiểm tra dữ liệu 3D',

    termsEyebrow: 'THUẬT NGỮ DỮ LIỆU',
    termsTitle: 'Đọc đúng loại dữ liệu trước khi sử dụng công cụ',
    termsBody:
      'Các tên dưới đây xuất hiện xuyên suốt các page Workflow, Output Data và Demo Maps.',
    terms: [
      {
        term: 'Point Cloud',
        meaning: 'Tập hợp điểm 3D mô tả hình học không gian.',
        use: 'Kiểm tra cấu trúc, cao độ và chi tiết hình học.'
      },
      {
        term: '3D Mesh',
        meaning: 'Mô hình bề mặt 3D có thể kèm texture.',
        use: 'Quan sát hình dạng, bề mặt và bối cảnh trực quan.'
      },
      {
        term: 'DOM / Orthophoto',
        meaning: 'Ảnh trực giao dùng cho góc nhìn mặt bằng.',
        use: 'Đối chiếu ranh giới, vị trí và hiện trạng từ trên xuống.'
      },
      {
        term: 'DEM / DSM',
        meaning: 'Lớp raster biểu diễn cao độ địa hình hoặc bề mặt.',
        use: 'Phân tích cao độ và biến thiên bề mặt khi project có lớp này.'
      },
      {
        term: 'Web GIS layer',
        meaning: 'Lớp dữ liệu đã được tổ chức để hiển thị theo project.',
        use: 'Bật / tắt, so sánh và đo đạc trong cùng Viewer.'
      }
    ],

    accessEyebrow: 'DEMO ACCESS',
    accessTitle: 'Nếu chưa có project, bắt đầu bằng Demo',
    accessBody:
      'Demo giúp làm quen với Viewer trước khi làm việc trên project thực tế. Quyền truy cập được quản lý theo tài khoản.',
    accessItems: [
      'Người chưa đăng nhập sẽ được đưa qua trang đăng nhập trước khi đăng ký Demo',
      'Tài khoản chưa có quyền Demo sẽ đi qua form đăng ký',
      'Tài khoản đã có quyền có thể mở project Demo hiện có',
      'Project hiển thị phụ thuộc dữ liệu đã được cấp cho tài khoản'
    ],
    accessCaption:
      'Giao diện project giúp người dùng truy cập dữ liệu trong cùng một bối cảnh không gian',

    finalEyebrow: 'DOCUMENTATION · DEMO',
    finalTitle: 'Đọc hướng dẫn trước, sau đó mở Demo để thực hành trực tiếp',
    finalBody:
      'Các thao tác Viewer dễ hiểu nhất khi được thử trên một project thật. Đăng ký Demo để làm quen với lớp dữ liệu, góc nhìn và công cụ đo.',
    finalButton: 'Đăng ký xem Demo',
    footer: 'Documentation · User Guides · 3D Web GIS'
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',

    eyebrow: 'RESOURCES · USER GUIDES',
    heroTitle1: '3D Web GIS guides',
    heroTitle2: 'organized by task',
    heroBody:
      'The documentation follows the way users work with a project: open data, navigate the Viewer, control layers, measure and understand the 3D data being displayed.',
    searchPlaceholder: 'Search guides: Viewer, Point Cloud, area measurement...',
    searchEmpty: 'No guide matches this search yet.',
    heroCaption:
      'Example of measuring an area directly on project data inside the Viewer',

    quickEyebrow: 'QUICK GUIDES',
    quickTitle: 'Find the right operation before going deeper into the project',
    quickBody:
      'These guides focus on the most common tasks across the platform.',
    guideItems: [
      {
        category: 'PROJECT',
        title: 'Open and understand a project structure',
        body:
          'Identify the project extent, available data groups and the layers that should be enabled first.',
        keywords: ['project', 'open project', 'structure', 'extent']
      },
      {
        category: 'VIEWER',
        title: 'Navigate the 3D Viewer',
        body:
          'Rotate, zoom, change viewpoints and focus the camera on the area that needs inspection.',
        keywords: ['viewer', 'rotate', 'zoom', 'camera', 'viewpoint']
      },
      {
        category: 'LAYERS',
        title: 'Control and compare data layers',
        body:
          'Switch between Point Cloud, 3D Mesh and other spatial layers when the corresponding project data is available to compare the same location.',
        keywords: ['layer', 'point cloud', 'mesh', 'toggle']
      },
      {
        category: 'MEASUREMENT',
        title: 'Measure distance and area',
        body:
          'Use measurement tools on the displayed data to check distances, areas or selected locations.',
        keywords: ['measure', 'distance', 'area', 'measurement']
      },
      {
        category: 'DATA',
        title: 'Understand Point Cloud, 3D Mesh and orthophoto',
        body:
          'Learn what each data type is best suited for before choosing a layer for project inspection.',
        keywords: ['point cloud', '3d mesh', 'dom', 'orthophoto', 'data']
      },
      {
        category: 'DEMO ACCESS',
        title: 'Request and open a Demo project',
        body:
          'Users without access go through the Demo form; accounts with access can return to the Viewer and open the assigned Demo project.',
        keywords: ['demo', 'request', 'access', 'account', 'viewer']
      }
    ],

    startEyebrow: 'GET STARTED',
    startTitle: 'A simple workflow for opening a project for the first time',
    startBody:
      'You do not need every layer enabled at once. Move from overview to detail so the spatial context stays clear.',
    startSteps: [
      {
        title: 'Open the project and review the overview',
        body:
          'Identify the data boundary, survey area and the layers currently available in the project.'
      },
      {
        title: 'Choose the data layer you need',
        body:
          'Enable the layer that matches the task: plan view, 3D model, Point Cloud or another Web GIS layer.'
      },
      {
        title: 'Navigate to the area of interest',
        body:
          'Change viewpoints and focus the camera on the correct location before measuring.'
      },
      {
        title: 'Measure and compare in the same project',
        body:
          'Run the required measurement and compare it with other layers in the same spatial context.'
      }
    ],

    viewerEyebrow: 'VIEWER',
    viewerTitle: 'Simple rules that make 3D data easier to read',
    viewerBody:
      'A Viewer can contain many layers. Keep only the layers needed for the current task, select the right viewpoint and measure only after confirming the target.',
    viewerItems: [
      'Use an overview first before zooming into detail',
      'Avoid enabling too many overlapping layers at the same time',
      'For Point Cloud, inspect point coverage and geometry before measuring',
      'For 3D Mesh, focus on shape, surface and visual context',
      'For DOM / Orthophoto, use the top-down view for plan comparison'
    ],
    viewerCaption:
      'Example section / geometry analysis while reviewing 3D project data',

    termsEyebrow: 'DATA TERMINOLOGY',
    termsTitle: 'Understand the data type before using the tools',
    termsBody:
      'These terms appear across the Workflow, Output Data and Demo Maps pages.',
    terms: [
      {
        term: 'Point Cloud',
        meaning: 'A collection of 3D points describing spatial geometry.',
        use: 'Inspect structure, elevation and geometric detail.'
      },
      {
        term: '3D Mesh',
        meaning: 'A 3D surface model that may include texture.',
        use: 'Review shape, surfaces and visual context.'
      },
      {
        term: 'DOM / Orthophoto',
        meaning: 'Orthographic imagery used for plan-view inspection.',
        use: 'Compare boundaries, positions and current conditions from above.'
      },
      {
        term: 'DEM / DSM',
        meaning: 'Raster layers representing terrain or surface elevation.',
        use: 'Analyze elevation and surface variation when the project includes these layers.'
      },
      {
        term: 'Web GIS layer',
        meaning: 'A data layer organized for display inside a project.',
        use: 'Toggle, compare and measure in the same Viewer.'
      }
    ],

    accessEyebrow: 'DEMO ACCESS',
    accessTitle: 'If you do not have a project yet, start with a Demo',
    accessBody:
      'A Demo is the easiest way to become familiar with the Viewer before working on a live project. Access is managed per account.',
    accessItems: [
      'Users who are not signed in are sent to login before requesting Demo access',
      'Accounts without Demo access continue through the Demo request form',
      'Accounts with access can open the available Demo project',
      'Visible projects depend on the data assigned to the account'
    ],
    accessCaption:
      'The project interface keeps data access inside one spatial context',

    finalEyebrow: 'DOCUMENTATION · DEMO',
    finalTitle: 'Read the guide, then open a Demo and practice directly',
    finalBody:
      'Viewer interactions are easiest to understand on a real project. Request Demo access to practice with layers, viewpoints and measurement tools.',
    finalButton: 'Request Demo',
    footer: 'Documentation · User Guides · 3D Web GIS'
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',

    eyebrow: '资源 · 使用指南',
    heroTitle1: '按任务组织的',
    heroTitle2: '3D Web GIS 使用指南',
    heroBody:
      '文档按照用户实际使用项目的方式组织：打开数据、浏览 Viewer、控制图层、测量，并理解当前显示的三维数据类型。',
    searchPlaceholder: '搜索指南：Viewer、Point Cloud、面积测量...',
    searchEmpty: '暂未找到符合该关键词的指南。',
    heroCaption:
      '在 Viewer 中直接对项目数据进行面积测量的示例',

    quickEyebrow: '快速指南',
    quickTitle: '在深入项目之前先找到正确操作',
    quickBody:
      '以下指南集中于平台中最常用的任务。',
    guideItems: [
      {
        category: 'PROJECT',
        title: '打开并理解项目结构',
        body:
          '确认项目范围、可用数据组，以及开始检查前应该先启用的图层。',
        keywords: ['project', '项目', '结构', '范围']
      },
      {
        category: 'VIEWER',
        title: '浏览 3D Viewer',
        body:
          '旋转、缩放、切换视角，并将相机聚焦到需要检查的区域。',
        keywords: ['viewer', '旋转', '缩放', '相机', '视角']
      },
      {
        category: 'LAYERS',
        title: '控制并比较数据图层',
        body:
          '当项目具备相应数据时，在点云、3D Mesh 和其他空间图层之间切换，对比同一位置。',
        keywords: ['layer', '图层', 'point cloud', 'mesh']
      },
      {
        category: 'MEASUREMENT',
        title: '测量距离与面积',
        body:
          '使用当前数据显示上的测量工具检查距离、面积或指定位置。',
        keywords: ['测量', '距离', '面积', 'measurement']
      },
      {
        category: 'DATA',
        title: '区分点云、3D Mesh 与正射影像',
        body:
          '在选择项目图层之前，先理解每种数据类型适合什么用途。',
        keywords: ['point cloud', '3d mesh', 'dom', 'orthophoto', '数据']
      },
      {
        category: 'DEMO ACCESS',
        title: '申请并打开 Demo 项目',
        body:
          '没有权限的用户进入 Demo 申请流程；已获得权限的账号可以返回 Viewer 打开分配的 Demo 项目。',
        keywords: ['demo', '申请', '权限', '账号', 'viewer']
      }
    ],

    startEyebrow: '开始使用',
    startTitle: '第一次打开项目时的基本流程',
    startBody:
      '无需一次启用所有图层。建议从整体到细节逐步查看，以保持清晰的空间背景。',
    startSteps: [
      {
        title: '打开项目并查看整体范围',
        body:
          '确认数据边界、测绘区域以及项目中当前可用的图层。'
      },
      {
        title: '选择需要的数据图层',
        body:
          '根据任务启用平面、3D 模型、点云或其他 Web GIS 图层。'
      },
      {
        title: '移动到需要检查的区域',
        body:
          '在测量前切换合适视角并将相机聚焦到正确位置。'
      },
      {
        title: '在同一项目中测量并对比',
        body:
          '执行所需测量，并与同一空间背景中的其他图层进行对比。'
      }
    ],

    viewerEyebrow: 'VIEWER',
    viewerTitle: '让三维数据更容易阅读的基本原则',
    viewerBody:
      'Viewer 可能同时包含多个图层。建议只保留当前任务所需的图层，选择正确视角，并在确认目标后再测量。',
    viewerItems: [
      '先查看整体范围，再放大到细节区域',
      '避免同时启用过多相互遮挡的图层',
      '对于点云，测量前先检查点覆盖和几何形态',
      '对于 3D Mesh，重点观察形状、表面和视觉背景',
      '对于 DOM / Orthophoto，使用俯视视角进行平面对比'
    ],
    viewerCaption:
      '检查三维项目数据时进行剖面 / 几何分析的示例',

    termsEyebrow: '数据术语',
    termsTitle: '使用工具前先理解数据类型',
    termsBody:
      '这些术语会出现在 Workflow、Output Data 和 Demo Maps 页面中。',
    terms: [
      {
        term: 'Point Cloud',
        meaning: '由三维点组成的空间几何数据。',
        use: '检查结构、高程和几何细节。'
      },
      {
        term: '3D Mesh',
        meaning: '可以带纹理的三维表面模型。',
        use: '查看形状、表面和视觉背景。'
      },
      {
        term: 'DOM / Orthophoto',
        meaning: '用于平面检查的正射影像。',
        use: '从上方对比边界、位置和现场现状。'
      },
      {
        term: 'DEM / DSM',
        meaning: '表示地形或表面高程的栅格图层。',
        use: '项目包含这些图层时用于分析高程与表面变化。'
      },
      {
        term: 'Web GIS layer',
        meaning: '为项目显示而组织的数据图层。',
        use: '在同一 Viewer 中切换、对比和测量。'
      }
    ],

    accessEyebrow: 'DEMO 权限',
    accessTitle: '如果还没有项目，可以从 Demo 开始',
    accessBody:
      'Demo 是在真实项目之前熟悉 Viewer 的最简单方式。权限按账号管理。',
    accessItems: [
      '未登录用户会先进入登录页面，再继续申请 Demo',
      '没有 Demo 权限的账号会进入 Demo 申请表',
      '已获得权限的账号可以打开当前可用的 Demo 项目',
      '可见项目取决于分配给账号的数据'
    ],
    accessCaption:
      '项目界面让用户在同一空间背景中访问数据',

    finalEyebrow: 'DOCUMENTATION · DEMO',
    finalTitle: '先阅读指南，再打开 Demo 直接练习',
    finalBody:
      'Viewer 操作在真实项目中最容易理解。申请 Demo 权限，练习图层、视角和测量工具。',
    finalButton: '申请演示',
    footer: 'Documentation · User Guides · 3D Web GIS'
  }
};


const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
    resultsLabel: string;
    guideLabel: string;
    meaningLabel: string;
    useLabel: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
    resultsLabel: 'HƯỚNG DẪN PHÙ HỢP',
    guideLabel: 'GUIDE',
    meaningLabel: 'Ý NGHĨA',
    useLabel: 'DÙNG KHI',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
    resultsLabel: 'MATCHING GUIDES',
    guideLabel: 'GUIDE',
    meaningLabel: 'MEANING',
    useLabel: 'BEST USED FOR',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
    resultsLabel: '匹配指南',
    guideLabel: 'GUIDE',
    meaningLabel: '含义',
    useLabel: '适用场景',
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
 * component: user-guides-page
 * genre: technical-editorial / documentation-hub
 * theme: saolatek-product-dna
 * visual-anchor: viewer-measurement-imagery
 * density: medium
 *
 * layout:
 * - documentation hero + search
 * - searchable guide index
 * - first-project workflow
 * - Viewer reading principles
 * - data glossary
 * - Demo access
 * - compact CTA
 *
 * business logic:
 * - preserve search filtering via useMemo()
 * - preserve useDemoNavigation()
 * - preserve VI / EN / ZH
 */

export const UserGuidesPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    openDemo,
    isDemoLoading,
  } = useDemoNavigation();

  const [query, setQuery] = useState('');

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(readInitialTheme);

  const c = COPY[currentLang];
  const themeCopy = THEME_COPY[currentLang];

  const filteredGuides = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return c.guideItems;
    }

    return c.guideItems.filter((item) => {
      const haystack = [
        item.category,
        item.title,
        item.body,
        ...item.keywords,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [c.guideItems, query]);

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
        .ugd-root {
          --ugd-bg: #050914;
          --ugd-bg-2: #07101c;
          --ugd-surface: #0b1523;

          --ugd-ink: #f8fafc;
          --ugd-muted: #94a3b8;
          --ugd-soft: #64748b;

          --ugd-border: rgba(255,255,255,.09);
          --ugd-border-strong: rgba(255,255,255,.16);

          --ugd-accent: #38bdf8;
          --ugd-accent-strong: #0ea5e9;
          --ugd-cta-ink: #03111d;

          --ugd-header: rgba(5,9,20,.88);
          --ugd-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .ugd-root.ugd-light {
          --ugd-bg: #f8fafc;
          --ugd-bg-2: #eef4f8;
          --ugd-surface: #ffffff;

          --ugd-ink: #0f172a;
          --ugd-muted: #526174;
          --ugd-soft: #64748b;

          --ugd-border: rgba(15,23,42,.11);
          --ugd-border-strong: rgba(15,23,42,.20);

          --ugd-accent: #0369a1;
          --ugd-accent-strong: #0284c7;
          --ugd-cta-ink: #ffffff;

          --ugd-header: rgba(248,250,252,.90);
          --ugd-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .ugd-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--ugd-bg);
          color: var(--ugd-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .ugd-header {
          background: var(--ugd-header);
        }

        .ugd-media {
          box-shadow: var(--ugd-shadow);
        }

        .ugd-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--ugd-bg),
            0 0 0 4px var(--ugd-accent);
        }

        .ugd-theme-toggle {
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

        .ugd-theme-toggle:focus-visible {
          outline: 2px solid var(--ugd-accent);
          outline-offset: 3px;
        }

        .ugd-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .ugd-theme-toggle__thumb {
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

        .ugd-theme-toggle.is-dark
        .ugd-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .ugd-theme-toggle__clouds,
        .ugd-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .ugd-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .ugd-theme-toggle.is-dark
        .ugd-theme-toggle__clouds {
          opacity: 0;
        }

        .ugd-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .ugd-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .ugd-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .ugd-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .ugd-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .ugd-theme-toggle.is-dark
        .ugd-theme-toggle__stars {
          opacity: 1;
        }

        .ugd-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            ugd-star-pulse
            2s infinite ease-in-out;
        }

        .ugd-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .ugd-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .ugd-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes ugd-star-pulse {
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
          .ugd-root *,
          .ugd-root *::before,
          .ugd-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`ugd-root ${
          isDarkMode ? '' : 'ugd-light'
        }`}
      >
        <header className="ugd-header sticky top-0 z-50 border-b border-[var(--ugd-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="ugd-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`ugd-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="ugd-theme-toggle__clouds">
                  <div className="ugd-theme-toggle__cloud ugd-theme-toggle__cloud-1" />
                  <div className="ugd-theme-toggle__cloud ugd-theme-toggle__cloud-2" />
                  <div className="ugd-theme-toggle__cloud ugd-theme-toggle__cloud-3" />
                </div>

                <div className="ugd-theme-toggle__stars">
                  <div className="ugd-theme-toggle__star ugd-theme-toggle__star-1" />
                  <div className="ugd-theme-toggle__star ugd-theme-toggle__star-2" />
                  <div className="ugd-theme-toggle__star ugd-theme-toggle__star-3" />
                </div>

                <div className="ugd-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="ugd-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--ugd-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--ugd-muted)] transition-colors hover:text-[var(--ugd-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="ugd-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--ugd-accent)] px-3.5 text-sm font-bold text-[var(--ugd-cta-ink)] transition-colors hover:bg-[var(--ugd-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--ugd-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--ugd-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <label className="ugd-focus mt-7 flex h-13 max-w-[620px] items-center gap-3 rounded-lg border border-[var(--ugd-border)] bg-[var(--ugd-surface)] px-4">
                    <Search
                      size={17}
                      className="shrink-0 text-[var(--ugd-soft)]"
                    />

                    <input
                      value={query}
                      onChange={(event) =>
                        setQuery(event.target.value)
                      }
                      placeholder={c.searchPlaceholder}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--ugd-ink)] outline-none placeholder:text-[var(--ugd-soft)]"
                    />
                  </label>
                </div>

                <figure className="min-w-0">
                  <div className="ugd-media overflow-hidden rounded-xl border border-[var(--ugd-border)] bg-black sm:rounded-2xl">
                    <img
                      src={measurementAreaImage}
                      alt={c.heroCaption}
                      className="aspect-[16/10] w-full object-cover lg:min-h-[500px] xl:min-h-[570px]"
                      loading="eager"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--ugd-muted)]">
                    {c.heroCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* SEARCHABLE GUIDE INDEX */}
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.62fr)_minmax(300px,.38fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                    {c.quickEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[23ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.quickTitle}
                  </h2>
                </div>

              </div>

              {filteredGuides.length > 0 ? (
                <div className="mt-10 border-y border-[var(--ugd-border)]">
                  {filteredGuides.map((item) => (
                    <article
                      key={`${item.category}-${item.title}`}
                      className="grid grid-cols-1 gap-3 border-b border-[var(--ugd-border)] py-5 last:border-b-0 md:grid-cols-[150px_minmax(240px,.72fr)_minmax(0,1.28fr)] md:items-start md:gap-7"
                    >
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[var(--ugd-accent)]">
                        {item.category}
                      </div>

                      <h3 className="text-base font-semibold leading-6">
                        {item.title}
                      </h3>

                      <p className="text-sm leading-7 text-[var(--ugd-muted)]">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-10 border-y border-[var(--ugd-border)] py-12 text-center text-sm text-[var(--ugd-muted)]">
                  {c.searchEmpty}
                </div>
              )}
            </div>
          </section>

          {/* FIRST PROJECT FLOW */}
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                  {c.startEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.startTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--ugd-muted)]">
                  {c.startBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-x-10 border-t border-[var(--ugd-border)] md:grid-cols-2">
                {c.startSteps.map((step) => (
                  <article
                    key={step.title}
                    className="border-b border-[var(--ugd-border)] py-6"
                  >
                    <h3 className="max-w-[26ch] text-lg font-semibold leading-7">
                      {step.title}
                    </h3>

                    <p className="mt-3 max-w-[620px] text-sm leading-7 text-[var(--ugd-muted)]">
                      {step.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* VIEWER PRINCIPLES */}
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.58fr)_minmax(0,.42fr)] lg:items-center lg:gap-16">
                <figure className="min-w-0">
                  <div className="ugd-media overflow-hidden rounded-xl border border-[var(--ugd-border)] bg-black sm:rounded-2xl">
                    <img
                      src={measurementSectionImage}
                      alt={c.viewerCaption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--ugd-muted)]">
                    {c.viewerCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                    {c.viewerEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.viewerTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--ugd-muted)]">
                    {c.viewerBody}
                  </p>

                  <div className="mt-8">
                    {c.viewerItems.map((item) => (
                      <p
                        key={item}
                        className="border-t border-[var(--ugd-border)] py-4 text-sm leading-7 text-[var(--ugd-muted)]"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DATA GLOSSARY */}
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                  {c.termsEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.termsTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--ugd-muted)]">
                  {c.termsBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto border-y border-[var(--ugd-border)]">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)] border-b border-[var(--ugd-border)] py-4 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[var(--ugd-soft)]">
                    <div>
                      {themeCopy.guideLabel}
                    </div>
                    <div className="border-l border-[var(--ugd-border)] px-6">
                      {themeCopy.meaningLabel}
                    </div>
                    <div className="border-l border-[var(--ugd-border)] px-6">
                      {themeCopy.useLabel}
                    </div>
                  </div>

                  {c.terms.map((item) => (
                    <div
                      key={item.term}
                      className="grid grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)] border-b border-[var(--ugd-border)] last:border-b-0"
                    >
                      <div className="py-5 pr-6 text-sm font-semibold">
                        {item.term}
                      </div>

                      <div className="border-l border-[var(--ugd-border)] px-6 py-5 text-sm leading-7 text-[var(--ugd-muted)]">
                        {item.meaning}
                      </div>

                      <div className="border-l border-[var(--ugd-border)] px-6 py-5 text-sm leading-7 text-[var(--ugd-muted)]">
                        {item.use}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DEMO ACCESS */}
          <section className="border-b border-[var(--ugd-border)] bg-[var(--ugd-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.32fr)_minmax(0,.32fr)] lg:items-center lg:gap-10">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                    {c.accessEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.accessTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--ugd-muted)]">
                    {c.accessBody}
                  </p>
                </div>

                <figure className="min-w-0">
                  <div className="overflow-hidden rounded-xl border border-[var(--ugd-border)] bg-black sm:rounded-2xl">
                    <img
                      src={projectSharingOverviewImage}
                      alt={c.accessCaption}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--ugd-muted)]">
                    {c.accessCaption}
                  </figcaption>
                </figure>

                <div className="border-y border-[var(--ugd-border)]">
                  {c.accessItems.map((item) => (
                    <p
                      key={item}
                      className="border-b border-[var(--ugd-border)] py-4 text-sm leading-7 text-[var(--ugd-muted)] last:border-b-0"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--ugd-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--ugd-border)] py-9 lg:grid-cols-[minmax(0,.62fr)_minmax(300px,.38fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--ugd-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--ugd-muted)]">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="ugd-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ugd-accent)] px-6 text-sm font-bold text-[var(--ugd-cta-ink)] transition-colors hover:bg-[var(--ugd-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--ugd-border)] bg-[var(--ugd-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--ugd-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default UserGuidesPage;