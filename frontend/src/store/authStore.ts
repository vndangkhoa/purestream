import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface User {
    id: string;
    username: string;
    avatar: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (cookies: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async (cookies: string) => {
        set({ isLoading: true });
        try {
            const formData = new FormData();
            formData.append('cookies', cookies);
            await axios.post(`${API_BASE_URL}/auth/cookies`, formData);
            // Mock user for now until scraper is ready
            set({
                user: { id: '1', username: 'TikTok User', avatar: '' },
                isAuthenticated: true
            });
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },
    logout: () => {
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/status`);
            if (res.data.authenticated) {
                set({
                    user: { id: '1', username: 'TikTok User', avatar: '' },
                    isAuthenticated: true
                });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    }
}));
