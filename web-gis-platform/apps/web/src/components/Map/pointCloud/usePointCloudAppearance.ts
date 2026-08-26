import { useEffect, type RefObject } from 'react';
import * as Cesium from 'cesium';
import type { HeatmapController } from '../heatmapController';

export function usePointCloudAppearance({
  viewerRef,
  tilesetsRef,
  heatmapControllerRef,
  pointSize,
  opacity,
  pointBudget,
  minPointBudget,
  maxPointBudget,
  loadStatus,
}: {
  viewerRef: RefObject<Cesium.Viewer | null>;
  tilesetsRef: RefObject<Cesium.Cesium3DTileset[]>;
  heatmapControllerRef: RefObject<HeatmapController>;
  pointSize: number;
  opacity: number;
  pointBudget: number;
  minPointBudget: number;
  maxPointBudget: number;
  loadStatus: string;
}) {
  useEffect(() => {
    const minBudget = minPointBudget || 100_000;
    const maxBudget = maxPointBudget || 12_000_000;
    const ratio = Math.max(0.01, Math.min(1, (pointBudget - minBudget) / Math.max(1, maxBudget - minBudget)));
    const styleOptions: Record<string, unknown> = { pointSize };

    styleOptions.show = ratio < 0.98
      ? `(fract(abs(\${POSITION}[0] * 12.9898 + \${POSITION}[1] * 78.233 + \${POSITION}[2] * 45.164))) <= ${ratio.toFixed(4)}`
      : true;
    styleOptions.color = `\${COLOR} * color('white', ${opacity.toFixed(2)})`;

    const style = new Cesium.Cesium3DTileStyle(styleOptions);
    heatmapControllerRef.current.setTargets(tilesetsRef.current);
    heatmapControllerRef.current.setBaseStyle(style, opacity);

    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
  }, [
    heatmapControllerRef,
    loadStatus,
    maxPointBudget,
    minPointBudget,
    opacity,
    pointBudget,
    pointSize,
    tilesetsRef,
    viewerRef,
  ]);
}
