import { signIn } from "next-auth/react";
import { FaSpotify } from "react-icons/fa";

const SpotifyLogin = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-md p-8 bg-white border-2 border-black rounded-xl">
                <h1 className="mb-6 text-3xl font-black text-center text-black">
                    AI Playlist Assistant
                </h1>
                <button
                    onClick={() => signIn("spotify")}
                    className="flex items-center justify-center w-full gap-2 px-6 py-3 text-lg font-semibold text-white transition-colors bg-black border-2 border-black rounded-lg cursor-pointer hover:bg-white hover:text-black"
                >
                    <FaSpotify className="inline-block" size={24} />
                    Sign in with Spotify
                </button>
            </div>
        </div>
    );
};

export default SpotifyLogin;
