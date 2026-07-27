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
