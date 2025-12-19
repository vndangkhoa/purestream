import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCookieMethod, setShowCookieMethod] = useState(false);
    const [cookies, setCookies] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;

        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: username.trim(),
                password: password.trim()
            });

            if (res.data.status === 'success') {
                navigate('/');
            } else {
                setError(res.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            const message = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCookieLogin = async () => {
        if (!cookies.trim()) return;

        setError('');
        setIsLoading(true);

        try {
            // Try to parse as JSON
            let jsonCreds;
            try {
                jsonCreds = JSON.parse(cookies);
            } catch {
                // If not JSON, wrap it as simple session format
                jsonCreds = {
                    http: {
                        cookies: { sessionid: cookies.trim() }
                    }
                };
            }

            const res = await axios.post(`${API_BASE_URL}/auth/credentials`, {
                credentials: jsonCreds
            });

            if (res.data.status === 'success') {
                navigate('/');
            } else {
                setError(res.data.message || 'Failed to save cookies.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid cookie format.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pt-10 pb-4 px-6 text-center">
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

                    {/* Simple Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1.5 ml-1">Email or Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your TikTok email"
                                className="w-full bg-black/60 border-2 border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full bg-black/60 border-2 border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!username.trim() || !password.trim() || isLoading}
                            className={`w-full py-4 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] text-base mt-2 ${username.trim() && password.trim() && !isLoading
                                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 shadow-lg shadow-pink-500/20'
                                    : 'bg-gray-700 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logging in...
                                </span>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <p className="text-gray-600 text-xs text-center mt-4">
                        Your credentials are used only to log into TikTok on the server. They are not stored.
                    </p>

                    {/* Cookie Method - Alternative */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <button
                            onClick={() => setShowCookieMethod(!showCookieMethod)}
                            className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 flex items-center justify-center gap-2"
                        >
                            <span>{showCookieMethod ? '▲' : '▼'}</span>
                            <span>Alternative: Cookie Method</span>
                        </button>

                        {showCookieMethod && (
                            <div className="mt-3 p-4 bg-white/5 rounded-xl space-y-3">
                                <p className="text-gray-400 text-xs text-center">
                                    If login doesn't work, you can paste TikTok cookies directly.
                                </p>
                                <textarea
                                    value={cookies}
                                    onChange={(e) => setCookies(e.target.value)}
                                    placeholder='Paste sessionid or full cookie JSON...'
                                    className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleCookieLogin}
                                    disabled={!cookies.trim() || isLoading}
                                    className={`w-full py-3 rounded-xl text-sm transition-all ${cookies.trim() && !isLoading
                                            ? 'bg-white/10 hover:bg-white/20 text-white'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    Connect with Cookies
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
