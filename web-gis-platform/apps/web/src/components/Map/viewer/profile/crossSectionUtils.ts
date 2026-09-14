import * as Cesium from 'cesium';
import type { CrossSectionSample, MeasurementRecord, ProfileResult } from '../../measurementTypes';

export type CrossSectionSettings = { leftWidth: number; rightWidth: number; spacing: number };

export function formatChainage(distance: number): string {
  const safe = Math.max(0, distance);
  const km = Math.floor(safe / 1000);
  const metres = safe - km * 1000;
  const formatted = Number.isInteger(metres) ? metres.toFixed(0) : metres.toFixed(1);
  return `Km${km}+${formatted.padStart(3, '0')}`;
}

export function buildCrossSectionAlignment(
  profile: ProfileResult,
  pickedPosition: Cesium.Cartesian3,
  settings: CrossSectionSettings,
) {
  if (profile.samples.length < 2) return null;
  let centerIndex = 0;
  for (let index = 1; index < profile.samples.length; index++) {
    if (Cesium.Cartesian3.distance(profile.samples[index].position, pickedPosition) < Cesium.Cartesian3.distance(profile.samples[centerIndex].position, pickedPosition)) centerIndex = index;
  }
  const previous = profile.samples[Math.max(0, centerIndex - 1)].position;
  const next = profile.samples[Math.min(profile.samples.length - 1, centerIndex + 1)].position;
  const center = profile.samples[centerIndex].position;
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const inverse = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());
  const previousLocal = Cesium.Matrix4.multiplyByPoint(inverse, previous, new Cesium.Cartesian3());
  const nextLocal = Cesium.Matrix4.multiplyByPoint(inverse, next, new Cesium.Cartesian3());
  const dx = nextLocal.x - previousLocal.x;
  const dy = nextLocal.y - previousLocal.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude < Cesium.Math.EPSILON7) return null;
  const left = new Cesium.Cartesian3(-dy / magnitude, dx / magnitude, 0);
  const leftPoint = Cesium.Matrix4.multiplyByPoint(enu, Cesium.Cartesian3.multiplyByScalar(left, settings.leftWidth, new Cesium.Cartesian3()), new Cesium.Cartesian3());
  const rightPoint = Cesium.Matrix4.multiplyByPoint(enu, Cesium.Cartesian3.multiplyByScalar(left, -settings.rightWidth, new Cesium.Cartesian3()), new Cesium.Cartesian3());
  return { station: profile.samples[centerIndex].distance, center, leftPoint, rightPoint };
}

export function profileResultFromRecord(record: MeasurementRecord): ProfileResult | null {
  const samples = record.profileSamples;
  if (!samples || samples.length < 2) return null;
  const heights = samples.map(sample => sample.height);
  return {
    id: record.id, samples, totalDistance: samples.at(-1)!.distance,
    minHeight: Math.min(...heights), maxHeight: Math.max(...heights),
    elevationGain: 0, elevationLoss: 0,
    sceneSampleCount: samples.filter(sample => sample.source === 'scene').length,
    terrainSampleCount: samples.filter(sample => sample.source === 'terrain').length,
    fallbackSampleCount: samples.filter(sample => sample.source === 'control').length,
  };
}

export function replaceCrossSectionEntities(
  viewer: Cesium.Viewer,
  existing: Cesium.Entity[],
  center: Cesium.Cartesian3,
  samples: CrossSectionSample[],
): Cesium.Entity[] {
  existing.forEach(entity => { try { viewer.entities.remove(entity); } catch (_error) {} });
  const entities: Cesium.Entity[] = [];
  const add = (options: Cesium.Entity.ConstructorOptions) => {
    const entity = viewer.entities.add(options);
    entities.push(entity);
  };
  add({ polyline: { positions: samples.map(sample => sample.position), width: 4, material: Cesium.Color.fromCssColorString('#f59e0b'), depthFailMaterial: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.65) } });
  [{ position: samples[0].position, color: '#a78bfa', size: 9 }, { position: samples.at(-1)!.position, color: '#a78bfa', size: 9 }, { position: center, color: '#ffffff', size: 11 }].forEach(marker => add({ position: marker.position, point: { pixelSize: marker.size, color: Cesium.Color.fromCssColorString(marker.color), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY } }));
  return entities;
}
