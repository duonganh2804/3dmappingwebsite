import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, HardDrive, ArrowRight, Trash2, Users, LogOut, LogIn } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchProjects, createProject, deleteProject } from '../services/api';
import { Button } from '../components/UI/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/UI/Card';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectMemberModal } from '../components/ProjectMemberModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberProject, setSelectedMemberProject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
      setLoading(false);
    };
    loadProjects();
  }, [setProjects, setLoading, isAuthenticated]);

  const handleCreateProject = async (data: any) => {
    await createProject(data);
    const updated = await fetchProjects();
    setProjects(updated);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      await deleteProject(id);
      const updated = await fetchProjects();
      setProjects(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Dự Án Của Bạn</h1>
            <p className="text-slate-400 text-sm">Quản lý và kết xuất dữ liệu bản đồ 3D chuẩn Enterprise</p>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-cyan-500/30 p-2 pr-4 font-mono text-xs">
                <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-400 flex items-center justify-center font-bold text-cyan-400">
                  {user.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    {user.fullName}
                    <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{user.email}</div>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-3 p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-1"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="secondary" className="gap-2 text-xs font-mono" onClick={() => navigate('/login')}>
                  <LogIn size={14} /> ĐĂNG NHẬP
                </Button>
                <Button className="gap-2 text-xs font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold" onClick={() => navigate('/register')}>
                  ĐĂNG KÝ
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <Button className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} /> DỰ ÁN MỚI
              </Button>
            )}
          </div>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="text-center py-20 font-mono text-xs text-slate-400">Đang tải danh sách dự án...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 p-8 font-mono text-sm text-slate-400">
            Chưa có dự án nào khả dụng. Hãy nhấn &quot;Dự án mới&quot; hoặc đăng nhập để tạo dự án đầu tiên của bạn.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:border-cyan-500/50 transition-all group relative bg-slate-900 border-slate-800">
                {/* Delete button */}
                <button 
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute top-3 left-3 z-10 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa dự án"
                >
                  <Trash2 size={16} />
                </button>

                {/* Member Manage Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMemberProject({ id: project.id, name: project.name });
                  }}
                  className="absolute top-3 left-12 z-10 bg-slate-900/90 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/40 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-mono"
                  title="Phân quyền thành viên"
                >
                  <Users size={14} /> Phân Quyền
                </button>

                <div className="h-40 bg-slate-950 rounded-t-xl overflow-hidden relative border-b border-slate-800">
                  {project.domUrl ? (
                    <img src={project.domUrl} alt={project.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <MapPin size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-950/80 border border-cyan-500/30 px-2 py-1 text-[10px] font-mono text-cyan-300">
                    EPSG: {project.epsg}
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white tracking-tight">{project.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">{project.description || 'Chưa có mô tả'}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                    <MapPin size={14} className="text-cyan-400" />
                    <span>Lon: {project.centerLon.toFixed(4)}, Lat: {project.centerLat.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <HardDrive size={14} className="text-emerald-400" />
                    <span>{project.pointCloudId ? 'Đã nạp Point Cloud COPC' : 'Chưa có dữ liệu mây điểm'}</span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    fullWidth 
                    variant="secondary" 
                    className="gap-2 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all font-mono text-xs font-bold"
                    onClick={() => navigate(`/viewer/${project.id}`)}
                  >
                    MỞ BẢN ĐỒ 3D <ArrowRight size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Modals */}
        <ProjectFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreateProject} 
        />

        {selectedMemberProject && (
          <ProjectMemberModal
            projectId={selectedMemberProject.id}
            projectName={selectedMemberProject.name}
            onClose={() => setSelectedMemberProject(null)}
          />
        )}
      </div>
    </div>
  );
};

