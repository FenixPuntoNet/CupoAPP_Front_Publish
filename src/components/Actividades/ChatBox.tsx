import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useChatMessages } from './useChatMessages'
import { sendChatMessage } from '@/services/chat'
import { moderateContent, getBlockedUsers } from '@/lib/contentModeration'
import { ReportModal } from '@/components/ReportModal'
import { BlockUserModal } from '@/components/BlockUserModal'
import { IconFlag, IconUserX } from '@tabler/icons-react'
import { Alert } from '@mantine/core'
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
        // Obtener participantes del chat
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id, role')
          .eq('chat_id', chatId)

        if (participantsError) {
          console.error('❌ Error al obtener participantes:', participantsError)
          return
        }

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

        // Obtener perfiles de usuarios desde user_profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, photo_user')
          .in('user_id', userIds)

        if (profilesError) {
          console.error('❌ Error al obtener perfiles de usuarios:', profilesError)
          return
        }

        if (!profiles || profiles.length === 0) {
          console.warn('⚠️ No se encontraron perfiles para los usuarios.')
          return
        }

        // Crear un mapa de perfiles
        const profileMap = new Map<string, { name: string; photo: string }>()
        profiles.forEach((profile) => {
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
      } catch (error) {
        console.error('❌ Error inesperado al obtener roles:', error)
      }
    }

    const fetchBlockedUsers = async () => {
      try {
        const blocked = await getBlockedUsers(currentUserId)
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

    // Moderar el contenido antes de enviarlo
    const moderationResult = moderateContent(input)
    
    if (!moderationResult.isAllowed) {
      setContentModerationAlert(
        `Tu mensaje no pudo ser enviado: ${moderationResult.reason}`
      )
      setTimeout(() => setContentModerationAlert(null), 5000)
      return
    }

    // Si el contenido fue filtrado, usar la versión filtrada
    const messageToSend = moderationResult.filteredContent || input

    try {
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
    setSelectedMessageId(messageId)
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setReportModalOpened(true)
  }

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
                              onClick={() => handleReportMessage(msg.id, msg.user_id!, name)}
                              title="Reportar mensaje"
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
          reporterId={currentUserId}
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
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}