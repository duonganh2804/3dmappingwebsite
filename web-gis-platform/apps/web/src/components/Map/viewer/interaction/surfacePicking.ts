import * as Cesium from 'cesium';
import { isFiniteCartesian } from '../geometry';

type PickHit = {
  id?: unknown;
  primitive?: { id?: unknown };
};

export type SceneSurfacePickOptions = {
  isHelperEntity?: (entity: Cesium.Entity) => boolean;
  projectPrimitives?: Array<Cesium.Model | Cesium.Cesium3DTileset>;
};

const getPickedEntity = (hit: unknown) => {
  const picked = hit as PickHit | undefined;
  return picked?.id instanceof Cesium.Entity
    ? picked.id
    : picked?.primitive?.id instanceof Cesium.Entity
      ? picked.primitive.id
      : null;
};

const pickDepthPosition = (
  scene: Cesium.Scene,
  windowPosition: Cesium.Cartesian2,
) => {
  if (!scene.pickPositionSupported) return null;
  try {
    const position = scene.pickPosition(windowPosition);
    return isFiniteCartesian(position) ? Cesium.Cartesian3.clone(position) : null;
  } catch {
    return null;
  }
};

const getHitPrimitiveCandidates = (hit: unknown) => {
  const value = hit as {
    primitive?: unknown;
    tileset?: unknown;
    content?: { tileset?: unknown; _tileset?: unknown };
  } | undefined;
  return [
    hit,
    value?.primitive,
    value?.tileset,
    value?.content?.tileset,
    value?.content?._tileset,
  ];
};

const getProjectHits = (
  hits: unknown[],
  projectPrimitives: Array<Cesium.Model | Cesium.Cesium3DTileset>,
) => projectPrimitives.filter(primitive =>
  hits.some(hit => getHitPrimitiveCandidates(hit).includes(primitive)),
);

const isPositionOnProjectPrimitive = (
  viewer: Cesium.Viewer,
  position: Cesium.Cartesian3,
  primitives: Array<Cesium.Model | Cesium.Cesium3DTileset>,
) => primitives.some(primitive => {
  try {
    const sphere = primitive.boundingSphere;
    if (!sphere || !isFiniteCartesian(sphere.center) || !Number.isFinite(sphere.radius)) return false;
    const pixelTolerance = viewer.camera.getPixelSize(
      sphere,
      Math.max(1, viewer.scene.drawingBufferWidth),
      Math.max(1, viewer.scene.drawingBufferHeight),
    ) * 8;
    const tolerance = Math.max(0.05, sphere.radius * 0.02, pixelTolerance);
    return Cesium.Cartesian3.distance(position, sphere.center) <= sphere.radius + tolerance;
  } catch {
    return false;
  }
});

const isDistinctFromGlobeSurface = (
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
  position: Cesium.Cartesian3,
) => {
  if (!viewer.scene.globe.show) return true;
  try {
    const ray = viewer.camera.getPickRay(windowPosition);
    const globePosition = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
    if (!isFiniteCartesian(globePosition)) return true;
    const pixelSize = viewer.camera.getPixelSize(
      new Cesium.BoundingSphere(position, 1),
      Math.max(1, viewer.scene.drawingBufferWidth),
      Math.max(1, viewer.scene.drawingBufferHeight),
    );
    return Cesium.Cartesian3.distance(position, globePosition) > Math.max(0.01, pixelSize * 2);
  } catch {
    return false;
  }
};

export const getSceneSurfacePosition = (
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
  options: SceneSurfacePickOptions = {},
): Cesium.Cartesian3 | null => {
  if (viewer.isDestroyed() || !windowPosition) return null;
  const scene = viewer.scene;
  const projectPrimitives = (options.projectPrimitives ?? []).filter(primitive => {
    try {
      return primitive.show && !primitive.isDestroyed();
    } catch {
      return false;
    }
  });

  let helperEntities: Cesium.Entity[] = [];
  let renderedHits: unknown[] = [];
  if (options.isHelperEntity) {
    try {
      renderedHits = scene.drillPick(windowPosition, 32);
      helperEntities = renderedHits
        .map(getPickedEntity)
        .filter((entity): entity is Cesium.Entity => !!entity && options.isHelperEntity!(entity));
      helperEntities = [...new Set(helperEntities)];
    } catch {
      helperEntities = [];
    }
  } else {
    try {
      renderedHits = scene.drillPick(windowPosition, 32);
    } catch {
      renderedHits = [];
    }
  }

  const visibility = helperEntities.map(entity => ({ entity, show: entity.show }));
  let projectOwnsPixel = false;
  try {
    if (visibility.length > 0) {
      visibility.forEach(({ entity }) => { entity.show = false; });
      scene.render();
      renderedHits = scene.drillPick(windowPosition, 32);
    }

    const projectHits = getProjectHits(renderedHits, projectPrimitives);
    projectOwnsPixel = projectHits.length > 0;
    const depthPosition = pickDepthPosition(scene, windowPosition);

    if (projectHits.length === 0) {
      if (depthPosition) return depthPosition;
    } else {
      if (
        depthPosition &&
        isPositionOnProjectPrimitive(viewer, depthPosition, projectHits) &&
        isDistinctFromGlobeSurface(viewer, windowPosition, depthPosition)
      ) {
        return depthPosition;
      }

      const globeWasShown = scene.globe.show;
      try {
        scene.globe.show = false;
        scene.render();
        const isolatedPosition = pickDepthPosition(scene, windowPosition);
        if (
          isolatedPosition &&
          (isPositionOnProjectPrimitive(viewer, isolatedPosition, projectHits) ||
            projectHits.every(primitive => !primitive.boundingSphere))
        ) {
          return isolatedPosition;
        }
      } finally {
        scene.globe.show = globeWasShown;
        scene.requestRender();
      }

      // A visible project primitive owns this pixel. Returning a globe position
      // would recreate the click-through bug, so fail closed if isolation fails.
      return null;
    }
  } catch {
    // Continue to terrain only when no project primitive was confirmed.
  } finally {
    if (visibility.length > 0) {
      visibility.forEach(({ entity, show }) => { entity.show = show; });
      scene.requestRender();
    }
  }

  if (projectOwnsPixel) return null;

  try {
    const ray = viewer.camera.getPickRay(windowPosition);
    const globePosition = ray ? scene.globe.pick(ray, scene) : undefined;
    if (isFiniteCartesian(globePosition)) return Cesium.Cartesian3.clone(globePosition);

    const ellipsoidPosition = viewer.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
    return isFiniteCartesian(ellipsoidPosition)
      ? Cesium.Cartesian3.clone(ellipsoidPosition)
      : null;
  } catch {
    return null;
  }
};
