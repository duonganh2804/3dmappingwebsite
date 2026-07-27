import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './UI/Button';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    centerLon: '',
    centerLat: '',
    epsg: '32648',
    domUrl: '',
    modelUrl: '',
    pointCloudId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Parse số liệu
    const submitData = {
      ...formData,
      centerLon: parseFloat(formData.centerLon) || 0,
      centerLat: parseFloat(formData.centerLat) || 0,
      epsg: parseInt(formData.epsg, 10) || 32648
    };

    await onSubmit(submitData);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      name: '', description: '', centerLon: '', centerLat: '', epsg: '32648', domUrl: '', modelUrl: '', pointCloudId: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 transform transition-all">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Thêm Dự Án Mới</h2>
        <p className="text-slate-400 mb-6">Khởi tạo không gian bản đồ 3D của bạn</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Tên dự án <span className="text-red-400">*</span></label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="VD: Khu Công nghệ cao..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Mã EPSG</label>
              <input 
                name="epsg"
                value={formData.epsg}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="VD: 32648"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Mô tả</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Mô tả ngắn gọn về dự án..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Kinh độ tâm (Longitude - X) <span className="text-red-400">*</span></label>
              <input 
                required
                type="number"
                step="any"
                name="centerLon"
                value={formData.centerLon}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="VD: 106.8099 (Kinh độ HCM khoảng 106°)"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Vĩ độ tâm (Latitude - Y) <span className="text-red-400">*</span></label>
              <input 
                required
                type="number"
                step="any"
                name="centerLat"
                value={formData.centerLat}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="VD: 10.8404 (Vĩ độ HCM khoảng 10°)"
              />
            </div>
          </div>

          <div className="space-y-1 mt-4 pt-4 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300">Đường dẫn mây điểm (Point Cloud ID / URL)</label>
            <input 
              name="pointCloudId"
              value={formData.pointCloudId}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="VD: 5060969 hoặc url tới file tileset.json"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
              {isSubmitting ? "Đang xử lý..." : "Lưu Dự Án"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
