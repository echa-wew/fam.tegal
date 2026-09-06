import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: any | null; // Firebase user
  userData: User | null; // Firestore user data
  isLoading: boolean;
  setUser: (user: any) => void;
  setUserData: (data: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserData: (data) => set({ userData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    }),
}));
