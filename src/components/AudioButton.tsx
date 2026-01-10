import { Volume2 } from 'lucide-react';
import { forwardRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AudioButton = forwardRef<HTMLButtonElement>((props, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-full chalk-border rounded-lg p-4 bg-chalk-green-light/40 hover:bg-chalk-green-light/60 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98]"
          {...props}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-chalk-white/40 flex items-center justify-center bg-chalk-green-light/50 group-hover:border-primary/60 group-hover:bg-primary/20 transition-all">
              <Volume2 className={`w-6 h-6 transition-colors ${isHovered ? 'text-primary' : 'text-chalk-white/80'}`} />
            </div>
            <div className="text-left">
              <p className="font-chalk text-xl text-chalk group-hover:text-primary transition-colors">
                Listen Like an NFL Commentator
              </p>
              <p className="text-sm text-chalk-white/50 font-body">
                AI-generated explanation voice
              </p>
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-card border-chalk-white/20">
        <p className="text-xs">Click to hear the play explained like an NFL broadcast</p>
      </TooltipContent>
    </Tooltip>
  );
});

AudioButton.displayName = 'AudioButton';

export default AudioButton;
