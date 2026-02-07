import { Volume2, VolumeX } from "lucide-react";

interface WebRadioVolumeControlProps {
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const WebRadioVolumeControl = ({ isPlaying, isMuted, onToggleMute }: WebRadioVolumeControlProps) => {
  return (
    <button 
      onClick={onToggleMute}
      className={`
        p-1.5 rounded-lg transition-all duration-200
        ${isPlaying 
          ? 'bg-primary/20 hover:bg-primary/30' 
          : 'bg-secondary/30 hover:bg-secondary/50 opacity-50'
        }
      `}
      title={isMuted ? "Ljud av" : "Ljud på"}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-muted-foreground" />
      ) : isPlaying ? (
        <Volume2 className="w-4 h-4 text-primary animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4 text-muted-foreground/50" />
      )}
    </button>
  );
};

export default WebRadioVolumeControl;
