/**
 * Analogy Agent API Client
 * Handles communication with the backend for NFL analogy generation
 */

export interface AnalogyInput {
  videoId: string;
  timestamp: number;
  caption?: string;
}

export interface AnalogyOutput {
  originalCommentary: string;
  nflAnalogy: string;
  fieldDiagram: 'through-ball' | 'offside-trap' | 'goal' | 'defensive';
  timestamp: number;
  videoId: string;
  cached: boolean;
}

const API_BASE = '/api';

/**
 * Generate NFL analogy for a video timestamp
 */
export async function generateAnalogy(input: AnalogyInput): Promise<AnalogyOutput> {
  try {
    const response = await fetch(`${API_BASE}/generate-analogy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating analogy:', error);
    // Return fallback response
    return {
      originalCommentary: `Soccer action at ${formatTime(input.timestamp)}`,
      nflAnalogy: "This play is like a well-designed offensive scheme — every player has a role, creating space and options.",
      fieldDiagram: 'defensive',
      timestamp: input.timestamp,
      videoId: input.videoId,
      cached: false,
    };
  }
}

/**
 * Fetch all captions for a video
 */
export async function fetchCaptions(videoId: string): Promise<{ text: string; start: number; dur: number }[]> {
  try {
    const response = await fetch(`${API_BASE}/captions/${videoId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.captions || [];
  } catch (error) {
    console.error('Error fetching captions:', error);
    return [];
  }
}

/**
 * Format timestamp as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Text-to-speech for NFL commentary
 */
export function speakText(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.lang = 'en-US';

    // Try to find a good voice (prefer American English)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      v => v.lang === 'en-US' && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex'))
    ) || voices.find(v => v.lang === 'en-US') || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
