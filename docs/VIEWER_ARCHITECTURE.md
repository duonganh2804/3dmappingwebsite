# Viewer Architecture (3D/2D Engine) - Detailed Version

## 1. Kiến trúc Tầng (Layered Architecture) trong React

Để hệ thống không bị crash khi load hàng chục GB 3D Tiles, ta KHÔNG để logic của CesiumJS trộn lẫn với logic React UI. Dưới đây là kiến trúc tách bạch:

### 1.1. Tầng Global State (Zustand)
Nơi lưu trữ trạng thái hiển thị của UI và dữ liệu dự án. **Lưu ý:** Không bao giờ đưa `Cesium.Viewer` object vào đây.

```typescript
// store/useViewerStore.ts
import { create } from 'zustand';

interface ViewerState {
  activeProjectId: string | null;
  activeLayers: string[]; // Các ID của layer đang bật
  measurementMode: 'NONE' | 'DISTANCE' | 'AREA' | 'VOLUME';
  
  setActiveProject: (id: string) => void;
  toggleLayer: (layerId: string) => void;
  setMeasurementMode: (mode: 'NONE' | 'DISTANCE' | 'AREA' | 'VOLUME') => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  activeProjectId: null,
  activeLayers: [],
  measurementMode: 'NONE',
  
  setActiveProject: (id) => set({ activeProjectId: id }),
  toggleLayer: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.includes(layerId)
      ? state.activeLayers.filter(id => id !== layerId)
      : [...state.activeLayers, layerId]
  })),
  setMeasurementMode: (mode) => set({ measurementMode: mode })
}));
```

### 1.2. Tầng Context (Cesium Context)
Tạo một React Context chỉ để chia sẻ `viewerRef` xuống các component con mà không gây re-render.

```tsx
// components/viewer/CesiumContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import * as Cesium from 'cesium';

interface CesiumContextType {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
}

const CesiumContext = createContext<CesiumContextType | null>(null);

export const useCesium = () => {
  const context = useContext(CesiumContext);
  if (!context) throw new Error("useCesium must be used within CesiumProvider");
  return context;
};

export const CesiumProvider = ({ children }: { children: React.ReactNode }) => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  return (
    <CesiumContext.Provider value={{ viewerRef }}>
      {children}
    </CesiumContext.Provider>
  );
};
```

### 1.3. Component Khởi tạo Core (CesiumCanvas)
Nơi duy nhất mount WebGL Canvas.

```tsx
// components/viewer/CesiumCanvas.tsx
import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCesium } from './CesiumContext';

export const CesiumCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewerRef } = useCesium();

  useEffect(() => {
    if (!containerRef.current) return;

    // Khởi tạo Cesium Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      terrainProvider: Cesium.createWorldTerrain(),
      animation: false,
      timeline: false,
      infoBox: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
      sceneModePicker: false,
    });

    // Tối ưu hóa hiệu năng render 3D
    viewer.scene.globe.maximumScreenSpaceError = 2; // Tăng độ nét địa hình
    viewer.scene.highDynamicRange = true;           // Đẹp hơn
    viewer.resolutionScale = 1.0;                   // Giữ nguyên độ phân giải

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen absolute inset-0 z-0" />;
};
```

## 2. Logic Xử lý 3D Tiles (OSGB -> 3D Tiles)

Khi Frontend nhận được API từ bảng `Layer` (loại `CESIUM_3D_TILES`), component sau sẽ load data:

```tsx
// components/viewer/TilesetManager.tsx
import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useCesium } from './CesiumContext';
import { useViewerStore } from '../../store/useViewerStore';

export const TilesetManager = ({ layerUrl, layerId }: { layerUrl: string, layerId: string }) => {
  const { viewerRef } = useCesium();
  const isActive = useViewerStore(state => state.activeLayers.includes(layerId));

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isActive) return;

    let tileset: Cesium.Cesium3DTileset;

    const loadTileset = async () => {
      tileset = await Cesium.Cesium3DTileset.fromUrl(layerUrl, {
        maximumScreenSpaceError: 16, // Cực kỳ quan trọng để ko bị giật
        maximumMemoryUsage: 1024,    // Giới hạn RAM (1GB)
        skipLevelOfDetail: true,     // Tăng tốc độ load ban đầu
      });
      viewer.scene.primitives.add(tileset);
      
      // Bay tới vị trí mô hình
      viewer.zoomTo(tileset);
    };

    loadTileset();

    return () => {
      if (viewer && tileset) {
        viewer.scene.primitives.remove(tileset);
      }
    };
  }, [layerUrl, isActive]);

  return null; // Component này không render UI, chỉ quản lý logic Cesium
};
```

## 3. Logic Đo khoảng cách cơ bản (Distance Measurement)

Đo đạc 3D thực chất là bắt event Click chuột trên màn hình, cast tia (raycasting) xuống mô hình 3D để lấy tọa độ Cartesian3, sau đó tính khoảng cách.

```typescript
// utils/measurements.ts
import * as Cesium from 'cesium';

export const calculateDistance = (pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3) => {
  return Cesium.Cartesian3.distance(pos1, pos2); // Khoảng cách 3D (bao gồm cao độ)
};

export const startDistanceMeasurement = (viewer: Cesium.Viewer) => {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  const points: Cesium.Cartesian3[] = [];

  handler.setInputAction((clickEvent: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    // Pick điểm chạm vào Model (hoặc địa hình)
    const pickedPosition = viewer.scene.pickPosition(clickEvent.position);
    
    if (Cesium.defined(pickedPosition)) {
      points.push(pickedPosition);
      
      // Vẽ điểm đỏ
      viewer.entities.add({
        position: pickedPosition,
        point: { pixelSize: 10, color: Cesium.Color.RED }
      });

      // Nếu có 2 điểm thì vẽ đường thẳng và tính độ dài
      if (points.length === 2) {
        const dist = calculateDistance(points[0], points[1]);
        
        viewer.entities.add({
          polyline: {
            positions: points,
            width: 3,
            material: Cesium.Color.YELLOW
          }
        });
        
        alert(`Khoảng cách: ${dist.toFixed(2)} mét`);
        handler.destroy(); // Dừng event click
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};
```
