// Types for Spotify playlist items
export interface SpotifyPlaylistTrack {
    track: {
      id: string;
      name: string;
      uri: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    };
  }


export interface EnrichedTrack {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  danceability?: number;
  energy?: number;
  webData?: { results: { snippet: string; link: string }[] } | { error: string; suggestion: string };
  source: 'getsongbpm' | 'websearch' | 'failed';
  timestamp: number;
}


export interface ConsolidatedTrack {
  trackId: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  camelotKey?: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

