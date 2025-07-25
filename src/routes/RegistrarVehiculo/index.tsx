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
import { 
    getMyVehicle, 
    registerVehicle, 
    uploadVehiclePhoto,
    deleteVehiclePhoto,
    fileToBase64,
    type VehicleFormData as BackendVehicleFormData,
    validatePlate
} from '@/services/vehicles';
import { getCurrentUserProfile } from '@/services/profile';
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
    user_id: string;
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    body_type: string;
    engine_number: string;
    chassis_number: string;
    vin_number: string;
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
                console.log('Loading user data using backend services');

                const profile = await fetchUserProfile();

                if (!profile) {
                    console.warn('No user profile found. Redirecting to /Login');
                    navigate({ to: '/Login' });
                    return;
                }

                const vehicle = await fetchVehicleData();

                if (vehicle) {
                    console.log('Vehicle data fetched successfully:', vehicle);
                    setHasVehicle(true);
                    setViewMode(true);
                    setFormData({
                        id: vehicle.id,
                        user_id: profile.user_id,
                        brand: vehicle.brand,
                        model: vehicle.model,
                        year: vehicle.year.toString(),
                        plate: vehicle.plate,
                        color: vehicle.color,
                        body_type: vehicle.body_type,
                        engine_number: vehicle.engine_number,
                        chassis_number: vehicle.chassis_number,
                        vin_number: vehicle.vin_number,
                        photoUrl: vehicle.photo_url || null
                    });
                } else {
                    console.log('No vehicle data found for user.');
                    setHasVehicle(false);
                    setViewMode(false);
                    setFormData(prev => ({ ...prev, user_id: profile.user_id }));
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

    const fetchUserProfile = async (): Promise<UserProfile | null> => {
        try {
            const profileResponse = await getCurrentUserProfile();
            
            if (!profileResponse.success || !profileResponse.data) {
                console.warn("Error fetching user profile:", profileResponse.error);
                return null;
            }

            const profile = profileResponse.data;
            return {
                id: Number(profile.id),
                user_id: profile.user_id,
                first_name: profile.first_name || (profile.user_id && typeof profile.user_id === 'string' ? profile.user_id.split('@')[0] : 'Usuario'),
                last_name: profile.last_name || ''
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const fetchVehicleData = async (): Promise<VehicleData | null> => {
        try {
            console.log('Attempting to fetch vehicle data using backend service');
            const vehicleResponse = await getMyVehicle();

            if (!vehicleResponse.success || !vehicleResponse.vehicle) {
                console.log('No vehicle data found or error:', vehicleResponse.error);
                return null;
            }

            const vehicle = vehicleResponse.vehicle;
            console.log('Vehicle data response:', vehicle);

            return {
                id: vehicle.id,
                user_id: vehicle.user_id,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                plate: vehicle.plate,
                color: vehicle.color,
                body_type: vehicle.body_type,
                engine_number: vehicle.engine_number,
                chassis_number: vehicle.chassis_number,
                vin_number: vehicle.vin_number,
                photo_url: vehicle.photo_url
            };
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

        if (formData.plate && !validatePlate(formData.plate)) {
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
      
        const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      
        if (!allowedTypes.includes(file.type)) {
          setError('Formato no soportado. Usa JPG, PNG o HEIC.');
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
          setError('');
          
          // Mostrar notificación de éxito
          notifications.show({
            title: 'Foto cargada',
            message: 'La foto se ha cargado correctamente. Recuerda guardar los cambios.',
            color: 'blue',
            autoClose: 3000,
          });
        };
      
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = async () => {
        if (viewMode) return;

        // Si es una foto nueva (no guardada), solo eliminarla del estado
        if (formData.photo && !hasVehicle) {
            setFormData(prev => ({ ...prev, photo: null, photoUrl: null }));
            notifications.show({
                title: 'Foto eliminada',
                message: 'La foto ha sido eliminada.',
                color: 'orange',
                autoClose: 3000,
            });
            return;
        }

        // Si es una foto existente guardada en el servidor
        if (hasVehicle && formData.id) {
            try {
                const response = await deleteVehiclePhoto(formData.id);
                if (response.success) {
                    setFormData(prev => ({ ...prev, photo: null, photoUrl: null }));
                    notifications.show({
                        title: 'Foto eliminada',
                        message: 'La foto ha sido eliminada del servidor.',
                        color: 'green',
                        autoClose: 3000,
                    });
                } else {
                    setError('Error al eliminar la foto del servidor');
                }
            } catch (error) {
                console.error('Error deleting photo:', error);
                setError('Error al eliminar la foto');
            }
        } else {
            // Foto local no guardada
            setFormData(prev => ({ ...prev, photo: null, photoUrl: null }));
            notifications.show({
                title: 'Foto eliminada',
                message: 'La foto ha sido eliminada.',
                color: 'orange',
                autoClose: 3000,
            });
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
            
            const vehicleData: BackendVehicleFormData = {
                brand: formData.brand.trim(),
                model: formData.model.trim(),
                year: formData.year,
                plate: formData.plate.trim().toUpperCase(),
                color: formData.color,
                body_type: formData.body_type,
                engine_number: formData.engine_number.trim(),
                chassis_number: formData.chassis_number.trim(),
                vin_number: formData.vin_number.trim(),
                photo_url: formData.photoUrl,
            };

            const response = await registerVehicle(vehicleData);

            if (!response.success) {
                console.error("Registration error:", response.error);
                setError(`Error al procesar vehículo: ${response.error}`);
                return;
            }

            let vehiclePhotoUrl = formData.photoUrl;

            // Si hay una foto nueva y el vehículo se registró correctamente, subirla
            if (response.vehicle && formData.photo) {
                try {
                    notifications.show({
                        title: 'Subiendo foto...',
                        message: 'Por favor espera mientras se sube la foto del vehículo.',
                        color: 'blue',
                        autoClose: false,
                        id: 'photo-upload',
                    });

                    const photoBase64 = await fileToBase64(formData.photo);
                    const photoResponse = await uploadVehiclePhoto(
                        response.vehicle.id,
                        photoBase64,
                        formData.photo.name
                    );
                    
                    // Cerrar notificación de carga
                    notifications.hide('photo-upload');
                    
                    if (photoResponse.success) {
                        vehiclePhotoUrl = photoResponse.photo_url || vehiclePhotoUrl;
                        notifications.show({
                            title: 'Foto subida',
                            message: 'La foto del vehículo se ha subido correctamente.',
                            color: 'green',
                            autoClose: 3000,
                        });
                    } else {
                        console.warn('Photo upload failed:', photoResponse.error);
                        notifications.show({
                            title: 'Error al subir foto',
                            message: photoResponse.error || 'No se pudo subir la foto',
                            color: 'orange',
                            autoClose: 5000,
                        });
                    }
                } catch (photoError) {
                    notifications.hide('photo-upload');
                    console.warn('Error uploading photo:', photoError);
                    notifications.show({
                        title: 'Error al subir foto',
                        message: 'Hubo un problema al subir la foto, pero el vehículo se guardó correctamente.',
                        color: 'orange',
                        autoClose: 5000,
                    });
                }
            }
            
            showSuccessNotification(response.message || 'Vehículo procesado correctamente');

            // Recargar los datos después de guardar
            const updatedVehicle = await fetchVehicleData();
            if (updatedVehicle) {
                setFormData(prev => ({
                    ...prev,
                    id: updatedVehicle.id,
                    user_id: updatedVehicle.user_id,
                    brand: updatedVehicle.brand,
                    model: updatedVehicle.model,
                    year: updatedVehicle.year.toString(),
                    plate: updatedVehicle.plate,
                    color: updatedVehicle.color,
                    body_type: updatedVehicle.body_type,
                    engine_number: updatedVehicle.engine_number,
                    chassis_number: updatedVehicle.chassis_number,
                    vin_number: updatedVehicle.vin_number,
                    photoUrl: vehiclePhotoUrl,
                    photo: null // Limpiar el archivo después de subirlo
                }));
                setHasVehicle(true);
                setViewMode(true);
            }

            navigate({ to: '/Perfil' });

        } catch (err: any) {
            console.error('Error processing vehicle:', err);
            setError(`Error saving vehicle data: ${err.message || "An error occurred"}`);
            notifications.show({
                title: 'Error',
                message: `Error al procesar el vehículo: ${err.message}`,
                color: 'red',
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentClick = () => {
        navigate({ to: '/RegistrarVehiculo/DocumentsRequired' });
    };

    return (
        <Container fluid className={styles.container}>
            <LoadingOverlay visible={initialLoading} />

            <div className={styles.header}>
                <UnstyledButton onClick={() => navigate({ to: '/Perfil' })} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </UnstyledButton>
                <Text className={styles.headerTitle}>
                    {hasVehicle ? 'Mi Vehículo' : 'Registrar Vehículo'}
                </Text>
            </div>

            {error && (
                <div className={styles.errorContainer}>
                    <AlertCircle size={20} />
                    <Text size="sm" color="red">{error}</Text>
                </div>
            )}

            <Paper className={styles.formContainer}>
                <Group justify="space-between" className={styles.formHeader}>
                    <Text size="lg" fw={600}>Información del Vehículo</Text>
                    {hasVehicle && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(!viewMode)}
                        >
                            {viewMode ? 'Editar' : 'Cancelar'}
                        </Button>
                    )}
                </Group>

                <div className={styles.formGrid}>
                    <TextInput
                        label="Marca"
                        placeholder="Ej: Toyota, Chevrolet"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        error={errors.brand}
                        disabled={viewMode}
                        required
                    />

                    <TextInput
                        label="Modelo"
                        placeholder="Ej: Corolla, Spark"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        error={errors.model}
                        disabled={viewMode}
                        required
                    />

                    <Select
                        label="Año"
                        placeholder="Seleccionar año"
                        data={YEARS}
                        value={formData.year}
                        onChange={(value) => handleInputChange('year', value || '')}
                        error={errors.year}
                        disabled={viewMode}
                        required
                    />

                    <TextInput
                        label="Placa"
                        placeholder="ABC123"
                        value={formData.plate}
                        onChange={(e) => handleInputChange('plate', e.target.value.toUpperCase())}
                        error={errors.plate}
                        disabled={viewMode}
                        required
                    />

                    <Select
                        label="Color"
                        placeholder="Seleccionar color"
                        data={COLORS}
                        value={formData.color}
                        onChange={(value) => handleInputChange('color', value || '')}
                        error={errors.color}
                        disabled={viewMode}
                        required
                    />

                    <Select
                        label="Tipo de vehículo"
                        placeholder="Seleccionar tipo"
                        data={BODY_TYPES}
                        value={formData.body_type}
                        onChange={(value) => handleInputChange('body_type', value || '')}
                        error={errors.body_type}
                        disabled={viewMode}
                        required
                    />

                    <TextInput
                        label="Número de motor"
                        placeholder="Número de motor"
                        value={formData.engine_number}
                        onChange={(e) => handleInputChange('engine_number', e.target.value)}
                        error={errors.engine_number}
                        disabled={viewMode}
                        required
                    />

                    <TextInput
                        label="Número de chasis"
                        placeholder="Número de chasis"
                        value={formData.chassis_number}
                        onChange={(e) => handleInputChange('chassis_number', e.target.value)}
                        error={errors.chassis_number}
                        disabled={viewMode}
                        required
                    />

                    <TextInput
                        label="Número VIN"
                        placeholder="Número VIN"
                        value={formData.vin_number}
                        onChange={(e) => handleInputChange('vin_number', e.target.value)}
                        error={errors.vin_number}
                        disabled={viewMode}
                        required
                    />
                </div>

                <Box className={styles.photoSection}>
                    <Text size="sm" fw={500} mb="xs">
                        Foto del vehículo
                        {formData.photo && !viewMode && (
                            <Text span size="xs" color="orange" ml={8}>
                                (Foto nueva - Recuerda guardar)
                            </Text>
                        )}
                    </Text>
                    <div className={styles.photoUpload}>
                        {formData.photoUrl ? (
                            <div className={styles.photoContainer}>
                                <img 
                                    src={formData.photoUrl} 
                                    alt="Vehículo" 
                                    className={styles.photoPreview}
                                />
                                {!viewMode && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        onClick={handleRemovePhoto}
                                        className={styles.removePhotoButton}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className={styles.photoPlaceholder}>
                                <Camera size={40} />
                                <Text size="sm" color="dimmed">Sin foto</Text>
                            </div>
                        )}
                        {!viewMode && (
                            <div className={styles.photoUploadControls}>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/heic"
                                    onChange={handlePhotoUpload}
                                    className={styles.photoInput}
                                    id="photo-upload"
                                />
                                <Button
                                    component="label"
                                    htmlFor="photo-upload"
                                    variant="outline"
                                    leftSection={<Camera size={16} />}
                                    size="sm"
                                    className={styles.uploadButton}
                                >
                                    {formData.photoUrl ? 'Cambiar foto' : 'Subir foto'}
                                </Button>
                            </div>
                        )}
                    </div>
                </Box>

                {!viewMode && (
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        loading={loading}
                        className={styles.submitButton}
                    >
                        {hasVehicle ? 'Actualizar Vehículo' : 'Registrar Vehículo'}
                    </Button>
                )}

                {hasVehicle && (
                    <Button
                        fullWidth
                        variant="outline"
                        leftSection={<FileText size={20} />}
                        onClick={handleDocumentClick}
                        className={styles.documentsButton}
                    >
                        Gestionar Documentos
                    </Button>
                )}
            </Paper>
        </Container>
    );
};

export const Route = createFileRoute('/RegistrarVehiculo/')({
    component: VehicleRegistration,
});

export default VehicleRegistration;
