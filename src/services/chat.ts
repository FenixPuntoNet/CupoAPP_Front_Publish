import { apiRequest, clearApiCache } from '@/config/api';

// Debug function to test chat API
export async function debugChatAPI(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔧 [debugChatAPI] Testing chat API endpoints');
    
    // Test if the user is authenticated first
    const authTest = await apiRequest('/auth/me');
    console.log('🔧 [debugChatAPI] Auth test result:', authTest);
    
    if (!authTest || authTest.error) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }
    
    // Now test the chat list endpoint
    console.log('🔧 [debugChatAPI] Testing /chat/list endpoint');
    const chatTest = await apiRequest('/chat/list');
    console.log('🔧 [debugChatAPI] Chat test result:', chatTest);
    
    return {
      success: true,
      data: {
        auth: authTest,
        chat: chatTest
      }
    };
  } catch (error) {
    console.error('🔧 [debugChatAPI] Debug failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Debug test failed'
    };
  }
}

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
  origin: string;
  destination: string;
  last_message: string;
  last_message_time: string;
  member_count: number;
  is_active: boolean;
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

// Obtener lista de chats del usuario - OPTIMIZADO PARA BACKEND FUNCIONANDO
export async function getChatList(): Promise<{ success: boolean; data?: ChatListResponse; error?: string }> { 
  try {
    console.log('💬 [getChatList] Loading chats from fixed backend...');
    
    const response = await apiRequest('/chat/list');
    
    console.log('📡 [getChatList] Backend response:', response);
    
    if (response && response.chats && Array.isArray(response.chats)) {
      console.log(`✅ [getChatList] Successfully loaded ${response.chats.length} chats`);
      
      // Validar que cada chat tenga la estructura correcta
      const validChats = response.chats.filter((chat: any) => 
        chat.id && typeof chat.id === 'number' && 
        chat.trip_id && typeof chat.trip_id === 'number'
      );
      
      if (validChats.length !== response.chats.length) {
        console.warn('⚠️ [getChatList] Some chats had invalid structure, filtered out');
      }
      
      return {
        success: true,
        data: { chats: validChats }
      };
    } else {
      console.warn('⚠️ [getChatList] Backend returned unexpected format:', response);
      return {
        success: true,
        data: { chats: [] },
        error: 'No se encontraron chats disponibles.'
      };
    }
  } catch (error) {
    console.error('❌ [getChatList] Error:', error);
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes('500')) {
        console.error('🚨 [getChatList] Backend 500 error - this should not happen with the fixed backend!');
        return {
          success: false,
          error: 'Error del servidor. El backend debería estar arreglado - contacta a soporte inmediatamente.'
        };
      }
      
      if (error.message.includes('401') || error.message.includes('Token')) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.'
        };
      }
      
      if (error.message.includes('403')) {
        return {
          success: false,
          error: 'No tienes permisos para acceder a los chats.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Error de conexión al cargar chats. Verifica tu conexión a internet.'
    };
  }
}

// Obtener mensajes de un chat específico - OPTIMIZADO
export async function getChatMessages(chatId: number): Promise<{ success: boolean; data?: ChatMessagesResponse; error?: string }> {
  try {
    console.log('💬 [getChatMessages] Fetching messages for chat:', chatId);
    const response = await apiRequest(`/chat/${chatId}/messages`);
    
    console.log('📡 [getChatMessages] Backend response:', response);
    
    if (response && response.messages && Array.isArray(response.messages)) {
      console.log(`✅ [getChatMessages] Successfully loaded ${response.messages.length} messages`);
      return { 
        success: true, 
        data: { messages: response.messages } 
      };
    }
    
    // Handle case where response is successful but no messages
    if (response && !response.error) {
      return { 
        success: true, 
        data: { messages: [] } 
      };
    }
    
    return { 
      success: false, 
      error: response?.error || 'No se encontraron mensajes' 
    };
  } catch (error) {
    console.error('❌ [getChatMessages] Error:', error);
    
    // Handle server errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('500')) {
        return { 
          success: false, 
          error: 'Error del servidor al cargar mensajes. Contacta a soporte.'
        };
      }
      
      if (error.message.includes('401')) {
        return { 
          success: false, 
          error: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.'
        };
      }
      
      if (error.message.includes('403')) {
        return { 
          success: false, 
          error: 'No tienes permisos para ver este chat.'
        };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión al obtener mensajes' 
    };
  }
}

// Enviar mensaje a un chat - OPTIMIZADO
export async function sendChatMessage(chatId: number, request: SendMessageRequest): Promise<{ success: boolean; data?: SendMessageResponse; error?: string }> {
  try {
    console.log('💬 [sendChatMessage] Sending message to chat:', chatId, request);
    const response = await apiRequest(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    
    console.log('📡 [sendChatMessage] Backend response:', response);
    
    if (response && response.message) {
      console.log('✅ [sendChatMessage] Message sent successfully');
      
      // 🔥 IMPORTANTE: Limpiar cache para que los mensajes nuevos aparezcan
      console.log('🧹 [sendChatMessage] Clearing API cache to show new messages');
      clearApiCache();
      
      return { 
        success: true, 
        data: { message: response.message } 
      };
    }
    
    return { 
      success: false, 
      error: response?.error || 'Error al enviar mensaje' 
    };
  } catch (error) {
    console.error('❌ [sendChatMessage] Error:', error);
    
    // Handle server errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('500')) {
        return { 
          success: false, 
          error: 'Error del servidor al enviar mensaje. Contacta a soporte.'
        };
      }
      
      if (error.message.includes('401')) {
        return { 
          success: false, 
          error: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.'
        };
      }
      
      if (error.message.includes('403')) {
        return { 
          success: false, 
          error: 'No tienes permisos para enviar mensajes en este chat.'
        };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión al enviar mensaje' 
    };
  }
}

// Obtener o crear chat para un viaje - OPTIMIZADO PARA CHATS AUTOMÁTICOS
export async function getOrCreateTripChat(tripId: number): Promise<{ success: boolean; data?: CreateTripChatResponse; error?: string }> {
  try {
    console.log('💬 [getOrCreateTripChat] Getting chat for trip:', tripId);
    console.log('💡 [getOrCreateTripChat] Using the new automatic chat system - chats are created when trips are published');
    
    // Validar tripId
    if (!tripId || tripId <= 0) {
      return { 
        success: false, 
        error: 'ID de viaje inválido' 
      };
    }
    
    // Con el nuevo sistema automático, solo necesitamos obtener el chat existente
    const response = await apiRequest(`/chat/trip/${tripId}`, {
      method: 'POST',
      body: JSON.stringify({}) // Enviar body JSON vacío explícitamente para compatibilidad con Fastify
    });
    
    console.log('📡 [getOrCreateTripChat] Backend response:', response);
    
    if (response && response.chat_id) {
      console.log('✅ [getOrCreateTripChat] Chat found/created successfully:', response.chat_id);
      return { 
        success: true, 
        data: { 
          chat_id: response.chat_id, 
          trip_id: response.trip_id || tripId 
        } 
      };
    }
    
    return { 
      success: false, 
      error: response?.error || 'Chat aún no disponible. Los chats se crean automáticamente cuando publicas viajes.' 
    };
  } catch (error) {
    console.error('❌ [getOrCreateTripChat] Error:', error);
    
    // Mejorar el manejo de errores específicos
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        return { 
          success: false, 
          error: `El viaje ${tripId} no existe, no está publicado, o no tiene chat disponible. Solo los viajes confirmados pueden tener chat.` 
        };
      } else if (error.message.includes('404')) {
        return { 
          success: false, 
          error: `Viaje ${tripId} no encontrado.` 
        };
      } else if (error.message.includes('403')) {
        return { 
          success: false, 
          error: 'No tienes permisos para acceder a este chat.' 
        };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al obtener el chat' 
    };
  }
}

// Función para verificar el estado de un chat de viaje específico (útil para debugging)
export async function debugTripChat(tripId: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 [debugTripChat] Checking chat status for trip:', tripId);
    
    const response = await apiRequest(`/chat/debug/${tripId}`);
    
    console.log('📡 [debugTripChat] Debug response:', response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [debugTripChat] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en debug de chat'
    };
  }
}
