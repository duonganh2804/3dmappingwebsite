import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPERADMIN' | 'USER';
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const API_BASE_URL = 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,

  setAuth: (user: UserProfile, token: string) => {
    localStorage.setItem('accessToken', token);
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Lỗi gọi API logout:', err);
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    set({ isLoading: true });

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        // Thử Refresh token nếu 401
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.success && refreshData.accessToken) {
          localStorage.setItem('accessToken', refreshData.accessToken);
          set({
            user: refreshData.user,
            accessToken: refreshData.accessToken,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          localStorage.removeItem('accessToken');
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (err) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
