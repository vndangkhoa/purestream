import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const navigate = useNavigate();

    const openTikTokLogin = () => {
        // Open TikTok login in new tab
        window.open('https://www.tiktok.com/login', '_blank');
        setStep(2);
    };

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
                setError(res.data.message || 'Connection failed.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid session ID. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col">
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Open TikTok */}
                    <div className={`transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                            <span className="text-white font-medium">Login to TikTok</span>
                        </div>
                        <button
                            onClick={openTikTokLogin}
                            className="w-full py-4 bg-black border-2 border-white/20 hover:border-white/40 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                            Open TikTok Login
                        </button>
                        <p className="text-gray-500 text-xs text-center mt-2">Opens in new tab - login with your account</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center my-4">
                        <div className="text-gray-600">↓</div>
                    </div>

                    {/* Step 2: Get Session ID */}
                    <div className={`transition-opacity ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${step === 2 ? 'bg-pink-500' : 'bg-gray-600'}`}>2</div>
                            <span className="text-white font-medium">Copy your Session ID</span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 mb-4 text-sm">
                            <p className="text-gray-300 mb-2">After logging in on TikTok:</p>
                            <ol className="text-gray-400 space-y-1 ml-4 list-decimal text-xs">
                                <li>Press <code className="bg-black/50 px-1 rounded">F12</code> (or right-click → Inspect)</li>
                                <li>Go to <strong className="text-white">Application</strong> → <strong className="text-white">Cookies</strong></li>
                                <li>Find <code className="bg-cyan-500/20 text-cyan-400 px-1 rounded">sessionid</code> and copy its value</li>
                            </ol>
                        </div>

                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Paste sessionid value here..."
                            className="w-full bg-black/60 border-2 border-white/10 rounded-xl p-4 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600 mb-4"
                            disabled={isLoading}
                        />

                        <button
                            onClick={handleConnect}
                            disabled={!sessionId.trim() || isLoading}
                            className={`w-full py-4 text-white font-semibold rounded-xl transition-all text-base ${sessionId.trim() && !isLoading
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
                    </div>

                    {/* Help */}
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <a
                            href="https://www.youtube.com/results?search_query=how+to+find+tiktok+sessionid+cookie+chrome"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-xs underline hover:text-gray-400"
                        >
                            Need help? Watch a tutorial →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
