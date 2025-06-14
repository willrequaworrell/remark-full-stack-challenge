import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const result = streamText({
      model: openai('gpt-4o'),
      maxSteps: 10, // Conservative buffer for complex interactions
      temperature: 0.7, // Encourage creativity while staying focused
      system: `You're an enthusiastic music assistant. When asked about liked songs:
1. REQUIRED: Use getUserLibrary tool
2. ALWAYS include:
   - Total track count
   - 3-5 diverse examples with artists
   - Personalized insight about their taste
3. NEVER mention technical details (tools, APIs, etc)
4. Keep responses under 3 sentences`,
      
      messages,
      
      tools: {
        getUserLibrary: tool({
          description: 'Get user\'s Spotify liked songs. Returns {total: number, tracks: {name: string, artist: string}[]}',
          parameters: z.object({}),
          execute: async () => {
            const session = await getServerSession(authOptions);
            if (!session?.accessToken) throw new Error('Not signed in to Spotify');
            
            const response = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
              headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            if (!response.ok) {
              throw new Error(`Spotify error: ${response.status} - ${await response.text()}`);
            }

            const data = await response.json();
            return {
              total: data.total,
              tracks: data.items.map((item: any) => ({
                name: item.track.name,
                artist: item.track.artists[0]?.name,
              }))
            };
          },
        }),
        getTrackDetails: tool({
          description: 'Fetch BPM, key, and metadata for a track from GetSongBPM',
          parameters: z.object({
            songTitle: z.string(),
            artistName: z.string().optional()
          }),
          execute: async ({ songTitle, artistName }) => {
            try {
              const apiKey = process.env.GETSONGBPM_API_KEY;
              if (!apiKey) throw new Error('API key missing');
      
              const lookup = artistName
              ? `song:${songTitle.replace(/ /g, '+')} artist:${artistName.replace(/ /g, '+')}`
              : songTitle.replace(/ /g, '+');

              const searchUrl = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=${artistName ? 'both' : 'song'}&lookup=${lookup}`.trim();
              console.log(searchUrl.replace(/ /g, ''))
              // 2. Get song ID
              const searchResponse = await fetch(searchUrl);
              if (!searchResponse.ok) throw new Error(`Search failed: ${searchResponse.status}`);
              
              const searchData = await searchResponse.json();
              console.log(searchData)
              const firstSong = searchData.search?.[0];
              if (!firstSong?.id) {
                throw new Error('Song not found');
              }
      
              // 3. Get detailed track data
              const songUrl = `https://api.getsongbpm.com/song/?api_key=${apiKey}&id=${firstSong.id}`;
              const songResponse = await fetch(songUrl);
              if (!songResponse.ok) throw new Error(`Details failed: ${songResponse.status}`);
      
              const songData = await songResponse.json();
              
              return {
                title: songData.song.title,
                artist: songData.song.artist.name,
                bpm: songData.song.tempo,
                key: songData.song.key_of,
                danceability: songData.song.danceability,
                energy: songData.song.energy,
                spotifyId: songData.song.spotify_id
              };
      
            } catch (error) {
              return { 
                error: error instanceof Error ? error.message : 'Failed to fetch track details',
                suggestion: 'Try being more specific with both song and artist names'
              };
            }
          }
        })
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500 }
    );
  }
}
