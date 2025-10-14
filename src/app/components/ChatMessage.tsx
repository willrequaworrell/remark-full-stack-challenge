// app/components/ChatMessage.tsx
import { UIMessage } from "ai";
import ChatTrackRecommendation from "./ChatTrackRecommendation";
import { PlaylistTrackCardType } from "../types/track";

interface ChatMessageProps {
  message: UIMessage;
  onTrackPlay?: (track: PlaylistTrackCardType, trackIndex: number) => void;
  aiConsolidatedTrackData?: Array<{
    trackId: string;
    title: string;
    artist: string;
    bpm: number | null;
    key: string | null;
  }>;
  playlistTracks?: Array<{
    track: {
      id: string;
      name: string;
      uri: string;
      artists: Array<{ name: string }>;
    };
  }>;
}

interface EmptyRecommendation {
  isEmpty: true;
  reason: string;
}

interface ValidRecommendation {
  isEmpty: false;
  track: {
    trackId: string;
    title: string;
    artist: string;
    bpm: number | null;
    camelotKey: string | null;
    reasoning: string;
  };
  trackIndex: number;
  trackUri: string;
}

type RecommendationResult = EmptyRecommendation | ValidRecommendation;

const ChatMessage = ({ 
  message, 
  onTrackPlay, 
  aiConsolidatedTrackData,
  playlistTracks 
}: ChatMessageProps) => {
  // Separate text parts from tool invocations
  const textParts = message.parts.filter(p => p.type === "text");
  const toolParts = message.parts.filter(p => p.type === "tool-invocation");

  // Find recommendation tool results
  const recommendations = toolParts
    .map(part => {
      if (part.type === "tool-invocation") {
        const toolInvocation = part.toolInvocation;
        if (
          toolInvocation.toolName === "getRecommendations" && 
          toolInvocation.state === "result"
        ) {
          const result = toolInvocation.result;
          
          // Handle null recommendation (no tracks left)
          if (!result?.recommendation) {
            return {
              isEmpty: true,
              reason: result?.reason || 'No compatible tracks available'
            } as EmptyRecommendation;
          }
          
          if (aiConsolidatedTrackData && playlistTracks) {
            const recommendedTrack = aiConsolidatedTrackData.find(
              t => t.trackId === result.recommendation
            );
            const trackIndex = playlistTracks.findIndex(
              t => t.track.id === result.recommendation
            );
            const playlistTrack = playlistTracks[trackIndex]?.track;
            
            if (recommendedTrack && playlistTrack && trackIndex !== -1) {
              return {
                isEmpty: false,
                track: {
                  trackId: recommendedTrack.trackId,
                  title: recommendedTrack.title,
                  artist: recommendedTrack.artist,
                  bpm: result.bpm,
                  camelotKey: result.camelotKey,
                  reasoning: result.reason
                },
                trackIndex,
                trackUri: playlistTrack.uri
              } as ValidRecommendation;
            }
          }
        }
      }
      return null;
    })
    .filter((rec): rec is RecommendationResult => rec !== null);

  // Check for loading state
  const isAnalyzing = toolParts.some(part => {
    if (part.type === "tool-invocation") {
      const toolInvocation = part.toolInvocation;
      return toolInvocation.toolName === "getRecommendations" && 
             toolInvocation.state === "call";
    }
    return false;
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Text message bubble */}
      {(textParts.length > 0 || isAnalyzing) && (
        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`border-2 border-black px-4 py-2 max-w-[80%] ${
              message.role === "user"
                ? "bg-black text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                : "bg-white text-black rounded-tl-lg rounded-tr-lg rounded-br-lg"
            }`}
          >
            {textParts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <p className="text-sm" key={i}>
                    {part.text}
                  </p>
                );
              }
              return null;
            })}

            {isAnalyzing && (
              <div className="p-3 my-2 text-xs bg-gray-100 border border-gray-300 rounded-lg animate-pulse">
                🎵 Analyzing harmonic compatibility...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation cards or empty state */}
      {recommendations.map((rec, i) => (
        <div key={i} className="flex justify-start">
          <div className="max-w-[80%]">
            {rec.isEmpty ? (
              // Empty state card
              <div className="p-3 text-center transition-colors bg-gray-100 border-2 border-gray-300 rounded-lg">
                <p className="mb-1 text-sm font-bold text-gray-700">No More Recommendations</p>
                <p className="text-xs text-gray-600">{rec.reason}</p>
              </div>
            ) : (
              // Normal track card
              <ChatTrackRecommendation
                track={rec.track}
                onPlay={onTrackPlay || (() => {})}
                trackIndex={rec.trackIndex}
                trackUri={rec.trackUri}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessage;
