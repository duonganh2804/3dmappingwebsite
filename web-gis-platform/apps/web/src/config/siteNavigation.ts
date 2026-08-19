import type { Language } from '../hooks/useLanguage';

export type SiteNavGroupKey =
  | 'platform'
  | 'solutions'
  | 'resources'
  | 'connect';

export type SiteNavItem = {
  label: Record<Language, string>;
  route?: string;
  action?: 'demo' | 'account';
};

export const SITE_NAV_LABELS: Record<
  Language,
  Record<SiteNavGroupKey, string>
> = {
  vi: {
    platform: 'Nền tảng',
    solutions: 'Giải pháp',
    resources: 'Tài nguyên',
    connect: 'Kết nối',
  },
  en: {
    platform: 'Platform',
    solutions: 'Solutions',
    resources: 'Resources',
    connect: 'Connect',
  },
  zh: {
    platform: '平台',
    solutions: '解决方案',
    resources: '资源',
    connect: '联系',
  },
};

export const SITE_ACTION_COPY: Record<
  Language,
  {
    login: string;
    dashboard: string;
    demo: string;
    openNavigation: string;
    closeNavigation: string;
    selectLanguage: string;
    switchToLight: string;
    switchToDark: string;
  }
> = {
  vi: {
    login: 'Đăng nhập',
    dashboard: 'Bảng điều khiển',
    demo: 'Đăng ký demo',
    openNavigation: 'Mở menu điều hướng',
    closeNavigation: 'Đóng menu điều hướng',
    selectLanguage: 'Chọn ngôn ngữ',
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
  },
  en: {
    login: 'Log in',
    dashboard: 'Dashboard',
    demo: 'Book a demo',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    selectLanguage: 'Select language',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
  },
  zh: {
    login: '登录',
    dashboard: '控制台',
    demo: '申请演示',
    openNavigation: '打开导航菜单',
    closeNavigation: '关闭导航菜单',
    selectLanguage: '选择语言',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
  },
};

const label = (
  vi: string,
  en: string,
  zh: string
): Record<Language, string> => ({
  vi,
  en,
  zh,
});

export const SITE_NAVIGATION: Record<
  SiteNavGroupKey,
  SiteNavItem[]
> = {
  platform: [
    {
      label: label(
        'Trình xem 3D GIS',
        '3D GIS Viewer',
        '3D GIS Viewer'
      ),
      route: '/platform/3d-gis',
    },
    {
      label: label(
        'Point Cloud & LiDAR',
        'Point Cloud & LiDAR',
        'Point Cloud & LiDAR'
      ),
      route: '/platform/point-cloud-lidar',
    },
    {
      label: label(
        'Đo đạc & Phân tích 3D',
        '3D Measurement & Analysis',
        '三维测量与分析'
      ),
      route: '/platform/measurement-analysis',
    },
    {
      label: label(
        'Quản lý lớp dữ liệu',
        'Data Layer Management',
        '数据图层管理'
      ),
      route: '/platform/data-layer-management',
    },
    {
      label: label(
        'VN-2000 & Hệ tọa độ',
        'VN-2000 & Coordinate Systems',
        'VN-2000 与坐标系统'
      ),
      route: '/platform/vn2000-coordinate-systems',
    },
    {
      label: label(
        'Chia sẻ & Quản lý dự án',
        'Project Sharing & Management',
        '项目共享与管理'
      ),
      route: '/platform/project-sharing-management',
    },
  ],

  solutions: [
    {
      label: label(
        'Khảo sát & Đo đạc',
        'Surveying & Measurement',
        '测绘与测量'
      ),
      route: '/solutions/surveying',
    },
    {
      label: label(
        'Xây dựng & Hạ tầng',
        'Construction & Infrastructure',
        '建筑与基础设施'
      ),
      route: '/solutions/construction-infrastructure',
    },
    {
      label: label(
        'Nông nghiệp',
        'Agriculture',
        '农业'
      ),
      route: '/solutions/agriculture',
    },
    {
      label: label(
        'UAV Mapping & LiDAR',
        'UAV Mapping & LiDAR',
        'UAV Mapping & LiDAR'
      ),
      route: '/solutions/uav-mapping-lidar',
    },
  ],

  resources: [
    {
      label: label(
        'Quy trình 3D Mapping',
        '3D Mapping Workflow',
        '3D Mapping 工作流程'
      ),
      route: '/resources/3d-mapping-workflow',
    },
    {
      label: label(
        'Thiết bị & Thông số kỹ thuật',
        'Equipment & Technical Specifications',
        '设备与技术规格'
      ),
      route: '/resources/equipment-specifications',
    },
    {
      label: label(
        'Dữ liệu đầu ra 3D',
        '3D Data Outputs',
        '三维数据成果'
      ),
      route: '/resources/3d-output-data',
    },
    {
      label: label(
        'Bản đồ Demo',
        'Demo Maps',
        'Demo Maps'
      ),
      route: '/resources/demo-maps',
    },
    {
      label: label(
        'Tài liệu hướng dẫn',
        'User Guides',
        '使用指南'
      ),
      route: '/resources/user-guides',
    },
  ],

  connect: [
    {
      label: label(
        'Đăng ký Demo',
        'Book a demo',
        '申请演示'
      ),
      action: 'demo',
    },
    {
      label: label(
        'Liên hệ tư vấn',
        'Contact an Advisor',
        '联系咨询'
      ),
      route: '/contact-consultation',
    },
  ],
};

export const SITE_NAV_GROUPS: SiteNavGroupKey[] = [
  'platform',
  'solutions',
  'resources',
  'connect',
];