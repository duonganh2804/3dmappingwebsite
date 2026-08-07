import { create } from 'zustand';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  centerLon: number;
  centerLat: number;
  epsg: number;
  domUrl?: string;
  metadataUrl?: string;
  modelUrl?: string;
  pointCloudId?: string;
  calibration?: string;
  isPublic?: boolean;
  createdById?: string;
  members?: ProjectMember[];
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
