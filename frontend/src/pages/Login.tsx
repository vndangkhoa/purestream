import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState('');
    const navigate = useNavigate();

    // Check if already authenticated
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/status`);
            if (res.data.authenticated) {
                navigate('/');
            }
        } catch (err) {
            // Not authenticated, stay on login
        }
    };

    // Try browser login (opens TikTok in server's Playwright browser)
    const handleBrowserLogin = async () => {
        setError('');
        setIsLoading(true);
        setLoginStatus('Opening TikTok login... Please wait');

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/browser-login`, {}, {
                timeout: 200000 // 3+ minutes timeout
            });

            if (res.data.status === 'success') {
                setLoginStatus('Success! Redirecting...');
                setTimeout(() => navigate('/'), 1000);
            } else {
                setError(res.data.message || 'Login timed out. Please try the manual method.');
                setIsLoading(false);
                setLoginStatus('');
            }
        } catch (err: any) {
            setError('Connection failed. Please try the manual method below.');
            setIsLoading(false);
            setLoginStatus('');
        }
    };

    // Manual sessionid login
    const handleManualLogin = async () => {
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
                setError('Invalid session ID. Please try again.');
            }
        } catch (err: any) {
            setError('Connection failed. Please check your session ID.');
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Primary: Browser Login Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleBrowserLogin}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all ${isLoading
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {loginStatus || 'Please wait...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.32 0 .6.05.88.13V9.4c-.3-.04-.6-.05-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                    Login with TikTok
                                </>
                            )}
                        </button>
                        <p className="text-gray-600 text-xs text-center mt-2">
                            Opens TikTok login - complete the login and wait
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-xs">or paste manually</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Manual Method */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-gray-400 text-xs mb-3">
                            If the button above doesn't work, paste your TikTok <code className="text-pink-400 bg-pink-500/20 px-1 rounded">sessionid</code> cookie:
                        </p>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Paste sessionid here..."
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-pink-500/50 placeholder:text-gray-600 mb-3"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleManualLogin}
                            disabled={!sessionId.trim() || isLoading}
                            className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${sessionId.trim() && !isLoading
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Connect
                        </button>
                    </div>

                    {/* Help */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://www.youtube.com/results?search_query=how+to+get+tiktok+sessionid+cookie"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-xs underline hover:text-gray-400"
                        >
                            How to get sessionid →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
