/* Hallmark · component: dashboard · genre: modern-minimal · theme: studied-DNA (source: image)
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import logoImg from '../assets/logo.webp';
import {
  Plus, MapPin, HardDrive, ArrowRight, Trash2, Users, LogOut, LogIn,
  Image, Box, Cloud, Loader2, CheckCircle2, XCircle, Terminal, ChevronDown, ChevronUp, RefreshCw,
  Globe, Shield, Search, Lock, Unlock, Sparkles, Eye, Layers, Building2, Map as MapIcon,
  Menu, X, MoreVertical, LayoutGrid, List, Info, HelpCircle, User, Settings, FolderPlus, BookOpen, Plane, Crown
} from 'lucide-react';
import { useProjectStore, type Project } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchProjects, createProject, deleteProject, updateProject } from '../services/api';
import { Button } from '../components/UI/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/UI/Card';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectMemberModal } from '../components/ProjectMemberModal';
import { AdminLeadsModal } from '../components/AdminLeadsModal';
import { NotificationCenter } from '../features/notifications/NotificationCenter';
import {
  pushAppNotification,
} from '../features/notifications/notificationStore';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PipelineState {
  isProcessing: boolean;
  projectId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  success: boolean | null;
}

const readBooleanPreference = (
  key: string,
  fallback: boolean,
) => {
  const value = localStorage.getItem(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const readAutoRefreshSeconds = () => {
  const value = Number(
    localStorage.getItem('dashboard_auto_refresh_seconds'),
  );

  return value === 30 ||
    value === 60 ||
    value === 120 ||
    value === 300
    ? value
    : 60;
};

const NOTIFICATION_COPY = {
  vi: {
    pipelineSuccessTitle: 'Xử lý dữ liệu hoàn tất',
    pipelineSuccessMessage: 'Dữ liệu dự án đã xử lý xong và sẵn sàng để kiểm tra.',
    pipelineErrorTitle: 'Pipeline xử lý có lỗi',
    pipelineErrorMessage: 'Quá trình xử lý dữ liệu đã kết thúc với lỗi. Mở tiến trình để kiểm tra log.',
    projectCreatedTitle: 'Đã tạo dự án',
    projectCreatedMessage: (name: string) => `Dự án “${name}” đã được tạo.`,
    pipelineStartedMessage: (name: string) => `Dự án “${name}” đã được tạo và pipeline đang bắt đầu xử lý.`,
    projectUpdatedTitle: 'Đã cập nhật dự án',
    projectUpdatedMessage: (name: string) => `Thông tin dự án “${name}” đã được lưu.`,
    projectDeletedTitle: 'Đã xóa dự án',
    projectDeletedMessage: (name: string) => `Dự án “${name}” đã được xóa khỏi danh sách.`,
    visibilityTitle: 'Đã cập nhật hiển thị dự án',
    visibilityPublicMessage: (name: string) => `Dự án “${name}” đã chuyển sang Demo Showcase.`,
    visibilityPrivateMessage: (name: string) => `Dự án “${name}” đã chuyển sang chế độ riêng tư.`,
  },
  en: {
    pipelineSuccessTitle: 'Processing completed',
    pipelineSuccessMessage: 'Project data processing is complete and ready for review.',
    pipelineErrorTitle: 'Processing pipeline failed',
    pipelineErrorMessage: 'The data pipeline finished with an error. Open the progress panel to review the logs.',
    projectCreatedTitle: 'Project created',
    projectCreatedMessage: (name: string) => `Project “${name}” was created.`,
    pipelineStartedMessage: (name: string) => `Project “${name}” was created and the processing pipeline is starting.`,
    projectUpdatedTitle: 'Project updated',
    projectUpdatedMessage: (name: string) => `Project “${name}” was updated.`,
    projectDeletedTitle: 'Project deleted',
    projectDeletedMessage: (name: string) => `Project “${name}” was removed from the list.`,
    visibilityTitle: 'Project visibility updated',
    visibilityPublicMessage: (name: string) => `Project “${name}” is now in Demo Showcase.`,
    visibilityPrivateMessage: (name: string) => `Project “${name}” is now private.`,
  },
  zh: {
    pipelineSuccessTitle: '数据处理完成',
    pipelineSuccessMessage: '项目数据已处理完成，可以开始检查。',
    pipelineErrorTitle: '处理 Pipeline 出错',
    pipelineErrorMessage: '数据处理已结束但出现错误。请打开进度面板检查日志。',
    projectCreatedTitle: '项目已创建',
    projectCreatedMessage: (name: string) => `项目“${name}”已创建。`,
    pipelineStartedMessage: (name: string) => `项目“${name}”已创建，处理 Pipeline 正在启动。`,
    projectUpdatedTitle: '项目已更新',
    projectUpdatedMessage: (name: string) => `项目“${name}”的信息已保存。`,
    projectDeletedTitle: '项目已删除',
    projectDeletedMessage: (name: string) => `项目“${name}”已从列表中删除。`,
    visibilityTitle: '项目可见性已更新',
    visibilityPublicMessage: (name: string) => `项目“${name}”已加入 Demo Showcase。`,
    visibilityPrivateMessage: (name: string) => `项目“${name}”已设为私有。`,
  },
} as const;

const getCurrentNotificationLanguage = () => {
  const saved = localStorage.getItem('lp_lang');
  return saved === 'en' || saved === 'zh' ? saved : 'vi';
};

// ─── Translations Dictionary ──────────────────────────────────────────────────
const DASHBOARD_TRANSLATIONS = {
  en: {
    projectsTitle: "Projects",
    gisConsole: "GIS CONSOLE",
    searchPlaceholder: "Search folders or projects...",
    licenseTrial: "14 DAYS TRIAL",
    viewMap: "View Map",
    allProjects: "All Projects",
    assignedProjects: "Assigned",
    publicShowcase: "Demo Showcase",
    sortByLabel: "Sort:",
    sortLatest: "Latest",
    sortName: "Name (A-Z)",
    newFolder: "New Folder",
    newProject: "New Project",
    noProjectsTitle: "No projects found",
    noProjectsAssigned: "You have not been assigned any projects. Please contact an Admin for access.",
    noProjectsPublic: "There are currently no public demo projects available.",
    noProjectsSystem: "No projects in the system. Click 'New Project' above to create the first one.",
    loadingProjects: "Loading projects list...",
    projectOptions: "Project options",
    view3DMap: "Open 3D Map",
    setPrivate: "Set Private",
    setPublic: "Set Public",
    manageMembers: "Manage Members",
    deleteProject: "Delete Project",
    viewProgress: "View Progress",
    openMap: "Open Map",
    columnProject: "Project",
    columnRole: "Role",
    columnCoords: "Coordinate / Location",
    columnLayers: "3D Layers",
    columnMembers: "Members",
    columnActions: "Actions",
    btnOpen: "Open",
    processing: "Processing...",
    trialTitle: "Trial Expiring Soon",
    trialDesc: "Your trial account has 14 days remaining.",
    btnUpgrade: "Upgrade Now",
    menuMain: "Main Menu",
    menuManageProjects: "Manage Projects",
    menuCustomerData: "Customer Information",
    menuBookDemo: "Book Demo",
    menuAdditional: "Additional Links",
    menuAcademy: "3D GIS Academy",
    menuDrone: "Drone Management",
    menuFlightLogs: "Flight Logs",
    menuEquipment: "Flight Equipment",
    menuPilots: "Pilots",
    menuApps: "Integrated Apps",
    menuSettings: "System Settings",
    menuHelp: "Help & Support",
    logout: "Log out",
    userProfile: "User Profile",
    requestList: "Request List",
    refreshList: "Refresh List",
    owner: "Owner",
    viewer: "Viewer",
    private: "Private",
    showcase: "Showcase",
    notDefined: "Not defined",
    processing3d: "Processing 3D data...",
    noDesc: "No description",
    trialBanner: "Gói Trial sắp hết hạn. Tài khoản dùng thử của bạn còn lại 14 ngày.",
    folderTitle: "Folder Management",
    folderDesc: "The system is preparing the grouped storage structure. Virtual folder management will be available in the next version.",
    btnOk: "OK",
    editProject: "Edit Project Info"
  },
  vi: {
    projectsTitle: "Dự án",
    gisConsole: "GIS CONSOLE",
    searchPlaceholder: "Tìm kiếm thư mục hoặc dự án...",
    licenseTrial: "14 NGÀY DÙNG THỬ",
    viewMap: "Xem bản đồ",
    allProjects: "Tất cả dự án",
    assignedProjects: "Được cấp quyền",
    publicShowcase: "Demo Showcase",
    sortByLabel: "Sắp xếp:",
    sortLatest: "Mới nhất",
    sortName: "Tên dự án (A-Z)",
    newFolder: "Thư mục mới",
    newProject: "Dự án mới",
    noProjectsTitle: "Không tìm thấy dự án",
    noProjectsAssigned: "Bạn chưa có dự án nào được phân quyền. Vui lòng liên hệ Quản trị viên để được cấp quyền truy cập.",
    noProjectsPublic: "Hiện chưa có dự án Demo công khai nào trên nền tảng.",
    noProjectsSystem: "Chưa có dự án nào trong hệ thống. Nhấn nút 'Dự án mới' phía trên để khởi tạo dự án đầu tiên.",
    loadingProjects: "Đang tải danh sách dự án...",
    projectOptions: "Tùy chọn dự án",
    view3DMap: "Xem Bản đồ 3D",
    setPrivate: "Đặt riêng tư",
    setPublic: "Đặt công khai",
    manageMembers: "Phân quyền thành viên",
    deleteProject: "Xóa dự án",
    viewProgress: "Xem tiến trình",
    openMap: "Mở Bản đồ",
    columnProject: "Dự án",
    columnRole: "Quyền hạn",
    columnCoords: "Hệ tọa độ / Tọa độ",
    columnLayers: "Lớp dữ liệu 3D",
    columnMembers: "Thành viên",
    columnActions: "Thao tác",
    btnOpen: "Mở",
    processing: "Đang xử lý...",
    trialTitle: "Gói Trial sắp hết hạn",
    trialDesc: "Tài khoản dùng thử của bạn còn lại 14 ngày.",
    btnUpgrade: "Nâng cấp ngay",
    menuMain: "Danh mục chính",
    menuManageProjects: "Quản lý Dự án",
    menuCustomerData: "Quản lý thông tin",
    menuBookDemo: "Đăng ký Demo",
    menuAdditional: "Liên kết bổ sung",
    menuAcademy: "Học viện 3D GIS",
    menuDrone: "Quản lý bay (Drone)",
    menuFlightLogs: "Nhật ký bay",
    menuEquipment: "Thiết bị bay",
    menuPilots: "Phi công",
    menuApps: "Ứng dụng tích hợp",
    menuSettings: "Cài đặt hệ thống",
    menuHelp: "Hỏi đáp & Trợ giúp",
    logout: "Đăng xuất",
    userProfile: "Thông tin tài khoản",
    requestList: "Danh sách yêu cầu",
    refreshList: "Làm mới danh sách",
    owner: "Chủ sở hữu",
    viewer: "Người xem",
    private: "Riêng tư",
    showcase: "Showcase",
    notDefined: "Chưa xác định",
    processing3d: "Đang xử lý dữ liệu 3D...",
    noDesc: "Chưa có mô tả",
    trialBanner: "Gói Trial sắp hết hạn. Tài khoản dùng thử của bạn còn lại 14 ngày.",
    folderTitle: "Tính năng Quản lý thư mục",
    folderDesc: "Hệ thống đang chuẩn bị cấu trúc lưu trữ phân nhóm. Tính năng quản lý thư mục ảo sẽ sớm ra mắt trong phiên bản tiếp theo.",
    btnOk: "Đồng ý",
    editProject: "Chỉnh sửa thông tin"
  },
  zh: {
    projectsTitle: "项目",
    gisConsole: "GIS 控制台",
    searchPlaceholder: "搜索文件夹或项目...",
    licenseTrial: "14 天试用",
    viewMap: "查看地图",
    allProjects: "所有项目",
    assignedProjects: "已授权项目",
    publicShowcase: "演示案例",
    sortByLabel: "排序:",
    sortLatest: "最新",
    sortName: "项目名称 (A-Z)",
    newFolder: "新建文件夹",
    newProject: "新建项目",
    noProjectsTitle: "未找到项目",
    noProjectsAssigned: "您尚未获得任何项目的授权。请联系管理员以获取访问权限。",
    noProjectsPublic: "平台目前没有公开的演示项目。",
    noProjectsSystem: "系统中尚无项目。点击上方的“新建项目”以创建第一个项目。",
    loadingProjects: "正在加载项目列表...",
    projectOptions: "项目选项",
    view3DMap: "打开3D地图",
    setPrivate: "设为私有",
    setPublic: "设为公开",
    manageMembers: "成员授权管理",
    deleteProject: "删除项目",
    viewProgress: "查看进度",
    openMap: "打开地图",
    columnProject: "项目",
    columnRole: "权限",
    columnCoords: "坐标系/位置",
    columnLayers: "3D数据层",
    columnMembers: "成员",
    columnActions: "操作",
    btnOpen: "打开",
    processing: "处理中...",
    trialTitle: "试用套餐即将到期",
    trialDesc: "您的试用账户还剩 14 天。",
    btnUpgrade: "立即升级",
    menuMain: "主菜单",
    menuManageProjects: "项目管理",
    menuCustomerData: "客户信息管理",
    menuBookDemo: "预约演示",
    menuAdditional: "附加链接",
    menuAcademy: "3D GIS 学院",
    menuDrone: "无人机管理",
    menuFlightLogs: "飞行日志",
    menuEquipment: "飞行设备",
    menuPilots: "飞行员",
    menuApps: "集成应用",
    menuSettings: "系统设置",
    menuHelp: "问答与帮助",
    logout: "退出登录",
    userProfile: "用户资料",
    requestList: "请求列表",
    refreshList: "刷新列表",
    owner: "所有者",
    viewer: "查看者",
    private: "私有",
    showcase: "展示",
    notDefined: "未定义",
    processing3d: "正在处理3D数据...",
    noDesc: "无描述",
    trialBanner: "试用套餐即将到期。您的试用账户还剩 14 天。",
    folderTitle: "文件夹管理功能",
    folderDesc: "系统正在准备分组存储结构。虚拟文件夹管理功能将在下一版本中推出。",
    btnOk: "确定",
    editProject: "编辑项目信息"
  }
};

// ─── Pipeline Status Panel ────────────────────────────────────────────────────
const PipelinePanel: React.FC<{
  logs: string[];
  pipeline: PipelineState;
  onClose: () => void;
}> = ({ logs, pipeline, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, collapsed]);

  const statusColor = pipeline.isProcessing
    ? 'border-cyan-500/60 shadow-cyan-500/10'
    : pipeline.success
      ? 'border-emerald-500/60 shadow-emerald-500/10'
      : 'border-red-500/60 shadow-red-500/10';

  const elapsed = pipeline.startedAt
    ? Math.round(((pipeline.finishedAt || Date.now()) - pipeline.startedAt) / 1000)
    : 0;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[420px] bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden transition-all ${statusColor}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-slate-800"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          {pipeline.isProcessing ? (
            <Loader2 size={16} className="text-cyan-400 animate-spin" />
          ) : pipeline.success ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
          <span className="text-sm font-bold text-white font-mono">
            {pipeline.isProcessing ? 'Đang xử lý dữ liệu...' : pipeline.success ? 'Hoàn tất!' : 'Có lỗi xảy ra'}
          </span>
          <span className="text-[10px] font-mono text-slate-500">{elapsed}s</span>
        </div>
        <div className="flex items-center gap-2">
          {!pipeline.isProcessing && (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700">
              ✕
            </button>
          )}
          {collapsed ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex gap-0 border-b border-slate-800">
            {[
              { icon: Image, label: 'DOM', key: 'dom' },
              { icon: Box, label: '3D Model', key: 'model' },
              { icon: HardDrive, label: 'Point Cloud', key: 'pc' },
              { icon: Cloud, label: 'R2 Upload', key: 'r2' },
            ].map(({ icon: Icon, label, key }) => {
              const done = logs.some(l =>
                (key === 'dom' && (l.includes('dom.png') || l.includes('dom.jpg') || l.includes('metadata.json'))) ||
                (key === 'model' && (l.includes('model.glb') || l.includes('GLB'))) ||
                (key === 'pc' && (l.includes('tileset.json') || l.includes('3D Tiles OK'))) ||
                (key === 'r2' && (l.includes('Upload R2') && l.includes('✅')))
              );
              const active = pipeline.isProcessing && logs.some(l =>
                (key === 'dom' && l.includes('DOM')) ||
                (key === 'model' && l.includes('Model')) ||
                (key === 'pc' && l.includes('Point Cloud')) ||
                (key === 'r2' && l.includes('upload'))
              );
              return (
                <div key={key} className="flex-1 flex flex-col items-center py-2 gap-0.5 border-r border-slate-800 last:border-0">
                  <Icon size={14} className={done ? 'text-emerald-400' : active && pipeline.isProcessing ? 'text-cyan-400' : 'text-slate-600'} />
                  <span className="text-[9px] font-mono text-slate-400">{label}</span>
                  {done ? <div className="w-1 h-1 rounded-full bg-emerald-400" /> : active && pipeline.isProcessing ? <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" /> : <div className="w-1 h-1 rounded-full bg-slate-700" />}
                </div>
              );
            })}
          </div>

          <div className="h-48 overflow-y-auto p-3 font-mono text-[10px] space-y-0.5 bg-slate-950/50">
            {logs.filter(l => l !== '__PIPELINE_DONE__').map((log, i) => {
              let cls = 'text-slate-400';
              if (log.includes('[ERROR]') || log.includes('❌')) cls = 'text-red-400';
              else if (log.includes('✅') || log.includes('OK') || log.includes('Hoàn tất')) cls = 'text-emerald-400';
              else if (log.includes('🚀') || log.includes('☁️') || log.includes('📌') || log.includes('🐍')) cls = 'text-cyan-300';
              else if (log.includes('⚠️')) cls = 'text-amber-400';
              return <div key={i} className={cls}>{log}</div>;
            })}
            <div ref={logEndRef} />
          </div>
        </>
      )}
    </div>
  );
};

// ─── Data Badge Component ─────────────────────────────────────────────────────
const DataBadge: React.FC<{ icon: React.ReactNode; label: string; active: boolean }> = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors ${active
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
    {icon}
    <span>{label}</span>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const isAdmin = user?.role === 'SUPERADMIN';
  const isCustomerView =
    new URLSearchParams(location.search).get('view') ===
    'customers';

  // Tabs: 'all' | 'assigned' | 'public'
  // ?tab=demo => luôn mở thẳng Demo Showcase khi đi từ Book Demo.
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'public'>(() => {
    if (requestedTab === 'demo') return 'public';

    const rememberLast = readBooleanPreference(
      'dashboard_remember_last_tab',
      true,
    );
    const lastTab = localStorage.getItem('dashboard_last_tab');

    if (rememberLast) {
      if (lastTab === 'public' || lastTab === 'assigned') {
        return lastTab;
      }
      if (lastTab === 'all' && user?.role === 'SUPERADMIN') {
        return 'all';
      }
    }

    const defaultTab = localStorage.getItem('dashboard_default_tab');
    if (defaultTab === 'public') return 'public';
    if (defaultTab === 'assigned') return 'assigned';

    return user?.role === 'SUPERADMIN' ? 'all' : 'assigned';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: 'all' | 'assigned' | 'public') => {
    setActiveTab(tab);

    if (
      readBooleanPreference(
        'dashboard_remember_last_tab',
        true,
      )
    ) {
      localStorage.setItem('dashboard_last_tab', tab);
    }

    if (tab === 'public') {
      setSearchParams({ tab: 'demo' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // UI layout and view state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('dashboard_view_mode');
    return saved === 'list' ? 'list' : 'grid';
  });
  const [sortBy, setSortBy] = useState<'lastCaptured' | 'name'>(() => {
    const saved = localStorage.getItem('dashboard_sort_by');
    return saved === 'name' ? 'name' : 'lastCaptured';
  });
  const [showProjectThumbnails] = useState(() =>
    readBooleanPreference(
      'dashboard_show_thumbnails',
      true,
    )
  );
  const [autoRefreshProjects] = useState(() =>
    readBooleanPreference(
      'dashboard_auto_refresh',
      false,
    )
  );
  const [autoRefreshSeconds] = useState(
    readAutoRefreshSeconds
  );
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showFolderAlert, setShowFolderAlert] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Language state synchronized with landing page
  const [currentLang, setCurrentLang] = useState<'en' | 'vi' | 'zh'>(() => {
    const saved = localStorage.getItem('lp_lang');
    return (saved === 'en' || saved === 'vi' || saved === 'zh') ? saved : 'vi';
  });
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('lp_lang', currentLang);
    localStorage.setItem('saolatek_language', currentLang);

    window.dispatchEvent(
      new CustomEvent('saolatek-language-change', {
        detail: currentLang,
      })
    );
  }, [currentLang]);

  useEffect(() => {
    localStorage.setItem('dashboard_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('dashboard_sort_by', sortBy);
  }, [sortBy]);


  // Translate helper function
  const t = (key: keyof typeof DASHBOARD_TRANSLATIONS.vi) => {
    return DASHBOARD_TRANSLATIONS[currentLang][key] || DASHBOARD_TRANSLATIONS.vi[key] || '';
  };


  const getLocalizedProjectDescription = (
    description?: string | null
  ) => {
    const normalized = description?.trim();

    if (!normalized) {
      return t('noDesc');
    }

    const systemDescriptions: Record<
      string,
      Record<'vi' | 'en' | 'zh', string>
    > = {
      'Được khôi phục tự động từ R2': {
        vi: 'Được khôi phục tự động từ R2',
        en: 'Automatically restored from R2',
        zh: '已从 R2 自动恢复',
      },
      'Duoc khoi phuc tu dong tu R2': {
        vi: 'Được khôi phục tự động từ R2',
        en: 'Automatically restored from R2',
        zh: '已从 R2 自动恢复',
      },
      'Automatically restored from R2': {
        vi: 'Được khôi phục tự động từ R2',
        en: 'Automatically restored from R2',
        zh: '已从 R2 自动恢复',
      },
      '已从 R2 自动恢复': {
        vi: 'Được khôi phục tự động từ R2',
        en: 'Automatically restored from R2',
        zh: '已从 R2 自动恢复',
      },
    };

    return (
      systemDescriptions[normalized]?.[
        currentLang
      ] ?? normalized
    );
  };

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
  const [selectedMemberProject, setSelectedMemberProject] = useState<{ id: string; name: string } | null>(null);

  // Pipeline panel state
  const [showPanel, setShowPanel] = useState(false);
  const [panelLogs, setPanelLogs] = useState<string[]>([]);
  const [pipeline, setPipeline] = useState<PipelineState>({
    isProcessing: false, projectId: null, startedAt: null, finishedAt: null, success: null
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  }, [setProjects, setLoading]);

  const refreshProjectsSilently = useCallback(async () => {
    const data = await fetchProjects();
    setProjects(data);
  }, [setProjects]);

  useEffect(() => { loadProjects(); }, [loadProjects, isAuthenticated]);

  useEffect(() => {
    if (!autoRefreshProjects) return;

    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState !== 'visible' ||
        pipeline.isProcessing
      ) {
        return;
      }

      void refreshProjectsSilently();
    }, autoRefreshSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [
    autoRefreshProjects,
    autoRefreshSeconds,
    pipeline.isProcessing,
    refreshProjectsSilently,
  ]);

  // Resolve default project tab from user preference without weakening access rules.
  // ?tab=demo always has the highest priority.
  useEffect(() => {
    if (!user) return;

    if (requestedTab === 'demo') {
      setActiveTab('public');
      return;
    }

    const assignedCount = projects.filter(
      (project) =>
        project.createdById === user.id ||
        project.members?.some((member) => member.userId === user.id)
    ).length;

    const rememberLast = readBooleanPreference(
      'dashboard_remember_last_tab',
      true,
    );
    const lastTab = localStorage.getItem('dashboard_last_tab');

    if (rememberLast) {
      if (lastTab === 'public') {
        setActiveTab('public');
        return;
      }

      if (lastTab === 'assigned') {
        setActiveTab(assignedCount > 0 ? 'assigned' : 'public');
        return;
      }

      if (lastTab === 'all' && isAdmin) {
        setActiveTab('all');
        return;
      }
    }

    const defaultTab = localStorage.getItem('dashboard_default_tab');

    if (defaultTab === 'public') {
      setActiveTab('public');
      return;
    }

    if (defaultTab === 'assigned') {
      setActiveTab(assignedCount > 0 ? 'assigned' : 'public');
      return;
    }

    if (isAdmin) {
      setActiveTab('all');
      return;
    }

    setActiveTab(assignedCount > 0 ? 'assigned' : 'public');
  }, [user, isAdmin, projects.length, requestedTab]);

  // Handle mobile responsive sidebar defaults
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dropdown closing listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setActiveDropdown(null);
        setIsProfileOpen(false);
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Polling logs khi pipeline đang chạy ──────────────────────────────────
  useEffect(() => {
    if (!showPanel) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/logs`);
        const data = await res.json();
        setPanelLogs(data.logs || []);
        const newPipeline: PipelineState = data.pipeline;
        setPipeline(newPipeline);

        if (!newPipeline.isProcessing && newPipeline.finishedAt) {
          clearInterval(id);
          await loadProjects();

          const notificationLanguage = getCurrentNotificationLanguage();
          const notificationCopy = NOTIFICATION_COPY[notificationLanguage];
          const targetUserId = user?.id ?? 'anonymous';
          const pipelineHref = newPipeline.projectId
            ? `/viewer/${newPipeline.projectId}`
            : undefined;

          pushAppNotification(targetUserId, {
            id: `pipeline:${newPipeline.projectId ?? 'unknown'}:${newPipeline.finishedAt}`,
            level: newPipeline.success ? 'success' : 'error',
            source: 'pipeline',
            title: newPipeline.success
              ? notificationCopy.pipelineSuccessTitle
              : notificationCopy.pipelineErrorTitle,
            message: newPipeline.success
              ? notificationCopy.pipelineSuccessMessage
              : notificationCopy.pipelineErrorMessage,
            href: pipelineHref,
            projectId: newPipeline.projectId ?? undefined,
          });

          const browserNotificationsEnabled =
            readBooleanPreference(
              'saolatek_browser_notifications',
              false,
            );
          const processingNotificationEnabled =
            readBooleanPreference(
              'saolatek_notify_processing_complete',
              true,
            );

          if (
            browserNotificationsEnabled &&
            processingNotificationEnabled &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification('Saolatek 3D GIS', {
                body: newPipeline.success
                  ? 'Xử lý dữ liệu dự án đã hoàn tất.'
                  : 'Pipeline xử lý dữ liệu đã kết thúc với lỗi.',
              });
            } catch {
              // Browser notification is best-effort only.
            }
          }
        }
      } catch (_) { }
    }, 1500);
    return () => clearInterval(id);
  }, [showPanel, loadProjects, user?.id]);

  // ── Thao tác Admin: Đổi trạng thái Public Demo (1-click) ────────────────
  const handleTogglePublic = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setActiveDropdown(null);
    const newIsPublic = !project.isPublic;
    const actionLabel = newIsPublic ? 'Công khai cho người dùng xem Demo' : 'Đặt làm Riêng tư (Chỉ thành viên xem)';

    if (window.confirm(`Bạn có chắc chắn muốn ${actionLabel} dự án "${project.name}"?`)) {
      const updated = await updateProject(project.id, { isPublic: newIsPublic });
      if (updated) {
        const copy = NOTIFICATION_COPY[currentLang];
        pushAppNotification(user?.id ?? 'anonymous', {
          level: 'info',
          source: 'project',
          title: copy.visibilityTitle,
          message: newIsPublic
            ? copy.visibilityPublicMessage(project.name)
            : copy.visibilityPrivateMessage(project.name),
          href: `/viewer/${project.id}`,
          projectId: project.id,
        });

        loadProjects();
      } else {
        alert("Lỗi khi cập nhật trạng thái công khai của dự án.");
      }
    }
  };

  // ── Tạo hoặc Cập nhật dự án ──────────────────────────────────────────────────
  const handleSaveProject = async (data: any) => {
    if (editingProject) {
      const updated = await updateProject(editingProject.id, {
        name: data.name,
        description: data.description,
        centerLon: data.centerLon,
        centerLat: data.centerLat,
        epsg: data.epsg,
        domUrl: data.domUrl,
        modelUrl: data.modelUrl,
        pointCloudId: data.pointCloudId,
      });
      if (updated) {
        const copy = NOTIFICATION_COPY[currentLang];
        pushAppNotification(user?.id ?? 'anonymous', {
          level: 'success',
          source: 'project',
          title: copy.projectUpdatedTitle,
          message: copy.projectUpdatedMessage(data.name),
          href: `/viewer/${editingProject.id}`,
          projectId: editingProject.id,
        });

        await loadProjects();
        setEditingProject(null);
      } else {
        alert("Có lỗi xảy ra khi cập nhật dự án.");
      }
    } else {
      if (data.isAutoProcess) {
        const project = await createProject({
          name: data.name,
          description: data.description,
          epsg: data.epsg,
          centerLon: 0,
          centerLat: 0,
        });

        if (!project?.id) {
          alert('Không thể tạo dự án. Vui lòng thử lại.');
          return;
        }

        const copy = NOTIFICATION_COPY[currentLang];
        pushAppNotification(user?.id ?? 'anonymous', {
          level: 'info',
          source: 'pipeline',
          title: copy.projectCreatedTitle,
          message: copy.pipelineStartedMessage(data.name),
          href: `/viewer/${project.id}`,
          projectId: project.id,
        });

        setPanelLogs([`[INFO] Dự án "${data.name}" được tạo thành công (ID: ${project.id})`]);
        setPipeline({ isProcessing: true, projectId: project.id, startedAt: Date.now(), finishedAt: null, success: null });
        setShowPanel(true);

        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/logs/clear`, { method: 'POST' });

        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/optimize/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            inputDir: data.inputDir,
            outputDir: data.outputDir || undefined,
            projectId: project.id,
            epsg: data.epsg,
          })
        });

        if (!res.ok) {
          setPanelLogs(prev => [...prev, `[ERROR] Không thể kích hoạt pipeline xử lý.`]);
        }

        await loadProjects();
      } else {
        const created = await createProject(data);

        if (created?.id) {
          const copy = NOTIFICATION_COPY[currentLang];
          pushAppNotification(user?.id ?? 'anonymous', {
            level: 'success',
            source: 'project',
            title: copy.projectCreatedTitle,
            message: copy.projectCreatedMessage(data.name),
            href: `/viewer/${created.id}`,
            projectId: created.id,
          });
        }

        await loadProjects();
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveDropdown(null);

    const requireConfirm = readBooleanPreference(
      'dashboard_confirm_delete',
      true,
    );

    if (
      requireConfirm &&
      !window.confirm('Bạn có chắc chắn muốn xóa dự án này?')
    ) {
      return;
    }

    const projectName =
      projects.find(project => project.id === id)?.name ??
      (currentLang === 'en'
        ? 'Project'
        : currentLang === 'zh'
          ? '项目'
          : 'Dự án');

    await deleteProject(id);

    const copy = NOTIFICATION_COPY[currentLang];
    pushAppNotification(user?.id ?? 'anonymous', {
      level: 'warning',
      source: 'project',
      title: copy.projectDeletedTitle,
      message: copy.projectDeletedMessage(projectName),
    });

    loadProjects();
  };


  // ── Lọc danh sách dự án theo Role, Search & Sort ──────────────────────────────
  const assignedProjects = projects.filter(p =>
    p.createdById === user?.id || p.members?.some(m => m.userId === user?.id)
  );
  const publicProjects = projects.filter(p => p.isPublic);

  const getFilteredProjects = () => {
    let list: Project[] = [];
    if (activeTab === 'all') {
      list = [...projects];
    } else if (activeTab === 'assigned') {
      list = [...assignedProjects];
    } else if (activeTab === 'public') {
      list = [...publicProjects];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // default: latest created (ID descending)
      list.sort((a, b) => b.id.localeCompare(a.id));
    }

    return list;
  };

  const displayedProjects = getFilteredProjects();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased select-none">

      {/* ── Collapsible Left Sidebar ─────────────────────────────── */}
      <div
        className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 
          md:static fixed inset-y-0 left-0 
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:w-0 md:translate-x-0 md:border-r-0 md:overflow-hidden'}`}
      >
        {/* Upper Sidebar */}
        <div className="flex flex-col overflow-y-auto">
          {/* Logo & Mobile Close Trigger */}
          <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src={logoImg} alt="Saolatek Logo" className="h-8 w-auto object-contain" />
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono">{t('menuMain')}</span>
              <div className="space-y-0.5">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    !isCustomerView
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={15} />
                  <span>{t('menuManageProjects')}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() =>
                      navigate('/dashboard?view=customers')
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isCustomerView
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={15} />
                    <span>{t('menuCustomerData')}</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/book-demo')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>{t('menuBookDemo')}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono">{t('menuAdditional')}</span>
              <div className="space-y-0.5">
                <a
                  href="https://dronedeploy.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <BookOpen size={15} />
                  <span>{t('menuAcademy')}</span>
                </a>
              </div>
            </div>

            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono">{t('menuDrone')}</span>
              <div className="space-y-0.5">
                <button
                  onClick={() => alert(t('menuFlightLogs') + ' is under development')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Plane size={15} />
                  <span>{t('menuFlightLogs')}</span>
                </button>
                <button
                  onClick={() => alert(t('menuEquipment') + ' is under development')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Settings size={15} />
                  <span>{t('menuEquipment')}</span>
                </button>
                <button
                  onClick={() => alert(t('menuPilots') + ' is under development')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <User size={15} />
                  <span>{t('menuPilots')}</span>
                </button>
                <button
                  onClick={() => alert(t('menuApps') + ' is under development')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Box size={15} />
                  <span>{t('menuApps')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-0.5">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              navigate('/settings');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors text-left cursor-pointer"
          >
            <Settings size={15} />
            <span>{t('menuSettings')}</span>
          </button>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              navigate('/help');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors text-left cursor-pointer"
          >
            <HelpCircle size={15} />
            <span>{t('menuHelp')}</span>
          </button>
          {isAuthenticated && user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
            >
              <LogOut size={15} />
              <span>{t('logout')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* ── Main Layout Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        <header className="h-14 bg-white text-slate-800 flex items-center justify-between px-2 sm:px-4 z-20 shrink-0 border-b border-slate-200 shadow-sm">
          {/* Left Area: Hamburger and Brand */}
          <div className="flex items-center gap-1.5 animate-fade-in">
            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              title="Menu"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Middle Area: Search bar matching template */}
          <div className="relative mx-2 min-w-0 flex-1 select-none sm:mx-4 sm:max-w-sm lg:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
            <input
              type="text"
              placeholder={
                isCustomerView
                  ? t('menuCustomerData')
                  : t('searchPlaceholder')
              }
              value={isCustomerView ? '' : searchQuery}
              onChange={(e) => {
                if (!isCustomerView) {
                  setSearchQuery(e.target.value);
                }
              }}
              disabled={isCustomerView}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-sans"
            />
          </div>

          {/* Right Area: Utility Actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
            {/* Language Switcher Dropdown (Globe Icon) */}
            <div className="relative dropdown-trigger">
              <button
                onClick={() => setLangDropdownOpen(v => !v)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 cursor-pointer relative lg:h-auto lg:w-auto lg:p-2
                  ${langDropdownOpen ? 'text-slate-800 bg-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                aria-label="Select language"
                title={currentLang === 'vi' ? 'Chọn ngôn ngữ' : currentLang === 'en' ? 'Select language' : '选择语言'}
              >
                <Globe size={18} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 dropdown-menu text-slate-800 text-xs font-sans text-left">
                  {[
                    { code: 'vi', name: 'Tiếng Việt' },
                    { code: 'en', name: 'English' },
                    { code: 'zh', name: '中文' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setCurrentLang(item.code as 'en' | 'vi' | 'zh');
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 hover:bg-slate-50 text-left font-semibold flex items-center justify-between cursor-pointer transition-colors ${currentLang === item.code ? 'text-blue-600 bg-blue-50/30' : 'text-slate-700 hover:text-slate-900'
                        }`}
                    >
                      <span>{item.name}</span>
                      {currentLang === item.code && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification center */}
            <NotificationCenter
              userId={user?.id ?? 'anonymous'}
              language={currentLang}
            />

            {/* Profile Dropdown trigger */}
            {isAuthenticated && user ? (
              <div className="relative dropdown-trigger">
                <button
                  onClick={() => setIsProfileOpen(v => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-700 cursor-pointer lg:h-8 lg:w-8"
                >
                  {user.fullName.substring(0, 2).toUpperCase()}
                </button>

                {/* Profile menu dropdown overlay */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 dropdown-menu text-slate-800 text-xs font-sans text-left">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        {user.fullName}
                        {isAdmin && (
                          <span className="text-[8px] bg-blue-100 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-mono uppercase font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{user.email}</div>
                    </div>

                    <button
                      onClick={() => { setIsProfileOpen(false); alert(t('userProfile')); }}
                      className="w-full px-4 py-2 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <User size={14} className="text-slate-400" />
                      <span>{t('userProfile')}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => { setIsProfileOpen(false); setIsLeadsModalOpen(true); }}
                        className="w-full px-4 py-2 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                      >
                        <Globe size={14} className="text-slate-400" />
                        <span>{t('requestList')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setIsProfileOpen(false); loadProjects(); }}
                      className="w-full px-4 py-2 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={14} className="text-slate-400" />
                      <span>{t('refreshList')}</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 hover:bg-red-50 text-left font-semibold text-red-600 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Đăng nhập"
              >
                <LogIn size={18} />
              </button>
            )}
          </div>
        </header>

        {/* ── Content Canvas Container ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-6 flex flex-col">
          {isCustomerView && isAdmin ? (
            <AdminLeadsModal
              isOpen
              presentation="page"
              onClose={() => navigate('/dashboard')}
            />
          ) : (
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">

            {/* ── Control Options & Action Buttons Bar ───────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-3 mb-4 sm:mb-6 shrink-0">

              {/* Left Side: Filter Tabs */}
              <div className="-mb-px flex w-full flex-nowrap overflow-x-auto border-b border-slate-200 overscroll-x-contain md:w-auto">
                {isAdmin && (
                  <button
                    onClick={() => handleTabChange('all')}
                    className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-bold transition-all sm:px-3.5 sm:pb-2.5 ${activeTab === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                      }`}
                  >
                    <Layers size={14} />
                    <span>{t('allProjects')}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>{projects.length}</span>
                  </button>
                )}

                <button
                  onClick={() => handleTabChange('assigned')}
                  className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-bold transition-all sm:px-3.5 sm:pb-2.5 ${activeTab === 'assigned'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                >
                  <Building2 size={14} />
                  <span>{t('assignedProjects')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono ${activeTab === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>{assignedProjects.length}</span>
                </button>

                <button
                  onClick={() => handleTabChange('public')}
                  className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-bold transition-all sm:px-3.5 sm:pb-2.5 ${activeTab === 'public'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                >
                  <Sparkles size={14} />
                  <span>{t('publicShowcase')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono ${activeTab === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>{publicProjects.length}</span>
                </button>
              </div>

              {/* Right Side: Layout and Actions Controls */}
              <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto">
                {/* Sort Option Dropdown */}
                <div className="relative dropdown-trigger flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm select-none sm:flex-none">
                  <span className="text-slate-400">{t('sortByLabel')}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'lastCaptured' | 'name')}
                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent pr-1 font-semibold text-slate-800 focus:outline-none focus:ring-0"
                  >
                    <option value="lastCaptured">{t('sortLatest')}</option>
                    <option value="name">{t('sortName')}</option>
                  </select>
                </div>

                {/* Grid/List View switcher */}
                <div className="flex min-h-10 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex min-w-9 items-center justify-center rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    title={currentLang === 'vi' ? 'Dạng lưới' : currentLang === 'en' ? 'Grid View' : '网格视图'}
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex min-w-9 items-center justify-center rounded-md cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    title={currentLang === 'vi' ? 'Dạng danh sách' : currentLang === 'en' ? 'List View' : '列表视图'}
                  >
                    <List size={15} />
                  </button>
                </div>

                {/* Add new folder button */}
                <button
                  onClick={() => setShowFolderAlert(true)}
                  className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                >
                  <FolderPlus size={14} className="text-slate-500" />
                  <span>{t('newFolder')}</span>
                </button>

                {/* Add project button (Admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/10 transition-all hover:bg-blue-700 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{t('newProject')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Project Showcase List/Grid ────────────────────────────────── */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500 text-xs font-mono gap-3 animate-pulse">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <span>{t('loadingProjects')}</span>
              </div>
            ) : displayedProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                  <Layers size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{t('noProjectsTitle')}</h3>
                {activeTab === 'assigned' ? (
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t('noProjectsAssigned')}</p>
                ) : activeTab === 'public' ? (
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t('noProjectsPublic')}</p>
                ) : (
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t('noProjectsSystem')}</p>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                {displayedProjects.map((project) => {
                  const isThisProcessing = pipeline.isProcessing && pipeline.projectId === project.id;
                  const hasDOM = !!project.domUrl;
                  const hasModel = !!project.modelUrl;
                  const hasPC = !!project.pointCloudId;

                  // Resolve user rights for project
                  const isOwner = project.createdById === user?.id || project.members?.some(m => m.userId === user?.id && m.role === 'OWNER');
                  const memberRole = project.members?.find(m => m.userId === user?.id)?.role;

                  // Active layers count
                  const layersCount = [hasDOM, hasModel, hasPC].filter(Boolean).length;

                  return (
                    <div
                      key={project.id}
                      className={`group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative
                        ${isThisProcessing ? 'ring-2 ring-blue-500/50 border-blue-500/30' : ''}`}
                    >
                      {/* Top processing bar if building */}
                      {isThisProcessing && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 animate-pulse z-10" />
                      )}

                      {/* Map preview box */}
                      <div className="h-40 bg-slate-100 relative overflow-hidden border-b border-slate-100 select-none text-slate-400">
                        {isThisProcessing ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 px-4 text-center bg-slate-50">
                            <Loader2 size={24} className="text-blue-500 animate-spin" />
                            <span className="text-[10px] font-mono text-blue-600 font-semibold animate-pulse">{t('processing3d')}</span>
                          </div>
                        ) : hasDOM && showProjectThumbnails ? (
                          <img
                            src={project.domUrl!}
                            crossOrigin="anonymous"
                            alt={project.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                            <MapPin size={32} className="text-slate-200" />
                          </div>
                        )}

                        {/* Top Left: Role badge overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {project.isPublic ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500 text-white border border-blue-600/10 shadow-sm flex items-center gap-1">
                              <Sparkles size={9} /> {t('publicShowcase').toUpperCase()}
                            </span>
                          ) : isOwner ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white border border-amber-600/10 shadow-sm flex items-center gap-1">
                              <Crown size={9} /> {t('owner').toUpperCase()}
                            </span>
                          ) : memberRole ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-600 text-white border border-emerald-700/10 shadow-sm flex items-center gap-1">
                              <Eye size={9} /> {memberRole === 'OWNER' ? t('owner').toUpperCase() : memberRole === 'EDITOR' ? 'EDITOR' : t('viewer').toUpperCase()}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-500 text-white border border-slate-600/10 shadow-sm flex items-center gap-1">
                              <Lock size={9} /> {t('private').toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Top Right: Technical layers indicator icon overlay */}
                        <div className="absolute top-3 right-3 select-none pointer-events-none">
                          <div className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                            <Globe size={13} />
                          </div>
                        </div>

                        {/* EPSG coordinate tag bottom right */}
                        <div className="absolute bottom-2.5 right-2.5 max-w-[calc(100%-20px)] truncate bg-neutral-900/80 text-white/95 text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-800 shadow-sm select-text">
                          EPSG: {project.epsg}
                        </div>
                      </div>

                      {/* Card Content body */}
                      <div className="p-3 sm:p-4 flex flex-col flex-grow select-none">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => !isThisProcessing && navigate(`/viewer/${project.id}`)}
                            className="font-semibold text-slate-800 text-sm line-clamp-1 flex-1 transition-colors cursor-pointer hover:text-blue-600"
                          >
                            {project.name}
                          </h4>

                          {/* Card commands menu (triple dots) */}
                          <div className="relative dropdown-trigger">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === project.id ? null : project.id); }}
                              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                              title={t('projectOptions')}
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Options */}
                            {activeDropdown === project.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-30 dropdown-menu text-xs font-sans text-left">
                                <button
                                  onClick={() => { setActiveDropdown(null); navigate(`/viewer/${project.id}`); }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye size={13} className="text-slate-400" />
                                  <span>{t('view3DMap')}</span>
                                </button>

                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={(e) => handleTogglePublic(e, project)}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                    >
                                      {project.isPublic ? <Lock size={13} className="text-slate-400" /> : <Globe size={13} className="text-slate-400" />}
                                      <span>{project.isPublic ? t('setPrivate') : t('setPublic')}</span>
                                    </button>

                                    <button
                                      onClick={() => { setActiveDropdown(null); setSelectedMemberProject({ id: project.id, name: project.name }); }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Users size={13} className="text-slate-400" />
                                      <span>{t('manageMembers')}</span>
                                    </button>

                                    <button
                                      onClick={() => { setActiveDropdown(null); setEditingProject(project); }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Settings size={13} className="text-slate-400" />
                                      <span>{t('editProject')}</span>
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    <button
                                      onClick={(e) => handleDelete(e, project.id)}
                                      className="w-full px-3 py-1.5 hover:bg-red-50 text-left font-semibold text-red-600 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                      <span>{t('deleteProject')}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 min-h-[32px] leading-relaxed select-text">
                          {getLocalizedProjectDescription(project.description)}
                        </p>

                        {/* Coordinates */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-2 select-text">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {project.centerLon !== 0 || project.centerLat !== 0
                              ? `Lon: ${project.centerLon.toFixed(4)}, Lat: ${project.centerLat.toFixed(4)}`
                              : t('notDefined')}
                          </span>
                        </div>

                        {/* Data badges indicators */}
                        <div className="flex flex-wrap gap-1 mt-3.5 pt-3 border-t border-slate-100">
                          <DataBadge icon={<Image size={10} />} label="DOM" active={hasDOM} />
                          <DataBadge icon={<Box size={10} />} label="3D Mesh" active={hasModel} />
                          <DataBadge icon={<HardDrive size={10} />} label="Point Cloud" active={hasPC} />
                        </div>
                      </div>

                      {/* Card Footer / Stats */}
                      <div className="px-3 sm:px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-500 font-semibold select-none font-mono">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1" title={t('columnLayers')}>
                            <Layers size={12} className="text-slate-400" />
                            <span>{layersCount}</span>
                          </span>
                          <span className="flex items-center gap-1" title={t('columnMembers')}>
                            <Users size={12} className="text-slate-400" />
                            <span>{project.members?.length || 1}</span>
                          </span>
                        </div>

                        {/* Progress status button if building */}
                        {isThisProcessing ? (
                          <button
                            onClick={() => setShowPanel(true)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-[10px] text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer font-semibold"
                          >
                            <Terminal size={10} />
                            <span>{t('viewProgress')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/viewer/${project.id}`)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer font-bold font-sans"
                          >
                            <span>{t('openMap')}</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-12 select-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono">
                        <th className="py-3 px-4 w-1/3">{t('columnProject')}</th>
                        <th className="py-3 px-4">{t('columnRole')}</th>
                        <th className="py-3 px-4">{t('columnCoords')}</th>
                        <th className="py-3 px-4">{t('columnLayers')}</th>
                        <th className="py-3 px-4">{t('columnMembers')}</th>
                        <th className="py-3 px-4 text-right">{t('columnActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedProjects.map((project) => {
                        const isThisProcessing = pipeline.isProcessing && pipeline.projectId === project.id;
                        const hasDOM = !!project.domUrl;
                        const hasModel = !!project.modelUrl;
                        const hasPC = !!project.pointCloudId;

                        const isOwner = project.createdById === user?.id || project.members?.some(m => m.userId === user?.id && m.role === 'OWNER');
                        const memberRole = project.members?.find(m => m.userId === user?.id)?.role;

                        return (
                          <tr key={project.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-10 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                                  {isThisProcessing ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Loader2 size={12} className="animate-spin text-blue-500" />
                                    </div>
                                  ) : hasDOM && showProjectThumbnails ? (
                                    <img
                                      src={project.domUrl!}
                                      crossOrigin="anonymous"
                                      alt=""
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <MapPin size={14} />
                                    </div>
                                  )}
                                </div>
                                {/* Meta info */}
                                <div className="min-w-0">
                                  <span
                                    onClick={() => !isThisProcessing && navigate(`/viewer/${project.id}`)}
                                    className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer block truncate"
                                  >
                                    {project.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block truncate max-w-xs">{getLocalizedProjectDescription(project.description)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {project.isPublic ? (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
                                  {t('showcase')}
                                </span>
                              ) : isOwner ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                  {t('owner')}
                                </span>
                              ) : memberRole ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                  {memberRole === 'OWNER' ? t('owner') : memberRole === 'EDITOR' ? 'EDITOR' : t('viewer')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                  {t('private')}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap select-text">
                              <div>EPSG: {project.epsg}</div>
                              <div className="text-[10px] text-slate-400">
                                {project.centerLon !== 0 || project.centerLat !== 0
                                  ? `${project.centerLon.toFixed(4)}, ${project.centerLat.toFixed(4)}`
                                  : t('notDefined')}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${hasDOM ? 'bg-emerald-500' : 'bg-slate-300'}`} title="DOM" />
                                <span className="text-[10px] text-slate-500 mr-2 font-mono">DOM</span>
                                <span className={`w-2 h-2 rounded-full ${hasModel ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Mesh" />
                                <span className="text-[10px] text-slate-500 mr-2 font-mono">Mesh</span>
                                <span className={`w-2 h-2 rounded-full ${hasPC ? 'bg-emerald-500' : 'bg-slate-300'}`} title="PointCloud" />
                                <span className="text-[10px] text-slate-500 font-mono">Point</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {project.members?.length || 1}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {isThisProcessing ? (
                                  <button
                                    onClick={() => setShowPanel(true)}
                                    className="p-1.5 hover:bg-slate-100 rounded text-blue-600 flex items-center gap-1 cursor-pointer font-mono text-[10px]"
                                  >
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>{t('processing')}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate(`/viewer/${project.id}`)}
                                    className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 rounded bg-white transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <span>{t('btnOpen')}</span>
                                    <ArrowRight size={11} />
                                  </button>
                                )}

                                {/* Row dropdown menu trigger */}
                                <div className="relative dropdown-trigger">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === project.id ? null : project.id); }}
                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                                  >
                                    <MoreVertical size={14} />
                                  </button>

                                  {activeDropdown === project.id && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-30 dropdown-menu text-left text-xs font-sans">
                                      <button
                                        onClick={() => { setActiveDropdown(null); navigate(`/viewer/${project.id}`); }}
                                        className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Eye size={13} className="text-slate-400" />
                                        <span>{t('view3DMap')}</span>
                                      </button>

                                      {isAdmin && (
                                        <>
                                          <button
                                            onClick={(e) => handleTogglePublic(e, project)}
                                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            {project.isPublic ? <Lock size={13} className="text-slate-400" /> : <Globe size={13} className="text-slate-400" />}
                                            <span>{project.isPublic ? t('setPrivate') : t('setPublic')}</span>
                                          </button>

                                          <button
                                            onClick={() => { setActiveDropdown(null); setSelectedMemberProject({ id: project.id, name: project.name }); }}
                                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Users size={13} className="text-slate-400" />
                                            <span>{t('manageMembers')}</span>
                                          </button>

                                          <button
                                            onClick={() => { setActiveDropdown(null); setEditingProject(project); }}
                                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Settings size={13} className="text-slate-400" />
                                            <span>{t('editProject')}</span>
                                          </button>

                                          <div className="border-t border-slate-100 my-1" />

                                          <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="w-full px-3 py-1.5 hover:bg-red-50 text-left font-semibold text-red-600 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 size={13} />
                                            <span>{t('deleteProject')}</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* ── Modals & Overlay Dialogs ─────────────────────────────────── */}
        <ProjectFormModal
          language={currentLang}
          isOpen={isModalOpen || !!editingProject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
          onSubmit={handleSaveProject}
          project={editingProject}
        />

        {selectedMemberProject && (
          <ProjectMemberModal
            projectId={selectedMemberProject.id}
            projectName={selectedMemberProject.name}
            onClose={() => setSelectedMemberProject(null)}
          />
        )}

        <AdminLeadsModal
          isOpen={isLeadsModalOpen && !isCustomerView}
          onClose={() => setIsLeadsModalOpen(false)}
        />

        {/* Pipeline log status panel */}
        {showPanel && (
          <PipelinePanel
            logs={panelLogs}
            pipeline={pipeline}
            onClose={() => setShowPanel(false)}
          />
        )}

        {/* Dummy new folder dialog */}
        {showFolderAlert && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-blue-500 mx-auto">
                <FolderPlus size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('folderTitle')}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {t('folderDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowFolderAlert(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-blue-600/10"
              >
                {t('btnOk')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
