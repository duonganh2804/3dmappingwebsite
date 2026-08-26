/*
 * UnifiedToolbar — Option B Premium
 * Presentation only. Existing tool behavior remains unchanged.
 */
import React from 'react';
import {
  ArrowDown,
  Box,
  Compass,
  Image as ImageIcon,
  Layers,
  Map,
} from 'lucide-react';

import { useLanguage } from '../../hooks/useLanguage';

export type DisplayMode =
  | 'full'
  | 'pointcloud'
  | 'model3d'
  | 'dom';

export type ViewAngle =
  | 'default'
  | 'topdown';

interface UnifiedToolbarProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (
    mode: DisplayMode
  ) => void;

  viewAngle: ViewAngle;
  onViewAngleChange: (
    angle: ViewAngle
  ) => void;

  // Reserve the fixed top-right area occupied by Calibration Panel (Admin).
  reserveAdminPanel?: boolean;
  reserveSidebar?: boolean;
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

  .viewer-command-group {
    display: flex;
    flex-shrink: 0;
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

`;


const TOOLBAR_COPY = {
  vi: {
    fullMap: 'Toàn cảnh',
    pointCloud: 'Point Cloud',
    model3d: '3D Model',
    dom: 'Ảnh DOM',
    defaultView: 'Mặc định',
    topDown: 'Nhìn từ trên',
  },
  en: {
    fullMap: 'Full Map',
    pointCloud: 'Point Cloud',
    model3d: '3D Model',
    dom: 'DOM Image',
    defaultView: 'Default',
    topDown: 'Top Down',
  },
  zh: {
    fullMap: '全景',
    pointCloud: '点云',
    model3d: '3D 模型',
    dom: 'DOM影像',
    defaultView: '默认',
    topDown: '俯视',
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

export const UnifiedToolbar: React.FC<
  UnifiedToolbarProps
> = ({
  displayMode,
  onDisplayModeChange,
  viewAngle,
  onViewAngleChange,
  reserveAdminPanel = false,
  reserveSidebar = true,
}) => {
  const { currentLang } =
    useLanguage('vi');
  const c = TOOLBAR_COPY[currentLang];
  const leftReserve = reserveSidebar ? 308 : 16;
  const rightReserve = reserveAdminPanel ? 352 : 16;

  return (
    <>
      <style>{toolbarStyle}</style>

      <div
        className="viewer-command-bar fixed top-3 z-30 flex w-max max-w-full flex-nowrap items-center overflow-x-auto rounded-2xl border border-[var(--bar-border)] bg-[var(--bar-bg)] p-1.5 shadow-[var(--bar-shadow)] backdrop-blur-xl select-none"
        style={{
          left: `calc(${leftReserve}px + (100vw - ${leftReserve + rightReserve}px) / 2)`,
          maxWidth: `calc(100vw - ${leftReserve + rightReserve}px)`,
          transform: 'translateX(-50%)',
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

      </div>
    </>
  );
};
