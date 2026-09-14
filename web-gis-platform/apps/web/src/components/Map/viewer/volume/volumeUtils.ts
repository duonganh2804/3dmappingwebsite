import * as Cesium from 'cesium';
import type { CutFillReferenceMode, CutFillResult } from '../../measurementTypes';

export type GridPlan = {
  areaM2: number;
  gridSpacing: number;
  cellAreaM2: number;
  positions: Cesium.Cartographic[];
  worldToLocal: Cesium.Matrix4;
};
export type VolumeElevationSample = { position: Cesium.Cartesian3; elevation: number; index: number };
export type VolumeSamplingTimings = { projectSurfaceMs: number; terrainFallbackMs: number };
export type VolumeSamplingOptions = {
  projectObjectsToExclude?: object[];
  terrainObjectsToExclude?: object[];
  isCancelled?: () => boolean;
  onProgress?: (percent: number) => void;
  onTimings?: (timings: VolumeSamplingTimings) => void;
};
export type LocalReferencePlane = { a: number; b: number; c: number; d: number };

const isFiniteCartesian = (point: Cesium.Cartesian3) =>
  Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);

export function createLocalReferencePlane(points: Cesium.Cartesian3[]): LocalReferencePlane | null {
  if (points.length !== 3 || points.some(point => !isFiniteCartesian(point))) return null;
  const [p1, p2, p3] = points;
  const v1 = Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3());
  const v2 = Cesium.Cartesian3.subtract(p3, p1, new Cesium.Cartesian3());
  const length1 = Cesium.Cartesian3.magnitude(v1);
  const length2 = Cesium.Cartesian3.magnitude(v2);
  if (length1 < 0.001 || length2 < 0.001 || Cesium.Cartesian3.distance(p2, p3) < 0.001) return null;
  const normal = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3());
  const magnitude = Cesium.Cartesian3.magnitude(normal);
  if (!Number.isFinite(magnitude) || magnitude <= length1 * length2 * 1e-6) return null;
  const cRatio = Math.abs(normal.z) / magnitude;
  if (!Number.isFinite(cRatio) || cRatio < 1e-6) return null;
  const d = -Cesium.Cartesian3.dot(normal, p1);
  const plane = { a: normal.x, b: normal.y, c: normal.z, d };
  return Object.values(plane).every(Number.isFinite) ? plane : null;
}

export const evaluateLocalReferencePlane = (plane: LocalReferencePlane, x: number, y: number) =>
  -(plane.a * x + plane.b * y + plane.d) / plane.c;

export function buildThreePointReferencePlane(plan: GridPlan, points: Cesium.Cartesian3[]) {
  return createLocalReferencePlane(points.map(point =>
    Cesium.Matrix4.multiplyByPoint(plan.worldToLocal, point, new Cesium.Cartesian3()),
  ));
}

const insidePolygon = (x: number, y: number, polygon: Cesium.Cartesian3[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

export function buildVolumeGrid(polygon: Cesium.Cartesian3[], requestedSpacing = 1, maxCells = 25000): GridPlan | null {
  if (polygon.length < 3 || !Number.isFinite(requestedSpacing) || requestedSpacing <= 0) return null;
  const origin = polygon.reduce((sum, point) => Cesium.Cartesian3.add(sum, point, sum), new Cesium.Cartesian3());
  Cesium.Cartesian3.multiplyByScalar(origin, 1 / polygon.length, origin);
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  const inverse = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());
  const local = polygon.map(point => Cesium.Matrix4.multiplyByPoint(inverse, point, new Cesium.Cartesian3()));
  let twiceArea = 0;
  local.forEach((point, index) => { const next = local[(index + 1) % local.length]; twiceArea += point.x * next.y - next.x * point.y; });
  const areaM2 = Math.abs(twiceArea) / 2;
  if (areaM2 < 0.01) return null;

  const minX = Math.min(...local.map(point => point.x)), maxX = Math.max(...local.map(point => point.x));
  const minY = Math.min(...local.map(point => point.y)), maxY = Math.max(...local.map(point => point.y));
  const width = Math.max(0.001, maxX - minX), height = Math.max(0.001, maxY - minY);
  let gridSpacing = Math.max(0.1, requestedSpacing);
  let estimatedCells = Math.ceil(width / gridSpacing) * Math.ceil(height / gridSpacing);
  if (estimatedCells > maxCells) {
    gridSpacing *= Math.sqrt(estimatedCells / maxCells);
    estimatedCells = Math.ceil(width / gridSpacing) * Math.ceil(height / gridSpacing);
    if (estimatedCells > maxCells) gridSpacing *= Math.sqrt(estimatedCells / maxCells) * 1.001;
  }

  const positions: Cesium.Cartographic[] = [];
  for (let y = minY + gridSpacing / 2; y < maxY; y += gridSpacing) {
    for (let x = minX + gridSpacing / 2; x < maxX; x += gridSpacing) {
      if (!insidePolygon(x, y, local)) continue;
      const world = Cesium.Matrix4.multiplyByPoint(enu, new Cesium.Cartesian3(x, y, 0), new Cesium.Cartesian3());
      const cartographic = Cesium.Cartographic.fromCartesian(world);
      cartographic.height = 0;
      positions.push(cartographic);
    }
  }
  return positions.length ? { areaM2, gridSpacing, cellAreaM2: gridSpacing * gridSpacing, positions, worldToLocal: inverse } : null;
}

export const yieldToMainThread = () => new Promise<void>(resolve => {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
  else resolve();
});

const samplePass = async (scene: Cesium.Scene, positions: Cesium.Cartographic[], objectsToExclude: object[], onProgress?: (ratio: number) => void, isCancelled?: () => boolean) => {
  if (!positions.length || !scene.sampleHeightSupported) return [];
  const sampled: Array<Cesium.Cartographic | undefined> = [];
  const batchSize = 500;
  for (let offset = 0; offset < positions.length; offset += batchSize) {
    if (isCancelled?.()) break;
    const batch = positions.slice(offset, offset + batchSize).map(position => Cesium.Cartographic.clone(position));
    try {
      sampled.push(...await scene.sampleHeightMostDetailed(batch, objectsToExclude, 0.2));
    } catch {
      sampled.push(...new Array<Cesium.Cartographic | undefined>(batch.length));
    }
    onProgress?.(Math.min(1, (offset + batch.length) / positions.length));
    if (offset + batchSize < positions.length) await yieldToMainThread();
  }
  return sampled;
};

export async function sampleVolumeGrid(scene: Cesium.Scene, terrainProvider: Cesium.TerrainProvider, plan: GridPlan, options: VolumeSamplingOptions = {}) {
  const sampled: Array<Cesium.Cartographic | undefined> = new Array(plan.positions.length);
  const projectStartedAt = performance.now();
  const primary = await samplePass(scene, plan.positions, options.projectObjectsToExclude ?? [], ratio => options.onProgress?.(ratio * 80), options.isCancelled);
  const projectSurfaceMs = performance.now() - projectStartedAt;
  if (options.isCancelled?.()) return [];
  primary.forEach((item, index) => { if (item && Number.isFinite(item.height)) sampled[index] = item; });

  let missing = sampled.map((item, index) => item ? -1 : index).filter(index => index >= 0);
  const terrainStartedAt = performance.now();
  if (missing.length) {
    const terrain = await samplePass(scene, missing.map(index => plan.positions[index]), options.terrainObjectsToExclude ?? [], ratio => options.onProgress?.(80 + ratio * 15), options.isCancelled);
    terrain.forEach((item, resultIndex) => { if (item && Number.isFinite(item.height)) sampled[missing[resultIndex]] = item; });
  }

  if (options.isCancelled?.()) return [];

  missing = sampled.map((item, index) => item ? -1 : index).filter(index => index >= 0);
  const provider = terrainProvider as Cesium.TerrainProvider & { availability?: unknown };
  if (missing.length && provider.availability) {
    try {
      const terrain = await Cesium.sampleTerrainMostDetailed(provider, missing.map(index => Cesium.Cartographic.clone(plan.positions[index])));
      terrain.forEach((item, resultIndex) => { if (item && Number.isFinite(item.height)) sampled[missing[resultIndex]] = item; });
    } catch {
      // Missing terrain remains explicit no-data.
    }
  }

  const terrainFallbackMs = performance.now() - terrainStartedAt;
  options.onProgress?.(100);
  options.onTimings?.({ projectSurfaceMs: projectSurfaceMs, terrainFallbackMs });

  return sampled.flatMap((item, index): VolumeElevationSample[] => item && Number.isFinite(item.height)
    ? [{ position: Cesium.Cartesian3.fromRadians(item.longitude, item.latitude, item.height), elevation: item.height, index }]
    : []);
}

export function calculateCutFill(polygon: Cesium.Cartesian3[], plan: GridPlan, elevations: VolumeElevationSample[], referenceMode: CutFillReferenceMode, designElevation: number, referencePoints: Cesium.Cartesian3[] = []): CutFillResult | null {
  if (!elevations.length) return null;
  const heights = elevations.map(sample => sample.elevation);
  const constantReferenceElevation = referenceMode === 'average'
    ? heights.reduce((sum, height) => sum + height * plan.cellAreaM2, 0) / (heights.length * plan.cellAreaM2)
    : referenceMode === 'min' ? Math.min(...heights) : referenceMode === 'max' ? Math.max(...heights) : designElevation;
  const plane = referenceMode === 'threePointPlane' ? buildThreePointReferencePlane(plan, referencePoints) : null;
  if (referenceMode === 'threePointPlane' ? !plane : !Number.isFinite(constantReferenceElevation)) return null;

  let cutM3 = 0, fillM3 = 0;
  let referenceElevationSum = 0;
  const samples = elevations.map(sample => {
    let referenceElevation = constantReferenceElevation;
    let delta = sample.elevation - referenceElevation;
    if (plane) {
      const localSurface = Cesium.Matrix4.multiplyByPoint(plan.worldToLocal, sample.position, new Cesium.Cartesian3());
      const localReferenceZ = evaluateLocalReferencePlane(plane, localSurface.x, localSurface.y);
      delta = localSurface.z - localReferenceZ;
      referenceElevation = sample.elevation - delta;
    }
    referenceElevationSum += referenceElevation * plan.cellAreaM2;
    cutM3 += Math.max(delta, 0) * plan.cellAreaM2;
    fillM3 += Math.max(-delta, 0) * plan.cellAreaM2;
    return { position: sample.position, existingElevation: sample.elevation, referenceElevation, delta };
  });
  const totalSampleCount = plan.positions.length;
  const invalidSampleCount = Math.max(0, totalSampleCount - elevations.length);
  const referenceElevation = referenceElevationSum / (elevations.length * plan.cellAreaM2);
  return {
    polygon, samples, areaM2: plan.areaM2, sampledAreaM2: elevations.length * plan.cellAreaM2,
    referenceMode, referenceElevation, gridSpacing: plan.gridSpacing,
    totalSampleCount, invalidSampleCount, validCoverage: totalSampleCount ? elevations.length / totalSampleCount : 0,
    cutM3, fillM3, netM3: cutM3 - fillM3, minElevation: Math.min(...heights), maxElevation: Math.max(...heights),
    ...(plane ? { referencePoints: referencePoints.map(point => Cesium.Cartesian3.clone(point)) } : {}),
  };
}
