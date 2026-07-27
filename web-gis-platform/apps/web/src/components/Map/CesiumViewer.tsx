import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { PotreeSidebar } from './PotreeSidebar';
import { OptimizerPanel } from './OptimizerPanel';
import { fetchProjectById, updateProject } from '../../services/api';

export type ToolMode = 'none' | 'distance' | 'height' | 'area';

// Hàm tính diện tích đa giác trên mặt phẳng tiếp tuyến địa phương (ENU)
function calculatePolygonArea(positions: Cesium.Cartesian3[]): number {
  if (positions.length < 3) return 0;

  const center = positions[0];
  const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const inverseMatrix = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());

  const localPoints = positions.map(pos => {
    const local = Cesium.Matrix4.multiplyByPoint(inverseMatrix, pos, new Cesium.Cartesian3());
    return { x: local.x, y: local.y };
  });

  let area = 0;
  const n = localPoints.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += localPoints[i].x * localPoints[j].y;
    area -= localPoints[j].x * localPoints[i].y;
  }
  return Math.abs(area) / 2;
}

// Hàm tính tâm điểm (Centroid) đa giác để đặt nhãn kết quả
function calculateCentroid(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  const sum = new Cesium.Cartesian3();
  positions.forEach(pos => {
    Cesium.Cartesian3.add(sum, pos, sum);
  });
  return Cesium.Cartesian3.multiplyByScalar(sum, 1 / positions.length, new Cesium.Cartesian3());
}

export const CesiumViewer: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  const modelRef = useRef<Cesium.Model | null>(null);
  const domLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const pointCloudRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const measureDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

  const [project, setProject] = useState<any>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [measurementPoints, setMeasurementPoints] = useState<Cesium.Cartesian3[]>([]);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

  // States quản lý bật tắt layer
  const [showModel, setShowModel] = useState(true);
  const [showDom, setShowDom] = useState(true);
  const [showPointCloud, setShowPointCloud] = useState(true);

  // States quản lý Appearance (Ngoại quan Potree)
  const [pointSize, setPointSize] = useState(2);
  const [pointDensity, setPointDensity] = useState<'max' | 'high' | 'standard'>('max');
  const [fov, setFov] = useState(60);
  const [edlEnabled, setEdlEnabled] = useState(true);
  const [isOrthographic, setIsOrthographic] = useState(false);

  // Fetch thông tin dự án khi projectId thay đổi
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).then(data => {
        if (data) setProject(data);
      });
    }
  }, [projectId]);

  // States và refs quản lý tinh chỉnh vị trí của Admin (Calibration)
  const [offsets, setOffsets] = useState({
    modelLon: 0,
    modelLat: 0,
    modelHeight: 0.3,
    modelHeading: 0,
    domLon: 0,
    domLat: 0,
    domScale: 1.0,
    pcLon: 0,
    pcLat: 0,
    pcHeight: 0
  });
  const [activeTarget, setActiveTarget] = useState<'model' | 'dom' | 'pointcloud' | 'none'>('none');
  const [stepSize, setStepSize] = useState(1.0); // bước nhảy mét mặc định là 1m thay vì 0.1m
  const originalBoundsRef = useRef({ west: 0, east: 0, south: 0, north: 0 });
  const offsetsRef = useRef(offsets);
  const initialPcTranslationRef = useRef<Cesium.Cartesian3 | null>(null);

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
          domLon: 0,
          domLat: 0,
          domScale: 1.0,
          pcLon: 0,
          pcLat: 0,
          pcHeight: 0
        });
      }
    }
  }, [project]);

  // Lưu trữ bounds cơ sở của dự án để tính offset
  useEffect(() => {
    if (!project) return;
    const baseLon = project.centerLon || 106.8099;
    const baseLat = project.centerLat || 10.8404;
    let lon = baseLon;
    let lat = baseLat;
    if (lon < 90 && lat > 90) {
      lon = baseLat;
      lat = baseLon;
    }

    const deltaLatitude = 142.222 / 111111;
    const deltaLongitude = 143.532 / (111111 * Math.cos(lat * Math.PI / 180));

    originalBoundsRef.current = {
      west: lon - deltaLongitude / 2,
      east: lon + deltaLongitude / 2,
      south: lat - deltaLatitude / 2,
      north: lat + deltaLatitude / 2
    };
  }, [project]);

  // Cập nhật thời gian thực Model 3D khi tinh chỉnh (offset/rotation)
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
    const heading = Cesium.Math.toRadians(offsets.modelHeading);
    const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    modelRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromQuaternion(orientation),
      position
    );
  }, [offsets.modelLon, offsets.modelLat, offsets.modelHeight, offsets.modelHeading, project]);

  // Cập nhật thời gian thực ảnh DOM khi tinh chỉnh (offset/scale)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !project) return;

    let isCurrent = true;

    const updateDomRealtime = async () => {
      const baseLon = project.centerLon || 106.8099;
      const baseLat = project.centerLat || 10.8404;
      let lon = baseLon;
      let lat = baseLat;
      if (lon < 90 && lat > 90) {
        lon = baseLat;
        lat = baseLon;
      }

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
      const halfWidth = ((east - west) / 2) * offsets.domScale;
      const halfHeight = ((north - south) / 2) * offsets.domScale;

      const finalWest = centerLon - halfWidth + offsets.domLon;
      const finalEast = centerLon + halfWidth + offsets.domLon;
      const finalSouth = centerLat - halfHeight + offsets.domLat;
      const finalNorth = centerLat + halfHeight + offsets.domLat;

      const domRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);
      const domUrl = project.domUrl || '/dom.png';

      try {
        const provider = await Cesium.SingleTileImageryProvider.fromUrl(domUrl, {
          rectangle: domRectangle,
        });

        // Chỉ add và remove khi effect này là effect mới nhất (tránh chồng chéo bất đồng bộ)
        if (!isCurrent) return;

        if (domLayerRef.current) {
          viewer.imageryLayers.remove(domLayerRef.current);
        }

        const domLayer = viewer.imageryLayers.addImageryProvider(provider);
        domLayerRef.current = domLayer;
        domLayer.show = showDom;
      } catch (err) {
        if (isCurrent) {
          console.error("Lỗi khi cập nhật ảnh DOM realtime:", err);
        }
      }
    };

    updateDomRealtime();

    return () => {
      isCurrent = false;
    };
  }, [offsets.domLon, offsets.domLat, offsets.domScale, showDom, project]);

  // Cập nhật vị trí Point Cloud theo thời gian thực khi Admin hiệu chỉnh
  useEffect(() => {
    if (!pointCloudRef.current || !project || !initialPcTranslationRef.current) return;
    const tileset = pointCloudRef.current;

    const baseLon = project.centerLon || 106.8099;
    const baseLat = project.centerLat || 10.8404;

    const pcLon = offsets.pcLon || 0;
    const pcLat = offsets.pcLat || 0;
    const pcHeight = offsets.pcHeight || 0;

    const basePos = Cesium.Cartesian3.fromDegrees(baseLon, baseLat, 0);
    const offsetPos = Cesium.Cartesian3.fromDegrees(baseLon + pcLon, baseLat + pcLat, pcHeight);
    const deltaVector = Cesium.Cartesian3.subtract(offsetPos, basePos, new Cesium.Cartesian3());

    const totalTranslation = Cesium.Cartesian3.add(
      initialPcTranslationRef.current,
      deltaVector,
      new Cesium.Cartesian3()
    );

    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(totalTranslation);
  }, [offsets.pcLon, offsets.pcLat, offsets.pcHeight, project]);

  // Cập nhật Mật Độ Point Cloud (Screen Space Error & Memory Limit)
  useEffect(() => {
    if (!pointCloudRef.current) return;
    const tileset = pointCloudRef.current;
    (tileset as any).skipLevelOfDetail = true;
    (tileset as any).cullRequestsByFrustum = true;
    (tileset as any).preferLeaves = true;

    if (pointDensity === 'max') {
      tileset.maximumScreenSpaceError = 1.0; // Render cực đại 238 triệu điểm cực kỳ mượt
      (tileset as any).maximumMemoryUsage = 2048; // 2GB GPU Cache tối ưu
      console.log("🔥 Đã bật chế độ Mật độ Point Cloud CỰC ĐẠI (238Tr điểm, SSE = 1.0)");
    } else if (pointDensity === 'high') {
      tileset.maximumScreenSpaceError = 4;
      (tileset as any).maximumMemoryUsage = 1024;
    } else {
      tileset.maximumScreenSpaceError = 16;
      (tileset as any).maximumMemoryUsage = 512;
    }
  }, [pointDensity]);

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
            setOffsets(prev => ({ ...prev, domScale: Math.max(0.1, prev.domScale - 0.005) }));
            break;
          case 'e':
            e.preventDefault();
            setOffsets(prev => ({ ...prev, domScale: prev.domScale + 0.005 }));
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
    });

    viewerRef.current = viewer;
    viewer.scene.pickTranslucentDepth = true;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.maximumScreenSpaceError = isMobile ? 4.0 : 2.0; // Giảm chất lượng địa hình trên mobile để mượt hơn

    Cesium.createWorldTerrainAsync()
      .then((provider) => {
        if (!viewer.isDestroyed()) viewer.terrainProvider = provider;
      })
      .catch((e) => console.error("Lỗi khi load terrain mặc định:", e));

    const measureDataSource = new Cesium.CustomDataSource('measurements');
    viewer.dataSources.add(measureDataSource);
    measureDataSourceRef.current = measureDataSource;

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // Nạp dữ liệu khi dự án (project) thay đổi
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !project) return;

    let isCurrent = true;

    // 1. Dọn dẹp sạch sẽ các lớp dữ liệu của dự án cũ trước khi nạp dự án mới
    try {
      if (modelRef.current) {
        viewer.scene.primitives.remove(modelRef.current);
        modelRef.current = null;
      }
      if (pointCloudRef.current) {
        viewer.scene.primitives.remove(pointCloudRef.current);
        pointCloudRef.current = null;
      }
      if (domLayerRef.current) {
        viewer.imageryLayers.remove(domLayerRef.current, false);
        domLayerRef.current = null;
      }
      viewer.scene.primitives.removeAll();
      initialPcTranslationRef.current = null;
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

        if (project.calibration) {
          try {
            const parsed = JSON.parse(project.calibration);
            initLon = parsed.modelLon ?? 0;
            initLat = parsed.modelLat ?? 0;
            initHeight = parsed.modelHeight ?? 0.3;
            initHeading = parsed.modelHeading ?? 0;
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
            } catch (e) {}
          }
        }

        const position = Cesium.Cartesian3.fromDegrees(
          longitude + initLon,
          latitude + initLat,
          initHeight
        );
        const heading = Cesium.Math.toRadians(initHeading);
        const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        const modelMatrix = Cesium.Matrix4.fromRotationTranslation(
          Cesium.Matrix3.fromQuaternion(orientation),
          position
        );

        console.log("Nạp 3D model từ:", modelUrl);
        const model = await Cesium.Model.fromGltfAsync({
          url: modelUrl,
          modelMatrix: modelMatrix,
          scale: 1.0,
        });

        if (!isCurrent || viewer.isDestroyed()) return;
        viewer.scene.primitives.add(model);
        modelRef.current = model;
        model.show = showModel;

        const targetSphere = new Cesium.BoundingSphere(position, 100.0);
        viewer.camera.flyToBoundingSphere(targetSphere, {
          duration: 3,
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-35),
            180
          )
        });
      } catch (error) {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          console.error("Lỗi khi load mô hình 3D:", error);
        }
      }
    };

    // 2. Nạp ảnh phẳng hàng không DOM
    const loadDomLayer = async () => {
      let domScale = 1.0;
      let domLon = 0;
      let domLat = 0;

      if (project.calibration) {
        try {
          const parsed = JSON.parse(project.calibration);
          domScale = parsed.domScale ?? 1.0;
          domLon = parsed.domLon ?? 0;
          domLat = parsed.domLat ?? 0;
        } catch (e) {
          console.error("Lỗi parse calibration trong loadDomLayer:", e);
        }
      } else {
        const saved = localStorage.getItem(`calibration_${project.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            domScale = parsed.domScale ?? 1.0;
            domLon = parsed.domLon ?? 0;
            domLat = parsed.domLat ?? 0;
          } catch (e) {}
        }
      }

      const deltaLatitude = 142.222 / 111111;
      const deltaLongitude = 143.532 / (111111 * Math.cos(latitude * Math.PI / 180));

      let west = longitude - deltaLongitude / 2;
      let east = longitude + deltaLongitude / 2;
      let south = latitude - deltaLatitude / 2;
      let north = latitude + deltaLatitude / 2;

      if (project.metadataUrl) {
        try {
          const res = await fetch(project.metadataUrl);
          const meta = await res.json();
          west = meta.west || west;
          east = meta.east || east;
          south = meta.south || south;
          north = meta.north || north;
          originalBoundsRef.current = { west, east, south, north };
          console.log("Đã đọc bounding box DOM từ metadata.json:", meta);
        } catch (e) {
          console.error("Không thể tải metadata DOM, dùng mặc định:", e);
        }
      }

      const centerLon = (west + east) / 2;
      const centerLat = (south + north) / 2;
      const halfWidth = ((east - west) / 2) * domScale;
      const halfHeight = ((north - south) / 2) * domScale;

      const finalWest = centerLon - halfWidth + domLon;
      const finalEast = centerLon + halfWidth + domLon;
      const finalSouth = centerLat - halfHeight + domLat;
      const finalNorth = centerLat + halfHeight + domLat;

      const domRectangle = Cesium.Rectangle.fromDegrees(finalWest, finalSouth, finalEast, finalNorth);
      const domUrl = project.domUrl;
      if (!domUrl) {
        console.log("Dự án này không có ảnh phẳng DOM.");
        return;
      }
      console.log("Nạp ảnh DOM từ:", domUrl);

      Cesium.SingleTileImageryProvider.fromUrl(domUrl, {
        rectangle: domRectangle,
      }).then((provider) => {
        if (!isCurrent || viewer.isDestroyed()) return;
        const domLayer = viewer.imageryLayers.addImageryProvider(provider);
        domLayerRef.current = domLayer;
        domLayer.show = showDom;
      }).catch((error) => {
        console.error("Lỗi khi nạp lớp ảnh DOM:", error);
      });
    };

    // Hàm hỗ trợ: Áp dụng calibration offset cho một tileset
    const applyPcCalibration = (tileset: Cesium.Cesium3DTileset, targetPos: Cesium.Cartesian3) => {
      if (!tileset.boundingSphere) return;
      const bsCenter = tileset.boundingSphere.center;
      const initialTranslation = Cesium.Cartesian3.subtract(targetPos, bsCenter, new Cesium.Cartesian3());
      initialPcTranslationRef.current = initialTranslation;

      let pcLon = 0, pcLat = 0, pcHeight = 0;
      if (project.calibration) {
        try {
          const parsed = JSON.parse(project.calibration);
          pcLon = parsed.pcLon ?? 0;
          pcLat = parsed.pcLat ?? 0;
          pcHeight = parsed.pcHeight ?? 0;
        } catch (e) {}
      } else {
        const saved = localStorage.getItem(`calibration_${project.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            pcLon = parsed.pcLon ?? 0;
            pcLat = parsed.pcLat ?? 0;
            pcHeight = parsed.pcHeight ?? 0;
          } catch (e) {}
        }
      }

      const basePos = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
      const offsetPos = Cesium.Cartesian3.fromDegrees(longitude + pcLon, latitude + pcLat, pcHeight);
      const deltaVector = Cesium.Cartesian3.subtract(offsetPos, basePos, new Cesium.Cartesian3());
      const totalTranslation = Cesium.Cartesian3.add(initialTranslation, deltaVector, new Cesium.Cartesian3());
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(totalTranslation);
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
          tileset.show = showPointCloud;
          (tileset as any).skipLevelOfDetail = false;
          (tileset as any).cullRequestsByFrustum = true;
          (tileset as any).preferLeaves = false;
          tileset.maximumScreenSpaceError = isMobile ? 64 : 32; // Tăng sai số vẽ trên mobile để mượt hơn
          (tileset as any).maximumMemoryUsage = isMobile ? 128 : 512; // Giới hạn cache RAM cho mây điểm tránh crash trình duyệt
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
              for (const tileName of tilesToLoad) {
                try {
                  const tileUrl = baseUrl + tileName;
                  const ts = await Cesium.Cesium3DTileset.fromUrl(tileUrl);
                  if (!isCurrent || viewer.isDestroyed()) return;
                  viewer.scene.primitives.add(ts);
                  ts.show = showPointCloud;
                  (ts as any).skipLevelOfDetail = false;
                  (ts as any).cullRequestsByFrustum = true;
                  (ts as any).preferLeaves = false;
                  ts.maximumScreenSpaceError = isMobile ? 64 : 32;
                  (ts as any).maximumMemoryUsage = isMobile ? 128 : 512;
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
          tileset.show = showPointCloud;
          (tileset as any).skipLevelOfDetail = false;
          (tileset as any).cullRequestsByFrustum = true;
          (tileset as any).preferLeaves = false;
          tileset.maximumScreenSpaceError = isMobile ? 64 : 32;
          (tileset as any).maximumMemoryUsage = isMobile ? 128 : 512;
          applyPcCalibration(tileset, targetPosition);
          return;
        }

        console.warn("Không nhận diện được định dạng pointCloudId:", pcId);
      } catch (error) {
        console.error("Lỗi khi load Point Cloud:", error);
      }
    };

    loadOfflineModel();
    loadDomLayer();
    loadPointCloud();

    return () => {
      isCurrent = false;
      try {
        if (modelRef.current) {
          viewer.scene.primitives.remove(modelRef.current);
          modelRef.current = null;
        }
        if (pointCloudRef.current) {
          viewer.scene.primitives.remove(pointCloudRef.current);
          pointCloudRef.current = null;
        }
        if (domLayerRef.current) {
          viewer.imageryLayers.remove(domLayerRef.current, false);
          domLayerRef.current = null;
        }
        viewer.scene.primitives.removeAll();
      } catch (e) {}
    };
  }, [project?.id]);

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
    if (pointCloudRef.current) {
      pointCloudRef.current.show = showPointCloud;
    }
  }, [showPointCloud]);

  // Cập nhật Kích thước Điểm (Point Size) của Point Cloud
  useEffect(() => {
    if (pointCloudRef.current) {
      pointCloudRef.current.style = new Cesium.Cesium3DTileStyle({
        pointSize: pointSize
      });
    }
  }, [pointSize]);

  // Cập nhật Góc nhìn (Field of View)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      // TypeScript hiểu frustum có thể là loại khác nên cần ép kiểu
      (viewer.camera.frustum as Cesium.PerspectiveFrustum).fov = Cesium.Math.toRadians(fov);
    }
  }, [fov]);

  // Cập nhật Shading (Eye Dome Lighting)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed() && (viewer.scene.postProcessStages as any).eyeDomeLighting) {
      (viewer.scene.postProcessStages as any).eyeDomeLighting.enabled = edlEnabled;
    }
  }, [edlEnabled]);

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

  // Xử lý logic đo đạc kiểu Potree (Khoảng cách, Cao độ, Diện tích)
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

    // Tắt kéo thả bản đồ khi đang đo đạc để tránh xung đột thao tác
    viewer.scene.screenSpaceCameraController.enableInputs = true;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    const measureDS = measureDataSourceRef.current;
    if (!measureDS) return;

    let activePoints: Cesium.Cartesian3[] = [];
    let mousePosition: Cesium.Cartesian3 | null = null;
    
    // Mảng lưu các entities tạm thời đang vẽ
    let tempEntities: Cesium.Entity[] = [];

    const clearTempEntities = () => {
      tempEntities.forEach(ent => measureDS.entities.remove(ent));
      tempEntities = [];
    };

    // Hàm phụ trợ tính điểm chiếu phẳng ENU cho đo cao độ
    const getProjectedPoint = (pointA: Cesium.Cartesian3, pointB: Cesium.Cartesian3): Cesium.Cartesian3 => {
      const cartoA = Cesium.Cartographic.fromCartesian(pointA);
      const cartoB = Cesium.Cartographic.fromCartesian(pointB);
      const cartoProj = new Cesium.Cartographic(cartoB.longitude, cartoB.latitude, cartoA.height);
      return Cesium.Cartographic.toCartesian(cartoProj);
    };

    // Hàm phụ trợ tính trung điểm đặt nhãn hiển thị
    const getMidpoint = (p1: Cesium.Cartesian3, p2: Cesium.Cartesian3): Cesium.Cartesian3 => {
      const res = new Cesium.Cartesian3();
      Cesium.Cartesian3.add(p1, p2, res);
      return Cesium.Cartesian3.multiplyByScalar(res, 0.5, res);
    };

    // 1. CHẾ ĐỘ: ĐO KHOẢNG CÁCH NHIỀU ĐIỂM (POTREE STYLE)
    if (toolMode === 'distance') {
      // Bắt sự kiện chuột di chuyển để vẽ đường dóng động
      handler.setInputAction((movement: any) => {
        const cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!cartesian) return;
        mousePosition = cartesian;

        // Xóa đường dóng tạm cũ
        clearTempEntities();

        if (activePoints.length > 0) {
          const lastPoint = activePoints[activePoints.length - 1];
          // Tính khoảng cách từ điểm cuối tới vị trí chuột
          const distSegment = Cesium.Cartesian3.distance(lastPoint, mousePosition);
          
          // Tính tổng khoảng cách lũy kế
          let totalDist = 0;
          for (let i = 0; i < activePoints.length - 1; i++) {
            totalDist += Cesium.Cartesian3.distance(activePoints[i], activePoints[i+1]);
          }
          totalDist += distSegment;

          // Vẽ đường dóng tạm nét đứt
          const hoverLine = measureDS.entities.add({
            polyline: {
              positions: [lastPoint, mousePosition],
              width: 2,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.YELLOW.withAlpha(0.8),
                dashLength: 8
              }),
              depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.YELLOW.withAlpha(0.3),
                dashLength: 8
              })
            }
          });
          tempEntities.push(hoverLine);

          // Nhãn hiển thị khoảng cách động tại vị trí chuột
          const hoverLabel = measureDS.entities.add({
            position: mousePosition,
            label: {
              text: `+${distSegment.toFixed(2)} m (Tổng: ${totalDist.toFixed(2)} m)`,
              font: 'bold 12px sans-serif',
              fillColor: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -15),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          tempEntities.push(hoverLabel);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Bắt sự kiện click chuột trái để chốt các điểm đo
      handler.setInputAction((click: any) => {
        const cartesian = viewer.scene.pickPosition(click.position);
        if (!cartesian) return;

        activePoints.push(cartesian);
        setMeasurementPoints([...activePoints]);

        // Thêm điểm chốt cố định
        measureDS.entities.add({
          position: cartesian,
          point: {
            pixelSize: 10,
            color: Cesium.Color.SKYBLUE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });

        // Vẽ đường nối cố định nếu từ 2 điểm trở lên
        if (activePoints.length > 1) {
          const p1 = activePoints[activePoints.length - 2];
          const p2 = activePoints[activePoints.length - 1];
          const segmentDist = Cesium.Cartesian3.distance(p1, p2);

          measureDS.entities.add({
            polyline: {
              positions: [p1, p2],
              width: 3,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.SKYBLUE,
                outlineWidth: 1.5,
                outlineColor: Cesium.Color.BLACK,
              })
            }
          });

          // Nhãn hiển thị khoảng cách của đoạn đó tại trung điểm
          measureDS.entities.add({
            position: getMidpoint(p1, p2),
            label: {
              text: `${segmentDist.toFixed(2)} m`,
              font: 'bold 13px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Click đúp chuột trái để kết thúc đo khoảng cách
      handler.setInputAction(() => {
        clearTempEntities();
        // Nhãn tổng kết ở điểm cuối cùng
        if (activePoints.length > 1) {
          let totalDist = 0;
          for (let i = 0; i < activePoints.length - 1; i++) {
            totalDist += Cesium.Cartesian3.distance(activePoints[i], activePoints[i+1]);
          }

          measureDS.entities.add({
            position: activePoints[activePoints.length - 1],
            label: {
              text: `TỔNG KHOẢNG CÁCH: ${totalDist.toFixed(2)} m`,
              font: 'bold 14px sans-serif',
              fillColor: Cesium.Color.GREENYELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 4,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -25),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        }
        setToolMode('none');
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    // 2. CHẾ ĐỘ: ĐO CHIỀU CAO ĐỨNG (HEIGHT POTREE STYLE - ĐỘC QUYỀN)
    if (toolMode === 'height') {
      // Di chuyển chuột: Vẽ tam giác dóng gồm Cạnh huyền, Cạnh đáy (ngang) và Cạnh đứng (cao độ)
      handler.setInputAction((movement: any) => {
        const cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!cartesian) return;
        mousePosition = cartesian;

        clearTempEntities();

        if (activePoints.length > 0) {
          const startPoint = activePoints[0];
          const endPoint = mousePosition;
          
          // Điểm chiếu xuống mặt phẳng nằm ngang của điểm gốc
          const projPoint = getProjectedPoint(startPoint, endPoint);

          // Tính các khoảng cách đo
          const slantDist = Cesium.Cartesian3.distance(startPoint, endPoint);
          const horizDist = Cesium.Cartesian3.distance(startPoint, projPoint);
          
          // Tính hiệu độ cao thực tế (chênh lệch Z)
          const cartoStart = Cesium.Cartographic.fromCartesian(startPoint);
          const cartoEnd = Cesium.Cartographic.fromCartesian(endPoint);
          const heightDiff = cartoEnd.height - cartoStart.height;

          // 1. Vẽ đường xiên (slant) nối trực tiếp
          const slantLine = measureDS.entities.add({
            polyline: {
              positions: [startPoint, endPoint],
              width: 2,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.CYAN,
                dashLength: 6
              })
            }
          });
          tempEntities.push(slantLine);

          // 2. Vẽ đường ngang (horizontal projection)
          const horizLine = measureDS.entities.add({
            polyline: {
              positions: [startPoint, projPoint],
              width: 2,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.LIGHTGRAY,
                dashLength: 6
              })
            }
          });
          tempEntities.push(horizLine);

          // 3. Vẽ cột đứng (vertical height)
          const vertLine = measureDS.entities.add({
            polyline: {
              positions: [projPoint, endPoint],
              width: 3,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.RED,
                outlineWidth: 1,
                outlineColor: Cesium.Color.BLACK
              })
            }
          });
          tempEntities.push(vertLine);

          // 4. Vẽ mặt tam giác dóng mờ
          const triangleFace = measureDS.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy([startPoint, projPoint, endPoint]),
              material: Cesium.Color.CYAN.withAlpha(0.15),
              outline: false
            }
          });
          tempEntities.push(triangleFace);

          // 5. Thêm nhãn đo cho từng cạnh tam giác dóng
          // Nhãn chênh cao (Vertical Height) - Cạnh đứng màu đỏ
          const vLabel = measureDS.entities.add({
            position: getMidpoint(projPoint, endPoint),
            label: {
              text: `Chiều cao (V): ${heightDiff.toFixed(2)} m`,
              font: 'bold 14px sans-serif',
              fillColor: Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(15, 0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          tempEntities.push(vLabel);

          // Nhãn khoảng cách ngang (Horizontal) - Cạnh đáy
          const hLabel = measureDS.entities.add({
            position: getMidpoint(startPoint, projPoint),
            label: {
              text: `Ngang (H): ${horizDist.toFixed(2)} m`,
              font: 'bold 12px sans-serif',
              fillColor: Cesium.Color.LIGHTGRAY,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.TOP,
              pixelOffset: new Cesium.Cartesian2(0, 10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          tempEntities.push(hLabel);

          // Nhãn khoảng cách xiên (Slant) - Cạnh huyền
          const sLabel = measureDS.entities.add({
            position: getMidpoint(startPoint, endPoint),
            label: {
              text: `Xiên (S): ${slantDist.toFixed(2)} m`,
              font: 'bold 12px sans-serif',
              fillColor: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          tempEntities.push(sLabel);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Bắt sự kiện click chốt điểm
      handler.setInputAction((click: any) => {
        const cartesian = viewer.scene.pickPosition(click.position);
        if (!cartesian) return;

        if (activePoints.length === 0) {
          // Điểm thứ 1: Gốc đo
          activePoints.push(cartesian);
          
          measureDS.entities.add({
            position: cartesian,
            point: {
              pixelSize: 10,
              color: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        } else {
          // Điểm thứ 2: Chốt và kết thúc đo chiều cao
          const startPoint = activePoints[0];
          const endPoint = cartesian;
          const projPoint = getProjectedPoint(startPoint, endPoint);

          const slantDist = Cesium.Cartesian3.distance(startPoint, endPoint);
          const horizDist = Cesium.Cartesian3.distance(startPoint, projPoint);
          console.log(`Measured slant distance: ${slantDist.toFixed(2)}m, horizontal: ${horizDist.toFixed(2)}m`);
          
          const cartoStart = Cesium.Cartographic.fromCartesian(startPoint);
          const cartoEnd = Cesium.Cartographic.fromCartesian(endPoint);
          const heightDiff = cartoEnd.height - cartoStart.height;

          // Chốt cố định toàn bộ cụm tam giác dóng đo đạc
          measureDS.entities.add({
            polyline: {
              positions: [startPoint, endPoint],
              width: 2,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1
              })
            }
          });

          measureDS.entities.add({
            polyline: {
              positions: [startPoint, projPoint],
              width: 2,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.DARKGRAY,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1
              })
            }
          });

          measureDS.entities.add({
            polyline: {
              positions: [projPoint, endPoint],
              width: 3.5,
              material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1.5
              })
            }
          });

          measureDS.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy([startPoint, projPoint, endPoint]),
              material: Cesium.Color.CYAN.withAlpha(0.2),
              outline: false
            }
          });

          // Điểm chốt ngọn
          measureDS.entities.add({
            position: endPoint,
            point: {
              pixelSize: 10,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });

          // Nhãn chốt cuối cùng
          measureDS.entities.add({
            position: getMidpoint(projPoint, endPoint),
            label: {
              text: `CHIỀU CAO (ΔZ): ${heightDiff.toFixed(2)} m`,
              font: 'bold 14px sans-serif',
              fillColor: Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(15, 0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });

          measureDS.entities.add({
            position: getMidpoint(startPoint, projPoint),
            label: {
              text: `Ngang: ${horizDist.toFixed(2)} m`,
              font: 'bold 11px sans-serif',
              fillColor: Cesium.Color.LIGHTGRAY,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.TOP,
              pixelOffset: new Cesium.Cartesian2(0, 10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });

          // Dọn dẹp dóng tạm và tắt công cụ
          clearTempEntities();
          setToolMode('none');
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // 3. CHẾ ĐỘ: ĐO DIỆN TÍCH
    if (toolMode === 'area') {
      // Di chuyển chuột: Vẽ đường đa giác dóng tạm thời từ điểm chốt cuối tới chuột
      handler.setInputAction((movement: any) => {
        const cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!cartesian) return;
        mousePosition = cartesian;

        clearTempEntities();

        if (activePoints.length >= 1) {
          const pointsWithMouse = [...activePoints, mousePosition];
          
          // Vẽ đường biên tạm nét đứt
          const hoverPoly = measureDS.entities.add({
            polyline: {
              positions: pointsWithMouse,
              width: 2,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.ORANGE.withAlpha(0.8),
                dashLength: 8
              })
            }
          });
          tempEntities.push(hoverPoly);

          // Nếu đủ 2 điểm trở lên chốt + chuột = 3 điểm -> vẽ diện tích tạm
          if (pointsWithMouse.length >= 3) {
            const hoverPolygon = measureDS.entities.add({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(pointsWithMouse),
                material: Cesium.Color.ORANGE.withAlpha(0.15),
                outline: false
              }
            });
            tempEntities.push(hoverPolygon);

            const area = calculatePolygonArea(pointsWithMouse);
            const centroid = calculateCentroid(pointsWithMouse);

            const hoverLabel = measureDS.entities.add({
              position: centroid,
              label: {
                text: `Diện tích tạm: ${area.toFixed(2)} m²`,
                font: 'bold 13px sans-serif',
                fillColor: Cesium.Color.ORANGE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
            });
            tempEntities.push(hoverLabel);
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Click chuột trái để chốt các đỉnh đa giác diện tích
      handler.setInputAction((click: any) => {
        const cartesian = viewer.scene.pickPosition(click.position);
        if (!cartesian) return;

        activePoints.push(cartesian);
        setMeasurementPoints([...activePoints]);

        // Đỉnh chốt
        measureDS.entities.add({
          position: cartesian,
          point: {
            pixelSize: 8,
            color: Cesium.Color.ORANGE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });

        // Vẽ đa giác diện tích cố định tăng dần
        if (activePoints.length >= 3) {
          const oldPolygon = measureDS.entities.getById('fixed-polygon');
          if (oldPolygon) measureDS.entities.remove(oldPolygon);

          measureDS.entities.add({
            id: 'fixed-polygon',
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(activePoints),
              material: Cesium.Color.ORANGE.withAlpha(0.35),
              outline: true,
              outlineColor: Cesium.Color.ORANGE,
              outlineWidth: 2.5
            }
          });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Click đúp chuột trái kết thúc đa giác đo diện tích
      handler.setInputAction(() => {
        clearTempEntities();

        if (activePoints.length >= 3) {
          const area = calculatePolygonArea(activePoints);
          const centroid = calculateCentroid(activePoints);

          measureDS.entities.add({
            position: centroid,
            label: {
              text: `TỔNG DIỆN TÍCH: ${area.toFixed(2)} m²`,
              font: 'bold 15px sans-serif',
              fillColor: Cesium.Color.ORANGE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 4,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        }
        setToolMode('none');
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }
  }, [toolMode]);

  const handleFocusProject = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(106.8099, 10.8404 - 0.002, 200),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-30),
        roll: 0.0
      },
      duration: 2
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

  const handleClear = () => {
    measureDataSourceRef.current?.entities.removeAll();
    setMeasurementPoints([]);
    setToolMode('none');
  };

  return (
    <div className="relative w-full h-screen">
      {/* Component Potree Sidebar điều khiển bên trái */}
      <PotreeSidebar
        currentMode={toolMode}
        onModeChange={setToolMode}
        onClear={handleClear}
        isOptimizerOpen={isOptimizerOpen}
        onToggleOptimizer={() => setIsOptimizerOpen(!isOptimizerOpen)}
        showModel={showModel}
        setShowModel={setShowModel}
        showDom={showDom}
        setShowDom={setShowDom}
        showPointCloud={showPointCloud}
        setShowPointCloud={setShowPointCloud}
        pointSize={pointSize}
        onPointSizeChange={setPointSize}
        pointDensity={pointDensity}
        onPointDensityChange={setPointDensity}
        fov={fov}
        onFovChange={setFov}
        edlEnabled={edlEnabled}
        onEdlToggle={setEdlEnabled}
        isOrthographic={isOrthographic}
        onProjectionChange={setIsOrthographic}
        onFocusProject={handleFocusProject}
        onFocusPointCloud={handleFocusPointCloud}
      />

      {/* Component Optimizer Panel */}
      {isOptimizerOpen && (
        <OptimizerPanel projectId={projectId} onClose={() => setIsOptimizerOpen(false)} />
      )}

      {/* Container chứa bản đồ 3D */}
      <div ref={cesiumContainer} className="absolute inset-0 z-0" />

      {/* Bảng tinh chỉnh vị trí của Admin (Calibration) */}
      <div className="absolute top-4 right-4 z-40 bg-slate-950/90 border border-slate-800 text-slate-300 p-4 rounded-2xl w-80 backdrop-blur-md text-xs space-y-3 shadow-2xl select-none font-sans">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <span className="font-bold text-sky-400 tracking-wider">🔧 CALIBRATION PANEL (ADMIN)</span>
          <button 
            onClick={() => setActiveTarget(prev => prev === 'none' ? 'model' : 'none')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              activeTarget !== 'none' 
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
                className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                  activeTarget === 'model'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                }`}
              >
                Model 3D
              </button>
              <button
                onClick={() => setActiveTarget('dom')}
                className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                  activeTarget === 'dom'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                }`}
              >
                Ảnh DOM
              </button>
              <button
                onClick={() => setActiveTarget('pointcloud')}
                className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                  activeTarget === 'pointcloud'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                }`}
              >
                Point Cloud
              </button>
            </div>

            {/* Thông số hiện tại */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 space-y-1 font-mono text-[10px] text-slate-400">
              {activeTarget === 'model' ? (
                <>
                  <div>Lon Offset: <span className="text-white font-bold">{offsets.modelLon.toFixed(7)}°</span></div>
                  <div>Lat Offset: <span className="text-white font-bold">{offsets.modelLat.toFixed(7)}°</span></div>
                  <div>Height (Z): <span className="text-emerald-400 font-bold">{offsets.modelHeight.toFixed(2)} m</span></div>
                  <div>Heading (Yaw): <span className="text-amber-400 font-bold">{offsets.modelHeading.toFixed(1)}°</span></div>
                </>
              ) : activeTarget === 'dom' ? (
                <>
                  <div>Lon Offset: <span className="text-white font-bold">{offsets.domLon.toFixed(7)}°</span></div>
                  <div>Lat Offset: <span className="text-white font-bold">{offsets.domLat.toFixed(7)}°</span></div>
                  <div>Scale Ratio: <span className="text-sky-400 font-bold">x{offsets.domScale.toFixed(3)}</span></div>
                </>
              ) : (
                <>
                  <div>Lon Offset: <span className="text-white font-bold">{(offsets.pcLon || 0).toFixed(7)}°</span></div>
                  <div>Lat Offset: <span className="text-white font-bold">{(offsets.pcLat || 0).toFixed(7)}°</span></div>
                  <div>Height (Z): <span className="text-emerald-400 font-bold">{(offsets.pcHeight || 0).toFixed(2)} m</span></div>
                </>
              )}
              <div className="border-t border-slate-900 pt-1 mt-1 flex justify-between">
                <span>Bước dịch chuyển:</span>
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
                  <div>• <b>Q / E</b>: Xoay mô hình sang Trái / Phải</div>
                </>
              ) : activeTarget === 'dom' ? (
                <>
                  <div>• <b>Q / E</b>: Thu nhỏ / Phóng to kích thước (Scale)</div>
                </>
              ) : (
                <>
                  <div>• <b>U / O</b>: Nâng cao / Hạ thấp cao độ mây điểm</div>
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
                    domLon: 0,
                    domLat: 0,
                    domScale: 1.0,
                    pcLon: 0,
                    pcLat: 0,
                    pcHeight: 0
                  });
                }}
                className="flex-1 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:text-white transition-colors font-medium text-center cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={async () => {
                  if (projectId) {
                    // 1. Lưu dự phòng tại LocalStorage của máy
                    localStorage.setItem(`calibration_${projectId}`, JSON.stringify(offsets));
                    
                    // 2. Lưu trực tiếp vào Database PostgreSQL để đồng bộ cho tất cả mọi người
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
        </div>
      )}
    </div>
  );
}

export default CesiumViewer;
