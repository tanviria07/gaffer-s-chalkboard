/**
 * Frame capture utilities for video analysis
 * Since YouTube iframes have CORS restrictions, we use YouTube thumbnail API
 * as a workaround for frame capture
 */

/**
 * Get YouTube thumbnail URL for a specific timestamp
 * Note: YouTube doesn't provide exact frame thumbnails, but we can use the video thumbnail
 * For more accurate frames, we'd need to use YouTube Data API or capture from a video element
 */
export function getYouTubeThumbnailUrl(videoId: string, timestamp?: number): string {
  // YouTube thumbnail API format: https://img.youtube.com/vi/{videoId}/maxresdefault.jpg
  // For timestamp-specific frames, we'd need YouTube Data API v3
  // For MVP, we'll use the default thumbnail
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Convert image URL to base64
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Capture frame from YouTube video using thumbnail API
 * For MVP: Uses video thumbnail. In production, use YouTube Data API for timestamp-specific frames
 */
export async function captureYouTubeFrame(videoId: string, timestamp: number): Promise<string> {
  try {
    // For MVP, we'll use the default thumbnail
    // In production, you could:
    // 1. Use YouTube Data API to get frame at specific timestamp
    // 2. Use a backend service that can extract frames from YouTube videos
    // 3. Use a canvas-based approach if you have access to the video element
    
    const thumbnailUrl = getYouTubeThumbnailUrl(videoId, timestamp);
    const base64 = await imageUrlToBase64(thumbnailUrl);
    return base64;
  } catch (error) {
    console.error('Error capturing YouTube frame:', error);
    // Return empty string on error - the backend will handle stub responses
    return '';
  }
}

/**
 * Alternative: Create a placeholder frame for testing
 * This creates a simple colored image as base64
 */
export function createPlaceholderFrame(width: number = 640, height: number = 360): string {
  // Create a simple canvas-based placeholder
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Draw a gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(1, '#0d2818');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some text
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Video Frame', width / 2, height / 2);
  }
  
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}
