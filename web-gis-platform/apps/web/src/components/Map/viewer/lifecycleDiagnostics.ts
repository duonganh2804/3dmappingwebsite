import * as Cesium from 'cesium';

type ResourceKind = 'model' | 'point-cloud' | 'imagery' | 'clipping';

type ResourceMeta = {
  id: string;
  kind: ResourceKind | 'unknown';
  projectId: string | null;
  surveyId: string | null;
  generation: number | null;
};

type PickDiagnosticContext = {
  model: Cesium.Model | null;
  pointClouds: Cesium.Cesium3DTileset[];
  dom: Cesium.ImageryLayer | null;
};

const metadata = new WeakMap<object, ResourceMeta>();
const clippingDetachReasons = new WeakMap<object, string>();
const recentEvents: Array<ResourceMeta & {
  event: string;
  elapsedMs: number;
  details?: Record<string, unknown>;
}> = [];
let nextId = 1;

const isDestroyed = (resource: unknown): boolean | null => {
  try {
    return typeof (resource as { isDestroyed?: () => boolean } | null)?.isDestroyed === 'function'
      ? (resource as { isDestroyed: () => boolean }).isDestroyed()
      : null;
  } catch {
    return null;
  }
};

const snapshot = (resource: unknown) => {
  if (!resource || typeof resource !== 'object') return null;
  const meta = metadata.get(resource);
  const destroyed = isDestroyed(resource);
  let clipping: object | undefined;
  if (!destroyed) {
    try { clipping = (resource as { clippingPlanes?: object }).clippingPlanes; } catch { /* diagnostic only */ }
  }
  return {
    ...meta,
    kind: meta?.kind ?? resource.constructor?.name ?? 'unknown',
    isDestroyed: destroyed,
    clipping: clipping ? {
      id: metadata.get(clipping)?.id ?? null,
      isDestroyed: isDestroyed(clipping),
    } : null,
  };
};

const record = (event: string, resource: object, details?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) return;
  const meta = metadata.get(resource) ?? {
    id: `unknown-${nextId++}`,
    kind: 'unknown' as const,
    projectId: null,
    surveyId: null,
    generation: null,
  };
  metadata.set(resource, meta);
  const entry = { ...meta, event, elapsedMs: Math.round(performance.now()), details };
  recentEvents.push(entry);
  if (recentEvents.length > 40) recentEvents.shift();
  console.info('[CesiumLifecycle]', entry, snapshot(resource));
};

export const registerLifecycleResource = (
  resource: object,
  kind: ResourceKind,
  context: {
    projectId?: string;
    surveyId?: string;
    generation?: number;
    details?: Record<string, unknown>;
    destroyDetails?: () => Record<string, unknown>;
  },
) => {
  if (!import.meta.env.DEV || metadata.has(resource)) return;
  metadata.set(resource, {
    id: `${kind}-${nextId++}`,
    kind,
    projectId: context.projectId ?? null,
    surveyId: context.surveyId ?? null,
    generation: context.generation ?? null,
  });
  record(kind === 'imagery' ? 'imagery-created' : 'created', resource, context.details);

  const destroyable = resource as { destroy?: (...args: any[]) => unknown };
  const originalDestroy = destroyable.destroy;
  if (typeof originalDestroy === 'function') {
    destroyable.destroy = function (this: object, ...args: any[]) {
      record('destroy()', resource, {
        ...context.destroyDetails?.(),
        callerStack: new Error(`${kind}.destroy caller`).stack,
      });
      const result = originalDestroy.apply(this, args);
      record('destroyed', resource, context.destroyDetails?.());
      return result;
    };
  }
};

export const registerClippingLifecycle = (
  collection: Cesium.ClippingPlaneCollection,
  target: Cesium.Model | Cesium.Cesium3DTileset,
) => {
  if (!import.meta.env.DEV) return;
  registerLifecycleResource(collection, 'clipping', {
    details: { target: snapshot(target) },
    destroyDetails: () => {
      let targetStillReferences: boolean | null = null;
      try { targetStillReferences = target.clippingPlanes === collection; } catch { /* target already destroyed */ }
      return {
        targetStillReferences,
        announcedDetachReason: clippingDetachReasons.get(collection) ?? null,
        target: snapshot(target),
      };
    },
  });
};

export const logClippingEvent = (
  event: string,
  collection: Cesium.ClippingPlaneCollection,
  target: Cesium.Model | Cesium.Cesium3DTileset,
  reason?: string,
) => {
  if (!import.meta.env.DEV) return;
  if (event === 'detaching' && reason) clippingDetachReasons.set(collection, reason);
  if (event === 'attached') clippingDetachReasons.delete(collection);
  let targetStillReferences: boolean | null = null;
  try { targetStillReferences = target.clippingPlanes === collection; } catch { /* target already destroyed */ }
  record(event, collection, { reason, targetStillReferences, target: snapshot(target) });
};

export const logLifecycleEvent = (
  event: string,
  resource: object,
  details?: Record<string, unknown>,
) => record(event, resource, details);

export const logImageryEvent = (
  event: string,
  layer: Cesium.ImageryLayer,
  details?: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;
  let queuedReprojections: number | null = null;
  try {
    const commands = (layer as Cesium.ImageryLayer & { _reprojectComputeCommands?: unknown[] })._reprojectComputeCommands;
    queuedReprojections = Array.isArray(commands) ? commands.length : null;
  } catch { /* layer may already be destroyed */ }
  record(event, layer, { ...details, queuedReprojections });
};

export const installPickPositionDiagnostics = (
  scene: Cesium.Scene,
  getContext: () => PickDiagnosticContext,
) => {
  if (!import.meta.env.DEV) return () => undefined;

  const diagnosticScene = scene as Cesium.Scene & {
    pickPositionWorldCoordinates?: (...args: any[]) => Cesium.Cartesian3 | undefined;
  };
  const original = diagnosticScene.pickPositionWorldCoordinates;
  if (!original) return () => undefined;

  const wrapped = function (this: Cesium.Scene, ...args: any[]) {
    const callerStack = new Error('Caller of pickPositionWorldCoordinates').stack;
    try {
      return original.apply(this, args);
    } catch (error) {
      const context = getContext();
      console.error('[CesiumLifecycle] pickPositionWorldCoordinates exception', {
        callerStack,
        model: snapshot(context.model),
        pointClouds: context.pointClouds.map(snapshot),
        dom: snapshot(context.dom),
        eventBeforeCrash: recentEvents[recentEvents.length - 1] ?? null,
        recentLifecycleEvents: recentEvents.slice(-20),
        error,
      });
      throw error;
    }
  };

  diagnosticScene.pickPositionWorldCoordinates = wrapped;
  return () => {
    if (!scene.isDestroyed() && diagnosticScene.pickPositionWorldCoordinates === wrapped) {
      diagnosticScene.pickPositionWorldCoordinates = original;
    }
  };
};
