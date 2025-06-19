"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface PlayerState {
  paused: boolean;
  position: number;
  track_window: {
    current_track: {
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images: Array<{ url: string }>;
      };
      duration_ms: number;
    };
  };
  context: {
    uri: string;
  };
}

interface PlaybackOptions {
  playlistUri?: string;
  initialTrackIndex?: number;
  trackUri?: string;        
  trackPosition?: number;   
}

export function useSpotifyPlayer(options: PlaybackOptions) {
  const { data: session } = useSession();

  const playerRef = useRef<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState<Spotify.PlaybackState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);

  // Initialize Spotify Player
  useEffect(() => {
    if (!session?.accessToken || typeof window === "undefined") return;

    const initializePlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: "AI Music Assistant",
        getOAuthToken: (cb: (token: string) => void) => cb(session.accessToken!),
        volume: 0.5,
      });

      newPlayer.addListener("player_state_changed", (state: Spotify.PlaybackState) => {
        setPlayerState(state);
        setIsPlaying(state ? !state.paused : false);
      });

      // Modified ready listener - don't auto-transfer playback
      newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Player ready with Device ID:', device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
        // Don't auto-transfer here - let playlist loading handle it
      });

      newPlayer.addListener('not_ready', () => {
        console.log('Player not ready');
        setIsPlayerReady(false);
      });

      newPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Initialization Error:', message);
      });

      newPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Authentication Error:', message);
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
      script.onerror = () => {
        console.error("Failed to load Spotify SDK script");
      };
      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setIsPlayerReady(false);
      setDeviceId("");
      setPlayerState(null);
      setIsPlaying(false);
    };
  }, [session?.accessToken]);

  // Load playlist with proper sequencing
  useEffect(() => {
    // In your loadPlaylistWithRetry function
    const loadPlaylistWithRetry = async (retries = 3) => {
      if (!isPlayerReady || !deviceId || !options.playlistUri || isPlaylistLoading) {
        return;
      }

      setIsPlaylistLoading(true);

      try {
        // Step 1: Transfer playback (unchanged)
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false
          })
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Build playback request body
        const playbackBody: any = {
          context_uri: options.playlistUri,
          position_ms: 0
        };

        // If specific track is requested, use offset
        if (options.trackPosition !== undefined) {
          playbackBody.offset = { position: options.trackPosition };
        } else if (options.trackUri) {
          playbackBody.offset = { uri: options.trackUri };
        } else {
          playbackBody.offset = { position: options.initialTrackIndex || 0 };
        }

        const playResponse = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(playbackBody)
          }
        );

        if (!playResponse.ok) {
          throw new Error(`Playlist load failed: ${playResponse.status}`);
        }

      } catch (err) {
        // Your existing error handling
      } finally {
        setIsPlaylistLoading(false);
      }
    };


    loadPlaylistWithRetry();
  }, [isPlayerReady,
    deviceId,
    options.playlistUri,
    options.initialTrackIndex,
    options.trackUri,        
    options.trackPosition,
    session?.accessToken
  ]);

  const togglePlayback = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.togglePlay();
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const handlePrevious = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.previousTrack();
    } catch (error) {
      console.error("Previous track error:", error);
    }
  };

  const handleNext = async () => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      await playerRef.current.nextTrack();
    } catch (error) {
      console.error("Next track error:", error);
    }
  };

  return {
    player: playerRef.current,
    deviceId,
    playerState,
    isPlaying,
    isPlayerReady,
    isPlaylistLoading,
    togglePlayback,
    handlePrevious,
    handleNext
  };
}
