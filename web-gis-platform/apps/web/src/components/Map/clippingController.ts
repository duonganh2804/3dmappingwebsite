/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
import * as Cesium from 'cesium';

export type ClipTool = 'box' | 'polygon' | 'plane';
export type ClipMode = 'none' | 'highlight' | 'inside' | 'outside';
export type ClipFilter = 'any' | 'all';

type ClipTarget = Cesium.Cesium3DTileset | Cesium.Model;
type Axis = 'x' | 'y' | 'z';
type HandleKind = 'move' | 'resize-x' | 'resize-y' | 'resize-z' | 'rotate-z' | 'plane-move' | 'polygon-vertex';

interface HandleMetadata {
  kind: HandleKind;
  axis?: Axis;
  direction?: -1 | 1;
  vertexIndex?: number;
  role?: 'visual' | 'hit-target' | 'face';
}

interface BoxState {
  tool: 'box';
  center: Cesium.Cartesian3;
  dimensions: Cesium.Cartesian3;
  heading: number;
}

interface PlaneState {
  tool: 'plane';
  center: Cesium.Cartesian3;
  size: number;
  heading: number;
}

interface PolygonState {
  tool: 'polygon';
  points: Cesium.Cartesian3[];
  closed: boolean;
}

type ShapeState = BoxState | PlaneState | PolygonState;

const COLOR = Cesium.Color.fromCssColorString('#facc15');
const SELECTED_COLOR = Cesium.Color.fromCssColorString('#fde047');
const HANDLE_COLOR = Cesium.Color.fromCssColorString('#f8fafc');
const AXIS_COLORS: Record<Axis, Cesium.Color> = {
  x: Cesium.Color.fromCssColorString('#ef4444'),
  y: Cesium.Color.fromCssColorString('#22c55e'),
  z: Cesium.Color.fromCssColorString('#3b82f6'),
};
const MOVE_HANDLE_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M9 1 12 6 17 9 12 12 9 17 6 12 1 9 6 6Z" fill="white" stroke="#0e7490" stroke-width="1.5"/></svg>',
)}`;

export class ClippingController {
  private readonly viewer: Cesium.Viewer;
  private readonly getTargets: () => ClipTarget[];
  private readonly onToolChange: (tool: ClipTool | null) => void;
  private readonly onMessage: (message: string | null) => void;
  private handler: Cesium.ScreenSpaceEventHandler;
  private collections = new Map<ClipTarget, Cesium.ClippingPlaneCollection>();
  private entities: Cesium.Entity[] = [];
  private handles: Cesium.Entity[] = [];
  private shape: ShapeState | null = null;
  private selected = false;
  private mode: ClipMode = 'highlight';
  private filter: ClipFilter = 'any';
  private previewPosition: Cesium.Cartesian3 | null = null;
  private hoveredHandle: Cesium.Entity | null = null;
  private hoveredKey: string | null = null;
  private drag: { metadata: HandleMetadata; start: Cesium.Cartesian2; startShape: ShapeState } | null = null;
  private cameraState: Record<string, boolean> | null = null;
  private readonly finishDragOnWindowExit = () => this.finishDrag();

  constructor(
    viewer: Cesium.Viewer,
    getTargets: () => ClipTarget[],
    onToolChange: (tool: ClipTool | null) => void,
    onMessage: (message: string | null) => void,
  ) {
    this.viewer = viewer;
    this.getTargets = getTargets;
    this.onToolChange = onToolChange;
    this.onMessage = onMessage;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.installEvents();
    window.addEventListener('pointerup', this.finishDragOnWindowExit);
    window.addEventListener('blur', this.finishDragOnWindowExit);
  }

  activate(tool: ClipTool, mode: ClipMode, filter: ClipFilter) {
    this.clear();
    this.mode = mode;
    this.filter = filter;
    const sphere = this.getBoundingSphere();
    if (!sphere) {
      this.onMessage('Không có Point Cloud hoặc 3D Model để cắt.');
      return;
    }
    const center = Cesium.Cartesian3.clone(sphere.center);
    const size = Math.max(1, sphere.radius * 1.1);
    if (tool === 'box') {
      this.shape = { tool, center, dimensions: new Cesium.Cartesian3(size, size, size), heading: 0 };
      this.selected = true;
      this.createVisuals();
      this.rebuildCollections();
    } else if (tool === 'plane') {
      this.shape = { tool, center, size: size * 1.25, heading: 0 };
      this.selected = true;
      this.createVisuals();
      this.rebuildCollections();
    } else {
      this.shape = { tool, points: [], closed: false };
      this.selected = true;
      this.createVisuals();
      this.onMessage('Click vertex · Double-click để đóng đa giác (chỉ hỗ trợ polygon lồi).');
    }
    this.onToolChange(tool);
    this.viewer.scene.requestRender();
  }

  updateSettings(mode: ClipMode, filter: ClipFilter) {
    this.mode = mode;
    this.filter = filter;
    if (this.shape && (this.shape.tool !== 'polygon' || this.shape.closed)) this.rebuildCollections();
    this.updateAppearance();
    this.viewer.scene.requestRender();
  }

  clear() {
    this.finishDrag();
    this.detachCollections();
    this.entities.forEach(entity => this.viewer.entities.remove(entity));
    this.entities = [];
    this.handles = [];
    this.shape = null;
    this.selected = false;
    this.previewPosition = null;
    this.hoveredHandle = null;
    this.hoveredKey = null;
    this.onMessage(null);
    this.onToolChange(null);
    this.viewer.scene.canvas.style.cursor = '';
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.clear();
    window.removeEventListener('pointerup', this.finishDragOnWindowExit);
    window.removeEventListener('blur', this.finishDragOnWindowExit);
    if (!this.handler.isDestroyed()) this.handler.destroy();
  }

  private getBoundingSphere() {
    const targets = this.getTargets();
    return targets.map(target => target.boundingSphere).find(Boolean);
  }

  private installEvents() {
    this.handler.setInputAction((event: { position: Cesium.Cartesian2 }) => this.onLeftClick(event.position), Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.setInputAction((event: { position: Cesium.Cartesian2 }) => this.onDoubleClick(event.position), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    this.handler.setInputAction((event: { position: Cesium.Cartesian2 }) => this.onLeftDown(event.position, false), Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.setInputAction((event: { position: Cesium.Cartesian2 }) => this.onLeftDown(event.position, true), Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
    this.handler.setInputAction((event: { endPosition: Cesium.Cartesian2 }) => this.onMouseMove(event.endPosition), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.setInputAction(() => this.finishDrag(), Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  private onLeftClick(position: Cesium.Cartesian2) {
    if (!this.shape) return;
    const picked = this.viewer.scene.pick(position) as { id?: Cesium.Entity } | undefined;
    const entity = picked?.id;
    if (this.shape.tool === 'polygon' && !this.shape.closed) {
      const point = this.pickWorld(position);
      if (point) {
        this.shape.points.push(point);
        this.previewPosition = point;
        this.refreshVisuals();
      }
      return;
    }
    this.selected = !!entity && this.entities.includes(entity);
    this.refreshHandles();
  }

  private onDoubleClick(position: Cesium.Cartesian2) {
    if (!this.shape || this.shape.tool !== 'polygon' || this.shape.closed) return;
    // LEFT_CLICK normally fires before LEFT_DOUBLE_CLICK. Remove a duplicate last point.
    if (this.shape.points.length > 1) {
      const a = this.shape.points[this.shape.points.length - 1];
      const b = this.shape.points[this.shape.points.length - 2];
      if (Cesium.Cartesian3.distance(a, b) < 0.01) this.shape.points.pop();
    }
    if (this.shape.points.length < 3) {
      this.onMessage('Polygon cần ít nhất 3 vertex.');
      return;
    }
    if (!this.isConvex(this.shape.points)) {
      const message = 'Polygon clipping currently supports convex polygons.';
      console.warn(message);
      this.onMessage(message);
      return;
    }
    this.shape.closed = true;
    this.previewPosition = null;
    this.onMessage('Shift+drag vertex để chỉnh polygon.');
    this.refreshVisuals();
    this.rebuildCollections();
    this.viewer.scene.requestRender();
  }

  private onLeftDown(position: Cesium.Cartesian2, shiftPressed: boolean) {
    if (!this.shape || !this.selected) return;
    const picked = this.pickHandle(position);
    const metadata = picked?.metadata;
    if (!metadata) return;
    if (metadata.kind === 'polygon-vertex' && !shiftPressed) return;
    this.drag = { metadata, start: Cesium.Cartesian2.clone(position), startShape: this.cloneShape(this.shape) };
    try {
      this.lockCamera();
      this.viewer.scene.canvas.style.cursor = 'grabbing';
    } catch (error) {
      console.error('Could not start clipping gizmo drag.', error);
      this.finishDrag();
    }
  }

  private onMouseMove(position: Cesium.Cartesian2) {
    if (!this.shape) return;
    if (this.drag) {
      try {
        this.updateDrag(position);
      } catch (error) {
        console.error('Clipping gizmo drag failed.', error);
        this.finishDrag();
      }
      return;
    }
    if (this.shape.tool === 'polygon' && !this.shape.closed) {
      this.previewPosition = this.pickWorld(position);
      this.viewer.scene.requestRender();
    }
    const picked = this.selected ? this.pickHandle(position) : null;
    const next = picked?.entity ?? null;
    const nextKey = picked ? this.handleKey(picked.metadata) : null;
    if (nextKey !== this.hoveredKey) {
      this.hoveredHandle = next;
      this.hoveredKey = nextKey;
      this.updateHandleHighlights();
      this.viewer.scene.canvas.style.cursor = picked ? this.cursorFor(picked.metadata) : '';
      this.viewer.scene.requestRender();
    }
  }

  private updateDrag(position: Cesium.Cartesian2) {
    if (!this.drag || !this.shape) return;
    const dx = position.x - this.drag.start.x;
    const dy = position.y - this.drag.start.y;
    const scale = this.metersPerPixel(this.getShapeCenter(this.drag.startShape));
    const start = this.drag.startShape;
    const metadata = this.drag.metadata;

    if (start.tool === 'box' && this.shape.tool === 'box') {
      if (metadata.kind === 'move') {
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(start.center);
        const east = Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(dx * scale, 0, 0), new Cesium.Cartesian3());
        const north = Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(0, -dy * scale, 0), new Cesium.Cartesian3());
        this.shape.center = Cesium.Cartesian3.add(start.center, Cesium.Cartesian3.add(east, north, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      } else if (metadata.axis && metadata.direction && metadata.kind.startsWith('resize-')) {
        const axis = this.boxWorldAxis(start, metadata.axis);
        const faceDistance = this.dragDistanceAlongAxis(this.drag.start, position, start, metadata.axis);
        const oldSize = start.dimensions[metadata.axis];
        const newSize = Math.max(0.5, oldSize + metadata.direction * faceDistance);
        const effectiveFaceDistance = metadata.direction * (newSize - oldSize);
        this.shape.dimensions[metadata.axis] = newSize;
        this.shape.center = Cesium.Cartesian3.add(
          start.center,
          Cesium.Cartesian3.multiplyByScalar(axis, effectiveFaceDistance / 2, new Cesium.Cartesian3()),
          new Cesium.Cartesian3(),
        );
      } else if (metadata.kind === 'rotate-z') {
        this.shape.heading = start.heading + dx * 0.01;
      }
    } else if (start.tool === 'plane' && this.shape.tool === 'plane' && metadata.kind === 'plane-move') {
      const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(start.center, new Cesium.Cartesian3());
      this.shape.center = Cesium.Cartesian3.add(start.center, Cesium.Cartesian3.multiplyByScalar(up, -dy * scale, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    } else if (start.tool === 'polygon' && this.shape.tool === 'polygon' && metadata.kind === 'polygon-vertex' && metadata.vertexIndex !== undefined) {
      const point = this.pickWorld(position);
      if (point) {
        const candidate = start.points.map(point => Cesium.Cartesian3.clone(point));
        candidate[metadata.vertexIndex] = point;
        if (this.isConvex(candidate)) {
          this.shape.points = candidate;
          this.onMessage('Shift+drag vertex để chỉnh polygon.');
        } else {
          const message = 'Polygon clipping currently supports convex polygons.';
          console.warn(message);
          this.onMessage(message);
        }
      }
    }
    this.rebuildCollections();
    this.viewer.scene.requestRender();
  }

  private finishDrag() {
    this.drag = null;
    this.restoreCamera();
    if (!this.viewer.isDestroyed()) {
      const metadata = this.hoveredHandle && (this.hoveredHandle as any).__clipHandle as HandleMetadata | undefined;
      this.viewer.scene.canvas.style.cursor = metadata ? this.cursorFor(metadata) : '';
    }
  }

  private lockCamera() {
    const c = this.viewer.scene.screenSpaceCameraController;
    this.cameraState = {
      enableInputs: c.enableInputs, enableRotate: c.enableRotate, enableTranslate: c.enableTranslate,
      enableZoom: c.enableZoom, enableTilt: c.enableTilt, enableLook: c.enableLook,
    };
    c.enableInputs = c.enableRotate = c.enableTranslate = c.enableZoom = c.enableTilt = c.enableLook = false;
  }

  private restoreCamera() {
    if (!this.cameraState) return;
    if (!this.viewer.isDestroyed()) Object.assign(this.viewer.scene.screenSpaceCameraController, this.cameraState);
    this.cameraState = null;
  }

  private createVisuals() {
    if (!this.shape) return;
    if (this.shape.tool === 'box') {
      const box = this.viewer.entities.add({
        position: new Cesium.CallbackPositionProperty(() => this.shape && this.shape.tool === 'box' ? this.shape.center : undefined, false),
        orientation: new Cesium.CallbackProperty(() => this.shape && this.shape.tool === 'box' ? this.orientation(this.shape.center, this.shape.heading) : Cesium.Quaternion.IDENTITY, false),
        box: {
          dimensions: new Cesium.CallbackProperty(() => this.shape && this.shape.tool === 'box' ? this.shape.dimensions : Cesium.Cartesian3.ZERO, false),
          material: COLOR.withAlpha(0.07), outline: true, outlineColor: COLOR,
        },
      });
      (box as any).__clipBody = true;
      this.entities.push(box);
    } else if (this.shape.tool === 'plane') {
      const plane = this.viewer.entities.add({
        position: new Cesium.CallbackPositionProperty(() => this.shape && this.shape.tool === 'plane' ? this.shape.center : undefined, false),
        orientation: new Cesium.CallbackProperty(() => this.shape && this.shape.tool === 'plane' ? this.orientation(this.shape.center, this.shape.heading) : Cesium.Quaternion.IDENTITY, false),
        plane: {
          plane: new Cesium.Plane(Cesium.Cartesian3.UNIT_Z, 0),
          dimensions: new Cesium.CallbackProperty(() => this.shape && this.shape.tool === 'plane' ? new Cesium.Cartesian2(this.shape.size, this.shape.size) : Cesium.Cartesian2.ZERO, false),
          material: COLOR.withAlpha(0.18), outline: true, outlineColor: COLOR,
        },
      });
      (plane as any).__clipBody = true;
      this.entities.push(plane);
    } else {
      const polygon = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            if (!this.shape || this.shape.tool !== 'polygon') return [];
            const points = [...this.shape.points];
            if (this.shape.closed && points.length) points.push(points[0]);
            else if (this.previewPosition) points.push(this.previewPosition);
            return points;
          }, false),
          width: 2, material: COLOR, clampToGround: false,
        },
      });
      (polygon as any).__clipBody = true;
      this.entities.push(polygon);
    }
    this.refreshHandles();
  }

  private refreshVisuals() {
    this.refreshHandles();
    this.viewer.scene.requestRender();
  }

  private refreshHandles() {
    this.hoveredHandle = null;
    this.hoveredKey = null;
    this.handles.forEach(entity => this.viewer.entities.remove(entity));
    this.entities = this.entities.filter(entity => !this.handles.includes(entity));
    this.handles = [];
    if (!this.shape || !this.selected) return;
    if (this.shape.tool === 'box') {
      this.addMoveHandle();
      (['x', 'y', 'z'] as Axis[]).forEach(axis => {
        this.addResizeFace(axis, -1);
        this.addResizeFace(axis, 1);
        this.addResizeHandle(axis, -1);
        this.addResizeHandle(axis, 1);
      });
      this.addRotateRing();
    } else if (this.shape.tool === 'plane') {
      this.addHandle('plane-move', () => this.shape && this.shape.tool === 'plane' ? this.shape.center : undefined, 10, COLOR);
    } else if (this.shape.closed) {
      this.shape.points.forEach((_point, index) => this.addHandle('polygon-vertex', () => this.shape && this.shape.tool === 'polygon' ? this.shape.points[index] : undefined, 9, HANDLE_COLOR, index));
    }
  }

  private addHandle(kind: HandleKind, position: () => Cesium.Cartesian3 | undefined, size: number, color = HANDLE_COLOR, vertexIndex?: number) {
    const entity = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(position, false),
      point: { pixelSize: size, color, outlineColor: Cesium.Color.BLACK.withAlpha(0.8), outlineWidth: 1.5, disableDepthTestDistance: Number.POSITIVE_INFINITY },
    });
    this.registerHandle(entity, { kind, vertexIndex }, color);
  }

  private setHandleColor(entity: Cesium.Entity | null, color: Cesium.Color) {
    if (!entity) return;
    const metadata = (entity as any).__clipHandle as HandleMetadata | undefined;
    const baseColor = (entity as any).__clipBaseColor as Cesium.Color | undefined;
    const nextColor = color === HANDLE_COLOR ? (baseColor ?? color) : Cesium.Color.lerp(baseColor ?? color, Cesium.Color.WHITE, 0.35, new Cesium.Color());

    // Invisible hit targets only enlarge the pick area; never show them on hover.
    if (metadata?.role === 'hit-target' && entity.point) {
      entity.point.color = new Cesium.ConstantProperty(Cesium.Color.WHITE.withAlpha(0.01));
    } else if (entity.point) {
      entity.point.color = new Cesium.ConstantProperty(nextColor);
    }

    if (entity.billboard) entity.billboard.color = new Cesium.ConstantProperty(nextColor);
    if (entity.polyline && metadata) {
      const isHitTarget = metadata.role === 'hit-target';
      entity.polyline.width = new Cesium.ConstantProperty(isHitTarget ? (metadata.kind === 'rotate-z' ? 22 : 28) : color === HANDLE_COLOR ? (metadata.kind === 'rotate-z' ? 3 : 5) : (metadata.kind === 'rotate-z' ? 4 : 7));
      entity.polyline.material = metadata.kind === 'rotate-z'
        ? new Cesium.ColorMaterialProperty(isHitTarget ? Cesium.Color.WHITE.withAlpha(0.01) : nextColor)
        : new Cesium.PolylineArrowMaterialProperty(isHitTarget ? Cesium.Color.WHITE.withAlpha(0.01) : nextColor);
    }
    if (entity.plane && metadata) {
      const faceColor = AXIS_COLORS[metadata.axis ?? 'z'];
      entity.plane.material = new Cesium.ColorMaterialProperty(
        color === HANDLE_COLOR ? faceColor.withAlpha(0.008) : faceColor.withAlpha(0.14),
      );
    }
  }

  private updateHandleHighlights() {
    for (const entity of this.handles) {
      const metadata = (entity as any).__clipHandle as HandleMetadata;
      this.setHandleColor(entity, this.handleKey(metadata) === this.hoveredKey ? SELECTED_COLOR : HANDLE_COLOR);
    }
  }

  private addMoveHandle() {
    const color = Cesium.Color.fromCssColorString('#67e8f9');
    const position = new Cesium.CallbackPositionProperty(
      () => this.shape && this.shape.tool === 'box' ? this.shape.center : undefined,
      false,
    );

    const entity = this.viewer.entities.add({
      position,
      billboard: {
        image: MOVE_HANDLE_IMAGE,
        width: 15,
        height: 15,
        color,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    this.registerHandle(entity, { kind: 'move', role: 'visual' }, color);

    // Larger invisible pick target so the center move handle wins over a resize
    // face underneath it without making the visible gizmo larger.
    const hitTarget = this.viewer.entities.add({
      position,
      point: {
        pixelSize: 30,
        color: Cesium.Color.WHITE.withAlpha(0.01),
        outlineWidth: 0,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    this.registerHandle(hitTarget, { kind: 'move', role: 'hit-target' }, color);
  }

  private addResizeHandle(axis: Axis, direction: -1 | 1) {
    const color = AXIS_COLORS[axis];
    const positions = new Cesium.CallbackProperty(() => {
      if (!this.shape || this.shape.tool !== 'box') return [];
      const faceDistance = this.shape.dimensions[axis] * direction / 2;
      const gizmoSize = this.gizmoWorldSize(this.shape.center);
      let startDistance = faceDistance;
      let endDistance = faceDistance + direction * gizmoSize * 0.32;

      if (axis === 'z') {
        const faceCenter = this.boxLocalPoint(0, 0, faceDistance);
        if (!faceCenter) return [];
        const metersPerPixel = this.metersPerPixel(faceCenter);
        const faceSize = Math.min(this.shape.dimensions.x, this.shape.dimensions.y);
        const maxOffset = Math.max(0.5, faceSize * 0.12);
        const arrowStartOffset = Cesium.Math.clamp(metersPerPixel * 24, 0.3, maxOffset * 0.72);
        const arrowEndOffset = Cesium.Math.clamp(metersPerPixel * 34, arrowStartOffset + 0.12, maxOffset);
        startDistance = faceDistance + direction * arrowStartOffset;
        endDistance = faceDistance + direction * arrowEndOffset;
      }

      const start = this.boxLocalPoint(axis === 'x' ? startDistance : 0, axis === 'y' ? startDistance : 0, axis === 'z' ? startDistance : 0);
      const end = this.boxLocalPoint(axis === 'x' ? endDistance : 0, axis === 'y' ? endDistance : 0, axis === 'z' ? endDistance : 0);
      return start && end ? [start, end] : [];
    }, false);
    const entity = this.viewer.entities.add({
      polyline: {
        positions,
        width: 5,
        material: new Cesium.PolylineArrowMaterialProperty(color),
        depthFailMaterial: new Cesium.PolylineArrowMaterialProperty(color.withAlpha(0.55)),
        clampToGround: false,
      },
    });
    this.registerHandle(entity, { kind: `resize-${axis}`, axis, direction, role: 'visual' }, color);
    const hitTarget = this.viewer.entities.add({
      polyline: {
        positions,
        width: 28,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.01)),
        depthFailMaterial: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.01)),
        clampToGround: false,
      },
    });
    this.registerHandle(hitTarget, { kind: `resize-${axis}`, axis, direction, role: 'hit-target' }, color);
  }

  private addResizeFace(axis: Axis, direction: -1 | 1) {
    const entity = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => {
        if (!this.shape || this.shape.tool !== 'box') return undefined;
        const distance = this.shape.dimensions[axis] * direction / 2;
        return this.boxLocalPoint(axis === 'x' ? distance : 0, axis === 'y' ? distance : 0, axis === 'z' ? distance : 0);
      }, false),
      orientation: new Cesium.CallbackProperty(() => this.faceOrientation(axis, direction), false),
      plane: {
        plane: new Cesium.Plane(Cesium.Cartesian3.UNIT_Z, 0),
        dimensions: new Cesium.CallbackProperty(() => {
          if (!this.shape || this.shape.tool !== 'box') return Cesium.Cartesian2.ZERO;
          if (axis === 'x') return new Cesium.Cartesian2(this.shape.dimensions.y, this.shape.dimensions.z);
          if (axis === 'y') return new Cesium.Cartesian2(this.shape.dimensions.x, this.shape.dimensions.z);
          return new Cesium.Cartesian2(this.shape.dimensions.x, this.shape.dimensions.y);
        }, false),
        material: AXIS_COLORS[axis].withAlpha(0.008),
        outline: false,
      },
    });
    this.registerHandle(entity, { kind: `resize-${axis}`, axis, direction, role: 'face' }, AXIS_COLORS[axis]);
  }

  private addRotateRing() {
    const positions = new Cesium.CallbackProperty(() => {
      if (!this.shape || this.shape.tool !== 'box') return [];
      const topFaceZ = this.shape.dimensions.z / 2;
      const topFaceCenter = this.boxLocalPoint(0, 0, topFaceZ);
      if (!topFaceCenter) return [];
      const metersPerPixel = this.metersPerPixel(topFaceCenter);
      const faceSize = Math.min(this.shape.dimensions.x, this.shape.dimensions.y);
      const maxOffset = Math.max(0.5, faceSize * 0.12);
      const ringOffset = Cesium.Math.clamp(metersPerPixel * 14, 0.2, maxOffset * 0.45);
      const radius = Cesium.Math.clamp(metersPerPixel * 28, faceSize * 0.18, faceSize * 0.35);
      const z = topFaceZ + ringOffset;
      const points: Cesium.Cartesian3[] = [];
      for (let index = 0; index <= 48; index++) {
        const angle = index / 48 * Cesium.Math.TWO_PI;
        const point = this.boxLocalPoint(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
        if (point) points.push(point);
      }
      return points;
    }, false);
    const entity = this.viewer.entities.add({
      polyline: {
        positions,
        width: 3,
        material: new Cesium.ColorMaterialProperty(COLOR),
        depthFailMaterial: new Cesium.ColorMaterialProperty(COLOR.withAlpha(0.55)),
        clampToGround: false,
      },
    });
    this.registerHandle(entity, { kind: 'rotate-z', axis: 'z', role: 'visual' }, COLOR);
    const hitTarget = this.viewer.entities.add({
      polyline: {
        positions,
        width: 22,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.01)),
        depthFailMaterial: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.01)),
        clampToGround: false,
      },
    });
    this.registerHandle(hitTarget, { kind: 'rotate-z', axis: 'z', role: 'hit-target' }, COLOR);
  }

  private registerHandle(entity: Cesium.Entity, metadata: HandleMetadata, color: Cesium.Color) {
    (entity as any).__clipHandle = metadata;
    (entity as any).__clipBaseColor = Cesium.Color.clone(color);
    this.handles.push(entity);
    this.entities.push(entity);
  }

  private handleKey(metadata: HandleMetadata) {
    if (metadata.kind === 'polygon-vertex') return `${metadata.kind}:${metadata.vertexIndex ?? -1}`;
    return `${metadata.kind}:${metadata.direction ?? 0}`;
  }

  private cursorFor(metadata: HandleMetadata) {
    if (metadata.kind === 'move' || metadata.kind === 'plane-move') return 'move';
    return 'grab';
  }

  private pickHandle(position: Cesium.Cartesian2) {
    // IMPORTANT:
    // The center move handle sits visually inside the box, so the transparent
    // resize-face planes can be closer to the camera and win Cesium picking.
    // Resolve the move handle in SCREEN SPACE first, before drillPick().
    if (this.shape?.tool === 'box') {
      const centerScreen = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        this.shape.center,
      );

      if (centerScreen) {
        const dx = position.x - centerScreen.x;
        const dy = position.y - centerScreen.y;
        const moveHitRadiusPx = 22;

        if (dx * dx + dy * dy <= moveHitRadiusPx * moveHitRadiusPx) {
          const moveEntity = this.handles.find(entity => {
            const metadata = (entity as any).__clipHandle as HandleMetadata | undefined;
            return metadata?.kind === 'move' && metadata.role === 'visual';
          });

          if (moveEntity) {
            return {
              entity: moveEntity,
              metadata: (moveEntity as any).__clipHandle as HandleMetadata,
              priority: 0,
              rolePriority: 0,
            };
          }
        }
      }
    }

    const priorities: Record<HandleKind, number> = {
      'rotate-z': 1,
      move: 2,
      'resize-x': 3,
      'resize-y': 3,
      'resize-z': 3,
      'plane-move': 2,
      'polygon-vertex': 2,
    };
    const hits = this.viewer.scene.drillPick(position, 24) as Array<{ id?: Cesium.Entity; primitive?: { id?: Cesium.Entity } }>;
    let best: { entity: Cesium.Entity; metadata: HandleMetadata; priority: number; rolePriority: number } | null = null;
    for (const hit of hits) {
      const entity = hit.id instanceof Cesium.Entity ? hit.id : hit.primitive?.id instanceof Cesium.Entity ? hit.primitive.id : undefined;
      const metadata = entity && (entity as any).__clipHandle as HandleMetadata | undefined;
      if (!entity || !metadata) continue;
      const priority = priorities[metadata.kind];
      const rolePriority =
        metadata.role === 'hit-target' ? 1 :
        metadata.role === 'visual' ? 2 :
        metadata.role === 'face' ? 3 : 2;

      if (!best || priority < best.priority || (priority === best.priority && rolePriority < best.rolePriority)) {
        best = { entity, metadata, priority, rolePriority };
      }
    }
    return best;
  }

  private boxLocalPoint(x: number, y: number, z: number) {
    if (!this.shape || this.shape.tool !== 'box') return undefined;
    const transform = Cesium.Matrix4.multiply(
      Cesium.Transforms.eastNorthUpToFixedFrame(this.shape.center),
      Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(this.shape.heading)),
      new Cesium.Matrix4(),
    );
    return Cesium.Matrix4.multiplyByPoint(transform, new Cesium.Cartesian3(x, y, z), new Cesium.Cartesian3());
  }

  private faceOrientation(axis: Axis, direction: -1 | 1) {
    if (!this.shape || this.shape.tool !== 'box') return Cesium.Quaternion.IDENTITY;
    let faceRotation = Cesium.Matrix3.IDENTITY;
    if (axis === 'x') faceRotation = Cesium.Matrix3.fromRotationY(direction * Cesium.Math.PI_OVER_TWO);
    else if (axis === 'y') faceRotation = Cesium.Matrix3.fromRotationX(direction * -Cesium.Math.PI_OVER_TWO);
    else if (direction === -1) faceRotation = Cesium.Matrix3.fromRotationX(Math.PI);
    const boxRotation = Cesium.Matrix4.getMatrix3(
      Cesium.Matrix4.multiply(
        Cesium.Transforms.eastNorthUpToFixedFrame(this.shape.center),
        Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(this.shape.heading)),
        new Cesium.Matrix4(),
      ),
      new Cesium.Matrix3(),
    );
    return Cesium.Quaternion.fromRotationMatrix(Cesium.Matrix3.multiply(boxRotation, faceRotation, new Cesium.Matrix3()));
  }

  private boxWorldAxis(box: BoxState, axis: Axis) {
    const transform = Cesium.Matrix4.multiply(
      Cesium.Transforms.eastNorthUpToFixedFrame(box.center),
      Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(box.heading)),
      new Cesium.Matrix4(),
    );
    const local = new Cesium.Cartesian3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
    return Cesium.Cartesian3.normalize(Cesium.Matrix4.multiplyByPointAsVector(transform, local, new Cesium.Cartesian3()), new Cesium.Cartesian3());
  }

  private dragDistanceAlongAxis(startMouse: Cesium.Cartesian2, mouse: Cesium.Cartesian2, box: BoxState, axis: Axis) {
    const worldAxis = this.boxWorldAxis(box, axis);
    const sampleLength = this.gizmoWorldSize(box.center);
    const axisEnd = Cesium.Cartesian3.add(box.center, Cesium.Cartesian3.multiplyByScalar(worldAxis, sampleLength, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const centerScreen = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, box.center);
    const endScreen = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, axisEnd);
    if (!centerScreen || !endScreen) return 0;
    const screenAxis = Cesium.Cartesian2.subtract(endScreen, centerScreen, new Cesium.Cartesian2());
    const screenLength = Cesium.Cartesian2.magnitude(screenAxis);
    if (screenLength < 1) return 0;
    Cesium.Cartesian2.divideByScalar(screenAxis, screenLength, screenAxis);
    const mouseDelta = Cesium.Cartesian2.subtract(mouse, startMouse, new Cesium.Cartesian2());
    return Cesium.Cartesian2.dot(mouseDelta, screenAxis) * sampleLength / screenLength;
  }

  private gizmoWorldSize(center: Cesium.Cartesian3) {
    return this.metersPerPixel(center) * 72;
  }

  private orientation(center: Cesium.Cartesian3, heading: number) {
    const transform = Cesium.Matrix4.multiply(
      Cesium.Transforms.eastNorthUpToFixedFrame(center),
      Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(heading)),
      new Cesium.Matrix4(),
    );
    return Cesium.Quaternion.fromRotationMatrix(Cesium.Matrix4.getMatrix3(transform, new Cesium.Matrix3()));
  }

  private rebuildCollections() {
    if (!this.shape || (this.shape.tool === 'polygon' && !this.shape.closed)) return;
    const targetSet = new Set(this.getTargets().filter(target => !(target as any).isDestroyed?.()));
    for (const [target, collection] of this.collections) {
      if (!targetSet.has(target)) {
        (target as any).clippingPlanes = undefined;
        if (!collection.isDestroyed()) collection.destroy();
        this.collections.delete(target);
      }
    }
    for (const target of targetSet) {
      let collection = this.collections.get(target);
      if (!collection) {
        collection = new Cesium.ClippingPlaneCollection({ edgeColor: COLOR, edgeWidth: 1 });
        (target as any).clippingPlanes = collection;
        this.collections.set(target, collection);
      }
      collection.enabled = this.mode === 'inside' || this.mode === 'outside';
      collection.edgeWidth = this.mode === 'highlight' ? 2 : 1;
      // A convex volume needs union for "keep inside" and intersection for
      // "keep outside". The filter remains the direct Cesium half-space mapping
      // while clipping is disabled/highlight-only; it is not general boolean CSG.
      collection.unionClippingRegions = this.mode === 'inside' ? true : this.mode === 'outside' ? false : this.filter === 'any';
      collection.modelMatrix = this.getTargetClippingModelMatrix(target);
      collection.removeAll();
      this.getPlanes().forEach(plane => collection!.add(plane));
    }
  }

  private getTargetClippingModelMatrix(target: ClipTarget) {
    const worldBoxTransform = this.getModelMatrix();
    const referenceMatrix = target instanceof Cesium.Cesium3DTileset
      ? ((target as any).clippingPlanesOriginMatrix as Cesium.Matrix4 | undefined)
      : (((target as any).referenceMatrix ?? (target as Cesium.Model).modelMatrix) as Cesium.Matrix4 | undefined);
    if (!referenceMatrix) return worldBoxTransform;
    try {
      const inverseReference = Cesium.Matrix4.inverse(referenceMatrix, new Cesium.Matrix4());
      return Cesium.Matrix4.multiply(inverseReference, worldBoxTransform, new Cesium.Matrix4());
    } catch {
      return worldBoxTransform;
    }
  }

  private getModelMatrix() {
    if (!this.shape) return Cesium.Matrix4.IDENTITY;
    const center = this.getShapeCenter(this.shape);
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    const heading = this.shape.tool === 'polygon' ? 0 : this.shape.heading;
    return Cesium.Matrix4.multiply(enu, Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(heading)), new Cesium.Matrix4());
  }

  private getPlanes() {
    if (!this.shape) return [];
    if (this.shape.tool === 'plane') {
      const sign = this.mode === 'outside' ? -1 : 1;
      return [new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, sign), 0)];
    }
    if (this.shape.tool === 'box') {
      const { x, y, z } = this.shape.dimensions;
      const inward = this.mode === 'inside';
      const specs: Array<[Cesium.Cartesian3, number]> = inward ? [
        [new Cesium.Cartesian3(-1, 0, 0), x / 2], [new Cesium.Cartesian3(1, 0, 0), x / 2],
        [new Cesium.Cartesian3(0, -1, 0), y / 2], [new Cesium.Cartesian3(0, 1, 0), y / 2],
        [new Cesium.Cartesian3(0, 0, -1), z / 2], [new Cesium.Cartesian3(0, 0, 1), z / 2],
      ] : [
        [new Cesium.Cartesian3(1, 0, 0), -x / 2], [new Cesium.Cartesian3(-1, 0, 0), -x / 2],
        [new Cesium.Cartesian3(0, 1, 0), -y / 2], [new Cesium.Cartesian3(0, -1, 0), -y / 2],
        [new Cesium.Cartesian3(0, 0, 1), -z / 2], [new Cesium.Cartesian3(0, 0, -1), -z / 2],
      ];
      return specs.map(([normal, distance]) => new Cesium.ClippingPlane(normal, distance));
    }
    const inverse = Cesium.Matrix4.inverse(this.getModelMatrix(), new Cesium.Matrix4());
    const local = this.shape.points.map(point => Cesium.Matrix4.multiplyByPoint(inverse, point, new Cesium.Cartesian3()));
    const area = local.reduce((sum, p, i) => sum + p.x * local[(i + 1) % local.length].y - local[(i + 1) % local.length].x * p.y, 0);
    const clockwise = area < 0;
    return local.map((p, index) => {
      const q = local[(index + 1) % local.length];
      const edge = new Cesium.Cartesian2(q.x - p.x, q.y - p.y);
      let normal = new Cesium.Cartesian3(clockwise ? -edge.y : edge.y, clockwise ? edge.x : -edge.x, 0);
      Cesium.Cartesian3.normalize(normal, normal);
      if (this.mode === 'inside') Cesium.Cartesian3.negate(normal, normal);
      return new Cesium.ClippingPlane(normal, -Cesium.Cartesian3.dot(normal, p));
    });
  }

  private detachCollections() {
    for (const [target, collection] of this.collections) {
      try { (target as any).clippingPlanes = undefined; } catch { /* target may already be destroyed */ }
      try { if (!collection.isDestroyed()) collection.destroy(); } catch { /* Cesium owns some destroyed resources */ }
    }
    this.collections.clear();
  }

  private updateAppearance() {
    const alpha = this.mode === 'highlight' ? 0.2 : 0.07;
    this.entities.forEach(entity => {
      if (entity.box) entity.box.material = new Cesium.ColorMaterialProperty(COLOR.withAlpha(alpha));
      if (entity.plane) entity.plane.material = new Cesium.ColorMaterialProperty(COLOR.withAlpha(Math.max(alpha, 0.16)));
    });
  }

  private pickWorld(position: Cesium.Cartesian2) {
    const scene = this.viewer.scene;
    if (scene.pickPositionSupported) {
      try {
        const point = scene.pickPosition(position);
        if (Cesium.defined(point)) return Cesium.Cartesian3.clone(point);
      } catch { /* fall through to globe */ }
    }
    const ray = this.viewer.camera.getPickRay(position);
    const globePoint = ray && scene.globe.pick(ray, scene);
    return Cesium.defined(globePoint) ? Cesium.Cartesian3.clone(globePoint) : null;
  }

  private isConvex(points: Cesium.Cartesian3[]) {
    if (points.length < 3) return false;
    const center = Cesium.BoundingSphere.fromPoints(points).center;
    const inverse = Cesium.Matrix4.inverse(Cesium.Transforms.eastNorthUpToFixedFrame(center), new Cesium.Matrix4());
    const local = points.map(point => Cesium.Matrix4.multiplyByPoint(inverse, point, new Cesium.Cartesian3()));
    let sign = 0;
    for (let i = 0; i < local.length; i++) {
      const a = local[i], b = local[(i + 1) % local.length], c = local[(i + 2) % local.length];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 1e-7) continue;
      const nextSign = Math.sign(cross);
      if (sign && nextSign !== sign) return false;
      sign = nextSign;
    }
    return sign !== 0;
  }

  private getShapeCenter(shape: ShapeState) {
    return shape.tool === 'polygon' ? Cesium.BoundingSphere.fromPoints(shape.points).center : shape.center;
  }

  private cloneShape(shape: ShapeState): ShapeState {
    if (shape.tool === 'box') return { ...shape, center: Cesium.Cartesian3.clone(shape.center), dimensions: Cesium.Cartesian3.clone(shape.dimensions) };
    if (shape.tool === 'plane') return { ...shape, center: Cesium.Cartesian3.clone(shape.center) };
    return { ...shape, points: shape.points.map(point => Cesium.Cartesian3.clone(point)) };
  }

  private metersPerPixel(position: Cesium.Cartesian3) {
    try {
      return Math.max(0.01, this.viewer.camera.getPixelSize(
        new Cesium.BoundingSphere(position, 1),
        Math.max(1, this.viewer.scene.drawingBufferWidth),
        Math.max(1, this.viewer.scene.drawingBufferHeight),
      ));
    } catch { /* fall back for unsupported custom frustums */ }
    const distance = Cesium.Cartesian3.distance(this.viewer.camera.positionWC, position);
    const height = Math.max(1, this.viewer.scene.canvas.clientHeight);
    const fovy = (this.viewer.camera.frustum as { fovy?: number }).fovy ?? Cesium.Math.toRadians(60);
    return Math.max(0.01, 2 * distance * Math.tan(fovy / 2) / height);
  }
}
