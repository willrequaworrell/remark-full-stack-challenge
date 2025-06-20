"use client";

import { useEffect, useState } from "react";
import ChatSection from "./components/ChatSection";
import PlaylistPicker from "./components/PlaylistPicker";
import PlayerSection from "./components/PlayerSection";
import PlaylistSection from "./components/PlaylistSection";
import { TbLoader3 } from "react-icons/tb";
import { signOut } from "next-auth/react";
import { LoadingSpinner } from "./components/LoadingSpinner";

interface PlaybackOptions {
  playlistUri?: string;
  initialTrackIndex?: number;
  trackUri?: string;
  trackPosition?: number;
}

interface EnrichedTrack {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  danceability?: number;
  energy?: number;
  webData?: { results: { snippet: string; link: string }[] } | { error: string; suggestion: string };
  source: 'getsongbpm' | 'websearch' | 'failed';
  timestamp: number;
}

export default function Page() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({});
  const [currentTrackId, setCurrentTrackId] = useState<string>("");
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [enrichedTracks, setEnrichedTracks] = useState<EnrichedTrack[]>([]);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);
  const [aiConsolidatedTrackData, setAiConsolidatedTrackData] = useState<any[]>([]);
  const [aiConsolidatedTrackDataLoading, setAiConsolidatedTrackDataLoading] = useState(false);

  // Fetch tracks when playlist is selected
  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      if (!selectedPlaylist) return;
      try {
        const response = await fetch(`/api/spotify/playlists/${selectedPlaylist}/tracks`);
        const data = await response.json();
        setPlaylistTracks(data.items || []);
        setCurrentTrackId(data.items[0].track.id);
      } catch (error) {
        console.error("Failed to fetch playlist tracks:", error);
      }
    };
    fetchPlaylistTracks();
  }, [selectedPlaylist]);

  // Batch metadata enrichment
  useEffect(() => {
    const fetchAndEnrich = async () => {
      if (!selectedPlaylist || playlistTracks.length === 0 || !currentTrackId) return;
      setMetadataLoading(true);
      const response = await fetch('/api/metadata/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: selectedPlaylist, playlistTracks, currentTrackId }),
      });
      const data = await response.json();
      setEnrichedTracks(data.enrichedTracks || []);
      setMetadataLoading(false);
    };
    fetchAndEnrich();
  }, [selectedPlaylist, playlistTracks, currentTrackId]);

  // AI consolidation
  useEffect(() => {
    if (enrichedTracks.length === 0) return;
    const fetchConsolidation = async () => {
      setAiConsolidatedTrackDataLoading(true);
      try {
        const res = await fetch('/api/metadata/consolidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrichedTracks }),
        });
        const data = await res.json();
        setAiConsolidatedTrackData(data.consolidatedTracks || []);
      } catch (err) {
        console.error('Consolidation error', err);
      } finally {
        setAiConsolidatedTrackDataLoading(false);
      }
    };
    fetchConsolidation();
  }, [enrichedTracks]);

  // Initialize playback options
  useEffect(() => {
    if (selectedPlaylist && !playbackOptions.playlistUri) {
      setPlaybackOptions({
        playlistUri: `spotify:playlist:${selectedPlaylist}`,
        initialTrackIndex: 0,
      });
    }
  }, [selectedPlaylist, playbackOptions.playlistUri]);

  // Handle track click
  const handleTrackClick = (track: any, trackIndex: number) => {
    setPlaybackOptions({
      playlistUri: `spotify:playlist:${selectedPlaylist}`,
      trackUri: track.uri,
      trackPosition: trackIndex,
    });
    setCurrentTrackId(track.id);
  };

  const handlePlayerTrackChange = (trackId: string) => {
    setCurrentTrackId(trackId);
  };

  if (!selectedPlaylist) {
    return <PlaylistPicker onSelect={setSelectedPlaylist}/>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen grid-bg">
      <div className="main-flex max-w-7xl w-full border-2 border-black rounded-xl overflow-hidden bg-white h-[90vh] flex flex-col lg:flex-row">
        {/* Left: Player + Playlist */}
        <div className="flex flex-col border-b-2 border-black lg:border-b-0 lg:border-r-2 lg:w-[61.8%] w-full h-full">
          <PlayerSection 
            options={playbackOptions}
            onTrackChange={handlePlayerTrackChange} 
          />
          <PlaylistSection
            playlistId={selectedPlaylist}
            playlistTracks={playlistTracks}
            onTrackClick={handleTrackClick}
            currentTrackId={currentTrackId}
          />
        </div>
        {/* Right: AI Chat */}
        {selectedPlaylist && (
          playlistTracks.length > 0 && currentTrackId !== "" && !metadataLoading && enrichedTracks.length > 0 && !aiConsolidatedTrackDataLoading && aiConsolidatedTrackData.length > 0
            ? 
              <ChatSection 
                playlistId={selectedPlaylist} 
                playlistTracks={playlistTracks} 
                currentTrackId={currentTrackId}
                aiConsolidatedTrackData={aiConsolidatedTrackData}
              />
            : 
            <div className="flex flex-col lg:w-[38.2%] w-full p-4 md:p-6 h-full border-l-2 border-black">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black uppercase">DJ AI</h2>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
              <LoadingSpinner
                size={8}
                title="Analyzing Playlist..."
              />
            </div>
        )}
      </div>
    </div>
  );
}
