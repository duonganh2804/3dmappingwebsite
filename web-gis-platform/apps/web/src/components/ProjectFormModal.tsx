import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Layers, Info } from 'lucide-react';
import { Button } from './UI/Button';
import { type Project } from '../store/useProjectStore';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  project?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSubmit, project = null }) => {
  const [isAutoProcess, setIsAutoProcess] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    centerLon: '',
    centerLat: '',
    epsg: '32648',
    domUrl: '',
    modelUrl: '',
    pointCloudId: '',
    inputDir: '',
    outputDir: ''
  });

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        centerLon: project.centerLon !== undefined ? project.centerLon.toString() : '',
        centerLat: project.centerLat !== undefined ? project.centerLat.toString() : '',
        epsg: project.epsg !== undefined ? project.epsg.toString() : '32648',
        domUrl: project.domUrl || '',
        modelUrl: project.modelUrl || '',
        pointCloudId: project.pointCloudId || '',
        inputDir: '',
        outputDir: ''
      });
      setIsAutoProcess(false);
    } else if (isOpen) {
      setFormData({
        name: '',
        description: '',
        centerLon: '',
        centerLat: '',
        epsg: '32648',
        domUrl: '',
        modelUrl: '',
        pointCloudId: '',
        inputDir: '',
        outputDir: ''
      });
      setIsAutoProcess(true);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData: any = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      epsg: parseInt(formData.epsg, 10) || 32648,
    };

    if (!project) {
      submitData.isAutoProcess = isAutoProcess;
      if (isAutoProcess) {
        submitData.inputDir = formData.inputDir.trim();
        submitData.outputDir = formData.outputDir.trim() || undefined;
        submitData.centerLon = 0;
        submitData.centerLat = 0;
      } else {
        submitData.centerLon = parseFloat(formData.centerLon) || 0;
        submitData.centerLat = parseFloat(formData.centerLat) || 0;
        submitData.domUrl = formData.domUrl.trim();
        submitData.modelUrl = formData.modelUrl.trim();
        submitData.pointCloudId = formData.pointCloudId.trim();
      }
    } else {
      submitData.centerLon = parseFloat(formData.centerLon) || 0;
      submitData.centerLat = parseFloat(formData.centerLat) || 0;
      submitData.domUrl = formData.domUrl.trim();
      submitData.modelUrl = formData.modelUrl.trim();
      submitData.pointCloudId = formData.pointCloudId.trim();
    }

    try {
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 transform transition-all max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">
          {project ? 'Chỉnh Sửa Dự Án' : 'Thêm Dự Án Mới'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {project ? 'Cập nhật thông tin mô tả, tọa độ và liên kết dữ liệu' : 'Khởi tạo không gian bản đồ 3D của bạn'}
        </p>

        {/* Mode Tabs - Only visible when creating */}
        {!project && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setIsAutoProcess(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isAutoProcess
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen size={16} />
              Xử lý thư mục gốc
            </button>
            <button
              type="button"
              onClick={() => setIsAutoProcess(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                !isAutoProcess
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={16} />
              Nhập URL thủ công
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Tên & EPSG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">
                Tên dự án <span className="text-red-400">*</span>
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="VD: Khu vực Quy Nhơn 2026..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">
                Mã EPSG (Hệ tọa độ)
              </label>
              <input
                name="epsg"
                value={formData.epsg}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="32648 = UTM Zone 48N"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              placeholder="Mô tả ngắn gọn về dự án..."
            />
          </div>

          {/* AUTO PROCESS MODE */}
          {isAutoProcess && !project ? (
            <div className="space-y-4 border-t border-slate-800 pt-4">
              {/* Info banner */}
              <div className="flex gap-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-3">
                <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-cyan-300">Chế độ xử lý tự động hoàn toàn:</p>
                  <p>1. Chọn thư mục xuất từ DJI Terra / phần mềm bay chụp</p>
                  <p>2. Hệ thống tự nhận diện DOM (.tif), Model 3D (.obj), Point Cloud (.las)</p>
                  <p>3. Tối ưu hóa và upload lên Cloudflare R2</p>
                  <p>4. Cập nhật database và hiển thị trên bản đồ</p>
                  <p className="text-cyan-400/70 font-mono">⚡ Bạn có thể tiếp tục làm việc trong khi hệ thống xử lý</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                  Đường dẫn thư mục dữ liệu gốc <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  name="inputDir"
                  value={formData.inputDir}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="VD: C:\\Users\\duong\\3dmaping\\TenDuAn_process"
                />
                <p className="text-[10px] text-slate-500">
                  Thư mục chứa kết quả xuất từ DJI Terra (có thư mục Results/, Reconstruction/)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">
                  Thư mục đầu ra <span className="text-slate-600 text-xs">(Tùy chọn)</span>
                </label>
                <input
                  name="outputDir"
                  value={formData.outputDir}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Bỏ trống → tự tạo thư mục '_Processed' bên cạnh thư mục gốc"
                />
              </div>
            </div>
          ) : (
            /* MANUAL MODE & EDIT MODE */
            <div className="space-y-4 border-t border-slate-800 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">
                    Kinh độ (Longitude) <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="centerLon"
                    value={formData.centerLon}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="VD: 109.1940"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">
                    Vĩ độ (Latitude) <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="centerLat"
                    value={formData.centerLat}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="VD: 13.7758"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-800/60 pt-4">
                <p className="text-xs text-slate-500 font-mono">URLs dữ liệu đã upload (để trống nếu chưa có)</p>
                {[
                  { name: 'domUrl', label: 'DOM URL (ảnh orthophoto)', placeholder: 'https://r2.example.com/dom.png' },
                  { name: 'modelUrl', label: '3D Model URL (tileset.json)', placeholder: 'https://r2.example.com/model/tileset.json' },
                  { name: 'pointCloudId', label: 'Point Cloud URL (tileset.json)', placeholder: 'https://r2.example.com/pointcloud/tileset.json' },
                ].map(field => (
                  <div key={field.name} className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">{field.label}</label>
                    <input
                      name={field.name}
                      value={(formData as any)[field.name]}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`min-w-32 ${isSubmitting ? 'opacity-70' : ''}`}
            >
              {isSubmitting
                ? (project ? 'Đang cập nhật...' : 'Đang khởi tạo...')
                : (project ? 'Cập nhật' : (isAutoProcess ? '🚀 Bắt đầu xử lý' : '💾 Lưu dự án'))}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
