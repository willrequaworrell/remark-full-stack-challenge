"use client";
import React, { useEffect, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { TbLoader3 } from "react-icons/tb";
import { LoadingSpinner } from "./LoadingSpinner";

interface PlaybackOptions {
  playlistUri?: string;
  initialTrackIndex?: number;
  trackUri?: string;        
  trackPosition?: number;   
}

interface PlayerSectionProps {
  options?: PlaybackOptions;
  onTrackChange: (trackId: string) => void;
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

  const [livePosition, setLivePosition] = useState(0);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying && playerState?.position !== undefined) {
      intervalId = setInterval(() => {
        setLivePosition(prev => prev + 100);
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, playerState?.position]);

  useEffect(() => {
    if (playerState?.position !== undefined) {
      setLivePosition(playerState.position);
    }
  }, [playerState?.position]);

  const track = isPlaylistLoading
    ? {
        albumArt: "",
        albumColor: "#ffffff",
        title: "Loading...",
        artist: "Loading...",
        currentTime: "00:00",
        duration: "00:00",
        progress: 0,
      }
    : playerState
    ? {
        albumArt: playerState.track_window?.current_track?.album?.images[0]?.url || "",
        albumColor: "#ffffff",
        title: playerState.track_window?.current_track?.name || "No Track",
        artist: playerState.track_window?.current_track?.artists?.map(a => a.name).join(", ") || "No Artist",
        currentTime: formatTime(livePosition),
        duration: formatTime(playerState.track_window?.current_track?.duration_ms || 0),
        progress: playerState.track_window?.current_track?.duration_ms
          ? Math.round((livePosition / playerState.track_window.current_track.duration_ms) * 100)
          : 0,
      }
    : {
        albumArt: "",
        albumColor: "#ffffff",
        title: "",
        artist: "",
        currentTime: "00:00",
        duration: "00:00",
        progress: 0,
      };

  useEffect(() => {
    const newTrackId = playerState?.track_window.current_track.id;
    if (newTrackId) onTrackChange(newTrackId);
  }, [playerState, onTrackChange]);

  return (
    <section className="flex flex-col flex-1 min-h-0 p-4 border-b-2 border-black h-1/2 md:p-6">
      <h2 className="w-full mb-2 text-lg font-black tracking-tight text-left text-black uppercase md:text-xl">
        NOW PLAYING
      </h2>
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        {/* Album Art (10% larger) */}
        <div
          className="flex items-center justify-center mb-2 border-2 border-black w-28 h-28 md:w-36 md:h-36"
          style={{ background: track.albumColor }}
        >
          {isPlaylistLoading ? (
            <LoadingSpinner size={8}/> 
          ) : track.albumArt ? (
            <img src={track.albumArt} alt={track.title} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-black text-black md:text-xl">{track.title}</span>
          )}
        </div>

        {/* Track Info */}
        <h3 className="text-xs md:text-sm font-black uppercase mb-0.5 tracking-tight text-black">
          {track.title}
        </h3>
        <p className="mb-1 text-xs font-semibold text-black">{track.artist}</p>
        
        {/* Controls */}
        <div className="flex items-center justify-center mb-2 space-x-2">
          <button
            onClick={handlePrevious}
            disabled={!playerState}
            className="flex items-center justify-center w-6 h-6 text-white transition-colors bg-black border-2 border-black rounded-full hover:bg-white hover:text-black disabled:opacity-50"
          >
            <FaStepBackward size={12} />
          </button>
          <button
            onClick={togglePlayback}
            disabled={!playerState}
            className="flex items-center justify-center text-center text-white transition-colors bg-black border-2 border-black rounded-full w-7 h-7 hover:bg-white hover:text-black disabled:opacity-50"
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>
          <button
            onClick={handleNext}
            disabled={!playerState}
            className="flex items-center justify-center w-6 h-6 text-white transition-colors bg-black border-2 border-black rounded-full hover:bg-white hover:text-black disabled:opacity-50"
          >
            <FaStepForward size={12} />
          </button>
        </div>

        {/* Progress Bar - Fixed alignment */}
        <div className="relative w-full h-2 mb-1 overflow-hidden border-2 border-black rounded">
          <div
            className="absolute top-0 left-0 h-full bg-[#d28ab6] rounded-sm"
            style={{ width: `${track.progress}%` }}
          ></div>
        </div>

        {/* Time Display */}
        <div className="flex justify-between w-full font-mono text-xs text-black">
          <span>{track.currentTime}</span>
          <span>{track.duration}</span>
        </div>
      </div>
    </section>
  );
}
