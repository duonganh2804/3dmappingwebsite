import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
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
  Filter, 
  Info
} from 'lucide-react';
import type { ToolMode } from './CesiumViewer';

interface PotreeSidebarProps {
  // Mode đo đạc
  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onClear: () => void;
  
  // Toggling Optimizer
  isOptimizerOpen: boolean;
  onToggleOptimizer: () => void;
  
  // Layer visibility (Scene Tree)
  showModel: boolean;
  setShowModel: (show: boolean) => void;
  showDom: boolean;
  setShowDom: (show: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (show: boolean) => void;

  // Appearance controls (Point cloud & Camera settings)
  pointSize: number;
  onPointSizeChange: (size: number) => void;
  pointDensity?: 'max' | 'high' | 'standard';
  onPointDensityChange?: (density: 'max' | 'high' | 'standard') => void;
  fov: number;
  onFovChange: (fov: number) => void;
  edlEnabled: boolean;
  onEdlToggle: (enabled: boolean) => void;
  isOrthographic: boolean;
  onProjectionChange: (ortho: boolean) => void;
  onFocusProject: () => void;
  onFocusPointCloud?: () => void;
}

export function PotreeSidebar({
  currentMode,
  onModeChange,
  onClear,
  isOptimizerOpen,
  onToggleOptimizer,
  showModel,
  setShowModel,
  showDom,
  setShowDom,
  showPointCloud,
  setShowPointCloud,
  pointSize,
  onPointSizeChange,
  pointDensity = 'max',
  onPointDensityChange,
  fov,
  onFovChange,
  edlEnabled,
  onEdlToggle,
  isOrthographic,
  onProjectionChange,
  onFocusProject,
  onFocusPointCloud
}: PotreeSidebarProps) {
  // State quản lý việc thu gọn/mở rộng các nhóm accordion
  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    tools: true,
    scene: true,
    filters: false,
    about: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="absolute top-0 left-0 z-20 w-[320px] h-screen bg-slate-950/95 border-r border-slate-800 text-slate-300 flex flex-col font-sans select-none overflow-y-auto">
      {/* Header chính */}
      <div className="p-4 border-b border-slate-900 bg-slate-900/60 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sky-400 tracking-wider">POTREE WEB GIS</span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">CesiumJS Power Edition v1.8.0</span>
        </div>
        <button
          onClick={onToggleOptimizer}
          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
            isOptimizerOpen 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
              : 'border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
          title="Bật/Tắt Bộ tối ưu hóa dữ liệu 3D"
        >
          Tối ưu 3D
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* ─── ACCORDION: APPEARANCE (NGOẠI QUAN) ─── */}
        <div className="border-b border-slate-900">
          <button 
            onClick={() => toggleSection('appearance')}
            className="w-full px-4 py-3 bg-slate-900/30 flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders size={14} className="text-sky-400" />
              Appearance (Ngoại Quan)
            </span>
            {expandedSections.appearance ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {expandedSections.appearance && (
            <div className="p-4 space-y-4 bg-slate-950/40 text-xs">
              {/* Point Density (238M points maximum quality) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium text-slate-400">
                  <span>Mật Độ Point Cloud (238Tr điểm)</span>
                  <span className="text-emerald-400 font-bold uppercase">{pointDensity === 'max' ? '🔥 Cực Đại' : pointDensity === 'high' ? '⚡ Cao' : 'Tiêu Chuẩn'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <button
                    onClick={() => onPointDensityChange?.('max')}
                    className={`py-1 px-1 rounded border font-bold text-center transition-all ${
                      pointDensity === 'max'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                    title="Hiển thị 100% cực đại 238 triệu điểm với độ phân giải cao nhất"
                  >
                    🔥 Cực Đại
                  </button>
                  <button
                    onClick={() => onPointDensityChange?.('high')}
                    className={`py-1 px-1 rounded border font-bold text-center transition-all ${
                      pointDensity === 'high'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                    title="Mật độ cao (SSE = 4)"
                  >
                    ⚡ Cao
                  </button>
                  <button
                    onClick={() => onPointDensityChange?.('standard')}
                    className={`py-1 px-1 rounded border font-bold text-center transition-all ${
                      pointDensity === 'standard'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                    title="Mật độ tiêu chuẩn (SSE = 16)"
                  >
                    Tiêu Chuẩn
                  </button>
                </div>
              </div>

              {/* Point Size (Point Budget) */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-400">
                  <span>Kích thước Điểm (Point Size)</span>
                  <span className="text-sky-400 font-bold">{pointSize} px</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  step="1"
                  value={pointSize} 
                  onChange={(e) => onPointSizeChange(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer" 
                />
              </div>

              {/* Field of View */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-400">
                  <span>Góc nhìn Camera (Field of View)</span>
                  <span className="text-sky-400 font-bold">{fov}°</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="120" 
                  step="5"
                  value={fov} 
                  onChange={(e) => onFovChange(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer" 
                />
              </div>

              {/* Eye Dome Lighting (EDL Shading) */}
              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-900/60 pt-3">
                <span className="flex items-center gap-2 font-medium text-slate-400">
                  <Sun size={14} className="text-amber-400" />
                  Shading (Eye Dome Lighting)
                </span>
                <input 
                  type="checkbox" 
                  checked={edlEnabled}
                  onChange={(e) => onEdlToggle(e.target.checked)}
                  className="accent-sky-500 w-4 h-4 cursor-pointer" 
                />
              </label>
            </div>
          )}
        </div>

        {/* ─── ACCORDION: TOOLS (CÔNG CỤ ĐO ĐẠC & CẮT) ─── */}
        <div className="border-b border-slate-900">
          <button 
            onClick={() => toggleSection('tools')}
            className="w-full px-4 py-3 bg-slate-900/30 flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Ruler size={14} className="text-sky-400" />
              Tools (Bộ Đo Đạc & Cắt Lát)
            </span>
            {expandedSections.tools ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {expandedSections.tools && (
            <div className="p-4 space-y-4 bg-slate-950/40">
              {/* Sub-section: Measurement */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900/80 pb-1">
                  Đo Đạc (Measurement)
                </span>
                
                {/* Grid Icons Đo kiểu Potree */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => onModeChange('distance')}
                    className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all ${
                      currentMode === 'distance'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                    title="Đo khoảng cách liên tục (Thước dây)"
                  >
                    <Ruler size={18} />
                    <span className="text-[9px] font-medium">Khoảng cách</span>
                  </button>

                  <button
                    onClick={() => onModeChange('height')}
                    className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all ${
                      currentMode === 'height'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                    title="Đo chiều cao đứng (Potree Height)"
                  >
                    <ArrowUpDown size={18} />
                    <span className="text-[9px] font-medium">Chiều cao</span>
                  </button>

                  <button
                    onClick={() => onModeChange('area')}
                    className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all ${
                      currentMode === 'area'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                    title="Đo diện tích phẳng"
                  >
                    <Square size={18} />
                    <span className="text-[9px] font-medium">Diện tích</span>
                  </button>

                  {/* Clear button */}
                  <button
                    onClick={onClear}
                    className="p-2.5 rounded-lg flex flex-col items-center justify-center gap-1 border border-slate-800 bg-slate-900/40 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
                    title="Xóa tất cả các phép đo đạc"
                  >
                    <Trash2 size={18} />
                    <span className="text-[9px] font-medium">Xóa đo</span>
                  </button>
                </div>
              </div>

              {/* Sub-section: Clipping (Cắt lát địa hình) */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900/80 pb-1">
                  Cắt lát Bounding Box (Clipping)
                </span>
                
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 text-xs transition-colors"
                    title="Tính năng Clipping Box đang phát triển"
                  >
                    <Box size={14} />
                    <span>Clipping Box</span>
                  </button>
                </div>
              </div>

              {/* Sub-section: Navigation (Điều hướng Camera) */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900/80 pb-1">
                  Điều hướng (Navigation)
                </span>
                
                <div className="space-y-3">
                  {/* Projection selection */}
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
                    <button
                      onClick={() => onProjectionChange(false)}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        !isOrthographic 
                          ? 'bg-sky-500 text-white shadow-[0_2px_6px_rgba(14,165,233,0.3)]' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Perspective (Phối cảnh)
                    </button>
                    <button
                      onClick={() => onProjectionChange(true)}
                      className={`flex-1 py-1.5 rounded-md transition-all ${
                        isOrthographic 
                          ? 'bg-sky-500 text-white shadow-[0_2px_6px_rgba(14,165,233,0.3)]' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Orthographic (Hình chiếu)
                    </button>
                  </div>

                  {/* Focus buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={onFocusProject}
                      className="py-2 px-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900 hover:text-white flex items-center justify-center gap-1 text-[11px] transition-all font-semibold"
                      title="Bay camera quay lại vị trí dự án Vườn Ươm"
                    >
                      <Navigation size={13} className="text-sky-400 rotate-45" />
                      <span>Bay tới Dự án</span>
                    </button>
                    <button
                      onClick={onFocusPointCloud}
                      className="py-2 px-2 rounded-lg border border-sky-500/30 bg-sky-950/20 text-sky-300 hover:bg-sky-900/40 hover:text-white flex items-center justify-center gap-1 text-[11px] transition-all font-semibold shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                      title="Bay camera trực tiếp tới vị trí Đám mây điểm Point Cloud"
                    >
                      <MapPin size={13} className="text-sky-400" />
                      <span>Bay tới Point Cloud</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── ACCORDION: SCENE TREE (CẤU TRÚC LỚP BẢN ĐỒ) ─── */}
        <div className="border-b border-slate-900">
          <button 
            onClick={() => toggleSection('scene')}
            className="w-full px-4 py-3 bg-slate-900/30 flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers size={14} className="text-sky-400" />
              Scene Tree (Lớp Bản Đồ)
            </span>
            {expandedSections.scene ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {expandedSections.scene && (
            <div className="p-4 bg-slate-950/40 space-y-3 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900/80 pb-1 mb-1">
                Lớp Dữ Liệu Địa Lý
              </span>
              
              {/* Checkbox Layer: Point Cloud */}
              <label className="flex items-center justify-between cursor-pointer py-1.5 hover:bg-slate-900/40 rounded px-1 transition-colors">
                <span className="flex items-center gap-2 text-slate-300">
                  <MapPin size={13} className="text-sky-400" />
                  Đám mây điểm (Point Cloud)
                </span>
                <input 
                  type="checkbox" 
                  checked={showPointCloud}
                  onChange={(e) => setShowPointCloud(e.target.checked)}
                  className="accent-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Checkbox Layer: 3D Mesh Model */}
              <label className="flex items-center justify-between cursor-pointer py-1.5 hover:bg-slate-900/40 rounded px-1 transition-colors">
                <span className="flex items-center gap-2 text-slate-300">
                  <Box size={13} className="text-emerald-400" />
                  Mô hình 3D Mesh (GLB)
                </span>
                <input 
                  type="checkbox" 
                  checked={showModel}
                  onChange={(e) => setShowModel(e.target.checked)}
                  className="accent-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Checkbox Layer: DOM Orthophoto */}
              <label className="flex items-center justify-between cursor-pointer py-1.5 hover:bg-slate-900/40 rounded px-1 transition-colors">
                <span className="flex items-center gap-2 text-slate-300">
                  <Eye size={13} className="text-amber-400" />
                  Ảnh trực giao phẳng (DOM)
                </span>
                <input 
                  type="checkbox" 
                  checked={showDom}
                  onChange={(e) => setShowDom(e.target.checked)}
                  className="accent-sky-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* ─── ACCORDION: FILTERS (BỘ LỌC) ─── */}
        <div className="border-b border-slate-900">
          <button 
            onClick={() => toggleSection('filters')}
            className="w-full px-4 py-3 bg-slate-900/30 flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              Filters (Bộ Lọc Điểm)
            </span>
            {expandedSections.filters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {expandedSections.filters && (
            <div className="p-4 bg-slate-950/40 text-xs text-slate-500 italic">
              Lọc theo độ phân giải hoặc phổ màu chưa được tải.
            </div>
          )}
        </div>

        {/* ─── ACCORDION: ABOUT (THÔNG TIN) ─── */}
        <div className="border-b border-slate-900">
          <button 
            onClick={() => toggleSection('about')}
            className="w-full px-4 py-3 bg-slate-900/30 flex items-center justify-between text-xs font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Info size={14} className="text-slate-500" />
              About (Thông Tin)
            </span>
            {expandedSections.about ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {expandedSections.about && (
            <div className="p-4 bg-slate-950/40 text-xs text-slate-400 leading-relaxed space-y-2">
              <p>Hệ thống Web GIS 3D tối ưu hóa dựa trên đặc tả Potree Sidebar UI, hỗ trợ phân tích độ cao và đo vẽ trắc địa trực tiếp trên trình duyệt.</p>
              <p className="text-[10px] text-slate-500">Được phát triển độc quyền bằng CesiumJS và React.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
