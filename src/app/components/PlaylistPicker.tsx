"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export default function PlaylistPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: session, status } = useSession();
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (status !== "authenticated" || !session?.accessToken) return;
      
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("https://api.spotify.com/v1/me/playlists", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your Spotify session has expired. Please sign out and sign back in.");
          } else if (response.status === 403) {
            throw new Error("Access denied. Please check your Spotify permissions.");
          } else if (response.status >= 500) {
            throw new Error("Spotify servers are currently unavailable. Please try again later.");
          } else {
            throw new Error(`Failed to fetch playlists (Error ${response.status}). Please try again.`);
          }
        }

        const data = await response.json();
        setPlaylists(data.items || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred while fetching playlists.");
        }
        console.error("Playlist fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [session?.accessToken, status]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Loading session...
      </div>
    );
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size={16} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white border-2 border-black rounded-xl">
          <h2 className="mb-2 text-lg font-semibold text-red-800">Unable to Load Playlists</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center bg-white border-2 border-black rounded-xl">
          No playlists found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-xl overflow-hidden bg-white border-2 border-black rounded-xl">
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h1 className="text-2xl font-bold">Select a Playlist</h1>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto max-h-96">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onSelect(playlist.id)}
              className="w-full p-3 text-left transition-colors border-2 border-black rounded-lg hover:bg-gray-100"
            >
              <strong>{playlist.name}</strong>
              <p className="text-sm text-gray-500">{playlist.tracks.total} tracks</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
