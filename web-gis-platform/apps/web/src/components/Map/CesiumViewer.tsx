import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { PotreeSidebar } from './PotreeSidebar';
import { OptimizerPanel } from './OptimizerPanel';
import { UnifiedToolbar, type DisplayMode, type ViewAngle } from './UnifiedToolbar';
import { MeasurementManager, type MeasurementManagerItem } from './MeasurementManager';
import {
  clearProjectMeasurements,
  createProjectMeasurement,
  deleteProjectMeasurement,
  fetchProjectById,
  fetchProjectMeasurements,
  updateProject,
  updateProjectMeasurement,
} from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { MeasurementRecord, ProfileResult, ProfileSample } from './measurementTypes';
import { deserializeMeasurement, serializeMeasurementRecord } from './measurementPersistence';
import {
  calculateAngleDegrees,
  calculateCentroid,
  calculatePolygonArea,
  getMidpoint,
  getMeasurementTypeLabel,
  getMeasurementValue,
  getProjectedPoint,
  MEASUREMENT_RING_DOT_GLOW_IMAGE,
  MEASUREMENT_RING_DOT_IMAGE,
} from './measurementUtils';

export type { MeasurementRecord, MeasureTarget, ProfileResult, ProfileSample, ToolMode } from './measurementTypes';
import type { ToolMode } from './measurementTypes';
type ClipMode = 'none' | 'highlight' | 'inside' | 'outside';
type ClipFilter = 'any' | 'all';

// Component hỗ trợ nhập số mượt mà cho Calibration Panel (cho phép gõ -, 0., xóa trắng mà không bị reset về 0)
const CalibNumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  step?: string;
  className?: string;
}> = ({ value, onChange, step = "any", className = "" }) => {
  const [text, setText] = useState<string>(value !== undefined && value !== null ? value.toString() : '0');

  useEffect(() => {
    setText(value !== undefined && value !== null ? value.toString() : '0');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setText(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <input
      type="number"
      step={step}
      value={text}
      onChange={handleChange}
      className={className}
    />
  );
};


export const CesiumViewer: React.FC<{
  projectId?: string;
  projectName?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}> = ({
  projectId,
  projectName = 'Dự án 3D',
  isSidebarOpen = true,
  onToggleSidebar
}) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    const cesiumContainer = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);
    const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

    const modelRef = useRef<Cesium.Model | null>(null);
    const domLayerRef = useRef<Cesium.ImageryLayer | null>(null);
    const pointCloudRef = useRef<Cesium.Cesium3DTileset | null>(null);
    const measurementEntitiesRef = useRef<Cesium.Entity[]>([]);
    const measurementsStoreRef = useRef<MeasurementRecord[]>([]);
    const measurementPersistenceQueueRef = useRef(new Map<string, Promise<void>>());
    const hydratedMeasurementsProjectRef = useRef<string | null>(null);
    const clippingCollectionsRef = useRef<Cesium.ClippingPlaneCollection[]>([]);
    const clippingEntitiesRef = useRef<Cesium.Entity[]>([]);
    // Lazy load: track whether PC đã được load (tránh load lại nhiều lần)
    const pointCloudLoadedRef = useRef(false);

    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPERADMIN';

    const [project, setProject] = useState<any>(null);
    const [toolMode, setToolMode] = useState<ToolMode>('none');
    const [measurementPoints, setMeasurementPoints] = useState<Cesium.Cartesian3[]>([]);
    const [measurementRevision, setMeasurementRevision] = useState(0);
    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
    const [viewAngle, setViewAngle] = useState<ViewAngle>('default');
    const [navigationMode, setNavigationMode] = useState<'earth' | 'fps' | 'orbit'>('earth');
    const [clipMode, setClipMode] = useState<ClipMode>('highlight');
    const [clipFilter, setClipFilter] = useState<ClipFilter>('any');
    const [activeClipTool, setActiveClipTool] = useState<'box' | 'plane' | null>(null);

    // State loading model: hiện spinner khi đang fetch/parse glTF
    const [isModelLoading, setIsModelLoading] = useState(false);

    // States quản lý bật tắt layer
    // Mặc định: chỉ hiện Model 3D, ẩn Point Cloud và DOM để tránh flash khi load
    const [showModel, setShowModel] = useState(true);
    const [showDom, setShowDom] = useState(false);
    const [showPointCloud, setShowPointCloud] = useState(false);

    // States quản lý Appearance (Ngoại quan Potree)
    const [pointSize, setPointSize] = useState(2.5);
    const [fov, setFov] = useState(60);
    const [edlEnabled, setEdlEnabled] = useState(false);
    const [edlRadius, setEdlRadius] = useState(1.4);
    const [edlStrength, setEdlStrength] = useState(0.4);
    const [edlOpacity, setEdlOpacity] = useState(1.0);
    const [background, setBackground] = useState<'sky' | 'gradient' | 'black' | 'white' | 'none'>('gradient');
    const [quality, setQuality] = useState<'standard' | 'high'>('standard');
    const [minPointBudget, setMinPointBudget] = useState(100_000);
    const [maxPointBudget, setMaxPointBudget] = useState(12_000_000);
    const [pointBudget, setPointBudget] = useState(12_000_000);
    const [minNodeSize, setMinNodeSize] = useState(8);
    const [lockView, setLockView] = useState(false);
    const [isOrthographic, setIsOrthographic] = useState(false);
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [cameraSpeed, setCameraSpeed] = useState(130.6);
    const [activeProfile, setActiveProfile] = useState<ProfileResult | null>(null);
    const [isProfileSampling, setIsProfileSampling] = useState(false);

    const enqueueMeasurementPersistence = (measurementId: string, operation: () => Promise<unknown>) => {
      const previous = measurementPersistenceQueueRef.current.get(measurementId) ?? Promise.resolve();
      const next = previous
        .catch(() => undefined)
        .then(operation)
        .then(() => undefined)
        .catch(error => console.error(`[Measurement persistence] ${measurementId}:`, error));
      measurementPersistenceQueueRef.current.set(measurementId, next);
      void next.finally(() => {
        if (measurementPersistenceQueueRef.current.get(measurementId) === next) {
          measurementPersistenceQueueRef.current.delete(measurementId);
        }
      });
    };

    const persistMeasurementUpdate = (record: MeasurementRecord) => {
      if (!projectId || !record.isFinalized) return;
      const { id: _id, type: _type, ...payload } = serializeMeasurementRecord(record);
      enqueueMeasurementPersistence(record.id, () =>
        updateProjectMeasurement(projectId, record.id, payload)
      );
    };

    // Fetch thông tin dự án khi projectId thay đổi
    useEffect(() => {
      if (projectId) {
        fetchProjectById(projectId).then(data => {
          if (data) setProject(data);
        });
      }
    }, [projectId]);

    // Đổi dự án thì đóng kết quả trắc dọc cũ để không hiển thị dữ liệu của project trước.
    useEffect(() => {
      setActiveProfile(null);
      setIsProfileSampling(false);
    }, [projectId]);

    // States và refs quản lý tinh chỉnh vị trí của Admin (Calibration)
    const [offsets, setOffsets] = useState({
      modelLon: 0,
      modelLat: 0,
      modelHeight: 0.3,
      modelHeading: 0,
      modelPitch: 0,
      modelRoll: 0,
      domLon: 0,
      domLat: 0,
      domScale: 1.0,
      domHeading: 0,
      pcLon: 0,
      pcLat: 0,
      pcHeight: 0,
      pcHeading: 0,
      pcPitch: 0,
      pcRoll: 0
    });
    const [activeTarget, setActiveTarget] = useState<'model' | 'dom' | 'pointcloud' | 'none'>('none');
    const [stepSize, setStepSize] = useState(1.0); // bước nhảy mét mặc định là 1m thay vì 0.1m
    const originalBoundsRef = useRef({ west: 0, east: 0, south: 0, north: 0 });
    const offsetsRef = useRef(offsets);
    const pointCloudOriginalCenterRef = useRef<Cesium.Cartesian3 | null>(null);
    const loadedPointCloudTilesetsRef = useRef<Cesium.Cesium3DTileset[]>([]);
    const domImageRef = useRef<HTMLImageElement | null>(null);
    const domImageSrcRef = useRef<string | null>(null);

    useEffect(() => {
      offsetsRef.current = offsets;
    }, [offsets]);

    // Nạp calibration cũ từ DB (ưu tiên) hoặc localStorage khi mở project
    useEffect(() => {
      if (project) {
        if (project.calibration) {
          try {
            const parsed = JSON.parse(project.calibration);
            setOffsets(prev => ({ ...prev, ...parsed }));
            console.log("Loaded calibration offsets from database:", parsed);
            return;
          } catch (e) {
            console.error("Lỗi parse calibration từ DB:", e);
          }
        }

        // Fallback về localStorage
        const saved = localStorage.getItem(`calibration_${project.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setOffsets(prev => ({ ...prev, ...parsed }));
            console.log("Loaded saved calibration from localStorage:", parsed);
          } catch (e) {
            console.error("Lỗi parse calibration từ localStorage:", e);
          }
        } else {
          setOffsets({
            modelLon: 0,
            modelLat: 0,
            modelHeight: 0.3,
            modelHeading: 0,
            modelPitch: 0,
            modelRoll: 0,
            domLon: 0,
            domLat: 0,
            domScale: 1.0,
            domHeading: 0,
            pcLon: 0,
            pcLat: 0,
            pcHeight: 0,
            pcHeading: 0,
            pcPitch: 0,
            pcRoll: 0
          });
        }
      }
    }, [project]);

    // Tự động nhận diện và nạp ngưỡng Point Budget (tối thiểu & tối đa) riêng của từng dự án
    useEffect(() => {
      if (!project) return;

      let detectedMax = 12_000_000;
      let detectedMin = 100_000;

      // 1. Kiểm tra nếu dự án có trường point count trực tiếp
      if ((project as any).totalPoints || (project as any).pointCount) {
        const pts = Number((project as any).totalPoints || (project as any).pointCount);
        if (pts > 0) {
          detectedMax = pts;
          detectedMin = Math.max(10_000, Math.round(pts * 0.02));
        }
      }

      // 2. Nạp từ metadata.json nếu có
      if (project.metadataUrl) {
        fetch(project.metadataUrl)
          .then(res => res.json())
          .then(meta => {
            if (meta && (meta.totalPoints || meta.pointCount)) {
              const pts = Number(meta.totalPoints || meta.pointCount);
              if (pts > 0) {
                const max = pts;
                const min = Math.max(10_000, Math.round(pts * 0.02));
                setMinPointBudget(min);
                setMaxPointBudget(max);
                const saved = localStorage.getItem(`pointBudget_${project.id}`);
                const initB = saved ? Math.min(max, Math.max(min, Number(saved))) : max;
                setPointBudget(initB);
              }
            }
          })
          .catch(() => {});
      }

      // 3. Nạp từ tileset.json nếu pointCloudId là đường dẫn JSON
      if (project.pointCloudId && (project.pointCloudId.startsWith('http') || project.pointCloudId.startsWith('/')) && project.pointCloudId.endsWith('tileset.json')) {
        fetch(project.pointCloudId)
          .then(res => res.json())
          .then(tsData => {
            if (tsData) {
              const extras = tsData.asset?.extras || tsData.extras || {};
              const pts = extras.pointCount || extras.totalPoints || tsData.properties?.pointCount;
              if (pts && Number(pts) > 0) {
                const max = Number(pts);
                const min = Math.max(10_000, Math.round(max * 0.02));
                setMinPointBudget(min);
                setMaxPointBudget(max);
                const saved = localStorage.getItem(`pointBudget_${project.id}`);
                const initB = saved ? Math.min(max, Math.max(min, Number(saved))) : max;
                setPointBudget(initB);
              }
            }
          })
          .catch(() => {});
      }

      const savedBudget = localStorage.getItem(`pointBudget_${project.id}`);
      const initBudget = savedBudget ? Math.min(detectedMax, Math.max(detectedMin, Number(savedBudget))) : detectedMax;

      setMinPointBudget(detectedMin);
      setMaxPointBudget(detectedMax);
      setPointBudget(initBudget);
    }, [project]);

    // Lưu trữ bounds cơ sở của dự án để tính offset
    useEffect(() => {
      if (!project) return;
      originalBoundsRef.current = {
        west: 0,
        east: 0,
        south: 0,
        north: 0
      };
    }, [project]);

    // Cập nhật thời gian thực Model 3D khi tinh chỉnh (offset/rotation/tilt)
    useEffect(() => {
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
    }, [offsets.modelLon, offsets.modelLat, offsets.modelHeight, offsets.modelHeading, offsets.modelPitch, offsets.modelRoll, project]);

    // Cập nhật thời gian thực ảnh DOM khi tinh chỉnh (offset/scale) với Debounce 250ms (DUY NHẤT)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !project || !project.domUrl) return;

      let isCurrent = true;

      const timer = setTimeout(async () => {
        const baseLon = project.centerLon || 106.8099;
        const baseLat = project.centerLat || 10.8404;
        let lon = baseLon;
        let lat = baseLat;
        if (lon < 90 && lat > 90) {
          lon = baseLat;
          lat = baseLon;
        }

        // Đọc metadata.json của DOM nếu chưa có bounds gốc
        if (originalBoundsRef.current.west === 0) {
          if (project.metadataUrl) {
            try {
              const res = await fetch(project.metadataUrl);
              const meta = await res.json();
              if (meta.west && meta.east && meta.south && meta.north) {
                originalBoundsRef.current = {
                  west: meta.west,
                  east: meta.east,
                  south: meta.south,
                  north: meta.north
                };
                console.log("Đã đọc bounding box DOM từ metadata.json:", meta);
              }
            } catch (e) {
              console.warn("Không thể đọc metadata.json DOM, dùng khoảng vị trí mặc định.");
            }
          }

          // Nếu vẫn bằng 0 (fetch lỗi hoặc không có metadataUrl), tính bounds mặc định
          if (originalBoundsRef.current.west === 0) {
            const deltaLatitude = 142.222 / 111111;
            const deltaLongitude = 143.532 / (111111 * Math.cos(lat * Math.PI / 180));
            originalBoundsRef.current = {
              west: lon - deltaLongitude / 2,
              east: lon + deltaLongitude / 2,
              south: lat - deltaLatitude / 2,
              north: lat + deltaLatitude / 2
            };
            console.log("Đã tính bounding box DOM mặc định:", originalBoundsRef.current);
          }
        }

        // Lấy bounds gốc (nếu có)
        let west = originalBoundsRef.current.west;
        let east = originalBoundsRef.current.east;
        let south = originalBoundsRef.current.south;
        let north = originalBoundsRef.current.north;

        if (west === 0) {
          const deltaLatitude = 142.222 / 111111;
          const deltaLongitude = 143.532 / (111111 * Math.cos(lat * Math.PI / 180));
          west = lon - deltaLongitude / 2;
          east = lon + deltaLongitude / 2;
          south = lat - deltaLatitude / 2;
          north = lat + deltaLatitude / 2;
        }

        // Áp dụng scale
        const centerLon = (west + east) / 2;
        const centerLat = (south + north) / 2;
        const halfWidth = ((east - west) / 2) * (offsets.domScale || 1.0);
        const halfHeight = ((north - south) / 2) * (offsets.domScale || 1.0);

        const domUrl = project.domUrl;

        try {
          // Tải hình ảnh dưới dạng Blob để giải quyết CORS và tránh làm bẩn (tainting) canvas
          let img = domImageRef.current;
          if (!img || domImageSrcRef.current !== domUrl) {
            const res = await fetch(domUrl + "?cb=" + Date.now(), { mode: 'cors' });
            if (!res.ok) throw new Error("Fetch DOM image failed");
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                URL.revokeObjectURL(blobUrl);
                resolve(image);
              };
              image.onerror = (e) => {
                URL.revokeObjectURL(blobUrl);
                reject(e);
              };
              image.src = blobUrl;
            });
            if (!isCurrent) return;
            domImageRef.current = img;
            domImageSrcRef.current = domUrl;
          }

          // Giới hạn độ phân giải của canvas vẽ xoay tối đa là 2048 để tránh crash bộ nhớ GPU của trình duyệt với ảnh trực giao siêu lớn
          const maxCanvasSize = 2048;
          let W = img.width;
          let H = img.height;
          if (W > maxCanvasSize || H > maxCanvasSize) {
            const scale = maxCanvasSize / Math.max(W, H);
            W = Math.round(W * scale);
            H = Math.round(H * scale);
          }

          const D = Math.ceil(Math.sqrt(W * W + H * H));

          // Tạo canvas hình vuông có kích thước đường chéo D để vẽ xoay không bị cắt góc
          const canvas = document.createElement('canvas');
          canvas.width = D;
          canvas.height = D;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Canvas context is null");

          // Xoay và vẽ ảnh vào tâm canvas
          ctx.translate(D / 2, D / 2);
          ctx.rotate(Cesium.Math.toRadians(offsets.domHeading || 0));
          ctx.drawImage(img, -W / 2, -H / 2, W, H);

          // Mở rộng bounds tương ứng với đường chéo để đảm bảo scale hiển thị chính xác
          const newHalfWidth = halfWidth * (D / W);
          const newHalfHeight = halfHeight * (D / H);

          const finalWest = centerLon - newHalfWidth + (offsets.domLon || 0);
          const finalEast = centerLon + newHalfWidth + (offsets.domLon || 0);
          const finalSouth = centerLat - newHalfHeight + (offsets.domLat || 0);
          const finalNorth = centerLat + newHalfHeight + (offsets.domLat || 0);

          if (
            isNaN(finalWest) || isNaN(finalEast) || isNaN(finalSouth) || isNaN(finalNorth) ||
            finalWest >= finalEast || finalSouth >= finalNorth ||
            finalWest < -180 || finalEast > 180 || finalSouth < -90 || finalNorth > 90
          ) {
            throw new Error("Invalid bounds coordinates");
          }

          const newDomRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);

          const provider = new Cesium.SingleTileImageryProvider({
            url: canvas.toDataURL(),
            rectangle: newDomRectangle,
          });

          if (!isCurrent || viewer.isDestroyed()) return;

          const oldLayer = domLayerRef.current;
          const newLayer = viewer.imageryLayers.addImageryProvider(provider);
          newLayer.show = showDom;
          newLayer.colorToAlpha = Cesium.Color.BLACK;
          newLayer.colorToAlphaThreshold = 0.15;

          viewer.imageryLayers.raiseToTop(newLayer);
          domLayerRef.current = newLayer;

          if (oldLayer && !viewer.isDestroyed() && !oldLayer.isDestroyed() && viewer.imageryLayers.contains(oldLayer)) {
            viewer.imageryLayers.remove(oldLayer, true);
          }
        } catch (canvasErr) {
          console.warn("⚠️ Không thể tạo ảnh DOM xoay bằng canvas. Chuyển sang nạp ảnh gốc không xoay làm dự phòng:", canvasErr);

          const finalWest = centerLon - halfWidth + (offsets.domLon || 0);
          const finalEast = centerLon + halfWidth + (offsets.domLon || 0);
          const finalSouth = centerLat - halfHeight + (offsets.domLat || 0);
          const finalNorth = centerLat + halfHeight + (offsets.domLat || 0);

          if (
            isNaN(finalWest) || isNaN(finalEast) || isNaN(finalSouth) || isNaN(finalNorth) ||
            finalWest >= finalEast || finalSouth >= finalNorth ||
            finalWest < -180 || finalEast > 180 || finalSouth < -90 || finalNorth > 90
          ) {
            return;
          }

          const domRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);

          try {
            const provider = await Cesium.SingleTileImageryProvider.fromUrl(domUrl + "?cb=" + Date.now(), {
              rectangle: domRectangle,
            });

            if (!isCurrent || viewer.isDestroyed()) return;

            const oldLayer = domLayerRef.current;
            const newLayer = viewer.imageryLayers.addImageryProvider(provider);
            newLayer.show = showDom;
            newLayer.colorToAlpha = Cesium.Color.BLACK;
            newLayer.colorToAlphaThreshold = 0.15;

            viewer.imageryLayers.raiseToTop(newLayer);
            domLayerRef.current = newLayer;

            if (oldLayer && !viewer.isDestroyed() && !oldLayer.isDestroyed() && viewer.imageryLayers.contains(oldLayer)) {
              viewer.imageryLayers.remove(oldLayer, true);
            }
          } catch (err) {
            console.error("Lỗi nghiêm trọng khi nạp ảnh DOM dự phòng:", err);
          }
        }
      }, 250);

      return () => {
        isCurrent = false;
        clearTimeout(timer);
      };
    }, [offsets.domLon, offsets.domLat, offsets.domScale, offsets.domHeading, showDom, project]);

    // Cập nhật vị trí Point Cloud theo thời gian thực khi Admin hiệu chỉnh (offset/rotation/tilt)
    useEffect(() => {
      if (loadedPointCloudTilesetsRef.current.length === 0 || !project) return;
      const baseCenter = pointCloudOriginalCenterRef.current;
      if (!baseCenter) return;

      const baseLon = project.centerLon || 106.8099;
      const baseLat = project.centerLat || 10.8404;
      let lon = baseLon;
      let lat = baseLat;
      if (lon < 90 && lat > 90) {
        lon = baseLat;
        lat = baseLon;
      }

      const pcLon = offsets.pcLon || 0;
      const pcLat = offsets.pcLat || 0;
      const pcHeight = offsets.pcHeight || 0;
      const pcHeading = offsets.pcHeading || 0;
      const pcPitch = offsets.pcPitch || 0;
      const pcRoll = offsets.pcRoll || 0;

      const offsetPos = Cesium.Cartesian3.fromDegrees(lon + pcLon, lat + pcLat, pcHeight);

      // Áp dụng rotation heading/pitch/roll cho point cloud realtime
      const headingRad = Cesium.Math.toRadians(pcHeading);
      const pitchRad = Cesium.Math.toRadians(pcPitch);
      const rollRad = Cesium.Math.toRadians(pcRoll);
      const hpr = new Cesium.HeadingPitchRoll(headingRad, pitchRad, rollRad);

      const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(baseCenter);
      const ecefToEnu = Cesium.Matrix4.inverse(enuToEcef, new Cesium.Matrix4());
      const hprFixedFrame = Cesium.Transforms.headingPitchRollToFixedFrame(offsetPos, hpr);
      const newModelMatrix = Cesium.Matrix4.multiply(hprFixedFrame, ecefToEnu, new Cesium.Matrix4());

      // Áp dụng đồng bộ cho tất cả các tilesets mây điểm đang nạp
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.modelMatrix = newModelMatrix.clone();
        }
      });
    }, [offsets.pcLon, offsets.pcLat, offsets.pcHeight, offsets.pcHeading, offsets.pcPitch, offsets.pcRoll, project]);



    // Đồng bộ trạng thái hiển thị Mô hình 3D Mesh với Primitive Cesium
    useEffect(() => {
      if (modelRef.current && !modelRef.current.isDestroyed()) {
        modelRef.current.show = showModel;
      }
    }, [showModel]);

    // Đồng bộ trạng thái hiển thị Đám mây điểm Point Cloud với Tilesets Cesium
    useEffect(() => {
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.show = showPointCloud;
        }
      });
    }, [showPointCloud]);

    // Đồng bộ trạng thái hiển thị Ảnh trực giao DOM với ImageryLayer Cesium
    useEffect(() => {
      if (domLayerRef.current && !domLayerRef.current.isDestroyed()) {
        domLayerRef.current.show = showDom;
      }
    }, [showDom]);

    // Xử lý chuyển đổi chế độ hiển thị 4 lựa chọn (Full Map, Point Cloud, 3D Model, DOM Image)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      if (displayMode === 'full') {
        viewer.scene.globe.show = true;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        setShowPointCloud(false); // Ở chế độ Full Map: chỉ hiển thị 3D Model, ẩn Point Cloud và DOM
        setShowModel(true);
        setShowDom(false);
      } else if (displayMode === 'pointcloud') {
        viewer.scene.globe.show = false; // Ẩn quả địa cầu Cesium
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#090d16');
        setShowPointCloud(true);
        setShowModel(false);
        setShowDom(false);
        // Lazy load: nếu trên mobile và PC chưa được load thì trigger load ngay bây giờ
        if (isMobile && !pointCloudLoadedRef.current && project) {
          pointCloudLoadedRef.current = true; // đặt cờ trước để tránh load nhiều lần
          loadPointCloudLazy();
        } else {
          handleFocusPointCloud();
        }
      } else if (displayMode === 'model3d') {
        viewer.scene.globe.show = false; // Ẩn quả địa cầu Cesium
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#090d16');
        setShowModel(true);
        setShowPointCloud(false);
        setShowDom(false);
        handleFocusProject();
      } else if (displayMode === 'dom') {
        viewer.scene.globe.show = true;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        setShowDom(true);
        setShowPointCloud(false);
        setShowModel(false);
        handleFocusDom();
      }
    }, [displayMode, project]);

    // Xử lý chuyển đổi góc nhìn camera (Default perspective vs Top Down 90°) xoay quanh tâm màn hình
    const prevViewAngleRef = useRef<ViewAngle>('default');
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !project) return;

      if (prevViewAngleRef.current === viewAngle) return;
      prevViewAngleRef.current = viewAngle;

      const currentCamera = viewer.camera;
      const canvas = viewer.canvas;
      const centerScreen = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);

      // Tìm điểm giao (look-at target) tại tâm màn hình để xoay quanh tâm đó
      let targetCartesian: Cesium.Cartesian3 | undefined = viewer.scene.pickPosition(centerScreen);
      if (!targetCartesian) {
        const ray = currentCamera.getPickRay(centerScreen);
        if (ray) {
          targetCartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
      }
      if (!targetCartesian) {
        targetCartesian = currentCamera.pickEllipsoid(centerScreen);
      }

      // Hàng đợi fallback nếu không lấy được tâm màn hình
      if (!targetCartesian) {
        const baseLon = project.centerLon || 106.8099;
        const baseLat = project.centerLat || 10.8404;
        let longitude = baseLon;
        let latitude = baseLat;
        if (longitude < 90 && latitude > 90) {
          longitude = baseLat;
          latitude = baseLon;
        }
        const modelLon = offsetsRef.current.modelLon || 0;
        const modelLat = offsetsRef.current.modelLat || 0;
        const modelHeight = offsetsRef.current.modelHeight || 0.3;
        targetCartesian = Cesium.Cartesian3.fromDegrees(longitude + modelLon, latitude + modelLat, modelHeight);
      }

      const distance = Cesium.Cartesian3.distance(currentCamera.position, targetCartesian);
      const safeDistance = Math.min(Math.max(distance, 10), 10000);
      const targetSphere = new Cesium.BoundingSphere(targetCartesian, 0);

      if (viewAngle === 'topdown') {
        viewer.camera.flyToBoundingSphere(targetSphere, {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-90), // Góc thẳng đứng từ trên xuống
            safeDistance
          )
        });
      } else {
        viewer.camera.flyToBoundingSphere(targetSphere, {
          duration: 1.2,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-35), // Góc nghiêng mặc định
            safeDistance
          )
        });
      }
    }, [viewAngle, project]);

    // Lắng nghe phím bấm để tinh chỉnh vị trí của Admin
    useEffect(() => {
      if (activeTarget === 'none') return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const tag = document.activeElement?.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        const step = stepSize;
        const degreeStep = step * 0.000009; // Quy đổi mét sang độ vĩ/kinh (1m ≈ 0.000009 độ)

        console.log(`[Admin Calib] Key: ${e.key} | Target: ${activeTarget} | Step: ${step}m (${degreeStep.toFixed(8)}°)`);

        if (activeTarget === 'model') {
          switch (e.key.toLowerCase()) {
            case 'arrowup':
            case 'i':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelLat: prev.modelLat + degreeStep }));
              break;
            case 'arrowdown':
            case 'k':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelLat: prev.modelLat - degreeStep }));
              break;
            case 'arrowleft':
            case 'j':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelLon: prev.modelLon - degreeStep }));
              break;
            case 'arrowright':
            case 'l':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelLon: prev.modelLon + degreeStep }));
              break;
            case 'u':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelHeight: prev.modelHeight + step }));
              break;
            case 'o':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelHeight: prev.modelHeight - step }));
              break;
            case 'q':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelHeading: (prev.modelHeading + 1) % 360 }));
              break;
            case 'e':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelHeading: (prev.modelHeading - 1) % 360 }));
              break;
            case 't':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelPitch: (prev.modelPitch || 0) + 0.1 }));
              break;
            case 'g':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelPitch: (prev.modelPitch || 0) - 0.1 }));
              break;
            case 'f':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelRoll: (prev.modelRoll || 0) - 0.1 }));
              break;
            case 'h':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, modelRoll: (prev.modelRoll || 0) + 0.1 }));
              break;
            case '+':
            case '=':
              e.preventDefault();
              setStepSize(prev => Math.min(10.0, prev * 2));
              break;
            case '-':
            case '_':
              e.preventDefault();
              setStepSize(prev => Math.max(0.01, prev / 2));
              break;
          }
        } else if (activeTarget === 'dom') {
          switch (e.key.toLowerCase()) {
            case 'arrowup':
            case 'i':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domLat: prev.domLat + degreeStep }));
              break;
            case 'arrowdown':
            case 'k':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domLat: prev.domLat - degreeStep }));
              break;
            case 'arrowleft':
            case 'j':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domLon: prev.domLon - degreeStep }));
              break;
            case 'arrowright':
            case 'l':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domLon: prev.domLon + degreeStep }));
              break;
            case 'q':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domHeading: ((prev.domHeading || 0) + 1) % 360 }));
              break;
            case 'e':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domHeading: ((prev.domHeading || 0) - 1 + 360) % 360 }));
              break;
            case 'u':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domScale: prev.domScale + 0.005 }));
              break;
            case 'o':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, domScale: Math.max(0.1, prev.domScale - 0.005) }));
              break;
            case '+':
            case '=':
              e.preventDefault();
              setStepSize(prev => Math.min(10.0, prev * 2));
              break;
            case '-':
            case '_':
              e.preventDefault();
              setStepSize(prev => Math.max(0.01, prev / 2));
              break;
          }
        } else if (activeTarget === 'pointcloud') {
          switch (e.key.toLowerCase()) {
            case 'arrowup':
            case 'i':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcLat: (prev.pcLat || 0) + degreeStep }));
              break;
            case 'arrowdown':
            case 'k':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcLat: (prev.pcLat || 0) - degreeStep }));
              break;
            case 'arrowleft':
            case 'j':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcLon: (prev.pcLon || 0) - degreeStep }));
              break;
            case 'arrowright':
            case 'l':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcLon: (prev.pcLon || 0) + degreeStep }));
              break;
            case 'u':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcHeight: (prev.pcHeight || 0) + step }));
              break;
            case 'o':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcHeight: (prev.pcHeight || 0) - step }));
              break;
            case 'q':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcHeading: ((prev.pcHeading || 0) + 1) % 360 }));
              break;
            case 'e':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcHeading: ((prev.pcHeading || 0) - 1 + 360) % 360 }));
              break;
            case 't':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcPitch: (prev.pcPitch || 0) + 0.1 }));
              break;
            case 'g':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcPitch: (prev.pcPitch || 0) - 0.1 }));
              break;
            case 'f':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcRoll: (prev.pcRoll || 0) - 0.1 }));
              break;
            case 'h':
              e.preventDefault();
              setOffsets(prev => ({ ...prev, pcRoll: (prev.pcRoll || 0) + 0.1 }));
              break;
            case '+':
            case '=':
              e.preventDefault();
              setStepSize(prev => Math.min(10.0, prev * 2));
              break;
            case '-':
            case '_':
              e.preventDefault();
              setStepSize(prev => Math.max(0.01, prev / 2));
              break;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTarget, stepSize]);

    // Khởi tạo bản đồ 3D (chạy 1 lần duy nhất khi component mount)
    useEffect(() => {
      if (!cesiumContainer.current) return;

      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZGU0M2FmNy1hZDAzLTRhNDItYmRiYy05ZDI3NzgxZjJlMTQiLCJpZCI6NDU2MjMyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODQwMTYwNzd9.JUFEkwNgp8X1PjyPe70aAUcb1YvOFSVOK3JyWTKusiw';

      // ── BEST PRACTICE (Cesium Community): Dùng requestRenderMode để tránh render liên tục
      // khi scene không thay đổi — tiết kiệm tới 60% CPU/GPU idle, quan trọng nhất trên mobile
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        animation: false,
        timeline: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        baseLayerPicker: false,
        // ── Tối ưu render (Cesium blog "Performance Tips 2024") ──
        requestRenderMode: true,           // Chỉ render khi có sự kiện → giảm CPU/GPU idle 40-60%
        maximumRenderTimeChange: Infinity, // Không render thêm frame thừa giữa các sự kiện
        targetFrameRate: isMobile ? 30 : 60, // Cap 30fps trên mobile để bảo vệ pin
      });

      viewerRef.current = viewer;
      viewer.scene.pickTranslucentDepth = false; // Tắt pickTranslucentDepth để tránh crash WebGL khi hủy viewer/unmount
      viewer.scene.globe.depthTestAgainstTerrain = true;

      // ── BEST PRACTICE: ResolutionScale theo device pixel ratio ──
      // Mobile high-DPI (3x) render gấp 9x pixel so với logical — giảm xuống ≤ 1x logic pixel
      if (isMobile) {
        viewer.resolutionScale = Math.min(1.0, 1.0 / window.devicePixelRatio); // Tương đương ~0.33 trên retina 3x
        viewer.scene.globe.maximumScreenSpaceError = 4.0;
        // Tắt các effect nặng không cần thiết trên mobile
        viewer.scene.fog.enabled = false;
        if ((viewer.scene.postProcessStages as any).fxaa) {
          (viewer.scene.postProcessStages as any).fxaa.enabled = false;
        }
      } else {
        viewer.scene.globe.maximumScreenSpaceError = 2.0;
      }

      // ── BEST PRACTICE: Terrain ──
      // Trên mobile: dùng EllipsoidTerrainProvider (zero network cost) để giải phóng
      // băng thông cho model 3D. Desktop giữ World Terrain để có địa hình thật.
      if (!isMobile) {
        Cesium.createWorldTerrainAsync()
          .then((provider) => {
            if (!viewer.isDestroyed()) viewer.terrainProvider = provider;
          })
          .catch((e) => console.error("Lỗi khi load terrain mặc định:", e));
      }
      // Mobile: Cesium mặc định đã dùng EllipsoidTerrainProvider, không cần làm gì thêm

      measurementEntitiesRef.current = [];

      return () => {
        if (handlerRef.current) {
          try { handlerRef.current.destroy(); } catch (e) {}
          handlerRef.current = null;
        }

        const v = viewerRef.current;
        viewerRef.current = null;
        measurementEntitiesRef.current = [];

        if (v && !v.isDestroyed()) {
          try {
            // Tắt render loop ngay lập tức để không có frame tick nào chạy tiếp sau khi unmount
            v.useDefaultRenderLoop = false;
            v.destroy();
          } catch (e) {
            console.error("Lỗi khi hủy Cesium Viewer:", e);
          }
        }
      };
    }, []);

    // Nạp dữ liệu khi dự án (project) thay đổi
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !project) return;

      let isCurrent = true;

      // 1. Dọn dẹp sạch sẽ các lớp dữ liệu của dự án cũ trước khi nạp dự án mới
      try {
        if (modelRef.current && !viewer.isDestroyed() && !modelRef.current.isDestroyed()) {
          viewer.scene.primitives.remove(modelRef.current);
          modelRef.current = null;
        }
        if (pointCloudRef.current && !viewer.isDestroyed() && !pointCloudRef.current.isDestroyed()) {
          viewer.scene.primitives.remove(pointCloudRef.current);
          pointCloudRef.current = null;
        }
        if (domLayerRef.current && !viewer.isDestroyed() && !domLayerRef.current.isDestroyed()) {
          viewer.imageryLayers.remove(domLayerRef.current, true);
          domLayerRef.current = null;
        }
        if (!viewer.isDestroyed()) {
          viewer.scene.primitives.removeAll();
        }
        pointCloudOriginalCenterRef.current = null;
      } catch (cleanupErr) {
        console.warn("Lỗi dọn dẹp dự án cũ:", cleanupErr);
      }

      let longitude = project.centerLon || 106.8099;
      let latitude = project.centerLat || 10.8404;

      if (longitude < 90 && latitude > 90) {
        const temp = longitude;
        longitude = latitude;
        latitude = temp;
      }

      // 1. Nạp mô hình 3D model
      const loadOfflineModel = async () => {
        try {
          const modelUrl = project.modelUrl;
          if (!modelUrl) {
            console.log("Dự án này không có mô hình 3D Mesh.");
            const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 20);
            const targetSphere = new Cesium.BoundingSphere(position, 100.0);
            viewer.camera.flyToBoundingSphere(targetSphere, {
              duration: 3,
              offset: new Cesium.HeadingPitchRange(
                0,
                Cesium.Math.toRadians(-35),
                180
              )
            });
            return;
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
          setIsModelLoading(true);
          const model = await Cesium.Model.fromGltfAsync({
            url: modelUrl,
            modelMatrix: modelMatrix,
            scale: 1.0,
            // ── BEST PRACTICE (Cesium Community + gltf-pipeline guide) ──
            // incrementallyLoadTextures: model hiện ra ngay, texture stream vào dần
            // → tránh màn hình đen/trắng kéo dài trong lúc chờ texture decode
            incrementallyLoadTextures: true,
            // releaseGltfJson: giải phóng JSON buffer ngay sau khi parse xong
            // → tiết kiệm ~10-30% RAM trên mobile
            releaseGltfJson: true,
            // clampAnimations: nếu model có animation, clamp ở frame cuối khi hết
            // thay vì loop liên tục → giảm CPU usage nền
            clampAnimations: true,
          });

          if (!isCurrent || viewer.isDestroyed()) return;
          viewer.scene.primitives.add(model);
          modelRef.current = model;
          model.show = showModel;
          setIsModelLoading(false);

          const targetSphere = new Cesium.BoundingSphere(position, 200.0);
          viewer.camera.flyToBoundingSphere(targetSphere, {
            // Mobile: bay nhanh hơn để không block interaction
            duration: isMobile ? 1.5 : 2.5,
            offset: new Cesium.HeadingPitchRange(
              0,
              Cesium.Math.toRadians(-30),
              450
            )
          });

          // requestRenderMode: yêu cầu render 1 frame sau khi model load xong
          if (!(viewer as any).useDefaultRenderLoop) viewer.scene.requestRender();
        } catch (error) {
          setIsModelLoading(false);
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            console.error("Lỗi khi load mô hình 3D:", error);
          }
        }
      };

      // Hàm hỗ trợ: Áp dụng calibration offset cho một tileset
      const applyPcCalibration = (tileset: Cesium.Cesium3DTileset, targetPos: Cesium.Cartesian3) => {
        if (!tileset.boundingSphere) return;

        // Lưu center nguyên bản của tileset đầu tiên làm gốc tọa độ
        if (!pointCloudOriginalCenterRef.current) {
          pointCloudOriginalCenterRef.current = tileset.boundingSphere.center.clone();
        }
        const bsCenter = pointCloudOriginalCenterRef.current;

        let pcLon = 0, pcLat = 0, pcHeight = 0, pcHeading = 0, pcPitch = 0, pcRoll = 0;
        if (project.calibration) {
          try {
            const parsed = JSON.parse(project.calibration);
            pcLon = parsed.pcLon ?? 0;
            pcLat = parsed.pcLat ?? 0;
            pcHeight = parsed.pcHeight ?? 0;
            pcHeading = parsed.pcHeading ?? 0;
            pcPitch = parsed.pcPitch ?? 0;
            pcRoll = parsed.pcRoll ?? 0;
          } catch (e) { }
        } else {
          const saved = localStorage.getItem(`calibration_${project.id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              pcLon = parsed.pcLon ?? 0;
              pcLat = parsed.pcLat ?? 0;
              pcHeight = parsed.pcHeight ?? 0;
              pcHeading = parsed.pcHeading ?? 0;
              pcPitch = parsed.pcPitch ?? 0;
              pcRoll = parsed.pcRoll ?? 0;
            } catch (e) { }
          }
        }

        const offsetPos = Cesium.Cartesian3.fromDegrees(longitude + pcLon, latitude + pcLat, pcHeight);

        // Áp dụng rotation heading/pitch/roll cho point cloud
        const headingRad = Cesium.Math.toRadians(pcHeading);
        const pitchRad = Cesium.Math.toRadians(pcPitch);
        const rollRad = Cesium.Math.toRadians(pcRoll);
        const hpr = new Cesium.HeadingPitchRoll(headingRad, pitchRad, rollRad);

        const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(bsCenter);
        const ecefToEnu = Cesium.Matrix4.inverse(enuToEcef, new Cesium.Matrix4());
        const hprFixedFrame = Cesium.Transforms.headingPitchRollToFixedFrame(offsetPos, hpr);
        tileset.modelMatrix = Cesium.Matrix4.multiply(hprFixedFrame, ecefToEnu, new Cesium.Matrix4());

        console.log("📍 Đã định vị mây điểm chuẩn vị trí ban đầu!");
      };

      // 3. Nạp lớp đám mây điểm Point Cloud
      const loadPointCloud = async () => {
        const pcId = project.pointCloudId;
        if (!pcId) {
          console.log("Dự án này không có mây điểm Point Cloud.");
          return;
        }

        const targetPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);

        try {
          // Trường hợp 1: URL trỏ tới file COPC đơn (.copc.laz) hoặc tileset.json 3D Tiles
          if ((pcId.startsWith('http') || pcId.startsWith('/')) &&
            (pcId.endsWith('tileset.json') || pcId.endsWith('.laz') || pcId.endsWith('.copc.laz'))) {
            console.log("Nạp Point Cloud COPC/3DTiles từ URL:", pcId);
            const tileset = await Cesium.Cesium3DTileset.fromUrl(pcId);
            if (!isCurrent || viewer.isDestroyed()) return;
            viewer.scene.primitives.add(tileset);
            pointCloudRef.current = tileset;
            loadedPointCloudTilesetsRef.current = [tileset];
            tileset.show = showPointCloud;
            
            // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
            tileset.skipLevelOfDetail = true; // Bỏ qua LOD trung gian giúp giảm 50-70% request HTTP
            tileset.baseScreenSpaceError = 1024;
            tileset.skipScreenSpaceErrorFactor = 16;
            tileset.skipLevels = 1;
            tileset.immediatelyLoadDesiredLevelOfDetail = false; // Tải dần dần để tránh freeze trình duyệt
            (tileset as any).cullRequestsByFrustum = true;
            (tileset as any).preferLeaves = false;
            
            // Foveated Rendering: Giảm chi tiết ở vùng rìa mắt nhìn để tập trung tài nguyên vào tâm camera
            (tileset as any).foveatedScreenSpaceError = true;
            (tileset as any).foveatedConeSize = 0.3;
            (tileset as any).foveatedTimeDelay = 0.05;
            
            // MSSE: SSE càng lớn load càng nhanh. 16.0 cho desktop và 32.0 cho mobile là tỉ lệ vàng.
            tileset.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
            (tileset as any).maximumMemoryUsage = isMobile ? 256 : 1024; // Giới hạn VRAM cache
            
            // Point Cloud Shading: Attenuation tự động giãn cách/thu nhỏ điểm theo khoảng cách
            if (tileset.pointCloudShading) {
              tileset.pointCloudShading.attenuation = true;
              tileset.pointCloudShading.geometricErrorScale = 1.0;
              tileset.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
            }
            
            applyPcCalibration(tileset, targetPosition);
            return;
          }

          // Trường hợp 2: URL trỏ tới index.json (custom copc-tiles format)
          if ((pcId.startsWith('http') || pcId.startsWith('/')) && pcId.endsWith('index.json')) {
            console.log("Phát hiện custom copc-tiles index.json, đọc danh sách tiles:", pcId);
            try {
              const res = await fetch(pcId);
              const indexData = await res.json();

              if (indexData.type === 'copc-tiles' && Array.isArray(indexData.tiles) && indexData.tiles.length > 0) {
                const baseUrl = pcId.substring(0, pcId.lastIndexOf('/') + 1);
                const tilesToLoad = indexData.tiles.slice(0, Math.min(indexData.tiles.length, 5));
                console.log(`Nạp ${tilesToLoad.length}/${indexData.tiles.length} COPC tiles từ R2...`);

                let firstTileset: Cesium.Cesium3DTileset | null = null;
                loadedPointCloudTilesetsRef.current = [];
                for (const tileName of tilesToLoad) {
                  try {
                    const tileUrl = baseUrl + tileName;
                    const ts = await Cesium.Cesium3DTileset.fromUrl(tileUrl);
                    if (!isCurrent || viewer.isDestroyed()) return;
                    viewer.scene.primitives.add(ts);
                    ts.show = showPointCloud;
                    
                    // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
                    ts.skipLevelOfDetail = true;
                    ts.baseScreenSpaceError = 1024;
                    ts.skipScreenSpaceErrorFactor = 16;
                    ts.skipLevels = 1;
                    ts.immediatelyLoadDesiredLevelOfDetail = false;
                    (ts as any).cullRequestsByFrustum = true;
                    (ts as any).preferLeaves = false;
                    
                    (ts as any).foveatedScreenSpaceError = true;
                    (ts as any).foveatedConeSize = 0.3;
                    (ts as any).foveatedTimeDelay = 0.05;
                    ts.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
                    (ts as any).maximumMemoryUsage = isMobile ? 256 : 1024;

                    if (ts.pointCloudShading) {
                      ts.pointCloudShading.attenuation = true;
                      ts.pointCloudShading.geometricErrorScale = 1.0;
                      ts.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
                    }

                    loadedPointCloudTilesetsRef.current.push(ts);
                    if (!firstTileset) {
                      firstTileset = ts;
                      pointCloudRef.current = ts;
                      applyPcCalibration(ts, targetPosition);
                    } else {
                      if (pointCloudRef.current) {
                        ts.modelMatrix = pointCloudRef.current.modelMatrix.clone();
                      }
                    }
                  } catch (tileErr) {
                    console.warn(`Không thể load tile ${tileName}:`, tileErr);
                  }
                }
                if (firstTileset) return;
              }
            } catch (indexErr) {
              console.warn("Không thể đọc index.json, thử load trực tiếp:", indexErr);
            }
          }

          // Trường hợp 3: Cesium Ion Asset ID (số nguyên)
          if (!isNaN(parseInt(pcId))) {
            const pointCloudAssetId = parseInt(pcId);
            console.log("Nạp Point Cloud từ Cesium Ion Asset ID:", pointCloudAssetId);
            const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(pointCloudAssetId);
            if (!isCurrent || viewer.isDestroyed()) return;
            viewer.scene.primitives.add(tileset);
            pointCloudRef.current = tileset;
            loadedPointCloudTilesetsRef.current = [tileset];
            tileset.show = showPointCloud;
            
            // ── BEST PRACTICE TỐI ƯU POINT CLOUD 3D TILES ──
            tileset.skipLevelOfDetail = true;
            tileset.baseScreenSpaceError = 1024;
            tileset.skipScreenSpaceErrorFactor = 16;
            tileset.skipLevels = 1;
            tileset.immediatelyLoadDesiredLevelOfDetail = false;
            (tileset as any).cullRequestsByFrustum = true;
            (tileset as any).preferLeaves = false;
            
            (tileset as any).foveatedScreenSpaceError = true;
            (tileset as any).foveatedConeSize = 0.3;
            (tileset as any).foveatedTimeDelay = 0.05;
            tileset.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
            (tileset as any).maximumMemoryUsage = isMobile ? 256 : 1024;

            if (tileset.pointCloudShading) {
              tileset.pointCloudShading.attenuation = true;
              tileset.pointCloudShading.geometricErrorScale = 1.0;
              tileset.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
            }
            
            applyPcCalibration(tileset, targetPosition);
            return;
          }

          console.warn("Không nhận diện được định dạng pointCloudId:", pcId);
        } catch (error) {
          console.error("Lỗi khi load Point Cloud:", error);
        }
      };

      // Reset lazy load flag khi đổi project
      pointCloudLoadedRef.current = false;

      loadOfflineModel();

      // ── BEST PRACTICE: Lazy Load Point Cloud ──
      // Desktop: load ngay (không ảnh hưởng hiệu năng nhiều)
      // Mobile: CHỈ load khi user chủ động chuyển sang chế độ Point Cloud
      // → tránh crash do OOM (Out Of Memory) khi GPU phải xử lý cả model + PC cùng lúc
      if (!isMobile) {
        loadPointCloud();
      }
      // Mobile: loadPointCloudLazy() sẽ được gọi trong displayMode effect khi user bấm PC mode

      return () => {
        isCurrent = false;

        // Nếu component đang unmount (viewer chuẩn bị hủy), ta không cần remove từng phần tử
        // vì viewer.destroy() sẽ tự dọn dẹp WebGL ở tick tiếp theo.
        // Việc remove đồng bộ trong luồng click unmount là nguyên nhân gây crash texture/framebuffer.
        const isUnmounting = !viewerRef.current || viewerRef.current.isDestroyed();
        if (isUnmounting) {
          modelRef.current = null;
          pointCloudRef.current = null;
          loadedPointCloudTilesetsRef.current = [];
          domLayerRef.current = null;
          pointCloudOriginalCenterRef.current = null;
          return;
        }

        try {
          if (modelRef.current && !viewer.isDestroyed() && !modelRef.current.isDestroyed()) {
            viewer.scene.primitives.remove(modelRef.current);
            modelRef.current = null;
          }

          // Dọn dẹp tất cả các tilesets mây điểm đang nạp
          loadedPointCloudTilesetsRef.current.forEach(ts => {
            if (ts && !viewer.isDestroyed() && !ts.isDestroyed()) {
              viewer.scene.primitives.remove(ts);
            }
          });
          loadedPointCloudTilesetsRef.current = [];
          pointCloudRef.current = null;
          pointCloudOriginalCenterRef.current = null;

          if (domLayerRef.current && !viewer.isDestroyed() && !domLayerRef.current.isDestroyed()) {
            viewer.imageryLayers.remove(domLayerRef.current, true);
            domLayerRef.current = null;
          }
          if (!viewer.isDestroyed()) {
            viewer.scene.primitives.removeAll();
          }
        } catch (e) { }
      };
    }, [project]);

    // ── Hàm lazy load Point Cloud cho Mobile ──
    // Được gọi khi user lần đầu chuyển sang chế độ Point Cloud trên mobile
    const loadPointCloudLazy = async () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !project) return;

      let longitude = project.centerLon || 106.8099;
      let latitude = project.centerLat || 10.8404;
      if (longitude < 90 && latitude > 90) { const t = longitude; longitude = latitude; latitude = t; }

      const pcId = project.pointCloudId;
      if (!pcId) return;

      const targetPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);

      // Tái sử dụng hàm applyPcCalibration từ closure của useEffect project
      // (code này cần được inline vì nằm ngoài scope)
      const applyMatrix = (tileset: Cesium.Cesium3DTileset) => {
        if (!tileset.boundingSphere) return;
        if (!pointCloudOriginalCenterRef.current) {
          pointCloudOriginalCenterRef.current = tileset.boundingSphere.center.clone();
        }
        const bsCenter = pointCloudOriginalCenterRef.current;
        let pcLon = 0, pcLat = 0, pcHeight = 0, pcHeading = 0, pcPitch = 0, pcRoll = 0;
        if (project.calibration) {
          try { const p = JSON.parse(project.calibration); pcLon=p.pcLon??0; pcLat=p.pcLat??0; pcHeight=p.pcHeight??0; pcHeading=p.pcHeading??0; pcPitch=p.pcPitch??0; pcRoll=p.pcRoll??0; } catch(e){}
        }
        const offsetPos = Cesium.Cartesian3.fromDegrees(longitude + pcLon, latitude + pcLat, pcHeight);
        const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(pcHeading), Cesium.Math.toRadians(pcPitch), Cesium.Math.toRadians(pcRoll));
        const enuToEcef = Cesium.Transforms.eastNorthUpToFixedFrame(bsCenter);
        const ecefToEnu = Cesium.Matrix4.inverse(enuToEcef, new Cesium.Matrix4());
        const hprFixedFrame = Cesium.Transforms.headingPitchRollToFixedFrame(offsetPos, hpr);
        tileset.modelMatrix = Cesium.Matrix4.multiply(hprFixedFrame, ecefToEnu, new Cesium.Matrix4());
      };

      try {
        let tileset: Cesium.Cesium3DTileset | null = null;
        if ((pcId.startsWith('http') || pcId.startsWith('/')) && (pcId.endsWith('tileset.json') || pcId.endsWith('.laz') || pcId.endsWith('.copc.laz'))) {
          tileset = await Cesium.Cesium3DTileset.fromUrl(pcId);
        } else if (!isNaN(parseInt(pcId))) {
          tileset = await Cesium.Cesium3DTileset.fromIonAssetId(parseInt(pcId));
        }
        if (!tileset || viewer.isDestroyed()) return;
        viewer.scene.primitives.add(tileset);
        pointCloudRef.current = tileset;
        loadedPointCloudTilesetsRef.current = [tileset];
        tileset.show = true;
        
        // ── BEST PRACTICE TỐI ƯU POINT CLOUD TRONG CHẾ ĐỘ LAZY LOAD ──
        tileset.skipLevelOfDetail = true;
        tileset.baseScreenSpaceError = 1024;
        tileset.skipScreenSpaceErrorFactor = 16;
        tileset.skipLevels = 1;
        tileset.immediatelyLoadDesiredLevelOfDetail = false;
        tileset.maximumScreenSpaceError = isMobile ? 32.0 : 16.0;
        (tileset as any).maximumMemoryUsage = isMobile ? 256 : 1024;

        if (tileset.pointCloudShading) {
          tileset.pointCloudShading.attenuation = true;
          tileset.pointCloudShading.geometricErrorScale = 1.0;
          tileset.pointCloudShading.maximumAttenuation = isMobile ? 2.0 : 4.0;
        }

        applyMatrix(tileset);
        handleFocusPointCloud();
        viewer.scene.requestRender();
      } catch(e) {
        pointCloudLoadedRef.current = false; // Reset để có thể thử lại
        console.error("Lazy load PC thất bại:", e);
      }
    };

    // Xử lý bật tắt hiển thị mô hình 3D
    useEffect(() => {
      if (modelRef.current) {
        modelRef.current.show = showModel;
      }
    }, [showModel]);

    // Xử lý bật tắt hiển thị ảnh DOM
    useEffect(() => {
      if (domLayerRef.current) {
        domLayerRef.current.show = showDom;
      }
    }, [showDom]);

    // Xử lý bật tắt hiển thị Đám mây điểm Point Cloud
    useEffect(() => {
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.show = showPointCloud;
        }
      });
    }, [showPointCloud]);

    // Cập nhật Style Point Cloud (Point Size, Opacity, và Point Budget Thinning Filter trên GPU)
    useEffect(() => {
      const minB = minPointBudget || 100_000;
      const maxB = maxPointBudget || 12_000_000;
      const ratio = Math.max(0.01, Math.min(1.0, (pointBudget - minB) / Math.max(1, maxB - minB)));

      const styleOptions: Record<string, unknown> = {
        pointSize: pointSize,
      };

      // Khi giảm budget (< 98%), áp dụng thuật toán băm tọa độ (Spatial Hash Point Thinning)
      // ngay trên GPU Shader để làm thưa/dày điểm tức thì ở 60 FPS theo đúng tỷ lệ Budget
      if (ratio < 0.98) {
        styleOptions.show = `(fract(abs(\${POSITION}[0] * 12.9898 + \${POSITION}[1] * 78.233 + \${POSITION}[2] * 45.164))) <= ${ratio.toFixed(4)}`;
      } else {
        styleOptions.show = true;
      }

      // Chỉ áp dụng opacity khi < 1.0 (tránh override không cần thiết)
      if (edlOpacity < 1.0) {
        // "${COLOR}" → màu gốc từ dữ liệu điểm (RGB); nhân với white+alpha để điều chỉnh độ trong suốt
        styleOptions.color = `\${COLOR} * color('white', ${edlOpacity.toFixed(2)})`;
      }

      const style = new Cesium.Cesium3DTileStyle(styleOptions);
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.style = style;
        }
      });

      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.requestRender();
      }
    }, [pointSize, edlOpacity, pointBudget, minPointBudget, maxPointBudget]);

    // Cập nhật Góc nhìn (Field of View)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        if (viewer.camera.frustum instanceof Cesium.PerspectiveFrustum) {
          viewer.camera.frustum.fov = Cesium.Math.toRadians(fov);
        }
      }
    }, [fov, isOrthographic]);

    // Cập nhật Shading (Eye Dome Lighting)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.enabled = edlEnabled;
      }
    }, [edlEnabled]);

    // Cập nhật EDL Radius
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.uniforms.screenSpaceRadius = edlRadius;
      }
    }, [edlRadius]);

    // Cập nhật EDL Strength
    useEffect(() => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
        (viewer.scene.postProcessStages as any).eyeDomeLighting.uniforms.strength = edlStrength;
      }
    }, [edlStrength]);

    // Cập nhật Background của scene
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      switch (background) {
        case 'sky':
          viewer.scene.globe.show = true;
          if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
          if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
          viewer.scene.backgroundColor = Cesium.Color.BLACK;
          break;
        case 'gradient':
          viewer.scene.globe.show = false;
          if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
          if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
          viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#090d16');
          break;
        case 'black':
          viewer.scene.globe.show = false;
          if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
          if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
          viewer.scene.backgroundColor = Cesium.Color.BLACK;
          break;
        case 'white':
          viewer.scene.globe.show = false;
          if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
          if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
          viewer.scene.backgroundColor = Cesium.Color.WHITE;
          break;
        case 'none':
          viewer.scene.globe.show = false;
          if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
          if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
          viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
          break;
      }
    }, [background]);

    // Cập nhật Quality (Standard vs High Quality):
    // - High Quality: Tăng độ phân giải hiển thị (Resolution Scale) theo tỷ lệ pixel màn hình,
    //   kích hoạt khử răng cưa FXAA, tăng chi tiết địa hình và bật Attenuation lấp đầy khoảng cách điểm.
    // - Standard: Giảm tải GPU, tối ưu tốc độ khung hình và tiết kiệm pin.
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const isHigh = quality === 'high';

      // 1. Resolution Scale & FXAA:
      // High Quality render sắc nét theo DPR thật của màn hình, Standard tối ưu 1.0 (hoặc 0.75 trên mobile)
      viewer.resolutionScale = isHigh 
        ? Math.max(1.0, Math.min(2.0, window.devicePixelRatio || 1.0)) 
        : (isMobile ? Math.min(1.0, 1.0 / (window.devicePixelRatio || 1)) : 1.0);

      if ((viewer.scene.postProcessStages as any).fxaa) {
        (viewer.scene.postProcessStages as any).fxaa.enabled = isHigh;
      }

      // 2. Globe & Terrain Screen Space Error:
      viewer.scene.globe.maximumScreenSpaceError = isHigh ? 1.33 : (isMobile ? 4.0 : 2.0);

      // 3. Point Cloud Shading Attenuation & LOD:
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.maximumScreenSpaceError = isHigh ? 2.0 : (isMobile ? 32.0 : 16.0);
          if (ts.pointCloudShading) {
            ts.pointCloudShading.attenuation = isHigh;
            ts.pointCloudShading.geometricErrorScale = isHigh ? 0.5 : 1.0;
            ts.pointCloudShading.maximumAttenuation = isHigh ? 8.0 : (isMobile ? 2.0 : 4.0);
          }
        }
      });

      viewer.scene.requestRender();
    }, [quality]);

    // Cập nhật Point Budget — điều khiển mật độ điểm và số lượng point cloud hiển thị thực tế
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const minB = minPointBudget || 100_000;
      const maxB = maxPointBudget || 12_000_000;
      const ratio = Math.max(0.0, Math.min(1.0, (pointBudget - minB) / Math.max(1, maxB - minB)));

      // 1. maximumScreenSpaceError (SSE):
      // Khi ratio = 1.0 (Max Budget) -> SSE = 0.3-0.5 (Tải chi tiết tối đa, phân giải toàn bộ các node lá sâu nhất)
      // Khi ratio = 0.0 (Min Budget) -> SSE = 48.0-64.0 (Chỉ hiển thị các node gốc/thô nhất, giảm 90%+ số điểm)
      const baseSSE = quality === 'high' ? 0.3 : 0.5;
      const maxSSE = quality === 'high' ? 48.0 : 64.0;
      const sse = baseSSE + Math.pow(1.0 - ratio, 2.2) * (maxSSE - baseSSE);

      // 2. geometricErrorScale: Khi budget cao -> giảm error scale để ép Cesium load thêm điểm
      const geomScale = 0.4 + Math.pow(1.0 - ratio, 1.5) * 2.6;

      // 3. Memory limit (MB): Cấp phát cache RAM/VRAM tương ứng số điểm
      const memMB = Math.round(128 + ratio * 3968); // 128MB đến 4096MB

      // 4. Skip Level of Detail tuning:
      const skipLevels = ratio > 0.85 ? 0 : Math.min(3, Math.round((1.0 - ratio) * 3));
      const skipFactor = ratio > 0.85 ? 1 : Math.round(1 + (1.0 - ratio) * 15);
      const immediateLOD = ratio > 0.85;

      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          ts.maximumScreenSpaceError = sse;
          (ts as any).maximumMemoryUsage = memMB;
          ts.skipLevels = skipLevels;
          ts.skipScreenSpaceErrorFactor = skipFactor;
          ts.immediatelyLoadDesiredLevelOfDetail = immediateLOD;

          if (ts.pointCloudShading) {
            ts.pointCloudShading.geometricErrorScale = geomScale;
          }
        }
      });

      // Lưu lại giá trị budget của project hiện tại vào localStorage
      if (project?.id) {
        localStorage.setItem(`pointBudget_${project.id}`, pointBudget.toString());
      }

      viewer.scene.requestRender();
    }, [pointBudget, minPointBudget, maxPointBudget, quality, project]);

    // Cập nhật Min Node Size — kích thước tối thiểu node hiển thị
    useEffect(() => {
      loadedPointCloudTilesetsRef.current.forEach(ts => {
        if (ts && !ts.isDestroyed()) {
          if (ts.pointCloudShading) {
            ts.pointCloudShading.maximumAttenuation = minNodeSize;
          }
        }
      });
    }, [minNodeSize]);

    // Lock View — tắt/bật điều khiển camera
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      viewer.scene.screenSpaceCameraController.enableInputs = !lockView;
      viewer.scene.screenSpaceCameraController.enableRotate = !lockView;
      viewer.scene.screenSpaceCameraController.enableTranslate = !lockView;
      viewer.scene.screenSpaceCameraController.enableZoom = !lockView;
      viewer.scene.screenSpaceCameraController.enableTilt = !lockView;
      viewer.scene.screenSpaceCameraController.enableLook = !lockView;
    }, [lockView]);

    // Cập nhật Hệ chiếu Camera (Perspective vs Orthographic)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      if (isOrthographic) {
        viewer.camera.switchToOrthographicFrustum();
      } else {
        viewer.camera.switchToPerspectiveFrustum();
      }
    }, [isOrthographic]);

    type ProfileSamplePlanItem = {
      distance: number;
      cartographic: Cesium.Cartographic;
      fallbackHeight: number;
    };

    const buildProfileSamplePlan = (
      controlPoints: Cesium.Cartesian3[],
      maxSamples = 220
    ): { items: ProfileSamplePlanItem[]; totalDistance: number } | null => {
      if (controlPoints.length < 2) return null;

      const segments: {
        geodesic: Cesium.EllipsoidGeodesic;
        length: number;
        startDistance: number;
        startHeight: number;
        endHeight: number;
      }[] = [];

      let totalDistance = 0;
      for (let i = 0; i < controlPoints.length - 1; i++) {
        const start = Cesium.Cartographic.fromCartesian(controlPoints[i]);
        const end = Cesium.Cartographic.fromCartesian(controlPoints[i + 1]);
        const geodesic = new Cesium.EllipsoidGeodesic(start, end);
        const length = geodesic.surfaceDistance;
        if (!Number.isFinite(length) || length < 0.01) continue;

        segments.push({
          geodesic,
          length,
          startDistance: totalDistance,
          startHeight: start.height,
          endHeight: end.height,
        });
        totalDistance += length;
      }

      if (segments.length === 0 || totalDistance < 0.01) return null;

      // Khoảng 1 mẫu/m, nhưng luôn có đủ điểm để biểu đồ mượt và giới hạn để
      // sampleHeightMostDetailed không tạo quá nhiều request.
      const sampleCount = Math.max(
        24,
        Math.min(maxSamples, Math.ceil(totalDistance / 1.0) + 1)
      );

      const items: ProfileSamplePlanItem[] = [];
      let segmentIndex = 0;

      for (let i = 0; i < sampleCount; i++) {
        const targetDistance =
          i === sampleCount - 1
            ? totalDistance
            : (totalDistance * i) / (sampleCount - 1);

        while (
          segmentIndex < segments.length - 1 &&
          targetDistance >
            segments[segmentIndex].startDistance + segments[segmentIndex].length
        ) {
          segmentIndex++;
        }

        const segment = segments[segmentIndex];
        const localDistance = Cesium.Math.clamp(
          targetDistance - segment.startDistance,
          0,
          segment.length
        );
        const t = segment.length > 0 ? localDistance / segment.length : 0;
        const cartographic = segment.geodesic.interpolateUsingSurfaceDistance(
          localDistance,
          new Cesium.Cartographic()
        );
        cartographic.height = 0;

        items.push({
          distance: targetDistance,
          cartographic,
          fallbackHeight:
            segment.startHeight +
            (segment.endHeight - segment.startHeight) * t,
        });
      }

      return { items, totalDistance };
    };

    const sampleProfileAlongPath = async (
      controlPoints: Cesium.Cartesian3[]
    ): Promise<Omit<ProfileResult, 'id'> | null> => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return null;

      const plan = buildProfileSamplePlan(controlPoints);
      if (!plan) return null;

      const queryPositions = plan.items.map(item =>
        Cesium.Cartographic.clone(item.cartographic)
      );

      const sampledByScene: Array<Cesium.Cartographic | undefined> =
        new Array(queryPositions.length).fill(undefined);

      // Ưu tiên lấy cao độ trực tiếp từ geometry trong Scene. Cesium hỗ trợ
      // globe/3D Tiles/primitives; width 1m giúp ổn định hơn với point cloud thưa.
      if (viewer.scene.sampleHeightSupported) {
        try {
          const sampled = await viewer.scene.sampleHeightMostDetailed(
            queryPositions.map(position => Cesium.Cartographic.clone(position)),
            [],
            1.0
          );
          sampled.forEach((position, index) => {
            if (position && Number.isFinite(position.height)) {
              sampledByScene[index] = position;
            }
          });
        } catch (error) {
          console.warn('Không thể sample profile từ Scene, thử terrain fallback:', error);
        }
      }

      // Những vị trí Scene không lấy được sẽ thử World Terrain nếu provider có availability.
      const missingIndices = sampledByScene
        .map((position, index) => (!position ? index : -1))
        .filter(index => index >= 0);

      const terrainHeights = new Map<number, number>();
      const terrainProvider = viewer.terrainProvider as Cesium.TerrainProvider & {
        availability?: unknown;
      };

      if (missingIndices.length > 0 && terrainProvider?.availability) {
        try {
          const terrainInputs = missingIndices.map(index =>
            Cesium.Cartographic.clone(plan.items[index].cartographic)
          );
          const terrainSamples = await Cesium.sampleTerrainMostDetailed(
            terrainProvider,
            terrainInputs
          );
          terrainSamples.forEach((position, localIndex) => {
            if (position && Number.isFinite(position.height)) {
              terrainHeights.set(missingIndices[localIndex], position.height);
            }
          });
        } catch (error) {
          console.warn('Không thể sample profile từ terrain:', error);
        }
      }

      let sceneSampleCount = 0;
      let terrainSampleCount = 0;
      let fallbackSampleCount = 0;

      const samples: ProfileSample[] = plan.items.map((item, index) => {
        const scenePosition = sampledByScene[index];
        let height = item.fallbackHeight;
        let source: ProfileSample['source'] = 'control';

        if (scenePosition && Number.isFinite(scenePosition.height)) {
          height = scenePosition.height;
          source = 'scene';
          sceneSampleCount++;
        } else if (terrainHeights.has(index)) {
          height = terrainHeights.get(index)!;
          source = 'terrain';
          terrainSampleCount++;
        } else {
          fallbackSampleCount++;
        }

        return {
          distance: item.distance,
          height,
          position: Cesium.Cartesian3.fromRadians(
            item.cartographic.longitude,
            item.cartographic.latitude,
            height
          ),
          source,
        };
      });

      if (samples.length < 2) return null;

      let elevationGain = 0;
      let elevationLoss = 0;
      for (let i = 1; i < samples.length; i++) {
        const delta = samples[i].height - samples[i - 1].height;
        if (delta > 0) elevationGain += delta;
        else elevationLoss += Math.abs(delta);
      }

      const heights = samples.map(sample => sample.height);

      return {
        samples,
        totalDistance: plan.totalDistance,
        minHeight: Math.min(...heights),
        maxHeight: Math.max(...heights),
        elevationGain,
        elevationLoss,
        sceneSampleCount,
        terrainSampleCount,
        fallbackSampleCount,
      };
    };

    const buildProfileChartPoints = (
      profile: ProfileResult,
      width = 520,
      height = 160,
      paddingX = 18,
      paddingY = 18
    ): string => {
      const distanceRange = Math.max(profile.totalDistance, 0.01);
      const heightRange = Math.max(profile.maxHeight - profile.minHeight, 0.01);
      const drawWidth = width - paddingX * 2;
      const drawHeight = height - paddingY * 2;

      return profile.samples
        .map(sample => {
          const x =
            paddingX + (sample.distance / distanceRange) * drawWidth;
          const y =
            height -
            paddingY -
            ((sample.height - profile.minHeight) / heightRange) * drawHeight;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    };

    const updateProfileSummaryLabel = (
      record: MeasurementRecord,
      profile: ProfileResult
    ) => {
      const summary = record.summaryLabelEntity;
      if (!summary?.label || record.points.length === 0) return;

      summary.position = new Cesium.ConstantPositionProperty(
        record.points[record.points.length - 1]
      );
      summary.label.text = new Cesium.ConstantProperty(
        `TRẮC DỌC: ${profile.totalDistance.toFixed(2)} m\n` +
        `Hmin: ${profile.minHeight.toFixed(2)} m | Hmax: ${profile.maxHeight.toFixed(2)} m\n` +
        `Tăng: ${profile.elevationGain.toFixed(2)} m | Giảm: ${profile.elevationLoss.toFixed(2)} m | ${profile.samples.length} mẫu`
      );
    };

    const refreshProfileRecord = async (record: MeasurementRecord) => {
      if (record.type !== 'profile' || record.points.length < 2) return;

      setIsProfileSampling(true);
      try {
        const sampled = await sampleProfileAlongPath(record.points);
        if (!sampled) return;

        const result: ProfileResult = {
          id: record.id,
          ...sampled,
        };
        record.profileSamples = sampled.samples;

        const sampledLine = record.lineEntities.find(
          entity => (entity as any)._isProfileSampleLine === true
        );
        if (sampledLine?.polyline) {
          sampledLine.polyline.positions = new Cesium.ConstantProperty(
            sampled.samples.map(sample => sample.position)
          );
        }

        updateProfileSummaryLabel(record, result);
        setActiveProfile(result);
        setMeasurementRevision(revision => revision + 1);
        persistMeasurementUpdate(record);

        const viewer = viewerRef.current;
        if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
      } finally {
        setIsProfileSampling(false);
      }
    };

    // Hàm cập nhật hình học thời gian thực khi kéo/tinh chỉnh điểm đo
    const updateMeasurementRecord = (record: MeasurementRecord) => {
      const { type, points, lineEntities, labelEntities, fillEntity, summaryLabelEntity } = record;

      if (type === 'area') {
        const n = points.length;
        for (let i = 0; i < n; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % n];
          const line = lineEntities[i] as any;
          if (line && line.polyline) {
            line.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          }
          const lbl = labelEntities[i] as any;
          if (lbl && lbl.label) {
            const dist = Cesium.Cartesian3.distance(p1, p2);
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(`${dist.toFixed(2)} m`);
          }
        }
        if (fillEntity && (fillEntity as any).polygon) {
          (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(points));
        }
        if (summaryLabelEntity && (summaryLabelEntity as any).label) {
          const finalArea = calculatePolygonArea(points);
          const centroid = calculateCentroid(points);
          summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
          (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
            `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
          );
        }
      } else if (type === 'distance') {
        let total3D = 0;
        let totalH = 0;
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const ca = Cesium.Cartographic.fromCartesian(p1);
          const cb = Cesium.Cartographic.fromCartesian(p2);
          const geo = new Cesium.EllipsoidGeodesic(ca, cb);
          const hDist = geo.surfaceDistance;
          const dz = cb.height - ca.height;
          total3D += Math.sqrt(hDist * hDist + dz * dz);
          totalH += hDist;

          const line = lineEntities[i] as any;
          if (line && line.polyline) {
            line.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          }
          const lbl = labelEntities[i] as any;
          if (lbl && lbl.label) {
            const dist = Cesium.Cartesian3.distance(p1, p2);
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(`${dist.toFixed(2)} m`);
          }
        }
        if (summaryLabelEntity && (summaryLabelEntity as any).label && points.length > 0) {
          summaryLabelEntity.position = new Cesium.ConstantPositionProperty(points[points.length - 1]) as any;
          (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
            `TỔNG 3D: ${total3D.toFixed(2)} m  |  H: ${totalH.toFixed(2)} m`
          );
        }
      } else if (type === 'height') {
        if (points.length >= 2) {
          const startPt = points[0];
          const endPt = points[1];
          const projPt = getProjectedPoint(startPt, endPt);

          const slantDist = Cesium.Cartesian3.distance(startPt, endPt);
          const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
          const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
          const cartoEnd = Cesium.Cartographic.fromCartesian(endPt);
          const heightDiff = cartoEnd.height - cartoStart.height;

          const slantLine = lineEntities[0] as any;
          const horizLine = lineEntities[1] as any;
          const vertLine = lineEntities[2] as any;
          if (slantLine && slantLine.polyline) slantLine.polyline.positions = new Cesium.ConstantProperty([startPt, endPt]);
          if (horizLine && horizLine.polyline) horizLine.polyline.positions = new Cesium.ConstantProperty([startPt, projPt]);
          if (vertLine && vertLine.polyline) vertLine.polyline.positions = new Cesium.ConstantProperty([projPt, endPt]);

          if (fillEntity && (fillEntity as any).polygon) {
            (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy([startPt, projPt, endPt]));
          }

          const dzBadge = labelEntities[0] as any;
          const hBadge = labelEntities[1] as any;
          const sBadge = labelEntities[2] as any;
          if (dzBadge && dzBadge.label) {
            dzBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(projPt, endPt));
            dzBadge.label.text = new Cesium.ConstantProperty(`CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`);
          }
          if (hBadge && hBadge.label) {
            hBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(startPt, projPt));
            hBadge.label.text = new Cesium.ConstantProperty(`Ngang: ${horizDist.toFixed(2)} m`);
          }
          if (sBadge && sBadge.label) {
            sBadge.position = new Cesium.ConstantPositionProperty(getMidpoint(startPt, endPt));
            sBadge.label.text = new Cesium.ConstantProperty(`Xiên: ${slantDist.toFixed(2)} m`);
          }
        }
      } else if (type === 'point') {
        const lbl = labelEntities[0] as any;
        if (points.length >= 1 && lbl && lbl.label) {
          const carto = Cesium.Cartographic.fromCartesian(points[0]);
          const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
          const height = carto.height.toFixed(2);
          lbl.position = new Cesium.ConstantPositionProperty(points[0]);
          lbl.label.text = new Cesium.ConstantProperty(`X: ${lon}°\nY: ${lat}°\nZ: ${height} m`);
        }
      } else if (type === 'angle') {
        if (points.length === 3) {
          const [p1, p2, p3] = points;
          const l1 = lineEntities[0] as any;
          const l2 = lineEntities[1] as any;
          if (l1 && l1.polyline) l1.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          if (l2 && l2.polyline) l2.polyline.positions = new Cesium.ConstantProperty([p2, p3]);
          const angleDeg = calculateAngleDegrees(p1, p2, p3);
          if (angleDeg === null) return;
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(p2);
            lbl.label.text = new Cesium.ConstantProperty(`GÓC: ${angleDeg.toFixed(2)}°`);
          }
        }
      } else if (type === 'circle') {
        if (points.length >= 2) {
          const [center, edge] = points;
          const radius = Cesium.Cartesian3.distance(center, edge);
          const circleArea = Math.PI * radius * radius;
          if (fillEntity?.ellipse) {
            fillEntity.position = new Cesium.ConstantPositionProperty(center);
            fillEntity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius);
            fillEntity.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius);
          }
          const l = lineEntities[0] as any;
          if (l && l.polyline) l.polyline.positions = new Cesium.ConstantProperty([center, edge]);
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(center, edge));
            lbl.label.text = new Cesium.ConstantProperty(
              `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH: ${circleArea.toFixed(2)} m²`
            );
          }
        }
      } else if (type === 'sphere') {
        if (points.length >= 2) {
          const [center, edge] = points;
          const radius = Cesium.Cartesian3.distance(center, edge);
          const surfaceArea = 4 * Math.PI * radius * radius;
          const sphereVolume = (4 / 3) * Math.PI * radius * radius * radius;
          const line = lineEntities[0];
          if (line?.polyline) line.polyline.positions = new Cesium.ConstantProperty([center, edge]);
          if (fillEntity?.ellipsoid) {
            fillEntity.position = new Cesium.ConstantPositionProperty(center);
            fillEntity.ellipsoid.radii = new Cesium.ConstantProperty(new Cesium.Cartesian3(radius, radius, radius));
          }
          const label = labelEntities[0];
          if (label?.label) {
            label.position = new Cesium.ConstantPositionProperty(getMidpoint(center, edge));
            label.label.text = new Cesium.ConstantProperty(
              `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH MẶT CẦU: ${surfaceArea.toFixed(2)} m²\nTHỂ TÍCH: ${sphereVolume.toFixed(2)} m³`
            );
          }
        }
      } else if (type === 'azimuth') {
        if (points.length >= 2) {
          const [p1, p2] = points;
          const c1 = Cesium.Cartographic.fromCartesian(p1);
          const c2 = Cesium.Cartographic.fromCartesian(p2);
          const geodesic = new Cesium.EllipsoidGeodesic(c1, c2);
          const azimuthDeg = (Cesium.Math.toDegrees(geodesic.startHeading) + 360) % 360;
          const dist = geodesic.surfaceDistance;
          const l = lineEntities[0] as any;
          if (l && l.polyline) l.polyline.positions = new Cesium.ConstantProperty([p1, p2]);
          const lbl = labelEntities[0] as any;
          if (lbl && lbl.label) {
            lbl.position = new Cesium.ConstantPositionProperty(getMidpoint(p1, p2));
            lbl.label.text = new Cesium.ConstantProperty(
              `AZIMUTH: ${azimuthDeg.toFixed(2)}° | Khoảng cách: ${dist.toFixed(2)} m`
            );
          }
        }
      } else if (type === 'annotation') {
        const lbl = labelEntities[0] as any;
        if (points.length >= 1 && lbl) {
          lbl.position = new Cesium.ConstantPositionProperty(points[0]);
        }
      } else if (type === 'volume') {
        if (points.length >= 3) {
          const area = calculatePolygonArea(points);
          const centroid = calculateCentroid(points);
          const heights = points.map(p => Cesium.Cartographic.fromCartesian(p).height);
          const hMin = Math.min(...heights);
          const hMax = Math.max(...heights);
          const deltaH = Math.max(0, hMax - hMin);
          const volume = area * deltaH;
          if (fillEntity && (fillEntity as any).polygon) {
            (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(points));
            (fillEntity as any).polygon.extrudedHeight = new Cesium.ConstantProperty(hMax);
          }
          if (summaryLabelEntity && (summaryLabelEntity as any).label) {
            summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
            (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
              `THỂ TÍCH LĂNG TRỤ ƯỚC TÍNH: ${volume.toFixed(2)} m³\nDiện tích: ${area.toFixed(2)} m² | ΔH: ${deltaH.toFixed(2)} m`
            );
          }
        }
      } else if (type === 'profile') {
        if (points.length >= 2) {
          const controlLines = lineEntities.filter(
            entity => (entity as any)._isProfileSampleLine !== true
          );
          for (let i = 0; i < points.length - 1; i++) {
            const line = controlLines[i];
            if (line?.polyline) {
              line.polyline.positions = new Cesium.ConstantProperty([
                points[i],
                points[i + 1],
              ]);
            }
          }
        }
      }
    };

    const hydrateMeasurementRecord = (persisted: Awaited<ReturnType<typeof fetchProjectMeasurements>>[number]): MeasurementRecord | null => {
      const viewer = viewerRef.current;
      const data = deserializeMeasurement(persisted);
      if (!viewer || viewer.isDestroyed() || !data) return null;
      const pointEntities: Cesium.Entity[] = [];
      const lineEntities: Cesium.Entity[] = [];
      const labelEntities: Cesium.Entity[] = [];
      let fillEntity: Cesium.Entity | undefined;
      let summaryLabelEntity: Cesium.Entity | undefined;
      const show = showMeasurements && data.visible;
      const add = (options: Cesium.Entity.ConstructorOptions) => {
        const entity = viewer.entities.add({ ...options, show });
        measurementEntitiesRef.current.push(entity);
        return entity;
      };
      const addPoint = (position: Cesium.Cartesian3, index: number) => {
        const entity = add({
          position,
          billboard: {
            image: MEASUREMENT_RING_DOT_IMAGE, width: 9, height: 9,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        (entity as any)._isMeasurePoint = true;
        (entity as any)._measureId = data.id;
        (entity as any)._pointIndex = index;
        pointEntities.push(entity);
      };
      const addLine = (positions: Cesium.Cartesian3[]) => {
        const entity = add({ polyline: {
          positions, width: 4,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromCssColorString('#00e5ff'),
            outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5
          })
        } });
        lineEntities.push(entity);
        return entity;
      };
      const addLabel = (position: Cesium.Cartesian3, text: string) => {
        const entity = add({ position, label: {
          text, font: 'bold 13px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2.5,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE, showBackground: true,
          backgroundColor: new Cesium.Color(0.02, 0.2, 0.28, 0.94),
          backgroundPadding: new Cesium.Cartesian2(10, 5),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } });
        labelEntities.push(entity);
        return entity;
      };

      data.points.forEach(addPoint);
      const points = data.points;
      const labelAt = (index: number, fallback = '') => data.labelTexts[index] ?? fallback;

      if (data.type === 'area') {
        points.forEach((point, index) => {
          const next = points[(index + 1) % points.length];
          addLine([point, next]);
          addLabel(getMidpoint(point, next), labelAt(index, `${Cesium.Cartesian3.distance(point, next).toFixed(2)} m`));
        });
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy(points), material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22) } });
        summaryLabelEntity = addLabel(calculateCentroid(points), data.label ?? getMeasurementValue({ id: data.id, type: data.type, points, pointEntities, lineEntities, labelEntities }));
        labelEntities.pop();
      } else if (data.type === 'distance') {
        for (let index = 1; index < points.length; index++) {
          addLine([points[index - 1], points[index]]);
          addLabel(getMidpoint(points[index - 1], points[index]), labelAt(index - 1));
        }
        summaryLabelEntity = addLabel(points.at(-1)!, data.label ?? '');
        labelEntities.pop();
      } else if (data.type === 'height' && points.length >= 2) {
        const projected = getProjectedPoint(points[0], points[1]);
        addLine([points[0], points[1]]); addLine([points[0], projected]); addLine([projected, points[1]]);
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy([points[0], projected, points[1]]), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.12) } });
        addLabel(getMidpoint(projected, points[1]), labelAt(0));
        addLabel(getMidpoint(points[0], projected), labelAt(1));
        addLabel(getMidpoint(points[0], points[1]), labelAt(2));
      } else if (data.type === 'angle' && points.length === 3) {
        addLine([points[0], points[1]]); addLine([points[1], points[2]]);
        addLabel(points[1], data.label ?? labelAt(0));
      } else if (data.type === 'point') {
        addLabel(points[0], data.label ?? labelAt(0));
      } else if ((data.type === 'circle' || data.type === 'sphere') && points.length >= 2) {
        const radius = Cesium.Cartesian3.distance(points[0], points[1]);
        addLine([points[0], points[1]]);
        fillEntity = data.type === 'circle'
          ? add({ position: points[0], ellipse: { semiMajorAxis: radius, semiMinorAxis: radius, material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff') } })
          : add({ position: points[0], ellipsoid: { radii: new Cesium.Cartesian3(radius, radius, radius), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff') } });
        addLabel(getMidpoint(points[0], points[1]), data.label ?? labelAt(0));
      } else if (data.type === 'azimuth' && points.length >= 2) {
        addLine([points[0], points[1]]);
        addLabel(getMidpoint(points[0], points[1]), data.label ?? labelAt(0));
      } else if (data.type === 'annotation') {
        addLabel(points[0], data.label ?? labelAt(0, 'Ghi chú 3D'));
      } else if (data.type === 'volume' && points.length >= 3) {
        const maxHeight = Math.max(...points.map(point => Cesium.Cartographic.fromCartesian(point).height));
        fillEntity = add({ polygon: { hierarchy: new Cesium.PolygonHierarchy(points), material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.35), outline: true, outlineColor: Cesium.Color.fromCssColorString('#00e5ff'), extrudedHeight: maxHeight } });
        summaryLabelEntity = addLabel(calculateCentroid(points), data.label ?? '');
        labelEntities.pop();
      } else if (data.type === 'profile' && points.length >= 2) {
        for (let index = 1; index < points.length; index++) {
          addLine([points[index - 1], points[index]]);
        }
        const sampledPositions = data.profileSamples?.map(sample => sample.position) ?? points;
        const sampledLine = addLine(sampledPositions);
        (sampledLine as any)._isProfileSampleLine = true;
        summaryLabelEntity = addLabel(points.at(-1)!, data.label ?? '');
        labelEntities.pop();
      }

      const record: MeasurementRecord = {
        id: data.id, type: data.type, points, pointEntities, lineEntities, labelEntities,
        fillEntity, summaryLabelEntity, profileSamples: data.profileSamples,
        visible: data.visible, isFinalized: true
      };
      if (data.type !== 'profile' && data.type !== 'annotation') updateMeasurementRecord(record);
      return record;
    };

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      if (!projectId || !project) {
        hydratedMeasurementsProjectRef.current = null;
        return;
      }
      if (hydratedMeasurementsProjectRef.current === projectId) return;

      // A project switch replaces only the local measurement layer. It must not
      // invoke the backend Clear endpoint for the project being left.
      measurementEntitiesRef.current.forEach(entity => {
        try { viewer.entities.remove(entity); } catch (_error) {}
      });
      measurementEntitiesRef.current = [];
      measurementsStoreRef.current = [];
      setMeasurementPoints([]);
      setActiveProfile(null);
      hydratedMeasurementsProjectRef.current = projectId;
      let cancelled = false;
      void fetchProjectMeasurements(projectId)
        .then(records => {
          if (cancelled) return;
          records.forEach(persisted => {
            const record = hydrateMeasurementRecord(persisted);
            if (record) measurementsStoreRef.current.push(record);
          });
          setMeasurementRevision(revision => revision + 1);
          viewer.scene.requestRender();
        })
        .catch(error => {
          if (hydratedMeasurementsProjectRef.current === projectId) {
            hydratedMeasurementsProjectRef.current = null;
          }
          console.error('[Measurement persistence] load:', error);
        });
      return () => { cancelled = true; };
      // Hydration is intentionally keyed by project identity only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, project]);

    // Helper bắt tọa độ 3D thông minh
    const getPickedPosition = (windowPosition: Cesium.Cartesian2): Cesium.Cartesian3 | null => {
      const v = viewerRef.current;
      if (!v || v.isDestroyed() || !windowPosition) return null;
      const scene = v.scene;
      if (scene.pickPositionSupported) {
        try {
          const picked = scene.pickPosition(windowPosition);
          if (Cesium.defined(picked)) return Cesium.Cartesian3.clone(picked);
        } catch (e) {}
      }
      try {
        const ray = scene.camera.getPickRay(windowPosition);
        if (ray) {
          const globePos = scene.globe.pick(ray, scene);
          if (Cesium.defined(globePos)) return Cesium.Cartesian3.clone(globePos);
          const ellipsoidPos = scene.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
          if (Cesium.defined(ellipsoidPos)) return Cesium.Cartesian3.clone(ellipsoidPos);
        }
      } catch (e) {}
      return null;
    };

    // ─────────────────────────────────────────────────────────────
    // EFFECT 1: TẠO VÀ CHỐT PHÉP ĐO MỚI (CLICK-TO-MEASURE POTREE V1.8)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }

      if (toolMode === 'none') {
        viewer.scene.screenSpaceCameraController.enableInputs = true;
        setMeasurementPoints([]);
        return;
      }

      viewer.scene.screenSpaceCameraController.enableInputs = true;

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handlerRef.current = handler;

      const recordId = `measure_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let activePoints: Cesium.Cartesian3[] = [];
      let tempEntities: Cesium.Entity[] = [];

      const pointEntities: Cesium.Entity[] = [];
      const lineEntities: Cesium.Entity[] = [];
      const labelEntities: Cesium.Entity[] = [];
      let fillEntity: Cesium.Entity | undefined;
      let summaryLabelEntity: Cesium.Entity | undefined;
      let measurementFinalized = false;

      const currentRecord: MeasurementRecord = {
        id: recordId,
        type: toolMode,
        points: activePoints,
        pointEntities,
        lineEntities,
        labelEntities,
        fillEntity,
        summaryLabelEntity
      };
      measurementsStoreRef.current.push(currentRecord);

      const finalizeCurrentRecord = (record: MeasurementRecord) => {
        Object.assign(currentRecord, record, { visible: true, isFinalized: true });
        measurementFinalized = true;
        setMeasurementRevision(revision => revision + 1);
        if (projectId) {
          const payload = serializeMeasurementRecord(currentRecord);
          enqueueMeasurementPersistence(currentRecord.id, () => createProjectMeasurement(projectId, payload));
        }
      };

      const clearTempEntities = () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        tempEntities.forEach(ent => {
          try {
            v.entities.remove(ent);
            measurementEntitiesRef.current = measurementEntitiesRef.current.filter(e => e !== ent);
          } catch (e) {}
        });
        tempEntities = [];
      };

      const safeAdd = (entityOpts: Cesium.Entity.ConstructorOptions, isTemp = false): Cesium.Entity | null => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return null;
        try {
          const entity = v.entities.add(entityOpts);
          measurementEntitiesRef.current.push(entity);
          if (isTemp) tempEntities.push(entity);
          return entity;
        } catch (e) {
          return null;
        }
      };

      // Chuột phải: Hủy đo đạc dở dang
      handler.setInputAction(() => {
        clearTempEntities();
        activePoints = [];
        setMeasurementPoints([]);
        measurementsStoreRef.current = measurementsStoreRef.current.filter(m => m.id !== recordId);
        setToolMode('none');
        viewer.scene.requestRender();
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      // Helper tạo điểm chốt đỏ nổi bật có gắn metadata tinh chỉnh
      const addMeasurePoint = (pos: Cesium.Cartesian3, pointIdx: number, _colorHex = '#ff0055', _size = 9) => {
        const entity = safeAdd({
          position: pos,
          billboard: {
            image: MEASUREMENT_RING_DOT_IMAGE,
            width: 9,
            height: 9,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        if (entity) {
          (entity as any)._isMeasurePoint = true;
          (entity as any)._measureId = recordId;
          (entity as any)._pointIndex = pointIdx;
          pointEntities.push(entity);
        }
        return entity;
      };

      // Helper tạo nhãn đo khoảng cách cạnh
      const addEdgeDistanceBadge = (p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, text?: string, isTemp = false) => {
        const dist = Cesium.Cartesian3.distance(p1, p2);
        const labelText = text || `${dist.toFixed(2)} m`;
        return safeAdd({
          position: getMidpoint(p1, p2),
          label: {
            text: labelText,
            font: 'bold 13px "JetBrains Mono", sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2.5,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
            backgroundPadding: new Cesium.Cartesian2(9, 5),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, -14),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        }, isTemp);
      };

      // ─────────────────────────────────────────────────────────────
      // ─────────────────────────────────────────────────────────────
      // 1. ĐO DIỆN TÍCH (AREA)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'area') {
        let closingLineEntity: Cesium.Entity | undefined;
        let closingLabelEntity: Cesium.Entity | undefined;
        let lastAreaClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const lastPt = activePoints[activePoints.length - 1];
          const firstPt = activePoints[0];

          // Đường dóng từ điểm cuối đến vị trí chuột hiện tại
          safeAdd({
            polyline: {
              positions: [lastPt, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), dashLength: 8 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.6), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(lastPt, mousePos, undefined, true);

          // Khi đã có từ 2 điểm (chuột đang là điểm thứ 3 trở lên): dóng khép kín về điểm đầu và hiển thị diện tích xem trước
          if (activePoints.length >= 2) {
            safeAdd({
              polyline: {
                positions: [mousePos, firstPt],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.8), dashLength: 8 }),
                depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.5), dashLength: 8 })
              }
            }, true);
            addEdgeDistanceBadge(mousePos, firstPt, undefined, true);

            const polygonHierarchy = [...activePoints, mousePos];
            safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(polygonHierarchy),
                material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.18),
                outline: false
              }
            }, true);

          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (
            lastAreaClick &&
            clickTime - lastAreaClick.time < 500 &&
            Cesium.Cartesian2.distance(lastAreaClick.position, click.position) < 5
          ) return;
          lastAreaClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(pt, idx);

          // Nối cạnh cố định giữa điểm trước và điểm vừa click
          if (activePoints.length >= 2) {
            const pPrev = activePoints[activePoints.length - 2];
            const pCurr = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [pPrev, pCurr],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) {
              const closingIndex = closingLineEntity ? lineEntities.indexOf(closingLineEntity) : -1;
              if (closingIndex >= 0) lineEntities.splice(closingIndex, 0, line);
              else lineEntities.push(line);
            }
            const badge = addEdgeDistanceBadge(pPrev, pCurr);
            if (badge) {
              const closingIndex = closingLabelEntity ? labelEntities.indexOf(closingLabelEntity) : -1;
              if (closingIndex >= 0) labelEntities.splice(closingIndex, 0, badge);
              else labelEntities.push(badge);
            }
          }

          // Bắt đầu từ điểm thứ 3 trở lên (activePoints.length >= 3):
          // Ngay lập tức kết nối đa giác các điểm đã có và tính diện tích
          if (activePoints.length >= 3) {
            const firstPt = activePoints[0];
            const lastPt = activePoints[activePoints.length - 1];

            if (!closingLineEntity) {
              closingLineEntity = safeAdd({
                polyline: {
                  positions: [lastPt, firstPt],
                  width: 4.5,
                  material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                  depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
                }
              }) || undefined;
              if (closingLineEntity) lineEntities.push(closingLineEntity);
            } else if (closingLineEntity.polyline) {
              closingLineEntity.polyline.positions = new Cesium.ConstantProperty([lastPt, firstPt]);
            }

            if (!closingLabelEntity) {
              closingLabelEntity = addEdgeDistanceBadge(lastPt, firstPt) || undefined;
              if (closingLabelEntity) labelEntities.push(closingLabelEntity);
            } else if (closingLabelEntity.label) {
              closingLabelEntity.position = new Cesium.ConstantPositionProperty(getMidpoint(lastPt, firstPt));
              closingLabelEntity.label.text = new Cesium.ConstantProperty(
                `${Cesium.Cartesian3.distance(lastPt, firstPt).toFixed(2)} m`
              );
            }

            const curArea = calculatePolygonArea(activePoints);
            const curCentroid = calculateCentroid(activePoints);

            // Cập nhật hoặc tạo mặt phẳng đa giác cố định cho các điểm đã chốt
            if (!fillEntity) {
              fillEntity = safeAdd({
                polygon: {
                  hierarchy: new Cesium.PolygonHierarchy(activePoints),
                  material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22),
                  outline: false
                }
              }) || undefined;
            } else if ((fillEntity as any).polygon) {
              (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(activePoints));
            }

            // Cập nhật hoặc tạo nhãn diện tích cố định tại trọng tâm
            if (!summaryLabelEntity) {
              summaryLabelEntity = safeAdd({
                position: curCentroid,
                label: {
                  text: `DIỆN TÍCH: ${curArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`,
                  font: 'bold 15px "JetBrains Mono", sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2.5,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  showBackground: true,
                  backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                  backgroundPadding: new Cesium.Cartesian2(14, 7),
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              }) || undefined;
            } else if ((summaryLabelEntity as any).label) {
              summaryLabelEntity.position = new Cesium.ConstantPositionProperty(curCentroid) as any;
              (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
                `DIỆN TÍCH: ${curArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
              );
            }
          }

          clearTempEntities();
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Nhấp đúp chuột để chốt và hoàn tất đo diện tích
        handler.setInputAction(() => {
          clearTempEntities();
          if (activePoints.length >= 3) {
            const firstPt = activePoints[0];
            const lastPt = activePoints[activePoints.length - 1];
            if (!closingLineEntity) {
              closingLineEntity = safeAdd({
                polyline: {
                  positions: [lastPt, firstPt],
                  width: 4.5,
                  material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                  depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
                }
              }) || undefined;
              if (closingLineEntity) lineEntities.push(closingLineEntity);
            }
            if (!closingLabelEntity) {
              closingLabelEntity = addEdgeDistanceBadge(lastPt, firstPt) || undefined;
              if (closingLabelEntity) labelEntities.push(closingLabelEntity);
            }

            if (!fillEntity) {
              fillEntity = safeAdd({
                polygon: {
                  hierarchy: new Cesium.PolygonHierarchy(activePoints),
                  material: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.22),
                  outline: false
                }
              }) || undefined;
            } else if ((fillEntity as any).polygon) {
              (fillEntity as any).polygon.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(activePoints));
            }

            const finalArea = calculatePolygonArea(activePoints);
            const centroid = calculateCentroid(activePoints);
            if (!summaryLabelEntity) {
              summaryLabelEntity = safeAdd({
                position: centroid,
                label: {
                  text: `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`,
                  font: 'bold 15px "JetBrains Mono", sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2.5,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  showBackground: true,
                  backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                  backgroundPadding: new Cesium.Cartesian2(14, 7),
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
              }) || undefined;
            } else if ((summaryLabelEntity as any).label) {
              summaryLabelEntity.position = new Cesium.ConstantPositionProperty(centroid) as any;
              (summaryLabelEntity as any).label.text = new Cesium.ConstantProperty(
                `DIỆN TÍCH: ${finalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
              );
            }

            finalizeCurrentRecord({
              id: recordId,
              type: 'area',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity,
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 2. ĐO KHOẢNG CÁCH (DISTANCE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'distance') {
        let lastDistanceClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const lastPt = activePoints[activePoints.length - 1];
          const distSegment = Cesium.Cartesian3.distance(lastPt, mousePos);
          let totalDist = 0;
          for (let i = 0; i < activePoints.length - 1; i++) { totalDist += Cesium.Cartesian3.distance(activePoints[i], activePoints[i + 1]); }
          totalDist += distSegment;
          safeAdd({
            polyline: {
              positions: [lastPt, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), dashLength: 8 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.6), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(lastPt, mousePos, `+${distSegment.toFixed(2)} m (Tổng: ${totalDist.toFixed(2)} m)`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (lastDistanceClick && clickTime - lastDistanceClick.time < 500 && Cesium.Cartesian2.distance(lastDistanceClick.position, click.position) < 5) return;
          lastDistanceClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(pt, idx);

          if (activePoints.length >= 2) {
            const pPrev = activePoints[activePoints.length - 2];
            const pCurr = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [pPrev, pCurr],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);
            const badge = addEdgeDistanceBadge(pPrev, pCurr);
            if (badge) labelEntities.push(badge);
          }
          clearTempEntities();
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(() => {
          clearTempEntities();
          if (activePoints.length >= 2) {
            let total3D = 0;
            let totalH = 0;
            for (let i = 0; i < activePoints.length - 1; i++) {
              const ca = Cesium.Cartographic.fromCartesian(activePoints[i]);
              const cb = Cesium.Cartographic.fromCartesian(activePoints[i + 1]);
              const geo = new Cesium.EllipsoidGeodesic(ca, cb);
              const hDist = geo.surfaceDistance;
              const dz = cb.height - ca.height;
              total3D += Math.sqrt(hDist * hDist + dz * dz);
              totalH += hDist;
            }
            summaryLabelEntity = safeAdd({
              position: activePoints[activePoints.length - 1],
              label: {
                text: `TỔNG 3D: ${total3D.toFixed(2)} m  |  H: ${totalH.toFixed(2)} m`,
                font: 'bold 14px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(14, 7),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -25),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'distance',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. ĐO CHIỀU CAO ĐỨNG (HEIGHT)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'height') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const startPt = activePoints[0];
          const projPt = getProjectedPoint(startPt, mousePos);
          const slantDist = Cesium.Cartesian3.distance(startPt, mousePos);
          const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
          const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
          const cartoEnd = Cesium.Cartographic.fromCartesian(mousePos);
          const heightDiff = cartoEnd.height - cartoStart.height;

          safeAdd({
            polyline: {
              positions: [startPt, mousePos],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.CYAN, dashLength: 6 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.CYAN.withAlpha(0.6), dashLength: 6 })
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [startPt, projPt],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.LIGHTGRAY, dashLength: 6 }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.LIGHTGRAY.withAlpha(0.6), dashLength: 6 })
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [projPt, mousePos],
              width: 4.5,
              material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineWidth: 1.5, outlineColor: Cesium.Color.BLACK }),
              depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineWidth: 1.5, outlineColor: Cesium.Color.BLACK.withAlpha(0.65) })
            }
          }, true);
          safeAdd({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy([startPt, projPt, mousePos]),
              material: Cesium.Color.CYAN.withAlpha(0.18),
              outline: false
            }
          }, true);

          safeAdd({
            position: getMidpoint(projPt, mousePos),
            label: {
              text: `CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`,
              font: 'bold 14px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.85, 0.05, 0.25, 0.95),
              backgroundPadding: new Cesium.Cartesian2(10, 5),
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(15, 0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          safeAdd({
            position: getMidpoint(startPt, projPt),
            label: {
              text: `Ngang (H): ${horizDist.toFixed(2)} m`,
              font: 'bold 12px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.88),
              backgroundPadding: new Cesium.Cartesian2(7, 4),
              verticalOrigin: Cesium.VerticalOrigin.TOP,
              pixelOffset: new Cesium.Cartesian2(0, 10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          safeAdd({
            position: getMidpoint(startPt, mousePos),
            label: {
              text: `Xiên (S): ${slantDist.toFixed(2)} m`,
              font: 'bold 12px "JetBrains Mono", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.0, 0.4, 0.5, 0.9),
              backgroundPadding: new Cesium.Cartesian2(7, 4),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          }, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;

          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const startPt = activePoints[0];
            const endPt = pt;
            if (Cesium.Cartesian3.distance(startPt, endPt) < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(endPt));
            const projPt = getProjectedPoint(startPt, endPt);
            const slantDist = Cesium.Cartesian3.distance(startPt, endPt);
            const horizDist = Cesium.Cartesian3.distance(startPt, projPt);
            const cartoStart = Cesium.Cartographic.fromCartesian(startPt);
            const cartoEnd = Cesium.Cartographic.fromCartesian(endPt);
            const heightDiff = cartoEnd.height - cartoStart.height;

            addMeasurePoint(endPt, 1, '#ff0055', 8);

            const slantLine = safeAdd({
              polyline: {
                positions: [startPt, endPt],
                width: 3,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.CYAN, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.CYAN.withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            const horizLine = safeAdd({
              polyline: {
                positions: [startPt, projPt],
                width: 3,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.DARKGRAY, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.DARKGRAY.withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            const vertLine = safeAdd({
              polyline: {
                positions: [projPt, endPt],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#ff0055').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (slantLine) lineEntities.push(slantLine);
            if (horizLine) lineEntities.push(horizLine);
            if (vertLine) lineEntities.push(vertLine);

            fillEntity = safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy([startPt, projPt, endPt]),
                material: Cesium.Color.CYAN.withAlpha(0.22),
                outline: false
              }
            }) || undefined;

            const dzBadge = safeAdd({
              position: getMidpoint(projPt, endPt),
              label: {
                text: `CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`,
                font: 'bold 14px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.85, 0.05, 0.25, 0.95),
                backgroundPadding: new Cesium.Cartesian2(10, 5),
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(15, 0),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            const hBadge = safeAdd({
              position: getMidpoint(startPt, projPt),
              label: {
                text: `Ngang: ${horizDist.toFixed(2)} m`,
                font: 'bold 12px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.88),
                backgroundPadding: new Cesium.Cartesian2(7, 4),
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, 10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            const sBadge = safeAdd({
              position: getMidpoint(startPt, endPt),
              label: {
                text: `Xiên: ${slantDist.toFixed(2)} m`,
                font: 'bold 12px "JetBrains Mono", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.0, 0.4, 0.5, 0.9),
                backgroundPadding: new Cesium.Cartesian2(7, 4),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (dzBadge) labelEntities.push(dzBadge);
            if (hBadge) labelEntities.push(hBadge);
            if (sBadge) labelEntities.push(sBadge);

            finalizeCurrentRecord({
              id: recordId,
              type: 'height',
              points: [startPt, endPt],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 4. TỌA ĐỘ ĐIỂM (POINT)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'point') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const carto = Cesium.Cartographic.fromCartesian(pt);
          const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
          const height = carto.height.toFixed(2);

          addMeasurePoint(pt, 0, '#00e5ff', 8);
          const lbl = safeAdd({
            position: pt,
            label: {
              text: `X: ${lon}°\nY: ${lat}°\nZ: ${height} m`,
              font: 'bold 13px "JetBrains Mono", monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
              backgroundPadding: new Cesium.Cartesian2(10, 6),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          if (lbl) labelEntities.push(lbl);

          finalizeCurrentRecord({
            id: recordId,
            type: 'point',
            points: [pt],
            pointEntities: [...pointEntities],
            lineEntities: [],
            labelEntities: [...labelEntities]
          });

          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 5. ĐO GÓC (ANGLE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'angle') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          if (activePoints.length === 1) {
            safeAdd({
              polyline: {
                positions: [activePoints[0], mousePos],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
              }
            }, true);
          } else if (activePoints.length === 2) {
            safeAdd({
              polyline: {
                positions: [activePoints[1], mousePos],
                width: 3,
                material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
              }
            }, true);
            const angleDeg = calculateAngleDegrees(activePoints[0], activePoints[1], mousePos);
            if (angleDeg === null) return;
            safeAdd({
              position: activePoints[1],
              label: {
                text: `Góc: ${angleDeg.toFixed(2)}°`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.04, 0.04, 0.08, 0.92),
                backgroundPadding: new Cesium.Cartesian2(9, 5),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }, true);
          }
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousAnglePoint = activePoints[activePoints.length - 1];
          if (previousAnglePoint && Cesium.Cartesian3.distance(previousAnglePoint, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          addMeasurePoint(pt, idx, '#00e5ff', 8);

          if (activePoints.length === 2) {
            const l1 = safeAdd({
              polyline: {
                positions: [activePoints[0], activePoints[1]],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (l1) lineEntities.push(l1);
          }

          if (activePoints.length === 3) {
            clearTempEntities();
            const p1 = activePoints[0];
            const p2 = activePoints[1];
            const p3 = activePoints[2];
            const l2 = safeAdd({
              polyline: {
                positions: [p2, p3],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (l2) lineEntities.push(l2);

            const angleDeg = calculateAngleDegrees(p1, p2, p3);
            if (angleDeg === null) return;

            const lbl = safeAdd({
              position: p2,
              label: {
                text: `GÓC: ${angleDeg.toFixed(2)}°`,
                font: 'bold 14px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'angle',
              points: [p1, p2, p3],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities]
            });

            viewer.scene.requestRender();
            setToolMode('none');
          } else {
            viewer.scene.requestRender();
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 6. ĐO ĐƯỜNG TRÒN (CIRCLE)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'circle') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;
          clearTempEntities();
          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, mousePos);
          if (radius < 0.01) return;
          const circleArea = Math.PI * radius * radius;
          safeAdd({
            position: center,
            ellipse: {
              semiMajorAxis: radius,
              semiMinorAxis: radius,
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }, true);
          safeAdd({
            polyline: {
              positions: [center, mousePos],
              width: 3,
              material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), dashLength: 8 })
            }
          }, true);
          addEdgeDistanceBadge(center, mousePos, `R: ${radius.toFixed(2)} m | S: ${circleArea.toFixed(2)} m²`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const center = activePoints[0];
            const edge = pt;
            const radius = Cesium.Cartesian3.distance(center, edge);
            if (radius < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(edge));
            const circleArea = Math.PI * radius * radius;

            addMeasurePoint(edge, 1, '#00e5ff', 8);
            const line = safeAdd({
              polyline: {
                positions: [center, edge],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);

            fillEntity = safeAdd({
              position: center,
              ellipse: {
                semiMajorAxis: radius,
                semiMinorAxis: radius,
                material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.18),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
              }
            }) || undefined;

            const lbl = safeAdd({
              position: getMidpoint(center, edge),
              label: {
                text: `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH: ${circleArea.toFixed(2)} m²`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'circle',
              points: [center, edge],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              fillEntity
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // Sphere: center + radius, rendered as a true Cesium ellipsoid in world coordinates.
      if (toolMode === 'sphere') {
        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0) return;
          const edge = getPickedPosition(movement.endPosition);
          if (!edge) return;
          clearTempEntities();
          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, edge);
          if (radius < 0.01) return;
          safeAdd({
            position: center,
            ellipsoid: {
              radii: new Cesium.Cartesian3(radius, radius, radius),
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }, true);
          addEdgeDistanceBadge(center, edge, `R: ${radius.toFixed(2)} m`, true);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          const point = getPickedPosition(click.position);
          if (!point) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(point));
            addMeasurePoint(point, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
            return;
          }

          const center = activePoints[0];
          const radius = Cesium.Cartesian3.distance(center, point);
          if (radius < 0.01) return;
          clearTempEntities();
          activePoints.push(Cesium.Cartesian3.clone(point));
          addMeasurePoint(point, 1, '#00e5ff', 8);
          const surfaceArea = 4 * Math.PI * radius * radius;
          const sphereVolume = (4 / 3) * Math.PI * radius * radius * radius;
          const line = safeAdd({ polyline: { positions: [center, point], width: 4, material: Cesium.Color.fromCssColorString('#00e5ff') } });
          if (line) lineEntities.push(line);
          fillEntity = safeAdd({
            position: center,
            ellipsoid: {
              radii: new Cesium.Cartesian3(radius, radius, radius),
              material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.16),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#00e5ff')
            }
          }) || undefined;
          const label = safeAdd({
            position: getMidpoint(center, point),
            label: {
              text: `BÁN KÍNH: ${radius.toFixed(2)} m\nDIỆN TÍCH MẶT CẦU: ${surfaceArea.toFixed(2)} m²\nTHỂ TÍCH: ${sphereVolume.toFixed(2)} m³`,
              font: 'bold 13px "JetBrains Mono", monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2.5,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
              backgroundPadding: new Cesium.Cartesian2(12, 6),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -14),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          if (label) labelEntities.push(label);
          finalizeCurrentRecord({ id: recordId, type: 'sphere', points: [...activePoints], pointEntities: [...pointEntities], lineEntities: [...lineEntities], labelEntities: [...labelEntities], fillEntity });
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 7. GÓC PHƯƠNG VỊ (AZIMUTH)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'azimuth') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          if (activePoints.length === 0) {
            activePoints.push(Cesium.Cartesian3.clone(pt));
            addMeasurePoint(pt, 0, '#00e5ff', 8);
            viewer.scene.requestRender();
          } else {
            clearTempEntities();
            const p1 = activePoints[0];
            const p2 = pt;
            if (Cesium.Cartesian3.distance(p1, p2) < 0.01) return;
            activePoints.push(Cesium.Cartesian3.clone(p2));
            addMeasurePoint(p2, 1, '#00e5ff', 8);

            const c1 = Cesium.Cartographic.fromCartesian(p1);
            const c2 = Cesium.Cartographic.fromCartesian(p2);
            const geodesic = new Cesium.EllipsoidGeodesic(c1, c2);
            const azimuthDeg = (Cesium.Math.toDegrees(geodesic.startHeading) + 360) % 360;
            const dist = geodesic.surfaceDistance;

            const line = safeAdd({
              polyline: {
                positions: [p1, p2],
                width: 4,
                material: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff'), outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({ color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65), outlineColor: Cesium.Color.BLACK.withAlpha(0.65), outlineWidth: 1.5 })
              }
            });
            if (line) lineEntities.push(line);

            const lbl = safeAdd({
              position: getMidpoint(p1, p2),
              label: {
                text: `AZIMUTH: ${azimuthDeg.toFixed(2)}° | Khoảng cách: ${dist.toFixed(2)} m`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'azimuth',
              points: [p1, p2],
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities]
            });

            viewer.scene.requestRender();
            setToolMode('none');
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 8. GHI CHÚ 3D (ANNOTATION)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'annotation') {
        handler.setInputAction((click: any) => {
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const text = prompt('Nhập nội dung ghi chú 3D:', 'Vị trí đo đạc');
          const annotationText = text?.trim();
          if (annotationText) {
            addMeasurePoint(pt, 0, '#ffcc00', 8);
            const lbl = safeAdd({
              position: pt,
              label: {
                text: `💬 ${annotationText}`,
                font: 'bold 14px "Segoe UI", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.95),
                backgroundPadding: new Cesium.Cartesian2(10, 5),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            if (lbl) labelEntities.push(lbl);

            finalizeCurrentRecord({
              id: recordId,
              type: 'annotation',
              points: [pt],
              pointEntities: [...pointEntities],
              lineEntities: [],
              labelEntities: [...labelEntities]
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 9. ĐO THỂ TÍCH (VOLUME)
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'volume') {
        let lastVolumeClick: { position: Cesium.Cartesian2; time: number } | undefined;
        handler.setInputAction((click: any) => {
          const clickTime = performance.now();
          if (lastVolumeClick && clickTime - lastVolumeClick.time < 500 && Cesium.Cartesian2.distance(lastVolumeClick.position, click.position) < 5) return;
          lastVolumeClick = { position: Cesium.Cartesian2.clone(click.position), time: clickTime };
          const pt = getPickedPosition(click.position);
          if (!pt) return;
          const previousPt = activePoints[activePoints.length - 1];
          if (previousPt && Cesium.Cartesian3.distance(previousPt, pt) < 0.01) return;
          const idx = activePoints.length;
          activePoints.push(Cesium.Cartesian3.clone(pt));
          addMeasurePoint(pt, idx, '#00e5ff', 8);
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(() => {
          if (activePoints.length >= 3) {
            const area = calculatePolygonArea(activePoints);
            const centroid = calculateCentroid(activePoints);
            const heights = activePoints.map(p => Cesium.Cartographic.fromCartesian(p).height);
            const hMin = Math.min(...heights);
            const hMax = Math.max(...heights);
            const deltaH = Math.max(0, hMax - hMin);
            const volume = area * deltaH;

            fillEntity = safeAdd({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(activePoints),
                material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.35),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#00e5ff'),
                extrudedHeight: hMax
              }
            }) || undefined;

            summaryLabelEntity = safeAdd({
              position: centroid,
              label: {
                text: `THỂ TÍCH LĂNG TRỤ ƯỚC TÍNH: ${volume.toFixed(2)} m³\nDiện tích: ${area.toFixed(2)} m² | ΔH: ${deltaH.toFixed(2)} m`,
                font: 'bold 13px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.38, 0.16, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'volume',
              points: [...activePoints],
              pointEntities: [...pointEntities],
              lineEntities: [],
              labelEntities: [],
              fillEntity,
              summaryLabelEntity
            });
          }
          viewer.scene.requestRender();
          setToolMode('none');
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      // ─────────────────────────────────────────────────────────────
      // 10. TRẮC DỌC CAO ĐỘ (PROFILE)
      //     - Click nhiều đỉnh tạo tuyến
      //     - Double-click để chốt
      //     - Sample cao độ ở maximum detail từ Scene/3D Tiles, terrain fallback
      // ─────────────────────────────────────────────────────────────
      if (toolMode === 'profile') {
        let lastProfileClick: {
          position: Cesium.Cartesian2;
          time: number;
        } | undefined;
        let profileFinalizeInProgress = false;

        handler.setInputAction((movement: any) => {
          if (activePoints.length === 0 || profileFinalizeInProgress) return;
          const mousePos = getPickedPosition(movement.endPosition);
          if (!mousePos) return;

          clearTempEntities();
          const lastPoint = activePoints[activePoints.length - 1];
          safeAdd({
            polyline: {
              positions: [lastPoint, mousePos],
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#00e5ff'),
                dashLength: 8,
              }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.55),
                dashLength: 8,
              }),
            },
          }, true);

          addEdgeDistanceBadge(
            lastPoint,
            mousePos,
            `Đoạn mới: ${Cesium.Cartesian3.distance(lastPoint, mousePos).toFixed(2)} m`,
            true
          );
          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
          if (profileFinalizeInProgress) return;

          const clickTime = performance.now();
          if (
            lastProfileClick &&
            clickTime - lastProfileClick.time < 500 &&
            Cesium.Cartesian2.distance(
              lastProfileClick.position,
              click.position
            ) < 5
          ) {
            return;
          }
          lastProfileClick = {
            position: Cesium.Cartesian2.clone(click.position),
            time: clickTime,
          };

          const point = getPickedPosition(click.position);
          if (!point) return;

          const previousPoint = activePoints[activePoints.length - 1];
          if (
            previousPoint &&
            Cesium.Cartesian3.distance(previousPoint, point) < 0.01
          ) {
            return;
          }

          clearTempEntities();
          const pointIndex = activePoints.length;
          const worldPoint = Cesium.Cartesian3.clone(point);
          activePoints.push(worldPoint);
          setMeasurementPoints([...activePoints]);
          addMeasurePoint(worldPoint, pointIndex, '#00e5ff', 8);

          if (activePoints.length >= 2) {
            const p1 = activePoints[activePoints.length - 2];
            const p2 = activePoints[activePoints.length - 1];
            const line = safeAdd({
              polyline: {
                positions: [p1, p2],
                width: 4.5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#00e5ff'),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 1.5,
                }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.65),
                  outlineWidth: 1.5,
                }),
              },
            });
            if (line) lineEntities.push(line);
          }

          viewer.scene.requestRender();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(async () => {
          if (
            profileFinalizeInProgress ||
            activePoints.length < 2
          ) {
            return;
          }

          profileFinalizeInProgress = true;
          clearTempEntities();
          setIsProfileSampling(true);

          try {
            const sampled = await sampleProfileAlongPath(activePoints);
            if (!sampled) return;

            const profileResult: ProfileResult = {
              id: recordId,
              ...sampled,
            };

            const sampledLine = safeAdd({
              polyline: {
                positions: sampled.samples.map(sample => sample.position),
                width: 3.5,
                material: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#f59e0b'),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
                  outlineWidth: 1,
                }),
                depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.65),
                  outlineColor: Cesium.Color.BLACK.withAlpha(0.45),
                  outlineWidth: 1,
                }),
              },
            });
            if (sampledLine) {
              (sampledLine as any)._isProfileSampleLine = true;
              lineEntities.push(sampledLine);
            }

            summaryLabelEntity = safeAdd({
              position: activePoints[activePoints.length - 1],
              label: {
                text:
                  `TRẮC DỌC: ${profileResult.totalDistance.toFixed(2)} m\n` +
                  `Hmin: ${profileResult.minHeight.toFixed(2)} m | Hmax: ${profileResult.maxHeight.toFixed(2)} m\n` +
                  `Tăng: ${profileResult.elevationGain.toFixed(2)} m | Giảm: ${profileResult.elevationLoss.toFixed(2)} m | ${profileResult.samples.length} mẫu`,
                font: 'bold 12px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.02, 0.30, 0.42, 0.95),
                backgroundPadding: new Cesium.Cartesian2(12, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -18),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            }) || undefined;

            finalizeCurrentRecord({
              id: recordId,
              type: 'profile',
              points: activePoints.map(point => Cesium.Cartesian3.clone(point)),
              pointEntities: [...pointEntities],
              lineEntities: [...lineEntities],
              labelEntities: [...labelEntities],
              summaryLabelEntity,
              profileSamples: sampled.samples,
            });

            setActiveProfile(profileResult);
            viewer.scene.requestRender();
            setToolMode('none');
          } catch (error) {
            console.error('Lỗi khi tạo trắc dọc:', error);
          } finally {
            setIsProfileSampling(false);
            profileFinalizeInProgress = false;
          }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      }

      return () => {
        clearTempEntities();
        if (!measurementFinalized) {
          const unfinishedEntities = new Set<Cesium.Entity>([
            ...pointEntities,
            ...lineEntities,
            ...labelEntities,
            ...(fillEntity ? [fillEntity] : []),
            ...(summaryLabelEntity ? [summaryLabelEntity] : [])
          ]);
          unfinishedEntities.forEach(entity => {
            try { viewer.entities.remove(entity); } catch (e) {}
            measurementEntitiesRef.current = measurementEntitiesRef.current.filter(item => item !== entity);
          });
          measurementsStoreRef.current = measurementsStoreRef.current.filter(record => record.id !== recordId);
        }
        if (handler && !handler.isDestroyed()) {
          handler.destroy();
        }
        if (handlerRef.current === handler) {
          handlerRef.current = null;
        }
      };
    }, [toolMode]);

    // ─────────────────────────────────────────────────────────────
    // EFFECT 2: KÉO THẢ VÀ TINH CHỈNH ĐIỂM ĐO THỜI GIAN THỰC (DRAG & REFINE)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const dragHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      let draggedTarget: {
        record: MeasurementRecord;
        pointIndex: number;
        pointEntity: Cesium.Entity;
      } | null = null;

      let hoveredEntity: Cesium.Entity | null = null;

      // Hàm tìm điểm đo gần nhất theo khoảng cách 2D trên màn hình (độ nhạy 25px)
      const findPointAtScreenPos = (windowPos: Cesium.Cartesian2) => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed() || !windowPos) return null;
        const tolerance = 25;
        let bestDist = Infinity;
        let bestTarget: { record: MeasurementRecord; pointIndex: number; pointEntity: Cesium.Entity } | null = null;

        for (const record of measurementsStoreRef.current) {
          for (let i = 0; i < record.points.length; i++) {
            const pt3d = record.points[i];
            if (!pt3d) continue;
            try {
              const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(v.scene, pt3d);
              if (screenPos) {
                const dx = screenPos.x - windowPos.x;
                const dy = screenPos.y - windowPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= tolerance && dist < bestDist) {
                  bestDist = dist;
                  bestTarget = {
                    record,
                    pointIndex: i,
                    pointEntity: record.pointEntities[i]
                  };
                }
              }
            } catch (e) {}
          }
        }
        return bestTarget;
      };

      // 1. LEFT_DOWN: Bắt đầu kéo điểm đo
      dragHandler.setInputAction((click: any) => {
        const target = findPointAtScreenPos(click.position);
        if (target) {
          draggedTarget = target;
          viewer.scene.screenSpaceCameraController.enableInputs = false;
          viewer.scene.canvas.style.cursor = 'grabbing';
          if (draggedTarget.pointEntity?.billboard) {
            draggedTarget.pointEntity.billboard.width = new Cesium.ConstantProperty(12);
            draggedTarget.pointEntity.billboard.height = new Cesium.ConstantProperty(12);
            draggedTarget.pointEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_GLOW_IMAGE);
          }
          viewer.scene.requestRender();
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);

      // 2. MOUSE_MOVE: Di chuyển điểm và cập nhật hình học đo thời gian thực
      dragHandler.setInputAction((movement: any) => {
        if (draggedTarget) {
          const newPos = getPickedPosition(movement.endPosition);
          if (newPos) {
            const worldPosition = Cesium.Cartesian3.clone(newPos);
            draggedTarget.record.points[draggedTarget.pointIndex] = worldPosition;
            draggedTarget.pointEntity.position = new Cesium.ConstantPositionProperty(worldPosition) as any;
            updateMeasurementRecord(draggedTarget.record);
            viewer.scene.requestRender();
          }
          return;
        }

        // Hover effect khi rê chuột qua các điểm đo
        const hovered = findPointAtScreenPos(movement.endPosition);
        if (hovered) {
          viewer.scene.canvas.style.cursor = 'grab';
          if (hoveredEntity !== hovered.pointEntity) {
            if (hoveredEntity?.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            hoveredEntity = hovered.pointEntity;
            if (hoveredEntity?.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(11);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(11);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            viewer.scene.requestRender();
          }
        } else {
          if (hoveredEntity) {
            if (hoveredEntity.billboard) {
              hoveredEntity.billboard.width = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.height = new Cesium.ConstantProperty(9);
              hoveredEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
            }
            hoveredEntity = null;
            viewer.scene.requestRender();
          }
          if (!draggedTarget) {
            viewer.scene.screenSpaceCameraController.enableInputs = !lockView;
          }
          if (toolMode === 'none') {
            viewer.scene.canvas.style.cursor = 'default';
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // 3. LEFT_UP: Thả chuột và kết thúc kéo điểm
      dragHandler.setInputAction(() => {
        if (draggedTarget) {
          const finishedRecord = draggedTarget.record;
          if (draggedTarget.pointEntity?.billboard) {
            draggedTarget.pointEntity.billboard.width = new Cesium.ConstantProperty(9);
            draggedTarget.pointEntity.billboard.height = new Cesium.ConstantProperty(9);
            draggedTarget.pointEntity.billboard.image = new Cesium.ConstantProperty(MEASUREMENT_RING_DOT_IMAGE);
          }
          draggedTarget = null;
          viewer.scene.screenSpaceCameraController.enableInputs = !lockView;
          viewer.scene.canvas.style.cursor = 'default';
          viewer.scene.requestRender();
          setMeasurementRevision(revision => revision + 1);

          // Profile đã finalize phải sample lại sau khi Shift+kéo một control point.
          if (finishedRecord.type === 'profile') {
            void refreshProfileRecord(finishedRecord);
          } else {
            persistMeasurementUpdate(finishedRecord);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      return () => {
        if (!dragHandler.isDestroyed()) {
          dragHandler.destroy();
        }
      };
    }, [toolMode, lockView]);

    const handleFocusProject = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      setShowModel(true);

      if (modelRef.current && modelRef.current.boundingSphere) {
        const bs = modelRef.current.boundingSphere;
        viewer.camera.flyToBoundingSphere(bs, {
          duration: 1.5,
          offset: new Cesium.HeadingPitchRange(
            viewer.camera.heading,
            Cesium.Math.toRadians(-30),
            bs.radius * 2.5
          )
        });
        return;
      }

      if (pointCloudRef.current && pointCloudRef.current.boundingSphere) {
        const bs = pointCloudRef.current.boundingSphere;
        viewer.camera.flyToBoundingSphere(bs, {
          duration: 1.5,
          offset: new Cesium.HeadingPitchRange(
            viewer.camera.heading,
            Cesium.Math.toRadians(-30),
            bs.radius * 2.5
          )
        });
        return;
      }

      const target = Cesium.Cartesian3.fromDegrees(
        project?.centerLon || 106.8099,
        project?.centerLat || 10.8404,
        150
      );
      viewer.camera.flyTo({
        destination: target,
        duration: 1.5
      });
    };

    const handleFocusPointCloud = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      setShowPointCloud(true);

      if (pointCloudRef.current) {
        viewer.zoomTo(pointCloudRef.current);
      } else {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            project?.centerLon || 106.8099,
            (project?.centerLat || 10.8404) - 0.001,
            150
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0.0
          },
          duration: 2
        });
      }
    };

    const handleFocusDOM = () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      setShowDom(true);

      const centerLon = (project?.centerLon || 106.8099) + (offsets.domLon || 0);
      const centerLat = (project?.centerLat || 10.8404) + (offsets.domLat || 0);
      const scale = offsets.domScale || 1.0;
      const halfWidth = 0.005 * scale;
      const halfHeight = 0.005 * scale;

      const finalWest = centerLon - halfWidth;
      const finalEast = centerLon + halfWidth;
      const finalSouth = centerLat - halfHeight;
      const finalNorth = centerLat + halfHeight;

      const domRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);
      const bs = Cesium.BoundingSphere.fromRectangle3D(domRectangle);
      viewer.camera.flyToBoundingSphere(bs, {
        duration: 2,
        offset: new Cesium.HeadingPitchRange(
          0,
          Cesium.Math.toRadians(-90),
          bs.radius * 2.2
        )
      });
    };

    const handleFocusDom = handleFocusDOM;

    // Tắt/bật hiển thị toàn bộ phép đo
    useEffect(() => {
      const managedEntities = new Set<Cesium.Entity>();
      measurementsStoreRef.current.forEach(record => {
        const entities = [
          ...record.pointEntities,
          ...record.lineEntities,
          ...record.labelEntities,
          ...(record.fillEntity ? [record.fillEntity] : []),
          ...(record.summaryLabelEntity ? [record.summaryLabelEntity] : []),
        ];
        entities.forEach(entity => {
          managedEntities.add(entity);
          entity.show = showMeasurements && record.visible !== false;
        });
      });
      measurementEntitiesRef.current.forEach(entity => {
        if (!managedEntities.has(entity)) entity.show = showMeasurements;
      });
      viewerRef.current?.scene?.requestRender();
    }, [showMeasurements, measurementRevision]);

    // Điều chỉnh tốc độ camera theo slider
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const factor = cameraSpeed / 100;
      viewer.scene.screenSpaceCameraController.zoomFactor = 5.0 * factor;
    }, [cameraSpeed]);

    useEffect(() => {
      if (navigationMode !== 'fps') return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const pressed = new Set<string>();
      let frameId = 0;
      let previousTime = performance.now();
      const onKeyDown = (event: KeyboardEvent) => {
        if (!['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement | null)?.tagName || '')) pressed.add(event.code);
      };
      const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
      const tick = (time: number) => {
        const seconds = Math.min(0.1, (time - previousTime) / 1000);
        previousTime = time;
        const amount = cameraSpeed * seconds;
        if (pressed.has('KeyW') || pressed.has('ArrowUp')) viewer.camera.moveForward(amount);
        if (pressed.has('KeyS') || pressed.has('ArrowDown')) viewer.camera.moveBackward(amount);
        if (pressed.has('KeyA') || pressed.has('ArrowLeft')) viewer.camera.moveLeft(amount);
        if (pressed.has('KeyD') || pressed.has('ArrowRight')) viewer.camera.moveRight(amount);
        if (pressed.has('KeyE')) viewer.camera.moveUp(amount);
        if (pressed.has('KeyQ')) viewer.camera.moveDown(amount);
        if (pressed.size > 0) viewer.scene.requestRender();
        frameId = requestAnimationFrame(tick);
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      frameId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }, [navigationMode, cameraSpeed]);

    const handleNavigationAction = (action: 'earth' | 'fps' | 'orbit' | 'heli' | 'compass' | 'anim') => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      if (action === 'compass') {
        viewer.camera.setView({ orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 } });
        viewer.scene.requestRender();
        return;
      }
      if (action === 'earth' || action === 'fps' || action === 'orbit') {
        setNavigationMode(action);
        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableInputs = !lockView;
        controller.enableRotate = !lockView;
        controller.enableTranslate = !lockView;
        controller.enableZoom = !lockView;
        controller.enableTilt = !lockView;
        controller.enableLook = !lockView;
        if (action === 'orbit') handleFocusPointCloud();
      }
    };

    // Chuyển góc nhìn camera theo khối lập phương điều hướng [L] [R] [F] [B] [T] [D]
    const handleSetCameraView = (view: 'L' | 'R' | 'F' | 'B' | 'T' | 'D') => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const target = pointCloudRef.current?.boundingSphere?.center 
        || modelRef.current?.boundingSphere?.center 
        || Cesium.Cartesian3.fromDegrees(project?.centerLon || 106.8099, project?.centerLat || 10.8404, 50);

      const bs = new Cesium.BoundingSphere(target, 200);

      let heading = 0;
      let pitch = Cesium.Math.toRadians(-30);

      switch (view) {
        case 'L': // Left / West
          heading = Cesium.Math.toRadians(90);
          pitch = Cesium.Math.toRadians(-5);
          break;
        case 'R': // Right / East
          heading = Cesium.Math.toRadians(270);
          pitch = Cesium.Math.toRadians(-5);
          break;
        case 'F': // Front / South
          heading = Cesium.Math.toRadians(0);
          pitch = Cesium.Math.toRadians(-5);
          break;
        case 'B': // Back / North
          heading = Cesium.Math.toRadians(180);
          pitch = Cesium.Math.toRadians(-5);
          break;
        case 'T': // Top / Nader
          heading = 0;
          pitch = Cesium.Math.toRadians(-90);
          break;
        case 'D': // Down / Underneath
          heading = 0;
          pitch = Cesium.Math.toRadians(85);
          break;
      }

      viewer.camera.flyToBoundingSphere(bs, {
        duration: 1.2,
        offset: new Cesium.HeadingPitchRange(heading, pitch, bs.radius * 2.2)
      });
    };

    const clearClipping = () => {
      loadedPointCloudTilesetsRef.current.forEach(tileset => {
        if (!tileset.isDestroyed()) (tileset as any).clippingPlanes = undefined;
      });
      if (modelRef.current) (modelRef.current as any).clippingPlanes = undefined;
      clippingCollectionsRef.current.forEach(collection => {
        try { if (!collection.isDestroyed()) collection.destroy(); } catch (e) {}
      });
      clippingCollectionsRef.current = [];
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        clippingEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
        viewer.scene.requestRender();
      }
      clippingEntitiesRef.current = [];
      setActiveClipTool(null);
    };

    const handleClipTool = (tool: 'box' | 'polygon' | 'plane' | 'clear') => {
      if (tool === 'clear') {
        clearClipping();
        return;
      }
      if (tool === 'polygon') {
        console.warn('Clipping polygon is disabled: this viewer has no validated ClippingPolygon target pipeline.');
        return;
      }
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      clearClipping();
      const sphere = pointCloudRef.current?.boundingSphere || modelRef.current?.boundingSphere;
      if (!sphere) return;
      const center = Cesium.Cartesian3.clone(sphere.center);
      const halfSize = Math.max(1, sphere.radius * 0.55);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
      const shouldClip = clipMode === 'inside' || clipMode === 'outside';
      const direction = clipMode === 'outside' ? -1 : 1;

      const createCollection = () => {
        const planes = tool === 'plane'
          ? [new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, direction), 0)]
          : [
              new Cesium.ClippingPlane(new Cesium.Cartesian3(direction, 0, 0), -halfSize),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(-direction, 0, 0), -halfSize),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, direction, 0), -halfSize),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, -direction, 0), -halfSize),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, direction), -halfSize),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, -direction), -halfSize)
            ];
        return new Cesium.ClippingPlaneCollection({
          planes,
          modelMatrix: Cesium.Matrix4.clone(modelMatrix),
          unionClippingRegions: clipFilter === 'any',
          edgeColor: Cesium.Color.YELLOW,
          edgeWidth: clipMode === 'highlight' ? 2 : 1,
          enabled: shouldClip
        });
      };

      loadedPointCloudTilesetsRef.current.forEach(tileset => {
        if (!tileset.isDestroyed()) {
          const collection = createCollection();
          (tileset as any).clippingPlanes = collection;
          clippingCollectionsRef.current.push(collection);
        }
      });
      if (modelRef.current) {
        const collection = createCollection();
        (modelRef.current as any).clippingPlanes = collection;
        clippingCollectionsRef.current.push(collection);
      }

      const visual = viewer.entities.add(tool === 'box' ? {
        position: center,
        box: {
          dimensions: new Cesium.Cartesian3(halfSize * 2, halfSize * 2, halfSize * 2),
          material: Cesium.Color.YELLOW.withAlpha(0.05),
          outline: true,
          outlineColor: Cesium.Color.YELLOW
        }
      } : {
        position: center,
        plane: {
          plane: new Cesium.Plane(Cesium.Cartesian3.UNIT_Z, 0),
          dimensions: new Cesium.Cartesian2(halfSize * 2, halfSize * 2),
          material: Cesium.Color.YELLOW.withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.YELLOW
        }
      });
      clippingEntitiesRef.current.push(visual);
      setActiveClipTool(tool);
      viewer.scene.requestRender();
    };

    useEffect(() => {
      if (activeClipTool) handleClipTool(activeClipTool);
      // Rebuild Cesium clipping collections when semantic mode/filter changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clipMode, clipFilter]);

    const getMeasurementRecordEntities = (record: MeasurementRecord): Cesium.Entity[] => Array.from(new Set([
      ...record.pointEntities,
      ...record.lineEntities,
      ...record.labelEntities,
      ...(record.fillEntity ? [record.fillEntity] : []),
      ...(record.summaryLabelEntity ? [record.summaryLabelEntity] : []),
    ]));

    const handleToggleMeasurement = (id: string) => {
      const record = measurementsStoreRef.current.find(item => item.id === id && item.isFinalized);
      if (!record) return;
      record.visible = record.visible === false;
      getMeasurementRecordEntities(record).forEach(entity => {
        entity.show = showMeasurements && record.visible !== false;
      });
      setMeasurementRevision(revision => revision + 1);
      viewerRef.current?.scene.requestRender();
      persistMeasurementUpdate(record);
    };

    const handleDeleteMeasurement = (id: string) => {
      const viewer = viewerRef.current;
      const record = measurementsStoreRef.current.find(item => item.id === id && item.isFinalized);
      if (!viewer || viewer.isDestroyed() || !record) return;
      const entities = new Set(getMeasurementRecordEntities(record));
      entities.forEach(entity => viewer.entities.remove(entity));
      measurementEntitiesRef.current = measurementEntitiesRef.current.filter(entity => !entities.has(entity));
      measurementsStoreRef.current = measurementsStoreRef.current.filter(item => item.id !== id);
      if (activeProfile?.id === id) setActiveProfile(null);
      setMeasurementRevision(revision => revision + 1);
      viewer.scene.requestRender();
      if (projectId) {
        enqueueMeasurementPersistence(id, () => deleteProjectMeasurement(projectId, id));
      }
    };

    const measurementTypeCounts = new Map<ToolMode, number>();
    const measurementManagerItems: MeasurementManagerItem[] = measurementsStoreRef.current
      .filter(record => record.isFinalized)
      .map(record => {
        const sequence = (measurementTypeCounts.get(record.type) ?? 0) + 1;
        measurementTypeCounts.set(record.type, sequence);
        return {
          id: record.id,
          title: `${getMeasurementTypeLabel(record.type)} #${sequence}`,
          value: getMeasurementValue(record),
          visible: record.visible !== false,
        };
      });
    const activeProfileVisible = !activeProfile || measurementsStoreRef.current.find(record => record.id === activeProfile.id)?.visible !== false;

    const handleClear = () => {
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) {
        measurementEntitiesRef.current.forEach(e => {
          try { viewer.entities.remove(e); } catch (err) {}
        });
      }
      measurementEntitiesRef.current = [];
      measurementsStoreRef.current = [];
      setMeasurementPoints([]);
      setActiveProfile(null);
      setIsProfileSampling(false);
      setToolMode('none');
      setMeasurementRevision(revision => revision + 1);
      if (projectId) {
        const pendingWrites = Array.from(measurementPersistenceQueueRef.current.values());
        void Promise.allSettled(pendingWrites)
          .then(() => clearProjectMeasurements(projectId))
          .catch(error => console.error('[Measurement persistence] clear:', error));
      }
    };

    const handleToolModeChange = (mode: ToolMode) => {
      setToolMode(current => current === mode ? 'none' : mode);
    };

    return (
      <div className="relative w-full h-screen">
        <UnifiedToolbar
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          viewAngle={viewAngle}
          onViewAngleChange={setViewAngle}
          toolMode={toolMode}
          onToolModeChange={handleToolModeChange}
          onClear={handleClear}
          reserveAdminPanel={isAdmin}
        />

        {/* Component Potree Sidebar điều khiển bên trái */}
        <PotreeSidebar
          isOpen={isSidebarOpen}
          onToggleOpen={onToggleSidebar ? () => onToggleSidebar(!isSidebarOpen) : undefined}
          projectName={projectName}
          currentMode={toolMode}
          onModeChange={handleToolModeChange}
          onClear={handleClear}
          measurementManager={(
            <MeasurementManager
              items={measurementManagerItems}
              onToggle={handleToggleMeasurement}
              onDelete={handleDeleteMeasurement}
            />
          )}
          onClipTool={handleClipTool}
          clipMode={clipMode}
          onClipModeChange={setClipMode}
          clipFilter={clipFilter}
          onClipFilterChange={setClipFilter}
          showMeasurements={showMeasurements}
          onToggleShowMeasurements={() => setShowMeasurements(!showMeasurements)}
          cameraSpeed={cameraSpeed}
          onCameraSpeedChange={setCameraSpeed}
          onSetCameraView={handleSetCameraView}
          onNavigationAction={handleNavigationAction}
          isOptimizerOpen={isOptimizerOpen}
          onToggleOptimizer={() => setIsOptimizerOpen(!isOptimizerOpen)}
          showOptimizerControl={isAdmin}
          showModel={showModel}
          setShowModel={setShowModel}
          showDom={showDom}
          setShowDom={setShowDom}
          showPointCloud={showPointCloud}
          setShowPointCloud={setShowPointCloud}
          pointSize={pointSize}
          onPointSizeChange={setPointSize}
          fov={fov}
          onFovChange={setFov}
          edlEnabled={edlEnabled}
          edlSupported={false}
          onEdlToggle={setEdlEnabled}
          edlRadius={edlRadius}
          onEdlRadiusChange={setEdlRadius}
          edlStrength={edlStrength}
          onEdlStrengthChange={setEdlStrength}
          edlOpacity={edlOpacity}
          onEdlOpacityChange={setEdlOpacity}
          background={background}
          onBackgroundChange={setBackground}
          quality={quality}
          onQualityChange={setQuality}
          pointBudget={pointBudget}
          onPointBudgetChange={setPointBudget}
          minPointBudget={minPointBudget}
          maxPointBudget={maxPointBudget}
          minNodeSize={minNodeSize}
          onMinNodeSizeChange={setMinNodeSize}
          lockView={lockView}
          onLockViewChange={setLockView}
          isOrthographic={isOrthographic}
          onProjectionChange={setIsOrthographic}
          onFocusProject={handleFocusProject}
          onFocusPointCloud={handleFocusPointCloud}
          onFocusDom={handleFocusDom}
        />



        {/* Component Optimizer Panel */}
        {isAdmin && isOptimizerOpen && (
          <OptimizerPanel projectId={projectId} onClose={() => setIsOptimizerOpen(false)} />
        )}

        {/* Container chứa bản đồ 3D */}
        <div ref={cesiumContainer} className="absolute inset-0 z-0" />

        {/* ── Loading Overlay: hiện khi đang fetch/parse Model 3D ── */}
        {isModelLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner vòng tròn */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sky-300 font-semibold text-sm tracking-wider">Đang tải mô hình 3D...</p>
                <p className="text-slate-500 text-xs mt-1">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        )}

        {/* Bảng tinh chỉnh vị trí của Admin (Calibration - Chỉ Admin hệ thống mới có quyền truy cập) */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-40 bg-slate-950/90 border border-slate-800 text-slate-300 p-4 rounded-2xl w-80 backdrop-blur-md text-xs space-y-3 shadow-2xl select-none font-sans">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="font-bold text-sky-400 tracking-wider">🔧 CALIBRATION PANEL (ADMIN)</span>
              <button
                onClick={() => setActiveTarget(prev => prev === 'none' ? 'model' : 'none')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${activeTarget !== 'none'
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
              >
                {activeTarget !== 'none' ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {activeTarget !== 'none' && (
              <div className="space-y-3">
                {/* Chọn đối tượng hiệu chỉnh */}
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    onClick={() => setActiveTarget('model')}
                    className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${activeTarget === 'model'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                  >
                    Model 3D
                  </button>
                  <button
                    onClick={() => setActiveTarget('dom')}
                    className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${activeTarget === 'dom'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                  >
                    Ảnh DOM
                  </button>
                  <button
                    onClick={() => setActiveTarget('pointcloud')}
                    className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${activeTarget === 'pointcloud'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                  >
                    Point Cloud
                  </button>
                </div>

                {/* Thông số hiện tại & Cho phép nhập tay trực tiếp */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2 font-sans text-[11px] text-slate-300">
                  <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-1.5 border-b border-slate-900 pb-1">
                    Hiệu chỉnh thông số
                  </div>

                  {activeTarget === 'model' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lon Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.modelLon}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelLon: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lat Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.modelLat}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelLat: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Cao độ (m):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.modelHeight}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelHeight: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Góc xoay Yaw (°):</span>
                        <CalibNumberInput
                          step="0.5"
                          value={offsets.modelHeading}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelHeading: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Nghiêng Pitch (°):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.modelPitch || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelPitch: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Nghiêng Roll (°):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.modelRoll || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, modelRoll: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                    </div>
                  ) : activeTarget === 'dom' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lon Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.domLon}
                          onChange={(val) => setOffsets(prev => ({ ...prev, domLon: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lat Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.domLat}
                          onChange={(val) => setOffsets(prev => ({ ...prev, domLat: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Tỉ lệ Scale (x):</span>
                        <CalibNumberInput
                          step="0.001"
                          value={offsets.domScale}
                          onChange={(val) => setOffsets(prev => ({ ...prev, domScale: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Góc xoay (°):</span>
                        <CalibNumberInput
                          step="0.5"
                          value={offsets.domHeading || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, domHeading: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lon Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.pcLon || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcLon: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Lat Offset (°):</span>
                        <CalibNumberInput
                          step="0.0000001"
                          value={offsets.pcLat || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcLat: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Cao độ (m):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.pcHeight || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcHeight: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Góc xoay Yaw (°):</span>
                        <CalibNumberInput
                          step="0.5"
                          value={offsets.pcHeading || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcHeading: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Nghiêng Pitch (°):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.pcPitch || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcPitch: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-mono">Nghiêng Roll (°):</span>
                        <CalibNumberInput
                          step="0.1"
                          value={offsets.pcRoll || 0}
                          onChange={(val) => setOffsets(prev => ({ ...prev, pcRoll: val }))}
                          className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                        />
                      </div>
                    </div>
                  )}
                  <div className="border-t border-slate-900 pt-1.5 mt-1.5 flex justify-between text-[10px]">
                    <span className="text-slate-500">Bước nhảy phím tắt:</span>
                    <span className="text-sky-400 font-bold">{stepSize} m</span>
                  </div>
                </div>

                {/* Hướng dẫn phím tắt */}
                <div className="text-[10px] text-slate-500 space-y-1 bg-slate-950/40 p-2 rounded-lg border border-slate-900/40 leading-relaxed font-sans">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1 font-sans">Bàn phím:</div>
                  <div>• <b>Mũi tên / I, K, J, L</b>: Di chuyển hướng Bắc/Nam/Tây/Đông</div>
                  {activeTarget === 'model' ? (
                    <>
                      <div>• <b>U / O</b>: Nâng cao / Hạ thấp cao độ</div>
                      <div>• <b>Q / E</b>: Xoay Heading (Yaw) sang Trái / Phải</div>
                      <div>• <b>T / G</b>: Nghiêng Pitch Lên / Xuống</div>
                      <div>• <b>F / H</b>: Nghiêng Roll Trái / Phải</div>
                    </>
                  ) : activeTarget === 'dom' ? (
                    <>
                      <div>• <b>Q / E</b>: Xoay ảnh DOM sang Trái / Phải</div>
                      <div>• <b>U / O</b>: Thu nhỏ / Phóng to kích thước (Scale)</div>
                    </>
                  ) : (
                    <>
                      <div>• <b>U / O</b>: Nâng cao / Hạ thấp cao độ mây điểm</div>
                      <div>• <b>Q / E</b>: Xoay Heading (Yaw) sang Trái / Phải</div>
                      <div>• <b>T / G</b>: Nghiêng Pitch Lên / Xuống</div>
                      <div>• <b>F / H</b>: Nghiêng Roll Trái / Phải</div>
                    </>
                  )}
                  <div>• <b>+ / -</b>: Tăng / Giảm bước dịch chuyển</div>
                </div>

                {/* Nút hành động */}
                <div className="flex gap-2 font-sans">
                  <button
                    onClick={() => {
                      setOffsets({
                        modelLon: 0,
                        modelLat: 0,
                        modelHeight: 0.3,
                        modelHeading: 0,
                        modelPitch: 0,
                        modelRoll: 0,
                        domLon: 0,
                        domLat: 0,
                        domScale: 1.0,
                        domHeading: 0,
                        pcLon: 0,
                        pcLat: 0,
                        pcHeight: 0,
                        pcHeading: 0,
                        pcPitch: 0,
                        pcRoll: 0
                      });
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:text-white transition-colors font-medium text-center cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={async () => {
                      if (projectId) {
                        localStorage.setItem(`calibration_${projectId}`, JSON.stringify(offsets));
                        const success = await updateProject(projectId, { calibration: JSON.stringify(offsets) });
                        if (success) {
                          alert("💾 Đã lưu và đồng bộ thông số vị trí dự án vào Database thành công!");
                        } else {
                          alert("⚠️ Đã lưu nháp vào máy khách, nhưng không thể kết nối đồng bộ vào Database.");
                        }
                      }
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-center transition-colors shadow-lg shadow-sky-600/20 cursor-pointer"
                  >
                    Lưu Vị Trí
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trắc dọc thật: biểu đồ Distance → Elevation của profile mới nhất */}
        {showMeasurements && activeProfile && activeProfileVisible && (
          <div
            className={`absolute bottom-4 z-30 w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/92 text-slate-100 shadow-2xl backdrop-blur-xl ${
              isAdmin ? 'right-[352px]' : 'right-4'
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 px-4 py-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-400">
                  Trắc dọc cao độ
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {activeProfile.totalDistance.toFixed(2)} m · {activeProfile.samples.length} mẫu
                  {isProfileSampling ? ' · Đang cập nhật...' : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveProfile(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                title="Đóng biểu đồ trắc dọc"
              >
                ×
              </button>
            </div>

            <div className="px-4 pb-3 pt-3">
              <svg
                viewBox="0 0 520 160"
                className="h-[160px] w-full overflow-visible rounded-xl bg-slate-900/70"
                role="img"
                aria-label="Biểu đồ khoảng cách và cao độ trắc dọc"
              >
                {[0.25, 0.5, 0.75].map(ratio => (
                  <line
                    key={`h-${ratio}`}
                    x1="18"
                    x2="502"
                    y1={18 + 124 * ratio}
                    y2={18 + 124 * ratio}
                    stroke="rgba(148,163,184,.16)"
                    strokeWidth="1"
                  />
                ))}
                {[0.25, 0.5, 0.75].map(ratio => (
                  <line
                    key={`v-${ratio}`}
                    y1="18"
                    y2="142"
                    x1={18 + 484 * ratio}
                    x2={18 + 484 * ratio}
                    stroke="rgba(148,163,184,.12)"
                    strokeWidth="1"
                  />
                ))}

                <polyline
                  points={buildProfileChartPoints(activeProfile)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                <text x="20" y="15" fill="#94a3b8" fontSize="9">
                  {activeProfile.maxHeight.toFixed(2)} m
                </text>
                <text x="20" y="154" fill="#94a3b8" fontSize="9">
                  {activeProfile.minHeight.toFixed(2)} m
                </text>
                <text x="465" y="154" fill="#94a3b8" fontSize="9">
                  {activeProfile.totalDistance.toFixed(1)} m
                </text>
              </svg>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-2">
                  <div className="text-[9px] uppercase text-slate-500">H min</div>
                  <div className="mt-0.5 text-[11px] font-bold text-slate-200">
                    {activeProfile.minHeight.toFixed(2)} m
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-2">
                  <div className="text-[9px] uppercase text-slate-500">H max</div>
                  <div className="mt-0.5 text-[11px] font-bold text-slate-200">
                    {activeProfile.maxHeight.toFixed(2)} m
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-2">
                  <div className="text-[9px] uppercase text-slate-500">Tăng</div>
                  <div className="mt-0.5 text-[11px] font-bold text-emerald-400">
                    +{activeProfile.elevationGain.toFixed(2)} m
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-2">
                  <div className="text-[9px] uppercase text-slate-500">Giảm</div>
                  <div className="mt-0.5 text-[11px] font-bold text-rose-400">
                    -{activeProfile.elevationLoss.toFixed(2)} m
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500">
                <span>Scene/3D Tiles: {activeProfile.sceneSampleCount}</span>
                <span>Terrain: {activeProfile.terrainSampleCount}</span>
                {activeProfile.fallbackSampleCount > 0 && (
                  <span className="text-amber-400">
                    Nội suy fallback: {activeProfile.fallbackSampleCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hướng dẫn động nổi dưới đáy */}
        {toolMode !== 'none' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-slate-100 px-6 py-3 rounded-full backdrop-blur-sm pointer-events-none border border-slate-700/50 shadow-lg text-xs font-semibold tracking-wider uppercase">
            {toolMode === 'distance' && (measurementPoints.length === 0
              ? "⚡ Click điểm đầu tiên để bắt đầu đo khoảng cách"
              : "⚡ Click chốt điểm tiếp theo. Click đúp (Double click) để hoàn thành")}
            {toolMode === 'height' && (measurementPoints.length === 0
              ? "📐 Click điểm mốc đầu tiên (mặt đất/gốc vật thể)"
              : "📐 Di chuột và click điểm thứ hai (đỉnh/ngọn vật thể) để đo chiều cao")}
            {toolMode === 'area' && (measurementPoints.length === 0
              ? "🟩 Click điểm đầu tiên để vẽ vùng diện tích"
              : "🟩 Click các đỉnh đa giác. Click đúp để chốt vùng diện tích")}
            {toolMode === 'profile' && (measurementPoints.length === 0
              ? "📈 Click điểm đầu tiên để bắt đầu tuyến trắc dọc"
              : "📈 Click thêm các đỉnh tuyến. Double-click để lấy mẫu cao độ và mở biểu đồ")}
          </div>
        )}
      </div>
    );
  }

export default CesiumViewer;
