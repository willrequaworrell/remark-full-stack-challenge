import PlaylistTrack from "./PlaylistTrack";
import { LoadingSpinner } from "./LoadingSpinner";
import { PlaylistTrackCardType, SpotifyPlaylistTrack } from "../types/track";

interface PlaylistSectionProps {
  playlistTracks: SpotifyPlaylistTrack[]
  onTrackClick: (track: PlaylistTrackCardType, index: number) => void;
  currentTrackId: string;
}

const PlaylistSection = ({playlistTracks, onTrackClick, currentTrackId}: PlaylistSectionProps) => {

  return (
    <section className="flex flex-col flex-1 min-h-0 p-4 h-1/2 md:p-6">
      <h2 className="mb-3 text-lg font-black tracking-tight text-black uppercase md:text-xl md:mb-4">
        Playlist
      </h2>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {playlistTracks.length === 0 ? (
          <LoadingSpinner size={8}/>
        ) : 
          playlistTracks?.map((item: SpotifyPlaylistTrack, index: number) => {
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



export default PlaylistSection
