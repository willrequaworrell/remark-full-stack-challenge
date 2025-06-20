import { CgLoadbarSound } from "react-icons/cg"
import { PlaylistTrackCardType } from "../types/track"

interface PlaylistTrackProps {
    key: string
    track: {
        id: string
        name: string
        artist: string
        uri: string
        albumArt: string
    },
    index: number,
    currentTrackId: string,
    onClickPlay: (track: PlaylistTrackCardType, index: number) => void;
}

const PlaylistTrack = ({track, index, currentTrackId, onClickPlay}: PlaylistTrackProps) => {
    return (
        <div
            key={track.id}
            className={`group flex items-center w-full border-2 border-black rounded-lg px-3 md:px-4 py-2 md:py-3 bg-white text-black hover:bg-gray-100 transition }`}
        >
            {/* Album Art */}
            <div className="flex items-center justify-center w-10 h-10 mr-3 overflow-hidden bg-gray-100 border-2 border-black rounded md:w-12 md:h-12 md:mr-4">
                {track.albumArt ? (
                    <img
                        src={track.albumArt}
                        alt={track.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <span className="text-xs font-black text-black">IMG</span>
                )}
            </div>

            {/* Track Info */}
            <div className="flex-1">
                <p className="font-black text-black">{track.name}</p>
                <p className="text-xs text-black">{track.artist}</p>
            </div>

            {/* Play Button */}

            {track.id === currentTrackId ? 
                <CgLoadbarSound className="text-4xl animate-pulse"/> :
                
                <button
                    onClick={() => onClickPlay?.(track, index)}
                    className="items-center justify-center hidden w-8 h-8 ml-2 transition-all border-2 border-black rounded-full group-hover:flex hover:bg-black hover:text-white"
                >
                    
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </button>
            }
        </div>
    )
}

export default PlaylistTrack
