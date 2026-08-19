import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import surveyingFieldImage from '../../assets/surveying-field-team.jpg';
import surveyingFlightPlanImage from '../../assets/surveying-flight-plan.jpg';
import viewerOverviewImage from '../../assets/3d-gis-viewer-overview.png';

import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import {
  useLanguage,
  type Language
} from '../../hooks/useLanguage';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';

type WorkflowStep = {
  title: string;
  body: string;
  meta: string;
};

type InfoItem = {
  title: string;
  body: string;
};

type Copy = {
  languageLabel: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroNote: string;
  heroTags: [string, string, string];
  heroPrimary: string;
  heroSecondary: string;
  fieldMediaLabel: string;
  fieldMediaCaption: string;
  flightMediaLabel: string;
  flightMediaCaption: string;

  workflowEyebrow: string;
  workflowTitle: string;
  workflowBody: string;
  workflowSteps: [
    WorkflowStep,
    WorkflowStep,
    WorkflowStep,
    WorkflowStep,
    WorkflowStep,
    WorkflowStep,
    WorkflowStep,
    WorkflowStep
  ];

  fieldEyebrow: string;
  fieldTitle: string;
  fieldBody: string;
  fieldItems: [InfoItem, InfoItem, InfoItem];
  fieldNote: string;

  processingEyebrow: string;
  processingTitle: string;
  processingBody: string;
  processingItems: [InfoItem, InfoItem, InfoItem, InfoItem];
  processingNote: string;
  processingCaption: string;

  outputEyebrow: string;
  outputTitle: string;
  outputBody: string;
  outputItems: [InfoItem, InfoItem, InfoItem, InfoItem];
  outputCaption: string;

  videoEyebrow: string;
  videoTitle: string;
  videoBody: string;
  videoCaption: string;

  qualityEyebrow: string;
  qualityTitle: string;
  qualityBody: string;
  qualityItems: [string, string, string, string];

  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  finalPrimary: string;
  finalSecondary: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',

    eyebrow: 'TÀI NGUYÊN · QUY TRÌNH 3D MAPPING',
    heroTitle1: 'Từ khảo sát hiện trường đến',
    heroTitle2: 'dữ liệu Web GIS 3D',
    heroBody:
      'Quy trình 3D Mapping kết nối khảo sát hiện trường, điểm khống chế, lập kế hoạch bay, thu nhận dữ liệu ảnh UAV hoặc LiDAR, xử lý theo từng loại cảm biến và tổ chức dữ liệu đã chuẩn hóa để khai thác trên Web GIS.',
    heroNote:
      'Nội dung được tổ chức theo workflow thực tế của bộ dữ liệu Queen Farm: khảo sát bản đồ → setup mốc → điểm khống chế → vùng bay → checklist → thực hiện bay → xử lý → kết quả.',
    heroTags: ['UAV Mapping', 'GCP / GNSS', '3D Web GIS'],
    heroPrimary: 'Mở Demo 3D',
    heroSecondary: 'Đăng ký xem Demo',
    fieldMediaLabel: 'FIELD OPERATIONS',
    fieldMediaCaption:
      'Khảo sát hiện trường và chuẩn bị phạm vi dữ liệu trước khi thực hiện nhiệm vụ bay',
    flightMediaLabel: 'MISSION PLANNING',
    flightMediaCaption:
      'Thiết lập khu vực bay và kiểm tra nhiệm vụ trước khi thu nhận dữ liệu',

    workflowEyebrow: 'WORKFLOW 08 GIAI ĐOẠN',
    workflowTitle: 'Một pipeline xuyên suốt từ hiện trường đến Viewer',
    workflowBody:
      'Mỗi bước giải quyết một phần của bài toán chất lượng dữ liệu. Khi được tổ chức đúng từ đầu, dữ liệu sau xử lý có thể đưa vào cùng một project để quan sát, đo đạc và truy cập theo phạm vi đã thiết lập.',
    workflowSteps: [
      {
        meta: '01 · SITE REVIEW',
        title: 'Khảo sát bản đồ & hiện trường',
        body:
          'Xác định ranh giới khu vực, địa hình, vật cản, mục tiêu khảo sát và phạm vi dữ liệu cần thu nhận.'
      },
      {
        meta: '02 · CONTROL MARK',
        title: 'Thiết lập điểm mốc',
        body:
          'Bố trí mốc kiểm soát tại các vị trí phù hợp để hỗ trợ định vị và kiểm tra độ chính xác của dữ liệu.'
      },
      {
        meta: '03 · GCP / CONTROL',
        title: 'Khảo sát điểm khống chế',
        body:
          'Đo tọa độ các điểm GCP / điểm kiểm tra bằng thiết bị GNSS phù hợp và liên kết dữ liệu với hệ tọa độ dự án.'
      },
      {
        meta: '04 · FLIGHT PLAN',
        title: 'Thiết lập vùng bay',
        body:
          'Xây dựng mission theo phạm vi khảo sát, độ cao bay, hướng tuyến và độ phủ ảnh phù hợp với loại sản phẩm đầu ra.'
      },
      {
        meta: '05 · PRE-FLIGHT',
        title: 'Checklist trước khi bay',
        body:
          'Kiểm tra UAV, cảm biến, pin, GNSS, bộ nhớ, liên kết điều khiển, khu vực cất hạ cánh và điều kiện thời tiết.'
      },
      {
        meta: '06 · DATA CAPTURE',
        title: 'Thực hiện nhiệm vụ bay',
        body:
          'Triển khai mission và theo dõi trạng thái chuyến bay, vùng phủ, dữ liệu thu nhận và các tình huống phát sinh tại hiện trường.'
      },
      {
        meta: '07 · PROCESSING',
        title: 'Xử lý & kiểm tra dữ liệu',
        body:
          'Xử lý theo loại cảm biến. Với LiDAR AlphaAir 6 / AA6D, CoPre hỗ trợ POS solve, Adjust & Refine và Generate point cloud; các workflow ảnh UAV tiếp tục theo chuỗi căn chỉnh và tái tạo phù hợp.'
      },
      {
        meta: '08 · DELIVERY',
        title: 'Kết quả & Web GIS',
        body:
          'Chuẩn hóa DOM, 3D Mesh, Point Cloud và các lớp liên quan để đưa vào Viewer phục vụ quan sát, đo đạc và truy cập theo phạm vi project.'
      }
    ],

    fieldEyebrow: 'CHUẨN BỊ HIỆN TRƯỜNG',
    fieldTitle: 'Chất lượng dữ liệu 3D bắt đầu trước khi UAV cất cánh',
    fieldBody:
      'Một mission tốt không chỉ là vẽ vùng bay. Cần xác định rõ mục tiêu sản phẩm, phạm vi khảo sát, điểm khống chế và điều kiện vận hành để dữ liệu thu nhận phù hợp với bước xử lý phía sau.',
    fieldItems: [
      {
        title: 'Xác định sản phẩm cần bàn giao',
        body:
          'Làm rõ cần DOM, mô hình 3D, Point Cloud hay tổ hợp nhiều lớp để lựa chọn cách thu nhận phù hợp.'
      },
      {
        title: 'Tổ chức điểm khống chế',
        body:
          'Phân bố mốc kiểm soát theo phạm vi dự án và sử dụng hệ tọa độ phù hợp với yêu cầu đo đạc.'
      },
      {
        title: 'Kiểm tra mission trước khi bay',
        body:
          'Đối chiếu vùng phủ, đường bay, an toàn vận hành, khả năng liên lạc và điều kiện thời tiết trước khi thực hiện.'
      }
    ],
    fieldNote:
      'Độ chính xác cuối cùng phụ thuộc vào cảm biến, cấu hình bay, điều kiện hiện trường, phương pháp GNSS/GCP và quy trình xử lý; không nên dùng một giá trị sai số cố định cho mọi dự án.',

    processingEyebrow: 'XỬ LÝ DỮ LIỆU',
    processingTitle: 'Biến dữ liệu thu nhận thành các lớp có thể khai thác',
    processingBody:
      'Sau hiện trường, dữ liệu được kiểm tra và xử lý theo loại cảm biến. Với hệ AlphaAir 6 / AA6D, CHCNAV tách rõ tiền xử lý LiDAR bằng CoPre và xử lý Point Cloud bằng CoProcess trước khi dữ liệu được chuẩn hóa cho project.',
    processingItems: [
      {
        title: 'Kiểm tra dữ liệu đầu vào',
        body:
          'Rà soát ảnh, trajectory / POS, GNSS, điểm khống chế, phạm vi thu nhận và tính đầy đủ của dữ liệu trước khi bắt đầu xử lý.'
      },
      {
        title: 'CoPre · tiền xử lý LiDAR',
        body:
          'Theo datasheet AlphaAir 6: POS solve → Adjust & Refine → Generate point cloud. Đây là chuỗi tiền xử lý dành cho dữ liệu LiDAR của hệ AlphaAir 6 / AA6D.'
      },
      {
        title: 'CoProcess · xử lý Point Cloud',
        body:
          'Datasheet liệt kê các module Terrain, CAD và Earthwork để tiếp tục khai thác Point Cloud theo nhu cầu dự án.'
      },
      {
        title: 'Chuẩn hóa & kiểm tra trước khi publish',
        body:
          'Đưa dữ liệu về đúng hệ tọa độ dự án, kiểm tra vùng thiếu / sai lệch và xác nhận lớp dữ liệu phù hợp trước khi đưa lên Web GIS.'
      }
    ],
    processingNote:
      'CoPre và CoProcess là chức năng phần mềm được nêu trong AlphaAir 6 Datasheet Rev. January 2026. Chúng mô tả nhánh xử lý LiDAR CHCNAV, không thay thế workflow xử lý ảnh UAV ở các dự án dùng cảm biến khác.',
    processingCaption:
      'Góc nhìn project 3D sau khi dữ liệu được xử lý và đưa vào Viewer',

    outputEyebrow: 'DỮ LIỆU ĐẦU RA',
    outputTitle: 'Một lần khảo sát, nhiều lớp dữ liệu trong cùng project',
    outputBody:
      'Các sản phẩm đầu ra phục vụ những góc nhìn khác nhau nhưng vẫn được tổ chức trong cùng bối cảnh không gian để người dùng chuyển đổi nhanh khi kiểm tra dự án.',
    outputItems: [
      {
        title: 'Ảnh trực giao / DOM',
        body:
          'Góc nhìn từ trên xuống để kiểm tra mặt bằng, ranh giới và đối chiếu vị trí trên toàn khu vực.'
      },
      {
        title: '3D Mesh',
        body:
          'Mô hình bề mặt có texture để quan sát hình dạng, công trình và bối cảnh không gian trực quan.'
      },
      {
        title: 'Point Cloud',
        body:
          'Dữ liệu điểm 3D phục vụ quan sát chi tiết cấu trúc, cao độ và các vị trí cần kiểm tra kỹ hơn.'
      },
      {
        title: 'Derived data & Web GIS layers',
        body:
          'Tùy workflow, Point Cloud có thể tiếp tục qua các bước Terrain / CAD / Earthwork trước khi các lớp đã chuẩn hóa được đưa vào project Web GIS.'
      }
    ],
    outputCaption:
      'Dữ liệu dự án được tổ chức thành các lớp có thể quan sát và đo đạc trực tiếp',

    videoEyebrow: 'CASE STUDY · NHIỆT ĐIỆN LONG PHÚ',
    videoTitle: 'Xem dữ liệu 3D Mapping trong bối cảnh dự án thực tế',
    videoBody:
      'Video minh họa cách dữ liệu 3D của dự án Nhiệt điện Long Phú được quan sát sau giai đoạn thu nhận và xử lý. Phần này giúp nối workflow hiện trường với trải nghiệm cuối cùng trên dữ liệu 3D.',
    videoCaption:
      'Video 3D Mapping · Nhiệt điện Long Phú',

    qualityEyebrow: 'KIỂM SOÁT CHẤT LƯỢNG',
    qualityTitle: 'Không chỉ tạo mô hình đẹp — dữ liệu phải sử dụng được',
    qualityBody:
      'Mục tiêu cuối cùng của workflow là tạo dữ liệu đủ tin cậy cho mục đích khảo sát và kiểm tra dự án. Vì vậy cần duy trì kiểm soát chất lượng từ hiện trường đến trước khi xuất bản.',
    qualityItems: [
      'Kiểm tra phạm vi dữ liệu và vùng thiếu trước khi rời hiện trường',
      'Đối chiếu điểm khống chế / điểm kiểm tra theo yêu cầu dự án',
      'Với LiDAR: kiểm tra trajectory / POS, độ đầy đủ Point Cloud và điều kiện xử lý trước khi xuất',
      'Giữ nhất quán hệ tọa độ và kiểm tra trực quan các lớp trước khi bàn giao / publish'
    ],

    finalEyebrow: 'UAV · GCP · PROCESSING · WEB GIS',
    finalTitle: 'Trải nghiệm toàn bộ workflow 3D Mapping trong một project thực tế',
    finalBody:
      'Đăng ký Demo để mở dữ liệu mẫu và xem cách các lớp DOM, mô hình 3D và Point Cloud được tổ chức, quan sát và đo đạc trên nền tảng.',
    finalPrimary: 'Đăng ký xem Demo',
    finalSecondary: 'Xem Demo Showcase'
  },

  en: {
    languageLabel: 'Select language',

    eyebrow: 'RESOURCES · 3D MAPPING WORKFLOW',
    heroTitle1: 'From field survey to',
    heroTitle2: '3D Web GIS data',
    heroBody:
      'The 3D Mapping workflow connects field survey, control points, mission planning, UAV imagery or LiDAR capture, sensor-specific processing and standardized data publication for use in a Web GIS project.',
    heroNote:
      'The structure follows the Queen Farm dataset workflow: map review → control marks → control points → flight area → pre-flight checklist → flight mission → processing → results.',
    heroTags: ['UAV Mapping', 'GCP / GNSS', '3D Web GIS'],
    heroPrimary: 'Open 3D Demo',
    heroSecondary: 'Request Demo',
    fieldMediaLabel: 'FIELD OPERATIONS',
    fieldMediaCaption:
      'Review the site and define the required data coverage before starting the flight mission',
    flightMediaLabel: 'MISSION PLANNING',
    flightMediaCaption:
      'Set the flight area and verify the mission before collecting survey data',

    workflowEyebrow: '08-STAGE WORKFLOW',
    workflowTitle: 'One continuous pipeline from field operations to the Viewer',
    workflowBody:
      'Each stage addresses a part of data quality. When the workflow is structured correctly from the start, processed data can move into one project for visualization, measurement and access according to the configured scope.',
    workflowSteps: [
      {
        meta: '01 · SITE REVIEW',
        title: 'Map & field review',
        body:
          'Define the project boundary, terrain, obstacles, survey objectives and the spatial extent that must be captured.'
      },
      {
        meta: '02 · CONTROL MARK',
        title: 'Set control marks',
        body:
          'Place suitable reference marks to support positioning and accuracy checks throughout the survey workflow.'
      },
      {
        meta: '03 · GCP / CONTROL',
        title: 'Survey control points',
        body:
          'Measure GCP / check-point coordinates with appropriate GNSS equipment and connect captured data to the project coordinate system.'
      },
      {
        meta: '04 · FLIGHT PLAN',
        title: 'Configure the flight area',
        body:
          'Build the mission using the survey boundary, flight altitude, flight-line direction and image overlap required for the target outputs.'
      },
      {
        meta: '05 · PRE-FLIGHT',
        title: 'Run the pre-flight checklist',
        body:
          'Verify the UAV, sensor, batteries, GNSS, storage, control link, takeoff/landing zone and weather conditions.'
      },
      {
        meta: '06 · DATA CAPTURE',
        title: 'Execute the flight mission',
        body:
          'Run the mission and monitor aircraft status, coverage, captured data and field conditions throughout the operation.'
      },
      {
        meta: '07 · PROCESSING',
        title: 'Process & validate data',
        body:
          'Process data according to sensor type. For AlphaAir 6 / AA6D LiDAR, CoPre supports POS solve, Adjust & Refine and Generate point cloud; UAV imagery follows the appropriate alignment and reconstruction workflow.'
      },
      {
        meta: '08 · DELIVERY',
        title: 'Results & Web GIS',
        body:
          'Standardize orthophotos, 3D Mesh, Point Cloud and related layers for visualization, measurement and project-scoped access in the Viewer.'
      }
    ],

    fieldEyebrow: 'FIELD PREPARATION',
    fieldTitle: '3D data quality starts before the UAV leaves the ground',
    fieldBody:
      'A good mission is more than drawing a flight polygon. The target deliverables, survey extent, control strategy and operating conditions must be clear so captured data fits the downstream processing workflow.',
    fieldItems: [
      {
        title: 'Define the required deliverables',
        body:
          'Clarify whether the project needs orthophotos, a 3D model, Point Cloud data or a combination of outputs before selecting the capture strategy.'
      },
      {
        title: 'Organize survey control',
        body:
          'Distribute control marks across the project area and use a coordinate reference appropriate to the survey requirements.'
      },
      {
        title: 'Validate the mission before takeoff',
        body:
          'Review coverage, flight lines, operational safety, communication conditions and weather before execution.'
      }
    ],
    fieldNote:
      'Final accuracy depends on the sensor, flight configuration, site conditions, GNSS/GCP method and processing workflow; one fixed accuracy value should not be applied to every project.',

    processingEyebrow: 'DATA PROCESSING',
    processingTitle: 'Turn captured data into usable spatial layers',
    processingBody:
      'After field operations, data is validated and processed according to sensor type. For AlphaAir 6 / AA6D, CHCNAV separates LiDAR pre-processing in CoPre from downstream Point Cloud processing in CoProcess before project publication.',
    processingItems: [
      {
        title: 'Validate input data',
        body:
          'Review imagery, trajectory / POS, GNSS, control points, capture extent and data completeness before processing.'
      },
      {
        title: 'CoPre · LiDAR pre-processing',
        body:
          'The AlphaAir 6 datasheet lists POS solve → Adjust & Refine → Generate point cloud as the CoPre pre-processing sequence.'
      },
      {
        title: 'CoProcess · Point Cloud processing',
        body:
          'The datasheet lists Terrain, CAD and Earthwork modules for downstream Point Cloud processing according to project needs.'
      },
      {
        title: 'Standardize & validate before publish',
        body:
          'Move outputs into the correct project coordinate reference, review gaps / geometry issues and confirm layer suitability before publication.'
      }
    ],
    processingNote:
      'CoPre and CoProcess are software functions listed in the AlphaAir 6 Datasheet Rev. January 2026. They describe the CHCNAV LiDAR processing branch and do not replace UAV-image processing workflows used with other sensors.',
    processingCaption:
      '3D project view after processing and publication in the Viewer',

    outputEyebrow: 'OUTPUT DATA',
    outputTitle: 'One survey, multiple layers inside the same project',
    outputBody:
      'Each output supports a different inspection view while staying inside the same spatial context, allowing users to switch quickly between project layers.',
    outputItems: [
      {
        title: 'Orthophoto / DOM',
        body:
          'A top-down view for checking overall coverage, boundaries and positions across the survey area.'
      },
      {
        title: '3D Mesh',
        body:
          'A textured surface model for visually reviewing site shape, structures and spatial context.'
      },
      {
        title: 'Point Cloud',
        body:
          'Three-dimensional point data for detailed inspection of geometry, elevation and selected project locations.'
      },
      {
        title: 'Derived data & Web GIS layers',
        body:
          'Depending on the workflow, Point Cloud can continue through Terrain / CAD / Earthwork processing before standardized layers are published to the Web GIS project.'
      }
    ],
    outputCaption:
      'Project data organized into layers that can be viewed and measured directly',

    videoEyebrow: 'CASE STUDY · LONG PHÚ THERMAL POWER PLANT',
    videoTitle: 'See 3D Mapping data in a real project context',
    videoBody:
      'This video shows how 3D project data from the Long Phú Thermal Power Plant can be reviewed after capture and processing, connecting field operations with the final 3D data experience.',
    videoCaption:
      '3D Mapping video · Long Phú Thermal Power Plant',

    qualityEyebrow: 'QUALITY CONTROL',
    qualityTitle: 'The goal is not only a good-looking model — the data must be usable',
    qualityBody:
      'The workflow should produce data reliable enough for the intended survey and project-inspection task. Quality control therefore continues from field operations through publication.',
    qualityItems: [
      'Review survey coverage and missing areas before leaving the field',
      'Check control / check points according to project requirements',
      'For LiDAR: review trajectory / POS, Point Cloud completeness and processing conditions before export',
      'Keep the coordinate reference consistent and visually validate project layers before delivery / publication'
    ],

    finalEyebrow: 'UAV · GCP · PROCESSING · WEB GIS',
    finalTitle: 'Experience the full 3D Mapping workflow inside a real project',
    finalBody:
      'Request Demo access to open sample data and see how orthophotos, 3D models and Point Cloud layers are organized, viewed and measured on the platform.',
    finalPrimary: 'Request Demo',
    finalSecondary: 'View Demo Showcase'
  },

  zh: {
    languageLabel: '选择语言',

    eyebrow: '资源 · 三维建图流程',
    heroTitle1: '从现场测绘到',
    heroTitle2: '3D Web GIS 数据',
    heroBody:
      '3D Mapping 工作流程将现场测绘、控制点、任务规划、UAV 影像或 LiDAR 采集、按传感器分类的处理以及标准化成果发布连接起来，并最终用于 Web GIS 项目。',
    heroNote:
      '流程结构依据 Queen Farm 数据集：地图调查 → 控制标志 → 控制点 → 航区设置 → 飞行前检查 → 执行任务 → 数据处理 → 成果。',
    heroTags: ['无人机测绘', 'GCP / GNSS', '3D Web GIS'],
    heroPrimary: '打开 3D Demo',
    heroSecondary: '申请演示',
    fieldMediaLabel: '现场作业',
    fieldMediaCaption:
      '在执行飞行任务前调查现场并确定需要采集的数据范围',
    flightMediaLabel: '任务规划',
    flightMediaCaption:
      '设置航区并在数据采集前检查无人机任务',

    workflowEyebrow: '08 阶段工作流程',
    workflowTitle: '从现场作业到 Viewer 的连续数据流程',
    workflowBody:
      '每个阶段都解决数据质量中的一个关键环节。流程从一开始组织正确，处理后的数据就可以进入同一项目进行可视化、测量，并根据已配置的范围访问。',
    workflowSteps: [
      {
        meta: '01 · SITE REVIEW',
        title: '地图与现场调查',
        body:
          '确定项目边界、地形、障碍物、测绘目标以及需要采集的空间范围。'
      },
      {
        meta: '02 · CONTROL MARK',
        title: '布设控制标志',
        body:
          '在适合的位置设置参考标志，为整个测绘流程提供定位与精度检查依据。'
      },
      {
        meta: '03 · GCP / CONTROL',
        title: '测量控制点',
        body:
          '使用合适的 GNSS 设备测量 GCP / 检查点坐标，并将采集数据连接到项目坐标系统。'
      },
      {
        meta: '04 · FLIGHT PLAN',
        title: '设置航区',
        body:
          '根据测绘范围、飞行高度、航线方向以及目标成果所需的影像重叠率规划任务。'
      },
      {
        meta: '05 · PRE-FLIGHT',
        title: '飞行前检查',
        body:
          '检查无人机、传感器、电池、GNSS、存储、控制链路、起降区域以及天气条件。'
      },
      {
        meta: '06 · DATA CAPTURE',
        title: '执行飞行任务',
        body:
          '按照规划执行任务，并持续监控飞行器状态、覆盖范围、采集数据和现场情况。'
      },
      {
        meta: '07 · PROCESSING',
        title: '处理与验证数据',
        body:
          '根据传感器类型进行处理。对于 AlphaAir 6 / AA6D LiDAR，CoPre 支持 POS solve、Adjust & Refine 和 Generate point cloud；UAV 影像则继续采用适合的对齐与重建流程。'
      },
      {
        meta: '08 · DELIVERY',
        title: '成果与 Web GIS',
        body:
          '标准化正射影像、3D Mesh、点云及相关图层，用于 Viewer 中的可视化、测量以及项目范围内的访问。'
      }
    ],

    fieldEyebrow: '现场准备',
    fieldTitle: '三维数据质量从无人机起飞前就已经开始',
    fieldBody:
      '一个好的任务不仅仅是绘制飞行区域。需要在采集前明确目标成果、测绘范围、控制策略和作业条件，使采集数据适用于后续处理流程。',
    fieldItems: [
      {
        title: '明确需要交付的成果',
        body:
          '在选择采集方式前，明确项目需要正射影像、三维模型、点云还是多种成果组合。'
      },
      {
        title: '组织测绘控制',
        body:
          '在项目范围内合理分布控制标志，并采用满足项目要求的坐标参考系统。'
      },
      {
        title: '起飞前验证任务',
        body:
          '执行前检查覆盖范围、航线、作业安全、通信条件和天气。'
      }
    ],
    fieldNote:
      '最终精度取决于传感器、飞行配置、现场条件、GNSS/GCP 方法以及处理流程；不应把一个固定精度值应用于所有项目。',

    processingEyebrow: '数据处理',
    processingTitle: '将采集数据转换为可使用的空间图层',
    processingBody:
      '现场作业完成后，根据传感器类型检查和处理数据。对于 AlphaAir 6 / AA6D，CHCNAV 将 CoPre 的 LiDAR 预处理与 CoProcess 的点云后续处理分开，再进入项目发布阶段。',
    processingItems: [
      {
        title: '检查输入数据',
        body:
          '在开始处理前检查影像、trajectory / POS、GNSS、控制点、采集范围以及数据完整性。'
      },
      {
        title: 'CoPre · LiDAR 预处理',
        body:
          'AlphaAir 6 Datasheet 列出 POS solve → Adjust & Refine → Generate point cloud 作为 CoPre 预处理功能。'
      },
      {
        title: 'CoProcess · 点云处理',
        body:
          'Datasheet 列出 Terrain、CAD 和 Earthwork 模块，用于根据项目需求继续处理点云。'
      },
      {
        title: '标准化并在发布前检查',
        body:
          '将成果统一到正确的项目坐标参考，检查缺失区域 / 几何问题，并确认图层适合发布到 Web GIS。'
      }
    ],
    processingNote:
      'CoPre 与 CoProcess 为 AlphaAir 6 Datasheet Rev. January 2026 中列出的软件功能，仅描述 CHCNAV LiDAR 处理分支，不替代其他传感器所使用的 UAV 影像处理流程。',
    processingCaption:
      '数据处理并发布到 Viewer 后的三维项目视图',

    outputEyebrow: '成果数据',
    outputTitle: '一次测绘，在同一项目中形成多个数据图层',
    outputBody:
      '不同成果支持不同的检查视角，同时保持在同一空间背景中，用户可以快速切换项目图层。',
    outputItems: [
      {
        title: '正射影像 / DOM',
        body:
          '自上而下查看整体覆盖、边界和测区内各位置。'
      },
      {
        title: '3D Mesh',
        body:
          '带纹理的表面模型，用于直观查看现场形态、结构和空间背景。'
      },
      {
        title: '点云',
        body:
          '三维点数据，用于详细查看几何、高程以及需要重点检查的位置。'
      },
      {
        title: '衍生成果与 Web GIS 图层',
        body:
          '根据工作流程，点云可继续通过 Terrain / CAD / Earthwork 处理，再将标准化图层发布到 Web GIS 项目。'
      }
    ],
    outputCaption:
      '项目数据被组织为可直接查看和测量的图层',

    videoEyebrow: '案例 · LONG PHÚ 火力发电厂',
    videoTitle: '在真实项目中查看 3D Mapping 数据',
    videoBody:
      '视频展示 Long Phú 火力发电厂的三维项目数据在采集与处理完成后的查看方式，将现场作业与最终三维数据体验连接起来。',
    videoCaption:
      '3D Mapping 视频 · Long Phú 火力发电厂',

    qualityEyebrow: '质量控制',
    qualityTitle: '目标不仅是模型好看，更重要的是数据能够使用',
    qualityBody:
      '工作流程需要生成足以支持目标测绘和项目检查任务的数据，因此质量控制应从现场一直持续到数据发布。',
    qualityItems: [
      '离开现场前检查测区覆盖范围和缺失区域',
      '根据项目要求检查控制点 / 检查点',
      '对于 LiDAR：在导出前检查 trajectory / POS、点云完整性与处理条件',
      '保持坐标参考一致，并在交付 / 发布前直观检查项目图层'
    ],

    finalEyebrow: 'UAV · GCP · PROCESSING · WEB GIS',
    finalTitle: '在真实项目中体验完整的 3D Mapping 工作流程',
    finalBody:
      '申请 Demo 访问示例数据，并查看正射影像、三维模型和点云如何在平台中组织、查看和测量。',
    finalPrimary: '申请演示',
    finalSecondary: '查看 Demo Showcase'
  }
};



const LONG_PHU_VIDEO_URL =
  'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/videos/Video%203D%20Mapping%20nh%C3%A0%20m%C3%A1y%20nhi%E1%BB%87t%20%C4%91i%E1%BB%87n%20Long%20Ph%C3%BA%20v1.mp4';

const HEADER_COPY: Record<
  Language,
  { home: string; demo: string }
> = {
  vi: {
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo'
  },
  en: {
    home: 'Home',
    demo: 'Request Demo'
  },
  zh: {
    home: '首页',
    demo: '申请演示'
  }
};


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

/*
 * Hallmark
 * component: mapping-workflow-resource-page
 * genre: technical-editorial / field-manual
 * theme: saolatek-product-dna
 * visual-anchor: field-operations-and-project-data
 * density: medium
 *
 * layout:
 * - hero visual stack
 * - 8-stage process map
 * - field preparation visual
 * - processing chain
 * - output atlas
 * - project case study
 * - quality gate
 * - compact closing CTA
 *
 * business logic:
 * - preserve useDemoNavigation()
 * - preserve Long Phú video
 * - preserve VI / EN / ZH
 */

export const MappingWorkflowResourcePage: React.FC = () => {
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
  const headerCopy = HEADER_COPY[currentLang];
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
        .mwr-root {
          --mwr-bg: #050914;
          --mwr-bg-2: #07101c;
          --mwr-surface: #0b1523;

          --mwr-ink: #f8fafc;
          --mwr-muted: #94a3b8;
          --mwr-soft: #64748b;

          --mwr-border: rgba(255,255,255,.09);
          --mwr-border-strong: rgba(255,255,255,.16);

          --mwr-accent: #38bdf8;
          --mwr-accent-strong: #0ea5e9;
          --mwr-cta-ink: #03111d;

          --mwr-header: rgba(5,9,20,.88);
          --mwr-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .mwr-root.mwr-light {
          --mwr-bg: #f8fafc;
          --mwr-bg-2: #eef4f8;
          --mwr-surface: #ffffff;

          --mwr-ink: #0f172a;
          --mwr-muted: #526174;
          --mwr-soft: #64748b;

          --mwr-border: rgba(15,23,42,.11);
          --mwr-border-strong: rgba(15,23,42,.20);

          --mwr-accent: #0369a1;
          --mwr-accent-strong: #0284c7;
          --mwr-cta-ink: #ffffff;

          --mwr-header: rgba(248,250,252,.90);
          --mwr-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .mwr-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--mwr-bg);
          color: var(--mwr-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .mwr-header {
          background: var(--mwr-header);
        }

        .mwr-media {
          box-shadow: var(--mwr-shadow);
        }

        .mwr-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--mwr-bg),
            0 0 0 4px var(--mwr-accent);
        }

        .mwr-theme-toggle {
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

        .mwr-theme-toggle:focus-visible {
          outline: 2px solid var(--mwr-accent);
          outline-offset: 3px;
        }

        .mwr-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .mwr-theme-toggle__thumb {
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

        .mwr-theme-toggle.is-dark
        .mwr-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .mwr-theme-toggle__clouds,
        .mwr-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .mwr-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .mwr-theme-toggle.is-dark
        .mwr-theme-toggle__clouds {
          opacity: 0;
        }

        .mwr-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .mwr-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .mwr-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .mwr-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .mwr-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .mwr-theme-toggle.is-dark
        .mwr-theme-toggle__stars {
          opacity: 1;
        }

        .mwr-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            mwr-star-pulse
            2s infinite ease-in-out;
        }

        .mwr-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .mwr-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .mwr-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes mwr-star-pulse {
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
          .mwr-root *,
          .mwr-root *::before,
          .mwr-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`mwr-root ${
          isDarkMode ? '' : 'mwr-light'
        }`}
      >
        <header className="mwr-header sticky top-0 z-50 border-b border-[var(--mwr-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mwr-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
              aria-label={headerCopy.home}
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
                className={`mwr-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="mwr-theme-toggle__clouds">
                  <div className="mwr-theme-toggle__cloud mwr-theme-toggle__cloud-1" />
                  <div className="mwr-theme-toggle__cloud mwr-theme-toggle__cloud-2" />
                  <div className="mwr-theme-toggle__cloud mwr-theme-toggle__cloud-3" />
                </div>

                <div className="mwr-theme-toggle__stars">
                  <div className="mwr-theme-toggle__star mwr-theme-toggle__star-1" />
                  <div className="mwr-theme-toggle__star mwr-theme-toggle__star-2" />
                  <div className="mwr-theme-toggle__star mwr-theme-toggle__star-3" />
                </div>

                <div className="mwr-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="mwr-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--mwr-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--mwr-muted)] transition-colors hover:text-[var(--mwr-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {headerCopy.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="mwr-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--mwr-accent)] px-3.5 text-sm font-bold text-[var(--mwr-cta-ink)] transition-colors hover:bg-[var(--mwr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={headerCopy.demo}
              >
                <span className="hidden md:inline">
                  {isDemoLoading
                    ? themeCopy.demoLoading
                    : headerCopy.demo}
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
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 max-w-[13ch] text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[62px] xl:text-[68px]">
                    {c.heroTitle1}
                    <span className="block text-[var(--mwr-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--mwr-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="mwr-focus mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--mwr-accent)] px-6 text-sm font-bold text-[var(--mwr-cta-ink)] transition-colors hover:bg-[var(--mwr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                        {c.heroPrimary}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <figure className="min-w-0">
                    <div className="mwr-media overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black sm:rounded-2xl">
                      <img
                        src={surveyingFieldImage}
                        alt={c.fieldMediaCaption}
                        className="aspect-[16/9] w-full object-cover"
                        loading="eager"
                      />
                    </div>

                    <figcaption className="mt-3 text-center text-xs leading-5 text-[var(--mwr-muted)]">
                      {c.fieldMediaCaption}
                    </figcaption>
                  </figure>

                  <figure className="hidden min-w-0 md:block">
                    <div className="overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black">
                      <img
                        src={surveyingFlightPlanImage}
                        alt={c.flightMediaCaption}
                        className="aspect-[21/6] w-full object-cover"
                        loading="eager"
                      />
                    </div>
                  </figure>
                </div>
              </div>
            </div>
          </section>

          {/* PROCESS MAP */}
          <section
            id="workflow"
            className="scroll-mt-[88px] border-b border-[var(--mwr-border)] bg-[var(--mwr-bg-2)]"
          >
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1040px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                  {c.workflowEyebrow}
                </div>

                <h2 className="mt-4 max-w-[23ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.workflowTitle}
                </h2>

                <p className="mt-5 max-w-[800px] text-base leading-7 text-[var(--mwr-muted)]">
                  {c.workflowBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 border-y border-[var(--mwr-border)] md:grid-cols-2 xl:grid-cols-4">
                {c.workflowSteps.map((step, index) => {
                  const isMdRight =
                    index % 2 === 1;
                  const isXlRight =
                    index % 4 === 3;
                  const isXlLeft =
                    index % 4 === 0;

                  return (
                    <article
                      key={step.title}
                      className={`border-b border-[var(--mwr-border)] py-6 md:px-6 ${
                        isMdRight
                          ? 'md:border-r-0'
                          : 'md:border-r'
                      } xl:min-h-[190px] xl:border-b xl:border-r ${
                        isXlRight
                          ? 'xl:border-r-0 xl:pr-0'
                          : ''
                      } ${
                        isXlLeft
                          ? 'xl:pl-0'
                          : ''
                      }`}
                    >
                      <h3 className="max-w-[18ch] text-base font-semibold leading-6">
                        {step.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[var(--mwr-muted)]">
                        {step.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FIELD PREPARATION */}
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.60fr)_minmax(0,.40fr)] lg:items-center lg:gap-16">
                <figure className="min-w-0">
                  <div className="mwr-media overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black sm:rounded-2xl">
                    <img
                      src={surveyingFlightPlanImage}
                      alt={c.flightMediaCaption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--mwr-muted)]">
                    {c.flightMediaCaption}
                  </figcaption>
                </figure>

                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.fieldEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.fieldTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--mwr-muted)]">
                    {c.fieldBody}
                  </p>

                  <div className="mt-8">
                    {c.fieldItems.map((item) => (
                      <article
                        key={item.title}
                        className="border-t border-[var(--mwr-border)] py-5"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[var(--mwr-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>

                  <p className="mt-4 border-l-2 border-[var(--mwr-accent)] pl-4 text-xs leading-6 text-[var(--mwr-soft)]">
                    {c.fieldNote}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PROCESSING CHAIN */}
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.40fr)_minmax(0,.60fr)] lg:items-start lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.processingEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.processingTitle}
                  </h2>

                  <p className="mt-5 max-w-[600px] text-base leading-7 text-[var(--mwr-muted)]">
                    {c.processingBody}
                  </p>

                  <div className="mt-8 border-y border-[var(--mwr-border)]">
                    {c.processingItems.map((item) => (
                      <article
                        key={item.title}
                        className="border-b border-[var(--mwr-border)] py-5 last:border-b-0"
                      >
                        <h3 className="text-base font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[var(--mwr-muted)]">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>

                  <p className="mt-5 text-xs leading-6 text-[var(--mwr-soft)]">
                    {c.processingNote}
                  </p>
                </div>

                <figure className="min-w-0 lg:sticky lg:top-[96px]">
                  <div className="mwr-media overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black sm:rounded-2xl">
                    <img
                      src={viewerOverviewImage}
                      alt={c.processingCaption}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--mwr-muted)]">
                    {c.processingCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* OUTPUT ATLAS */}
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,.60fr)_minmax(300px,.40fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.outputEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.outputTitle}
                  </h2>
                </div>

                <p className="max-w-[620px] text-base leading-7 text-[var(--mwr-muted)] lg:justify-self-end">
                  {c.outputBody}
                </p>
              </div>

              <figure className="mt-10 min-w-0">
                <div className="mwr-media overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black sm:rounded-2xl">
                  <img
                    src={viewerOverviewImage}
                    alt={c.outputCaption}
                    className="aspect-[21/9] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--mwr-muted)]">
                  {c.outputCaption}
                </figcaption>
              </figure>

              <div className="mt-8 grid grid-cols-1 border-y border-[var(--mwr-border)] md:grid-cols-2 xl:grid-cols-4">
                {c.outputItems.map((item, index) => {
                  const isMdRight =
                    index % 2 === 1;
                  const isFirst =
                    index === 0;
                  const isLast =
                    index === c.outputItems.length - 1;

                  return (
                    <article
                      key={item.title}
                      className={`border-b border-[var(--mwr-border)] py-5 md:px-6 ${
                        isMdRight
                          ? 'md:border-r-0'
                          : 'md:border-r'
                      } xl:border-b-0 xl:border-r ${
                        isFirst
                          ? 'xl:pl-0'
                          : ''
                      } ${
                        isLast
                          ? 'xl:border-r-0 xl:pr-0'
                          : ''
                      }`}
                    >
                      <h3 className="text-base font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-[var(--mwr-muted)]">
                        {item.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CASE STUDY */}
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)] lg:items-start lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.videoEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[17ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.videoTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--mwr-muted)]">
                    {c.videoBody}
                  </p>
                </div>

                <figure className="min-w-0">
                  <div className="mwr-media overflow-hidden rounded-xl border border-[var(--mwr-border)] bg-black sm:rounded-2xl">
                    <video
                      src={LONG_PHU_VIDEO_URL}
                      poster={viewerOverviewImage}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full object-contain"
                    />
                  </div>

                  <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--mwr-muted)]">
                    {c.videoCaption}
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          {/* QUALITY GATE */}
          <section className="border-b border-[var(--mwr-border)] bg-[var(--mwr-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1080px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                  {c.qualityEyebrow}
                </div>

                <h2 className="mt-4 max-w-[23ch] text-[32px] font-semibold leading-[1.06] tracking-[-.04em] md:text-[42px] lg:text-[48px]">
                  {c.qualityTitle}
                </h2>

                <p className="mt-5 max-w-[760px] text-base leading-7 text-[var(--mwr-muted)]">
                  {c.qualityBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-x-12 border-t border-[var(--mwr-border)] md:grid-cols-2">
                {c.qualityItems.map((item) => (
                  <p
                    key={item}
                    className="border-b border-[var(--mwr-border)] py-5 text-sm leading-7 text-[var(--mwr-muted)]"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="bg-[var(--mwr-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--mwr-border)] py-9 lg:grid-cols-[minmax(0,.60fr)_minmax(320px,.40fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--mwr-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[21ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--mwr-muted)]">
                    {c.finalBody}
                  </p>

                  <button
                    type="button"
                    onClick={openDemo}
                    disabled={isDemoLoading}
                    className="mwr-focus mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--mwr-accent)] px-6 text-sm font-bold text-[var(--mwr-cta-ink)] transition-colors hover:bg-[var(--mwr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                        {c.finalPrimary}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--mwr-border)] bg-[var(--mwr-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--mwr-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SAOLATEK"
                className="h-7 w-auto"
              />

              <span>
                3D Mapping · UAV · GCP · Web GIS
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

export default MappingWorkflowResourcePage;