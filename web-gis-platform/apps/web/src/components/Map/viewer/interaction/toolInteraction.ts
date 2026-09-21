import * as Cesium from 'cesium';

export function setCameraInteractionEnabled(viewer: Cesium.Viewer, enabled: boolean) {
  if (viewer.isDestroyed()) return;
  const controller = viewer.scene.screenSpaceCameraController;
  controller.enableInputs = enabled;
  controller.enableRotate = enabled;
  controller.enableTranslate = enabled;
  controller.enableZoom = enabled;
  controller.enableTilt = enabled;
  controller.enableLook = enabled;
}

export function finishInteractiveTool(viewer: Cesium.Viewer, clearPreview: () => void) {
  clearPreview();
  setCameraInteractionEnabled(viewer, true);
  viewer.scene.canvas.style.cursor = 'default';
  viewer.scene.requestRender();
}
