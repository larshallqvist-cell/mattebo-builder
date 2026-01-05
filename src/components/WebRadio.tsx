import { useState } from "react";
import { Radio, Pause, Play, Volume2 } from "lucide-react";

interface RadioChannel {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

interface WebRadioProps {
  onChannelChange?: (channel: string | null) => void;
}

const WebRadio = ({ onChannelChange }: WebRadioProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  
  const channels: RadioChannel[] = [
    { id: "spa", name: "Spa", emoji: "🧘", description: "Lugn & avslappning", color: "from-teal-500 to-cyan-600" },
    { id: "rock", name: "Rock", emoji: "🎸", description: "70-80-tals klassiker", color: "from-red-500 to-orange-600" },
    { id: "hiphop", name: "Hip-Hop", emoji: "🎤", description: "R&B & Hip-Hop", color: "from-purple-500 to-pink-600" },
  ];
  
  const toggleChannel = (channelId: string) => {
    const newChannel = activeChannel === channelId ? null : channelId;
    setActiveChannel(newChannel);
    onChannelChange?.(newChannel);
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
            onClick={() => toggleChannel(channel.id)}
            className={`
              flex-1 flex flex-col items-center gap-1 p-3 rounded-lg
              transition-all duration-300 
              ${activeChannel === channel.id 
                ? `bg-gradient-to-br ${channel.color} text-white shadow-lg scale-105` 
                : 'bg-secondary/50 hover:bg-secondary text-foreground hover:scale-102'
              }
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
