import { 
  FormEvent, 
  forwardRef, 
  ForwardedRef,
  ChangeEvent
} from "react";
import { IoSend } from "react-icons/io5";

interface ChatInputProps {
    value: string
    disabled: boolean
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

const ChatInput = forwardRef((
  { value, disabled, onChange, onSubmit }: ChatInputProps,
  ref: ForwardedRef<HTMLInputElement>
) => {
  return (
    <form onSubmit={onSubmit} className="flex items-center space-x-2" autoComplete="off">
        <input
          ref={ref} // Attach ref to input element
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Ask about your playlist, or what to play next..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-70 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex items-center justify-center w-10 h-10 text-white transition-colors bg-black border-2 border-black rounded-full cursor-pointer hover:text-black hover:bg-white disabled:opacity-70 disabled:bg-gray-100"
        >
          <IoSend className="-rotate-90"/>
        </button>
      </form>
  )
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
