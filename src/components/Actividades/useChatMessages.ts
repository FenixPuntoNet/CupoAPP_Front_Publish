import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("send_date", { ascending: true });

      if (!error && data) {
        const cleaned: ChatMessage[] = data
          .filter(
            (m): m is Required<ChatMessage> =>
              m.chat_id !== null &&
              m.user_id !== null &&
              m.send_date !== null
          )
          .map((m) => ({
            id: m.id,
            chat_id: m.chat_id,
            user_id: m.user_id,
            message: m.message,
            send_date: m.send_date,
          }));

        setMessages(cleaned);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new;

          if (
            newMsg.chat_id !== null &&
            newMsg.user_id !== null &&
            newMsg.send_date !== null
          ) {
            const formattedMessage: ChatMessage = {
              id: newMsg.id,
              chat_id: newMsg.chat_id,
              user_id: newMsg.user_id,
              message: newMsg.message,
              send_date: newMsg.send_date,
            };

            setMessages((prev) => [...prev, formattedMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return messages;
}
