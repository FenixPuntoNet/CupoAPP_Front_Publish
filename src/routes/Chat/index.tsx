import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatBox } from '@/components/Actividades/ChatBox';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import styles from './index.module.css';

interface Chat {
  id: number;
  trip_id: number | null;
  origin?: string;
  destination?: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const { trip_id } = Route.useSearch();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchUserAndChats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        navigate({ to: '/Login' });
        return;
      }

      setUserId(user.id);

      const { data: chatParticipantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (participantError) {
        console.error('Error al cargar participantes del chat:', participantError);
        return;
      }

      const chatIds = chatParticipantData
        .map((item) => item.chat_id)
        .filter((id): id is number => id !== null);

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id, trip_id')
        .in('id', chatIds);

      if (chatError) {
        console.error('Error al cargar chats:', chatError);
        return;
      }

      const tripIds = chatData.map(c => c.trip_id).filter((id): id is number => id !== null);

      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id,
          origin:locations!trips_origin_id_fkey(main_text),
          destination:locations!trips_destination_id_fkey(main_text)
        `)
        .in('id', tripIds);

      const chatsWithDetails = chatData.map(chat => {
        const trip = tripsData?.find(t => t.id === chat.trip_id);
        return {
          ...chat,
          origin: trip?.origin?.main_text || 'Origen',
          destination: trip?.destination?.main_text || 'Destino',
        };
      });

      setChats(chatsWithDetails);

      if (trip_id) {
        const matchedChat = chatsWithDetails.find(chat => chat.trip_id === Number(trip_id));
        if (matchedChat) {
          setSelectedChat(matchedChat);
          setIsMobileChatOpen(true);
        }
      }
    };

    fetchUserAndChats();
  }, [navigate]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setIsMobileChatOpen(true);
  };

  const handleBackToChats = () => {
    setIsMobileChatOpen(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div style={{height: '30px'}} />
      {/* Lista de chats */}
      <aside
        className={`${styles.chatSidebar} ${isMobileChatOpen ? styles.hideMobile : ''}`}
      >
        <div className={styles.chatHeader}>
          <span className="text-xl">👥</span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Mis Chats</h2>
            <p className="text-xs text-gray-400">Salas comunitarias activas</p>
          </div>
        </div>
        <ul className={styles.chatList}>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`${styles.chatItem} ${
                selectedChat?.id === chat.id ? styles.activeChatItem : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {chat.origin} → {chat.destination}
                </span>
                <span className="text-[11px] text-gray-500">Activo</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">
                Conversación grupal de este viaje
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel de chat */}
      <main
        className={`${styles.chatPanel} ${
          isMobileChatOpen || window.innerWidth >= 768 ? 'block' : 'hidden'
        }`}
      >
        {selectedChat && userId ? (
          <div className="flex flex-col h-full">
            <div className={styles.chatTopBar}>
              <button
                className="md:hidden text-indigo-400 mr-4 text-sm"
                onClick={handleBackToChats}
              >
                ← Volver
              </button>
              <h3 className="text-lg font-semibold tracking-tight">
                {selectedChat.origin} → {selectedChat.destination}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatBox chatId={selectedChat.id} currentUserId={userId} />
            </div>
          </div>
        ) : (
          <div className="m-auto text-center text-gray-500 px-6">
            <h2 className="text-xl font-semibold mb-2">Selecciona un chat</h2>
            <p className="text-sm">Aquí verás los mensajes del grupo</p>
          </div>
        )}
      </main>
    </div>
  );
}

export const Route = createFileRoute('/Chat/')({
  component: ChatPage,
  validateSearch: (search) => ({
    trip_id: search.trip_id ? String(search.trip_id) : null,
  }),
});
