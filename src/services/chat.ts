import { apiRequest } from '@/config/api';

export interface ChatMessage {
  id: number;
  message: string;
  send_date: string;
  user_id: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    photo_user: string | null;
  };
}

export interface Chat {
  id: number;
  trip_id: number;
  created_at: string;
  trip: {
    id: number;
    date_time: string;
    status: string;  
    origin: {
      main_text: string;
    };
    destination: {
      main_text: string;
    };
  };
  last_message: string | null;
  last_message_time: string | null;
  member_count: number;
}

export interface ChatListResponse {
  chats: Chat[];
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface CreateTripChatResponse {
  chat_id: number;
  trip_id: number;
}

// Obtener lista de chats del usuario
export async function getChatList(): Promise<{ success: boolean; data?: ChatListResponse; error?: string }> {
  try {
    const response = await apiRequest('/chat/list', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener chats' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getChatList:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener chats' 
    };
  }
}

// Obtener mensajes de un chat específico
export async function getChatMessages(chatId: number): Promise<{ success: boolean; data?: ChatMessagesResponse; error?: string }> {
  try {
    const response = await apiRequest(`/chat/${chatId}/messages`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener mensajes' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener mensajes' 
    };
  }
}

// Enviar mensaje a un chat
export async function sendChatMessage(chatId: number, request: SendMessageRequest): Promise<{ success: boolean; data?: SendMessageResponse; error?: string }> {
  try {
    const response = await apiRequest(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al enviar mensaje' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return { 
      success: false, 
      error: 'Error de conexión al enviar mensaje' 
    };
  }
}

// Obtener o crear chat para un viaje
export async function getOrCreateTripChat(tripId: number): Promise<{ success: boolean; data?: CreateTripChatResponse; error?: string }> {
  try {
    const response = await apiRequest(`/chat/trip/${tripId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener chat del viaje' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getOrCreateTripChat:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener chat del viaje' 
    };
  }
}
