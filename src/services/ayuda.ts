import { apiRequest } from '@/config/api';

export interface AssistantResponse {
  assistant_id: number;
  is_owner: boolean;
  is_support?: boolean;
  owner_id?: string;
}

export interface Message {
  id: number;
  mensaje: string;
  user_id: string;
  created_at: string;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface SendMessageRequest {
  assistant_id: number;
  message: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface SupportChat {
  id: number;
  user_id: string;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    photo_user: string | null;
  };
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface SupportChatsResponse {
  chats: SupportChat[];
}

// Obtener o crear asistente para el usuario
export async function getOrCreateAssistant(): Promise<{ success: boolean; data?: AssistantResponse; error?: string }> {
  try {
    const response = await apiRequest('/ayuda/assistant', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener asistente' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getOrCreateAssistant:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener asistente' 
    };
  }
}

// Obtener asistente por ID (para soporte)
export async function getAssistantById(assistantId: number): Promise<{ success: boolean; data?: AssistantResponse; error?: string }> {
  try {
    const response = await apiRequest(`/ayuda/assistant/${assistantId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener asistente' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getAssistantById:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener asistente' 
    };
  }
}

// Obtener mensajes del chat de soporte
export async function getMessages(assistantId: number): Promise<{ success: boolean; data?: MessagesResponse; error?: string }> {
  try {
    const response = await apiRequest(`/ayuda/messages/${assistantId}`, {
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
    console.error('Error in getMessages:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener mensajes' 
    };
  }
}

// Enviar mensaje al chat de soporte
export async function sendMessage(request: SendMessageRequest): Promise<{ success: boolean; data?: SendMessageResponse; error?: string }> {
  try {
    const response = await apiRequest('/ayuda/send-message', {
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
    console.error('Error in sendMessage:', error);
    return { 
      success: false, 
      error: 'Error de conexión al enviar mensaje' 
    };
  }
}

// Obtener todos los chats de soporte (para soporte)
export async function getSupportChats(): Promise<{ success: boolean; data?: SupportChatsResponse; error?: string }> {
  try {
    const response = await apiRequest('/ayuda/support/chats', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener chats de soporte' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getSupportChats:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener chats de soporte' 
    };
  }
}
