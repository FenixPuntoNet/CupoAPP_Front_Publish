import { apiRequest } from '@/config/api';

export interface UserProfile {
  id: string;
  user_id: string;
  status?: string;
  verification?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  identification_type?: string;
  identification_number?: string;
  user_type?: string;
  photo_user?: string;
  address?: string;
  city?: string;
  birth_date?: string;
  gender?: string;
  profile_picture?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

// Obtener perfil del usuario actual
export const getCurrentUserProfile = async (): Promise<ProfileResponse> => {
  try {
    console.log('📊 Getting user profile...');
    
    // Usar el endpoint /auth/me que sabemos que funciona
    const response = await apiRequest('/auth/me', {
      method: 'GET'
    });
    
    console.log('✅ Profile response from /auth/me:', response);
    
    // El endpoint /auth/me devuelve el usuario con el perfil incluido
    // Extraer los datos del perfil de la respuesta
    const profileData = {
      id: response.id || response.profile?.id,
      user_id: response.id || response.email,
      first_name: response.profile?.first_name || response.first_name,
      last_name: response.profile?.last_name || response.last_name,
      phone_number: response.profile?.phone_number || response.phone_number,
      identification_type: response.profile?.identification_type || 'CC',
      identification_number: response.profile?.identification_number || response.identification_number,
      status: response.profile?.status || response.status || 'PASSENGER',
      user_type: response.profile?.user_type || response.user_type,
      profile_picture: response.profile?.profile_picture || response.profile_picture,
      photo_user: response.profile?.photo_user || response.photo_user,
      verification: response.profile?.verification || response.verification || 'PENDIENTE',
      created_at: response.profile?.created_at || response.created_at,
      updated_at: response.profile?.updated_at || response.updated_at
    };
    
    console.log('📝 Processed profile data:', profileData);
    
    return {
      success: true,
      data: profileData
    };
  } catch (error) {
    console.error('❌ Failed to get user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener el perfil'
    };
  }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<ProfileResponse> => {
  try {
    console.log('✏️ Updating user profile with data:', profileData);
    
    // Intentar con el endpoint /profile-complete/profile que es más lógico para perfiles
    try {
      const response = await apiRequest('/profile-complete/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      console.log('✅ Profile updated successfully using /profile-complete/profile');
      return {
        success: true,
        data: response.profile || response
      };
    } catch (primaryError) {
      console.error('❌ Error with PUT /profile-complete/profile endpoint:', primaryError);
      
      // Si falla, intentar con /auth/me PUT
      try {
        const response = await apiRequest('/auth/me', {
          method: 'PUT',
          body: JSON.stringify(profileData)
        });
        
        console.log('✅ Profile updated successfully using /auth/me PUT');
        return {
          success: true,
          data: response.profile || response
        };
      } catch (secondaryError) {
        console.error('❌ Error with PUT /auth/me endpoint:', secondaryError);
        throw primaryError; // Mantener el error original
      }
    }
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el perfil'
    };
  }
};

// Función específica para completar el perfil usando el endpoint correcto
export const completeUserProfile = async (profileData: {
  first_name: string,
  last_name: string,
  phone_number: string,
  identification_type: string,
  identification_number: string,
  user_type?: string,
  photo_user?: string
}): Promise<ProfileResponse> => {
  try {
    console.log('👤 Completing user profile with data:', profileData);
    
    // Intentar con /profile-complete/profile POST primero
    try {
      const response = await apiRequest('/profile-complete/profile', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
      
      console.log('✅ Profile completed successfully using /profile-complete/profile endpoint:', response);
      
      return {
        success: true,
        data: response.profile || response
      };
    } catch (primaryError) {
      console.error('❌ Error with /profile-complete/profile endpoint:', primaryError);
      
      // Si falla, intentar actualizando el perfil en lugar de crearlo
      try {
        const response = await apiRequest('/auth/me', {
          method: 'PUT',
          body: JSON.stringify(profileData)
        });
        
        console.log('✅ Profile completed successfully using /auth/me PUT endpoint:', response);
        
        return {
          success: true,
          data: response.profile || response
        };
      } catch (secondaryError) {
        console.error('❌ Error with /auth/me PUT endpoint:', secondaryError);
        throw primaryError; // Mantener el error original
      }
    }
  } catch (error) {
    console.error('❌ Error completing profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al completar el perfil'
    };
  }
};

// Función para convertir archivo a base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Subir foto de perfil
export const uploadProfilePhoto = async (file: File): Promise<{ success: boolean; photo_url?: string; error?: string; compression?: any }> => {
  try {
    console.log('📸 Uploading profile photo...');
    
    // Validar el archivo
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG, HEIC o WebP');
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('La imagen es demasiado grande. El tamaño máximo es 5MB');
    }

    console.log('📄 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // Convertir archivo a base64
    const base64String = await fileToBase64(file);
    
    console.log('🔄 File converted to base64, length:', base64String.length);

    // Enviar al endpoint de subida
    const response = await apiRequest('/profile-complete/upload-photo', {
      method: 'POST',
      body: JSON.stringify({
        photo_base64: base64String
      })
    });

    console.log('✅ Photo uploaded successfully:', response);

    return {
      success: true,
      photo_url: response.photo_url,
      compression: response.compression
    };

  } catch (error) {
    console.error('❌ Error uploading profile photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir la foto de perfil'
    };
  }
};
