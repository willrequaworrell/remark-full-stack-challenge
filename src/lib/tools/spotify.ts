import { tool } from 'ai';
import { z } from 'zod';
import { getPlaylistTracks } from '@/lib/services/spotify-service';

// Define the expected track type
interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  duration_ms?: number;
  popularity?: number;
  uri?: string;
}

export const getPlaylistTracksFromSpotify = tool({
  description: 'Fallback tool to refresh playlist data if needed',
  parameters: z.object({
    playlistId: z.string()
  }),
  // Explicit return type: Promise<{ note: string; tracks: PlaylistTrack[] }>
  execute: async ({ playlistId }): Promise<{ note: string; tracks: PlaylistTrack[] }> => {
    const tracks: PlaylistTrack[] = await getPlaylistTracks(playlistId);
    return {
      note: "use when user asks about playlist data",
      tracks
    };
  }
});
