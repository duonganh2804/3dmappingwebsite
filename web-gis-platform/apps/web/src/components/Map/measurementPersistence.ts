import * as Cesium from 'cesium';
import type { MeasurementPayload, PersistedMeasurement } from '../../services/api';
import type { MeasurementRecord, ProfileSample, ToolMode } from './measurementTypes';
import { getMeasurementTypeLabel, getMeasurementValue } from './measurementUtils';

const measurementTypes = new Set<ToolMode>([
  'point', 'distance', 'height', 'angle', 'circle', 'sphere', 'azimuth',
  'area', 'volume', 'profile', 'annotation'
]);

const readLabel = (entity?: Cesium.Entity): string | null => {
  const value = entity?.label?.text?.getValue(Cesium.JulianDate.now());
  return typeof value === 'string' ? value : null;
};

export function serializeMeasurementRecord(record: MeasurementRecord): MeasurementPayload {
  return {
    id: record.id,
    type: record.type,
    positions: record.points.map(point => ({ x: point.x, y: point.y, z: point.z })),
    value: getMeasurementValue(record),
    label: readLabel(record.summaryLabelEntity) ?? readLabel(record.labelEntities.at(-1)),
    visible: record.visible !== false,
    metadata: {
      labelTexts: record.labelEntities.map(entity => readLabel(entity)),
      profileSamples: record.profileSamples?.map(sample => ({
        distance: sample.distance,
        height: sample.height,
        position: { x: sample.position.x, y: sample.position.y, z: sample.position.z },
        source: sample.source,
      })) ?? null,
      typeLabel: getMeasurementTypeLabel(record.type),
    }
  };
}

export function deserializeMeasurement(record: PersistedMeasurement): {
  id: string;
  type: ToolMode;
  points: Cesium.Cartesian3[];
  visible: boolean;
  label: string | null;
  labelTexts: Array<string | null>;
  profileSamples?: ProfileSample[];
} | null {
  if (!measurementTypes.has(record.type as ToolMode) || !Array.isArray(record.positions)) return null;
  const points = record.positions.map(position => new Cesium.Cartesian3(position.x, position.y, position.z));
  if (points.length === 0 || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z))) return null;
  const metadata = record.metadata ?? {};
  const rawLabels = Array.isArray(metadata.labelTexts) ? metadata.labelTexts : [];
  const rawSamples = Array.isArray(metadata.profileSamples) ? metadata.profileSamples : [];
  const profileSamples = rawSamples.flatMap((sample: any): ProfileSample[] => {
    const position = sample?.position;
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) return [];
    return [{
      distance: Number(sample.distance), height: Number(sample.height),
      position: new Cesium.Cartesian3(position.x, position.y, position.z),
      source: ['scene', 'terrain', 'control'].includes(sample.source) ? sample.source : 'control'
    }];
  });
  return {
    id: record.id,
    type: record.type as ToolMode,
    points,
    visible: record.visible,
    label: record.label,
    labelTexts: rawLabels.map(value => typeof value === 'string' ? value : null),
    profileSamples: profileSamples.length > 0 ? profileSamples : undefined,
  };
}
