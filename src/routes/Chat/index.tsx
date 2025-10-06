import { useEffect, useState } from 'react'
import { ChatList } from '@/components/Actividades/Chat/ChatList'
import { ChatModal } from '@/components/Actividades/Chat/ChatModal'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCurrentUser } from '@/services/auth'
import { getOrCreateTripChat } from '@/services/chat'
import { showNotification } from '@mantine/notifications'
import styles from './index.module.css'

import BackButton from '@/components/Buttons/backButton';

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
  const [modalOpened, setModalOpened] = useState(false)
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
      if (trip_id && trip_id.trim() !== '' && !isNaN(Number(trip_id))) {
        console.log('🚗 [ChatPage] Valid trip_id received, opening chat:', trip_id);
        await openChatByTripId(Number(trip_id))
      } else if (trip_id) {
        console.warn('⚠️ [ChatPage] Invalid trip_id received:', trip_id);
        showNotification({
          title: 'Error',
          message: 'ID de viaje inválido para acceder al chat.',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error al inicializar usuario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openChatByTripId = async (tripId: number) => {
    try {
      console.log('💬 [ChatPage] Opening chat for trip:', tripId);
      
      // Obtener o crear chat para el viaje usando el backend
      const result = await getOrCreateTripChat(tripId)
      
      if (!result.success) {
        console.error('❌ [ChatPage] Chat not available for trip:', tripId, 'Error:', result.error);
        
        showNotification({
          title: 'Chat en proceso',
          message: 'El chat de este viaje se está inicializando. Intenta nuevamente en unos segundos.',
          color: 'blue',
        });
        
        console.warn('⚠️ [ChatPage] Chat not found for trip, but system should be working now');
        return
      }

      if (!result.data) {
        console.error('❌ [ChatPage] No chat data received for trip:', tripId);
        return
      }

      console.log('✅ [ChatPage] Chat data received:', result.data);

      // Crear objeto Chat compatible con la interfaz existente
      const chatInfo: Chat = {
        id: result.data.chat_id,
        trip_id: tripId,
        origin: `Viaje #${tripId}`,
        destination: 'Chat grupal',
        last_message: 'Chat del viaje disponible',
        last_message_time: 'Ahora',
        member_count: 0,
        is_active: true
      }

      console.log('📱 [ChatPage] Setting selected chat:', chatInfo);
      setSelectedChat(chatInfo)
      setModalOpened(true) // SIEMPRE abrir modal
    } catch (error) {
      console.error('❌ [ChatPage] Error opening chat for trip:', tripId, error)
    }
  }

  // Manejar selección de chat - SIEMPRE abre modal
  const handleSelectChat = (chat: Chat) => {
    console.log('📱 Seleccionando chat:', chat.id)
    setSelectedChat(chat)
    setModalOpened(true) // SIEMPRE abrir modal
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalOpened(false)
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
      {/* Vista móvil */}
      {isMobile ? (
        <div className={styles.mobileView}>
          <div className={styles.mobileHeader}>
            <div className='top p-4' style={{position: 'absolute', top: 0, left: 0, zIndex: 100}}>
              <BackButton to='/perfil' />
            </div>
            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>💬 Chats</h1>
              <p className={styles.headerSubtitle}>Conversaciones de viajes</p>
            </div>
          </div>
          <div className={styles.mobileContent}>
            <ChatList 
              onSelectChat={handleSelectChat}
              currentUserId={userId}
            />
          </div>
        </div>
      ) : (
        /* Vista desktop */
        <div className={styles.desktopView}>
          <div className='top p-4' style={{position: 'absolute', top: 0, left: 0, zIndex: 100}}>
            <BackButton to='/perfil' />
          </div>
          {/* Panel principal - Lista de chats */}
          <div className={styles.desktopSidebar} style={{width: '100%', maxWidth: 'none'}}>
            <div className={styles.desktopSidebarHeader}>
              <h1 className={styles.sidebarTitle}>💬 Chats</h1>
              <p className={styles.sidebarSubtitle}>
                Conversaciones de viajes
              </p>
            </div>
            <div className={styles.desktopSidebarContent}>
              <ChatList 
                onSelectChat={handleSelectChat}
                currentUserId={userId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Chat - Para ambas vistas */}
      {selectedChat && userId && (
        <ChatModal
          opened={modalOpened}
          onClose={handleCloseModal}
          chat={selectedChat}
          currentUserId={userId}
        />
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
