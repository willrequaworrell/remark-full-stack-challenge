"use client";

import { useEffect, useState } from "react";
import ChatSection from "./components/ChatSection";
import PlaylistPicker from "./components/PlaylistPicker";
import PlayerSection from "./components/PlayerSection";
import PlaylistSection from "./components/PlaylistSection";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { PlaybackOptions } from "./types/playback";
import { ConsolidatedTrack, EnrichedTrack, SpotifyPlaylistTrack } from "./types/track";


export default function Page() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({});
  const [currentTrackId, setCurrentTrackId] = useState<string>("");
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [enrichedTracks, setEnrichedTracks] = useState<EnrichedTrack[]>([]);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);
  const [aiConsolidatedTrackData, setAiConsolidatedTrackData] = useState<ConsolidatedTrack[]>([]);
  const [aiConsolidatedTrackDataLoading, setAiConsolidatedTrackDataLoading] = useState<boolean>(false);

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

  // when playlist data received, send for batch track details analysis
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
  }, [selectedPlaylist, playlistTracks]);

  // With raw track detail results, use AI to consolidate and reconcile into JSON 
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

  // Initialize + sync playback options
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
            onTrackChange={(trackId: string) => setCurrentTrackId(trackId)} 
          />
          <PlaylistSection
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
