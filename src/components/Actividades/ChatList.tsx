import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
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
      
      // Obtener chats donde el usuario es participante
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId)

      if (participantError) {
        console.error('Error fetching participant chats:', participantError)
        return
      }

      if (!participantData || participantData.length === 0) {
        setChats([])
        return
      }

      const chatIds = participantData.map(p => p.chat_id).filter((id): id is number => id !== null)

      if (chatIds.length === 0) {
        setChats([])
        return
      }

      // Obtener información de los chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          trip_id,
          trips:trip_id (
            id,
            origin:locations!trips_origin_id_fkey(main_text),
            destination:locations!trips_destination_id_fkey(main_text)
          )
        `)
        .in('id', chatIds)

      if (chatsError) {
        console.error('Error fetching chats:', chatsError)
        return
      }

      if (!chatsData) {
        setChats([])
        return
      }

      // Obtener último mensaje de cada chat
      const chatsWithMessages = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('message, send_date')
            .eq('chat_id', chat.id)
            .order('send_date', { ascending: false })
            .limit(1)
            .single()

          // Contar participantes
          const { count: memberCount } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact' })
            .eq('chat_id', chat.id)

          return {
            id: chat.id,
            trip_id: chat.trip_id,
            origin: chat.trips?.origin?.main_text || 'Origen',
            destination: chat.trips?.destination?.main_text || 'Destino',
            last_message: lastMessage?.message || 'Sin mensajes',
            last_message_time: lastMessage?.send_date || new Date().toISOString(),
            member_count: memberCount || 0,
            is_active: true
          }
        })
      )

      setChats(chatsWithMessages)
    } catch (error) {
      console.error('Error fetching chats:', error)
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
