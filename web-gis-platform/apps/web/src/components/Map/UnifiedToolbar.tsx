/* 
 * UnifiedToolbar — Thanh công cụ hợp nhất cho Viewer 3D
 * Kết hợp chế độ xem (Layer Mode) + công cụ đo đạc (Measurement Tools)
 * Thay thế FloatingViewToolbar cũ
 */
import React from 'react';
import {
  Map, Layers, Box, Image as ImageIcon,
  Ruler, ArrowUpDown, Square, Trash2,
  Compass, ArrowDown, ChevronRight
} from 'lucide-react';
import type { ToolMode } from './CesiumViewer';

export type DisplayMode = 'full' | 'pointcloud' | 'model3d' | 'dom';
export type ViewAngle   = 'default' | 'topdown';
export type { ToolMode };

interface UnifiedToolbarProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  viewAngle: ViewAngle;
  onViewAngleChange: (angle: ViewAngle) => void;
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  onClear: () => void;
}

const LAYER_BUTTONS = [
  {
    mode: 'full' as DisplayMode,
    icon: Map,
    label: 'Full Map',
    activeColor: 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]',
    iconColor: 'text-sky-400',
    title: 'Bản đồ đầy đủ với quả địa cầu Cesium, Ảnh DOM và Mô hình 3D Mesh',
  },
  {
    mode: 'pointcloud' as DisplayMode,
    icon: Layers,
    label: 'Point Cloud',
    activeColor: 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]',
    iconColor: 'text-sky-400',
    title: 'Chỉ hiển thị Point Cloud với chất lượng cực đại',
  },
  {
    mode: 'model3d' as DisplayMode,
    icon: Box,
    label: '3D Model',
    activeColor: 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]',
    iconColor: 'text-emerald-400',
    title: 'Chỉ hiển thị Mô hình 3D Mesh',
  },
  {
    mode: 'dom' as DisplayMode,
    icon: ImageIcon,
    label: 'DOM Image',
    activeColor: 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]',
    iconColor: 'text-amber-400',
    title: 'Chỉ hiển thị Ảnh trực giao DOM hàng không',
  },
];

const MEASURE_BUTTONS = [
  {
    mode: 'distance' as ToolMode,
    icon: Ruler,
    label: 'Khoảng cách',
    activeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/60 shadow-[0_0_12px_rgba(14,165,233,0.35)]',
    iconColor: 'text-sky-400',
    title: 'Đo khoảng cách 3D giữa các điểm (click để chốt điểm, click lại điểm cuối để kết thúc)',
  },
  {
    mode: 'height' as ToolMode,
    icon: ArrowUpDown,
    label: 'Chiều cao',
    activeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    iconColor: 'text-emerald-400',
    title: 'Đo chiều cao đứng (vertical height) giữa 2 điểm',
  },
  {
    mode: 'area' as ToolMode,
    icon: Square,
    label: 'Diện tích',
    activeColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    iconColor: 'text-orange-400',
    title: 'Đo diện tích đa giác (click chốt đỉnh, double-click kết thúc)',
  },
];

const VIEW_BUTTONS = [
  {
    angle: 'default' as ViewAngle,
    icon: Compass,
    label: 'Default',
    title: 'Góc nhìn phối cảnh 3D nghiêng mặc định',
  },
  {
    angle: 'topdown' as ViewAngle,
    icon: ArrowDown,
    label: 'Top Down',
    title: 'Nhìn vuông góc 90° từ trên xuống',
  },
];

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  displayMode,
  onDisplayModeChange,
  viewAngle,
  onViewAngleChange,
  toolMode,
  onToolModeChange,
  onClear,
}) => {
  const isMeasuring = toolMode !== 'none';

  const handleMeasureClick = (mode: ToolMode) => {
    // Toggle off if already active
    onToolModeChange(toolMode === mode ? 'none' : mode);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 bg-[#0d1220]/90 border border-[#1e2a3f] backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)] text-xs font-sans select-none">

      {/* GROUP 1 — Layer Modes */}
      {LAYER_BUTTONS.map(({ mode, icon: Icon, label, activeColor, iconColor, title }) => (
        <button
          key={mode}
          onClick={() => onDisplayModeChange(mode)}
          title={title}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
            displayMode === mode
              ? activeColor
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Icon
            size={13}
            className={displayMode === mode ? 'text-white' : iconColor}
          />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-4 bg-slate-700/60 mx-1 shrink-0" />

      {/* GROUP 2 — View Angle */}
      {VIEW_BUTTONS.map(({ angle, icon: Icon, label, title }) => (
        <button
          key={angle}
          onClick={() => onViewAngleChange(angle)}
          title={title}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
            viewAngle === angle
              ? 'bg-slate-800 text-white border border-slate-600'
              : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Icon
            size={12}
            className={viewAngle === angle ? 'text-sky-400' : 'text-slate-500'}
          />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-4 bg-slate-700/60 mx-1 shrink-0" />

      {/* GROUP 3 — Measurement Tools */}
      <div className="flex items-center gap-0.5 relative">
        {/* Subtle glow backdrop when a tool is active */}
        {isMeasuring && (
          <div className="absolute inset-0 -m-1 rounded-xl bg-sky-500/5 border border-sky-500/15 pointer-events-none" />
        )}

        {MEASURE_BUTTONS.map(({ mode, icon: Icon, label, activeColor, iconColor, title }) => (
          <button
            key={mode}
            onClick={() => handleMeasureClick(mode)}
            title={title}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
              toolMode === mode
                ? activeColor
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon
              size={13}
              className={toolMode === mode ? 'text-current' : iconColor}
            />
            <span className="hidden lg:inline">{label}</span>
            {/* Active indicator dot */}
            {toolMode === mode && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </button>
        ))}

        {/* Clear button — only visible when measuring */}
        {isMeasuring && (
          <button
            onClick={() => { onClear(); onToolModeChange('none'); }}
            title="Xóa tất cả các phép đo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/40 transition-all duration-150 cursor-pointer ml-0.5"
          >
            <Trash2 size={13} />
            <span className="hidden lg:inline">Xóa</span>
          </button>
        )}
      </div>

      {/* Measuring hint */}
      {isMeasuring && (
        <div className="hidden xl:flex items-center gap-1 ml-1 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/50">
          <ChevronRight size={10} className="text-sky-400" />
          <span className="text-slate-400 text-[10px]">
            {toolMode === 'distance' && 'Click chốt điểm · Click lại điểm cuối để kết thúc'}
            {toolMode === 'height' && 'Click 2 điểm để đo chiều cao đứng'}
            {toolMode === 'area' && 'Click chốt đỉnh · Double-click để đóng đa giác'}
          </span>
        </div>
      )}
    </div>
  );
};
