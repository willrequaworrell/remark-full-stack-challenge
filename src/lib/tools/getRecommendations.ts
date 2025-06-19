import { tool } from 'ai';
import { z } from 'zod';

export const getRecommendations = tool({
  description: 'Recommend the next track based on BPM proximity and Camelot harmonic mixing',
  parameters: z.object({
    currentTrackId: z.string(),
    playlistTrackData: z.array(z.object({
      trackId: z.string(),
      bpm: z.number().nullable(),
      key: z.string().nullable(),
      camelotKey: z.string().nullable(),
      energy: z.number().optional()
    })),
    energyDirection: z.enum(['maintain','increase','decrease']).optional()
  }),
  execute: async ({ currentTrackId, playlistTrackData, energyDirection = 'maintain' }) => {
    // 1. Find current track metadata
    const current = playlistTrackData.find(t => t.trackId === currentTrackId);
    if (!current || current.bpm === null || !current.camelotKey) {
      throw new Error('Current track metadata unavailable');
    }

    // 2. Filter by BPM ±5
    let candidates = playlistTrackData
      .filter(t => t.trackId !== currentTrackId && t.bpm !== null)
      .filter(t => Math.abs((t.bpm as number) - (current.bpm as number)) <= 5);

    // 3. Bias by energy direction
    if (energyDirection === 'increase') {
      candidates = candidates.sort((a,b) => (b.energy||0) - (a.energy||0));
    } else if (energyDirection === 'decrease') {
      candidates = candidates.sort((a,b) => (a.energy||0) - (b.energy||0));
    }

    // 4. Score by Camelot adjacency
    const camelotNum = parseInt(current.camelotKey!);
    const camelotLetter = current.camelotKey!.slice(-1);
    const otherLetter = camelotLetter === 'A' ? 'B' : 'A';
    const score = (t: any) => {
      if (!t.camelotKey) return 10;
      const num = parseInt(t.camelotKey);
      const letter = t.camelotKey.slice(-1);
      const diff = Math.min(Math.abs(num - camelotNum), 12 - Math.abs(num - camelotNum));
      return (diff === 0 && letter !== camelotLetter) ? 1
           : (diff === 1 && letter === camelotLetter) ? 2
           : (diff === 0 && letter === otherLetter) ? 3
           : 5 + diff;
    };
    candidates.sort((a,b) => score(a) - score(b));

    // 5. Select best match
    const best = candidates[0];
    if (!best) {
      throw new Error('No compatible tracks found');
    }

    return {
      recommendation: best.trackId,
      bpm: best.bpm,
      camelotKey: best.camelotKey,
      reason: `Selected for BPM proximity (±5 BPM) and Camelot adjacency` 
    };
  }
});
