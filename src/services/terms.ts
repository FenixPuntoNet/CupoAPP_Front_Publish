// import { apiRequest } from '@/config/api';

export interface SaveTermsRequest {
  verification_terms?: string;
  suscriptions?: string;
}

export interface TermsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Guardar términos y condiciones
// Nota: Por ahora, los términos se guardan durante el registro
// Este servicio es para futuras implementaciones de actualización de términos
export const saveTermsAndConditions = async (data: SaveTermsRequest): Promise<TermsResponse> => {
  try {
    console.log('📋 Terms and conditions data prepared:', data);
    
    // Por ahora, simular éxito ya que los términos se guardan en el registro
    // En el futuro, esto podría conectarse a un endpoint específico
    return {
      success: true,
      message: 'Términos y condiciones registrados correctamente durante el signup'
    };
  } catch (error) {
    console.error('Save terms error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error guardando términos y condiciones'
    };
  }
};
