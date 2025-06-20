/** A simplified representation of a Spotify playlist image */
interface SpotifyImage {
    height: number | null;
    url: string;
    width: number | null;
  }
  
  /** A minimal “owner” object for a Spotify playlist */
  interface PlaylistOwner {
    display_name: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    type: "user";
    uri: string;
  }
  
  /** The object returned under `.tracks` in each playlist */
  interface PlaylistTracksInfo {
    href: string;
    total: number;
  }
  
  /** One playlist as returned in the `items` array */
  export interface SpotifyPlaylist {
    collaborative: boolean;
    description: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    owner: PlaylistOwner;
    primary_color: string | null;
    public: boolean;
    snapshot_id: string;
    tracks: PlaylistTracksInfo;
    type: "playlist";
    uri: string;
  }
  
  /** The envelope returned by `/me/playlists` */
  export interface SpotifyPlaylistResponse {
    href: string;
    items: SpotifyPlaylist[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  }
  