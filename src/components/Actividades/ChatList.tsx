import { useState, useEffect } from 'react'
import { getChatList } from '@/services/chat'
import styles from './ChatList.module.css'

interface Chat {
  id: number
  trip_id: number | null
  origin: string
  destination: string
  last_message: string
  last_message_time: string
  member_count: number
  is_active: boolean
}

interface ChatListProps {
  onSelectChat: (chat: Chat) => void
  currentUserId: string
}

export function ChatList({ onSelectChat, currentUserId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [currentUserId])

  const fetchChats = async () => {
    try {
      setLoading(true)
      
      console.log('💬 [ChatList] Fetching chats for user:', currentUserId);
      const result = await getChatList();
      
      if (result.success && result.data && result.data.chats) {
        console.log('✅ [ChatList] Chats loaded successfully:', result.data.chats.length);
        setChats(result.data.chats);
      } else {
        console.warn('⚠️ [ChatList] No chats or error:', result.error);
        setChats([]);
      }
    } catch (error) {
      console.error('❌ [ChatList] Error fetching chats:', error)
      setChats([]);
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando chats...</p>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
            <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>💬</div>
        <h3>No hay chats disponibles</h3>
        <p>Los chats se crean automáticamente cuando:</p>
        <ul>
          <li>🚗 Publicas un viaje como conductor</li>
          <li>🎫 Reservas un cupo como pasajero</li>
        </ul>
        <button onClick={fetchChats} className={styles.refreshButton}>
          Actualizar chats
        </button>
        <p>Únete a un viaje para comenzar a chatear</p>
      </div>
    )
  }

  return (
    <div className={styles.chatList}>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={styles.chatItem}
          onClick={() => onSelectChat(chat)}
        >
          <div className={styles.chatAvatar}>
            <span className={styles.avatarIcon}>🚗</span>
          </div>
          <div className={styles.chatInfo}>
            <div className={styles.chatHeader}>
              <h3 className={styles.chatName}>
                {chat.origin} → {chat.destination}
              </h3>
              <span className={styles.chatTime}>
                {formatTime(chat.last_message_time)}
              </span>
            </div>
            <div className={styles.chatPreview}>
              <p className={styles.lastMessage}>{chat.last_message}</p>
              <span className={styles.memberCount}>
                👥 {chat.member_count}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
