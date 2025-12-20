import axios from 'axios';
import type { Video } from '../types';
import { API_BASE_URL } from '../config';

interface FeedStats {
  totalLoaded: number;
  loadTime: number;
  batchSize: number;
}

class FeedLoader {
  private stats: FeedStats = {
    totalLoaded: 0,
    loadTime: 0,
    batchSize: 12
  };

  private requestCache: Map<string, { data: Video[]; timestamp: number }> = new Map();
  private CACHE_TTL_MS = 60000;

  async loadFeedWithOptimization(
    fast: boolean = false,
    onProgress?: (videos: Video[]) => void
  ): Promise<Video[]> {
    const startTime = performance.now();

    try {
      if (fast) {
        const videos = await this.loadWithCache('feed-fast');
        onProgress?.(videos);
        return videos;
      }

      const cacheKey = 'feed-full';
      const cached = this.getCached(cacheKey);
      if (cached) {
        onProgress?.(cached);
        return cached;
      }

      const videos = await this.fetchFeed();
      this.setCached(cacheKey, videos);

      onProgress?.(videos);

      this.stats.loadTime = performance.now() - startTime;
      this.stats.totalLoaded = videos.length;

      return videos;
    } catch (error) {
      console.error('Feed load failed:', error);
      return [];
    }
  }

  private async fetchFeed(): Promise<Video[]> {
    const response = await axios.get(`${API_BASE_URL}/feed`);

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((v: any, i: number) => ({
      id: v.id || `video-${i}`,
      url: v.url,
      author: v.author || 'unknown',
      description: v.description || '',
      thumbnail: v.thumbnail,
      cdn_url: v.cdn_url,
      views: v.views,
      likes: v.likes
    }));
  }

  private async loadWithCache(key: string): Promise<Video[]> {
    const cached = this.getCached(key);
    if (cached) return cached;

    const videos = await this.fetchFeed();
    this.setCached(key, videos);
    return videos;
  }

  private getCached(key: string): Video[] | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: Video[]): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getStats(): FeedStats {
    return { ...this.stats };
  }

  clearCache(): void {
    this.requestCache.clear();
  }

  getOptimalBatchSize(): number {
    const connection = (navigator as any).connection;

    if (!connection) {
      return 15;
    }

    const effectiveType = connection.effectiveType;

    switch (effectiveType) {
      case '4g':
        return 20;
      case '3g':
        return 12;
      case '2g':
        return 6;
      default:
        return 15;
    }
  }

  shouldPrefetchThumbnails(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return true;
    return connection.saveData !== true;
  }
}

export const feedLoader = new FeedLoader();
