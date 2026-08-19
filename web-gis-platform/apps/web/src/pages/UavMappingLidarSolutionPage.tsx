import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import lidarHeroImage from '../assets/point-cloud-lidar-hero.png';
import lidarOverviewImage from '../assets/point-cloud-lidar-overview.png';

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

type SourceItem = CardItem & {
  eyebrow: string;
  tags: [string, string];
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;
  openDemo3D: string;
  pointCloudLink: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroTags: [string, string, string];
  viewerLabel: string;
  pointCloudLabel: string;
  projectData: string;
  heroCaption: string;

  sourceEyebrow: string;
  sourceTitle: string;
  sourceBody: string;
  sources: [SourceItem, SourceItem];

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflowItems: [CardItem, CardItem, CardItem, CardItem];

  viewerEyebrow: string;
  viewerTitle: string;
  viewerBody: string;
  overviewLabel: string;
  overviewCaption: string;
  viewerItems: [CardItem, CardItem, CardItem];

  measureEyebrow: string;
  measureTitle: string;
  measureBody: string;
  topViewLabel: string;
  topViewCaption: string;
  measureItems: [CardItem, CardItem, CardItem];

  valueEyebrow: string;
  valueTitle: string;
  valueBody: string;
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
    pointCloudLink: 'Xem Point Cloud & LiDAR',

    eyebrow: 'GIẢI PHÁP UAV MAPPING & LiDAR',
    heroTitle1: 'Từ dữ liệu khảo sát đến một project',
    heroTitle2: 'Web GIS 3D',
    heroBody:
      'Kết hợp nền tảng bay CHCNAV X500 với LiDAR AlphaAir 6 Dual (AA6D) để thu Point Cloud và ảnh RGB, sau đó tổ chức dữ liệu đã xử lý trong project Web GIS 3D để quan sát, đo đạc và chia sẻ trên trình duyệt.',
    heroTags: ['X500 · 5 kg payload', 'AA6D · 2M pts/s', 'Dual camera · 26 MP × 2'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: 'DỮ LIỆU DỰ ÁN',
    heroCaption: 'Quan sát dữ liệu LiDAR trong cùng bối cảnh project Web GIS 3D',

    sourceEyebrow: 'THIẾT BỊ THU NHẬN',
    sourceTitle: 'X500 và AA6D đảm nhiệm hai vai trò khác nhau trong hệ thống khảo sát',
    sourceBody:
      'Các thông số dưới đây được cập nhật theo X500 Datasheet Rev. September 2025 và AlphaAir 6 Datasheet Rev. January 2026. Giá trị tối đa và giá trị thử nghiệm được giữ kèm điều kiện quan trọng.',
    sources: [
      {
        eyebrow: 'CHCNAV X500',
        title: 'Nền tảng bay · tải trọng tối đa 5 kg',
        body: 'X500 là quadcopter 4 cánh với tải trọng tối đa 5 kg. Datasheet công bố 58 phút không payload, 52 phút với payload 2 kg và 40 phút với payload 4 kg; IP55, tốc độ tối đa 23 m/s và hỗ trợ tối đa 3 payload đồng thời.',
        tags: ['5 kg payload', '58 / 52 / 40 min'],
      },
      {
        eyebrow: 'ALPHAAIR 6 DUAL',
        title: 'LiDAR + dual APS-C · tới 2M pts/s',
        body: 'AA6D nặng 1,85 kg, sử dụng laser 1535 nm, FOV 90°, tối đa 16 returns, IMU 500 Hz và hai camera APS-C 26 MP. Tầm đo tối đa 2.100 m áp dụng tại 100 kHz PRR với mục tiêu có reflectivity > 80%.',
        tags: ['2M pts/s', '26 MP × 2'],
      },
    ],

    workflowEyebrow: 'WORKFLOW X500 + AA6D',
    workflowTitle: 'Từ mission UAV đến Point Cloud và project Web GIS',
    workflowBody:
      'Tách rõ giai đoạn thu nhận bằng thiết bị, tiền xử lý dữ liệu LiDAR và giai đoạn xuất bản lên nền tảng để không trộn lẫn thông số phần cứng với tính năng Web GIS.',
    workflowItems: [
      {
        title: 'Lập mission & bay X500',
        body: 'Thiết lập phạm vi khảo sát và vận hành X500 theo payload, địa hình và điều kiện hiện trường phù hợp.',
      },
      {
        title: 'AA6D thu LiDAR + RGB',
        body: 'AA6D thu dữ liệu laser cùng ảnh từ hai camera APS-C trong một payload tích hợp GNSS và IMU 500 Hz.',
      },
      {
        title: 'Tiền xử lý với CoPre',
        body: 'Datasheet AlphaAir 6 nêu các bước POS solve, Adjust & Refine và Generate point cloud trước khi đưa dữ liệu sang quy trình tiếp theo.',
      },
      {
        title: 'Xuất bản lên Web GIS',
        body: 'Dữ liệu sau xử lý được tổ chức theo project để quan sát, đo đạc và truy cập trên Viewer theo phạm vi được thiết lập.',
      },
    ],

    viewerEyebrow: 'DỮ LIỆU TRONG VIEWER',
    viewerTitle: 'Một project, nhiều lớp dữ liệu và cùng một bối cảnh không gian',
    viewerBody:
      'Người dùng có thể chuyển giữa các lớp dữ liệu để kiểm tra dự án mà không cần rời khỏi Viewer.',
    overviewLabel: 'TỔNG QUAN PROJECT',
    overviewCaption: 'Quan sát tổng thể phạm vi dữ liệu trong cùng một Viewer',
    viewerItems: [
      {
        title: 'Point Cloud',
        body: 'Quan sát dữ liệu điểm 3D và tập trung camera vào khu vực cần kiểm tra.',
      },
      {
        title: '3D Mesh',
        body: 'Theo dõi hình dạng, bề mặt và cấu trúc tổng thể của khu vực dự án.',
      },
      {
        title: 'DOM',
        body: 'Đối chiếu mặt bằng dự án theo góc nhìn trực giao từ trên xuống.',
      },
    ],

    measureEyebrow: 'ĐO ĐẠC & GÓC NHÌN',
    measureTitle: 'Đọc hiện trạng theo góc nhìn phù hợp với từng nội dung kiểm tra',
    measureBody:
      'Góc nhìn phối cảnh giúp đọc cấu trúc 3D, góc nhìn từ trên xuống hỗ trợ kiểm tra mặt bằng; các phép đo được thực hiện trực tiếp trên dữ liệu đang quan sát.',
    topViewLabel: 'GÓC NHÌN TỪ TRÊN',
    topViewCaption: 'Góc nhìn từ trên xuống trong cùng project 3D',
    measureItems: [
      {
        title: 'Khoảng cách 2D / 3D',
        body: 'Kiểm tra khoảng cách giữa các vị trí theo bối cảnh đang quan sát trong Viewer.',
      },
      {
        title: 'Chênh lệch cao độ',
        body: 'So sánh cao độ giữa hai vị trí trên dữ liệu 3D khi cần kiểm tra địa hình hoặc cấu trúc.',
      },
      {
        title: 'Diện tích khu vực',
        body: 'Khoanh vùng trực tiếp trên dữ liệu để đọc diện tích của phạm vi cần kiểm tra.',
      },
    ],

    valueEyebrow: 'GIÁ TRỊ SỬ DỤNG',
    valueTitle: 'Giữ liền mạch dữ liệu từ thiết bị khảo sát đến project Web GIS',
    valueBody:
      'Giá trị của workflow nằm ở việc tách rõ vai trò phần cứng, bước xử lý và lớp dữ liệu sau cùng, nhưng vẫn đưa chúng về một project để tiếp tục kiểm tra trên cùng bối cảnh không gian.',
    valueItems: [
      'X500 đảm nhiệm nền tảng bay, AA6D đảm nhiệm thu LiDAR và ảnh RGB',
      'Dữ liệu sau xử lý được gom về cùng project thay vì nằm ở nhiều đầu ra rời rạc',
      'Point Cloud, 3D Mesh và DOM được đọc trong cùng bối cảnh project khi có lớp tương ứng',
      'Khoảng cách, chênh cao và diện tích được kiểm tra trực tiếp trên dữ liệu đang xem',
      'Project được truy cập theo phạm vi quyền đã được thiết lập trong hệ thống',
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: 'Trải nghiệm cách dữ liệu UAV & LiDAR được tổ chức trong một project 3D GIS',
    finalBody:
      'Đăng ký Demo để mở project mẫu và xem cách Point Cloud cùng các lớp dữ liệu sau xử lý được tổ chức, hiển thị và đo đạc trực tiếp trên trình duyệt.',
    finalButton: 'Mở Demo',
    footer: 'UAV · LiDAR · 3D Mapping',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',
    openDemo3D: 'Open 3D Demo',
    pointCloudLink: 'View Point Cloud & LiDAR',

    eyebrow: 'UAV MAPPING & LiDAR SOLUTION',
    heroTitle1: 'From survey capture to a',
    heroTitle2: '3D Web GIS project',
    heroBody:
      'Combine the CHCNAV X500 flight platform with the AlphaAir 6 Dual (AA6D) LiDAR system to capture Point Cloud and RGB imagery, then organize processed data in a 3D Web GIS project for browser-based inspection, measurement and sharing.',
    heroTags: ['X500 · 5 kg payload', 'AA6D · 2M pts/s', 'Dual camera · 26 MP × 2'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: 'PROJECT DATA',
    heroCaption: 'Inspect LiDAR data inside the spatial context of the same 3D Web GIS project',

    sourceEyebrow: 'CAPTURE EQUIPMENT',
    sourceTitle: 'X500 and AA6D serve different roles in the survey system',
    sourceBody:
      'The figures below are aligned with the X500 Datasheet Rev. September 2025 and AlphaAir 6 Datasheet Rev. January 2026. Maximum and test-condition values retain their important conditions.',
    sources: [
      {
        eyebrow: 'CHCNAV X500',
        title: 'Flight platform · 5 kg maximum payload',
        body: 'X500 is a four-propeller quadcopter with a 5 kg maximum payload. The datasheet specifies 58 min with no payload, 52 min with 2 kg and 40 min with 4 kg; IP55, 23 m/s maximum speed and support for up to three simultaneous payloads.',
        tags: ['5 kg payload', '58 / 52 / 40 min'],
      },
      {
        eyebrow: 'ALPHAAIR 6 DUAL',
        title: 'LiDAR + dual APS-C · up to 2M pts/s',
        body: 'AA6D weighs 1.85 kg and integrates a 1535 nm laser, 90° FOV, up to 16 returns, a 500 Hz IMU and two 26 MP APS-C cameras. The 2,100 m maximum range applies at 100 kHz PRR for targets with reflectivity > 80%.',
        tags: ['2M pts/s', '26 MP × 2'],
      },
    ],

    workflowEyebrow: 'X500 + AA6D WORKFLOW',
    workflowTitle: 'From UAV mission to Point Cloud and a Web GIS project',
    workflowBody:
      'The workflow separates hardware capture, LiDAR pre-processing and platform publication so equipment specifications are not mixed with Web GIS capabilities.',
    workflowItems: [
      {
        title: 'Plan mission & fly X500',
        body: 'Define the survey extent and operate the X500 according to payload, terrain and suitable field conditions.',
      },
      {
        title: 'AA6D captures LiDAR + RGB',
        body: 'AA6D captures laser data together with imagery from two APS-C cameras in a payload integrating GNSS and a 500 Hz IMU.',
      },
      {
        title: 'Pre-process with CoPre',
        body: 'The AlphaAir 6 datasheet lists POS solve, Adjust & Refine and Generate point cloud as CoPre processing functions.',
      },
      {
        title: 'Publish to Web GIS',
        body: 'Processed data is organized by project for inspection, measurement and Viewer access according to the configured scope.',
      },
    ],

    viewerEyebrow: 'DATA IN VIEWER',
    viewerTitle: 'One project, multiple data layers and one shared spatial context',
    viewerBody:
      'Users can switch between data layers for project inspection without leaving the Viewer.',
    overviewLabel: 'PROJECT OVERVIEW',
    overviewCaption: 'Review the overall data extent inside the same Viewer',
    viewerItems: [
      {
        title: 'Point Cloud',
        body: 'Inspect 3D point data and focus the camera on areas that require closer review.',
      },
      {
        title: '3D Mesh',
        body: 'Review site shape, surfaces and the overall spatial structure of the project area.',
      },
      {
        title: 'Orthophoto / DOM',
        body: 'Compare project layout from an accurate top-down orthographic view.',
      },
    ],

    measureEyebrow: 'MEASUREMENT & VIEWPOINTS',
    measureTitle: 'Use the viewpoint that matches each inspection task',
    measureBody:
      'Perspective view supports 3D structural inspection, while top-down view helps with plan-level checks; spatial measurements are performed directly on the data being viewed.',
    topViewLabel: 'TOP VIEW',
    topViewCaption: 'Top-down view inside the same 3D project',
    measureItems: [
      {
        title: '2D / 3D distance',
        body: 'Check distances between positions within the current Viewer context.',
      },
      {
        title: 'Elevation difference',
        body: 'Compare elevation between two positions when reviewing terrain or 3D structure.',
      },
      {
        title: 'Area of interest',
        body: 'Draw a region directly on the data and read the area of the selected extent.',
      },
    ],

    valueEyebrow: 'OPERATIONAL VALUE',
    valueTitle: 'Keep the data path continuous from survey hardware to the Web GIS project',
    valueBody:
      'The workflow keeps hardware capture, processing, and final project layers clearly separated while bringing the resulting data back into one spatial project context for continued inspection.',
    valueItems: [
      'X500 provides the flight platform while AA6D captures LiDAR and RGB imagery',
      'Processed outputs are organized in one project instead of remaining as disconnected deliverables',
      'Point Cloud, 3D Mesh, and DOM can be reviewed in one project context when the corresponding layers are available',
      'Distance, elevation difference, and area are checked directly on the data being viewed',
      'Project access follows the scope configured in the system'
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: 'Experience how UAV & LiDAR data is organized inside a 3D GIS project',
    finalBody:
      'Request a Demo to open a sample project and see how Point Cloud and other processed data layers are organized, displayed and measured directly in the browser.',
    finalButton: 'Open Demo',
    footer: 'UAV · LiDAR · 3D Mapping',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',
    openDemo3D: '打开 3D 演示',
    pointCloudLink: '查看 Point Cloud & LiDAR',

    eyebrow: 'UAV MAPPING 与 LiDAR 解决方案',
    heroTitle1: '从测绘数据采集到一个',
    heroTitle2: '3D Web GIS 项目',
    heroBody:
      '结合 CHCNAV X500 飞行平台与 AlphaAir 6 Dual（AA6D）LiDAR 系统采集点云与 RGB 影像，再将处理后的数据组织到 3D Web GIS 项目中，用于浏览器内查看、测量和共享。',
    heroTags: ['X500 · 5 kg 载荷', 'AA6D · 2M pts/s', '双相机 · 26 MP × 2'],
    viewerLabel: '3D VIEWER',
    pointCloudLabel: 'POINT CLOUD',
    projectData: '项目数据',
    heroCaption: '在同一个 3D Web GIS 项目的空间背景中查看 LiDAR 数据',

    sourceEyebrow: '采集设备',
    sourceTitle: 'X500 与 AA6D 在测绘系统中承担不同角色',
    sourceBody:
      '以下规格依据 X500 Datasheet Rev. September 2025 与 AlphaAir 6 Datasheet Rev. January 2026 更新，并保留最大值与测试值的重要条件。',
    sources: [
      {
        eyebrow: 'CHCNAV X500',
        title: '飞行平台 · 最大载荷 5 kg',
        body: 'X500 为四旋翼平台，最大载荷 5 kg。Datasheet 给出无载荷 58 分钟、2 kg 载荷 52 分钟、4 kg 载荷 40 分钟；IP55、最大速度 23 m/s，并支持最多三个载荷同时工作。',
        tags: ['5 kg 载荷', '58 / 52 / 40 分钟'],
      },
      {
        eyebrow: 'ALPHAAIR 6 DUAL',
        title: 'LiDAR + 双 APS-C · 最高 2M pts/s',
        body: 'AA6D 重 1.85 kg，集成 1535 nm 激光、90° FOV、最多 16 回波、500 Hz IMU 与两颗 26 MP APS-C 相机。2,100 m 最大测距适用于 100 kHz PRR 且目标反射率 > 80% 的条件。',
        tags: ['2M pts/s', '26 MP × 2'],
      },
    ],

    workflowEyebrow: 'X500 + AA6D 工作流程',
    workflowTitle: '从 UAV 任务到点云与 Web GIS 项目',
    workflowBody:
      '流程将硬件采集、LiDAR 预处理和平台发布分开，避免把设备规格与 Web GIS 功能混为一谈。',
    workflowItems: [
      {
        title: '规划任务并飞行 X500',
        body: '根据载荷、地形和适合的现场条件定义测绘范围并执行 X500 任务。',
      },
      {
        title: 'AA6D 采集 LiDAR + RGB',
        body: 'AA6D 通过集成 GNSS 和 500 Hz IMU 的载荷，同时采集激光数据与两颗 APS-C 相机影像。',
      },
      {
        title: '使用 CoPre 预处理',
        body: 'AlphaAir 6 Datasheet 列出 POS solve、Adjust & Refine 和 Generate point cloud 等 CoPre 处理功能。',
      },
      {
        title: '发布到 Web GIS',
        body: '处理后的数据按项目组织，用于在 Viewer 中查看、测量，并根据已配置的访问范围进行访问。',
      },
    ],

    viewerEyebrow: 'VIEWER 中的数据',
    viewerTitle: '一个项目、多种数据图层、统一的空间背景',
    viewerBody:
      '用户可以在不离开 Viewer 的情况下，在不同数据图层之间切换并检查项目。',
    overviewLabel: '项目总览',
    overviewCaption: '在同一个 Viewer 中查看整体数据范围',
    viewerItems: [
      {
        title: 'Point Cloud 点云',
        body: '查看 3D 点数据，并将相机聚焦到需要详细检查的区域。',
      },
      {
        title: '3D Mesh 模型',
        body: '查看项目区域的形状、表面和整体空间结构。',
      },
      {
        title: '正射影像 DOM',
        body: '通过准确的自上而下视角对比项目平面。',
      },
    ],

    measureEyebrow: '测量与视角',
    measureTitle: '根据不同检查任务选择合适的查看视角',
    measureBody:
      '透视视角适合查看三维结构，俯视视角适合检查平面范围；空间测量可直接在当前查看的数据上进行。',
    topViewLabel: '俯视图',
    topViewCaption: '同一个 3D 项目中的俯视视角',
    measureItems: [
      {
        title: '2D / 3D 距离',
        body: '在当前 Viewer 背景中检查不同位置之间的距离。',
      },
      {
        title: '高程差',
        body: '在检查地形或三维结构时比较两个位置之间的高程差。',
      },
      {
        title: '区域面积',
        body: '直接在数据上框选范围并读取所选区域的面积。',
      },
    ],

    valueEyebrow: '使用价值',
    valueTitle: '保持从测绘设备到 Web GIS 项目的数据链路连续',
    valueBody:
      '该流程清楚区分硬件采集、数据处理和最终项目图层，同时把处理结果重新组织到同一个空间项目背景中继续检查。',
    valueItems: [
      'X500 负责飞行平台，AA6D 负责采集 LiDAR 与 RGB 影像',
      '处理后的成果统一组织到同一个项目中，而不是分散为独立输出',
      '当项目具备相应图层时，可在同一项目背景中查看 Point Cloud、3D Mesh 与 DOM',
      '距离、高程差和面积直接在当前查看的数据上进行检查',
      '项目访问遵循系统中已配置的权限范围'
    ],

    finalEyebrow: 'UAV · LiDAR · WEB GIS 3D',
    finalTitle: '体验 UAV 与 LiDAR 数据如何在 3D GIS 项目中进行组织',
    finalBody:
      '申请演示以打开示例项目，查看点云与其他处理后数据图层如何在浏览器中组织、显示并直接测量。',
    finalButton: '打开演示',
    footer: 'UAV · LiDAR · 3D Mapping',
  },
};


export const UavMappingLidarSolutionPage: React.FC = () => {
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
        .uml-root {
          --uml-bg: #050914;
          --uml-bg-2: #07101c;
          --uml-surface: #0b1523;

          --uml-ink: #f8fafc;
          --uml-muted: #94a3b8;
          --uml-soft: #64748b;

          --uml-border: rgba(255,255,255,.09);
          --uml-border-strong: rgba(255,255,255,.16);

          --uml-accent: #38bdf8;
          --uml-accent-strong: #0ea5e9;
          --uml-cta-ink: #03111d;

          --uml-header: rgba(5,9,20,.88);
          --uml-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .uml-root.uml-light {
          --uml-bg: #f8fafc;
          --uml-bg-2: #eef4f8;
          --uml-surface: #ffffff;

          --uml-ink: #0f172a;
          --uml-muted: #526174;
          --uml-soft: #64748b;

          --uml-border: rgba(15,23,42,.11);
          --uml-border-strong: rgba(15,23,42,.20);

          --uml-accent: #0369a1;
          --uml-accent-strong: #0284c7;
          --uml-cta-ink: #ffffff;

          --uml-header: rgba(248,250,252,.90);
          --uml-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .uml-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--uml-bg);
          color: var(--uml-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .uml-header {
          background: var(--uml-header);
        }

        .uml-media {
          box-shadow: var(--uml-shadow);
        }

        .uml-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--uml-bg),
            0 0 0 4px var(--uml-accent);
        }

        .uml-theme-toggle {
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

        .uml-theme-toggle:focus-visible {
          outline: 2px solid var(--uml-accent);
          outline-offset: 3px;
        }

        .uml-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .uml-theme-toggle__thumb {
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

        .uml-theme-toggle.is-dark
        .uml-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .uml-theme-toggle__clouds,
        .uml-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .uml-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .uml-theme-toggle.is-dark
        .uml-theme-toggle__clouds {
          opacity: 0;
        }

        .uml-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .uml-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .uml-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .uml-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .uml-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .uml-theme-toggle.is-dark
        .uml-theme-toggle__stars {
          opacity: 1;
        }

        .uml-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            uml-star-pulse
            2s infinite ease-in-out;
        }

        .uml-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .uml-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .uml-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes uml-star-pulse {
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
          .uml-root *,
          .uml-root *::before,
          .uml-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`uml-root ${
          isDarkMode ? '' : 'uml-light'
        }`}
      >
        <header className="uml-header sticky top-0 z-50 border-b border-[var(--uml-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="uml-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
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
                className={`uml-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="uml-theme-toggle__clouds">
                  <div className="uml-theme-toggle__cloud uml-theme-toggle__cloud-1" />
                  <div className="uml-theme-toggle__cloud uml-theme-toggle__cloud-2" />
                  <div className="uml-theme-toggle__cloud uml-theme-toggle__cloud-3" />
                </div>

                <div className="uml-theme-toggle__stars">
                  <div className="uml-theme-toggle__star uml-theme-toggle__star-1" />
                  <div className="uml-theme-toggle__star uml-theme-toggle__star-2" />
                  <div className="uml-theme-toggle__star uml-theme-toggle__star-3" />
                </div>

                <div className="uml-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="uml-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--uml-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--uml-muted)] transition-colors hover:text-[var(--uml-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="uml-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--uml-accent)] px-3.5 text-sm font-bold text-[var(--uml-cta-ink)] transition-colors hover:bg-[var(--uml-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="w-full">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                      {c.eyebrow}
                    </div>

                    <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                      {c.heroTitle1}
                      <span className="block text-[var(--uml-accent)]">
                        {c.heroTitle2}
                      </span>
                    </h1>

                    <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--uml-muted)] sm:text-lg sm:leading-8">
                      {c.heroBody}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={openDemo}
                        disabled={isDemoLoading}
                        className="uml-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--uml-accent)] px-6 text-sm font-bold text-[var(--uml-cta-ink)] transition-colors hover:bg-[var(--uml-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
                            '/platform/point-cloud-lidar'
                          )
                        }
                        className="uml-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--uml-border)] bg-transparent px-6 text-sm font-semibold text-[var(--uml-ink)] transition-colors hover:border-[var(--uml-border-strong)]"
                      >
                        {c.pointCloudLink}
                      </button>
                    </div>
                  </div>

                  <figure className="min-w-0">
                    <div className="uml-media overflow-hidden rounded-xl border border-[var(--uml-border)] bg-black sm:rounded-2xl">
                      <img
                        src={lidarHeroImage}
                        alt={c.heroCaption}
                        className="aspect-[16/10] w-full object-cover"
                        loading="eager"
                      />
                    </div>

                    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--uml-muted)]">
                      {c.heroCaption}
                    </figcaption>
                  </figure>
                </div>

              </div>
            </div>
          </section>

          {/* HARDWARE DOSSIER */}
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.32fr)_minmax(0,.68fr)] lg:gap-16 xl:gap-20">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                    {c.sourceEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[15ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.sourceTitle}
                  </h2>

                  <p className="mt-5 max-w-[520px] text-base leading-7 text-[var(--uml-muted)]">
                    {c.sourceBody}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,.46fr)_minmax(0,.54fr)] xl:gap-12">
                  {c.sources.map((item, index) => (
                    <article
                      key={item.eyebrow}
                      className={`border-t pt-5 ${
                        index === 0
                          ? 'border-[var(--uml-accent)]'
                          : 'border-[var(--uml-border-strong)]'
                      }`}
                    >
                      <div className="font-mono text-[10px] font-bold tracking-[.14em] text-[var(--uml-accent)]">
                        {item.eyebrow}
                      </div>

                      <h3 className="mt-2 max-w-[24ch] text-[22px] font-semibold leading-8">
                        {item.title}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-[var(--uml-muted)]">
                        {item.body}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--uml-border)] pt-4">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs font-bold tracking-[.05em] text-[var(--uml-ink)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PROCESSING PIPELINE */}
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[980px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                  {c.workflowEyebrow}
                </div>

                <h2 className="mt-4 max-w-[23ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.workflowTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--uml-muted)]">
                  {c.workflowBody}
                </p>
              </div>

              <div className="mt-10 overflow-x-auto">
                <div className="grid min-w-[980px] grid-cols-4 border-y border-[var(--uml-border)]">
                  {c.workflowItems.map((item) => (
                    <article
                      key={item.title}
                      className="min-h-[210px] border-r border-[var(--uml-border)] px-6 py-7 first:pl-0 last:border-r-0 last:pr-0"
                    >
                      <h3 className="max-w-[15ch] text-base font-semibold leading-6">
                        {item.title}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-[var(--uml-muted)]">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* VIEWER DATA */}
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1040px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                  {c.viewerEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.viewerTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--uml-muted)]">
                  {c.viewerBody}
                </p>
              </div>

              <figure className="mt-10 min-w-0">
                <div className="uml-media overflow-hidden rounded-xl border border-[var(--uml-border)] bg-black sm:rounded-2xl">
                  <img
                    src={lidarOverviewImage}
                    alt={c.overviewCaption}
                    className="aspect-[21/9] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--uml-muted)]">
                  {c.overviewCaption}
                </figcaption>
              </figure>

              <div className="mt-8 grid grid-cols-1 border-y border-[var(--uml-border)] md:grid-cols-3">
                {c.viewerItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--uml-border)] py-5 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  >
                    <h3 className="text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--uml-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* MEASUREMENT */}
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.48fr)_minmax(0,.52fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                    {c.measureEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.06] tracking-[-.035em] md:text-[40px] lg:text-[46px]">
                    {c.measureTitle}
                  </h2>
                </div>

                <p className="max-w-[650px] text-base leading-7 text-[var(--uml-muted)] lg:justify-self-end">
                  {c.measureBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-0 border-y border-[var(--uml-border)] lg:grid-cols-3">
                {c.measureItems.map((item) => (
                  <article
                    key={item.title}
                    className="border-b border-[var(--uml-border)] py-6 lg:min-h-[170px] lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                  >
                    <h3 className="max-w-[16ch] text-xl font-semibold leading-7">
                      {item.title}
                    </h3>

                    <p className="mt-3 max-w-[360px] text-sm leading-7 text-[var(--uml-muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* OPERATIONAL VALUE */}
          <section className="border-b border-[var(--uml-border)] bg-[var(--uml-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1120px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                  {c.valueEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[32px] font-semibold leading-[1.06] tracking-[-.04em] md:text-[42px] lg:text-[48px]">
                  {c.valueTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--uml-muted)]">
                  {c.valueBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-x-10 border-t border-[var(--uml-border)] sm:grid-cols-2 lg:grid-cols-[1.05fr_1.05fr_.9fr]">
                {c.valueItems.map((item, index) => (
                  <div
                    key={item}
                    className={`border-b border-[var(--uml-border)] py-5 ${
                      index < 3
                        ? 'lg:border-b'
                        : ''
                    }`}
                  >
                    <p className="max-w-[420px] text-sm leading-7 text-[var(--uml-muted)]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--uml-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--uml-border)] py-9 lg:grid-cols-[minmax(0,.60fr)_minmax(320px,.40fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--uml-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[21ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div className="lg:pb-1">
                  <p className="max-w-[620px] text-base leading-7 text-[var(--uml-muted)]">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="uml-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--uml-accent)] px-6 text-sm font-bold text-[var(--uml-cta-ink)] transition-colors hover:bg-[var(--uml-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        <footer className="border-t border-[var(--uml-border)] bg-[var(--uml-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--uml-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
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

export default UavMappingLidarSolutionPage;