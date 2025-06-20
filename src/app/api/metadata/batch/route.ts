
import { NextRequest, NextResponse } from 'next/server';
import { getTrackDetailsFromGetSongBPM } from '@/lib/services/getsongbpm-service';
import { searchWebForTrackDetails } from '@/lib/services/google-service';

interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  danceability?: number;
  energy?: number;
  webData?: { results: { snippet: string; link: string; }[]; } | { error: string; suggestion: string; }
  source: 'getsongbpm' | 'websearch' | 'failed';
  timestamp: number;
}

interface BatchRequest {
  playlistId: string;
  playlistTracks: Array<{
    track: { id: string; name: string; artists: Array<{ name: string }> };
  }>;
  currentTrackId: string;
}


async function fetchTrackMetadataWithFallback(
    trackId: string,
    songTitle: string,
    artistName?: string
  ): Promise<TrackMetadata | null> {
    const base = {
      id: trackId,
      title: songTitle,
      artist: artistName || 'Unknown Artist',
      timestamp: Date.now(),
    };
  
    try {
      const apiResult = await getTrackDetailsFromGetSongBPM(songTitle, artistName);
      if (apiResult.matches?.length) {
        const match = apiResult.matches.slice(0, 2); // top 2 matches
        return {
          ...base,
          bpm: match[0].bpm,
          key: match[0].key,
          danceability: match[0].danceability,
          energy: match[0].energy,
          source: 'getsongbpm',
        };
      }
  
      const webSearchResults = await searchWebForTrackDetails(songTitle, artistName);
      console.log(webSearchResults)
      return {
        ...base,
        webData: webSearchResults,
        source: 'websearch',
      };
    } catch {
      return { ...base, source: 'failed' };
    }
  }
  


export async function POST(req: NextRequest) {
  try {
    const { playlistId, playlistTracks, currentTrackId }: BatchRequest = await req.json();
    if (!Array.isArray(playlistTracks) || playlistTracks.length === 0) {
      return NextResponse.json({ error: 'Invalid tracks' }, { status: 400 });
    }

    const BATCH_SIZE = 5;
    const BATCH_DELAY = 2000; // 2s delay to respect rate limits
    const enrichedTracks: TrackMetadata[] = [];

    for (let i = 0; i < playlistTracks.length; i += BATCH_SIZE) {
      const batch = playlistTracks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(item =>
          fetchTrackMetadataWithFallback(
            item.track.id,
            item.track.name,
            item.track.artists[0]?.name
          )
        )
      );
      enrichedTracks.push(...results.filter(r => r !== null) as TrackMetadata[]);
      if (i + BATCH_SIZE < playlistTracks.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }

    return NextResponse.json({
      playlistId,
      currentTrackId,
      enrichedTracks,
      totalRequested: playlistTracks.length,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Batch processing failed', details: err },
      { status: 500 }
    );
  }
}
