import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPinned } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    return (
      <div className="h-dvh w-full bg-[#05080f] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-14 h-14 rounded-2xl border border-sky-500/20 bg-sky-500/10 flex items-center justify-center">
          <Loader2
            size={26}
            className="text-sky-400 animate-spin"
          />
        </div>

        <div className="text-center">
          <div className="text-base font-semibold">
            Đang mở không gian 3D
          </div>

          <div className="text-xs text-slate-500 mt-1">
            Đang tải thông tin dự án và lớp dữ liệu...
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-dvh w-full bg-[#05080f] flex flex-col items-center justify-center text-white px-6">
        <div className="w-14 h-14 rounded-2xl border border-slate-800 bg-slate-900/70 flex items-center justify-center mb-4">
          <MapPinned
            size={24}
            className="text-slate-400"
          />
        </div>

        <h2 className="text-xl font-semibold mb-2">
          Không tìm thấy dự án
        </h2>

        <p className="text-sm text-slate-500 mb-5 text-center max-w-md">
          Dự án có thể đã bị xóa hoặc tài khoản hiện tại không còn quyền truy cập.
        </p>

        <Button
          onClick={() => navigate('/dashboard')}
          variant="secondary"
        >
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">

      <div
        className={`absolute top-4 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'right-4 sm:right-auto sm:left-[340px]'
            : 'left-4'
        }`}
      >
        <Button
          variant="secondary"
          size="sm"
          className="glass-button gap-2 bg-slate-900/80 backdrop-blur-md"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Dashboard
        </Button>
      </div>

      <CesiumViewer
        projectId={project.id}
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={setIsSidebarOpen}
      />
    </div>
  );
};
