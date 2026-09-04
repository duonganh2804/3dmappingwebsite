/* Hallmark · component: help-support · genre: enterprise-gis · theme: modern-minimal
 * Goals:
 * - compact support center, not a generic AI dashboard
 * - real multilingual FAQ content
 * - fast search with Vietnamese diacritic normalization
 * - category navigation + result counts
 * - safe diagnostics + real support email action
 * - mobile-first responsive layout
 */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clipboard,
  ExternalLink,
  Globe2,
  HelpCircle,
  Layers3,
  LifeBuoy,
  Mail,
  Map,
  MonitorCog,
  MousePointer2,
  Ruler,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import { useAuthStore } from '../../store/useAuthStore';

type Language = 'vi' | 'en' | 'zh';

type FaqCategory =
  | 'all'
  | 'start'
  | 'project'
  | 'viewer'
  | 'data'
  | 'measure'
  | 'account'
  | 'troubleshoot';

type LocalizedText = Record<Language, string>;

type FaqItem = {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  title: LocalizedText;
  body: LocalizedText;
  keywords: string[];
  featured?: boolean;
};

const readLanguage = (): Language => {
  const saved = localStorage.getItem('lp_lang');
  return saved === 'vi' || saved === 'en' || saved === 'zh'
    ? saved
    : 'vi';
};

const UI = {
  vi: {
    title: 'Hỏi đáp & Trợ giúp',
    subtitle:
      'Tìm câu trả lời nhanh về dự án, Viewer 3D, dữ liệu, đo đạc và xử lý sự cố.',
    back: 'Quay lại Dashboard',
    search: 'Tìm “DOM”, “Point Cloud”, “đo diện tích”, “quyền truy cập”...',
    searchHint: 'Nhấn / để tìm nhanh',
    clearSearch: 'Xóa tìm kiếm',
    all: 'Tất cả',
    start: 'Bắt đầu',
    project: 'Dự án',
    viewer: 'Viewer 3D',
    data: 'Dữ liệu 3D',
    measure: 'Đo đạc',
    account: 'Tài khoản',
    troubleshoot: 'Xử lý lỗi',
    results: 'kết quả',
    featured: 'Nội dung nên xem',
    noResult: 'Không tìm thấy câu trả lời phù hợp',
    noResultDesc:
      'Thử từ khóa ngắn hơn hoặc chọn một nhóm nội dung ở bên trái.',
    resetFilters: 'Xóa bộ lọc',
    copied: 'Đã sao chép',
    copyAnswer: 'Sao chép câu trả lời',
    supportTitle: 'Cần hỗ trợ thêm?',
    supportDesc:
      'Gửi thông tin kỹ thuật an toàn kèm mô tả lỗi để hỗ trợ xử lý nhanh hơn.',
    emailSupport: 'Gửi email hỗ trợ',
    emailUnavailable: 'Chưa cấu hình email hỗ trợ',
    copyDiagnostics: 'Sao chép chẩn đoán',
    quickTitle: 'Truy cập nhanh',
    dashboard: 'Dashboard',
    settings: 'Cài đặt hệ thống',
    demo: 'Đăng ký Demo',
    systemTitle: 'Tình trạng phiên',
    version: 'Phiên bản',
    role: 'Vai trò',
    network: 'Kết nối',
    online: 'Online',
    offline: 'Offline',
    route: 'Route',
    issueHint:
      'Khi báo lỗi Viewer, nên kèm tên dự án, layer đang bật, ảnh màn hình và lỗi Console/Network liên quan.',
    faqCount: 'câu hỏi',
  },
  en: {
    title: 'Help & Support',
    subtitle:
      'Find quick answers about projects, the 3D Viewer, data, measurements and troubleshooting.',
    back: 'Back to Dashboard',
    search:
      'Search “DOM”, “Point Cloud”, “area measurement”, “access”...',
    searchHint: 'Press / to search',
    clearSearch: 'Clear search',
    all: 'All',
    start: 'Getting started',
    project: 'Projects',
    viewer: '3D Viewer',
    data: '3D data',
    measure: 'Measurements',
    account: 'Account',
    troubleshoot: 'Troubleshooting',
    results: 'results',
    featured: 'Recommended topics',
    noResult: 'No matching answer found',
    noResultDesc:
      'Try a shorter keyword or choose a topic category from the left.',
    resetFilters: 'Reset filters',
    copied: 'Copied',
    copyAnswer: 'Copy answer',
    supportTitle: 'Need more help?',
    supportDesc:
      'Send safe technical information with a short issue description for faster support.',
    emailSupport: 'Email support',
    emailUnavailable: 'Support email is not configured',
    copyDiagnostics: 'Copy diagnostics',
    quickTitle: 'Quick access',
    dashboard: 'Dashboard',
    settings: 'System settings',
    demo: 'Book Demo',
    systemTitle: 'Session status',
    version: 'Version',
    role: 'Role',
    network: 'Network',
    online: 'Online',
    offline: 'Offline',
    route: 'Route',
    issueHint:
      'For Viewer issues, include the project name, enabled layer, screenshot and relevant Console/Network error.',
    faqCount: 'questions',
  },
  zh: {
    title: '问答与帮助',
    subtitle:
      '快速查找项目、3D Viewer、数据、测量和故障排查相关答案。',
    back: '返回 Dashboard',
    search:
      '搜索“DOM”、“Point Cloud”、“面积测量”、“访问权限”...',
    searchHint: '按 / 快速搜索',
    clearSearch: '清除搜索',
    all: '全部',
    start: '开始使用',
    project: '项目',
    viewer: '3D Viewer',
    data: '3D 数据',
    measure: '测量',
    account: '账户',
    troubleshoot: '故障排查',
    results: '个结果',
    featured: '推荐内容',
    noResult: '没有找到匹配的答案',
    noResultDesc:
      '尝试更短的关键词，或从左侧选择一个内容分类。',
    resetFilters: '清除筛选',
    copied: '已复制',
    copyAnswer: '复制答案',
    supportTitle: '需要更多帮助？',
    supportDesc:
      '发送安全的技术信息和简短问题描述，可以更快获得支持。',
    emailSupport: '发送支持邮件',
    emailUnavailable: '尚未配置支持邮箱',
    copyDiagnostics: '复制诊断信息',
    quickTitle: '快速访问',
    dashboard: 'Dashboard',
    settings: '系统设置',
    demo: '预约 Demo',
    systemTitle: '会话状态',
    version: '版本',
    role: '角色',
    network: '网络',
    online: 'Online',
    offline: 'Offline',
    route: 'Route',
    issueHint:
      '报告 Viewer 问题时，请附上项目名称、已启用图层、截图以及相关 Console/Network 错误。',
    faqCount: '个问题',
  },
} as const;

const FAQS: FaqItem[] = [
  {
    id: 'start-open-project',
    category: 'start',
    featured: true,
    title: {
      vi: 'Làm thế nào để mở một dự án 3D?',
      en: 'How do I open a 3D project?',
      zh: '如何打开一个 3D 项目？',
    },
    body: {
      vi: 'Vào Dashboard, chọn dự án bạn có quyền truy cập rồi nhấn “Mở Bản đồ” hoặc tên dự án. Viewer sẽ khởi tạo Cesium, định vị khu vực dự án và tải các lớp dữ liệu khả dụng.',
      en: 'Open Dashboard, choose a project you can access, then select “Open Map” or the project name. The Viewer initializes Cesium, focuses the project area and loads the available data layers.',
      zh: '进入 Dashboard，选择您有权访问的项目，然后点击“打开地图”或项目名称。Viewer 会初始化 Cesium、定位项目区域并加载可用数据图层。',
    },
    keywords: ['open project', 'mở dự án', 'dashboard', 'viewer', 'bản đồ', '打开项目'],
  },
  {
    id: 'project-access',
    category: 'project',
    featured: true,
    title: {
      vi: 'Tại sao tôi không thấy một dự án?',
      en: 'Why can’t I see a project?',
      zh: '为什么我看不到某个项目？',
    },
    body: {
      vi: 'Kiểm tra tab “Được cấp quyền” và “Demo Showcase”. Dự án riêng tư chỉ hiển thị khi tài khoản là chủ sở hữu hoặc đã được phân quyền. Nếu vẫn không thấy, yêu cầu quản trị viên kiểm tra thành viên của dự án.',
      en: 'Check the “Assigned” and “Demo Showcase” tabs. Private projects are visible only to owners or assigned members. If the project is still missing, ask an administrator to verify project membership.',
      zh: '请检查“已授权”和“Demo Showcase”标签。私有项目仅对所有者或已授权成员可见。如果仍未显示，请让管理员检查项目成员权限。',
    },
    keywords: ['access', 'permission', 'quyền', 'private', 'assigned', 'member', '权限'],
  },
  {
    id: 'viewer-modes',
    category: 'viewer',
    featured: true,
    title: {
      vi: 'Toàn cảnh, Point Cloud, 3D Model và Ảnh DOM khác nhau thế nào?',
      en: 'What is the difference between Overview, Point Cloud, 3D Model and DOM?',
      zh: '总览、Point Cloud、3D Model 和 DOM 有什么区别？',
    },
    body: {
      vi: 'Toàn cảnh hiển thị 3D Model + DOM. Point Cloud chỉ hiển thị mây điểm và được lazy-load khi người dùng chọn. 3D Model chỉ hiển thị model, còn Ảnh DOM chỉ hiển thị ảnh trực giao.',
      en: 'Overview displays 3D Model + DOM. Point Cloud displays only the point cloud and is lazy-loaded when selected. 3D Model shows only the model, while DOM shows only the orthophoto.',
      zh: '总览显示 3D Model + DOM。Point Cloud 仅显示点云，并在用户选择时延迟加载。3D Model 仅显示模型，DOM 仅显示正射影像。',
    },
    keywords: ['overview', 'toàn cảnh', 'point cloud', 'model', 'dom', 'mode', '总览'],
  },
  {
    id: 'viewer-navigation',
    category: 'viewer',
    title: {
      vi: 'Dùng Focus, Bắc, Camera preset, Orbit và Zoom vùng khi nào?',
      en: 'When should I use Focus, North, camera presets, Orbit and Area Zoom?',
      zh: '什么时候使用 Focus、北向、Camera preset、Orbit 和区域缩放？',
    },
    body: {
      vi: 'Focus đưa camera về dữ liệu đang xem. Bắc đưa heading về hướng Bắc. Camera preset chuyển nhanh sang L/R/F/B/T/D. Orbit xoay quanh một tâm được chọn. Zoom vùng cho phép kéo hình chữ nhật để camera bay đến vùng cần xem.',
      en: 'Focus returns the camera to the active data. North resets heading to north. Camera presets switch quickly to L/R/F/B/T/D views. Orbit rotates around a selected center. Area Zoom lets you drag a rectangle and fly to that area.',
      zh: 'Focus 将相机返回当前数据。北向将 heading 重置为北。Camera preset 可快速切换 L/R/F/B/T/D 视角。Orbit 围绕选定中心旋转。区域缩放可拖拽矩形并飞到目标区域。',
    },
    keywords: ['focus', 'north', 'bắc', 'camera', 'orbit', 'zoom vùng', 'navigation', '区域缩放'],
  },
  {
    id: 'data-dom',
    category: 'data',
    featured: true,
    title: {
      vi: 'Ảnh DOM bị lệch, xoay sai hoặc sai khu vực thì kiểm tra gì?',
      en: 'What should I check if the DOM is shifted, rotated incorrectly or in the wrong area?',
      zh: 'DOM 偏移、旋转错误或位置错误时应检查什么？',
    },
    body: {
      vi: 'Kiểm tra domUrl, metadataUrl và bounds west/east/south/north trước. Sau đó kiểm tra calibration domLon, domLat, domScale và domHeading. Không nên sửa camera hoặc resolutionScale trước khi xác định metadata/calibration có đúng hay không.',
      en: 'Check domUrl, metadataUrl and west/east/south/north bounds first. Then verify domLon, domLat, domScale and domHeading calibration. Do not change camera or resolutionScale before confirming the metadata and calibration are correct.',
      zh: '先检查 domUrl、metadataUrl 和 west/east/south/north 边界，然后检查 domLon、domLat、domScale 和 domHeading 校准。在确认 metadata/calibration 正确之前，不要先修改 camera 或 resolutionScale。',
    },
    keywords: ['dom', 'metadata', 'bounds', 'domlon', 'domlat', 'domscale', 'domheading', 'orthophoto'],
  },
  {
    id: 'data-pointcloud',
    category: 'data',
    title: {
      vi: 'Point Cloud chưa xuất hiện ngay có phải lỗi không?',
      en: 'Is it an error if Point Cloud does not appear immediately?',
      zh: 'Point Cloud 没有立即出现是错误吗？',
    },
    body: {
      vi: 'Không nhất thiết. Point Cloud được lazy-load để giảm request và tải GPU. Khi người dùng chọn chế độ Point Cloud, Viewer mới bắt đầu tải tileset/LOD cần thiết. Nếu chờ lâu vẫn không xuất hiện, kiểm tra trạng thái layer và request tileset trong Network.',
      en: 'Not necessarily. Point Cloud is lazy-loaded to reduce requests and GPU load. The Viewer starts loading the required tileset/LOD when Point Cloud mode is selected. If it still does not appear after waiting, check the layer status and tileset requests in Network.',
      zh: '不一定。Point Cloud 使用延迟加载以减少请求和 GPU 负载。选择 Point Cloud 模式后 Viewer 才开始加载所需 tileset/LOD。如果等待后仍未显示，请检查图层状态和 Network 中的 tileset 请求。',
    },
    keywords: ['point cloud', 'lazy load', 'tileset', 'lod', 'gpu', 'network'],
  },
  {
    id: 'measure-tools',
    category: 'measure',
    title: {
      vi: 'Viewer hỗ trợ những công cụ đo nào?',
      en: 'Which measurement tools are available?',
      zh: 'Viewer 支持哪些测量工具？',
    },
    body: {
      vi: 'Viewer hỗ trợ điểm tọa độ, khoảng cách, chiều cao, diện tích, góc, đường tròn, mặt cầu, azimuth, thể tích ước tính, ghi chú 3D và trắc dọc. Sau khi hoàn tất, các điểm đo có thể được kéo để tinh chỉnh hình học.',
      en: 'The Viewer supports coordinate points, distance, height, area, angle, circle, sphere, azimuth, estimated volume, 3D notes and profile measurements. Completed measurement points can be dragged to refine the geometry.',
      zh: 'Viewer 支持坐标点、距离、高度、面积、角度、圆、球体、方位角、估算体积、3D 注释和纵断面测量。完成后可拖动测量点微调几何形状。',
    },
    keywords: ['measure', 'đo', 'distance', 'area', 'volume', 'azimuth', 'profile', '测量'],
  },
  {
    id: 'measure-profile',
    category: 'measure',
    title: {
      vi: 'Trắc dọc lấy cao độ từ đâu?',
      en: 'Where does profile elevation come from?',
      zh: '纵断面高程数据来自哪里？',
    },
    body: {
      vi: 'Viewer ưu tiên sample cao độ từ geometry trong Scene ở mức chi tiết cao. Nếu vị trí không có kết quả và terrain provider hỗ trợ availability, hệ thống thử terrain fallback. Điểm còn thiếu dùng cao độ control làm fallback.',
      en: 'The Viewer first samples elevation from Scene geometry at the highest available detail. If no result is available and the terrain provider supports availability, it tries terrain fallback. Remaining missing points use the control elevation as fallback.',
      zh: 'Viewer 优先从 Scene geometry 的最高可用细节级别采样高程。如果无结果且 terrain provider 支持 availability，则尝试 terrain fallback。仍缺失的点使用 control elevation 作为 fallback。',
    },
    keywords: ['profile', 'elevation', 'trắc dọc', 'terrain', 'sample', 'cao độ', '高程'],
  },
  {
    id: 'account-demo',
    category: 'account',
    title: {
      vi: 'Đăng nhập rồi nhưng vẫn không vào được dự án riêng tư?',
      en: 'Why can’t I open a private project after signing in?',
      zh: '登录后为什么仍无法打开私有项目？',
    },
    body: {
      vi: 'Đăng nhập và quyền Demo/dự án là hai khái niệm khác nhau. Tài khoản phải có quyền với dự án hoặc quyền Demo phù hợp. Kiểm tra Dashboard, thành viên dự án và trạng thái Demo Access.',
      en: 'Authentication and Demo/project access are separate. The account must have project permission or valid Demo access. Check Dashboard, project membership and Demo Access status.',
      zh: '登录认证与 Demo/项目访问权限是分开的。账户必须拥有项目权限或有效 Demo 权限。请检查 Dashboard、项目成员和 Demo Access 状态。',
    },
    keywords: ['login', 'demo', 'access', 'private', 'account', 'đăng nhập', '权限'],
  },
  {
    id: 'troubleshoot-layer',
    category: 'troubleshoot',
    featured: true,
    title: {
      vi: 'Layer báo lỗi tải thì nên làm gì trước?',
      en: 'What should I do first when a layer fails to load?',
      zh: '图层加载失败时首先应该做什么？',
    },
    body: {
      vi: 'Thử Retry của layer nếu có. Sau đó kiểm tra Network để xác định request nào lỗi và phân biệt lỗi URL/CORS/HTTP với lỗi calibration hoặc camera. Chỉ thay một nguyên nhân nghi ngờ tại một thời điểm để dễ kiểm chứng.',
      en: 'Use the layer Retry action if available. Then inspect Network to identify the failing request and distinguish URL/CORS/HTTP failures from calibration or camera issues. Change one suspected cause at a time so the result can be verified.',
      zh: '如果图层提供 Retry，请先重试。然后检查 Network 找出失败请求，并区分 URL/CORS/HTTP 错误与 calibration 或 camera 问题。每次只修改一个可疑因素，便于验证结果。',
    },
    keywords: ['error', 'lỗi tải', 'cors', 'network', 'retry', 'layer', 'http', '加载失败'],
  },
  {
    id: 'troubleshoot-mobile',
    category: 'troubleshoot',
    title: {
      vi: 'Viewer trên điện thoại mờ hoặc chậm thì xử lý thế nào?',
      en: 'What should I check if the Viewer is blurry or slow on mobile?',
      zh: '手机上的 Viewer 模糊或缓慢时应检查什么？',
    },
    body: {
      vi: 'Xác định vấn đề nằm ở toàn scene hay một layer cụ thể. Point Cloud có LOD riêng, DOM có giới hạn ảnh/canvas riêng, còn resolutionScale ảnh hưởng toàn Cesium scene. Chỉ tối ưu một bottleneck mỗi lần và luôn kiểm tra lại trên điện thoại thật.',
      en: 'First determine whether the problem affects the whole scene or one specific layer. Point Cloud has its own LOD, DOM has its own image/canvas limits, and resolutionScale affects the whole Cesium scene. Optimize one bottleneck at a time and validate on a physical phone.',
      zh: '先确认问题影响整个 scene 还是某个特定图层。Point Cloud 有独立 LOD，DOM 有独立图像/canvas 限制，而 resolutionScale 会影响整个 Cesium scene。每次只优化一个瓶颈，并在真实手机上验证。',
    },
    keywords: ['mobile', 'blur', 'mờ', 'performance', 'resolution', 'canvas', 'slow', '性能'],
  },
];

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const categoryIcon: Record<
  Exclude<FaqCategory, 'all'>,
  React.ReactNode
> = {
  start: <Sparkles size={14} />,
  project: <Map size={14} />,
  viewer: <MousePointer2 size={14} />,
  data: <Layers3 size={14} />,
  measure: <Ruler size={14} />,
  account: <UserRound size={14} />,
  troubleshoot: <Wrench size={14} />,
};

export const HelpSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [language, setLanguage] =
    useState<Language>(readLanguage);
  const [query, setQuery] = useState('');
  const [category, setCategory] =
    useState<FaqCategory>('all');
  const [openId, setOpenId] =
    useState<string | null>('start-open-project');
  const [copiedAnswerId, setCopiedAnswerId] =
    useState<string | null>(null);
  const [diagnosticsCopied, setDiagnosticsCopied] =
    useState(false);

  const searchRef =
    useRef<HTMLInputElement>(null);

  const t = UI[language];

  const supportEmail = String(
    import.meta.env.VITE_SUPPORT_EMAIL || '',
  ).trim();

  const appVersion = String(
    import.meta.env.VITE_APP_VERSION ||
      import.meta.env.VITE_APP_BUILD ||
      'dev',
  );

  useEffect(() => {
    const handleLanguageChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<string>;

      if (
        customEvent.detail === 'vi' ||
        customEvent.detail === 'en' ||
        customEvent.detail === 'zh'
      ) {
        setLanguage(customEvent.detail);
        return;
      }

      setLanguage(readLanguage());
    };

    window.addEventListener(
      'saolatek-language-change',
      handleLanguageChange,
    );

    return () => {
      window.removeEventListener(
        'saolatek-language-change',
        handleLanguageChange,
      );
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (
        event.key === '/' &&
        !isTyping
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (
        event.key === 'Escape' &&
        document.activeElement ===
          searchRef.current
      ) {
        setQuery('');
        searchRef.current?.blur();
      }
    };

    window.addEventListener(
      'keydown',
      handleShortcut,
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleShortcut,
      );
  }, []);

  const categories: Array<{
    key: FaqCategory;
    label: string;
  }> = [
    { key: 'all', label: t.all },
    { key: 'start', label: t.start },
    { key: 'project', label: t.project },
    { key: 'viewer', label: t.viewer },
    { key: 'data', label: t.data },
    { key: 'measure', label: t.measure },
    { key: 'account', label: t.account },
    {
      key: 'troubleshoot',
      label: t.troubleshoot,
    },
  ];

  const categoryCounts = useMemo(() => {
    const counts: Record<FaqCategory, number> = {
      all: FAQS.length,
      start: 0,
      project: 0,
      viewer: 0,
      data: 0,
      measure: 0,
      account: 0,
      troubleshoot: 0,
    };

    FAQS.forEach(item => {
      counts[item.category] += 1;
    });

    return counts;
  }, []);

  const filteredFaqs = useMemo(() => {
    const needle =
      normalizeSearch(query);

    return FAQS.filter(item => {
      if (
        category !== 'all' &&
        item.category !== category
      ) {
        return false;
      }

      if (!needle) return true;

      const searchable = normalizeSearch(
        [
          item.title[language],
          item.body[language],
          ...item.keywords,
        ].join(' '),
      );

      return searchable.includes(needle);
    });
  }, [category, language, query]);

  const featuredFaqs = useMemo(
    () =>
      FAQS.filter(item => item.featured).slice(
        0,
        4,
      ),
    [],
  );

  const diagnosticText = () =>
    [
      'Saolatek 3D GIS diagnostics',
      `timestamp=${new Date().toISOString()}`,
      `version=${appVersion}`,
      `route=${window.location.href}`,
      `browser=${navigator.userAgent}`,
      `viewport=${window.innerWidth}x${window.innerHeight}`,
      `devicePixelRatio=${
        window.devicePixelRatio || 1
      }`,
      `online=${String(navigator.onLine)}`,
      `language=${language}`,
      `role=${user?.role ?? 'anonymous'}`,
    ].join('\n');

  const copyText = async (
    value: string,
  ) => {
    try {
      await navigator.clipboard.writeText(
        value,
      );
      return true;
    } catch {
      try {
        const textarea =
          document.createElement(
            'textarea',
          );

        textarea.value = value;
        textarea.style.position =
          'fixed';
        textarea.style.opacity = '0';

        document.body.appendChild(
          textarea,
        );
        textarea.select();

        const copied =
          document.execCommand('copy');

        textarea.remove();
        return copied;
      } catch {
        return false;
      }
    }
  };

  const copyAnswer = async (
    item: FaqItem,
  ) => {
    const copied = await copyText(
      `${item.title[language]}\n\n${item.body[language]}`,
    );

    if (!copied) return;

    setCopiedAnswerId(item.id);

    window.setTimeout(() => {
      setCopiedAnswerId(current =>
        current === item.id
          ? null
          : current,
      );
    }, 1600);
  };

  const copyDiagnostics = async () => {
    const copied = await copyText(
      diagnosticText(),
    );

    if (!copied) return;

    setDiagnosticsCopied(true);

    window.setTimeout(
      () => setDiagnosticsCopied(false),
      1600,
    );
  };

  const openSupportMail = () => {
    if (!supportEmail) return;

    const subject = encodeURIComponent(
      'Saolatek 3D GIS Support',
    );

    const issueLabel =
      language === 'vi'
        ? 'Mô tả vấn đề'
        : language === 'zh'
          ? '问题描述'
          : 'Issue description';

    const body = encodeURIComponent(
      `${diagnosticText()}\n\n${issueLabel}:\n`,
    );

    window.location.href =
      `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  const showFaq = (
    id: string,
  ) => {
    const item =
      FAQS.find(faq => faq.id === id);

    if (!item) return;

    setQuery('');
    setCategory(item.category);
    setOpenId(id);

    window.requestAnimationFrame(() => {
      document
        .getElementById(`faq-${id}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    });
  };

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setOpenId(
      'start-open-project',
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() =>
                navigate('/dashboard')
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title={t.back}
            >
              <ArrowLeft size={17} />
            </button>

            <img
              src={logoImg}
              alt="Saolatek"
              className="hidden h-7 w-auto object-contain sm:block"
            />

            <div className="hidden h-5 w-px bg-slate-200 sm:block" />

            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-950">
                {t.title}
              </div>
              <div className="hidden truncate text-[10px] text-slate-500 md:block">
                {t.subtitle}
              </div>
            </div>
          </div>

          <div className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-bold text-slate-500">
            <LifeBuoy size={13} />
            {FAQS.length} {t.faqCount}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-3 sm:p-5">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                <CircleHelp size={13} />
                Help Center
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {t.title}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                {t.subtitle}
              </p>
            </div>

            <div>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={event =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder={t.search}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 text-xs text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                />

                {query && (
                  <button
                    onClick={() =>
                      setQuery('')
                    }
                    title={t.clearSearch}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="mt-1.5 hidden text-right text-[9px] font-medium text-slate-400 sm:block">
                {t.searchHint}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-18">
              <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
                {categories.map(item => {
                  const active =
                    category === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() =>
                        setCategory(item.key)
                      }
                      className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors lg:w-full ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.key === 'all' ? (
                        <BookOpenCheck
                          size={14}
                        />
                      ) : (
                        categoryIcon[item.key]
                      )}

                      <span>
                        {item.label}
                      </span>

                      <span
                        className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[9px] ${
                          active
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {
                          categoryCounts[
                            item.key
                          ]
                        }
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-3 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {t.quickTitle}
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    onClick={() =>
                      navigate('/dashboard')
                    }
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Map size={13} />
                    {t.dashboard}
                  </button>

                  <button
                    onClick={() =>
                      navigate('/settings')
                    }
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings size={13} />
                    {t.settings}
                  </button>

                  <button
                    onClick={() =>
                      navigate('/book-demo')
                    }
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Sparkles size={13} />
                    {t.demo}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            {!query &&
              category === 'all' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {t.featured}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {featuredFaqs.map(
                      item => (
                        <button
                          key={item.id}
                          onClick={() =>
                            showFaq(
                              item.id,
                            )
                          }
                          className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            {
                              categoryIcon[
                                item.category
                              ]
                            }
                          </span>

                          <span className="min-w-0 flex-1 text-[11px] font-bold leading-4 text-slate-800">
                            {
                              item.title[
                                language
                              ]
                            }
                          </span>

                          <ExternalLink
                            size={12}
                            className="shrink-0 text-slate-300"
                          />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {
                      categories.find(
                        item =>
                          item.key ===
                          category,
                      )?.label
                    }
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {
                      filteredFaqs.length
                    }{' '}
                    {t.results}
                  </div>
                </div>

                {(query ||
                  category !== 'all') && (
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    {t.resetFilters}
                  </button>
                )}
              </div>

              {filteredFaqs.length ===
              0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Search size={19} />
                  </div>

                  <div className="mt-3 text-sm font-bold text-slate-800">
                    {t.noResult}
                  </div>

                  <div className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">
                    {t.noResultDesc}
                  </div>

                  <button
                    onClick={
                      resetFilters
                    }
                    className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {t.resetFilters}
                  </button>
                </div>
              ) : (
                <div>
                  {filteredFaqs.map(
                    item => {
                      const open =
                        openId ===
                        item.id;

                      return (
                        <article
                          id={`faq-${item.id}`}
                          key={item.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <button
                            onClick={() =>
                              setOpenId(
                                open
                                  ? null
                                  : item.id,
                              )
                            }
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                open
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {
                                categoryIcon[
                                  item.category
                                ]
                              }
                            </span>

                            <span className="min-w-0 flex-1 text-xs font-bold leading-5 text-slate-900">
                              {
                                item.title[
                                  language
                                ]
                              }
                            </span>

                            <ChevronDown
                              size={15}
                              className={`shrink-0 text-slate-400 transition-transform ${
                                open
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>

                          {open && (
                            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:pl-16">
                              <p className="text-[11px] leading-6 text-slate-600">
                                {
                                  item.body[
                                    language
                                  ]
                                }
                              </p>

                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => {
                                    void copyAnswer(
                                      item,
                                    );
                                  }}
                                  className="flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                                >
                                  {copiedAnswerId ===
                                  item.id ? (
                                    <>
                                      <Check
                                        size={
                                          12
                                        }
                                      />
                                      {
                                        t.copied
                                      }
                                    </>
                                  ) : (
                                    <>
                                      <Clipboard
                                        size={
                                          12
                                        }
                                      />
                                      {
                                        t.copyAnswer
                                      }
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <LifeBuoy size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900">
                      {t.supportTitle}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      {t.supportDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => {
                      void copyDiagnostics();
                    }}
                    className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {diagnosticsCopied ? (
                      <CheckCircle2
                        size={13}
                      />
                    ) : (
                      <Clipboard
                        size={13}
                      />
                    )}
                    {diagnosticsCopied
                      ? t.copied
                      : t.copyDiagnostics}
                  </button>

                  <button
                    onClick={
                      openSupportMail
                    }
                    disabled={
                      !supportEmail
                    }
                    className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-bold ${
                      supportEmail
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Mail size={13} />
                    {supportEmail
                      ? t.emailSupport
                      : t.emailUnavailable}
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <p className="text-[10px] leading-5 text-amber-800">
                    {t.issueHint}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <MonitorCog
                    size={15}
                    className="text-slate-500"
                  />
                  {t.systemTitle}
                </div>

                <dl className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] text-slate-400">
                      {t.version}
                    </dt>
                    <dd className="truncate font-mono text-[10px] font-bold text-slate-700">
                      {appVersion}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] text-slate-400">
                      {t.role}
                    </dt>
                    <dd className="truncate font-mono text-[10px] font-bold text-slate-700">
                      {user?.role ??
                        'anonymous'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] text-slate-400">
                      {t.network}
                    </dt>
                    <dd
                      className={`flex items-center gap-1.5 font-mono text-[10px] font-bold ${
                        navigator.onLine
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {navigator.onLine ? (
                        <Wifi
                          size={11}
                        />
                      ) : (
                        <WifiOff
                          size={11}
                        />
                      )}
                      {navigator.onLine
                        ? t.online
                        : t.offline}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] text-slate-400">
                      {t.route}
                    </dt>
                    <dd className="max-w-36 truncate font-mono text-[10px] font-bold text-slate-700">
                      {
                        window.location
                          .hash
                      }
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-2.5">
                  <ShieldCheck
                    size={13}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <p className="text-[9px] leading-4 text-emerald-800">
                    Diagnostics không chứa access token hoặc mật khẩu.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              <button
                onClick={() =>
                  navigate('/dashboard')
                }
                className="flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700"
              >
                <Map size={13} />
                {t.dashboard}
              </button>

              <button
                onClick={() =>
                  navigate('/settings')
                }
                className="flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700"
              >
                <Settings size={13} />
                {t.settings}
              </button>

              <button
                onClick={() =>
                  navigate('/book-demo')
                }
                className="flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700"
              >
                <Sparkles size={13} />
                {t.demo}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HelpSupportPage;
