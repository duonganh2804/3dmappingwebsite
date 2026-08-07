import type { Project } from '../store/useProjectStore';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
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

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project | null> => {
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

export const submitDemoLead = async (data: DemoLeadData): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/demo-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || 'Lỗi gửi yêu cầu demo');
    return { success: true, message: resData.message };
  } catch (error: any) {
    console.error('Lỗi submitDemoLead:', error);
    return { success: false, message: error.message };
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

export const updateDemoLeadStatus = async (id: string, status: 'NEW' | 'CONTACTED' | 'CLOSED'): Promise<boolean> => {
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

