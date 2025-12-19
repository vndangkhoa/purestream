import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Admin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cookiesJson, setCookiesJson] = useState('');
    const [currentCookies, setCurrentCookies] = useState<Record<string, string>>({});
    const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; cookie_count: number } | null>(null);

    // Check for stored admin token on mount
    useEffect(() => {
        const stored = localStorage.getItem('admin_token');
        if (stored) {
            verifyToken(stored);
        }
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/status`);
            setAuthStatus(res.data);
        } catch {
            setAuthStatus({ authenticated: false, cookie_count: 0 });
        }
    };

    const verifyToken = async (token: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/admin-check?token=${token}`);
            if (res.data.valid) {
                setAdminToken(token);
                loadCurrentCookies(token);
            } else {
                localStorage.removeItem('admin_token');
            }
        } catch {
            localStorage.removeItem('admin_token');
        }
    };

    const loadCurrentCookies = async (token: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/admin-get-cookies?token=${token}`);
            setCurrentCookies(res.data.cookies || {});
        } catch {
            // Ignore
        }
    };

    const handleLogin = async () => {
        if (!password.trim()) return;
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/admin-login`, { password });
            if (res.data.status === 'success') {
                const token = res.data.token;
                setAdminToken(token);
                localStorage.setItem('admin_token', token);
                loadCurrentCookies(token);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCookies = async () => {
        if (!cookiesJson.trim() || !adminToken) return;
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const parsed = JSON.parse(cookiesJson);
            const res = await axios.post(
                `${API_BASE_URL}/auth/admin-update-cookies?token=${adminToken}`,
                { cookies: parsed }
            );
            if (res.data.status === 'success') {
                setSuccess(`✓ Saved ${res.data.cookie_count} cookies successfully!`);
                setCookiesJson('');
                loadCurrentCookies(adminToken);
                checkAuthStatus();
            }
        } catch (err: any) {
            if (err.message?.includes('JSON')) {
                setError('Invalid JSON format. Please paste valid cookies.');
            } else {
                setError(err.response?.data?.detail || 'Failed to save cookies');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setAdminToken(null);
        localStorage.removeItem('admin_token');
        setPassword('');
    };

    // Not logged in as admin - show password form
    if (!adminToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
                        <p className="text-gray-500 text-sm">Enter password to manage cookies</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Admin password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 mb-4"
                        autoFocus
                    />

                    <button
                        onClick={handleLogin}
                        disabled={isLoading || !password.trim()}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${password.trim() && !isLoading
                                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Verifying...' : 'Login'}
                    </button>

                    <a
                        href="/"
                        className="block text-center text-white/40 text-sm mt-6 hover:text-white/60"
                    >
                        ← Back to App
                    </a>
                </div>
            </div>
        );
    }

    // Logged in as admin - show cookie management
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cookie Manager</h1>
                        <p className="text-gray-500 text-sm">Update TikTok session cookies</p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                            ← App
                        </a>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Status Card */}
                <div className={`p-4 rounded-xl mb-6 ${authStatus?.authenticated
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-yellow-500/10 border border-yellow-500/20'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${authStatus?.authenticated ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                        <span className={authStatus?.authenticated ? 'text-green-400' : 'text-yellow-400'}>
                            {authStatus?.authenticated
                                ? `Authenticated (${authStatus.cookie_count} cookies)`
                                : 'Not configured - paste cookies below'}
                        </span>
                    </div>
                </div>

                {/* Current Cookies */}
                {Object.keys(currentCookies).length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                        <h3 className="text-white/60 text-sm font-medium mb-3">Current Cookies (masked)</h3>
                        <div className="space-y-2">
                            {Object.entries(currentCookies).map(([key, value]) => (
                                <div key={key} className="flex gap-2 text-sm">
                                    <span className="text-cyan-400 font-mono">{key}:</span>
                                    <span className="text-white/50 font-mono truncate">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                        {success}
                    </div>
                )}

                {/* Cookie Input */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <h3 className="text-white font-medium mb-2">Paste New Cookies</h3>
                    <p className="text-gray-500 text-xs mb-3">
                        Export cookies from <a href="https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" className="text-cyan-400 hover:underline">Cookie-Editor</a> extension while logged into TikTok
                    </p>
                    <textarea
                        value={cookiesJson}
                        onChange={(e) => setCookiesJson(e.target.value)}
                        placeholder='[{"name": "sessionid", "value": "..."},...]'
                        className="w-full h-40 bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                </div>

                <button
                    onClick={handleSaveCookies}
                    disabled={isLoading || !cookiesJson.trim()}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${cookiesJson.trim() && !isLoading
                            ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
                            : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                >
                    {isLoading ? 'Saving...' : 'Save Cookies'}
                </button>

                {/* Instructions */}
                <div className="mt-8 p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-3">📋 How to Get Cookies</h3>
                    <ol className="space-y-2 text-gray-400 text-sm">
                        <li className="flex gap-2">
                            <span className="text-cyan-400">1.</span>
                            Install Cookie-Editor browser extension
                        </li>
                        <li className="flex gap-2">
                            <span className="text-cyan-400">2.</span>
                            Go to tiktok.com and login to your account
                        </li>
                        <li className="flex gap-2">
                            <span className="text-cyan-400">3.</span>
                            Click Cookie-Editor icon → Export → Copy
                        </li>
                        <li className="flex gap-2">
                            <span className="text-cyan-400">4.</span>
                            Paste the JSON above and click Save
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
