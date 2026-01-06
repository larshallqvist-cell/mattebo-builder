import { useState, useRef, useEffect } from "react";
import { Radio, Pause, Play, Volume2 } from "lucide-react";

interface RadioChannel {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  streamUrl: string;
}

interface WebRadioProps {
  onChannelChange?: (channel: string | null) => void;
}

const WebRadio = ({ onChannelChange }: WebRadioProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const channels: RadioChannel[] = [
    { 
      id: "spa", 
      name: "Spa", 
      emoji: "🧘", 
      description: "Lugn & avslappning", 
      color: "from-teal-500 to-cyan-600",
      streamUrl: "https://ice1.somafm.com/dronezone-128-mp3"
    },
    { 
      id: "rock", 
      name: "Rock", 
      emoji: "🎸", 
      description: "70-80-tals klassiker", 
      color: "from-red-500 to-orange-600",
      streamUrl: "https://ice1.somafm.com/metal-128-mp3"
    },
    { 
      id: "hiphop", 
      name: "Hip-Hop", 
      emoji: "🎤", 
      description: "R&B & Hip-Hop", 
      color: "from-purple-500 to-pink-600",
      streamUrl: "https://ice1.somafm.com/beatblender-128-mp3"
    },
  ];

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const handleChannelClick = (channel: RadioChannel) => {
    // If clicking the same channel, stop it
    if (activeChannel === channel.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setActiveChannel(null);
      onChannelChange?.(null);
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Start new stream
    setIsLoading(true);
    const audio = new Audio(channel.streamUrl);
    audioRef.current = audio;
    
    audio.addEventListener('canplay', () => {
      setIsLoading(false);
    });

    audio.addEventListener('error', () => {
      setIsLoading(false);
      console.error('Failed to load stream:', channel.streamUrl);
    });

    audio.play().catch(err => {
      console.error('Playback failed:', err);
      setIsLoading(false);
    });

    setActiveChannel(channel.id);
    onChannelChange?.(channel.id);
  };
  
  const activeChannelData = channels.find(c => c.id === activeChannel);
  
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Webbradio</h3>
        {activeChannel && (
          <Volume2 className="w-4 h-4 text-primary animate-pulse ml-auto" />
        )}
      </div>
      
      {/* Channel buttons */}
      <div className="flex gap-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            disabled={isLoading}
            className={`
              flex-1 flex flex-col items-center gap-1 p-3 rounded-lg
              transition-all duration-300 
              ${activeChannel === channel.id 
                ? `bg-gradient-to-br ${channel.color} text-white shadow-lg scale-105` 
                : 'bg-secondary/50 hover:bg-secondary text-foreground hover:scale-102'
              }
              ${isLoading ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            <span className="text-2xl">{channel.emoji}</span>
            <span className="text-xs font-medium">{channel.name}</span>
            {activeChannel === channel.id ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}
      </div>
      
      {/* Now playing */}
      {activeChannelData && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Nu spelar:</span>
            <span className="font-medium text-foreground">
              {activeChannelData.emoji} {activeChannelData.description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebRadio;
