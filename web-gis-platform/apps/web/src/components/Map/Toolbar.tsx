import { Ruler, Trash2, MousePointer2, Cpu, ArrowUpDown, Square } from 'lucide-react';

export type ToolMode = 'none' | 'distance' | 'height' | 'area';

interface ToolbarProps {
  currentMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onClear: () => void;
  isOptimizerOpen: boolean;
  onToggleOptimizer: () => void;
}

export function Toolbar({ currentMode, onModeChange, onClear, isOptimizerOpen, onToggleOptimizer }: ToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
      <button
        onClick={() => onModeChange('none')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          currentMode === 'none' 
            ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title="Chế độ Tự do (Kéo thả)"
      >
        <MousePointer2 size={18} />
        <span className="text-sm font-medium">Tự do</span>
      </button>

      <button
        onClick={() => onModeChange('distance')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          currentMode === 'distance' 
            ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title="Đo Khoảng Cách (Click các điểm và double click để kết thúc)"
      >
        <Ruler size={18} />
        <span className="text-sm font-medium">Khoảng cách</span>
      </button>

      <button
        onClick={() => onModeChange('height')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          currentMode === 'height' 
            ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title="Đo Chiều Cao đứng kiểu Potree (Gốc -> Đỉnh)"
      >
        <ArrowUpDown size={18} />
        <span className="text-sm font-medium">Chiều cao (Potree)</span>
      </button>

      <button
        onClick={() => onModeChange('area')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          currentMode === 'area' 
            ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title="Đo Diện Tích (Click nhiều điểm vẽ đa giác)"
      >
        <Square size={18} />
        <span className="text-sm font-medium">Diện tích</span>
      </button>

      <div className="w-[1px] bg-slate-700 my-1 mx-1"></div>

      <button
        onClick={onToggleOptimizer}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          isOptimizerOpen 
            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title="Bật/Tắt Bộ tối ưu hóa dữ liệu 3D"
      >
        <Cpu size={18} />
        <span className="text-sm font-medium">Tối ưu 3D</span>
      </button>

      <button
        onClick={onClear}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
        title="Xóa tất cả phép đo"
      >
        <Trash2 size={18} />
        <span className="text-sm font-medium">Xóa Data</span>
      </button>
    </div>
  );
}
