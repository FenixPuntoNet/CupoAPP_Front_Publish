import React, { useEffect, useState } from 'react';
import {
  Container,
  TextInput,
  Select,
  Button,
  Paper,
  UnstyledButton,
  Box,
  Text,
  LoadingOverlay,
  Image,
  Modal,
} from '@mantine/core';
import { ArrowLeft, Camera } from 'lucide-react';
import { useForm } from '@mantine/form';
import { useNavigate, createFileRoute, useSearch } from '@tanstack/react-router';
import { notifications } from '@mantine/notifications';
import { getCurrentUserProfile, updateUserProfile, completeUserProfile, uploadProfilePhoto } from '@/services/profile';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { OnboardingWelcome } from '@/components/OnboardingWelcome';
import styles from './index.module.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface ProfileFormData {
  id: number;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  identification_type: string;
  identification_number: string;
  user_type: string;
  photo_user?: string | null;
}

const CompleteProfileView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { user, isNewUser, markUserAsExperienced, refreshUser, clearCacheAndRefresh } = useBackendAuth();
  const search = useSearch({ from: '/CompletarRegistro/' }) as { from?: string };

  const form = useForm<ProfileFormData>({
    initialValues: {
      id: 0,
      email: '',
      phone_number: '',
      first_name: '',
      last_name: '',
      identification_type: 'CC',
      identification_number: '',
      user_type: 'PASSENGER',
      photo_user: null,
    },
    validate: {
      phone_number: (v) => (!v || v.length < 10 ? 'Número inválido' : null),
      first_name: (v) => (!v ? 'Requerido' : v.length < 3 ? 'Muy corto' : null),
      last_name: (v) => (!v ? 'Requerido' : v.length < 3 ? 'Muy corto' : null),
      identification_number: (v) => (!v ? 'Requerido' : v.length < 6 ? 'Muy corto' : null),
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Debug: verificar el origen de la navegación y estado de usuario
        console.log('🔍 CompletarRegistro Navigation context:', {
          searchParams: search,
          fromOnboarding: search?.from === 'onboarding',
          isNewUser,
          user: user ? { email: user.email, username: user.username } : null,
          localStorage_isNewUser: localStorage.getItem('is_new_user'),
          localStorage_userExperienced: localStorage.getItem('user_experienced')
        });
        
        // ✅ DETECCIÓN DE NUEVO USUARIO SIMPLIFICADA
        const isFromNewRegistration = localStorage.getItem('is_new_user') === 'true';
        const notExperienced = !localStorage.getItem('user_experienced');
        const fromOnboardingParam = search?.from === 'onboarding';
        
        console.log('🔍 Onboarding detection status:', {
          isFromNewRegistration,
          notExperienced,
          fromOnboardingParam,
          isNewUserContext: isNewUser,
          userExists: !!user
        });

        // Mostrar onboarding si es un usuario recién registrado
        if (isFromNewRegistration && notExperienced) {
          console.log('🎯 NEW USER DETECTED: Showing onboarding welcome');
          setShowOnboarding(true);
        }
        
        // Obtener el email y nombre del usuario autenticado
        const userEmail = user?.email || '';
        const userName = user?.username || '';
        
        console.log('👤 Auth context user data:', { userEmail, userName });
        
        // Usar el backend service para obtener el perfil
        const profileResponse = await getCurrentUserProfile();
        
        if (!profileResponse.success || !profileResponse.data) {
          // Si no hay perfil, crear uno nuevo con los datos del usuario autenticado
          console.log('📝 No existing profile found, creating new with auth data');
          form.setValues({
            ...form.values,
            email: userEmail,
            first_name: '', // Dejar vacío para forzar al usuario a ingresar su nombre real
          });
          setInitialLoading(false);
          return;
        }

        const profile = profileResponse.data;
        setIsEditing(true);
        
        // 🔧 ARREGLO: Usar tanto photo_user como profile_picture para compatibilidad
        setPreviewUrl(profile.photo_user || profile.profile_picture || null);
        
        console.log('📋 Profile data loaded:', profile);
        console.log('🖼️ Setting preview URL:', profile.photo_user || profile.profile_picture || null);
        
        // Combinar datos del perfil con datos de autenticación
        form.setValues({
          id: Number(profile.id),
          email: userEmail, // Siempre usar el email del usuario autenticado
          phone_number: profile.phone_number || '',
          // Solo usar first_name del perfil si existe y no es genérico, de lo contrario dejar vacío
          first_name: (profile.first_name && profile.first_name !== profile.user_id && profile.first_name !== 'usuario nuevo') ? 
                      profile.first_name : '',
          last_name: profile.last_name || '',
          identification_type: profile.identification_type || 'CC',
          identification_number: profile.identification_number || '',
          user_type: profile.status || 'PASSENGER',
          // 🔧 ARREGLO: Usar tanto photo_user como profile_picture para compatibilidad
          photo_user: profile.photo_user || profile.profile_picture || null,
        });
        
        console.log('✅ Form values populated:', form.values);
      } catch (err) {
        console.error('❌ Error loading profile:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    // Solo cargar si tenemos datos del usuario
    if (user) {
      loadProfile();
    } else {
      console.log('⏳ Waiting for user data from auth context...');
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isNewUser, search?.from]);

  // ✅ EFECTO ADICIONAL PARA DEBUG DEL MODAL
  useEffect(() => {
    console.log('🔍 Modal state changed:', {
      showOnboarding,
      isNewUser,
      searchFrom: search?.from,
      localStorage_isNewUser: localStorage.getItem('is_new_user'),
      localStorage_userExperienced: localStorage.getItem('user_experienced')
    });
    
    if (showOnboarding) {
      console.log('🎯 ONBOARDING MODAL IS NOW OPEN!');
      
      // Añadir notificación temporal para ver si el modal se está abriendo
      setTimeout(() => {
        console.log('🔍 Checking if modal is visible in DOM...');
        const modalElement = document.querySelector('[data-mantine-modal]');
        console.log('🔍 Modal element found:', !!modalElement);
        if (modalElement) {
          console.log('✅ Modal is in DOM!');
        } else {
          console.log('❌ Modal NOT found in DOM');
        }
      }, 500);
    }
  }, [showOnboarding, isNewUser, search?.from]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Mostrar preview inmediatamente
      const previewURL = URL.createObjectURL(file);
      setPreviewUrl(previewURL);

      // Subir la foto al backend
      const uploadResult = await uploadProfilePhoto(file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir la foto');
      }

      // Actualizar el formulario con la URL de la foto subida
      form.setFieldValue('photo_user', uploadResult.photo_url);
      
      // Limpiar el preview URL del objeto para usar la URL del servidor
      URL.revokeObjectURL(previewURL);
      setPreviewUrl(uploadResult.photo_url || null);

      notifications.show({
        title: 'Foto subida',
        message: 'Tu foto de perfil se ha subido correctamente',
        color: 'green',
      });

      console.log('✅ Photo uploaded successfully:', {
        url: uploadResult.photo_url,
        compression: uploadResult.compression
      });

    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      
      // Revertir el preview en caso de error
      setPreviewUrl(form.values.photo_user || null);
      
      notifications.show({
        title: 'Error al subir foto',
        message: error instanceof Error ? error.message : 'Error desconocido al subir la foto',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implementar uploadPhoto cuando esté disponible en el backend
  /*
  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `photo_${Date.now()}.${fileExt}`;
      const path = `UsersPhotos/${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('Resources')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('Resources').getPublicUrl(path);
      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };
  */

  const handleSubmit = async (values: ProfileFormData) => {
    try {
      setLoading(true);

      // La foto ya se subió en handleFileChange, así que usamos la URL que ya está en el formulario
      const photoUrl = values.photo_user || null;

      // Format data to match backend expectations
      const dataToSave = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        identification_type: values.identification_type,
        identification_number: values.identification_number.trim(),
        // El backend espera status en lugar de user_type para algunos endpoints
        status: values.user_type,
        user_type: values.user_type,
        // Usa photo_user para la compatibilidad con ambos endpoints
        photo_user: photoUrl || undefined,
        profile_picture: photoUrl || undefined
      };

      console.log('📝 Saving profile with data:', dataToSave);

      // First try with the specialized complete profile endpoint
      let updateResponse;
      try {
        console.log('🔄 Attempting to use specialized complete profile endpoint');
        console.log('📊 Data being sent to /profile POST:', JSON.stringify(dataToSave));
        updateResponse = await completeUserProfile(dataToSave);
        
        if (updateResponse.success) {
          console.log('✅ Profile completed successfully with /profile endpoint');
        } else {
          console.warn('⚠️ /profile endpoint returned error:', updateResponse.error);
          throw new Error(updateResponse.error || 'Error al completar perfil');
        }
      } catch (completeError) {
        console.error('❌ Error with /profile endpoint:', completeError);
        
        // Fallback to the update endpoint
        console.log('🔄 Falling back to /me PUT endpoint');
        try {
          // Intentamos con el endpoint alternativo
          console.log('📊 Data being sent to /me PUT:', JSON.stringify(dataToSave));
          updateResponse = await updateUserProfile(dataToSave);
          
          if (updateResponse.success) {
            console.log('✅ Profile updated successfully with /me endpoint');
          } else {
            console.error('❌ Error response from /me endpoint:', updateResponse.error);
            throw new Error(updateResponse.error || 'Error al actualizar perfil');
          }
        } catch (updateError) {
          console.error('❌ Error with fallback endpoint:', updateError);
          throw new Error('No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.');
        }
      }

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Error al guardar el perfil');
      }

      // Determinar el contexto de la acción
      const comeFromProfile = search?.from === 'profile';
      const comeFromOnboarding = search?.from === 'onboarding';
      const wasNewUser = isNewUser || comeFromOnboarding;

      notifications.show({
        title: '🎉 ¡Perfil completado!',
        message: wasNewUser ? 'Bienvenido a Cupo. Tu perfil está listo.' : 'Tu perfil ha sido actualizado exitosamente',
        color: 'green',
      });

      // ✅ ACTUALIZAR CONTEXTO: Limpiar cache y refrescar contexto completamente
      console.log('🧹 Clearing cache and refreshing context after profile completion...');
      try {
        const cacheCleared = await clearCacheAndRefresh();
        if (cacheCleared) {
          console.log('✅ Cache cleared and context refreshed successfully');
        } else {
          console.warn('⚠️ Cache clear had issues, trying fallback refresh');
          await refreshUser(true); // Fallback
        }
      } catch (refreshError) {
        console.error('⚠️ Could not refresh context after profile completion:', refreshError);
        // Intentar fallback simple
        try {
          await refreshUser(true);
          console.log('✅ Fallback refresh successful');
        } catch (fallbackError) {
          console.error('❌ Even fallback refresh failed:', fallbackError);
        }
      }
      
      console.log('🔄 Profile completion context:', {
        isEditing,
        comeFromProfile,
        comeFromOnboarding,
        isNewUser,
        wasNewUser,
        searchFrom: search?.from,
        userType: values.user_type,
        searchObject: search
      });

      // ✅ LÓGICA DE REDIRECCIÓN MEJORADA
      if (comeFromProfile) {
        // Caso 1: Usuario editando perfil desde la sección de perfil
        console.log('✅ PROFILE UPDATE: Redirecting back to /Perfil');
        navigate({ to: '/Perfil' });
      } else if (wasNewUser) {
        // Caso 2: Nuevo usuario completando perfil (con o sin onboarding)
        // ✅ MARCAR COMO EXPERIMENTADO ANTES DE REDIRIGIR
        markUserAsExperienced();
        console.log('🎯 New user completed profile, marking as experienced');
        
        // ✅ LIMPIAR FLAGS DE NUEVO USUARIO
        localStorage.removeItem('is_new_user');
        console.log('🧹 Cleared new user flags');
        
        // Añadir un pequeño delay para asegurar que el contexto se actualice
        setTimeout(() => {
          const destination = values.user_type === 'DRIVER' ? '/RegistrarVehiculo' : '/home';
          console.log('✅ NEW USER JOURNEY COMPLETE: Redirecting to:', destination);
          navigate({ to: destination });
        }, 150); // Aumentamos el delay ligeramente
      } else if (isEditing) {
        // Caso 3: Usuario editando perfil existente
        console.log('✅ EDITING MODE: Redirecting to /Perfil');
        navigate({ to: '/Perfil' });
      } else {
        // Caso 4: Fallback para otros casos
        const destination = values.user_type === 'DRIVER' ? '/RegistrarVehiculo' : '/home';
        console.log('✅ GENERAL CASE: Redirecting to:', destination);
        navigate({ to: destination });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      
      // Mostrar mensaje más descriptivo para ayudar a diagnosticar el problema
      const errorMessage = err.message || 'Error al guardar';
      const additionalInfo = err.cause ? ` (${err.cause})` : '';
      
      notifications.show({
        title: 'Error al actualizar perfil',
        message: `${errorMessage}${additionalInfo}. Por favor, intenta nuevamente.`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={styles.container}>
      <LoadingOverlay visible={initialLoading || loading} />

      <Paper className={styles.formWrapper}>
        <UnstyledButton
          onClick={() => {
            const comeFromProfile = search?.from === 'profile';
            console.log('🔙 Back button clicked:', { comeFromProfile, isEditing, searchFrom: search?.from });
            
            if (comeFromProfile) {
              console.log('🔙 Returning to /Perfil from profile update');
              navigate({ to: '/Perfil' });
            } else if (isEditing) {
              console.log('🔙 Returning to /Perfil from editing');
              navigate({ to: '/Perfil' });
            } else {
              console.log('🔙 Using browser back');
              window.history.back();
            }
          }}
          className={styles.backButton}
          aria-label="Volver"
        >
          <ArrowLeft size={24} />
        </UnstyledButton>

        <Box className={styles.header}>
          <div className={styles.avatarContainer}>
            <Image
              src={
                previewUrl ||
                'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'
              }
              alt=""
              className={styles.previewImage}
            />
            <label className={styles.uploadOverlay} htmlFor="photo-upload">
              <Camera size={18} color="#000" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.photoInput}
            />
          </div>

          <Text className={styles.title}>{isEditing ? 'Actualizar perfil' : 'Completa tu perfil'}</Text>
          <Text className={styles.subtitle}>
            {isEditing ? 'Edita tu información' : 'Registra tu información personal'}
          </Text>
        </Box>

        <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
          <TextInput label="Correo electrónico" disabled {...form.getInputProps('email')} />
          <TextInput label="Nombre" required {...form.getInputProps('first_name')} />
          <TextInput label="Apellidos" required {...form.getInputProps('last_name')} />
          <Select
            label="Tipo de identificación"
            data={[
              { value: 'CC', label: 'Cédula de Ciudadanía' },
              { value: 'CE', label: 'Cédula de Extranjería' },
              { value: 'PAS', label: 'Pasaporte' },
            ]}
            required
            {...form.getInputProps('identification_type')}
          />
          <TextInput label="Número de identificación" required {...form.getInputProps('identification_number')} />
          <div className={styles.phoneInputContainer}>
            <label className={styles.label} htmlFor="phone_number">
              Teléfono
            </label>
            <PhoneInput
              country="co"
              preferredCountries={['co', 'mx', 'us', 'es']}
              enableSearch={true}
              value={form.values.phone_number}
              onChange={(value: string) => form.setFieldValue('phone_number', value)}
              inputProps={{
                name: 'phone_number',
                id: 'phone_number',
                required: true,
                autoComplete: 'tel',
                className: 'form-control', // para que el CSS lo tome
              }}
              containerClass={styles.phoneInputInner}
              buttonClass={styles.phoneInputButton}
            />
            {form.errors.phone_number && (
              <Text color="red" size="xs" mt={5}>
                {form.errors.phone_number}
              </Text>
            )}
          </div>
          <Select
            label="Tipo de usuario"
            data={[
              { value: 'PASSENGER', label: 'Pasajero' },
              { value: 'DRIVER', label: 'Conductor' },
            ]}
            required
            {...form.getInputProps('user_type')}
          />

          <Button type="submit" fullWidth mt="md" className={styles.submitButton}>
            {isEditing ? 'Actualizar información' : 'Guardar información'}
          </Button>
        </form>
      </Paper>

      {/* Modal de Onboarding para nuevos usuarios */}
      <Modal
        opened={showOnboarding}
        onClose={() => {
          console.log('🚀 Onboarding modal closed by user');
          setShowOnboarding(false);
          // No marcar como experimentado aquí - solo cerrar el modal
          // Se marcará cuando complete el perfil
        }}
        size="xl"
        centered
        withCloseButton={false}
        trapFocus
        lockScroll
        closeOnClickOutside={false}
        closeOnEscape={true}
        style={{
          background: 'transparent',
        }}
        styles={{
          content: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #00ff9d',
            borderRadius: '16px',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }
        }}
      >
        <OnboardingWelcome 
          onContinue={() => {
            console.log('🚀 Onboarding continue button clicked - closing modal');
            setShowOnboarding(false);
            // Enfocar en el primer campo del formulario
            setTimeout(() => {
              const firstInput = document.querySelector('input[name="first_name"]') as HTMLInputElement;
              if (firstInput) {
                firstInput.focus();
              }
            }, 300);
          }}
        />
      </Modal>
    </Container>
  );
};

export const Route = createFileRoute('/CompletarRegistro/')({
  component: CompleteProfileView,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      from: (search.from as string) || '',
    };
  },
});