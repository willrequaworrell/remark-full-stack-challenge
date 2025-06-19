"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  uri: string;
  external_url: string;
  added_at: string;
  albumArt?: string; 
}

interface SpotifyData {
  tracks: SpotifyTrack[];
  total: number;
  next: string | null;
}

export function useSpotifyTracks(
  type: "library" | "playlist" = "library",
  playlistId?: string
) {
  const { data: session } = useSession();
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      let url: string;
      if (type === "library") {
        url = "https://api.spotify.com/v1/me/tracks";
      } else if (type === "playlist" && playlistId) {
        url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
      } else {
        throw new Error("Invalid type or missing playlistId");
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const items = json.items || [];
      
      setData({
        tracks: items.map((item: any) => ({
          id: item.track?.id || item.id,
          name: item.track?.name || item.name,
          artist: item.track?.artists[0]?.name || item.artists?.[0]?.name,
          album: item.track?.album?.name || item.album?.name,
          uri: item.track?.uri || item.uri,
          external_url: item.track?.external_urls?.spotify || item.external_urls?.spotify,
          added_at: item.added_at,
          albumArt: item.track?.album?.images?.[0]?.url || "",
        })),
        total: json.total,
        next: json.next,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, type, playlistId]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData 
  };
}
