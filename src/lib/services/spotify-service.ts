import { getServerSession } from "next-auth";
import { SpotifyPlaylistTrack } from "@/app/types/track";
import { authOptions } from "../auth/authOptions";

export async function getSpotifyAccessToken() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) throw new Error('Not signed in to Spotify');
  return session.accessToken;
}

export async function getPlaylistTracks(playlistId: string) {
  try {
    const accessToken = await getSpotifyAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
    const data = await response.json();
    return data.items.map((item: SpotifyPlaylistTrack) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0].name,
    }));
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    throw error;
  }
}

export async function transferPlayback(deviceId: string, accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ device_ids: [deviceId], play: true })
  });
  if (!res.ok) {
    throw new Error(`Transfer failed: ${res.status}`); 
  }
}
