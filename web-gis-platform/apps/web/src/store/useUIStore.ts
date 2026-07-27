import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  activeSidebarTab: string;
  
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setActiveSidebarTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeSidebarTab: 'appearance', // 'appearance', 'tools', 'scene'
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
}));
