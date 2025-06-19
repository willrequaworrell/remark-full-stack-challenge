"use client";
import React, { useEffect } from "react";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";

interface PlaybackOptions {
  playlistUri?: string;
  initialTrackIndex?: number;
  trackUri?: string;        
  trackPosition?: number;   
}

interface PlayerSectionProps {
  options?: PlaybackOptions
  onTrackChange: (trackId: string) => void
}

export default function PlayerSection({ options, onTrackChange }: PlayerSectionProps) {
  const { 
    playerState,
    isPlaying,
    togglePlayback,
    handlePrevious,
    handleNext,
    isPlaylistLoading
  } = useSpotifyPlayer(options || {});

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const track = isPlaylistLoading
  ? {
      albumArt: "",
      albumColor: "#d1d5dc",
      title: "Loading...",
      artist: "Loading...",
      nowPlaying: "Loading",
      currentTime: "00:00",
      duration: "00:00",
      progress: 0,
    }
  : playerState
  ? {
      albumArt: playerState.track_window?.current_track?.album?.images[0]?.url || "",
      albumColor: "#d28ab6",
      title: playerState.track_window?.current_track?.name || "No Track",
      artist: playerState.track_window?.current_track?.artists?.map(a => a.name).join(", ") || "No Artist",
      nowPlaying: "Now Playing",
      currentTime: formatTime(playerState.position || 0),
      duration: formatTime(playerState.track_window?.current_track?.duration_ms || 0),
      progress: playerState.position && playerState.track_window?.current_track?.duration_ms
        ? Math.round((playerState.position / playerState.track_window.current_track.duration_ms) * 100)
        : 0,
    }
  : {
      albumArt: "",
      albumColor: "#d1d5dc",
      title: "",
      artist: "",
      nowPlaying: "",
      currentTime: "00:00",
      duration: "00:00",
      progress: 0,
    };


    useEffect(() => {
      const newTrackId = playerState?.track_window.current_track.id;
      if (newTrackId && onTrackChange) {
        onTrackChange(newTrackId);  // Notify parent of current track change
      }
    }, [playerState, onTrackChange])

  return (
    <section className="flex flex-col flex-1 min-h-0 p-4 border-b-2 border-black h-1/2 md:p-6">
      <h2 className="w-full mb-2 text-lg font-black tracking-tight text-left text-black uppercase md:text-xl">
        Playing
      </h2>
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        {/* Album Art */}
        <div
          className="flex items-center justify-center w-24 h-24 mb-2 border-2 border-black md:w-32 md:h-32"
          style={{ background: track.albumColor }}
        >
          {isPlaylistLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-transparent animate-spin"></div>
              {/* <p className="mt-2 text-sm text-gray-500">Loading tracks...</p> */}
            </div> 
          ) : track.albumArt ? (
            <img src={track.albumArt} alt={track.title} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-black text-black md:text-xl">{track.title}</span>
          )}
        </div>

        {/* Now Playing Info */}
        <h3 className="text-xs md:text-sm font-black uppercase mb-0.5 tracking-tight text-black">
          {track.title}
        </h3>
        <p className="mb-1 text-xs font-semibold text-black">{track.artist}</p>
        {/* Controls */}
        <div className="flex items-center justify-center mb-2 space-x-2">
          <button
            onClick={handlePrevious}
            disabled={!playerState}
            className="flex items-center justify-center w-6 h-6 transition border-2 border-black rounded-full hover:bg-black hover:text-white disabled:opacity-50"
          >
            {/* Previous Icon */}
          </button>
          <button
            onClick={togglePlayback}
            disabled={!playerState}
            className={`w-7 h-7 border-2 border-black rounded-full flex items-center justify-center ${
              isPlaying ? "bg-white text-black" : "bg-black text-white"
            } hover:bg-white hover:text-black transition disabled:opacity-50`}
          >
            {/* Play/Pause Icons */}
          </button>
          <button
            onClick={handleNext}
            disabled={!playerState}
            className="flex items-center justify-center w-6 h-6 transition border-2 border-black rounded-full hover:bg-black hover:text-white disabled:opacity-50"
          >
            {/* Next Icon */}
          </button>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 mb-1 bg-gray-200 border-2 border-black rounded">
          <div
            className="h-1 bg-[#d28ab6] rounded"
            style={{ width: `${track.progress}%` }}
          ></div>
        </div>
        {/* Time Info */}
        <div className="flex justify-between w-full font-mono text-xs text-black">
          <span>{track.currentTime}</span>
          <span>{track.duration}</span>
        </div>
      </div>
    </section>
  );
}
