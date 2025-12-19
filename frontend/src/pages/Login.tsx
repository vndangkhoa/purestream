import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleConnect = async () => {
        if (!sessionId.trim()) return;

        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/credentials`, {
                credentials: {
                    http: {
                        cookies: { sessionid: sessionId.trim() }
                    }
                }
            });

            if (res.data.status === 'success') {
                navigate('/');
            } else {
                setError('Connection failed. Please check your session ID.');
            }
        } catch (err: any) {
            setError('Invalid session ID. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const openTikTokLogin = () => {
        window.open('https://www.tiktok.com/login', '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pt-8 pb-4 px-6 text-center">
                <div className="relative inline-block mb-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-2xl rotate-12 absolute -inset-1 blur-lg opacity-50" />
                    <div className="relative w-14 h-14 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-xl font-bold text-white mb-0.5">PureStream</h1>
                <p className="text-gray-500 text-xs">Ad-free TikTok viewing</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Important Note */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5">
                        <p className="text-amber-400 text-sm text-center">
                            ⚠️ This requires a <strong>desktop/laptop</strong> computer with Chrome or Firefox
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium mb-2">Login to TikTok on desktop</p>
                                <button
                                    onClick={openTikTokLogin}
                                    className="w-full py-2.5 bg-black border border-white/20 hover:border-white/40 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.32 0 .6.05.88.13V9.4c-.3-.04-.6-.05-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                    Open TikTok
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium mb-1">Open DevTools & copy sessionid</p>
                                <div className="bg-black/50 rounded-lg p-3 text-xs space-y-1">
                                    <p className="text-gray-400">• Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white">F12</kbd> or <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white">Ctrl+Shift+I</kbd></p>
                                    <p className="text-gray-400">• Click <span className="text-cyan-400">Application</span> tab</p>
                                    <p className="text-gray-400">• Click <span className="text-cyan-400">Cookies</span> → <span className="text-cyan-400">tiktok.com</span></p>
                                    <p className="text-gray-400">• Find <code className="text-pink-400 bg-pink-500/20 px-1 rounded">sessionid</code> and copy its value</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium mb-2">Paste here and connect</p>
                                <input
                                    type="text"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    placeholder="Paste sessionid value..."
                                    className="w-full bg-black border-2 border-white/10 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-pink-500/50 placeholder:text-gray-600"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={handleConnect}
                        disabled={!sessionId.trim() || isLoading}
                        className={`w-full py-4 text-white font-bold rounded-xl transition-all text-base ${sessionId.trim() && !isLoading
                                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 shadow-lg shadow-pink-500/25'
                                : 'bg-gray-700 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                            </span>
                        ) : (
                            'Connect to PureStream'
                        )}
                    </button>

                    {/* Help */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://www.youtube.com/results?search_query=how+to+find+tiktok+sessionid+cookie"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-xs underline hover:text-gray-400"
                        >
                            Need help? Watch a video tutorial →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
