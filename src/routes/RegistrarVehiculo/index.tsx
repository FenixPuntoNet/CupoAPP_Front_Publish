import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import {
    ArrowLeft,
    Camera,
    AlertCircle,
    FileText,
    CheckCircle,
} from 'lucide-react';
import {
    Container,
    LoadingOverlay,
    Paper,
    Group,
    TextInput,
    Select,
    Button,
    Text,
    Box,
    UnstyledButton,
} from '@mantine/core';
import { supabase } from '@/lib/supabaseClient';
import styles from './index.module.css';
import { notifications } from '@mantine/notifications';

interface VehicleFormData {
    id?: number;
    user_id: string;
    brand: string;
    model: string;
    year: string;
    plate: string;
    color: string;
    body_type: string;
    engine_number: string;
    chassis_number: string;
    vin_number: string;
    photo?: File | null;
    photoUrl?: string | null;
}

interface UserProfile {
    id: number;
    user_id: string;
    first_name?: string;
    last_name?: string;
}

interface ValidationErrors {
    [key: string]: string;
}

interface VehicleData {
    id: number;
    user_id: string | null;
    brand: string | null;
    model: string | null;
    year: number | null;
    plate: string | null;
    color: string | null;
    body_type: string | null;
    engine_number: string | null;
    chassis_number: string | null;
    vin_number: string | null;
    photo_url?: string | null;
}

const COLORS = [
    { value: 'Blanco', label: 'Blanco' },
    { value: 'Negro', label: 'Negro' },
    { value: 'Gris', label: 'Gris' },
    { value: 'Rojo', label: 'Rojo' },
    { value: 'Azul', label: 'Azul' },
    { value: 'Verde', label: 'Verde' },
    { value: 'Amarillo', label: 'Amarillo' },
    { value: 'Plata', label: 'Plata' },
];

const BODY_TYPES = [
    { value: 'Automovil', label: 'Automóvil' },
    { value: 'Camioneta', label: 'Camioneta' },
    { value : 'SUV', label: 'SUV' },
    { value: 'Van', label: 'Van' },
    { value: 'Pickup', label: 'Pick-up' },
];

const YEARS = Array.from(
    { length: 25 },
    (_, i) => {
        const year = (new Date().getFullYear() - i).toString();
        return { value: year, label: year };
    }
);

const VehicleRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState(true);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState<VehicleFormData>({
        user_id: '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        color: '',
        body_type: '',
        engine_number: '',
        chassis_number: '',
        vin_number: '',
        photo: null,
        photoUrl: null
    });

    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const loadData = async () => {
            setInitialLoading(true);
            setError("");

            try {
                const { data: { session } } = await supabase.auth.getSession();

                console.log('Full session object:', session); // ADD THIS

                if (!session?.user?.id) {
                    console.warn('No user ID found in session. Redirecting to /Login'); // ADD THIS
                    navigate({ to: '/Login' });
                    return;
                }

                const userId = session.user.id;
                console.log('User ID from session:', userId); // ADD THIS

                const profile = await fetchUserProfile(userId);
                setUserProfile(profile);

                const vehicle = await fetchVehicleData(userId);

                if (vehicle) {
                    console.log('Vehicle data fetched successfully:', vehicle); // ADD THIS
                    setHasVehicle(true);
                    setViewMode(true);
                    setFormData({
                        id: vehicle.id,
                        user_id: userId,
                        brand: vehicle.brand || '',
                        model: vehicle.model || '',
                        year: vehicle.year ? vehicle.year.toString() : '',
                        plate: vehicle.plate || '',
                        color: vehicle.color || '',
                        body_type: vehicle.body_type || '',
                        engine_number: vehicle.engine_number || '',
                        chassis_number: vehicle.chassis_number || '',
                        vin_number: vehicle.vin_number || '',
                        photoUrl: vehicle.photo_url || null
                    });
                } else {
                    console.log('No vehicle data found for user.');  // ADD THIS
                    setHasVehicle(false);
                    setViewMode(false);
                    setFormData(prev => ({ ...prev, user_id: userId }));
                }

            } catch (err: any) {
                console.error("Error during data loading:", err);
                setError(`Failed to load data: ${err.message}`);
            } finally {
                setInitialLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.warn("Error fetching user profile:", error);
                return null;
            }

            return data || null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const fetchVehicleData = async (userId: string): Promise<VehicleData | null> => {
        try {
            console.log('Attempting to fetch vehicle data for user ID:', userId); // ADD THIS
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle(); // Use maybeSingle

            if (error) {
                console.error("Error fetching vehicle data:", error);
                setError(`Error loading vehicle information: ${error.message}`);
                return null;
            }

            console.log('Vehicle data response:', data); // ADD THIS

            return data || null;
        } catch (error: any) {
            console.error('Error fetching vehicle data:', error);
            setError(`Error loading vehicle information: ${error.message}`);
            return null;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!formData.brand.trim()) newErrors.brand = 'La marca es requerida';
        if (!formData.model.trim()) newErrors.model = 'El modelo es requerido';
        if (!formData.year) newErrors.year = 'El año es requerido';
        if (!formData.plate.trim()) newErrors.plate = 'La placa es requerida';
        if (!formData.color) newErrors.color = 'El color es requerido';
        if (!formData.body_type) newErrors.body_type = 'El tipo de vehículo es requerido';
        if (!formData.engine_number.trim()) newErrors.engine_number = 'El número de motor es requerido';
        if (!formData.chassis_number.trim()) newErrors.chassis_number = 'El número de chasis es requerido';
        if (!formData.vin_number.trim()) newErrors.vin_number = 'El número VIN es requerido';

        const plateRegex = /^[A-Z]{3}\d{3}$/;
        if (!plateRegex.test(formData.plate.toUpperCase())) {
            newErrors.plate = 'Formato de placa inválido (ejemplo: ABC123)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (name: string, value: string) => {
        if (viewMode) return;

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (viewMode) return;
      
        const file = e.target.files?.[0];
        if (!file) return;
      
        const allowedTypes = ['image/jpeg', 'image/png'];
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      
        if (!allowedTypes.includes(file.type)) {
          setError('Formato no soportado. Usa JPG o PNG.');
          return;
        }
      
        if (file.size > maxSizeInBytes) {
          setError('La imagen no puede superar los 5MB.');
          return;
        }
      
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            photo: file,
            photoUrl: reader.result as string,
          }));
          setError(''); // Limpiar errores si todo sale bien
        };
      
        reader.readAsDataURL(file);
    };
      
    const uploadVehiclePhoto = async (file: File): Promise<string | null> => {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const userId = formData.user_id;
          const filePath = `VehiclesDocuments/${userId}/${fileName}`;
      
          const { error: uploadError } = await supabase.storage
            .from('Resources')
            .upload(filePath, file, { upsert: true });
      
          if (uploadError) {
            throw uploadError;
          }
      
          const { data } = supabase.storage.from('Resources').getPublicUrl(filePath);
          return data.publicUrl;
        } catch (error) {
          console.error('Error uploading photo:', error);
          setError(`Error al subir la foto: ${error}`);
          return null;
        }
    };      

    const showSuccessNotification = (message: string) => {
        notifications.show({
            title: 'Operación exitosa',
            message,
            color: 'green',
            icon: <CheckCircle size={20} />,
            className: styles.successNotification,
            autoClose: 3000,
        });
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setError("Por favor, complete todos los campos requeridos correctamente");
            return;
        }

        try {
            setLoading(true);
            setError("");

            let photoUrl: string | null = null;

            if (formData.photo) {
                const uploadedUrl = await uploadVehiclePhoto(formData.photo);
                if (uploadedUrl) {
                    photoUrl = uploadedUrl; // solo URL pública real del Storage
                }
            } else if (formData.photoUrl && formData.photoUrl.startsWith('http')) {
                // Si ya existía una URL previa válida
                photoUrl = formData.photoUrl;
            }
            

            const vehicleData = {
                user_id: formData.user_id,
                brand: formData.brand.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                plate: formData.plate.trim().toUpperCase(),
                color: formData.color,
                body_type: formData.body_type,
                engine_number: formData.engine_number.trim(),
                chassis_number: formData.chassis_number.trim(),
                vin_number: formData.vin_number.trim(),
                photo_url: photoUrl,
            };

            if (hasVehicle && formData.id) {
                const { error: updateError } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', formData.id);

                if (updateError) {
                    console.error("Update error:", updateError);
                    setError(`Error updating vehicle: ${updateError.message}`);
                    throw updateError;
                }
                
                showSuccessNotification('Información del vehículo actualizada correctamente');
                setViewMode(true);
            } else {
                const { data: existingVehicle, error: existingVehicleError } = await supabase
                    .from('vehicles')
                    .select('id')
                    .eq('user_id', formData.user_id)
                    .maybeSingle();

                if (existingVehicleError) {
                    console.error("Error checking for existing vehicle:", existingVehicleError);
                    setError("Error al verificar si ya existe un vehículo registrado.");
                    setLoading(false);
                    return;
                }

                if (existingVehicle) {
                    setError("Ya tienes un vehículo registrado. Para modificarlo, edita la información existente.");
                    setLoading(false);
                    return;
                }

                const { error: insertError } = await supabase
                    .from('vehicles')
                    .insert([vehicleData]);

                if (insertError) {
                    console.error("Insert error:", insertError);
                    setError(`Error inserting vehicle: ${insertError.message}`);
                    throw insertError;
                }
                
                showSuccessNotification('Vehículo registrado correctamente');
            }

            // Recargar los datos después de guardar
            const updatedVehicle = await fetchVehicleData(formData.user_id);
            if (updatedVehicle) {
                setFormData(prev => ({
                    ...prev,
                    id: updatedVehicle.id,
                    user_id: updatedVehicle.user_id || '',
                    brand: updatedVehicle.brand || '',
                    model: updatedVehicle.model || '',
                    year: updatedVehicle.year?.toString() || '',
                    plate: updatedVehicle.plate || '',
                    color: updatedVehicle.color || '',
                    body_type: updatedVehicle.body_type || '',
                    engine_number: updatedVehicle.engine_number || '',
                    chassis_number: updatedVehicle.chassis_number || '',
                    vin_number: updatedVehicle.vin_number || '',
                    photoUrl: updatedVehicle.photo_url || null
                }));
            }

            navigate({ to: '/Perfil' });

        } catch (err: any) {
            console.error('Error processing vehicle:', err);
            setError(`Error saving vehicle data: ${err.message || "An error occurred"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate({ to: '/Perfil' });
    };

    const toggleViewMode = () => {
        setViewMode(!viewMode);
    };

    const renderFormField = (
        label: string,
        name: keyof VehicleFormData,
        type: 'text' | 'select' = 'text',
        options?: { value: string; label: string }[]
    ) => {
        const value = formData[name]?.toString() || '';
        const fieldError = errors[name];

        return (
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    <FileText size={16} className={styles.labelIcon} />
                    {label}
                </label>
                {type === 'select' ? (
                    <Select
                        data={options || []}
                        value={value}
                        onChange={(newValue) => handleInputChange(name, newValue || '')}
                        disabled={viewMode}
                        error={fieldError}
                        className={viewMode ? styles.viewModeInput : ''}
                    />
                ) : (
                    <TextInput
                        value={value}
                        onChange={(e) => handleInputChange(name, e.currentTarget.value)}
                        disabled={viewMode}
                        error={fieldError}
                        className={viewMode ? styles.viewModeInput : ''}
                    />
                )}
            </div>
        );
    };

    if (initialLoading) {
        return (
            <Container className={styles.container}>
                <LoadingOverlay visible={true} />
            </Container>
        );
    }

    return (
        <Container className={styles.container}>
            <div className={styles.gradientBackground} />
            <LoadingOverlay visible={loading} />

            <Group justify="flex-start" mb="xl">
                <UnstyledButton onClick={handleBack} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </UnstyledButton>
            </Group>

            <Paper className={styles.formWrapper}>
                <Box className={styles.header}>
                    <div style={{height: '10px'}} />
                    <Group gap="apart" align="center">
                        <Text className={styles.title}>
                            {hasVehicle ? 'Información del Vehículo' : 'Registrar Vehículo'}
                        </Text>
                        {hasVehicle && (
                            <Button
                                onClick={() => setViewMode(!viewMode)}
                                variant="light"
                            >
                                {viewMode ? 'Editar' : 'Cancelar Edición'}
                            </Button>
                        )}
                    </Group>
                    <Text className={styles.subtitle}>
                        {hasVehicle
                            ? 'Esta es la información registrada de tu vehículo'
                            : 'Ingresa los datos de tu vehículo'
                        }
                    </Text>
                </Box>
                {userProfile && (
                    <Box>
                        <Text>Bienvenido, {userProfile.first_name || 'Usuario'}</Text>
                    </Box>
                )}

                <form className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <Camera size={16} className={styles.labelIcon} />
                            Foto del vehículo
                        </label>
                        <div className={styles.photoSection}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                id="vehicle-photo"
                                className={styles.hiddenInput}
                                disabled={viewMode}
                            />
                            <label
                                htmlFor="vehicle-photo"
                                className={`${styles.photoUpload} ${viewMode ? styles.disabled : ''}`}
                            >
                                {formData.photoUrl ? (
                                    <div className={styles.photoPreview}>
                                        <img
                                            src={formData.photoUrl}
                                            alt="Vehículo"
                                            className={styles.previewImage}
                                        />
                                        {!viewMode && (
                                            <div className={styles.photoOverlay}>
                                                <Camera size={24} />
                                                <span>Cambiar foto</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.photoPlaceholder}>
                                        <Camera size={32} />
                                        <span>Agregar foto del vehículo</span>
                                    </div>
                                )}
                            </label>
                            {errors.photo && (
                                <Text size="sm" color="red" mt="xs">
                                    {errors.photo}
                                </Text>
                            )}
                        </div>
                    </div>

                    {renderFormField('Marca', 'brand')}
                    {renderFormField('Modelo', 'model')}
                    {renderFormField('Año', 'year', 'select', YEARS)}
                    {renderFormField('Color', 'color', 'select', COLORS)}
                    {renderFormField('Placa', 'plate')}
                    {renderFormField('Tipo de Vehículo', 'body_type', 'select', BODY_TYPES)}
                    {renderFormField('Número de Motor', 'engine_number')}
                    {renderFormField('Número de Chasis', 'chassis_number')}
                    {renderFormField('Número VIN', 'vin_number')}

                    {error && (
                        <Text color="red" size="sm" mt="md" className={styles.errorMessage}>
                            <AlertCircle size={16} style={{ marginRight: 8 }} />
                            {error}
                        </Text>
                    )}

                    <Group justify="space-between" mt="xl" className={styles.buttonGroup}>
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className={styles.secondaryButton}
                        >
                            Regresar
                        </Button>
                        {hasVehicle && (
                            <Button onClick={toggleViewMode} className={styles.secondaryButton}>
                                {viewMode ? 'Editar' : 'Ver'}
                            </Button>
                        )}

                        <Button
                            onClick={handleSubmit}
                            loading={loading}
                            className={styles.primaryButton}
                            disabled={viewMode}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
};

export const Route = createFileRoute('/RegistrarVehiculo/')({
    component: VehicleRegistration,
});

export default VehicleRegistration;