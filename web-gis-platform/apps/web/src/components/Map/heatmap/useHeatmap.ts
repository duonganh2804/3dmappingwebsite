import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import * as Cesium from 'cesium';
import { HeatmapController, type HeatmapProperty } from '../heatmapController';

export function useHeatmap({
  viewerRef,
  pointCloudLoadStatus,
  projectKey,
}: {
  viewerRef: RefObject<Cesium.Viewer | null>;
  pointCloudLoadStatus: string;
  projectKey?: string;
}) {
  const controllerRef = useRef(new HeatmapController());
  const [enabled, setEnabled] = useState(false);
  const [property, setProperty] = useState<HeatmapProperty>('elevation');
  const [max, setMax] = useState(1);
  const [rangeAvailable, setRangeAvailable] = useState(false);
  const enabledRef = useRef(enabled);
  const propertyRef = useRef(property);
  enabledRef.current = enabled;
  propertyRef.current = property;

  const calculateRange = useCallback((force = false): boolean => {
    const range = controllerRef.current.autoRange(force);
    setRangeAvailable(Boolean(range));
    if (!range) {
      if (force || enabledRef.current) {
        console.error('[Heatmap] No valid project elevation range; original RGB rendering retained.');
        setEnabled(false);
      }
      return false;
    }
    const roundedMax = Math.round(range.max * 10) / 10;
    setMax(roundedMax);
    if (enabledRef.current) {
      controllerRef.current.update({ enabled: true, property: propertyRef.current, min: 0, max: roundedMax });
      viewerRef.current?.scene.requestRender();
    }
    return true;
  }, [viewerRef]);

  const onEnabledChange = useCallback((nextEnabled: boolean) => {
    if (nextEnabled && !calculateRange(true)) return;
    setEnabled(nextEnabled);
  }, [calculateRange]);

  const resetRange = useCallback(() => {
    setRangeAvailable(false);
    setMax(1);
  }, []);

  useEffect(() => {
    const applied = controllerRef.current.update({ enabled, property, min: 0, max });
    if (!applied && enabled) {
      setEnabled(false);
      setRangeAvailable(false);
    }
    const viewer = viewerRef.current;
    viewer?.scene.requestRender();
    if (!applied || !enabled) return;

    const verificationFrame = requestAnimationFrame(() => {
      controllerRef.current.ensureApplied();
      if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
    });
    return () => cancelAnimationFrame(verificationFrame);
  }, [enabled, max, property, viewerRef]);

  useEffect(() => {
    if (pointCloudLoadStatus === 'ready') calculateRange();
  }, [calculateRange, pointCloudLoadStatus, projectKey]);

  return {
    controllerRef,
    enabled,
    max,
    onEnabledChange,
    property,
    rangeAvailable,
    resetRange,
    setProperty,
  };
}
