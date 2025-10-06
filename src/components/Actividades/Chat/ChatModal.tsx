import { useState, useEffect } from 'react';
import { Modal, Stack, Text, LoadingOverlay, CloseButton } from '@mantine/core';
import { MessageCircle, Users, AlertCircle } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { getOrCreateTripChat } from '@/services/chat';
import styles from './ChatModal.module.css';

interface Chat {
  id: number;
  trip_id: number | null;
  origin: string;
  destination: string;
  last_message: string;
  last_message_time: string;
  member_count: number;
  is_active: boolean;
}

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
  chat: Chat | null;
  currentUserId: string;
}

interface ChatData {
  chat_id: number;
  trip_id: number;
  participants_count: number;
  last_message?: string;
  last_message_time?: string;
}

export function ChatModal({ opened, onClose, chat, currentUserId }: ChatModalProps) {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !chat?.id) return;

    const fetchChatData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 [ChatModal] Fetching chat data for chat:', chat.id);
        
        // Si ya tenemos el chat_id directamente
        if (chat.id) {
          setChatData({
            chat_id: chat.id,
            trip_id: chat.trip_id || 0,
            participants_count: chat.member_count || 0,
            last_message: chat.last_message,
            last_message_time: chat.last_message_time
          });
          setLoading(false);
          return;
        }

        // Si necesitamos obtener/crear el chat por trip_id
        if (chat.trip_id) {
          const result = await getOrCreateTripChat(chat.trip_id);
          
          if (!result.success || !result.data) {
            const errorMsg = result.error || 'No se pudo cargar el chat';
            console.error('❌ [ChatModal] Chat service error:', errorMsg);
            throw new Error(errorMsg);
          }

          const chatResult = result.data;
          setChatData({
            chat_id: chatResult.chat_id,
            trip_id: chat.trip_id,
            participants_count: chat.member_count || 0,
            last_message: chat.last_message,
            last_message_time: chat.last_message_time
          });
        }

        console.log('✅ [ChatModal] Chat data loaded successfully');
        
      } catch (err) {
        console.error('❌ [ChatModal] Error loading chat:', err);
        
        let errorMessage = 'Error al cargar el chat';
        
        if (err instanceof Error) {
          if (err.message.includes('400')) {
            errorMessage = `Este chat no está disponible o no existe.`;
          } else if (err.message.includes('Error interno del servidor')) {
            errorMessage = `Error del servidor al cargar el chat. Intenta nuevamente.`;
          } else if (err.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [opened, chat]);

  if (!chat || !currentUserId) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Chat del Viaje"
      size="lg"
      padding={0}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        title: styles.modalTitle
      }}
      closeButtonProps={{
        style: { display: 'none' }
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        <CloseButton 
          onClick={onClose}
          size="lg"
          style={{ 
            color: '#34D399',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '50%'
          }}
        />
      </div>

      <LoadingOverlay visible={loading} />
      
      {error ? (
        <Stack align="center" gap="md" p="xl">
          <AlertCircle size={48} color="#ff6b6b" />
          <Text c="red" ta="center">{error}</Text>
          <Text size="sm" c="dimmed" ta="center">
            Chat ID: {chat.id}
          </Text>
        </Stack>
      ) : !chatData ? (
        <Stack align="center" gap="md" p="xl">
          <MessageCircle size={48} color="#34D399" />
          <Text ta="center">Iniciando chat...</Text>
        </Stack>
      ) : (
        <div className={styles.chatContainer}>
          {/* Header del chat */}
          <div className={styles.chatHeader}>
            <div className={styles.chatInfo}>
              <div className={styles.chatIcon}>
                <MessageCircle size={24} />
              </div>
              <div className={styles.chatDetails}>
                <Text className={styles.chatTitle}>
                  {chat.origin} → {chat.destination}
                </Text>
                <div className={styles.participantsInfo}>
                  <Users size={16} />
                  <Text className={styles.participantsText}>
                    {chat.member_count || 0} participantes
                  </Text>
                </div>
              </div>
            </div>
            <div className={styles.bookingInfo}>
              <Text className={styles.bookingId}>Chat ID: {chat.id}</Text>
            </div>
          </div>

          {/* Contenedor del chat */}
          <div className={styles.chatWrapper}>
            <ChatBox 
              chatId={chatData.chat_id} 
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
