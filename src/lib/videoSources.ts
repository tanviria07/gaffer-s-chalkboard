/**
 * Video Source Abstraction
 * 
 * This module provides an extensible architecture for supporting multiple video sources.
 * Currently supports YouTube, with easy extension points for Vimeo, uploads, etc.
 */

export type VideoSourceType = 'youtube' | 'vimeo' | 'upload' | 'unknown';

export interface VideoSource {
  type: VideoSourceType;
  videoId: string;
  url: string;
}

export interface VideoSourceProvider {
  /**
   * Check if a URL belongs to this provider
   */
  canHandle(url: string): boolean;

  /**
   * Extract the video ID from a URL
   */
  extractVideoId(url: string): string | null;

  /**
   * Get the provider type
   */
  getType(): VideoSourceType;

  /**
   * Validate if a URL is valid for this provider
   */
  validate(url: string): boolean;
}

/**
 * YouTube Video Provider
 */
class YouTubeProvider implements VideoSourceProvider {
  getType(): VideoSourceType {
    return 'youtube';
  }

  canHandle(url: string): boolean {
    return this.validate(url);
  }

  validate(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Support various YouTube URL formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - https://m.youtube.com/watch?v=VIDEO_ID
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)/;
    return youtubeRegex.test(url);
  }

  extractVideoId(url: string): string | null {
    if (!this.validate(url)) {
      return null;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*&v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}

/**
 * Generic Video Provider - accepts any valid URL
 */
class GenericVideoProvider implements VideoSourceProvider {
  getType(): VideoSourceType {
    return 'unknown';
  }

  canHandle(url: string): boolean {
    return this.validate(url);
  }

  validate(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Accept any valid HTTP/HTTPS URL
    try {
      const urlObj = new URL(url.trim());
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  extractVideoId(url: string): string | null {
    // For generic URLs, use the full URL as the "video ID"
    // This allows the backend to process any video URL
    if (this.validate(url)) {
      return url.trim();
    }
    return null;
  }
}

/**
 * Video Source Manager
 * Manages multiple video source providers
 */
class VideoSourceManager {
  private providers: VideoSourceProvider[] = [];

  constructor() {
    // Register default providers (YouTube first, then generic)
    this.registerProvider(new YouTubeProvider());
    this.registerProvider(new GenericVideoProvider());
  }

  registerProvider(provider: VideoSourceProvider): void {
    this.providers.push(provider);
  }

  /**
   * Parse a URL and return the corresponding VideoSource
   */
  parseUrl(url: string): VideoSource | null {
    if (!url || !url.trim()) {
      return null;
    }

    const trimmedUrl = url.trim();

    // Find a provider that can handle this URL
    for (const provider of this.providers) {
      if (provider.canHandle(trimmedUrl)) {
        const videoId = provider.extractVideoId(trimmedUrl);
        if (videoId) {
          return {
            type: provider.getType(),
            videoId,
            url: trimmedUrl,
          };
        }
      }
    }

    return null;
  }

  /**
   * Validate if a URL is supported
   */
  isValidUrl(url: string): boolean {
    return this.parseUrl(url) !== null;
  }
}

// Export singleton instance
export const videoSourceManager = new VideoSourceManager();

// Export provider classes for testing/extending
export { YouTubeProvider, GenericVideoProvider };
