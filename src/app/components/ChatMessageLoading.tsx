import React from 'react'
import { PiDotsThreeOutlineDuotone } from 'react-icons/pi'

interface ChatMessageLoadingProps {
    key: number
}

const ChatMessageLoading = ({key}: ChatMessageLoadingProps) => {
    return (
        <div key={key} className="flex justify-start">
            <div className="border-2 border-black bg-white text-black
                    rounded-tl-lg rounded-tr-lg rounded-br-lg
                    px-4 py-2 max-w-[80%]">
                <PiDotsThreeOutlineDuotone className="w-6 h-6 text-gray-500 animate-pulse" />
            </div>
        </div>
    )
}

export default ChatMessageLoading
