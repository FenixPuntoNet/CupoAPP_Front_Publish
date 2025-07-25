import { useEffect, useState } from "react";
import { getChatMessages } from "@/services/chat";

type ChatMessage = {
  id: number;
  chat_id: number;
  user_id: string;
  message: string;
  send_date: string;
};

export function useChatMessages(chatId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const result = await getChatMessages(chatId);
        
        if (result.success && result.data) {
          const cleaned: ChatMessage[] = result.data.messages.map((m) => ({
            id: m.id,
            chat_id: chatId,
            user_id: m.user_id,
            message: m.message,
            send_date: m.send_date,
          }));

          setMessages(cleaned);
        } else {
          console.error('Error fetching messages:', result.error);
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };

    fetchMessages();

    // TODO: Implementar polling o websockets para tiempo real
    // Por ahora, refrescamos cada 5 segundos
    const interval = setInterval(fetchMessages, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [chatId]);

  return messages;
}
