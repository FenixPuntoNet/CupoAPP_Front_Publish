import { useEffect, useState, useRef } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import {
  TextInput,
  Button,
  Paper,
  Title,
  Stack,
  ScrollArea,
  Text,
  Group,
  ActionIcon,
} from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { 
  getOrCreateAssistant, 
  getAssistantById, 
  getMessages, 
  sendMessage,
  type Message 
} from '@/services/ayuda';
import { getCurrentUser } from '@/services/auth';
import styles from './index.module.css';

export const Route = createFileRoute('/ayuda/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: typeof search.id === 'string' ? search.id : null,
    };
  },
  component: AssistantChat,
});

function AssistantChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantId, setAssistantId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ from: '/ayuda/' });
  const queryAssistantId = search?.id ? parseInt(search.id) : null;

  const soporteUserId = '28262dc2-dca2-473a-be75-1aaa4c5bbf77';

  useEffect(() => {
    setupAssistant();
  }, []);

  const setupAssistant = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const userResult = await getCurrentUser();
      if (!userResult.success || !userResult.user) {
        setError('No se pudo obtener el usuario');
        navigate({ to: '/Login' });
        return;
      }

      const user = userResult.user;
      setUserId(user.id);

      let finalAssistantId = queryAssistantId;

      if (!finalAssistantId) {
        // Obtener o crear asistente para el usuario actual
        const assistantResult = await getOrCreateAssistant();
        if (!assistantResult.success || !assistantResult.data) {
          setError(assistantResult.error || 'Error al obtener asistente');
          return;
        }

        finalAssistantId = assistantResult.data.assistant_id;
        setIsOwner(assistantResult.data.is_owner);
      } else {
        // Obtener asistente específico (para soporte)
        const assistantResult = await getAssistantById(finalAssistantId);
        if (!assistantResult.success || !assistantResult.data) {
          setError(assistantResult.error || 'Error al obtener asistente');
          return;
        }

        setIsOwner(assistantResult.data.is_owner);
      }

      setAssistantId(finalAssistantId);
      await fetchMessages(finalAssistantId);

    } catch (error) {
      console.error('Error setting up assistant:', error);
      setError('Error inesperado al configurar el asistente');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (assistantId: number) => {
    try {
      const result = await getMessages(assistantId);
      if (result.success && result.data) {
        setMessages(result.data.messages);
      } else {
        console.error('Error loading messages:', result.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !assistantId || !userId) return;

    try {
      const result = await sendMessage({
        assistant_id: assistantId,
        message: input.trim()
      });

      if (result.success && result.data) {
        setMessages(prev => [...prev, result.data!.message]);
        setInput('');
      } else {
        console.error('Error sending message:', result.error);
        setError(result.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error inesperado al enviar mensaje');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{height: '30px'}} />
        <div className={styles.inner}>
          <Group mb="sm">
            <ActionIcon variant="light" color="gray" onClick={() => navigate({ to: '/Perfil' })}>
              <ArrowLeft size={20} />
            </ActionIcon>
            <Title order={3}>Centro de Soporte</Title>
          </Group>
          <Paper withBorder radius="md" className={styles.chatBox}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Text>Cargando chat...</Text>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{height: '30px'}} />
        <div className={styles.inner}>
          <Group mb="sm">
            <ActionIcon variant="light" color="gray" onClick={() => navigate({ to: '/Perfil' })}>
              <ArrowLeft size={20} />
            </ActionIcon>
            <Title order={3}>Centro de Soporte</Title>
          </Group>
          <Paper withBorder radius="md" className={styles.chatBox}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Text color="red">{error}</Text>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{height: '30px'}} />
      <div className={styles.inner}>
        <Group mb="sm">
          <ActionIcon variant="light" color="gray" onClick={() => navigate({ to: '/Perfil' })}>
            <ArrowLeft size={20} />
          </ActionIcon>
          <Title order={3}>Centro de Soporte</Title>
        </Group>

        <Paper withBorder radius="md" className={styles.chatBox}>
          <ScrollArea className={styles.scrollArea}>
            <Stack gap="xs">
              {messages.map((msg) => {
                const isMine = msg.user_id === userId;
                const isSoporte = msg.user_id === soporteUserId;

                return (
                  <div
                    key={msg.id}
                    className={isMine ? styles.myMessageWrapper : styles.theirMessageWrapper}
                  >
                    <div className={isMine ? styles.myMessage : styles.theirMessage}>
                      {!isMine && (
                        <Text size="xs" fw={600} c="gray">
                          {isSoporte ? 'Soporte Cupo' : 'Usuario'}
                        </Text>
                      )}
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.mensaje}
                      </Text>
                      <Text size="xs" c={isMine ? 'white' : 'gray'} ta="right" mt={4}>
                        {new Date(msg.created_at).toLocaleString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Text>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </Stack>
          </ScrollArea>
        </Paper>

        {(isOwner || userId === soporteUserId) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={styles.inputForm}
          >
            <TextInput
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              className={styles.input}
            />
            <Button type="submit" color="teal">
              Enviar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
