import { useState, useEffect, useRef } from 'react'
import { useChatMessages } from './useChatMessages'
import { sendChatMessage } from '@/services/chat'
import styles from './ChatBox.module.css'

export type Props = {
  chatId: number
  currentUserId: string
}

export function ChatBox({ chatId, currentUserId }: Props) {
  const messages = useChatMessages(chatId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const result = await sendChatMessage(chatId, { message: input.trim() });
      
      if (result.success) {
        setInput('')
      } else {
        setError(result.error || 'Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Error inesperado al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.user_id === currentUserId ? styles.ownMessage : styles.otherMessage
            }`}
          >
            <div className={styles.messageContent}>
              <p>{message.message}</p>
              <span className={styles.messageTime}>
                {new Date(message.send_date).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className={styles.messageInput}
          disabled={sending}
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || sending}
          className={styles.sendButton}
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
