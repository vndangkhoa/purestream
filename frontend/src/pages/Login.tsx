import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!sessionId.trim()) return;

        setError('');
        setIsLoading(true);

        try {
            // Send sessionid as credentials
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
                setError(res.data.message || 'Login failed.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid session. Please try again.');
        } finally {
            setIsLoading(false);
        }
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Instructions Toggle */}
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full text-left mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-cyan-400 text-sm font-medium">📱 How to get your Session ID</span>
                            <span className="text-cyan-400">{showInstructions ? '▲' : '▼'}</span>
                        </div>
                    </button>

                    {showInstructions && (
                        <div className="mb-5 space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">1</div>
                                <div>
                                    <p className="text-white text-sm">Open TikTok app → Login</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">2</div>
                                <div>
                                    <p className="text-white text-sm">On desktop: Open TikTok in Chrome</p>
                                    <p className="text-gray-500 text-xs mt-0.5">F12 → Application → Cookies → tiktok.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">3</div>
                                <div>
                                    <p className="text-white text-sm">Copy the <code className="bg-white/10 px-1 rounded text-cyan-400">sessionid</code> value</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Long string starting with numbers</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session ID Input */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-xs mb-1.5 ml-1">Session ID</label>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Paste your sessionid here..."
                            className="w-full bg-black/60 border-2 border-white/10 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={handleLogin}
                        disabled={!sessionId.trim() || isLoading}
                        className={`w-full py-4 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] text-base ${sessionId.trim() && !isLoading
                                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 shadow-lg shadow-pink-500/20'
                                : 'bg-gray-700 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                            </span>
                        ) : (
                            'Connect'
                        )}
                    </button>

                    {/* Video Tutorial Link */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://www.youtube.com/results?search_query=how+to+get+tiktok+sessionid+cookie"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 text-sm underline"
                        >
                            Watch tutorial on YouTube →
                        </a>
                    </div>

                    {/* Note */}
                    <p className="text-gray-600 text-xs text-center mt-4">
                        Your session ID connects you to your TikTok account. It's stored locally on the server.
                    </p>
                </div>
            </div>
        </div>
    );
};
