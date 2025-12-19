import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVnc, setShowVnc] = useState(false);
    const [vncStatus, setVncStatus] = useState('');
    const pollIntervalRef = useRef<number | null>(null);
    const navigate = useNavigate();

    // Check if already authenticated (ssl login check)
    useEffect(() => {
        checkAuth();
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/status`);
            if (res.data.authenticated) {
                navigate('/');
            }
        } catch (err) {
            // Not authenticated
        }
    };

    const getVncUrl = () => {
        const host = window.location.hostname;
        // autoconnect=true, resize=remote (server resizing) for full screen mobile
        return `http://${host}:6080/vnc.html?autoconnect=true&resize=remote&quality=9`;
    };

    const handleVncLogin = async () => {
        setError('');
        setIsLoading(true);
        setVncStatus('Initializing secure browser...');

        try {
            // Start the VNC session (SSL Login flow)
            const res = await axios.post(`${API_BASE_URL}/auth/start-vnc`);

            if (res.data.status === 'started') {
                setShowVnc(true);
                setIsLoading(false);
                setVncStatus('Waiting for login...');

                // Poll for completion
                pollIntervalRef.current = window.setInterval(async () => {
                    try {
                        const checkRes = await axios.get(`${API_BASE_URL}/auth/check-vnc`);

                        if (checkRes.data.logged_in) {
                            clearInterval(pollIntervalRef.current!);
                            setVncStatus('Login successful! Redirecting...');
                            setTimeout(() => navigate('/'), 1000);
                        }
                    } catch (err) {
                        console.error('VNC check error:', err);
                    }
                }, 2000);
            } else {
                setError(res.data.message || 'Failed to start browser');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start login session');
            setIsLoading(false);
        }
    };

    const handleCancelVnc = async () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        try {
            await axios.post(`${API_BASE_URL}/auth/stop-vnc`);
        } catch (err) {
            console.error('Failed to stop VNC:', err);
        }
        setShowVnc(false);
        setVncStatus('');
    };

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
                setError('Invalid session ID.');
            }
        } catch (err: any) {
            setError('Connection failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Full Screen VNC View
    if (showVnc) {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                {/* Floating Control Bar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-medium">Secure Browser Active</span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />
                    <button
                        onClick={handleCancelVnc}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                        Cancel Login
                    </button>
                </div>

                {/* Status Toast */}
                {vncStatus && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur text-white/90 px-4 py-2 rounded-lg text-sm border border-white/10">
                        {vncStatus}
                    </div>
                )}

                {/* Full Screen Iframe */}
                <iframe
                    src={getVncUrl()}
                    className="w-full h-full border-0"
                    style={{ width: '100vw', height: '100vh' }}
                    title="TikTok Secure Login"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col">
            <div className="flex-shrink-0 pt-10 pb-6 px-6 text-center">
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

            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleVncLogin}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all ${isLoading
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.32 0 .6.05.88.13V9.4c-.3-.04-.6-.05-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                                SSL Login with TikTok
                            </>
                        )}
                    </button>
                    <p className="text-gray-600 text-xs text-center mt-3">
                        Launch secure browser to login automatically
                    </p>

                    <div className="flex items-center gap-3 my-8">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-600 text-xs">or enter manually</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-gray-500 text-xs mb-3">
                            Paste your TikTok <code className="text-pink-400 bg-pink-500/20 px-1 rounded">sessionid</code> cookie:
                        </p>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Paste sessionid..."
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-pink-500/50 placeholder:text-gray-600 mb-3"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleManualLogin}
                            disabled={!sessionId.trim() || isLoading}
                            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${sessionId.trim() && !isLoading
                                ? 'bg-white/10 hover:bg-white/20 text-white'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
