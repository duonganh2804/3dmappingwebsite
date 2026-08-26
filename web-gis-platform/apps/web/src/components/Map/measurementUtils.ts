import * as Cesium from 'cesium';
import type { MeasurementRecord, ProfileResult, ToolMode } from './measurementTypes';

export type ProfileSamplePlanItem = {
  distance: number;
  cartographic: Cesium.Cartographic;
  fallbackHeight: number;
};

export function buildAreaReferencePlane(points: Cesium.Cartesian3[]): Cesium.Plane | null {
  if (points.length < 3) return null;
  const centroid = Cesium.Cartesian3.multiplyByScalar(
    points.reduce((sum, point) => Cesium.Cartesian3.add(sum, point, sum), new Cesium.Cartesian3()),
    1 / points.length,
    new Cesium.Cartesian3(),
  );
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(centroid);
  const inverseEnu = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());
  const local = points.map(point => Cesium.Matrix4.multiplyByPoint(inverseEnu, point, new Cesium.Cartesian3()));
  const horizontalSpan = Math.max(
    1,
    ...local.flatMap((point, index) => local.slice(index + 1).map(other =>
      Math.hypot(point.x - other.x, point.y - other.y)
    )),
  );
  const inlierThreshold = Math.max(0.05, horizontalSpan * 0.01);
  let best: { normal: Cesium.Cartesian3; point: Cesium.Cartesian3; score: number } | null = null;

  for (let first = 0; first < local.length - 2; first++) {
    for (let second = first + 1; second < local.length - 1; second++) {
      for (let third = second + 1; third < local.length; third++) {
        const ab = Cesium.Cartesian3.subtract(local[second], local[first], new Cesium.Cartesian3());
        const ac = Cesium.Cartesian3.subtract(local[third], local[first], new Cesium.Cartesian3());
        const normal = Cesium.Cartesian3.cross(ab, ac, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitudeSquared(normal) < Cesium.Math.EPSILON12) continue;
        Cesium.Cartesian3.normalize(normal, normal);
        if (normal.z < 0) Cesium.Cartesian3.negate(normal, normal);
        const upScore = normal.z;
        if (upScore < 0.35) continue;
        const distance = -Cesium.Cartesian3.dot(normal, local[first]);
        const residuals = local.map(point => Math.abs(Cesium.Cartesian3.dot(normal, point) + distance));
        const inlierCount = residuals.filter(residual => residual <= inlierThreshold).length;
        const meanInlierResidual = residuals
          .filter(residual => residual <= inlierThreshold)
          .reduce((sum, residual) => sum + residual, 0) / Math.max(1, inlierCount);
        const score = inlierCount * 1000 + upScore * 100 - meanInlierResidual;
        if (!best || score > best.score) best = { normal, point: local[first], score };
      }
    }
  }

  if (!best) return null;
  const worldNormal = Cesium.Matrix4.multiplyByPointAsVector(enu, best.normal, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(worldNormal, worldNormal);
  const worldPoint = Cesium.Matrix4.multiplyByPoint(enu, best.point, new Cesium.Cartesian3());
  return Cesium.Plane.fromPointNormal(worldPoint, worldNormal);
}

export function projectPointToPlane(point: Cesium.Cartesian3, plane: Cesium.Plane): Cesium.Cartesian3 {
  return Cesium.Cartesian3.subtract(
    point,
    Cesium.Cartesian3.multiplyByScalar(
      plane.normal,
      Cesium.Plane.getPointDistance(plane, point),
      new Cesium.Cartesian3(),
    ),
    new Cesium.Cartesian3(),
  );
}

export function normalizeAreaPoints(points: Cesium.Cartesian3[], plane: Cesium.Plane): Cesium.Cartesian3[] {
  const normalized = points.map(point => projectPointToPlane(point, plane));
  const maxResidual = Math.max(
    0,
    ...normalized.map(point => Math.abs(Cesium.Plane.getPointDistance(plane, point))),
  );
  console.info('[MEASURE AREA PLANE]', {
    normal: Cesium.Cartesian3.clone(plane.normal),
    maxResidual,
  });
  return normalized;
}

export function buildProfileSamplePlan(
  controlPoints: Cesium.Cartesian3[],
  maxSamples = 220,
): { items: ProfileSamplePlanItem[]; totalDistance: number } | null {
  if (controlPoints.length < 2) return null;
  const segments: {
    geodesic: Cesium.EllipsoidGeodesic;
    length: number;
    startDistance: number;
    startHeight: number;
    endHeight: number;
  }[] = [];
  let totalDistance = 0;

  for (let index = 0; index < controlPoints.length - 1; index++) {
    const start = Cesium.Cartographic.fromCartesian(controlPoints[index]);
    const end = Cesium.Cartographic.fromCartesian(controlPoints[index + 1]);
    const geodesic = new Cesium.EllipsoidGeodesic(start, end);
    const length = geodesic.surfaceDistance;
    if (!Number.isFinite(length) || length < 0.01) continue;
    segments.push({ geodesic, length, startDistance: totalDistance, startHeight: start.height, endHeight: end.height });
    totalDistance += length;
  }

  if (segments.length === 0 || totalDistance < 0.01) return null;
  const sampleCount = Math.max(24, Math.min(maxSamples, Math.ceil(totalDistance / 1.0) + 1));
  const items: ProfileSamplePlanItem[] = [];
  let segmentIndex = 0;

  for (let index = 0; index < sampleCount; index++) {
    const targetDistance = index === sampleCount - 1
      ? totalDistance
      : (totalDistance * index) / (sampleCount - 1);
    while (
      segmentIndex < segments.length - 1 &&
      targetDistance > segments[segmentIndex].startDistance + segments[segmentIndex].length
    ) segmentIndex++;

    const segment = segments[segmentIndex];
    const localDistance = Cesium.Math.clamp(targetDistance - segment.startDistance, 0, segment.length);
    const progress = segment.length > 0 ? localDistance / segment.length : 0;
    const cartographic = segment.geodesic.interpolateUsingSurfaceDistance(localDistance, new Cesium.Cartographic());
    cartographic.height = 0;
    items.push({
      distance: targetDistance,
      cartographic,
      fallbackHeight: segment.startHeight + (segment.endHeight - segment.startHeight) * progress,
    });
  }
  return { items, totalDistance };
}

export function buildProfileChartPoints(
  profile: ProfileResult,
  width = 520,
  height = 160,
  paddingX = 18,
  paddingY = 18,
): string {
  const distanceRange = Math.max(profile.totalDistance, 0.01);
  const heightRange = Math.max(profile.maxHeight - profile.minHeight, 0.01);
  const drawWidth = width - paddingX * 2;
  const drawHeight = height - paddingY * 2;
  return profile.samples.map(sample => {
    const x = paddingX + (sample.distance / distanceRange) * drawWidth;
    const y = height - paddingY - ((sample.height - profile.minHeight) / heightRange) * drawHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function buildControlProfilePreview(id: string, points: Cesium.Cartesian3[]): ProfileResult {
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  const samples = points.map((point, index) => {
    const height = Cesium.Cartographic.fromCartesian(point).height;
    if (index > 0) {
      totalDistance += Cesium.Cartesian3.distance(points[index - 1], point);
      const previousHeight = Cesium.Cartographic.fromCartesian(points[index - 1]).height;
      const delta = height - previousHeight;
      if (delta >= 0) elevationGain += delta;
      else elevationLoss += -delta;
    }
    return { distance: totalDistance, height, position: point, source: 'control' as const };
  });
  const heights = samples.map(sample => sample.height);
  return {
    id,
    samples,
    totalDistance,
    minHeight: Math.min(...heights),
    maxHeight: Math.max(...heights),
    elevationGain,
    elevationLoss,
    sceneSampleCount: 0,
    terrainSampleCount: 0,
    fallbackSampleCount: samples.length,
  };
}

export const MEASUREMENT_RING_DOT_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="rgba(0,0,0,0.22)" stroke="#ffffff" stroke-width="1"/><circle cx="8" cy="8" r="2.5" fill="#22d3ee"/></svg>'
)}`;

export const MEASUREMENT_RING_DOT_GLOW_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><circle cx="8" cy="8" r="6" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.55" filter="url(#g)"/><circle cx="8" cy="8" r="6.5" fill="rgba(0,0,0,0.22)" stroke="#ffffff" stroke-width="1"/><circle cx="8" cy="8" r="2.5" fill="#22d3ee"/></svg>'
)}`;

export function calculatePolygonArea(points: Cesium.Cartesian3[]): number {
  if (points.length < 3) return 0;
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(points[0]);
  const inverse = Cesium.Matrix4.inverse(transform, new Cesium.Matrix4());
  const localPoints = points.map(point => Cesium.Matrix4.multiplyByPoint(inverse, point, new Cesium.Cartesian3()));
  let area = 0;
  for (let index = 0; index < localPoints.length; index++) {
    const next = (index + 1) % localPoints.length;
    area += localPoints[index].x * localPoints[next].y;
    area -= localPoints[next].x * localPoints[index].y;
  }
  return Math.abs(area) * 0.5;
}

export function calculateCentroid(points: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  if (points.length === 0) return Cesium.Cartesian3.ZERO;
  const sum = new Cesium.Cartesian3();
  points.forEach(point => Cesium.Cartesian3.add(sum, point, sum));
  return Cesium.Cartesian3.multiplyByScalar(sum, 1 / points.length, new Cesium.Cartesian3());
}

export function getMidpoint(first: Cesium.Cartesian3, second: Cesium.Cartesian3): Cesium.Cartesian3 {
  const result = Cesium.Cartesian3.add(first, second, new Cesium.Cartesian3());
  return Cesium.Cartesian3.multiplyByScalar(result, 0.5, result);
}

export function calculateAngleDegrees(first: Cesium.Cartesian3, vertex: Cesium.Cartesian3, third: Cesium.Cartesian3): number | null {
  const firstVector = Cesium.Cartesian3.subtract(first, vertex, new Cesium.Cartesian3());
  const secondVector = Cesium.Cartesian3.subtract(third, vertex, new Cesium.Cartesian3());
  const magnitudeProduct = Cesium.Cartesian3.magnitude(firstVector) * Cesium.Cartesian3.magnitude(secondVector);
  if (magnitudeProduct < Cesium.Math.EPSILON10) return null;
  const cosine = Cesium.Math.clamp(Cesium.Cartesian3.dot(firstVector, secondVector) / magnitudeProduct, -1, 1);
  return Cesium.Math.toDegrees(Math.acos(cosine));
}

export function getProjectedPoint(first: Cesium.Cartesian3, second: Cesium.Cartesian3): Cesium.Cartesian3 {
  const firstCartographic = Cesium.Cartographic.fromCartesian(first);
  const secondCartographic = Cesium.Cartographic.fromCartesian(second);
  return Cesium.Cartographic.toCartesian(new Cesium.Cartographic(
    secondCartographic.longitude,
    secondCartographic.latitude,
    firstCartographic.height
  ));
}

const TYPE_LABELS: Record<ToolMode, string> = {
  none: 'Phép đo', point: 'Điểm', distance: 'Khoảng cách', height: 'Chiều cao',
  angle: 'Góc', circle: 'Đường tròn', sphere: 'Mặt cầu', azimuth: 'Azimuth',
  area: 'Diện tích', volume: 'Thể tích', profile: 'Trắc dọc', annotation: 'Ghi chú',
};

export function getMeasurementTypeLabel(type: ToolMode): string {
  return TYPE_LABELS[type];
}

export function getMeasurementValue(record: MeasurementRecord): string {
  const points = record.points;
  const segmentLength = () => points.slice(1).reduce(
    (sum, point, index) => sum + Cesium.Cartesian3.distance(points[index], point),
    0
  );

  if (record.type === 'distance') return `${segmentLength().toFixed(2)} m`;
  if (record.type === 'profile') {
    const sampledDistance = record.profileSamples?.at(-1)?.distance;
    return `${(sampledDistance ?? segmentLength()).toFixed(2)} m`;
  }
  if (record.type === 'area') return `${calculatePolygonArea(points).toFixed(2)} m²`;
  if (record.type === 'angle' && points.length === 3) {
    const angle = calculateAngleDegrees(points[0], points[1], points[2]);
    return angle === null ? '—' : `${angle.toFixed(2)}°`;
  }
  if (record.type === 'height' && points.length >= 2) {
    const first = Cesium.Cartographic.fromCartesian(points[0]).height;
    const second = Cesium.Cartographic.fromCartesian(points[1]).height;
    return `ΔZ ${(second - first).toFixed(2)} m`;
  }
  if ((record.type === 'circle' || record.type === 'sphere') && points.length >= 2) {
    return `R ${Cesium.Cartesian3.distance(points[0], points[1]).toFixed(2)} m`;
  }
  if (record.type === 'azimuth' && points.length >= 2) {
    const geodesic = new Cesium.EllipsoidGeodesic(
      Cesium.Cartographic.fromCartesian(points[0]),
      Cesium.Cartographic.fromCartesian(points[1])
    );
    return `${((Cesium.Math.toDegrees(geodesic.startHeading) + 360) % 360).toFixed(2)}°`;
  }
  if (record.type === 'volume' && points.length >= 3) {
    const heights = points.map(point => Cesium.Cartographic.fromCartesian(point).height);
    const volume = calculatePolygonArea(points) * Math.max(0, Math.max(...heights) - Math.min(...heights));
    return `≈ ${volume.toFixed(2)} m³`;
  }
  if (record.type === 'point' && points.length > 0) {
    const cartographic = Cesium.Cartographic.fromCartesian(points[0]);
    return `${Cesium.Math.toDegrees(cartographic.longitude).toFixed(5)}, ${Cesium.Math.toDegrees(cartographic.latitude).toFixed(5)}`;
  }
  if (record.type === 'annotation') {
    const value = record.labelEntities[0]?.label?.text?.getValue(Cesium.JulianDate.now());
    return typeof value === 'string' ? value.replace(/^💬\s*/, '') : 'Ghi chú 3D';
  }
  return `${points.length} điểm`;
}
