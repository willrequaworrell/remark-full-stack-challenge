// app/components/ChatTrackRecommendation.tsx
"use client";

import { PlaylistTrackCardType } from "../types/track";

interface ChatTrackRecommendationProps {
  track: {
    trackId: string;
    title: string;
    artist: string;
    bpm?: number | null;
    camelotKey?: string | null;
    reasoning?: string;
  };
  onPlay: (track: PlaylistTrackCardType, trackIndex: number) => void;
  trackIndex: number;
  trackUri: string;
}

const ChatTrackRecommendation = ({ 
  track, 
  onPlay, 
  trackIndex,
  trackUri 
}: ChatTrackRecommendationProps) => {
  const handlePlay = () => {
    const playlistTrack = {
      id: track.trackId,
      name: track.title,
      artist: track.artist,
      uri: trackUri,
      albumArt: ""
    };
    onPlay(playlistTrack, trackIndex);
  };

  return (
    <div className="p-3 transition-colors bg-white border-2 border-black rounded-lg hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="mb-1 text-sm font-bold truncate">{track.title}</h4>
          <p className="mb-2 text-xs text-gray-600 truncate">{track.artist}</p>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {track.bpm && (
              <span className="px-2 py-1 font-semibold text-white bg-black rounded">
                BPM: {track.bpm}
              </span>
            )}
            {track.camelotKey && (
              <span className="px-2 py-1 font-semibold text-white bg-black rounded">
                Key: {track.camelotKey}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handlePlay}
          className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white transition-all bg-black border-2 border-black rounded-full group hover:bg-white hover:text-black active:scale-95"
          aria-label={`Play ${track.title}`}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            className="text-white group-hover:text-black"
          >
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatTrackRecommendation;
