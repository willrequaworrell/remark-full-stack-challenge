export interface GetSongBPMTrack {
    id: string;
    title: string;
    artist: string;
    bpm?: number;
    key?: string;
    danceability?: number;
    energy?: number;
  }
  
  export interface GetSongBPMResult {
    matches: GetSongBPMTrack[];
    error?: string;
    suggestion?: string;
  }
  
  export async function getTrackDetailsFromGetSongBPM(
    songTitle: string,
    artistName?: string
  ): Promise<GetSongBPMResult> {
    try {
      const apiKey = process.env.GETSONGBPM_API_KEY;
      if (!apiKey) throw new Error('API key missing');
  
      const lookup = artistName
        ? `song:${songTitle.replace(/ /g, '+')} artist:${artistName.replace(/ /g, '+')}`
        : songTitle.replace(/ /g, '+');
  
      const searchUrl = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=${artistName ? 'both' : 'song'}&lookup=${lookup}`.trim();
  
      // 1. Get all search matches
      const searchResponse = await fetch(searchUrl.replace(/ /g, ''));
      if (!searchResponse.ok) throw new Error(`Search failed: ${searchResponse.status}`);
  
      const searchData = await searchResponse.json();
      const matchesRaw = Array.isArray(searchData.search) ? searchData.search : [];
  
      // 2. Fetch details for each match (limit to 5 for performance)
      const matches: GetSongBPMTrack[] = [];
      for (const song of matchesRaw.slice(0, 5)) {
        if (!song.id) continue;
        const songUrl = `https://api.getsongbpm.com/song/?api_key=${apiKey}&id=${song.id}`;
        const songResponse = await fetch(songUrl);
        if (!songResponse.ok) continue;
        const songData = await songResponse.json();
        if (!songData.song) continue;
        matches.push({
          id: songData.song.id,
          title: songData.song.title,
          artist: songData.song.artist?.name,
          bpm: songData.song.tempo,
          key: songData.song.key_of,
          danceability: songData.song.danceability,
          energy: songData.song.energy,
        });
      }
      console.log(matches)
      if (matches.length === 0) {
        return {
          matches: [],
          error: 'No matching tracks found.',
          suggestion: 'Try being more specific with both song and artist names.'
        };
      }
  
      return { matches };
  
    } catch (error) {
      return {
        matches: [],
        error: error instanceof Error ? error.message : 'Failed to fetch track details',
        suggestion: 'Try being more specific with both song and artist names'
      };
    }
  }
  