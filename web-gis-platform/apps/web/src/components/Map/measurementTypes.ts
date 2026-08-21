import type { Cartesian3, Entity } from 'cesium';

export type ToolMode = 'none' | 'point' | 'distance' | 'height' | 'angle' | 'circle' | 'sphere' | 'azimuth' | 'area' | 'volume' | 'profile' | 'annotation';
export type MeasureTarget = 'all' | 'pointcloud' | 'mesh' | 'dom';

export interface ProfileSample {
  distance: number;
  height: number;
  position: Cartesian3;
  source: 'scene' | 'terrain' | 'control';
}

export interface ProfileResult {
  id: string;
  samples: ProfileSample[];
  totalDistance: number;
  minHeight: number;
  maxHeight: number;
  elevationGain: number;
  elevationLoss: number;
  sceneSampleCount: number;
  terrainSampleCount: number;
  fallbackSampleCount: number;
}

export interface MeasurementRecord {
  id: string;
  type: ToolMode;
  points: Cartesian3[];
  pointEntities: Entity[];
  lineEntities: Entity[];
  labelEntities: Entity[];
  fillEntity?: Entity;
  summaryLabelEntity?: Entity;
  profileSamples?: ProfileSample[];
  visible?: boolean;
  isFinalized?: boolean;
}
