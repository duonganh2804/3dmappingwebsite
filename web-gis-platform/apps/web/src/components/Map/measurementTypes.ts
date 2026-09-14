import type { Cartesian3, Entity } from 'cesium';

export type ToolMode = 'none' | 'point' | 'distance' | 'height' | 'angle' | 'circle' | 'sphere' | 'azimuth' | 'area' | 'volume' | 'cutFill' | 'profile' | 'crossSection' | 'annotation' | 'issue';
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

export interface CrossSectionSample {
  offset: number;
  elevation: number;
  position: Cartesian3;
}

export interface CrossSectionResult {
  station: number;
  leftWidth: number;
  rightWidth: number;
  spacing: number;
  samples: CrossSectionSample[];
  minElevation: number;
  maxElevation: number;
}

export type CutFillReferenceMode = 'average' | 'design' | 'min' | 'max' | 'threePointPlane';
export interface CutFillSample { position: Cartesian3; existingElevation: number; referenceElevation: number; delta: number }
export interface CutFillResult {
  polygon: Cartesian3[]; samples: CutFillSample[]; areaM2: number; referenceMode: CutFillReferenceMode;
  referenceElevation: number; gridSpacing: number; cutM3: number; fillM3: number; netM3: number;
  minElevation: number; maxElevation: number; sampledAreaM2: number; totalSampleCount: number;
  invalidSampleCount: number; validCoverage: number;
  referencePoints?: Cartesian3[];
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
