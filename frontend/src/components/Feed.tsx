import React, { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import type { Video, UserProfile } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Home, Users, Search, X, Plus } from 'lucide-react';

type ViewState = 'login' | 'loading' | 'feed';
type TabType = 'foryou' | 'following' | 'search';

// Suggested categories for Following tab
const SUGGESTED_CATEGORIES = [
    { id: 'hot_trend', name: '🔥 Hot Trend 2024', query: 'hot trend' },
    { id: 'dance_vn', name: '💃 Gái Xinh Nhảy', query: 'gai xinh nhay' },
    { id: 'sexy_dance', name: '✨ Sexy Dance', query: 'sexy dance vietnam' },
    { id: 'music_remix', name: '🎵 Nhạc Remix TikTok', query: 'nhac remix tiktok' },
    { id: 'kpop_cover', name: '🇰🇷 K-pop Cover', query: 'kpop dance cover' },
    { id: 'comedy', name: '😂 Hài Hước', query: 'hai huoc vietnam' },
];

// Famous Dance TikTokers - 50+ accounts from around the world
const SUGGESTED_ACCOUNTS = [
    // === GLOBAL STARS ===
    { username: '@charlidamelio', label: '👑 Charli D\'Amelio - Queen' },
    { username: '@addisonre', label: '✨ Addison Rae' },
    { username: '@bellapoarch', label: '🎵 Bella Poarch' },
    { username: '@khloekardashian', label: '💫 Khloé Kardashian' },
    { username: '@jfrancesch', label: '💃 Jason Derulo' },
    { username: '@justmaiko', label: '🔥 Michael Le' },
    { username: '@thereal.animations', label: '🎭 Dance Animations' },
    { username: '@willsmith', label: '🌟 Will Smith' },
    // === K-POP & ASIAN ===
    { username: '@lisa_blackpink', label: '🖤💖 LISA BLACKPINK' },
    { username: '@bfrancisco', label: '🇵🇭 Bella Francisco' },
    { username: '@niana_guerrero', label: '🌈 Niana Guerrero' },
    { username: '@ranz', label: '🎤 Ranz Kyle' },
    { username: '@1milliondance', label: '💯 1Million Dance' },
    { username: '@babymonsteryg', label: '🐾 BABYMONSTER' },
    { username: '@enhypen', label: '🎵 ENHYPEN' },
    { username: '@aespaficial', label: '✨ aespa' },
    { username: '@itzy.all.in.us', label: '💪 ITZY' },
    { username: '@straykids_official', label: '🔥 Stray Kids' },
    // === DANCE CREWS ===
    { username: '@thechipmunks', label: '🐿️ The Chipmunks' },
    { username: '@thekinjaz', label: '🎯 The Kinjaz' },
    { username: '@jabbawockeez', label: '🎭 Jabbawockeez' },
    { username: '@worldofdance', label: '🌍 World of Dance' },
    { username: '@dancemoms', label: '👯 Dance Moms' },
    // === VIRAL DANCERS ===
    { username: '@mikimakey', label: '🎀 Miki Makey' },
    { username: '@enola_bedard', label: '🇫🇷 Énola Bédard' },
    { username: '@lizzy_wurst', label: '😊 Lizzy Wurst' },
    { username: '@thepaigeniemann', label: '⭐ Paige Niemann' },
    { username: '@brentrivera', label: '😄 Brent Rivera' },
    { username: '@larray', label: '💅 Larray' },
    { username: '@avani', label: '🖤 Avani' },
    { username: '@noahbeck', label: '🏃 Noah Beck' },
    { username: '@lilhuddy', label: '🎸 Lil Huddy' },
    // === VIETNAMESE DANCE ===
    { username: '@ciin_rubi', label: '👑 CiiN - Lisa of Vietnam' },
    { username: '@hoaa.hanassii', label: '💃 Hoa Hanassii' },
    { username: '@hoa_2309', label: '🔥 Ngô Ngọc Hòa' },
    { username: '@minah.ne', label: '🎵 Minah' },
    { username: '@lebong95', label: '💪 Lê Bống' },
    { username: '@po.trann77', label: '✨ Trần Thanh Tâm' },
    { username: '@gamkami', label: '🎱 Gấm Kami' },
    { username: '@quynhalee', label: '🎮 Quỳnh Alee' },
    { username: '@tieu_hy26', label: '👰 Tiểu Hý' },
    { username: '@changmie', label: '🎤 Changmie' },
    { username: '@vuthuydien', label: '😄 Vũ Thụy Điển' },
    // === CHOREOGRAPHERS ===
    { username: '@chloearnold', label: '🎬 Chloe Arnold' },
    { username: '@alexis_beauregard', label: '🌟 Alexis Beauregard' },
    { username: '@mattiapolibio', label: '⭐ Mattia Polibio' },
    { username: '@jawsh685', label: '🎧 Jawsh 685' },
    { username: '@daviddooboy', label: '🕺 David Vu' },
    // === FUN & COMEDY DANCE ===
    { username: '@domainichael', label: '😂 Domaini Michael' },
    { username: '@jailifebymike', label: '💃 Jai Life' },
    { username: '@dancewithjulian', label: '🎭 Julian' },
    { username: '@leiasfanpage', label: '💖 Leia' },
    { username: '@taylerholder', label: '🔥 Tayler Holder' },
];


// Inspirational quotes for loading states
const INSPIRATION_QUOTES = [
    { text: "Dance like nobody's watching", author: "William W. Purkey" },
    { text: "Life is short, make every moment count", author: "Unknown" },
    { text: "Create the things you wish existed", author: "Unknown" },
    { text: "Be yourself; everyone else is taken", author: "Oscar Wilde" },
    { text: "Stay hungry, stay foolish", author: "Steve Jobs" },
    { text: "The only way to do great work is to love what you do", author: "Steve Jobs" },
    { text: "Dream big, start small", author: "Unknown" },
    { text: "Creativity takes courage", author: "Henri Matisse" },
];

// NOTE: Keyword search is now handled by the backend /api/user/search endpoint

export const Feed: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('login');
    const [activeTab, setActiveTab] = useState<TabType>('foryou');
    const [videos, setVideos] = useState<Video[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Following state
    const [following, setFollowing] = useState<string[]>([]);
    const [newFollowInput, setNewFollowInput] = useState('');

    // Suggested profiles with real data
    const [suggestedProfiles, setSuggestedProfiles] = useState<UserProfile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [suggestedLimit, setSuggestedLimit] = useState(12); // Lazy load - start with 12

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<Video[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Global mute state - persists across video scrolling
    const [isMuted, setIsMuted] = useState(true);

    // ========== SWIPE LOGIC ==========
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (activeTab === 'foryou') setActiveTab('following');
            else if (activeTab === 'following') setActiveTab('search');
        }
        if (isRightSwipe) {
            if (activeTab === 'search') setActiveTab('following');
            else if (activeTab === 'following') setActiveTab('foryou');
        }
    };

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Load following list when authenticated
    useEffect(() => {
        if (viewState === 'feed') {
            loadFollowing();
        }
    }, [viewState]);

    // Load suggested profiles when switching to Following tab
    useEffect(() => {
        if (activeTab === 'following' && suggestedProfiles.length === 0 && !loadingProfiles) {
            loadSuggestedProfiles();
        }
    }, [activeTab]);

    // Keyboard arrow navigation for desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle when in feed view and not typing in an input
            if (viewState !== 'feed') return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (activeTab === 'foryou') setActiveTab('following');
                else if (activeTab === 'following') setActiveTab('search');
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (activeTab === 'search') setActiveTab('following');
                else if (activeTab === 'following') setActiveTab('foryou');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, viewState]);

    const loadSuggestedProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const usernames = SUGGESTED_ACCOUNTS.map(a => a.username.replace('@', '')).join(',');
            const res = await axios.get(`${API_BASE_URL}/user/profiles?usernames=${usernames}`);
            setSuggestedProfiles(res.data);
        } catch (err) {
            console.error('Failed to load profiles:', err);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const checkAuthStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/status`);
            if (res.data.authenticated) {
                loadFeed();
            }
        } catch (err) {
            console.log('Not authenticated');
        }
    };

    const loadFollowing = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/following`);
            setFollowing(res.data);
        } catch (err) {
            console.error('Failed to load following');
        }
    };

    const handleFollow = async (username: string) => {
        const cleanUsername = username.replace('@', '');

        if (following.includes(cleanUsername)) {
            // Unfollow
            await axios.delete(`${API_BASE_URL}/following/${cleanUsername}`);
            setFollowing(prev => prev.filter(u => u !== cleanUsername));
        } else {
            // Follow
            await axios.post(`${API_BASE_URL}/following`, { username: cleanUsername });
            setFollowing(prev => [...prev, cleanUsername]);
        }
    };

    const handleAddFollow = async () => {
        if (!newFollowInput.trim()) return;
        await handleFollow(newFollowInput);
        setNewFollowInput('');
    };

    const handleBrowserLogin = async () => {
        setViewState('loading');
        setError(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/browser-login`);
            if (res.data.status === 'success') {
                loadFeed();
            } else {
                setError(res.data.message || 'Login failed');
                setViewState('login');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed');
            setViewState('login');
        }
    };

    const handleJsonLogin = async () => {
        if (!jsonInput.trim()) {
            setError('Please paste your credentials');
            return;
        }

        setViewState('loading');
        setError(null);

        try {
            const credentials = JSON.parse(jsonInput);
            await axios.post(`${API_BASE_URL}/auth/credentials`, { credentials });
            loadFeed();
        } catch (err: any) {
            setError(err.message || 'Invalid JSON format');
            setViewState('login');
        }
    };

    const loadFeed = async () => {
        setViewState('loading');
        setError(null);

        try {
            // Stage 1: Fast Load (0 scrolls, roughly 5-10 videos)
            const fastRes = await axios.get(`${API_BASE_URL}/feed?fast=true`);

            let initialVideos: Video[] = [];

            if (Array.isArray(fastRes.data) && fastRes.data.length > 0) {
                initialVideos = fastRes.data.map((v: any, i: number) => ({
                    id: v.id || `video-${i}`,
                    url: v.url,
                    author: v.author || 'unknown',
                    description: v.description || '',
                    thumbnail: v.thumbnail,
                    cdn_url: v.cdn_url,
                    views: v.views,
                    likes: v.likes
                }));
                setVideos(initialVideos);
                setViewState('feed');
            }

            // Stage 2: Background Load (Full batch)
            // Silent fetch to get more videos without blocking UI
            // We only do this if we got some videos initially, OR if initial failed
            axios.get(`${API_BASE_URL}/feed`).then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const moreVideos = res.data.map((v: any, i: number) => ({
                        id: v.id || `video-full-${i}`,
                        url: v.url,
                        author: v.author || 'unknown',
                        description: v.description || '',
                        thumbnail: v.thumbnail,
                        cdn_url: v.cdn_url,
                        views: v.views,
                        likes: v.likes
                    }));

                    // Deduplicate and append
                    setVideos(prev => {
                        const existingIds = new Set(prev.map(v => v.id));
                        const distinctNew = moreVideos.filter((v: Video) => !existingIds.has(v.id));
                        return [...prev, ...distinctNew];
                    });

                    // If we were in login/error state, switch to feed now
                    setViewState(prev => prev === 'feed' ? 'feed' : 'feed');
                }
            }).catch(console.error); // Silent error for background fetch

            if (initialVideos.length === 0) {
                // If fast fetch failed to get videos, we wait for background...
                // But simplified: show 'No videos' only if fast returned empty
                // The background fetch will update UI if it finds something
                if (!initialVideos.length) {
                    // Keep loading state until background finishes? 
                    // Or show error? For now, let's just let the user wait or see empty
                    // Ideally we'd have a 'fetching more' indicator
                }
            }

        } catch (err: any) {
            console.error('Fast feed failed', err);
            // Fallback to full fetch if fast fails
            axios.get(`${API_BASE_URL}/feed`).then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const mapped = res.data.map((v: any, i: number) => ({
                        id: v.id || `video-fallback-${i}`,
                        url: v.url,
                        author: v.author || 'unknown',
                        description: v.description || '',
                        thumbnail: v.thumbnail,
                        cdn_url: v.cdn_url,
                        views: v.views,
                        likes: v.likes
                    }));
                    setVideos(mapped);
                    setViewState('feed');
                } else {
                    setError('No videos found.');
                    setViewState('login');
                }
            }).catch(e => {
                setError(e.response?.data?.detail || 'Failed to load feed');
                setViewState('login');
            });
        }
    };

    const [isFetching, setIsFetching] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, clientHeight } = containerRef.current;
            const index = Math.round(scrollTop / clientHeight);
            if (index !== currentIndex) {
                setCurrentIndex(index);
            }

            // Preemptive fetch at 60%
            const watchedPercent = videos.length > 0 ? (index + 1) / videos.length : 0;
            if (watchedPercent >= 0.6 && hasMore && !isFetching && videos.length > 0) {
                loadMoreVideos();
            }
        }
    };

    const loadMoreVideos = async () => {
        if (isFetching || !hasMore) return;
        setIsFetching(true);

        try {
            const res = await axios.get(`${API_BASE_URL}/feed`);

            if (Array.isArray(res.data) && res.data.length > 0) {
                const newVideos = res.data.map((v: any, i: number) => ({
                    id: v.id || `video-new-${Date.now()}-${i}`,
                    url: v.url,
                    author: v.author || 'unknown',
                    description: v.description || ''
                }));

                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const unique = newVideos.filter((v: any) => !existingIds.has(v.id));
                    if (unique.length === 0) setHasMore(false);
                    return [...prev, ...unique];
                });
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Failed to load more:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleLogout = async () => {
        await axios.post(`${API_BASE_URL}/auth/logout`);
        setVideos([]);
        setViewState('login');
    };

    // Direct username search - bypasses state update delay
    const searchByUsername = async (username: string) => {
        setSearchInput(`@${username}`);
        setActiveTab('search');
        setIsSearching(true);
        setSearchResults([]);

        try {
            const res = await axios.get(`${API_BASE_URL}/user/videos?username=${username}&limit=12`);
            const userVideos = res.data.videos as Video[];

            if (userVideos.length > 0) {
                setSearchResults(userVideos);
            } else {
                setSearchResults([{
                    id: `no-videos-${username}`,
                    url: '',
                    author: username,
                    description: `No videos found for @${username}`
                }]);
            }
        } catch (err) {
            console.error('Error fetching user videos:', err);
            setSearchResults([{
                id: `error-${username}`,
                url: '',
                author: username,
                description: `Could not fetch videos`
            }]);
        } finally {
            setIsSearching(false);
        }
    };

    // Direct keyword search - bypasses state update delay
    const searchByKeyword = async (keyword: string) => {
        setSearchInput(keyword);
        setActiveTab('search');
        setIsSearching(true);
        setSearchResults([]);

        try {
            const res = await axios.get(`${API_BASE_URL}/user/search?query=${encodeURIComponent(keyword)}&limit=12`);
            const searchVideos = res.data.videos as Video[];

            if (searchVideos.length > 0) {
                setSearchResults(searchVideos);
            } else {
                setSearchResults([{
                    id: `no-results`,
                    url: '',
                    author: 'search',
                    description: `No videos found for "${keyword}"`
                }]);
            }
        } catch (err) {
            console.error('Error searching:', err);
            setSearchResults([{
                id: `error-search`,
                url: '',
                author: 'search',
                description: `Search failed`
            }]);
        } finally {
            setIsSearching(false);
        }
    };
    const handleSearch = async () => {
        if (!searchInput.trim()) return;

        setIsSearching(true);
        let input = searchInput.trim();
        const results: Video[] = [];

        // ========== PARSE INPUT TYPE ==========

        // Type 1: Full TikTok video URL (tiktok.com/@user/video/123)
        const videoUrlMatch = input.match(/tiktok\.com\/@([\w.]+)\/video\/(\d+)/);
        if (videoUrlMatch) {
            const [, author, videoId] = videoUrlMatch;
            results.push({
                id: videoId,
                url: input.startsWith('http') ? input : `https://www.${input}`,
                author: author,
                description: `Video ${videoId} by @${author}`
            });
        }

        // Type 2: Short share links (vm.tiktok.com, vt.tiktok.com)
        else if (input.includes('vm.tiktok.com') || input.includes('vt.tiktok.com')) {
            // These are short links - add as-is, backend will resolve
            const shortId = input.split('/').pop() || 'unknown';
            results.push({
                id: `short-${shortId}`,
                url: input.startsWith('http') ? input : `https://${input}`,
                author: 'unknown',
                description: 'Shared TikTok video (click to watch)'
            });
        }

        // Type 3: Username (@user or just user) - Fetch user's videos
        else if (input.startsWith('@') || /^[\w.]+$/.test(input)) {
            const username = input.replace('@', '');

            // Show loading state
            results.push({
                id: `loading-${username}`,
                url: '',
                author: username,
                description: `⏳ Loading videos from @${username}...`
            });
            setSearchResults(results);

            // Fetch user's videos from backend
            try {
                const res = await axios.get(`${API_BASE_URL}/user/videos?username=${username}&limit=12`);
                const userVideos = res.data.videos as Video[];

                if (userVideos.length > 0) {
                    // Replace loading with actual videos
                    setSearchResults(userVideos);
                    setIsSearching(false);
                    return;
                } else {
                    // No videos found
                    setSearchResults([{
                        id: `no-videos-${username}`,
                        url: '',
                        author: username,
                        description: `No videos found for @${username}`
                    }]);
                    setIsSearching(false);
                    return;
                }
            } catch (err) {
                console.error('Error fetching user videos:', err);
                // Fallback message
                setSearchResults([{
                    id: `error-${username}`,
                    url: '',
                    author: username,
                    description: `Could not fetch videos`
                }]);
                setIsSearching(false);
                return;
            }
        }

        // Type 4: Hashtag (#trend) or Generic search term - use search API
        else {
            // Show loading for keyword search
            results.push({
                id: `loading-search`,
                url: '',
                author: 'search',
                description: `Searching for "${input}"...`
            });
            setSearchResults(results);

            // Fetch videos using keyword search API
            try {
                const res = await axios.get(`${API_BASE_URL}/user/search?query=${encodeURIComponent(input)}&limit=12`);
                const searchVideos = res.data.videos as Video[];

                if (searchVideos.length > 0) {
                    setSearchResults(searchVideos);
                    setIsSearching(false);
                    return;
                } else {
                    setSearchResults([{
                        id: `no-results`,
                        url: '',
                        author: 'search',
                        description: `No videos found for "${input}"`
                    }]);
                    setIsSearching(false);
                    return;
                }
            } catch (err) {
                console.error('Error searching:', err);
                setSearchResults([{
                    id: `error-search`,
                    url: '',
                    author: 'search',
                    description: `Search failed. Try a different term.`
                }]);
                setIsSearching(false);
                return;
            }
        }

        setSearchResults(results);
        setIsSearching(false);

        // Log for debugging
        console.log('Search input:', input);
        console.log('Search results:', results);
    };

    // ========== LOGIN VIEW ==========
    if (viewState === 'login') {
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
                        <div className="mb-4">
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='Paste your cookie JSON here...'
                                className="w-full h-32 bg-black/60 border-2 border-white/10 rounded-2xl p-4 text-white text-sm font-mono resize-none focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
                            />
                        </div>

                        {/* Connect Button */}
                        <button
                            onClick={handleJsonLogin}
                            disabled={!jsonInput.trim()}
                            className={`w-full py-4 text-white font-semibold rounded-2xl transition-all transform active:scale-[0.98] shadow-lg text-base ${jsonInput.trim()
                                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 shadow-pink-500/20'
                                : 'bg-gray-700 cursor-not-allowed'
                                }`}
                        >
                            Connect to TikTok
                        </button>

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
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 flex items-center justify-center gap-2"
                            >
                                <span>{showAdvanced ? '▲' : '▼'}</span>
                                <span>Desktop Browser Login</span>
                            </button>

                            {showAdvanced && (
                                <div className="mt-3 p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-xs text-center mb-3">
                                        ⚠️ Only works on local machines with a display
                                    </p>
                                    <button
                                        onClick={handleBrowserLogin}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
                                    >
                                        Open TikTok Login Window
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========== LOADING VIEW ==========
    if (viewState === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col items-center justify-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-500/30 via-pink-500/30 to-cyan-500/30 animate-pulse rounded-full scale-150" />
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute w-16 h-16 bg-cyan-400 rounded-xl rotate-12 animate-pulse" />
                        <div className="absolute w-16 h-16 bg-pink-500 rounded-xl -rotate-12 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute w-16 h-16 bg-white rounded-xl flex items-center justify-center z-10">
                            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <p className="text-white/70 text-sm animate-pulse">Connecting to TikTok...</p>
            </div>
        );
    }



    // ========== FEED VIEW WITH TABS ==========
    return (
        <div
            className="relative w-full h-screen bg-black overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Tab Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-4 pb-2 bg-gradient-to-b from-black via-black/80 to-transparent">
                <div className="flex gap-1 bg-white/10 backdrop-blur-md rounded-full p-1">
                    <button
                        onClick={() => setActiveTab('foryou')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'foryou'
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white'
                            }`}
                        title="For You"
                    >
                        <Home size={16} />
                        <span className="hidden md:inline">For You</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'following'
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white'
                            }`}
                        title="Following"
                    >
                        <Users size={16} />
                        <span className="hidden md:inline">Following</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'search'
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white'
                            }`}
                        title="Search"
                    >
                        <Search size={16} />
                        <span className="hidden md:inline">Search</span>
                    </button>
                </div>
            </div>

            {/* Logout Button - Left Corner Icon */}
            <button
                onClick={handleLogout}
                className="absolute top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Logout"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>

            {/* FOR YOU TAB */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out ${activeTab === 'foryou'
                ? 'translate-x-0 opacity-100'
                : activeTab === 'following' || activeTab === 'search'
                    ? '-translate-x-full opacity-0 pointer-events-none'
                    : 'translate-x-full opacity-0 pointer-events-none'
                }`}>
                {/* Video Counter */}
                <div className="absolute bottom-6 right-4 z-40 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
                    <span className="text-xs text-white/60 font-medium">
                        {currentIndex + 1} / {videos.length}
                        {hasMore && <span className="text-cyan-400 ml-1">+</span>}
                    </span>
                </div>

                {/* Loading Indicator */}
                {isFetching && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                        <span className="text-xs text-white/70">Loading more...</span>
                    </div>
                )}

                {/* Video Feed */}
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide pt-14"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {videos.map((video, index) => (
                        <div key={video.id} className="w-full h-screen snap-start snap-always bg-black">
                            {Math.abs(index - currentIndex) <= 1 ? (
                                <VideoPlayer
                                    video={video}
                                    isActive={activeTab === 'foryou' && index === currentIndex}
                                    isFollowing={following.includes(video.author)}
                                    onFollow={handleFollow}
                                    onAuthorClick={(author) => searchByUsername(author)}
                                    isMuted={isMuted}
                                    onMuteToggle={() => setIsMuted(prev => !prev)}
                                />
                            ) : (
                                /* Lightweight Placeholder */
                                <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                                    {video.thumbnail ? (
                                        <>
                                            <img
                                                src={video.thumbnail}
                                                className="w-full h-full object-cover opacity-30 blur-xl scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-10 h-10 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* FOLLOWING TAB - Minimal Style */}
            <div className={`absolute inset-0 w-full h-full pt-16 px-4 pb-6 overflow-y-auto transition-all duration-300 ease-out ${activeTab === 'following'
                ? 'translate-x-0 opacity-100'
                : activeTab === 'foryou'
                    ? 'translate-x-full opacity-0 pointer-events-none'
                    : '-translate-x-full opacity-0 pointer-events-none'
                }`}>
                <div className="max-w-lg mx-auto">

                    {/* Minimal Add Input */}
                    <div className="relative mb-8">
                        <input
                            type="text"
                            value={newFollowInput}
                            onChange={(e) => setNewFollowInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddFollow()}
                            placeholder="Add @username to follow..."
                            className="w-full bg-transparent border-b-2 border-white/20 focus:border-white/60 px-0 py-4 text-white text-lg focus:outline-none transition-colors placeholder:text-white/30"
                        />
                        <button
                            onClick={handleAddFollow}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* My Following - Minimal chips */}
                    {following.length > 0 && (
                        <div className="mb-10">
                            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Following</p>
                            <div className="flex flex-wrap gap-2">
                                {following.map(user => (
                                    <div key={user} className="flex items-center gap-2 bg-white/5 rounded-full pl-3 pr-1 py-1">
                                        <button
                                            onClick={() => searchByUsername(user)}
                                            className="text-white/80 text-sm hover:text-white transition-colors"
                                        >
                                            @{user}
                                        </button>
                                        <button
                                            onClick={() => handleFollow(user)}
                                            className="p-1 text-white/30 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending - 2 columns */}
                    <div className="mb-10">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Trending</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SUGGESTED_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => searchByKeyword(cat.query)}
                                    className="bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2.5 text-left text-white/70 hover:text-white text-sm transition-colors"
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Accounts - Compact avatars */}
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Suggested</p>

                        {loadingProfiles && (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin"></div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-4">
                            {(suggestedProfiles.length > 0 ? suggestedProfiles : SUGGESTED_ACCOUNTS.map(a => ({ username: a.username.replace('@', ''), nickname: a.label }))).slice(0, suggestedLimit).map((profile: UserProfile | { username: string; nickname: string }) => {
                                const username = 'username' in profile ? profile.username : '';

                                return (
                                    <button
                                        key={username}
                                        onClick={() => searchByUsername(username)}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        {'avatar' in profile && profile.avatar ? (
                                            <img
                                                src={profile.avatar}
                                                alt={username}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-pink-500/50 transition-colors"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-lg font-medium group-hover:bg-white/20 transition-colors">
                                                {username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-white/50 text-xs truncate w-full text-center group-hover:text-white/80">
                                            @{username.slice(0, 8)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Load More Button */}
                        {suggestedLimit < SUGGESTED_ACCOUNTS.length && (
                            <button
                                onClick={() => setSuggestedLimit(prev => Math.min(prev + 12, SUGGESTED_ACCOUNTS.length))}
                                className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-sm transition-colors"
                            >
                                Show More ({SUGGESTED_ACCOUNTS.length - suggestedLimit} remaining)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* SEARCH TAB - Minimal Style matching Following */}
            <div className={`absolute inset-0 w-full h-full pt-16 px-4 pb-6 overflow-y-auto transition-all duration-300 ease-out ${activeTab === 'search'
                ? 'translate-x-0 opacity-100'
                : activeTab === 'following' || activeTab === 'foryou'
                    ? 'translate-x-full opacity-0 pointer-events-none'
                    : '-translate-x-full opacity-0 pointer-events-none'
                }`}>
                <div className="max-w-lg mx-auto">
                    {/* Minimal Search Input */}
                    <div className="relative mb-8">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search..."
                            className="w-full bg-transparent border-b-2 border-white/20 focus:border-white/60 px-0 py-4 text-white text-lg focus:outline-none transition-colors placeholder:text-white/30"
                            disabled={isSearching}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {isSearching ? (
                                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            )}
                        </button>
                        {/* Subtle hint dropdown */}
                        <p className="text-white/20 text-xs mt-2">@username · video link · keyword</p>
                    </div>

                    {/* Loading Animation with Quote */}
                    {isSearching && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-10 h-10 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-white/60 text-sm italic text-center max-w-xs">
                                "{INSPIRATION_QUOTES[Math.floor(Math.random() * INSPIRATION_QUOTES.length)].text}"
                            </p>
                            <p className="text-white/30 text-xs mt-2">
                                — {INSPIRATION_QUOTES[Math.floor(Math.random() * INSPIRATION_QUOTES.length)].author}
                            </p>
                        </div>
                    )}

                    {/* Empty State - Following-style layout */}
                    {!isSearching && searchResults.length === 0 && (
                        <>
                            {/* Trending - 2 columns */}
                            <div className="mb-10">
                                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Trending</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {SUGGESTED_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => searchByKeyword(cat.query)}
                                            className="bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2.5 text-left text-white/70 hover:text-white text-sm transition-colors"
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Search - Account avatars */}
                            <div>
                                <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Popular</p>
                                <div className="grid grid-cols-4 gap-4">
                                    {(suggestedProfiles.length > 0 ? suggestedProfiles : SUGGESTED_ACCOUNTS.map(a => ({ username: a.username.replace('@', '') }))).slice(0, 4).map((profile: UserProfile | { username: string }) => {
                                        const username = 'username' in profile ? profile.username : '';
                                        return (
                                            <button
                                                key={username}
                                                onClick={() => searchByUsername(username)}
                                                className="flex flex-col items-center gap-2 group"
                                            >
                                                {'avatar' in profile && profile.avatar ? (
                                                    <img
                                                        src={profile.avatar}
                                                        alt={username}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-pink-500/50 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-white/20 transition-colors">
                                                        {username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-white/40 text-xs truncate w-full text-center group-hover:text-white/60">
                                                    @{username.slice(0, 6)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Search Results */}
                    {!isSearching && searchResults.length > 0 && (
                        <div className="mt-8">
                            {/* Results Header with Creator & Follow */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-white/50 text-sm">{searchResults.length} videos</span>
                                    {searchResults[0]?.author && searchResults[0].author !== 'search' && (
                                        <button
                                            onClick={() => handleFollow(searchResults[0].author)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${following.includes(searchResults[0].author)
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                }`}
                                        >
                                            {following.includes(searchResults[0].author) ? 'Following' : '+ Follow @' + searchResults[0].author}
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Play All Button */}
                                    <button
                                        onClick={() => {
                                            const playableVideos = searchResults.filter(v => v.url);
                                            if (playableVideos.length > 0) {
                                                setVideos(playableVideos);
                                                setCurrentIndex(0);
                                                setActiveTab('foryou');
                                            }
                                        }}
                                        className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full text-xs font-medium text-white"
                                    >
                                        ▶ Play All
                                    </button>
                                    <button
                                        onClick={() => setSearchResults([])}
                                        className="text-white/30 text-xs hover:text-white/60"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Video Grid */}
                            <div className="grid grid-cols-3 gap-1">
                                {searchResults.map((video) => (
                                    <div
                                        key={video.id}
                                        className={`relative aspect-[9/16] overflow-hidden group ${video.url
                                            ? 'cursor-pointer'
                                            : 'opacity-40'
                                            }`}
                                        onClick={() => {
                                            if (!video.url) return;
                                            // Load ALL search results into the feed, starting from clicked video
                                            const playableVideos = searchResults.filter(v => v.url);
                                            if (playableVideos.length > 0) {
                                                setVideos(playableVideos);
                                                // Set current index to the clicked video's position in playable videos
                                                const newIndex = playableVideos.findIndex(v => v.id === video.id);
                                                setCurrentIndex(newIndex >= 0 ? newIndex : 0);
                                                setActiveTab('foryou');
                                            }
                                        }}
                                    >
                                        {/* Thumbnail with loading placeholder */}
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.author}
                                                className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                {video.url ? (
                                                    <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="text-2xl">ℹ️</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Overlay with author */}
                                        {video.url && (
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-white text-xs truncate">@{video.author}</p>
                                            </div>
                                        )}

                                        {/* Message for non-playable */}
                                        {!video.url && video.description && (
                                            <div className="absolute inset-0 flex items-center justify-center p-2">
                                                <p className="text-white/60 text-xs text-center">{video.description}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
