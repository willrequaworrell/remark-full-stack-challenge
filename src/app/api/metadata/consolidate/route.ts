// app/api/metadata/consolidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { consolidateMetadata } from '@/lib/tools/consolidateMetadata';
import { useState } from 'react';
import { nanoid } from 'zod/v4';
import type { CoreMessage } from 'ai';

interface EnrichedTrack {
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
  
 
  

interface ConsolidationRequest {
  enrichedTracks: EnrichedTrack[];
}

export async function POST(req: NextRequest) {
  try {
    const { enrichedTracks }: ConsolidationRequest = await req.json();
    
    if (!Array.isArray(enrichedTracks) || enrichedTracks.length === 0) {
      return NextResponse.json({ error: 'Invalid enriched tracks data' }, { status: 400 });
    }

    const consolidatedTracks = [];
    
    // Process tracks sequentially to avoid rate limits
    for (const track of enrichedTracks) {
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
        const messages: CoreMessage[] = []
        const consolidated = await consolidateMetadata.execute({ trackData }, {toolCallId, messages});
        consolidatedTracks.push(consolidated);
        
        // Small delay to respect OpenAI rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to consolidate track ${track.id}:`, error);
        consolidatedTracks.push({
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          bpm: null,
          key: null,
          camelotKey: null,
          confidence: 'low',
          reasoning: 'Processing failed'
        });
      }
    }

    return NextResponse.json({
      consolidatedTracks,
      totalProcessed: consolidatedTracks.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Consolidation route error:', error);
    return NextResponse.json(
      { error: 'Consolidation failed', details: error },
      { status: 500 }
    );
  }
}
