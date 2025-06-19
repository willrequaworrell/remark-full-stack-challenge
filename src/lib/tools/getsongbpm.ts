import { tool } from 'ai';
import { z } from 'zod';
import { getTrackDetailsFromGetSongBPM } from '../services/getsongbpm-service';
import { searchWebForTrackDetails } from '../services/google-service';

export const getTrackDetails = tool({
    description: 'Fetch BPM, key, and metadata for a track. Uses GetSongBPM as primary source and web search as fallback.',
    parameters: z.object({
      songTitle: z.string(),
      artistName: z.string().optional()
    }),
    execute: async ({ songTitle, artistName }) => {
      // 1. Try GetSongBPM API
      const result = await getTrackDetailsFromGetSongBPM(songTitle, artistName);
  
      if (result.matches && result.matches.length > 0) {
        // Success: Return all matches for the AI to choose from
        return {
          matches: result.matches,
          source: 'GetSongBPM'
        };
      } else {
        // 2. Fallback: Web search for up to 5 results
        const webFallback = await searchWebForTrackDetails(songTitle, artistName);
        return {
          matches: [],
          error: result.error || 'No matching tracks found.',
          suggestion: result.suggestion || 'Try being more specific with both song and artist names.',
          webFallback, // Contains up to 5 web results: [{ snippet, link }]
          source: 'WebFallback'
        };
      }
    }
  })