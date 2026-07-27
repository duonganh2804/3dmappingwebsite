import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CesiumViewer } from '../components/Map/CesiumViewer';
import { useProjectStore } from '../store/useProjectStore';
import type { Project } from '../store/useProjectStore';
import { fetchProjectById } from '../services/api';
import { Button } from '../components/UI/Button';

export const ViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setCurrentProject } = useProjectStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      setLoading(true);
      const data = await fetchProjectById(projectId);
      if (data) {
        setProject(data);
        setCurrentProject(data.id);
      }
      setLoading(false);
    };
    
    loadProject();
    
    return () => {
      setCurrentProject(null);
    };
  }, [projectId, setCurrentProject]);

  if (loading) {
    return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">Đang tải bản đồ...</div>;
  }

  if (!project) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <h2 className="text-xl mb-4">Không tìm thấy dự án</h2>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">Quay lại Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Nút quay lại Dashboard đặt trên bản đồ */}
      <div className="absolute top-4 left-4 z-50">
        <Button 
          variant="secondary" 
          size="sm" 
          className="glass-button gap-2 bg-slate-900/80 backdrop-blur-md"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Trở về
        </Button>
      </div>
      
      {/* Component chứa Cesium Map Core */}
      <CesiumViewer projectId={project.id} />
    </div>
  );
};
