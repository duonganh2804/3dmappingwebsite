import * as Cesium from 'cesium';

export const isFiniteCartesian = (
  position: Cesium.Cartesian3 | null | undefined,
): position is Cesium.Cartesian3 =>
  !!position && Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z);
