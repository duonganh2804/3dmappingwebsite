import type { RefObject } from 'react';
import * as Cesium from 'cesium';
import type { ViewerPerfMilestone, ViewerPerfTiming } from './viewerTypes';

export const stableAssetHash = (value: string): string => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

export const buildAdaptiveProjectCameraSphere = (
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

export const markViewerPerf = (
  timingRef: RefObject<ViewerPerfTiming>,
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
