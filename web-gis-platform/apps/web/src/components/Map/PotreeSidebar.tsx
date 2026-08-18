import { useState } from 'react';

import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Square,
  ArrowUpDown,
  Box,
  Trash2,
  Eye,
  Sun,
  Sliders,
  MapPin,
  Navigation,
  Layers,
  Image,
} from 'lucide-react';

import type { ToolMode } from './CesiumViewer';

interface PotreeSidebarProps {
  isOpen?: boolean;
  onToggleOpen?: () => void;

  projectName?: string;

  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onClear: () => void;

  isOptimizerOpen: boolean;
  onToggleOptimizer: () => void;
  showOptimizerControl?: boolean;

  showModel: boolean;
  setShowModel: (show: boolean) => void;

  showDom: boolean;
  setShowDom: (show: boolean) => void;

  showPointCloud: boolean;
  setShowPointCloud: (show: boolean) => void;

  pointSize: number;
  onPointSizeChange: (size: number) => void;

  fov: number;
  onFovChange: (fov: number) => void;

  edlEnabled: boolean;
  onEdlToggle: (enabled: boolean) => void;

  isOrthographic: boolean;
  onProjectionChange: (ortho: boolean) => void;

  onFocusProject: () => void;
  onFocusPointCloud?: () => void;
  onFocusDom: () => void;
}

export function PotreeSidebar({
  isOpen: controlledIsOpen,
  onToggleOpen,

  projectName = 'Dự án 3D',

  currentMode,
  onModeChange,
  onClear,

  isOptimizerOpen,
  onToggleOptimizer,
  showOptimizerControl = false,

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
  onEdlToggle,

  isOrthographic,
  onProjectionChange,

  onFocusProject,
  onFocusPointCloud,
  onFocusDom,
}: PotreeSidebarProps) {

  const [localIsOpen, setLocalIsOpen] =
    useState(true);

  const isOpen =
    controlledIsOpen !== undefined
      ? controlledIsOpen
      : localIsOpen;

  const [expandedSections, setExpandedSections] =
    useState({
      scene: true,
      tools: true,
      appearance: false,
    });

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
      return;
    }

    setLocalIsOpen(!localIsOpen);
  };

  const toggleSection = (
    section: keyof typeof expandedSections
  ) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside
      className={`
        absolute
        top-0
        left-0
        z-20

        w-[min(320px,calc(100vw-72px))]
        h-dvh

        bg-slate-950/95
        border-r
        border-slate-800

        text-slate-300

        flex
        flex-col

        font-sans
        select-none

        transition-transform
        duration-300
        ease-in-out

        ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }
      `}
      aria-label="Công cụ bản đồ 3D"
    >

      {/* HEADER */}
      <div
        className="
          px-4
          py-3.5

          border-b
          border-slate-900

          bg-slate-900/60

          flex
          items-center
          justify-between
          gap-3
        "
      >
        <div className="min-w-0">

          <div
            className="
              text-[11px]
              font-bold
              text-sky-400
              tracking-[0.12em]
              uppercase
            "
          >
            SAOLATEK 3D GIS
          </div>

          <div
            className="
              text-sm
              text-white
              font-semibold
              truncate
              mt-0.5
            "
            title={projectName}
          >
            {projectName}
          </div>

        </div>

        {showOptimizerControl && (
          <button
            onClick={onToggleOptimizer}
            className={`
              shrink-0
              px-2.5
              py-1

              text-[9px]
              font-bold
              uppercase

              rounded-lg
              border

              transition-all

              ${
                isOptimizerOpen
                  ? `
                    bg-emerald-500/20
                    border-emerald-500
                    text-emerald-400
                  `
                  : `
                    border-slate-700
                    text-slate-400

                    hover:bg-slate-800
                    hover:text-white
                  `
              }
            `}
            title="Công cụ tối ưu dữ liệu dành cho quản trị hệ thống"
          >
            Tối ưu
          </button>
        )}

      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-6">

        {/* ======================================================
            LỚP DỮ LIỆU
        ====================================================== */}

        <section className="border-b border-slate-900">

          <button
            onClick={() =>
              toggleSection('scene')
            }
            className="
              w-full
              px-4
              py-3

              bg-slate-900/30

              flex
              items-center
              justify-between

              text-xs
              font-bold
              uppercase
              text-slate-400

              hover:text-slate-200
              transition-colors
            "
          >
            <span className="flex items-center gap-2">

              <Layers
                size={14}
                className="text-sky-400"
              />

              Lớp dữ liệu

            </span>

            {expandedSections.scene ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}

          </button>

          {expandedSections.scene && (
            <div
              className="
                p-4
                bg-slate-950/40
                space-y-2
                text-xs
              "
            >

              {/* POINT CLOUD */}
              <label
                className="
                  flex
                  items-center
                  justify-between

                  cursor-pointer

                  py-2
                  px-2

                  rounded-lg

                  hover:bg-slate-900/40

                  transition-colors
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2
                    text-slate-300
                  "
                >
                  <MapPin
                    size={13}
                    className="text-sky-400"
                  />

                  Point Cloud
                </span>

                <input
                  type="checkbox"
                  checked={showPointCloud}
                  onChange={(e) =>
                    setShowPointCloud(
                      e.target.checked
                    )
                  }
                  className="
                    accent-sky-500
                    w-4
                    h-4
                    cursor-pointer
                  "
                />
              </label>

              {/* 3D MODEL */}
              <label
                className="
                  flex
                  items-center
                  justify-between

                  cursor-pointer

                  py-2
                  px-2

                  rounded-lg

                  hover:bg-slate-900/40

                  transition-colors
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2
                    text-slate-300
                  "
                >
                  <Box
                    size={13}
                    className="text-emerald-400"
                  />

                  Mô hình 3D Mesh
                </span>

                <input
                  type="checkbox"
                  checked={showModel}
                  onChange={(e) =>
                    setShowModel(
                      e.target.checked
                    )
                  }
                  className="
                    accent-sky-500
                    w-4
                    h-4
                    cursor-pointer
                  "
                />
              </label>

              {/* DOM */}
              <label
                className="
                  flex
                  items-center
                  justify-between

                  cursor-pointer

                  py-2
                  px-2

                  rounded-lg

                  hover:bg-slate-900/40

                  transition-colors
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2
                    text-slate-300
                  "
                >
                  <Eye
                    size={13}
                    className="text-amber-400"
                  />

                  Ảnh trực giao DOM
                </span>

                <input
                  type="checkbox"
                  checked={showDom}
                  onChange={(e) =>
                    setShowDom(
                      e.target.checked
                    )
                  }
                  className="
                    accent-sky-500
                    w-4
                    h-4
                    cursor-pointer
                  "
                />
              </label>

              {/* FOCUS */}
              <div
                className="
                  grid
                  grid-cols-3
                  gap-1.5

                  pt-2

                  border-t
                  border-slate-900/80
                "
              >

                {/* Project */}
                <button
                  onClick={onFocusProject}
                  className="
                    py-2
                    px-1

                    rounded-lg

                    border
                    border-slate-800

                    bg-slate-900/40

                    text-slate-300

                    hover:bg-slate-900
                    hover:text-white

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    text-[9px]
                    font-semibold

                    transition-all
                  "
                  title="Đưa camera về phạm vi dự án"
                >
                  <Navigation
                    size={12}
                    className="
                      text-sky-400
                      rotate-45
                    "
                  />

                  <span>Dự án</span>
                </button>

                {/* Point Cloud */}
                <button
                  onClick={onFocusPointCloud}
                  className="
                    py-2
                    px-1

                    rounded-lg

                    border
                    border-sky-500/30

                    bg-sky-950/20

                    text-sky-300

                    hover:bg-sky-900/40
                    hover:text-white

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    text-[9px]
                    font-semibold

                    transition-all
                  "
                  title="Đưa camera tới Point Cloud"
                >
                  <MapPin
                    size={12}
                    className="text-sky-400"
                  />

                  <span>Point Cloud</span>
                </button>

                {/* DOM */}
                <button
                  onClick={onFocusDom}
                  className="
                    py-2
                    px-1

                    rounded-lg

                    border
                    border-emerald-500/30

                    bg-emerald-950/20

                    text-emerald-300

                    hover:bg-emerald-900/40
                    hover:text-white

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    text-[9px]
                    font-semibold

                    transition-all
                  "
                  title="Đưa camera tới ảnh DOM"
                >
                  <Image
                    size={12}
                    className="text-emerald-400"
                  />

                  <span>Ảnh DOM</span>
                </button>

              </div>

            </div>
          )}

        </section>

        {/* ======================================================
            ĐO ĐẠC
        ====================================================== */}

        <section className="border-b border-slate-900">

          <button
            onClick={() =>
              toggleSection('tools')
            }
            className="
              w-full
              px-4
              py-3

              bg-slate-900/30

              flex
              items-center
              justify-between

              text-xs
              font-bold
              uppercase
              text-slate-400

              hover:text-slate-200
              transition-colors
            "
          >
            <span className="flex items-center gap-2">

              <Ruler
                size={14}
                className="text-sky-400"
              />

              Đo đạc & điều hướng

            </span>

            {expandedSections.tools ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}

          </button>

          {expandedSections.tools && (
            <div
              className="
                p-4
                space-y-4
                bg-slate-950/40
              "
            >

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-4
                  gap-2
                "
              >

                {/* DISTANCE */}
                <button
                  onClick={() =>
                    onModeChange('distance')
                  }
                  className={`
                    p-2.5
                    rounded-lg

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    border
                    transition-all

                    ${
                      currentMode === 'distance'
                        ? `
                          bg-sky-500/20
                          border-sky-500
                          text-sky-400
                        `
                        : `
                          border-slate-800
                          bg-slate-900/40
                          text-slate-400

                          hover:bg-slate-900
                          hover:text-slate-200
                        `
                    }
                  `}
                  title="Đo khoảng cách 3D"
                >
                  <Ruler size={18} />

                  <span className="text-[9px] font-medium">
                    Khoảng cách
                  </span>
                </button>

                {/* HEIGHT */}
                <button
                  onClick={() =>
                    onModeChange('height')
                  }
                  className={`
                    p-2.5
                    rounded-lg

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    border
                    transition-all

                    ${
                      currentMode === 'height'
                        ? `
                          bg-sky-500/20
                          border-sky-500
                          text-sky-400
                        `
                        : `
                          border-slate-800
                          bg-slate-900/40
                          text-slate-400

                          hover:bg-slate-900
                          hover:text-slate-200
                        `
                    }
                  `}
                  title="Đo chênh cao"
                >
                  <ArrowUpDown size={18} />

                  <span className="text-[9px] font-medium">
                    Chênh cao
                  </span>
                </button>

                {/* AREA */}
                <button
                  onClick={() =>
                    onModeChange('area')
                  }
                  className={`
                    p-2.5
                    rounded-lg

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    border
                    transition-all

                    ${
                      currentMode === 'area'
                        ? `
                          bg-sky-500/20
                          border-sky-500
                          text-sky-400
                        `
                        : `
                          border-slate-800
                          bg-slate-900/40
                          text-slate-400

                          hover:bg-slate-900
                          hover:text-slate-200
                        `
                    }
                  `}
                  title="Đo diện tích"
                >
                  <Square size={18} />

                  <span className="text-[9px] font-medium">
                    Diện tích
                  </span>
                </button>

                {/* CLEAR */}
                <button
                  onClick={onClear}
                  className="
                    p-2.5
                    rounded-lg

                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1

                    border
                    border-slate-800

                    bg-slate-900/40

                    text-red-400

                    hover:bg-red-950/20
                    hover:text-red-300

                    transition-all
                  "
                  title="Xóa các phép đo đang hiển thị"
                >
                  <Trash2 size={18} />

                  <span className="text-[9px] font-medium">
                    Xóa đo
                  </span>
                </button>

              </div>

              {/* PROJECTION */}
              <div
                className="
                  space-y-2
                  pt-2

                  border-t
                  border-slate-900/80
                "
              >
                <div
                  className="
                    text-[10px]
                    text-slate-500
                    font-bold
                    uppercase
                    tracking-wider
                  "
                >
                  Hệ chiếu camera
                </div>

                <div
                  className="
                    flex

                    bg-slate-900

                    rounded-lg

                    p-0.5

                    border
                    border-slate-800

                    text-[10px]
                    font-bold
                  "
                >

                  <button
                    onClick={() =>
                      onProjectionChange(false)
                    }
                    className={`
                      flex-1
                      py-1.5
                      rounded-md
                      transition-all

                      ${
                        !isOrthographic
                          ? `
                            bg-sky-500
                            text-white
                            shadow-[0_2px_6px_rgba(14,165,233,0.3)]
                          `
                          : `
                            text-slate-400
                            hover:text-slate-200
                          `
                      }
                    `}
                  >
                    Phối cảnh
                  </button>

                  <button
                    onClick={() =>
                      onProjectionChange(true)
                    }
                    className={`
                      flex-1
                      py-1.5
                      rounded-md
                      transition-all

                      ${
                        isOrthographic
                          ? `
                            bg-sky-500
                            text-white
                            shadow-[0_2px_6px_rgba(14,165,233,0.3)]
                          `
                          : `
                            text-slate-400
                            hover:text-slate-200
                          `
                      }
                    `}
                  >
                    Hình chiếu
                  </button>

                </div>

              </div>

            </div>
          )}

        </section>

        {/* ======================================================
            CẤU HÌNH HIỂN THỊ
        ====================================================== */}

        <section className="border-b border-slate-900">

          <button
            onClick={() =>
              toggleSection('appearance')
            }
            className="
              w-full
              px-4
              py-3

              bg-slate-900/30

              flex
              items-center
              justify-between

              text-xs
              font-bold
              uppercase
              text-slate-400

              hover:text-slate-200
              transition-colors
            "
          >

            <span className="flex items-center gap-2">

              <Sliders
                size={14}
                className="text-sky-400"
              />

              Cấu hình hiển thị

            </span>

            {expandedSections.appearance ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}

          </button>

          {expandedSections.appearance && (
            <div
              className="
                p-4
                space-y-4

                bg-slate-950/40

                text-xs
              "
            >

              {/* POINT SIZE */}
              <div className="space-y-1">

                <div
                  className="
                    flex
                    justify-between
                    font-medium
                    text-slate-400
                  "
                >
                  <span>Kích thước điểm</span>

                  <span
                    className="
                      text-sky-400
                      font-bold
                    "
                  >
                    {pointSize} px
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={pointSize}
                  onChange={(e) =>
                    onPointSizeChange(
                      parseInt(
                        e.target.value
                      )
                    )
                  }
                  className="
                    w-full
                    accent-sky-500
                    cursor-pointer
                  "
                />

              </div>

              {/* FOV */}
              <div className="space-y-1">

                <div
                  className="
                    flex
                    justify-between
                    font-medium
                    text-slate-400
                  "
                >
                  <span>
                    Góc nhìn camera
                  </span>

                  <span
                    className="
                      text-sky-400
                      font-bold
                    "
                  >
                    {fov}°
                  </span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="120"
                  step="5"
                  value={fov}
                  onChange={(e) =>
                    onFovChange(
                      parseInt(
                        e.target.value
                      )
                    )
                  }
                  className="
                    w-full
                    accent-sky-500
                    cursor-pointer
                  "
                />

              </div>

              {/* EDL */}
              <label
                className="
                  flex
                  items-center
                  justify-between

                  cursor-pointer

                  py-1

                  border-t
                  border-slate-900/60

                  pt-3
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2

                    font-medium
                    text-slate-400
                  "
                >
                  <Sun
                    size={14}
                    className="text-amber-400"
                  />

                  Eye Dome Lighting
                </span>

                <input
                  type="checkbox"
                  checked={edlEnabled}
                  onChange={(e) =>
                    onEdlToggle(
                      e.target.checked
                    )
                  }
                  className="
                    accent-sky-500
                    w-4
                    h-4
                    cursor-pointer
                  "
                />

              </label>

            </div>
          )}

        </section>

      </div>

      {/* SIDEBAR COLLAPSE */}
      <button
        onClick={handleToggle}
        className="
          absolute
          top-1/2
          -translate-y-1/2

          left-full
          -ml-px

          z-30

          flex
          items-center
          justify-center

          w-11
          h-20

          bg-slate-950/95

          hover:bg-slate-900

          border
          border-l-0
          border-slate-800

          rounded-r-xl

          cursor-pointer

          text-slate-400
          hover:text-white

          transition-all

          group

          focus-visible:outline-none
          focus-visible:ring-1
          focus-visible:ring-sky-500
        "
        title={
          isOpen
            ? 'Thu gọn công cụ'
            : 'Mở công cụ'
        }
        aria-label={
          isOpen
            ? 'Thu gọn công cụ'
            : 'Mở công cụ'
        }
      >
        {isOpen ? (
          <ChevronLeft
            size={16}
            className="
              transition-transform
              group-hover:-translate-x-0.5
            "
          />
        ) : (
          <ChevronRight
            size={16}
            className="
              transition-transform
              group-hover:translate-x-0.5
            "
          />
        )}
      </button>

    </aside>
  );
}
