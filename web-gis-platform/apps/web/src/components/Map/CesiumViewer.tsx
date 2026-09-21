import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { installTranslucentPickComputeGuard } from './viewer/translucentPickComputeGuard';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { PotreeSidebar, type LayerLoadStatus } from './PotreeSidebar';
import { UnifiedToolbar, type DisplayMode, type ViewAngle } from './UnifiedToolbar';
import { MeasurementManager, type MeasurementManagerItem } from './MeasurementManager';
import {
  clearProjectMeasurements,
  createProjectMeasurement,
  deleteProjectMeasurement,
  fetchProjectById,
  fetchProjectMeasurements,
  updateProjectMeasurement,
  fetchProjectIssues,
  createProjectIssue,
  updateProjectIssue,
  deleteProjectIssue,
} from '../../services/api';
import type { IssueStatus, ProjectIssue } from '../../services/api';
import type { CrossSectionResult, CutFillReferenceMode, CutFillResult, MeasurementRecord, ProfileResult, ProfileSample } from './measurementTypes';
import { deserializeMeasurement, serializeMeasurementRecord } from './measurementPersistence';
import {
  buildAreaReferencePlane,
  buildControlProfilePreview,
  buildProfileSamplePlan,
  calculateAngleDegrees,
  calculateCentroid,
  calculatePolygonArea,
  getMidpoint,
  getMeasurementTypeLabel,
  getMeasurementValue,
  getProjectedPoint,
  MEASUREMENT_RING_DOT_GLOW_IMAGE,
  MEASUREMENT_RING_DOT_IMAGE,
  normalizeAreaPoints,
  projectPointToPlane,
} from './measurementUtils';
import { ClippingController, type ClipTool } from './clippingController';
import { useCameraNavigation } from './navigation/useCameraNavigation';
import { useHeatmap } from './heatmap/useHeatmap';
import {
  AREA_SURFACE_PLANE_MAX_DISTANCE,
  DEFAULT_POINT_SIZE,
  MEASUREMENT_SURFACE_DRAG_SENSITIVITY,
} from './viewer/constants';
import { isFiniteCartesian } from './viewer/geometry';
import { usePointCloudAppearance } from './viewer/pointCloud/usePointCloudAppearance';
import { ProfilePanel } from './viewer/profile/ProfilePanel';
import { CrossSectionPanel } from './viewer/profile/CrossSectionPanel';
import { buildCrossSectionAlignment, profileResultFromRecord, replaceCrossSectionEntities, type CrossSectionSettings } from './viewer/profile/crossSectionUtils';
import { VolumePanel } from './viewer/volume/VolumePanel';
import { buildThreePointReferencePlane, buildVolumeGrid, calculateCutFill, sampleVolumeGrid, yieldToMainThread, type GridPlan, type VolumeElevationSample, type VolumeSamplingTimings } from './viewer/volume/volumeUtils';
import { IssuePanel, type IssueDraft } from './viewer/issues/IssuePanel';
import { issueColor } from './viewer/issues/issueUtils';
import { finishInteractiveTool, setCameraInteractionEnabled } from './viewer/interaction/toolInteraction';
import { getSceneSurfacePosition } from './viewer/interaction/surfacePicking';
import { useLanguage } from '../../hooks/useLanguage';
import {
  appendDomAssetVersion,
  classifyPointCloudSource,
  getPointCloudIndexBaseUrl,
  isCopcTilesIndex,
  resolvePointCloudTileUrl,
} from './loaders/sourceUtils';
import type { Project } from '../../store/useProjectStore';
import { openPerf } from './viewer/viewerOpenTelemetry';
import {
  installPickPositionDiagnostics,
  logImageryEvent,
  logLifecycleEvent,
  registerLifecycleResource,
} from './viewer/lifecycleDiagnostics';

export type { MeasurementRecord, MeasureTarget, ProfileResult, ProfileSample, ToolMode } from './measurementTypes';
import type { ToolMode } from './measurementTypes';
type ClipMode = 'none' | 'highlight' | 'inside' | 'outside';
type ClipFilter = 'any' | 'all';
type ViewerPhase = 'initializing' | 'waiting-project' | 'flying-to-project' | 'ready' | 'error';
type SceneBackground = 'sky' | 'gradient' | 'black' | 'white' | 'none';
type InitialBoundsSource = 'point-cloud-root' | 'dom-metadata' | 'glb' | 'project-extent' | 'project-center';
type PrimaryVisualType = 'point-cloud' | 'dom' | 'model' | 'fallback';
type InitialCameraRun = {
  projectId?: string;
  generation: number;
  startedAt: number;
  boundsSource?: InitialBoundsSource;
  boundsReadyMs?: number;
  bounds?: Cesium.BoundingSphere;
  boundsCandidates?: Partial<Record<InitialBoundsSource, Cesium.BoundingSphere>>;
  primaryVisualType?: PrimaryVisualType;
  primaryVisualRootReadyMs?: number;
  primaryVisualReadyMs?: number;
  earthIntroMs?: number;
  viewerReadyMs?: number;
  flyStartMs?: number;
  flyDuration?: number;
  flyCompleteMs?: number;
  fitRadius?: number;
  fitRange?: number;
  userInteracted: boolean;
  cancelled: boolean;
  started: boolean;
  completed: boolean;
  finalized: boolean;
};
type ViewerPerfMilestone = 'cesiumReadyMs' | 'firstUsableMs' | 'modelReadyMs' | 'pointCloudReadyMs' | 'domReadyMs';
type ViewerPerfTiming = {
  projectId?: string;
  startedAt: number;
  cesiumReadyMs?: number;
  firstUsableMs?: number;
  modelReadyMs?: number;
  pointCloudReadyMs?: number;
  domReadyMs?: number;
};

type SharedJsonRequest = {
  url: string;
  controller: AbortController;
  promise: Promise<any>;
};

const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  (!!error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError');

const applySceneBackground = (
  viewer: Cesium.Viewer,
  background: SceneBackground,
  displayMode: DisplayMode,
) => {
  const { scene } = viewer;
  const isolatesProjectLayer = displayMode === 'model3d' || displayMode === 'pointcloud';
  const showSky = !isolatesProjectLayer && background === 'sky';

  scene.globe.show = showSky;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = showSky;
  if (scene.skyBox) scene.skyBox.show = showSky;

  switch (background) {
    case 'sky':
      scene.backgroundColor = isolatesProjectLayer
        ? Cesium.Color.fromCssColorString('#090d16')
        : Cesium.Color.BLACK;
      break;
    case 'gradient':
      scene.backgroundColor = Cesium.Color.fromCssColorString('#090d16');
      break;
    case 'black':
      scene.backgroundColor = Cesium.Color.BLACK;
      break;
    case 'white':
      scene.backgroundColor = Cesium.Color.WHITE;
      break;
    case 'none':
      scene.backgroundColor = Cesium.Color.TRANSPARENT;
      break;
  }
};

const hashStableString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const getStableProjectAssetVersion = (project: any, assetUrl: string) => {
  const candidates = [
    project?.domVersion,
    project?.domUpdatedAt,
    project?.assetsUpdatedAt,
    project?.updatedAt,
    project?.version,
    project?.createdAt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return Math.max(1, Math.round(candidate));
    if (typeof candidate === 'string' && candidate.trim()) {
      const timestamp = Date.parse(candidate);
      if (Number.isFinite(timestamp)) return Math.max(1, timestamp);
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) return Math.max(1, Math.round(numeric));
    }
  }

  // Stable fallback: same project + same asset URL keeps the same browser/CDN key
  // across warm re-entry instead of producing a brand-new ?cb=Date.now() URL.
  return Math.max(1, hashStableString(`${project?.id ?? 'project'}|${assetUrl}`));
};


const getProjectLayerIdentity = (project: any, surveyId?: string) => [
  String(project?.id ?? ''),
  String(surveyId ?? ''),
  String(project?.modelUrl ?? ''),
  String(project?.pointCloudId ?? ''),
].join('|');


const buildAdaptiveProjectCameraSphere = (
  geographicBounds: Cesium.BoundingSphere,
  modelBounds?: Cesium.BoundingSphere,
) => {
  const geographicRadius = Math.max(10, geographicBounds.radius);
  if (!modelBounds || !Number.isFinite(modelBounds.radius) || modelBounds.radius <= 0) {
    return Cesium.BoundingSphere.clone(geographicBounds);
  }

  // Keep the calibrated DOM/project center as the geographic truth, but let the
  // model size tighten the overview. Small-footprint projects otherwise inherit
  // a large DOM radius and look unnecessarily far away (e.g. SHTP / Quy Nhon).
  // The factor is continuous by relative model coverage, not by project ID.
  const coverageRatio = Cesium.Math.clamp(modelBounds.radius / geographicRadius, 0, 1);
  const geographicFloorFactor = coverageRatio < 0.2
    ? 0.36
    : coverageRatio < 0.4
      ? 0.40
      : 0.44;
  const framingRadius = Math.min(
    geographicRadius,
    Math.max(modelBounds.radius * 1.8, geographicRadius * geographicFloorFactor, 30),
  );

  return new Cesium.BoundingSphere(geographicBounds.center, framingRadius);
};

const markViewerPerf = (
  timingRef: React.RefObject<ViewerPerfTiming>,
  milestone: ViewerPerfMilestone,
) => {
  if (!import.meta.env.DEV || timingRef.current[milestone] !== undefined) return;
  timingRef.current[milestone] = Math.round(performance.now() - timingRef.current.startedAt);
  console.info('[ViewerPerf]', {
    projectId: timingRef.current.projectId,
    cesiumReadyMs: timingRef.current.cesiumReadyMs,
    firstUsableMs: timingRef.current.firstUsableMs,
    modelReadyMs: timingRef.current.modelReadyMs,
    pointCloudReadyMs: timingRef.current.pointCloudReadyMs,
    domReadyMs: timingRef.current.domReadyMs,
  });
};

const VIEWER_LOADING_COPY = {
  vi: {
    loadingProject: 'Đang tải dữ liệu dự án...',
    loadingProjectHint: 'Vui lòng chờ trong giây lát',
    positioningProject: 'Đang định vị khu vực dự án...',
    loadingModel: 'Đang tải mô hình...',
    loadingPointCloud: 'Đang tải Point Cloud...',
    loadingDom: 'Đang tải ảnh trực giao...',
    loadError: 'Không thể tải dữ liệu dự án',
  },
  en: {
    loadingProject: 'Loading project data...',
    loadingProjectHint: 'Please wait a moment',
    positioningProject: 'Positioning project area...',
    loadingModel: 'Loading 3D model...',
    loadingPointCloud: 'Loading Point Cloud...',
    loadingDom: 'Loading orthophoto...',
    loadError: 'Unable to load project data',
  },
  zh: {
    loadingProject: '正在加载项目数据...',
    loadingProjectHint: '请稍候',
    positioningProject: '正在定位项目区域...',
    loadingModel: '正在加载三维模型...',
    loadingPointCloud: '正在加载点云...',
    loadingDom: '正在加载正射影像...',
    loadError: '无法加载项目数据',
  },
} as const;

export const CesiumViewer: React.FC<{
  projectId?: string;
  surveyId?: string;
  projectName?: string;
  project?: Project;
  isSidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  sidebarHeaderAction?: React.ReactNode;
}> = ({
  projectId,
  surveyId,
  projectName = 'Dự án 3D',
  project: suppliedProject,
  isSidebarOpen = true,
  onToggleSidebar,
  sidebarHeaderAction
}) => {
    const { currentLang } = useLanguage('vi');
    const loadingCopy = VIEWER_LOADING_COPY[currentLang];
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    const cesiumContainer = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);
    const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

    const modelRef = useRef<Cesium.Model | null>(null);
    const domLayerRef = useRef<Cesium.ImageryLayer | null>(null);
    const pointCloudRef = useRef<Cesium.Cesium3DTileset | null>(null);
    const measurementEntitiesRef = useRef<Cesium.Entity[]>([]);
    const crossSectionEntitiesRef = useRef<Cesium.Entity[]>([]);
    const cutFillEntitiesRef = useRef<Cesium.Entity[]>([]);
    const cutFillReferenceEntitiesRef = useRef<Cesium.Entity[]>([]);
    const cutFillDataRef = useRef<{ polygon: Cesium.Cartesian3[]; polygonKey: string; plan: GridPlan; elevations: VolumeElevationSample[]; requestedSpacing: number; surfaceKey: string } | null>(null);
    const cutFillCalculationGenerationRef = useRef(0);
    const cutFillSurfaceIdsRef = useRef({ ids: new WeakMap<object, number>(), nextId: 1 });
    const issueEntitiesRef = useRef<Cesium.Entity[]>([]);
    const issuesRef = useRef<ProjectIssue[]>([]);
    const issuesFetchedProjectRef = useRef<string | null>(null);
    const measurementsStoreRef = useRef<MeasurementRecord[]>([]);
    const measurementPersistenceQueueRef = useRef(new Map<string, Promise<void>>());
    const hydratedMeasurementsProjectRef = useRef<string | null>(null);
    const measurementCameraStateRef = useRef<Record<string, boolean> | null>(null);
    const measurementCameraLockOwnerRef = useRef(false);
    const measurementDragCancelRef = useRef<(() => void) | null>(null);
    const measurementDragHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
    const areaReferencePlanesRef = useRef(new Map<string, Cesium.Plane>());
    const clippingControllerRef = useRef<ClippingController | null>(null);
    // Lazy load: track whether PC đã được load (tránh load lại nhiều lần)
    const pointCloudLoadedRef = useRef(false);

    const [project, setProject] = useState<any>(suppliedProject ?? null);
    const [toolMode, setToolMode] = useState<ToolMode>('none');
    const [measurementPoints, setMeasurementPoints] = useState<Cesium.Cartesian3[]>([]);
    const [measurementRevision, setMeasurementRevision] = useState(0);
    const [crossSection, setCrossSection] = useState<CrossSectionResult | null>(null);
    const [crossSectionBusy, setCrossSectionBusy] = useState(false);
    const [crossSectionSettings, setCrossSectionSettings] = useState<CrossSectionSettings>({ leftWidth: 20, rightWidth: 20, spacing: 0.5 });
    const [cutFillResult, setCutFillResult] = useState<CutFillResult | null>(null);
    const [cutFillReferenceMode, setCutFillReferenceMode] = useState<CutFillReferenceMode>('average');
    const [cutFillDesignElevation, setCutFillDesignElevation] = useState(0);
    const [cutFillGridSpacing, setCutFillGridSpacing] = useState(1);
    const [cutFillBusy, setCutFillBusy] = useState(false);
    const [cutFillProgress, setCutFillProgress] = useState<number | null>(null);
    const [cutFillPolygonReady, setCutFillPolygonReady] = useState(false);
    const [cutFillReferencePoints, setCutFillReferencePoints] = useState<Cesium.Cartesian3[]>([]);
    const [selectingCutFillReferencePoints, setSelectingCutFillReferencePoints] = useState(false);
    const [cutFillReferenceError, setCutFillReferenceError] = useState<string | null>(null);
    const [issues, setIssues] = useState<ProjectIssue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<ProjectIssue | null>(null);
    const [pendingIssuePosition, setPendingIssuePosition] = useState<Cesium.Cartesian3 | null>(null);
    const [issueFilter, setIssueFilter] = useState<IssueStatus | 'ALL'>('ALL');
    const [issueBusy, setIssueBusy] = useState(false);
    const [viewerPhase, setViewerPhase] = useState<ViewerPhase>('initializing');

    const clearCutFillReferenceEntities = () => {
      const viewer = viewerRef.current;
      cutFillReferenceEntitiesRef.current.forEach(entity => {
        try { if (viewer && !viewer.isDestroyed()) viewer.entities.remove(entity); } catch (_error) {}
      });
      cutFillReferenceEntitiesRef.current = [];
      if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
    };

    useEffect(() => {
      const clearCrossSectionEntities = () => {
        const viewer = viewerRef.current;
        crossSectionEntitiesRef.current.forEach(entity => {
          try {
            if (viewer && !viewer.isDestroyed()) viewer.entities.remove(entity);
          } catch (_error) {}
        });
        crossSectionEntitiesRef.current = [];
      };
      clearCrossSectionEntities();
      const viewer = viewerRef.current;
      cutFillEntitiesRef.current.forEach(entity => {
        try { if (viewer && !viewer.isDestroyed()) viewer.entities.remove(entity); } catch (_error) {}
      });
      cutFillEntitiesRef.current = [];
      clearCutFillReferenceEntities();
      cutFillDataRef.current = null;
      cutFillCalculationGenerationRef.current += 1;
      setCutFillBusy(false);
      setCutFillProgress(null);
      setCutFillPolygonReady(false);
      setCutFillReferencePoints([]);
      setSelectingCutFillReferencePoints(false);
      setCutFillReferenceError(null);
      setCrossSection(null);
      setCutFillResult(null);
      return () => {
        clearCrossSectionEntities();
        clearCutFillReferenceEntities();
      };
    }, [projectId]);

    useEffect(() => {
      if (!projectId || issuesFetchedProjectRef.current === projectId) return;
      issuesFetchedProjectRef.current = projectId;
      let cancelled = false;
      void fetchProjectIssues(projectId).then(data => {
        if (cancelled) return;
        issuesRef.current = data;
        setIssues(data);
      }).catch(error => console.error('[Issues] load:', error));
      return () => {
        cancelled = true;
        issuesFetchedProjectRef.current = null;
        issuesRef.current = [];
        setIssues([]);
        setSelectedIssue(null);
        setPendingIssuePosition(null);
      };
    }, [projectId]);

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      issueEntitiesRef.current.forEach(entity => { try { viewer.entities.remove(entity); } catch (_error) {} });
      issueEntitiesRef.current = issues.filter(issue => issueFilter === 'ALL' || issue.status === issueFilter).map(issue => {
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(issue.longitude, issue.latitude, issue.height),
          point: { pixelSize: selectedIssue?.id === issue.id ? 15 : 11, color: issueColor(issue.severity), outlineColor: Cesium.Color.WHITE, outlineWidth: selectedIssue?.id === issue.id ? 3 : 1.5, disableDepthTestDistance: Number.POSITIVE_INFINITY },
          label: { text: issue.title, font: '11px sans-serif', showBackground: true, backgroundColor: Cesium.Color.BLACK.withAlpha(0.75), pixelOffset: new Cesium.Cartesian2(0, -20), distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000), disableDepthTestDistance: Number.POSITIVE_INFINITY },
        });
        (entity as any).__issueId = issue.id;
        return entity;
      });
      const issueClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      issueClickHandler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
        if (toolMode !== 'none') return;
        const picked = viewer.scene.pick(click.position);
        const entity = picked?.id instanceof Cesium.Entity ? picked.id : picked?.primitive?.id;
        const issue = issuesRef.current.find(item => item.id === (entity as any)?.__issueId);
        if (issue) { setSelectedIssue(issue); setPendingIssuePosition(null); }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      viewer.scene.requestRender();
      return () => {
        if (!issueClickHandler.isDestroyed()) issueClickHandler.destroy();
        issueEntitiesRef.current.forEach(entity => { try { if (!viewer.isDestroyed()) viewer.entities.remove(entity); } catch (_error) {} });
        issueEntitiesRef.current = [];
      };
    }, [issues, issueFilter, selectedIssue?.id, toolMode, viewerPhase]);
    const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
    const [viewAngle, setViewAngle] = useState<ViewAngle>('default');
    const [activeCameraView, setActiveCameraView] = useState<'L' | 'R' | 'F' | 'B' | 'T' | 'D' | null>(null);
    const [isFocusPicking, setIsFocusPicking] = useState(false);
    const [isZoomAreaSelecting, setIsZoomAreaSelecting] = useState(false);
    const [zoomAreaRect, setZoomAreaRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    const [isReturningFocusOrigin, setIsReturningFocusOrigin] = useState(false);
    const [hasFocusedTarget, setHasFocusedTarget] = useState(false);
    const focusOriginRef = useRef<{
      destination: Cesium.Cartesian3;
      heading: number;
      pitch: number;
      roll: number;
    } | null>(null);
    const suppressPresetClearRef = useRef(false);
    const [cameraHeading, setCameraHeading] = useState(0);
    const [clipMode, setClipMode] = useState<ClipMode>('highlight');
    const [clipFilter, setClipFilter] = useState<ClipFilter>('any');
    const [activeClipTool, setActiveClipTool] = useState<ClipTool | null>(null);
    const [clipInstruction, setClipInstruction] = useState<string | null>(null);

    const getAreaReferencePlane = (record: MeasurementRecord) => {
      const existing = areaReferencePlanesRef.current.get(record.id);
      if (existing) return existing;
      const plane = record.type === 'area' ? buildAreaReferencePlane(record.points) : null;
      if (plane) areaReferencePlanesRef.current.set(record.id, plane);
      return plane;
    };

    const getMeasurementCameraFlags = (controller: Cesium.ScreenSpaceCameraController) => ({
      enableInputs: controller.enableInputs,
      enableRotate: controller.enableRotate,
      enableTranslate: controller.enableTranslate,
      enableZoom: controller.enableZoom,
      enableTilt: controller.enableTilt,
      enableLook: controller.enableLook,
    });

    const lockMeasurementCamera = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || measurementCameraLockOwnerRef.current) return;
      const controller = viewer.scene.screenSpaceCameraController;
      const before = getMeasurementCameraFlags(controller);
      measurementCameraStateRef.current = before;
      measurementCameraLockOwnerRef.current = true;
      controller.enableInputs = controller.enableRotate = controller.enableTranslate = false;
      controller.enableZoom = controller.enableTilt = controller.enableLook = false;
      console.info('[MEASURE CAMERA] LOCK', { before, after: getMeasurementCameraFlags(controller) });
    };

    const restoreMeasurementCamera = () => {
      const viewer = viewerRef.current;
      if (!measurementCameraLockOwnerRef.current) {
        if (viewer && !viewer.isDestroyed()) {
          const current = getMeasurementCameraFlags(viewer.scene.screenSpaceCameraController);
          console.info('[MEASURE CAMERA] RESTORE', { owner: false, before: current, after: current });
        }
        return;
      }
      const savedState = measurementCameraStateRef.current;
      measurementCameraStateRef.current = null;
      measurementCameraLockOwnerRef.current = false;
      if (!viewer || viewer.isDestroyed() || !savedState) return;
      const controller = viewer.scene.screenSpaceCameraController;
      const before = getMeasurementCameraFlags(controller);
      Object.assign(controller, savedState);
      console.info('[MEASURE CAMERA] RESTORE', { before, after: getMeasurementCameraFlags(controller) });
    };

    // State loading model: hiện spinner khi đang fetch/parse glTF
    const [modelLoadStatus, setModelLoadStatus] = useState<LayerLoadStatus>('idle');
    const [pointCloudLoadStatus, setPointCloudLoadStatus] = useState<LayerLoadStatus>('idle');
    const [domLoadStatus, setDomLoadStatus] = useState<LayerLoadStatus>('idle');
    const [cesiumReady, setCesiumReady] = useState(false);
    const [firstProjectBoundsReady, setFirstProjectBoundsReady] = useState(false);
    const [primaryVisualReady, setPrimaryVisualReady] = useState(false);
    const [earthRotationActive, setEarthRotationActive] = useState(false);
    const [initialFlyStarted, setInitialFlyStarted] = useState(false);
    const [initialFlyCompleted, setInitialFlyCompleted] = useState(false);
    const [modelLoadError, setModelLoadError] = useState<string | null>(null);
    const [pointCloudLoadError, setPointCloudLoadError] = useState<string | null>(null);
    const [domLoadError, setDomLoadError] = useState<string | null>(null);
    const [domLoadAttempt, setDomLoadAttempt] = useState(0);
    const modelLoadGenerationRef = useRef(0);
    const pointCloudLoadGenerationRef = useRef(0);
    const lastLoggedViewerPhaseRef = useRef<ViewerPhase | null>(null);
    const viewerPerfRef = useRef<ViewerPerfTiming>({ projectId, startedAt: performance.now() });
    const domLoadGenerationRef = useRef(0);
    const metadataRequestRef = useRef<SharedJsonRequest | null>(null);
    const domImageAbortRef = useRef<AbortController | null>(null);
    const pointCloudIndexAbortRef = useRef<AbortController | null>(null);
    const terrainLoadStartedRef = useRef(false);
    const retryModelRef = useRef<() => void>(() => undefined);
    const retryPointCloudRef = useRef<() => void>(() => undefined);
    const modelLoadInFlightRef = useRef<{ key: string; generation: number } | null>(null);
    const pointCloudLoadInFlightRef = useRef<{ key: string; generation: number } | null>(null);
    const activeLayerProjectRef = useRef<Project | null>(null);
    const activeLayerKeyRef = useRef<string | null>(null);
    const projectLayerKey = getProjectLayerIdentity(project, surveyId);
    const initialCameraGenerationRef = useRef(0);
    const stopEarthRotationRef = useRef<() => void>(() => undefined);
    const initialVisualCleanupRef = useRef<Array<() => void>>([]);
    const initialCameraRunRef = useRef<InitialCameraRun>({
      projectId,
      generation: 0,
      startedAt: performance.now(),
      boundsCandidates: {},
      userInteracted: false,
      cancelled: false,
      started: false,
      completed: false,
      finalized: false,
    });

    const getProjectMetadata = (url: string) => {
      const existing = metadataRequestRef.current;
      if (existing?.url === url) return existing.promise;

      existing?.controller.abort();
      const controller = new AbortController();
      const request: SharedJsonRequest = {
        url,
        controller,
        promise: Promise.resolve(null),
      };
      if (projectId) openPerf.startDomMetadata(projectId);
      request.promise = fetch(url, {
        signal: controller.signal,
        cache: 'default',
      })
        .then(response => {
          if (!response.ok) throw new Error(`Metadata request failed: HTTP ${response.status}`);
          return response.json();
        })
        .catch(error => {
          if (metadataRequestRef.current === request) metadataRequestRef.current = null;
          throw error;
        })
        .finally(() => {
          if (projectId) openPerf.endDomMetadata(projectId);
        });
      metadataRequestRef.current = request;
      return request.promise;
    };

    const logInitialCamera = (run: InitialCameraRun) => {
      if (!import.meta.env.DEV) return;
      console.info('[ViewerStartup]', {
        projectId: run.projectId,
        generation: run.generation,
        boundsSource: run.boundsSource,
        boundsReadyMs: run.boundsReadyMs,
        primaryVisualType: run.primaryVisualType,
        primaryVisualRootReadyMs: run.primaryVisualRootReadyMs,
        primaryVisualReadyMs: run.primaryVisualReadyMs,
        earthIntroMs: run.earthIntroMs,
        viewerReadyMs: run.viewerReadyMs,
        flyStartMs: run.flyStartMs,
        flyDuration: run.flyDuration,
        flyCompleteMs: run.flyCompleteMs,
        fitRadius: run.fitRadius,
        fitRange: run.fitRange,
        userInteracted: run.userInteracted,
        cancelled: run.cancelled,
        finalized: run.finalized,
      });
    };

    const finalizeInitialCameraAfterFrame = (
      run: InitialCameraRun,
      completed: boolean,
      cancelled: boolean,
    ) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || initialCameraRunRef.current !== run || run.finalized) return;
      run.completed = completed;
      run.cancelled = cancelled;
      run.flyCompleteMs = Math.round(performance.now() - run.startedAt);
      const removePostRender = viewer.scene.postRender.addEventListener(() => {
        removePostRender();
        if (viewer.isDestroyed() || initialCameraRunRef.current !== run || run.finalized) return;
        run.finalized = true;
        run.viewerReadyMs = Math.round(performance.now() - run.startedAt);
        if (run.projectId) {
          openPerf.markInitialFlyComplete(run.projectId);
          openPerf.markViewerReady(run.projectId);
        }
        setInitialFlyCompleted(completed);
        markViewerPerf(viewerPerfRef, 'firstUsableMs');
        setViewerPhase('ready');
        logInitialCamera(run);
      });
      viewer.scene.requestRender();
    };

    const selectInitialCameraBounds = (run: InitialCameraRun) => {
      const candidates = run.boundsCandidates ?? {};
      const priorityByVisual: Record<PrimaryVisualType, InitialBoundsSource[]> = {
        'point-cloud': ['point-cloud-root', 'dom-metadata', 'project-extent', 'glb', 'project-center'],
        dom: ['dom-metadata', 'project-extent', 'point-cloud-root', 'glb', 'project-center'],
        model: ['dom-metadata', 'project-extent', 'glb', 'project-center', 'point-cloud-root'],
        fallback: ['project-extent', 'dom-metadata', 'point-cloud-root', 'glb', 'project-center'],
      };
      const priority: InitialBoundsSource[] = run.primaryVisualType
        ? priorityByVisual[run.primaryVisualType]
        : ['point-cloud-root', 'dom-metadata', 'glb', 'project-extent', 'project-center'];
      const source = priority.find(candidate => candidates[candidate]);
      if (!source) return false;
      run.boundsSource = source;
      run.bounds = Cesium.BoundingSphere.clone(candidates[source]!);
      return true;
    };

    const startInitialCameraIfReady = (run: InitialCameraRun) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || run.started || run.finalized || !run.primaryVisualType) return false;
      if (!selectInitialCameraBounds(run) || !run.bounds) return false;
      const bounds = run.bounds;

      if (run.userInteracted) {
        finalizeInitialCameraAfterFrame(run, false, true);
        return true;
      }

      const selectedRadius = Math.max(10, bounds.radius);
      const glbBounds = run.boundsCandidates?.glb;

      // Keep the calibrated DOM/project center, then adapt only the framing SIZE.
      // This preserves the correct target fixed in v9 while moving small-footprint
      // projects closer without hardcoding SHTP, Quy Nhon, Long Phu, or any ID.
      const cameraBounds = run.primaryVisualType === 'model' && glbBounds
        ? buildAdaptiveProjectCameraSphere(bounds, glbBounds)
        : Cesium.BoundingSphere.clone(bounds);
      const framingRadius = Math.max(10, cameraBounds.radius);

      // Slightly tighter final framing: keep the same calibrated target and adaptive
      // project radius, but move the camera about 10% closer than v10.
      const fitRange = Math.min(50000, Math.max(30, framingRadius * 1.72));
      run.fitRadius = Math.round(framingRadius * 100) / 100;
      run.fitRange = Math.round(fitRange * 100) / 100;
      run.started = true;
      run.flyStartMs = Math.round(performance.now() - run.startedAt);
      run.flyDuration = 1.4;
      stopEarthRotationRef.current();
      setInitialFlyStarted(true);
      setViewerPhase('flying-to-project');
      viewer.camera.flyToBoundingSphere(cameraBounds, {
        duration: run.flyDuration,
        offset: new Cesium.HeadingPitchRange(viewer.camera.heading, Cesium.Math.toRadians(-30), fitRange),
        complete: () => finalizeInitialCameraAfterFrame(run, true, false),
        cancel: () => finalizeInitialCameraAfterFrame(run, false, true),
      });
      return true;
    };

    const offerInitialCameraBounds = (
      source: InitialBoundsSource,
      bounds: Cesium.BoundingSphere,
    ) => {
      const viewer = viewerRef.current;
      const run = initialCameraRunRef.current;
      if (
        !viewer || viewer.isDestroyed() || run.projectId !== projectId || run.started || run.finalized ||
        !bounds || !Number.isFinite(bounds.radius) || bounds.radius < 0
      ) return false;

      run.boundsCandidates ??= {};
      run.boundsCandidates[source] = Cesium.BoundingSphere.clone(bounds);
      run.boundsReadyMs ??= Math.round(performance.now() - run.startedAt);
      setFirstProjectBoundsReady(true);
      // Do not let fast-but-coarse metadata permanently win the camera.  Once
      // the primary visual is known, select the bounds that best represent it.
      if (run.primaryVisualType) {
        selectInitialCameraBounds(run);
        startInitialCameraIfReady(run);
      }
      return true;
    };

    const markPrimaryVisualReady = (type: PrimaryVisualType) => {
      const run = initialCameraRunRef.current;
      if (run.projectId !== projectId || run.finalized || run.primaryVisualType) return;
      run.primaryVisualType = type;
      run.primaryVisualReadyMs = Math.round(performance.now() - run.startedAt);
      setPrimaryVisualReady(true);
      selectInitialCameraBounds(run);
      startInitialCameraIfReady(run);
    };

    const watchPointCloudCoarseContent = (tileset: Cesium.Cesium3DTileset) => {
      const run = initialCameraRunRef.current;
      run.primaryVisualRootReadyMs ??= Math.round(performance.now() - run.startedAt);
      const remove = tileset.tileVisible.addEventListener(() => {
        remove();
        markPrimaryVisualReady('point-cloud');
      });
      initialVisualCleanupRef.current.push(remove);
      viewerRef.current?.scene.requestRender();
    };

    const markInitialCameraInteraction = () => {
      const viewer = viewerRef.current;
      const run = initialCameraRunRef.current;
      if (run.finalized) return;
      run.userInteracted = true;
      stopEarthRotationRef.current();
      if (run.started && viewer && !viewer.isDestroyed()) viewer.camera.cancelFlight();
    };

    // States quản lý bật tắt layer
    // Initial "Toàn cảnh": chỉ Model 3D + DOM. Point Cloud là opt-in và chỉ tải
    // sau khi người dùng chủ động mở tab Point Cloud để giảm startup bandwidth/GPU.
    const [showModel, setShowModel] = useState(true);
    const [showDom, setShowDom] = useState(false);
    const [showPointCloud, setShowPointCloud] = useState(false);

    // States quản lý Appearance (Ngoại quan Potree)
    const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE);
    const [fov, setFov] = useState(60);
    const [edlEnabled, setEdlEnabled] = useState(false);
    const [edlRadius, setEdlRadius] = useState(1.4);
    const [edlStrength, setEdlStrength] = useState(0.4);
    const [edlOpacity, setEdlOpacity] = useState(1.0);
    const [modelOpacity, setModelOpacity] = useState(1);
    const [pointCloudOpacity, setPointCloudOpacity] = useState(1);
    const [domOpacity, setDomOpacity] = useState(1);
    const [background, setBackground] = useState<SceneBackground>('sky');
    const [quality, setQuality] = useState<'standard' | 'high'>('standard');
    const [minPointBudget, setMinPointBudget] = useState(100_000);
    const [maxPointBudget, setMaxPointBudget] = useState(12_000_000);
    const [pointBudget, setPointBudget] = useState(12_000_000);
    const [minNodeSize, setMinNodeSize] = useState(8);
    const [lockView, setLockView] = useState(false);
    const [isOrthographic, setIsOrthographic] = useState(false);
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [activeProfile, setActiveProfile] = useState<ProfileResult | null>(null);
    const [isProfileSampling, setIsProfileSampling] = useState(false);
    const {
      controllerRef: heatmapControllerRef,
      enabled: heatmapEnabled,
      max: heatmapMax,
      onEnabledChange: handleHeatmapEnabledChange,
      property: heatmapProperty,
      rangeAvailable: heatmapRangeAvailable,
      resetRange: resetHeatmapRange,
      setProperty: setHeatmapProperty,
    } = useHeatmap({
      viewerRef,
      pointCloudLoadStatus,
      projectKey: project?.id ? String(project.id) : undefined,
    });

    const enqueueMeasurementPersistence = (measurementId: string, operation: () => Promise<unknown>) => {
      const previous = measurementPersistenceQueueRef.current.get(measurementId) ?? Promise.resolve();
      const next = previous
        .catch(() => undefined)
        .then(operation)
        .then(() => undefined)
        .catch(error => console.error(`[Measurement persistence] ${measurementId}:`, error));
      measurementPersistenceQueueRef.current.set(measurementId, next);
      void next.finally(() => {
        if (measurementPersistenceQueueRef.current.get(measurementId) === next) {
          measurementPersistenceQueueRef.current.delete(measurementId);
        }
      });
    };

    const persistMeasurementUpdate = (record: MeasurementRecord) => {
      if (!projectId || !record.isFinalized) return;
      const { id: _id, type: _type, ...payload } = serializeMeasurementRecord(record);
      enqueueMeasurementPersistence(record.id, () =>
        updateProjectMeasurement(projectId, record.id, payload)
      );
    };

    // Abort only app-owned fetches. Cesium Model/3D Tiles requests keep their
    // existing generation guards because Cesium does not expose the same AbortSignal
    // lifecycle safely for every loader.
    useEffect(() => {
      return () => {
        metadataRequestRef.current?.controller.abort();
        metadataRequestRef.current = null;
        domImageAbortRef.current?.abort();
        domImageAbortRef.current = null;
        pointCloudIndexAbortRef.current?.abort();
        pointCloudIndexAbortRef.current = null;
      };
    }, [projectId]);

    useEffect(() => {
      if (!import.meta.env.DEV) return;
      return () => {
        const layer = domLayerRef.current;
        if (layer && !layer.isDestroyed()) {
          logImageryEvent('project/survey-cleanup', layer, { reason: 'identity-change', projectId, surveyId });
        }
      };
    }, [projectId, surveyId]);

    // Fetch thông tin dự án khi projectId thay đổi. ViewerPage là owner chính;
    // chỉ fallback fetch khi không có project được truyền xuống.
    useEffect(() => {
      if (suppliedProject?.id === projectId) {
        setProject(suppliedProject);
        return;
      }
      const controller = new AbortController();
      if (projectId) {
        if (import.meta.env.DEV) console.info('[ViewerRequest] fallback project start');
        fetchProjectById(projectId, controller.signal).then(data => {
          if (controller.signal.aborted) return;
          if (data) setProject(data);
          else setViewerPhase('error');
        });
      }
      return () => controller.abort();
    }, [projectId, suppliedProject]);

    // Đổi dự án thì đóng kết quả trắc dọc cũ để không hiển thị dữ liệu của project trước.
    useEffect(() => {
      setActiveProfile(null);
      setIsProfileSampling(false);
      setDisplayMode('full');
      activeLayerProjectRef.current = null;
      activeLayerKeyRef.current = null;
      modelLoadGenerationRef.current += 1;
      pointCloudLoadGenerationRef.current += 1;
      domLoadGenerationRef.current += 1;
      stopEarthRotationRef.current();
      initialVisualCleanupRef.current.splice(0).forEach(cleanup => cleanup());
      const viewer = viewerRef.current;
      if (initialCameraRunRef.current.started && !initialCameraRunRef.current.finalized && viewer && !viewer.isDestroyed()) {
        viewer.camera.cancelFlight();
      }
      const cameraGeneration = ++initialCameraGenerationRef.current;
      initialCameraRunRef.current = {
        projectId,
        generation: cameraGeneration,
        startedAt: performance.now(),
        boundsCandidates: {},
        userInteracted: false,
        cancelled: false,
        started: false,
        completed: false,
        finalized: false,
      };
      lastLoggedViewerPhaseRef.current = null;
      setViewerPhase(viewer && !viewer.isDestroyed() ? 'waiting-project' : 'initializing');
      setFirstProjectBoundsReady(false);
      setPrimaryVisualReady(false);
      setInitialFlyStarted(false);
      setInitialFlyCompleted(false);
      viewerPerfRef.current = {
        projectId,
        startedAt: performance.now(),
        cesiumReadyMs: viewerRef.current && !viewerRef.current.isDestroyed() ? 0 : undefined,
      };
    }, [projectId]);

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || viewerPhase !== 'waiting-project' || !cesiumReady) return;

      let lastTick = performance.now();
      const startedAt = lastTick;
      const stop = () => {
        viewer.clock.onTick.removeEventListener(rotateEarth);
        if (stopEarthRotationRef.current === stop) stopEarthRotationRef.current = () => undefined;
        const run = initialCameraRunRef.current;
        run.earthIntroMs ??= Math.round(performance.now() - startedAt);
        setEarthRotationActive(false);
      };
      const rotateEarth = () => {
        if (viewer.isDestroyed() || initialCameraRunRef.current.userInteracted) {
          stop();
          return;
        }
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastTick) / 1000, 0.1);
        lastTick = now;
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(0.35) * deltaSeconds);
        viewer.scene.requestRender();
      };

      stopEarthRotationRef.current();
      stopEarthRotationRef.current = stop;
      viewer.clock.onTick.addEventListener(rotateEarth);
      setEarthRotationActive(true);
      viewer.scene.requestRender();
      return stop;
    }, [viewerPhase, cesiumReady, projectId]);

    // Keep the globe as the intentional startup visual.  Appearance/background
    // effects can run in the same mount and temporarily hide the globe; while
    // the automatic intro is active we explicitly keep Earth + atmosphere on.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (
        !viewer || viewer.isDestroyed() || !cesiumReady ||
        viewerPhase === 'ready' || viewerPhase === 'error' ||
        displayMode !== 'full'
      ) return;
      viewer.scene.globe.show = true;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.requestRender();
    }, [viewerPhase, cesiumReady, displayMode, projectId]);

    // States và refs quản lý tinh chỉnh vị trí của Admin (Calibration)
    const [offsets, setOffsets] = useState({
      modelLon: 0,
      modelLat: 0,
      modelHeight: 0.3,
      modelHeading: 0,
      modelPitch: 0,
      modelRoll: 0,
      domLon: 0,
      domLat: 0,
      domScale: 1.0,
      domHeading: 0,
      pcLon: 0,
      pcLat: 0,
      pcHeight: 0,
      pcHeading: 0,
      pcPitch: 0,
      pcRoll: 0
    });
    const originalBoundsRef = useRef({ west: 0, east: 0, south: 0, north: 0 });
    const offsetsRef = useRef(offsets);
    const pointCloudOriginalCenterRef = useRef<Cesium.Cartesian3 | null>(null);
    const loadedPointCloudTilesetsRef = useRef<Cesium.Cesium3DTileset[]>([]);
    const domImageRef = useRef<HTMLImageElement | null>(null);
    const domImageSrcRef = useRef<string | null>(null);
    const layerVisibilityRef = useRef({ model: showModel, pointCloud: showPointCloud, dom: showDom });
    layerVisibilityRef.current = { model: showModel, pointCloud: showPointCloud, dom: showDom };
    const layerOpacityRef = useRef({ model: modelOpacity, pointCloud: pointCloudOpacity, dom: domOpacity });
    layerOpacityRef.current = { model: modelOpacity, pointCloud: pointCloudOpacity, dom: domOpacity };

    const buildDomCameraBoundingSphere = (
      bounds: { west: number; east: number; south: number; north: number },
      domLon: number,
      domLat: number,
      domScale: number,
    ): Cesium.BoundingSphere | null => {
      const { west, east, south, north } = bounds;
      if (
        ![west, east, south, north].every(Number.isFinite) ||
        west >= east || south >= north
      ) return null;

      // Camera framing must follow the DOM after calibration, not the raw metadata.
      // Heading does not change the footprint center/radius, so using the unrotated
      // calibrated rectangle avoids the oversized diagonal canvas rectangle while
      // still targeting the exact project location rendered by the DOM layer.
      const scale = Number.isFinite(domScale) && domScale > 0 ? domScale : 1;
      const centerLon = (west + east) / 2 + (Number.isFinite(domLon) ? domLon : 0);
      const centerLat = (south + north) / 2 + (Number.isFinite(domLat) ? domLat : 0);
      const halfWidth = ((east - west) / 2) * scale;
      const halfHeight = ((north - south) / 2) * scale;
      const rectangle = Cesium.Rectangle.fromDegrees(
        centerLon - halfWidth,
        centerLat - halfHeight,
        centerLon + halfWidth,
        centerLat + halfHeight,
      );
      return Cesium.BoundingSphere.fromRectangle3D(rectangle, Cesium.Ellipsoid.WGS84, 0);
    };

    const getCurrentDomCameraBoundingSphere = () => buildDomCameraBoundingSphere(
      originalBoundsRef.current,
      offsetsRef.current.domLon || 0,
      offsetsRef.current.domLat || 0,
      offsetsRef.current.domScale || 1,
    );

    const removeTrackedProjectPrimitives = (viewer: Cesium.Viewer, reason: string) => {
      const model = modelRef.current;
      const pointClouds = Array.from(new Set<Cesium.Cesium3DTileset>([
        ...(pointCloudRef.current ? [pointCloudRef.current] : []),
        ...loadedPointCloudTilesetsRef.current,
      ]));

      // Invalidate app-owned references before PrimitiveCollection.remove() destroys
      // the underlying Cesium GPU resources.  Never use scene.primitives.removeAll()
      // for a project switch: the scene can contain primitives owned by other tools.
      modelRef.current = null;
      pointCloudRef.current = null;
      loadedPointCloudTilesetsRef.current = [];
      pointCloudOriginalCenterRef.current = null;

      if (viewer.isDestroyed()) return;

      if (model && !model.isDestroyed() && viewer.scene.primitives.contains(model)) {
        model.show = false;
        logLifecycleEvent('retired', model, { reason });
        viewer.scene.primitives.remove(model);
      }

      pointClouds.forEach(tileset => {
        if (tileset.isDestroyed() || !viewer.scene.primitives.contains(tileset)) return;
        tileset.show = false;
        logLifecycleEvent('retired', tileset, { reason });
        viewer.scene.primitives.remove(tileset);
      });
    };

    const removeTrackedDomLayer = (viewer: Cesium.Viewer, reason: string) => {
      const layer = domLayerRef.current;
      domLayerRef.current = null;
      if (viewer.isDestroyed() || !layer || layer.isDestroyed() || !viewer.imageryLayers.contains(layer)) return;

      logImageryEvent('project/survey-cleanup', layer, { reason, projectId, surveyId });
      logImageryEvent('imagery-remove-request', layer, { reason });
      const removed = viewer.imageryLayers.remove(layer, true);
      logImageryEvent('imagery-removed', layer, { reason, removed });
    };

    const applyProjectLayerVisibility = () => {
      const visibility = layerVisibilityRef.current;
      if (modelRef.current && !modelRef.current.isDestroyed()) modelRef.current.show = visibility.model;
      loadedPointCloudTilesetsRef.current.forEach(tileset => {
        if (!tileset.isDestroyed()) tileset.show = visibility.pointCloud;
      });
      if (domLayerRef.current && !domLayerRef.current.isDestroyed()) {
        logImageryEvent('imagery-visibility', domLayerRef.current, { previous: domLayerRef.current.show, next: visibility.dom, displayMode });
        domLayerRef.current.show = visibility.dom;
      }
      viewerRef.current?.scene.requestRender();
    };

    const handleModelVisibilityChange = (visible: boolean) => {
      setShowModel(visible);
      layerVisibilityRef.current = { ...layerVisibilityRef.current, model: visible };
      const model = modelRef.current;
      if (model && !model.isDestroyed()) model.show = visible;
      viewerRef.current?.scene.requestRender();
    };

    const handleDomVisibilityChange = (visible: boolean) => {
      setShowDom(visible);
      layerVisibilityRef.current = { ...layerVisibilityRef.current, dom: visible };
      applyProjectLayerVisibility();
    };

    const handlePointCloudVisibilityChange = (visible: boolean) => {
      setShowPointCloud(visible);
      layerVisibilityRef.current = { ...layerVisibilityRef.current, pointCloud: visible };
      applyProjectLayerVisibility();
    };

    useEffect(() => {
      offsetsRef.current = offsets;
    }, [offsets]);

    // Nạp calibration cũ từ DB (ưu tiên) hoặc localStorage khi mở project
    useEffect(() => {
      if (project) {
        if (project.calibration) {
          try {
            const parsed = JSON.parse(project.calibration);
            setOffsets(prev => ({ ...prev, ...parsed }));
            console.log("Loaded calibration offsets from database:", parsed);
            return;
          } catch (e) {
            console.error("Lỗi parse calibration từ DB:", e);
          }
        }

        // Fallback về localStorage
        const saved = localStorage.getItem(`calibration_${project.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setOffsets(prev => ({ ...prev, ...parsed }));
            console.log("Loaded saved calibration from localStorage:", parsed);
          } catch (e) {
            console.error("Lỗi parse calibration từ localStorage:", e);
          }
        } else {
          setOffsets({
            modelLon: 0,
            modelLat: 0,
            modelHeight: 0.3,
            modelHeading: 0,
            modelPitch: 0,
            modelRoll: 0,
            domLon: 0,
            domLat: 0,
            domScale: 1.0,
            domHeading: 0,
            pcLon: 0,
            pcLat: 0,
            pcHeight: 0,
            pcHeading: 0,
            pcPitch: 0,
            pcRoll: 0
          });
        }
      }
    }, [project]);

    // Tự động nhận diện và nạp ngưỡng Point Budget (tối thiểu & tối đa) riêng của từng dự án
    useEffect(() => {
      if (!project) return;

      let detectedMax = 12_000_000;
      let detectedMin = 100_000;

      // 1. Kiểm tra nếu dự án có trường point count trực tiếp
      if ((project as any).totalPoints || (project as any).pointCount) {
        const pts = Number((project as any).totalPoints || (project as any).pointCount);
        if (pts > 0) {
          detectedMax = pts;
          detectedMin = Math.max(10_000, Math.round(pts * 0.02));
        }
      }

      // 2. Nạp từ metadata.json nếu có. Reuse đúng cùng một Promise với DOM
      // loader để metadata.json chỉ có một app-owned request trong mỗi project mount.
      if (project.metadataUrl) {
        getProjectMetadata(project.metadataUrl)
          .then(meta => {
            // This request is only for point-budget metadata. Camera ownership stays
            // in the DOM loader, where calibration offsets are already available.
            if (meta && (meta.totalPoints || meta.pointCount)) {
              const pts = Number(meta.totalPoints || meta.pointCount);
              if (pts > 0) {
                const max = pts;
                const min = Math.max(10_000, Math.round(pts * 0.02));
                setMinPointBudget(min);
                setMaxPointBudget(max);
                const saved = localStorage.getItem(`pointBudget_${project.id}`);
                const initB = saved ? Math.min(max, Math.max(min, Number(saved))) : max;
                setPointBudget(initB);
              }
            }
          })
          .catch(error => {
            if (!isAbortError(error)) console.warn('[Metadata] Point-budget metadata unavailable:', error);
          });
      }

      // Point Cloud root metadata không còn fetch ở startup. Cesium sẽ nạp root
      // khi user mở tab Point Cloud; tránh một request tileset.json không cần thiết
      // trong đường tải ban đầu Model + DOM.

      const savedBudget = localStorage.getItem(`pointBudget_${project.id}`);
      const initBudget = savedBudget ? Math.min(detectedMax, Math.max(detectedMin, Number(savedBudget))) : detectedMax;

      setMinPointBudget(detectedMin);
      setMaxPointBudget(detectedMax);
      setPointBudget(initBudget);
    }, [project]);

    // Lưu trữ bounds cơ sở của dự án để tính offset
    useEffect(() => {
      if (!project) return;
      originalBoundsRef.current = {
        west: 0,
        east: 0,
        south: 0,
        north: 0
      };
    }, [project]);

    // Cập nhật thời gian thực Model 3D khi tinh chỉnh (offset/rotation/tilt)
    useEffect(() => {
      if (!modelRef.current || !project) return;
      const baseLon = project.centerLon || 106.8099;
      const baseLat = project.centerLat || 10.8404;
      let lon = baseLon;
      let lat = baseLat;
      if (lon < 90 && lat > 90) {
        lon = baseLat;
        lat = baseLon;
      }

      const finalLon = lon + offsets.modelLon;
      const finalLat = lat + offsets.modelLat;

      const position = Cesium.Cartesian3.fromDegrees(finalLon, finalLat, offsets.modelHeight);
      const heading = Cesium.Math.toRadians(offsets.modelHeading || 0);
      const pitch = Cesium.Math.toRadians(offsets.modelPitch || 0);
      const roll = Cesium.Math.toRadians(offsets.modelRoll || 0);
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      modelRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(orientation),
        position
      );
    }, [offsets.modelLon, offsets.modelLat, offsets.modelHeight, offsets.modelHeading, offsets.modelPitch, offsets.modelRoll, project]);

    // Cập nhật thời gian thực ảnh DOM khi tinh chỉnh (offset/scale) với Debounce 250ms (DUY NHẤT)
    useEffect(() => {
      const viewer = viewerRef.current;
      const generation = ++domLoadGenerationRef.current;
      if (!project?.domUrl) {
        if (viewer && !viewer.isDestroyed() && domLayerRef.current) {
          removeTrackedDomLayer(viewer, 'dom-unavailable');
        }
        setDomLoadStatus(project ? 'unavailable' : 'idle');
        setDomLoadError(null);
        return;
      }
      if (!viewer || viewer.isDestroyed()) return;

      let isCurrent = true;
      const isActive = () => isCurrent && generation === domLoadGenerationRef.current && !viewer.isDestroyed();
      const domFetchController = new AbortController();
      domImageAbortRef.current?.abort();
      domImageAbortRef.current = domFetchController;
      setDomLoadStatus('loading');
      setDomLoadError(null);

      const timer = setTimeout(async () => {
        const baseLon = project.centerLon || 106.8099;
        const baseLat = project.centerLat || 10.8404;
        let lon = baseLon;
        let lat = baseLat;
        if (lon < 90 && lat > 90) {
          lon = baseLat;
          lat = baseLon;
        }

        // Đọc metadata.json của DOM nếu chưa có bounds gốc
        if (originalBoundsRef.current.west === 0) {
          if (project.metadataUrl) {
            try {
              const meta = await getProjectMetadata(project.metadataUrl);
              if (!isActive()) return;
              if (meta.west && meta.east && meta.south && meta.north) {
                originalBoundsRef.current = {
                  west: meta.west,
                  east: meta.east,
                  south: meta.south,
                  north: meta.north
                };
                const calibratedDomBounds = buildDomCameraBoundingSphere(
                  originalBoundsRef.current,
                  offsets.domLon || 0,
                  offsets.domLat || 0,
                  offsets.domScale || 1,
                );
                if (calibratedDomBounds) {
                  offerInitialCameraBounds('dom-metadata', calibratedDomBounds);
                }
                console.log("Đã đọc bounding box DOM từ metadata.json:", meta);
              }
            } catch (e) {
              if (isAbortError(e)) return;
              console.warn("Không thể đọc metadata.json DOM, dùng khoảng vị trí mặc định.");
            }
          }

          // Nếu vẫn bằng 0 (fetch lỗi hoặc không có metadataUrl), tính bounds mặc định
          if (originalBoundsRef.current.west === 0) {
            const deltaLatitude = 142.222 / 111111;
            const deltaLongitude = 143.532 / (111111 * Math.cos(lat * Math.PI / 180));
            originalBoundsRef.current = {
              west: lon - deltaLongitude / 2,
              east: lon + deltaLongitude / 2,
              south: lat - deltaLatitude / 2,
              north: lat + deltaLatitude / 2
            };
            if (!project.pointCloudId && !project.modelUrl) {
              const fallbackRectangle = Cesium.Rectangle.fromDegrees(
                originalBoundsRef.current.west,
                originalBoundsRef.current.south,
                originalBoundsRef.current.east,
                originalBoundsRef.current.north,
              );
              offerInitialCameraBounds(
                'project-center',
                Cesium.BoundingSphere.fromRectangle3D(fallbackRectangle, Cesium.Ellipsoid.WGS84, 0),
              );
            }
            console.log("Đã tính bounding box DOM mặc định:", originalBoundsRef.current);
          }
        }

        // Lấy bounds gốc (nếu có)
        let west = originalBoundsRef.current.west;
        let east = originalBoundsRef.current.east;
        let south = originalBoundsRef.current.south;
        let north = originalBoundsRef.current.north;

        if (west === 0) {
          const deltaLatitude = 142.222 / 111111;
          const deltaLongitude = 143.532 / (111111 * Math.cos(lat * Math.PI / 180));
          west = lon - deltaLongitude / 2;
          east = lon + deltaLongitude / 2;
          south = lat - deltaLatitude / 2;
          north = lat + deltaLatitude / 2;
        }

        // Áp dụng scale
        const centerLon = (west + east) / 2;
        const centerLat = (south + north) / 2;
        const halfWidth = ((east - west) / 2) * (offsets.domScale || 1.0);
        const halfHeight = ((north - south) / 2) * (offsets.domScale || 1.0);

        const domUrl = project.domUrl;
        const domCacheVersion = getStableProjectAssetVersion(project, domUrl);
        const domRequestUrl = appendDomAssetVersion(domUrl, String(domCacheVersion));

        try {
          // Tải hình ảnh dưới dạng Blob để giải quyết CORS và tránh làm bẩn (tainting) canvas
          let img = domImageRef.current;
          if (!img || domImageSrcRef.current !== domRequestUrl) {
            openPerf.startDomFetch(project.id);
            const res = await fetch(domRequestUrl, {
              mode: 'cors',
              cache: 'default',
              signal: domFetchController.signal,
            });
            if (!res.ok) throw new Error(`Fetch DOM image failed: HTTP ${res.status}`);
            const blob = await res.blob();
            openPerf.endDomFetch(project.id);
            openPerf.startDomDecode(project.id);
            const blobUrl = URL.createObjectURL(blob);

            img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                openPerf.endDomDecode(project.id);
                URL.revokeObjectURL(blobUrl);
                resolve(image);
              };
              image.onerror = (e) => {
                URL.revokeObjectURL(blobUrl);
                reject(e);
              };
              image.src = blobUrl;
            });
            if (!isActive()) return;
            domImageRef.current = img;
            domImageSrcRef.current = domRequestUrl;
          }

          // Scale only the DOM raster. Geographic bounds and calibration remain unchanged.
          const deviceMaxTextureSize = (() => {
            const gl =
              viewer.scene.canvas.getContext('webgl2') ??
              viewer.scene.canvas.getContext('webgl');

            return gl
              ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))
              : 4096;
          })();

          const requestedCanvasSize =
            quality === 'high' ? 4096 : 2048;

          const maxCanvasSize = Math.min(
            requestedCanvasSize,
            deviceMaxTextureSize
          );
          let W = img.width;
          let H = img.height;
          if (W > maxCanvasSize || H > maxCanvasSize) {
            const scale = maxCanvasSize / Math.max(W, H);
            W = Math.round(W * scale);
            H = Math.round(H * scale);
          }

          const D = Math.ceil(Math.sqrt(W * W + H * H));

          // Tạo canvas hình vuông có kích thước đường chéo D để vẽ xoay không bị cắt góc
          const canvas = document.createElement('canvas');
          canvas.width = D;
          canvas.height = D;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Canvas context is null");

          // Xoay và vẽ ảnh vào tâm canvas
          openPerf.startDomCanvas(project.id);
          ctx.translate(D / 2, D / 2);
          ctx.rotate(Cesium.Math.toRadians(offsets.domHeading || 0));
          ctx.drawImage(img, -W / 2, -H / 2, W, H);
          openPerf.endDomCanvas(project.id);

          // Mở rộng bounds tương ứng với đường chéo để đảm bảo scale hiển thị chính xác
          const newHalfWidth = halfWidth * (D / W);
          const newHalfHeight = halfHeight * (D / H);

          const finalWest = centerLon - newHalfWidth + (offsets.domLon || 0);
          const finalEast = centerLon + newHalfWidth + (offsets.domLon || 0);
          const finalSouth = centerLat - newHalfHeight + (offsets.domLat || 0);
          const finalNorth = centerLat + newHalfHeight + (offsets.domLat || 0);

          if (
            isNaN(finalWest) || isNaN(finalEast) || isNaN(finalSouth) || isNaN(finalNorth) ||
            finalWest >= finalEast || finalSouth >= finalNorth ||
            finalWest < -180 || finalEast > 180 || finalSouth < -90 || finalNorth > 90
          ) {
            throw new Error("Invalid bounds coordinates");
          }

          const newDomRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);

          if (import.meta.env.DEV) {
            const gl = viewer.scene.canvas.getContext('webgl2')
              ?? viewer.scene.canvas.getContext('webgl');
            console.info('[DOMSharpness]', {
              source: `${img.naturalWidth || img.width}x${img.naturalHeight || img.height}`,
              preRotateCanvas: `${W}x${H}`,
              postRotateCanvas: `${canvas.width}x${canvas.height}`,
              providerInput: `${canvas.width}x${canvas.height}`,
              cap: maxCanvasSize,
              scaleFactor: Math.min(
                W / Math.max(1, img.naturalWidth || img.width),
                H / Math.max(1, img.naturalHeight || img.height),
              ),
              deviceMaxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 'unavailable',
            });
          }

          const provider = new Cesium.SingleTileImageryProvider({
            url: canvas.toDataURL(),
            rectangle: newDomRectangle,
          });

          if (!isActive()) return;

          const oldLayer = domLayerRef.current;
          const newLayer = viewer.imageryLayers.addImageryProvider(provider);
          registerLifecycleResource(newLayer, 'imagery', { projectId: String(project.id), surveyId, generation, details: { source: 'dom-rotated-canvas' } });
          logImageryEvent('imagery-added', newLayer, { collection: 'viewer.imageryLayers' });
          newLayer.show = layerVisibilityRef.current.dom;
          newLayer.alpha = layerOpacityRef.current.dom;
          newLayer.colorToAlpha = Cesium.Color.BLACK;
          newLayer.colorToAlphaThreshold = 0.15;

          viewer.imageryLayers.raiseToTop(newLayer);
          domLayerRef.current = newLayer;
          openPerf.markFirstDomVisible(project.id);

          if (oldLayer && !viewer.isDestroyed() && !oldLayer.isDestroyed() && viewer.imageryLayers.contains(oldLayer)) {
            logImageryEvent('calibration-replace', oldLayer, { nextGeneration: generation, source: 'dom-rotated-canvas' });
            logImageryEvent('imagery-remove-request', oldLayer, { reason: 'dom-replaced' });
            const removed = viewer.imageryLayers.remove(oldLayer, true);
            logImageryEvent('imagery-removed', oldLayer, { reason: 'dom-replaced', removed });
          }
          // `newDomRectangle` is enlarged to the image diagonal for drawing, so it is
          // deliberately NOT used for camera targeting. Use the calibrated original
          // DOM footprint: same center as the rendered DOM, tighter and stable.
          const cameraDomBounds = buildDomCameraBoundingSphere(
            originalBoundsRef.current,
            offsets.domLon || 0,
            offsets.domLat || 0,
            offsets.domScale || 1,
          );
          if (cameraDomBounds) offerInitialCameraBounds('dom-metadata', cameraDomBounds);
          setDomLoadStatus('ready');
        } catch (canvasErr) {
          if (isAbortError(canvasErr) || !isActive()) return;
          console.warn("⚠️ Không thể tạo ảnh DOM xoay bằng canvas. Chuyển sang nạp ảnh gốc không xoay làm dự phòng:", canvasErr);

          const finalWest = centerLon - halfWidth + (offsets.domLon || 0);
          const finalEast = centerLon + halfWidth + (offsets.domLon || 0);
          const finalSouth = centerLat - halfHeight + (offsets.domLat || 0);
          const finalNorth = centerLat + halfHeight + (offsets.domLat || 0);

          if (
            isNaN(finalWest) || isNaN(finalEast) || isNaN(finalSouth) || isNaN(finalNorth) ||
            finalWest >= finalEast || finalSouth >= finalNorth ||
            finalWest < -180 || finalEast > 180 || finalSouth < -90 || finalNorth > 90
          ) {
            if (isActive()) {
              setDomLoadStatus('error');
              setDomLoadError('Tải DOM thất bại');
            }
            return;
          }

          const domRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);

          try {
            const provider = await Cesium.SingleTileImageryProvider.fromUrl(domRequestUrl, {
              rectangle: domRectangle,
            });

            if (import.meta.env.DEV) {
              const gl = viewer.scene.canvas.getContext('webgl2')
                ?? viewer.scene.canvas.getContext('webgl');
              console.info('[DOMSharpness]', {
                source: `${provider.tileWidth}x${provider.tileHeight}`,
                preRotateCanvas: 'not-used (fallback)',
                postRotateCanvas: 'not-used (fallback)',
                providerInput: `${provider.tileWidth}x${provider.tileHeight}`,
                cap: 2048,
                scaleFactor: 1,
                deviceMaxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 'unavailable',
              });
            }

            if (!isActive()) return;

            const oldLayer = domLayerRef.current;
            const newLayer = viewer.imageryLayers.addImageryProvider(provider);
            registerLifecycleResource(newLayer, 'imagery', { projectId: String(project.id), surveyId, generation, details: { source: 'dom-image-fallback' } });
            logImageryEvent('imagery-added', newLayer, { collection: 'viewer.imageryLayers' });
            newLayer.show = layerVisibilityRef.current.dom;
            newLayer.alpha = layerOpacityRef.current.dom;
            newLayer.colorToAlpha = Cesium.Color.BLACK;
            newLayer.colorToAlphaThreshold = 0.15;

            viewer.imageryLayers.raiseToTop(newLayer);
            domLayerRef.current = newLayer;
            openPerf.markFirstDomVisible(project.id);

            if (oldLayer && !viewer.isDestroyed() && !oldLayer.isDestroyed() && viewer.imageryLayers.contains(oldLayer)) {
              logImageryEvent('calibration-replace', oldLayer, { nextGeneration: generation, source: 'dom-image-fallback' });
              logImageryEvent('imagery-remove-request', oldLayer, { reason: 'dom-replaced-fallback' });
              const removed = viewer.imageryLayers.remove(oldLayer, true);
              logImageryEvent('imagery-removed', oldLayer, { reason: 'dom-replaced-fallback', removed });
            }
            offerInitialCameraBounds(
              'dom-metadata',
              Cesium.BoundingSphere.fromRectangle3D(domRectangle, Cesium.Ellipsoid.WGS84, 0),
            );
            setDomLoadStatus('ready');
          } catch (err) {
            if (!isActive() || isAbortError(err)) return;
            setDomLoadStatus('error');
            setDomLoadError('Tải DOM thất bại');
            console.error("Lỗi nghiêm trọng khi nạp ảnh DOM dự phòng:", err);
          }
        }
      }, 250);

      return () => {
        isCurrent = false;
        clearTimeout(timer);
        domFetchController.abort();
        if (domImageAbortRef.current === domFetchController) domImageAbortRef.current = null;
      };
    }, [
      offsets.domLon,
      offsets.domLat,
      offsets.domScale,
      offsets.domHeading,
      project?.id,
      project?.domUrl,
      project?.metadataUrl,
      project?.centerLon,
      project?.centerLat,
      surveyId,
      domLoadAttempt,
      quality,
    ]);

    // Cập nhật vị trí Point Cloud theo thời gian thực khi Admin hiệu chỉnh (offset/rotation/tilt)
    useEffect(() => {
      if (loadedPointCloudTilesetsRef.current.length === 0 || !project) return;
      const baseCenter = pointCloudOriginalCenterRef.current;
      if (!baseCenter) return;

      const baseLon = project.centerLon || 106.8099;
      const baseLat = project.centerLat || 10.8404;
      let lon = baseLon;
      let lat = baseLat;
      if (lon < 90 && lat > 90) {
        lon = baseLat;
        lat = baseLon;
      }

      const pcLon = offsets.pcLon || 0;
      const pcLat = offsets.pcLat || 0;
      const pcHeight = offsets.pcHeight || 0;
      const pcHeading = offsets.pcHeading || 0;
      const pcPitch = offsets.pcPitch || 0;
      const pcRoll = offsets.pcRoll || 0;

      const offsetPos = Cesium.Cartesian3.fromDegrees(lon + pcLon, lat + pcLat, pcHeight);

      // Áp dụng rotation heading/pitch/roll cho point cloud realtime
      const headingRad = Cesium.Math.toRadians(pcHeading);
      const pitchRad = Cesium.Math.toRadians(pcPitch);
      const rollRad = Cesium.Math.toRadians(pcRoll);
      const hpr = new Cesium.HeadingPitchRoll(headingRad, pitchRad, rollRad);

      const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(baseCenter);
      const ecefToEnu = Cesium.Matrix4.inverse(enuToEcef, new Cesium.Matrix4());
      const hprFixedFrame = Cesium.Transforms.headingPitchRollToFixedFrame(offsetPos, hpr);
      const newModelMatrix = Cesium.Matrix4.multiply(hprFixedFrame, ecefToEnu, new Cesium.Matrix4());

      // Áp dụng đồng bộ cho tất cả các tilesets mây điểm đang nạp
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.modelMatrix = newModelMatrix.clone();
        }
      });
    }, [offsets.pcLon, offsets.pcLat, offsets.pcHeight, offsets.pcHeading, offsets.pcPitch, offsets.pcRoll, project]);



    // Đồng bộ trạng thái hiển thị Mô hình 3D Mesh với Primitive Cesium
    useEffect(() => {
      applyProjectLayerVisibility();
    }, [showModel, showPointCloud, showDom]);

    useEffect(() => {
      layerOpacityRef.current = { model: 1, pointCloud: 1, dom: 1 };
      setModelOpacity(1);
      setPointCloudOpacity(1);
      setDomOpacity(1);
    }, [projectId]);

    const previousDisplayModeRef = useRef<DisplayMode>('full');

    const applyDisplayModeVisibility = (mode: DisplayMode) => {
      // "Toàn cảnh" luôn chỉ hiển thị Model + DOM. Point Cloud là một chế độ
      // riêng: chỉ tải/hiển thị khi user chủ động mở tab Point Cloud. Nếu Point Cloud
      // đã được load trước đó thì giữ trong memory/cache để quay lại nhanh, nhưng vẫn
      // phải ẩn khi trở về Toàn cảnh để tránh chồng điểm lên Model/DOM gây khó nhìn.
      const visibilityByMode: Record<DisplayMode, { model: boolean; pointCloud: boolean; dom: boolean }> = {
        full: {
          // Keep visibility intent while loading; attachment applies the latest
          // checkbox value. Readiness must never reapply a tab over user input.
          model: Boolean(project?.modelUrl),
          pointCloud: false,
          dom: Boolean(project?.domUrl),
        },
        pointcloud: { model: false, pointCloud: true, dom: false },
        model3d: { model: true, pointCloud: false, dom: false },
        dom: { model: false, pointCloud: false, dom: true },
      };
      const visibility = visibilityByMode[mode];
      layerVisibilityRef.current = visibility;
      setShowModel(visibility.model);
      setShowPointCloud(visibility.pointCloud);
      setShowDom(visibility.dom);
      applyProjectLayerVisibility();
    };

    // Tab presets run only for an explicit mode or stable asset identity change.
    // Checkbox choices survive readiness, background and project object updates.
    useEffect(() => {
      // This effect precedes Viewer creation on mount. Set intent regardless;
      // each loader applies it when its resource is attached.
      applyDisplayModeVisibility(displayMode);
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const displayModeChanged = previousDisplayModeRef.current !== displayMode;
      previousDisplayModeRef.current = displayMode;
      const statusesBelongToProject = activeLayerKeyRef.current === projectLayerKey;

      if (displayMode === 'pointcloud') {
        // Point Cloud là on-demand trên cả desktop và mobile. Không tranh băng thông
        // với Model/DOM khi mới vào Viewer. Full loader ref hỗ trợ cả direct URL,
        // custom index và Cesium Ion.
        if (statusesBelongToProject && !pointCloudLoadedRef.current && project) {
          pointCloudLoadedRef.current = true;
          retryPointCloudRef.current();
        } else if (displayModeChanged) {
          handleFocusPointCloud();
        }
      } else if (displayMode === 'model3d') {
        if (displayModeChanged) handleFocusProject();
      } else if (displayMode === 'dom') {
        if (displayModeChanged) handleFocusDom();
      }

      applySceneBackground(viewer, background, displayMode);
      viewer.scene.requestRender();
    }, [displayMode, projectLayerKey]);

    useEffect(() => {
      if (!import.meta.env.DEV) return;
      console.info('[ModelVisibility]', {
        projectLayerKey,
        activeLayerProject: activeLayerKeyRef.current,
        modelLoadStatus,
        hasModel: !!modelRef.current,
        modelDestroyed: modelRef.current?.isDestroyed(),
        showModel,
        displayMode,
        requestedVisibility: layerVisibilityRef.current.model,
        actualShow: modelRef.current?.show,
      });
    }, [projectLayerKey, modelLoadStatus, showModel, displayMode]);

    // Xử lý chuyển đổi góc nhìn camera (Default perspective vs Top Down 90°) xoay quanh tâm màn hình
    const prevViewAngleRef = useRef<ViewAngle>('default');
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !project) return;

      if (prevViewAngleRef.current === viewAngle) return;
      prevViewAngleRef.current = viewAngle;

      const currentCamera = viewer.camera;
      const canvas = viewer.canvas;
      const centerScreen = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);

      // Tìm điểm giao (look-at target) tại tâm màn hình để xoay quanh tâm đó
      let targetCartesian: Cesium.Cartesian3 | undefined = viewer.scene.pickPosition(centerScreen);
      if (!targetCartesian) {
        const ray = currentCamera.getPickRay(centerScreen);
        if (ray) {
          targetCartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
      }
      if (!targetCartesian) {
        targetCartesian = currentCamera.pickEllipsoid(centerScreen);
      }

      // Hàng đợi fallback nếu không lấy được tâm màn hình
      if (!targetCartesian) {
        const baseLon = project.centerLon || 106.8099;
        const baseLat = project.centerLat || 10.8404;
        let longitude = baseLon;
        let latitude = baseLat;
        if (longitude < 90 && latitude > 90) {
          longitude = baseLat;
          latitude = baseLon;
        }
        const modelLon = offsetsRef.current.modelLon || 0;
        const modelLat = offsetsRef.current.modelLat || 0;
        const modelHeight = offsetsRef.current.modelHeight || 0.3;
        targetCartesian = Cesium.Cartesian3.fromDegrees(longitude + modelLon, latitude + modelLat, modelHeight);
      }

      const distance = Cesium.Cartesian3.distance(currentCamera.position, targetCartesian);
      const safeDistance = Math.min(Math.max(distance, 10), 10000);
      const targetSphere = new Cesium.BoundingSphere(targetCartesian, 0);

      if (viewAngle === 'topdown') {
        viewer.camera.flyToBoundingSphere(targetSphere, {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-90), // Góc thẳng đứng từ trên xuống
            safeDistance
          )
        });
      } else {
        viewer.camera.flyToBoundingSphere(targetSphere, {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-35), // Góc nghiêng mặc định
            safeDistance
          )
        });
      }
    }, [viewAngle, project]);

    // Khởi tạo bản đồ 3D (chạy 1 lần duy nhất khi component mount)
    useEffect(() => {
      if (!cesiumContainer.current) return;
      // Restore the working Cesium Ion setup used by this project.
      // If VITE_CESIUM_ION_TOKEN is configured, prefer it; otherwise keep the
      // existing project token so the globe/base imagery does not fall back to black.
      Cesium.Ion.defaultAccessToken =
        import.meta.env.VITE_CESIUM_ION_TOKEN ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZGU0M2FmNy1hZDAzLTRhNDItYmRiYy05ZDI3NzgxZjJlMTQiLCJpZCI6NDU2MjMyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODQwMTYwNzd9.JUFEkwNgp8X1PjyPe70aAUcb1YvOFSVOK3JyWTKusiw';

      // ── BEST PRACTICE (Cesium Community): Dùng requestRenderMode để tránh render liên tục
      // khi scene không thay đổi — tiết kiệm tới 60% CPU/GPU idle, quan trọng nhất trên mobile
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        animation: false,
        timeline: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        baseLayerPicker: false,
        // ── Tối ưu render (Cesium blog "Performance Tips 2024") ──
        requestRenderMode: true,           // Chỉ render khi có sự kiện → giảm CPU/GPU idle 40-60%
        maximumRenderTimeChange: Infinity, // Không render thêm frame thừa giữa các sự kiện
        targetFrameRate: isMobile ? 30 : 60, // Cap 30fps trên mobile để bảo vệ pin
      });

      viewerRef.current = viewer;
      const removeTranslucentPickComputeGuard = installTranslucentPickComputeGuard(viewer.scene);
      const removePickPositionDiagnostics = installPickPositionDiagnostics(viewer.scene, () => ({
        model: modelRef.current,
        pointClouds: [...new Set([
          ...(pointCloudRef.current ? [pointCloudRef.current] : []),
          ...loadedPointCloudTilesetsRef.current,
        ])],
        dom: domLayerRef.current,
      }));
      viewer.scene.globe.baseColor = Cesium.Color.BLACK;
      if (projectId) openPerf.markCesiumMounted(projectId);
      markViewerPerf(viewerPerfRef, 'cesiumReadyMs');
      const removeInitialPostRender = viewer.scene.postRender.addEventListener(() => {
        removeInitialPostRender();
        setCesiumReady(true);
        setViewerPhase(current => current === 'initializing' ? 'waiting-project' : current);
      });
      viewer.scene.requestRender();
      const handleInitialCameraInput = () => markInitialCameraInteraction();
      viewer.canvas.addEventListener('pointerdown', handleInitialCameraInput, { passive: true });
      viewer.canvas.addEventListener('wheel', handleInitialCameraInput, { passive: true });
      viewer.canvas.addEventListener('touchstart', handleInitialCameraInput, { passive: true });
      let latestCameraHeading = 0;
      let displayedCameraHeading = 0;
      let cameraHeadingFrame: number | null = null;
      const flushCameraHeading = () => {
        cameraHeadingFrame = null;
        if (viewerRef.current !== viewer || viewer.isDestroyed()) return;
        const displayedHeading = Math.round(latestCameraHeading) % 360;
        if (displayedHeading === displayedCameraHeading) return;
        displayedCameraHeading = displayedHeading;
        setCameraHeading(displayedHeading);
      };
      const updateCameraHeading = () => {
        latestCameraHeading = (Cesium.Math.toDegrees(viewer.camera.heading) + 360) % 360;
        if (cameraHeadingFrame === null) {
          cameraHeadingFrame = requestAnimationFrame(flushCameraHeading);
        }
      };
      const clearCameraPreset = () => {
        if (!suppressPresetClearRef.current) setActiveCameraView(null);
      };
      updateCameraHeading();
      viewer.camera.changed.addEventListener(updateCameraHeading);
      viewer.camera.moveStart.addEventListener(clearCameraPreset);
      viewer.scene.pickTranslucentDepth = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;

      // ── BEST PRACTICE: ResolutionScale theo device pixel ratio ──
      // Mobile high-DPI (3x) render gấp 9x pixel so với logical — giảm xuống ≤ 1x logic pixel
      if (isMobile) {
        viewer.resolutionScale = 1.0; // Mobile Standard: giữ độ nét tương đương desktop Standard
        viewer.scene.globe.maximumScreenSpaceError = 4.0;
        // Tắt các effect nặng không cần thiết trên mobile
        viewer.scene.fog.enabled = false;
        if ((viewer.scene.postProcessStages as any).fxaa) {
          (viewer.scene.postProcessStages as any).fxaa.enabled = false;
        }
      } else {
        viewer.scene.globe.maximumScreenSpaceError = 2.0;
      }

      // Terrain is intentionally deferred until the project is first usable.
      // Startup bandwidth stays focused on DOM and the initial camera path.

      measurementEntitiesRef.current = [];

      return () => {
        focusOriginRef.current = null;
        if (cameraHeadingFrame !== null) cancelAnimationFrame(cameraHeadingFrame);
        cameraHeadingFrame = null;
        removeInitialPostRender();
        viewer.canvas.removeEventListener('pointerdown', handleInitialCameraInput);
        viewer.canvas.removeEventListener('wheel', handleInitialCameraInput);
        viewer.canvas.removeEventListener('touchstart', handleInitialCameraInput);
        setCesiumReady(false);
        // Restore tracked styles while primitives are still alive, then release
        // every weak reference before Cesium destroys the scene.
        heatmapControllerRef.current.reset();
        measurementDragCancelRef.current?.();
        measurementDragCancelRef.current = null;
        restoreMeasurementCamera();
        if (measurementDragHandlerRef.current && !measurementDragHandlerRef.current.isDestroyed()) {
          measurementDragHandlerRef.current.destroy();
        }
        measurementDragHandlerRef.current = null;
        clippingControllerRef.current?.destroy();
        clippingControllerRef.current = null;
        if (handlerRef.current) {
          try { handlerRef.current.destroy(); } catch (e) {}
          handlerRef.current = null;
        }

        const v = viewerRef.current;
        viewerRef.current = null;
        if (!viewer.isDestroyed()) viewer.camera.changed.removeEventListener(updateCameraHeading);
        if (!viewer.isDestroyed()) viewer.camera.moveStart.removeEventListener(clearCameraPreset);
        measurementEntitiesRef.current = [];
        areaReferencePlanesRef.current.clear();

        if (v && !v.isDestroyed()) {
          const viewerOwnedResources = [...new Set<object>([
            ...(modelRef.current ? [modelRef.current] : []),
            ...(pointCloudRef.current ? [pointCloudRef.current] : []),
            ...loadedPointCloudTilesetsRef.current,
            ...(domLayerRef.current ? [domLayerRef.current] : []),
          ])];
          viewerOwnedResources.forEach(resource => {
            logLifecycleEvent('retired', resource, { reason: 'viewer-unmount' });
          });
          if (domLayerRef.current) {
            logImageryEvent('project/survey-cleanup', domLayerRef.current, { reason: 'viewer-unmount', projectId, surveyId });
            logImageryEvent('imagery-remove-request', domLayerRef.current, { reason: 'viewer-unmount' });
          }
          try {
            // Tắt render loop ngay lập tức để không có frame tick nào chạy tiếp sau khi unmount
            v.useDefaultRenderLoop = false;
            removePickPositionDiagnostics();
            removeTranslucentPickComputeGuard();
            v.destroy();
          } catch (e) {
            console.error("Lỗi khi hủy Cesium Viewer:", e);
          }
        } else {
          removePickPositionDiagnostics();
          removeTranslucentPickComputeGuard();
        }
      };
    }, []);

    // Phase 2 startup scheduling: World Terrain is useful after entry, but it does
    // not participate in DOM/camera first paint. Defer it until the viewer is ready
    // so terrain requests do not compete with the critical startup assets.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (isMobile || viewerPhase !== 'ready' || terrainLoadStartedRef.current || !viewer || viewer.isDestroyed()) return;

      terrainLoadStartedRef.current = true;
      void Cesium.createWorldTerrainAsync()
        .then(provider => {
          // Terrain is viewer-wide, not project-specific. If the user switches
          // project while this request is in flight, attaching it to the same live
          // Viewer is still correct and avoids starting another terrain request.
          if (viewer.isDestroyed()) return;
          viewer.terrainProvider = provider;
          viewer.scene.requestRender();
        })
        .catch(error => {
          terrainLoadStartedRef.current = false;
          console.error("Lỗi khi load terrain mặc định:", error);
        });
    }, [viewerPhase, isMobile]);

    // Start only from explicit spatial metadata here. Runtime loader bounds race
    // through offerInitialCameraBounds; the first reliable source owns the flight.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!project || !projectId || project.id !== projectId || !viewer || viewer.isDestroyed()) return;

      let longitude = Number(project.centerLon);
      let latitude = Number(project.centerLat);
      if (longitude < 90 && latitude > 90) [longitude, latitude] = [latitude, longitude];
      const west = Number(project.west ?? project.bounds?.west);
      const east = Number(project.east ?? project.bounds?.east);
      const south = Number(project.south ?? project.bounds?.south);
      const north = Number(project.north ?? project.bounds?.north);
      const hasExtent = [west, east, south, north].every(Number.isFinite)
        && west < east && south < north;
      const expectsHigherPriorityBounds = Boolean(project.pointCloudId || project.metadataUrl || project.modelUrl);
      if (hasExtent && !expectsHigherPriorityBounds) {
        const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
        offerInitialCameraBounds(
          'project-extent',
          Cesium.BoundingSphere.fromRectangle3D(rectangle, Cesium.Ellipsoid.WGS84, 0),
        );
        return;
      }

      const expectsRuntimeBounds = expectsHigherPriorityBounds;
      const hasValidCenter = Number.isFinite(longitude) && Number.isFinite(latitude)
        && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
      if (!expectsRuntimeBounds && hasValidCenter) {
        offerInitialCameraBounds(
          'project-center',
          new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(longitude, latitude, 0), 150),
        );
      } else if (!expectsRuntimeBounds && !hasValidCenter) {
        setViewerPhase('error');
      }
    }, [project, projectId]);

    const firstMeaningfulContent = viewerPhase === 'ready';
    const viewerReady = firstMeaningfulContent;

    useEffect(() => {
      if (!import.meta.env.DEV || lastLoggedViewerPhaseRef.current === viewerPhase) return;
      lastLoggedViewerPhaseRef.current = viewerPhase;
      console.info('[ViewerStartupState]', {
        projectId,
        viewerPhase,
        cesiumReady,
        projectBoundsReady: firstProjectBoundsReady,
        primaryVisualReady,
        primaryVisualType: initialCameraRunRef.current.primaryVisualType,
        earthRotationActive,
        initialFlyStarted,
        initialFlyCompleted,
        firstMeaningfulContent,
        modelLoadStatus,
        pointCloudLoadStatus,
        domLoadStatus,
        loadingReason: viewerPhase === 'initializing'
          ? 'cesium-initializing'
          : viewerPhase === 'waiting-project'
            ? 'waiting-project'
            : viewerPhase === 'flying-to-project'
              ? 'flying-to-project'
              : viewerPhase === 'error'
                ? 'invalid-project-bounds-or-source'
                : 'first-meaningful-content',
      });
    }, [viewerPhase, projectId, cesiumReady, firstProjectBoundsReady, primaryVisualReady, earthRotationActive, initialFlyStarted, initialFlyCompleted, firstMeaningfulContent, pointCloudLoadStatus, modelLoadStatus, domLoadStatus]);

    useEffect(() => {
      if (
        !project || activeLayerKeyRef.current !== projectLayerKey ||
        viewerPhase !== 'waiting-project' || initialCameraRunRef.current.primaryVisualType
      ) return;

      // Startup UX intentionally ignores Point Cloud. DOM drives the initial camera;
      // Model may finish later in the background without holding the Viewer intro.
      const expectsDom = Boolean(project.domUrl);
      const expectsModel = Boolean(project.modelUrl);
      const domReady = expectsDom && domLoadStatus === 'ready';
      const domFailed = !expectsDom || ['error', 'unavailable'].includes(domLoadStatus);
      const modelReady = expectsModel && modelLoadStatus === 'ready';
      const modelFailed = !expectsModel || ['error', 'unavailable'].includes(modelLoadStatus);
      const domSettled = domReady || domFailed;
      const modelSettled = modelReady || modelFailed;

      if (displayMode === 'model3d' && modelReady) {
        markPrimaryVisualReady('model');
        return;
      }

      if (!domSettled) return;

      if (domReady) {
        if (modelReady) openPerf.markModelAndDomVisible(project.id);
        markPrimaryVisualReady(modelReady ? 'model' : 'dom');
        return;
      }

      // DOM-less/failed projects retain the existing Model-first fallback.
      if (!modelSettled) return;
      if (modelReady) {
        markPrimaryVisualReady('model');
        return;
      }

      let longitude = Number(project.centerLon);
      let latitude = Number(project.centerLat);
      if (longitude < 90 && latitude > 90) [longitude, latitude] = [latitude, longitude];
      const west = Number(project.west ?? project.bounds?.west);
      const east = Number(project.east ?? project.bounds?.east);
      const south = Number(project.south ?? project.bounds?.south);
      const north = Number(project.north ?? project.bounds?.north);
      if ([west, east, south, north].every(Number.isFinite) && west < east && south < north) {
        const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
        offerInitialCameraBounds(
          'project-extent',
          Cesium.BoundingSphere.fromRectangle3D(rectangle, Cesium.Ellipsoid.WGS84, 0),
        );
      } else if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        offerInitialCameraBounds(
          'project-center',
          new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(longitude, latitude, 0), 150),
        );
      } else {
        setViewerPhase('error');
        return;
      }
      markPrimaryVisualReady('fallback');
    }, [projectLayerKey, viewerPhase, modelLoadStatus, domLoadStatus, displayMode]);

    useEffect(() => {
      if (modelLoadStatus === 'ready') markViewerPerf(viewerPerfRef, 'modelReadyMs');
    }, [modelLoadStatus]);

    useEffect(() => {
      if (pointCloudLoadStatus === 'ready') markViewerPerf(viewerPerfRef, 'pointCloudReadyMs');
    }, [pointCloudLoadStatus]);

    useEffect(() => {
      if (domLoadStatus === 'ready') markViewerPerf(viewerPerfRef, 'domReadyMs');
    }, [domLoadStatus]);

    // Nạp dữ liệu khi identity của project/survey asset thay đổi.
    // Dùng key primitive thay vì object identity để React re-render không vô tình
    // destroy/reload cùng một Model/Point Cloud đang sống.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      if (!project) {
        removeTrackedProjectPrimitives(viewer, 'project-cleared');
        activeLayerProjectRef.current = null;
        activeLayerKeyRef.current = null;
        setModelLoadStatus('idle');
        setPointCloudLoadStatus('idle');
        return;
      }

      let isCurrent = true;
      const resumePointCloudLoad = Boolean(
        activeLayerProjectRef.current?.id === project.id &&
        layerVisibilityRef.current.pointCloud
      );

      // Only retire primitives explicitly owned by the previous project layer.
      // Never remove every primitive in the scene: measurement/clipping/navigation
      // helpers may also live in scene.primitives.
      try {
        heatmapControllerRef.current.reset();
        resetHeatmapRange();
        removeTrackedProjectPrimitives(viewer, 'project-switch');
      } catch (cleanupErr) {
        console.warn("Lỗi dọn dẹp dự án cũ:", cleanupErr);
      }

      activeLayerProjectRef.current = project;
      activeLayerKeyRef.current = projectLayerKey;
      modelLoadGenerationRef.current += 1;
      pointCloudLoadGenerationRef.current += 1;
      setModelLoadStatus(project.modelUrl ? 'idle' : 'unavailable');
      setPointCloudLoadStatus(project.pointCloudId ? 'idle' : 'unavailable');
      setModelLoadError(null);
      setPointCloudLoadError(null);

      let longitude = project.centerLon || 106.8099;
      let latitude = project.centerLat || 10.8404;

      if (longitude < 90 && latitude > 90) {
        const temp = longitude;
        longitude = latitude;
        latitude = temp;
      }

      heatmapControllerRef.current.setProjectReference(
        Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
        String(project.id),
      );

      // 1. Nạp mô hình 3D model
      const loadOfflineModel = async () => {
        if (!isCurrent || activeLayerKeyRef.current !== projectLayerKey || viewer.isDestroyed()) return;
        const inFlight = modelLoadInFlightRef.current;
        // Cleanup invalidates the generation even when the stable key is reused
        // (effect replay / returning to a survey). A stale run cannot dedupe this one.
        if (inFlight?.key === projectLayerKey && inFlight.generation === modelLoadGenerationRef.current) return;
        const generation = ++modelLoadGenerationRef.current;
        const loadRun = { key: projectLayerKey, generation };
        modelLoadInFlightRef.current = loadRun;
        const isActive = () => isCurrent && activeLayerKeyRef.current === projectLayerKey &&
          generation === modelLoadGenerationRef.current && !viewer.isDestroyed();
        let attachedModelForRun: Cesium.Model | null = null;
        try {
          const modelUrl = project.modelUrl;
          if (!modelUrl) {
            if (isActive()) setModelLoadStatus('unavailable');
            console.log("Dự án này không có mô hình 3D Mesh.");
            return;
          }

          setModelLoadStatus('loading');
          setModelLoadError(null);

          let initLon = 0;
          let initLat = 0;
          let initHeight = 0.3;
          let initHeading = 0;
          let initPitch = 0;
          let initRoll = 0;

          if (project.calibration) {
            try {
              const parsed = JSON.parse(project.calibration);
              initLon = parsed.modelLon ?? 0;
              initLat = parsed.modelLat ?? 0;
              initHeight = parsed.modelHeight ?? 0.3;
              initHeading = parsed.modelHeading ?? 0;
              initPitch = parsed.modelPitch ?? 0;
              initRoll = parsed.modelRoll ?? 0;
            } catch (e) {
              console.error("Lỗi parse calibration trong loadOfflineModel:", e);
            }
          } else {
            const saved = localStorage.getItem(`calibration_${project.id}`);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                initLon = parsed.modelLon ?? 0;
                initLat = parsed.modelLat ?? 0;
                initHeight = parsed.modelHeight ?? 0.3;
                initHeading = parsed.modelHeading ?? 0;
                initPitch = parsed.modelPitch ?? 0;
                initRoll = parsed.modelRoll ?? 0;
              } catch (e) { }
            }
          }

          const position = Cesium.Cartesian3.fromDegrees(
            longitude + initLon,
            latitude + initLat,
            initHeight
          );
          const heading = Cesium.Math.toRadians(initHeading);
          const pitch = Cesium.Math.toRadians(initPitch);
          const roll = Cesium.Math.toRadians(initRoll);
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

          const modelMatrix = Cesium.Matrix4.fromRotationTranslation(
            Cesium.Matrix3.fromQuaternion(orientation),
            position
          );

          console.log("Nạp 3D model từ:", modelUrl);

          // Model là một trong hai layer startup chính (Model + DOM), vì vậy cho phép
          // Cesium tự retry các lỗi mạng tạm thời (5xx/429/timeout/network). Không retry
          // 4xx cố định như 404 để tránh tải lặp vô ích khi URL asset thực sự sai.
          const modelResource = new Cesium.Resource({
            url: modelUrl,
            retryAttempts: 2,
            retryCallback: (_resource, requestError) => {
              const statusCode = (requestError as { statusCode?: number } | undefined)?.statusCode;
              return statusCode == null || statusCode === 0 || statusCode === 408 || statusCode === 429 || statusCode >= 500;
            },
          });

          // Giữ options tối thiểu/stable cho GLB. Các option mặc định của Cesium 1.143
          // đã là asynchronous + incrementallyLoadTextures + clampAnimations; không cần
          // ép releaseGltfJson trong startup path. Điều này giảm biến số khi asset GLB
          // có extension/texture đặc thù.
          openPerf.startModel(project.id);

          const modelLoadStartedAt = performance.now();
          if (import.meta.env.DEV) {
            console.info('[ModelLoad] start', {
              projectId: project.id,
              projectLayerKey,
              modelUrl,
              generation,
              requestedVisible: layerVisibilityRef.current.model,
              domLoadStatus,
              displayMode,
              at: new Date().toISOString(),
            });
          }

          const model = await Cesium.Model.fromGltfAsync({
            url: modelResource,
            modelMatrix,
            scale: 1.0,
            incrementallyLoadTextures: true,
          });

          if (import.meta.env.DEV) {
            console.info('[ModelLoad] resolved', {
              projectId: project.id,
              projectLayerKey,
              generation,
              elapsedMs: Math.round(performance.now() - modelLoadStartedAt),
              destroyed: model.isDestroyed(),
              renderReady: model.ready,
              radius: !model.isDestroyed() && model.ready ? model.boundingSphere.radius : undefined,
            });
          }
          registerLifecycleResource(model, 'model', { projectId: String(project.id), surveyId, generation, details: { source: 'gltf' } });

          if (!isActive()) {
            if (import.meta.env.DEV) console.info('[ModelLoad] stale', {
              projectId: project.id,
              projectLayerKey,
              activeLayerKey: activeLayerKeyRef.current,
              generation,
              currentGeneration: modelLoadGenerationRef.current,
            });
            if (!model.isDestroyed()) {
              logLifecycleEvent('retired', model, { reason: 'stale-async-before-add' });
              model.destroy();
            }
            return;
          }
          // Replace only the tracked app-owned model, after the new load succeeds.
          const previousModel = modelRef.current;
          modelRef.current = null;
          if (previousModel && !previousModel.isDestroyed() && viewer.scene.primitives.contains(previousModel)) {
            previousModel.show = false;
            logLifecycleEvent('retired', previousModel, { reason: 'model-reload' });
            viewer.scene.primitives.remove(previousModel);
          }
          viewer.scene.primitives.add(model);
          modelRef.current = model;
          attachedModelForRun = model;
          model.show = layerVisibilityRef.current.model;
          model.color = Cesium.Color.WHITE.withAlpha(layerOpacityRef.current.model);
          // Attachment must render even if later bounds/startup work fails.
          viewer.scene.requestRender();
          logLifecycleEvent('added', model, { collection: 'scene.primitives' });
          if (import.meta.env.DEV) console.info('[ModelLoad] attached', {
            projectId: project.id,
            projectLayerKey,
            generation,
            contains: viewer.scene.primitives.contains(model),
            requestedVisible: layerVisibilityRef.current.model,
            actualShow: model.show,
          });

          // From this point the GLB itself is successfully created and attached.
          // Mark it ready BEFORE camera/startup coordination so a secondary error
          // cannot poison modelLoadStatus and hide an otherwise valid primitive.
          setModelLoadStatus('ready');
          setModelLoadError(null);
          openPerf.endModel(project.id);
          openPerf.markFirstModelVisible(project.id);

          // fromGltfAsync resolves before WebGL readiness. boundingSphere throws
          // until ready; offer the same bounds once Cesium has actually built them.
          let removeReadyListener: (() => void) | undefined;
          const offerReadyModelBounds = () => {
            removeReadyListener?.();
            if (!isActive() || modelRef.current !== model || model.isDestroyed() ||
              !viewer.scene.primitives.contains(model)) return;
            try {
              const bounds = model.boundingSphere;
              if (import.meta.env.DEV) console.info('[ModelLoad] render-ready', {
                projectId: project.id,
                projectLayerKey,
                generation,
                radius: bounds.radius,
                center: bounds.center,
                cameraPosition: viewer.camera.positionWC,
                actualShow: model.show,
              });
              offerInitialCameraBounds('glb', bounds);
            } catch (postLoadError) {
              console.warn('[Model] GLB loaded, but post-load startup coordination failed:', postLoadError);
            } finally {
              viewer.scene.requestRender();
            }
          };
          if (model.ready) offerReadyModelBounds();
          else removeReadyListener = model.readyEvent.addEventListener(offerReadyModelBounds);
        } catch (error) {
          if (isActive()) {
            // If the primitive already exists, the GLB load succeeded. Keep the
            // layer usable and report only a warning instead of a false load error.
            const attachedModel = modelRef.current;
            if (attachedModel && attachedModel === attachedModelForRun &&
              !attachedModel.isDestroyed() && viewer.scene.primitives.contains(attachedModel)) {
              setModelLoadStatus('ready');
              setModelLoadError(null);
              console.warn('[Model] Ignoring post-attach error because the model is already usable:', error);
              return;
            }
            const statusCode = (error as { statusCode?: number } | undefined)?.statusCode;
            const message = error instanceof Error ? error.message : String(error);
            setModelLoadStatus('error');
            setModelLoadError(
              statusCode
                ? `Tải Model thất bại (HTTP ${statusCode})`
                : 'Tải Model thất bại'
            );
            console.error('[ModelLoad] failed', {
              projectId: project.id,
              projectLayerKey,
              generation,
              modelUrl: project.modelUrl,
              statusCode,
              message,
              error,
            });
          }
        } finally {
          if (modelLoadInFlightRef.current === loadRun) {
            modelLoadInFlightRef.current = null;
          }
        }
      };

      // Hàm hỗ trợ: Áp dụng calibration offset cho một tileset
      const applyPcCalibration = (tileset: Cesium.Cesium3DTileset, targetPos: Cesium.Cartesian3) => {
        if (!tileset.boundingSphere) return;

        // Lưu center nguyên bản của tileset đầu tiên làm gốc tọa độ
        if (!pointCloudOriginalCenterRef.current) {
          pointCloudOriginalCenterRef.current = tileset.boundingSphere.center.clone();
        }
        const bsCenter = pointCloudOriginalCenterRef.current;

        let pcLon = 0, pcLat = 0, pcHeight = 0, pcHeading = 0, pcPitch = 0, pcRoll = 0;
        if (project.calibration) {
          try {
            const parsed = JSON.parse(project.calibration);
            pcLon = parsed.pcLon ?? 0;
            pcLat = parsed.pcLat ?? 0;
            pcHeight = parsed.pcHeight ?? 0;
            pcHeading = parsed.pcHeading ?? 0;
            pcPitch = parsed.pcPitch ?? 0;
            pcRoll = parsed.pcRoll ?? 0;
          } catch (e) { }
        } else {
          const saved = localStorage.getItem(`calibration_${project.id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              pcLon = parsed.pcLon ?? 0;
              pcLat = parsed.pcLat ?? 0;
              pcHeight = parsed.pcHeight ?? 0;
              pcHeading = parsed.pcHeading ?? 0;
              pcPitch = parsed.pcPitch ?? 0;
              pcRoll = parsed.pcRoll ?? 0;
            } catch (e) { }
          }
        }

        const offsetPos = Cesium.Cartesian3.fromDegrees(longitude + pcLon, latitude + pcLat, pcHeight);

        // Áp dụng rotation heading/pitch/roll cho point cloud
        const headingRad = Cesium.Math.toRadians(pcHeading);
        const pitchRad = Cesium.Math.toRadians(pcPitch);
        const rollRad = Cesium.Math.toRadians(pcRoll);
        const hpr = new Cesium.HeadingPitchRoll(headingRad, pitchRad, rollRad);

        const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(bsCenter);
        const ecefToEnu = Cesium.Matrix4.inverse(enuToEcef, new Cesium.Matrix4());
        const hprFixedFrame = Cesium.Transforms.headingPitchRollToFixedFrame(offsetPos, hpr);
        tileset.modelMatrix = Cesium.Matrix4.multiply(hprFixedFrame, ecefToEnu, new Cesium.Matrix4());

        console.log("📍 Đã định vị mây điểm chuẩn vị trí ban đầu!");
      };

      // 3. Nạp lớp đám mây điểm Point Cloud
      const loadPointCloud = async () => {
        if (pointCloudLoadInFlightRef.current?.key === projectLayerKey) return;
        const generation = ++pointCloudLoadGenerationRef.current;
        const loadRun = { key: projectLayerKey, generation };
        pointCloudLoadInFlightRef.current = loadRun;
        const isActive = () => isCurrent && generation === pointCloudLoadGenerationRef.current && !viewer.isDestroyed();
        pointCloudIndexAbortRef.current?.abort();
        pointCloudIndexAbortRef.current = null;
        const pcId = project.pointCloudId;
        if (!pcId) {
          pointCloudLoadedRef.current = false;
          if (isActive()) setPointCloudLoadStatus('unavailable');
          console.log("Dự án này không có mây điểm Point Cloud.");
          return;
        }
        pointCloudLoadedRef.current = true;
        const pointCloudSource = classifyPointCloudSource(pcId);

        setPointCloudLoadStatus('loading');
        setPointCloudLoadError(null);
        loadedPointCloudTilesetsRef.current.forEach(tileset => {
          if (!tileset.isDestroyed()) {
            logLifecycleEvent('retired', tileset, { reason: 'point-cloud-reload' });
            viewer.scene.primitives.remove(tileset);
          }
        });
        loadedPointCloudTilesetsRef.current = [];
        pointCloudRef.current = null;
        pointCloudOriginalCenterRef.current = null;

        const targetPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);

        try {
          // Trường hợp 1: URL trỏ tới file COPC đơn (.copc.laz) hoặc tileset.json 3D Tiles
          if (pointCloudSource.kind === 'direct-url') {
            console.log("Nạp Point Cloud COPC/3DTiles từ URL:", pcId);
            const tileset = await Cesium.Cesium3DTileset.fromUrl(pcId);
            registerLifecycleResource(tileset, 'point-cloud', { projectId: String(project.id), surveyId, generation, details: { source: 'direct-url' } });
            if (!isActive()) {
              if (!tileset.isDestroyed()) {
                logLifecycleEvent('retired', tileset, { reason: 'stale-async-before-add' });
                tileset.destroy();
              }
              return;
            }
            viewer.scene.primitives.add(tileset);
            logLifecycleEvent('added', tileset, { collection: 'scene.primitives' });
            pointCloudRef.current = tileset;
            loadedPointCloudTilesetsRef.current = [tileset];
            tileset.show = layerVisibilityRef.current.pointCloud;
            
            // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
            tileset.skipLevelOfDetail = true; // Bỏ qua LOD trung gian giúp giảm 50-70% request HTTP
            tileset.baseScreenSpaceError = 1024;
            tileset.skipScreenSpaceErrorFactor = 16;
            tileset.skipLevels = 1;
            tileset.immediatelyLoadDesiredLevelOfDetail = false; // Tải dần dần để tránh freeze trình duyệt
            (tileset as any).cullRequestsByFrustum = true;
            (tileset as any).preferLeaves = false;
            
            // Foveated Rendering: Giảm chi tiết ở vùng rìa mắt nhìn để tập trung tài nguyên vào tâm camera
            (tileset as any).foveatedScreenSpaceError = true;
            (tileset as any).foveatedConeSize = 0.3;
            (tileset as any).foveatedTimeDelay = 0.05;
            
            // MSSE: SSE càng lớn load càng nhanh. 16.0 cho desktop và 32.0 cho mobile là tỉ lệ vàng.
            tileset.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
            (tileset as any).maximumMemoryUsage = isMobile ? 256 : 1024; // Giới hạn VRAM cache
            
            // Point Cloud Shading: Attenuation tự động giãn cách/thu nhỏ điểm theo khoảng cách
            if (tileset.pointCloudShading) {
              tileset.pointCloudShading.attenuation = true;
              tileset.pointCloudShading.geometricErrorScale = 1.0;
              tileset.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
            }
            
            applyPcCalibration(tileset, targetPosition);
            offerInitialCameraBounds('point-cloud-root', tileset.boundingSphere);
            watchPointCloudCoarseContent(tileset);
            setPointCloudLoadStatus('ready');
            return;
          }

          // Trường hợp 2: URL trỏ tới index.json (custom copc-tiles format)
          if (pointCloudSource.kind === 'custom-index') {
            console.log("Phát hiện custom copc-tiles index.json, đọc danh sách tiles:", pcId);
            try {
              const indexController = new AbortController();
              pointCloudIndexAbortRef.current = indexController;
              const res = await fetch(pcId, { signal: indexController.signal, cache: 'default' });
              if (!res.ok) throw new Error(`Point Cloud index request failed: HTTP ${res.status}`);
              const indexData = await res.json();
              if (pointCloudIndexAbortRef.current === indexController) pointCloudIndexAbortRef.current = null;

              if (isCopcTilesIndex(indexData)) {
                const baseUrl = getPointCloudIndexBaseUrl(pcId);
                const tilesToLoad = indexData.tiles.slice(0, Math.min(indexData.tiles.length, 5));
                console.log(`Nạp ${tilesToLoad.length}/${indexData.tiles.length} COPC tiles từ R2...`);

                let firstTileset: Cesium.Cesium3DTileset | null = null;
                loadedPointCloudTilesetsRef.current = [];
                for (const tileName of tilesToLoad) {
                  try {
                    const tileUrl = resolvePointCloudTileUrl(baseUrl, tileName);
                    const ts = await Cesium.Cesium3DTileset.fromUrl(tileUrl);
                    registerLifecycleResource(ts, 'point-cloud', { projectId: String(project.id), surveyId, generation, details: { source: 'custom-index', tileName } });
                    if (!isActive()) {
                      if (!ts.isDestroyed()) {
                        logLifecycleEvent('retired', ts, { reason: 'stale-async-before-add' });
                        ts.destroy();
                      }
                      return;
                    }
                    viewer.scene.primitives.add(ts);
                    logLifecycleEvent('added', ts, { collection: 'scene.primitives' });
                    ts.show = layerVisibilityRef.current.pointCloud;
                    
                    // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
                    ts.skipLevelOfDetail = true;
                    ts.baseScreenSpaceError = 1024;
                    ts.skipScreenSpaceErrorFactor = 16;
                    ts.skipLevels = 1;
                    ts.immediatelyLoadDesiredLevelOfDetail = false;
                    (ts as any).cullRequestsByFrustum = true;
                    (ts as any).preferLeaves = false;
                    
                    (ts as any).foveatedScreenSpaceError = true;
                    (ts as any).foveatedConeSize = 0.3;
                    (ts as any).foveatedTimeDelay = 0.05;
                    ts.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
                    (ts as any).maximumMemoryUsage = isMobile ? 256 : 1024;

                    if (ts.pointCloudShading) {
                      ts.pointCloudShading.attenuation = true;
                      ts.pointCloudShading.geometricErrorScale = 1.0;
                      ts.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
                    }

                    loadedPointCloudTilesetsRef.current.push(ts);
                    if (!firstTileset) {
                      firstTileset = ts;
                      pointCloudRef.current = ts;
                      applyPcCalibration(ts, targetPosition);
                    } else {
                      if (pointCloudRef.current) {
                        ts.modelMatrix = pointCloudRef.current.modelMatrix.clone();
                      }
                    }
                  } catch (tileErr) {
                    console.warn(`Không thể load tile ${tileName}:`, tileErr);
                  }
                }
                if (firstTileset) {
                  const pointCloudSpheres = loadedPointCloudTilesetsRef.current
                    .filter(ts => !ts.isDestroyed() && !!ts.boundingSphere)
                    .map(ts => ts.boundingSphere);
                  const overviewBounds = pointCloudSpheres.length > 1
                    ? Cesium.BoundingSphere.fromBoundingSpheres(pointCloudSpheres)
                    : firstTileset.boundingSphere;
                  // Custom indexes may split one site into several tilesets.
                  // Fit the complete initial site, not only the first tile.
                  offerInitialCameraBounds('point-cloud-root', overviewBounds);
                  watchPointCloudCoarseContent(firstTileset);
                  setPointCloudLoadStatus('ready');
                  return;
                }
              }
            } catch (indexErr) {
              if (isAbortError(indexErr) || !isActive()) return;
              pointCloudIndexAbortRef.current = null;
              console.warn("Không thể đọc index.json, thử load trực tiếp:", indexErr);
            }
          }

          // Trường hợp 3: Cesium Ion Asset ID (số nguyên)
          if (pointCloudSource.kind === 'ion-asset') {
            const pointCloudAssetId = pointCloudSource.assetId;
            console.log("Nạp Point Cloud từ Cesium Ion Asset ID:", pointCloudAssetId);
            const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(pointCloudAssetId);
            registerLifecycleResource(tileset, 'point-cloud', { projectId: String(project.id), surveyId, generation, details: { source: 'ion', assetId: pointCloudAssetId } });
            if (!isActive()) {
              if (!tileset.isDestroyed()) {
                logLifecycleEvent('retired', tileset, { reason: 'stale-async-before-add' });
                tileset.destroy();
              }
              return;
            }
            viewer.scene.primitives.add(tileset);
            logLifecycleEvent('added', tileset, { collection: 'scene.primitives' });
            pointCloudRef.current = tileset;
            loadedPointCloudTilesetsRef.current = [tileset];
            tileset.show = layerVisibilityRef.current.pointCloud;
            
            // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
            tileset.skipLevelOfDetail = true;
            tileset.baseScreenSpaceError = 1024;
            tileset.skipScreenSpaceErrorFactor = 16;
            tileset.skipLevels = 1;
            tileset.immediatelyLoadDesiredLevelOfDetail = false;
            (tileset as any).cullRequestsByFrustum = true;
            (tileset as any).preferLeaves = false;
            
            (tileset as any).foveatedScreenSpaceError = true;
            (tileset as any).foveatedConeSize = 0.3;
            (tileset as any).foveatedTimeDelay = 0.05;
            tileset.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
            (tileset as any).maximumMemoryUsage = isMobile ? 256 : 1024;

            if (tileset.pointCloudShading) {
              tileset.pointCloudShading.attenuation = true;
              tileset.pointCloudShading.geometricErrorScale = 1.0;
              tileset.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
            }
            
            applyPcCalibration(tileset, targetPosition);
            offerInitialCameraBounds('point-cloud-root', tileset.boundingSphere);
            watchPointCloudCoarseContent(tileset);
            setPointCloudLoadStatus('ready');
            return;
          }

          console.warn("Không nhận diện được định dạng pointCloudId:", pcId);
          pointCloudLoadedRef.current = false;
          if (isActive()) {
            setPointCloudLoadStatus('error');
            setPointCloudLoadError('Tải Point Cloud thất bại');
          }
        } catch (error) {
          if (!isActive()) return;
          pointCloudLoadedRef.current = false;
          setPointCloudLoadStatus('error');
          setPointCloudLoadError('Tải Point Cloud thất bại');
          console.error("Lỗi khi load Point Cloud:", error);
        } finally {
          if (pointCloudLoadInFlightRef.current === loadRun) {
            pointCloudLoadInFlightRef.current = null;
          }
        }
      };

      // Reset lazy load flag khi đổi project
      pointCloudLoadedRef.current = false;

      retryModelRef.current = () => { void loadOfflineModel(); };
      retryPointCloudRef.current = () => { void loadPointCloud(); };

      // Model bắt đầu ngay khi project layer setup, giống behavior cũ đang hoạt động.
      // DOM tải ở effect riêng; Point Cloud vẫn lazy/on-demand.
      if (project.modelUrl) {
        void loadOfflineModel();
      }

      if (resumePointCloudLoad && project.pointCloudId) {
        void loadPointCloud();
      }

      // Point Cloud KHÔNG tải ở startup trên bất kỳ thiết bị nào.
      // Chỉ load khi user chủ động mở tab Point Cloud. Việc này bỏ phần request/parse/GPU
      // nặng nhất khỏi critical path ban đầu; DOM/camera vẫn tải trước.

      return () => {
        // React effect cleanup only invalidates asynchronous ownership.  Physical
        // project primitive retirement is performed by the next keyed effect setup;
        // component unmount remains owned by viewer.destroy().  This prevents an
        // unrelated project object re-render from synchronously destroying textures
        // that Cesium may still reference in the current render/pick command list.
        isCurrent = false;
        modelLoadGenerationRef.current += 1;
        pointCloudLoadGenerationRef.current += 1;
        pointCloudIndexAbortRef.current?.abort();
        pointCloudIndexAbortRef.current = null;
      };
    }, [projectLayerKey]);

    const retryModel = () => retryModelRef.current();
    const retryPointCloud = () => retryPointCloudRef.current();
    const retryDom = () => {
      const viewer = viewerRef.current;
      domLoadGenerationRef.current += 1;
      if (viewer && !viewer.isDestroyed()) removeTrackedDomLayer(viewer, 'dom-retry');
      else domLayerRef.current = null;
      domImageRef.current = null;
      domImageSrcRef.current = null;
      setDomLoadAttempt(attempt => attempt + 1);
    };

    useEffect(() => {
      if (modelRef.current && !modelRef.current.isDestroyed()) {
        modelRef.current.color = Cesium.Color.WHITE.withAlpha(modelOpacity);
      }
      if (domLayerRef.current && !domLayerRef.current.isDestroyed()) {
        domLayerRef.current.alpha = domOpacity;
      }
      viewerRef.current?.scene.requestRender();
    }, [modelOpacity, domOpacity, modelLoadStatus, domLoadStatus]);

    usePointCloudAppearance({
      viewerRef,
      tilesetsRef: loadedPointCloudTilesetsRef,
      heatmapControllerRef,
      pointSize,
      opacity: pointCloudOpacity,
      pointBudget,
      minPointBudget,
      maxPointBudget,
      loadStatus: pointCloudLoadStatus,
    });

    // Cập nhật Góc nhìn (Field of View)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        if (viewer.camera.frustum instanceof Cesium.PerspectiveFrustum) {
          viewer.camera.frustum.fov = Cesium.Math.toRadians(fov);
        }
      }
    }, [fov, isOrthographic]);

    // Cập nhật Shading (Eye Dome Lighting)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.enabled = edlEnabled;
      }
    }, [edlEnabled]);

    // Cập nhật EDL Radius
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.uniforms.screenSpaceRadius = edlRadius;
      }
    }, [edlRadius]);

    // Cập nhật EDL Strength
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.uniforms.strength = edlStrength;
      }
    }, [edlStrength]);

    // Cập nhật Background của scene
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      applySceneBackground(viewer, background, displayMode);
      viewer.scene.requestRender();

      const raf = requestAnimationFrame(() => {
        if (!viewer.isDestroyed()) {
          applySceneBackground(viewer, background, displayMode);
          viewer.scene.requestRender();
        }
      });

      return () => cancelAnimationFrame(raf);
    }, [background, displayMode]);

    useEffect(() => {
      if (viewerPhase !== 'ready') return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      applySceneBackground(viewer, background, displayMode);
      viewer.scene.requestRender();
    }, [viewerPhase, background, displayMode]);

    // Cập nhật Quality (Standard vs High Quality):
    // - High Quality: Tăng độ phân giải hiển thị (Resolution Scale) theo tỷ lệ pixel màn hình,
    //   kích hoạt khử răng cưa FXAA, tăng chi tiết địa hình và bật Attenuation lấp đầy khoảng cách điểm.
    // - Standard: Giảm tải GPU, tối ưu tốc độ khung hình và tiết kiệm pin.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const isHigh = quality === 'high';

      // 1. Resolution Scale & FXAA:
      // High Quality render sắc nét theo DPR thật của màn hình, Standard tối ưu 1.0 (hoặc 0.75 trên mobile)
      viewer.resolutionScale = isHigh 
        ? Math.max(1.0, Math.min(2.0, window.devicePixelRatio || 1.0)) 
        : 1.0;

      const gl =
        viewer.scene.canvas.getContext('webgl2') ??
        viewer.scene.canvas.getContext('webgl');
      const deviceMaxTextureSize = gl
        ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))
        : 4096;
      const domCanvasCap = Math.min(
        isHigh ? 4096 : 2048,
        deviceMaxTextureSize
      );

      if (import.meta.env.DEV) {
        console.info('[Quality]', {
          quality,
          resolutionScale: viewer.resolutionScale,
          domCanvasCap,
          deviceMaxTextureSize,
        });
      }

      if ((viewer.scene.postProcessStages as any).fxaa) {
        (viewer.scene.postProcessStages as any).fxaa.enabled = isHigh;
      }

      // 2. Globe & Terrain Screen Space Error:
      viewer.scene.globe.maximumScreenSpaceError = isHigh ? 1.33 : (isMobile ? 4.0 : 2.0);

      // 3. Point Cloud Shading Attenuation & LOD:
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.maximumScreenSpaceError = isHigh ? 2.0 : (isMobile ? 32.0 : 16.0);
          if (ts.pointCloudShading) {
            ts.pointCloudShading.attenuation = isHigh;
            ts.pointCloudShading.geometricErrorScale = isHigh ? 0.5 : 1.0;
            ts.pointCloudShading.maximumAttenuation = isHigh ? 8.0 : (isMobile ? 2.0 : 4.0);
          }
        }
      });

      viewer.scene.requestRender();
    }, [quality]);

    // Cập nhật Point Budget — điều khiển mật độ điểm và số lượng point cloud hiển thị thực tế
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const minB = minPointBudget || 100_000;
      const maxB = maxPointBudget || 12_000_000;
      const ratio = Math.max(0.0, Math.min(1.0, (pointBudget - minB) / Math.max(1, maxB - minB)));

      // 1. maximumScreenSpaceError (SSE):
      // Khi ratio = 1.0 (Max Budget) -> SSE = 0.3-0.5 (Tải chi tiết tối đa, phân giải toàn bộ các node lá sâu nhất)
      // Khi ratio = 0.0 (Min Budget) -> SSE = 48.0-64.0 (Chỉ hiển thị các node gốc/thô nhất, giảm 90%+ số điểm)
      const baseSSE = quality === 'high' ? 0.3 : 0.5;
      const maxSSE = quality === 'high' ? 48.0 : 64.0;
      const sse = baseSSE + Math.pow(1.0 - ratio, 2.2) * (maxSSE - baseSSE);

      // 2. geometricErrorScale: Khi budget cao -> giảm error scale để ép Cesium load thêm điểm
      const geomScale = 0.4 + Math.pow(1.0 - ratio, 1.5) * 2.6;

      // 3. Memory limit (MB): Cấp phát cache RAM/VRAM tương ứng số điểm
      const memMB = Math.round(128 + ratio * 3968); // 128MB đến 4096MB

      // 4. Skip Level of Detail tuning:
      const skipLevels = ratio > 0.85 ? 0 : Math.min(3, Math.round((1.0 - ratio) * 3));
      const skipFactor = ratio > 0.85 ? 1 : Math.round(1 + (1.0 - ratio) * 15);
      const immediateLOD = ratio > 0.85;

      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.maximumScreenSpaceError = sse;
          (ts as any).maximumMemoryUsage = memMB;
          ts.skipLevels = skipLevels;
          ts.skipScreenSpaceErrorFactor = skipFactor;
          ts.immediatelyLoadDesiredLevelOfDetail = immediateLOD;

          if (ts.pointCloudShading) {
            ts.pointCloudShading.geometricErrorScale = geomScale;
          }
        }
      });

      // Lưu lại giá trị budget của project hiện tại vào localStorage
      if (project?.id) {
        localStorage.setItem(`pointBudget_${project.id}`, pointBudget.toString());
      }

      viewer.scene.requestRender();
    }, [pointBudget, minPointBudget, maxPointBudget, quality, project]);

    // Cập nhật Min Node Size — kích thước tối thiểu node hiển thị
    useEffect(() => {
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          if (ts.pointCloudShading) {
            ts.pointCloudShading.maximumAttenuation = minNodeSize;
          }
        }
      });
    }, [minNodeSize]);

    // Lock View — tắt/bật điều khiển camera
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      viewer.scene.screenSpaceCameraController.enableInputs = !lockView;
      viewer.scene.screenSpaceCameraController.enableRotate = !lockView;
      viewer.scene.screenSpaceCameraController.enableTranslate = !lockView;
      viewer.scene.screenSpaceCameraController.enableZoom = !lockView;
      viewer.scene.screenSpaceCameraController.enableTilt = !lockView;
      viewer.scene.screenSpaceCameraController.enableLook = !lockView;
    }, [lockView]);

    // Cập nhật Hệ chiếu Camera (Perspective vs Orthographic)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const destination = Cesium.Cartesian3.clone(viewer.camera.positionWC);
      const direction = Cesium.Cartesian3.clone(viewer.camera.directionWC);
      const up = Cesium.Cartesian3.clone(viewer.camera.upWC);
      if (isOrthographic) {
        viewer.camera.switchToOrthographicFrustum();
      } else {
        viewer.camera.switchToPerspectiveFrustum();
      }
      viewer.camera.setView({ destination, orientation: { direction, up } });
      viewer.scene.requestRender();
    }, [isOrthographic]);

    const sampleProfileAlongPath = async (
      controlPoints: Cesium.Cartesian3[],
      spacing = 2,
      maxSamples = 1000,
    ): Promise<Omit<ProfileResult, 'id'> | null> => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return null;

      const plan = buildProfileSamplePlan(controlPoints, maxSamples, spacing);
      if (!plan) return null;

      const queryPositions = plan.items.map(item =>
        Cesium.Cartographic.clone(item.cartographic)
      );

      const sampledByScene: Array<Cesium.Cartographic | undefined> =
        new Array(queryPositions.length).fill(undefined);

      // Ưu tiên lấy cao độ trực tiếp từ geometry trong Scene. Cesium hỗ trợ
      // globe/3D Tiles/primitives; width 1m giúp ổn định hơn với point cloud thưa.
      if (viewer.scene.sampleHeightSupported) {
        try {
          const sampled = await viewer.scene.sampleHeightMostDetailed(
            queryPositions.map(position => Cesium.Cartographic.clone(position)),
            [],
            1.0
          );
          sampled.forEach((position, index) => {
            if (position && Number.isFinite(position.height)) {
              sampledByScene[index] = position;
            }
          });
        } catch (error) {
          console.warn('Không thể sample profile từ Scene, thử terrain fallback:', error);
        }
      }

      // Những vị trí Scene không lấy được sẽ thử World Terrain nếu provider có availability.
      const missingIndices = sampledByScene
        .map((position, index) => (!position ? index : -1))
        .filter(index => index >= 0);

      const terrainHeights = new Map<number, number>();
      const terrainProvider = viewer.terrainProvider as Cesium.TerrainProvider & {
        availability?: unknown;
      };

      if (missingIndices.length > 0 && terrainProvider?.availability) {
        try {
          const terrainInputs = missingIndices.map(index =>
            Cesium.Cartographic.clone(plan.items[index].cartographic)
          );
          const terrainSamples = await Cesium.sampleTerrainMostDetailed(
            terrainProvider,
            terrainInputs
          );
          terrainSamples.forEach((position, localIndex) => {
            if (position && Number.isFinite(position.height)) {
              terrainHeights.set(missingIndices[localIndex], position.height);
            }
          });
        } catch (error) {
          console.warn('Không thể sample profile từ terrain:', error);
        }
      }

      let sceneSampleCount = 0;
      let terrainSampleCount = 0;
      let fallbackSampleCount = 0;

      const samples: ProfileSample[] = plan.items.map((item, index) => {
        const scenePosition = sampledByScene[index];
        let height = item.fallbackHeight;
        let source: ProfileSample['source'] = 'control';

        if (scenePosition && Number.isFinite(scenePosition.height)) {
          height = scenePosition.height;
          source = 'scene';
          sceneSampleCount++;
        } else if (terrainHeights.has(index)) {
          height = terrainHeights.get(index)!;
          source = 'terrain';
          terrainSampleCount++;
        } else {
          fallbackSampleCount++;
        }

        return {
          distance: item.distance,
          height,
          position: Cesium.Cartesian3.fromRadians(
            item.cartographic.longitude,
            item.cartographic.latitude,
            height
          ),
          source,
        };
      });

      if (samples.length < 2) return null;

      let elevationGain = 0;
      let elevationLoss = 0;
      for (let i = 1; i < samples.length; i++) {
        const delta = samples[i].height - samples[i - 1].height;
        if (delta > 0) elevationGain += delta;
        else elevationLoss += Math.abs(delta);
      }

      const heights = samples.map(sample => sample.height);

      return {
        samples,
        totalDistance: plan.totalDistance,
        minHeight: Math.min(...heights),
        maxHeight: Math.max(...heights),
        elevationGain,
        elevationLoss,
        sceneSampleCount,
        terrainSampleCount,
        fallbackSampleCount,
      };
    };

    const updateProfileSummaryLabel = (
      record: MeasurementRecord,
      profile: ProfileResult
    ) => {
      const summary = record.summaryLabelEntity;
      if (!summary?.label || record.points.length === 0) return;

      summary.position = new Cesium.ConstantPositionProperty(
        record.points[record.points.length - 1]
      );
      summary.label.text = new Cesium.ConstantProperty(
        `TRẮC DỌC: ${profile.totalDistance.toFixed(2)} m\n` +
        `Hmin: ${profile.minHeight.toFixed(2)} m | Hmax: ${profile.maxHeight.toFixed(2)} m\n` +
        `Tăng: ${profile.elevationGain.toFixed(2)} m | Giảm: ${profile.elevationLoss.toFixed(2)} m | ${profile.samples.length} mẫu`
      );
    };

    const getCutFillSamplingContext = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return undefined;
      const model = modelRef.current && !modelRef.current.isDestroyed() ? modelRef.current : null;
      const pointClouds = loadedPointCloudTilesetsRef.current.filter(tileset => !tileset.isDestroyed());
      const allProjectPrimitives: Array<Cesium.Model | Cesium.Cesium3DTileset> = [
        ...(model ? [model] : []),
        ...pointClouds,
      ];
      const targetPrimitives: Array<Cesium.Model | Cesium.Cesium3DTileset> = displayMode === 'pointcloud'
        ? pointClouds.filter(tileset => tileset.show)
        : displayMode === 'model3d' || displayMode === 'full'
          ? (model?.show ? [model] : [])
          : [];
      const helperEntities = viewer.entities.values.filter(entity =>
        measurementEntitiesRef.current.includes(entity) ||
        !!(entity as any).__clipHandle ||
        !!(entity as any).__clipBody ||
        !!(entity as any).__cutFillReferenceHelper ||
        !!(entity as any).__flightPathVisual ||
        !!(entity as any).__orbitTargetVisual,
      );
      const nonTargetPrimitives = allProjectPrimitives.filter(primitive => !targetPrimitives.includes(primitive));
           const getPrimitiveId = (primitive: object) => {
        const identity = cutFillSurfaceIdsRef.current;
        const existing = identity.ids.get(primitive);
        if (existing) return existing;
        const id = identity.nextId++;
        identity.ids.set(primitive, id);
        return id;
      };
      const sourceKey = [projectId ?? '', displayMode, ...targetPrimitives.map(primitive => {
        const matrix = Cesium.Matrix4.toArray(primitive.modelMatrix).map(value => Number(value).toPrecision(12)).join(',');
        return `${getPrimitiveId(primitive)}:${matrix}`;
      })].join('|');
      return {
        sourceKey,
        samplingOptions: {
          projectObjectsToExclude: [
            ...helperEntities,
            ...nonTargetPrimitives,
            ...(targetPrimitives.length ? [viewer.scene.globe] : []),
          ],
          terrainObjectsToExclude: [...helperEntities, ...allProjectPrimitives],
        },
      };
    };

    const getCutFillPolygonKey = (polygon: Cesium.Cartesian3[]) => polygon
      .map(point => `${point.x.toPrecision(12)},${point.y.toPrecision(12)},${point.z.toPrecision(12)}`)
      .join('|');

    const recalculateCutFill = async (
      referenceMode = cutFillReferenceMode,
      designElevation = cutFillDesignElevation,
      requestedSpacing = cutFillGridSpacing,
      referencePoints = cutFillReferencePoints,
    ) => {
      let data = cutFillDataRef.current;
      if (!data) return;
      if (referenceMode === 'design' && !Number.isFinite(designElevation)) return;
      if (referenceMode === 'threePointPlane' && !buildThreePointReferencePlane(data.plan, referencePoints)) return;
      const generation = ++cutFillCalculationGenerationRef.current;
      const totalStartedAt = performance.now();
      let gridGenerationMs = 0;
      let samplingTimings: VolumeSamplingTimings = { projectSurfaceMs: 0, terrainFallbackMs: 0 };
      setCutFillBusy(true);
      setCutFillProgress(null);
      try {
        const viewer = viewerRef.current;
        const samplingContext = getCutFillSamplingContext();
        if (!viewer || viewer.isDestroyed() || !samplingContext) return;
        const shouldResample = (
          data.polygonKey !== getCutFillPolygonKey(data.polygon) ||
          data.requestedSpacing !== requestedSpacing ||
          data.surfaceKey !== samplingContext.sourceKey
        );
        if (shouldResample) {
          const gridStartedAt = performance.now();
          const plan = buildVolumeGrid(data.polygon, requestedSpacing);
          gridGenerationMs = performance.now() - gridStartedAt;
          if (!plan) return;
          const elevations = await sampleVolumeGrid(viewer.scene, viewer.terrainProvider, plan, {
            ...samplingContext.samplingOptions,
            isCancelled: () => generation !== cutFillCalculationGenerationRef.current,
            onProgress: setCutFillProgress,
            onTimings: timings => { samplingTimings = timings; },
          });
          if (generation !== cutFillCalculationGenerationRef.current || viewer.isDestroyed()) return;
          data = { polygon: data.polygon, polygonKey: getCutFillPolygonKey(data.polygon), plan, elevations, requestedSpacing, surfaceKey: samplingContext.sourceKey };
          cutFillDataRef.current = data;
        }
        const integrationStartedAt = performance.now();
        const result = calculateCutFill(data.polygon, data.plan, data.elevations, referenceMode, designElevation, referencePoints);
        const volumeIntegrationMs = performance.now() - integrationStartedAt;
        if (!result || generation !== cutFillCalculationGenerationRef.current) return;
        setCutFillResult(result);
        if (import.meta.env.DEV) {
          console.info('[CutFill]', {
            timingMs: {
              gridGeneration: gridGenerationMs,
              projectSurfaceSampling: samplingTimings.projectSurfaceMs,
              terrainFallback: samplingTimings.terrainFallbackMs,
              volumeIntegration: volumeIntegrationMs,
              total: performance.now() - totalStartedAt,
            },
            cache: shouldResample ? 'miss' : 'hit',
            areaM2: result.areaM2, sampledAreaM2: result.sampledAreaM2,
            referenceMode: result.referenceMode, referenceElevation: result.referenceElevation,
            gridSpacing: result.gridSpacing, validSamples: result.samples.length,
            invalidSamples: result.invalidSampleCount, coverage: result.validCoverage,
            cutM3: result.cutM3, fillM3: result.fillM3, netM3: result.netM3,
          });
        }
      } finally {
        if (generation === cutFillCalculationGenerationRef.current) {
          setCutFillBusy(false);
          setCutFillProgress(null);
        }
      }
    };

    const refreshProfileRecord = async (record: MeasurementRecord) => {
      if (record.type !== 'profile' || record.points.length < 2) return;

      setIsProfileSampling(true);
      try {
        const sampled = await sampleProfileAlongPath(record.points);
        if (!sampled) return;

        const result: ProfileResult = {
          id: record.id,
          ...sampled,
        };
        record.profileSamples = sampled.samples;

        const sampledLine = record.lineEntities.find(
          entity => (entity as any)._isProfileSampleLine === true
        );
        if (sampledLine?.polyline) {
          sampledLine.polyline.positions = new Cesium.ConstantProperty(
            sampled.samples.map(sample => sample.position)
          );
        }

        updateProfileSummaryLabel(record, result);
        setActiveProfile(result);
        setMeasurementRevision(revision => revision + 1);

        const viewer = viewerRef.current;
        if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
      } finally {
        setIsProfileSampling(false);
        persistMeasurementUpdate(record);
      }
    };

    // Hàm cập nhật hình học thời gian thực khi kéo/tinh chỉnh điểm đo
    const updateMeasurementRecord = (record: MeasurementRecord) => {
      const { type, points, lineEntities, labelEntities, fillEntity, summaryLabelEntity } = record;

      if (type === 'area') {
        const n = points.length;
        for (let i = 0; i < n; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % n];
          const line = lineEntities[i] as any;
          if (line && line.polyline) {
            line.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          }
          const lbl = labelEntities[i] as any;
          if (lbl && lbl.label) {
            const dist = Cesium.Cartesian3.distance(p1, p2);
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(`${dist.toFixed(2)} m`);
          }
        }
        if (fillEntity && (fillEntity as any).polygon) {
          (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(points));
        }
        if (summaryLabelEntity && (summaryLabelEntity as any).label) {
          const finalArea = calculatePolygonArea(points);
          const centroid = calculateCentroid(points);
          summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
          (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
            `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
          );
        }
      } else if (type === 'distance') {
        let total3D = 0;
        let totalH = 0;
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const ca = Cesium.Cartographic.fromCartesian(p1);
          const cb = Cesium.Cartographic.fromCartesian(p2);
          const geo = new Cesium.EllipsoidGeodesic(ca, cb);
          const hDist = geo.surfaceDistance;
          const dz = cb.height - ca.height;
          total3D += Math.sqrt(hDist * hDist + dz * dz);
          totalH += hDist;

          const line = lineEntities[i] as any;
          if (line && line.polyline) {
            line.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          }
          const lbl = labelEntities[i] as any;
          if (lbl && lbl.label) {
            const dist = Cesium.Cartesian3.distance(p1, p2);
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(`${dist.toFixed(2)} m`);
          }
        }
        if (summaryLabelEntity && (summaryLabelEntity as any).label && points.length > 0) {
          summaryLabelEntity.position = new Cesium.ConstantPositionProperty(points[points.length - 1]) as any;
          (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
            `TỔNG 3D: ${total3D.toFixed(2)} m  |  H: ${totalH.toFixed(2)} m`
          );
        }
      } else if (type === 'height') {
        if (points.length >= 2) {
          const startPt = points[0];
          const endPt = points[1];
          const projPt = getProjectedPoint(startPt, endPt);

          const slantDist = Cesium.Cartesian3.distance(startPt, endPt);
          const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
          const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
          const cartoEnd = Cesium.Cartographic.fromCartesian(endPt);
          const heightDiff = cartoEnd.height - cartoStart.height;

          const slantLine = lineEntities[0] as any;
          const horizLine = lineEntities[1] as any;
          const vertLine = lineEntities[2] as any;
          if (slantLine && slantLine.polyline) slantLine.polyline.positions = new Cesium.ConstantProperty([startPt, endPt]);
          if (horizLine && horizLine.polyline) horizLine.polyline.positions = new Cesium.ConstantProperty([startPt, projPt]);
          if (vertLine && vertLine.polyline) vertLine.polyline.positions = new Cesium.ConstantProperty([projPt, endPt]);

          if (fillEntity && (fillEntity as any).polygon) {
            (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy([startPt, projPt, endPt]));
          }

          const dzBadge = labelEntities[0] as any;
          const hBadge = labelEntities[1] as any;
          const sBadge = labelEntities[2] as any;
          if (dzBadge && dzBadge.label) {
            dzBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(projPt, endPt));
            dzBadge.label.text = new Cesium.ConstantProperty(`CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`);
          }
          if (hBadge && hBadge.label) {
            hBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(startPt, projPt));
            hBadge.label.text = new Cesium.ConstantProperty(`Ngang: ${horizDist.toFixed(2)} m`);
          }
          if (sBadge && sBadge.label) {
            sBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(startPt, endPt));
            sBadge.label.text = new Cesium.ConstantProperty(`Xiên: ${slantDist.toFixed(2)} m`);
          }
        }
      } else if (type === 'point') {
        const lbl = labelEntities[0] as any;
        if (points.length >= 1 && lbl && lbl.label) {
          const carto = Cesium.Cartographic.fromCartesian(points[0]);
          const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
          const height = carto.height.toFixed(2);
          lbl.position = new Cesium.ConstantPositionProperty(points[0]);
          lbl.label.text = new Cesium.ConstantProperty(`X: ${lon}°\nY: ${lat}°\nZ: ${height} m`);
        }
      } else if (type === 'angle') {
        if (points.length === 3) {
          const [p1, p2, p3] = points;
          const l1 = lineEntities[0] as any;
          const l2 = lineEntities[1] as any;
          if (l1 && l1.polyline) l1.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          if (l2 && l2.polyline) l2.polyline.positions = new Cesium.ConstantProperty([p2, p3]);
          const angleDeg = calculateAngleDegrees(p1, p2, p3);
          if (angleDeg === null) return;
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(p2);
            lbl.label.text = new Cesium.ConstantProperty(`GÓC: ${angleDeg.toFixed(2)}°`);
          }
        }
      } else if (type === 'circle') {
        if (points.length >= 2) {
          const [center, edge] = points;
          const radius = Cesium.Cartesian3.distance(center, edge);
          const circleArea = Math.PI * radius * radius;
          if (fillEntity?.ellipse) {
            fillEntity.position = new Cesium.ConstantPositionProperty(center);
            fillEntity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius);
            fillEntity.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius);
          }
          const l = lineEntities[0] as any;
          if (l && l.polyline) l.polyline.positions = new Cesium.ConstantProperty([center, edge]);
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(center, edge));
            lbl.label.text = new Cesium.ConstantProperty(
              `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH: ${circleArea.toFixed(2)} m²`
            );
          }
        }
      } else if (type === 'sphere') {
        if (points.length >= 2) {
          const [center, edge] = points;
          const radius = Cesium.Cartesian3.distance(center, edge);
          const surfaceArea = 4 * Math.PI * radius * radius;
          const sphereVolume = (4 / 3) * Math.PI * radius * radius * radius;
          const line = lineEntities[0];
          if (line?.polyline) line.polyline.positions = new Cesium.ConstantProperty([center, edge]);
          if (fillEntity?.ellipsoid) {
            fillEntity.position = new Cesium.ConstantPositionProperty(center);
            fillEntity.ellipsoid.radii = new Cesium.ConstantProperty(new Cesium.Cartesian3(radius, radius, radius));
          }
          const label = labelEntities[0];
          if (label?.label) {
            label.position = new Cesium.ConstantPositionProperty(getMidpoint(center, edge));
            label.label.text = new Cesium.ConstantProperty(
              `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH MẶT CẦU: ${surfaceArea.toFixed(2)} m²\nTHỂ TÍCH: ${sphereVolume.toFixed(2)} m³`
            );
          }
        }
      } else if (type === 'azimuth') {
        if (points.length >= 2) {
          const [p1, p2] = points;
          const c1 = Cesium.Cartographic.fromCartesian(p1);
          const c2 = Cesium.Cartographic.fromCartesian(p2);
          const geodesic = new Cesium.EllipsoidGeodesic(c1, c2);
          const azimuthDeg = (Cesium.Math.toDegrees(geodesic.startHeading) + 360) % 360;
          const dist = geodesic.surfaceDistance;
          const l = lineEntities[0] as any;
          if (l && l.polyline) l.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(
              `AZIMUTH: ${azimuthDeg.toFixed(2)}° | Khoảng cách: ${dist.toFixed(2)} m`
            );
          }
        }
      } else if (type === 'annotation') {
        const lbl = labelEntities[0] as any;
        if (points.length >= 1 && lbl) {
          lbl.position = new Cesium.ConstantPositionProperty(points[0]);
        }
      } else if (type === 'volume') {
        if (points.length >= 3) {
          const area = calculatePolygonArea(points);
          const centroid = calculateCentroid(points);
          const heights = points.map(p => Cesium.Cartographic.fromCartesian(p).height);
          const hMin = Math.min(...heights);
          const hMax = Math.max(...heights);
          const deltaH = Math.max(0, hMax - hMin);
          const volume = area * deltaH;
          if (fillEntity && (fillEntity as any).polygon) {
            (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(points));
            (fillEntity as any).polygon.extrudedHeight = new Cesium.ConstantProperty(hMax);
          }
          if (summaryLabelEntity && (summaryLabelEntity as any).label) {
            summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
            (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
              `THỂ TÍCH LĂNG TRỤ ƯỚC TÍNH: ${volume.toFixed(2)} m³\nDiện tích: ${area.toFixed(2)} m² | ΔH: ${deltaH.toFixed(2)} m`
            );
          }
        }
      } else if (type === 'profile') {
        if (points.length >= 2) {
          const controlLines = lineEntities.filter(
            entity => (entity as any)._isProfileSampleLine !== true
          );
          for (let i = 0; i < points.length - 1; i++) {
            const line = controlLines[i];
            if (line?.polyline) {
              line.polyline.positions = new Cesium.ConstantProperty([
                points[i],
                points[i + 1],
              ]);
            }
          }
          const preview = buildControlProfilePreview(record.id, points);
          record.profileSamples = preview.samples;
          const sampledLine = lineEntities.find(entity => (entity as any)._isProfileSampleLine === true);
          if (sampledLine?.polyline) sampledLine.polyline.positions = new Cesium.ConstantProperty(points);
          updateProfileSummaryLabel(record, preview);
          setActiveProfile(preview);
        }
      }
    };

    const hydrateMeasurementRecord = (persisted: Awaited<ReturnType<typeof fetchProjectMeasurements>>[number]): MeasurementRecord | null => {
      const viewer = viewerRef.current;
      const data = deserializeMeasurement(persisted);
      if (!viewer || viewer.isDestroyed() || !data) return null;
      const pointEntities: Cesium.Entity[] = [];
      const lineEntities: Cesium.Entity[] = [];
      const labelEntities: Cesium.Entity[] = [];
      let fillEntity: Cesium.Entity | undefined;
      let summaryLabelEntity: Cesium.Entity | undefined;
      const show = showMeasurements && data.visible;
      const add = (options: Cesium.Entity.ConstructorOptions) => {
        const entity = viewer.entities.add({ ...options, show });
        measurementEntitiesRef.current.push(entity);
        return entity;
      };
      const addPoint = (position: Cesium.Cartesian3, index: number) => {
        const entity = add({
          position,
          billboard: {
            image: MEASUREMENT_RING_DOT_IMAGE, width: 9, height: 9,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        (entity as any)._isMeasurePoint = true;
        (entity as any)._measureId = data.id;
        (entity as any)._pointIndex = index;
        pointEntities.push(entity);
      };
      const addLine = (positions: Cesium.Cartesian3[]) => {
        const entity = add({ polyline: {
          positions, width: 4,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromCssColorString('#00e5ff'),
            outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5
          })
        } });
        lineEntities.push(entity);
        return entity;
      };
      const addLabel = (position: Cesium.Cartesian3, text: string) => {
        const entity = add({ position, label: {
          text, font: 'bold 13px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2.5,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE, showBackground: true,
          backgroundColor: new Cesium.Color(0.02, 0.2, 0.28, 0.94),
          backgroundPadding: new Cesium.Cartesian2(10, 5),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } });
        labelEntities.push(entity);
        return entity;
      };

      let points = data.points.map(point => Cesium.Cartesian3.clone(point));
      if (data.type === 'area') {
        const plane = buildAreaReferencePlane(points);
        if (plane) {
          points = normalizeAreaPoints(points, plane);
          areaReferencePlanesRef.current.set(data.id, plane);
        }
      }
      points.forEach(addPoint);
      const labelAt = (index: number, fallback = '') => data.labelTexts[index] ?? fallback;

      if (data.type === 'area') {
        points.forEach((point, index) => {
          const next = points[(index + 1) % points.length];
          addLine([point, next]);
          addLabel(getMidpoint(point, next), labelAt(index, `${Cesium.Cartesian3.distance(point, next).toFixed(2)} m`));
        });
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy(points), material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22) } });
        summaryLabelEntity = addLabel(calculateCentroid(points), data.label ?? getMeasurementValue({ id: data.id, type: data.type, points, pointEntities, lineEntities, labelEntities }));
        labelEntities.pop();
      } else if (data.type === 'distance') {
        for (let index = 1; index < points.length; index++) {
          addLine([points[index - 1], points[index]]);
          addLabel(getMidpoint(points[index - 1], points[index]), labelAt(index - 1));
        }
        summaryLabelEntity = addLabel(points.at(-1)!, data.label ?? '');
        labelEntities.pop();
      } else if (data.type === 'height' && points.length >= 2) {
        const projected = getProjectedPoint(points[0], points[1]);
        addLine([points[0], points[1]]); addLine([points[0], projected]); addLine([projected, points[1]]);
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy([points[0], projected, points[1]]), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.12) } });
        addLabel(getMidpoint(projected, points[1]), labelAt(0));
        addLabel(getMidpoint(points[0], projected), labelAt(1));
        addLabel(getMidpoint(points[0], points[1]), labelAt(2));
      } else if (data.type === 'angle' && points.length === 3) {
        addLine([points[0], points[1]]); addLine([points[1], points[2]]);
        addLabel(points[1], data.label ?? labelAt(0));
      } else if (data.type === 'point') {
        addLabel(points[0], data.label ?? labelAt(0));
      } else if ((data.type === 'circle' || data.type === 'sphere') && points.length >= 2) {
        const radius = Cesium.Cartesian3.distance(points[0], points[1]);
        addLine([points[0], points[1]]);
        fillEntity = data.type === 'circle'
          ? add({ position: points[0], ellipse: { semiMajorAxis: radius, semiMinorAxis: radius, material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff') } })
          : add({ position: points[0], ellipsoid: { radii: new Cesium.Cartesian3(radius, radius, radius), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff') } });
        addLabel(getMidpoint(points[0], points[1]), data.label ?? labelAt(0));
      } else if (data.type === 'azimuth' && points.length >= 2) {
        addLine([points[0], points[1]]);
        addLabel(getMidpoint(points[0], points[1]), data.label ?? labelAt(0));
      } else if (data.type === 'annotation') {
        addLabel(points[0], data.label ?? labelAt(0, 'Ghi chú 3D'));
      } else if (data.type === 'volume' && points.length >= 3) {
        const maxHeight = Math.max(...points.map(point => Cesium.Cartographic.fromCartesian(point).height));
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy(points), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.35), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff'), extrudedHeight: maxHeight } });
        summaryLabelEntity = addLabel(calculateCentroid(points), data.label ?? '');
        labelEntities.pop();
      } else if (data.type === 'profile' && points.length >= 2) {
        for (let index = 1; index < points.length; index++) {
          addLine([points[index - 1], points[index]]);
        }
        const sampledPositions = data.profileSamples?.map(sample => sample.position) ?? points;
        const sampledLine = addLine(sampledPositions);
        (sampledLine as any)._isProfileSampleLine = true;
        summaryLabelEntity = addLabel(points.at(-1)!, data.label ?? '');
        labelEntities.pop();
      }

      const record: MeasurementRecord = {
        id: data.id, type: data.type, points, pointEntities, lineEntities, labelEntities,
        fillEntity, summaryLabelEntity, profileSamples: data.profileSamples,
        visible: data.visible, isFinalized: true
      };
      if (record.type === 'area') getAreaReferencePlane(record);
      if (data.type !== 'profile' && data.type !== 'annotation') updateMeasurementRecord(record);
      return record;
    };

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      if (!projectId || !project) {
        hydratedMeasurementsProjectRef.current = null;
        return;
      }
      if (String(project.id) !== String(projectId)) return;
      // Measurement persistence is optional/background work. Do not let its API
      // request compete with Model + DOM during the Earth intro/startup path.
      if (viewerPhase !== 'ready') return;
      if (hydratedMeasurementsProjectRef.current === projectId) return;

      // A project switch replaces only the local measurement layer. It must not
      // invoke the backend Clear endpoint for the project being left.
      measurementEntitiesRef.current.forEach(entity => {
        try { viewer.entities.remove(entity); } catch (_error) {}
      });
      crossSectionEntitiesRef.current.forEach(entity => {
        try { viewer.entities.remove(entity); } catch (_error) {}
      });
      crossSectionEntitiesRef.current = [];
      cutFillEntitiesRef.current.forEach(entity => {
        try { viewer?.entities.remove(entity); } catch (_error) {}
      });
      cutFillEntitiesRef.current = [];
      clearCutFillReferenceEntities();
      cutFillDataRef.current = null;
      cutFillCalculationGenerationRef.current += 1;
      setCutFillBusy(false);
      setCutFillProgress(null);
      setCutFillPolygonReady(false);
      setCutFillReferencePoints([]);
      setSelectingCutFillReferencePoints(false);
      setCutFillReferenceError(null);
      setCrossSection(null);
      setCutFillResult(null);
      measurementEntitiesRef.current = [];
      measurementsStoreRef.current = [];
      areaReferencePlanesRef.current.clear();
      setMeasurementPoints([]);
      setActiveProfile(null);
      setCrossSection(null);
      hydratedMeasurementsProjectRef.current = projectId;
      let cancelled = false;
      void fetchProjectMeasurements(projectId)
        .then(records => {
          if (cancelled) return;
          records.forEach(persisted => {
            const record = hydrateMeasurementRecord(persisted);
            if (record) measurementsStoreRef.current.push(record);
          });
          setMeasurementRevision(revision => revision + 1);
          viewer.scene.requestRender();
        })
        .catch(error => {
          if (hydratedMeasurementsProjectRef.current === projectId) {
            hydratedMeasurementsProjectRef.current = null;
          }
          console.error('[Measurement persistence] load:', error);
        });
      return () => { cancelled = true; };
      // Hydration is keyed by project identity and deferred until viewer ready.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, project, viewerPhase]);

    // Helper bắt tọa độ 3D thông minh
    const getPickedPosition = (windowPosition: Cesium.Cartesian2): Cesium.Cartesian3 | null => {
      const v = viewerRef.current;
      if (!v || v.isDestroyed() || !windowPosition) return null;
      const nonSurfaceEntities = new Set<Cesium.Entity>(measurementEntitiesRef.current);
      v.entities.values.forEach(entity => {
        if (
          (entity as any).__clipHandle ||
          (entity as any).__clipBody ||
          (entity as any).__cutFillReferenceHelper ||
          (entity as any).__flightPathVisual ||
          (entity as any).__orbitTargetVisual
        ) nonSurfaceEntities.add(entity);
      });
      const model = modelRef.current;
      const projectPrimitives: Array<Cesium.Model | Cesium.Cesium3DTileset> = [
        ...(model && !model.isDestroyed() ? [model] : []),
        ...loadedPointCloudTilesetsRef.current.filter(tileset => !tileset.isDestroyed()),
      ];
      return getSceneSurfacePosition(v, windowPosition, {
        isHelperEntity: entity => nonSurfaceEntities.has(entity),
        projectPrimitives,
      });
    };

    // ─────────────────────────────────────────────────────────────
    // EFFECT 1: TẠO VÀ CHỐT PHÉP ĐO MỚI (CLICK-TO-MEASURE POTREE V1.8)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }

      measurementDragCancelRef.current?.();
      restoreMeasurementCamera();

      if (toolMode === 'none' && !selectingCutFillReferencePoints) {
        setMeasurementPoints([]);
        return;
      }

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handlerRef.current = handler;
      viewer.scene.canvas.style.cursor = 'crosshair';

      if (selectingCutFillReferencePoints) {
        const addReferenceMarker = (point: Cesium.Cartesian3, index: number) => {
          const marker = viewer.entities.add({
            position: point,
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromCssColorString('#22d3ee'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              disableDepthTestDistance: 0,
            },
            label: {
              text: `P${index}`,
              font: 'bold 12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -18),
              disableDepthTestDistance: 0,
            },
          });
          (marker as any).__cutFillReferenceHelper = true;
          cutFillReferenceEntitiesRef.current.push(marker);
        };

        handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
          const data = cutFillDataRef.current;
          const point = getPickedPosition(click.position);
          if (!data || !point || cutFillReferencePoints.length >= 3) return;
          const nextPoints = [...cutFillReferencePoints, Cesium.Cartesian3.clone(point)];

          if (nextPoints.length === 3 && !buildThreePointReferencePlane(data.plan, nextPoints)) {
            setCutFillReferenceError('Ba điểm không tạo được mặt phẳng tham chiếu. Vui lòng chọn lại P3.');
            return;
          }

          addReferenceMarker(point, nextPoints.length);
          setCutFillReferencePoints(nextPoints);
          setCutFillReferenceError(null);

          if (nextPoints.length === 2) {
            const line = viewer.entities.add({
              polyline: {
                positions: nextPoints,
                width: 1.5,
                material: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.8),
              },
            });
            (line as any).__cutFillReferenceHelper = true;
            (line as any).__cutFillReferenceLine = true;
            cutFillReferenceEntitiesRef.current.push(line);
          } else if (nextPoints.length === 3) {
            const previousLine = cutFillReferenceEntitiesRef.current.find(entity => !!(entity as any).__cutFillReferenceLine);
            if (previousLine) {
              viewer.entities.remove(previousLine);
              cutFillReferenceEntitiesRef.current = cutFillReferenceEntitiesRef.current.filter(entity => entity !== previousLine);
            }
            const triangle = viewer.entities.add({
              polyline: {
                positions: [...nextPoints, nextPoints[0]],
                width: 1.5,
                material: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.8),
              },
            });
            (triangle as any).__cutFillReferenceHelper = true;
            (triangle as any).__cutFillReferenceLine = true;
            cutFillReferenceEntitiesRef.current.push(triangle);
            setSelectingCutFillReferencePoints(false);
            void recalculateCutFill('threePointPlane', cutFillDesignElevation, cutFillGridSpacing, nextPoints);
          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        const cancelReferenceSelection = (event: KeyboardEvent) => {
          if (event.key !== 'Escape') return;
          setSelectingCutFillReferencePoints(false);
          setCutFillReferencePoints([]);
          setCutFillReferenceError(null);
          clearCutFillReferenceEntities();
        };
        window.addEventListener('keydown', cancelReferenceSelection);

        return () => {
          window.removeEventListener('keydown', cancelReferenceSelection);
          if (handler && !handler.isDestroyed()) handler.destroy();
          if (handlerRef.current === handler) handlerRef.current = null;
          if (!viewer.isDestroyed()) viewer.scene.canvas.style.cursor = 'default';
        };
      }

      const defaultHandler = viewer.cesiumWidget.screenSpaceEventHandler;
      const defaultDoubleClick = defaultHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      defaultHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

      const recordId = `measure_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let activePoints: Cesium.Cartesian3[] = [];
      let tempEntities: Cesium.Entity[] = [];

      const pointEntities: Cesium.Entity[] = [];
      const lineEntities: Cesium.Entity[] = [];
      const labelEntities: Cesium.Entity[] = [];
      let fillEntity: Cesium.Entity | undefined;
      let summaryLabelEntity: Cesium.Entity | undefined;
      let measurementFinalized = false;

      const currentRecord: MeasurementRecord = {
        id: recordId,
        type: toolMode,
        points: activePoints,
        pointEntities,
        lineEntities,
        labelEntities,
        fillEntity,
        summaryLabelEntity
      };
      measurementsStoreRef.current.push(currentRecord);

      const finalizeCurrentRecord = (record: MeasurementRecord) => {
        measurementDragCancelRef.current?.();
        restoreMeasurementCamera();
        finishInteractiveTool(viewer, clearTempEntities);
        if (record.type === 'area') {
          const plane = buildAreaReferencePlane(record.points);
          if (plane) {
            record.points = normalizeAreaPoints(record.points, plane);
            areaReferencePlanesRef.current.set(record.id, plane);
          }
        }
        Object.assign(currentRecord, record, { visible: true, isFinalized: true });
        if (currentRecord.type === 'area') {
          currentRecord.pointEntities.forEach((entity, index) => {
            entity.position = new Cesium.ConstantPositionProperty(currentRecord.points[index]);
          });
          updateMeasurementRecord(currentRecord);
        }
        measurementFinalized = true;
        setMeasurementRevision(revision => revision + 1);
        if (projectId) {
          const payload = serializeMeasurementRecord(currentRecord);
          enqueueMeasurementPersistence(currentRecord.id, () => createProjectMeasurement(projectId, payload));
        }
      };

      const clearTempEntities = () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        tempEntities.forEach(ent => {
          try {
            v.entities.remove(ent);
            measurementEntitiesRef.current = measurementEntitiesRef.current.filter(e => e !== ent);
          } catch (e) {}
        });
        tempEntities = [];
      };

      const safeAdd = (entityOpts: Cesium.Entity.ConstructorOptions, isTemp = false): Cesium.Entity | null => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return null;
        try {
          const entity = v.entities.add(entityOpts);
          measurementEntitiesRef.current.push(entity);
          if (isTemp) tempEntities.push(entity);
          return entity;
        } catch (e) {
          return null;
        }
      };

      // Chuột phải: Hủy đo đạc dở dang
      handler.setInputAction(() => {
        clearTempEntities();
        activePoints = [];
        setMeasurementPoints([]);
        measurementsStoreRef.current = measurementsStoreRef.current.filter(m => m.id !== recordId);
        setCameraInteractionEnabled(viewer, true);
        viewer.scene.canvas.style.cursor = 'default';
        setToolMode('none');
        viewer.scene.requestRender();
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      // Helper tạo điểm chốt đỏ nổi bật có gắn metadata tinh chỉnh
      const addMeasurePoint = (pos: Cesium.Cartesian3, pointIdx: number, _colorHex = '#ff0055', _size = 9) => {
        const entity = safeAdd({
          position: pos,
          billboard: {
            image: MEASUREMENT_RING_DOT_IMAGE,
            width: 9,
            height: 9,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        if (entity) {
          (entity as any)._isMeasurePoint = true;
          (entity as any)._measureId = recordId;
          (entity as any)._pointIndex = pointIdx;
          pointEntities.push(entity);
        }
        return entity;
      };

      // Helper tạo nhãn đo khoảng cách cạnh
      const addEdgeDistanceBadge = (p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, text?: string, isTemp = false) => {
        const dist = Cesium.Cartesian3.distance(p1, p2);
        const labelText = text || `${dist.toFixed(2)} m`;
        return safeAdd({
          position: getMidpoint(p1, p2),
          label: {
            text: labelText,
            font: 'bold 13px "JetBrains Mono", sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2.5,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
            backgroundPadding: new Cesium.Cartesian2(9, 5),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, -14),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        }, isTemp);
      };

      // ─────────────────────────────────────────────────────────────
      // ─────────────────────────────────────────────────────────────
      // 1. ĐO DIỆN TÍCH (AREA)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'area') {
        let closingLineEntity: Cesium.Entity | undefined;
        let closingLabelEntity: Cesium.Entity | undefined;
        let lastAreaClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const lastPt = activePoints[activePoints.length - 1];
          const firstPt = activePoints[0];

          // Đường dóng từ điểm cuối đến vị trí chuột hiện tại
          safeAdd({
            polyline: {
              positions: [lastPt, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), dashLength: 8 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.6), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(lastPt, mousePos, undefined, true);

          // Khi đã có từ 2 điểm (chuột đang là điểm thứ 3 trở lên): dóng khép kín về điểm đầu và hiển thị diện tích xem trước
          if (activePoints.length >= 2) {
            safeAdd({
              polyline: {
                positions: [mousePos, firstPt],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.8), dashLength: 8 }),
                depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.5), dashLength: 8 })
              }
            }, true);
            addEdgeDistanceBadge(mousePos, firstPt, undefined, true);

            const polygonHierarchy = [...activePoints, mousePos];
            safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(polygonHierarchy),
                material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.18),
                outline: false
              }
            }, true);

          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (
            lastAreaClick &&
            clickTime - lastAreaClick.time < 500 &&
            Cesium.Cartesian2.distance(lastAreaClick.position, click.position) < 5
          ) return;
          lastAreaClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(pt, idx);

          // Nối cạnh cố định giữa điểm trước và điểm vừa click
          if (activePoints.length >= 2) {
            const pPrev = activePoints[activePoints.length - 2];
            const pCurr = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [pPrev, pCurr],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) {
              const closingIndex = closingLineEntity ? lineEntities.indexOf(closingLineEntity) : -1;
              if (closingIndex >= 0) lineEntities.splice(closingIndex, 0, line);
              else lineEntities.push(line);
            }
            const badge = addEdgeDistanceBadge(pPrev, pCurr);
            if (badge) {
              const closingIndex = closingLabelEntity ? labelEntities.indexOf(closingLabelEntity) : -1;
              if (closingIndex >= 0) labelEntities.splice(closingIndex, 0, badge);
              else labelEntities.push(badge);
            }
          }

          // Bắt đầu từ điểm thứ 3 trở lên (activePoints.length >= 3):
          // Ngay lập tức kết nối đa giác các điểm đã có và tính diện tích
          if (activePoints.length >= 3) {
            const firstPt = activePoints[0];
            const lastPt = activePoints[activePoints.length - 1];

            if (!closingLineEntity) {
              closingLineEntity = safeAdd({
                polyline: {
                  positions: [lastPt, firstPt],
                  width: 4.5,
                  material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                  depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
                }
              }) || undefined;
              if (closingLineEntity) lineEntities.push(closingLineEntity);
            } else if (closingLineEntity.polyline) {
              closingLineEntity.polyline.positions = new Cesium.ConstantProperty([lastPt, firstPt]);
            }

            if (!closingLabelEntity) {
              closingLabelEntity = addEdgeDistanceBadge(lastPt, firstPt) || undefined;
              if (closingLabelEntity) labelEntities.push(closingLabelEntity);
            } else if (closingLabelEntity.label) {
              closingLabelEntity.position = new Cesium.ConstantPositionProperty(getMidpoint(lastPt, firstPt));
              closingLabelEntity.label.text = new Cesium.ConstantProperty(
                `${Cesium.Cartesian3.distance(lastPt, firstPt).toFixed(2)} m`
              );
            }

            const curArea = calculatePolygonArea(activePoints);
            const curCentroid = calculateCentroid(activePoints);

            // Cập nhật hoặc tạo mặt phẳng đa giác cố định cho các điểm đã chốt
            if (!fillEntity) {
              fillEntity = safeAdd({
                polygon: {
                  hierarchy: new Cesium.PolygonHierarchy(activePoints),
                  material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22),
                  outline: false
                }
              }) || undefined;
            } else if ((fillEntity as any).polygon) {
              (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(activePoints));
            }

            // Cập nhật hoặc tạo nhãn diện tích cố định tại trọng tâm
            if (!summaryLabelEntity) {
              summaryLabelEntity = safeAdd({
                position: curCentroid,
                label: {
                  text: `DIỆN TÍCH: ${curArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`,
                  font: 'bold 15px "JetBrains Mono", sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2.5,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  showBackground: true,
                  backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                  backgroundPadding: new Cesium.Cartesian2(14, 7),
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              }) || undefined;
            } else if ((summaryLabelEntity as any).label) {
              summaryLabelEntity.position = new Cesium.ConstantPositionProperty(curCentroid) as any;
              (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
                `DIỆN TÍCH: ${curArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
              );
            }
          }

          clearTempEntities();
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Nhấp đúp chuột để chốt và hoàn tất đo diện tích
        handler.setInputAction(() => {
          clearTempEntities();
          if (activePoints.length >= 3) {
            const firstPt = activePoints[0];
            const lastPt = activePoints[activePoints.length - 1];
            if (!closingLineEntity) {
              closingLineEntity = safeAdd({
                polyline: {
                  positions: [lastPt, firstPt],
                  width: 4.5,
                  material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                  depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
                }
              }) || undefined;
              if (closingLineEntity) lineEntities.push(closingLineEntity);
            }
            if (!closingLabelEntity) {
              closingLabelEntity = addEdgeDistanceBadge(lastPt, firstPt) || undefined;
              if (closingLabelEntity) labelEntities.push(closingLabelEntity);
            }

            if (!fillEntity) {
              fillEntity = safeAdd({
                polygon: {
                  hierarchy: new Cesium.PolygonHierarchy(activePoints),
                  material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22),
                  outline: false
                }
              }) || undefined;
            } else if ((fillEntity as any).polygon) {
              (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(activePoints));
            }

            const finalArea = calculatePolygonArea(activePoints);
            const centroid = calculateCentroid(activePoints);
            if (!summaryLabelEntity) {
              summaryLabelEntity = safeAdd({
                position: centroid,
                label: {
                  text: `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`,
                  font: 'bold 15px "JetBrains Mono", sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2.5,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  showBackground: true,
                  backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                  backgroundPadding: new Cesium.Cartesian2(14, 7),
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              }) || undefined;
            } else if ((summaryLabelEntity as any).label) {
              summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
              (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
                `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
              );
            }

            finalizeCurrentRecord({
              id: recordId,
              type: 'area',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity,
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 2. ĐO KHOẢNG CÁCH (DISTANCE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'distance') {
        let lastDistanceClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const lastPt = activePoints[activePoints.length - 1];
          const distSegment = Cesium.Cartesian3.distance(lastPt, mousePos);
          let totalDist = 0;
          for (let i = 0; i < activePoints.length - 1; i++) { totalDist += Cesium.Cartesian3.distance(activePoints[i], activePoints[i + 1]); }
          totalDist += distSegment;
          safeAdd({
            polyline: {
              positions: [lastPt, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), dashLength: 8 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.6), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(lastPt, mousePos, `+${distSegment.toFixed(2)} m (Tổng: ${totalDist.toFixed(2)} m)`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (lastDistanceClick && clickTime - lastDistanceClick.time < 500 && Cesium.Cartesian2.distance(lastDistanceClick.position, click.position) < 5) return;
          lastDistanceClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(pt, idx);

          if (activePoints.length >= 2) {
            const pPrev = activePoints[activePoints.length - 2];
            const pCurr = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [pPrev, pCurr],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);
            const badge = addEdgeDistanceBadge(pPrev, pCurr);
            if (badge) labelEntities.push(badge);
          }
          clearTempEntities();
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(() => {
          clearTempEntities();
          if (activePoints.length >= 2) {
            let total3D = 0;
            let totalH = 0;
            for (let i = 0; i < activePoints.length - 1; i++) {
              const ca = Cesium.Cartographic.fromCartesian(activePoints[i]);
              const cb = Cesium.Cartographic.fromCartesian(activePoints[i + 1]);
              const geo = new Cesium.EllipsoidGeodesic(ca, cb);
              const hDist = geo.surfaceDistance;
              const dz = cb.height - ca.height;
              total3D += Math.sqrt(hDist * hDist + dz * dz);
              totalH += hDist;
            }
            summaryLabelEntity = safeAdd({
              position: activePoints[activePoints.length - 1],
              label: {
                text: `TỔNG 3D: ${total3D.toFixed(2)} m  |  H: ${totalH.toFixed(2)} m`,
                font: 'bold 14px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(14, 7),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -25),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'distance',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. ĐO CHIỀU CAO ĐỨNG (HEIGHT)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'height') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const startPt = activePoints[0];
          const projPt = getProjectedPoint(startPt, mousePos);
          const slantDist = Cesium.Cartesian3.distance(startPt, mousePos);
          const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
          const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
          const cartoEnd = Cesium.Cartographic.fromCartesian(mousePos);
          const heightDiff = cartoEnd.height - cartoStart.height;

          safeAdd({
            polyline: {
              positions: [startPt, mousePos],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.CYAN, dashLength: 6 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.CYAN.withAlpha(0.6), dashLength: 6 })
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [startPt, projPt],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.LIGHTGRAY, dashLength: 6 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.LIGHTGRAY.withAlpha(0.6), dashLength: 6 })
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [projPt, mousePos],
              width: 4.5,
              material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineWidth: 1.5, outlineColor: Cesium.Color.BLACK }),
              depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineWidth: 1.5, outlineColor: Cesium.Color.BLACK.withAlpha(0.65) })
            }
          }, true);
          safeAdd({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy([startPt, projPt, mousePos]),
              material: Cesium.Color.CYAN.withAlpha(0.18),
              outline: false
            }
          }, true);

          safeAdd({
            position: getMidpoint(projPt, mousePos),
            label: {
              text: `CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`,
              font: 'bold 14px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.85, 0.05, 0.25, 0.95),
              backgroundPadding: new Cesium.Cartesian2(10, 5),
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(15, 0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          safeAdd({
            position: getMidpoint(startPt, projPt),
            label: {
              text: `Ngang (H): ${horizDist.toFixed(2)} m`,
              font: 'bold 12px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.88),
              backgroundPadding: new Cesium.Cartesian2(7, 4),
              verticalOrigin: Cesium.VerticalOrigin.TOP,
              pixelOffset: new Cesium.Cartesian2(0, 10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          safeAdd({
            position: getMidpoint(startPt, mousePos),
            label: {
              text: `Xiên (S): ${slantDist.toFixed(2)} m`,
              font: 'bold 12px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.0, 0.4, 0.5, 0.9),
              backgroundPadding: new Cesium.Cartesian2(7, 4),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;

          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const startPt = activePoints[0];
            const endPt = pt;
            if (Cesium.Cartesian3.distance(startPt, endPt) < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(endPt));
            const projPt = getProjectedPoint(startPt, endPt);
            const slantDist = Cesium.Cartesian3.distance(startPt, endPt);
            const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
            const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
            const cartoEnd = Cesium.Cartographic.fromCartesian(endPt);
            const heightDiff = cartoEnd.height - cartoStart.height;

            addMeasurePoint(endPt, 1, '#ff0055', 8);

            const slantLine = safeAdd({
              polyline: {
                positions: [startPt, endPt],
                width: 3,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.CYAN, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.CYAN.withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            const horizLine = safeAdd({
              polyline: {
                positions: [startPt, projPt],
                width: 3,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.DARKGRAY, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.DARKGRAY.withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            const vertLine = safeAdd({
              polyline: {
                positions: [projPt, endPt],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (slantLine) lineEntities.push(slantLine);
            if (horizLine) lineEntities.push(horizLine);
            if (vertLine) lineEntities.push(vertLine);

            fillEntity = safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy([startPt, projPt, endPt]),
                material: Cesium.Color.CYAN.withAlpha(0.22),
                outline: false
              }
            }) || undefined;

            const dzBadge = safeAdd({
              position: getMidpoint(projPt, endPt),
              label: {
                text: `CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`,
                font: 'bold 14px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.85, 0.05, 0.25, 0.95),
                backgroundPadding: new Cesium.Cartesian2(10, 5),
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(15, 0),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            const hBadge = safeAdd({
              position: getMidpoint(startPt, projPt),
              label: {
                text: `Ngang: ${horizDist.toFixed(2)} m`,
                font: 'bold 12px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.88),
                backgroundPadding: new Cesium.Cartesian2(7, 4),
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, 10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            const sBadge = safeAdd({
              position: getMidpoint(startPt, endPt),
              label: {
                text: `Xiên: ${slantDist.toFixed(2)} m`,
                font: 'bold 12px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.0, 0.4, 0.5, 0.9),
                backgroundPadding: new Cesium.Cartesian2(7, 4),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (dzBadge) labelEntities.push(dzBadge);
            if (hBadge) labelEntities.push(hBadge);
            if (sBadge) labelEntities.push(sBadge);

            finalizeCurrentRecord({
              id: recordId,
              type: 'height',
              points: [startPt, endPt],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 4. TỌA ĐỘ ĐIỂM (POINT)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'point') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const carto = Cesium.Cartographic.fromCartesian(pt);
          const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
          const height = carto.height.toFixed(2);

          addMeasurePoint(pt, 0, '#00e5ff', 8);
          const lbl = safeAdd({
            position: pt,
            label: {
              text: `X: ${lon}°\nY: ${lat}°\nZ: ${height} m`,
              font: 'bold 13px "JetBrains Mono", monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
              backgroundPadding: new Cesium.Cartesian2(10, 6),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          if (lbl) labelEntities.push(lbl);

          finalizeCurrentRecord({
            id: recordId,
            type: 'point',
            points: [pt],
            pointEntities: [...pointEntities],
            lineEntities: [],
            labelEntities: [...labelEntities]
          });

          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 5. ĐO GÓC (ANGLE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'angle') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          if (activePoints.length === 1) {
            safeAdd({
              polyline: {
                positions: [activePoints[0], mousePos],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
              }
            }, true);
          } else if (activePoints.length === 2) {
            safeAdd({
              polyline: {
                positions: [activePoints[1], mousePos],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
              }
            }, true);
            const angleDeg = calculateAngleDegrees(activePoints[0], activePoints[1], mousePos);
            if (angleDeg === null) return;
            safeAdd({
              position: activePoints[1],
              label: {
                text: `Góc: ${angleDeg.toFixed(2)}°`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
                backgroundPadding: new Cesium.Cartesian2(9, 5),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }, true);
          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousAnglePoint = activePoints[activePoints.length - 1];
          if (previousAnglePoint && Cesium.Cartesian3.distance(previousAnglePoint, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          addMeasurePoint(pt, idx, '#00e5ff', 8);

          if (activePoints.length === 2) {
            const l1 = safeAdd({
              polyline: {
                positions: [activePoints[0], activePoints[1]],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (l1) lineEntities.push(l1);
          }

          if (activePoints.length === 3) {
            clearTempEntities();
            const p1 = activePoints[0];
            const p2 = activePoints[1];
            const p3 = activePoints[2];
            const l2 = safeAdd({
              polyline: {
                positions: [p2, p3],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (l2) lineEntities.push(l2);

            const angleDeg = calculateAngleDegrees(p1, p2, p3);
            if (angleDeg === null) return;

            const lbl = safeAdd({
              position: p2,
              label: {
                text: `GÓC: ${angleDeg.toFixed(2)}°`,
                font: 'bold 14px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'angle',
              points: [p1, p2, p3],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities]
            });

            viewer.scene.requestRender();
            setToolMode('none');
          } else {
            viewer.scene.requestRender();
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 6. ĐO ĐƯỜNG TRÒN (CIRCLE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'circle') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, mousePos);
          if (radius < 0.01) return;
          const circleArea = Math.PI * radius * radius;
          safeAdd({
            position: center,
            ellipse: {
              semiMajorAxis: radius,
              semiMinorAxis: radius,
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [center, mousePos],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(center, mousePos, `R: ${radius.toFixed(2)} m | S: ${circleArea.toFixed(2)} m²`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const center = activePoints[0];
            const edge = pt;
            const radius = Cesium.Cartesian3.distance(center, edge);
            if (radius < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(edge));
            const circleArea = Math.PI * radius * radius;

            addMeasurePoint(edge, 1, '#00e5ff', 8);
            const line = safeAdd({
              polyline: {
                positions: [center, edge],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);

            fillEntity = safeAdd({
              position: center,
              ellipse: {
                semiMajorAxis: radius,
                semiMinorAxis: radius,
                material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
              }
            }) || undefined;

            const lbl = safeAdd({
              position: getMidpoint(center, edge),
              label: {
                text: `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH: ${circleArea.toFixed(2)} m²`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'circle',
              points: [center, edge],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // Sphere: center + radius, rendered as a true Cesium ellipsoid in world coordinates.
      if (toolMode === 'sphere') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const edge = getPickedPosition(movement.endPosition);
          if (!edge) return;
          clearTempEntities();
          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, edge);
          if (radius < 0.01) return;
          safeAdd({
            position: center,
            ellipsoid: {
              radii: new Cesium.Cartesian3(radius, radius, radius),
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }, true);
          addEdgeDistanceBadge(center, edge, `R: ${radius.toFixed(2)} m`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const point = getPickedPosition(click.position);
          if (!point) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(point));
            addMeasurePoint(point, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
            return;
          }

          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, point);
          if (radius < 0.01) return;
          clearTempEntities();
          activePoints.push(Cesium.Cartesian3.clone(point));
          addMeasurePoint(point, 1, '#00e5ff', 8);
          const surfaceArea = 4 * Math.PI * radius * radius;
          const sphereVolume = (4 / 3) * Math.PI * radius * radius * radius;
          const line = safeAdd({ polyline: { positions: [center, point], width: 4, material: Cesium.Color.fromCssColorString('#00e5ff') } });
          if (line) lineEntities.push(line);
          fillEntity = safeAdd({
            position: center,
            ellipsoid: {
              radii: new Cesium.Cartesian3(radius, radius, radius),
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }) || undefined;
          const label = safeAdd({
            position: getMidpoint(center, point),
            label: {
              text: `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH MẶT CẦU: ${surfaceArea.toFixed(2)} m²\nTHỂ TÍCH: ${sphereVolume.toFixed(2)} m³`,
              font: 'bold 13px "JetBrains Mono", monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
              backgroundPadding: new Cesium.Cartesian2(12, 6),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -14),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          if (label) labelEntities.push(label);
          finalizeCurrentRecord({ id: recordId, type: 'sphere', points: [...activePoints], pointEntities: [...pointEntities], lineEntities: [...lineEntities], labelEntities: [...labelEntities], fillEntity });
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 7. GÓC PHƯƠNG VỊ (AZIMUTH)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'azimuth') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const p1 = activePoints[0];
            const p2 = pt;
            if (Cesium.Cartesian3.distance(p1, p2) < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(p2));
            addMeasurePoint(p2, 1, '#00e5ff', 8);

            const c1 = Cesium.Cartographic.fromCartesian(p1);
            const c2 = Cesium.Cartographic.fromCartesian(p2);
            const geodesic = new Cesium.EllipsoidGeodesic(c1, c2);
            const azimuthDeg = (Cesium.Math.toDegrees(geodesic.startHeading) + 360) % 360;
            const dist = geodesic.surfaceDistance;

            const line = safeAdd({
              polyline: {
                positions: [p1, p2],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);

            const lbl = safeAdd({
              position: getMidpoint(p1, p2),
              label: {
                text: `AZIMUTH: ${azimuthDeg.toFixed(2)}° | Khoảng cách: ${dist.toFixed(2)} m`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'azimuth',
              points: [p1, p2],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities]
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 8. GHI CHÚ 3D (ANNOTATION)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'annotation') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const text = prompt('Nhập nội dung ghi chú 3D:', 'Vị trí đo đạc');
          const annotationText = text?.trim();
          if (annotationText) {
            addMeasurePoint(pt, 0, '#ffcc00', 8);
            const lbl = safeAdd({
              position: pt,
              label: {
                text: `💬 ${annotationText}`,
                font: 'bold 14px "Segoe UI", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.95),
                backgroundPadding: new Cesium.Cartesian2(10, 5),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'annotation',
              points: [pt],
              pointEntities: [...pointEntities],
              lineEntities: [],
              labelEntities: [...labelEntities]
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 9. ĐO THỂ TÍCH (VOLUME)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'volume') {
        let lastVolumeClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (lastVolumeClick && clickTime - lastVolumeClick.time < 500 && Cesium.Cartesian2.distance(lastVolumeClick.position, click.position) < 5) return;
          lastVolumeClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          addMeasurePoint(pt, idx, '#00e5ff', 8);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(() => {
          if (activePoints.length >= 3) {
            const area = calculatePolygonArea(activePoints);
            const centroid = calculateCentroid(activePoints);
            const heights = activePoints.map(p => Cesium.Cartographic.fromCartesian(p).height);
            const hMin = Math.min(...heights);
            const hMax = Math.max(...heights);
            const deltaH = Math.max(0, hMax - hMin);
            const volume = area * deltaH;

            fillEntity = safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(activePoints),
                material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.35),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#00e5ff'),
                extrudedHeight: hMax
              }
            }) || undefined;

            summaryLabelEntity = safeAdd({
              position: centroid,
              label: {
                text: `THỂ TÍCH LĂNG TRỤ ƯỚC TÍNH: ${volume.toFixed(2)} m³\nDiện tích: ${area.toFixed(2)} m² | ΔH: ${deltaH.toFixed(2)} m`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'volume',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [],
              labelEntities: [],
              fillEntity,
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 10. TRẮC DỌC CAO ĐỘ (PROFILE)
      //     - Click nhiều đỉnh tạo tuyến
      //     - Double-click để chốt
      //     - Sample cao độ ở maximum detail từ Scene/3D Tiles, terrain fallback
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'issue') {
        handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
          const position = getPickedPosition(click.position);
          if (!position) return;
          setPendingIssuePosition(Cesium.Cartesian3.clone(position));
          setSelectedIssue(null);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      let removeCutFillKeydown: (() => void) | undefined;
      if (toolMode === 'cutFill') {
        let lastClick: { position: Cesium.Cartesian2; time: number } | undefined;
        let finalizing = false;
        handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
          if (finalizing) return;
          const now = performance.now();
          if (lastClick && now - lastClick.time < 500 && Cesium.Cartesian2.distance(lastClick.position, click.position) < 5) return;
          lastClick = { position: Cesium.Cartesian2.clone(click.position), time: now };
          const point = getPickedPosition(click.position);
          if (!point) return;
          if (activePoints.length === 0) {
            cutFillEntitiesRef.current.forEach(entity => { try { viewer.entities.remove(entity); } catch (_error) {} });
            measurementEntitiesRef.current = measurementEntitiesRef.current.filter(entity => !cutFillEntitiesRef.current.includes(entity));
            cutFillEntitiesRef.current = [];
            clearCutFillReferenceEntities();
            cutFillDataRef.current = null;
            setCutFillReferenceMode('average');
            setCutFillReferencePoints([]);
            setSelectingCutFillReferencePoints(false);
            setCutFillReferenceError(null);
            setCutFillPolygonReady(false);
            setCutFillResult(null);
          }
          const previous = activePoints.at(-1);
          if (previous && Cesium.Cartesian3.distance(previous, point) < 0.01) return;
          activePoints.push(Cesium.Cartesian3.clone(point));
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(point, activePoints.length - 1, '#f59e0b', 8);
          if (activePoints.length > 1) {
            const line = safeAdd({ polyline: { positions: [activePoints.at(-2)!, activePoints.at(-1)!], width: 3, material: Cesium.Color.fromCssColorString('#f59e0b') } });
            if (line) lineEntities.push(line);
          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        const finalizeCutFill = async () => {
          if (finalizing || activePoints.length < 3) return;
          finalizing = true;
          const calculationGeneration = ++cutFillCalculationGenerationRef.current;
          setCutFillBusy(true);
          setCutFillProgress(0);
          clearTempEntities();
          try {
            const totalStartedAt = performance.now();
            const polygon = activePoints.map(point => Cesium.Cartesian3.clone(point));
            const closingLine = safeAdd({
              polyline: {
                positions: [polygon[polygon.length - 1], polygon[0]],
                width: 3,
                material: Cesium.Color.fromCssColorString('#f59e0b'),
              },
            });
            if (closingLine) lineEntities.push(closingLine);
            const areaEntity = safeAdd({ polygon: { hierarchy: new Cesium.PolygonHierarchy(polygon), material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.2), outline: true, outlineColor: Cesium.Color.fromCssColorString('#f59e0b') } });
            if (areaEntity) fillEntity = areaEntity;
            cutFillEntitiesRef.current = [...pointEntities, ...lineEntities, ...(fillEntity ? [fillEntity] : [])];
            measurementFinalized = true;
            setCutFillPolygonReady(true);
            finishInteractiveTool(viewer, clearTempEntities);
            viewer.scene.requestRender();
            setToolMode('none');

            await yieldToMainThread();
            if (viewer.isDestroyed() || calculationGeneration !== cutFillCalculationGenerationRef.current) return;
            const gridStartedAt = performance.now();
            const plan = buildVolumeGrid(polygon, cutFillGridSpacing);
            const gridGenerationMs = performance.now() - gridStartedAt;
            const samplingContext = getCutFillSamplingContext();
            if (!plan || !samplingContext) return;
            let samplingTimings: VolumeSamplingTimings = { projectSurfaceMs: 0, terrainFallbackMs: 0 };
            const elevations = await sampleVolumeGrid(viewer.scene, viewer.terrainProvider, plan, {
              ...samplingContext.samplingOptions,
              isCancelled: () => calculationGeneration !== cutFillCalculationGenerationRef.current,
              onProgress: setCutFillProgress,
              onTimings: timings => { samplingTimings = timings; },
            });
            if (!elevations.length || viewer.isDestroyed() || calculationGeneration !== cutFillCalculationGenerationRef.current) return;
            cutFillDataRef.current = { polygon, polygonKey: getCutFillPolygonKey(polygon), plan, elevations, requestedSpacing: cutFillGridSpacing, surfaceKey: samplingContext.sourceKey };
            const integrationStartedAt = performance.now();
            const result = calculateCutFill(polygon, plan, elevations, cutFillReferenceMode, cutFillDesignElevation);
            const volumeIntegrationMs = performance.now() - integrationStartedAt;
            if (result) setCutFillResult(result);
            if (import.meta.env.DEV) console.info('[CutFill]', {
              timingMs: {
                polygonFinalize: gridStartedAt - totalStartedAt,
                gridGeneration: gridGenerationMs,
                projectSurfaceSampling: samplingTimings.projectSurfaceMs,
                terrainFallback: samplingTimings.terrainFallbackMs,
                volumeIntegration: volumeIntegrationMs,
                total: performance.now() - totalStartedAt,
              },
              cache: 'miss', samples: elevations.length, requestedSpacing: cutFillGridSpacing, actualSpacing: plan.gridSpacing,
            });
          } finally {
            if (calculationGeneration === cutFillCalculationGenerationRef.current) {
              setCutFillBusy(false);
              setCutFillProgress(null);
            }
            finalizing = false;
          }
        };
        handler.setInputAction(finalizeCutFill, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Enter' && activePoints.length >= 3) { event.preventDefault(); void finalizeCutFill(); }
        };
        window.addEventListener('keydown', onKeyDown);
        removeCutFillKeydown = () => window.removeEventListener('keydown', onKeyDown);
      }

      let removeProfileKeydown: (() => void) | undefined;
      if (toolMode === 'profile') {
        let lastProfileClick: {
          position: Cesium.Cartesian2;
          time: number;
        } | undefined;
        let profileFinalizeInProgress = false;

        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0 || profileFinalizeInProgress) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;

          clearTempEntities();
          const lastPoint = activePoints[activePoints.length - 1];
          safeAdd({
            polyline: {
              positions: [lastPoint, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#00e5ff'),
                dashLength: 8,
              }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.55),
                dashLength: 8,
              }),
            },
          }, true);

          addEdgeDistanceBadge(
            lastPoint,
            mousePos,
            `Đoạn mới: ${Cesium.Cartesian3.distance(lastPoint, mousePos).toFixed(2)} m`,
            true
          );
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          if (profileFinalizeInProgress) return;

          const clickTime = performance.now();
          if (
            lastProfileClick &&
            clickTime - lastProfileClick.time < 500 &&
            Cesium.Cartesian2.distance(
              lastProfileClick.position,
              click.position
            ) < 5
          ) {
            return;
          }
          lastProfileClick = {
            position: Cesium.Cartesian2.clone(click.position),
            time: clickTime,
          };

          const point = getPickedPosition(click.position);
          if (!point) return;

          const previousPoint = activePoints[activePoints.length - 1];
          if (
            previousPoint &&
            Cesium.Cartesian3.distance(previousPoint, point) < 0.01
          ) {
            return;
          }

          clearTempEntities();
          const pointIndex = activePoints.length;
          const worldPoint = Cesium.Cartesian3.clone(point);
          activePoints.push(worldPoint);
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(worldPoint, pointIndex, '#00e5ff', 8);

          if (activePoints.length >= 2) {
            const p1 = activePoints[activePoints.length - 2];
            const p2 = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [p1, p2],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#00e5ff'),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 1.5,
                }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.65),
                  outlineWidth: 1.5,
                }),
              },
            });
            if (line) lineEntities.push(line);
          }

          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        const finalizeProfile = async () => {
          if (
            profileFinalizeInProgress ||
            activePoints.length < 2
          ) {
            return;
          }

          profileFinalizeInProgress = true;
          clearTempEntities();
          setIsProfileSampling(true);

          try {
            const sampled = await sampleProfileAlongPath(activePoints);
            if (!sampled) return;

            const profileResult: ProfileResult = {
              id: recordId,
              ...sampled,
            };

            const sampledLine = safeAdd({
              polyline: {
                positions: sampled.samples.map(sample => sample.position),
                width: 3.5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#f59e0b'),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
                  outlineWidth: 1,
                }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.65),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.45),
                  outlineWidth: 1,
                }),
              },
            });
            if (sampledLine) {
              (sampledLine as any)._isProfileSampleLine = true;
              lineEntities.push(sampledLine);
            }

            summaryLabelEntity = safeAdd({
              position: activePoints[activePoints.length - 1],
              label: {
                text:
                  `TRẮC DỌC: ${profileResult.totalDistance.toFixed(2)} m\n` +
                  `Hmin: ${profileResult.minHeight.toFixed(2)} m | Hmax: ${profileResult.maxHeight.toFixed(2)} m\n` +
                  `Tăng: ${profileResult.elevationGain.toFixed(2)} m | Giảm: ${profileResult.elevationLoss.toFixed(2)} m | ${profileResult.samples.length} mẫu`,
                font: 'bold 12px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.30, 0.42, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -18),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'profile',
              points: activePoints.map(point => Cesium.Cartesian3.clone(point)),
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              summaryLabelEntity,
              profileSamples: sampled.samples,
            });

            setActiveProfile(profileResult);
            viewer.scene.requestRender();
            setToolMode('none');
          } catch (error) {
            console.error('Lỗi khi tạo trắc dọc:', error);
          } finally {
            setIsProfileSampling(false);
            profileFinalizeInProgress = false;
          }
        };

        handler.setInputAction(finalizeProfile, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        const handleProfileKeyDown = (event: KeyboardEvent) => {
          if (event.key !== 'Enter' || activePoints.length < 2 || profileFinalizeInProgress) return;
          event.preventDefault();
          void finalizeProfile();
        };
        window.addEventListener('keydown', handleProfileKeyDown);
        removeProfileKeydown = () => {
          window.removeEventListener('keydown', handleProfileKeyDown);
        };
      }

      if (toolMode === 'crossSection') {
        handler.setInputAction(async (click: { position: Cesium.Cartesian2 }) => {
          if (crossSectionBusy) return;
          const picked = getPickedPosition(click.position);
          if (!picked) return;

          let alignment = activeProfile;
          if (!alignment) {
            const record = [...measurementsStoreRef.current].reverse().find(item => item.type === 'profile' && item.profileSamples && item.profileSamples.length >= 2);
            if (record) alignment = profileResultFromRecord(record);
          }
          if (!alignment) return;

          const section = buildCrossSectionAlignment(alignment, picked, crossSectionSettings);
          if (!section) return;
          setCrossSectionBusy(true);
          try {
            const sampled = await sampleProfileAlongPath(
              [section.leftPoint, section.rightPoint],
              crossSectionSettings.spacing,
              1000,
            );
            if (!sampled || viewer.isDestroyed()) return;

            const samples = sampled.samples.map(sample => ({
              offset: sample.distance - crossSectionSettings.leftWidth,
              elevation: sample.height,
              position: sample.position,
            }));
            crossSectionEntitiesRef.current = replaceCrossSectionEntities(viewer, crossSectionEntitiesRef.current, section.center, samples);
            const elevations = samples.map(sample => sample.elevation);
            setCrossSection({ station: section.station, ...crossSectionSettings, samples, minElevation: Math.min(...elevations), maxElevation: Math.max(...elevations) });
            finishInteractiveTool(viewer, clearTempEntities);
            viewer.scene.requestRender();
            setToolMode('none');
          } finally {
            setCrossSectionBusy(false);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      const handleToolKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setCameraInteractionEnabled(viewer, true);
          viewer.scene.canvas.style.cursor = 'default';
          setToolMode('none');
          return;
        }
        if (event.key === 'Enter' && toolMode !== 'profile' && toolMode !== 'cutFill') {
          const complete = handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          if (complete) { event.preventDefault(); (complete as (event: { position: Cesium.Cartesian2 }) => void)({ position: new Cesium.Cartesian2() }); }
        }
      };
      window.addEventListener('keydown', handleToolKeyDown);

      return () => {
        window.removeEventListener('keydown', handleToolKeyDown);
        removeCutFillKeydown?.();
        removeProfileKeydown?.();
        measurementDragCancelRef.current?.();
        restoreMeasurementCamera();
        clearTempEntities();
        if (!measurementFinalized) {
          const unfinishedEntities = new Set<Cesium.Entity>([
            ...pointEntities,
            ...lineEntities,
            ...labelEntities,
            ...(fillEntity ? [fillEntity] : []),
            ...(summaryLabelEntity ? [summaryLabelEntity] : [])
          ]);
          unfinishedEntities.forEach(entity => {
            try { viewer.entities.remove(entity); } catch (e) {}
            measurementEntitiesRef.current = measurementEntitiesRef.current.filter(item => item !== entity);
          });
          measurementsStoreRef.current = measurementsStoreRef.current.filter(record => record.id !== recordId);
        }
        if (handler && !handler.isDestroyed()) {
          handler.destroy();
        }
        if (handlerRef.current === handler) {
          handlerRef.current = null;
        }
        if (defaultDoubleClick) {
          defaultHandler.setInputAction(defaultDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
        setCameraInteractionEnabled(viewer, true);
        viewer.scene.canvas.style.cursor = 'default';
      };
    }, [toolMode, selectingCutFillReferencePoints, cutFillReferencePoints.length]);

    // ─────────────────────────────────────────────────────────────
    // EFFECT 2: KÉO THẢ VÀ TINH CHỈNH ĐIỂM ĐO THỜI GIAN THỰC (DRAG & REFINE)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      if (measurementDragHandlerRef.current && !measurementDragHandlerRef.current.isDestroyed()) {
        measurementDragHandlerRef.current.destroy();
      }
      const dragHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      measurementDragHandlerRef.current = dragHandler;

      let draggedTarget: {
        record: MeasurementRecord;
        pointIndex: number;
        pointEntity: Cesium.Entity;
        previousMouse: Cesium.Cartesian2;
        virtualScreen: Cesium.Cartesian2;
      } | null = null;

      let hoveredEntity: Cesium.Entity | null = null;

      const hasClippingHandleAt = (windowPos: Cesium.Cartesian2) =>
        viewer.scene.drillPick(windowPos, 24).some(hit => {
          const picked = hit as { id?: Cesium.Entity; primitive?: { id?: Cesium.Entity } };
          const entity = picked.id instanceof Cesium.Entity
            ? picked.id
            : picked.primitive?.id instanceof Cesium.Entity
              ? picked.primitive.id
              : undefined;
          return !!entity && !!(entity as any).__clipHandle;
        });

      const pickMeasurementSurface = (windowPos: Cesium.Cartesian2) => getPickedPosition(windowPos);

      const pickAreaPlanePosition = (record: MeasurementRecord, windowPos: Cesium.Cartesian2) => {
        const plane = getAreaReferencePlane(record);
        if (!plane) return null;
        const surfaceCandidate = pickMeasurementSurface(windowPos);
        if (
          surfaceCandidate &&
          Math.abs(Cesium.Plane.getPointDistance(plane, surfaceCandidate)) <= AREA_SURFACE_PLANE_MAX_DISTANCE
        ) {
          return projectPointToPlane(surfaceCandidate, plane);
        }
        const ray = viewer.camera.getPickRay(windowPos);
        if (!ray) return null;
        const intersection = Cesium.IntersectionTests.rayPlane(ray, plane, new Cesium.Cartesian3());
        return isFiniteCartesian(intersection) ? projectPointToPlane(intersection, plane) : null;
      };

      // Hàm tìm điểm đo gần nhất theo khoảng cách 2D trên màn hình (độ nhạy 25px)
      const findPointAtScreenPos = (windowPos: Cesium.Cartesian2) => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed() || !windowPos) return null;
        const tolerance = 6;
        let bestDist = Infinity;
        let bestTarget: { record: MeasurementRecord; pointIndex: number; pointEntity: Cesium.Entity } | null = null;

        for (const record of measurementsStoreRef.current) {
          if (!record.isFinalized || record.visible === false) continue;
          for (let i = 0; i < record.points.length; i++) {
            const pt3d = record.points[i];
            const pointEntity = record.pointEntities[i];
            if (!pt3d || !pointEntity || pointEntity.show === false) continue;
            try {
              const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(v.scene, pt3d);
              if (screenPos) {
                const dx = screenPos.x - windowPos.x;
                const dy = screenPos.y - windowPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= tolerance && dist < bestDist) {
                  bestDist = dist;
                  bestTarget = {
                    record,
                    pointIndex: i,
                    pointEntity
                  };
                }
              }
            } catch (e) {}
          }
        }
        return bestTarget;
      };

      const resetMarker = (entity: Cesium.Entity | null) => {
        if (!entity?.billboard) return;
        entity.billboard.width = new Cesium.ConstantProperty(9);
        entity.billboard.height = new Cesium.ConstantProperty(9);
        entity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
      };

      const finishDrag = (persist = true) => {
        if (!draggedTarget) {
          restoreMeasurementCamera();
          return;
        }

        const finishedRecord = draggedTarget.record;
        resetMarker(draggedTarget.pointEntity);
        draggedTarget = null;
        restoreMeasurementCamera();
        if (!viewer.isDestroyed()) {
          viewer.scene.canvas.style.cursor = hoveredEntity ? 'grab' : 'default';
          viewer.scene.requestRender();
        }
        if (finishedRecord.type === 'area') {
          const plane = getAreaReferencePlane(finishedRecord);
          if (plane) {
            console.info('[MEASURE AREA PLANE]', {
              normal: Cesium.Cartesian3.clone(plane.normal),
              maxResidual: Math.max(
                0,
                ...finishedRecord.points.map(point =>
                  Math.abs(Cesium.Plane.getPointDistance(plane, point))
                ),
              ),
            });
          }
        }
        setMeasurementRevision(revision => revision + 1);
        if (!persist) return;
        if (finishedRecord.type === 'profile') void refreshProfileRecord(finishedRecord);
        else persistMeasurementUpdate(finishedRecord);
      };

      const finishDragOnPointerUp = () => finishDrag(true);
      const cancelDragOnWindowBlur = () => finishDrag(false);
      measurementDragCancelRef.current = cancelDragOnWindowBlur;
      window.addEventListener('pointerup', finishDragOnPointerUp);
      window.addEventListener('blur', cancelDragOnWindowBlur);

      // 1. LEFT_DOWN: Bắt đầu kéo điểm đo
      dragHandler.setInputAction((click: any) => {
        if (hasClippingHandleAt(click.position)) return;
        const target = findPointAtScreenPos(click.position);
        if (target) {
          if (draggedTarget || measurementCameraLockOwnerRef.current) return;
          const markerScreen = Cesium.SceneTransforms.worldToWindowCoordinates(
            viewer.scene,
            target.record.points[target.pointIndex],
          );
          draggedTarget = {
            ...target,
            previousMouse: Cesium.Cartesian2.clone(click.position),
            virtualScreen: markerScreen
              ? Cesium.Cartesian2.clone(markerScreen)
              : Cesium.Cartesian2.clone(click.position),
          };
          lockMeasurementCamera();
          viewer.scene.canvas.style.cursor = 'grabbing';
          if (draggedTarget.pointEntity?.billboard) {
            draggedTarget.pointEntity.billboard.width = new Cesium.ConstantProperty(12);
            draggedTarget.pointEntity.billboard.height = new Cesium.ConstantProperty(12);
            draggedTarget.pointEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_GLOW_IMAGE);
          }
          viewer.scene.requestRender();
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      // 2. MOUSE_MOVE: Di chuyển điểm và cập nhật hình học đo thời gian thực
      dragHandler.setInputAction((movement: any) => {
        if (draggedTarget) {
          try {
            const mouseDelta = Cesium.Cartesian2.subtract(
              movement.endPosition,
              draggedTarget.previousMouse,
              new Cesium.Cartesian2(),
            );
            Cesium.Cartesian2.multiplyByScalar(
              mouseDelta,
              MEASUREMENT_SURFACE_DRAG_SENSITIVITY,
              mouseDelta,
            );
            Cesium.Cartesian2.add(
              draggedTarget.virtualScreen,
              mouseDelta,
              draggedTarget.virtualScreen,
            );
            Cesium.Cartesian2.clone(movement.endPosition, draggedTarget.previousMouse);
            const worldPosition = draggedTarget.record.type === 'area'
              ? pickAreaPlanePosition(draggedTarget.record, draggedTarget.virtualScreen)
              : pickMeasurementSurface(draggedTarget.virtualScreen);
            if (worldPosition) {
              draggedTarget.record.points[draggedTarget.pointIndex] = worldPosition;
              draggedTarget.pointEntity.position = new Cesium.ConstantPositionProperty(worldPosition) as any;
              updateMeasurementRecord(draggedTarget.record);
              setMeasurementRevision(revision => revision + 1);
              viewer.scene.requestRender();
            }
          } catch (error) {
            console.error('Measurement drag failed.', error);
            finishDrag(false);
          }
          return;
        }

        // Hover effect khi rê chuột qua các điểm đo
        const hovered = hasClippingHandleAt(movement.endPosition)
          ? null
          : findPointAtScreenPos(movement.endPosition);
        if (hovered) {
          viewer.scene.canvas.style.cursor = 'grab';
          if (hoveredEntity !== hovered.pointEntity) {
            if (hoveredEntity?.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            hoveredEntity = hovered.pointEntity;
            if (hoveredEntity?.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(11);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(11);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            viewer.scene.requestRender();
          }
        } else {
          if (hoveredEntity) {
            if (hoveredEntity.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            hoveredEntity = null;
            viewer.scene.requestRender();
          }
          if (toolMode === 'none') {
            viewer.scene.canvas.style.cursor = 'default';
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // 3. LEFT_UP: Thả chuột và kết thúc kéo điểm
      dragHandler.setInputAction(() => {
        if (draggedTarget) {
          finishDrag(true);

          // Profile đã finalize phải sample lại sau khi Shift+kéo một control point.
        }
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      return () => {
        window.removeEventListener('pointerup', finishDragOnPointerUp);
        window.removeEventListener('blur', cancelDragOnWindowBlur);
        finishDrag(false);
        if (measurementDragCancelRef.current === cancelDragOnWindowBlur) measurementDragCancelRef.current = null;
        resetMarker(hoveredEntity);
        hoveredEntity = null;
        if (!dragHandler.isDestroyed()) {
          dragHandler.destroy();
        }
        if (measurementDragHandlerRef.current === dragHandler) measurementDragHandlerRef.current = null;
      };
    }, [toolMode, lockView]);

    const getProjectBoundingSphere = () => {
      // "Bay tới Dự án" must target the same calibrated project footprint users see
      // in Toàn cảnh. Model/Point Cloud bounding spheres can be in a different local
      // frame or cover only a subset, so they must not override a valid DOM footprint.
      const domSphere = getCurrentDomCameraBoundingSphere();
      if (domSphere) {
        const model = modelRef.current;
        const modelSphere = model && !model.isDestroyed() ? model.boundingSphere : undefined;
        return buildAdaptiveProjectCameraSphere(domSphere, modelSphere);
      }

      const west = Number(project?.west ?? project?.bounds?.west);
      const east = Number(project?.east ?? project?.bounds?.east);
      const south = Number(project?.south ?? project?.bounds?.south);
      const north = Number(project?.north ?? project?.bounds?.north);
      if ([west, east, south, north].every(Number.isFinite) && west < east && south < north) {
        return Cesium.BoundingSphere.fromRectangle3D(
          Cesium.Rectangle.fromDegrees(west, south, east, north),
          Cesium.Ellipsoid.WGS84,
          0,
        );
      }

      const model = modelRef.current;
      if (model && !model.isDestroyed() && model.boundingSphere) return model.boundingSphere;

      let longitude = Number(project?.centerLon);
      let latitude = Number(project?.centerLat);
      if (longitude < 90 && latitude > 90) [longitude, latitude] = [latitude, longitude];
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        longitude = 106.8099;
        latitude = 10.8404;
      }
      return new Cesium.BoundingSphere(
        Cesium.Cartesian3.fromDegrees(longitude, latitude, 50),
        100,
      );
    };

    const getFocusBoundingSphere = () => {
      const pointCloud = pointCloudRef.current;
      const model = modelRef.current;
      if (displayMode === 'pointcloud' && pointCloud && !pointCloud.isDestroyed()) return pointCloud.boundingSphere;
      if (displayMode === 'model3d' && model && !model.isDestroyed()) return model.boundingSphere;
      if (showPointCloud && pointCloud && !pointCloud.isDestroyed()) return pointCloud.boundingSphere;
      if (showModel && model && !model.isDestroyed()) return model.boundingSphere;
      return getProjectBoundingSphere();
    };

    const flyToSphere = (
      sphere: Cesium.BoundingSphere,
      pitch = Cesium.Math.toRadians(-30),
      rangeMultiplier = 2.5,
    ) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const radius = Math.max(10, sphere.radius);
      viewer.camera.cancelFlight();
      viewer.camera.flyToBoundingSphere(sphere, {
        duration: 1.35,
        offset: new Cesium.HeadingPitchRange(
          viewer.camera.heading,
          pitch,
          Math.min(50000, Math.max(30, radius * rangeMultiplier)),
        ),
      });
    };

    const handleFocusProject = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      // Match the tighter startup overview. Point Cloud keeps its existing 2.5x
      // framing when the dedicated Point Cloud action is used.
      flyToSphere(getProjectBoundingSphere(), Cesium.Math.toRadians(-30), 1.72);
    };

    const handleFocusPointCloud = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      flyToSphere(getFocusBoundingSphere(), Cesium.Math.toRadians(-35));
    };

    const handleFocusDOM = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      setShowDom(true);

      // Dùng đúng footprint DOM đã calibration từ metadata.
      // Không dùng project.centerLon/centerLat làm target chính vì tâm project
      // có thể lệch với tâm ảnh DOM (ví dụ Quy Nhơn).
      const calibratedDomSphere = getCurrentDomCameraBoundingSphere();

      if (calibratedDomSphere) {
        const radius = Math.max(10, calibratedDomSphere.radius);
        viewer.camera.cancelFlight();
        viewer.camera.flyToBoundingSphere(calibratedDomSphere, {
          duration: 2,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-90),
            Math.min(50000, Math.max(30, radius * 2.2)),
          ),
        });
        viewer.scene.requestRender();
        return;
      }

      // Fallback chỉ khi metadata DOM chưa resolve / bounds chưa hợp lệ.
      let centerLon = Number(project?.centerLon ?? 106.8099);
      let centerLat = Number(project?.centerLat ?? 10.8404);
      if (centerLon < 90 && centerLat > 90) [centerLon, centerLat] = [centerLat, centerLon];
      centerLon += offsets.domLon || 0;
      centerLat += offsets.domLat || 0;

      const scale = Number.isFinite(offsets.domScale) && offsets.domScale > 0
        ? offsets.domScale
        : 1.0;
      const halfWidth = 0.005 * scale;
      const halfHeight = 0.005 * scale;
      const finalWest = centerLon - halfWidth;
      const finalEast = centerLon + halfWidth;
      const finalSouth = centerLat - halfHeight;
      const finalNorth = centerLat + halfHeight;

      if (
        ![finalWest, finalEast, finalSouth, finalNorth].every(Number.isFinite) ||
        finalWest >= finalEast || finalSouth >= finalNorth ||
        finalWest < -180 || finalEast > 180 || finalSouth < -90 || finalNorth > 90
      ) {
        console.warn('[DOM Focus] Invalid fallback DOM bounds', {
          finalWest, finalEast, finalSouth, finalNorth,
        });
        return;
      }

      const domRectangle = Cesium.Rectangle.fromDegrees(
        finalWest, finalSouth, finalEast, finalNorth,
      );
      const fallbackSphere = Cesium.BoundingSphere.fromRectangle3D(
        domRectangle, Cesium.Ellipsoid.WGS84, 0,
      );
      const radius = Math.max(10, fallbackSphere.radius);

      viewer.camera.cancelFlight();
      viewer.camera.flyToBoundingSphere(fallbackSphere, {
        duration: 2,
        offset: new Cesium.HeadingPitchRange(
          0,
          Cesium.Math.toRadians(-90),
          Math.min(50000, Math.max(30, radius * 2.2)),
        ),
      });
      viewer.scene.requestRender();
    };

    const handleFocusDom = handleFocusDOM;

    const {
      navigationMode,
      cameraSpeed,
      setCameraSpeed,
      isCameraAnimating,
      flightHeight,
      setFlightHeight,
      orbitRadius,
      onOrbitRadiusChange,
      setOrbitTargetFromFocus,
      flightPathPointCount,
      isDrawingFlightPath,
      flightPathStatus,
      hasOrbitTarget,
      isSelectingOrbitTarget,
      isOrbitingSelectedTarget,
      setIsDrawingFlightPath,
      stopCameraAnimation,
      stopFlightPath,
      stopSelectedOrbit,
      clearSelectedOrbitTarget,
      beginOrbitTargetSelection,
      startSelectedOrbit,
      drawFlightPath,
      runFlightPath,
      pauseFlightPath,
      clearFlightPath,
      handleNavigationAction,
      handleSetCameraView,
    } = useCameraNavigation({
      viewerRef,
      projectId,
      toolMode,
      lockView,
      viewAngle,
      setViewAngle,
      prevViewAngleRef,
      setActiveCameraView,
      suppressPresetClearRef,
      getPickedPosition,
      getFocusBoundingSphere,
      beforeInteractiveNavigation: () => {
        measurementDragCancelRef.current?.();
        restoreMeasurementCamera();
        setToolMode('none');
      },
      clearClipping: () => clippingControllerRef.current?.clear(),
    });

    const handleToggleZoomArea = () => {
      markInitialCameraInteraction();
      measurementDragCancelRef.current?.();
      restoreMeasurementCamera();
      setToolMode('none');
      setIsFocusPicking(false);
      stopFlightPath();
      stopSelectedOrbit();
      stopCameraAnimation();
      setZoomAreaRect(null);
      setIsZoomAreaSelecting((active) => !active);
    };

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !isZoomAreaSelecting) return;

      const canvas = viewer.scene.canvas;
      const controller = viewer.scene.screenSpaceCameraController;
      const previousCursor = canvas.style.cursor;
      const previousEnableInputs = controller.enableInputs;
      controller.enableInputs = false;
      canvas.style.cursor = 'crosshair';

      let dragging = false;
      let startX = 0;
      let startY = 0;

      const clampToCanvas = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: Cesium.Math.clamp(clientX - rect.left, 0, rect.width),
          y: Cesium.Math.clamp(clientY - rect.top, 0, rect.height),
        };
      };

      const updateSelectionRect = (x: number, y: number) => {
        const left = Math.min(startX, x);
        const top = Math.min(startY, y);
        setZoomAreaRect({
          left,
          top,
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
        });
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const point = clampToCanvas(event.clientX, event.clientY);
        dragging = true;
        startX = point.x;
        startY = point.y;
        setZoomAreaRect({ left: startX, top: startY, width: 0, height: 0 });
        event.preventDefault();
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        const point = clampToCanvas(event.clientX, event.clientY);
        updateSelectionRect(point.x, point.y);
        event.preventDefault();
      };

      const finishSelection = (event: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        const end = clampToCanvas(event.clientX, event.clientY);
        const minX = Math.min(startX, end.x);
        const maxX = Math.max(startX, end.x);
        const minY = Math.min(startY, end.y);
        const maxY = Math.max(startY, end.y);
        const width = maxX - minX;
        const height = maxY - minY;

        setZoomAreaRect(null);
        if (width < 12 || height < 12) return;

        const samples = [
          new Cesium.Cartesian2(minX, minY),
          new Cesium.Cartesian2(maxX, minY),
          new Cesium.Cartesian2(maxX, maxY),
          new Cesium.Cartesian2(minX, maxY),
          new Cesium.Cartesian2((minX + maxX) / 2, (minY + maxY) / 2),
        ];

        const worldPoints = samples
          .map((screenPoint) => getPickedPosition(screenPoint))
          .filter((point): point is Cesium.Cartesian3 => !!point);

        if (worldPoints.length < 2) return;

        const sphere = Cesium.BoundingSphere.fromPoints(worldPoints);
        if (!Number.isFinite(sphere.radius)) return;

        const radius = Math.max(5, sphere.radius);
        const heading = viewer.camera.heading;
        const pitch = Cesium.Math.clamp(
          viewer.camera.pitch,
          Cesium.Math.toRadians(-80),
          Cesium.Math.toRadians(-20),
        );

        setIsZoomAreaSelecting(false);
        viewer.camera.cancelFlight();
        viewer.camera.flyToBoundingSphere(
          new Cesium.BoundingSphere(sphere.center, radius),
          {
            duration: 1.0,
            offset: new Cesium.HeadingPitchRange(
              heading,
              pitch,
              Math.max(15, radius * 2.0),
            ),
          },
        );
      };

      const cancelSelection = () => {
        dragging = false;
        setZoomAreaRect(null);
        setIsZoomAreaSelecting(false);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') cancelSelection();
      };

      canvas.addEventListener('pointerdown', onPointerDown, true);
      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('pointerup', finishSelection, true);
      window.addEventListener('keydown', onKeyDown);

      return () => {
        canvas.removeEventListener('pointerdown', onPointerDown, true);
        window.removeEventListener('pointermove', onPointerMove, true);
        window.removeEventListener('pointerup', finishSelection, true);
        window.removeEventListener('keydown', onKeyDown);
        if (!viewer.isDestroyed()) {
          controller.enableInputs = previousEnableInputs;
          canvas.style.cursor = previousCursor;
          viewer.scene.requestRender();
        }
        setZoomAreaRect(null);
      };
    }, [isZoomAreaSelecting]);

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !isFocusPicking) return;
      const canvas = viewer.scene.canvas;
      const previousCursor = canvas.style.cursor;
      canvas.style.cursor = 'crosshair';
      const handler = new Cesium.ScreenSpaceEventHandler(canvas);

      const cancelFocusPick = () => setIsFocusPicking(false);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') cancelFocusPick();
      };

      handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
        const target = getPickedPosition(click.position);
        if (!target) return;

        stopFlightPath();
        stopCameraAnimation();
        stopSelectedOrbit();
        viewer.camera.cancelFlight();

        const cameraHeight = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC).height;
        const desiredRange = Cesium.Math.clamp(cameraHeight * 0.08, 30, 180);
        const heading = viewer.camera.heading;
        const pitch = Cesium.Math.clamp(
          viewer.camera.pitch,
          Cesium.Math.toRadians(-80),
          Cesium.Math.toRadians(-5),
        );
        setOrbitTargetFromFocus(new Cesium.BoundingSphere(target, 1));
        viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(heading, pitch, desiredRange),
        });
        setHasFocusedTarget(true);
        setIsFocusPicking(false);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        if (!handler.isDestroyed()) handler.destroy();
        canvas.style.cursor = previousCursor;
      };
    }, [isFocusPicking]);

    useEffect(() => {
      setIsFocusPicking(false);
      setIsReturningFocusOrigin(false);
      setHasFocusedTarget(false);
      focusOriginRef.current = null;
    }, [projectId]);

    const handleToggleFocusPick = () => {
      if (isReturningFocusOrigin) return;
      if (isFocusPicking) {
        setIsFocusPicking(false);
        return;
      }

      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      setIsDrawingFlightPath(false);
      setToolMode('none');
      clearSelectedOrbitTarget();

      if (!focusOriginRef.current) {
        focusOriginRef.current = {
          destination: Cesium.Cartesian3.clone(viewer.camera.positionWC),
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll,
        };
        setIsFocusPicking(true);
        return;
      }

      if (!hasFocusedTarget) {
        setIsFocusPicking(true);
        return;
      }

      const origin = focusOriginRef.current;
      stopFlightPath();
      stopCameraAnimation();
      stopSelectedOrbit();
      viewer.camera.cancelFlight();
      setIsReturningFocusOrigin(true);
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.clone(origin.destination),
        orientation: {
          heading: origin.heading,
          pitch: origin.pitch,
          roll: origin.roll,
        },
        duration: 0.9,
        complete: () => {
          setIsReturningFocusOrigin(false);
          setHasFocusedTarget(false);
          setIsFocusPicking(true);
        },
        cancel: () => setIsReturningFocusOrigin(false),
      });
    };

    // Tắt/bật hiển thị toàn bộ phép đo
    useEffect(() => {
      const managedEntities = new Set<Cesium.Entity>();
      measurementsStoreRef.current.forEach(record => {
        const entities = [
          ...record.pointEntities,
          ...record.lineEntities,
          ...record.labelEntities,
          ...(record.fillEntity ? [record.fillEntity] : []),
          ...(record.summaryLabelEntity ? [record.summaryLabelEntity] : []),
        ];
        entities.forEach(entity => {
          managedEntities.add(entity);
          entity.show = showMeasurements && record.visible !== false;
        });
      });
      measurementEntitiesRef.current.forEach(entity => {
        if (!managedEntities.has(entity)) entity.show = showMeasurements;
      });
      viewerRef.current?.scene?.requestRender();
    }, [showMeasurements, measurementRevision]);

    // Điều chỉnh tốc độ camera theo slider
    const getClippingController = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return null;
      if (!clippingControllerRef.current) {
        clippingControllerRef.current = new ClippingController(
          viewer,
          () => [
            ...loadedPointCloudTilesetsRef.current.filter(tileset => !tileset.isDestroyed()),
            ...(modelRef.current ? [modelRef.current] : []),
          ],
          setActiveClipTool,
          setClipInstruction,
        );
      }
      return clippingControllerRef.current;
    };

    const clearClipping = () => clippingControllerRef.current?.clear();

    const handleClipTool = (tool: 'box' | 'polygon' | 'plane' | 'clear') => {
      setIsDrawingFlightPath(false);
      stopFlightPath();
      if (tool === 'clear') {
        clearClipping();
        return;
      }
      // Clipping and measurement creation must never own competing click handlers.
      setToolMode('none');
      getClippingController()?.activate(tool, clipMode, clipFilter);
    };

    useEffect(() => {
      clippingControllerRef.current?.updateSettings(clipMode, clipFilter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clipMode, clipFilter]);

    const getMeasurementRecordEntities = (record: MeasurementRecord): Cesium.Entity[] => Array.from(new Set([
      ...record.pointEntities,
      ...record.lineEntities,
      ...record.labelEntities,
      ...(record.fillEntity ? [record.fillEntity] : []),
      ...(record.summaryLabelEntity ? [record.summaryLabelEntity] : []),
    ]));

    const handleToggleMeasurement = (id: string) => {
      const record = measurementsStoreRef.current.find(item => item.id === id && item.isFinalized);
      if (!record) return;
      record.visible = record.visible === false;
      getMeasurementRecordEntities(record).forEach(entity => {
        entity.show = showMeasurements && record.visible !== false;
      });
      setMeasurementRevision(revision => revision + 1);
      viewerRef.current?.scene.requestRender();
      persistMeasurementUpdate(record);
    };

    const handleDeleteMeasurement = (id: string) => {
      const viewer = viewerRef.current;
      const record = measurementsStoreRef.current.find(item => item.id === id && item.isFinalized);
      if (!viewer || viewer.isDestroyed() || !record) return;
      const entities = new Set(getMeasurementRecordEntities(record));
      entities.forEach(entity => viewer.entities.remove(entity));
      measurementEntitiesRef.current = measurementEntitiesRef.current.filter(entity => !entities.has(entity));
      measurementsStoreRef.current = measurementsStoreRef.current.filter(item => item.id !== id);
      areaReferencePlanesRef.current.delete(id);
      if (activeProfile?.id === id) setActiveProfile(null);
      setMeasurementRevision(revision => revision + 1);
      viewer.scene.requestRender();
      if (projectId) {
        enqueueMeasurementPersistence(id, () => deleteProjectMeasurement(projectId, id));
      }
    };

    const measurementTypeCounts = new Map<ToolMode, number>();
    const measurementManagerItems: MeasurementManagerItem[] = measurementsStoreRef.current
      .filter(record => record.isFinalized)
      .map(record => {
        const sequence = (measurementTypeCounts.get(record.type) ?? 0) + 1;
        measurementTypeCounts.set(record.type, sequence);
        return {
          id: record.id,
          title: `${getMeasurementTypeLabel(record.type)} #${sequence}`,
          value: getMeasurementValue(record),
          visible: record.visible !== false,
        };
      });
    const activeProfileVisible = !activeProfile || measurementsStoreRef.current.find(record => record.id === activeProfile.id)?.visible !== false;

    const handleClear = () => {
      measurementDragCancelRef.current?.();
      restoreMeasurementCamera();
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) setCameraInteractionEnabled(viewer, true);
      if (viewer && !viewer.isDestroyed()) {
        measurementEntitiesRef.current.forEach(e => {
          try { viewer.entities.remove(e); } catch (err) {}
        });
        crossSectionEntitiesRef.current.forEach(e => {
          try { viewer.entities.remove(e); } catch (_error) {}
        });
        cutFillEntitiesRef.current.forEach(e => {
          try { viewer.entities.remove(e); } catch (_error) {}
        });
      }
      measurementEntitiesRef.current = [];
      measurementsStoreRef.current = [];
      crossSectionEntitiesRef.current = [];
      cutFillEntitiesRef.current = [];
      clearCutFillReferenceEntities();
      cutFillDataRef.current = null;
      cutFillCalculationGenerationRef.current += 1;
      setCutFillBusy(false);
      setCutFillProgress(null);
      setCutFillPolygonReady(false);
      setCutFillReferencePoints([]);
      setSelectingCutFillReferencePoints(false);
      setCutFillReferenceError(null);
      areaReferencePlanesRef.current.clear();
      setMeasurementPoints([]);
      setActiveProfile(null);
      setCrossSection(null);
      setCutFillResult(null);
      setIsProfileSampling(false);
      setToolMode('none');
      setMeasurementRevision(revision => revision + 1);
      if (projectId) {
        const pendingWrites = Array.from(measurementPersistenceQueueRef.current.values());
        void Promise.allSettled(pendingWrites)
          .then(() => clearProjectMeasurements(projectId))
          .catch(error => console.error('[Measurement persistence] clear:', error));
      }
    };

    const handleToolModeChange = (mode: ToolMode) => {
      setSelectingCutFillReferencePoints(false);
      if (mode === 'cutFill') {
        clearCutFillReferenceEntities();
        setCutFillReferenceMode('average');
        setCutFillReferencePoints([]);
        setCutFillReferenceError(null);
      } else if (cutFillReferenceEntitiesRef.current.length) {
        clearCutFillReferenceEntities();
        setCutFillReferenceMode('average');
        setCutFillReferencePoints([]);
        setCutFillReferenceError(null);
        void recalculateCutFill('average', cutFillDesignElevation, cutFillGridSpacing, []);
      }
      setIsDrawingFlightPath(false);
      stopFlightPath();
      stopCameraAnimation();
      measurementDragCancelRef.current?.();
      restoreMeasurementCamera();
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        setCameraInteractionEnabled(viewer, true);
        viewer.scene.canvas.style.cursor = 'default';
      }
      setToolMode(current => current === mode ? 'none' : mode);
    };

    const handleInitialDisplayModeChange = (mode: DisplayMode) => {
      if (viewerPhase !== 'ready') markInitialCameraInteraction();
      if (mode === displayMode) applyDisplayModeVisibility(mode);
      setDisplayMode(mode);
    };

    const closeSidebarForCanvasAction = () => {
      if (window.matchMedia('(max-width: 63.999rem)').matches) {
        onToggleSidebar?.(false);
      }
    };

    const initialLoadingTitle = viewerPhase === 'flying-to-project'
      ? loadingCopy.positioningProject
      : loadingCopy.loadingProject;

    return (
      <div className="viewer-shell relative flex h-full min-h-0 w-full overflow-hidden">
        {/* Component Potree Sidebar điều khiển bên trái */}
        <PotreeSidebar
          isOpen={isSidebarOpen}
          onToggleOpen={onToggleSidebar ? () => onToggleSidebar(!isSidebarOpen) : undefined}
          projectName={projectName}
          headerAction={sidebarHeaderAction}
          enableToolGuides={suppliedProject?.isPublic === true}
          currentMode={toolMode}
          onModeChange={(mode) => {
            handleToolModeChange(mode);
            if (toolMode !== mode) closeSidebarForCanvasAction();
          }}
          onClear={handleClear}
          measurementManager={(
            <MeasurementManager
              items={measurementManagerItems}
              onToggle={handleToggleMeasurement}
              onDelete={handleDeleteMeasurement}
            />
          )}
          onClipTool={(tool) => {
            handleClipTool(tool);
            if (tool !== 'clear') closeSidebarForCanvasAction();
          }}
          activeClipTool={activeClipTool}
          clipInstruction={clipInstruction}
          clipMode={clipMode}
          onClipModeChange={setClipMode}
          clipFilter={clipFilter}
          onClipFilterChange={setClipFilter}
          showMeasurements={showMeasurements}
          onToggleShowMeasurements={() => setShowMeasurements(!showMeasurements)}
          cameraSpeed={cameraSpeed}
          onCameraSpeedChange={setCameraSpeed}
          onSetCameraView={(view) => {
            markInitialCameraInteraction();
            handleSetCameraView(view);
            closeSidebarForCanvasAction();
          }}
          onNavigationAction={(action) => {
            markInitialCameraInteraction();
            handleNavigationAction(action);
            if (action === 'compass') closeSidebarForCanvasAction();
          }}
          isFocusPicking={isFocusPicking}
          isReturningFocusOrigin={isReturningFocusOrigin}
          onToggleFocusPick={() => {
            const startsCanvasPick = !isFocusPicking && !isReturningFocusOrigin;
            handleToggleFocusPick();
            if (startsCanvasPick) closeSidebarForCanvasAction();
          }}
          navigationMode={navigationMode}
          isZoomAreaSelecting={isZoomAreaSelecting}
          onToggleZoomArea={() => {
            const startsCanvasSelection = !isZoomAreaSelecting;
            handleToggleZoomArea();
            if (startsCanvasSelection) closeSidebarForCanvasAction();
          }}
          isCameraAnimating={isCameraAnimating}
          flightHeight={flightHeight}
          onFlightHeightChange={setFlightHeight}
          orbitRadius={orbitRadius}
          onOrbitRadiusChange={onOrbitRadiusChange}
          flightPathPointCount={flightPathPointCount}
          isDrawingFlightPath={isDrawingFlightPath}
          flightPathStatus={flightPathStatus}
          onDrawFlightPath={() => {
            drawFlightPath();
            closeSidebarForCanvasAction();
          }}
          onStartFlightPath={() => runFlightPath(true)}
          onPauseFlightPath={pauseFlightPath}
          onResumeFlightPath={() => runFlightPath(false)}
          onStopFlightPath={stopFlightPath}
          onReplayFlightPath={() => runFlightPath(true)}
          onDeleteFlightPath={clearFlightPath}
          activeCameraView={activeCameraView}
          viewAngle={viewAngle}
          cameraHeading={cameraHeading}
          orbitTargetSelected={hasOrbitTarget}
          isSelectingOrbitTarget={isSelectingOrbitTarget}
          isOrbitingTarget={isOrbitingSelectedTarget}
          onSelectOrbitTarget={() => {
            beginOrbitTargetSelection();
            closeSidebarForCanvasAction();
          }}
          onStartOrbitTarget={() => { markInitialCameraInteraction(); startSelectedOrbit(); }}
          onStopOrbitTarget={() => stopSelectedOrbit()}
          showModel={showModel}
          setShowModel={handleModelVisibilityChange}
          showDom={showDom}
          setShowDom={handleDomVisibilityChange}
          showPointCloud={showPointCloud}
          setShowPointCloud={handlePointCloudVisibilityChange}
          modelOpacity={modelOpacity}
          onModelOpacityChange={(value) => setModelOpacity(Cesium.Math.clamp(value, 0, 1))}
          pointCloudOpacity={pointCloudOpacity}
          onPointCloudOpacityChange={(value) => setPointCloudOpacity(Cesium.Math.clamp(value, 0, 1))}
          heatmapEnabled={heatmapEnabled}
          onHeatmapEnabledChange={handleHeatmapEnabledChange}
          heatmapProperty={heatmapProperty}
          onHeatmapPropertyChange={setHeatmapProperty}
          heatmapMax={heatmapMax}
          heatmapRangeAvailable={heatmapRangeAvailable}
          domOpacity={domOpacity}
          onDomOpacityChange={(value) => setDomOpacity(Cesium.Math.clamp(value, 0, 1))}
          modelLoadStatus={modelLoadStatus}
          pointCloudLoadStatus={pointCloudLoadStatus}
          domLoadStatus={domLoadStatus}
          modelLoadError={modelLoadError}
          pointCloudLoadError={pointCloudLoadError}
          domLoadError={domLoadError}
          onRetryModel={retryModel}
          onRetryPointCloud={retryPointCloud}
          onRetryDom={retryDom}
          pointSize={pointSize}
          onPointSizeChange={setPointSize}
          fov={fov}
          onFovChange={setFov}
          edlEnabled={edlEnabled}
          edlSupported={false}
          onEdlToggle={setEdlEnabled}
          edlRadius={edlRadius}
          onEdlRadiusChange={setEdlRadius}
          edlStrength={edlStrength}
          onEdlStrengthChange={setEdlStrength}
          edlOpacity={edlOpacity}
          onEdlOpacityChange={setEdlOpacity}
          background={background}
          onBackgroundChange={setBackground}
          quality={quality}
          onQualityChange={setQuality}
          pointBudget={pointBudget}
          onPointBudgetChange={setPointBudget}
          minPointBudget={minPointBudget}
          maxPointBudget={maxPointBudget}
          minNodeSize={minNodeSize}
          onMinNodeSizeChange={setMinNodeSize}
          lockView={lockView}
          onLockViewChange={setLockView}
          isOrthographic={isOrthographic}
          onProjectionChange={setIsOrthographic}
          onFocusProject={() => { markInitialCameraInteraction(); stopFlightPath(); stopSelectedOrbit(); handleFocusProject(); closeSidebarForCanvasAction(); }}
          onFocusPointCloud={() => { markInitialCameraInteraction(); stopFlightPath(); stopSelectedOrbit(); handleFocusPointCloud(); closeSidebarForCanvasAction(); }}
          onFocusDom={() => { markInitialCameraInteraction(); stopFlightPath(); stopSelectedOrbit(); handleFocusDom(); closeSidebarForCanvasAction(); }}
        />

        <div className="viewer-content relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <UnifiedToolbar
          displayMode={displayMode}
          onDisplayModeChange={handleInitialDisplayModeChange}
          viewAngle={viewAngle}
          onViewAngleChange={setViewAngle}
        />

        {/* Container chứa bản đồ 3D */}
        <div ref={cesiumContainer} className="absolute inset-0 z-0" />

        {zoomAreaRect && (
          <div
            className="pointer-events-none absolute z-30 border border-sky-400 bg-sky-400/10 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]"
            style={{
              left: zoomAreaRect.left,
              top: zoomAreaRect.top,
              width: zoomAreaRect.width,
              height: zoomAreaRect.height,
            }}
          />
        )}

        {/* Lightweight status: Cesium stays visible and the surrounding UI remains usable. */}
        {!viewerReady && viewerPhase !== 'error' && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-sky-500/20 bg-slate-950/88 px-5 py-4 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto h-7 w-7 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
            <p className="mt-3 text-sm font-semibold text-sky-200">{initialLoadingTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{loadingCopy.loadingProjectHint}</p>
          </div>
        )}

        {viewerPhase === 'error' && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rose-500/25 bg-slate-950/90 px-5 py-4 text-center text-sm font-semibold text-rose-300 shadow-2xl backdrop-blur-sm">
            {loadingCopy.loadError}
          </div>
        )}

        {viewerReady && (
          (displayMode === 'model3d' && modelLoadStatus === 'loading') ||
          (displayMode === 'pointcloud' && pointCloudLoadStatus === 'loading') ||
          (displayMode === 'dom' && domLoadStatus === 'loading')
        ) && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-sky-500/20 bg-slate-950/85 px-3 py-1.5 text-center text-xs font-medium text-sky-300 shadow-lg backdrop-blur-md">
            {displayMode === 'model3d'
              ? loadingCopy.loadingModel
              : displayMode === 'pointcloud'
                ? loadingCopy.loadingPointCloud
                : loadingCopy.loadingDom}
          </div>
        )}

        {/* Trắc dọc thật: biểu đồ Distance → Elevation của profile mới nhất */}
        {showMeasurements && activeProfile && activeProfileVisible && toolMode !== 'crossSection' && !crossSection && !cutFillResult && (
          <ProfilePanel
            profile={activeProfile}
            isSampling={isProfileSampling}
            onClose={() => setActiveProfile(null)}
          />
        )}
        {showMeasurements && (toolMode === 'crossSection' || crossSection) && (
          <CrossSectionPanel
            result={crossSection}
            settings={crossSectionSettings}
            busy={crossSectionBusy}
            onSettingsChange={setCrossSectionSettings}
            onClose={() => {
              const viewer = viewerRef.current;
              crossSectionEntitiesRef.current.forEach(entity => {
                try { viewer?.entities.remove(entity); } catch (_error) {}
              });
              crossSectionEntitiesRef.current = [];
              setCrossSection(null);
              setToolMode('none');
              if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
            }}
          />
        )}
        {showMeasurements && cutFillPolygonReady && toolMode !== 'crossSection' && !crossSection && (
          <VolumePanel
            result={cutFillResult}
            referenceMode={cutFillReferenceMode}
            designElevation={cutFillDesignElevation}
            gridSpacing={cutFillGridSpacing}
            referencePointCount={cutFillReferencePoints.length}
            selectingReferencePoints={selectingCutFillReferencePoints}
            referencePlaneError={cutFillReferenceError}
            busy={cutFillBusy}
            progress={cutFillProgress}
            onModeChange={mode => {
              cutFillCalculationGenerationRef.current += 1;
              setCutFillBusy(false);
              setCutFillProgress(null);
              setCutFillReferenceMode(mode);
              setSelectingCutFillReferencePoints(false);
              setCutFillReferenceError(null);
              clearCutFillReferenceEntities();
              setCutFillReferencePoints([]);
              if (mode === 'threePointPlane') {
                setSelectingCutFillReferencePoints(true);
              } else {
                void recalculateCutFill(mode, cutFillDesignElevation, cutFillGridSpacing, []);
              }
            }}
            onDesignElevationChange={setCutFillDesignElevation}
            onGridSpacingChange={setCutFillGridSpacing}
            onSelectReferencePoints={() => {
              cutFillCalculationGenerationRef.current += 1;
              setCutFillBusy(false);
              clearCutFillReferenceEntities();
              setCutFillReferencePoints([]);
              setCutFillReferenceError(null);
              setSelectingCutFillReferencePoints(true);
            }}
            onRecalculate={() => { void recalculateCutFill(cutFillReferenceMode, cutFillDesignElevation, cutFillGridSpacing, cutFillReferencePoints); }}
            onClear={() => {
              const viewer = viewerRef.current;
              cutFillEntitiesRef.current.forEach(entity => { try { viewer?.entities.remove(entity); } catch (_error) {} });
              measurementEntitiesRef.current = measurementEntitiesRef.current.filter(entity => !cutFillEntitiesRef.current.includes(entity));
              cutFillEntitiesRef.current = [];
              clearCutFillReferenceEntities();
              cutFillDataRef.current = null;
              cutFillCalculationGenerationRef.current += 1;
              setCutFillBusy(false);
              setCutFillProgress(null);
              setCutFillPolygonReady(false);
              setCutFillReferencePoints([]);
              setSelectingCutFillReferencePoints(false);
              setCutFillReferenceError(null);
              setCutFillResult(null);
              if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
            }}
          />
        )}
        {(toolMode === 'issue' || selectedIssue || pendingIssuePosition) && (
          <IssuePanel
            issues={issues.filter(issue => issueFilter === 'ALL' || issue.status === issueFilter)}
            selected={selectedIssue}
            creating={!!pendingIssuePosition}
            filter={issueFilter}
            busy={issueBusy}
            onFilter={setIssueFilter}
            onSelect={issue => { setSelectedIssue(issue); setPendingIssuePosition(null); }}
            onClose={() => { setSelectedIssue(null); setPendingIssuePosition(null); if (toolMode === 'issue') setToolMode('none'); }}
            onSave={async (draft: IssueDraft) => {
              if (!projectId) return;
              setIssueBusy(true);
              try {
                let saved: ProjectIssue;
                if (pendingIssuePosition) {
                  const location = Cesium.Cartographic.fromCartesian(pendingIssuePosition);
                  saved = await createProjectIssue(projectId, { ...draft, status: 'OPEN', longitude: Cesium.Math.toDegrees(location.longitude), latitude: Cesium.Math.toDegrees(location.latitude), height: location.height });
                  setPendingIssuePosition(null);
                } else if (selectedIssue) {
                  saved = await updateProjectIssue(projectId, selectedIssue.id, draft);
                } else return;
                const next = issuesRef.current.some(issue => issue.id === saved.id) ? issuesRef.current.map(issue => issue.id === saved.id ? saved : issue) : [saved, ...issuesRef.current];
                issuesRef.current = next; setIssues(next); setSelectedIssue(saved); setToolMode('none');
              } finally { setIssueBusy(false); }
            }}
            onDelete={async id => {
              if (!projectId) return;
              setIssueBusy(true);
              try { await deleteProjectIssue(projectId, id); const next = issuesRef.current.filter(issue => issue.id !== id); issuesRef.current = next; setIssues(next); setSelectedIssue(null); }
              finally { setIssueBusy(false); }
            }}
          />
        )}
        {/* Hướng dẫn động nổi dưới đáy */}
        {toolMode !== 'none' && (
          <div className="absolute bottom-4 left-1/2 z-20 max-w-[calc(100%-24px)] -translate-x-1/2 rounded-xl border border-slate-700/50 bg-black/70 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-100 shadow-lg backdrop-blur-sm pointer-events-none sm:bottom-8 sm:rounded-full sm:px-6 sm:py-3 sm:text-xs sm:tracking-wider">
            {toolMode === 'distance' && (measurementPoints.length === 0
              ? "⚡ Click điểm đầu tiên để bắt đầu đo khoảng cách"
              : "⚡ Click chốt điểm tiếp theo. Click đúp (Double click) để hoàn thành")}
            {toolMode === 'height' && (measurementPoints.length === 0
              ? "📐 Click điểm mốc đầu tiên (mặt đất/gốc vật thể)"
              : "📐 Di chuột và click điểm thứ hai (đỉnh/ngọn vật thể) để đo chiều cao")}
            {toolMode === 'area' && (measurementPoints.length === 0
              ? "🟩 Click điểm đầu tiên để vẽ vùng diện tích"
              : "🟩 Click các đỉnh đa giác. Click đúp để chốt vùng diện tích")}
            {toolMode === 'profile' && (measurementPoints.length === 0
              ? "📈 Click điểm đầu tiên để bắt đầu tuyến trắc dọc"
              : "📈 Click thêm các đỉnh tuyến. Double-click để lấy mẫu cao độ và mở biểu đồ")}
            {toolMode === 'crossSection' && (activeProfile || measurementsStoreRef.current.some(record => record.type === 'profile' && (record.profileSamples?.length ?? 0) >= 2)
              ? "📐 Click một vị trí dọc tuyến trắc dọc để tạo mặt cắt ngang"
              : "📐 Cần hoàn thành một tuyến Trắc dọc trước khi tạo Trắc ngang")}
            {toolMode === 'cutFill' && (measurementPoints.length < 3
              ? "⛏ Click ít nhất 3 đỉnh để khoanh vùng Đào / Đắp"
              : "⛏ Double-click hoặc Enter để tính khối lượng")}
            {toolMode === 'issue' && "📍 Click lên Model / DOM / Point Cloud để ghim vấn đề"}
          </div>
        )}
        </div>
      </div>
    );
  }

export default CesiumViewer;
