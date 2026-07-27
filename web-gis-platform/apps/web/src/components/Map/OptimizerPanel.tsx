import { useState, useEffect, useRef } from 'react';
import { X, Cpu, Move, Terminal, Play, RotateCcw, AlertTriangle } from 'lucide-react';

interface OptimizerPanelProps {
  onClose: () => void;
  projectId?: string;
}

export function OptimizerPanel({ onClose, projectId }: OptimizerPanelProps) {
  const [activeTab, setActiveTab] = useState<'compress' | 'translate'>('compress');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Form states - Paths
  const [inputDir, setInputDir] = useState('c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026');
  const [outputDir, setOutputDir] = useState('c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026_Processed');

  // Form states - Options (Map to build.py flags)
  const [skipPointCloud, setSkipPointCloud] = useState(false);
  const [skipModel, setSkipModel] = useState(false);
  const [skipDom, setSkipDom] = useState(false);
  const [clipToModel, setClipToModel] = useState(false);
  const [compressModel, setCompressModel] = useState(true);
  const [simplifyRatio, setSimplifyRatio] = useState('0.5');
  const [epsg, setEpsg] = useState('9214');

  // Form states - Translate
  const [tilesetPath, setTilesetPath] = useState('c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026_Processed\\glb\\model.glb');
  const [offsetX, setOffsetX] = useState('0');
  const [offsetY, setOffsetY] = useState('0');
  const [offsetZ, setOffsetZ] = useState('0');

  // Poll logs when optimization task is running
  useEffect(() => {
    let intervalId: any;
    if (isLoading) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:3000/api/logs');
          const data = await res.json();
          setLogs(data.logs);
          
          // Kiểm tra xem đã kết thúc chưa
          if (data.logs.some((log: string) => log.includes('Hoàn tất toàn bộ tiến trình') || log.includes('gặp lỗi nghiêm trọng'))) {
            setIsLoading(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Cuộn log xuống đáy
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartBatch = async () => {
    setIsLoading(true);
    setLogs([]);
    try {
      // Clear logs cũ
      await fetch('http://localhost:3000/api/logs/clear', { method: 'POST' });
      
      const res = await fetch('http://localhost:3000/api/optimize/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputDir, 
          outputDir,
          skipPointCloud,
          skipModel,
          skipDom,
          clipToModel,
          compressModel,
          simplifyRatio: simplifyRatio ? parseFloat(simplifyRatio) : undefined,
          epsg: parseInt(epsg),
          projectId
        })
      });
      const data = await res.json();
      if (!data.success) {
        setIsLoading(false);
        setLogs([`[ERROR] ${data.error}`]);
      }
    } catch (e: any) {
      setIsLoading(false);
      setLogs([`[ERROR] Không thể kết nối tới local server (Cổng 3000): ${e.message}`]);
    }
  };

  const handleTranslate = async () => {
    setIsLoading(true);
    setLogs([]);
    try {
      const res = await fetch('http://localhost:3000/api/optimize/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tilesetPath,
          x: offsetX,
          y: offsetY,
          z: offsetZ
        })
      });
      const data = await res.json();
      setIsLoading(false);
      if (data.success) {
        setLogs([`[INFO] ${data.message}`]);
      } else {
        setLogs([`[ERROR] ${data.error}`]);
      }
    } catch (e: any) {
      setIsLoading(false);
      setLogs([`[ERROR] Không thể kết nối tới local server (Cổng 3000): ${e.message}`]);
    }
  };

  return (
    <div className="absolute top-20 left-4 z-30 w-[500px] bg-slate-950/95 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 flex flex-col max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-900 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Cpu className="text-sky-400" size={20} />
          <h2 className="text-md font-bold tracking-wide">3D DATA OPTIMIZER (python build.py)</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900">
        <button 
          onClick={() => setActiveTab('compress')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'compress' ? 'border-sky-500 text-sky-400 bg-sky-950/10' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={16} />
          Pipeline build.py
        </button>
        <button 
          onClick={() => setActiveTab('translate')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'translate' ? 'border-sky-500 text-sky-400 bg-sky-950/10' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Move size={16} />
          Cân chỉnh Tọa độ
        </button>
      </div>

      {/* Form Area */}
      <div className="p-4 space-y-4 flex-grow overflow-y-auto">
        {activeTab === 'compress' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">THƯ MỤC DỰ ÁN GỐC (CHỨA MÔ HÌNH .CPR)</label>
              <input 
                type="text" 
                value={inputDir}
                onChange={(e) => setInputDir(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">THƯ MỤC XUẤT WEB (OUTPUT DIR)</label>
              <input 
                type="text" 
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
              />
            </div>

            {/* Checkbox Options Grid */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900/80 space-y-2.5">
              <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">Cấu hình tham số build.py</label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={!skipPointCloud} onChange={(e) => setSkipPointCloud(!e.target.checked)} className="accent-sky-500" />
                  <span>Xử lý Point Cloud</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={!skipModel} onChange={(e) => setSkipModel(!e.target.checked)} className="accent-sky-500" />
                  <span>Gộp OBJ → GLB</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={!skipDom} onChange={(e) => setSkipDom(!e.target.checked)} className="accent-sky-500" />
                  <span>Xử lý Ảnh DOM</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={clipToModel} onChange={(e) => setClipToModel(e.target.checked)} className="accent-sky-500" />
                  <span>Cắt rìa thừa (Clip)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer col-span-2">
                  <input type="checkbox" checked={compressModel} onChange={(e) => setCompressModel(e.target.checked)} className="accent-sky-500" />
                  <span>Nén mô hình (Draco/gltfpack)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">HỆ TỌA ĐỘ POINT CLOUD (EPSG)</label>
                  <input 
                    type="number" 
                    value={epsg}
                    onChange={(e) => setEpsg(e.target.value)}
                    min="1"
                    className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-1.5 outline-none text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">TỶ LỆ ĐƠN GIẢN MESH (SIMPLIFY)</label>
                  <input 
                    type="number" 
                    placeholder="0.0 - 1.0 (ví dụ: 0.5)"
                    value={simplifyRatio}
                    onChange={(e) => setSimplifyRatio(e.target.value)}
                    step="0.1"
                    min="0.1"
                    max="1"
                    className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-1.5 outline-none text-slate-300"
                  />
                </div>
              </div>
            </div>
            
            <button 
              disabled={isLoading}
              onClick={handleStartBatch}
              className={`w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all ${isLoading ? 'animate-pulse' : ''}`}
            >
              <Play size={16} />
              {isLoading ? 'Đang chạy script build.py...' : 'Bắt đầu Xử lý & Tối ưu'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">ĐƯỜNG DẪN TỚI FILE TILESET.JSON / MODEL.GLB</label>
              <input 
                type="text" 
                value={tilesetPath}
                onChange={(e) => setTilesetPath(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">TRỤC X (MÉT)</label>
                <input 
                  type="number" 
                  value={offsetX}
                  onChange={(e) => setOffsetX(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">TRỤC Y (MÉT)</label>
                <input 
                  type="number" 
                  value={offsetY}
                  onChange={(e) => setOffsetY(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">TRỤC Z (CAO ĐỘ)</label>
                <input 
                  type="number" 
                  value={offsetZ}
                  onChange={(e) => setOffsetZ(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 outline-none text-slate-200" 
                />
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2 items-start text-xs text-amber-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Chỉ áp dụng với mô hình 3D chuẩn 3D Tiles. File gốc sẽ tự động được backup sang `.backup` trước khi dịch chuyển.</span>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleTranslate}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={16} />
              Áp dụng Dịch chuyển
            </button>
          </div>
        )}

        {/* Live Terminal Log */}
        <div className="flex flex-col flex-grow min-h-[160px] max-h-[220px] bg-black/80 rounded-xl border border-slate-900 overflow-hidden font-mono text-[10px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-900 bg-slate-900/20 text-slate-400">
            <Terminal size={12} />
            <span>Tiến trình xử lý thời gian thực</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-1 select-text flex-grow">
            {logs.length === 0 ? (
              <span className="text-slate-500">Chưa có tiến trình nào được kích hoạt. Nhấn "Bắt đầu Xử lý" để chạy...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'}>
                  {log}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
