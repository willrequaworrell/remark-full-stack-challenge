import { FormEvent } from "react"
import { IoSend } from "react-icons/io5"

interface ChatInputProps {
    value: string
    disabled: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
    onSubmit: (e: FormEvent<HTMLFormElement>) => void

}

const ChatInput = ({value, disabled, onChange, onSubmit}: ChatInputProps) => {
  return (
    <form onSubmit={onSubmit} className="flex space-x-2" autoComplete="off">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Ask about your playlist, or what to play next..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-70 disabled:bg-gray-100"
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
}

export default ChatInput
