import * as Cesium from 'cesium';
import type { MeasurementRecord, ToolMode } from './measurementTypes';

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
