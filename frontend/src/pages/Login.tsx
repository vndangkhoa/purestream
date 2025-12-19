import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [cookies, setCookies] = useState('');
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('');
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleBrowserLogin = async () => {
        setError('');
        setIsConnecting(true);
        setConnectionStatus('Opening TikTok login...');

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/browser-login`);

            if (res.data.status === 'success') {
                setConnectionStatus('Connected! Redirecting...');
                setTimeout(() => navigate('/'), 1000);
            } else if (res.data.status === 'timeout') {
                setError(res.data.message);
                setIsConnecting(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to connect. Please try manual method.');
            setIsConnecting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(cookies);
            navigate('/');
        } catch (err) {
            setError('Invalid format or server error. Ensure you paste the full JSON or Netscape text.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white font-sans overflow-hidden relative">
            {/* Ambient Background Safelight */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full" />

            <div className="w-full max-w-xl p-8 sm:p-12 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 z-10 mx-4 relative overflow-hidden">
                <div className="text-center mb-10 space-y-2">
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                        TikTok Clean
                    </h2>
                    <p className="text-white/50 text-base font-medium">Your personalized feed, reimagined.</p>
                </div>

                {/* Primary: Browser Login Button */}
                <div className="space-y-6 mb-8">
                    <button
                        onClick={handleBrowserLogin}
                        disabled={isConnecting}
                        className={`group relative w-full py-5 px-8 rounded-2xl transition-all font-black text-lg
                            ${isConnecting
                                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white shadow-[0_0_40px_rgba(236,72,153,0.3)] hover:shadow-[0_0_60px_rgba(236,72,153,0.5)] active:scale-[0.98]'
                            }`}
                    >
                        {isConnecting ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                                {connectionStatus}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                                Connect with TikTok
                            </span>
                        )}
                    </button>

                    <p className="text-center text-white/30 text-sm">
                        A browser window will open for you to log in securely.
                    </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 text-sm font-medium">or paste manually</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Secondary: Manual Paste */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">
                                Session Data
                            </label>
                            <span className="text-[10px] py-1 px-2 bg-white/10 rounded-md text-white/40 font-mono">JSON / NETSCAPE</span>
                        </div>
                        <textarea
                            className="w-full h-32 p-4 bg-black/40 rounded-xl border border-white/10 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 focus:outline-none transition-all font-mono text-[11px] leading-relaxed placeholder:text-white/20"
                            value={cookies}
                            onChange={(e) => setCookies(e.target.value)}
                            placeholder='Paste captured JSON here...'
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <p className="text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold text-base border border-white/10"
                    >
                        Initialize Feed
                    </button>
                </form>

                {/* Help Section */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-center text-white/20 text-xs">
                        Need help? Install <a href="https://github.com/botzvn/curl-websocket-capture" target="_blank" className="text-white/40 hover:text-white underline">curl-websocket-capture</a> for manual method.
                    </p>
                </div>
            </div>
        </div>
    );
};

