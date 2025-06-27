import { LoadingSpinner } from "./LoadingSpinner"

const ChatSectionSkeleton = () => {
    return (
        <div className="flex flex-col lg:w-[38.2%] w-full p-4 md:p-6 h-full border-l-0">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black md:text-xl">
                    AI Disc Jockey
                </h2>
            </div>
            <LoadingSpinner size={8} title="Analyzing Playlist..." />
        </div>
    )
}

export default ChatSectionSkeleton
