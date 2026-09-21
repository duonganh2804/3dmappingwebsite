import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  MapPinned,
} from 'lucide-react';

import { CesiumViewer } from '../components/Map/CesiumViewer';
import { DemoViewerTour } from '../components/Map/DemoViewerTour';
import { Button } from '../components/UI/Button';
import { fetchProjectById, fetchProjectSurveys } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import {
  useProjectStore,
  type Project,
  type ProjectSurvey,
} from '../store/useProjectStore';
import {
  openPerf,
  type ProjectSource,
} from '../components/Map/viewer/viewerOpenTelemetry';

const projectApiRequests = new Map<string, Promise<Project | null>>();
const surveyApiRequests = new Map<string, Promise<ProjectSurvey[]>>();

const fetchProjectOnce = (projectId: string) => {
  const pending = projectApiRequests.get(projectId);
  if (pending) return pending;

  openPerf.startProjectApi(projectId);
  const request = fetchProjectById(projectId)
    .finally(() => {
      openPerf.endProjectApi(projectId);
      projectApiRequests.delete(projectId);
    });
  projectApiRequests.set(projectId, request);
  return request;
};

const fetchSurveysOnce = (projectId: string) => {
  const pending = surveyApiRequests.get(projectId);
  if (pending) return pending;

  const request = fetchProjectSurveys(projectId)
    .finally(() => surveyApiRequests.delete(projectId));
  surveyApiRequests.set(projectId, request);
  return request;
};

const VIEWER_COPY = {
  vi: {
    dashboard: 'Bảng điều khiển',
    project: 'Dự án',
    loadingTitle: 'Đang mở không gian 3D',
    loadingDesc: 'Đang tải thông tin dự án và lớp dữ liệu...',
    notFound: 'Không tìm thấy dự án',
    notFoundDesc:
      'Dự án có thể đã bị xóa hoặc tài khoản hiện tại không còn quyền truy cập.',
    backDashboard: 'Quay lại Bảng điều khiển',
  },
  en: {
    dashboard: 'Dashboard',
    project: 'Project',
    loadingTitle: 'Opening 3D workspace',
    loadingDesc: 'Loading project information and data layers...',
    notFound: 'Project not found',
    notFoundDesc:
      'The project may have been deleted or your account no longer has access.',
    backDashboard: 'Back to Dashboard',
  },
  zh: {
    dashboard: '控制台',
    project: '项目',
    loadingTitle: '正在打开3D空间',
    loadingDesc: '正在加载项目信息和数据图层...',
    notFound: '未找到项目',
    notFoundDesc:
      '该项目可能已被删除，或当前账户已无访问权限。',
    backDashboard: '返回控制台',
  },
} as const;

const viewerPageStyle = `
  /* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
  /* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
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

  .viewer-page-status {
    background: #07111f;
    color: #e2e8f0;
  }

  .viewer-survey-timeline {
    position: absolute;
    bottom: 14px;
    left: 50%;
    z-index: 40;
    display: flex;
    max-width: min(680px, calc(100vw - 32px));
    transform: translateX(-50%);
    overflow-x: auto;
    gap: 4px;
    border: 1px solid rgba(71,85,105,.72);
    border-radius: 10px;
    padding: 4px;
    background: rgba(7,17,31,.94);
    box-shadow: 0 12px 30px rgba(2,6,23,.34);
    scrollbar-width: thin;
    backdrop-filter: blur(14px);
  }

  .viewer-survey-option {
    min-width: 92px;
    height: 34px;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 0 9px;
    color: #94a3b8;
    background: transparent;
    transition: background .14s ease, border-color .14s ease, color .14s ease;
  }

  .viewer-survey-option:hover {
    border-color: rgba(71,85,105,.72);
    color: #e2e8f0;
    background: rgba(30,41,59,.82);
  }

  .viewer-survey-option.is-active {
    border-color: rgba(14,165,233,.58);
    color: #e0f2fe;
    background: rgba(14,165,233,.16);
  }

  .viewer-survey-option-name,
  .viewer-survey-option-date {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .viewer-survey-option-name {
    font-size: 9px;
    font-weight: 650;
  }

  .viewer-survey-option-date {
    margin-top: 1px;
    color: #64748b;
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .viewer-survey-option.is-active .viewer-survey-option-date {
    color: #7dd3fc;
  }

  html[data-saolatek-theme='light']
  .viewer-page-status {
    background: #f3f6fa;
    color: #0f172a;
  }

`;

type ViewerLocationState = {
  project?: Project;
  openedAt?: number;
} | null;

const isViewerProjectEquivalent = (
  a: Project,
  b: Project
) =>
  a.id === b.id &&
  a.domUrl === b.domUrl &&
  a.metadataUrl === b.metadataUrl &&
  a.modelUrl === b.modelUrl &&
  a.pointCloudId === b.pointCloudId &&
  a.calibration === b.calibration &&
  a.centerLon === b.centerLon &&
  a.centerLat === b.centerLat &&
  a.epsg === b.epsg;

export const ViewerPage: React.FC = () => {
  const { currentLang } =
    useLanguage('vi');

  const c = VIEWER_COPY[currentLang];

  const { projectId } =
    useParams<{ projectId: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const {
    projects,
    setCurrentProject,
  } = useProjectStore();

  const navigationState =
    location.state as ViewerLocationState;

  const navigationProject = useMemo(() => {
    const candidate = navigationState?.project;

    if (!candidate || candidate.id !== projectId) {
      return null;
    }

    return candidate;
  }, [navigationState, projectId]);

  const storeProject = useMemo(
    () =>
      projects.find(
        (item) => item.id === projectId
      ) ?? null,
    [projects, projectId]
  );

  const bootstrapProject =
    navigationProject ??
    storeProject ??
    null;

  const projectSource: ProjectSource = navigationProject
    ? 'navigation-state'
    : storeProject
      ? 'project-store'
      : 'api';

  const [project, setProject] =
    useState<Project | null>(
      () => {
        if (projectId) {
          openPerf.markViewerPageMounted(
            projectId,
            projectSource,
            navigationState?.openedAt
          );
        }
        return bootstrapProject;
      }
    );

  const [loading, setLoading] =
    useState(() => !bootstrapProject);

  const validationRequestRef = useRef<{
    projectId: string;
    promise: Promise<Project | null>;
  } | null>(null);

  const surveyRequestRef = useRef<{
    projectId: string;
    promise: Promise<ProjectSurvey[]>;
  } | null>(null);

  const [surveyState, setSurveyState] = useState<{
    projectId: string | null;
    surveys: ProjectSurvey[];
  }>({ projectId: null, surveys: [] });
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(() =>
    typeof window !== 'undefined'
      ? window
          .matchMedia('(min-width: 64rem)')
          .matches
      : true
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia(
      '(min-width: 64rem)'
    );

    const handleBreakpointChange = (
      event: MediaQueryListEvent
    ) => {
      if (!event.matches) {
        setIsSidebarOpen(false);
      }
    };

    desktopQuery.addEventListener(
      'change',
      handleBreakpointChange
    );

    return () => {
      desktopQuery.removeEventListener(
        'change',
        handleBreakpointChange
      );
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    let active = true;

    const cachedProject =
      navigationProject ??
      projects.find(
        (item) => item.id === projectId
      ) ??
      null;

    if (cachedProject) {
      setProject((current) => {
        if (
          current &&
          isViewerProjectEquivalent(
            current,
            cachedProject
          )
        ) {
          return current;
        }

        return cachedProject;
      });

      setLoading(false);
      setCurrentProject(cachedProject.id);
    } else {
      setProject(null);
      setLoading(true);
    }

    const validateProject = async () => {
      try {
        if (validationRequestRef.current?.projectId !== projectId) {
          validationRequestRef.current = {
            projectId,
            promise: fetchProjectOnce(projectId),
          };
        }
        const data =
          await validationRequestRef.current.promise;

        if (!active) return;

        if (!data) {
          setProject(null);
          setLoading(false);
          setCurrentProject(null);
          return;
        }

        setCurrentProject(data.id);

        setProject((current) => {
          if (
            current &&
            isViewerProjectEquivalent(
              current,
              data
            )
          ) {
            return current;
          }

          return data;
        });

        setLoading(false);
      } catch (error) {
        if (!active) return;

        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (!cachedProject) {
          setProject(null);
          setLoading(false);
          setCurrentProject(null);
        } else {
          // Có bootstrap project thì giữ Viewer hoạt động
          // nếu background validation lỗi mạng tạm thời.
          setLoading(false);
        }

        if (import.meta.env.DEV) {
          console.error(
            '[ViewerPage] Project validation failed',
            error
          );
        }
      }
    };

    void validateProject();

    return () => {
      active = false;
      setCurrentProject(null);
    };
  }, [
    projectId,
    navigationProject,
    projects,
    setCurrentProject,
  ]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;

    const loadSurveys = async () => {
      try {
        if (surveyRequestRef.current?.projectId !== projectId) {
          surveyRequestRef.current = {
            projectId,
            promise: fetchSurveysOnce(projectId),
          };
        }

        const data = await surveyRequestRef.current.promise;
        if (!active) return;

        const surveys = [...data].sort(
          (a, b) =>
            new Date(b.capturedAt).getTime() -
            new Date(a.capturedAt).getTime()
        );
        setSurveyState({ projectId, surveys });
        setSelectedSurveyId(surveys[0]?.id ?? null);
      } catch (error) {
        if (!active) return;
        setSurveyState({ projectId, surveys: [] });
        setSelectedSurveyId(null);
        if (import.meta.env.DEV) {
          console.warn('[SurveyTimeline] Survey request failed; using legacy assets.', error);
        }
      }
    };

    void loadSurveys();
    return () => {
      active = false;
    };
  }, [projectId]);

  const surveys = surveyState.projectId === projectId
    ? surveyState.surveys
    : [];
  const selectedSurvey = surveys.find(
    (survey) => survey.id === selectedSurveyId
  ) ?? null;

  const surveysReady = !projectId || surveyState.projectId === projectId;
  const selectedSurveyDomUrl = selectedSurvey?.domUrl;
  const selectedSurveyMetadataUrl = selectedSurvey?.metadataUrl;
  const selectedSurveyModelUrl = selectedSurvey?.modelUrl;
  const selectedSurveyPointCloudId = selectedSurvey?.pointCloudId;
  const selectedSurveyCalibration = selectedSurvey?.calibration;
  const hasSelectedSurvey = selectedSurvey !== null;

  const viewerProject = useMemo<Project | null>(() => {
    if (!project || !hasSelectedSurvey) return project;

    const surveyProject = {
      ...project,
      domUrl: selectedSurveyDomUrl,
      metadataUrl: selectedSurveyMetadataUrl,
      modelUrl: selectedSurveyModelUrl,
      pointCloudId: selectedSurveyPointCloudId,
      calibration: selectedSurveyCalibration,
    };

    return isViewerProjectEquivalent(project, surveyProject)
      ? project
      : surveyProject;
  }, [
    project,
    hasSelectedSurvey,
    selectedSurveyDomUrl,
    selectedSurveyMetadataUrl,
    selectedSurveyModelUrl,
    selectedSurveyPointCloudId,
    selectedSurveyCalibration,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV || surveyState.projectId !== projectId) return;
    console.info('[SurveyTimeline]', {
      projectId,
      surveyCount: surveys.length,
      selectedSurveyId: selectedSurvey?.id ?? null,
      selectedCapturedAt: selectedSurvey?.capturedAt ?? null,
      usingLegacyAssets: !selectedSurvey,
    });
  }, [projectId, selectedSurvey, surveyState.projectId, surveys.length]);

  const projectIsStale = Boolean(project && project.id !== projectId);
  const waitingForSurveys = Boolean(project && !surveysReady);

  if (loading || projectIsStale || waitingForSurveys) {
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

  if (!project || !viewerProject) {
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
    <div className="viewer-option-b relative h-dvh min-h-0 w-full overflow-hidden bg-black">
      <style>{viewerPageStyle}</style>

      {surveys.length > 0 && (
        <div className="viewer-survey-timeline" aria-label="Survey timeline">
          {surveys.map((survey) => {
            const isActive = survey.id === selectedSurvey?.id;
            const capturedAt = new Intl.DateTimeFormat(
              currentLang === 'vi' ? 'vi-VN' : currentLang === 'zh' ? 'zh-CN' : 'en-US',
              { day: '2-digit', month: '2-digit', year: 'numeric' }
            ).format(new Date(survey.capturedAt));

            return (
              <button
                key={survey.id}
                type="button"
                aria-pressed={isActive}
                title={`${survey.name ?? capturedAt} · ${capturedAt}`}
                onClick={() => setSelectedSurveyId(survey.id)}
                className={`viewer-survey-option ${isActive ? 'is-active' : ''}`}
              >
                <span className="viewer-survey-option-name">
                  {survey.name ?? capturedAt}
                </span>
                <span className="viewer-survey-option-date">{capturedAt}</span>
              </button>
            );
          })}
        </div>
      )}

      <CesiumViewer
        projectId={viewerProject.id}
        surveyId={selectedSurvey?.id}
        projectName={viewerProject.name}
        sidebarHeaderAction={(
          <>
          {project.isPublic && (
            <DemoViewerTour key={project.id} onOpenSidebar={() => setIsSidebarOpen(true)} />
          )}
          <button
            type="button"
            aria-label="Bảng điều khiển"
            title="Bảng điều khiển"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--vs-border)] bg-[var(--vs-surface)] text-[var(--vs-text-soft)] transition hover:border-sky-500/35 hover:bg-[var(--vs-surface-hover)] hover:text-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={15} aria-hidden="true" />
          </button>
          </>
        )}
        project={viewerProject}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={
          setIsSidebarOpen
        }
      />
    </div>
  );
};
