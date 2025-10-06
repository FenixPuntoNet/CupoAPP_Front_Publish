import { useEffect, useState, useCallback, useRef } from "react";
import { getChatMessages } from "@/services/chat";

type ChatMessage = {
  id: number;
  chat_id: number;
  user_id: string;
  message: string;
  send_date: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    photo_user: string | null;
  };
  isOptimistic?: boolean; // Para mensajes temporales
  status?: 'sending' | 'sent' | 'error'; // Estado del mensaje
};

export function useChatMessages(chatId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);

  console.log('🔍 [useChatMessages] Hook called with chatId:', chatId, 'Current messages:', messages.length);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!chatId || chatId <= 0) return;
    
    try {
      if (!silent) {
        console.log('💬 [useChatMessages] FETCHING messages for chat:', chatId);
      }
      
      const result = await getChatMessages(chatId);
      
      if (result.success && result.data && result.data.messages) {
        const cleaned: ChatMessage[] = result.data.messages.map((m) => ({
          id: m.id,
          chat_id: chatId,
          user_id: m.user_id,
          message: m.message,
          send_date: m.send_date,
          user_profiles: m.user_profiles || undefined,
          status: 'sent'
        }));

        console.log('✅ [useChatMessages] SETTING messages from server:', cleaned.length);
        
        // SIEMPRE actualizar con datos del servidor - sin comparaciones complejas
        setMessages(prevMessages => {
          const optimisticMessages = prevMessages.filter(msg => msg.isOptimistic);
          const finalMessages = [...cleaned, ...optimisticMessages];
          
          console.log('📋 [useChatMessages] Final message count:', finalMessages.length);
          lastFetchTime.current = Date.now();
          
          return finalMessages;
        });
        
      } else {
        console.warn('⚠️ [useChatMessages] No messages or error:', result.error);
        // Solo limpiar si no hay mensajes optimistas
        setMessages(prev => prev.filter(msg => msg.isOptimistic));
      }
    } catch (error) {
      console.error('❌ [useChatMessages] Error fetching messages:', error);
    }
  }, [chatId]);

  // Función para agregar mensaje optimista (aparece inmediatamente)
  const addOptimisticMessage = useCallback((message: string, userId: string) => {
    const optimisticMessage: ChatMessage = {
      id: Date.now(), // ID temporal
      chat_id: chatId,
      user_id: userId,
      message,
      send_date: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    console.log('⚡ [useChatMessages] Added optimistic message');
    
    return optimisticMessage.id;
  }, [chatId]);

  // Función para actualizar estado de mensaje optimista
  const updateOptimisticMessage = useCallback((tempId: number, status: 'sent' | 'error') => {
    setMessages(prev => prev.map(msg => 
      msg.id === tempId && msg.isOptimistic 
        ? { ...msg, status }
        : msg
    ));
  }, []);

  // Función para remover mensaje optimista en caso de error
  const removeOptimisticMessage = useCallback((tempId: number) => {
    setMessages(prev => prev.filter(msg => !(msg.id === tempId && msg.isOptimistic)));
  }, []);

  const refreshMessages = useCallback(async () => {
    console.log('🔄 [useChatMessages] MANUAL REFRESH FORCED');
    await fetchMessages(false);
    
    // Doble refresh para asegurar
    setTimeout(async () => {
      console.log('🔄 [useChatMessages] MANUAL REFRESH - Second attempt');
      await fetchMessages(false);
    }, 500);
  }, [fetchMessages]);

  // Polling MUY simple y directo
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
    }
    
    const poll = () => {
      console.log('🔄 [useChatMessages] Polling messages...');
      fetchMessages(true);
      pollingIntervalRef.current = setTimeout(poll, 2000); // Cada 2 segundos
    };
    
    poll();
  }, [fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (chatId && chatId > 0) {
      console.log('🔄 [useChatMessages] Chat ID changed, resetting and loading:', chatId);
      
      // FORZAR limpieza completa del estado
      setMessages([]);
      lastFetchTime.current = 0;
      
      // Parar polling anterior
      stopPolling();
      
      // MÚLTIPLES cargas para asegurar que funcione
      const loadMessages = async () => {
        console.log('📡 [useChatMessages] FORCE Loading messages for chat:', chatId);
        await fetchMessages(false);
        
        // Segunda carga después de 300ms
        setTimeout(async () => {
          console.log('� [useChatMessages] FORCE Second load...');
          await fetchMessages(false);
        }, 300);
        
        // Tercera carga después de 800ms
        setTimeout(async () => {
          console.log('📡 [useChatMessages] FORCE Third load...');
          await fetchMessages(false);
        }, 800);
      };
      
      loadMessages();
      
      // Iniciar polling después de la carga inicial
      setTimeout(() => {
        startPolling();
      }, 1000);

      return () => {
        console.log('🔄 [useChatMessages] Cleaning up for chat:', chatId);
        stopPolling();
      };
    } else {
      // Si no hay chatId válido, limpiar mensajes
      setMessages([]);
      stopPolling();
    }
  }, [chatId]); // SOLO chatId como dependencia para evitar loops

  return { 
    messages, 
    refreshMessages, 
    addOptimisticMessage, 
    updateOptimisticMessage, 
    removeOptimisticMessage 
  };
}