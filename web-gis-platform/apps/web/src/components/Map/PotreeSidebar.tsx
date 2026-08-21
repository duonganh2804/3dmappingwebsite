/**
 * PotreeSidebar — SAOLATEK visual refresh
 * UI-only redesign. Functional props / handlers are intentionally preserved.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Lock,
  MapPin,
  Navigation as NavIcon,
  Settings2,
  Moon,
  Sun,
  Unlock,
  Wrench,
} from 'lucide-react';

import type { ToolMode } from './CesiumViewer';
import { useLanguage } from '../../hooks/useLanguage';
import logoImg from '../../assets/logo.webp';

type BgMode =
  | 'sky'
  | 'gradient'
  | 'black'
  | 'white'
  | 'none';

type QualityMode = 'standard' | 'high';

type ClipMode =
  | 'none'
  | 'highlight'
  | 'inside'
  | 'outside';

type ClipFilter = 'any' | 'all';

const THEME_STORAGE_KEY = 'saolatek_theme';
const THEME_CHANGE_EVENT = 'saolatek-theme-change';

const readInitialTheme = () => {
  if (typeof window === 'undefined') return true;

  const saved = window.localStorage.getItem(
    THEME_STORAGE_KEY
  );

  if (saved === 'light') return false;
  if (saved === 'dark') return true;

  return true;
};

interface PotreeSidebarProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;

  projectName?: string;

  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onClear: () => void;
  measurementManager?: React.ReactNode;
  onClipTool?: (tool: 'box' | 'polygon' | 'plane' | 'clear') => void;
  clipMode?: ClipMode;
  onClipModeChange?: (mode: ClipMode) => void;
  clipFilter?: ClipFilter;
  onClipFilterChange?: (filter: ClipFilter) => void;

  showMeasurements?: boolean;
  onToggleShowMeasurements?: () => void;
  cameraSpeed?: number;
  onCameraSpeedChange?: (speed: number) => void;
  onSetCameraView?: (
    view: 'L' | 'R' | 'F' | 'B' | 'T' | 'D'
  ) => void;
  onNavigationAction?: (action: 'earth' | 'fps' | 'orbit' | 'heli' | 'compass' | 'anim') => void;

  isOptimizerOpen: boolean;
  onToggleOptimizer: () => void;
  showOptimizerControl?: boolean;

  showModel: boolean;
  setShowModel: (v: boolean) => void;
  showDom: boolean;
  setShowDom: (v: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (v: boolean) => void;

  pointSize: number;
  onPointSizeChange: (v: number) => void;
  fov: number;
  onFovChange: (v: number) => void;

  edlEnabled: boolean;
  edlSupported?: boolean;
  onEdlToggle: (v: boolean) => void;
  edlRadius: number;
  onEdlRadiusChange: (v: number) => void;
  edlStrength: number;
  onEdlStrengthChange: (v: number) => void;
  edlOpacity: number;
  onEdlOpacityChange: (v: number) => void;

  background: BgMode;
  onBackgroundChange: (v: BgMode) => void;

  quality: QualityMode;
  onQualityChange: (v: QualityMode) => void;

  pointBudget: number;
  onPointBudgetChange: (v: number) => void;
  minPointBudget?: number;
  maxPointBudget?: number;

  minNodeSize: number;
  onMinNodeSizeChange: (v: number) => void;

  lockView: boolean;
  onLockViewChange: (v: boolean) => void;

  isOrthographic: boolean;
  onProjectionChange: (v: boolean) => void;

  onFocusProject: () => void;
  onFocusPointCloud?: () => void;
  onFocusDom: () => void;
}

const viewerStyle = `
  .saolatek-viewer-sidebar {
    --vs-bg: rgba(8, 19, 33, .96);
    --vs-bg-soft: rgba(15, 23, 42, .72);
    --vs-bg-strong: #07111f;
    --vs-surface: #0d1b2d;
    --vs-surface-hover: #13243a;
    --vs-segment: rgba(51, 65, 85, .58);
    --vs-border: rgba(71, 85, 105, .58);
    --vs-border-soft: rgba(51, 65, 85, .54);
    --vs-text: #e2e8f0;
    --vs-text-soft: #94a3b8;
    --vs-muted: #64748b;
    --vs-accent: #0ea5e9;
    --vs-accent-soft: rgba(14, 165, 233, .10);
    --vs-danger: #fb7185;
    --vs-shadow: 12px 0 36px rgba(2, 6, 23, .18);
  }

  html[data-saolatek-theme='light'] .saolatek-viewer-sidebar {
    --vs-bg: rgba(248, 250, 252, .97);
    --vs-bg-soft: rgba(255, 255, 255, .88);
    --vs-bg-strong: #ffffff;
    --vs-surface: #ffffff;
    --vs-surface-hover: #f1f5f9;
    --vs-segment: #e8eef5;
    --vs-border: rgba(148, 163, 184, .50);
    --vs-border-soft: rgba(203, 213, 225, .82);
    --vs-text: #0f172a;
    --vs-text-soft: #475569;
    --vs-muted: #64748b;
    --vs-accent: #0284c7;
    --vs-accent-soft: rgba(2, 132, 199, .08);
    --vs-danger: #e11d48;
    --vs-shadow: 10px 0 30px rgba(15, 23, 42, .10);
  }

  .viewer-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    background: var(--vs-border-soft);
    outline: none;
    cursor: pointer;
  }

  .viewer-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--vs-accent);
    border: 2px solid var(--vs-bg-strong);
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(14,165,233,.24);
    transition: transform .14s ease, box-shadow .14s ease;
  }

  .viewer-slider::-webkit-slider-thumb:hover {
    transform: scale(1.08);
    box-shadow: 0 0 0 3px rgba(14,165,233,.10);
  }

  .viewer-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--vs-accent);
    border: 2px solid var(--vs-bg-strong);
    cursor: pointer;
  }

  .viewer-sidebar-scroll::-webkit-scrollbar {
    width: 5px;
  }

  .viewer-sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .viewer-sidebar-scroll::-webkit-scrollbar-thumb {
    background: var(--vs-border);
    border-radius: 999px;
  }

  .viewer-sidebar-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--vs-muted);
  }

  .viewer-section-header {
    color: var(--vs-muted);
    border-color: var(--vs-border-soft);
  }

  .viewer-section-header:hover {
    color: var(--vs-text-soft);
    background: var(--vs-bg-soft);
  }

  .viewer-micro-title {
    color: var(--vs-muted);
    border-color: var(--vs-border-soft);
  }

  .viewer-slider-label {
    color: var(--vs-text-soft);
  }

  .viewer-slider-value {
    color: var(--vs-text);
  }

  .viewer-segment {
    color: var(--vs-muted);
  }

  .viewer-segment:hover {
    color: var(--vs-text);
    background: var(--vs-bg-soft);
  }

  .viewer-segment.is-active {
    color: var(--vs-text);
    background: var(--vs-segment);
  }

  .viewer-check-label,
  .viewer-scene-label {
    color: var(--vs-text-soft);
  }

  .viewer-check-label:hover,
  .viewer-scene-row:hover .viewer-scene-label {
    color: var(--vs-text);
  }

  .viewer-quick-focus {
    color: var(--vs-text-soft);
    background: var(--vs-surface);
    border-color: var(--vs-border-soft);
  }

  .viewer-quick-focus:hover {
    color: var(--vs-text);
    background: var(--vs-surface-hover);
    border-color: var(--vs-border);
  }

  .viewer-tool-card {
    display: flex;
    min-height: 62px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid var(--vs-border-soft);
    border-radius: 13px;
    background: var(--vs-surface);
    color: var(--vs-text-soft);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
    transition:
      transform .16s ease,
      border-color .16s ease,
      background .16s ease,
      color .16s ease,
      box-shadow .16s ease;
  }

  .viewer-tool-card:hover {
    transform: translateY(-1px);
    border-color: rgba(14,165,233,.30);
    background: var(--vs-surface-hover);
    color: var(--vs-text);
  }

  .viewer-tool-card.is-active {
    border-color: rgba(14,165,233,.46);
    background: var(--vs-accent-soft);
    color: var(--vs-accent);
    box-shadow: 0 0 0 1px rgba(14,165,233,.08);
  }

  .viewer-tool-card.is-danger {
    color: var(--vs-danger);
    border-color: rgba(244,63,94,.18);
    background: rgba(244,63,94,.035);
  }

  .viewer-tool-card.is-danger:hover {
    border-color: rgba(244,63,94,.34);
    background: rgba(244,63,94,.075);
  }

  .viewer-tool-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 650;
    letter-spacing: .01em;
  }

  .viewer-section-shell {
    border: 1px solid var(--vs-border-soft);
    border-radius: 14px;
    background: color-mix(in srgb, var(--vs-surface) 82%, transparent);
    padding: 12px;
  }

  .viewer-control-strip {
    overflow: hidden;
    border: 1px solid var(--vs-border-soft);
    border-radius: 10px;
    background: var(--vs-bg-soft);
  }

  .viewer-camera-key {
    border: 1px solid var(--vs-border-soft);
    border-radius: 9px;
    background: var(--vs-surface);
    color: var(--vs-text-soft);
    font-size: 10px;
    font-weight: 700;
    transition: .15s ease;
  }

  .viewer-camera-key:hover {
    border-color: rgba(14,165,233,.32);
    background: var(--vs-surface-hover);
    color: var(--vs-accent);
  }

  /* Calibration panel stays functional but follows the same light surface. */
  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80'] {
    background: rgba(255,255,255,.96) !important;
    border-color: rgba(148,163,184,.45) !important;
    color: #475569 !important;
    box-shadow: 0 18px 42px rgba(15,23,42,.14) !important;
  }

  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='bg-slate-950'] {
    background: #f8fafc !important;
  }

  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='bg-slate-900'] {
    background: #ffffff !important;
  }

  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='border-slate-900'],
  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='border-slate-800'] {
    border-color: #dbe4ef !important;
  }

  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='text-[var(--vs-text)]'],
  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    [class~='text-[var(--vs-text-soft)]'] {
    color: #475569 !important;
  }

  html[data-saolatek-theme='light']
    [class~='right-4'][class~='top-4'][class~='z-40'][class~='w-80']
    input {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }
`

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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="viewer-slider-label text-[11px] font-medium">
          {label}
        </span>

        <span className="viewer-slider-value min-w-[44px] text-right text-[11px] font-semibold tabular-nums">
          {displayValue ?? value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            parseFloat(event.target.value)
          )
        }
        className="viewer-slider"
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
      type="button"
      onClick={onToggle}
      className="viewer-section-header group flex w-full items-center gap-2 border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] transition"
    >
      <ChevronRight
        size={11}
        className={`shrink-0 transition-transform ${
          isOpen ? 'rotate-90' : ''
        }`}
      />

      {icon && (
        <span className="shrink-0 text-sky-500">
          {icon}
        </span>
      )}

      <span>{label}</span>
    </button>
  );
}

function CheckMark() {
  return (
    <svg
      width="9"
      height="7"
      viewBox="0 0 9 7"
      fill="none"
    >
      <path
        d="M1 3.5L3.2 6L8 1"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PtCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`group flex items-center gap-2.5 py-1 ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          checked
            ? 'border-sky-500 bg-sky-500'
            : 'border-[var(--vs-border)] bg-[var(--vs-surface)] group-hover:border-sky-500/35'
        }`}
      >
        {checked && <CheckMark />}
      </button>

      <span
        onClick={() => { if (!disabled) onChange(!checked); }}
        className="viewer-check-label select-none text-[11px] transition"
      >
        {label}
      </span>
    </label>
  );
}

function MicroTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="viewer-micro-title border-b pb-2 text-[10px] font-bold uppercase tracking-[0.14em]">
      {children}
    </div>
  );
}

function Segment({
  active,
  children,
  onClick,
  first,
  last,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`viewer-segment min-w-0 flex-1 px-2 py-1.5 text-[9px] font-semibold transition ${
        first ? 'rounded-l-md' : ''
      } ${
        last ? 'rounded-r-md' : ''
      } ${active ? 'is-active' : ''}`}
    >
      {children}
    </button>
  );
}


const SIDEBAR_COPY = {
  vi: {
    optimize: 'Tối ưu',
    switchLight: 'Chuyển sang giao diện sáng',
    switchDark: 'Chuyển sang giao diện tối',
    tools: 'Công cụ',
    measurements: 'Đo đạc',
    clipping: 'Cắt dữ liệu',
    navigation: 'Điều hướng',
    appearance: 'Hiển thị',
    scene: 'Lớp dữ liệu',
    show: 'Hiện',
    hide: 'Ẩn',
    clipNone: 'Không',
    clipHighlight: 'Nổi bật',
    clipInside: 'Bên trong',
    clipOutside: 'Bên ngoài',
    insideAny: 'Trong bất kỳ',
    insideAll: 'Trong tất cả',
    perspective: 'Phối cảnh',
    orthographic: 'Trực giao',
    speed: 'Tốc độ',
    pointBudget: 'Mật độ điểm',
    fieldOfView: 'Góc nhìn',
    pointSize: 'Kích thước điểm',
    edl: 'Eye-Dome Lighting',
    enable: 'Bật',
    radius: 'Bán kính',
    strength: 'Cường độ',
    opacity: 'Độ mờ',
    background: 'Nền',
    sky: 'Bầu trời',
    gradient: 'Chuyển sắc',
    black: 'Đen',
    white: 'Trắng',
    none: 'Không',
    quality: 'Chất lượng',
    standard: 'Tiêu chuẩn',
    highQuality: 'Chất lượng cao',
    minNodeSize: 'Kích thước node tối thiểu',
    lockView: 'Khóa góc nhìn',
    quickFocus: 'Đi tới nhanh',
    focusProject: 'Bay tới Dự án',
    focusPointCloud: 'Bay tới Point Cloud',
    focusDom: 'Bay tới Ảnh DOM',
    pointCloud: 'Point Cloud',
    model3d: '3D Model (GLB)',
    dom: 'Ảnh DOM',
    angle: 'Góc',
    point: 'Điểm',
    distance: 'Cự ly',
    height: 'Cao độ',
    circle: 'Đường tròn',
    azimuth: 'Phương vị',
    area: 'Diện tích',
    volume: 'Thể tích',
    sphere: 'Sphere',
    profile: 'Trắc dọc',
    annotation: 'Ghi chú',
    clear: 'Xóa',
    clipBox: 'Box',
    clipPolygon: 'Đa giác',
    clipPlane: 'Mặt phẳng',
    navEarth: 'Earth',
    navFly: 'Bay',
    navOrbit: 'Orbit',
    navHeli: 'Heli',
    navFocus: 'Focus',
    navProject: 'Dự án',
    navNorth: 'Bắc',
    navCamera: 'Camera',
  },
  en: {
    optimize: 'Optimize',
    switchLight: 'Switch to light mode',
    switchDark: 'Switch to dark mode',
    tools: 'Tools',
    measurements: 'Measurements',
    clipping: 'Clipping',
    navigation: 'Navigation',
    appearance: 'Appearance',
    scene: 'Scene',
    show: 'Show',
    hide: 'Hide',
    clipNone: 'None',
    clipHighlight: 'Highlight',
    clipInside: 'Inside',
    clipOutside: 'Outside',
    insideAny: 'Inside Any',
    insideAll: 'Inside All',
    perspective: 'Perspective',
    orthographic: 'Orthographic',
    speed: 'Speed',
    pointBudget: 'Point budget',
    fieldOfView: 'Field of view',
    pointSize: 'Point size',
    edl: 'Eye-Dome Lighting',
    enable: 'Enable',
    radius: 'Radius',
    strength: 'Strength',
    opacity: 'Opacity',
    background: 'Background',
    sky: 'Sky',
    gradient: 'Gradient',
    black: 'Black',
    white: 'White',
    none: 'None',
    quality: 'Quality',
    standard: 'Standard',
    highQuality: 'High Quality',
    minNodeSize: 'Min node size',
    lockView: 'Lock view',
    quickFocus: 'Quick Focus',
    focusProject: 'Fly to Project',
    focusPointCloud: 'Fly to Point Cloud',
    focusDom: 'Fly to DOM',
    pointCloud: 'Point Cloud',
    model3d: '3D Model (GLB)',
    dom: 'DOM Image',
    angle: 'Angle',
    point: 'Point',
    distance: 'Distance',
    height: 'Height',
    circle: 'Circle',
    azimuth: 'Azimuth',
    area: 'Area',
    volume: 'Volume',
    sphere: 'Sphere',
    profile: 'Profile',
    annotation: 'Note',
    clear: 'Clear',
    clipBox: 'Box',
    clipPolygon: 'Polygon',
    clipPlane: 'Plane',
    navEarth: 'Earth',
    navFly: 'Fly',
    navOrbit: 'Orbit',
    navHeli: 'Heli',
    navFocus: 'Focus',
    navProject: 'Project',
    navNorth: 'North',
    navCamera: 'Camera',
  },
  zh: {
    optimize: '优化',
    switchLight: '切换到浅色模式',
    switchDark: '切换到深色模式',
    tools: '工具',
    measurements: '测量',
    clipping: '裁剪',
    navigation: '导航',
    appearance: '显示',
    scene: '数据图层',
    show: '显示',
    hide: '隐藏',
    clipNone: '无',
    clipHighlight: '高亮',
    clipInside: '内部',
    clipOutside: '外部',
    insideAny: '任一内部',
    insideAll: '全部内部',
    perspective: '透视',
    orthographic: '正交',
    speed: '速度',
    pointBudget: '点密度',
    fieldOfView: '视野',
    pointSize: '点大小',
    edl: '眼穹顶照明',
    enable: '启用',
    radius: '半径',
    strength: '强度',
    opacity: '透明度',
    background: '背景',
    sky: '天空',
    gradient: '渐变',
    black: '黑色',
    white: '白色',
    none: '无',
    quality: '质量',
    standard: '标准',
    highQuality: '高质量',
    minNodeSize: '最小节点大小',
    lockView: '锁定视角',
    quickFocus: '快速定位',
    focusProject: '飞至项目',
    focusPointCloud: '飞至点云',
    focusDom: '飞至DOM',
    pointCloud: '点云',
    model3d: '3D 模型 (GLB)',
    dom: 'DOM影像',
    angle: '角度',
    point: '点',
    distance: '距离',
    height: '高度',
    circle: '圆',
    azimuth: '方位角',
    area: '面积',
    volume: '体积',
    sphere: '球体',
    profile: '剖面',
    annotation: '注释',
    clear: '清除',
    clipBox: '框选',
    clipPolygon: '多边形',
    clipPlane: '平面',
    navEarth: '地球',
    navFly: '飞行',
    navOrbit: '环绕',
    navHeli: '直升机',
    navFocus: '聚焦',
    navProject: '项目',
    navNorth: '北向',
    navCamera: '相机',
  },
} as const;

export function PotreeSidebar({
  isOpen: controlledIsOpen,
  onToggleOpen,

  projectName = 'Dự án 3D',

  currentMode,
  onModeChange,
  onClear,
  measurementManager,
  onClipTool,
  clipMode = 'highlight',
  onClipModeChange,
  clipFilter = 'any',
  onClipFilterChange,
  showMeasurements = true,
  onToggleShowMeasurements,
  cameraSpeed = 130.6,
  onCameraSpeedChange,
  onSetCameraView,
  onNavigationAction,
  onToggleOptimizer,
  isOptimizerOpen,
  showModel,
  setShowModel,
  showDom,
  setShowDom,
  showPointCloud,
  setShowPointCloud,
  pointSize,
  onPointSizeChange,
  fov,
  onFovChange,
  edlEnabled,
  edlSupported = false,
  onEdlToggle,
  edlRadius,
  onEdlRadiusChange,
  edlStrength,
  onEdlStrengthChange,
  edlOpacity,
  onEdlOpacityChange,
  background,
  onBackgroundChange,
  quality,
  onQualityChange,
  pointBudget,
  onPointBudgetChange,
  minPointBudget = 100_000,
  maxPointBudget = 12_000_000,
  minNodeSize,
  onMinNodeSizeChange,
  lockView,
  onLockViewChange,
  isOrthographic,
  onProjectionChange,
  onFocusProject,
  onFocusPointCloud,
  onFocusDom,
}: PotreeSidebarProps) {
  const { currentLang } = useLanguage('vi');
  const c = SIDEBAR_COPY[currentLang];

  const [localIsOpen, setLocalIsOpen] =
    useState(true);

  const isOpen =
    controlledIsOpen !== undefined
      ? controlledIsOpen
      : localIsOpen;

  const [isDarkMode, setIsDarkMode] =
    useState(readInitialTheme);

  useEffect(() => {
    const savedTheme = isDarkMode
      ? 'dark'
      : 'light';

    document.documentElement.dataset.saolatekTheme =
      savedTheme;

    const syncTheme = (event: Event) => {
      const detail = (
        event as CustomEvent<'light' | 'dark'>
      ).detail;

      if (detail === 'dark') {
        setIsDarkMode(true);
      }

      if (detail === 'light') {
        setIsDarkMode(false);
      }
    };

    const syncStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !== THEME_STORAGE_KEY
      ) {
        return;
      }

      if (event.newValue === 'dark') {
        setIsDarkMode(true);
      }

      if (event.newValue === 'light') {
        setIsDarkMode(false);
      }
    };

    window.addEventListener(
      THEME_CHANGE_EVENT,
      syncTheme
    );

    window.addEventListener(
      'storage',
      syncStorage
    );

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        syncTheme
      );

      window.removeEventListener(
        'storage',
        syncStorage
      );
    };
  }, []);

  const applyTheme = (nextDark: boolean) => {
    const theme = nextDark
      ? 'dark'
      : 'light';

    setIsDarkMode(nextDark);

    document.documentElement.dataset.saolatekTheme =
      theme;

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );

    try {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: theme,
        })
      );
    } catch {
      // Custom event below handles same-tab sync.
    }

    window.dispatchEvent(
      new CustomEvent(
        THEME_CHANGE_EVENT,
        { detail: theme }
      )
    );
  };

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setLocalIsOpen((value) => !value);
    }
  };

  const [sections, setSections] = useState({
    tools: true,
    appearance: true,
    scene: true,
  });

  const toggleSection = (
    key: keyof typeof sections
  ) => {
    setSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const backgroundOptions: {
    key: BgMode;
    label: string;
  }[] = [
    { key: 'sky', label: c.sky },
    {
      key: 'gradient',
      label: c.gradient,
    },
    { key: 'black', label: c.black },
    { key: 'white', label: c.white },
    { key: 'none', label: c.none },
  ];

  const getIconUrl = (filename: string) => {
    const base =
      import.meta.env.BASE_URL || '/';

    const cleanBase = base.endsWith('/')
      ? base
      : `${base}/`;

    return `${cleanBase}potree/resources/icons/${filename}`;
  };

  const measureTools: {
    mode: ToolMode | 'clear';
    icon: string;
    label: string;
    title: string;
  }[] = [
    {
      mode: 'angle',
      icon: getIconUrl('angle.svg'),
      label: c.angle,
      title: 'Đo góc (Angle)',
    },
    {
      mode: 'point',
      icon: getIconUrl('point.svg'),
      label: c.point,
      title:
        'Tọa độ điểm (Point coordinates)',
    },
    {
      mode: 'distance',
      icon: getIconUrl('distance.svg'),
      label: c.distance,
      title:
        'Đo khoảng cách liên tục (Distance)',
    },
    {
      mode: 'height',
      icon: getIconUrl('height.svg'),
      label: c.height,
      title: 'Đo chiều cao đứng (Height)',
    },
    {
      mode: 'circle',
      icon: getIconUrl('circle.svg'),
      label: c.circle,
      title:
        'Đo đường tròn & bán kính (Circle)',
    },
    {
      mode: 'azimuth',
      icon: getIconUrl('azimuth.svg'),
      label: c.azimuth,
      title:
        'Đo góc phương vị Bắc (Azimuth)',
    },
    {
      mode: 'area',
      icon: getIconUrl('area.svg'),
      label: c.area,
      title: 'Đo diện tích phẳng (Area)',
    },
    {
      mode: 'volume',
      icon: getIconUrl('volume.svg'),
      label: c.volume,
      title: 'Đo thể tích khối 3D (Volume)',
    },
    {
      mode: 'sphere',
      icon: getIconUrl('sphere.svg'),
      label: c.sphere,
      title:
        'Đo khoảng cách cầu 3D (Sphere)',
    },
    {
      mode: 'profile',
      icon: getIconUrl('profile.svg'),
      label: c.profile,
      title:
        'Cắt lát trắc dọc cao độ (Profile)',
    },
    {
      mode: 'annotation',
      icon: getIconUrl('annotation.svg'),
      label: c.annotation,
      title: 'Thêm ghi chú 3D (Annotation)',
    },
    {
      mode: 'clear',
      icon: getIconUrl('remove.svg'),
      label: c.clear,
      title:
        'Xóa toàn bộ các phép đo',
    },
  ];

  const clipTools = [
    {
      id: 'box',
      icon: getIconUrl('clip_volume.svg'),
      label: c.clipBox,
      title: 'Cắt khối Box (Volume Clip)',
    },
    {
      id: 'polygon',
      icon: getIconUrl('clip-polygon.svg'),
      label: c.clipPolygon,
      title: 'Cắt đa giác (Polygon Clip)',
    },
    {
      id: 'plane',
      icon: getIconUrl('clip-plane-z.svg'),
      label: c.clipPlane,
      title:
        'Cắt mặt phẳng Z (Plane Clip)',
    },
    {
      id: 'clear',
      icon: getIconUrl('remove.svg'),
      label: c.clear,
      title: 'Xóa tất cả mặt cắt',
    },
  ];

  const navigationTools = [
    {
      id: 'earth',
      icon: getIconUrl(
        'earth_controls.svg'
      ),
      title:
        'Điều khiển quả địa cầu (Earth)',
      label: c.navEarth,
    },
    {
      id: 'fps',
      icon: getIconUrl('fps_controls.svg'),
      title:
        'Điều khiển bay tự do (FPS / Fly)',
      label: c.navFly,
    },
    {
      id: 'orbit',
      icon: getIconUrl(
        'orbit_controls.svg'
      ),
      title: 'Quay quanh tâm (Orbit)',
      label: c.navOrbit,
    },
    {
      id: 'heli',
      icon: getIconUrl(
        'helicopter_controls.svg'
      ),
      title:
        'Góc nhìn trực thăng (Helicopter)',
      label: c.navHeli,
    },
    {
      id: 'focus',
      icon: getIconUrl('focus.svg'),
      title: 'Focus tới Point Cloud',
      label: c.navFocus,
      action: onFocusPointCloud,
    },
    {
      id: 'cube',
      icon: getIconUrl(
        'navigation_cube.svg'
      ),
      title: 'Bay tới Dự án',
      label: c.navProject,
      action: onFocusProject,
    },
    {
      id: 'compass',
      icon: getIconUrl('azimuth.svg'),
      title: 'La bàn hướng Bắc',
      label: c.navNorth,
    },
    {
      id: 'anim',
      icon: getIconUrl(
        'camera_animation.svg'
      ),
      title: 'Tạo hoạt ảnh Camera',
      label: c.navCamera,
    },
  ];

  const cubeViews: (
    | 'L'
    | 'R'
    | 'F'
    | 'B'
    | 'T'
    | 'D'
  )[] = ['L', 'R', 'F', 'B', 'T', 'D'];

  // Visual helpers only — handlers and tool behavior stay unchanged.
  const baseToolButton =
    'viewer-tool-card group relative';

  const activeToolButton =
    'is-active';

  const amberToolButton =
    'hover:border-amber-400/35';

  const dangerToolButton =
    'is-danger';

  const neutralIconFilter =
    'brightness(0) saturate(100%) invert(73%) sepia(12%) saturate(486%) hue-rotate(179deg) brightness(93%) contrast(86%)';

  const activeIconFilter =
    'brightness(0) saturate(100%) invert(61%) sepia(79%) saturate(2148%) hue-rotate(166deg) brightness(98%) contrast(92%)';

  const amberIconFilter =
    'brightness(0) saturate(100%) invert(74%) sepia(56%) saturate(1015%) hue-rotate(350deg) brightness(101%) contrast(95%)';

  const dangerIconFilter =
    'brightness(0) saturate(100%) invert(49%) sepia(66%) saturate(1922%) hue-rotate(318deg) brightness(95%) contrast(93%)';

  return (
    <>
      <style>{viewerStyle}</style>

      <aside
        className={`saolatek-viewer-sidebar absolute left-0 top-0 z-20 flex h-screen w-[292px] select-none flex-col border-r border-[var(--vs-border)] bg-[var(--vs-bg)] font-sans text-[var(--vs-text)] shadow-[var(--vs-shadow)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vs-border)] bg-[var(--vs-bg-soft)] px-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col justify-center pr-2">
            <img
              src={logoImg}
              alt="SAOLATEK"
              draggable={false}
              className="h-[27px] w-auto max-w-[126px] object-contain object-left"
            />

            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[8px] font-medium text-[var(--vs-muted)]">
              <span className="shrink-0">v1.8.0</span>
              <span className="shrink-0 text-[var(--vs-border)]">
                ·
              </span>
              <span className="truncate">
                {projectName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                applyTheme(!isDarkMode)
              }
              title={
                isDarkMode
                  ? c.switchLight
                  : c.switchDark
              }
              aria-label={
                isDarkMode
                  ? c.switchLight
                  : c.switchDark
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--vs-border)] bg-[var(--vs-surface)] text-[var(--vs-text-soft)] transition hover:border-sky-500/35 hover:bg-[var(--vs-surface-hover)] hover:text-sky-500"
            >
              {isDarkMode ? (
                <Sun size={14} />
              ) : (
                <Moon size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleOptimizer}
              title="Bộ tối ưu hóa dữ liệu 3D"
              className={`rounded-lg border px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide transition ${
                isOptimizerOpen
                  ? 'border-sky-500/45 bg-sky-500/10 text-sky-500'
                  : 'border-[var(--vs-border)] bg-[var(--vs-surface)] text-[var(--vs-muted)] hover:border-sky-500/30 hover:bg-[var(--vs-surface-hover)] hover:text-[var(--vs-text)]'
              }`}
            >
              {c.optimize}
            </button>
          </div>
        </div>

        <div className="viewer-sidebar-scroll flex-1 overflow-y-auto">
          <SectionHeader
            label={c.tools}
            icon={<Wrench size={11} />}
            isOpen={sections.tools}
            onToggle={() =>
              toggleSection('tools')
            }
          />

          {sections.tools && (
            <div className="space-y-4 border-b border-[var(--vs-border-soft)] px-3.5 py-4">
              <div className="viewer-section-shell space-y-3">
                <MicroTitle>
                  {c.measurements}
                </MicroTitle>

                <div className="grid grid-cols-3 gap-2">
                  {measureTools.map(
                    (tool, index) => {
                      const isClear =
                        tool.mode === 'clear';

                      const isActive =
                        !isClear &&
                        currentMode ===
                          tool.mode;

                      return (
                        <button
                          type="button"
                          key={`${tool.mode}-${index}`}
                          onClick={() => {
                            if (isClear) {
                              onClear();
                            } else {
                              onModeChange(
                                tool.mode as ToolMode
                              );
                            }
                          }}
                          title={tool.title}
                          className={`${baseToolButton} ${
                            isClear
                              ? dangerToolButton
                              : isActive
                                ? activeToolButton
                                : ''
                          }`}
                        >
                          <img
                            src={tool.icon}
                            alt={tool.title}
                            className="h-5 w-5 object-contain opacity-95"
                            style={{
                              filter: isClear
                                ? dangerIconFilter
                                : isActive
                                  ? activeIconFilter
                                  : neutralIconFilter,
                            }}
                          />

                          <span className="viewer-tool-label">
                            {tool.label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="viewer-control-strip flex">
                  <Segment
                    active={showMeasurements}
                    first
                    onClick={() => {
                      if (
                        !showMeasurements &&
                        onToggleShowMeasurements
                      ) {
                        onToggleShowMeasurements();
                      }
                    }}
                  >
                    {c.show}
                  </Segment>

                  <div className="w-px bg-slate-700/65" />

                  <Segment
                    active={!showMeasurements}
                    last
                    onClick={() => {
                      if (
                        showMeasurements &&
                        onToggleShowMeasurements
                      ) {
                        onToggleShowMeasurements();
                      }
                    }}
                  >
                    {c.hide}
                  </Segment>
                </div>

                {measurementManager}
              </div>

              <div className="viewer-section-shell space-y-3">
                <MicroTitle>
                  {c.clipping}
                </MicroTitle>

                <div className="grid grid-cols-4 gap-2">
                  {clipTools.map(
                    (tool) => (
                      <button
                        type="button"
                        key={tool.id}
                        onClick={() => {
                          onClipTool?.(tool.id as 'box' | 'polygon' | 'plane' | 'clear');
                        }}
                        disabled={tool.id === 'polygon'}
                        title={tool.id === 'polygon' ? 'Clipping polygon chưa được hỗ trợ an toàn cho pipeline hiện tại' : tool.title}
                        className={`${baseToolButton} ${
                          tool.id === 'clear'
                            ? dangerToolButton
                            : amberToolButton
                        }`}
                      >
                        <img
                          src={tool.icon}
                          alt={tool.title}
                          className="h-5 w-5 object-contain opacity-95"
                          style={{
                            filter:
                              tool.id ===
                              'clear'
                                ? dangerIconFilter
                                : amberIconFilter,
                          }}
                        />
                        <span className="viewer-tool-label">
                          {tool.label}
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-4 overflow-hidden rounded-md border border-[var(--vs-border)] bg-[var(--vs-bg-soft)]">
                  {(
                    [
                      'none',
                      'highlight',
                      'inside',
                      'outside',
                    ] as ClipMode[]
                  ).map(
                    (mode, index) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() =>
                          onClipModeChange?.(mode)
                        }
                        className={`px-1 py-1.5 text-[9px] font-semibold capitalize transition ${
                          clipMode === mode
                            ? 'bg-[var(--vs-segment)] text-[var(--vs-text)]'
                            : 'text-[var(--vs-muted)] hover:bg-[var(--vs-bg-soft)] hover:text-[var(--vs-text)]'
                        } ${
                          index < 3
                            ? 'border-r border-[var(--vs-border)]'
                            : ''
                        }`}
                      >
                        {{
                          none: c.clipNone,
                          highlight: c.clipHighlight,
                          inside: c.clipInside,
                          outside: c.clipOutside,
                        }[mode]}
                      </button>
                    )
                  )}
                </div>

                <div className="flex overflow-hidden rounded-md border border-[var(--vs-border)] bg-[var(--vs-bg-soft)]">
                  <Segment
                    active={
                      clipFilter === 'any'
                    }
                    first
                    onClick={() =>
                      onClipFilterChange?.('any')
                    }
                  >
                    {c.insideAny}
                  </Segment>

                  <div className="w-px bg-slate-700/65" />

                  <Segment
                    active={
                      clipFilter === 'all'
                    }
                    last
                    onClick={() =>
                      onClipFilterChange?.('all')
                    }
                  >
                    {c.insideAll}
                  </Segment>
                </div>
              </div>

              <div className="viewer-section-shell space-y-3">
                <MicroTitle>
                  {c.navigation}
                </MicroTitle>

                <div className="grid grid-cols-4 gap-2">
                  {navigationTools.map(
                    (tool) => (
                      <button
                        type="button"
                        key={tool.id}
                        disabled={tool.id === 'heli' || tool.id === 'anim'}
                        onClick={() => {
                          if (tool.action) {
                            tool.action();
                          } else if (tool.id !== 'heli' && tool.id !== 'anim') {
                            onNavigationAction?.(tool.id as 'earth' | 'fps' | 'orbit' | 'compass');
                          }
                        }}
                        title={tool.title}
                        className={`${baseToolButton} disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <img
                          src={tool.icon}
                          alt={tool.title}
                          className="h-5 w-5 object-contain opacity-95"
                          style={{
                            filter:
                              activeIconFilter,
                          }}
                        />
                        <span className="viewer-tool-label">
                          {tool.label}
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {cubeViews.map((view) => (
                    <button
                      type="button"
                      key={view}
                      onClick={() =>
                        onSetCameraView?.(view)
                      }
                      title={`Góc nhìn ${view}`}
                      className="viewer-camera-key py-2"
                    >
                      {view}
                    </button>
                  ))}
                </div>

                <div className="flex overflow-hidden rounded-md border border-[var(--vs-border)] bg-[var(--vs-bg-soft)]">
                  <Segment
                    active={!isOrthographic}
                    first
                    onClick={() =>
                      onProjectionChange(false)
                    }
                  >
                    {c.perspective}
                  </Segment>

                  <div className="w-px bg-slate-700/65" />

                  <Segment
                    active={isOrthographic}
                    last
                    onClick={() =>
                      onProjectionChange(true)
                    }
                  >
                    {c.orthographic}
                  </Segment>
                </div>

                <div className="pt-1">
                  <SliderRow
                    label={c.speed}
                    value={cameraSpeed}
                    displayValue={cameraSpeed.toFixed(
                      1
                    )}
                    min={10}
                    max={500}
                    step={1}
                    onChange={
                      onCameraSpeedChange ||
                      (() => {})
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <SectionHeader
            label={c.appearance}
            isOpen={sections.appearance}
            onToggle={() =>
              toggleSection('appearance')
            }
          />

          {sections.appearance && (
            <div className="space-y-4 border-b border-[var(--vs-border-soft)] px-3.5 py-4">
              {(() => {
                const minBudget =
                  minPointBudget || 0;

                const maxBudget =
                  maxPointBudget ||
                  12_000_000;

                const percent = Math.max(
                  1,
                  Math.min(
                    100,
                    Math.round(
                      ((pointBudget -
                        minBudget) /
                        Math.max(
                          1,
                          maxBudget -
                            minBudget
                        )) *
                        100
                    )
                  )
                );

                return (
                  <SliderRow
                    label={c.pointBudget}
                    value={percent}
                    displayValue={`${percent}%`}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(
                      nextPercent
                    ) => {
                      const nextBudget =
                        Math.round(
                          minBudget +
                            (nextPercent /
                              100) *
                              (maxBudget -
                                minBudget)
                        );

                      onPointBudgetChange(
                        nextBudget
                      );
                    }}
                  />
                );
              })()}

              <SliderRow
                label={c.fieldOfView}
                value={fov}
                min={30}
                max={120}
                step={1}
                onChange={onFovChange}
              />

              <SliderRow
                label={c.pointSize}
                value={pointSize}
                min={1}
                max={8}
                step={0.5}
                onChange={(value) =>
                  onPointSizeChange(
                    Math.round(value * 2) / 2
                  )
                }
              />

              <div className="space-y-3">
                <MicroTitle>
                  {c.edl}
                </MicroTitle>

                <PtCheckbox
                  label={edlSupported ? c.enable : `${c.enable} (không hỗ trợ)`}
                  checked={edlEnabled}
                  onChange={onEdlToggle}
                  disabled={!edlSupported}
                />

                {edlEnabled && (
                  <div className="space-y-4 pl-1">
                    <SliderRow
                      label={c.radius}
                      value={edlRadius}
                      min={0}
                      max={4}
                      step={0.1}
                      onChange={
                        onEdlRadiusChange
                      }
                    />

                    <SliderRow
                      label={c.strength}
                      value={edlStrength}
                      min={0}
                      max={5}
                      step={0.1}
                      onChange={
                        onEdlStrengthChange
                      }
                    />

                    <SliderRow
                      label={c.opacity}
                      value={edlOpacity}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={
                        onEdlOpacityChange
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <MicroTitle>
                  {c.background}
                </MicroTitle>

                <div className="flex flex-wrap gap-1">
                  {backgroundOptions.map(
                    ({ key, label }) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() =>
                          onBackgroundChange(key)
                        }
                        className={`rounded-md border px-2.5 py-1.5 text-[9px] font-semibold transition ${
                          background === key
                            ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                            : 'border-transparent text-[var(--vs-muted)] hover:border-slate-700 hover:bg-slate-800/55 hover:text-[var(--vs-text)]'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <MicroTitle>
                  {c.quality}
                </MicroTitle>

                <div className="flex overflow-hidden rounded-md border border-[var(--vs-border)] bg-[var(--vs-bg-soft)]">
                  <Segment
                    active={
                      quality === 'standard'
                    }
                    first
                    onClick={() =>
                      onQualityChange(
                        'standard'
                      )
                    }
                  >
                    {c.standard}
                  </Segment>

                  <div className="w-px bg-slate-700/65" />

                  <Segment
                    active={quality === 'high'}
                    last
                    onClick={() =>
                      onQualityChange('high')
                    }
                  >
                    {c.highQuality}
                  </Segment>
                </div>
              </div>

              <SliderRow
                label={c.minNodeSize}
                value={minNodeSize}
                min={0}
                max={32}
                step={1}
                onChange={(value) =>
                  onMinNodeSizeChange(
                    Math.round(value)
                  )
                }
              />

              <div className="flex items-center gap-2">
                <PtCheckbox
                  label={c.lockView}
                  checked={lockView}
                  onChange={onLockViewChange}
                />

                {lockView ? (
                  <Lock
                    size={11}
                    className="text-sky-400"
                  />
                ) : (
                  <Unlock
                    size={11}
                    className="text-slate-600"
                  />
                )}
              </div>
            </div>
          )}

          <SectionHeader
            label={c.scene}
            isOpen={sections.scene}
            onToggle={() =>
              toggleSection('scene')
            }
          />

          {sections.scene && (
            <div className="space-y-3 border-b border-[var(--vs-border-soft)] px-3.5 py-4">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setShowPointCloud(
                      !showPointCloud
                    )
                  }
                  className="viewer-scene-row group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition hover:bg-[var(--vs-bg-soft)]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      showPointCloud
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-slate-600 bg-slate-950/60'
                    }`}
                  >
                    {showPointCloud && (
                      <CheckMark />
                    )}
                  </span>

                  <Layers
                    size={13}
                    className="text-sky-400"
                  />

                  <span className="viewer-scene-label text-[11px] transition">
                    {c.pointCloud}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowModel(!showModel)
                  }
                  className="viewer-scene-row group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition hover:bg-[var(--vs-bg-soft)]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      showModel
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-slate-600 bg-slate-950/60'
                    }`}
                  >
                    {showModel && (
                      <CheckMark />
                    )}
                  </span>

                  <Box
                    size={13}
                    className="text-emerald-400"
                  />

                  <span className="viewer-scene-label text-[11px] transition">
                    {c.model3d}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowDom(!showDom)
                  }
                  className="viewer-scene-row group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition hover:bg-[var(--vs-bg-soft)]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      showDom
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-slate-600 bg-slate-950/60'
                    }`}
                  >
                    {showDom && <CheckMark />}
                  </span>

                  <ImageIcon
                    size={13}
                    className="text-amber-400"
                  />

                  <span className="viewer-scene-label text-[11px] transition">
                    {c.dom}
                  </span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <MicroTitle>
                  {c.quickFocus}
                </MicroTitle>

                <button
                  type="button"
                  onClick={onFocusProject}
                  className="viewer-quick-focus flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[11px] font-medium transition"
                >
                  <NavIcon
                    size={13}
                    className="rotate-45 text-sky-400"
                  />
                  {c.focusProject}
                </button>

                {onFocusPointCloud && (
                  <button
                    type="button"
                    onClick={onFocusPointCloud}
                    className="viewer-quick-focus flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[11px] font-medium transition"
                  >
                    <MapPin
                      size={13}
                      className="text-sky-400"
                    />
                    {c.focusPointCloud}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onFocusDom}
                  className="viewer-quick-focus flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[11px] font-medium transition"
                >
                  <Settings2
                    size={13}
                    className="text-amber-400"
                  />
                  {c.focusDom}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggle}
          title={
            isOpen
              ? 'Thu gọn menu'
              : 'Mở rộng menu'
          }
          className="group absolute left-full top-1/2 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--vs-border)] bg-[#081321]/95 text-slate-600 shadow-lg backdrop-blur-xl transition hover:bg-slate-900 hover:text-[var(--vs-text)] focus-visible:outline-none"
        >
          {isOpen ? (
            <ChevronLeft size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
        </button>
      </aside>
    </>
  );
}
