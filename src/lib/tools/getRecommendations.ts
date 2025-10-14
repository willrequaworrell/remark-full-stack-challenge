import { tool } from 'ai';
import { z } from 'zod';

export interface RecommendationResult {
  recommendation: string | null;
  bpm: number | null;
  camelotKey: string | null;
  reason: string;
}

export interface Candidate {
  trackId: string;
  bpm: number | null;
  key: string | null;
  camelotKey: string | null;
  score: number;
}

export const getRecommendations = tool({
  description: 'Recommend candidate tracks based on BPM proximity and Camelot harmonic mixing. Excludes current track and previously recommended tracks.',
  parameters: z.object({
    currentTrackId: z.string(),
    playlistTrackData: z.array(z.object({
      trackId: z.string(),
      bpm: z.number().nullable(),
      key: z.string().nullable(),
      camelotKey: z.string().nullable(),
      energy: z.number().optional()
    })),
    energyDirection: z.enum(['maintain','increase','decrease']).optional(),
    excludeTrackIds: z.array(z.string()).optional().describe('Track IDs to exclude from recommendations (previously played or recommended)')
  }),
  execute: async ({ 
    currentTrackId, 
    playlistTrackData, 
    energyDirection = 'maintain',
    excludeTrackIds = []
  }) => {
    // Validate input
    if (!currentTrackId || !Array.isArray(playlistTrackData)) {
      return { recommendation: null, bpm: null, camelotKey: null, reason: 'Invalid arguments' };
    }

    // 1. Find current track metadata
    const current = playlistTrackData.find(t => t.trackId === currentTrackId);
    if (!current || current.bpm === null) {
      return { recommendation: null, bpm: null, camelotKey: null, reason: 'Current track metadata unavailable' };
    }

    // 2. Build exclusion set (current track + previously recommended)
    const excludeSet = new Set([currentTrackId, ...excludeTrackIds]);

    // 3. Filter by BPM ±5 and exclude already-played tracks
    let candidates = playlistTrackData
      .filter(t => !excludeSet.has(t.trackId) && t.bpm !== null)
      .filter(t => Math.abs((t.bpm as number) - (current.bpm as number)) <= 5);

    if (candidates.length === 0) {
      return { 
        recommendation: null, 
        bpm: null, 
        camelotKey: null, 
        reason: 'No compatible tracks found - all similar BPM tracks have been played or excluded' 
      };
    }

    // 4. Bias by energy direction
    if (energyDirection === 'increase') {
      candidates = candidates.sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0));
    } else if (energyDirection === 'decrease') {
      candidates = candidates.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
    }

    // 5. Score by Camelot adjacency
    const parseNum = (key: string) => parseInt(key.replace(/\D/g, ''), 10);
    const camelotNum = current.camelotKey ? parseNum(current.camelotKey) : NaN;
    const camelotLetter = current.camelotKey?.slice(-1) || '';

    const scoredCandidates: Candidate[] = candidates.map(t => {
      let score = 10;
      if (t.camelotKey && !isNaN(camelotNum)) {
        const num = parseNum(t.camelotKey);
        const letter = t.camelotKey.slice(-1);
        const diff = Math.min(Math.abs(num - camelotNum), 12 - Math.abs(num - camelotNum));
        if (diff === 0 && letter === camelotLetter) score = 1; // Perfect match
        else if (diff === 1 && letter === camelotLetter) score = 2; // Adjacent key
        else if (diff === 0 && letter !== camelotLetter) score = 3; // Relative major/minor
        else score = 5 + diff;
      }
      return { trackId: t.trackId, bpm: t.bpm, key: t.key, camelotKey: t.camelotKey, score };
    });

    // 6. Sort candidates by score
    scoredCandidates.sort((a, b) => a.score - b.score);

    // 7. Prepare top recommendation
    const top = scoredCandidates[0];
    const recommendationResult: RecommendationResult = {
      recommendation: top.trackId,
      bpm: top.bpm,
      camelotKey: top.camelotKey,
      reason: `Best harmonic match (score: ${top.score}) - BPM within ±5 and optimal Camelot adjacency`
    };

    // 8. Return full candidates list and top result
    return { 
      ...recommendationResult, 
      candidates: scoredCandidates.slice(0, 5) // Return top 5 for context
    };
  }
});
