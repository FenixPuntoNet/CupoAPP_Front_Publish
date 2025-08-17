import { useState, useEffect, useRef } from 'react'
import { useChatMessages } from './useChatMessages'
import { sendChatMessage } from '@/services/chat'
import { moderateContent, getBlockedUsers } from '@/lib/contentModeration'
import { ReportModal } from '@/components/ReportModal'
import { BlockUserModal } from '@/components/BlockUserModal'
import { debugMessageInfo } from '@/utils/reportDebug'
import { IconFlag, IconUserX } from '@tabler/icons-react'
import { Alert } from '@mantine/core'
import { API_BASE_URL } from '@/config/api'
import styles from './ChatBox.module.css'

type RoleInfo = {
  name: string
  role: 'Conductor' | 'Pasajero'
  photo: string
}

export type Props = {
  chatId: number
  currentUserId: string
}

// Función para obtener el token de autenticación del localStorage
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem('sb-mqwvbnktcokcccidfgcu-auth-token');
    return token || null;
  } catch (error) {
    console.error('Error accessing localStorage token:', error);
    return null;
  }
};

// Función para obtener participantes del chat desde el backend
const fetchChatParticipants = async (chatId: number): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    // Usar el endpoint de mensajes para obtener información de participantes
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Extraer participantes únicos de los mensajes
    const messages = result.messages || []
    const uniqueUsers = new Map()
    
    messages.forEach((msg: any) => {
      if (msg.user_id && !uniqueUsers.has(msg.user_id)) {
        uniqueUsers.set(msg.user_id, {
          user_id: msg.user_id,
          role: 'participant' // Default role, puede ser ajustado
        })
      }
    })
    
    return Array.from(uniqueUsers.values())
  } catch (error) {
    console.error('❌ Error fetching chat participants:', error)
    return []
  }
}

// Función para obtener información de usuario específica
const fetchUserInfo = async (userId: string): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_BASE_URL}/perfil/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Usuario no encontrado
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.user || null
  } catch (error) {
    console.error('❌ Error fetching user info:', error)
    return null
  }
}

export function ChatBox({ chatId, currentUserId }: Props) {
  const messages = useChatMessages(chatId)
  const [input, setInput] = useState('')
  const [roles, setRoles] = useState<Record<string, RoleInfo>>({})
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [reportModalOpened, setReportModalOpened] = useState(false)
  const [blockModalOpened, setBlockModalOpened] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [contentModerationAlert, setContentModerationAlert] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('🔄 Fetching chat participants and profiles from backend...');
        
        // Obtener participantes del chat desde el backend
        const participants = await fetchChatParticipants(chatId)

        if (!participants || participants.length === 0) {
          console.warn('⚠️ No se encontraron participantes en el chat.')
          return
        }

        const userIds = participants
          .map((p) => p.user_id?.trim())
          .filter((id): id is string => !!id)

        if (userIds.length === 0) {
          console.warn('⚠️ No se encontraron IDs de usuarios válidos.')
          return
        }

        // Obtener información de cada usuario usando el backend
        const profiles = await Promise.all(
          userIds.map(async (userId) => {
            const userInfo = await fetchUserInfo(userId)
            return userInfo ? { ...userInfo, user_id: userId } : null
          })
        )

        const validProfiles = profiles.filter(profile => profile !== null)

        if (!validProfiles || validProfiles.length === 0) {
          console.warn('⚠️ No se encontraron perfiles para los usuarios.')
          return
        }

        // Crear un mapa de perfiles
        const profileMap = new Map<string, { name: string; photo: string }>()
        validProfiles.forEach((profile: any) => {
          if (profile.user_id) {
            profileMap.set(profile.user_id.trim(), {
              name: profile.first_name || 'Sin nombre',
              photo:
                profile.photo_user ||
                'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
            })
          }
        })

        // Crear un mapa de roles
        const roleMap: Record<string, RoleInfo> = {}
        participants.forEach((participant) => {
          const userId = participant.user_id?.trim()
          if (!userId) return

          const profile = profileMap.get(userId)
          roleMap[userId] = {
            name: profile?.name ?? 'Sin nombre',
            role: participant.role === 'driver' ? 'Conductor' : 'Pasajero',
            photo:
              profile?.photo ??
              'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
          }
        })

        setRoles(roleMap)
        console.log('✅ Chat roles loaded successfully from backend');
      } catch (error) {
        console.error('❌ Error inesperado al obtener roles:', error)
      }
    }

    const fetchBlockedUsers = async () => {
      try {
        const blocked = await getBlockedUsers()
        setBlockedUsers(blocked)
      } catch (error) {
        console.error('❌ Error al obtener usuarios bloqueados:', error)
      }
    }

    fetchRoles()
    fetchBlockedUsers()
  }, [chatId, currentUserId])

  const sendMessage = async () => {
    if (!input.trim()) return

    console.log('💬 [ChatBox] Sending message to chat:', chatId);

    try {
      // Moderar el contenido antes de enviarlo usando el backend
      const moderationResult = await moderateContent(input)
      
      if (!moderationResult.isAllowed) {
        setContentModerationAlert(
          `Tu mensaje no pudo ser enviado: ${moderationResult.reason || 'Contenido inapropiado detectado'}`
        )
        setTimeout(() => setContentModerationAlert(null), 5000)
        return
      }

      // Si el contenido fue filtrado, usar la versión filtrada
      const messageToSend = moderationResult.filteredContent || input

      const result = await sendChatMessage(chatId, { message: messageToSend });
      
      if (result.success) {
        console.log('✅ [ChatBox] Message sent successfully');
        setInput('')
        
        // Si se aplicó filtrado, informar al usuario
        if (messageToSend !== input) {
          setContentModerationAlert(
            'Tu mensaje fue enviado con algunas modificaciones para cumplir con nuestras normas de comunidad.'
          )
          setTimeout(() => setContentModerationAlert(null), 5000)
        }
      } else {
        console.error('❌ [ChatBox] Error sending message:', result.error);
        setContentModerationAlert(
          `Error al enviar mensaje: ${result.error}`
        );
        setTimeout(() => setContentModerationAlert(null), 5000);
      }
    } catch (error) {
      console.error('❌ [ChatBox] Unexpected error sending message:', error);
      setContentModerationAlert(
        'Error inesperado al enviar el mensaje'
      );
      setTimeout(() => setContentModerationAlert(null), 5000);
    }
  }

  const handleReportMessage = (messageId: number, userId: string, userName: string) => {
    // Validar que messageId sea un número válido
    if (!messageId || typeof messageId !== 'number' || messageId <= 0) {
      console.error('❌ Invalid messageId for report:', messageId);
      setContentModerationAlert('Error: No se puede reportar este mensaje. ID inválido.');
      setTimeout(() => setContentModerationAlert(null), 5000);
      return;
    }

    // Debug information
    debugMessageInfo(messageId, messages);

    console.log('📝 Opening report modal for message:', { messageId, userId, userName });
    
    setSelectedMessageId(messageId);
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setReportModalOpened(true);
  };

  const handleBlockUser = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setBlockModalOpened(true)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={styles.chatContainer}>
      {/* Alerta de moderación de contenido */}
      {contentModerationAlert && (
        <Alert 
          color="orange" 
          className={styles.moderationAlert}
          onClose={() => setContentModerationAlert(null)}
          withCloseButton
        >
          {contentModerationAlert}
        </Alert>
      )}

      {/* Área de mensajes - WhatsApp Style */}
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>¡Comienza la conversación!</h3>
            <p>Escribe el primer mensaje para iniciar el chat grupal</p>
          </div>
        ) : (
          messages
            .filter(msg => !msg.user_id || !blockedUsers.includes(msg.user_id.trim()))
            .map((msg) => {
              const isOwn = msg.user_id === currentUserId
              const userInfo = msg.user_id ? roles[msg.user_id.trim()] : undefined

              const name = userInfo?.name ?? 'Sin nombre'
              const role = userInfo?.role ?? ''
              const photo = userInfo?.photo ?? 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'

              return (
                <div 
                  key={msg.id} 
                  className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}
                >
                  {!isOwn && (
                    <div className={styles.messageOther}>
                      <img
                        src={photo}
                        alt={name}
                        className={styles.avatar}
                      />
                      <div className={styles.messageContent}>
                        <div className={styles.messageHeader}>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{name}</span>
                            <span className={styles.userRole}>{role}</span>
                          </div>
                          <div className={styles.messageActions}>
                            <button 
                              className={styles.actionButton}
                              onClick={() => {
                                // Validar que el mensaje tenga ID válido antes de reportar
                                if (!msg.id || typeof msg.id !== 'number' || msg.id <= 0) {
                                  console.error('❌ Cannot report message with invalid ID:', msg.id);
                                  setContentModerationAlert('No se puede reportar este mensaje. ID inválido.');
                                  setTimeout(() => setContentModerationAlert(null), 5000);
                                  return;
                                }
                                handleReportMessage(msg.id, msg.user_id!, name);
                              }}
                              title="Reportar mensaje"
                              disabled={!msg.id || typeof msg.id !== 'number' || msg.id <= 0}
                            >
                              <IconFlag size={16} />
                            </button>
                            <button 
                              className={styles.actionButton}
                              onClick={() => handleBlockUser(msg.user_id!, name)}
                              title="Bloquear usuario"
                            >
                              <IconUserX size={16} />
                            </button>
                          </div>
                        </div>
                        <div className={`${styles.messageBubble} ${styles.other}`}>
                          <p className={styles.messageText}>{msg.message}</p>
                          <div className={styles.messageFooter}>
                            <span className={styles.messageTime}>
                              {new Date(msg.send_date ?? '').toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isOwn && (
                    <div className={`${styles.messageBubble} ${styles.own}`}>
                      <p className={styles.messageText}>{msg.message}</p>
                      <div className={styles.messageFooter}>
                        <span className={styles.messageTime}>
                          {new Date(msg.send_date ?? '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className={styles.messageStatus}>✓</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Área de input - WhatsApp Style */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe un mensaje..."
            className={styles.messageInput}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className={styles.sendButton}
          >
            <span className={styles.sendIcon}>
              {input.trim() ? '➤' : '🎤'}
            </span>
          </button>
        </div>
      </div>

      {/* Modales */}
      {selectedMessageId && selectedUserId && selectedUserName && (
        <ReportModal
          opened={reportModalOpened}
          onClose={() => {
            setReportModalOpened(false)
            setSelectedMessageId(null)
            setSelectedUserId(null)
            setSelectedUserName(null)
          }}
          contentType="message"
          contentId={selectedMessageId}
          targetUserName={selectedUserName}
        />
      )}

      {selectedUserId && selectedUserName && (
        <BlockUserModal
          opened={blockModalOpened}
          onClose={() => {
            setBlockModalOpened(false)
            setSelectedUserId(null)
            setSelectedUserName(null)
          }}
          targetUserId={selectedUserId}
          targetUserName={selectedUserName}
        />
      )}
    </div>
  )
}