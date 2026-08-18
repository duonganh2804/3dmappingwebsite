/**
 * PotreeSidebar — Redesigned to match authentic Potree v1.8 UI
 * Includes TOOLS (Measurements, Clipping, Navigation), APPEARANCE, and SCENE TREE
 */
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Layers,
  Box,
  Image as ImageIcon,
  Navigation as NavIcon,
  MapPin,
  Lock,
  Unlock,
  Settings2,
  Wrench,
  Eye,
  Trash2,
} from 'lucide-react';
import type { ToolMode, MeasureTarget } from './CesiumViewer';

/* ─── Prop types ─── */
type BgMode = 'sky' | 'gradient' | 'black' | 'white' | 'none';
type QualityMode = 'standard' | 'high';
type ClipMode = 'none' | 'highlight' | 'inside' | 'outside';
type ClipFilter = 'any' | 'all';

interface PotreeSidebarProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;

  /* Measurement mode */
  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onClear: () => void;

  /* Visibility & Camera Navigation */
  showMeasurements?: boolean;
  onToggleShowMeasurements?: () => void;
  cameraSpeed?: number;
  onCameraSpeedChange?: (speed: number) => void;
  onSetCameraView?: (view: 'L' | 'R' | 'F' | 'B' | 'T' | 'D') => void;

  /* Optimizer toggle */
  isOptimizerOpen: boolean;
  onToggleOptimizer: () => void;

  /* Layer visibility */
  showModel: boolean;
  setShowModel: (v: boolean) => void;
  showDom: boolean;
  setShowDom: (v: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (v: boolean) => void;

  /* Appearance — core */
  pointSize: number;
  onPointSizeChange: (v: number) => void;
  fov: number;
  onFovChange: (v: number) => void;

  /* Eye-Dome Lighting */
  edlEnabled: boolean;
  onEdlToggle: (v: boolean) => void;
  edlRadius: number;
  onEdlRadiusChange: (v: number) => void;
  edlStrength: number;
  onEdlStrengthChange: (v: number) => void;
  edlOpacity: number;
  onEdlOpacityChange: (v: number) => void;

  /* Background */
  background: BgMode;
  onBackgroundChange: (v: BgMode) => void;

  /* Quality */
  quality: QualityMode;
  onQualityChange: (v: QualityMode) => void;

  /* Point Budget */
  pointBudget: number;
  onPointBudgetChange: (v: number) => void;
  minPointBudget?: number;
  maxPointBudget?: number;

  /* Min Node Size */
  minNodeSize: number;
  onMinNodeSizeChange: (v: number) => void;

  /* Lock View */
  lockView: boolean;
  onLockViewChange: (v: boolean) => void;

  /* Camera projection */
  isOrthographic: boolean;
  onProjectionChange: (v: boolean) => void;

  /* Focus nav */
  onFocusProject: () => void;
  onFocusPointCloud?: () => void;
  onFocusDom: () => void;

  /* Measure target (legacy) */
  measureTarget?: MeasureTarget;
  onMeasureTargetChange?: (t: MeasureTarget) => void;
}

/* ─── Styled range slider (inline CSS injection) ─── */
const sliderStyle = `
  .pt-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: #1e2d3d;
    outline: none;
    cursor: pointer;
  }
  .pt-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #00aaff;
    border: 2px solid #0d1b2a;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0,170,255,0.5);
    transition: box-shadow 0.15s;
  }
  .pt-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 8px rgba(0,170,255,0.8);
  }
  .pt-slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #00aaff;
    border: 2px solid #0d1b2a;
    cursor: pointer;
  }
`;

/* ─── Sub-components ─── */
function SliderRow({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  displayValue?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[#9aadbe] text-[11px]">{label}</span>
        <span className="text-[#c8d8e8] text-[11px] min-w-[40px] text-right tabular-nums">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="pt-slider"
      />
    </div>
  );
}

function SectionHeader({
  label,
  icon,
  isOpen,
  onToggle,
}: {
  label: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-[#7a9ab5] hover:text-[#c0d4e8] text-[10px] font-bold uppercase tracking-[0.12em] transition-colors border-b border-[#1a2535] select-none cursor-pointer"
    >
      {isOpen ? <ChevronRight size={10} className="rotate-90 flex-shrink-0" /> : <ChevronRight size={10} className="flex-shrink-0" />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function PtCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-0.5 group">
      <span
        className="w-4 h-4 rounded-sm border border-[#2a3d52] flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: checked ? '#00aaff' : '#0d1b2a' }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[#9aadbe] text-[11px] group-hover:text-[#c0d4e8] transition-colors select-none" onClick={() => onChange(!checked)}>
        {label}
      </span>
    </label>
  );
}

/* ─── Main Component ─── */
export function PotreeSidebar({
  isOpen: controlledIsOpen,
  onToggleOpen,
  currentMode,
  onModeChange,
  onClear,
  showMeasurements = true,
  onToggleShowMeasurements,
  cameraSpeed = 130.6,
  onCameraSpeedChange,
  onSetCameraView,
  onToggleOptimizer,
  isOptimizerOpen,
  showModel, setShowModel,
  showDom, setShowDom,
  showPointCloud, setShowPointCloud,
  pointSize, onPointSizeChange,
  fov, onFovChange,
  edlEnabled, onEdlToggle,
  edlRadius, onEdlRadiusChange,
  edlStrength, onEdlStrengthChange,
  edlOpacity, onEdlOpacityChange,
  background, onBackgroundChange,
  quality, onQualityChange,
  pointBudget, onPointBudgetChange,
  minPointBudget = 100_000,
  maxPointBudget = 12_000_000,
  minNodeSize, onMinNodeSizeChange,
  lockView, onLockViewChange,
  isOrthographic, onProjectionChange,
  onFocusProject,
  onFocusPointCloud,
  onFocusDom,
}: PotreeSidebarProps) {
  const [localIsOpen, setLocalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;

  const handleToggle = () => {
    if (onToggleOpen) onToggleOpen();
    else setLocalIsOpen(v => !v);
  };

  const [sOpen, setSOpen] = useState({
    tools: true,
    appearance: true,
    scene: true,
  });
  const toggle = (k: keyof typeof sOpen) => setSOpen(p => ({ ...p, [k]: !p[k] }));

  const [clipMode, setClipMode] = useState<ClipMode>('highlight');
  const [clipFilter, setClipFilter] = useState<ClipFilter>('any');

  const BG_OPTS: { key: BgMode; label: string }[] = [
    { key: 'sky', label: 'Sky' },
    { key: 'gradient', label: 'Gradient' },
    { key: 'black', label: 'Black' },
    { key: 'white', label: 'White' },
    { key: 'none', label: 'None' },
  ];

  const getIconUrl = (filename: string) => {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}potree/resources/icons/${filename}`;
  };

  /* Measurement icons definition matching Potree */
  const MEASURE_TOOLS: { mode: ToolMode | 'clear'; icon: string; title: string }[] = [
    { mode: 'angle', icon: getIconUrl('angle.svg'), title: 'Đo góc (Angle)' },
    { mode: 'point', icon: getIconUrl('point.svg'), title: 'Tọa độ điểm (Point coordinates)' },
    { mode: 'distance', icon: getIconUrl('distance.svg'), title: 'Đo khoảng cách liên tục (Distance)' },
    { mode: 'height', icon: getIconUrl('height.svg'), title: 'Đo chiều cao đứng (Height)' },
    { mode: 'circle', icon: getIconUrl('circle.svg'), title: 'Đo đường tròn & bán kính (Circle)' },
    { mode: 'azimuth', icon: getIconUrl('azimuth.svg'), title: 'Đo góc phương vị Bắc (Azimuth)' },
    { mode: 'area', icon: getIconUrl('area.svg'), title: 'Đo diện tích phẳng (Area)' },
    { mode: 'volume', icon: getIconUrl('volume.svg'), title: 'Đo thể tích khối 3D (Volume)' },
    { mode: 'distance', icon: getIconUrl('sphere.svg'), title: 'Đo khoảng cách cầu 3D (Sphere)' },
    { mode: 'profile', icon: getIconUrl('profile.svg'), title: 'Cắt lát trắc dọc cao độ (Profile)' },
    { mode: 'annotation', icon: getIconUrl('annotation.svg'), title: 'Thêm ghi chú 3D (Annotation)' },
    { mode: 'clear', icon: getIconUrl('remove.svg'), title: 'Xóa toàn bộ các phép đo' },
  ];

  /* Clipping tool icons */
  const CLIP_TOOLS = [
    { id: 'box', icon: getIconUrl('clip_volume.svg'), title: 'Cắt khối Box (Volume Clip)' },
    { id: 'polygon', icon: getIconUrl('clip-polygon.svg'), title: 'Cắt đa giác (Polygon Clip)' },
    { id: 'plane', icon: getIconUrl('clip-plane-z.svg'), title: 'Cắt mặt phẳng Z (Plane Clip)' },
    { id: 'clear', icon: getIconUrl('remove.svg'), title: 'Xóa tất cả mặt cắt' },
  ];

  /* Navigation tool icons */
  const NAV_TOOLS = [
    { id: 'earth', icon: getIconUrl('earth_controls.svg'), title: 'Điều khiển quả địa cầu (Earth)' },
    { id: 'fps', icon: getIconUrl('fps_controls.svg'), title: 'Điều khiển bay tự do (FPS / Fly)' },
    { id: 'orbit', icon: getIconUrl('orbit_controls.svg'), title: 'Quay quanh tâm (Orbit)' },
    { id: 'heli', icon: getIconUrl('helicopter_controls.svg'), title: 'Góc nhìn trực thăng (Helicopter)' },
    { id: 'focus', icon: getIconUrl('focus.svg'), title: 'Focus tới Point Cloud', action: onFocusPointCloud },
    { id: 'cube', icon: getIconUrl('navigation_cube.svg'), title: 'Bay tới Dự án', action: onFocusProject },
    { id: 'compass', icon: getIconUrl('azimuth.svg'), title: 'La bàn hướng Bắc' },
    { id: 'anim', icon: getIconUrl('camera_animation.svg'), title: 'Tạo hoạt ảnh Camera' },
  ];

  /* Directional cube buttons */
  const CUBE_VIEWS: ('L' | 'R' | 'F' | 'B' | 'T' | 'D')[] = ['L', 'R', 'F', 'B', 'T', 'D'];

  return (
    <>
      {/* Inject slider CSS once */}
      <style>{sliderStyle}</style>

      <div
        className={`absolute top-0 left-0 z-20 h-screen flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 256,
          background: '#0d1b2a',
          borderRight: '1px solid #1a2a3d',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{ borderBottom: '1px solid #1a2a3d' }}
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0070b8 0%,#00aaff 100%)' }}
            >
              <Globe size={13} color="white" />
            </div>
            <div>
              <span className="text-[#00aaff] font-bold text-[11px] tracking-widest block uppercase">SaoLaTek</span>
              <span className="text-[#4a6272] text-[9px] font-medium">v1.8.0</span>
            </div>
          </div>
          <button
            onClick={onToggleOptimizer}
            title="Bộ tối ưu hóa dữ liệu 3D"
            className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-all ${
              isOptimizerOpen
                ? 'bg-[#00aaff]/15 border-[#00aaff]/50 text-[#00aaff]'
                : 'border-[#1e2d3d] text-[#4a6272] hover:text-[#9aadbe] hover:border-[#2a3d52]'
            }`}
          >
            Tối ưu
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d #0d1b2a' }}>

          {/* ══════════════════════════════════════════
              TOOLS (BỘ ĐO ĐẠC & CẮT LÁT POTREE)
          ══════════════════════════════════════════ */}
          <SectionHeader
            label="TOOLS"
            icon={<Wrench size={11} color="#00aaff" />}
            isOpen={sOpen.tools}
            onToggle={() => toggle('tools')}
          />

          {sOpen.tools && (
            <div className="px-4 py-3 space-y-4" style={{ borderBottom: '1px solid #0f1c2b' }}>

              {/* ── Section: Measurements ── */}
              <div className="space-y-2">
                <span className="text-[#5a7a94] text-[10px] uppercase tracking-widest font-semibold block">
                  Measurements
                </span>

                {/* 12 Green tool icons grid */}
                <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                  {MEASURE_TOOLS.map((tool, idx) => {
                    const isClear = tool.mode === 'clear';
                    const isActive = !isClear && currentMode === tool.mode;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isClear) onClear();
                          else onModeChange(tool.mode as ToolMode);
                        }}
                        title={tool.title}
                        className={`w-7 h-7 rounded flex items-center justify-center p-1 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#00d26a]/20 border border-[#00d26a] shadow-[0_0_8px_rgba(0,210,106,0.3)]'
                            : 'bg-[#111e2c] border border-[#1e2d3d] hover:bg-[#1a2b3c] hover:border-[#2a3d52]'
                        }`}
                      >
                        <img
                          src={tool.icon}
                          alt={tool.title}
                          className="w-full h-full object-contain"
                          style={{
                            filter: isClear
                              ? 'invert(37%) sepia(85%) saturate(2280%) hue-rotate(334deg) brightness(98%) contrast(92%)' // Red
                              : 'invert(56%) sepia(86%) saturate(1637%) hue-rotate(114deg) brightness(96%) contrast(102%)', // Green (#00d26a)
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Show / Hide Toggle Buttons */}
                <div
                  className="flex rounded overflow-hidden mt-2"
                  style={{ border: '1px solid #1e2d3d' }}
                >
                  <button
                    onClick={() => {
                      if (!showMeasurements && onToggleShowMeasurements) onToggleShowMeasurements();
                    }}
                    className="flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: showMeasurements ? '#1e2d3d' : 'transparent',
                      color: showMeasurements ? '#c8d8e8' : '#4a6272',
                      borderRight: '1px solid #1e2d3d',
                    }}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => {
                      if (showMeasurements && onToggleShowMeasurements) onToggleShowMeasurements();
                    }}
                    className="flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: !showMeasurements ? '#1e2d3d' : 'transparent',
                      color: !showMeasurements ? '#c8d8e8' : '#4a6272',
                    }}
                  >
                    Hide
                  </button>
                </div>
              </div>

              {/* ── Section: Clipping ── */}
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #142130' }}>
                <span className="text-[#5a7a94] text-[10px] uppercase tracking-widest font-semibold block">
                  Clipping
                </span>

                {/* Orange Clipping Tool Icons */}
                <div className="flex gap-1.5 pt-0.5">
                  {CLIP_TOOLS.map((tool, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (tool.id === 'clear') onClear();
                      }}
                      title={tool.title}
                      className="w-7 h-7 rounded flex items-center justify-center p-1 bg-[#111e2c] border border-[#1e2d3d] hover:bg-[#1a2b3c] hover:border-[#2a3d52] transition-all cursor-pointer"
                    >
                      <img
                        src={tool.icon}
                        alt={tool.title}
                        className="w-full h-full object-contain"
                        style={{
                          filter: tool.id === 'clear'
                            ? 'invert(37%) sepia(85%) saturate(2280%) hue-rotate(334deg) brightness(98%) contrast(92%)' // Red
                            : 'invert(65%) sepia(74%) saturate(1478%) hue-rotate(359deg) brightness(101%) contrast(96%)', // Orange/Amber
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Clipping Mode: None | Highlight | Inside | Outside */}
                <div
                  className="grid grid-cols-4 rounded overflow-hidden text-center"
                  style={{ border: '1px solid #1e2d3d' }}
                >
                  {(['none', 'highlight', 'inside', 'outside'] as ClipMode[]).map((mode, i) => (
                    <button
                      key={mode}
                      onClick={() => setClipMode(mode)}
                      className="py-1 text-[9px] font-bold capitalize transition-all cursor-pointer"
                      style={{
                        background: clipMode === mode ? '#1e2d3d' : 'transparent',
                        color: clipMode === mode ? '#c8d8e8' : '#4a6272',
                        borderRight: i < 3 ? '1px solid #1e2d3d' : 'none',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Clipping Filter: Inside Any | Inside All */}
                <div
                  className="flex rounded overflow-hidden"
                  style={{ border: '1px solid #1e2d3d' }}
                >
                  <button
                    onClick={() => setClipFilter('any')}
                    className="flex-1 py-1 text-[9px] font-bold transition-all cursor-pointer"
                    style={{
                      background: clipFilter === 'any' ? '#1e2d3d' : 'transparent',
                      color: clipFilter === 'any' ? '#c8d8e8' : '#4a6272',
                      borderRight: '1px solid #1e2d3d',
                    }}
                  >
                    Inside Any
                  </button>
                  <button
                    onClick={() => setClipFilter('all')}
                    className="flex-1 py-1 text-[9px] font-bold transition-all cursor-pointer"
                    style={{
                      background: clipFilter === 'all' ? '#1e2d3d' : 'transparent',
                      color: clipFilter === 'all' ? '#c8d8e8' : '#4a6272',
                    }}
                  >
                    Inside All
                  </button>
                </div>
              </div>

              {/* ── Section: Navigation ── */}
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #142130' }}>
                <span className="text-[#5a7a94] text-[10px] uppercase tracking-widest font-semibold block">
                  Navigation
                </span>

                {/* Blue Navigation Tool Icons */}
                <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                  {NAV_TOOLS.map((tool, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (tool.action) tool.action();
                      }}
                      title={tool.title}
                      className="w-7 h-7 rounded flex items-center justify-center p-1 bg-[#111e2c] border border-[#1e2d3d] hover:bg-[#1a2b3c] hover:border-[#2a3d52] transition-all cursor-pointer"
                    >
                      <img
                        src={tool.icon}
                        alt={tool.title}
                        className="w-full h-full object-contain"
                        style={{
                          filter: 'invert(52%) sepia(91%) saturate(2371%) hue-rotate(178deg) brightness(101%) contrast(105%)', // Blue (#00aaff)
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Directional Cube Buttons [L] [R] [F] [B] [T] [D] */}
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {CUBE_VIEWS.map((view) => (
                    <button
                      key={view}
                      onClick={() => onSetCameraView && onSetCameraView(view)}
                      title={`Góc nhìn ${view}`}
                      className="py-1 rounded bg-[#111e2c] border border-[#1e2d3d] hover:bg-[#1a2b3c] hover:border-[#00aaff]/60 text-[#00aaff] text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                    >
                      {view}
                    </button>
                  ))}
                </div>

                {/* Projection Mode */}
                <div
                  className="flex rounded overflow-hidden mt-2"
                  style={{ border: '1px solid #1e2d3d' }}
                >
                  <button
                    onClick={() => onProjectionChange(false)}
                    className="flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: !isOrthographic ? '#1e2d3d' : 'transparent',
                      color: !isOrthographic ? '#c8d8e8' : '#4a6272',
                      borderRight: '1px solid #1e2d3d',
                    }}
                  >
                    Perspective
                  </button>
                  <button
                    onClick={() => onProjectionChange(true)}
                    className="flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: isOrthographic ? '#1e2d3d' : 'transparent',
                      color: isOrthographic ? '#c8d8e8' : '#4a6272',
                    }}
                  >
                    Orthographic
                  </button>
                </div>

                {/* Speed Slider */}
                <div className="pt-2">
                  <SliderRow
                    label="Speed"
                    value={cameraSpeed}
                    displayValue={cameraSpeed.toFixed(1)}
                    min={10}
                    max={500}
                    step={1}
                    onChange={onCameraSpeedChange || (() => {})}
                  />
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════
              APPEARANCE (NGOẠI QUAN MÂY ĐIỂM)
          ══════════════════════════════════════════ */}
          <SectionHeader label="Appearance" isOpen={sOpen.appearance} onToggle={() => toggle('appearance')} />

          {sOpen.appearance && (
            <div className="px-4 py-3 space-y-4" style={{ borderBottom: '1px solid #0f1c2b' }}>

              {/* Point Budget (% Phần trăm) */}
              {(() => {
                const minB = minPointBudget || 0;
                const maxB = maxPointBudget || 12_000_000;
                const percent = Math.max(1, Math.min(100, Math.round(((pointBudget - minB) / Math.max(1, maxB - minB)) * 100)));
                return (
                  <SliderRow
                    label="Point budget"
                    value={percent}
                    displayValue={`${percent}%`}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(newPercent) => {
                      const newBudget = Math.round(minB + (newPercent / 100) * (maxB - minB));
                      onPointBudgetChange(newBudget);
                    }}
                  />
                );
              })()}

              {/* Field of View */}
              <SliderRow
                label="Field of view"
                value={fov}
                min={30}
                max={120}
                step={1}
                onChange={onFovChange}
              />

              {/* Point Size */}
              <SliderRow
                label="Point size"
                value={pointSize}
                min={1}
                max={8}
                step={0.5}
                onChange={v => onPointSizeChange(Math.round(v * 2) / 2)}
              />

              {/* ── Eye-Dome Lighting ── */}
              <div className="space-y-3 pt-1">
                <div
                  className="text-[10px] text-[#5a7a94] uppercase tracking-widest font-semibold pb-1"
                  style={{ borderBottom: '1px solid #1a2535' }}
                >
                  Eye-Dome Lighting
                </div>

                {/* EDL Enable */}
                <PtCheckbox label="Enable" checked={edlEnabled} onChange={onEdlToggle} />

                {edlEnabled && (
                  <div className="space-y-3 pl-1">
                    <SliderRow
                      label="Radius"
                      value={edlRadius}
                      min={0}
                      max={4}
                      step={0.1}
                      onChange={onEdlRadiusChange}
                    />
                    <SliderRow
                      label="Strength"
                      value={edlStrength}
                      min={0}
                      max={5}
                      step={0.1}
                      onChange={onEdlStrengthChange}
                    />
                    <SliderRow
                      label="Opacity"
                      value={edlOpacity}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={onEdlOpacityChange}
                    />
                  </div>
                )}
              </div>

              {/* ── Background ── */}
              <div className="space-y-2 pt-1">
                <div
                  className="text-[10px] text-[#5a7a94] uppercase tracking-widest font-semibold pb-1"
                  style={{ borderBottom: '1px solid #1a2535' }}
                >
                  Background
                </div>
                <div className="flex gap-1 flex-wrap">
                  {BG_OPTS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => onBackgroundChange(key)}
                      className="text-[10px] px-2.5 py-1 rounded font-medium transition-all cursor-pointer"
                      style={{
                        background: background === key ? '#1e2d3d' : 'transparent',
                        color: background === key ? '#c8d8e8' : '#5a7a94',
                        border: background === key ? '1px solid #2a4560' : '1px solid transparent',
                        fontWeight: background === key ? 700 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Quality ── */}
              <div className="space-y-2 pt-1">
                <div
                  className="text-[10px] text-[#5a7a94] uppercase tracking-widest font-semibold pb-1"
                  style={{ borderBottom: '1px solid #1a2535' }}
                >
                  Quality
                </div>
                <div
                  className="flex rounded overflow-hidden"
                  style={{ border: '1px solid #1e2d3d' }}
                >
                  <button
                    onClick={() => onQualityChange('standard')}
                    className="flex-1 py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: quality === 'standard' ? '#1e2d3d' : 'transparent',
                      color: quality === 'standard' ? '#c8d8e8' : '#4a6272',
                      borderRight: '1px solid #1e2d3d',
                    }}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => onQualityChange('high')}
                    className="flex-1 py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                    style={{
                      background: quality === 'high' ? '#1e2d3d' : 'transparent',
                      color: quality === 'high' ? '#c8d8e8' : '#4a6272',
                    }}
                  >
                    High Quality
                  </button>
                </div>
              </div>

              {/* Min Node Size */}
              <SliderRow
                label="Min node size"
                value={minNodeSize}
                min={0}
                max={32}
                step={1}
                onChange={v => onMinNodeSizeChange(Math.round(v))}
              />

              {/* Lock View */}
              <div className="flex items-center gap-2 pt-1">
                <PtCheckbox label="Lock view" checked={lockView} onChange={onLockViewChange} />
                {lockView && <Lock size={11} color="#00aaff" />}
                {!lockView && <Unlock size={11} color="#4a6272" />}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              SCENE TREE (LỚP BẢN ĐỒ)
          ══════════════════════════════════════════ */}
          <SectionHeader label="Scene" isOpen={sOpen.scene} onToggle={() => toggle('scene')} />

          {sOpen.scene && (
            <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid #0f1c2b' }}>

              {/* Layer toggles */}
              <div className="space-y-2">
                <label
                  className="flex items-center gap-2 cursor-pointer py-1 rounded px-1 transition-colors group hover:bg-[#131f2d]"
                  onClick={() => setShowPointCloud(!showPointCloud)}
                >
                  <span
                    className="w-4 h-4 rounded-sm border border-[#2a3d52] flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: showPointCloud ? '#00aaff' : '#0d1b2a' }}
                  >
                    {showPointCloud && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <Layers size={12} color="#00aaff" />
                  <span className="text-[#9aadbe] text-[11px] group-hover:text-[#c0d4e8] transition-colors">Point Cloud</span>
                </label>

                <label
                  className="flex items-center gap-2 cursor-pointer py-1 rounded px-1 transition-colors group"
                  onClick={() => setShowModel(!showModel)}
                >
                  <span
                    className="w-4 h-4 rounded-sm border border-[#2a3d52] flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: showModel ? '#00aaff' : '#0d1b2a' }}
                  >
                    {showModel && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <Box size={12} color="#34d399" />
                  <span className="text-[#9aadbe] text-[11px] group-hover:text-[#c0d4e8] transition-colors">3D Model (GLB)</span>
                </label>

                <label
                  className="flex items-center gap-2 cursor-pointer py-1 rounded px-1 transition-colors group"
                  onClick={() => setShowDom(!showDom)}
                >
                  <span
                    className="w-4 h-4 rounded-sm border border-[#2a3d52] flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: showDom ? '#00aaff' : '#0d1b2a' }}
                  >
                    {showDom && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <ImageIcon size={12} color="#fbbf24" />
                  <span className="text-[#9aadbe] text-[11px] group-hover:text-[#c0d4e8] transition-colors">Ảnh DOM</span>
                </label>
              </div>

              {/* Navigation focus buttons */}
              <div className="pt-2 space-y-1.5">
                <div
                  className="text-[10px] text-[#5a7a94] uppercase tracking-widest font-semibold pb-1 mb-2"
                  style={{ borderBottom: '1px solid #1a2535' }}
                >
                  Quick Focus
                </div>
                <button
                  onClick={onFocusProject}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-[11px] font-medium transition-all cursor-pointer"
                  style={{ background: '#111e2c', border: '1px solid #1e2d3d', color: '#9aadbe' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a2b3c')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#111e2c')}
                >
                  <NavIcon size={12} color="#00aaff" style={{ transform: 'rotate(45deg)' }} />
                  Bay tới Dự án
                </button>

                {onFocusPointCloud && (
                  <button
                    onClick={onFocusPointCloud}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-[11px] font-medium transition-all cursor-pointer"
                    style={{ background: '#111e2c', border: '1px solid #1e2d3d', color: '#9aadbe' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1a2b3c')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#111e2c')}
                  >
                    <MapPin size={12} color="#00aaff" />
                    Bay tới Point Cloud
                  </button>
                )}

                <button
                  onClick={onFocusDom}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-[11px] font-medium transition-all cursor-pointer"
                  style={{ background: '#111e2c', border: '1px solid #1e2d3d', color: '#9aadbe' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a2b3c')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#111e2c')}
                >
                  <Settings2 size={12} color="#fbbf24" />
                  Bay tới Ảnh DOM
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar toggle handle ── */}
        <button
          onClick={handleToggle}
          className="absolute top-1/2 -translate-y-1/2 left-full flex items-center justify-center w-5 h-14 cursor-pointer transition-all group focus-visible:outline-none"
          style={{
            background: '#0d1b2a',
            border: '1px solid #1a2a3d',
            borderLeft: 'none',
            borderRadius: '0 6px 6px 0',
          }}
          title={isOpen ? 'Thu gọn menu' : 'Mở rộng menu'}
        >
          {isOpen
            ? <ChevronLeft size={13} color="#4a6272" className="group-hover:text-[#9aadbe] transition-colors" />
            : <ChevronRight size={13} color="#4a6272" className="group-hover:text-[#9aadbe] transition-colors" />
          }
        </button>
      </div>
    </>
  );
}
