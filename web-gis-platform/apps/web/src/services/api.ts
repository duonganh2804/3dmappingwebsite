import type { Project } from '../store/useProjectStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const USE_DEMO_MOCK =
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_DEMO_MOCK === 'true';

const LEGACY_DEMO_MOCK_GRANTED_KEY = 'demoMockGranted';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const decodeJwtPayload = (
  token: string
): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded =
      normalized +
      '='.repeat((4 - (normalized.length % 4)) % 4);

    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map(
          (char) =>
            `%${char.charCodeAt(0)
              .toString(16)
              .padStart(2, '0')}`
        )
        .join('')
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const simpleHash = (value: string): string => {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash).toString(36);
};

const getDemoMockAccountId = (): string | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const payload = decodeJwtPayload(token);

  const candidates = [
    payload?.sub,
    payload?.userId,
    payload?.id,
    payload?.email
  ];

  const stableId = candidates.find(
    (value) =>
      typeof value === 'string' &&
      value.trim().length > 0
  );

  if (typeof stableId === 'string') {
    return stableId.trim();
  }

  return `token-${simpleHash(token)}`;
};

const getDemoMockGrantedKey = (): string | null => {
  const accountId = getDemoMockAccountId();

  return accountId
    ? `demoMockGranted:${accountId}`
    : null;
};

const clearLegacyDemoMockKey = () => {
  localStorage.removeItem(
    LEGACY_DEMO_MOCK_GRANTED_KEY
  );
};

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch project');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }
};

export const createProject = async (data: Partial<Project>): Promise<Project | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return false;
  }
};

export const updateProject = async (
  id: string,
  data: Partial<Project>
): Promise<Project | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return await response.json();
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return null;
  }
};

// ── Demo Leads API Services ───────────────────────────────────────────────
export interface DemoLeadData {
  id?: string;
  email: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  message: string;
  source?: string;
  status?: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt?: string;
}

export interface DemoAccessResult {
  success: boolean;
  hasAccess: boolean;
  demoProjectId?: string;
  message?: string;
}

interface DemoApiResponse {
  success?: boolean;
  hasAccess?: boolean;
  demoProjectId?: string;
  message?: string;
  error?: string;
}

const parseJsonSafe = async (response: Response): Promise<DemoApiResponse> => {
  try {
    return (await response.json()) as DemoApiResponse;
  } catch {
    return {};
  }
};

export const fetchDemoAccess = async (): Promise<DemoAccessResult> => {
  if (USE_DEMO_MOCK) {
    clearLegacyDemoMockKey();

    const mockKey = getDemoMockGrantedKey();

    if (!mockKey) {
      return {
        success: true,
        hasAccess: false
      };
    }

    const hasAccess =
      localStorage.getItem(mockKey) === 'true';

    return {
      success: true,
      hasAccess,
      message: hasAccess
        ? 'Frontend demo mock access granted for current account.'
        : undefined
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/demo-access`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      console.warn(`[demo-access] API returned ${response.status}`, data);
      return {
        success: false,
        hasAccess: false
      };
    }

    return {
      success: data.success === true,
      hasAccess: data.hasAccess === true,
      demoProjectId:
        typeof data.demoProjectId === 'string'
          ? data.demoProjectId
          : undefined,
      message:
        typeof data.message === 'string'
          ? data.message
          : undefined
    };
  } catch (error) {
    console.error('[demo-access] Network error:', error);
    return {
      success: false,
      hasAccess: false
    };
  }
};

export const submitDemoLead = async (
  data: DemoLeadData
): Promise<DemoAccessResult> => {
  if (USE_DEMO_MOCK) {
    clearLegacyDemoMockKey();

    const mockKey = getDemoMockGrantedKey();

    if (!mockKey) {
      return {
        success: false,
        hasAccess: false,
        message: 'Bạn cần đăng nhập trước khi đăng ký Demo.'
      };
    }

    console.warn(
      '[demo-leads] Using frontend mock for current account:',
      data
    );

    await new Promise((resolve) =>
      window.setTimeout(resolve, 700)
    );

    localStorage.setItem(mockKey, 'true');

    return {
      success: true,
      hasAccess: true,
      message:
        'Frontend demo mock submitted successfully for current account.'
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/demo-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const resData = await parseJsonSafe(response);

    if (!response.ok) {
      console.warn(`[demo-leads] API returned ${response.status}`, resData);

      if (response.status >= 500) {
        return {
          success: false,
          hasAccess: false,
          message:
            'Hệ thống đăng ký Demo hiện chưa sẵn sàng. Vui lòng thử lại sau.'
        };
      }

      return {
        success: false,
        hasAccess: false,
        message:
          resData.message ||
          resData.error ||
          'Không thể gửi yêu cầu Demo. Vui lòng kiểm tra lại thông tin.'
      };
    }

    return {
      success: resData.success === true,
      hasAccess: resData.hasAccess === true,
      demoProjectId:
        typeof resData.demoProjectId === 'string'
          ? resData.demoProjectId
          : undefined,
      message:
        typeof resData.message === 'string'
          ? resData.message
          : undefined
    };
  } catch (error) {
    console.error('[demo-leads] Network error:', error);
    return {
      success: false,
      hasAccess: false,
      message:
        'Không thể kết nối đến hệ thống. Vui lòng thử lại sau.'
    };
  }
};

export const fetchDemoLeads = async (): Promise<DemoLeadData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/demo-leads`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch demo leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching demo leads:', error);
    return [];
  }
};

export const updateDemoLeadStatus = async (
  id: string,
  status: 'NEW' | 'CONTACTED' | 'CLOSED'
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/demo-leads/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return response.ok;
  } catch (error) {
    console.error(`Error updating demo lead ${id}:`, error);
    return false;
  }
};

export const deleteDemoLead = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/demo-leads/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting demo lead ${id}:`, error);
    return false;
  }
};

// ── Consultation Leads API Services ───────────────────────────────────────
export type ConsultationLeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

export interface ConsultationLeadData {
  id?: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  topic: string;
  message: string;
  status?: ConsultationLeadStatus;
  createdAt?: string;
}

export interface ConsultationLeadResult {
  success: boolean;
  message?: string;
}

export const submitConsultationLead = async (
  data: ConsultationLeadData
): Promise<ConsultationLeadResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/consultation-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        company: data.company,
        phone: data.phone,
        topic: data.topic,
        message: data.message
      })
    });

    let responseData: Record<string, unknown> = {};

    try {
      responseData = (await response.json()) as Record<string, unknown>;
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      return {
        success: false,
        message:
          typeof responseData.message === 'string'
            ? responseData.message
            : 'Không thể gửi yêu cầu tư vấn. Vui lòng thử lại.'
      };
    }

    return {
      success: true,
      message:
        typeof responseData.message === 'string'
          ? responseData.message
          : undefined
    };
  } catch (error) {
    console.error('[consultation-leads] Network error:', error);

    return {
      success: false,
      message:
        'Không thể kết nối đến hệ thống. Vui lòng thử lại sau.'
    };
  }
};

export const fetchConsultationLeads = async (): Promise<
  ConsultationLeadData[]
> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/consultation-leads`,
      {
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch consultation leads');
    }

    const data = await response.json();

    return Array.isArray(data)
      ? (data as ConsultationLeadData[])
      : [];
  } catch (error) {
    console.error('Error fetching consultation leads:', error);
    return [];
  }
};

export const updateConsultationLeadStatus = async (
  id: string,
  status: ConsultationLeadStatus
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/consultation-leads/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      }
    );

    return response.ok;
  } catch (error) {
    console.error(
      `Error updating consultation lead ${id}:`,
      error
    );
    return false;
  }
};

export const deleteConsultationLead = async (
  id: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/consultation-leads/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      }
    );

    return response.ok;
  } catch (error) {
    console.error(
      `Error deleting consultation lead ${id}:`,
      error
    );
    return false;
  }
};

// ── Customer Accounts API Services ────────────────────────────────────────
export interface CustomerAccountData {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPERADMIN' | 'USER';
  avatarUrl?: string | null;
  authProvider?: 'GOOGLE' | 'PASSWORD';
  createdAt: string;
  updatedAt?: string;
}

export const fetchCustomerAccounts = async (): Promise<
  CustomerAccountData[]
> => {
  const response = await fetch(
    `${API_BASE_URL}/admin/users`,
    {
      headers: getAuthHeaders(),
      credentials: 'include'
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch customer accounts (${response.status})`
    );
  }

  const data = await response.json();

  return Array.isArray(data)
    ? (data as CustomerAccountData[])
    : [];
};
