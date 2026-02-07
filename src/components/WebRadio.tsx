import { useState, useRef, useEffect } from "react";
import { Radio, Pause, Play, Volume2, VolumeX, Music } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface RadioChannel {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  streamUrl: string;
  metadataId?: string; // SomaFM channel ID for metadata (optional for non-SomaFM channels)
}

interface TrackInfo {
  artist: string;
  title: string;
}

interface WebRadioProps {
  onChannelChange?: (channel: string | null) => void;
  compact?: boolean;
}

const WebRadio = ({ onChannelChange, compact = false }: WebRadioProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const channels: RadioChannel[] = [
    { 
      id: "spa", 
      name: "Spa", 
      emoji: "🧘", 
      description: "Lugn & avslappning", 
      color: "from-teal-500 to-cyan-600",
      streamUrl: "https://ice1.somafm.com/dronezone-128-mp3",
      metadataId: "dronezone"
    },
    { 
      id: "rock", 
      name: "Rock", 
      emoji: "🎸", 
      description: "70-tals klassiker", 
      color: "from-amber-500 to-orange-600",
      streamUrl: "https://ice1.somafm.com/seventies-128-mp3",
      metadataId: "seventies"
    },
    { 
      id: "pop", 
      name: "Pop", 
      emoji: "🎧", 
      description: "Aktuella hits (OnlyHit)", 
      color: "from-purple-500 to-pink-600",
      streamUrl: "https://cdn.onlyhitsradio.net/onlyhits"
    },
    { 
      id: "christian", 
      name: "Faith", 
      emoji: "✌🏼", 
      description: "Kristen pop (WJTL)", 
      color: "from-sky-500 to-blue-600",
      streamUrl: "https://us9.maindigitalstream.com/ssl/WJTL"
    },
    { 
      id: "nrj", 
      name: "NRJ", 
      emoji: "🎵", 
      description: "NRJ Sverige", 
      color: "from-red-500 to-yellow-500",
      streamUrl: "https://stream.nrj.se/nrj_se_mp3"
    },
    { 
      id: "p3", 
      name: "P3", 
      emoji: "📻", 
      description: "Sveriges Radio P3", 
      color: "from-green-500 to-emerald-600",
      streamUrl: "https://sverigesradio.se/topsy/direkt/164-hi-aac"
    },
  ];

  const fetchTrackInfo = async (metadataId: string) => {
    try {
      const response = await fetch(`https://somafm.com/songs/${metadataId}.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.songs && data.songs.length > 0) {
          const currentSong = data.songs[0];
          setCurrentTrack({
            artist: currentSong.artist || "Okänd artist",
            title: currentSong.title || "Okänd låt"
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch track info:', error);
    }
  };

  const startMetadataPolling = (metadataId: string) => {
    // Fetch immediately
    fetchTrackInfo(metadataId);
    
    // Then poll every 30 seconds
    metadataIntervalRef.current = setInterval(() => {
      fetchTrackInfo(metadataId);
    }, 30000);
  };

  const stopMetadataPolling = () => {
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
    setCurrentTrack(null);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopMetadataPolling();
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleChannelClick = (channel: RadioChannel) => {
    // If clicking the same channel, stop it
    if (activeChannel === channel.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopMetadataPolling();
      setActiveChannel(null);
      onChannelChange?.(null);
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopMetadataPolling();

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

    // Apply current volume
    audio.volume = isMuted ? 0 : volume / 100;

    // Start fetching metadata (only for SomaFM channels)
    if (channel.metadataId) {
      startMetadataPolling(channel.metadataId);
    } else {
      // For non-SomaFM channels, show the description as track info
      setCurrentTrack({
        artist: channel.description,
        title: "Liveradio"
      });
    }

    setActiveChannel(channel.id);
    onChannelChange?.(channel.id);
  };
  
  const activeChannelData = channels.find(c => c.id === activeChannel);
  
  // Compact mode - tall rectangular buttons in 2 rows of 3
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        {/* 2 rows of 3 channel buttons */}
        <div className="grid grid-cols-3 gap-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel)}
              disabled={isLoading}
              title={channel.description}
              className={`
                flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl min-w-[56px]
                transition-all duration-200 
                ${activeChannel === channel.id 
                  ? `bg-gradient-to-br ${channel.color} text-white shadow-lg scale-105` 
                  : 'bg-secondary/50 hover:bg-secondary hover:scale-105 text-foreground'
                }
                ${isLoading ? 'opacity-70 cursor-wait' : ''}
              `}
            >
              <span className="text-2xl">{channel.emoji}</span>
              <span className="text-[9px] font-medium leading-none opacity-80">{channel.name}</span>
            </button>
          ))}
        </div>
        {/* Volume control when playing */}
        {activeChannel && (
          <button 
            onClick={toggleMute}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            title={isMuted ? "Ljud av" : "Ljud på"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary animate-pulse" />
            )}
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border p-4 shadow-lg">
      {/* Header with volume control */}
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Webbradio</h3>
        {activeChannel && (
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={toggleMute}
              className="p-1 hover:bg-secondary rounded transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              )}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-16"
            />
          </div>
        )}
      </div>
      
      {/* Channel buttons - 2x2 grid */}
      <div className="grid grid-cols-4 gap-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelClick(channel)}
            disabled={isLoading}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg
              transition-all duration-300 
              ${activeChannel === channel.id 
                ? `bg-gradient-to-br ${channel.color} text-white shadow-lg scale-105` 
                : 'bg-secondary/50 hover:bg-secondary text-foreground hover:scale-102'
              }
              ${isLoading ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            <span className="text-xl">{channel.emoji}</span>
            <span className="text-[10px] font-medium leading-tight">{channel.name}</span>
            {activeChannel === channel.id ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}
      </div>
      
      {/* Now playing with track info */}
      {activeChannelData && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-start gap-2 text-sm">
            <Music className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {currentTrack ? (
                <>
                  <p className="font-medium text-foreground truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-muted-foreground text-xs truncate">
                    {currentTrack.artist}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground animate-pulse">
                  Laddar låtinfo...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebRadio;
