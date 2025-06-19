"use client";

import { useChat } from "@ai-sdk/react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useRef, useEffect, FormEvent, useMemo } from "react";

export default function ChatSection({ playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData }: { playlistId: string, playlistTracks: any[], currentTrackId: string, aiConsolidatedTrackData: any[] }) {
  const { data: session } = useSession();
  const chatConfig = useMemo(() => ({
    api: '/api/chat',
    body: { playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData}
  }), [playlistId, playlistTracks, currentTrackId, aiConsolidatedTrackData]);
  const { messages, input, handleInputChange, handleSubmit } = useChat(chatConfig);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, {
      body: { playlistId, playlistTracks, currentTrackId }
    });
  };
  

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <section className="flex flex-col lg:w-[38.2%] w-full p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black tracking-tight text-black uppercase md:text-xl">DJ AI</h2>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
      <div className="flex-1 mb-3 space-y-3 overflow-y-auto custom-scrollbar">
        {messages.map((message, idx) => (
          <div
            key={message.id || idx}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`border-2 border-black rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return <p className="text-sm" key={i}>{part.text}</p>;
                  case "tool-invocation":
                    return (
                      <p className="text-xs text-gray-500" key={i}>
                        Calling {part.toolInvocation.toolName}...
                      </p>
                    );
                  case "step-start":
                    return (
                      <p className="text-xs text-gray-400" key={i}>
                        {part.type}...
                      </p>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form
        onSubmit={onSubmit}
        className="flex mt-auto space-x-2"
        autoComplete="off"
      >
        <input
          type="text"
          value={input}
          placeholder="Type your message..."
          onChange={handleInputChange}
          className="flex-1 px-4 py-2 border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="flex items-center justify-center w-10 h-10 text-white transition bg-black border-2 border-black rounded-full hover:bg-white hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </form>
    </section>
  );
}
