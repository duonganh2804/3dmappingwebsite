import React, { useEffect, useMemo, useState } from 'react';
import {
  deleteConsultationLead,
  deleteDemoLead,
  fetchConsultationLeads,
  fetchDemoLeads,
  updateConsultationLeadStatus,
  updateDemoLeadStatus,
  type ConsultationLeadData,
  type DemoLeadData
} from '../services/api';
import {
  X,
  Mail,
  Trash2,
  RefreshCw,
  Filter,
  MessageSquare,
  MonitorPlay
} from 'lucide-react';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED';
type LeadTab = 'DEMO' | 'CONSULTATION';
type AdminLead = DemoLeadData | ConsultationLeadData;

const isConsultationLead = (
  lead: AdminLead
): lead is ConsultationLeadData => 'topic' in lead;

export const AdminLeadsModal: React.FC<
  AdminLeadsModalProps
> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] =
    useState<LeadTab>('DEMO');
  const [demoLeads, setDemoLeads] =
    useState<DemoLeadData[]>([]);
  const [consultationLeads, setConsultationLeads] =
    useState<ConsultationLeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | LeadStatus
  >('ALL');
  const [selectedLead, setSelectedLead] =
    useState<AdminLead | null>(null);

  const loadLeads = async () => {
    setIsLoading(true);

    const [demoData, consultationData] =
      await Promise.all([
        fetchDemoLeads(),
        fetchConsultationLeads()
      ]);

    setDemoLeads(demoData);
    setConsultationLeads(consultationData);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedLead(null);
    setFilterStatus('ALL');
  }, [activeTab]);

  const currentLeads: AdminLead[] =
    activeTab === 'DEMO'
      ? demoLeads
      : consultationLeads;

  const filteredLeads = useMemo(() => {
    if (filterStatus === 'ALL') {
      return currentLeads;
    }

    return currentLeads.filter(
      (lead) => lead.status === filterStatus
    );
  }, [currentLeads, filterStatus]);

  if (!isOpen) return null;

  const handleStatusChange = async (
    id: string,
    newStatus: LeadStatus
  ) => {
    const success =
      activeTab === 'DEMO'
        ? await updateDemoLeadStatus(id, newStatus)
        : await updateConsultationLeadStatus(
            id,
            newStatus
          );

    if (!success) return;

    if (activeTab === 'DEMO') {
      setDemoLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, status: newStatus }
            : lead
        )
      );
    } else {
      setConsultationLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, status: newStatus }
            : lead
        )
      );
    }

    setSelectedLead((prev) =>
      prev?.id === id
        ? { ...prev, status: newStatus }
        : prev
    );
  };

  const handleDelete = async (id: string) => {
    const label =
      activeTab === 'DEMO'
        ? 'yêu cầu Demo'
        : 'yêu cầu tư vấn';

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${label} này?`
      )
    ) {
      return;
    }

    const success =
      activeTab === 'DEMO'
        ? await deleteDemoLead(id)
        : await deleteConsultationLead(id);

    if (!success) return;

    if (activeTab === 'DEMO') {
      setDemoLeads((prev) =>
        prev.filter((lead) => lead.id !== id)
      );
    } else {
      setConsultationLeads((prev) =>
        prev.filter((lead) => lead.id !== id)
      );
    }

    if (selectedLead?.id === id) {
      setSelectedLead(null);
    }
  };

  const statusLabel = (
    status?: LeadStatus
  ) => {
    if (status === 'NEW') return 'MỚI';
    if (status === 'CONTACTED') return 'ĐÃ LIÊN HỆ';
    return 'ĐÃ XỬ LÝ';
  };

  const emptyLabel =
    activeTab === 'DEMO'
      ? 'Không có yêu cầu Demo nào thuộc trạng thái này.'
      : 'Không có yêu cầu tư vấn nào thuộc trạng thái này.';

  const loadingLabel =
    activeTab === 'DEMO'
      ? 'Đang tải danh sách yêu cầu Demo...'
      : 'Đang tải danh sách yêu cầu tư vấn...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 font-sans backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-950 font-bold text-blue-400">
              <Mail size={18} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-white">
                Quản lý yêu cầu
              </h3>
              <p className="font-mono text-xs text-slate-400">
                Demo Access & Contact Consultation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLeads}
              className="rounded-xl bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              title="Làm mới"
            >
              <RefreshCw
                size={16}
                className={
                  isLoading ? 'animate-spin' : ''
                }
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 border-b border-slate-800 bg-slate-950/30 px-6 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('DEMO')}
            className={`inline-flex items-center gap-2 rounded-t-xl border-x border-t px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'DEMO'
                ? 'border-blue-500/40 bg-blue-950/50 text-blue-300'
                : 'border-transparent text-slate-500 hover:text-slate-200'
            }`}
          >
            <MonitorPlay size={14} />
            Đăng ký Demo
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px]">
              {demoLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('CONSULTATION')
            }
            className={`inline-flex items-center gap-2 rounded-t-xl border-x border-t px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'CONSULTATION'
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={14} />
            Liên hệ tư vấn
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px]">
              {consultationLeads.length}
            </span>
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/20 px-6 py-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Filter
              size={14}
              className="text-slate-500"
            />
            <span className="mr-1 text-slate-400">
              Lọc:
            </span>

            {(
              [
                'ALL',
                'NEW',
                'CONTACTED',
                'CLOSED'
              ] as const
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setFilterStatus(status)
                }
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {status === 'ALL'
                  ? 'TẤT CẢ'
                  : statusLabel(status)}
              </button>
            ))}
          </div>

          <div className="text-slate-400">
            Tổng cộng:{' '}
            <strong className="text-blue-400">
              {filteredLeads.length}
            </strong>{' '}
            yêu cầu
          </div>
        </div>

        {/* Content */}
        <div className="grid flex-grow grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-12">
          {/* List */}
          <div
            className={`space-y-3 transition-all ${
              selectedLead
                ? 'lg:col-span-7'
                : 'lg:col-span-12'
            }`}
          >
            {isLoading ? (
              <div className="py-16 text-center font-mono text-xs text-slate-400">
                {loadingLabel}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 py-16 text-center font-mono text-xs text-slate-400">
                {emptyLabel}
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected =
                  selectedLead?.id === lead.id;

                return (
                  <div
                    key={lead.id}
                    onClick={() =>
                      setSelectedLead(lead)
                    }
                    className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500/60 bg-blue-950/40 shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-grow space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {lead.fullName ||
                            lead.email}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                            lead.status === 'NEW'
                              ? 'border-red-500/40 bg-red-500/20 text-red-400'
                              : lead.status ===
                                  'CONTACTED'
                                ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-400'
                                : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}
                        >
                          {statusLabel(
                            lead.status
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-400">
                        <span>{lead.email}</span>

                        {lead.company && (
                          <span>
                            🏢 {lead.company}
                          </span>
                        )}

                        {isConsultationLead(
                          lead
                        ) && (
                          <span className="text-cyan-400">
                            {lead.topic}
                          </span>
                        )}

                        {!isConsultationLead(
                          lead
                        ) &&
                          lead.source && (
                            <span>
                              {lead.source}
                            </span>
                          )}
                      </div>

                      <p className="line-clamp-1 text-xs italic text-slate-300">
                        "{lead.message}"
                      </p>
                    </div>

                    <div className="flex-shrink-0 space-y-2 text-right">
                      <div className="font-mono text-[10px] text-slate-500">
                        {lead.createdAt
                          ? new Date(
                              lead.createdAt
                            ).toLocaleDateString(
                              'vi-VN'
                            )
                          : ''}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (lead.id) {
                            handleDelete(lead.id);
                          }
                        }}
                        className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
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

          {/* Detail */}
          {selectedLead && (
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-xs lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Chi tiết yêu cầu
                  </h4>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    {activeTab === 'DEMO'
                      ? 'DEMO REQUEST'
                      : 'CONSULTATION REQUEST'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLead(null)
                  }
                  className="text-slate-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-slate-300">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-slate-500">
                    Email
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {selectedLead.email}
                  </span>
                </div>

                {selectedLead.fullName && (
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-slate-500">
                      Họ và tên
                    </span>
                    <span className="font-semibold text-white">
                      {selectedLead.fullName}
                    </span>
                  </div>
                )}

                {(selectedLead.jobTitle ||
                  selectedLead.company) && (
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-slate-500">
                      Chức danh / Công ty
                    </span>
                    <span className="text-white">
                      {selectedLead.jobTitle ||
                        'N/A'}{' '}
                      ·{' '}
                      {selectedLead.company ||
                        'N/A'}
                    </span>
                  </div>
                )}

                {selectedLead.phone && (
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-slate-500">
                      Số điện thoại
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedLead.phone}
                    </span>
                  </div>
                )}

                {isConsultationLead(
                  selectedLead
                ) && (
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-slate-500">
                      Nội dung cần tư vấn
                    </span>
                    <span className="font-semibold text-cyan-300">
                      {selectedLead.topic}
                    </span>
                  </div>
                )}

                {!isConsultationLead(
                  selectedLead
                ) &&
                  selectedLead.source && (
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-500">
                        Kênh biết đến
                      </span>
                      <span>
                        {selectedLead.source}
                      </span>
                    </div>
                  )}

                <div className="border-t border-slate-900 pt-3">
                  <span className="mb-1 block font-mono text-[10px] uppercase text-slate-500">
                    Nội dung
                  </span>
                  <div className="whitespace-pre-wrap rounded-xl border border-slate-800/80 bg-slate-900/90 p-3 leading-relaxed text-slate-200">
                    {selectedLead.message}
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <span className="block font-mono text-[10px] uppercase text-slate-500">
                    Trạng thái xử lý
                  </span>

                  <div className="flex gap-1.5 font-mono text-[10px]">
                    {(
                      [
                        'NEW',
                        'CONTACTED',
                        'CLOSED'
                      ] as const
                    ).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={
                          !selectedLead.id
                        }
                        onClick={() => {
                          if (
                            selectedLead.id
                          ) {
                            handleStatusChange(
                              selectedLead.id,
                              status
                            );
                          }
                        }}
                        className={`flex-1 rounded-lg border py-1.5 text-center font-bold transition-all ${
                          selectedLead.status ===
                          status
                            ? status === 'NEW'
                              ? 'border-red-500 bg-red-500/20 text-red-400'
                              : status ===
                                  'CONTACTED'
                                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                                : 'border-slate-600 bg-slate-700 text-slate-300'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        {statusLabel(status)}
                      </button>
                    ))}
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