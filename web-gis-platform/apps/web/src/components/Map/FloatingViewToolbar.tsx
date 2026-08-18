/* Hallmark · component: FloatingViewToolbar · genre: atmospheric · theme: Terminal
 * Thanh chuyển nhanh chế độ hiển thị trong không gian Web GIS 3D.
 */

import React from 'react';

import {
  Map,
  Layers,
  Box,
  Image,
  Compass,
  ArrowDown,
} from 'lucide-react';

export type DisplayMode =
  | 'full'
  | 'pointcloud'
  | 'model3d'
  | 'dom';

export type ViewAngle =
  | 'default'
  | 'topdown';

interface FloatingViewToolbarProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;

  viewAngle: ViewAngle;
  onViewAngleChange: (angle: ViewAngle) => void;
}

export const FloatingViewToolbar: React.FC<
  FloatingViewToolbarProps
> = ({
  displayMode,
  onDisplayModeChange,
  viewAngle,
  onViewAngleChange,
}) => {

  const modeButton = (active: boolean) =>
    `flex min-h-11 items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-[#0284c7] text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
    }`;

  const angleButton = (active: boolean) =>
    `flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-slate-800 text-white border border-slate-700'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
    }`;

  return (
    <div
      className="
        fixed
        top-4
        left-3
        right-3
        sm:left-1/2
        sm:right-auto
        sm:-translate-x-1/2
        z-30

        max-w-none
        sm:max-w-[calc(100vw-40px)]
        overflow-x-auto
        overscroll-x-contain

        flex
        items-center
        gap-1.5

        px-2
        py-1.5

        bg-[#151924]/90
        border
        border-[#2a3142]
        backdrop-blur-md

        rounded-2xl

        shadow-[0_8px_30px_rgb(0,0,0,0.45)]

        text-xs
        font-sans
        select-none

        transition-all
        duration-200
      "
    >

      {/* Tổng quan */}
      <button
        onClick={() =>
          onDisplayModeChange('full')
        }
        className={modeButton(
          displayMode === 'full'
        )}
        title="Hiển thị đồng thời các lớp dữ liệu đang bật"
      >
        <Map
          size={14}
          className={
            displayMode === 'full'
              ? 'text-white'
              : 'text-sky-400'
          }
        />

        <span>Tổng quan</span>
      </button>

      {/* Point Cloud */}
      <button
        onClick={() =>
          onDisplayModeChange('pointcloud')
        }
        className={modeButton(
          displayMode === 'pointcloud'
        )}
        title="Tập trung hiển thị lớp Point Cloud"
      >
        <Layers
          size={14}
          className={
            displayMode === 'pointcloud'
              ? 'text-white'
              : 'text-sky-400'
          }
        />

        <span>Point Cloud</span>
      </button>

      {/* Mesh */}
      <button
        onClick={() =>
          onDisplayModeChange('model3d')
        }
        className={modeButton(
          displayMode === 'model3d'
        )}
        title="Tập trung hiển thị mô hình 3D"
      >
        <Box
          size={14}
          className={
            displayMode === 'model3d'
              ? 'text-white'
              : 'text-emerald-400'
          }
        />

        <span>Mô hình 3D</span>
      </button>

      {/* DOM */}
      <button
        onClick={() =>
          onDisplayModeChange('dom')
        }
        className={modeButton(
          displayMode === 'dom'
        )}
        title="Tập trung hiển thị ảnh trực giao DOM"
      >
        <Image
          size={14}
          className={
            displayMode === 'dom'
              ? 'text-white'
              : 'text-amber-400'
          }
        />

        <span>Ảnh DOM</span>
      </button>

      <div className="w-px h-4 bg-slate-700/70 mx-1 shrink-0" />

      {/* Perspective */}
      <button
        onClick={() =>
          onViewAngleChange('default')
        }
        className={angleButton(
          viewAngle === 'default'
        )}
        title="Góc nhìn phối cảnh 3D"
      >
        <Compass
          size={13}
          className={
            viewAngle === 'default'
              ? 'text-sky-400'
              : 'text-slate-400'
          }
        />

        <span>Phối cảnh</span>
      </button>

      {/* Top Down */}
      <button
        onClick={() =>
          onViewAngleChange('topdown')
        }
        className={angleButton(
          viewAngle === 'topdown'
        )}
        title="Nhìn vuông góc từ trên xuống"
      >
        <ArrowDown
          size={13}
          className={
            viewAngle === 'topdown'
              ? 'text-amber-400'
              : 'text-slate-400'
          }
        />

        <span>Từ trên xuống</span>
      </button>

    </div>
  );
};
