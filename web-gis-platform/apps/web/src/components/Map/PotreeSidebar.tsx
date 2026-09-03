/**
 * PotreeSidebar — SAOLATEK engineering/GIS visual refresh
 * UI-only redesign. Functional props / handlers are intentionally preserved.
 * Dense inspector-style layout: less dashboard/card-like, more GIS/CAD tooling.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Loader2,
  Lock,
  MapPin,
  Navigation as NavIcon,
  Settings2,
  ScanSearch,
  Moon,
  MinusCircle,
  Sun,
  Unlock,
  AlertTriangle,
  Flame,
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

export type LayerLoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

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
  activeClipTool?: 'box' | 'polygon' | 'plane' | null;
  clipInstruction?: string | null;
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
  isZoomAreaSelecting?: boolean;
  onToggleZoomArea?: () => void;
  isFocusPicking?: boolean;
  isReturningFocusOrigin?: boolean;
  onToggleFocusPick?: () => void;
  navigationMode?: 'earth' | 'fps' | 'orbit' | 'heli';
  isCameraAnimating?: boolean;
  flightHeight?: number;
  onFlightHeightChange?: (height: number) => void;
  orbitRadius?: number;
  onOrbitRadiusChange?: (radius: number) => void;
  flightPathPointCount?: number;
  isDrawingFlightPath?: boolean;
  flightPathStatus?: 'idle' | 'flying' | 'paused';
  onDrawFlightPath?: () => void;
  onStartFlightPath?: () => void;
  onPauseFlightPath?: () => void;
  onResumeFlightPath?: () => void;
  onStopFlightPath?: () => void;
  onReplayFlightPath?: () => void;
  onDeleteFlightPath?: () => void;
  activeCameraView?: 'L' | 'R' | 'F' | 'B' | 'T' | 'D' | null;
  viewAngle?: 'default' | 'topdown';
  cameraHeading?: number;
  orbitTargetSelected?: boolean;
  isSelectingOrbitTarget?: boolean;
  isOrbitingTarget?: boolean;
  onSelectOrbitTarget?: () => void;
  onStartOrbitTarget?: () => void;
  onStopOrbitTarget?: () => void;

  showModel: boolean;
  setShowModel: (v: boolean) => void;
  showDom: boolean;
  setShowDom: (v: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (v: boolean) => void;
  modelOpacity: number;
  onModelOpacityChange: (v: number) => void;
  pointCloudOpacity: number;
  onPointCloudOpacityChange: (v: number) => void;
  heatmapEnabled: boolean;
  onHeatmapEnabledChange: (v: boolean) => void;
  heatmapProperty: 'elevation';
  onHeatmapPropertyChange: (v: 'elevation') => void;
  heatmapMax: number;
  heatmapRangeAvailable: boolean;
  domOpacity: number;
  onDomOpacityChange: (v: number) => void;
  modelLoadStatus?: LayerLoadStatus;
  pointCloudLoadStatus?: LayerLoadStatus;
  domLoadStatus?: LayerLoadStatus;
  modelLoadError?: string | null;
  pointCloudLoadError?: string | null;
  domLoadError?: string | null;
  onRetryModel?: () => void;
  onRetryPointCloud?: () => void;
  onRetryDom?: () => void;

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

  .saolatek-viewer-sidebar {
    width: min(86vw, 292px);
    height: 100%;
    overscroll-behavior: contain;
  }

  .viewer-sidebar-scroll {
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  .viewer-sidebar-toggle-icon {
    display: none;
  }

  @media (min-width: 64rem) {
    .saolatek-viewer-sidebar {
      position: relative !important;
      width: clamp(260px, 21vw, 320px);
      flex: 0 0 clamp(260px, 21vw, 320px);
      transition-property: width, flex-basis, transform;
    }

    .saolatek-viewer-sidebar[data-open='false'] {
      position: absolute !important;
    }
  }

  @media (max-width: 63.999rem) {
    .saolatek-viewer-sidebar {
      z-index: 50 !important;
      box-shadow: 18px 0 44px rgba(2, 6, 23, .42);
    }

    .viewer-sidebar-toggle {
      width: 40px !important;
      height: 48px !important;
    }

    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle {
      width: auto !important;
      min-width: 104px;
      gap: 7px;
      padding-inline: 12px;
    }

    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle-label {
      display: inline;
    }

    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle-icon {
      display: block;
    }

    .viewer-slider {
      min-height: 40px;
      touch-action: none;
    }

  }

  @media (max-width: 47.999rem) {
    .viewer-sidebar-toggle,
    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle {
      width: 44px !important;
      min-width: 44px;
      height: 44px !important;
      gap: 0;
      padding-inline: 0;
    }

    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle-label,
    .saolatek-viewer-sidebar[data-open='false'] .viewer-sidebar-toggle-icon {
      display: none;
    }
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

  .viewer-camera-key.is-active {
    border-color: rgba(14,165,233,.52);
    background: var(--vs-accent-soft);
    color: var(--vs-accent);
    box-shadow: inset 0 0 0 1px rgba(14,165,233,.08);
  }

  /* ==============================================================
     ENGINEERING / GIS DENSITY PASS
     Visual-only overrides. Intentionally does not alter handlers,
     layer state, camera behavior, measurements, clipping or loaders.
     ============================================================== */

  html[data-saolatek-theme='light'] .saolatek-viewer-sidebar {
    --vs-bg: #f4f7fa;
    --vs-bg-soft: #fbfcfd;
    --vs-bg-strong: #ffffff;
    --vs-surface: #ffffff;
    --vs-surface-hover: #edf3f7;
    --vs-segment: #e5edf3;
    --vs-border: #b9c6d2;
    --vs-border-soft: #d7e0e7;
    --vs-text: #1f2937;
    --vs-text-soft: #526273;
    --vs-muted: #748395;
    --vs-accent: #0787bd;
    --vs-accent-soft: rgba(7, 135, 189, .09);
    --vs-danger: #d6425d;
    --vs-shadow: 5px 0 18px rgba(15, 23, 42, .08);
  }

  .saolatek-viewer-sidebar {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .viewer-sidebar-scroll {
    background: var(--vs-bg);
  }

  .viewer-sidebar-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .viewer-section-header {
    min-height: 31px;
    letter-spacing: .11em !important;
    background: color-mix(in srgb, var(--vs-bg-soft) 92%, transparent);
  }

  .viewer-section-header:hover {
    background: var(--vs-surface-hover);
  }

  .viewer-section-shell {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
  }

  .viewer-section-shell + .viewer-section-shell {
    border-top: 1px solid var(--vs-border-soft);
    padding-top: 11px;
  }

  .viewer-micro-title {
    min-height: 20px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vs-border-soft);
    letter-spacing: .105em !important;
    font-size: 9px !important;
  }

  .viewer-tool-card {
    min-height: 48px;
    gap: 4px;
    border-radius: 5px;
    border-color: var(--vs-border-soft);
    background: var(--vs-surface);
    box-shadow: none;
    transform: none !important;
  }

  .viewer-tool-card:hover {
    transform: none !important;
    border-color: color-mix(in srgb, var(--vs-accent) 34%, var(--vs-border-soft));
    box-shadow: inset 0 0 0 1px rgba(14,165,233,.035);
  }

  .viewer-tool-card.is-active {
    border-color: color-mix(in srgb, var(--vs-accent) 56%, var(--vs-border-soft));
    background: var(--vs-accent-soft);
    box-shadow: inset 3px 0 0 var(--vs-accent);
  }

  .viewer-tool-card.is-danger {
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--vs-danger) 62%, transparent);
  }

  .viewer-tool-label {
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0;
  }

  .viewer-control-strip {
    border-radius: 4px;
  }

  .viewer-segment {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
  }

  .viewer-camera-key {
    min-height: 29px;
    border-radius: 4px;
    box-shadow: none !important;
  }

  .viewer-quick-focus {
    min-height: 34px;
    padding: 7px 9px !important;
    border-radius: 4px !important;
    box-shadow: none;
  }

  .viewer-scene-row {
    min-height: 31px;
    border-radius: 3px !important;
  }

  .viewer-scene-row + div {
    padding-bottom: 7px !important;
  }

  .viewer-heatmap-panel {
    border-left: 2px solid rgba(249, 115, 22, .55);
    padding-left: 9px;
  }

  .viewer-slider {
    height: 2px;
  }

  .viewer-slider::-webkit-slider-thumb {
    width: 11px;
    height: 11px;
    border-width: 2px;
  }

  .viewer-slider::-moz-range-thumb {
    width: 11px;
    height: 11px;
  }

  @media (max-width: 63.999rem) {
    .viewer-slider::-webkit-slider-thumb {
      width: 18px;
      height: 18px;
    }

    .viewer-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
    }
  }

  .viewer-slider-label,
  .viewer-slider-value,
  .viewer-check-label,
  .viewer-scene-label {
    font-size: 10.5px !important;
  }

  .viewer-sidebar-toggle {
    border-radius: 0 5px 5px 0 !important;
    box-shadow: 2px 2px 8px rgba(15, 23, 42, .12) !important;
  }

  @media (min-width: 64rem) {
    .saolatek-viewer-sidebar {
      width: clamp(276px, 20vw, 304px);
      flex-basis: clamp(276px, 20vw, 304px);
    }
  }


  .viewer-nav-mode-panel {
    position: relative;
    margin-top: 2px;
    padding: 10px 0 9px;
    border-top: 1px solid var(--vs-border-soft);
    border-bottom: 1px solid var(--vs-border-soft);
    background: transparent;
    box-shadow: none;
  }

  .viewer-nav-mode-panel::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 10px;
    bottom: 10px;
    width: 2px;
    border-radius: 999px;
    background: var(--vs-accent);
    opacity: .82;
  }

  .viewer-nav-mode-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--vs-text-soft);
    font-size: 9px;
    font-weight: 750;
    letter-spacing: .11em;
    text-transform: uppercase;
  }

  .viewer-nav-mode-status {
    color: var(--vs-accent);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .08em;
    white-space: nowrap;
  }

  .viewer-nav-primary,
  .viewer-nav-action {
    width: 100%;
    border: 1px solid var(--vs-border-soft);
    border-radius: 4px;
    background: var(--vs-surface);
    color: var(--vs-text-soft);
    transition: border-color .14s ease, background .14s ease, color .14s ease;
  }

  .viewer-nav-primary {
    min-height: 34px;
    padding: 7px 10px;
    font-size: 10px;
    font-weight: 650;
  }

  .viewer-nav-action {
    min-height: 31px;
    padding: 6px 8px;
    font-size: 9px;
    font-weight: 650;
  }

  .viewer-nav-primary:hover,
  .viewer-nav-action:hover {
    border-color: rgba(14,165,233,.34);
    background: var(--vs-surface-hover);
    color: var(--vs-text);
  }

  .viewer-nav-primary.is-active,
  .viewer-nav-action.is-active {
    border-color: rgba(14,165,233,.44);
    background: var(--vs-accent-soft);
    color: var(--vs-accent);
  }

  .viewer-nav-action.is-danger {
    border-color: rgba(244,63,94,.20);
    color: var(--vs-danger);
    background: transparent;
  }

  .viewer-nav-action.is-danger:hover {
    border-color: rgba(244,63,94,.34);
    background: rgba(244,63,94,.06);
  }

  .viewer-nav-hint {
    border-left: 2px solid var(--vs-border-soft);
    padding: 2px 0 2px 8px;
    color: var(--vs-muted);
    font-size: 9px;
    line-height: 1.55;
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
  stepButtons,
}: {
  label: string;
  value: number;
  displayValue?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  stepButtons?: {
    amount: number;
    decreaseAriaLabel: string;
    increaseAriaLabel: string;
  };
}) {
  const stepButtonClass =
    'flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--vs-border)] bg-[var(--vs-surface)] text-xs font-bold text-[var(--vs-text-soft)] transition hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="viewer-slider-label text-[11px] font-medium">
          {label}
        </span>

        <span className="viewer-slider-value min-w-[44px] text-right text-[11px] font-semibold tabular-nums">
          {displayValue ?? value}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        {stepButtons && (
          <button
            type="button"
            aria-label={stepButtons.decreaseAriaLabel}
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - stepButtons.amount))}
            className={stepButtonClass}
          >
            −
          </button>
        )}
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
          className="viewer-slider min-w-0 flex-1"
        />
        {stepButtons && (
          <button
            type="button"
            aria-label={stepButtons.increaseAriaLabel}
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + stepButtons.amount))}
            className={stepButtonClass}
          >
            +
          </button>
        )}
      </div>
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
      className="viewer-section-header group flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition"
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

function LayerStatus({ status, error, onRetry }: {
  status: LayerLoadStatus;
  error?: string | null;
  onRetry?: () => void;
}) {
  const icon = status === 'ready'
    ? <CheckCircle2 size={12} className="text-emerald-400" />
    : status === 'loading'
      ? <Loader2 size={12} className="animate-spin text-sky-400" />
      : status === 'error'
        ? <AlertTriangle size={12} className="text-rose-400" />
        : <MinusCircle size={12} className="text-[var(--vs-muted)] opacity-65" />;

  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <span title={error || (status === 'unavailable' ? 'Không có dữ liệu' : status)} aria-label={error || `Layer status: ${status}`}>
        {icon}
      </span>
      {status === 'error' && error && (
        <span className="max-w-[70px] truncate text-[8px] text-rose-400" title={error}>{error}</span>
      )}
      {status === 'error' && onRetry && (
        <span
          role="button"
          tabIndex={0}
          onClick={onRetry}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onRetry(); }}
          className="rounded border border-rose-400/25 bg-rose-400/[0.08] px-1.5 py-0.5 text-[8px] font-semibold text-rose-400 transition hover:bg-rose-400/[0.14] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
        >
          Thử lại
        </span>
      )}
    </span>
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
    navZoomArea: 'Zoom vùng',
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
    navZoomArea: 'Zoom Area',
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
    navZoomArea: '框选缩放',
    navFocus: '聚焦',
    navProject: '项目',
    navNorth: '北向',
    navCamera: '相机',
  },
} as const;

const HEATMAP_COPY = {
  vi: {
    title: 'Heatmap',
    on: 'Bật',
    off: 'Tắt',
    property: 'Thuộc tính',
    elevationHeight: 'Cao độ / Chiều cao',
    elevation: 'Độ cao',
    gradientLabel: 'Dải màu cao độ liên tục từ xanh lam đến đỏ',
    rangePending: 'Độ cao sẽ được tính tự động khi point cloud sẵn sàng.',
  },
  en: {
    title: 'Heatmap',
    on: 'ON',
    off: 'OFF',
    property: 'Property',
    elevationHeight: 'Elevation / Height',
    elevation: 'Elevation',
    gradientLabel: 'Continuous elevation gradient from blue to red',
    rangePending: 'Elevation will be calculated automatically when the point cloud is ready.',
  },
  zh: {
    title: '热力图',
    on: '开启',
    off: '关闭',
    property: '属性',
    elevationHeight: '高程 / 高度',
    elevation: '高程',
    gradientLabel: '从蓝色到红色的连续高程渐变',
    rangePending: '点云就绪后将自动计算高程。',
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
  activeClipTool,
  clipInstruction,
  clipMode = 'highlight',
  onClipModeChange,
  clipFilter = 'any',
  onClipFilterChange,
  showMeasurements = true,
  onToggleShowMeasurements,
  cameraSpeed = 40,
  onCameraSpeedChange,
  onSetCameraView,
  onNavigationAction,
  isFocusPicking = false,
  isReturningFocusOrigin = false,
  onToggleFocusPick,
  navigationMode = 'earth',
  isZoomAreaSelecting = false,
  onToggleZoomArea,
  isCameraAnimating = false,
  flightHeight = 60,
  onFlightHeightChange,
  orbitRadius = 35,
  onOrbitRadiusChange,
  flightPathPointCount = 0,
  isDrawingFlightPath = false,
  flightPathStatus = 'idle',
  onDrawFlightPath,
  onStartFlightPath,
  onPauseFlightPath,
  onResumeFlightPath,
  onStopFlightPath,
  onReplayFlightPath,
  onDeleteFlightPath,
  activeCameraView = null,
  viewAngle = 'default',
  cameraHeading = 0,
  orbitTargetSelected = false,
  isSelectingOrbitTarget = false,
  isOrbitingTarget = false,
  onSelectOrbitTarget,
  onStartOrbitTarget,
  onStopOrbitTarget,
  showModel,
  setShowModel,
  showDom,
  setShowDom,
  showPointCloud,
  setShowPointCloud,
  modelOpacity,
  onModelOpacityChange,
  pointCloudOpacity,
  onPointCloudOpacityChange,
  heatmapEnabled,
  onHeatmapEnabledChange,
  heatmapProperty,
  onHeatmapPropertyChange,
  heatmapMax,
  heatmapRangeAvailable,
  domOpacity,
  onDomOpacityChange,
  modelLoadStatus = 'idle',
  pointCloudLoadStatus = 'idle',
  domLoadStatus = 'idle',
  modelLoadError,
  pointCloudLoadError,
  domLoadError,
  onRetryModel,
  onRetryPointCloud,
  onRetryDom,
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
  const heatmapCopy = HEATMAP_COPY[currentLang];

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
      id: 'zoom-area',
      icon: '',
      isLucide: true,
      title: 'Kéo khung để zoom vào vùng cần xem',
      label: c.navZoomArea,
      action: onToggleZoomArea,
    },
    {
      id: 'focus',
      icon: getIconUrl('focus.svg'),
      title: isReturningFocusOrigin
        ? 'Đang trở về góc nhìn trước Focus'
        : isFocusPicking
          ? 'Hủy chọn điểm Focus'
          : 'Chọn một điểm để Focus',
      label: c.navFocus,
      action: onToggleFocusPick,
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
        data-open={isOpen}
        className={`saolatek-viewer-sidebar absolute left-0 top-0 z-20 flex select-none flex-col border-r border-[var(--vs-border)] bg-[var(--vs-bg)] font-sans text-[var(--vs-text)] shadow-[var(--vs-shadow)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vs-border)] bg-[var(--vs-bg-soft)] px-3 py-2.5">
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
            <div className="space-y-3 border-b border-[var(--vs-border-soft)] px-3 py-3">
              <div className="viewer-section-shell space-y-3">
                <MicroTitle>
                  {c.measurements}
                </MicroTitle>

                <div className="grid grid-cols-4 gap-1.5">
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
                        title={tool.title}
                        className={`${baseToolButton} ${
                          tool.id === 'clear'
                            ? dangerToolButton
                            : `${amberToolButton} ${activeClipTool === tool.id ? 'ring-1 ring-amber-300 bg-amber-400/15' : ''}`
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

                {clipInstruction && (
                  <p className="text-[10px] leading-4 text-[var(--vs-text-soft)]" role="status">
                    {clipInstruction}
                  </p>
                )}

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
                <div className="flex items-center justify-between gap-2">
                  <MicroTitle>{c.navigation}</MicroTitle>
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--vs-border-soft)] bg-[var(--vs-bg-soft)] px-2 py-1 font-mono text-[9px] font-semibold tabular-nums text-[var(--vs-accent)]"
                    title="Current camera heading"
                    aria-label={`Current camera heading ${Math.round(cameraHeading) % 360} degrees`}
                  >
                    <NavIcon aria-hidden="true" className="h-3 w-3 transition-transform duration-150" style={{ transform: `rotate(${-cameraHeading}deg)` }} />
                    {String(Math.round(cameraHeading) % 360).padStart(3, '0')}°
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {navigationTools.map(
                    (tool) => (
                      <button
                        type="button"
                        key={tool.id}
                        disabled={(tool.id === 'focus' && isReturningFocusOrigin) || (tool.id === 'zoom-area' && !onToggleZoomArea)}
                        onClick={() => {
                          if (tool.action) {
                            tool.action();
                          } else {
                            onNavigationAction?.(tool.id as 'earth' | 'fps' | 'orbit' | 'heli' | 'compass' | 'anim');
                          }
                        }}
                        title={tool.title}
                        className={`${baseToolButton} ${
                          ((tool.id === 'earth' || tool.id === 'fps' || tool.id === 'orbit' || tool.id === 'heli') && navigationMode === tool.id) ||
                          (tool.id === 'anim' && isCameraAnimating) ||
                          (tool.id === 'focus' && (isFocusPicking || isReturningFocusOrigin)) ||
                          (tool.id === 'zoom-area' && isZoomAreaSelecting)
                            ? activeToolButton
                            : ''
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {tool.id === 'zoom-area' ? (
                          <ScanSearch
                            size={20}
                            aria-hidden="true"
                            className={isZoomAreaSelecting ? 'text-sky-500' : 'text-[var(--vs-muted)]'}
                          />
                        ) : (
                          <img
                            src={tool.icon}
                            alt={tool.title}
                            className="h-5 w-5 object-contain opacity-95"
                            style={{
                              filter: (((tool.id === 'earth' || tool.id === 'fps' || tool.id === 'orbit' || tool.id === 'heli') && navigationMode === tool.id) ||
                                (tool.id === 'anim' && isCameraAnimating))
                                || (tool.id === 'focus' && (isFocusPicking || isReturningFocusOrigin))
                                ? activeIconFilter
                                : neutralIconFilter,
                            }}
                          />
                        )}
                        <span className="viewer-tool-label">
                          {tool.label}
                        </span>
                      </button>
                    )
                  )}
                </div>

                {isZoomAreaSelecting && (
                  <div className="border-l-2 border-sky-500 px-2.5 py-1.5 text-[9px] leading-4 text-[var(--vs-text-soft)]">
                    Kéo chuột trên bản đồ để khoanh vùng cần zoom · Esc để hủy
                  </div>
                )}

                {navigationMode === 'orbit' && (
                  <div className="viewer-nav-mode-panel space-y-2.5">
                    <div className="viewer-nav-mode-head">
                      <span>Orbit</span>
                      {orbitTargetSelected
                        ? <span className="viewer-nav-mode-status">Sẵn sàng bay</span>
                        : isSelectingOrbitTarget
                          ? <span className="viewer-nav-mode-status">Đang tạo vòng</span>
                          : null}
                    </div>

                    <button
                      type="button"
                      onClick={onSelectOrbitTarget}
                      className={`viewer-nav-primary ${isSelectingOrbitTarget ? 'is-active' : ''}`}
                    >
                      {orbitTargetSelected ? 'Chọn lại tâm + bán kính' : 'Chọn tâm + bán kính'}
                    </button>

                    {isSelectingOrbitTarget && (
                      <div className="viewer-nav-hint">
                        <div>1. Click điểm muốn focus.</div>
                        <div>2. Di chuột để xem vòng → click mép vòng để chốt bán kính.</div>
                        <div>3. Chỉnh Độ cao bay → vòng preview nâng/hạ realtime.</div>
                      </div>
                    )}

                    {(orbitTargetSelected || isSelectingOrbitTarget) && (
                      <div className="space-y-2">
                        <SliderRow
                          label="Độ cao bay"
                          value={flightHeight}
                          displayValue={`${flightHeight.toFixed(0)} m`}
                          min={10}
                          max={200}
                          step={5}
                          onChange={onFlightHeightChange || (() => {})}
                          stepButtons={{
                            amount: 5,
                            decreaseAriaLabel: 'Giảm độ cao bay',
                            increaseAriaLabel: 'Tăng độ cao bay',
                          }}
                        />
                        <SliderRow
                          label="Bán kính vòng"
                          value={orbitRadius}
                          displayValue={`${orbitRadius.toFixed(0)} m`}
                          min={12}
                          max={500}
                          step={5}
                          onChange={onOrbitRadiusChange || (() => {})}
                          stepButtons={{
                            amount: 5,
                            decreaseAriaLabel: 'Giảm bán kính vòng',
                            increaseAriaLabel: 'Tăng bán kính vòng',
                          }}
                        />
                        <SliderRow
                          label="Tốc độ bay"
                          value={cameraSpeed}
                          displayValue={`${cameraSpeed.toFixed(1)} m/s`}
                          min={5}
                          max={150}
                          step={1}
                          onChange={onCameraSpeedChange || (() => {})}
                          stepButtons={{
                            amount: 1,
                            decreaseAriaLabel: 'Giảm tốc độ bay',
                            increaseAriaLabel: 'Tăng tốc độ bay',
                          }}
                        />
                      </div>
                    )}

                    {orbitTargetSelected && !isOrbitingTarget && (
                      <button
                        type="button"
                        onClick={onStartOrbitTarget}
                        className="viewer-nav-primary is-active"
                      >
                        ▶ Bắt đầu bay
                      </button>
                    )}

                    {orbitTargetSelected && isOrbitingTarget && (
                      <button
                        type="button"
                        onClick={onStopOrbitTarget}
                        className="viewer-nav-primary"
                      >
                        ■ Dừng bay
                      </button>
                    )}

                    <p className="viewer-nav-hint">
                      Vòng bay giữ nguyên khi dừng. Khi đang bay, lăn chuột để co/giãn vòng; kéo camera để dừng.
                    </p>
                  </div>
                )}

                {navigationMode === 'fps' && (
                  <div className="viewer-nav-mode-panel space-y-2.5">
                    <div className="viewer-nav-mode-head">
                      <span>Bay</span>
                      {flightPathPointCount > 0 && <span className="viewer-nav-mode-status">{flightPathPointCount} waypoint</span>}
                    </div>
                    <button
                      type="button"
                      onClick={onDrawFlightPath}
                      disabled={isDrawingFlightPath}
                      className={`viewer-nav-primary ${isDrawingFlightPath ? 'is-active' : ''} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {flightPathPointCount >= 2 ? 'Vẽ lại đường bay' : 'Vẽ đường bay'}
                    </button>
                    {isDrawingFlightPath && (
                      <p className="viewer-nav-hint">Click waypoint · Nhấp đúp để hoàn tất · Có thể zoom / xoay / pan khi vẽ</p>
                    )}
                    <SliderRow
                      label="Độ cao bay"
                      value={flightHeight}
                      displayValue={`${Math.round(flightHeight)} m`}
                      min={10}
                      max={300}
                      step={1}
                      onChange={onFlightHeightChange || (() => {})}
                      stepButtons={{
                        amount: 5,
                        decreaseAriaLabel: 'Giảm độ cao bay',
                        increaseAriaLabel: 'Tăng độ cao bay',
                      }}
                    />
                    <SliderRow
                      label="Tốc độ bay"
                      value={cameraSpeed}
                      displayValue={`${cameraSpeed.toFixed(1)} m/s`}
                      min={5}
                      max={150}
                      step={1}
                      onChange={onCameraSpeedChange || (() => {})}
                      stepButtons={{
                        amount: 1,
                        decreaseAriaLabel: 'Giảm tốc độ bay',
                        increaseAriaLabel: 'Tăng tốc độ bay',
                      }}
                    />
                    {flightPathPointCount >= 2 && (
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={onStartFlightPath} disabled={flightPathStatus === 'flying'} className="viewer-nav-action disabled:cursor-not-allowed disabled:opacity-40">▶ Bắt đầu</button>
                        <button type="button" onClick={onReplayFlightPath} className="viewer-nav-action">↻ Bay lại</button>
                        <button
                          type="button"
                          onClick={flightPathStatus === 'paused' ? onResumeFlightPath : onPauseFlightPath}
                          disabled={flightPathStatus === 'idle'}
                          className="viewer-nav-action disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {flightPathStatus === 'paused' ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
                        </button>
                        <button type="button" onClick={onStopFlightPath} disabled={flightPathStatus === 'idle'} className="viewer-nav-action disabled:cursor-not-allowed disabled:opacity-40">■ Dừng</button>
                        <button type="button" onClick={onDeleteFlightPath} className="viewer-nav-action is-danger col-span-2">Xóa đường</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-6 gap-1">
                  {cubeViews.map((view) => (
                    <button
                      type="button"
                      key={view}
                      onClick={() => {
                        onSetCameraView?.(view);
                      }}
                      title={`Góc nhìn ${view}`}
                      aria-pressed={activeCameraView === view || (view === 'T' && viewAngle === 'topdown')}
                      className={`viewer-camera-key py-2 ${
                        activeCameraView === view || (view === 'T' && viewAngle === 'topdown')
                          ? 'is-active'
                          : ''
                      }`}
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

                {navigationMode !== 'fps' && navigationMode !== 'orbit' && (
                  <div className="pt-1">
                    <SliderRow
                      label={c.speed}
                      value={cameraSpeed}
                      displayValue={`${cameraSpeed.toFixed(1)} m/s`}
                      min={10}
                      max={300}
                      step={1}
                      onChange={
                        onCameraSpeedChange ||
                        (() => {})
                      }
                    />
                  </div>
                )}
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
            <div className="space-y-3 border-b border-[var(--vs-border-soft)] px-3 py-3">
              <div className="viewer-section-shell viewer-heatmap-panel space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Flame size={13} className="text-orange-400" aria-hidden="true" />
                    <MicroTitle>{heatmapCopy.title}</MicroTitle>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={heatmapEnabled}
                    onClick={() => onHeatmapEnabledChange(!heatmapEnabled)}
                    className={`rounded-md border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition ${heatmapEnabled
                      ? 'border-orange-400/45 bg-orange-400/10 text-orange-300'
                      : 'border-[var(--vs-border)] bg-[var(--vs-bg-soft)] text-[var(--vs-muted)] hover:text-[var(--vs-text)]'
                    }`}
                  >
                    {heatmapEnabled ? heatmapCopy.on : heatmapCopy.off}
                  </button>
                </div>

                <fieldset disabled={!heatmapEnabled} className="space-y-3 disabled:opacity-45">
                  <label className="block space-y-1.5 text-[10px] text-[var(--vs-text-soft)]">
                    <span>{heatmapCopy.property}</span>
                    <select
                      value={heatmapProperty}
                      onChange={event => onHeatmapPropertyChange(event.target.value as 'elevation')}
                      className="w-full rounded-md border border-[var(--vs-border)] bg-[var(--vs-surface)] px-2.5 py-2 text-[10px] text-[var(--vs-text)] outline-none focus-visible:border-sky-500"
                    >
                      <option value="elevation">{heatmapCopy.elevationHeight}</option>
                    </select>
                  </label>

                  {heatmapRangeAvailable && <div className="space-y-2">
                    <MicroTitle>{heatmapCopy.elevation}</MicroTitle>
                    <div>
                      <div
                        className="h-2.5 rounded-full border border-white/10 bg-[linear-gradient(90deg,#0066ff_0%,#00e5ff_20%,#00d45a_40%,#ffe600_60%,#ff8c00_80%,#ff2b20_100%)]"
                        aria-label={heatmapCopy.gradientLabel}
                      />
                      <div className="mt-1.5 flex justify-between text-[9px] tabular-nums text-[var(--vs-muted)]">
                        <span>0.0 m</span>
                        <span>{heatmapMax.toFixed(1)} m</span>
                      </div>
                    </div>
                  </div>}
                  {!heatmapRangeAvailable && (
                    <p className="text-[9px] leading-4 text-amber-400">{heatmapCopy.rangePending}</p>
                  )}
                </fieldset>
              </div>

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
                displayValue={pointSize.toFixed(1)}
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
            <div className="space-y-2.5 border-b border-[var(--vs-border-soft)] px-3 py-3">
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
                  <LayerStatus status={pointCloudLoadStatus} error={pointCloudLoadError} onRetry={onRetryPointCloud} />
                </button>
                <div className="px-1.5 pb-2">
                  <SliderRow
                    label={`${c.pointCloud} · ${c.opacity}`}
                    value={pointCloudOpacity}
                    displayValue={`${Math.round(pointCloudOpacity * 100)}%`}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={onPointCloudOpacityChange}
                  />
                </div>

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
                  <LayerStatus status={modelLoadStatus} error={modelLoadError} onRetry={onRetryModel} />
                </button>
                <div className="px-1.5 pb-2">
                  <SliderRow
                    label={`${c.model3d} · ${c.opacity}`}
                    value={modelOpacity}
                    displayValue={`${Math.round(modelOpacity * 100)}%`}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={onModelOpacityChange}
                  />
                </div>

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
                  <LayerStatus status={domLoadStatus} error={domLoadError} onRetry={onRetryDom} />
                </button>
                <div className="px-1.5 pb-1">
                  <SliderRow
                    label={`${c.dom} · ${c.opacity}`}
                    value={domOpacity}
                    displayValue={`${Math.round(domOpacity * 100)}%`}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={onDomOpacityChange}
                  />
                </div>
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
          className="viewer-sidebar-toggle group absolute left-full top-1/2 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--vs-border)] bg-[#081321]/95 text-slate-400 shadow-lg backdrop-blur-xl transition hover:bg-slate-900 hover:text-[var(--vs-text)] focus-visible:outline-none"
        >
          {isOpen ? (
            <ChevronLeft size={13} />
          ) : (
            <>
              <Wrench className="viewer-sidebar-toggle-icon" size={16} aria-hidden="true" />
              <span className="viewer-sidebar-toggle-label hidden whitespace-nowrap text-[11px] font-bold">
                {c.tools}
              </span>
              <ChevronRight size={13} aria-hidden="true" />
            </>
          )}
        </button>
      </aside>
    </>
  );
}
