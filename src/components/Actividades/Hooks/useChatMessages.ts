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
};

export function useChatMessages(chatId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const intervalRef = useRef<number | null>(null);

  // FUNCIÓN SIMPLE - Sin callbacks complicados
  const loadMessages = async () => {
    if (!chatId || chatId <= 0) return;
    
    try {
      console.log('💬 LOADING MESSAGES FOR CHAT:', chatId);
      const result = await getChatMessages(chatId);
      
      if (result.success && result.data?.messages) {
        const cleaned = result.data.messages.map((m: any) => ({
          id: m.id,
          chat_id: chatId,
          user_id: m.user_id,
          message: m.message,
          send_date: m.send_date,
          user_profiles: m.user_profiles
        }));
        
        console.log('✅ MESSAGES LOADED:', cleaned.length);
        setMessages(cleaned);
      } else {
        console.log('⚠️ NO MESSAGES FOUND');
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ ERROR LOADING MESSAGES:', error);
    }
  };

  // FUNCIÓN DE REFRESH MANUAL
  const refreshMessages = useCallback(() => {
    console.log('🔄 MANUAL REFRESH TRIGGERED');
    loadMessages();
  }, [chatId]);

  // EFFECT SÚPER SIMPLE
  useEffect(() => {
    console.log('🚀 CHAT HOOK STARTING FOR CHAT:', chatId);
    
    if (!chatId || chatId <= 0) {
      setMessages([]);
      return;
    }

    // Limpiar interval anterior
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    // Cargar mensajes inmediatamente
    loadMessages();

    // POLLING CADA 3 SEGUNDOS - OPTIMIZADO
    intervalRef.current = window.setInterval(() => {
      console.log('🔄 POLLING OPTIMIZADO...');
      loadMessages();
    }, 3000);

    console.log('✅ POLLING STARTED FOR CHAT:', chatId);

    // Cleanup
    return () => {
      console.log('🧹 CLEANUP FOR CHAT:', chatId);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chatId]); // SOLO chatId

  return { 
    messages, 
    refreshMessages
  };
}