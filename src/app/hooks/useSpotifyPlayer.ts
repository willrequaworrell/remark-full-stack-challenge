"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

// Spotify Player types are declared in the Web Playback SDK
// (see Spotify Web Playback SDK Reference)[1].
interface PlaybackOptions {
  playlistUri?: string;
  initialTrackIndex?: number;
  trackUri?: string;
  trackPosition?: number;
}

export function useSpotifyPlayer(options: PlaybackOptions) {
  const { data: session } = useSession();

  const playerRef = useRef<Spotify.Player | null>(null);

  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState<Spotify.PlaybackState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);

  const [playlistError, setPlaylistError] = useState<string | null>(null);

  // Initialize Spotify Player  
  useEffect(() => {
    if (!session?.accessToken || typeof window === "undefined") return;

    const initializePlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: "AI Music Assistant",
        getOAuthToken: (cb) => cb(session.accessToken!),
        volume: 0.5,
      });

      newPlayer.addListener("player_state_changed", (state) => {
        setPlayerState(state);
        setIsPlaying(!state.paused);
      });

      newPlayer.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      newPlayer.addListener("not_ready", () => {
        setIsPlayerReady(false);
      });

      newPlayer.addListener("initialization_error", ({ message }) => {
        console.error("SDK Init Error:", message);
      });

      newPlayer.addListener("authentication_error", ({ message }) => {
        console.error("Auth Error:", message);
      });

      newPlayer.connect();
      playerRef.current = newPlayer;
    };

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => console.error("Spotify SDK load failed");
      document.body.appendChild(script);
    }

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
      setIsPlayerReady(false);
      setDeviceId("");
      setPlayerState(null);
      setIsPlaying(false);
    };
  }, [session?.accessToken]);

  // Load playlist with proper sequencing
  useEffect(() => {
    const loadPlaylistWithRetry = async () => {
      // Skip if prerequisites are not met
      if (!isPlayerReady || !deviceId || !options.playlistUri || isPlaylistLoading) {
        return;
      }

      setIsPlaylistLoading(true);
      setPlaylistError(null);

      try {
        // Transfer playback to this device without auto-play
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: [deviceId], play: false }),
        });

        // Small delay to ensure transfer completes
        await new Promise((r) => setTimeout(r, 500));

        // Construct play request
        const playbackBody: Record<string, any> = {
          context_uri: options.playlistUri,
          position_ms: 0,
        };

        if (options.trackPosition != null) {
          playbackBody.offset = { position: options.trackPosition };
        } else if (options.trackUri) {
          playbackBody.offset = { uri: options.trackUri };
        } else {
          playbackBody.offset = { position: options.initialTrackIndex || 0 };
        }

        const playResponse = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(playbackBody),
          }
        );

        if (!playResponse.ok) {
          // Throw to trigger catch
          throw new Error(`Load failed (status ${playResponse.status})`);
        }
      } catch (err) {
        // Capture the error message  
        //  Optionally retry up to 2 more times if it's a network issue  
        //  Surface the error via state for UI feedback
        const message = err instanceof Error ? err.message : String(err);
        console.error("Playlist load error:", message);

        // Example retry logic on network failures
        if (message.includes("NetworkError") && retryCount < 2) {
          retryCount++;
          console.log(`Retrying load (#${retryCount})`);
          await loadPlaylistWithRetry();
        } else {
          setPlaylistError(message);
        }
      } finally {
        setIsPlaylistLoading(false);
      }
    };

    // Track number of retries
    let retryCount = 0;
    loadPlaylistWithRetry();
  }, [
    isPlayerReady,
    deviceId,
    options.playlistUri,
    options.initialTrackIndex,
    options.trackUri,
    options.trackPosition,
    session?.accessToken,
  ]);

  // Playback controls
  const togglePlayback = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.togglePlay();
    } catch (error) {
      console.error("Play/pause error:", error);
    }
  };

  const handlePrevious = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.previousTrack();
    } catch (error) {
      console.error("Previous-track error:", error);
    }
  };

  const handleNext = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.nextTrack();
    } catch (error) {
      console.error("Next-track error:", error);
    }
  };

  return {
    player: playerRef.current,
    deviceId,
    playerState,
    isPlaying,
    isPlayerReady,
    isPlaylistLoading,
    playlistError,           
    togglePlayback,
    handlePrevious,
    handleNext,
  };
}
