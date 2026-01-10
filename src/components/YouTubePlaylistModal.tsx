/**
 * Filnamn: YouTubePlaylistModal.tsx
 * Timestamp: 2026-01-10 23:12
 * Beskrivning: Modal som visar alla videor i en YouTube-spellista
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  position: number;
}

interface YouTubePlaylistModalProps {
  playlistId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDuration = (duration: string): string => {
  // Konvertera ISO 8601 duration (PT1H2M10S) till läsbart format (1:02:10)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const YouTubePlaylistModal = ({ playlistId, isOpen, onClose }: YouTubePlaylistModalProps) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState<string>("");

  useEffect(() => {
    if (!playlistId || !isOpen) {
      return;
    }

    const fetchPlaylistItems = async () => {
      setLoading(true);
      setError(null);
      
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        setError("YouTube API-nyckel saknas. Lägg till den i .env.local");
        setLoading(false);
        return;
      }

      try {
        // Hämta spellista-metadata
        const playlistResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
        );
        
        if (!playlistResponse.ok) {
          throw new Error(`API error: ${playlistResponse.status}`);
        }
        
        const playlistData = await playlistResponse.json();
        if (playlistData.items && playlistData.items.length > 0) {
          setPlaylistTitle(playlistData.items[0].snippet.title);
        }

        // Hämta spellista-items
        const itemsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
        );
        
        if (!itemsResponse.ok) {
          throw new Error(`API error: ${itemsResponse.status}`);
        }
        
        const itemsData = await itemsResponse.json();
        
        if (!itemsData.items || itemsData.items.length === 0) {
          setError("Inga videor hittades i spellistan");
          setLoading(false);
          return;
        }

        // Hämta video-detaljer (för varaktighet)
        const videoIds = itemsData.items.map((item: { snippet: { resourceId: { videoId: string } } }) => item.snippet.resourceId.videoId).join(',');
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
        );
        
        if (!videosResponse.ok) {
          throw new Error(`API error: ${videosResponse.status}`);
        }
        
        const videosData = await videosResponse.json();
        
        // Kombinera data
        const durationMap = new Map(
          videosData.items.map((item: { id: string; contentDetails: { duration: string } }) => [item.id, item.contentDetails.duration])
        );

        const videoList: YouTubeVideo[] = itemsData.items.map((item: {
          snippet: {
            resourceId: { videoId: string };
            title: string;
            thumbnails: {
              medium?: { url: string };
              default?: { url: string };
            };
          };
        }, index: number) => {
          const videoId = item.snippet.resourceId.videoId;
          const duration = durationMap.get(videoId) || '';
          
          return {
            id: videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || '',
            duration: formatDuration(duration),
            position: index + 1,
          };
        });

        setVideos(videoList);
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError("Kunde inte hämta spellistan. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistItems();
  }, [playlistId, isOpen]);

  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {playlistTitle || "Spellista"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Hämtar videor...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video.id)}
                  className="flex gap-4 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer group"
                >
                  {/* Position number */}
                  <div className="flex-shrink-0 w-8 flex items-center justify-center text-muted-foreground font-medium">
                    {video.position}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-md"
                    />
                    {video.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>
                    )}
                  </div>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>
                  </div>

                  {/* External link icon */}
                  <div className="flex-shrink-0 flex items-center">
                    <ExternalLink className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Inga videor hittades</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default YouTubePlaylistModal;
