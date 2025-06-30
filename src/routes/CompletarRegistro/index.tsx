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
} from '@mantine/core';
import { ArrowLeft, Camera } from 'lucide-react';
import { useForm } from '@mantine/form';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/lib/supabaseClient';
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
  file?: File;
}

const CompleteProfileView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

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
      file: undefined,
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate({ to: '/Login' });

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsEditing(true);
          setPreviewUrl(profile.photo_user || null);
          form.setValues({
            id: profile.id,
            email: user.email || '',
            phone_number: profile.phone_number || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            identification_type: profile.identification_type || 'CC',
            identification_number: profile.identification_number || '',
            user_type: profile.status || 'PASSENGER',
            photo_user: profile.photo_user || null,
          });
        } else {
          form.setValues({
            ...form.values,
            email: user.email || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    form.setFieldValue('file', file);
  };

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

  const handleSubmit = async (values: ProfileFormData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let photoUrl = values.photo_user || null;

      if (values.file) {
        const uploadedUrl = await uploadPhoto(values.file, user.id);
        if (uploadedUrl) photoUrl = uploadedUrl;
      }

      const dataToSave = {
        user_id: user.id,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        identification_type: values.identification_type,
        identification_number: values.identification_number.trim(),
        status: values.user_type,
        Verification: 'SIN VERIFICAR',
        photo_user: photoUrl,
      };

      const result = isEditing
        ? await supabase.from('user_profiles').update(dataToSave).eq('user_id', user.id)
        : await supabase.from('user_profiles').insert([dataToSave]);

      if (result.error) throw result.error;

      notifications.show({
        title: 'Perfil guardado',
        message: 'Tu perfil ha sido actualizado exitosamente',
        color: 'green',
      });

      navigate({ to: values.user_type === 'DRIVER' ? '/RegistrarVehiculo' : '/home' });
    } catch (err: any) {
      console.error('Save error:', err);
      notifications.show({
        title: 'Error',
        message: err.message || 'Error al guardar',
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
            if (isEditing) {
              navigate({ to: '/Perfil' });
            } else {
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
    </Container>
  );
};

export const Route = createFileRoute('/CompletarRegistro/')({
  component: CompleteProfileView,
});