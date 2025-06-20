import { FormEvent } from "react"
import { TbSend2 } from "react-icons/tb"

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
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-70 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex items-center justify-center w-10 h-10 text-black transition-colors bg-white border-2 border-black rounded-full hover:bg-black hover:text-white disabled:opacity-70 disabled:bg-gray-100"
        >
          <TbSend2 className="-rotate-90"/>

        </button>
      </form>
  )
}

export default ChatInput
