"use client";

import { useChat } from "@ai-sdk/react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function ChatInterface() {
  const { data: session } = useSession();
  const { messages, input, handleInputChange, handleSubmit } = useChat();

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
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="mb-4 flex justify-between items-center">
        <p>Signed in as {session.user?.email}</p>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
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
          placeholder="Ask about music recommendations..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
