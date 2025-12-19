import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [cookies, setCookies] = useState('');
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [showBrowserLogin, setShowBrowserLogin] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleBrowserLogin = async () => {
        setError('');
        setIsConnecting(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/browser-login`);

            if (res.data.status === 'success') {
                setTimeout(() => navigate('/'), 1000);
            } else if (res.data.status === 'timeout') {
                setError(res.data.message);
                setIsConnecting(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to connect. Use the cookie method above.');
            setIsConnecting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cookies.trim()) return;

        setError('');
        try {
            await login(cookies);
            navigate('/');
        } catch (err) {
            setError('Invalid format. Make sure you paste the full cookie JSON.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pt-12 pb-6 px-6 text-center">
                <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-2xl rotate-12 absolute -inset-1 blur-lg opacity-50" />
                    <div className="relative w-16 h-16 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">PureStream</h1>
                <p className="text-gray-500 text-sm">Ad-free TikTok viewing</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* How to Login - Step by Step */}
                    <div className="mb-6">
                        <h2 className="text-white font-semibold text-lg mb-4 text-center">How to Login</h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                                <div>
                                    <p className="text-white text-sm font-medium">Open TikTok in browser</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Use Chrome/Safari on your phone or computer</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                                <div>
                                    <p className="text-white text-sm font-medium">Export your cookies</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Use "Cookie-Editor" extension (Chrome/Firefox)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                                <div>
                                    <p className="text-white text-sm font-medium">Paste cookies below</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Copy the JSON and paste it here</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cookie Input */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <textarea
                                value={cookies}
                                onChange={(e) => setCookies(e.target.value)}
                                placeholder='Paste your cookie JSON here...'
                                className="w-full h-32 bg-black/60 border-2 border-white/10 rounded-2xl p-4 text-white text-sm font-mono resize-none focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                            />
                        </div>

                        {/* Connect Button */}
                        <button
                            type="submit"
                            disabled={!cookies.trim()}
                            className={`w-full py-4 text-white font-semibold rounded-2xl transition-all transform active:scale-[0.98] shadow-lg text-base ${cookies.trim()
                                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 shadow-pink-500/20'
                                    : 'bg-gray-700 cursor-not-allowed'
                                }`}
                        >
                            Connect to TikTok
                        </button>
                    </form>

                    {/* Help Link */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 text-sm underline"
                        >
                            Get Cookie-Editor Extension →
                        </a>
                    </div>

                    {/* Desktop Browser Login - Hidden by default */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <button
                            onClick={() => setShowBrowserLogin(!showBrowserLogin)}
                            className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 flex items-center justify-center gap-2"
                        >
                            <span>{showBrowserLogin ? '▲' : '▼'}</span>
                            <span>Desktop Browser Login</span>
                        </button>

                        {showBrowserLogin && (
                            <div className="mt-3 p-4 bg-white/5 rounded-xl">
                                <p className="text-gray-400 text-xs text-center mb-3">
                                    ⚠️ Only works on local machines with a display
                                </p>
                                <button
                                    onClick={handleBrowserLogin}
                                    disabled={isConnecting}
                                    className={`w-full py-3 rounded-xl transition-all text-sm ${isConnecting
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    {isConnecting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        'Open TikTok Login Window'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
