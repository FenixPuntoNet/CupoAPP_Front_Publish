import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    Group,
    Text,
    Button,
    TextInput,
    Select,
    NumberInput,
    FileInput,
    Stepper,
    Box,
    SimpleGrid,
    LoadingOverlay,
    Progress,
    Divider,
    ActionIcon,
    Title
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { 
    Car, 
    Shield, 
    CheckCircle, 
    Camera, 
    ArrowLeft,
    X,
    IdCard,
    Sparkles
} from 'lucide-react';
import { 
    registerCompleteVehicleWithPromotion,
    getMyVehicle,
    getDriverLicense,
    getSoat
} from '../../services/vehicles';
import { apiRequest } from '../../config/api';
import styles from './index.module.css';

// Interfaces para el formulario completo (SIN property_card)
interface CompleteVehicleData {
    vehicle: {
        brand: string;
        model: string;
        year: number;
        plate: string;
        color: string;
        body_type: string;
        passenger_capacity: number;
    };
    license: {
        license_number: string;
        license_category: string;
        blood_type: string;
        expedition_date: string;
        expiration_date: string;
    };
    soat: {
        policy_number: string;
        insurance_company: string;
        validity_from: string;
        validity_to: string;
    };
}

interface VehiclePhotos {
    vehiclePhoto?: File;
    licensePhotos?: {
        front?: File;
        back?: File;
    };
    soatPhotos?: {
        front?: File;
        back?: File;
    };
}

// Datos para los selects
const VEHICLE_BRANDS = [
    'Toyota', 'Chevrolet', 'Renault', 'Nissan', 'Hyundai', 'Ford', 'Kia', 
    'Mazda', 'Volkswagen', 'Mitsubishi', 'Honda', 'Suzuki', 'Fiat', 'Otro'
];

const BODY_TYPES = [
    'Sedán', 'Hatchback', 'SUV', 'Camioneta', 'Convertible', 'Coupé', 'Van', 'Otro'
];

const COLORS = [
    'Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Plata', 'Otro'
];

const LICENSE_CATEGORIES = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const INSURANCE_COMPANIES = [
    'Seguros Bolívar', 'Seguros del Estado', 'Liberty Seguros', 'AXA Colpatria', 
    'Seguros Sura', 'Previsora Seguros', 'Mapfre Seguros', 'Otro'
];

// Tipos de archivo permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Función para validar tipo de archivo
const validateImageFile = (file: File): boolean => {
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
        file.name.toLowerCase().endsWith(ext)
    );
    return isValidType && hasValidExtension;
};

// Configuración de pasos del stepper (solo 4 pasos)
const STEPS_CONFIG = [
    {
        label: 'Vehículo',
        description: 'Información y capacidad',
        icon: Car,
        color: '#00ff9d'
    },
    {
        label: 'Licencia',
        description: 'Licencia de conducir',
        icon: IdCard,
        color: '#667eea'
    },
    {
        label: 'SOAT',
        description: 'Seguro obligatorio',
        icon: Shield,
        color: '#4facfe'
    },
    {
        label: 'Resumen',
        description: 'Confirmación final',
        icon: CheckCircle,
        color: '#51cf66'
    }
];

function VehicleRegistrationComplete() {
    const navigate = useNavigate();
    
    // Estados del stepper (solo 4 pasos)
    const [activeStep, setActiveStep] = useState(0);
    const [highestStepVisited, setHighestStepVisited] = useState(0);
    
    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [registrationProgress, setRegistrationProgress] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Estado de datos del formulario (SIN property_card)
    const [formData, setFormData] = useState<CompleteVehicleData>({
        vehicle: {
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            plate: '',
            color: '',
            body_type: '',
            passenger_capacity: 4
        },
        license: {
            license_number: '',
            license_category: '',
            blood_type: '',
            expedition_date: '',
            expiration_date: ''
        },
        soat: {
            policy_number: '',
            insurance_company: '',
            validity_from: '',
            validity_to: ''
        }
    });
    
    // Estado de fotos (SIN propertyPhotos)
    const [photos, setPhotos] = useState<VehiclePhotos>({});
    const [photoPreview, setPhotoPreview] = useState<Record<string, string>>({});
    
    // Estados de éxito
    const [isCompleted, setIsCompleted] = useState(false);
    
    // Estado para modo edición
    const [isEditMode, setIsEditMode] = useState(false);

    // useEffect para cargar datos existentes si ya hay un vehículo registrado
    useEffect(() => {
        const loadExistingData = async () => {
            try {
                setLoading(true);
                
                // Verificar si ya existe un vehículo
                const vehicleResponse = await getMyVehicle();
                if (vehicleResponse.success && vehicleResponse.vehicle) {
                    console.log('🚗 Vehículo existente encontrado:', vehicleResponse.vehicle);
                    setIsEditMode(true);
                    
                    const vehicle = vehicleResponse.vehicle;
                    // Cargar datos del vehículo en el formulario
                    setFormData(prevData => ({
                        ...prevData,
                        vehicle: {
                            brand: vehicle.brand || '',
                            model: vehicle.model || '',
                            year: vehicle.year || new Date().getFullYear(),
                            plate: vehicle.plate || '',
                            color: vehicle.color || '',
                            body_type: vehicle.body_type || '',
                            passenger_capacity: (vehicle as any).passenger_capacity || 4
                        }
                    }));
                    
                    // También cargar licencia y SOAT si existen
                    let loadedLicense = null;
                    let loadedSoat = null;
                    
                    try {
                        const [licenseResponse, soatResponse] = await Promise.all([
                            getDriverLicense(),
                            getSoat()
                        ]);
                        
                        if (licenseResponse.success && licenseResponse.license) {
                            console.log('🪪 Licencia existente encontrada:', licenseResponse.license);
                            const license = licenseResponse.license;
                            loadedLicense = license;
                            setFormData(prevData => ({
                                ...prevData,
                                license: {
                                    license_number: license.license_number || '',
                                    license_category: license.license_category || '',
                                    blood_type: license.blood_type || '',
                                    expedition_date: license.expedition_date || '',
                                    expiration_date: license.expiration_date || ''
                                }
                            }));
                        }
                        
                        if (soatResponse.success && soatResponse.soat) {
                            console.log('🛡️ SOAT existente encontrado:', soatResponse.soat);
                            const soat = soatResponse.soat;
                            loadedSoat = soat;
                            setFormData(prevData => ({
                                ...prevData,
                                soat: {
                                    policy_number: soat.policy_number || '',
                                    insurance_company: soat.insurance_company || '',
                                    validity_from: soat.validity_from || '',
                                    validity_to: soat.validity_to || ''
                                }
                            }));
                        }
                    } catch (docError) {
                        console.warn('⚠️ Error cargando documentos adicionales:', docError);
                    }

                    // Cargar imágenes existentes si están disponibles
                    await loadExistingImages(vehicle, loadedLicense, loadedSoat);
                } else {
                    console.log('🆕 No hay vehículo existente, modo registro nuevo');
                    setIsEditMode(false);
                }
            } catch (error) {
                console.error('❌ Error cargando datos existentes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadExistingData();
    }, []);

    // Función mejorada para cargar imágenes existentes
    const loadExistingImages = async (vehicle?: any, license?: any, soat?: any) => {
        try {
            console.log('🖼️ Cargando imágenes existentes...');
            
            // Cargar foto del vehículo
            if (vehicle?.photo_url) {
                try {
                    const response = await fetch(vehicle.photo_url);
                    if (response.ok) {
                        setPhotoPreview(prev => ({
                            ...prev,
                            vehiclePhoto: vehicle.photo_url
                        }));
                        console.log('✅ Foto del vehículo cargada');
                    }
                } catch (error) {
                    console.log('ℹ️ Foto del vehículo no disponible');
                }
            }

            // Cargar fotos de licencia
            if (license) {
                if (license.photo_front_url) {
                    try {
                        const response = await fetch(license.photo_front_url);
                        if (response.ok) {
                            setPhotoPreview(prev => ({
                                ...prev,
                                'licensePhotos_front': license.photo_front_url
                            }));
                            console.log('✅ Foto frontal de licencia cargada');
                        }
                    } catch (error) {
                        console.log('ℹ️ Foto frontal de licencia no disponible');
                    }
                }

                if (license.photo_back_url) {
                    try {
                        const response = await fetch(license.photo_back_url);
                        if (response.ok) {
                            setPhotoPreview(prev => ({
                                ...prev,
                                'licensePhotos_back': license.photo_back_url
                            }));
                            console.log('✅ Foto posterior de licencia cargada');
                        }
                    } catch (error) {
                        console.log('ℹ️ Foto posterior de licencia no disponible');
                    }
                }
            }

            // Cargar fotos de SOAT
            if (soat) {
                if (soat.photo_front_url) {
                    try {
                        const response = await fetch(soat.photo_front_url);
                        if (response.ok) {
                            setPhotoPreview(prev => ({
                                ...prev,
                                'soatPhotos_front': soat.photo_front_url
                            }));
                            console.log('✅ Foto frontal de SOAT cargada');
                        }
                    } catch (error) {
                        console.log('ℹ️ Foto frontal de SOAT no disponible');
                    }
                }

                if (soat.photo_back_url) {
                    try {
                        const response = await fetch(soat.photo_back_url);
                        if (response.ok) {
                            setPhotoPreview(prev => ({
                                ...prev,
                                'soatPhotos_back': soat.photo_back_url
                            }));
                            console.log('✅ Foto posterior de SOAT cargada');
                        }
                    } catch (error) {
                        console.log('ℹ️ Foto posterior de SOAT no disponible');
                    }
                }
            }

        } catch (error) {
            console.warn('⚠️ Error cargando imágenes existentes:', error);
        }
    };

    // Validaciones (solo 3 pasos: 0=Vehículo, 1=Licencia, 2=SOAT)
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        
        switch (step) {
            case 0: // Datos del vehículo
                if (!formData.vehicle.brand) newErrors.brand = 'Marca es requerida';
                if (!formData.vehicle.model) newErrors.model = 'Modelo es requerido';
                if (!formData.vehicle.year) newErrors.year = 'Año es requerido';
                if (!formData.vehicle.plate) newErrors.plate = 'Placa es requerida';
                if (!formData.vehicle.color) newErrors.color = 'Color es requerido';
                if (!formData.vehicle.body_type) newErrors.body_type = 'Tipo de carrocería es requerido';
                if (!formData.vehicle.passenger_capacity || formData.vehicle.passenger_capacity < 1) {
                    newErrors.passenger_capacity = 'Capacidad de pasajeros es requerida';
                }
                
                // Validar formato de placa
                const plateRegex = /^[A-Z]{3}\d{3}$/;
                if (formData.vehicle.plate && !plateRegex.test(formData.vehicle.plate.toUpperCase())) {
                    newErrors.plate = 'Formato de placa inválido (ej: ABC123)';
                }
                
                // Validar año
                const currentYear = new Date().getFullYear();
                if (formData.vehicle.year < 1990 || formData.vehicle.year > currentYear + 1) {
                    newErrors.year = 'Año del vehículo inválido';
                }
                break;
                
            case 1: // Licencia de conducir
                if (!formData.license.license_number) newErrors.license_number = 'Número de licencia es requerido';
                if (!formData.license.license_category) newErrors.license_category = 'Categoría es requerida';
                if (!formData.license.blood_type) newErrors.blood_type = 'Tipo de sangre es requerido';
                if (!formData.license.expedition_date) newErrors.license_expedition = 'Fecha de expedición es requerida';
                if (!formData.license.expiration_date) newErrors.license_expiration = 'Fecha de vencimiento es requerida';
                
                // Validar que la licencia no esté vencida
                if (formData.license.expiration_date) {
                    const expirationDate = new Date(formData.license.expiration_date);
                    if (expirationDate < new Date()) {
                        newErrors.license_expiration = 'La licencia está vencida';
                    }
                }
                break;
                
            case 2: // SOAT
                if (!formData.soat.policy_number) newErrors.policy_number = 'Número de póliza es requerido';
                if (!formData.soat.insurance_company) newErrors.insurance_company = 'Aseguradora es requerida';
                if (!formData.soat.validity_from) newErrors.validity_from = 'Fecha de inicio es requerida';
                if (!formData.soat.validity_to) newErrors.validity_to = 'Fecha de vencimiento es requerida';
                
                // Validar que el SOAT no esté vencido
                if (formData.soat.validity_to) {
                    const expirationDate = new Date(formData.soat.validity_to);
                    if (expirationDate < new Date()) {
                        newErrors.validity_to = 'El SOAT está vencido';
                    }
                }
                break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Funciones de navegación del stepper
    const nextStep = () => {
        if (validateStep(activeStep)) {
            const next = activeStep + 1;
            setActiveStep(next);
            setHighestStepVisited(Math.max(highestStepVisited, next));
        }
    };

    const prevStep = () => setActiveStep(Math.max(0, activeStep - 1));
    
    const goToStep = (step: number) => {
        if (step <= highestStepVisited) {
            setActiveStep(step);
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

    // Función para subir foto del vehículo
    const uploadVehiclePhoto = async (vehicleId: number, photoFile: File) => {
        try {
            const photo_base64 = (await fileToBase64(photoFile)).split(',')[1];
            return await apiRequest('/vehiculos/upload-vehicle-photo', {
                method: 'POST',
                body: JSON.stringify({
                    vehicleId,
                    photo_base64,
                    filename: photoFile.name
                }),
            });
        } catch (error) {
            console.error('❌ Error uploading vehicle photo:', error);
            throw error;
        }
    };

    // Función para subir fotos de licencia
    const uploadDriverLicensePhotos = async (licenseId: number, photos: { photo_front_base64?: string; photo_back_base64?: string }) => {
        try {
            return await apiRequest('/vehiculos/upload-license-photos', {
                method: 'POST',
                body: JSON.stringify({
                    licenseId,
                    photo_front_base64: photos.photo_front_base64,
                    photo_back_base64: photos.photo_back_base64
                }),
            });
        } catch (error) {
            console.error('❌ Error uploading license photos:', error);
            throw error;
        }
    };

    // Función para subir fotos de SOAT con mejor manejo de errores
    const uploadSoatPhotos = async (soatId: number, photos: { photo_front_base64?: string; photo_back_base64?: string }) => {
        try {
            console.log('📸 Uploading SOAT photos for soatId:', soatId);
            console.log('📸 Front photo available:', !!photos.photo_front_base64);
            console.log('📸 Back photo available:', !!photos.photo_back_base64);
            
            if (photos.photo_front_base64) {
                console.log('📸 Front photo size (base64):', photos.photo_front_base64.length, 'chars');
            }
            if (photos.photo_back_base64) {
                console.log('📸 Back photo size (base64):', photos.photo_back_base64.length, 'chars');
            }
            
            const response = await apiRequest('/vehiculos/upload-soat-photos', {
                method: 'POST',
                body: JSON.stringify({
                    soatId,
                    photo_front_base64: photos.photo_front_base64,
                    photo_back_base64: photos.photo_back_base64,
                    filename_front: 'soat_front',
                    filename_back: 'soat_back'
                }),
            });
            
            console.log('✅ SOAT photos uploaded successfully:', response);
            return response;
        } catch (error) {
            console.error('❌ Error uploading SOAT photos:', error);
            console.error('❌ SOAT upload error details:', {
                soatId,
                hasFrontPhoto: !!photos.photo_front_base64,
                hasBackPhoto: !!photos.photo_back_base64,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    };

    // Función para manejar preview de imágenes
    const handlePhotoChange = (photoType: string, file: File | null) => {
        if (file) {
            // Validar tipo de archivo
            if (!validateImageFile(file)) {
                notifications.show({
                    title: 'Tipo de archivo no válido',
                    message: 'Solo se permiten archivos JPG, JPEG y PNG',
                    color: 'red'
                });
                return;
            }

            // Validar tamaño de archivo (máximo 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB en bytes
            if (file.size > maxSize) {
                notifications.show({
                    title: 'Archivo muy grande',
                    message: 'El archivo debe ser menor a 5MB',
                    color: 'red'
                });
                return;
            }

            // Crear preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(prev => ({
                    ...prev,
                    [photoType]: e.target?.result as string
                }));
            };
            reader.readAsDataURL(file);

            // Guardar archivo
            const keys = photoType.split('_');
            if (keys.length === 1) {
                setPhotos(prev => ({ ...prev, [photoType]: file }));
            } else {
                const [category, side] = keys;
                setPhotos(prev => ({
                    ...prev,
                    [category]: { ...prev[category as keyof VehiclePhotos], [side]: file }
                }));
            }
        }
    };

    // Componente mejorado para subir fotos
    const PhotoUpload = ({ 
        label, 
        photoType, 
        isRequired = false 
    }: { 
        label: string; 
        photoType: string; 
        isRequired?: boolean; 
    }) => {
        const preview = photoPreview[photoType];
        
        return (
            <div className={styles.imageCard}>
                <div className={styles.imageCardLabel}>
                    {label} {isRequired && <span style={{ color: '#fa5252' }}>*</span>}
                </div>
                
                {preview ? (
                    <div className={styles.photoPreview}>
                        <img src={preview} alt={`Preview ${label}`} />
                        <ActionIcon
                            className={styles.removePhotoButton}
                            onClick={() => {
                                setPhotoPreview(prev => {
                                    const newPreviews = { ...prev };
                                    delete newPreviews[photoType];
                                    return newPreviews;
                                });
                                // Limpiar archivo también
                                const keys = photoType.split('_');
                                if (keys.length === 1) {
                                    setPhotos(prev => {
                                        const newPhotos = { ...prev };
                                        delete newPhotos[photoType as keyof VehiclePhotos];
                                        return newPhotos;
                                    });
                                } else {
                                    setPhotos(prev => {
                                        const newPhotos = { ...prev };
                                        if (keys[0] === 'licensePhotos' && newPhotos.licensePhotos) {
                                            delete newPhotos.licensePhotos[keys[1] as 'front' | 'back'];
                                        } else if (keys[0] === 'soatPhotos' && newPhotos.soatPhotos) {
                                            delete newPhotos.soatPhotos[keys[1] as 'front' | 'back'];
                                        }
                                        return newPhotos;
                                    });
                                }
                            }}
                        >
                            <X size={14} />
                        </ActionIcon>
                    </div>
                ) : (
                    <FileInput
                        placeholder="JPG, JPEG o PNG únicamente"
                        accept=".jpg,.jpeg,.png"
                        leftSection={<Camera size={16} />}
                        onChange={(file) => handlePhotoChange(photoType, file)}
                        classNames={{
                            input: styles.photoUploadArea
                        }}
                        styles={{
                            input: {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(0, 255, 157, 0.25)',
                                color: 'white'
                            }
                        }}
                    />
                )}
            </div>
        );
    };

    // Función principal de registro (para 3 pasos)
    const handleCompleteRegistration = async () => {
        // Validar todos los pasos (0, 1, 2)
        let allValid = true;
        for (let i = 0; i < 3; i++) {
            if (!validateStep(i)) {
                allValid = false;
                setActiveStep(i);
                break;
            }
        }

        if (!allValid) {
            notifications.show({
                title: 'Formulario incompleto',
                message: 'Por favor, completa todos los campos requeridos',
                color: 'red'
            });
            return;
        }

        setLoading(true);
        setRegistrationProgress(10);

        try {
            console.log('🚀 Iniciando registro completo...');
            
            // Paso 1: Registrar vehículo y documentos
            setRegistrationProgress(30);
            const registrationResponse = await registerCompleteVehicleWithPromotion(formData);
            
            if (!registrationResponse.success) {
                throw new Error(registrationResponse.error || 'Error en el registro');
            }

            console.log('✅ Registro exitoso:', registrationResponse.data);
            const data = registrationResponse.data;
            if (!data) {
                throw new Error('No se recibieron datos del registro');
            }
            
            setRegistrationProgress(50);

            // Paso 2: Subir fotos usando los endpoints implementados
            console.log('� Iniciando subida de fotos...');
            const uploadPromises = [];
            
            // Foto del vehículo
            if (photos.vehiclePhoto) {
                console.log('📸 Uploading vehicle photo...');
                setRegistrationProgress(60);
                uploadPromises.push(
                    uploadVehiclePhoto(data.vehicle.id, photos.vehiclePhoto)
                );
            }

            // Fotos de licencia
            if (photos.licensePhotos?.front || photos.licensePhotos?.back) {
                console.log('📸 Uploading license photos...');
                setRegistrationProgress(70);
                uploadPromises.push(
                    uploadDriverLicensePhotos(data.license.id, {
                        photo_front_base64: photos.licensePhotos?.front 
                            ? (await fileToBase64(photos.licensePhotos.front)).split(',')[1]
                            : undefined,
                        photo_back_base64: photos.licensePhotos?.back 
                            ? (await fileToBase64(photos.licensePhotos.back)).split(',')[1]
                            : undefined
                    })
                );
            }

            // Fotos de SOAT con validación mejorada
            if (photos.soatPhotos?.front || photos.soatPhotos?.back) {
                console.log('📸 Preparing SOAT photos for upload...');
                console.log('📸 SOAT ID:', data.soat.id);
                console.log('📸 Front photo exists:', !!photos.soatPhotos?.front);
                console.log('📸 Back photo exists:', !!photos.soatPhotos?.back);
                
                setRegistrationProgress(90);
                
                try {
                    const soatPhotoData: { photo_front_base64?: string; photo_back_base64?: string } = {};
                    
                    if (photos.soatPhotos?.front) {
                        console.log('📸 Converting front SOAT photo to base64...');
                        const frontBase64 = await fileToBase64(photos.soatPhotos.front);
                        soatPhotoData.photo_front_base64 = frontBase64.split(',')[1];
                        console.log('📸 Front SOAT photo converted, size:', soatPhotoData.photo_front_base64.length);
                    }
                    
                    if (photos.soatPhotos?.back) {
                        console.log('📸 Converting back SOAT photo to base64...');
                        const backBase64 = await fileToBase64(photos.soatPhotos.back);
                        soatPhotoData.photo_back_base64 = backBase64.split(',')[1];
                        console.log('📸 Back SOAT photo converted, size:', soatPhotoData.photo_back_base64.length);
                    }
                    
                    uploadPromises.push(uploadSoatPhotos(data.soat.id, soatPhotoData));
                } catch (conversionError) {
                    console.error('❌ Error converting SOAT photos to base64:', conversionError);
                    throw new Error('Error al procesar fotos del SOAT');
                }
            }

            // Ejecutar todas las subidas de fotos en paralelo
            if (uploadPromises.length > 0) {
                setUploading(true);
                try {
                    await Promise.all(uploadPromises);
                    console.log('📸 Todas las fotos subidas exitosamente');
                } catch (photoError) {
                    console.error('⚠️ Algunos errores al subir fotos:', photoError);
                    // No fallar el registro completo por errores de fotos
                } finally {
                    setUploading(false);
                }
            }

            setRegistrationProgress(100);
            setIsCompleted(true);
            
            notifications.show({
                title: '¡Registro exitoso! 🎉',
                message: 'Tu vehículo y documentos han sido registrados. ¡Ahora eres conductor!',
                color: 'green',
                autoClose: 5000
            });

        } catch (error) {
            console.error('❌ Error en el registro:', error);
            notifications.show({
                title: 'Error en el registro',
                message: error instanceof Error ? error.message : 'Error desconocido',
                color: 'red',
                autoClose: 5000
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    // Renderizar paso 1: Datos del vehículo (CON passenger_capacity)
    const renderVehicleStep = () => (
        <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
                <Car size={24} color="#000" />
            </div>
            
            <Title order={3} className={styles.stepTitle}>
                Información del Vehículo
            </Title>
            
            <Text className={styles.stepDescription}>
                Ingresa los datos básicos de tu vehículo y su capacidad de pasajeros.
            </Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <Select
                    label="Marca del vehículo"
                    placeholder="Selecciona la marca"
                    data={VEHICLE_BRANDS}
                    value={formData.vehicle.brand}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, brand: value || '' }
                    }))}
                    error={errors.brand}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <TextInput
                    label="Modelo"
                    placeholder="Ej: Corolla, Aveo, Logan"
                    value={formData.vehicle.model}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, model: e.target.value }
                    }))}
                    error={errors.model}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Año del vehículo"
                    placeholder="Selecciona el año"
                    data={Array.from({ length: 30 }, (_, i) => String(2026 - i))}
                    value={String(formData.vehicle.year)}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, year: parseInt(value || '2024') }
                    }))}
                    error={errors.year}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <TextInput
                    label="Placa del vehículo"
                    placeholder="ABC123"
                    value={formData.vehicle.plate}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, plate: e.target.value.toUpperCase() }
                    }))}
                    error={errors.plate}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Color principal"
                    placeholder="Color del vehículo"
                    data={COLORS}
                    value={formData.vehicle.color}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, color: value || '' }
                    }))}
                    error={errors.color}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Tipo de carrocería"
                    placeholder="Tipo de vehículo"
                    data={BODY_TYPES}
                    value={formData.vehicle.body_type}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, body_type: value || '' }
                    }))}
                    error={errors.body_type}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
            </SimpleGrid>
            
            {/* Campo de capacidad destacado */}
            <div className={styles.capacityHighlight}>
                <Group gap="sm" mb="sm">
                    <div className={styles.capacityIcon}>
                        <Sparkles size={18} color="#00ff9d" />
                    </div>
                    <Text size="sm" fw={600} c="#00ff9d">Capacidad de Pasajeros</Text>
                </Group>
                
                <NumberInput
                    placeholder="Incluye conductor"
                    value={formData.vehicle.passenger_capacity}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, passenger_capacity: Number(value) || 4 }
                    }))}
                    error={errors.passenger_capacity}
                    required
                    min={1}
                    max={20}
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(0, 255, 157, 0.3)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 500
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                    description={
                        <Text size="xs" c="rgba(255, 255, 255, 0.7)" mt="xs">
                            Total de personas que puede transportar (incluye conductor)
                        </Text>
                    }
                />
            </div>
            
            <div className={styles.sectionDivider}></div>
            
            <div className={styles.imageGallery}>
                <PhotoUpload
                    label="Foto del vehículo (opcional)"
                    photoType="vehiclePhoto"
                />
            </div>
        </div>
    );

    // Renderizar paso 2: Licencia de conducir
    const renderLicenseStep = () => (
        <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
                <IdCard size={24} color="#000" />
            </div>
            
            <Title order={3} className={styles.stepTitle}>
                Licencia de Conducir
            </Title>
            
            <Text className={styles.stepDescription}>
                Registra tu licencia de conducir vigente. Asegúrate de que no esté vencida.
            </Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <TextInput
                    label="Número de licencia"
                    placeholder="Ej: 12345678"
                    value={formData.license.license_number}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        license: { ...prev.license, license_number: e.target.value }
                    }))}
                    error={errors.license_number}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Categoría de licencia"
                    placeholder="Categoría"
                    data={LICENSE_CATEGORIES}
                    value={formData.license.license_category}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        license: { ...prev.license, license_category: value || '' }
                    }))}
                    error={errors.license_category}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Tipo de sangre"
                    placeholder="Tipo de sangre"
                    data={BLOOD_TYPES}
                    value={formData.license.blood_type}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        license: { ...prev.license, blood_type: value || '' }
                    }))}
                    error={errors.blood_type}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <DateInput
                    label="Fecha de expedición"
                    placeholder="Selecciona la fecha"
                    value={formData.license.expedition_date ? new Date(formData.license.expedition_date) : null}
                    onChange={(date) => setFormData(prev => ({
                        ...prev,
                        license: { ...prev.license, expedition_date: date ? date.toISOString().split('T')[0] : '' }
                    }))}
                    error={errors.license_expedition}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <DateInput
                    label="Fecha de vencimiento"
                    placeholder="Selecciona la fecha"
                    value={formData.license.expiration_date ? new Date(formData.license.expiration_date) : null}
                    onChange={(date) => setFormData(prev => ({
                        ...prev,
                        license: { ...prev.license, expiration_date: date ? date.toISOString().split('T')[0] : '' }
                    }))}
                    error={errors.license_expiration}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
            </SimpleGrid>
            
            <div className={styles.sectionDivider}></div>
            
            <Text fw={500} mb="md" c="white" size="sm">
                📷 Fotos de la licencia (opcional)
            </Text>
            <div className={styles.imageGallery}>
                <PhotoUpload
                    label="Frontal"
                    photoType="licensePhotos_front"
                />
                <PhotoUpload
                    label="Posterior"
                    photoType="licensePhotos_back"
                />
            </div>
        </div>
    );

    // Renderizar paso 3: SOAT
    const renderSoatStep = () => (
        <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
                <Shield size={24} color="#000" />
            </div>
            
            <Title order={3} className={styles.stepTitle}>
                SOAT - Seguro Obligatorio
            </Title>
            
            <Text className={styles.stepDescription}>
                Información del seguro obligatorio vigente para tu vehículo.
            </Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <TextInput
                    label="Número de póliza"
                    placeholder="Ej: 123456789"
                    value={formData.soat.policy_number}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        soat: { ...prev.soat, policy_number: e.target.value }
                    }))}
                    error={errors.policy_number}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <Select
                    label="Compañía aseguradora"
                    placeholder="Selecciona la aseguradora"
                    data={INSURANCE_COMPANIES}
                    value={formData.soat.insurance_company}
                    onChange={(value) => setFormData(prev => ({
                        ...prev,
                        soat: { ...prev.soat, insurance_company: value || '' }
                    }))}
                    error={errors.insurance_company}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <DateInput
                    label="Fecha de inicio"
                    placeholder="Selecciona la fecha"
                    value={formData.soat.validity_from ? new Date(formData.soat.validity_from) : null}
                    onChange={(date) => setFormData(prev => ({
                        ...prev,
                        soat: { ...prev.soat, validity_from: date ? date.toISOString().split('T')[0] : '' }
                    }))}
                    error={errors.validity_from}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
                
                <DateInput
                    label="Fecha de vencimiento"
                    placeholder="Selecciona la fecha"
                    value={formData.soat.validity_to ? new Date(formData.soat.validity_to) : null}
                    onChange={(date) => setFormData(prev => ({
                        ...prev,
                        soat: { ...prev.soat, validity_to: date ? date.toISOString().split('T')[0] : '' }
                    }))}
                    error={errors.validity_to}
                    required
                    size="md"
                    styles={{
                        input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        },
                        label: { color: 'white', fontWeight: 500 }
                    }}
                />
            </SimpleGrid>
            
            <Divider my="xl" color="rgba(255, 255, 255, 0.1)" />
            
            <Text fw={500} mb="sm" c="white">Fotos del SOAT (opcional)</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <PhotoUpload
                    label="Frontal"
                    photoType="soatPhotos_front"
                />
                <PhotoUpload
                    label="Posterior"
                    photoType="soatPhotos_back"
                />
            </SimpleGrid>
        </div>
    );

    // Renderizar paso 4: Resumen y confirmación
    const renderSummaryStep = () => (
        <div className={styles.stepCard}>
            <div className={styles.stepIcon}>
                <CheckCircle size={24} color="#000" />
            </div>
            
            <Title order={3} className={styles.stepTitle}>
                Resumen de Registro
            </Title>
            
            <Text className={styles.stepDescription}>
                {isEditMode 
                    ? 'Revisa y actualiza la información de tu vehículo registrado.'
                    : 'Revisa toda la información antes de completar el registro.'
                }
            </Text>
            
            <div className={styles.summaryGrid}>
                {/* Resumen del vehículo */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>
                        <Car size={20} />
                        Vehículo
                    </div>
                    
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Marca y Modelo:</span>
                        <span className={styles.summaryValue}>{formData.vehicle.brand} {formData.vehicle.model}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Año:</span>
                        <span className={styles.summaryValue}>{formData.vehicle.year}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Placa:</span>
                        <span className={styles.summaryValue}>{formData.vehicle.plate}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Color:</span>
                        <span className={styles.summaryValue}>{formData.vehicle.color}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Capacidad:</span>
                        <span className={styles.summaryValue}>{formData.vehicle.passenger_capacity} pasajeros</span>
                    </div>
                </div>
                
                {/* Resumen de la licencia */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>
                        <IdCard size={20} />
                        Licencia
                    </div>
                    
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Número:</span>
                        <span className={styles.summaryValue}>{formData.license.license_number}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Categoría:</span>
                        <span className={styles.summaryValue}>{formData.license.license_category}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Tipo de sangre:</span>
                        <span className={styles.summaryValue}>{formData.license.blood_type}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Vencimiento:</span>
                        <span className={styles.summaryValue}>{formData.license.expiration_date}</span>
                    </div>
                </div>
                
                {/* Resumen del SOAT */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>
                        <Shield size={20} />
                        SOAT
                    </div>
                    
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Póliza:</span>
                        <span className={styles.summaryValue}>{formData.soat.policy_number}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Aseguradora:</span>
                        <span className={styles.summaryValue}>{formData.soat.insurance_company}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Vencimiento:</span>
                        <span className={styles.summaryValue}>{formData.soat.validity_to}</span>
                    </div>
                </div>
            </div>
            
            {/* Botón de confirmar registro */}
            <Box mt="xl" ta="center">
                <Button
                    size="lg"
                    className={styles.primaryButton}
                    onClick={handleCompleteRegistration}
                    loading={loading}
                    disabled={loading}
                >
                    {loading 
                        ? (isEditMode ? 'Actualizando...' : 'Registrando...') 
                        : (isEditMode ? '✏️ Actualizar Información' : '🚗 Completar Registro')
                    }
                </Button>
            </Box>
        </div>
    );

    // Renderizar modal de éxito
    const renderSuccessModal = () => (
        <div className={styles.successModal}>
            <div className={styles.successModalContent}>
                <div className={styles.successModalIcon}>
                    <CheckCircle size={40} color="#000" />
                </div>
                
                <Title className={styles.successModalTitle}>
                    ¡Registro Exitoso! 🎉
                </Title>
                
                <Text className={styles.successModalMessage}>
                    Tu vehículo y documentos han sido registrados correctamente. 
                    ¡Ya puedes empezar a ofrecer viajes como conductor!
                </Text>
                
                <Button
                    className={styles.successModalButton}
                    onClick={() => navigate({ to: '/Perfil' })}
                >
                    Ver mi perfil
                </Button>
            </div>
        </div>
    );

    // Renderizar contenido del paso actual
    const renderStepContent = () => {
        switch (activeStep) {
            case 0: return renderVehicleStep();
            case 1: return renderLicenseStep();
            case 2: return renderSoatStep();
            case 3: return renderSummaryStep();
            default: return null;
        }
    };

    if (isCompleted) {
        return renderSuccessModal();
    }

    return (
        <div className={styles.container}>
            <LoadingOverlay 
                visible={loading} 
                overlayProps={{ radius: "sm", blur: 2 }}
                className={styles.loadingOverlay}
            />
            
            {/* Header */}
            <div style={{height: '60px'}} />
            <div className={styles.header}>
                <ActionIcon 
                    className={styles.backButton}
                    onClick={() => navigate({ to: '/' })}
                >
                    <ArrowLeft size={20} color="#000" />
                </ActionIcon>
                <Title className={styles.headerTitle}>
                    {isEditMode ? 'Editar Información del Vehículo' : 'Registro Completo de Vehículo'}
                </Title>
            </div>

            {/* Container principal */}
            <div className={styles.formContainer}>
                {/* Stepper */}
                <div className={styles.stepperContainer}>
                    <div className={styles.stepperWrapper}>
                        <Stepper 
                            active={activeStep} 
                            onStepClick={goToStep}
                            allowNextStepsSelect={false}
                            size="sm"
                            color="#00ff9d"
                        >
                            {STEPS_CONFIG.map((step, index) => (
                                <Stepper.Step
                                    key={index}
                                    label={step.label}
                                    description={step.description}
                                    icon={<step.icon size={18} />}
                                />
                            ))}
                        </Stepper>
                    </div>
                </div>

                {/* Contenido del paso */}
                <div className={styles.stepContent}>
                    {renderStepContent()}
                </div>

                {/* Botones de navegación */}
                {activeStep < 3 && (
                    <div className={styles.navigationButtons}>
                        <Button
                            className={styles.secondaryButton}
                            onClick={prevStep}
                            disabled={activeStep === 0}
                        >
                            Anterior
                        </Button>
                        
                        <Button
                            className={styles.primaryButton}
                            onClick={nextStep}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </div>

            {/* Indicador de progreso flotante */}
            {(loading || uploading) && (
                <div className={styles.progressContainer}>
                    <Text size="sm" c="white" mb="xs">
                        {loading ? 'Registrando...' : 'Subiendo fotos...'}
                    </Text>
                    <Progress value={registrationProgress} color="#00ff9d" />
                </div>
            )}
        </div>
    );
}

// Crear y exportar la ruta
export const Route = createFileRoute('/RegistrarVehiculo/')({
    component: VehicleRegistrationComplete,
});
