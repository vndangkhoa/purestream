import { videoCache } from './videoCache';
import type { Video } from '../types';

interface PrefetchConfig {
  lookahead: number;
  concurrency: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  lookahead: 2,
  concurrency: 1,
  timeoutMs: 30000
};

class VideoPrefetcher {
  private prefetchQueue: Set<string> = new Set();
  private config: PrefetchConfig;
  private isInitialized = false;

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    await videoCache.init();
    this.isInitialized = true;
  }

  async prefetchNext(
    videos: Video[],
    currentIndex: number
  ): Promise<void> {
    if (!this.isInitialized) await this.init();

    const endIndex = Math.min(
      currentIndex + this.config.lookahead,
      videos.length
    );

    const toPrefetch = videos
      .slice(currentIndex + 1, endIndex)
      .filter((v) => v.url && !this.prefetchQueue.has(v.id));

    for (const video of toPrefetch) {
      this.prefetchQueue.add(video.id);
      this.prefetchVideo(video).catch(console.error);
    }
  }

  private async prefetchVideo(video: Video): Promise<void> {
    if (!video.url) return;

    const cached = await videoCache.get(video.url);
    if (cached) {
      this.prefetchQueue.delete(video.id);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs
      );

      const response = await fetch(video.url, {
        signal: controller.signal,
        headers: { Range: 'bytes=0-1048576' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        await videoCache.set(video.url, blob);
      }
    } catch (error) {
      console.debug(`Prefetch failed for ${video.id}:`, error);
    } finally {
      this.prefetchQueue.delete(video.id);
    }
  }

  clearQueue(): void {
    this.prefetchQueue.clear();
  }

  getQueueSize(): number {
    return this.prefetchQueue.size;
  }
}

export const videoPrefetcher = new VideoPrefetcher();
