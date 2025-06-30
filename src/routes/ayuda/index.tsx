import { useEffect, useState, useRef } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { supabase } from '@/lib/supabaseClient';
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
import type { RealtimeChannel } from '@supabase/supabase-js';
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
  const [messages, setMessages] = useState<
    { id: number; mensaje: string; user_id: string; created_at: string }[]
  >([]);
  const [assistantId, setAssistantId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ from: '/ayuda/' });
  const queryAssistantId = search?.id ? parseInt(search.id) : null;

  const soporteUserId = '28262dc2-dca2-473a-be75-1aaa4c5bbf77';

  useEffect(() => {
    const setupAssistant = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No se pudo obtener el usuario:', userError?.message);
        return;
      }

      setUserId(user.id);

      let finalAssistantId = queryAssistantId;

      if (!finalAssistantId) {
        const { data: existingAssistant } = await supabase
          .from('assistent')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        finalAssistantId = existingAssistant?.id || null;
        setIsOwner(true);
      } else {
        const { data: owner } = await supabase
          .from('assistent')
          .select('user_id')
          .eq('id', finalAssistantId)
          .single();

        if (owner?.user_id === user.id) {
          setIsOwner(true);
        }
      }

      if (finalAssistantId) {
        setAssistantId(finalAssistantId);
        fetchMessages(finalAssistantId);
        subscribeToRealtime(finalAssistantId);
      } else {
        const { data: newAssistant } = await supabase
          .from('assistent')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (!newAssistant) {
          console.error('No se pudo crear el asistente');
          return;
        }

        setAssistantId(newAssistant.id);
        setIsOwner(true);
        fetchMessages(newAssistant.id);
        subscribeToRealtime(newAssistant.id);
      }
    };

    setupAssistant();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchMessages = async (assistantId: number) => {
    const { data, error } = await supabase
      .from('assistent_chat')
      .select('id, mensaje, user_id, created_at')
      .eq('assistent_id', assistantId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando mensajes:', error.message);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !assistantId || !userId) return;

    const { error } = await supabase.from('assistent_chat').insert({
      mensaje: input,
      user_id: userId,
      assistent_id: assistantId,
    });

    if (error) {
      console.error('Error enviando mensaje:', error.message);
    } else {
      setInput('');
    }
  };

  const subscribeToRealtime = (assistantId: number) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`realtime:assistent_chat:${assistantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assistent_chat',
          filter: `assistent_id=eq.${assistantId}`,
        },
        (payload) => {
          const newMessage = payload.new as {
            id: number;
            mensaje: string;
            user_id: string;
            created_at: string;
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              sendMessage();
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
