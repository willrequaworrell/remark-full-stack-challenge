"use client";

import { useChat } from "@ai-sdk/react";
import { useSession, signIn } from "next-auth/react";
import { useRef, useEffect, FormEvent, useMemo } from "react";
import { ConsolidatedTrack, SpotifyPlaylistTrack } from "../types/track";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatMessageLoading from "./ChatMessageLoading";

interface ChatSectionProps {
  playlistId: string;
  playlistTracks: SpotifyPlaylistTrack[];
  currentTrackId: string;
  aiConsolidatedTrackData: ConsolidatedTrack[];
}

const ChatSection = ({ playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData,}: ChatSectionProps) => {
  const { data: session } = useSession();
  const chatConfig = useMemo(
    () => ({
      api: "/api/chat",
      body: { playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData },
    }),
    [playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData]
  );
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat(chatConfig);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { body: { playlistId, playlistTracks, currentTrackId } });
  };
  if (aiConsolidatedTrackData) console.log(aiConsolidatedTrackData)
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
        {messages.map((message, idx) => {
          // Detect if this assistant message is still empty
          const hasText = message.parts.some(
            (p) => p.type === "text" && p.text.trim() !== ""
          );

          // While loading and this is the new assistant stub, show placeholder bubble
          if (isLoading && message.role === "assistant" && !hasText) {
            return (
              <ChatMessageLoading key={idx}/>
            );
          }

          // Otherwise render the normal message bubble
          return (
            <ChatMessage key={message.id ?? idx} message={message} index={idx} />
          );
        })}

        <div ref={chatEndRef} />
      </div>

      <ChatInput
        value={input}
        disabled={isLoading}
        onChange={handleInputChange}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default ChatSection;
