import { useState, useEffect } from 'react'
import { getChatList } from '@/services/chat'
import styles from './ChatList.module.css'

interface Chat {
  id: number
  trip_id: number
  created_at: string
  trip: {
    id: number
    date_time: string
    status: string  
    origin: {
      main_text: string
    }
    destination: {
      main_text: string
    }
  }
  last_message: string | null
  last_message_time: string | null
  member_count: number
}

interface ChatListProps {
  onSelectChat: (chat: any) => void
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getChatList()
      
      if (result.success && result.data) {
        setChats(result.data.chats)
      } else {
        setError(result.error || 'Error al cargar chats')
      }
    } catch (error) {
      console.error('Error loading chats:', error)
      setError('Error inesperado al cargar chats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando chats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={loadChats} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>No tienes chats activos</p>
          <p>Los chats aparecerán cuando tengas viajes programados</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={styles.chatItem}
          onClick={() => onSelectChat({
            id: chat.id,
            trip_id: chat.trip_id,
            origin: chat.trip.origin.main_text,
            destination: chat.trip.destination.main_text,
            last_message: chat.last_message || 'Conversación grupal',
            last_message_time: chat.last_message_time || 'Ahora',
            member_count: chat.member_count,
            is_active: true
          })}
        >
          <div className={styles.chatInfo}>
            <div className={styles.route}>
              {chat.trip.origin.main_text} → {chat.trip.destination.main_text}
            </div>
            <div className={styles.lastMessage}>
              {chat.last_message || 'Conversación grupal'}
            </div>
            <div className={styles.chatMeta}>
              <span className={styles.memberCount}>
                👥 {chat.member_count} miembros
              </span>
              <span className={styles.time}>
                {chat.last_message_time ? 
                  new Date(chat.last_message_time).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 
                  'Ahora'
                }
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
