import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Users, AlertCircle } from 'lucide-react';
import { Button } from './UI/Button';
import { useAuthStore } from '../store/useAuthStore';

interface Member {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  assignedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface ProjectMemberModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export const ProjectMemberModal: React.FC<ProjectMemberModalProps> = ({ projectId, projectName, onClose }) => {
  const token = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('VIEWER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/projects/${projectId}/members`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.members || []);
      } else {
        setError(data.message || 'Không thể lấy danh sách thành viên.');
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ email, role: selectedRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Thêm thành viên thất bại.');
      }

      setSuccess(data.message);
      setEmail('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'OWNER' | 'EDITOR' | 'VIEWER') => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Cập nhật quyền thất bại.');
      }

      setSuccess(data.message);
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Xóa thành viên thất bại.');
      }

      setSuccess(data.message);
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl tech-card corner-ticks bg-slate-950 border-cyan-500/40 p-6 space-y-6 shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase">Phân Quyền Dự Án // {projectName}</h2>
              <p className="text-xs text-slate-400">Quản lý các cấp độ truy cập (OWNER / EDITOR / VIEWER)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 font-mono text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 font-mono text-xs text-emerald-300">
            ✅ {success}
          </div>
        )}

        {/* Form Mời Thành Viên */}
        <form onSubmit={handleAddMember} className="p-4 bg-slate-900 border border-cyan-500/20 space-y-3 font-mono">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center gap-2">
            <UserPlus size={14} /> Mời Thành Viên Mới
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập Email thành viên..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
            <select
              value={selectedRole}
              onChange={(e: any) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-cyan-500/30 text-cyan-400 text-xs focus:outline-none"
            >
              <option value="VIEWER">VIEWER (Người xem)</option>
              <option value="EDITOR">EDITOR (Biên tập)</option>
              <option value="OWNER">OWNER (Quản trị)</option>
            </select>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-none border border-cyan-200"
            >
              {submitting ? 'Đang gửi...' : 'THÊM +'}
            </Button>
          </div>
        </form>

        {/* Danh Sách Thành Viên Hiện Tại */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-slate-400 uppercase flex justify-between">
            <span>Danh sách người tham gia ({members.length})</span>
            <span>Cấp quyền hiện tại</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-center font-mono text-xs text-slate-400 py-6">Đang tải danh sách...</div>
            ) : members.length === 0 ? (
              <div className="text-center font-mono text-xs text-slate-500 py-6">Chưa có thành viên nào được phân quyền riêng.</div>
            ) : (
              members.map((m: Member) => (
                <div key={m.id} className="p-3 bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 uppercase">
                      {m.user.fullName.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        {m.user.fullName}
                        {currentUser?.id === m.userId && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/30">Bạn</span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">{m.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e: any) => handleUpdateRole(m.userId, e.target.value)}
                      className="px-2.5 py-1 bg-slate-950 border border-cyan-500/30 text-cyan-400 text-xs focus:outline-none"
                    >
                      <option value="VIEWER">VIEWER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="OWNER">OWNER</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400"
                      title="Xóa thành viên"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
