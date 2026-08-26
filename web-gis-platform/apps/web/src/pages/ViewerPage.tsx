import React, { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  MapPinned,
} from 'lucide-react';

import { CesiumViewer } from '../components/Map/CesiumViewer';
import { Button } from '../components/UI/Button';
import { fetchProjectById } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import {
  useProjectStore,
  type Project,
} from '../store/useProjectStore';


const VIEWER_COPY = {
  vi: {
    dashboard: 'Bảng điều khiển',
    project: 'Dự án',
    loadingTitle: 'Đang mở không gian 3D',
    loadingDesc: 'Đang tải thông tin dự án và lớp dữ liệu...',
    notFound: 'Không tìm thấy dự án',
    notFoundDesc: 'Dự án có thể đã bị xóa hoặc tài khoản hiện tại không còn quyền truy cập.',
    backDashboard: 'Quay lại Bảng điều khiển',
  },
  en: {
    dashboard: 'Dashboard',
    project: 'Project',
    loadingTitle: 'Opening 3D workspace',
    loadingDesc: 'Loading project information and data layers...',
    notFound: 'Project not found',
    notFoundDesc: 'The project may have been deleted or your account no longer has access.',
    backDashboard: 'Back to Dashboard',
  },
  zh: {
    dashboard: '控制台',
    project: '项目',
    loadingTitle: '正在打开3D空间',
    loadingDesc: '正在加载项目信息和数据图层...',
    notFound: '未找到项目',
    notFoundDesc: '该项目可能已被删除，或当前账户已无访问权限。',
    backDashboard: '返回控制台',
  },
} as const;

const viewerPageStyle = `
  .viewer-option-b {
    --vp-panel: rgba(8,19,33,.93);
    --vp-panel-strong: #07111f;
    --vp-surface: rgba(15,23,42,.82);
    --vp-hover: rgba(30,41,59,.90);
    --vp-border: rgba(71,85,105,.56);
    --vp-border-soft: rgba(51,65,85,.50);
    --vp-text: #e2e8f0;
    --vp-soft: #94a3b8;
    --vp-muted: #64748b;
    --vp-accent: #0ea5e9;
    --vp-shadow: 0 14px 34px rgba(2,6,23,.26);
  }

  html[data-saolatek-theme='light']
  .viewer-option-b {
    --vp-panel: rgba(255,255,255,.96);
    --vp-panel-strong: #ffffff;
    --vp-surface: #f8fafc;
    --vp-hover: #f1f5f9;
    --vp-border: rgba(148,163,184,.48);
    --vp-border-soft: rgba(203,213,225,.84);
    --vp-text: #0f172a;
    --vp-soft: #475569;
    --vp-muted: #64748b;
    --vp-accent: #0284c7;
    --vp-shadow: 0 14px 32px rgba(15,23,42,.12);
  }

  .viewer-project-dock {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }

  .viewer-back-button {
    height: 38px !important;
    border: 1px solid var(--vp-border) !important;
    border-radius: 11px !important;
    background: var(--vp-panel) !important;
    color: var(--vp-text) !important;
    box-shadow: var(--vp-shadow) !important;
    backdrop-filter: blur(16px);
  }

  .viewer-back-button:hover {
    background: var(--vp-hover) !important;
    border-color: rgba(14,165,233,.32) !important;
  }

  .viewer-project-chip {
    max-width: 210px;
    height: 34px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--vp-border);
    border-radius: 11px;
    padding: 0 11px;
    background: var(--vp-panel);
    color: var(--vp-soft);
    box-shadow: 0 8px 20px rgba(2,6,23,.16);
    backdrop-filter: blur(16px);
    font-size: 10px;
    font-weight: 650;
  }

  .viewer-project-chip strong {
    overflow: hidden;
    color: var(--vp-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .viewer-project-chip-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,.10);
  }

  .viewer-page-status {
    background: #07111f;
    color: #e2e8f0;
  }

  html[data-saolatek-theme='light']
  .viewer-page-status {
    background: #f3f6fa;
    color: #0f172a;
  }

  /*
   * Admin Calibration panel:
   * CSS-only skin; all input handlers and calibration logic remain inside
   * CesiumViewer untouched.
   */
  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80'] {
    width: 310px !important;
    border-color: var(--vp-border) !important;
    border-radius: 16px !important;
    background: var(--vp-panel) !important;
    color: var(--vp-soft) !important;
    box-shadow: var(--vp-shadow) !important;
    backdrop-filter: blur(18px) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='border-slate-900'],
  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='border-slate-800'] {
    border-color: var(--vp-border-soft) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='bg-slate-950'] {
    background: var(--vp-panel-strong) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='bg-slate-900'] {
    background: var(--vp-surface) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='text-slate-300'],
  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  [class~='text-slate-400'] {
    color: var(--vp-soft) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  input {
    border-color: var(--vp-border-soft) !important;
    border-radius: 7px !important;
    background: var(--vp-surface) !important;
    color: var(--vp-text) !important;
  }

  .viewer-option-b
  [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
  button {
    box-shadow: none !important;
  }

  @media (max-width: 1320px) {
    .viewer-project-chip {
      display: none;
    }
  }
`;

export const ViewerPage: React.FC = () => {
  const { currentLang } =
    useLanguage('vi');
  const c = VIEWER_COPY[currentLang];

  const { projectId } =
    useParams<{ projectId: string }>();

  const navigate = useNavigate();

  const { setCurrentProject } =
    useProjectStore();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      setLoading(true);

      const data =
        await fetchProjectById(projectId);

      if (data) {
        setProject(data);
        setCurrentProject(data.id);
      }

      setLoading(false);
    };

    loadProject();

    return () => {
      setCurrentProject(null);
    };
  }, [projectId, setCurrentProject]);

  if (loading) {
    return (
      <>
        <style>{viewerPageStyle}</style>

        <div className="viewer-page-status flex h-dvh w-full flex-col items-center justify-center gap-4 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/[0.08]">
            <Loader2
              size={23}
              className="animate-spin text-sky-500"
            />
          </div>

          <div className="text-center">
            <div className="text-sm font-semibold">
              {c.loadingTitle}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {c.loadingDesc}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <style>{viewerPageStyle}</style>

        <div className="viewer-page-status flex h-dvh w-full flex-col items-center justify-center px-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-400/30 bg-slate-500/[0.08]">
            <MapPinned
              size={22}
              className="text-slate-500"
            />
          </div>

          <h2 className="mb-2 text-lg font-semibold">
            {c.notFound}
          </h2>

          <p className="mb-5 max-w-md text-center text-sm leading-6 text-slate-500">
            {c.notFoundDesc}
          </p>

          <Button
            onClick={() =>
              navigate('/dashboard')
            }
            variant="secondary"
          >
            {c.backDashboard}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="viewer-option-b relative h-screen w-full overflow-hidden bg-black">
      <style>{viewerPageStyle}</style>

      <div
        className={`viewer-project-dock absolute top-3 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'left-[308px]'
            : 'left-3'
        }`}
      >
        <Button
          variant="secondary"
          size="sm"
          className="viewer-back-button gap-2 px-3"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          <ArrowLeft size={15} />
          {c.dashboard}
        </Button>

        <div
          className="viewer-project-chip"
          title={project.name}
        >
          <span className="viewer-project-chip-dot" />
          <span>{c.project}</span>
          <strong>{project.name}</strong>
        </div>
      </div>

      <CesiumViewer
        projectId={project.id}
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={
          setIsSidebarOpen
        }
      />
    </div>
  );
};