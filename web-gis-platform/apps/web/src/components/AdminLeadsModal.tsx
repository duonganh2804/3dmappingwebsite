import React, { useEffect, useMemo, useState } from 'react';
import {
  deleteConsultationLead,
  deleteDemoLead,
  fetchConsultationLeads,
  fetchCustomerAccounts,
  fetchDemoLeads,
  updateConsultationLeadStatus,
  updateDemoLeadStatus,
  type ConsultationLeadData,
  type CustomerAccountData,
  type DemoLeadData
} from '../services/api';
import {
  AlertTriangle,
  Download,
  Filter,
  Mail,
  MessageSquare,
  MonitorPlay,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation?: 'modal' | 'page';
}

type LeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED';
type CustomerTab = 'ACCOUNTS' | 'DEMO' | 'CONSULTATION';
type AdminLead = DemoLeadData | ConsultationLeadData;

interface CustomerExportRow {
  email: string;
  fullName: string;
  phone: string;
  company: string;
  jobTitle: string;
  hasAccount: boolean;
  authMethod: string;
  accountCreatedAt: string;
  hasDemo: boolean;
  demoStatus: string;
  demoCreatedAt: string;
  hasConsultation: boolean;
  consultationTopic: string;
  consultationStatus: string;
  consultationCreatedAt: string;
  source: string;
  note: string;
}

const isConsultationLead = (
  lead: AdminLead
): lead is ConsultationLeadData => 'topic' in lead;

const normalizeEmail = (value?: string) =>
  (value || '').trim().toLowerCase();

const dateText = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('vi-VN');
};

const buildCustomerRows = (
  accounts: CustomerAccountData[],
  demoLeads: DemoLeadData[],
  consultationLeads: ConsultationLeadData[]
): CustomerExportRow[] => {
  const map = new Map<string, CustomerExportRow>();

  const ensure = (email: string) => {
    const key = normalizeEmail(email);

    if (!map.has(key)) {
      map.set(key, {
        email,
        fullName: '',
        phone: '',
        company: '',
        jobTitle: '',
        hasAccount: false,
        authMethod: '',
        accountCreatedAt: '',
        hasDemo: false,
        demoStatus: '',
        demoCreatedAt: '',
        hasConsultation: false,
        consultationTopic: '',
        consultationStatus: '',
        consultationCreatedAt: '',
        source: '',
        note: ''
      });
    }

    return map.get(key)!;
  };

  accounts
    .filter((account) => account.role !== 'SUPERADMIN')
    .forEach((account) => {
      const row = ensure(account.email);
      row.email = account.email;
      row.fullName = row.fullName || account.fullName || '';
      row.hasAccount = true;
      row.authMethod =
        account.authProvider === 'GOOGLE'
          ? 'Google'
          : 'Email / Password';
      row.accountCreatedAt = dateText(account.createdAt);
    });

  demoLeads.forEach((lead) => {
    const row = ensure(lead.email);
    row.email = lead.email;
    row.fullName = lead.fullName || row.fullName;
    row.phone = lead.phone || row.phone;
    row.company = lead.company || row.company;
    row.jobTitle = lead.jobTitle || row.jobTitle;
    row.hasDemo = true;
    row.demoStatus = lead.status || 'NEW';
    row.demoCreatedAt = dateText(lead.createdAt);
    row.source = lead.source || row.source;
    row.note = lead.message || row.note;
  });

  consultationLeads.forEach((lead) => {
    const row = ensure(lead.email);
    row.email = lead.email;
    row.fullName = lead.fullName || row.fullName;
    row.phone = lead.phone || row.phone;
    row.company = lead.company || row.company;
    row.jobTitle = lead.jobTitle || row.jobTitle;
    row.hasConsultation = true;
    row.consultationTopic = lead.topic || '';
    row.consultationStatus = lead.status || 'NEW';
    row.consultationCreatedAt = dateText(lead.createdAt);

    if (!row.note) {
      row.note = lead.message || '';
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.email.localeCompare(b.email)
  );
};

export const AdminLeadsModal: React.FC<
  AdminLeadsModalProps
> = ({
  isOpen,
  onClose,
  presentation = 'modal'
}) => {
  const [activeTab, setActiveTab] =
    useState<CustomerTab>('ACCOUNTS');

  const [accounts, setAccounts] =
    useState<CustomerAccountData[]>([]);
  const [demoLeads, setDemoLeads] =
    useState<DemoLeadData[]>([]);
  const [consultationLeads, setConsultationLeads] =
    useState<ConsultationLeadData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [accountApiError, setAccountApiError] =
    useState(false);

  const [filterStatus, setFilterStatus] = useState<
    'ALL' | LeadStatus
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLead, setSelectedLead] =
    useState<AdminLead | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<CustomerAccountData | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const customerAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.role !== 'SUPERADMIN'
      ),
    [accounts]
  );

  const loadData = async () => {
    setIsLoading(true);
    setAccountApiError(false);

    const [accountsResult, demoResult, consultationResult] =
      await Promise.allSettled([
        fetchCustomerAccounts(),
        fetchDemoLeads(),
        fetchConsultationLeads()
      ]);

    if (accountsResult.status === 'fulfilled') {
      setAccounts(accountsResult.value);
    } else {
      setAccounts([]);
      setAccountApiError(true);
    }

    setDemoLeads(
      demoResult.status === 'fulfilled'
        ? demoResult.value
        : []
    );

    setConsultationLeads(
      consultationResult.status === 'fulfilled'
        ? consultationResult.value
        : []
    );

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedLead(null);
    setSelectedAccount(null);
    setDeleteTarget(null);
    setFilterStatus('ALL');
    setSearchQuery('');
  }, [activeTab]);

  const query = searchQuery.trim().toLowerCase();

  const filteredAccounts = useMemo(() => {
    if (!query) return customerAccounts;

    return customerAccounts.filter((account) =>
      [
        account.fullName,
        account.email,
        account.role
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [customerAccounts, query]);

  const currentLeads: AdminLead[] =
    activeTab === 'DEMO'
      ? demoLeads
      : consultationLeads;

  const filteredLeads = useMemo(() => {
    let rows = currentLeads;

    if (filterStatus !== 'ALL') {
      rows = rows.filter(
        (lead) => lead.status === filterStatus
      );
    }

    if (query) {
      rows = rows.filter((lead) =>
        [
          lead.email,
          lead.fullName,
          lead.company,
          lead.phone,
          lead.jobTitle,
          lead.message,
          isConsultationLead(lead)
            ? lead.topic
            : lead.source
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          )
      );
    }

    return rows;
  }, [currentLeads, filterStatus, query]);

  const uniqueCustomers = useMemo(
    () =>
      buildCustomerRows(
        customerAccounts,
        demoLeads,
        consultationLeads
      ),
    [
      customerAccounts,
      demoLeads,
      consultationLeads
    ]
  );

  if (!isOpen) return null;

  const handleStatusChange = async (
    id: string,
    newStatus: LeadStatus
  ) => {
    if (activeTab === 'ACCOUNTS') return;

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

  const requestDelete = (
    id: string,
    lead: AdminLead
  ) => {
    const name =
      lead.fullName?.trim() ||
      lead.email ||
      'khách hàng này';

    setDeleteTarget({
      id,
      label: name
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || activeTab === 'ACCOUNTS') {
      return;
    }

    setIsDeleting(true);

    try {
      const success =
        activeTab === 'DEMO'
          ? await deleteDemoLead(deleteTarget.id)
          : await deleteConsultationLead(
              deleteTarget.id
            );

      if (!success) return;

      if (activeTab === 'DEMO') {
        setDemoLeads((prev) =>
          prev.filter(
            (lead) => lead.id !== deleteTarget.id
          )
        );
      } else {
        setConsultationLeads((prev) =>
          prev.filter(
            (lead) => lead.id !== deleteTarget.id
          )
        );
      }

      if (selectedLead?.id === deleteTarget.id) {
        setSelectedLead(null);
      }

      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCustomerData = async () => {
    const XLSX = await import('xlsx');

    const readableStatus = (status?: string) => {
      if (status === 'NEW') return 'Mới';
      if (status === 'CONTACTED') return 'Đã liên hệ';
      if (status === 'CLOSED') return 'Đã xử lý';
      return status || '';
    };

    const workbook = XLSX.utils.book_new();

    const addSheet = (
      name: string,
      headers: string[],
      rows: Array<Array<string | number>>,
      widths: number[]
    ) => {
      const sheet = XLSX.utils.aoa_to_sheet([
        headers,
        ...rows
      ]);

      sheet['!cols'] = widths.map((wch) => ({ wch }));

      if (rows.length > 0) {
        sheet['!autofilter'] = {
          ref: `A1:${XLSX.utils.encode_col(
            headers.length - 1
          )}${rows.length + 1}`
        };
      }

      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        name
      );
    };

    addSheet(
      'Tổng hợp',
      [
        'STT',
        'Họ và tên',
        'Email',
        'Điện thoại',
        'Công ty',
        'Chức danh',
        'Có tài khoản',
        'Phương thức đăng ký',
        'Ngày tạo tài khoản',
        'Đăng ký Demo',
        'Trạng thái Demo',
        'Ngày đăng ký Demo',
        'Yêu cầu tư vấn',
        'Chủ đề tư vấn',
        'Trạng thái tư vấn',
        'Ngày yêu cầu tư vấn',
        'Nguồn',
        'Ghi chú'
      ],
      uniqueCustomers.map((item, index) => [
        index + 1,
        item.fullName,
        item.email,
        item.phone,
        item.company,
        item.jobTitle,
        item.hasAccount ? 'Có' : 'Không',
        item.authMethod,
        item.accountCreatedAt,
        item.hasDemo ? 'Có' : 'Không',
        readableStatus(item.demoStatus),
        item.demoCreatedAt,
        item.hasConsultation ? 'Có' : 'Không',
        item.consultationTopic,
        readableStatus(item.consultationStatus),
        item.consultationCreatedAt,
        item.source,
        item.note
      ]),
      [
        6, 24, 32, 18, 24, 20, 14, 22, 22,
        14, 18, 22, 16, 30, 20, 22, 20, 42
      ]
    );

    addSheet(
      'Tài khoản',
      [
        'STT',
        'Họ và tên',
        'Email',
        'Phương thức đăng ký',
        'Ngày tạo tài khoản'
      ],
      customerAccounts.map((account, index) => [
        index + 1,
        account.fullName || '',
        account.email,
        account.authProvider === 'GOOGLE'
          ? 'Google'
          : 'Email / Password',
        dateText(account.createdAt)
      ]),
      [6, 26, 34, 22, 22]
    );

    addSheet(
      'Đăng ký Demo',
      [
        'STT',
        'Họ và tên',
        'Email',
        'Điện thoại',
        'Công ty',
        'Chức danh',
        'Trạng thái',
        'Ngày đăng ký',
        'Nguồn',
        'Nội dung'
      ],
      demoLeads.map((lead, index) => [
        index + 1,
        lead.fullName || '',
        lead.email,
        lead.phone || '',
        lead.company || '',
        lead.jobTitle || '',
        readableStatus(lead.status),
        dateText(lead.createdAt),
        lead.source || '',
        lead.message || ''
      ]),
      [6, 26, 34, 18, 24, 20, 18, 22, 22, 48]
    );

    addSheet(
      'Liên hệ tư vấn',
      [
        'STT',
        'Họ và tên',
        'Email',
        'Điện thoại',
        'Công ty',
        'Chức danh',
        'Chủ đề tư vấn',
        'Trạng thái',
        'Ngày gửi',
        'Mô tả nhu cầu / dự án'
      ],
      consultationLeads.map((lead, index) => [
        index + 1,
        lead.fullName || '',
        lead.email,
        lead.phone || '',
        lead.company || '',
        lead.jobTitle || '',
        lead.topic || '',
        readableStatus(lead.status),
        dateText(lead.createdAt),
        lead.message || ''
      ]),
      [6, 26, 34, 18, 24, 20, 32, 18, 22, 48]
    );

    const stamp = new Date()
      .toISOString()
      .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `saolatek-customer-data-${stamp}.xlsx`,
      {
        compression: true
      }
    );
  };

  const statusLabel = (status?: LeadStatus) => {
    if (status === 'NEW') return 'MỚI';
    if (status === 'CONTACTED') return 'ĐÃ LIÊN HỆ';
    return 'ĐÃ XỬ LÝ';
  };

  const filteredCount =
    activeTab === 'ACCOUNTS'
      ? filteredAccounts.length
      : filteredLeads.length;

  const isPage = presentation === 'page';

  return (
    <div
      className={
        isPage
          ? 'flex min-h-full w-full flex-col font-sans'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-0 font-sans backdrop-blur-[2px] sm:p-4'
      }
    >
      <div
        className={
          isPage
            ? 'flex min-h-[calc(100vh-104px)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#f7f9fc] shadow-sm'
            : 'flex h-dvh max-h-dvh w-full max-w-7xl flex-col overflow-hidden border border-slate-200 bg-[#f7f9fc] shadow-[0_24px_70px_rgba(15,23,42,.18)] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl'
        }
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
              <Users size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold leading-5 tracking-tight text-slate-900 sm:text-lg sm:leading-normal">
                Quản lý thông tin khách hàng
              </h3>
              <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:mt-0 sm:font-mono sm:text-xs">
                Tài khoản · Đăng ký Demo · Liên hệ tư vấn
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 md:flex md:w-auto md:flex-wrap">
            <div className="flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Tổng khách hàng:{' '}
              <strong className="text-slate-900">
                {uniqueCustomers.length}
              </strong>
            </div>

            <button
              type="button"
              onClick={exportCustomerData}
              disabled={uniqueCustomers.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
              title="Xuất file Excel (.xlsx)"
            >
              <Download size={15} />
              Xuất Excel
            </button>

            <button
              type="button"
              onClick={loadData}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              title="Làm mới"
            >
              <RefreshCw
                size={16}
                className={
                  isLoading ? 'animate-spin' : ''
                }
              />
            </button>

            {!isPage && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {accountApiError && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-700">
            API danh sách tài khoản chưa sẵn sàng. Dữ liệu Demo và Tư vấn vẫn tải bình thường.
          </div>
        )}

        <div className="flex flex-nowrap gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 pt-2 sm:gap-2 sm:px-6 sm:pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-x border-t px-3 py-2 text-xs font-bold transition sm:gap-2 sm:rounded-t-xl sm:px-4 sm:py-2.5 ${
              activeTab === 'ACCOUNTS'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            Tài khoản
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
              {customerAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEMO')}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-x border-t px-3 py-2 text-xs font-bold transition sm:gap-2 sm:rounded-t-xl sm:px-4 sm:py-2.5 ${
              activeTab === 'DEMO'
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MonitorPlay size={14} />
            Đăng ký Demo
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
              {demoLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('CONSULTATION')
            }
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-x border-t px-3 py-2 text-xs font-bold transition sm:gap-2 sm:rounded-t-xl sm:px-4 sm:py-2.5 ${
              activeTab === 'CONSULTATION'
                ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageSquare size={14} />
            Liên hệ tư vấn
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
              {consultationLeads.length}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2 border-b border-slate-200 bg-[#f8fafc] px-3 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full min-w-0 flex-1 md:max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Tìm tên, email, công ty, số điện thoại..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>

            {activeTab !== 'ACCOUNTS' && (
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <Filter
                  size={14}
                  className="text-slate-500"
                />

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
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'TẤT CẢ'
                      : statusLabel(status)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="font-mono text-xs text-slate-500">
            Đang hiển thị:{' '}
            <strong className="text-blue-600">
              {filteredCount}
            </strong>
          </div>
        </div>

        <div className="grid min-h-0 flex-grow grid-cols-1 gap-3 overflow-y-auto p-3 sm:gap-6 sm:p-6 lg:grid-cols-12">
          {activeTab === 'ACCOUNTS' ? (
            <>
              <div
                className={`space-y-3 ${
                  selectedAccount
                    ? 'lg:col-span-7'
                    : 'lg:col-span-12'
                }`}
              >
                {isLoading ? (
                  <div className="py-16 text-center font-mono text-xs text-slate-500">
                    Đang tải danh sách tài khoản...
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center font-mono text-xs text-slate-500">
                    Chưa có tài khoản khách hàng phù hợp.
                  </div>
                ) : (
                  filteredAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() =>
                        setSelectedAccount(account)
                      }
                      className={`flex w-full flex-col items-stretch gap-3 rounded-xl border p-3 text-left transition sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4 ${
                        selectedAccount?.id === account.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {account.fullName || account.email}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-slate-500">
                          <span className="min-w-0 break-all">{account.email}</span>
                          <span className="text-emerald-600">
                            {account.authProvider === 'GOOGLE'
                              ? 'Google'
                              : 'Email / Password'}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 text-left sm:block sm:text-right">
                        <div className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-600">
                          USER
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 sm:mt-2">
                          {dateText(account.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedAccount && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-sm lg:col-span-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Chi tiết tài khoản
                      </h4>
                      <p className="mt-1 font-mono text-[10px] text-emerald-600">
                        CUSTOMER ACCOUNT
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAccount(null)
                      }
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-4 text-slate-700">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Họ và tên
                      </span>
                      <strong className="text-sm text-slate-900">
                        {selectedAccount.fullName}
                      </strong>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Email
                      </span>
                      <span className="font-bold text-blue-600">
                        {selectedAccount.email}
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Phương thức đăng ký
                      </span>
                      <span>
                        {selectedAccount.authProvider ===
                        'GOOGLE'
                          ? 'Google'
                          : 'Email / Password'}
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Ngày tạo tài khoản
                      </span>
                      <span>
                        {dateText(
                          selectedAccount.createdAt
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Customer ID
                      </span>
                      <span className="break-all font-mono text-slate-400">
                        {selectedAccount.id}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className={`space-y-3 ${
                  selectedLead
                    ? 'lg:col-span-7'
                    : 'lg:col-span-12'
                }`}
              >
                {isLoading ? (
                  <div className="py-16 text-center font-mono text-xs text-slate-500">
                    Đang tải dữ liệu khách hàng...
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center font-mono text-xs text-slate-500">
                    Không có dữ liệu phù hợp.
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() =>
                        setSelectedLead(lead)
                      }
                      className={`flex cursor-pointer flex-col items-stretch gap-3 rounded-xl border p-3 transition-all sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4 ${
                        selectedLead?.id === lead.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-grow space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {lead.fullName || lead.email}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${
                              lead.status === 'NEW'
                                ? 'border-red-200 bg-red-50 text-red-600'
                                : lead.status === 'CONTACTED'
                                  ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {statusLabel(lead.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500">
                          <span className="min-w-0 break-all">{lead.email}</span>

                          {lead.company && (
                            <span>🏢 {lead.company}</span>
                          )}

                          {lead.phone && (
                            <span>☎ {lead.phone}</span>
                          )}

                          {isConsultationLead(lead) ? (
                            <span className="text-cyan-700">
                              {lead.topic}
                            </span>
                          ) : (
                            lead.source && (
                              <span>{lead.source}</span>
                            )
                          )}
                        </div>

                        <p className="line-clamp-1 text-xs italic text-slate-600">
                          "{lead.message}"
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 text-left sm:block sm:space-y-2 sm:text-right">
                        <div className="font-mono text-[10px] text-slate-400">
                          {dateText(lead.createdAt)}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (lead.id) {
                              requestDelete(
                                lead.id,
                                lead
                              );
                            }
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:p-1"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedLead && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-sm lg:col-span-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Chi tiết khách hàng
                      </h4>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        {activeTab === 'DEMO'
                          ? 'DEMO REGISTRATION'
                          : 'CONSULTATION REQUEST'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLead(null)
                      }
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-3 text-slate-700">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
                        Email
                      </span>
                      <span className="break-all text-sm font-bold text-blue-600">
                        {selectedLead.email}
                      </span>
                    </div>

                    {selectedLead.fullName && (
                      <div>
                        <span className="block font-mono text-[10px] uppercase text-slate-400">
                          Họ và tên
                        </span>
                        <span className="font-semibold text-slate-900">
                          {selectedLead.fullName}
                        </span>
                      </div>
                    )}

                    {(selectedLead.jobTitle ||
                      selectedLead.company) && (
                      <div>
                        <span className="block font-mono text-[10px] uppercase text-slate-400">
                          Chức danh / Công ty
                        </span>
                        <span className="text-slate-900">
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
                        <span className="block font-mono text-[10px] uppercase text-slate-400">
                          Số điện thoại
                        </span>
                        <span className="font-mono font-bold text-emerald-600">
                          {selectedLead.phone}
                        </span>
                      </div>
                    )}

                    {isConsultationLead(
                      selectedLead
                    ) ? (
                      <div>
                        <span className="block font-mono text-[10px] uppercase text-slate-400">
                          Nội dung cần tư vấn
                        </span>
                        <span className="font-semibold text-cyan-700">
                          {selectedLead.topic}
                        </span>
                      </div>
                    ) : (
                      selectedLead.source && (
                        <div>
                          <span className="block font-mono text-[10px] uppercase text-slate-400">
                            Kênh biết đến
                          </span>
                          <span>{selectedLead.source}</span>
                        </div>
                      )
                    )}

                    <div className="border-t border-slate-200 pt-3">
                      <span className="mb-1 block font-mono text-[10px] uppercase text-slate-400">
                        Nội dung
                      </span>
                      <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-700">
                        {selectedLead.message}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <span className="block font-mono text-[10px] uppercase text-slate-400">
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
                            disabled={!selectedLead.id}
                            onClick={() => {
                              if (selectedLead.id) {
                                handleStatusChange(
                                  selectedLead.id,
                                  status
                                );
                              }
                            }}
                            className={`flex-1 rounded-lg border py-1.5 text-center font-bold transition-all ${
                              selectedLead.status === status
                                ? status === 'NEW'
                                  ? 'border-red-300 bg-red-50 text-red-600'
                                  : status === 'CONTACTED'
                                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-700'
                                    : 'border-slate-300 bg-slate-100 text-slate-700'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
            </>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.22)]">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-slate-900">
                  Xóa yêu cầu này?
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn sắp xóa yêu cầu của{' '}
                  <strong className="font-semibold text-slate-900">
                    {deleteTarget.label}
                  </strong>
                  . Dữ liệu sau khi xóa sẽ không thể khôi phục.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex min-w-[118px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xóa yêu cầu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
