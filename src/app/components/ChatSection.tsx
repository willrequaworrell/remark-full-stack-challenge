"use client";

import { useChat } from "@ai-sdk/react"; 
import { useSession, signIn, signOut } from "next-auth/react"; 
import { useRef, useEffect, FormEvent, useMemo } from "react";
import { PiDotsThreeOutlineDuotone } from "react-icons/pi";

export default function ChatSection({
  playlistId,
  playlistTracks,
  currentTrackId,
  aiConsolidatedTrackData
}: {
  playlistId: string;
  playlistTracks: any[];
  currentTrackId: string;
  aiConsolidatedTrackData: any[];
}) {
  const { data: session } = useSession();  
  const chatConfig = useMemo(() => ({
    api: "/api/chat",
    body: { playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData }
  }), [playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData]);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat(chatConfig);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handler for form submission
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { body: { playlistId, playlistTracks, currentTrackId } });
  };

  // Prompt login if no session
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="mb-4 text-2xl font-black">AI Music Assistant</h1>
        <button
          onClick={() => signIn("spotify")}
          className="px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600"
        >
          Sign in with Spotify
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col w-full lg:w-[38.2%] p-4 md:p-6 h-full border-l-2 border-black">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black uppercase md:text-xl">DJ AI</h2>
      </div>
      <div className="flex-1 mb-3 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((message, idx) => (
          <div
            key={message.id || idx}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`border-2 border-black px-4 py-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-black text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                  : "bg-white text-black rounded-tl-lg rounded-tr-lg rounded-br-lg"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p className="text-sm" key={i}>
                      {part.text}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <PiDotsThreeOutlineDuotone className="w-6 h-6 text-gray-500 animate-pulse" />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSubmit} className="flex space-x-2" autoComplete="off">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-70 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center w-10 h-10 text-black transition-colors bg-white border-2 border-black rounded-full hover:bg-black hover:text-white disabled:opacity-70 disabled:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19l9 2-9-18-9 18 9-2zM12 19v-8"
            />
          </svg>
        </button>
      </form>
    </section>
  );
}
