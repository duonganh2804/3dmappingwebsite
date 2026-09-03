import type * as Cesium from 'cesium';

export type ViewerPhase = 'initializing' | 'waiting-project' | 'flying-to-project' | 'ready' | 'error';
export type InitialBoundsSource = 'point-cloud-root' | 'dom-metadata' | 'glb' | 'project-extent' | 'project-center';
export type PrimaryVisualType = 'point-cloud' | 'dom' | 'model' | 'fallback';

export type InitialCameraRun = {
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

export type ViewerPerfMilestone = 'cesiumReadyMs' | 'firstUsableMs' | 'modelReadyMs' | 'pointCloudReadyMs' | 'domReadyMs';

export type ViewerPerfTiming = {
  projectId?: string;
  startedAt: number;
  cesiumReadyMs?: number;
  firstUsableMs?: number;
  modelReadyMs?: number;
  pointCloudReadyMs?: number;
  domReadyMs?: number;
};
