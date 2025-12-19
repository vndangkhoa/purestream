export interface Video {
    id: string;
    url: string;
    author: string;
    description?: string;
    thumbnail?: string;  // TikTok video cover image
    cdn_url?: string;    // Direct CDN URL for thin proxy (lower server load)
    views?: number;      // View count
    likes?: number;      // Like count
}

export interface User {
    id: string;
    username: string;
    avatar: string;
}

export interface UserProfile {
    username: string;
    nickname?: string;
    avatar?: string;
    bio?: string;
    followers?: number;
    following?: number;
    likes?: number;
    verified?: boolean;
}
