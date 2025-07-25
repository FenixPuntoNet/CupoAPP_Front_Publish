import { useEffect, useState } from 'react'
import { ChatBox } from '@/components/Actividades/ChatBoxSimple'
import { ChatList } from '@/components/Actividades/ChatListSimple'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCurrentUser } from '@/services/auth'
import { getOrCreateTripChat } from '@/services/chat'
import styles from './index.module.css'

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

function ChatPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { trip_id } = Route.useSearch()

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Inicialización del usuario
  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      setIsLoading(true)
      const result = await getCurrentUser()
      
      if (!result.success || !result.user) {
        navigate({ to: '/Login' })
        return
      }

      setUserId(result.user.id)

      // Si hay un trip_id específico, intentar abrir ese chat
      if (trip_id) {
        await openChatByTripId(Number(trip_id))
      }
    } catch (error) {
      console.error('Error al inicializar usuario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openChatByTripId = async (tripId: number) => {
    try {
      // Obtener o crear chat para el viaje usando el backend
      const result = await getOrCreateTripChat(tripId)
      
      if (!result.success || !result.data) {
        console.error('Chat no encontrado para el viaje:', tripId)
        return
      }

      // Crear objeto Chat compatible con la interfaz existente
      const chatInfo: Chat = {
        id: result.data.chat_id,
        trip_id: tripId,
        origin: 'Origen', // Se podría obtener del backend si es necesario
        destination: 'Destino', // Se podría obtener del backend si es necesario
        last_message: 'Conversación grupal',
        last_message_time: 'Ahora',
        member_count: 0,
        is_active: true
      }

      setSelectedChat(chatInfo)
      setCurrentView('chat')
    } catch (error) {
      console.error('Error al abrir chat por trip_id:', error)
    }
  }

  // Manejar selección de chat
  const handleSelectChat = (chat: Chat) => {
    console.log('📱 Seleccionando chat:', chat.id)
    setSelectedChat(chat)
    setCurrentView('chat')
  }

  // Manejar regreso a lista
  const handleBackToList = () => {
    console.log('📱 Regresando a lista')
    setCurrentView('list')
    setSelectedChat(null)
  }

  // Mostrar loading inicial
  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2 className={styles.loadingTitle}>Cargando chats...</h2>
          <p className={styles.loadingText}>Preparando tu experiencia de chat</p>
        </div>
      </div>
    )
  }

  // Mostrar error si no hay usuario
  if (!userId) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Error de autenticación</h2>
          <p className={styles.errorDescription}>
            Debes iniciar sesión para acceder a los chats
          </p>
          <button 
            className={styles.errorButton}
            onClick={() => navigate({ to: '/Login' })}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.chatApp}>
      {/* Vista para móvil - Una sola vista a la vez */}
      {isMobile && (
        <>
          {/* Lista de chats en móvil */}
          {currentView === 'list' && (
            <div className={styles.mobileView}>
              <div className={styles.mobileHeader}>
                <div className={styles.headerContent}>
                  <h1 className={styles.headerTitle}>💬 Chats</h1>
                  <p className={styles.headerSubtitle}>
                    Conversaciones de viajes
                  </p>
                </div>
              </div>
              <div className={styles.mobileContent}>
                <ChatList 
                  onSelectChat={handleSelectChat}
                />
              </div>
            </div>
          )}

          {/* Chat individual en móvil */}
          {currentView === 'chat' && selectedChat && (
            <div className={styles.mobileView}>
              <div className={styles.mobileChatHeader}>
                <button 
                  className={styles.backButton}
                  onClick={handleBackToList}
                  aria-label="Volver a chats"
                >
                  <span className={styles.backIcon}>←</span>
                </button>
                <div className={styles.chatHeaderInfo}>
                  <h2 className={styles.chatTitle}>
                    {selectedChat.origin} → {selectedChat.destination}
                  </h2>
                  <p className={styles.chatSubtitle}>
                    👥 {selectedChat.member_count} miembros • En línea
                  </p>
                </div>
              </div>
              <div className={styles.mobileChatContent}>
                <ChatBox 
                  chatId={selectedChat.id} 
                  currentUserId={userId} 
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Vista para desktop - Ambas vistas al mismo tiempo */}
      {!isMobile && (
        <div className={styles.desktopView}>
          {/* Panel izquierdo - Lista de chats */}
          <div className={styles.desktopSidebar}>
            <div className={styles.desktopSidebarHeader}>
              <h1 className={styles.sidebarTitle}>💬 Chats</h1>
              <p className={styles.sidebarSubtitle}>
                Conversaciones de viajes
              </p>
            </div>
            <div className={styles.desktopSidebarContent}>
              <ChatList 
                onSelectChat={handleSelectChat}
              />
            </div>
          </div>

          {/* Panel derecho - Chat seleccionado */}
          <div className={styles.desktopMain}>
            {selectedChat ? (
              <>
                <div className={styles.desktopChatHeader}>
                  <div className={styles.chatHeaderInfo}>
                    <h2 className={styles.chatTitle}>
                      {selectedChat.origin} → {selectedChat.destination}
                    </h2>
                    <p className={styles.chatSubtitle}>
                      👥 {selectedChat.member_count} miembros • En línea
                    </p>
                  </div>
                </div>
                <div className={styles.desktopChatContent}>
                  <ChatBox 
                    chatId={selectedChat.id} 
                    currentUserId={userId} 
                  />
                </div>
              </>
            ) : (
              <div className={styles.desktopEmptyState}>
                <div className={styles.emptyStateIcon}>💬</div>
                <h2 className={styles.emptyStateTitle}>Selecciona un chat</h2>
                <p className={styles.emptyStateDescription}>
                  Elige una conversación para comenzar a chatear
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/Chat/')({
  component: ChatPage,
  validateSearch: (search: any) => ({
    trip_id: search.trip_id ? String(search.trip_id) : null,
  }),
})
