import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  Crosshair,
  Image as ImageIcon,
  Layers3,
  MapPinned,
  Plane,
  Ruler,
  ScanLine,
  Share2,
  SquareDashed,
  Users,
  Workflow,
} from 'lucide-react';

import logoImg from '../assets/logo.webp';
import surveyingFieldImage from '../assets/surveying-field-team.jpg';
import surveyingFlightPlanImage from '../assets/surveying-flight-plan.jpg';
import surveyingVideo from '../assets/videos/surveying-shtp.mp4';

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

const WORKFLOW_ICONS = [Plane, ScanLine, Layers3, Ruler] as const;
const OUTPUT_ICONS = [ImageIcon, Box, Layers3] as const;
const MEASURE_ICONS = [Ruler, SquareDashed, Crosshair] as const;

export const SurveyingSolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang } = useLanguage('vi');
  const { openDemo, isDemoLoading } = useDemoNavigation();
  const c = COPY[currentLang];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050914] text-white selection:bg-sky-400/30">
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              <span className="hidden sm:inline">{c.demo}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,.13),transparent_34%),radial-gradient(circle_at_84%_70%,rgba(34,211,238,.07),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-bold tracking-[.14em] text-sky-300">
                <Crosshair size={14} />
                {c.eyebrow}
              </div>

              <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.03] tracking-[-.045em] sm:text-[50px] lg:text-[60px]">
                {c.heroTitle1}
                <span className="block text-sky-400">{c.heroTitle2}</span>
              </h1>

              <p className="mt-6 max-w-[60ch] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {c.heroBody}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openDemo}
                  disabled={isDemoLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-400 px-6 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {c.openDemo3D}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/platform/measurement-analysis')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  {c.measurementLink}
                </button>
              </div>

              <div className="mt-8 grid max-w-[620px] grid-cols-1 gap-2 sm:grid-cols-3">
                {c.heroTags.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-xs font-semibold text-slate-300"
                  >
                    <Check size={14} className="shrink-0 text-sky-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <figure className="min-w-0">
              <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_26px_80px_rgba(0,0,0,.34)]">
                <img
                  src={surveyingFieldImage}
                  alt={c.fieldSurvey}
                  className="aspect-[16/11] w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  loading="eager"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/12 to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-sky-300 backdrop-blur">
                    {c.fieldSurvey}
                  </span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-cyan-300 backdrop-blur">
                    {c.uavMapping}
                  </span>
                </div>

                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.14em] text-sky-300">
                    <MapPinned size={13} />
                    {c.fieldOperations}
                  </div>
                  <p className="max-w-[540px] text-sm font-medium leading-6 text-white sm:text-base">
                    {c.heroCaption}
                  </p>
                </figcaption>
              </div>
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="max-w-[840px]">
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.workflowEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.workflowTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.workflowBody}</p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {c.workflowItems.map((item, index) => {
                const Icon = WORKFLOW_ICONS[index];
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[#09131f] p-5 transition hover:-translate-y-0.5 hover:border-sky-300/25"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                        <Icon size={19} />
                      </span>
                      <span className="text-[10px] font-bold tracking-[.16em] text-slate-600">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.57fr)_minmax(0,.43fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <figure className="min-w-0">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <img
                  src={surveyingFlightPlanImage}
                  alt={c.missionPlanning}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold tracking-[.14em] text-cyan-300">{c.missionPlanning}</div>
                  <p className="mt-1 text-sm font-medium text-white">{c.missionCaption}</p>
                </div>
              </div>
            </figure>

            <div>
              <div className="text-xs font-bold tracking-[.16em] text-cyan-300">{c.fieldEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.fieldTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.fieldBody}</p>

              <div className="mt-7 space-y-3">
                {c.fieldItems.map((item, index) => (
                  <article
                    key={item.title}
                    className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 rounded-xl border border-white/10 bg-[#09131f] p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-300">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-20">
            <div>
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.outputEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.outputTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.outputBody}</p>

              <div className="mt-7 space-y-3">
                {c.outputItems.map((item, index) => {
                  const Icon = OUTPUT_ICONS[index];
                  return (
                    <article
                      key={item.title}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 rounded-xl border border-white/10 bg-[#09131f] p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
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

            <div className="min-w-0">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_22px_65px_rgba(0,0,0,.3)]">
                <div className="flex items-center justify-between border-b border-white/10 bg-[#09111f] px-4 py-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-[.14em] text-sky-300">{c.projectView}</div>
                    <div className="mt-1 text-sm font-semibold">{c.projectName}</div>
                  </div>
                  <Layers3 size={18} className="text-sky-300" />
                </div>

                <div className="relative aspect-[16/10] bg-black">
                  <video
                    className="h-full w-full object-cover"
                    src={surveyingVideo}
                    muted
                    loop
                    autoPlay
                    playsInline
                    controls
                    preload="metadata"
                  />

                  <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
                    {['DOM', '3D MESH', 'POINT CLOUD'].map((label) => (
                      <span
                        key={label}
                        className="rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#050914]">
          <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
            <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-14">
              <div>
                <div className="text-xs font-bold tracking-[.16em] text-emerald-400">{c.measureEyebrow}</div>
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
                      className="rounded-2xl border border-white/10 bg-[#09131f] p-5"
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

        <section className="border-b border-white/10 bg-[#07101c]">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-14 lg:px-12">
            <div>
              <div className="text-xs font-bold tracking-[.16em] text-sky-400">{c.valueEyebrow}</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-.035em] md:text-[40px]">
                {c.valueTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">{c.valueBody}</p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#09131f]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Workflow size={17} className="text-sky-400" />
                  {c.surveyWorkflow}
                </div>
                <Users size={17} className="text-emerald-400" />
              </div>

              <ul className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2">
                {c.valueItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 bg-[#09131f] px-5 py-5 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                      <Check size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#050914]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(14,165,233,.15),transparent_42%)]" />

          <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 gap-7 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-12">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[.14em] text-sky-400">
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
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-6 text-sm font-bold text-[#04101a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

export default SurveyingSolutionPage;