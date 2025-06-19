"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, Dispatch, SetStateAction } from "react";

export default function PlaylistPicker({ onSelect}: { onSelect: (id: string) => void}) {
  const { data: session, status } = useSession();
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('using effect', status, session)
    if (status !== "authenticated" || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);

    fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch playlists: ${res.status}`)))
      .then((data) => setPlaylists(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fetch playlists"))
      .finally(() => setLoading(false));
  }, [session?.accessToken, status, session]);



  if (status === "loading") {
    return <div className="flex flex-col items-center justify-center min-h-screen">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="mb-4 text-2xl font-bold">AI Music Assistant</h1>
        <button
          onClick={() => signIn("spotify")}
          className="px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600"
        >
          Sign in with Spotify
        </button>
      </div>
    );
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-screen">Loading your playlists...</div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-screen text-red-500">{error}</div>;
  if (playlists.length === 0) return <div className="flex flex-col items-center justify-center min-h-screen">No playlists found.</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <h1 className="text-2xl font-bold">Select a Playlist</h1>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
      <div className="w-full max-w-md overflow-y-auto max-h-96">
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => onSelect(playlist.id)}
            className="w-full p-4 text-left transition-colors border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <strong>{playlist.name}</strong>
            <p className="text-sm text-gray-500">{playlist.tracks.total} tracks</p>
          </button>
        ))}
      </div>
    </div>
  );
}
