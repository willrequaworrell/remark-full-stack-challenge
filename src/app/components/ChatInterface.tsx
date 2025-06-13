"use client";

import { useChat } from "@ai-sdk/react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSpotifyLibrary } from "@/hooks/useSpotify";

export default function ChatInterface() {
  const { data: session } = useSession();
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const { library, loading, error } = useSpotifyLibrary();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">AI Music Assistant</h1>
        <button
          onClick={() => signIn("spotify")}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
        >
          Sign in with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl py-24 mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p>Signed in as {session.user?.email}</p>
          {library && (
            <p className="text-sm text-gray-600">
              {library.total} liked songs loaded
            </p>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>

      {/* Library Preview */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Your Spotify Library (Test)</h3>
        {loading && <p>Loading your liked songs...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {library && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {library.tracks.slice(0, 5).map((track) => (
              <div key={track.id} className="text-sm">
                <strong>{track.name}</strong> by {track.artist}
              </div>
            ))}
            {library.tracks.length > 5 && (
              <p className="text-xs text-gray-500">
                ...and {library.tracks.length - 5} more tracks
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex flex-col max-w-md mx-auto stretch">
        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap mb-4">
            {message.role === "user" ? "User: " : "AI: "}
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <input
            className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
            value={input}
            placeholder="Ask about your music library..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </div>
  );
}
