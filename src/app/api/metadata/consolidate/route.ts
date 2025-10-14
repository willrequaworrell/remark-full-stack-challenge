import { NextRequest, NextResponse } from 'next/server';
import { consolidateMetadata } from '@/lib/tools/consolidateMetadata';
import { nanoid } from 'zod/v4';
import type { CoreMessage } from 'ai';
import { EnrichedTrack } from '@/app/types/track';
import pLimit from 'p-limit';

interface ConsolidationRequest {
  enrichedTracks: EnrichedTrack[];
}

export async function POST(req: NextRequest) {
  try {
    const { enrichedTracks }: ConsolidationRequest = await req.json();
    
    if (!Array.isArray(enrichedTracks) || enrichedTracks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid enriched tracks data' },
        { status: 400 }
      );
    }

    // Create concurrency limiter
    const limit = pLimit(5);

    // Process all tracks in parallel with controlled concurrency
    const consolidationPromises = enrichedTracks.map((track) =>
      limit(async () => {
        try {
          const trackData = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            getsongbmpData: track.source === 'getsongbpm' ? {
              bpm: track.bpm,
              key: track.key,
              danceability: track.danceability,
              energy: track.energy
            } : undefined,
            webData: track.source === 'websearch' ? track.webData : undefined
          };

          const toolCallId = String(nanoid());
          const messages: CoreMessage[] = [];
          
          const consolidated = await consolidateMetadata.execute(
            { trackData },
            { toolCallId, messages }
          );
          
          return consolidated;
        } catch (error) {
          console.error(`Failed to consolidate track ${track.id}:`, error);
          // Return fallback data instead of throwing
          return {
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            bpm: null,
            key: null,
            camelotKey: null,
            confidence: 'low',
            reasoning: 'Processing failed'
          };
        }
      })
    );

    // Wait for all tracks to complete
    const results = await Promise.allSettled(consolidationPromises);

    // Extract results and categorize by status
    const consolidatedTracks = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Extra safety: handle rejected promises
        const track = enrichedTracks[index];
        console.error(`Promise rejected for track ${track.id}:`, result.reason);
        return {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          bpm: null,
          key: null,
          camelotKey: null,
          confidence: 'low',
          reasoning: 'Promise rejected'
        };
      }
    });

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      consolidatedTracks,
      totalProcessed: consolidatedTracks.length,
      successCount,
      failureCount,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Consolidation route error:', error);
    return NextResponse.json(
      { error: 'Consolidation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
