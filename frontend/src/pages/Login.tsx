import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Check if we have a sessionid from URL (bookmarklet redirect)
    useEffect(() => {
        const sessionIdFromUrl = searchParams.get('sessionid');
        if (sessionIdFromUrl) {
            handleAutoConnect(sessionIdFromUrl);
        }
    }, [searchParams]);

    const handleAutoConnect = async (sessionId: string) => {
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/credentials`, {
                credentials: {
                    http: {
                        cookies: { sessionid: sessionId }
                    }
                }
            });

            if (res.data.status === 'success') {
                navigate('/');
            } else {
                setError('Connection failed. Please try again.');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError('Invalid session. Please try again.');
            setIsLoading(false);
        }
    };

    // Get the current app URL for bookmarklet redirect
    const appUrl = window.location.origin;

    // Bookmarklet code - extracts sessionid and redirects back
    const bookmarkletCode = `javascript:(function(){var c=document.cookie.split(';');var s='';for(var i=0;i<c.length;i++){var p=c[i].trim().split('=');if(p[0]==='sessionid'){s=p[1];break;}}if(s){window.location='${appUrl}/login?sessionid='+encodeURIComponent(s);}else{alert('Please login to TikTok first!');}})();`;

    const copyBookmarklet = () => {
        navigator.clipboard.writeText(bookmarkletCode);
        alert('Bookmarklet code copied! Create a new bookmark and paste this as the URL.');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-white">Connecting to TikTok...</p>
            </div>
        );
    }

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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="max-w-sm mx-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* One-Time Setup (Desktop) */}
                    <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-5 mb-6">
                        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="text-lg">🖥️</span> Desktop Setup (One-Time)
                        </h2>
                        <ol className="text-gray-300 text-sm space-y-2 mb-4">
                            <li className="flex gap-2">
                                <span className="text-cyan-400">1.</span>
                                <span>Drag this button to your bookmarks bar:</span>
                            </li>
                        </ol>

                        {/* Draggable Bookmarklet */}
                        <a
                            href={bookmarkletCode}
                            onClick={(e) => e.preventDefault()}
                            onDragEnd={() => { }}
                            className="inline-block py-2 px-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-lg text-sm cursor-grab active:cursor-grabbing shadow-lg mb-4"
                            title="Drag me to your bookmarks bar!"
                        >
                            📎 Get PureStream
                        </a>

                        <p className="text-gray-500 text-xs">
                            Can't drag? <button onClick={copyBookmarklet} className="text-cyan-400 underline">Copy code</button> and create a bookmark manually.
                        </p>
                    </div>

                    {/* How to Use */}
                    <div className="bg-white/5 rounded-2xl p-5">
                        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="text-lg">📱</span> How to Connect
                        </h2>
                        <ol className="text-gray-300 text-sm space-y-3">
                            <li className="flex gap-3">
                                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">1</div>
                                <span>Go to <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">tiktok.com</a> and login with your account</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">2</div>
                                <span>Click the <strong className="text-pink-400">"📎 Get PureStream"</strong> bookmark</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">3</div>
                                <span>You'll be automatically redirected and logged in!</span>
                            </li>
                        </ol>
                    </div>

                    {/* Note */}
                    <p className="text-gray-600 text-xs text-center mt-6">
                        The bookmarklet securely reads your TikTok session and connects it to PureStream.
                    </p>
                </div>
            </div>
        </div>
    );
};
