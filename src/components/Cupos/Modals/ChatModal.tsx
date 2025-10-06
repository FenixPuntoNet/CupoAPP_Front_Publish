import React, { useState, useEffect } from 'react';
import { Modal, Stack, Text, LoadingOverlay, CloseButton } from '@mantine/core';
import { MessageCircle, Users, AlertCircle } from 'lucide-react';
import { ChatBox } from '@/components/Actividades/Chat/ChatBox';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { getOrCreateTripChat } from '@/services/chat';
import styles from './ChatModal.module.css';

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
  tripId: number;
  bookingId?: string;
}

interface ChatData {
  chat_id: number;
  trip_id: number;
  participants_count: number;
  last_message?: string;
  last_message_time?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ opened, onClose, tripId, bookingId }) => {
  const { user } = useBackendAuth();
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !tripId) return;

    const fetchChatData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 [ChatModal] Fetching chat data for trip:', tripId);
        
        // Validar que el tripId es válido
        if (!tripId || tripId <= 0) {
          throw new Error('ID de viaje inválido');
        }
        
        // Usar el servicio optimizado
        const result = await getOrCreateTripChat(tripId);
        
        if (!result.success || !result.data) {
          const errorMsg = result.error || 'No se pudo cargar el chat';
          console.error('❌ [ChatModal] Chat service error:', errorMsg);
          throw new Error(errorMsg);
        }

        const chat = result.data;
        setChatData({
          chat_id: chat.chat_id,
          trip_id: tripId,
          participants_count: 0, // Se obtendrá del ChatBox
          last_message: undefined,
          last_message_time: undefined
        });

        console.log('✅ [ChatModal] Chat data loaded successfully:', chat);
        
      } catch (err) {
        console.error('❌ [ChatModal] Error loading chat:', err);
        
        // Mejorar mensaje de error según el tipo de error
        let errorMessage = 'Error desconocido al cargar el chat';
        
        if (err instanceof Error) {
          if (err.message.includes('400')) {
            errorMessage = `Este viaje (ID: ${tripId}) no tiene chat disponible o no existe. Solo los viajes publicados y confirmados tienen chat.`;
          } else if (err.message.includes('Error interno del servidor')) {
            errorMessage = `Error del servidor al crear/obtener el chat para el viaje ${tripId}. Intenta nuevamente en unos momentos.`;
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
  }, [opened, tripId]);

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
            {bookingId && `Reserva: ${bookingId}`}
          </Text>
        </Stack>
      ) : !chatData ? (
        <Stack align="center" gap="md" p="xl">
          <MessageCircle size={48} color="#34D399" />
          <Text ta="center">Iniciando chat del viaje...</Text>
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
                <Text className={styles.chatTitle}>Chat del Viaje</Text>
                <div className={styles.participantsInfo}>
                  <Users size={16} />
                  <Text className={styles.participantsText}>
                    Conversación del viaje
                  </Text>
                </div>
              </div>
            </div>
            {bookingId && (
              <div className={styles.bookingInfo}>
                <Text className={styles.bookingId}>Reserva: {bookingId}</Text>
              </div>
            )}
          </div>

          {/* Contenedor del chat */}
          <div className={styles.chatWrapper}>
            {user && (
              <ChatBox 
                chatId={chatData.chat_id} 
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ChatModal;