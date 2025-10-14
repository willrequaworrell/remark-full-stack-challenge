import { NextRequest, NextResponse } from 'next/server';
import { getTrackDetailsFromGetSongBPM } from '@/lib/services/getsongbpm-service';
import { searchWebForTrackDetails } from '@/lib/services/google-service';
import pLimit from 'p-limit';

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
): Promise<TrackMetadata> {
  const base = {
    id: trackId,
    title: songTitle,
    artist: artistName || 'Unknown Artist',
    timestamp: Date.now(),
  };

  try {
    const apiResult = await getTrackDetailsFromGetSongBPM(songTitle, artistName);
    if (apiResult.matches?.length) {
      const match = apiResult.matches[0]; // Use first match
      return {
        ...base,
        bpm: match.bpm,
        key: match.key,
        danceability: match.danceability,
        energy: match.energy,
        source: 'getsongbpm',
      };
    }

    // Fallback to web search if no API matches
    const webSearchResults = await searchWebForTrackDetails(songTitle, artistName);
    return {
      ...base,
      webData: webSearchResults,
      source: 'websearch',
    };
  } catch (error) {
    console.error(`Failed to fetch metadata for ${songTitle}:`, error);
    return { 
      ...base, 
      source: 'failed' 
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { playlistId, playlistTracks, currentTrackId }: BatchRequest = await req.json();
    
    if (!Array.isArray(playlistTracks) || playlistTracks.length === 0) {
      return NextResponse.json({ error: 'Invalid tracks' }, { status: 400 });
    }

    // Create concurrency limiter
    // Adjust based on GetSongBPM/Google API rate limits:
    // GetSongBPM free tier: ~3-5 concurrent
    // Google Custom Search: 100 queries/day free, so pace accordingly
    const limit = pLimit(3);

    // Process all tracks with controlled concurrency
    const enrichmentPromises = playlistTracks.map(item =>
      limit(() =>
        fetchTrackMetadataWithFallback(
          item.track.id,
          item.track.name,
          item.track.artists[0]?.name
        )
      )
    );

    // Wait for all to complete, even if some fail
    const results = await Promise.allSettled(enrichmentPromises);

    // Extract successful results and count failures
    const enrichedTracks: TrackMetadata[] = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        enrichedTracks.push(result.value);
        if (result.value.source !== 'failed') {
          successCount++;
        } else {
          failureCount++;
        }
      } else {
        // Promise rejected (shouldn't happen with try/catch in fetchTrackMetadataWithFallback)
        const track = playlistTracks[index].track;
        console.error(`Promise rejected for track ${track.id}:`, result.reason);
        enrichedTracks.push({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          source: 'failed',
          timestamp: Date.now(),
        });
        failureCount++;
      }
    });

    return NextResponse.json({
      playlistId,
      currentTrackId,
      enrichedTracks,
      totalRequested: playlistTracks.length,
      successCount,
      failureCount,
      timestamp: Date.now(),
    });

  } catch (err) {
    console.error('Batch processing error:', err);
    return NextResponse.json(
      { error: 'Batch processing failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
