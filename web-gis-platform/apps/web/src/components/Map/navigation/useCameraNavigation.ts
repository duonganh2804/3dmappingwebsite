import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as Cesium from 'cesium';
import type { ToolMode } from '../measurementTypes';
import type { ViewAngle } from '../UnifiedToolbar';
import type { CameraView, FlightPathStatus, NavigationAction, NavigationMode } from './navigationTypes';

interface UseCameraNavigationOptions {
  viewerRef: MutableRefObject<Cesium.Viewer | null>;
  projectId?: string;
  toolMode: ToolMode;
  lockView: boolean;
  viewAngle: ViewAngle;
  setViewAngle: (view: ViewAngle) => void;
  prevViewAngleRef: MutableRefObject<ViewAngle>;
  setActiveCameraView: (view: CameraView | null) => void;
  suppressPresetClearRef: MutableRefObject<boolean>;
  getPickedPosition: (position: Cesium.Cartesian2) => Cesium.Cartesian3 | null;
  getFocusBoundingSphere: () => Cesium.BoundingSphere;
  beforeInteractiveNavigation: () => void;
  clearClipping: () => void;
}

export function useCameraNavigation({
  viewerRef,
  projectId,
  toolMode,
  lockView,
  viewAngle,
  setViewAngle,
  prevViewAngleRef,
  setActiveCameraView,
  suppressPresetClearRef,
  getPickedPosition,
  getFocusBoundingSphere,
  beforeInteractiveNavigation,
  clearClipping,
}: UseCameraNavigationOptions) {
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('earth');
  const [cameraSpeed, setCameraSpeed] = useState(40);
  const cameraSpeedRef = useRef(40);
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);
  const cameraAnimationFrameRef = useRef<number | null>(null);

  const [flightPathPoints, setFlightPathPoints] = useState<Cesium.Cartesian3[]>([]);
  const [flightHeight, setFlightHeight] = useState(60);
  const flightHeightRef = useRef(60);
  const currentFlightHeightRef = useRef(60);
  const [isDrawingFlightPath, setIsDrawingFlightPath] = useState(false);
  const [flightPathStatus, setFlightPathStatus] = useState<FlightPathStatus>('idle');
  const flightPathFrameRef = useRef<number | null>(null);
  const flightPathHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const flightPathEntitiesRef = useRef<Cesium.Entity[]>([]);
  const flightPathProgressRef = useRef({ segment: 0, segmentProgress: 0, lastTime: 0 });

  const [isSelectingOrbitTarget, setIsSelectingOrbitTarget] = useState(false);
  const [isOrbitingSelectedTarget, setIsOrbitingSelectedTarget] = useState(false);
  const [hasOrbitTarget, setHasOrbitTarget] = useState(false);
  const [orbitRadius, setOrbitRadius] = useState(35);
  const orbitTargetRef = useRef<Cesium.Cartesian3 | null>(null);
  const orbitTargetEntityRef = useRef<Cesium.Entity | null>(null);
  const orbitPathEntityRef = useRef<Cesium.Entity | null>(null);
  const orbitTargetHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const orbitTargetFrameRef = useRef<number | null>(null);
  const orbitTargetMotionRef = useRef({
    heading: 0,
    pitch: Cesium.Math.toRadians(-25),
    range: 100,
    targetRange: 100,
    horizontalRadius: 35,
    targetHorizontalRadius: 35,
    lastTime: 0,
  });

  useEffect(() => {
    flightHeightRef.current = Cesium.Math.clamp(flightHeight, 5, 300);
    const viewer = viewerRef.current;
    if (orbitTargetRef.current && viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRender();
    }
  }, [flightHeight, viewerRef]);
  useEffect(() => { cameraSpeedRef.current = Cesium.Math.clamp(cameraSpeed, 5, 300); }, [cameraSpeed]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.scene.screenSpaceCameraController.zoomFactor = 5 * (cameraSpeed / 100);
  }, [cameraSpeed, viewerRef]);

  useEffect(() => {
    if (navigationMode !== 'fps' && navigationMode !== 'heli') return;
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const pressed = new Set<string>();
    let frameId = 0;
    let previousTime = performance.now();
    const isTypingTarget = (target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : document.activeElement as HTMLElement | null;
      return !!element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || toolMode !== 'none' || lockView) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        pressed.add(event.code);
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
    const clearPressed = () => pressed.clear();
    const tick = (time: number) => {
      const seconds = Math.min(0.1, (time - previousTime) / 1000);
      previousTime = time;
      const amount = Cesium.Math.clamp(cameraSpeedRef.current, 5, 300) * seconds;

      if (navigationMode === 'heli') {
        const forwardInput =
          (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0) -
          (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0);
        const rightInput =
          (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0) -
          (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0);
        const verticalInput =
          (pressed.has('KeyE') ? 1 : 0) -
          (pressed.has('KeyQ') ? 1 : 0);

        if (forwardInput || rightInput || verticalInput) {
          const camera = viewer.camera;
          const position = camera.positionWC;
          const localUp = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
            position,
            new Cesium.Cartesian3(),
          );

          // Heli W/S phải bay ngang theo hướng camera đang nhìn, không chúi
          // xuống đất khi camera đang pitch xuống.
          const forwardDotUp = Cesium.Cartesian3.dot(camera.directionWC, localUp);
          const horizontalForward = Cesium.Cartesian3.subtract(
            camera.directionWC,
            Cesium.Cartesian3.multiplyByScalar(
              localUp,
              forwardDotUp,
              new Cesium.Cartesian3(),
            ),
            new Cesium.Cartesian3(),
          );

          if (Cesium.Cartesian3.magnitudeSquared(horizontalForward) < 1e-10) {
            // Camera gần như nhìn thẳng đứng: dùng hướng up camera để suy ra
            // một hướng ngang ổn định thay vì để vector bị suy biến.
            const upDotLocal = Cesium.Cartesian3.dot(camera.upWC, localUp);
            Cesium.Cartesian3.subtract(
              camera.upWC,
              Cesium.Cartesian3.multiplyByScalar(
                localUp,
                upDotLocal,
                new Cesium.Cartesian3(),
              ),
              horizontalForward,
            );
          }

          if (Cesium.Cartesian3.magnitudeSquared(horizontalForward) >= 1e-10) {
            Cesium.Cartesian3.normalize(horizontalForward, horizontalForward);

            const horizontalRight = Cesium.Cartesian3.normalize(
              Cesium.Cartesian3.cross(
                horizontalForward,
                localUp,
                new Cesium.Cartesian3(),
              ),
              new Cesium.Cartesian3(),
            );

            const movement = new Cesium.Cartesian3();
            if (forwardInput) {
              Cesium.Cartesian3.add(
                movement,
                Cesium.Cartesian3.multiplyByScalar(
                  horizontalForward,
                  forwardInput,
                  new Cesium.Cartesian3(),
                ),
                movement,
              );
            }
            if (rightInput) {
              Cesium.Cartesian3.add(
                movement,
                Cesium.Cartesian3.multiplyByScalar(
                  horizontalRight,
                  rightInput,
                  new Cesium.Cartesian3(),
                ),
                movement,
              );
            }
            if (verticalInput) {
              Cesium.Cartesian3.add(
                movement,
                Cesium.Cartesian3.multiplyByScalar(
                  localUp,
                  verticalInput,
                  new Cesium.Cartesian3(),
                ),
                movement,
              );
            }

            if (Cesium.Cartesian3.magnitudeSquared(movement) > 0) {
              // Normalize tổ hợp phím để W+D hoặc W+E không chạy nhanh hơn
              // một phím đơn.
              Cesium.Cartesian3.normalize(movement, movement);
              const destination = Cesium.Cartesian3.add(
                position,
                Cesium.Cartesian3.multiplyByScalar(
                  movement,
                  amount,
                  new Cesium.Cartesian3(),
                ),
                new Cesium.Cartesian3(),
              );

              const direction = Cesium.Cartesian3.clone(camera.directionWC);
              const up = Cesium.Cartesian3.clone(camera.upWC);
              camera.setView({
                destination,
                orientation: { direction, up },
              });
            }
          }
        }
      } else {
        // FPS/Bay giữ behavior cũ: tiến/lùi theo đúng hướng camera.
        if (pressed.has('KeyW') || pressed.has('ArrowUp')) viewer.camera.moveForward(amount);
        if (pressed.has('KeyS') || pressed.has('ArrowDown')) viewer.camera.moveBackward(amount);
        if (pressed.has('KeyA') || pressed.has('ArrowLeft')) viewer.camera.moveLeft(amount);
        if (pressed.has('KeyD') || pressed.has('ArrowRight')) viewer.camera.moveRight(amount);
      }

      if (pressed.size) viewer.scene.requestRender();
      frameId = requestAnimationFrame(tick);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearPressed);
    document.addEventListener('visibilitychange', clearPressed);
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearPressed);
      document.removeEventListener('visibilitychange', clearPressed);
      pressed.clear();
    };
  }, [navigationMode, cameraSpeed, toolMode, lockView, viewerRef]);

  const stopCameraAnimation = () => {
    if (cameraAnimationFrameRef.current !== null) cancelAnimationFrame(cameraAnimationFrameRef.current);
    cameraAnimationFrameRef.current = null;
    setIsCameraAnimating(false);
  };

  const startCameraAnimation = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || lockView) return;
    const sphere = getFocusBoundingSphere();
    const range = Math.max(Cesium.Cartesian3.distance(viewer.camera.positionWC, sphere.center), Math.max(30, sphere.radius * 2.2));
    const pitch = Math.min(Cesium.Math.toRadians(-8), Math.max(Cesium.Math.toRadians(-75), viewer.camera.pitch));
    let heading = viewer.camera.heading;
    let previousTime = performance.now();
    setIsCameraAnimating(true);
    const tick = (time: number) => {
      const activeViewer = viewerRef.current;
      if (!activeViewer || activeViewer.isDestroyed()) return stopCameraAnimation();
      const seconds = Math.min(0.1, (time - previousTime) / 1000);
      previousTime = time;
      heading = Cesium.Math.zeroToTwoPi(heading + Cesium.Math.toRadians(5) * seconds);
      activeViewer.camera.lookAt(sphere.center, new Cesium.HeadingPitchRange(heading, pitch, range));
      activeViewer.scene.requestRender();
      cameraAnimationFrameRef.current = requestAnimationFrame(tick);
    };
    cameraAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (cameraAnimationFrameRef.current !== null) cancelAnimationFrame(cameraAnimationFrameRef.current);
    cameraAnimationFrameRef.current = null;
  }, []);

  useEffect(() => {
    if (!isCameraAnimating) return;
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const canvas = viewer.canvas;
    const stop = () => stopCameraAnimation();
    canvas.addEventListener('pointerdown', stop);
    canvas.addEventListener('wheel', stop, { passive: true });
    return () => {
      canvas.removeEventListener('pointerdown', stop);
      canvas.removeEventListener('wheel', stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraAnimating]);

  const stopFlightPath = () => {
    if (flightPathFrameRef.current !== null) cancelAnimationFrame(flightPathFrameRef.current);
    flightPathFrameRef.current = null;
    viewerRef.current?.camera.cancelFlight();
    flightPathProgressRef.current.lastTime = 0;
    setFlightPathStatus('idle');
  };

  const removeOrbitTargetMarker = () => {
    const viewer = viewerRef.current;
    const marker = orbitTargetEntityRef.current;
    orbitTargetEntityRef.current = null;
    if (viewer && !viewer.isDestroyed() && marker) {
      try { viewer.entities.remove(marker); } catch { /* viewer may be tearing down */ }
      viewer.scene.requestRender();
    }
  };

  const removeOrbitPathVisual = () => {
    const viewer = viewerRef.current;
    const path = orbitPathEntityRef.current;
    orbitPathEntityRef.current = null;
    if (viewer && !viewer.isDestroyed() && path) {
      try { viewer.entities.remove(path); } catch { /* viewer may be tearing down */ }
      viewer.scene.requestRender();
    }
  };

  const buildOrbitPathPositions = (
    target: Cesium.Cartesian3,
    horizontalRadius: number,
  ) => {
    const frame = Cesium.Transforms.eastNorthUpToFixedFrame(target);
    const safeRadius = Math.max(1, horizontalRadius);
    const positions: Cesium.Cartesian3[] = [];
    const segmentCount = 96;

    for (let index = 0; index <= segmentCount; index += 1) {
      const angle = (index / segmentCount) * Cesium.Math.TWO_PI;
      const localPoint = new Cesium.Cartesian3(
        Math.sin(angle) * safeRadius,
        Math.cos(angle) * safeRadius,
        0,
      );
      positions.push(
        Cesium.Matrix4.multiplyByPoint(
          frame,
          localPoint,
          new Cesium.Cartesian3(),
        ),
      );
    }

    return positions;
  };

  const createOrbitPathVisual = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    removeOrbitPathVisual();

    const path = viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const target = orbitTargetRef.current;
          if (!target) return [];
          const motion = orbitTargetMotionRef.current;
          return buildOrbitPathPositions(
            target,
            motion.horizontalRadius,
          );
        }, false),
        width: 4,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.98),
          glowPower: 0.18,
          taperPower: 0.7,
        }),
        depthFailMaterial: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.95),
        arcType: Cesium.ArcType.NONE,
      },
    });

    // Reuse the existing picking exclusion for flight-path visuals so clicking
    // Orbit again cannot accidentally pick the cyan route itself.
    (
      path as Cesium.Entity & {
        __flightPathVisual?: boolean;
        __orbitPathVisual?: boolean;
      }
    ).__flightPathVisual = true;
    (
      path as Cesium.Entity & {
        __flightPathVisual?: boolean;
        __orbitPathVisual?: boolean;
      }
    ).__orbitPathVisual = true;

    orbitPathEntityRef.current = path;
    viewer.scene.requestRender();
  };

  const stopSelectedOrbit = (restoreTransform = true) => {
    // Chỉ dừng camera RAF; giữ nguyên vòng bay đang hiển thị.
    // Vòng chỉ bị xóa khi chọn Orbit target mới, clear Orbit hoặc đổi project.
    if (orbitTargetFrameRef.current !== null) cancelAnimationFrame(orbitTargetFrameRef.current);
    orbitTargetFrameRef.current = null;
    orbitTargetMotionRef.current.lastTime = 0;
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.cancelFlight();
      if (restoreTransform) {
        try { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch { /* viewer may be tearing down */ }
      }
      viewer.scene.requestRender();
    }
    setIsOrbitingSelectedTarget(false);
  };

  const clearSelectedOrbitTarget = () => {
    stopSelectedOrbit();
    setIsSelectingOrbitTarget(false);
    if (orbitTargetHandlerRef.current && !orbitTargetHandlerRef.current.isDestroyed()) orbitTargetHandlerRef.current.destroy();
    orbitTargetHandlerRef.current = null;
    removeOrbitTargetMarker();
    removeOrbitPathVisual();
    orbitTargetRef.current = null;
    setHasOrbitTarget(false);
    setOrbitRadius(35);
    const motion = orbitTargetMotionRef.current;
    motion.horizontalRadius = 35;
    motion.targetHorizontalRadius = 35;
    motion.range = Math.hypot(35, flightHeightRef.current);
    motion.targetRange = motion.range;
    motion.pitch = -Math.atan2(flightHeightRef.current, 35);
  };

  const handleOrbitRadiusChange = (value: number) => {
    const radius = Cesium.Math.clamp(value, 12, 500);
    const motion = orbitTargetMotionRef.current;
    setOrbitRadius(radius);
    motion.targetHorizontalRadius = radius;

    // Preview follows the slider immediately before Start. During Orbit, the
    // existing RAF eases horizontalRadius toward this target without restarting.
    if (!isOrbitingSelectedTarget) {
      const orbitHeight = flightHeightRef.current;
      motion.horizontalRadius = radius;
      motion.range = Math.hypot(radius, orbitHeight);
      motion.targetRange = motion.range;
      motion.pitch = -Math.atan2(orbitHeight, radius);
    }
    viewerRef.current?.scene.requestRender();
  };

  const setOrbitTargetFromFocus = (sphere: Cesium.BoundingSphere) => {
    stopSelectedOrbit();
    orbitTargetRef.current = Cesium.Cartesian3.clone(sphere.center);
    setHasOrbitTarget(true);
    const radius = Cesium.Math.clamp(Math.max(12, sphere.radius * 1.5), 12, 500);
    const orbitHeight = flightHeightRef.current;
    const range = Math.hypot(radius, orbitHeight);
    orbitTargetMotionRef.current = {
      heading: orbitTargetMotionRef.current.heading,
      pitch: -Math.atan2(orbitHeight, radius),
      range,
      targetRange: range,
      horizontalRadius: radius,
      targetHorizontalRadius: radius,
      lastTime: 0,
    };
    setOrbitRadius(radius);
    if (navigationMode === 'orbit') createOrbitPathVisual();
  };

  // Chỉ chạy khi user bấm nút "Bay vòng tròn".
  // Việc click chọn target chỉ tạo marker + vòng bay preview.
  const startSelectedOrbit = (
    targetOverride?: Cesium.Cartesian3,
    rangeOverride?: number,
    pitchOverride?: number,
  ) => {
    const viewer = viewerRef.current;
    const sourceTarget = targetOverride ?? orbitTargetRef.current;
    if (!viewer || viewer.isDestroyed() || !sourceTarget || lockView) return;
    stopFlightPath();
    stopCameraAnimation();
    stopSelectedOrbit();
    const target = Cesium.Cartesian3.clone(sourceTarget);
    orbitTargetRef.current = target;
    setHasOrbitTarget(true);
    setNavigationMode('orbit');
    setActiveCameraView(null);
    const preparedMotion = orbitTargetMotionRef.current;
    const preparedHorizontalRadius = Cesium.Math.clamp(
      preparedMotion.targetHorizontalRadius ||
        Math.max(1, preparedMotion.targetRange * Math.cos(preparedMotion.pitch)),
      12,
      500,
    );
    const orbitHeight = flightHeightRef.current;
    const derivedRange = Math.hypot(preparedHorizontalRadius, orbitHeight);
    const derivedPitch = -Math.atan2(orbitHeight, preparedHorizontalRadius);
    const range = Cesium.Math.clamp(rangeOverride ?? derivedRange, 20, 20000);
    const pitch = Cesium.Math.clamp(
      pitchOverride ?? derivedPitch,
      Cesium.Math.toRadians(-80),
      Cesium.Math.toRadians(-5),
    );
    let heading = Cesium.Math.zeroToTwoPi(viewer.camera.heading);
    orbitTargetMotionRef.current = {
      heading,
      pitch,
      range,
      targetRange: range,
      horizontalRadius: preparedHorizontalRadius,
      targetHorizontalRadius: preparedHorizontalRadius,
      lastTime: 0,
    };
    createOrbitPathVisual();
    setIsOrbitingSelectedTarget(true);
    const tick = (time: number) => {
      const activeViewer = viewerRef.current;
      const activeTarget = orbitTargetRef.current;
      if (!activeViewer || activeViewer.isDestroyed() || !activeTarget) {
        orbitTargetFrameRef.current = null;
        setIsOrbitingSelectedTarget(false);
        return;
      }
      const motion = orbitTargetMotionRef.current;
      const seconds = motion.lastTime ? Math.min(0.1, (time - motion.lastTime) / 1000) : 0;
      motion.lastTime = time;

      // Radius và height là 2 tham số độc lập:
      // wheel chỉnh bán kính, slider chỉnh độ cao.
      if (seconds > 0) {
        const zoomBlend = 1 - Math.exp(-10 * seconds);
        motion.horizontalRadius = Cesium.Math.lerp(
          motion.horizontalRadius,
          motion.targetHorizontalRadius,
          zoomBlend,
        );
        if (Math.abs(motion.horizontalRadius - motion.targetHorizontalRadius) < 0.01) {
          motion.horizontalRadius = motion.targetHorizontalRadius;
        }
      }

      const orbitHeight = flightHeightRef.current;
      motion.range = Math.hypot(motion.horizontalRadius, orbitHeight);
      motion.targetRange = Math.hypot(motion.targetHorizontalRadius, orbitHeight);
      motion.pitch = Cesium.Math.clamp(
        -Math.atan2(orbitHeight, Math.max(1, motion.horizontalRadius)),
        Cesium.Math.toRadians(-80),
        Cesium.Math.toRadians(-5),
      );

      const angularSpeed = Cesium.Math.clamp(
        Cesium.Math.clamp(cameraSpeedRef.current, 5, 300) / Math.max(25, motion.range),
        Cesium.Math.toRadians(0.75),
        Cesium.Math.toRadians(12),
      );
      heading = Cesium.Math.zeroToTwoPi(heading + angularSpeed * seconds);
      motion.heading = heading;
      activeViewer.camera.lookAt(activeTarget, new Cesium.HeadingPitchRange(heading, motion.pitch, motion.range));
      activeViewer.scene.requestRender();
      orbitTargetFrameRef.current = requestAnimationFrame(tick);
    };
    const beginOrbit = () => {
      if (!orbitTargetRef.current) return;
      orbitTargetMotionRef.current.lastTime = 0;
      orbitTargetFrameRef.current = requestAnimationFrame(tick);
    };
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 0), {
      duration: 0.8,
      offset: new Cesium.HeadingPitchRange(heading, pitch, range),
      complete: beginOrbit,
      cancel: () => { orbitTargetFrameRef.current = null; setIsOrbitingSelectedTarget(false); },
    });
  };

  const startProjectOrbit = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || lockView) return;

    // Orbit mặc định của dự án:
    // - tâm = bounding sphere của project/layer đang focus
    // - bán kính = đủ rộng để thấy toàn dự án
    // - pitch thấp, oblique kiểu FPV/fly-around thay vì top-down
    const focusSphere = getFocusBoundingSphere();
    const target = Cesium.Cartesian3.clone(focusSphere.center);

    const projectRadius = Math.max(1, focusSphere.radius);
    const orbitRange = Cesium.Math.clamp(
      Math.max(80, projectRadius * 2.6),
      20,
      20000,
    );
    const fpvPitch = Cesium.Math.toRadians(-18);

    setIsSelectingOrbitTarget(false);
    if (
      orbitTargetHandlerRef.current &&
      !orbitTargetHandlerRef.current.isDestroyed()
    ) {
      orbitTargetHandlerRef.current.destroy();
    }
    orbitTargetHandlerRef.current = null;

    // Project Orbit không cần marker điểm chọn thủ công.
    removeOrbitTargetMarker();
    orbitTargetRef.current = target;
    setHasOrbitTarget(true);

    startSelectedOrbit(target, orbitRange, fpvPitch);
  };

  const beginOrbitTargetSelection = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || lockView) return;
    stopFlightPath();
    stopCameraAnimation();
    stopSelectedOrbit();

    // Bấm Orbit luôn bắt đầu một vòng mới:
    // click 1 = tâm focus, click 2 = mép vòng / bán kính.
    removeOrbitTargetMarker();
    removeOrbitPathVisual();
    orbitTargetRef.current = null;
    setHasOrbitTarget(false);

    beforeInteractiveNavigation();
    setNavigationMode('orbit');
    setActiveCameraView(null);
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableInputs = controller.enableRotate = controller.enableTranslate = true;
    controller.enableZoom = controller.enableTilt = controller.enableLook = true;
    setIsSelectingOrbitTarget(true);
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isSelectingOrbitTarget) return;
    if (orbitTargetHandlerRef.current && !orbitTargetHandlerRef.current.isDestroyed()) orbitTargetHandlerRef.current.destroy();
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    orbitTargetHandlerRef.current = handler;

    const minHorizontalRadius = 12;
    const maxHorizontalRadius = 500;
    let pendingTarget: Cesium.Cartesian3 | null = null;

    const updatePreparedRadius = (radiusPoint: Cesium.Cartesian3) => {
      if (!pendingTarget) return;

      const horizontalRadius = Cesium.Math.clamp(
        Cesium.Cartesian3.distance(pendingTarget, radiusPoint),
        minHorizontalRadius,
        maxHorizontalRadius,
      );
      const orbitHeight = flightHeightRef.current;
      const motion = orbitTargetMotionRef.current;
      motion.horizontalRadius = horizontalRadius;
      motion.targetHorizontalRadius = horizontalRadius;
      motion.range = Math.hypot(horizontalRadius, orbitHeight);
      motion.targetRange = motion.range;
      motion.pitch = -Math.atan2(orbitHeight, horizontalRadius);
      viewer.scene.requestRender();
    };

    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (!pendingTarget) return;
      const radiusPoint = getPickedPosition(movement.endPosition);
      if (!radiusPoint) return;
      updatePreparedRadius(radiusPoint);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const point = getPickedPosition(click.position);
      if (!point) return;

      // Bước 1: chọn tâm focus.
      if (!pendingTarget) {
        removeOrbitTargetMarker();
        removeOrbitPathVisual();

        const target = Cesium.Cartesian3.clone(point);
        pendingTarget = target;
        orbitTargetRef.current = target;
        setHasOrbitTarget(false);

        const marker = viewer.entities.add({
          position: target,
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString('#38bdf8'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        (marker as Cesium.Entity & { __orbitTargetVisual?: boolean }).__orbitTargetVisual = true;
        orbitTargetEntityRef.current = marker;

        // Cho user thấy vòng preview ngay sau click đầu tiên.
        const defaultHorizontalRadius = 35;
        const orbitHeight = flightHeightRef.current;
        const defaultRange = Math.hypot(defaultHorizontalRadius, orbitHeight);
        orbitTargetMotionRef.current = {
          heading: Cesium.Math.zeroToTwoPi(viewer.camera.heading),
          pitch: -Math.atan2(orbitHeight, defaultHorizontalRadius),
          range: defaultRange,
          targetRange: defaultRange,
          horizontalRadius: defaultHorizontalRadius,
          targetHorizontalRadius: defaultHorizontalRadius,
          lastTime: 0,
        };
        setOrbitRadius(defaultHorizontalRadius);
        createOrbitPathVisual();
        viewer.scene.requestRender();
        return;
      }

      // Bước 2: click mép vòng để chốt bán kính theo đúng khu vực user muốn.
      updatePreparedRadius(point);
      setOrbitRadius(orbitTargetMotionRef.current.targetHorizontalRadius);
      pendingTarget = null;
      setHasOrbitTarget(true);
      setIsSelectingOrbitTarget(false);
      setIsOrbitingSelectedTarget(false);
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    return () => {
      if (!handler.isDestroyed()) handler.destroy();
      if (orbitTargetHandlerRef.current === handler) orbitTargetHandlerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectingOrbitTarget]);

  const getFlightCameraPosition = (point: Cesium.Cartesian3, height = currentFlightHeightRef.current) => {
    const localUp = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(point, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(point, Cesium.Cartesian3.multiplyByScalar(localUp, height, new Cesium.Cartesian3()), new Cesium.Cartesian3());
  };
  const interpolateFlightSurface = (start: Cesium.Cartesian3, end: Cesium.Cartesian3, amount: number) => {
    const a = Cesium.Cartographic.fromCartesian(start);
    const b = Cesium.Cartographic.fromCartesian(end);
    let longitudeDelta = b.longitude - a.longitude;
    if (longitudeDelta > Math.PI) longitudeDelta -= Cesium.Math.TWO_PI;
    if (longitudeDelta < -Math.PI) longitudeDelta += Cesium.Math.TWO_PI;
    return Cesium.Cartesian3.fromRadians(a.longitude + longitudeDelta * amount, Cesium.Math.lerp(a.latitude, b.latitude, amount), Cesium.Math.lerp(a.height, b.height, amount));
  };

  const runFlightPath = (restart: boolean) => {
    const viewer = viewerRef.current;
    const surfaceRoute = flightPathPoints.map(point => Cesium.Cartesian3.clone(point));
    if (!viewer || viewer.isDestroyed() || surfaceRoute.length < 2 || lockView) return;
    stopCameraAnimation();
    if (flightPathFrameRef.current !== null) cancelAnimationFrame(flightPathFrameRef.current);
    viewer.camera.cancelFlight();
    if (restart) {
      flightPathProgressRef.current = { segment: 0, segmentProgress: 0, lastTime: 0 };
      currentFlightHeightRef.current = flightHeightRef.current;
    }
    setFlightPathStatus('flying');
    const tick = (time: number) => {
      const activeViewer = viewerRef.current;
      const progress = flightPathProgressRef.current;
      if (!activeViewer || activeViewer.isDestroyed() || progress.segment >= surfaceRoute.length - 1) {
        flightPathFrameRef.current = null;
        setFlightPathStatus('idle');
        return;
      }
      const deltaMs = progress.lastTime ? Math.min(100, time - progress.lastTime) : 0;
      progress.lastTime = time;
      const deltaSeconds = deltaMs / 1000;
      const surfaceStart = surfaceRoute[progress.segment];
      const surfaceEnd = surfaceRoute[progress.segment + 1];
      const segmentDistance = Math.max(0.01, Cesium.Cartesian3.distance(surfaceStart, surfaceEnd));
      progress.segmentProgress = Math.min(1, progress.segmentProgress + (Cesium.Math.clamp(cameraSpeedRef.current, 5, 300) * deltaSeconds) / segmentDistance);
      const amount = progress.segmentProgress;
      const targetHeight = Cesium.Math.clamp(flightHeightRef.current, 5, 300);
      const heightBlend = deltaSeconds > 0 ? 1 - Math.exp(-3 * deltaSeconds) : 0;
      currentFlightHeightRef.current = Cesium.Math.lerp(currentFlightHeightRef.current, targetHeight, heightBlend);
      const liveHeight = currentFlightHeightRef.current;
      const surfacePosition = interpolateFlightSurface(surfaceStart, surfaceEnd, amount);
      const position = getFlightCameraPosition(surfacePosition, liveHeight);
      const start = getFlightCameraPosition(surfaceStart, liveHeight);
      const end = getFlightCameraPosition(surfaceEnd, liveHeight);
      const nextIndex = Math.min(surfaceRoute.length - 1, progress.segment + 2);
      const segmentDirection = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(end, start, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const nextDirection = nextIndex > progress.segment + 1
        ? Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(getFlightCameraPosition(surfaceRoute[nextIndex], liveHeight), end, new Cesium.Cartesian3()), new Cesium.Cartesian3())
        : Cesium.Cartesian3.clone(segmentDirection);
      const blendProgress = Cesium.Math.clamp((amount - 0.72) / 0.28, 0, 1);
      const blend = blendProgress * blendProgress * (3 - 2 * blendProgress);
      const forward = Cesium.Cartesian3.normalize(Cesium.Cartesian3.lerp(segmentDirection, nextDirection, blend, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const localUp = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(position, new Cesium.Cartesian3());
      const direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.add(forward, Cesium.Cartesian3.multiplyByScalar(localUp, -0.18, new Cesium.Cartesian3()), new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const right = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(direction, localUp, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const cameraUp = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      activeViewer.camera.setView({ destination: position, orientation: { direction, up: cameraUp } });
      activeViewer.scene.requestRender();
      if (amount >= 1) { progress.segment += 1; progress.segmentProgress = 0; }
      flightPathFrameRef.current = requestAnimationFrame(tick);
    };
    const begin = () => { flightPathProgressRef.current.lastTime = 0; flightPathFrameRef.current = requestAnimationFrame(tick); };
    if (restart) viewer.camera.flyTo({ destination: getFlightCameraPosition(surfaceRoute[0], flightHeightRef.current), duration: 0.8, complete: begin, cancel: stopFlightPath });
    else begin();
  };

  const pauseFlightPath = () => {
    if (flightPathFrameRef.current !== null) cancelAnimationFrame(flightPathFrameRef.current);
    flightPathFrameRef.current = null;
    flightPathProgressRef.current.lastTime = 0;
    setFlightPathStatus('paused');
  };
  const clearFlightPath = () => {
    stopFlightPath();
    setIsDrawingFlightPath(false);
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      flightPathEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
      viewer.scene.requestRender();
    }
    flightPathEntitiesRef.current = [];
    setFlightPathPoints([]);
    flightPathProgressRef.current = { segment: 0, segmentProgress: 0, lastTime: 0 };
  };
  const drawFlightPath = () => {
    clearFlightPath();
    clearSelectedOrbitTarget();
    stopCameraAnimation();
    beforeInteractiveNavigation();
    clearClipping();
    setNavigationMode('fps');
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed() && !lockView) {
      const controller = viewer.scene.screenSpaceCameraController;
      controller.enableInputs = controller.enableRotate = controller.enableTranslate = true;
      controller.enableZoom = controller.enableTilt = controller.enableLook = true;
    }
    setIsDrawingFlightPath(true);
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isDrawingFlightPath) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    flightPathHandlerRef.current = handler;
    const points: Cesium.Cartesian3[] = [];
    const entities: Cesium.Entity[] = [];
    const markers: Cesium.Entity[] = [];
    let preview: Cesium.Cartesian3 | null = null;
    let finalized = false;
    let lastClick: { position: Cesium.Cartesian2; time: number } | null = null;
    const line = viewer.entities.add({ polyline: { positions: new Cesium.CallbackProperty(() => preview ? [...points, preview] : points, false), width: 2, material: Cesium.Color.fromCssColorString('#38bdf8'), depthFailMaterial: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.55) } });
    (line as Cesium.Entity & { __flightPathVisual?: boolean }).__flightPathVisual = true;
    entities.push(line);
    flightPathEntitiesRef.current.push(line);
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => { preview = getPickedPosition(movement.endPosition); viewer.scene.requestRender(); }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const time = performance.now();
      if (lastClick && time - lastClick.time < 500 && Cesium.Cartesian2.distance(lastClick.position, click.position) < 5) return;
      lastClick = { position: Cesium.Cartesian2.clone(click.position), time };
      const point = getPickedPosition(click.position);
      if (!point || (points.length && Cesium.Cartesian3.distance(points[points.length - 1], point) < 0.05)) return;
      points.push(Cesium.Cartesian3.clone(point));
      const marker = viewer.entities.add({ position: point, point: { pixelSize: 8, color: Cesium.Color.fromCssColorString('#38bdf8'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5, disableDepthTestDistance: Number.POSITIVE_INFINITY } });
      (marker as Cesium.Entity & { __flightPathVisual?: boolean }).__flightPathVisual = true;
      markers.push(marker); entities.push(marker); flightPathEntitiesRef.current.push(marker); viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(() => {
      if (points.length > 1 && Cesium.Cartesian3.distance(points[points.length - 1], points[points.length - 2]) < 0.05) {
        points.pop();
        const marker = markers.pop();
        if (marker) { viewer.entities.remove(marker); entities.splice(entities.indexOf(marker), 1); flightPathEntitiesRef.current = flightPathEntitiesRef.current.filter(entity => entity !== marker); }
      }
      if (points.length < 2) return;
      finalized = true; preview = null;
      if (line.polyline) line.polyline.positions = new Cesium.ConstantProperty(points.map(point => Cesium.Cartesian3.clone(point)));
      setFlightPathPoints(points.map(point => Cesium.Cartesian3.clone(point)));
      setIsDrawingFlightPath(false);
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    return () => {
      if (!handler.isDestroyed()) handler.destroy();
      if (flightPathHandlerRef.current === handler) flightPathHandlerRef.current = null;
      if (!finalized) {
        entities.forEach(entity => viewer.entities.remove(entity));
        const removed = new Set(entities);
        flightPathEntitiesRef.current = flightPathEntitiesRef.current.filter(entity => !removed.has(entity));
      }
      viewer.scene.requestRender();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawingFlightPath]);

  useEffect(() => {
    if (!isOrbitingSelectedTarget) return;
    const viewer = viewerRef.current;
    const canvas = viewer?.canvas;
    if (!viewer || viewer.isDestroyed() || !canvas) return;

    const DRAG_THRESHOLD_PX = 5;

    let pointerStart: {
      pointerId: number;
      x: number;
      y: number;
    } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      pointerStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerStart || event.pointerId !== pointerStart.pointerId) return;

      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;

      // A real drag hands camera control back to the user.
      // A simple click does not stop automatic Orbit.
      pointerStart = null;
      stopSelectedOrbit();
    };

    const clearPointer = (event: PointerEvent) => {
      if (!pointerStart || event.pointerId !== pointerStart.pointerId) return;
      pointerStart = null;
    };

    const onWheel = (event: WheelEvent) => {
      // While auto-Orbit is active, Cesium's native wheel zoom would fight
      // with camera.lookAt(...) in the Orbit RAF. Handle range here instead.
      event.preventDefault();
      event.stopImmediatePropagation();

      const motion = orbitTargetMotionRef.current;
      const modeScale =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? Math.max(1, canvas.clientHeight)
            : 1;

      // Wheel chỉ co/giãn bán kính nằm ngang; độ cao Orbit giữ nguyên.
      const pixelDelta = Cesium.Math.clamp(event.deltaY * modeScale, -160, 160);
      const zoomFactor = Math.exp(pixelDelta * 0.0015);

      motion.targetHorizontalRadius = Cesium.Math.clamp(
        motion.targetHorizontalRadius * zoomFactor,
        12,
        500,
      );
      setOrbitRadius(motion.targetHorizontalRadius);

      viewer.scene.requestRender();
    };

    canvas.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', clearPointer, true);
    window.addEventListener('pointercancel', clearPointer, true);
    canvas.addEventListener('wheel', onWheel, { passive: false, capture: true });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', clearPointer, true);
      window.removeEventListener('pointercancel', clearPointer, true);
      canvas.removeEventListener('wheel', onWheel, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrbitingSelectedTarget]);

  useEffect(() => {
    if (flightPathStatus !== 'flying') return;
    const canvas = viewerRef.current?.canvas;
    if (!canvas) return;
    const interrupt = () => stopFlightPath();
    canvas.addEventListener('pointerdown', interrupt);
    canvas.addEventListener('wheel', interrupt, { passive: true });
    return () => { canvas.removeEventListener('pointerdown', interrupt); canvas.removeEventListener('wheel', interrupt); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightPathStatus]);

  useEffect(() => {
    clearSelectedOrbitTarget();
    setFlightPathPoints([]); setIsDrawingFlightPath(false); setFlightPathStatus('idle');
    setFlightHeight(60); setCameraSpeed(40);
    setOrbitRadius(35);
    flightHeightRef.current = 60; currentFlightHeightRef.current = 60; cameraSpeedRef.current = 40;
    return () => {
      if (flightPathFrameRef.current !== null) cancelAnimationFrame(flightPathFrameRef.current);
      if (orbitTargetFrameRef.current !== null) cancelAnimationFrame(orbitTargetFrameRef.current);
      flightPathFrameRef.current = orbitTargetFrameRef.current = null;
      if (flightPathHandlerRef.current && !flightPathHandlerRef.current.isDestroyed()) flightPathHandlerRef.current.destroy();
      if (orbitTargetHandlerRef.current && !orbitTargetHandlerRef.current.isDestroyed()) orbitTargetHandlerRef.current.destroy();
      flightPathHandlerRef.current = orbitTargetHandlerRef.current = null;
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.cancelFlight();
        flightPathEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
      }
      flightPathEntitiesRef.current = [];
      flightPathProgressRef.current = { segment: 0, segmentProgress: 0, lastTime: 0 };
      removeOrbitTargetMarker();
      removeOrbitPathVisual();
      orbitTargetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleNavigationAction = (action: NavigationAction) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    if (action === 'compass') {
      stopFlightPath(); stopCameraAnimation(); stopSelectedOrbit(); suppressPresetClearRef.current = true;
      const target = getFocusBoundingSphere().center;
      viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 0), {
        offset: new Cesium.HeadingPitchRange(0, viewer.camera.pitch, Cesium.Cartesian3.distance(viewer.camera.positionWC, target)), duration: 0.65,
        complete: () => { suppressPresetClearRef.current = false; }, cancel: () => { suppressPresetClearRef.current = false; },
      });
      return;
    }
    if (action === 'anim') {
      stopFlightPath(); stopSelectedOrbit();
      if (toolMode !== 'none') return;
      if (cameraAnimationFrameRef.current !== null) stopCameraAnimation(); else startCameraAnimation();
      return;
    }
    if (action !== 'fps') { setIsDrawingFlightPath(false); stopFlightPath(); }
    if (action !== 'orbit') clearSelectedOrbitTarget(); else stopSelectedOrbit();
    stopCameraAnimation(); viewer.camera.cancelFlight(); setNavigationMode(action); setActiveCameraView(null);
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableInputs = controller.enableRotate = controller.enableTranslate = !lockView;
    controller.enableZoom = controller.enableTilt = controller.enableLook = !lockView;

    // Orbit: user chọn tâm trước; sau đó hiện vòng bay tròn và camera
    // tự bay theo vòng đó với góc nhìn FPV hướng vào điểm focus.
    if (action === 'orbit' && !lockView) beginOrbitTargetSelection();
  };

  const handleSetCameraView = (view: CameraView) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    stopFlightPath(); stopCameraAnimation(); stopSelectedOrbit(); viewer.camera.cancelFlight();
    setActiveCameraView(view); suppressPresetClearRef.current = true;
    const nextViewAngle: ViewAngle = view === 'T' ? 'topdown' : 'default';
    if (viewAngle !== nextViewAngle) { prevViewAngleRef.current = nextViewAngle; setViewAngle(nextViewAngle); }
    const focus = getFocusBoundingSphere();
    const sphere = new Cesium.BoundingSphere(focus.center, Math.max(10, focus.radius));
    let heading = 0; let pitch = Cesium.Math.toRadians(-30);
    if (view === 'L') { heading = Cesium.Math.toRadians(90); pitch = Cesium.Math.toRadians(-5); }
    else if (view === 'R') { heading = Cesium.Math.toRadians(270); pitch = Cesium.Math.toRadians(-5); }
    else if (view === 'F') pitch = Cesium.Math.toRadians(-5);
    else if (view === 'B') { heading = Cesium.Math.toRadians(180); pitch = Cesium.Math.toRadians(-5); }
    else if (view === 'T') pitch = Cesium.Math.toRadians(-90);
    else if (view === 'D') pitch = Cesium.Math.toRadians(85);
    viewer.camera.flyToBoundingSphere(sphere, { duration: 1.2, offset: new Cesium.HeadingPitchRange(heading, pitch, sphere.radius * 2.2), complete: () => { suppressPresetClearRef.current = false; }, cancel: () => { suppressPresetClearRef.current = false; } });
  };

  return {
    navigationMode, cameraSpeed, setCameraSpeed, isCameraAnimating,
    flightHeight, setFlightHeight, flightPathPointCount: flightPathPoints.length,
    orbitRadius, onOrbitRadiusChange: handleOrbitRadiusChange,
    isDrawingFlightPath, flightPathStatus, hasOrbitTarget, isSelectingOrbitTarget, isOrbitingSelectedTarget,
    setIsDrawingFlightPath, stopCameraAnimation, stopFlightPath, stopSelectedOrbit,
    clearSelectedOrbitTarget, beginOrbitTargetSelection, startSelectedOrbit,
    setOrbitTargetFromFocus,
    drawFlightPath, runFlightPath, pauseFlightPath, clearFlightPath,
    handleNavigationAction, handleSetCameraView,
  };
}
