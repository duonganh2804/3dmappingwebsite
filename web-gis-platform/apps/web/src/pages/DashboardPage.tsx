import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, MapPin, HardDrive, ArrowRight, Trash2, Users, LogOut, LogIn,
  Image, Box, Cloud, Loader2, CheckCircle2, XCircle, Terminal, ChevronDown, ChevronUp, RefreshCw,
  Globe, Shield, Search, Lock, Unlock, Sparkles, Eye, Layers, Building2
} from 'lucide-react';
import { useProjectStore, type Project } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchProjects, createProject, deleteProject, updateProject } from '../services/api';
import { Button } from '../components/UI/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/UI/Card';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectMemberModal } from '../components/ProjectMemberModal';
import { AdminLeadsModal } from '../components/AdminLeadsModal';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PipelineState {
  isProcessing: boolean;
  projectId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  success: boolean | null;
}

// ─── Pipeline Status Panel ────────────────────────────────────────────────────
const PipelinePanel: React.FC<{
  logs: string[];
  pipeline: PipelineState;
  onClose: () => void;
}> = ({ logs, pipeline, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, collapsed]);

  const statusColor = pipeline.isProcessing
    ? 'border-cyan-500/60 shadow-cyan-500/10'
    : pipeline.success
      ? 'border-emerald-500/60 shadow-emerald-500/10'
      : 'border-red-500/60 shadow-red-500/10';

  const elapsed = pipeline.startedAt
    ? Math.round(((pipeline.finishedAt || Date.now()) - pipeline.startedAt) / 1000)
    : 0;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[420px] bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden transition-all ${statusColor}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-slate-800"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          {pipeline.isProcessing ? (
            <Loader2 size={16} className="text-cyan-400 animate-spin" />
          ) : pipeline.success ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
          <span className="text-sm font-bold text-white font-mono">
            {pipeline.isProcessing ? 'Đang xử lý dữ liệu...' : pipeline.success ? 'Hoàn tất!' : 'Có lỗi xảy ra'}
          </span>
          <span className="text-[10px] font-mono text-slate-500">{elapsed}s</span>
        </div>
        <div className="flex items-center gap-2">
          {!pipeline.isProcessing && (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700">
              ✕
            </button>
          )}
          {collapsed ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex gap-0 border-b border-slate-800">
            {[
              { icon: Image, label: 'DOM', key: 'dom' },
              { icon: Box, label: '3D Model', key: 'model' },
              { icon: HardDrive, label: 'Point Cloud', key: 'pc' },
              { icon: Cloud, label: 'R2 Upload', key: 'r2' },
            ].map(({ icon: Icon, label, key }) => {
              const done = logs.some(l =>
                (key === 'dom' && (l.includes('dom.png') || l.includes('dom.jpg') || l.includes('metadata.json'))) ||
                (key === 'model' && (l.includes('model.glb') || l.includes('GLB'))) ||
                (key === 'pc' && (l.includes('tileset.json') || l.includes('3D Tiles OK'))) ||
                (key === 'r2' && (l.includes('Upload R2') && l.includes('✅')))
              );
              const active = pipeline.isProcessing && logs.some(l =>
                (key === 'dom' && l.includes('DOM')) ||
                (key === 'model' && l.includes('Model')) ||
                (key === 'pc' && l.includes('Point Cloud')) ||
                (key === 'r2' && l.includes('upload'))
              );
              return (
                <div key={key} className="flex-1 flex flex-col items-center py-2 gap-0.5 border-r border-slate-800 last:border-0">
                  <Icon size={14} className={done ? 'text-emerald-400' : active && pipeline.isProcessing ? 'text-cyan-400' : 'text-slate-600'} />
                  <span className="text-[9px] font-mono text-slate-400">{label}</span>
                  {done ? <div className="w-1 h-1 rounded-full bg-emerald-400" /> : active && pipeline.isProcessing ? <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" /> : <div className="w-1 h-1 rounded-full bg-slate-700" />}
                </div>
              );
            })}
          </div>

          <div className="h-48 overflow-y-auto p-3 font-mono text-[10px] space-y-0.5 bg-slate-950/50">
            {logs.filter(l => l !== '__PIPELINE_DONE__').map((log, i) => {
              let cls = 'text-slate-400';
              if (log.includes('[ERROR]') || log.includes('❌')) cls = 'text-red-400';
              else if (log.includes('✅') || log.includes('OK') || log.includes('Hoàn tất')) cls = 'text-emerald-400';
              else if (log.includes('🚀') || log.includes('☁️') || log.includes('📌') || log.includes('🐍')) cls = 'text-cyan-300';
              else if (log.includes('⚠️')) cls = 'text-amber-400';
              return <div key={i} className={cls}>{log}</div>;
            })}
            <div ref={logEndRef} />
          </div>
        </>
      )}
    </div>
  );
};

// ─── Data Badge Component ─────────────────────────────────────────────────────
const DataBadge: React.FC<{ icon: React.ReactNode; label: string; active: boolean }> = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
    active
      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
      : 'bg-slate-800/60 border-slate-700/40 text-slate-600'
  }`}>
    {icon}
    <span>{label}</span>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const isAdmin = user?.role === 'SUPERADMIN';

  // Tabs: 'all' | 'assigned' | 'public'
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
  const [selectedMemberProject, setSelectedMemberProject] = useState<{ id: string; name: string } | null>(null);

  // Pipeline panel state
  const [showPanel, setShowPanel] = useState(false);
  const [panelLogs, setPanelLogs] = useState<string[]>([]);
  const [pipeline, setPipeline] = useState<PipelineState>({
    isProcessing: false, projectId: null, startedAt: null, finishedAt: null, success: null
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  }, [setProjects, setLoading]);

  useEffect(() => { loadProjects(); }, [loadProjects, isAuthenticated]);

  // Set mặc định tab khi có thông tin người dùng
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setActiveTab('all');
      } else {
        // Kiểm tra xem user có dự án assigned nào không
        const assignedCount = projects.filter(p =>
          p.createdById === user.id || p.members?.some(m => m.userId === user.id)
        ).length;
        if (assignedCount > 0) {
          setActiveTab('assigned');
        } else {
          setActiveTab('public');
        }
      }
    }
  }, [user, isAdmin, projects.length]);

  // ── Polling logs khi pipeline đang chạy ──────────────────────────────────
  useEffect(() => {
    if (!showPanel) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/logs`);
        const data = await res.json();
        setPanelLogs(data.logs || []);
        const newPipeline: PipelineState = data.pipeline;
        setPipeline(newPipeline);

        if (!newPipeline.isProcessing && newPipeline.finishedAt) {
          clearInterval(id);
          await loadProjects();
        }
      } catch (_) {}
    }, 1500);
    return () => clearInterval(id);
  }, [showPanel, loadProjects]);

  // ── Thao tác Admin: Đổi trạng thái Public Demo (1-click) ────────────────
  const handleTogglePublic = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const newIsPublic = !project.isPublic;
    const actionLabel = newIsPublic ? 'Công khai cho người dùng xem Demo' : 'Đặt làm Riêng tư (Chỉ thành viên xem)';
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionLabel} dự án "${project.name}"?`)) {
      const updated = await updateProject(project.id, { isPublic: newIsPublic });
      if (updated) {
        loadProjects();
      } else {
        alert("Lỗi khi cập nhật trạng thái công khai của dự án.");
      }
    }
  };

  // ── Tạo dự án mới ──────────────────────────────────────────────────────────
  const handleCreateProject = async (data: any) => {
    if (data.isAutoProcess) {
      const project = await createProject({
        name: data.name,
        description: data.description,
        epsg: data.epsg,
        centerLon: 0,
        centerLat: 0,
      });

      if (!project?.id) {
        alert('Không thể tạo dự án. Vui lòng thử lại.');
        return;
      }

      setPanelLogs([`[INFO] Dự án "${data.name}" được tạo thành công (ID: ${project.id})`]);
      setPipeline({ isProcessing: true, projectId: project.id, startedAt: Date.now(), finishedAt: null, success: null });
      setShowPanel(true);

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/logs/clear`, { method: 'POST' });

      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/optimize/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          inputDir: data.inputDir,
          outputDir: data.outputDir || undefined,
          projectId: project.id,
          epsg: data.epsg,
        })
      });

      if (!res.ok) {
        setPanelLogs(prev => [...prev, `[ERROR] Không thể kích hoạt pipeline xử lý.`]);
      }

      await loadProjects();
    } else {
      await createProject(data);
      await loadProjects();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      await deleteProject(id);
      loadProjects();
    }
  };

  // ── Lọc danh sách dự án theo Role & Search ──────────────────────────────
  const assignedProjects = projects.filter(p =>
    p.createdById === user?.id || p.members?.some(m => m.userId === user?.id)
  );
  const publicProjects = projects.filter(p => p.isPublic);

  const getFilteredProjects = () => {
    let list: Project[] = [];
    if (activeTab === 'all') {
      list = projects;
    } else if (activeTab === 'assigned') {
      list = assignedProjects;
    } else if (activeTab === 'public') {
      list = publicProjects;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const displayedProjects = getFilteredProjects();

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Enterprise Header & Role Badge ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Dự Án 3D GIS Platform</span>
              </h1>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                  <Shield size={11} /> ADMIN CONTROL
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <Building2 size={11} /> ENTERPRISE VIEWER
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">
              Hệ thống kết xuất và lưu trữ dữ liệu không gian 3D chất lượng cao (DOM, 3D Mesh, Point Cloud)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 pr-4 rounded-xl font-mono text-xs backdrop-blur-md shadow-lg">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
                  {user.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    {user.fullName}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      isAdmin ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-indigo-950 text-indigo-400 border border-indigo-500/40'
                    }`}>
                      {isAdmin ? 'SuperAdmin' : 'Member'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">{user.email}</div>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-2 p-1.5 bg-red-950/40 hover:bg-red-900/80 border border-red-500/30 text-red-400 rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="gap-2 text-xs font-mono" onClick={() => navigate('/login')}>
                  <LogIn size={14} /> ĐĂNG NHẬP
                </Button>
                <Button className="gap-2 text-xs font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold" onClick={() => navigate('/register')}>
                  ĐĂNG KÝ
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <button
                  onClick={loadProjects}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
                  title="Làm mới danh sách"
                >
                  <RefreshCw size={16} />
                </button>

                <Button
                  variant="secondary"
                  className="gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-950 font-mono text-xs"
                  onClick={() => navigate('/book-demo')}
                >
                  <Sparkles size={14} /> BOOK DEMO
                </Button>

                {isAdmin && (
                  <>
                    <Button
                      variant="secondary"
                      className="gap-1.5 border-purple-500/40 text-purple-300 hover:bg-purple-950 font-mono text-xs"
                      onClick={() => setIsLeadsModalOpen(true)}
                    >
                      <Globe size={14} /> YÊU CẦU DEMO
                    </Button>

                    <Button
                      className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl shadow-lg shadow-cyan-500/10"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus size={16} /> DỰ ÁN MỚI
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Role-Based Navigation Tabs & Search Bar ────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers size={14} /> Tất cả dự án <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-950/40">{projects.length}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'assigned'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 size={14} /> Được cấp quyền <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-950/40">{assignedProjects.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'public'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={14} /> Demo Showcase <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-950/40">{publicProjects.length}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
            />
          </div>
        </div>

        {/* ── Project Grid ──────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="text-center py-24 font-mono text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-cyan-400" /> Đang tải danh sách dự án...
          </div>
        ) : displayedProjects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 font-mono text-sm text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <Layers size={24} />
            </div>
            {activeTab === 'assigned' ? (
              <p>Bạn chưa có dự án nào được phân quyền. Vui lòng liên hệ <strong className="text-cyan-400">Admin</strong> để được cấp quyền truy cập.</p>
            ) : activeTab === 'public' ? (
              <p>Hiện chưa có dự án Demo công khai nào.</p>
            ) : (
              <p>Chưa có dự án nào trong hệ thống. Nhấn <strong className="text-cyan-400">"DỰ ÁN MỚI"</strong> để tạo dự án đầu tiên.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project) => {
              const isThisProcessing = pipeline.isProcessing && pipeline.projectId === project.id;
              const hasDOM = !!project.domUrl;
              const hasModel = !!project.modelUrl;
              const hasPC = !!project.pointCloudId;

              // Tìm role của user đối với project này
              const isOwner = project.createdById === user?.id || project.members?.some(m => m.userId === user?.id && m.role === 'OWNER');
              const memberRole = project.members?.find(m => m.userId === user?.id)?.role;

              return (
                <Card
                  key={project.id}
                  className={`transition-all group relative bg-slate-900/90 border-slate-800/90 flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-slate-700
                    ${isThisProcessing ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : ''}`}
                >
                  {/* Processing indicator */}
                  {isThisProcessing && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 animate-pulse z-20" />
                  )}

                  {/* Top Bar Badges & Admin Actions */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                    {/* Role / Type Badge */}
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {project.isPublic ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                          <Sparkles size={10} /> DEMO SHOWCASE
                        </span>
                      ) : isOwner ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                          <CrownIcon size={10} /> CHỦ SỞ HỮU
                        </span>
                      ) : memberRole ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                          <Eye size={10} /> {memberRole}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-950/90 text-slate-400 border border-slate-800 backdrop-blur-md flex items-center gap-1">
                          <Lock size={10} /> PRIVATE
                        </span>
                      )}
                    </div>

                    {/* Admin Actions Dropdown / Buttons */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Toggle Public Demo Switch */}
                        <button
                          onClick={(e) => handleTogglePublic(e, project)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                            project.isPublic
                              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-slate-950/90 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                          }`}
                          title={project.isPublic ? 'Click để tắt công khai Demo' : 'Click để bật công khai Demo cho mọi người dùng'}
                        >
                          {project.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                          <span>{project.isPublic ? 'Công khai' : 'Riêng tư'}</span>
                        </button>

                        {/* Phân quyền */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedMemberProject({ id: project.id, name: project.name }); }}
                          className="bg-slate-950/90 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/40 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          title="Phân quyền thành viên"
                        >
                          <Users size={13} />
                        </button>

                        {/* Xóa */}
                        <button
                          onClick={(e) => handleDelete(e, project.id)}
                          className="bg-red-950/90 hover:bg-red-900 text-red-400 border border-red-500/40 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          title="Xóa dự án"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DOM Thumbnail */}
                  <div className="h-44 bg-slate-950 overflow-hidden relative border-b border-slate-800/80">
                    {isThisProcessing ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
                        <Loader2 size={32} className="text-cyan-400 animate-spin" />
                        <span className="text-xs font-mono text-cyan-400 animate-pulse">Đang xử lý dữ liệu 3D...</span>
                      </div>
                    ) : hasDOM ? (
                      <img src={project.domUrl!} crossOrigin="anonymous" alt={project.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950/50">
                        <MapPin size={40} className="text-slate-800" />
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 backdrop-blur-md">
                      EPSG: {project.epsg}
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">{project.name}</CardTitle>
                    <CardDescription className="text-slate-400 text-xs line-clamp-2">{project.description || 'Chưa có mô tả chi tiết'}</CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3 flex-grow space-y-3">
                    {/* Tọa độ */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <MapPin size={12} className="text-cyan-400 flex-shrink-0" />
                      <span>
                        {project.centerLon !== 0 || project.centerLat !== 0
                          ? `Lon: ${project.centerLon.toFixed(4)}, Lat: ${project.centerLat.toFixed(4)}`
                          : 'Tọa độ chưa xác định'}
                      </span>
                    </div>

                    {/* Data Layer Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/60">
                      <DataBadge icon={<Image size={10} />} label="DOM" active={hasDOM} />
                      <DataBadge icon={<Box size={10} />} label="3D Mesh" active={hasModel} />
                      <DataBadge icon={<HardDrive size={10} />} label="Point Cloud" active={hasPC} />
                    </div>

                    {/* Process progress button if running */}
                    {isThisProcessing && (
                      <button
                        onClick={() => setShowPanel(true)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/20 rounded-xl py-1.5 transition-colors"
                      >
                        <Terminal size={10} /> Xem tiến trình xử lý
                      </button>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button
                      fullWidth
                      variant="secondary"
                      className={`gap-2 font-mono text-xs font-bold transition-all rounded-xl cursor-pointer
                        ${isThisProcessing
                          ? 'opacity-50 cursor-not-allowed'
                          : 'group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400'}`}
                      onClick={() => !isThisProcessing && navigate(`/viewer/${project.id}`)}
                      disabled={isThisProcessing}
                    >
                      {isThisProcessing ? (
                        <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
                      ) : (
                        <>MỞ BẢN ĐỒ 3D <ArrowRight size={14} /></>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Modals & Panels ────────────────────────────────────────────── */}
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

        <AdminLeadsModal
          isOpen={isLeadsModalOpen}
          onClose={() => setIsLeadsModalOpen(false)}
        />

        {/* Pipeline panel */}
        {showPanel && (
          <PipelinePanel
            logs={panelLogs}
            pipeline={pipeline}
            onClose={() => setShowPanel(false)}
          />
        )}
      </div>
    </div>
  );
};

// Crown icon helper component
const CrownIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);
export default DashboardPage;
