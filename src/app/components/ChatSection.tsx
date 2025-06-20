"use client";

import { useChat } from "@ai-sdk/react"; 
import { useSession, signIn } from "next-auth/react"; 
import { useRef, useEffect, FormEvent, useMemo } from "react";
import { PiDotsThreeOutlineDuotone } from "react-icons/pi";
import { ConsolidatedTrack, SpotifyPlaylistTrack } from "../types/track";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface ChatSectionProps {
  playlistId: string;
  playlistTracks: SpotifyPlaylistTrack[];
  currentTrackId: string;
  aiConsolidatedTrackData: ConsolidatedTrack[];
}

const ChatSection = ({playlistId, playlistTracks,currentTrackId, aiConsolidatedTrackData}: ChatSectionProps) => {

  const { data: session } = useSession();  
  const chatConfig = useMemo(() => ({
    api: "/api/chat",
    body: { playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData }
  }), [playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData]);
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading } = useChat(chatConfig);
  
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
          <ChatMessage
            message={message}
            index={idx}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <PiDotsThreeOutlineDuotone className="w-6 h-6 text-gray-500 animate-pulse" />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <ChatInput
        value={input}
        disabled={isLoading}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </section>
  );
}


export default ChatSection
