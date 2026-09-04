/* Hallmark · component: system-settings · genre: enterprise-gis · theme: modern-minimal
 * Goal: compact, functional, production settings with real Dashboard integration.
 * No fake Viewer tuning, no raw localStorage table, no oversized diagnostics console.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Clipboard,
  Database,
  Download,
  Globe2,
  LayoutGrid,
  List,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  Save,
  Settings,
  SlidersHorizontal,
  SortAsc,
  Upload,
  User,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import { useAuthStore } from '../../store/useAuthStore';

type Language = 'vi' | 'en' | 'zh';
type ViewMode = 'grid' | 'list';
type SortMode = 'lastCaptured' | 'name';
type DefaultTab = 'auto' | 'assigned' | 'public';
type AutoRefreshSeconds = 30 | 60 | 120 | 300;
type Section = 'general' | 'dashboard' | 'notifications' | 'account' | 'advanced';

type Preferences = {
  language: Language;
  viewMode: ViewMode;
  sortBy: SortMode;
  defaultTab: DefaultTab;
  rememberLastTab: boolean;
  confirmDelete: boolean;
  showThumbnails: boolean;
  autoRefresh: boolean;
  autoRefreshSeconds: AutoRefreshSeconds;
  reducedMotion: boolean;
  browserNotifications: boolean;
  notifyProcessingComplete: boolean;
};

const STORAGE_KEYS = {
  language: 'lp_lang',
  languageMirror: 'saolatek_language',
  viewMode: 'dashboard_view_mode',
  sortBy: 'dashboard_sort_by',
  defaultTab: 'dashboard_default_tab',
  lastTab: 'dashboard_last_tab',
  rememberLastTab: 'dashboard_remember_last_tab',
  confirmDelete: 'dashboard_confirm_delete',
  showThumbnails: 'dashboard_show_thumbnails',
  autoRefresh: 'dashboard_auto_refresh',
  autoRefreshSeconds: 'dashboard_auto_refresh_seconds',
  reducedMotion: 'saolatek_reduced_motion',
  browserNotifications: 'saolatek_browser_notifications',
  notifyProcessingComplete: 'saolatek_notify_processing_complete',
} as const;

const DEFAULTS: Preferences = {
  language: 'vi',
  viewMode: 'grid',
  sortBy: 'lastCaptured',
  defaultTab: 'auto',
  rememberLastTab: true,
  confirmDelete: true,
  showThumbnails: true,
  autoRefresh: false,
  autoRefreshSeconds: 60,
  reducedMotion: false,
  browserNotifications: false,
  notifyProcessingComplete: true,
};

const getBoolean = (key: string, fallback: boolean) => {
  const value = localStorage.getItem(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const readPreferences = (): Preferences => {
  const language = localStorage.getItem(STORAGE_KEYS.language);
  const viewMode = localStorage.getItem(STORAGE_KEYS.viewMode);
  const sortBy = localStorage.getItem(STORAGE_KEYS.sortBy);
  const defaultTab = localStorage.getItem(STORAGE_KEYS.defaultTab);
  const refreshSeconds = Number(
    localStorage.getItem(STORAGE_KEYS.autoRefreshSeconds),
  );

  return {
    language:
      language === 'vi' || language === 'en' || language === 'zh'
        ? language
        : DEFAULTS.language,
    viewMode:
      viewMode === 'grid' || viewMode === 'list'
        ? viewMode
        : DEFAULTS.viewMode,
    sortBy:
      sortBy === 'lastCaptured' || sortBy === 'name'
        ? sortBy
        : DEFAULTS.sortBy,
    defaultTab:
      defaultTab === 'assigned' ||
      defaultTab === 'public' ||
      defaultTab === 'auto'
        ? defaultTab
        : DEFAULTS.defaultTab,
    rememberLastTab: getBoolean(
      STORAGE_KEYS.rememberLastTab,
      DEFAULTS.rememberLastTab,
    ),
    confirmDelete: getBoolean(
      STORAGE_KEYS.confirmDelete,
      DEFAULTS.confirmDelete,
    ),
    showThumbnails: getBoolean(
      STORAGE_KEYS.showThumbnails,
      DEFAULTS.showThumbnails,
    ),
    autoRefresh: getBoolean(
      STORAGE_KEYS.autoRefresh,
      DEFAULTS.autoRefresh,
    ),
    autoRefreshSeconds:
      refreshSeconds === 30 ||
      refreshSeconds === 60 ||
      refreshSeconds === 120 ||
      refreshSeconds === 300
        ? refreshSeconds
        : DEFAULTS.autoRefreshSeconds,
    reducedMotion: getBoolean(
      STORAGE_KEYS.reducedMotion,
      DEFAULTS.reducedMotion,
    ),
    browserNotifications: getBoolean(
      STORAGE_KEYS.browserNotifications,
      DEFAULTS.browserNotifications,
    ),
    notifyProcessingComplete: getBoolean(
      STORAGE_KEYS.notifyProcessingComplete,
      DEFAULTS.notifyProcessingComplete,
    ),
  };
};

const writePreferences = (preferences: Preferences) => {
  localStorage.setItem(STORAGE_KEYS.language, preferences.language);
  localStorage.setItem(STORAGE_KEYS.languageMirror, preferences.language);
  localStorage.setItem(STORAGE_KEYS.viewMode, preferences.viewMode);
  localStorage.setItem(STORAGE_KEYS.sortBy, preferences.sortBy);
  localStorage.setItem(STORAGE_KEYS.defaultTab, preferences.defaultTab);
  localStorage.setItem(
    STORAGE_KEYS.rememberLastTab,
    String(preferences.rememberLastTab),
  );
  localStorage.setItem(
    STORAGE_KEYS.confirmDelete,
    String(preferences.confirmDelete),
  );
  localStorage.setItem(
    STORAGE_KEYS.showThumbnails,
    String(preferences.showThumbnails),
  );
  localStorage.setItem(
    STORAGE_KEYS.autoRefresh,
    String(preferences.autoRefresh),
  );
  localStorage.setItem(
    STORAGE_KEYS.autoRefreshSeconds,
    String(preferences.autoRefreshSeconds),
  );
  localStorage.setItem(
    STORAGE_KEYS.reducedMotion,
    String(preferences.reducedMotion),
  );
  localStorage.setItem(
    STORAGE_KEYS.browserNotifications,
    String(preferences.browserNotifications),
  );
  localStorage.setItem(
    STORAGE_KEYS.notifyProcessingComplete,
    String(preferences.notifyProcessingComplete),
  );
};

const ensureMotionStyle = () => {
  const styleId = 'saolatek-runtime-preferences';

  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    html[data-saola-motion="reduced"] *,
    html[data-saola-motion="reduced"] *::before,
    html[data-saola-motion="reduced"] *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(style);
};

const applyPreferences = (preferences: Preferences) => {
  ensureMotionStyle();

  document.documentElement.dataset.saolaMotion =
    preferences.reducedMotion ? 'reduced' : 'normal';

  window.dispatchEvent(
    new CustomEvent('saolatek-language-change', {
      detail: preferences.language,
    }),
  );

  window.dispatchEvent(
    new CustomEvent('saolatek-dashboard-preferences-change', {
      detail: {
        viewMode: preferences.viewMode,
        sortBy: preferences.sortBy,
        defaultTab: preferences.defaultTab,
        rememberLastTab: preferences.rememberLastTab,
        confirmDelete: preferences.confirmDelete,
        showThumbnails: preferences.showThumbnails,
        autoRefresh: preferences.autoRefresh,
        autoRefreshSeconds: preferences.autoRefreshSeconds,
      },
    }),
  );
};

const TEXT = {
  vi: {
    title: 'Cài đặt hệ thống',
    subtitle: 'Tùy chỉnh giao diện, Dashboard, thông báo và tài khoản.',
    back: 'Quay lại Dashboard',
    save: 'Lưu thay đổi',
    saved: 'Đã lưu thay đổi',
    reset: 'Khôi phục mặc định',
    resetConfirm: 'Khôi phục các cài đặt về mặc định?',
    general: 'Chung',
    dashboard: 'Dashboard',
    notifications: 'Thông báo',
    account: 'Tài khoản',
    advanced: 'Nâng cao',
    generalTitle: 'Cài đặt chung',
    generalDesc: 'Các tùy chọn giao diện có hiệu lực trên thiết bị này.',
    language: 'Ngôn ngữ',
    reducedMotion: 'Giảm hiệu ứng chuyển động',
    reducedMotionDesc:
      'Giảm animation và transition trên thiết bị cấu hình thấp hoặc khi cần giao diện ổn định hơn.',
    dashboardTitle: 'Mặc định Dashboard',
    dashboardDesc:
      'Chỉ giữ các tùy chọn đang được Dashboard sử dụng thực tế.',
    viewMode: 'Kiểu hiển thị dự án',
    grid: 'Dạng lưới',
    list: 'Dạng danh sách',
    sort: 'Sắp xếp dự án',
    latest: 'Mới nhất',
    nameAZ: 'Tên dự án (A-Z)',
    defaultTab: 'Tab mặc định khi mở Dashboard',
    tabAuto: 'Tự động theo quyền',
    tabAssigned: 'Được cấp quyền',
    tabPublic: 'Demo Showcase',
    rememberLastTab: 'Ghi nhớ tab dùng gần nhất',
    rememberLastTabDesc:
      'Khi bật, Dashboard ưu tiên tab bạn đã dùng lần trước nếu tài khoản có quyền phù hợp.',
    confirmDelete: 'Xác nhận trước khi xóa dự án',
    confirmDeleteDesc:
      'Giữ bước xác nhận trước thao tác xóa dữ liệu.',
    showThumbnails: 'Hiển thị ảnh preview dự án',
    showThumbnailsDesc:
      'Tắt để giảm request ảnh DOM và tiết kiệm băng thông khi xem Dashboard.',
    autoRefresh: 'Tự động làm mới danh sách dự án',
    autoRefreshDesc:
      'Chỉ làm mới khi tab trình duyệt đang hiển thị.',
    refreshInterval: 'Chu kỳ làm mới',
    notificationTitle: 'Thông báo trình duyệt',
    notificationDesc:
      'Quản lý quyền Notification API của trình duyệt. Không tạo các nhóm thông báo giả nếu backend chưa phát sự kiện.',
    browserNotifications: 'Bật thông báo trình duyệt',
    permission: 'Quyền hiện tại',
    processingComplete: 'Báo khi xử lý dữ liệu hoàn tất',
    processingCompleteDesc:
      'Dùng Notification API thật khi pipeline dự án kết thúc.',
    test: 'Gửi thông báo thử',
    unsupported: 'Trình duyệt không hỗ trợ Notification API',
    denied: 'Bị chặn trong cài đặt trình duyệt',
    granted: 'Đã được cấp quyền',
    defaultPermission: 'Chưa yêu cầu quyền',
    accountTitle: 'Tài khoản hiện tại',
    accountDesc:
      'Hiển thị thông tin phiên đăng nhập mà không lộ access token.',
    fullName: 'Họ tên',
    email: 'Email',
    role: 'Vai trò',
    authStatus: 'Trạng thái',
    signedIn: 'Đã đăng nhập',
    signedOut: 'Chưa đăng nhập',
    logout: 'Đăng xuất',
    security: 'Bảo mật phiên',
    securityDesc:
      'Không hiển thị hoặc sao chép access token trong trang cài đặt.',
    advancedTitle: 'Sao lưu & chẩn đoán',
    advancedDesc:
      'Các công cụ bảo trì gọn, chỉ tác động preference trên trình duyệt.',
    export: 'Xuất cài đặt',
    import: 'Nhập cài đặt',
    clear: 'Xóa cài đặt cục bộ',
    clearConfirm: 'Xóa toàn bộ preference Saolatek trên trình duyệt này?',
    imported: 'Đã nhập cài đặt',
    invalidImport: 'File cài đặt không hợp lệ',
    exported: 'Đã xuất cài đặt',
    cleared: 'Đã xóa cài đặt cục bộ',
    diagnostics: 'Thông tin kỹ thuật',
    diagnosticsDesc: 'Thông tin an toàn để sao chép khi cần hỗ trợ kỹ thuật.',
    version: 'Phiên bản',
    viewport: 'Viewport',
    dpr: 'DPR',
    network: 'Mạng',
    online: 'Online',
    offline: 'Offline',
    notificationPermission: 'Notification',
    copyDiagnostics: 'Sao chép thông tin kỹ thuật',
    copied: 'Đã sao chép',
    noViewerTuning: 'Viewer 3D',
    noViewerTuningDesc:
      'Không đưa Quality, resolutionScale, Point Cloud LOD/SSE hoặc camera vào trang này để tránh thay đổi hiệu năng và hành vi Viewer ngoài ý muốn.',
    unsaved: 'Có thay đổi chưa lưu',
  },
  en: {
    title: 'System Settings',
    subtitle: 'Customize interface, Dashboard, notifications and account.',
    back: 'Back to Dashboard',
    save: 'Save changes',
    saved: 'Changes saved',
    reset: 'Restore defaults',
    resetConfirm: 'Restore settings to defaults?',
    general: 'General',
    dashboard: 'Dashboard',
    notifications: 'Notifications',
    account: 'Account',
    advanced: 'Advanced',
    generalTitle: 'General settings',
    generalDesc: 'Interface preferences applied on this device.',
    language: 'Language',
    reducedMotion: 'Reduce motion',
    reducedMotionDesc:
      'Reduce animation and transitions on lower-end devices or when a steadier interface is preferred.',
    dashboardTitle: 'Dashboard defaults',
    dashboardDesc: 'Only settings that are actually consumed by Dashboard.',
    viewMode: 'Project view',
    grid: 'Grid',
    list: 'List',
    sort: 'Project sorting',
    latest: 'Latest',
    nameAZ: 'Project name (A-Z)',
    defaultTab: 'Default Dashboard tab',
    tabAuto: 'Automatic by access',
    tabAssigned: 'Assigned',
    tabPublic: 'Demo Showcase',
    rememberLastTab: 'Remember last used tab',
    rememberLastTabDesc:
      'Dashboard prefers the last used tab when the account still has appropriate access.',
    confirmDelete: 'Confirm before deleting projects',
    confirmDeleteDesc:
      'Keep a confirmation step before destructive actions.',
    showThumbnails: 'Show project preview images',
    showThumbnailsDesc:
      'Disable to reduce DOM image requests and save bandwidth on Dashboard.',
    autoRefresh: 'Automatically refresh projects',
    autoRefreshDesc:
      'Refresh only while the browser tab is visible.',
    refreshInterval: 'Refresh interval',
    notificationTitle: 'Browser notifications',
    notificationDesc:
      'Manage browser Notification API permission. Event categories are not exposed until real app events consume them.',
    browserNotifications: 'Enable browser notifications',
    permission: 'Current permission',
    processingComplete: 'Notify when processing completes',
    processingCompleteDesc:
      'Uses the real Notification API when a project pipeline finishes.',
    test: 'Send test notification',
    unsupported: 'Notification API is unsupported',
    denied: 'Blocked in browser settings',
    granted: 'Permission granted',
    defaultPermission: 'Permission not requested',
    accountTitle: 'Current account',
    accountDesc: 'Session information without exposing the access token.',
    fullName: 'Full name',
    email: 'Email',
    role: 'Role',
    authStatus: 'Status',
    signedIn: 'Signed in',
    signedOut: 'Signed out',
    logout: 'Log out',
    security: 'Session security',
    securityDesc: 'Access tokens are never displayed or copied here.',
    advancedTitle: 'Backup & diagnostics',
    advancedDesc: 'Compact maintenance tools for browser preferences only.',
    export: 'Export settings',
    import: 'Import settings',
    clear: 'Clear local settings',
    clearConfirm: 'Clear all Saolatek preferences in this browser?',
    imported: 'Settings imported',
    invalidImport: 'Invalid settings file',
    exported: 'Settings exported',
    cleared: 'Local settings cleared',
    diagnostics: 'Technical information',
    diagnosticsDesc: 'Safe technical information to copy when support is needed.',
    version: 'Version',
    viewport: 'Viewport',
    dpr: 'DPR',
    network: 'Network',
    online: 'Online',
    offline: 'Offline',
    notificationPermission: 'Notification',
    copyDiagnostics: 'Copy technical information',
    copied: 'Copied',
    noViewerTuning: '3D Viewer',
    noViewerTuningDesc:
      'Quality, resolutionScale, Point Cloud LOD/SSE and camera controls are intentionally excluded to avoid unintended Viewer behavior changes.',
    unsaved: 'Unsaved changes',
  },
  zh: {
    title: '系统设置',
    subtitle: '自定义界面、Dashboard、通知和账户。',
    back: '返回 Dashboard',
    save: '保存更改',
    saved: '已保存更改',
    reset: '恢复默认',
    resetConfirm: '恢复为默认设置？',
    general: '常规',
    dashboard: 'Dashboard',
    notifications: '通知',
    account: '账户',
    advanced: '高级',
    generalTitle: '常规设置',
    generalDesc: '应用于当前设备的界面偏好。',
    language: '语言',
    reducedMotion: '减少动态效果',
    reducedMotionDesc: '减少动画和过渡效果，提高低配置设备上的稳定性。',
    dashboardTitle: 'Dashboard 默认设置',
    dashboardDesc: '只保留 Dashboard 实际使用的选项。',
    viewMode: '项目视图',
    grid: '网格',
    list: '列表',
    sort: '项目排序',
    latest: '最新',
    nameAZ: '项目名称 (A-Z)',
    defaultTab: 'Dashboard 默认标签',
    tabAuto: '按权限自动选择',
    tabAssigned: '已授权',
    tabPublic: 'Demo Showcase',
    rememberLastTab: '记住上次使用的标签',
    rememberLastTabDesc:
      '当账户仍有相应权限时，Dashboard 优先恢复上次使用的标签。',
    confirmDelete: '删除项目前确认',
    confirmDeleteDesc:
      '对破坏性操作保留确认步骤。',
    showThumbnails: '显示项目预览图',
    showThumbnailsDesc:
      '关闭后可减少 DOM 图片请求并节省 Dashboard 带宽。',
    autoRefresh: '自动刷新项目列表',
    autoRefreshDesc:
      '仅在浏览器标签可见时刷新。',
    refreshInterval: '刷新间隔',
    notificationTitle: '浏览器通知',
    notificationDesc:
      '管理浏览器 Notification API 权限。在真实事件接入前不显示虚假的通知分类。',
    browserNotifications: '启用浏览器通知',
    permission: '当前权限',
    processingComplete: '处理完成时通知',
    processingCompleteDesc:
      '项目处理流水线结束时使用真实 Notification API。',
    test: '发送测试通知',
    unsupported: '浏览器不支持 Notification API',
    denied: '已在浏览器设置中阻止',
    granted: '已授予权限',
    defaultPermission: '尚未请求权限',
    accountTitle: '当前账户',
    accountDesc: '显示会话信息，但不会暴露 access token。',
    fullName: '姓名',
    email: '邮箱',
    role: '角色',
    authStatus: '状态',
    signedIn: '已登录',
    signedOut: '未登录',
    logout: '退出登录',
    security: '会话安全',
    securityDesc: '本页不会显示或复制 access token。',
    advancedTitle: '备份与诊断',
    advancedDesc: '仅针对浏览器偏好的紧凑维护工具。',
    export: '导出设置',
    import: '导入设置',
    clear: '清除本地设置',
    clearConfirm: '清除此浏览器中的所有 Saolatek 偏好吗？',
    imported: '设置已导入',
    invalidImport: '设置文件无效',
    exported: '设置已导出',
    cleared: '本地设置已清除',
    diagnostics: '技术信息',
    diagnosticsDesc: '需要技术支持时可安全复制的信息。',
    version: '版本',
    viewport: 'Viewport',
    dpr: 'DPR',
    network: '网络',
    online: '在线',
    offline: '离线',
    notificationPermission: 'Notification',
    copyDiagnostics: '复制技术信息',
    copied: '已复制',
    noViewerTuning: '3D Viewer',
    noViewerTuningDesc:
      'Quality、resolutionScale、Point Cloud LOD/SSE 和 camera 不放入系统设置，以避免意外改变 Viewer 行为。',
    unsaved: '有未保存的更改',
  },
} as const;

const Toggle: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    disabled={disabled}
    onClick={() => onChange(!value)}
    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
      value ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200'
    } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
        value ? 'translate-x-[22px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

const RadioRow: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}> = ({ active, icon, title, subtitle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-16 w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${
      active
        ? 'border-blue-500 bg-blue-50/60'
        : 'border-slate-200 bg-white hover:bg-slate-50'
    }`}
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
        active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs font-bold text-slate-900">{title}</span>
      {subtitle && (
        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
          {subtitle}
        </span>
      )}
    </span>
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
      }`}
    >
      {active && <Check size={11} strokeWidth={3} />}
    </span>
  </button>
);

const SettingRow: React.FC<{
  title: string;
  description?: string;
  control: React.ReactNode;
}> = ({ title, description, control }) => (
  <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-4 last:border-b-0">
    <div className="min-w-0">
      <div className="text-xs font-bold text-slate-900">{title}</div>
      {description && (
        <div className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-500">
          {description}
        </div>
      )}
    </div>
    <div className="shrink-0">{control}</div>
  </div>
);

const PageSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
      </div>
    </div>
    <div className="px-4 py-4 sm:px-5">{children}</div>
  </div>
);

export const SystemSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const initial = useMemo(() => readPreferences(), []);
  const [draft, setDraft] = useState<Preferences>(initial);
  const [saved, setSaved] = useState<Preferences>(initial);
  const [section, setSection] = useState<Section>('general');
  const [toast, setToast] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const importRef = useRef<HTMLInputElement>(null);

  const t = TEXT[draft.language];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const appVersion = String(
    import.meta.env.VITE_APP_VERSION ||
      import.meta.env.VITE_APP_BUILD ||
      'dev',
  );

  useEffect(() => {
    applyPreferences(saved);
  }, [saved]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const update = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const save = () => {
    writePreferences(draft);
    applyPreferences(draft);
    setSaved(draft);
    showToast(t.saved);
  };

  const toggleBrowserNotifications = async (next: boolean) => {
    if (!next) {
      update('browserNotifications', false);
      return;
    }

    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    setNotificationPermission(permission);
    update('browserNotifications', permission === 'granted');
  };

  const testNotification = () => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    new Notification('Saolatek 3D GIS', {
      body:
        draft.language === 'vi'
          ? 'Thông báo trình duyệt đang hoạt động.'
          : draft.language === 'zh'
            ? '浏览器通知工作正常。'
            : 'Browser notifications are working.',
    });
  };

  const exportSettings = () => {
    const payload = {
      schema: 'saolatek-settings-v4',
      exportedAt: new Date().toISOString(),
      preferences: draft,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `saolatek-settings-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast(t.exported);
  };

  const importSettings = async (file: File) => {
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw) as {
        schema?: string;
        preferences?: Partial<Preferences>;
      };

      if (payload.schema !== 'saolatek-settings-v4' || !payload.preferences) {
        throw new Error('invalid-schema');
      }

      const next: Preferences = {
        ...DEFAULTS,
        ...payload.preferences,
      };

      if (
        !['vi', 'en', 'zh'].includes(next.language) ||
        !['grid', 'list'].includes(next.viewMode) ||
        !['lastCaptured', 'name'].includes(next.sortBy) ||
        !['auto', 'assigned', 'public'].includes(next.defaultTab) ||
        ![30, 60, 120, 300].includes(next.autoRefreshSeconds) ||
        typeof next.rememberLastTab !== 'boolean' ||
        typeof next.confirmDelete !== 'boolean' ||
        typeof next.showThumbnails !== 'boolean' ||
        typeof next.autoRefresh !== 'boolean' ||
        typeof next.reducedMotion !== 'boolean' ||
        typeof next.browserNotifications !== 'boolean' ||
        typeof next.notifyProcessingComplete !== 'boolean'
      ) {
        throw new Error('invalid-values');
      }

      setDraft(next);
      writePreferences(next);
      applyPreferences(next);
      setSaved(next);
      showToast(TEXT[next.language].imported);
    } catch {
      showToast(t.invalidImport);
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const clearLocalSettings = () => {
    if (!window.confirm(t.clearConfirm)) return;

    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));

    const next = { ...DEFAULTS };
    setDraft(next);
    setSaved(next);
    applyPreferences(next);
    showToast(TEXT[next.language].cleared);
  };

  const permissionLabel =
    notificationPermission === 'unsupported'
      ? t.unsupported
      : notificationPermission === 'granted'
        ? t.granted
        : notificationPermission === 'denied'
          ? t.denied
          : t.defaultPermission;

  const diagnostics = [
    `Saolatek 3D GIS`,
    `version=${appVersion}`,
    `route=${window.location.href}`,
    `role=${user?.role ?? 'anonymous'}`,
    `authenticated=${String(isAuthenticated)}`,
    `browser=${navigator.userAgent}`,
    `viewport=${window.innerWidth}x${window.innerHeight}`,
    `dpr=${window.devicePixelRatio || 1}`,
    `online=${String(navigator.onLine)}`,
    `notification=${notificationPermission}`,
  ].join('\n');

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = diagnostics;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showToast(t.copied);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navItems: Array<{
    key: Section;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'general', label: t.general, icon: <Settings size={15} /> },
    { key: 'dashboard', label: t.dashboard, icon: <SlidersHorizontal size={15} /> },
    { key: 'notifications', label: t.notifications, icon: <Bell size={15} /> },
    { key: 'account', label: t.account, icon: <User size={15} /> },
    { key: 'advanced', label: t.advanced, icon: <Database size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
              <h1 className="truncate text-sm font-bold text-slate-950">{t.title}</h1>
              <p className="hidden truncate text-[10px] text-slate-500 md:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {dirty && (
              <span className="hidden text-[10px] font-semibold text-amber-700 sm:inline">
                {t.unsaved}
              </span>
            )}
            <button
              onClick={save}
              disabled={!dirty}
              className={`flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold ${
                dirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              <Save size={13} />
              <span className="hidden sm:inline">{t.save}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 p-3 sm:p-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-18">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors lg:w-full ${
                  section === item.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-4">
          {section === 'general' && (
            <PageSection
              icon={<Settings size={17} />}
              title={t.generalTitle}
              description={t.generalDesc}
            >
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-[11px] font-bold text-slate-700">
                    {t.language}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <RadioRow
                      active={draft.language === 'vi'}
                      icon={<Globe2 size={14} />}
                      title="Tiếng Việt"
                      onClick={() => update('language', 'vi')}
                    />
                    <RadioRow
                      active={draft.language === 'en'}
                      icon={<Globe2 size={14} />}
                      title="English"
                      onClick={() => update('language', 'en')}
                    />
                    <RadioRow
                      active={draft.language === 'zh'}
                      icon={<Globe2 size={14} />}
                      title="中文"
                      onClick={() => update('language', 'zh')}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 px-4">
                  <SettingRow
                    title={t.reducedMotion}
                    description={t.reducedMotionDesc}
                    control={
                      <Toggle
                        value={draft.reducedMotion}
                        onChange={value => update('reducedMotion', value)}
                      />
                    }
                  />
                </div>
              </div>
            </PageSection>
          )}

          {section === 'dashboard' && (
            <PageSection
              icon={<SlidersHorizontal size={17} />}
              title={t.dashboardTitle}
              description={t.dashboardDesc}
            >
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-[11px] font-bold text-slate-700">
                    {t.viewMode}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <RadioRow
                      active={draft.viewMode === 'grid'}
                      icon={<LayoutGrid size={14} />}
                      title={t.grid}
                      onClick={() => update('viewMode', 'grid')}
                    />
                    <RadioRow
                      active={draft.viewMode === 'list'}
                      icon={<List size={14} />}
                      title={t.list}
                      onClick={() => update('viewMode', 'list')}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-bold text-slate-700">
                    {t.sort}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <RadioRow
                      active={draft.sortBy === 'lastCaptured'}
                      icon={<RefreshCw size={14} />}
                      title={t.latest}
                      onClick={() => update('sortBy', 'lastCaptured')}
                    />
                    <RadioRow
                      active={draft.sortBy === 'name'}
                      icon={<SortAsc size={14} />}
                      title={t.nameAZ}
                      onClick={() => update('sortBy', 'name')}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] font-bold text-slate-700">
                    {t.defaultTab}
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <RadioRow
                      active={draft.defaultTab === 'auto'}
                      icon={<SlidersHorizontal size={14} />}
                      title={t.tabAuto}
                      onClick={() => update('defaultTab', 'auto')}
                    />
                    <RadioRow
                      active={draft.defaultTab === 'assigned'}
                      icon={<ShieldCheck size={14} />}
                      title={t.tabAssigned}
                      onClick={() => update('defaultTab', 'assigned')}
                    />
                    <RadioRow
                      active={draft.defaultTab === 'public'}
                      icon={<Globe2 size={14} />}
                      title={t.tabPublic}
                      onClick={() => update('defaultTab', 'public')}
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 px-4">
                  <SettingRow
                    title={t.rememberLastTab}
                    description={t.rememberLastTabDesc}
                    control={
                      <Toggle
                        value={draft.rememberLastTab}
                        onChange={value => update('rememberLastTab', value)}
                      />
                    }
                  />
                  <SettingRow
                    title={t.confirmDelete}
                    description={t.confirmDeleteDesc}
                    control={
                      <Toggle
                        value={draft.confirmDelete}
                        onChange={value => update('confirmDelete', value)}
                      />
                    }
                  />
                  <SettingRow
                    title={t.showThumbnails}
                    description={t.showThumbnailsDesc}
                    control={
                      <Toggle
                        value={draft.showThumbnails}
                        onChange={value => update('showThumbnails', value)}
                      />
                    }
                  />
                  <SettingRow
                    title={t.autoRefresh}
                    description={t.autoRefreshDesc}
                    control={
                      <Toggle
                        value={draft.autoRefresh}
                        onChange={value => update('autoRefresh', value)}
                      />
                    }
                  />
                  <SettingRow
                    title={t.refreshInterval}
                    control={
                      <select
                        value={draft.autoRefreshSeconds}
                        disabled={!draft.autoRefresh}
                        onChange={event =>
                          update(
                            'autoRefreshSeconds',
                            Number(event.target.value) as AutoRefreshSeconds,
                          )
                        }
                        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                        <option value={120}>2 min</option>
                        <option value={300}>5 min</option>
                      </select>
                    }
                  />
                </div>
              </div>
            </PageSection>
          )}

          {section === 'notifications' && (
            <PageSection
              icon={<Bell size={17} />}
              title={t.notificationTitle}
              description={t.notificationDesc}
            >
              <div className="rounded-lg border border-slate-200 px-4">
                <SettingRow
                  title={t.browserNotifications}
                  description={`${t.permission}: ${permissionLabel}`}
                  control={
                    <Toggle
                      value={draft.browserNotifications}
                      disabled={notificationPermission === 'unsupported'}
                      onChange={value => {
                        void toggleBrowserNotifications(value);
                      }}
                    />
                  }
                />
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 px-4">
                <SettingRow
                  title={t.processingComplete}
                  description={t.processingCompleteDesc}
                  control={
                    <Toggle
                      value={draft.notifyProcessingComplete}
                      disabled={!draft.browserNotifications}
                      onChange={value =>
                        update('notifyProcessingComplete', value)
                      }
                    />
                  }
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={testNotification}
                  disabled={
                    notificationPermission !== 'granted' ||
                    !draft.browserNotifications
                  }
                  className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${
                    notificationPermission === 'granted' &&
                    draft.browserNotifications
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Bell size={13} />
                  {t.test}
                </button>
              </div>
            </PageSection>
          )}

          {section === 'account' && (
            <PageSection
              icon={<User size={17} />}
              title={t.accountTitle}
              description={t.accountDesc}
            >
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {[
                  [t.fullName, user?.fullName ?? '—'],
                  [t.email, user?.email ?? '—'],
                  [t.role, user?.role ?? '—'],
                  [t.authStatus, isAuthenticated ? t.signedIn : t.signedOut],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-1 gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)]"
                  >
                    <div className="text-[11px] font-semibold text-slate-500">
                      {label}
                    </div>
                    <div className="break-all text-xs font-bold text-slate-900">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <div className="text-[11px] font-bold text-emerald-900">
                    {t.security}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-4 text-emerald-800">
                    {t.securityDesc}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="flex min-h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={13} />
                  {t.logout}
                </button>
              </div>
            </PageSection>
          )}

          {section === 'advanced' && (
            <>
              <PageSection
                icon={<Database size={17} />}
                title={t.advancedTitle}
                description={t.advancedDesc}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    onClick={exportSettings}
                    className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left hover:bg-slate-50"
                  >
                    <Download size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{t.export}</span>
                  </button>

                  <button
                    onClick={() => importRef.current?.click()}
                    className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left hover:bg-slate-50"
                  >
                    <Upload size={16} className="text-violet-600" />
                    <span className="text-xs font-bold text-slate-800">{t.import}</span>
                  </button>

                  <button
                    onClick={clearLocalSettings}
                    className="flex min-h-16 items-center gap-3 rounded-lg border border-red-200 bg-white px-3 text-left hover:bg-red-50"
                  >
                    <RotateCcw size={16} className="text-red-600" />
                    <span className="text-xs font-bold text-red-700">{t.clear}</span>
                  </button>
                </div>

                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void importSettings(file);
                  }}
                />
              </PageSection>

              <PageSection
                icon={<Monitor size={17} />}
                title={t.diagnostics}
                description={t.diagnosticsDesc}
              >
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {[
                    [t.version, appVersion],
                    [t.viewport, `${window.innerWidth}×${window.innerHeight}`],
                    [t.dpr, String(window.devicePixelRatio || 1)],
                    [t.network, navigator.onLine ? t.online : t.offline],
                    [t.notificationPermission, String(notificationPermission)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </div>
                      <div className="mt-1 truncate font-mono text-[10px] font-bold text-slate-700">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={copyDiagnostics}
                    className="flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Clipboard size={13} />
                    {t.copyDiagnostics}
                  </button>
                </div>
              </PageSection>
            </>
          )}

        </section>
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-lg">
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;
