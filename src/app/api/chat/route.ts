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
  You are a professional DJ assistant. Use the following playlist track data to recommend the perfect next track.
  
  PLAYLIST ID: ${playlistId}
  
  CURRENT TRACK ID: ${currentTrackId} <--- when asked about the current playing track or current track, ALWAYS use this id to index PLAYLIST TRACK DATA for the title and artist  
  
  PLAYLIST TRACK DATA:
  ${trackList}
  
  MUSICAL KEYS → CAMELOT KEYS MAP:
  C Major → 8B; A minor → 8A; G Major → 9B; E minor → 9A; D Major → 10B; B minor → 10A;
  A Major → 11B; F♯ minor → 11A; E Major → 12B; C♯ minor → 12A; B Major → 1B; G♯ minor → 1A


  HARMONIC MIXING GUIDELINES:
  0. Use PLAYLIST TRACK DATA above to find key, bpm data for each track
  1. Prioritize tracks within ±5 BPM of the current track for the smoothest tempo transitions.  
  2. Among BPM-similar tracks, choose the one with the closest Camelot key match to ensure harmonic compatibility. If no good key matches, closest BPM wins
      2a. Camelot key match can be determined by:
        -  adjacent Camelot numbers (±1) sharing the same letter (e.g., 8A↔9A) or as close as possible by number while maintaining the letter. 
        -  If no adjacent match, same number different letter is also good
  3. Provide both CURRENT and RECOMMENDED songs BPM/key in your answer.

  
  RESPONSIBILITIES:
  - Recommend **only** from the above playlist based on these guidelines, and always include the bpm/key of the current (if available) and recommended song as well as a brief explanation of why it's a good fit
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


