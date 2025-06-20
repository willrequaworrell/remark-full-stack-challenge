import { UIMessage } from "ai";

interface ChatMessageProps {
    message: UIMessage
    index: number
}

const ChatMessage = ({message, index}: ChatMessageProps) => {
    return (
        <div
            key={message.id || index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`border-2 border-black px-4 py-2 max-w-[80%] ${message.role === "user"
                        ? "bg-black text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                        : "bg-white text-black rounded-tl-lg rounded-tr-lg rounded-br-lg"
                    }`}
            >
                {message.parts.map((part, i) => {
                    if (part.type === "text") {
                        return (
                            <p className="text-sm" key={i}>
                                {part.text}
                            </p>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    )
}

export default ChatMessage
