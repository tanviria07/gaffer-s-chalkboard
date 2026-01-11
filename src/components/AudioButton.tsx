import { Volume2, VolumeX } from 'lucide-react';
import { forwardRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AudioButtonProps {
  onClick?: () => void;
  isSpeaking?: boolean;
}

const AudioButton = forwardRef<HTMLButtonElement, AudioButtonProps>(
  ({ onClick, isSpeaking = false, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full chalk-border rounded-lg p-3 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] ${
              isSpeaking
                ? 'bg-chalk-yellow/20 border-chalk-yellow/50'
                : 'bg-chalk-green-light/40 hover:bg-chalk-green-light/60'
            }`}
            {...props}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  isSpeaking
                    ? 'border-chalk-yellow bg-chalk-yellow/30 animate-pulse'
                    : 'border-chalk-white/40 bg-chalk-green-light/50 group-hover:border-primary/60 group-hover:bg-primary/20'
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-5 h-5 text-chalk-yellow" />
                ) : (
                  <Volume2
                    className={`w-5 h-5 transition-colors ${
                      isHovered ? 'text-primary' : 'text-chalk-white/80'
                    }`}
                  />
                )}
              </div>
              <div className="text-left">
                <p
                  className={`font-chalk text-base transition-colors ${
                    isSpeaking
                      ? 'text-chalk-yellow'
                      : 'text-chalk group-hover:text-primary'
                  }`}
                >
                  {isSpeaking ? 'Stop Playback' : 'Listen Like an NFL Commentator'}
                </p>
                <p className="text-xs text-chalk-white/50 font-body">
                  {isSpeaking ? 'Click to stop' : 'AI-generated explanation voice'}
                </p>
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-card border-chalk-white/20">
          <p className="text-xs">
            {isSpeaking
              ? 'Click to stop the audio'
              : 'Click to hear the play explained like an NFL broadcast'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

AudioButton.displayName = 'AudioButton';

export default AudioButton;
