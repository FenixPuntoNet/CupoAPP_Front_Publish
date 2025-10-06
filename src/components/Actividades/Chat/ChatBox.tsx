import { useState, useEffect, useRef } from 'react'
import { useChatMessages } from '../Hooks/useChatMessages'
import { sendChatMessage } from '@/services/chat'
import { moderateContent, getBlockedUsers } from '@/lib/contentModeration'
import { ReportModal } from '@/components/ReportModal'
import { BlockUserModal } from '@/components/BlockUserModal'
import { debugMessageInfo } from '@/utils/reportDebug'
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
  const { messages, refreshMessages } = useChatMessages(chatId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [reportModalOpened, setReportModalOpened] = useState(false)
  const [blockModalOpened, setBlockModalOpened] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [contentModerationAlert, setContentModerationAlert] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)

  // Sistema de roles simplificado
  const getRoleInfo = (msg?: any): RoleInfo => {
    const name = msg?.user_profiles?.first_name 
      ? `${msg.user_profiles.first_name} ${msg.user_profiles.last_name || ''}`.trim()
      : 'Usuario';
    
    return {
      name,
      role: 'Pasajero',
      photo: msg?.user_profiles?.photo_user || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'
    };
  };

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const blocked = await getBlockedUsers()
        setBlockedUsers(blocked)
      } catch (error) {
        console.error('❌ Error fetching blocked users:', error)
      }
    }

    if (chatId && chatId > 0) {
      console.log('🚀 [ChatBox] COMPONENT MOUNTED FOR CHAT:', chatId);
      fetchBlockedUsers()
    }
  }, [chatId, currentUserId])

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const messageToSend = input.trim();
    console.log('💬 [ChatBox] ENVIANDO MENSAJE:', messageToSend);
    
    setSending(true);

    try {
      // Moderar contenido
      const moderationResult = await moderateContent(messageToSend)
      
      if (!moderationResult.isAllowed) {
        setContentModerationAlert(`Tu mensaje no fue enviado: ${moderationResult.reason}`)
        setTimeout(() => setContentModerationAlert(null), 5000)
        return
      }

      // Enviar mensaje al backend
      const finalMessage = moderationResult.filteredContent || messageToSend
      const result = await sendChatMessage(chatId, { message: finalMessage });
      
      if (result.success) {
        console.log('✅ [ChatBox] MENSAJE ENVIADO AL BACKEND');
        
        // Limpiar input
        setInput('');
        
        // OPTIMIZADO: Solo 3 refreshes rápidos en lugar de 10
        console.log('🔄 [ChatBox] REFRESH OPTIMIZADO...');
        
        // Refresh inmediato
        refreshMessages();
        
        // Solo 2 refreshes adicionales
        setTimeout(refreshMessages, 300);
        setTimeout(refreshMessages, 1000);
        
        if (finalMessage !== messageToSend) {
          setContentModerationAlert('Tu mensaje fue enviado con modificaciones.')
          setTimeout(() => setContentModerationAlert(null), 5000)
        }
      } else {
        console.error('❌ [ChatBox] Error sending message:', result.error);
        setContentModerationAlert(`Error: ${result.error}`);
        setTimeout(() => setContentModerationAlert(null), 5000);
      }
    } catch (error) {
      console.error('❌ [ChatBox] Error:', error);
      setContentModerationAlert('Error al enviar mensaje');
      setTimeout(() => setContentModerationAlert(null), 5000);
    } finally {
      setSending(false);
    }
  }

  const handleReportMessage = (messageId: number, userId: string, userName: string) => {
    if (!messageId || typeof messageId !== 'number' || messageId <= 0) {
      console.error('❌ Invalid messageId for report:', messageId);
      return;
    }

    debugMessageInfo(messageId, messages);
    
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

  // Scroll inteligente al final
  useEffect(() => {
    const scrollToBottom = () => {
      if (bottomRef.current) {
        const messagesArea = bottomRef.current.parentElement;
        if (messagesArea) {
          const { scrollTop, scrollHeight, clientHeight } = messagesArea;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          
          // Solo scroll automático si el usuario está cerca del final o si es un mensaje nuevo
          if (isNearBottom || messages.length > previousMessageCountRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
      previousMessageCountRef.current = messages.length;
    };

    // Pequeño delay para asegurar que el DOM se actualice
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  return (
    <div className={styles.chatContainer}>
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

      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>¡Comienza la conversación!</h3>
            <p>Este es el chat del viaje. Coordina detalles como puntos de encuentro y horarios.</p>
          </div>
        ) : (
          messages
            .filter(msg => !msg.user_id || !blockedUsers.includes(msg.user_id.trim()))
            .map((msg) => {
              const isOwn = msg.user_id === currentUserId
              const roleInfo = getRoleInfo(msg)

              return (
                <div 
                  key={msg.id} 
                  className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}
                >
                  {!isOwn && (
                    <div className={styles.messageOther}>
                      <img
                        src={roleInfo.photo}
                        alt={roleInfo.name}
                        className={styles.avatar}
                        onError={(e) => {
                          e.currentTarget.src = 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'
                        }}
                      />
                      <div className={styles.messageContent}>
                        <div className={styles.messageHeader}>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{roleInfo.name}</span>
                            <span className={styles.userRole}>{roleInfo.role}</span>
                          </div>
                          <div className={styles.messageActions}>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleReportMessage(msg.id, msg.user_id || '', roleInfo.name)}
                              title="Reportar mensaje"
                            >
                              <IconFlag size={14} />
                            </button>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleBlockUser(msg.user_id || '', roleInfo.name)}
                              title="Bloquear usuario"
                            >
                              <IconUserX size={14} />
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

      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Escribe un mensaje..."
            className={styles.messageInput}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={styles.sendButton}
          >
            <span className={styles.sendIcon}>
              {sending ? '⟳' : (input.trim() ? '➤' : '🎤')}
            </span>
          </button>
        </div>
      </div>

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