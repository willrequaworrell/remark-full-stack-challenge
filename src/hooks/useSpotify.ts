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
}

interface LibraryData {
  tracks: SpotifyTrack[];
  total: number;
  next: string | null;
}

export function useSpotifyLibrary() {
  const { data: session } = useSession();
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spotify/library");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLibrary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLibrary();
    }
  }, [session]);

  return { library, loading, error, refetch: fetchLibrary };
}
