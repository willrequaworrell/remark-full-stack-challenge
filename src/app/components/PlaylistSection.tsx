import { useEffect } from "react";
import { useSpotifyTracks } from "../hooks/useSpotifyTracks";
import PlaylistTrack from "./PlaylistTrack";

export default function PlaylistSection({
  playlistId,
  playlistTracks,
  onTrackClick,
  currentTrackId,
}: {
  playlistId: string;
  playlistTracks: any[]
  onTrackClick: (track: any, index: number) => void;
  currentTrackId: string;
}) {
  // const { data, loading, error } = useSpotifyTracks("playlist", playlistId);
  

  return (
    <section className="flex flex-col flex-1 min-h-0 p-4 h-1/2 md:p-6">
      <h2 className="mb-3 text-lg font-black tracking-tight text-black uppercase md:text-xl md:mb-4">
        Playlist
      </h2>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {playlistTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-transparent animate-spin"></div>
            {/* <p className="mt-2 text-sm text-gray-500">Loading tracks...</p> */}
          </div> 
        ) : 
          playlistTracks?.map((item: any, index: number) => {
            const track = {
              id: item.track.id,
              name: item.track.name,
              artist: item.track.artists[0]?.name || "Unknown Artist",
              uri: item.track.uri,
              albumArt: item.track.album?.images[0]?.url
            };

          return (
            <PlaylistTrack 
              track={track} 
              index={index}
              currentTrackId={currentTrackId}
              onClickPlay={onTrackClick}
            />
          );
        })}
      </div>
    </section>
  );
}
