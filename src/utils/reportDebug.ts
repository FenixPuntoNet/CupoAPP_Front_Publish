import { apiRequest } from '@/config/api';

// Función para verificar conectividad con el backend de reportes usando el nuevo endpoint de test
export const testReportsEndpoint = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  try {
    console.log('🔍 Testing reports endpoint connectivity...');
    
    // Usar el nuevo endpoint de test del backend
    const response = await apiRequest('/reports/test', {
      method: 'GET'
    });

    console.log('✅ Reports endpoint is reachable:', response);
    return { 
      success: true,
      details: response
    };
  } catch (error) {
    console.error('❌ Reports endpoint test failed:', error);
    
    // Intentar con el endpoint de reportes del usuario como fallback
    try {
      await apiRequest('/reports/my-reports', {
        method: 'GET'
      });
      
      return { 
        success: true,
        details: { fallback: true, message: 'Test endpoint failed but my-reports works' }
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Función para debug de datos de reporte
export const debugReportData = (contentType: string, contentId: number, reason: string, description?: string) => {
  console.group('🐛 Report Debug Information');
  console.log('📋 Report Data:');
  console.table({
    contentType,
    contentId,
    contentIdType: typeof contentId,
    contentIdValid: typeof contentId === 'number' && contentId > 0,
    reason,
    description: description || '(none)',
    timestamp: new Date().toISOString()
  });
  
  console.log('🔍 Validation Checks:');
  console.log('- contentType valid:', ['message', 'profile', 'trip'].includes(contentType));
  console.log('- contentId is number:', typeof contentId === 'number');
  console.log('- contentId is positive:', contentId > 0);
  console.log('- reason provided:', !!reason);
  
  console.groupEnd();
};

// Función para obtener información del mensaje que se está reportando
export const debugMessageInfo = (messageId: number, messages: any[]) => {
  console.group('🐛 Message Debug Information');
  
  const message = messages.find(m => m.id === messageId);
  
  if (message) {
    console.log('✅ Message found:');
    console.table({
      id: message.id,
      user_id: message.user_id,
      chat_id: message.chat_id,
      message_preview: message.message?.substring(0, 50) + '...',
      send_date: message.send_date
    });
  } else {
    console.error('❌ Message not found in current messages array');
    console.log('📋 Available message IDs:', messages.map(m => m.id));
  }
  
  console.groupEnd();
};
