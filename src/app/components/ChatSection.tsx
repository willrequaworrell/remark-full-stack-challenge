// app/components/ChatSection.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useSession, signIn } from "next-auth/react";
import { useRef, useEffect, FormEvent, useMemo } from "react";
import { ConsolidatedTrack, PlaylistTrackCardType, SpotifyPlaylistTrack } from "../types/track";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatMessageLoading from "./ChatMessageLoading";

interface ChatSectionProps {
  playlistId: string;
  playlistTracks: SpotifyPlaylistTrack[];
  currentTrackId: string;
  aiConsolidatedTrackData: ConsolidatedTrack[];
  onTrackPlay: (track: PlaylistTrackCardType, trackIndex: number) => void
}

const ChatSection = ({ 
  playlistId, 
  playlistTracks, 
  currentTrackId, 
  aiConsolidatedTrackData,
  onTrackPlay
}: ChatSectionProps) => {
  const { data: session } = useSession();
  
  const chatConfig = useMemo(
    () => ({
      api: "/api/chat",
      initialMessages: [
        {
          id: "greeting",
          role: "assistant" as const,
          content: "Hi there! Ask me anything about the current track, playlist, or what to play next!"
        }
      ]
    }),
    []
  );
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat(chatConfig);
    
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { 
      body: { 
        playlistId, 
        playlistTracks, 
        currentTrackId, 
        aiConsolidatedTrackData 
      } 
    });
  };
  
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="mb-4 text-2xl font-black">AI Playlist Assistant</h1>
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
    <section className="flex flex-col w-full lg:w-[38.2%] p-4 md:p-6 h-full border-black">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black md:text-xl">AI Disc Jockey</h2>
      </div>

      <div className="flex-1 mb-3 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((message, idx) => {
          const hasText = message.parts.some(
            (p) => p.type === "text" && p.text.trim() !== ""
          );

          if (isLoading && message.role === "assistant" && !hasText) {
            return <ChatMessageLoading key={idx}/>;
          }

          return (
            <ChatMessage 
              key={message.id ?? idx} 
              message={message} 
              onTrackPlay={onTrackPlay}
              playlistTracks={playlistTracks} 
              aiConsolidatedTrackData={aiConsolidatedTrackData}
            />
          );
        })}

        <div ref={chatEndRef} />
      </div>

      <ChatInput
        ref={inputRef} 
        value={input}
        disabled={isLoading}
        onChange={handleInputChange}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default ChatSection;
