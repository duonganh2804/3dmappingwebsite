import React, { useEffect, useState } from 'react';
import { fetchDemoLeads, updateDemoLeadStatus, deleteDemoLead, type DemoLeadData } from '../services/api';
import { X, Mail, Phone, Building2, Calendar, Trash2, CheckCircle, Clock, RefreshCw, MessageSquare, Filter } from 'lucide-react';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLeadsModal: React.FC<AdminLeadsModalProps> = ({ isOpen, onClose }) => {
  const [leads, setLeads] = useState<DemoLeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'CLOSED'>('ALL');
  const [selectedLead, setSelectedLead] = useState<DemoLeadData | null>(null);

  const loadLeads = async () => {
    setIsLoading(true);
    const data = await fetchDemoLeads();
    setLeads(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = async (id: string, newStatus: 'NEW' | 'CONTACTED' | 'CLOSED') => {
    const success = await updateDemoLeadStatus(id, newStatus);
    if (success) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu demo này?')) {
      const success = await deleteDemoLead(id);
      if (success) {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedLead?.id === id) setSelectedLead(null);
      }
    }
  };

  const filteredLeads = leads.filter(l => {
    if (filterStatus === 'ALL') return true;
    return l.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Quản Lý Yêu Cầu Demo & Liên Hệ</h3>
              <p className="text-xs text-slate-400 font-mono">Tự động nhận thông báo gửi về: duongnguyen280403@gmail.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLeads}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="px-6 py-3 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-500" />
            <span className="text-slate-400">Lọc trạng thái:</span>
            {(['ALL', 'NEW', 'CONTACTED', 'CLOSED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'TẤT CẢ' : st === 'NEW' ? 'MỚI' : st === 'CONTACTED' ? 'ĐÃ LIÊN HỆ' : 'ĐÃ ĐÓNG'}
              </button>
            ))}
          </div>

          <div className="text-slate-400">
            Tổng cộng: <strong className="text-blue-400">{filteredLeads.length}</strong> yêu cầu
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Table / List */}
          <div className={`${selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3 transition-all`}>
            {isLoading ? (
              <div className="text-center py-16 font-mono text-xs text-slate-400">
                Đang tải danh sách yêu cầu demo...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-400 font-mono text-xs">
                Không có yêu cầu demo nào thuộc trạng thái này.
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{lead.email}</span>
                        {lead.status === 'NEW' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                            MỚI
                          </span>
                        )}
                        {lead.status === 'CONTACTED' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                            ĐÃ LIÊN HỆ
                          </span>
                        )}
                        {lead.status === 'CLOSED' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-400">
                            ĐÃ XỬ LÝ
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                        {lead.fullName && <span>👤 {lead.fullName}</span>}
                        {lead.jobTitle && <span>💼 {lead.jobTitle}</span>}
                        {lead.company && <span>🏢 {lead.company}</span>}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-1 italic font-sans">
                        "{lead.message}"
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-2">
                      <div className="text-[10px] font-mono text-slate-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('vi-VN') : ''}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(lead.id!); }}
                        className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Detailed View Panel */}
          {selectedLead && (
            <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="font-bold text-white text-sm">Chi Tiết Yêu Cầu</h4>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-slate-300">
                <div>
                  <span className="text-slate-500 font-mono text-[10px] block uppercase">Email Doanh Nghiệp:</span>
                  <a href={`mailto:${selectedLead.email}`} className="text-blue-400 font-bold hover:underline text-sm">
                    {selectedLead.email}
                  </a>
                </div>

                {selectedLead.fullName && (
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block uppercase">Họ và Tên:</span>
                    <span className="font-semibold text-white">{selectedLead.fullName}</span>
                  </div>
                )}

                {(selectedLead.jobTitle || selectedLead.company) && (
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block uppercase">Chức vụ / Công ty:</span>
                    <span className="text-white">{selectedLead.jobTitle || 'N/A'} - {selectedLead.company || 'N/A'}</span>
                  </div>
                )}

                {selectedLead.phone && (
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block uppercase">Số điện thoại:</span>
                    <a href={`tel:${selectedLead.phone}`} className="text-emerald-400 font-mono font-bold hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}

                {selectedLead.source && (
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block uppercase">Kênh biết đến:</span>
                    <span className="text-slate-300">{selectedLead.source}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-900">
                  <span className="text-slate-500 font-mono text-[10px] block uppercase mb-1">Ghi chú Nội dung:</span>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedLead.message}
                  </div>
                </div>

                {/* Change status buttons */}
                <div className="pt-3 border-t border-slate-900 space-y-2">
                  <span className="text-slate-500 font-mono text-[10px] block uppercase">Cập nhật trạng thái xử lý:</span>
                  <div className="flex gap-1.5 font-mono text-[10px]">
                    <button
                      onClick={() => handleStatusChange(selectedLead.id!, 'NEW')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                        selectedLead.status === 'NEW'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      MỚI
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedLead.id!, 'CONTACTED')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                        selectedLead.status === 'CONTACTED'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      ĐÃ LIÊN HỆ
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedLead.id!, 'CLOSED')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                        selectedLead.status === 'CLOSED'
                          ? 'bg-slate-700 border-slate-600 text-slate-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      ĐÃ XỬ LÝ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
