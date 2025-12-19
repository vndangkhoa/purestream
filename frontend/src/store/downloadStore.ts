import { create } from 'zustand';

export interface DownloadItem {
    id: string;
    title: string;
    url: string; // Original URL
    filePath?: string; // Resulting filename/path
    status: 'pending' | 'success' | 'error';
    timestamp: number;
}

interface DownloadState {
    downloads: DownloadItem[];
    addDownload: (item: DownloadItem) => void;
    updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
    downloads: [],
    addDownload: (item) => set((state) => ({
        downloads: [item, ...state.downloads]
    })),
    updateDownload: (id, updates) => set((state) => ({
        downloads: state.downloads.map((d) =>
            d.id === id ? { ...d, ...updates } : d
        )
    }))
}));
