import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import VideoZone from '@/components/VideoZone';
import EventTimeline from '@/components/EventTimeline';
import ExplanationPanel from '@/components/ExplanationPanel';
import TacticsDiagram from '@/components/TacticsDiagram';
import AudioButton from '@/components/AudioButton';
import RecentExplanations from '@/components/RecentExplanations';
import AICoach from '@/components/AICoach';
import { mockMatch, MatchEvent } from '@/data/matchData';
import { videoSourceManager } from '@/lib/videoSources';
import { createVideoContext, VideoContext } from '@/lib/videoContext';

const Index = () => {
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent | null>(mockMatch.events[2]); // Default to Goal event
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoContext, setVideoContext] = useState<VideoContext | null>(null);
  
  const currentMinute = selectedEvent?.minute || 35;

  // Update video context when video URL or current time changes
  useEffect(() => {
    if (videoUrl) {
      const parsed = videoSourceManager.parseUrl(videoUrl);
      if (parsed) {
        const context = createVideoContext(videoUrl, parsed, currentTime);
        setVideoContext(context);
      } else {
        setVideoContext(null);
      }
    } else {
      setVideoContext(null);
    }
  }, [videoUrl, currentTime]);

  return (
    <div className="min-h-screen bg-chalkboard chalk-texture">
      <Header />
      
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left column - Video & Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <VideoZone 
              currentMinute={currentMinute}
              videoUrl={videoUrl}
              onVideoUrlChange={setVideoUrl}
              onCurrentTimeChange={setCurrentTime}
            />
            
            <EventTimeline 
              events={mockMatch.events}
              selectedEventId={selectedEvent?.id || null}
              onSelectEvent={setSelectedEvent}
            />
          </div>

          {/* Right column - Explanations */}
          <div className="lg:col-span-7 space-y-6">
            {/* AI Coach Panel */}
            <div className="bg-card/50 rounded-lg chalk-border" style={{ height: '600px', minHeight: '600px' }}>
              <AICoach videoContext={videoContext} />
            </div>

            {/* Explanation panel with card styling */}
            <div className="bg-card/50 rounded-lg p-5 chalk-border min-h-[280px]">
              <ExplanationPanel event={selectedEvent} />
            </div>

            {/* Tactics diagram */}
            <TacticsDiagram diagramType={selectedEvent?.diagram || null} />

            {/* Audio button */}
            <AudioButton />
          </div>
        </div>

        {/* Bottom section - Recent explanations */}
        <div className="mt-6 max-w-md mx-auto lg:max-w-none lg:ml-auto lg:mr-0 lg:w-80">
          <RecentExplanations />
        </div>
      </main>
    </div>
  );
};

export default Index;
