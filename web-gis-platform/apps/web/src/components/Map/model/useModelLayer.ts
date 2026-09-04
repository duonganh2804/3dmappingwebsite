import { useRef, useState, type RefObject } from 'react';
import * as Cesium from 'cesium';

type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

type ModelProject = {
  id: string;
  centerLon: number;
  centerLat: number;
  modelUrl?: string;
  calibration?: string;
};

type ModelOffsets = {
  modelLon: number;
  modelLat: number;
  modelHeight: number;
  modelHeading: number;
  modelPitch: number;
  modelRoll: number;
};

type LoadModelArgs = {
  project: ModelProject;
  longitude: number;
  latitude: number;
  isCurrent: () => boolean;
  show: () => boolean;
  opacity: () => number;
  onBoundingSphere: (bounds: Cesium.BoundingSphere) => void;
};

export function useModelLayer({
  viewerRef,
}: {
  viewerRef: RefObject<Cesium.Viewer | null>;
}) {
  const modelRef = useRef<Cesium.Model | null>(null);
  const modelLoadGenerationRef = useRef(0);
  const retryModelRef = useRef<() => void>(() => undefined);
  const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus>('idle');
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const resetModelLoadState = (project: ModelProject) => {
    modelLoadGenerationRef.current += 1;
    setModelLoadStatus(project.modelUrl ? 'idle' : 'unavailable');
    setModelLoadError(null);
  };

  const removeModel = (viewer: Cesium.Viewer) => {
    if (modelRef.current && !viewer.isDestroyed() && !modelRef.current.isDestroyed()) {
      viewer.scene.primitives.remove(modelRef.current);
      modelRef.current = null;
    }
  };

  const releaseModelRef = () => {
    modelRef.current = null;
  };

  const invalidateModelLoad = () => {
    modelLoadGenerationRef.current += 1;
  };

  const loadModel = async (args: LoadModelArgs) => {
    retryModelRef.current = () => { void loadModel(args); };
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const generation = ++modelLoadGenerationRef.current;
    const isActive = () => args.isCurrent() && generation === modelLoadGenerationRef.current && !viewer.isDestroyed();
    const { project, longitude, latitude } = args;
    try {
      const modelUrl = project.modelUrl;
      if (!modelUrl) {
        if (isActive()) setModelLoadStatus('unavailable');
        console.log("Dự án này không có mô hình 3D Mesh.");
        return;
      }

      setModelLoadStatus('loading');
      setModelLoadError(null);
      if (modelRef.current && !modelRef.current.isDestroyed()) {
        viewer.scene.primitives.remove(modelRef.current);
        modelRef.current = null;
      }

      let initLon = 0;
      let initLat = 0;
      let initHeight = 0.3;
      let initHeading = 0;
      let initPitch = 0;
      let initRoll = 0;

      if (project.calibration) {
        try {
          const parsed = JSON.parse(project.calibration);
          initLon = parsed.modelLon ?? 0;
          initLat = parsed.modelLat ?? 0;
          initHeight = parsed.modelHeight ?? 0.3;
          initHeading = parsed.modelHeading ?? 0;
          initPitch = parsed.modelPitch ?? 0;
          initRoll = parsed.modelRoll ?? 0;
        } catch (e) {
          console.error("Lỗi parse calibration trong loadOfflineModel:", e);
        }
      } else {
        const saved = localStorage.getItem(`calibration_${project.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            initLon = parsed.modelLon ?? 0;
            initLat = parsed.modelLat ?? 0;
            initHeight = parsed.modelHeight ?? 0.3;
            initHeading = parsed.modelHeading ?? 0;
            initPitch = parsed.modelPitch ?? 0;
            initRoll = parsed.modelRoll ?? 0;
          } catch (e) { }
        }
      }

      const position = Cesium.Cartesian3.fromDegrees(
        longitude + initLon,
        latitude + initLat,
        initHeight
      );
      const heading = Cesium.Math.toRadians(initHeading);
      const pitch = Cesium.Math.toRadians(initPitch);
      const roll = Cesium.Math.toRadians(initRoll);
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      const modelMatrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(orientation),
        position
      );

      console.log("Nạp 3D model từ:", modelUrl);

      // Model là một trong hai layer startup chính (Model + DOM), vì vậy cho phép
      // Cesium tự retry các lỗi mạng tạm thời (5xx/429/timeout/network). Không retry
      // 4xx cố định như 404 để tránh tải lặp vô ích khi URL asset thực sự sai.
      const modelResource = new Cesium.Resource({
        url: modelUrl,
        retryAttempts: 2,
        retryCallback: (_resource, requestError) => {
          const statusCode = (requestError as { statusCode?: number } | undefined)?.statusCode;
          return statusCode == null || statusCode === 0 || statusCode === 408 || statusCode === 429 || statusCode >= 500;
        },
      });

      // Giữ options tối thiểu/stable cho GLB. Các option mặc định của Cesium 1.143
      // đã là asynchronous + incrementallyLoadTextures + clampAnimations; không cần
      // ép releaseGltfJson trong startup path. Điều này giảm biến số khi asset GLB
      // có extension/texture đặc thù.
      const model = await Cesium.Model.fromGltfAsync({
        url: modelResource,
        modelMatrix,
        scale: 1.0,
        incrementallyLoadTextures: true,
      });

      if (!isActive()) {
        if (!model.isDestroyed()) model.destroy();
        return;
      }
      viewer.scene.primitives.add(model);
      modelRef.current = model;
      model.show = args.show();
      model.color = Cesium.Color.WHITE.withAlpha(args.opacity());

      // From this point the GLB itself is successfully created and attached.
      // Mark it ready BEFORE camera/startup coordination so a secondary error
      // cannot poison modelLoadStatus and hide an otherwise valid primitive.
      setModelLoadStatus('ready');
      setModelLoadError(null);

      try {
        args.onBoundingSphere(model.boundingSphere);
        // Startup coordinator decides when Model + DOM together are ready.
        // Do not independently unlock the intro from this loader.
        viewer.scene.requestRender();
      } catch (postLoadError) {
        console.warn('[Model] GLB loaded, but post-load startup coordination failed:', postLoadError);
      }
    } catch (error) {
      if (isActive()) {
        // If the primitive already exists, the GLB load succeeded. Keep the
        // layer usable and report only a warning instead of a false load error.
        const attachedModel = modelRef.current;
        if (attachedModel && !attachedModel.isDestroyed()) {
          setModelLoadStatus('ready');
          setModelLoadError(null);
          console.warn('[Model] Ignoring post-attach error because the model is already usable:', error);
          return;
        }
        const statusCode = (error as { statusCode?: number } | undefined)?.statusCode;
        const message = error instanceof Error ? error.message : String(error);
        setModelLoadStatus('error');
        setModelLoadError(
          statusCode
            ? `Tải Model thất bại (HTTP ${statusCode})`
            : 'Tải Model thất bại'
        );
        console.error("Lỗi khi load mô hình 3D:", {
          projectId: project.id,
          modelUrl: project.modelUrl,
          statusCode,
          message,
          error,
        });
      }
    }
  };

  const applyModelCalibration = (project: ModelProject | null, offsets: ModelOffsets) => {
    if (!modelRef.current || !project) return;
    const baseLon = project.centerLon || 106.8099;
    const baseLat = project.centerLat || 10.8404;
    let lon = baseLon;
    let lat = baseLat;
    if (lon < 90 && lat > 90) {
      lon = baseLat;
      lat = baseLon;
    }

    const finalLon = lon + offsets.modelLon;
    const finalLat = lat + offsets.modelLat;

    const position = Cesium.Cartesian3.fromDegrees(finalLon, finalLat, offsets.modelHeight);
    const heading = Cesium.Math.toRadians(offsets.modelHeading || 0);
    const pitch = Cesium.Math.toRadians(offsets.modelPitch || 0);
    const roll = Cesium.Math.toRadians(offsets.modelRoll || 0);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    modelRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromQuaternion(orientation),
      position
    );
  };

  const setModelVisibility = (show: boolean) => {
    if (modelRef.current && !modelRef.current.isDestroyed()) modelRef.current.show = show;
  };

  const applyModelOpacity = (opacity: number) => {
    if (modelRef.current && !modelRef.current.isDestroyed()) {
      modelRef.current.color = Cesium.Color.WHITE.withAlpha(opacity);
    }
  };

  return {
    applyModelCalibration,
    applyModelOpacity,
    invalidateModelLoad,
    loadModel,
    modelLoadError,
    modelLoadStatus,
    modelRef,
    releaseModelRef,
    removeModel,
    resetModelLoadState,
    retryModel: () => retryModelRef.current(),
    setModelVisibility,
  };
}
