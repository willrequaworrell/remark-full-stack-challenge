// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getPlaylistTracksFromSpotify } from '@/lib/tools/spotify';
import { getTrackDetails } from '@/lib/tools/getsongbpm';
import { getRecommendations } from '@/lib/tools/getRecommendations';

interface ConsolidatedTrack {
  trackId: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface MessagePart {
  type: string;
  toolInvocation?: {
    toolName: string;
    state: string;
    result?: {
      recommendation?: string;
    };
  };
}

interface ChatMessage {
  role: string;
  parts?: MessagePart[];
}

export async function POST(req: Request) {
  const { messages, playlistId, currentTrackId, aiConsolidatedTrackData } = await req.json();
  
  // Extract previously recommended track IDs from message history
  const extractRecommendedTracks = (messages: ChatMessage[]): string[] => {
    const recommended: string[] = [];
    
    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.parts) {
        msg.parts.forEach((part: MessagePart) => {
          if (part.type === 'tool-invocation' && part.toolInvocation) {
            const toolInvocation = part.toolInvocation;
            if (toolInvocation.toolName === 'getRecommendations' && 
                toolInvocation.state === 'result' &&
                toolInvocation.result?.recommendation) {
              recommended.push(toolInvocation.result.recommendation);
            }
          }
        });
      }
    });
    
    return recommended;
  };
  
  const previouslyRecommended = extractRecommendedTracks(messages);
  
  const createSystemPrompt = (
    playlistId: string,
    currentTrackId: string,
    playlistTrackData: ConsolidatedTrack[],
    excludedTracks: string[]
  ) => {
    const trackList = playlistTrackData
      .map((t, i) => {
        const bpm = t.bpm !== null ? t.bpm : 'Unknown';
        const key = t.key !== null ? t.key : 'Unknown';
        const conf = t.confidence;
        return `${i + 1}. "${t.title}" by ${t.artist} (ID: ${t.trackId}) — BPM: ${bpm}, Key: ${key}, Confidence: ${conf}`;
      })
      .join('\n');
    
    const excludedInfo = excludedTracks.length > 0 
      ? `\nPREVIOUSLY RECOMMENDED TRACKS: ${excludedTracks.join(', ')} <--- These tracks have already been recommended in this conversation and should be excluded`
      : '';
  
    return `
--YOUR ROLE--
You are a professional DJ assistant. Use the following playlist track data to recommend the perfect next track.

You may ONLY answer questions about: 
- the provided playlist (titles, artists, BPMs, keys, energy/vibe/danceability characteristics) (DO NOT EVER mention the playlist ID)
- the current track and its details (use CURRENT TRACK ID)
- DJing, mixing, harmonic mixing techniques
- Playback controls & behavior
- General music theory or music knowledge

If the user's question is outside these topics, respond:
"I'm sorry, I can only answer questions about this playlist, playback, DJing techniques, or general music topics."

--SYSTEM CONTEXT--
PLAYLIST ID: ${playlistId}
CURRENT TRACK ID: ${currentTrackId} <--- when asked about the current playing track or current track, ALWAYS use this id to index PLAYLIST TRACK DATA for the title and artist${excludedInfo}

PLAYLIST TRACK DATA:
${trackList}

MUSICAL KEYS → CAMELOT KEYS MAP:
1A = Ab minor; 1B = B Major; 2A = Eb minor; 2B = F# Major; 3A = Bb minor; 3B = Db Major; 4A = F minor; 4B = Ab Major; 5A = C minor; 5B = Eb Major; 6A = G minor; 6B = Bb Major; 7A = D minor; 7B = F Major; 8A = A minor; 8B = C Major; 9A = E minor; 9B = G Major; 10A = B minor; 10B = D Major; 11A = F# minor; 11B = A Major; 12A = Db minor (C# minor); 12B = E Major

--CRITICAL TOOL USAGE RULES--
When the user asks for a track recommendation using ANY of these phrases:
- "what should I play next" / "what's next"
- "recommend a track" / "recommend a song" / "recommend something"
- "another recommendation" / "different song" / "something else"
- "give me another" / "try again"

You MUST:
1. Call the getRecommendations tool with currentTrackId, playlistTrackData, AND excludeTrackIds (pass the previously recommended track IDs)
2. The tool automatically excludes the current track and previously recommended tracks
3. Explain the new recommendation in 1-2 sentences based on the tool's output
4. NEVER recommend tracks without calling the tool first - even if you can see the data, the tool provides the official scoring and exclusion logic

For other questions (current track info, playlist questions, general DJ knowledge), answer directly from the provided data without calling tools.

--HARMONIC MIXING GUIDELINES--
The getRecommendations tool implements these rules automatically:
1. Prioritize tracks within ±5 BPM of the current track for smooth tempo transitions
2. Among BPM-similar tracks, choose the one with the closest Camelot key match for harmonic compatibility
3. Automatically excludes current track and previously recommended tracks to avoid repeats

--ADDITIONAL NOTES--
RESPONSIBILITIES:
- Always call getRecommendations with the excludeTrackIds parameter populated with previously recommended track IDs
- If the tool returns no matches, explain that all compatible tracks have been exhausted
- Provide concise, actionable advice with brief reasoning (under three sentences)
- Be conversational and helpful, but always defer to the tool for recommendations

AVAILABLE TOOLS:
- **getRecommendations**: REQUIRED for all track recommendations - pass excludeTrackIds parameter with previously recommended tracks
- **getTrackDetails**: Fallback for missing BPM/key data (rarely needed)
- **getPlaylistTracksFromSpotify**: For fetching playlist data (rarely needed)
`;
  };
  
  try {
    const prompt = createSystemPrompt(
      playlistId, 
      currentTrackId, 
      aiConsolidatedTrackData,
      previouslyRecommended
    );
    
    const result = streamText({
      model: openai('gpt-4o'),
      maxSteps: 5,
      temperature: 0.5, 
      system: prompt,
      messages,
      tools: {
        getPlaylistTracksFromSpotify,
        getTrackDetails,
        getRecommendations,
      },
      toolChoice: 'auto',
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal error', 
        details: error instanceof Error ? error.message : 'Unknown' 
      }),
      { status: 500 }
    );
  }
}
