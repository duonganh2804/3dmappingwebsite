/* Hallmark · component: FloatingViewToolbar · genre: atmospheric · theme: Terminal
 * Top floating pill mode selector toolbar for Web GIS 3D
 */
import React from 'react';
import { Map, Layers, Box, Image, Compass, ArrowDown } from 'lucide-react';

export type DisplayMode = 'full' | 'pointcloud' | 'model3d' | 'dom';
export type ViewAngle = 'default' | 'topdown';

interface FloatingViewToolbarProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  viewAngle: ViewAngle;
  onViewAngleChange: (angle: ViewAngle) => void;
}

export const FloatingViewToolbar: React.FC<FloatingViewToolbarProps> = ({
  displayMode,
  onDisplayModeChange,
  viewAngle,
  onViewAngleChange,
}) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2 py-1.5 bg-[#151924]/90 border border-[#2a3142] backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.45)] text-xs font-sans select-none transition-all duration-200">
      {/* 1. Full Map (Bản đồ tổng hợp) */}
      <button
        onClick={() => onDisplayModeChange('full')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          displayMode === 'full'
            ? 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
        title="Hiển thị bản đồ đầy đủ với Quả địa cầu Cesium, Ảnh DOM và Mô hình 3D Mesh"
      >
        <Map size={14} className={displayMode === 'full' ? 'text-white' : 'text-sky-400'} />
        <span>Full Map</span>
      </button>

      {/* 2. Point Cloud */}
      <button
        onClick={() => onDisplayModeChange('pointcloud')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          displayMode === 'pointcloud'
            ? 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
        title="Chỉ hiển thị Point Cloud với chất lượng cực đại, ẩn quả địa cầu Cesium"
      >
        <Layers size={14} className={displayMode === 'pointcloud' ? 'text-white' : 'text-sky-400'} />
        <span>Point Cloud</span>
      </button>

      {/* 3. 3D Model */}
      <button
        onClick={() => onDisplayModeChange('model3d')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          displayMode === 'model3d'
            ? 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
        title="Chỉ hiển thị Mô hình 3D với chất lượng tốt nhất, ẩn quả địa cầu Cesium"
      >
        <Box size={14} className={displayMode === 'model3d' ? 'text-white' : 'text-emerald-400'} />
        <span>3D Model</span>
      </button>

      {/* 4. DOM Image */}
      <button
        onClick={() => onDisplayModeChange('dom')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          displayMode === 'dom'
            ? 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
        title="Chỉ hiển thị Ảnh trực giao DOM hàng không"
      >
        <Image size={14} className={displayMode === 'dom' ? 'text-white' : 'text-amber-400'} />
        <span>DOM Image</span>
      </button>

      {/* Phân cách | */}
      <div className="w-[1px] h-4 bg-slate-700/70 mx-1" />

      {/* 5. Default Perspective View */}
      <button
        onClick={() => onViewAngleChange('default')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          viewAngle === 'default'
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        title="Góc nhìn phối cảnh 3D nghiêng mặc định"
      >
        <Compass size={13} className={viewAngle === 'default' ? 'text-sky-400' : 'text-slate-400'} />
        <span>Default</span>
      </button>

      {/* 6. Top Down 2D/3D View */}
      <button
        onClick={() => onViewAngleChange('topdown')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
          viewAngle === 'topdown'
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        title="Nhìn vuông góc 90° từ trên xuống (Top Down Vector/Orthographic)"
      >
        <ArrowDown size={13} className={viewAngle === 'topdown' ? 'text-amber-400' : 'text-slate-400'} />
        <span>Top Down</span>
      </button>
    </div>
  );
};
