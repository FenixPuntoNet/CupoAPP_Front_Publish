import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log('💬 [useChatMessages] Fetching messages for chat:', chatId);
        const result = await getChatMessages(chatId);
        
        if (result.success && result.data && result.data.messages) {
          console.log('📦 [useChatMessages] Raw backend response:', result.data);
          
          const cleaned: ChatMessage[] = result.data.messages.map((m) => ({
            id: m.id,
            chat_id: chatId,
            user_id: m.user_id,
            message: m.message,
            send_date: m.send_date,
            user_profiles: m.user_profiles || undefined
          }));

          console.log('✅ [useChatMessages] Messages processed:', cleaned.length);
          setMessages(cleaned);
        } else {
          console.warn('⚠️ [useChatMessages] No messages or error:', result.error);
          // En el nuevo sistema, es normal no tener mensajes inicialmente
          setMessages([]); // Chat exists but no messages yet - this is normal
        }
      } catch (error) {
        console.error('❌ [useChatMessages] Error in fetchMessages:', error);
        // Don't clear messages on error - keep existing ones
      }
    };

    if (chatId && chatId > 0) {
      fetchMessages();

      // TODO: Implementar websockets cuando esté listo en el backend
      // Por ahora, refrescamos cada 5 segundos solo si hay chatId válido
      const interval = setInterval(fetchMessages, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [chatId]);

  return messages;
}
