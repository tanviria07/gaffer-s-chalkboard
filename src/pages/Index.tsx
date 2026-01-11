import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import VideoZone from '@/components/VideoZone';
import TacticsDiagram from '@/components/TacticsDiagram';
import AudioButton from '@/components/AudioButton';
import { videoSourceManager } from '@/lib/videoSources';
import { generateAnalogy, AnalogyOutput, speakText, stopSpeaking } from '@/lib/analogyAgent';
import { MatchEvent } from '@/data/matchData';

interface AnalysisState {
  commentary: string;
  nflAnalogy: string;
  fieldDiagram: MatchEvent['diagram'];
  isLoading: boolean;
  timestamp: number;
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastFetchedTime = useRef<number>(-1);

  const [analysis, setAnalysis] = useState<AnalysisState>({
    commentary: "Paste a YouTube video URL to see real-time soccer analysis with NFL analogies.",
    nflAnalogy: "NFL analogies will appear here as you watch the video.",
    fieldDiagram: 'defensive',
    isLoading: false,
    timestamp: 0,
  });

  // Extract video ID when URL changes
  useEffect(() => {
    if (videoUrl) {
      const parsed = videoSourceManager.parseUrl(videoUrl);
      if (parsed && parsed.type === 'youtube') {
        setVideoId(parsed.videoId);
      } else {
        setVideoId(null);
      }
    } else {
      setVideoId(null);
    }
  }, [videoUrl]);

  // Fetch analogy when timestamp changes (debounced)
  const fetchAnalogy = useCallback(async (timestamp: number) => {
    if (!videoId) return;

    // Only fetch if we've moved more than 10 seconds from last fetch (reduced frequency)
    const roundedTime = Math.floor(timestamp / 10) * 10;
    if (Math.abs(roundedTime - lastFetchedTime.current) < 10) {
      return;
    }

    lastFetchedTime.current = roundedTime;
    setAnalysis(prev => ({ ...prev, isLoading: true }));

    try {
      // Backend will extract frame from YouTube automatically
      const result: AnalogyOutput = await generateAnalogy({
        videoId,
        timestamp,
      });

      setAnalysis({
        commentary: result.originalCommentary,
        nflAnalogy: result.nflAnalogy,
        fieldDiagram: result.fieldDiagram,
        isLoading: false,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error('Error fetching analogy:', error);
      setAnalysis(prev => ({ ...prev, isLoading: false }));
    }
  }, [videoId]);

  // Handle time updates from video
  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
    fetchAnalogy(time);
  }, [fetchAnalogy]);

  // Handle audio playback
  const handleAudioClick = async () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      // Speak both commentary and analogy
      const fullText = `${analysis.commentary}. And here's the NFL comparison: ${analysis.nflAnalogy}`;
      await speakText(fullText, { rate: 0.95, pitch: 1.0 });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('**').map((part, index) =>
      index % 2 === 1 ? (
        <strong key={index} className="text-chalk-yellow font-semibold">{part}</strong>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-chalkboard chalk-texture">
      <Header />

      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-10 gap-4 p-4 lg:p-6">
        {/* Left column - Video (70%) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <VideoZone
            currentMinute={Math.floor(currentTime / 60)}
            videoUrl={videoUrl}
            onVideoUrlChange={setVideoUrl}
            onCurrentTimeChange={handleTimeChange}
          />
        </div>

        {/* Right column - Explanations (30%) */}
        <div className="lg:col-span-3 flex flex-col min-h-0 gap-3">
          {/* Timestamp indicator */}
          {videoId && (
            <div className="text-xs text-chalk-white/50 font-body flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chalk-green animate-pulse" />
              Live analysis at {formatTime(analysis.timestamp)}
              {analysis.isLoading && <span className="ml-2 text-chalk-yellow">Loading...</span>}
            </div>
          )}

          {/* Original Commentary */}
          <div className="bg-card/50 rounded-lg p-3 chalk-border">
            <h3 className="font-chalk text-base text-chalk-yellow mb-1">What's Happening</h3>
            <p className={`text-chalk-white/90 font-body text-sm leading-snug ${analysis.isLoading ? 'opacity-50' : ''}`}>
              {renderMarkdown(analysis.commentary)}
            </p>
          </div>

          {/* NFL Analogy */}
          <div className="bg-gradient-to-r from-chalk-yellow/10 to-chalk-yellow/5 rounded-lg p-3 border border-chalk-yellow/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🏈</span>
              <h3 className="font-chalk text-base text-chalk-yellow">NFL Analogy</h3>
            </div>
            <p className={`text-chalk-white font-body text-sm leading-snug italic ${analysis.isLoading ? 'opacity-50' : ''}`}>
              {renderMarkdown(analysis.nflAnalogy)}
            </p>
          </div>

          {/* Compact Field Diagram */}
          <div className="flex-shrink-0">
            <TacticsDiagram diagramType={analysis.fieldDiagram} />
          </div>

          {/* Listen Like an NFL Commentator */}
          <div className="flex-shrink-0 mt-auto">
            <AudioButton onClick={handleAudioClick} isSpeaking={isSpeaking} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
