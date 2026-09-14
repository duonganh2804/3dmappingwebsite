export type ProjectSource = 'navigation-state' | 'project-store' | 'api';

type OpenMilestone =
  | 'dashboardOpen'
  | 'viewerPageMounted'
  | 'projectApiStart'
  | 'projectApiEnd'
  | 'cesiumMounted'
  | 'modelStart'
  | 'modelEnd'
  | 'firstModelVisible'
  | 'domMetadataStart'
  | 'domMetadataEnd'
  | 'domFetchStart'
  | 'domFetchEnd'
  | 'domDecodeStart'
  | 'domDecodeEnd'
  | 'domCanvasStart'
  | 'domCanvasEnd'
  | 'firstDomVisible'
  | 'modelAndDomVisible'
  | 'initialFlyComplete'
  | 'viewerReady';

type OpenTrace = {
  projectId: string;
  openedAt: number;
  source?: ProjectSource;
  marks: Partial<Record<OpenMilestone, number>>;
};

const traces = new Map<string, OpenTrace>();

const now = () => performance.now();

const getTrace = (projectId: string, openedAt = now()) => {
  const existing = traces.get(projectId);
  if (existing) return existing;

  const trace: OpenTrace = { projectId, openedAt, marks: {} };
  traces.set(projectId, trace);
  return trace;
};

const mark = (projectId: string, milestone: OpenMilestone, at = now()) => {
  const trace = getTrace(projectId, at);
  if (trace.marks[milestone] == null) trace.marks[milestone] = at;
};

const duration = (
  projectId: string,
  start: OpenMilestone,
  end: OpenMilestone,
) => {
  const trace = traces.get(projectId);
  const startAt = trace?.marks[start];
  const endAt = trace?.marks[end];
  return startAt == null || endAt == null ? undefined : Math.round(endAt - startAt);
};

const report = (projectId: string) => {
  if (!import.meta.env.DEV) return;
  const trace = traces.get(projectId);
  if (!trace) return;

  console.info('[ViewerOpenTelemetry]', {
    projectId,
    source: trace.source,
    totalMs: Math.round((trace.marks.viewerReady ?? now()) - trace.openedAt),
    projectApiMs: duration(projectId, 'projectApiStart', 'projectApiEnd'),
    modelMs: duration(projectId, 'modelStart', 'modelEnd'),
    domMetadataMs: duration(projectId, 'domMetadataStart', 'domMetadataEnd'),
    domFetchMs: duration(projectId, 'domFetchStart', 'domFetchEnd'),
    domDecodeMs: duration(projectId, 'domDecodeStart', 'domDecodeEnd'),
    domCanvasMs: duration(projectId, 'domCanvasStart', 'domCanvasEnd'),
    firstModelVisibleMs: trace.marks.firstModelVisible == null
      ? undefined
      : Math.round(trace.marks.firstModelVisible - trace.openedAt),
    firstDomVisibleMs: trace.marks.firstDomVisible == null
      ? undefined
      : Math.round(trace.marks.firstDomVisible - trace.openedAt),
    modelAndDomVisibleMs: trace.marks.modelAndDomVisible == null
      ? undefined
      : Math.round(trace.marks.modelAndDomVisible - trace.openedAt),
    initialFlyCompleteMs: trace.marks.initialFlyComplete == null
      ? undefined
      : Math.round(trace.marks.initialFlyComplete - trace.openedAt),
  });
};

export const openPerf = {
  beginDashboardOpen(projectId: string, openedAt = now()) {
    traces.set(projectId, {
      projectId,
      openedAt,
      marks: { dashboardOpen: openedAt },
    });
  },
  markViewerPageMounted(projectId: string, source: ProjectSource, openedAt?: number) {
    const trace = getTrace(projectId, openedAt);
    if (openedAt != null) trace.openedAt = openedAt;
    trace.source = source;
    mark(projectId, 'viewerPageMounted');
  },
  startProjectApi: (projectId: string) => mark(projectId, 'projectApiStart'),
  endProjectApi: (projectId: string) => mark(projectId, 'projectApiEnd'),
  markCesiumMounted: (projectId: string) => mark(projectId, 'cesiumMounted'),
  startModel: (projectId: string) => mark(projectId, 'modelStart'),
  endModel: (projectId: string) => mark(projectId, 'modelEnd'),
  markFirstModelVisible: (projectId: string) => mark(projectId, 'firstModelVisible'),
  startDomMetadata: (projectId: string) => mark(projectId, 'domMetadataStart'),
  endDomMetadata: (projectId: string) => mark(projectId, 'domMetadataEnd'),
  startDomFetch: (projectId: string) => mark(projectId, 'domFetchStart'),
  endDomFetch: (projectId: string) => mark(projectId, 'domFetchEnd'),
  startDomDecode: (projectId: string) => mark(projectId, 'domDecodeStart'),
  endDomDecode: (projectId: string) => mark(projectId, 'domDecodeEnd'),
  startDomCanvas: (projectId: string) => mark(projectId, 'domCanvasStart'),
  endDomCanvas: (projectId: string) => mark(projectId, 'domCanvasEnd'),
  markFirstDomVisible: (projectId: string) => mark(projectId, 'firstDomVisible'),
  markModelAndDomVisible: (projectId: string) => mark(projectId, 'modelAndDomVisible'),
  markInitialFlyComplete: (projectId: string) => mark(projectId, 'initialFlyComplete'),
  markViewerReady(projectId: string) {
    mark(projectId, 'viewerReady');
    report(projectId);
  },
};
