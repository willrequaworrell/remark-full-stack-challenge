import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { SpotifyPlaylistTrack } from "@/app/types/track";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to include only what we need
    const tracks = data.items.map((item: SpotifyPlaylistTrack) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0]?.name,
      album: item.track.album,
      uri: item.track.uri,
    }));

    return NextResponse.json({ 
      tracks,
      total: data.total,
      next: data.next 
    });

  } catch (error) {
    console.error("Error fetching Spotify library:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" }, 
      { status: 500 }
    );
  }
}
