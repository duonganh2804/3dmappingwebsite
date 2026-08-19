import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Maximize2,
  X
} from 'lucide-react';

import {
  useLanguage,
  type Language
} from '../hooks/useLanguage';
import { useDemoNavigation } from '../hooks/useDemoNavigation';


import logoImg from '../assets/logo.webp';
import viewerOverviewImage from '../assets/3d-gis-viewer-overview.png';
import mappingHeroImage from '../assets/3d mapping.png';
import measurementAreaImage from '../assets/measurement-area.png';
import surveyingFieldImage from '../assets/surveying-field-team.jpg';
import constructionOverviewImage from '../assets/construction-overview.png';
import agricultureHeroImage from '../assets/agriculture-hero.jpg';

type Translation = {
  platform: string;
  solutions: string;
  resources: string;
  connect: string;
  login: string;
  dashboard: string;
  bookDemo: string;

  viewer3DTitle: string;
  platformPointCloud: string;
  platformAnalysis: string;
  platformLayers: string;
  platformCoordinates: string;
  platformProjects: string;

  solSurveying: string;
  solConstructionInfra: string;
  solAgriculture: string;
  solUavMapping: string;

  resMappingWorkflow: string;
  resEquipmentSpecs: string;
  res3DOutputs: string;
  resDemoMaps: string;
  resGuides: string;

  demoRegistration: string;
  connectConsultation: string;
  connectLoginTrial: string;

  heroEyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroDemo: string;
  heroPlatform: string;
  heroMeta1: string;
  heroMeta2: string;
  heroMeta3: string;

  coreEyebrow: string;
  coreTitle: string;
  coreBody: string;
  core1Title: string;
  core1Body: string;
  core2Title: string;
  core2Body: string;
  core3Title: string;
  core3Body: string;
  core4Title: string;
  core4Body: string;

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflowStep1: string;
  workflowStep2: string;
  workflowStep3: string;
  workflowStep4: string;
  workflowBtn: string;
  videoExpand: string;
  videoClose: string;
  videoCaption: string;

  solutionsEyebrow: string;
  solutionsTitle: string;
  solutionsBody: string;
  surveyTitle: string;
  surveyBody: string;
  constructionTitle: string;
  constructionBody: string;
  agricultureTitle: string;
  agricultureBody: string;

  resourcesEyebrow: string;
  resourcesTitle: string;
  resourcesBody: string;
  resourceWorkflowBody: string;
  resourceEquipmentBody: string;
  resourceOutputBody: string;
  resourceDemoBody: string;

  finalTitle: string;
  finalBody: string;
  finalDemo: string;
  finalMaps: string;

  footerDesc: string;
  footerProduct: string;
  footerSolutions: string;
  footerResources: string;
  rights: string;
};

const TRANSLATIONS: Record<Language, Translation> = {
  vi: {
    platform: 'Nền tảng',
    solutions: 'Giải pháp',
    resources: 'Tài nguyên',
    connect: 'Kết nối',
    login: 'Đăng nhập',
    dashboard: 'Bảng điều khiển',
    bookDemo: 'Đăng ký demo',

    viewer3DTitle: 'Trình xem 3D GIS',
    platformPointCloud: 'Point Cloud & LiDAR',
    platformAnalysis: 'Đo đạc & Phân tích 3D',
    platformLayers: 'Quản lý lớp dữ liệu',
    platformCoordinates: 'VN-2000 & Hệ tọa độ',
    platformProjects: 'Chia sẻ & Quản lý dự án',

    solSurveying: 'Khảo sát & Đo đạc',
    solConstructionInfra: 'Xây dựng & Hạ tầng',
    solAgriculture: 'Nông nghiệp',
    solUavMapping: 'UAV Mapping & LiDAR',

    resMappingWorkflow: 'Quy trình 3D Mapping',
    resEquipmentSpecs: 'Thiết bị & Thông số kỹ thuật',
    res3DOutputs: 'Dữ liệu đầu ra 3D',
    resDemoMaps: 'Bản đồ Demo',
    resGuides: 'Tài liệu hướng dẫn',

    demoRegistration: 'Đăng ký Demo',
    connectConsultation: 'Liên hệ tư vấn',
    connectLoginTrial: 'Đăng nhập / Dùng thử',

    heroEyebrow: '3D WEB GIS · UAV · LiDAR · POINT CLOUD',
    heroTitle1: 'Biến dữ liệu khảo sát thành',
    heroTitle2: 'project 3D có thể sử dụng',
    heroBody:
      'Tập trung Point Cloud, ảnh trực giao, Mesh 3D và dữ liệu cao độ trong một Web GIS để xem hiện trạng, đo đạc, quản lý lớp và chia sẻ trực tiếp trên trình duyệt.',
    heroDemo: 'Trải nghiệm Demo',
    heroPlatform: 'Khám phá nền tảng',
    heroMeta1: 'Xem dữ liệu 3D',
    heroMeta2: 'Đo đạc trực tiếp',
    heroMeta3: 'Quản lý & chia sẻ project',

    coreEyebrow: 'GIÁ TRỊ CỐT LÕI',
    coreTitle: 'Một nơi để xem, đo và làm việc với dữ liệu 3D',
    coreBody:
      '',
    core1Title: '3D GIS Viewer',
    core1Body:
      'Mở project trên trình duyệt, xoay góc nhìn và kiểm tra hiện trạng trong cùng một bối cảnh không gian.',
    core2Title: 'Point Cloud & LiDAR',
    core2Body:
      'Hiển thị dữ liệu điểm mật độ lớn để đọc hình học, cao độ và cấu trúc chi tiết của khu vực khảo sát.',
    core3Title: 'Đo đạc & Phân tích',
    core3Body:
      'Thực hiện đo khoảng cách, cao độ và diện tích trực tiếp trên dữ liệu đang hiển thị.',
    core4Title: 'Lớp dữ liệu & Project',
    core4Body:
      'Bật/tắt lớp, giữ thống nhất dữ liệu theo project và chia sẻ cùng một bối cảnh cho nhóm làm việc.',

    workflowEyebrow: '3D MAPPING WORKFLOW',
    workflowTitle: 'Từ hiện trường đến Web GIS trong một luồng rõ ràng',
    workflowBody:
      'Dữ liệu tốt bắt đầu từ khảo sát hiện trường và kết thúc khi người dùng có thể mở project, kiểm tra và đo đạc trực tiếp.',
    workflowStep1: 'Khảo sát hiện trường & điểm khống chế',
    workflowStep2: 'Thu nhận dữ liệu UAV / LiDAR',
    workflowStep3: 'Xử lý & kiểm soát chất lượng',
    workflowStep4: 'Xuất bản lên 3D Web GIS',
    workflowBtn: 'Xem quy trình 3D Mapping',
    videoExpand: 'Phóng to video',
    videoClose: 'Đóng video',
    videoCaption: '3D Mapping · Nhiệt điện Long Phú',

    solutionsEyebrow: 'GIẢI PHÁP',
    solutionsTitle: 'Tập trung vào công việc thực tế, không chỉ là tính năng',
    solutionsBody:
      '',
    surveyTitle: 'Khảo sát & Đo đạc',
    surveyBody:
      'UAV, GCP / GNSS, Point Cloud và dữ liệu đầu ra phục vụ khảo sát hiện trường.',
    constructionTitle: 'Xây dựng & Hạ tầng',
    constructionBody:
      'Kiểm tra hiện trạng công trình, dữ liệu cao độ và project 3D theo từng khu vực.',
    agricultureTitle: 'Nông nghiệp',
    agricultureBody:
      'Khảo sát khu vực canh tác, dữ liệu mặt bằng và bối cảnh không gian cho sản xuất.',

    resourcesEyebrow: 'TÀI NGUYÊN',
    resourcesTitle: 'Đi sâu vào workflow, thiết bị và dữ liệu đầu ra',
    resourcesBody:
      'Các trang tài nguyên được tổ chức để người xem nhanh hiểu hệ thống trước khi mở project Demo.',
    resourceWorkflowBody:
      '08 giai đoạn từ khảo sát hiện trường đến Viewer.',
    resourceEquipmentBody:
      'X500: tải trọng tối đa 5 kg, 58 / 52 / 40 phút theo tải · AA6D: 1,85 kg, tầm đo tối đa 2.100 m @100 kHz và scan rate tới 2M pts/s.',
    resourceOutputBody:
      'Orthophoto, Point Cloud, 3D Mesh và DEM / DSM.',
    resourceDemoBody:
      'Xem dữ liệu 3D trong bối cảnh project thực tế.',

    finalTitle: 'Mở một project Demo và kiểm tra dữ liệu trực tiếp',
    finalBody:
      'Xem cách dữ liệu khảo sát sau xử lý được tổ chức thành các lớp, hiển thị và đo đạc trong Viewer.',
    finalDemo: 'Đăng ký xem Demo',
    finalMaps: 'Xem Demo Maps',

    footerDesc:
      'Nền tảng 3D Web GIS cho dữ liệu UAV, LiDAR, Point Cloud và 3D Mapping.',
    footerProduct: 'Sản phẩm',
    footerSolutions: 'Giải pháp',
    footerResources: 'Tài nguyên',
    rights: '© 2026 SAOLATEK. All rights reserved.'
  },

  en: {
    platform: 'Platform',
    solutions: 'Solutions',
    resources: 'Resources',
    connect: 'Connect',
    login: 'Log in',
    dashboard: 'Dashboard',
    bookDemo: 'Book a demo',

    viewer3DTitle: '3D GIS Viewer',
    platformPointCloud: 'Point Cloud & LiDAR',
    platformAnalysis: '3D Measurement & Analysis',
    platformLayers: 'Data Layer Management',
    platformCoordinates: 'VN-2000 & Coordinate Systems',
    platformProjects: 'Project Sharing & Management',

    solSurveying: 'Surveying & Measurement',
    solConstructionInfra: 'Construction & Infrastructure',
    solAgriculture: 'Agriculture',
    solUavMapping: 'UAV Mapping & LiDAR',

    resMappingWorkflow: '3D Mapping Workflow',
    resEquipmentSpecs: 'Equipment & Technical Specifications',
    res3DOutputs: '3D Data Outputs',
    resDemoMaps: 'Demo Maps',
    resGuides: 'User Guides',

    demoRegistration: 'Book a demo',
    connectConsultation: 'Contact an Advisor',
    connectLoginTrial: 'Log In / Start a Trial',

    heroEyebrow: '3D WEB GIS · UAV · LiDAR · POINT CLOUD',
    heroTitle1: 'Turn survey data into',
    heroTitle2: 'a usable 3D project',
    heroBody:
      'Bring Point Cloud, orthophotos, 3D Mesh and elevation data into one Web GIS to inspect conditions, measure, manage layers and share projects directly in the browser.',
    heroDemo: 'Explore Demo',
    heroPlatform: 'Explore platform',
    heroMeta1: 'View 3D data',
    heroMeta2: 'Measure directly',
    heroMeta3: 'Manage & share projects',

    coreEyebrow: 'CORE VALUE',
    coreTitle: 'One place to view, measure and work with 3D data',
    coreBody:
      'The core idea stays simple: survey data should be easy to inspect, easy to verify and clear enough for the whole team to use.',
    core1Title: '3D GIS Viewer',
    core1Body:
      'Open projects in the browser, change viewpoints and inspect current conditions in one spatial context.',
    core2Title: 'Point Cloud & LiDAR',
    core2Body:
      'Render dense point data for geometry, elevation and detailed site inspection.',
    core3Title: 'Measurement & Analysis',
    core3Body:
      'Measure distance, elevation and area directly on the data currently displayed.',
    core4Title: 'Layers & Projects',
    core4Body:
      'Control layers, keep project data consistent and share one project context with the team.',

    workflowEyebrow: '3D MAPPING WORKFLOW',
    workflowTitle: 'A clear pipeline from field operations to Web GIS',
    workflowBody:
      'Good data starts in the field and finishes when users can open the project, inspect it and measure directly.',
    workflowStep1: 'Field survey & control points',
    workflowStep2: 'UAV / LiDAR data capture',
    workflowStep3: 'Processing & quality control',
    workflowStep4: 'Publish to 3D Web GIS',
    workflowBtn: 'View 3D Mapping workflow',
    videoExpand: 'Expand video',
    videoClose: 'Close video',
    videoCaption: '3D Mapping · Long Phú Thermal Power Plant',

    solutionsEyebrow: 'SOLUTIONS',
    solutionsTitle: 'Built around real work, not only feature lists',
    solutionsBody:
      'Different projects require different capture and data workflows. Choose the context closest to your work.',
    surveyTitle: 'Surveying & Measurement',
    surveyBody:
      'UAV, GCP / GNSS, Point Cloud and deliverables for field survey operations.',
    constructionTitle: 'Construction & Infrastructure',
    constructionBody:
      'Inspect current conditions, elevation data and project-based 3D information.',
    agricultureTitle: 'Agriculture',
    agricultureBody:
      'Survey cultivation areas, plan-view data and spatial context for production.',

    resourcesEyebrow: 'RESOURCES',
    resourcesTitle: 'Go deeper into workflow, equipment and data outputs',
    resourcesBody:
      'Resource pages are structured to help visitors understand the system before opening a Demo project.',
    resourceWorkflowBody:
      'Eight stages from field survey to the Viewer.',
    resourceEquipmentBody:
      'X500: 5 kg max payload with 58 / 52 / 40 min references by payload · AA6D: 1.85 kg, up to 2,100 m @100 kHz and up to 2M pts/s.',
    resourceOutputBody:
      'Orthophoto, Point Cloud, 3D Mesh and DEM / DSM.',
    resourceDemoBody:
      'Inspect 3D data inside real project contexts.',

    finalTitle: 'Open a Demo project and inspect the data directly',
    finalBody:
      'See how processed survey data is organized into layers, displayed and measured inside the Viewer.',
    finalDemo: 'Request Demo',
    finalMaps: 'View Demo Maps',

    footerDesc:
      '3D Web GIS platform for UAV, LiDAR, Point Cloud and 3D Mapping data.',
    footerProduct: 'Product',
    footerSolutions: 'Solutions',
    footerResources: 'Resources',
    rights: '© 2026 SAOLATEK. All rights reserved.'
  },

  zh: {
    platform: '平台',
    solutions: '解决方案',
    resources: '资源',
    connect: '联系',
    login: '登录',
    dashboard: '控制台',
    bookDemo: '申请演示',

    viewer3DTitle: '3D GIS Viewer',
    platformPointCloud: 'Point Cloud & LiDAR',
    platformAnalysis: '三维测量与分析',
    platformLayers: '数据图层管理',
    platformCoordinates: 'VN-2000 与坐标系统',
    platformProjects: '项目共享与管理',

    solSurveying: '测绘与测量',
    solConstructionInfra: '建筑与基础设施',
    solAgriculture: '农业',
    solUavMapping: 'UAV Mapping & LiDAR',

    resMappingWorkflow: '3D Mapping 工作流程',
    resEquipmentSpecs: '设备与技术规格',
    res3DOutputs: '三维数据成果',
    resDemoMaps: 'Demo Maps',
    resGuides: '使用指南',

    demoRegistration: '申请演示',
    connectConsultation: '联系咨询',
    connectLoginTrial: '登录 / 试用',

    heroEyebrow: '3D WEB GIS · UAV · LiDAR · POINT CLOUD',
    heroTitle1: '将测绘数据变成',
    heroTitle2: '真正可使用的三维项目',
    heroBody:
      '在一个 Web GIS 中集中点云、正射影像、3D Mesh 和高程数据，用于查看现状、测量、图层管理和项目共享。',
    heroDemo: '体验 Demo',
    heroPlatform: '查看平台',
    heroMeta1: '查看三维数据',
    heroMeta2: '直接测量',
    heroMeta3: '管理与共享项目',

    coreEyebrow: '核心价值',
    coreTitle: '在一个地方查看、测量和使用三维数据',
    coreBody:
      '核心保持简单：测绘数据应该容易查看、容易验证，并且足够清晰，让整个团队都能使用。',
    core1Title: '3D GIS Viewer',
    core1Body:
      '直接在浏览器中打开项目、切换视角并检查现场现状。',
    core2Title: 'Point Cloud & LiDAR',
    core2Body:
      '显示高密度点数据，用于几何、高程和现场细节检查。',
    core3Title: '三维测量与分析',
    core3Body:
      '直接在当前数据显示上测量距离、高程和面积。',
    core4Title: '图层与项目',
    core4Body:
      '控制图层、保持项目数据一致，并与团队共享统一的项目环境。',

    workflowEyebrow: '3D MAPPING 工作流程',
    workflowTitle: '从现场作业到 Web GIS 的清晰流程',
    workflowBody:
      '高质量数据从现场开始，并在用户能够打开项目、检查和直接测量时真正完成。',
    workflowStep1: '现场测绘与控制点',
    workflowStep2: 'UAV / LiDAR 数据采集',
    workflowStep3: '处理与质量控制',
    workflowStep4: '发布到 3D Web GIS',
    workflowBtn: '查看 3D Mapping 流程',
    videoExpand: '放大视频',
    videoClose: '关闭视频',
    videoCaption: '3D Mapping · Long Phú 火力发电厂',

    solutionsEyebrow: '解决方案',
    solutionsTitle: '围绕真实工作，而不仅是功能清单',
    solutionsBody:
      '不同项目需要不同的数据采集和使用流程。选择最接近实际工作的场景。',
    surveyTitle: '测绘与测量',
    surveyBody:
      '用于现场测绘的 UAV、GCP / GNSS、点云和成果数据。',
    constructionTitle: '建筑与基础设施',
    constructionBody:
      '查看现场现状、高程数据以及基于项目的三维信息。',
    agricultureTitle: '农业',
    agricultureBody:
      '农业区域测绘、平面数据以及生产空间环境。',

    resourcesEyebrow: '资源',
    resourcesTitle: '深入了解工作流程、设备和数据成果',
    resourcesBody:
      '资源页面帮助访客在打开 Demo 项目前快速理解整个系统。',
    resourceWorkflowBody:
      '从现场测绘到 Viewer 的八个阶段。',
    resourceEquipmentBody:
      'X500：最大载荷 5 kg，并给出 58 / 52 / 40 分钟的载荷参考续航 · AA6D：1.85 kg，100 kHz 时最大测距 2,100 m，最高 2M pts/s。',
    resourceOutputBody:
      '正射影像、点云、3D Mesh 和 DEM / DSM。',
    resourceDemoBody:
      '在真实项目环境中查看三维数据。',

    finalTitle: '打开 Demo 项目并直接检查数据',
    finalBody:
      '查看处理后的测绘数据如何组织为图层、显示并在 Viewer 中测量。',
    finalDemo: '申请演示',
    finalMaps: '查看 Demo Maps',

    footerDesc:
      '用于 UAV、LiDAR、点云和三维建图数据的 3D Web GIS 平台。',
    footerProduct: '产品',
    footerSolutions: '解决方案',
    footerResources: '资源',
    rights: '© 2026 SAOLATEK. All rights reserved.'
  }
};

const LONG_PHU_VIDEO_URL =
  'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/videos/Video%203D%20Mapping%20nh%C3%A0%20m%C3%A1y%20nhi%E1%BB%87t%20%C4%91i%E1%BB%87n%20Long%20Ph%C3%BA%20v1.mp4';

const THEME_STORAGE_KEY = 'saolatek_theme';

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

const VideoShowcase: React.FC<{
  expandLabel: string;
  closeLabel: string;
  caption: string;
}> = ({
  expandLabel,
  closeLabel,
  caption
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <figure className="lp-home-video">
        <div className="lp-home-video__frame">
          <video
            src={LONG_PHU_VIDEO_URL}
            poster={viewerOverviewImage}
            autoPlay
            loop
            muted
            playsInline
            className="lp-home-video__media"
          />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lp-home-video__expand"
          >
            <Maximize2 size={16} />
            {expandLabel}
          </button>
        </div>

        <figcaption className="lp-home-video__caption">
          {caption}
        </figcaption>
      </figure>

      {open && (
        <div
          className="lp-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={caption}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="lp-video-modal__close"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
          >
            <X size={22} />
          </button>

          <div
            className="lp-video-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              src={LONG_PHU_VIDEO_URL}
              controls
              autoPlay
              playsInline
              className="lp-video-modal__video"
            />
          </div>
        </div>
      )}
    </>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { openDemo, isDemoLoading } = useDemoNavigation();

  const [isDarkMode, setIsDarkMode] =
    useState(readInitialTheme);
  const { currentLang } =
    useLanguage('vi');

  const t = (key: keyof Translation) =>
    TRANSLATIONS[currentLang][key];

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

  const scrollToCore = () => {
    document
      .getElementById('core-platform')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  };

  const solutionCards = [
    {
      title: t('surveyTitle'),
      body: t('surveyBody'),
      image: surveyingFieldImage,
      route: '/solutions/surveying'
    },
    {
      title: t('constructionTitle'),
      body: t('constructionBody'),
      image: constructionOverviewImage,
      route:
        '/solutions/construction-infrastructure'
    },
    {
      title: t('agricultureTitle'),
      body: t('agricultureBody'),
      image: agricultureHeroImage,
      route: '/solutions/agriculture'
    }
  ];

  const resourceRows = [
    {
      title: t('resMappingWorkflow'),
      body: t('resourceWorkflowBody'),
      route: '/resources/3d-mapping-workflow'
    },
    {
      title: t('resEquipmentSpecs'),
      body: t('resourceEquipmentBody'),
      route:
        '/resources/equipment-specifications'
    },
    {
      title: t('res3DOutputs'),
      body: t('resourceOutputBody'),
      route: '/resources/3d-output-data'
    },
    {
      title: t('resDemoMaps'),
      body: t('resourceDemoBody'),
      route: '/resources/demo-maps'
    }
  ];

  return (
    <>
      <style>{`
        .lp-root {
          --lp-bg: #040812;
          --lp-bg-2: #07101c;
          --lp-bg-3: #0a1420;
          --lp-text: #f8fafc;
          --lp-muted: #95a4b7;
          --lp-line: rgba(255,255,255,.10);
          --lp-line-strong: rgba(255,255,255,.18);
          --lp-accent: #38bdf8;
          --lp-accent-2: #0ea5e9;
          min-height: 100vh;
          overflow-x: clip;
          background: var(--lp-bg);
          color: var(--lp-text);
          transition:
            background .22s ease,
            color .22s ease;
        }

        .lp-root.light-mode {
          --lp-bg: #f7f9fc;
          --lp-bg-2: #eef3f8;
          --lp-bg-3: #ffffff;
          --lp-text: #0f172a;
          --lp-muted: #607084;
          --lp-line: rgba(15,23,42,.10);
          --lp-line-strong: rgba(15,23,42,.18);
          --lp-accent: #0284c7;
          --lp-accent-2: #0369a1;
        }

        .lp-root *,
        .lp-root *::before,
        .lp-root *::after {
          box-sizing: border-box;
        }

        .lp-shell {
          width:
            min(1480px, calc(100% - 64px));
          margin: 0 auto;
        }

        .lp-eyebrow {
          color: var(--lp-accent);
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .lp-heading {
          margin: 14px 0 0;
          max-width: 20ch;
          color: var(--lp-text);
          font-size:
            clamp(2.1rem,3.7vw,3.5rem);
          font-weight: 650;
          line-height: 1.03;
          letter-spacing: -.05em;
        }

        .lp-heading--two-line {
          max-width: none;
        }

        .lp-heading__line {
          display: block;
          white-space: nowrap;
        }

        .lp-copy {
          max-width: 720px;
          margin: 18px 0 0;
          color: var(--lp-muted);
          font-size: 15px;
          line-height: 1.8;
        }

        .lp-primary,
        .lp-secondary {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 18px;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition:
            color .16s ease,
            border-color .16s ease,
            background .16s ease;
        }

        .lp-primary {
          border: 1px solid #f8fafc;
          background: #f8fafc;
          color: #020617;
        }

        .lp-primary:hover {
          border-color: #dbeafe;
          background: #dbeafe;
        }

        .lp-primary:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .lp-secondary {
          border: 1px solid var(--lp-line-strong);
          background: transparent;
          color: var(--lp-text);
        }

        .lp-secondary:hover {
          border-color: var(--lp-accent);
          color: var(--lp-accent);
        }

        /* ==================================================== */
        /* HERO — field survey → 3D Web GIS */
        /* ==================================================== */

        .lp-hero {
          position: relative;
          isolation: isolate;
          min-height: calc(100svh - 68px);
          overflow: hidden;
          background: #040812;
        }

        .lp-hero__media {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #dfe7ef;
        }

        .lp-hero__media::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              180deg,
              rgba(2,6,13,.02) 0%,
              rgba(2,6,13,.04) 54%,
              rgba(2,6,13,.48) 100%
            );
        }

        .lp-hero__media img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 63% 48%;
          transform: scale(1.012);
          filter:
            saturate(.94)
            contrast(1.02);
          animation:
            lpHeroDrift
            26s ease-in-out
            infinite alternate;
        }

        @keyframes lpHeroDrift {
          from {
            transform:
              scale(1.012)
              translate3d(0,0,0);
          }
          to {
            transform:
              scale(1.045)
              translate3d(-.35%,-.18%,0);
          }
        }

        .lp-hero__veil {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(3,8,18,.97) 0%,
              rgba(3,8,18,.91) 24%,
              rgba(3,8,18,.75) 39%,
              rgba(3,8,18,.42) 56%,
              rgba(3,8,18,.10) 76%,
              rgba(3,8,18,.04) 100%
            );
        }

        .lp-root.light-mode
        .lp-hero__veil {
          background:
            linear-gradient(
              90deg,
              rgba(226,233,241,.88) 0%,
              rgba(230,237,244,.78) 25%,
              rgba(235,241,247,.58) 42%,
              rgba(239,244,249,.26) 60%,
              rgba(243,247,250,.08) 80%,
              rgba(248,250,252,.01) 100%
            );
        }

        .lp-root.light-mode
        .lp-hero__media img {
          filter:
            brightness(.90)
            saturate(.92)
            contrast(1.04);
        }

        .lp-hero__inner {
          position: relative;
          z-index: 2;
          display: flex;
          min-height: calc(100svh - 68px);
          align-items: center;
          padding-top: 32px;
          padding-bottom: 104px;
        }

        .lp-hero__content {
          width: min(980px, 72%);
        }

        .lp-hero__title {
          max-width: none;
          margin: 0;
          color: #f8fafc;
          font-size:
            clamp(2.8rem,4.15vw,4.8rem);
          font-weight: 650;
          line-height: .98;
          letter-spacing: -.05em;
          white-space: nowrap;
        }

        .lp-root.light-mode
        .lp-hero__title {
          color: #0f172a;
        }

        .lp-hero__accent {
          display: block;
          margin-top: 6px;
          color: var(--lp-accent);
          white-space: nowrap;
        }

        .lp-hero__body {
          max-width: 560px;
          margin: 20px 0 0;
          color: rgba(226,232,240,.84);
          font-size: 14px;
          line-height: 1.72;
        }

        .lp-root.light-mode
        .lp-hero__body {
          color: #526174;
        }

        .lp-hero__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }

        .lp-hero .lp-primary {
          border-color: #f8fafc;
          background: #f8fafc;
          color: #050914;
        }

        .lp-root.light-mode
        .lp-hero .lp-primary {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
        }

        .lp-hero__secondary {
          border-color:
            rgba(248,250,252,.34);
          color: #f8fafc;
          background:
            rgba(3,8,18,.18);
          backdrop-filter: blur(10px);
        }

        .lp-root.light-mode
        .lp-hero__secondary {
          border-color:
            rgba(15,23,42,.20);
          color: #0f172a;
          background:
            rgba(255,255,255,.50);
        }

        .lp-hero__rail {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 3;
          border-top:
            1px solid rgba(255,255,255,.13);
          background:
            rgba(3,8,18,.64);
          backdrop-filter: blur(14px);
        }

        .lp-root.light-mode
        .lp-hero__rail {
          border-top-color:
            rgba(15,23,42,.10);
          background:
            rgba(248,250,252,.76);
        }

        .lp-hero__rail-inner {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
        }

        .lp-hero__rail-item {
          position: relative;
          min-height: 58px;
          display: flex;
          align-items: center;
          padding: 16px 24px;
          border-right:
            1px solid rgba(255,255,255,.10);
          color: rgba(226,232,240,.80);
          font-size: 12px;
          font-weight: 650;
          letter-spacing: .01em;
        }

        .lp-hero__rail-item::before {
          content: '';
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
          margin-right: 10px;
          border-radius: 50%;
          background: var(--lp-accent);
        }

        .lp-root.light-mode
        .lp-hero__rail-item {
          border-right-color:
            rgba(15,23,42,.10);
          color: #526174;
        }

        .lp-hero__rail-item:first-child {
          padding-left: 0;
        }

        .lp-hero__rail-item:last-child {
          padding-right: 0;
          border-right: 0;
        }

        /* ==================================================== */
        /* PLATFORM — one strong visual, not a tool panel */
        /* ==================================================== */

        .lp-platform {
          border-bottom: 1px solid var(--lp-line);
          background: var(--lp-bg-2);
        }

        .lp-platform__inner {
          padding: 92px 0;
        }

        .lp-platform__head {
          display: grid;
          grid-template-columns:
            minmax(0,.52fr)
            minmax(0,.48fr);
          gap: 72px;
          align-items: end;
        }

        .lp-platform__visual {
          margin-top: 44px;
          overflow: hidden;
          border: 1px solid var(--lp-line);
          background: #000;
          box-shadow:
            0 30px 80px rgba(0,0,0,.26);
        }

        .lp-root.light-mode
        .lp-platform__visual {
          box-shadow:
            0 24px 64px rgba(15,23,42,.10);
        }

        .lp-platform__visual img {
          display: block;
          width: 100%;
          aspect-ratio: 21/9;
          object-fit: cover;
        }

        .lp-platform__index {
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          margin-top: 28px;
          border-top: 1px solid var(--lp-line);
          border-bottom: 1px solid var(--lp-line);
        }

        .lp-platform__item {
          min-height: 164px;
          padding: 24px 24px;
          border: 0;
          border-right: 1px solid var(--lp-line);
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .lp-platform__item:first-child {
          padding-left: 0;
        }

        .lp-platform__item:last-child {
          padding-right: 0;
          border-right: 0;
        }

        .lp-platform__item h3 {
          margin: 0;
          color: var(--lp-text);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -.02em;
        }

        .lp-platform__item p {
          margin: 10px 0 0;
          color: var(--lp-muted);
          font-size: 13px;
          line-height: 1.72;
        }

        .lp-platform__action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color: var(--lp-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        /* ==================================================== */
        /* WORKFLOW — film + sequence */
        /* ==================================================== */

        .lp-workflow {
          border-bottom: 1px solid var(--lp-line);
          background: var(--lp-bg);
        }

        .lp-workflow__inner {
          padding: 92px 0;
        }

        .lp-workflow__intro {
          max-width: 980px;
        }

        .lp-workflow__layout {
          display: grid;
          grid-template-columns:
            minmax(0,.34fr)
            minmax(0,.66fr);
          gap: 68px;
          align-items: start;
          margin-top: 44px;
        }

        .lp-workflow__steps {
          border-top: 1px solid var(--lp-line);
          border-bottom: 1px solid var(--lp-line);
        }

        .lp-workflow__step {
          padding: 18px 0;
          border-bottom: 1px solid var(--lp-line);
          color: var(--lp-text);
          font-size: 14px;
          font-weight: 650;
          line-height: 1.55;
        }

        .lp-workflow__step:last-child {
          border-bottom: 0;
        }

        .lp-home-video__frame {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--lp-line);
          background: #000;
          box-shadow:
            0 30px 80px rgba(0,0,0,.26);
        }

        .lp-root.light-mode
        .lp-home-video__frame {
          box-shadow:
            0 24px 64px rgba(15,23,42,.10);
        }

        .lp-home-video__media {
          display: block;
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
        }

        .lp-home-video__expand {
          position: absolute;
          right: 14px;
          bottom: 14px;
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border:
            1px solid rgba(255,255,255,.26);
          border-radius: 2px;
          background:
            rgba(2,6,13,.78);
          color: #fff;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          backdrop-filter: blur(12px);
        }

        .lp-home-video__caption {
          margin-top: 11px;
          color: var(--lp-muted);
          font-size: 11px;
          text-align: center;
        }

        .lp-video-modal {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background:
            rgba(2,6,13,.97);
          backdrop-filter: blur(20px);
        }

        .lp-video-modal__close {
          position: absolute;
          top: 24px;
          right: 24px;
          display: flex;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border:
            1px solid rgba(255,255,255,.20);
          border-radius: 2px;
          background:
            rgba(255,255,255,.04);
          color: #fff;
          cursor: pointer;
        }

        .lp-video-modal__content {
          width: min(1280px,100%);
          overflow: hidden;
          border:
            1px solid rgba(255,255,255,.14);
          background: #000;
          box-shadow:
            0 30px 80px rgba(0,0,0,.5);
        }

        .lp-video-modal__video {
          display: block;
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: contain;
        }

        /* ==================================================== */
        /* SOLUTIONS — image-led editorial band */
        /* ==================================================== */

        .lp-solutions {
          border-bottom: 1px solid var(--lp-line);
          background: var(--lp-bg-2);
        }

        .lp-solutions__inner {
          padding: 92px 0;
        }

        .lp-solutions__grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          margin-top: 44px;
          border-top: 1px solid var(--lp-line);
          border-bottom: 1px solid var(--lp-line);
        }

        .lp-solutions__item {
          border-right: 1px solid var(--lp-line);
          cursor: pointer;
        }

        .lp-solutions__item:last-child {
          border-right: 0;
        }

        .lp-solutions__item img {
          display: block;
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
        }

        .lp-solutions__body {
          padding: 22px 22px 26px;
        }

        .lp-solutions__item:first-child
        .lp-solutions__body {
          padding-left: 0;
        }

        .lp-solutions__item:last-child
        .lp-solutions__body {
          padding-right: 0;
        }

        .lp-solutions__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .lp-solutions__head h3 {
          margin: 0;
          color: var(--lp-text);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -.02em;
        }

        .lp-solutions__body p {
          margin: 10px 0 0;
          color: var(--lp-muted);
          font-size: 13px;
          line-height: 1.72;
        }

        .lp-solutions__head svg {
          flex-shrink: 0;
          color: var(--lp-accent);
        }

        /* ==================================================== */
        /* RESOURCES — clean index */
        /* ==================================================== */

        .lp-resources {
          border-bottom: 1px solid var(--lp-line);
          background: var(--lp-bg);
        }

        .lp-resources__inner {
          display: grid;
          grid-template-columns:
            minmax(0,.42fr)
            minmax(0,.58fr);
          gap: 56px;
          align-items: start;
          padding: 92px 0;
        }

        .lp-resources .lp-heading--two-line {
          font-size:
            clamp(1.9rem,3.05vw,3rem);
          line-height: 1.04;
          letter-spacing: -.045em;
        }

        .lp-resources__list {
          border-top: 1px solid var(--lp-line);
          border-bottom: 1px solid var(--lp-line);
        }

        .lp-resources__row {
          display: grid;
          grid-template-columns:
            108px minmax(180px,.62fr)
            minmax(0,1.38fr) auto;
          gap: 18px;
          align-items: center;
          width: 100%;
          padding: 20px 0;
          border: 0;
          border-bottom: 1px solid var(--lp-line);
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .lp-resources__row:last-child {
          border-bottom: 0;
        }

        .lp-resources__type {
          color: var(--lp-accent);
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .lp-resources__row h3 {
          margin: 0;
          color: var(--lp-text);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -.02em;
        }

        .lp-resources__row p {
          margin: 0;
          color: var(--lp-muted);
          font-size: 13px;
          line-height: 1.68;
        }

        .lp-resources__row svg {
          color: var(--lp-accent);
        }

        /* ==================================================== */
        /* FINAL BAND */
        /* ==================================================== */

        .lp-final {
          background: var(--lp-bg-2);
        }

        .lp-final__inner {
          padding: 56px 0;
        }

        .lp-final__band {
          display: grid;
          grid-template-columns:
            minmax(0,.58fr)
            minmax(320px,.42fr);
          gap: 64px;
          align-items: end;
          padding: 38px 0;
          border-top: 1px solid var(--lp-line);
          border-bottom: 1px solid var(--lp-line);
        }

        .lp-final__title {
          max-width: 20ch;
          margin: 14px 0 0;
          color: var(--lp-text);
          font-size:
            clamp(2rem,3.2vw,3rem);
          line-height: 1.05;
          letter-spacing: -.045em;
        }

        .lp-final__copy {
          margin: 0;
          color: var(--lp-muted);
          font-size: 15px;
          line-height: 1.78;
        }

        .lp-final__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        /* ==================================================== */
        /* FOOTER */
        /* ==================================================== */

        .lp-footer {
          border-top:
            1px solid rgba(255,255,255,.10);
          background: #02060d;
          color: #f8fafc;
        }

        .lp-footer__inner {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            auto auto auto;
          gap: 58px;
          padding: 46px 0;
        }

        .lp-footer__brand {
          max-width: 420px;
        }

        .lp-footer__brand img {
          height: 34px;
          width: auto;
        }

        .lp-footer__brand p {
          margin: 16px 0 0;
          color: #8fa0b5;
          font-size: 13px;
          line-height: 1.72;
        }

        .lp-footer__title {
          margin-bottom: 14px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .lp-footer__link {
          display: block;
          margin-top: 9px;
          padding: 0;
          border: 0;
          background: none;
          color: #9aa8ba;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }

        .lp-footer__link:hover {
          color: #f8fafc;
        }

        .lp-footer__bottom {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 0;
          border-top:
            1px solid rgba(255,255,255,.10);
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 1180px) {
          .lp-shell {
            width:
              min(100% - 40px,1480px);
          }

          .lp-platform__head,
          .lp-resources__inner,
          .lp-final__band {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .lp-workflow__layout {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .lp-platform__index {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .lp-platform__item:nth-child(2) {
            border-right: 0;
          }

          .lp-platform__item:nth-child(-n+2) {
            border-bottom: 1px solid var(--lp-line);
          }

          .lp-footer__inner {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .lp-heading__line {
            white-space: normal;
          }

          .lp-shell {
            width:
              min(100% - 32px,1480px);
          }

          .lp-hero__media img {
            object-position: 70% 46%;
          }

          .lp-hero__veil {
            background:
              linear-gradient(
                90deg,
                rgba(3,8,18,.95) 0%,
                rgba(3,8,18,.82) 52%,
                rgba(3,8,18,.34) 100%
              );
          }

          .lp-root.light-mode
          .lp-hero__veil {
            background:
              linear-gradient(
                90deg,
                rgba(226,233,241,.88) 0%,
                rgba(232,239,245,.68) 58%,
                rgba(241,246,250,.16) 100%
              );
          }

          .lp-hero__inner {
            align-items: flex-end;
            padding-top: 72px;
            padding-bottom: 168px;
          }

          .lp-hero__content {
            width: min(100%,620px);
          }

          .lp-hero__title {
            max-width: 11.5ch;
            font-size:
              clamp(2.55rem,10.5vw,3.8rem);
            line-height: 1;
            white-space: normal;
          }

          .lp-hero__accent {
            white-space: normal;
          }

          .lp-hero__rail-inner {
            grid-template-columns: 1fr;
          }

          .lp-hero__rail-item {
            padding: 10px 0;
            border-right: 0;
            border-bottom:
              1px solid rgba(255,255,255,.08);
          }

          .lp-hero__rail-item:last-child {
            border-bottom: 0;
          }

          .lp-platform__inner,
          .lp-workflow__inner,
          .lp-solutions__inner,
          .lp-resources__inner {
            padding-top: 62px;
            padding-bottom: 62px;
          }

          .lp-platform__index,
          .lp-solutions__grid {
            grid-template-columns: 1fr;
          }

          .lp-platform__item,
          .lp-platform__item:first-child,
          .lp-platform__item:last-child {
            min-height: 0;
            padding: 22px 0;
            border-right: 0;
            border-bottom: 1px solid var(--lp-line);
          }

          .lp-platform__item:last-child {
            border-bottom: 0;
          }

          .lp-solutions__item {
            border-right: 0;
            border-bottom: 1px solid var(--lp-line);
          }

          .lp-solutions__item:last-child {
            border-bottom: 0;
          }

          .lp-solutions__body,
          .lp-solutions__item:first-child
          .lp-solutions__body,
          .lp-solutions__item:last-child
          .lp-solutions__body {
            padding: 20px 0 24px;
          }

          .lp-resources__row {
            grid-template-columns:
              1fr auto;
            gap: 8px 16px;
            align-items: start;
          }

          .lp-resources__type,
          .lp-resources__row h3 {
            grid-column: 1;
          }

          .lp-resources__row p {
            grid-column: 1 / -1;
          }

          .lp-resources__row svg {
            grid-column: 2;
            grid-row: 1 / span 2;
          }

          .lp-final__actions {
            flex-direction: column;
            align-items: stretch;
          }

          .lp-final__actions button {
            width: 100%;
          }

          .lp-footer__inner {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .lp-footer__bottom {
            flex-direction: column;
          }

          .lp-video-modal {
            padding: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-hero__media img {
            animation: none;
            transform: scale(1.01);
          }
        }
      `}</style>

      <div
        className={`lp-root ${
          isDarkMode
            ? ''
            : 'light-mode'
        }`}
      >

        {/* ==================================================== */}
        {/* HERO */}
        {/* ==================================================== */}

        <section className="lp-hero">
          <div
            className="lp-hero__media"
            aria-hidden="true"
          >
            <img
              src={mappingHeroImage}
              alt=""
            />
          </div>

          <div className="lp-hero__veil" />

          <div className="lp-shell lp-hero__inner">
            <div className="lp-hero__content">
              <h1 className="lp-hero__title">
                {t('heroTitle1')}
                <span className="lp-hero__accent">
                  {t('heroTitle2')}
                </span>
              </h1>

              <p className="lp-hero__body">
                {t('heroBody')}
              </p>

              <div className="lp-hero__actions">
                <button
                  type="button"
                  className="lp-primary"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                >
                  {t('heroDemo')}
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  className="lp-secondary lp-hero__secondary"
                  onClick={scrollToCore}
                >
                  {t('heroPlatform')}
                </button>
              </div>
            </div>
          </div>

          <div className="lp-hero__rail">
            <div className="lp-shell lp-hero__rail-inner">
              <div className="lp-hero__rail-item">
                {t('heroMeta1')}
              </div>
              <div className="lp-hero__rail-item">
                {t('heroMeta2')}
              </div>
              <div className="lp-hero__rail-item">
                {t('heroMeta3')}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* PLATFORM */}
        {/* ==================================================== */}

        <section
          id="core-platform"
          className="lp-platform"
        >
          <div className="lp-shell lp-platform__inner">
            <div className="lp-platform__head">
              <div>
                <div className="lp-eyebrow">
                  {t('coreEyebrow')}
                </div>

                <h2 className="lp-heading lp-heading--two-line">
                  {currentLang === 'vi' ? (
                    <>
                      <span className="lp-heading__line">
                        Một nơi để xem, đo
                      </span>
                      <span className="lp-heading__line">
                        và làm việc với dữ liệu 3D
                      </span>
                    </>
                  ) : (
                    t('coreTitle')
                  )}
                </h2>
              </div>

              {t('coreBody') && (
                <p className="lp-copy">
                  {t('coreBody')}
                </p>
              )}
            </div>

            <div className="lp-platform__visual">
              <img
                src={measurementAreaImage}
                alt="3D GIS Viewer measurement"
              />
            </div>

            <div className="lp-platform__index">
              {[
                [
                  t('core1Title'),
                  t('core1Body'),
                  '/platform/3d-gis'
                ],
                [
                  t('core2Title'),
                  t('core2Body'),
                  '/platform/point-cloud-lidar'
                ],
                [
                  t('core3Title'),
                  t('core3Body'),
                  '/platform/measurement-analysis'
                ],
                [
                  t('core4Title'),
                  t('core4Body'),
                  '/platform/data-layer-management'
                ]
              ].map(
                ([title, body, route]) => (
                  <button
                    type="button"
                    key={title}
                    className="lp-platform__item"
                    onClick={() =>
                      navigate(route)
                    }
                  >
                    <h3>{title}</h3>
                    <p>{body}</p>

                    <span className="lp-platform__action">
                      {currentLang === 'vi'
                        ? 'Xem chi tiết'
                        : currentLang === 'en'
                          ? 'View details'
                          : '查看详情'}
                      <ArrowRight size={13} />
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* WORKFLOW */}
        {/* ==================================================== */}

        <section className="lp-workflow">
          <div className="lp-shell lp-workflow__inner">
            <div className="lp-workflow__intro">
              <div className="lp-eyebrow">
                {t('workflowEyebrow')}
              </div>

              <h2 className="lp-heading lp-heading--two-line">
                {currentLang === 'vi' ? (
                  <>
                    <span className="lp-heading__line">
                      Từ hiện trường đến Web GIS
                    </span>
                    <span className="lp-heading__line">
                      trong một luồng rõ ràng
                    </span>
                  </>
                ) : (
                  t('workflowTitle')
                )}
              </h2>

              <p className="lp-copy">
                {t('workflowBody')}
              </p>
            </div>

            <div className="lp-workflow__layout">
              <div>
                <div className="lp-workflow__steps">
                  {[
                    t('workflowStep1'),
                    t('workflowStep2'),
                    t('workflowStep3'),
                    t('workflowStep4')
                  ].map((item) => (
                    <div
                      key={item}
                      className="lp-workflow__step"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="lp-secondary"
                  style={{
                    marginTop: '22px'
                  }}
                  onClick={() =>
                    navigate(
                      '/resources/3d-mapping-workflow'
                    )
                  }
                >
                  {t('workflowBtn')}
                  <ArrowRight size={14} />
                </button>
              </div>

              <VideoShowcase
                expandLabel={t('videoExpand')}
                closeLabel={t('videoClose')}
                caption={t('videoCaption')}
              />
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* SOLUTIONS */}
        {/* ==================================================== */}

        <section className="lp-solutions">
          <div className="lp-shell lp-solutions__inner">
            <div>
              <div className="lp-eyebrow">
                {t('solutionsEyebrow')}
              </div>

              <h2 className="lp-heading lp-heading--two-line">
                {currentLang === 'vi' ? (
                  <>
                    <span className="lp-heading__line">
                      Tập trung vào công việc thực tế,
                    </span>
                    <span className="lp-heading__line">
                      không chỉ là tính năng
                    </span>
                  </>
                ) : (
                  t('solutionsTitle')
                )}
              </h2>

              {t('solutionsBody') && (
                <p className="lp-copy">
                  {t('solutionsBody')}
                </p>
              )}
            </div>

            <div className="lp-solutions__grid">
              {solutionCards.map(
                (item) => (
                  <article
                    key={item.title}
                    className="lp-solutions__item"
                    onClick={() =>
                      navigate(item.route)
                    }
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                    />

                    <div className="lp-solutions__body">
                      <div className="lp-solutions__head">
                        <div>
                          <h3>
                            {item.title}
                          </h3>
                          <p>{item.body}</p>
                        </div>

                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* RESOURCES */}
        {/* ==================================================== */}

        <section className="lp-resources">
          <div className="lp-shell lp-resources__inner">
            <div>
              <div className="lp-eyebrow">
                {t('resourcesEyebrow')}
              </div>

              <h2 className="lp-heading lp-heading--two-line">
                {currentLang === 'vi' ? (
                  <>
                    <span className="lp-heading__line">
                      Đi sâu vào workflow, thiết bị
                    </span>
                    <span className="lp-heading__line">
                      và dữ liệu đầu ra
                    </span>
                  </>
                ) : (
                  t('resourcesTitle')
                )}
              </h2>

              <p className="lp-copy">
                {t('resourcesBody')}
              </p>
            </div>

            <div className="lp-resources__list">
              {resourceRows.map(
                (item, index) => {
                  const resourceLabels =
                    currentLang === 'vi'
                      ? [
                          'Quy trình',
                          'Thiết bị',
                          'Dữ liệu',
                          'Demo'
                        ]
                      : currentLang === 'en'
                        ? [
                            'Workflow',
                            'Equipment',
                            'Data output',
                            'Demo'
                          ]
                        : [
                            '流程',
                            '设备',
                            '数据成果',
                            '演示'
                          ];

                  return (
                    <button
                      type="button"
                      key={item.title}
                      className="lp-resources__row"
                      onClick={() =>
                        navigate(item.route)
                      }
                    >
                      <span className="lp-resources__type">
                        {resourceLabels[index]}
                      </span>

                      <h3>{item.title}</h3>
                      <p>{item.body}</p>

                      <ArrowRight size={15} />
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* FINAL CTA */}
        {/* ==================================================== */}

        <section className="lp-final">
          <div className="lp-shell lp-final__inner">
            <div className="lp-final__band">
              <div>
                <div className="lp-eyebrow">
                  DEMO PROJECT
                </div>

                <h2 className="lp-final__title">
                  {t('finalTitle')}
                </h2>
              </div>

              <div>
                <p className="lp-final__copy">
                  {t('finalBody')}
                </p>

                <div className="lp-final__actions">
                  <button
                    type="button"
                    className="lp-secondary"
                    onClick={() =>
                      navigate(
                        '/resources/demo-maps'
                      )
                    }
                  >
                    {t('finalMaps')}
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    className="lp-primary"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                  >
                    {t('finalDemo')}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* FOOTER */}
        {/* ==================================================== */}

        <footer className="lp-footer">
          <div className="lp-shell lp-footer__inner">
            <div className="lp-footer__brand">
              <img
                src={logoImg}
                alt="SAOLATEK"
              />
              <p>{t('footerDesc')}</p>
            </div>

            <div>
              <div className="lp-footer__title">
                {t('footerProduct')}
              </div>
              {[
                [
                  t('viewer3DTitle'),
                  '/platform/3d-gis'
                ],
                [
                  t('platformPointCloud'),
                  '/platform/point-cloud-lidar'
                ],
                [
                  t('platformAnalysis'),
                  '/platform/measurement-analysis'
                ]
              ].map(([label, route]) => (
                <button
                  key={label}
                  type="button"
                  className="lp-footer__link"
                  onClick={() =>
                    navigate(route)
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <div className="lp-footer__title">
                {t('footerSolutions')}
              </div>
              {[
                [
                  t('solSurveying'),
                  '/solutions/surveying'
                ],
                [
                  t('solConstructionInfra'),
                  '/solutions/construction-infrastructure'
                ],
                [
                  t('solAgriculture'),
                  '/solutions/agriculture'
                ]
              ].map(([label, route]) => (
                <button
                  key={label}
                  type="button"
                  className="lp-footer__link"
                  onClick={() =>
                    navigate(route)
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <div className="lp-footer__title">
                {t('footerResources')}
              </div>

              {resourceRows.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="lp-footer__link"
                  onClick={() =>
                    navigate(item.route)
                  }
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>làm landing

          <div className="lp-shell lp-footer__bottom">
            <span>{t('rights')}</span>
            <span>
              Web GIS · Point Cloud · 3D Mapping
            </span>
          </div>
        </footer>

      </div>
    </>
  );
};

export default LandingPage;