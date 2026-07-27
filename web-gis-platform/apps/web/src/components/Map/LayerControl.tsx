import { Layers, Eye, EyeOff } from 'lucide-react';

interface LayerControlProps {
  showModel: boolean;
  setShowModel: (show: boolean) => void;
  showDom: boolean;
  setShowDom: (show: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (show: boolean) => void;
}

export function LayerControl({
  showModel,
  setShowModel,
  showDom,
  setShowDom,
  showPointCloud,
  setShowPointCloud,
}: LayerControlProps) {
  return (
    <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl w-60">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
        <Layers className="text-sky-400" size={16} />
        <h3 className="text-sm font-semibold text-slate-200">Quản lý Lớp Bản Đồ</h3>
      </div>

      <div className="space-y-3">
        {/* Lớp mô hình 3D */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">Mô hình 3D (Vườn Ươm)</span>
          <button
            onClick={() => setShowModel(!showModel)}
            className={`p-1.5 rounded-lg transition-all ${
              showModel 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {showModel ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>

        {/* Lớp ảnh phẳng hàng không DOM */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">Ảnh phẳng hàng không (DOM)</span>
          <button
            onClick={() => setShowDom(!showDom)}
            className={`p-1.5 rounded-lg transition-all ${
              showDom 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {showDom ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>

        {/* Lớp Đám mây điểm */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">Đám mây điểm (Point Cloud)</span>
          <button
            onClick={() => setShowPointCloud(!showPointCloud)}
            className={`p-1.5 rounded-lg transition-all ${
              showPointCloud 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {showPointCloud ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
