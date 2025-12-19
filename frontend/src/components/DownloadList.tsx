import React from 'react';
import { useDownloadStore } from '../store/downloadStore';
import { X, Check, AlertCircle, Loader2, Download } from 'lucide-react';

interface DownloadListProps {
    onClose: () => void;
}

export const DownloadList: React.FC<DownloadListProps> = ({ onClose }) => {
    const { downloads } = useDownloadStore();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Download size={20} /> Downloads
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {downloads.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No downloads yet.
                        </div>
                    )}

                    {downloads.map((item) => (
                        <div key={item.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-3">
                            <div className="bg-gray-600 p-2 rounded shrink-0">
                                {item.status === 'pending' && <Loader2 size={20} className="animate-spin text-blue-400" />}
                                {item.status === 'success' && <Check size={20} className="text-green-400" />}
                                {item.status === 'error' && <AlertCircle size={20} className="text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{item.title || 'Unknown Video'}</p>
                                <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                            </div>
                            {item.status === 'success' && (
                                <a
                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8002/api'}/download/file/${item.id}`}
                                    target="_blank"
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition"
                                >
                                    Open
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
