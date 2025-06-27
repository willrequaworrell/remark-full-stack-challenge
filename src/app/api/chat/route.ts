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



export async function POST(req: Request) {
  const { messages, playlistId, currentTrackId, aiConsolidatedTrackData } = await req.json();
  
  console.log(aiConsolidatedTrackData)
  
  const createSystemPrompt = (
    playlistId: string,
    currentTrackId: string,
    playlistTrackData: ConsolidatedTrack[]
  ) => {
    const trackList = playlistTrackData
      .map((t, i) => {
        const bpm   = t.bpm  !== null ? t.bpm  : 'Unknown';
        const key   = t.key  !== null ? t.key  : 'Unknown';
        const conf  = t.confidence;
        return `${i + 1}. "${t.title}" by ${t.artist} (ID: ${t.trackId}) — BPM: ${bpm}, Key: ${key}, Confidence: ${conf}`;
      })
      .join('\n');
  
    return `
  --YOUR ROLE--
  You are a professional DJ assistant. Use the following playlist track data to recommend the perfect next track.

  You may ONLY answer questions about: 
  - the provided playlist (titles, artists, BPMs, keys, energy/vibe/danceability characteristics) (DO NOT EVER mention the playlist ID)
  - the current track and its details (use CURRENT TRACK ID)
  - DJing, mixing, harmonic mixing techniques
  - Playback controls & behavior
  - General music theory or music knowledge

  If the user’s question is outside these topics—e.g., “how much do 5 watermelons weigh?”—respond exactly:
  “I’m sorry, I can only answer questions about this playlist, playback, DJing techniques, or general music topics.”
  
  --SYSTEM CONTEXT--
  PLAYLIST ID: ${playlistId}
  
  CURRENT TRACK ID: ${currentTrackId} <--- when asked about the current playing track or current track, ALWAYS use this id to index PLAYLIST TRACK DATA for the title and artist  
  
  PLAYLIST TRACK DATA:
  ${trackList}
  
  MUSICAL KEYS → CAMELOT KEYS MAP:
  1A = Ab minor; 1B = B Major; 2A = Eb minor; 2B = F# Major; 3A = Bb minor; 3B = Db Major; 4A = F minor; 4B = Ab Major; 5A = C minor; 5B = Eb Major; 6A = G minor; 6B = Bb Major; 7A = D minor; 7B = F Major; 8A = A minor; 8B = C Major; 9A = E minor; 9B = G Major; 10A = B minor; 10B = D Major; 11A = F# minor; 11B = A Major; 12A = Db minor (C# minor); 12B = E Major


  HARMONIC MIXING GUIDELINES:
  0. Use PLAYLIST TRACK DATA above to find key, bpm data for each track
  1. Prioritize tracks within ±5 BPM of the current track for the smoothest tempo transitions.  
  2. Among BPM-similar tracks, choose the one with the closest Camelot key match to ensure harmonic compatibility. If no good key matches, closest BPM wins
      2a. Camelot key match can be determined by:
        -  adjacent Camelot numbers (±1) sharing the same letter (e.g., 8A↔9A) or as close as possible by number while maintaining the letter. 
        -  If no adjacent match, same number different letter is also good
  3. Provide both CURRENT and RECOMMENDED songs BPM/key in your answer.

  --ADDITIONAL NOTES--
  RESPONSIBILITIES:
  - Recommend **only** from the above playlist based on these guidelines, and always include the bpm/key of the current (if available) and recommended song as well as a brief explanation of why it's a good fit
  - if there's none that fit in the criteria, then recommend the closest track in bpm but explain it's not likely to be as smooth
  - Provide info about the current track, any other track in the playlist, or the playlist itself
  - Provide concise, actionable advice with brief reasoning under three sentences.  
  
  TOOL GUIDELINES:
  - Use **getRecommendations** for transition suggestions leveraging this metadata. 
  - Use **getTrackDetails** for fallback BPM/key lookups if needed.
  `;
  };
  
  
  
  try {
    const prompt = createSystemPrompt(playlistId, currentTrackId, aiConsolidatedTrackData)
    console.log(prompt)
    const result = streamText({
      model: openai('gpt-4o'),
      maxSteps: 10, // Conservative buffer for complex interactions
      temperature: 0.5, 
      system: prompt,
      
      messages,
      
      tools: {
        getPlaylistTracksFromSpotify,
        getTrackDetails,
        getRecommendations,
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500 }
    );
  }
}


