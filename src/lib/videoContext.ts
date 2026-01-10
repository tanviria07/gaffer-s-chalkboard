/**
 * Video Context Adapter
 * 
 * Provides a unified interface for accessing video player state
 * across different video providers (YouTube, Vimeo, etc.)
 */

import { VideoSource } from './videoSources';

export interface VideoContext {
  currentTime: number; // seconds
  videoUrl: string;
  provider: VideoSource['type'];
  videoId: string;
}

/**
 * Get current time from YouTube iframe
 * Uses postMessage API to communicate with YouTube player
 */
export async function getYouTubeCurrentTime(iframe: HTMLIFrameElement | null): Promise<number> {
  if (!iframe || !iframe.contentWindow) {
    return 0;
  }

  try {
    // YouTube iframe API requires the player to be initialized
    // For MVP, we'll use a polling approach with postMessage
    // Note: This requires the iframe to have allow="autoplay" and proper CORS
    return new Promise((resolve) => {
      // Try to get time via postMessage (may not work without YouTube API)
      // For MVP, we'll use a simpler approach: track time manually or use a ref
      // This is a stub - in production, you'd use YouTube IFrame API
      resolve(0);
    });
  } catch (error) {
    console.warn('Failed to get YouTube current time:', error);
    return 0;
  }
}

/**
 * Create a VideoContext from current state
 */
export function createVideoContext(
  videoUrl: string,
  videoSource: VideoSource | null,
  currentTime: number
): VideoContext | null {
  if (!videoSource || !videoUrl) {
    return null;
  }

  return {
    currentTime,
    videoUrl,
    provider: videoSource.type,
    videoId: videoSource.videoId,
  };
}
