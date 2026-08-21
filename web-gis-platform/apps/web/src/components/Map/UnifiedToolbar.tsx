/*
 * UnifiedToolbar — Option B Premium
 * Presentation only. Existing tool behavior remains unchanged.
 */
import React from 'react';
import {
  ArrowDown,
  ArrowUpDown,
  Box,
  ChevronRight,
  Compass,
  Image as ImageIcon,
  Layers,
  Map,
  Ruler,
  Square,
  Trash2,
} from 'lucide-react';

import type { ToolMode } from './CesiumViewer';
import { useLanguage } from '../../hooks/useLanguage';

export type DisplayMode =
  | 'full'
  | 'pointcloud'
  | 'model3d'
  | 'dom';

export type ViewAngle =
  | 'default'
  | 'topdown';

export type { ToolMode };

interface UnifiedToolbarProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (
    mode: DisplayMode
  ) => void;

  viewAngle: ViewAngle;
  onViewAngleChange: (
    angle: ViewAngle
  ) => void;

  toolMode: ToolMode;
  onToolModeChange: (
    mode: ToolMode
  ) => void;

  onClear: () => void;

  // Reserve the fixed top-right area occupied by Calibration Panel (Admin).
  reserveAdminPanel?: boolean;
}

const toolbarStyle = `
  .viewer-command-bar {
    --bar-bg: rgba(8, 19, 33, .92);
    --bar-surface: rgba(15, 23, 42, .76);
    --bar-hover: rgba(30, 41, 59, .88);
    --bar-border: rgba(71, 85, 105, .56);
    --bar-border-soft: rgba(51, 65, 85, .48);
    --bar-text: #e2e8f0;
    --bar-soft: #94a3b8;
    --bar-muted: #64748b;
    --bar-accent: #0ea5e9;
    --bar-shadow: 0 16px 38px rgba(2, 6, 23, .30);
  }

  html[data-saolatek-theme='light']
  .viewer-command-bar {
    --bar-bg: rgba(255, 255, 255, .96);
    --bar-surface: #f8fafc;
    --bar-hover: #f1f5f9;
    --bar-border: rgba(148, 163, 184, .48);
    --bar-border-soft: rgba(203, 213, 225, .84);
    --bar-text: #0f172a;
    --bar-soft: #475569;
    --bar-muted: #64748b;
    --bar-accent: #0284c7;
    --bar-shadow: 0 14px 34px rgba(15, 23, 42, .13);
  }

  .viewer-command-bar::-webkit-scrollbar {
    height: 0;
  }

  /*
   * Keep the toolbar's LEFT EDGE stable.
   * Previously it was centered with translateX(-50%), so adding Xóa/hint
   * made the bar wider and pushed its left edge underneath "Bảng điều khiển".
   */
  @media (max-width: 1180px) {
    .viewer-command-bar {
      left: 328px !important;
    }
  }

  .viewer-command-group {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .viewer-command-divider {
    width: 1px;
    height: 24px;
    margin: 0 5px;
    background: var(--bar-border-soft);
  }

  .viewer-command-btn {
    display: inline-flex;
    height: 36px;
    align-items: center;
    gap: 7px;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 0 11px;
    color: var(--bar-soft);
    font-size: 11px;
    font-weight: 650;
    white-space: nowrap;
    transition:
      background .15s ease,
      border-color .15s ease,
      color .15s ease,
      transform .15s ease;
  }

  .viewer-command-btn:hover {
    border-color: var(--bar-border-soft);
    background: var(--bar-hover);
    color: var(--bar-text);
  }

  .viewer-command-btn:active {
    transform: translateY(1px);
  }

  .viewer-command-btn.is-primary {
    border-color: rgba(14, 165, 233, .38);
    background: rgba(14, 165, 233, .12);
    color: var(--bar-accent);
  }

  html[data-saolatek-theme='light']
  .viewer-command-btn.is-primary {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    box-shadow: 0 5px 14px rgba(2, 132, 199, .18);
  }

  .viewer-command-btn.is-secondary-active {
    border-color: var(--bar-border);
    background: var(--bar-surface);
    color: var(--bar-text);
  }

  .viewer-measure-hint {
    border: 1px solid var(--bar-border-soft);
    background: var(--bar-surface);
    color: var(--bar-muted);
  }
`;


const TOOLBAR_COPY = {
  vi: {
    fullMap: 'Toàn cảnh',
    pointCloud: 'Point Cloud',
    model3d: '3D Model',
    dom: 'Ảnh DOM',
    defaultView: 'Mặc định',
    topDown: 'Nhìn từ trên',
    distance: 'Khoảng cách',
    height: 'Chiều cao',
    area: 'Diện tích',
    clear: 'Xóa',
    distanceHint:
      'Click chốt điểm · Click lại điểm cuối để kết thúc',
    heightHint:
      'Click 2 điểm để đo chiều cao đứng',
    areaHint:
      'Click chốt đỉnh · Double-click để đóng đa giác',
  },
  en: {
    fullMap: 'Full Map',
    pointCloud: 'Point Cloud',
    model3d: '3D Model',
    dom: 'DOM Image',
    defaultView: 'Default',
    topDown: 'Top Down',
    distance: 'Distance',
    height: 'Height',
    area: 'Area',
    clear: 'Clear',
    distanceHint: 'Click to place points · Click the last point again to finish',
    heightHint: 'Click 2 points to measure vertical height',
    areaHint: 'Click vertices · Double-click to close the polygon',
  },
  zh: {
    fullMap: '全景',
    pointCloud: '点云',
    model3d: '3D 模型',
    dom: 'DOM影像',
    defaultView: '默认',
    topDown: '俯视',
    distance: '距离',
    height: '高度',
    area: '面积',
    clear: '清除',
    distanceHint: '点击放置测点 · 再次点击最后一点完成',
    heightHint: '点击两个点测量垂直高度',
    areaHint: '点击添加顶点 · 双击闭合多边形',
  },
} as const;

const LAYER_BUTTONS = [
  {
    mode: 'full' as DisplayMode,
    icon: Map,
    labelKey: 'fullMap' as const,
    iconColor: 'text-sky-500',
    title:
      'Bản đồ đầy đủ với quả địa cầu Cesium, Ảnh DOM và Mô hình 3D Mesh',
  },
  {
    mode: 'pointcloud' as DisplayMode,
    icon: Layers,
    labelKey: 'pointCloud' as const,
    iconColor: 'text-sky-500',
    title:
      'Chỉ hiển thị Point Cloud với chất lượng cực đại',
  },
  {
    mode: 'model3d' as DisplayMode,
    icon: Box,
    labelKey: 'model3d' as const,
    iconColor: 'text-emerald-500',
    title:
      'Chỉ hiển thị Mô hình 3D Mesh',
  },
  {
    mode: 'dom' as DisplayMode,
    icon: ImageIcon,
    labelKey: 'dom' as const,
    iconColor: 'text-amber-500',
    title:
      'Chỉ hiển thị Ảnh trực giao DOM hàng không',
  },
];

const VIEW_BUTTONS = [
  {
    angle: 'default' as ViewAngle,
    icon: Compass,
    labelKey: 'defaultView' as const,
    title:
      'Góc nhìn phối cảnh 3D nghiêng mặc định',
  },
  {
    angle: 'topdown' as ViewAngle,
    icon: ArrowDown,
    labelKey: 'topDown' as const,
    title:
      'Nhìn vuông góc 90° từ trên xuống',
  },
];

const MEASURE_BUTTONS = [
  {
    mode: 'distance' as ToolMode,
    icon: Ruler,
    labelKey: 'distance' as const,
    iconColor: 'text-sky-500',
    title:
      'Đo khoảng cách 3D giữa các điểm',
  },
  {
    mode: 'height' as ToolMode,
    icon: ArrowUpDown,
    labelKey: 'height' as const,
    iconColor: 'text-emerald-500',
    title:
      'Đo chiều cao đứng giữa 2 điểm',
  },
  {
    mode: 'area' as ToolMode,
    icon: Square,
    labelKey: 'area' as const,
    iconColor: 'text-amber-500',
    title:
      'Đo diện tích đa giác',
  },
];

export const UnifiedToolbar: React.FC<
  UnifiedToolbarProps
> = ({
  displayMode,
  onDisplayModeChange,
  viewAngle,
  onViewAngleChange,
  toolMode,
  onToolModeChange,
  onClear,
  reserveAdminPanel = false,
}) => {
  const { currentLang } =
    useLanguage('vi');
  const c = TOOLBAR_COPY[currentLang];

  const isMeasuring =
    toolMode !== 'none';

  const handleMeasureClick = (
    mode: ToolMode
  ) => {
    onToolModeChange(
      toolMode === mode ? 'none' : mode
    );
  };

  return (
    <>
      <style>{toolbarStyle}</style>

      <div
        className="viewer-command-bar fixed left-[468px] top-3 z-30 flex items-center overflow-x-auto rounded-2xl border border-[var(--bar-border)] bg-[var(--bar-bg)] p-1.5 shadow-[var(--bar-shadow)] backdrop-blur-xl select-none"
        style={{
          right: reserveAdminPanel ? '352px' : '16px',
          maxWidth: 'none',
        }}
      >
        <div className="viewer-command-group">
          {LAYER_BUTTONS.map(
            ({
              mode,
              icon: Icon,
              labelKey,
              iconColor,
              title,
            }) => {
              const active =
                displayMode === mode;

              return (
                <button
                  type="button"
                  key={mode}
                  onClick={() =>
                    onDisplayModeChange(mode)
                  }
                  title={title}
                  className={`viewer-command-btn ${
                    active
                      ? 'is-primary'
                      : ''
                  }`}
                >
                  <Icon
                    size={14}
                    className={
                      active
                        ? ''
                        : iconColor
                    }
                  />
                  <span>{c[labelKey]}</span>
                </button>
              );
            }
          )}
        </div>

        <div className="viewer-command-divider" />

        <div className="viewer-command-group">
          {VIEW_BUTTONS.map(
            ({
              angle,
              icon: Icon,
              labelKey,
              title,
            }) => {
              const active =
                viewAngle === angle;

              return (
                <button
                  type="button"
                  key={angle}
                  onClick={() =>
                    onViewAngleChange(angle)
                  }
                  title={title}
                  className={`viewer-command-btn ${
                    active
                      ? 'is-secondary-active'
                      : ''
                  }`}
                >
                  <Icon
                    size={13}
                    className={
                      active
                        ? 'text-sky-500'
                        : ''
                    }
                  />
                  <span>{c[labelKey]}</span>
                </button>
              );
            }
          )}
        </div>

        <div className="viewer-command-divider" />

        <div className="viewer-command-group">
          {MEASURE_BUTTONS.map(
            ({
              mode,
              icon: Icon,
              labelKey,
              iconColor,
              title,
            }) => {
              const active =
                toolMode === mode;

              return (
                <button
                  type="button"
                  key={mode}
                  onClick={() =>
                    handleMeasureClick(mode)
                  }
                  title={title}
                  className={`viewer-command-btn ${
                    active
                      ? 'is-secondary-active'
                      : ''
                  }`}
                >
                  <Icon
                    size={14}
                    className={
                      active
                        ? 'text-sky-500'
                        : iconColor
                    }
                  />
                  <span>{c[labelKey]}</span>
                </button>
              );
            }
          )}

          {isMeasuring && (
            <button
              type="button"
              onClick={() => {
                onClear();
                onToolModeChange('none');
              }}
              title="Xóa tất cả các phép đo"
              className="viewer-command-btn !text-rose-500 hover:!border-rose-500/25 hover:!bg-rose-500/[0.08]"
            >
              <Trash2 size={14} />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {isMeasuring && (
          <>
            <div className="viewer-command-divider hidden 2xl:block" />

            <div className="viewer-measure-hint hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] 2xl:flex">
              <ChevronRight
                size={10}
                className="text-sky-500"
              />

              <span className="max-w-[245px] truncate">
                {toolMode === 'distance' &&
                  c.distanceHint}

                {toolMode === 'height' &&
                  c.heightHint}

                {toolMode === 'area' &&
                  c.areaHint}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
};