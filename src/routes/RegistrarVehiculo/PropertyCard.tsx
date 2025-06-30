import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import {
    ArrowLeft,
    FileText,
    Calendar,
    Users,
    AlertCircle,
    CheckCircle,
    UserRound,
    Settings
} from 'lucide-react';
import { type PropertyCardData, SERVICE_TYPES } from '../../types/PropertyCardTypes';
import styles from './PropertyCar.module.css';
import { LoadingOverlay, Modal, Button, Text } from '@mantine/core';
 import { supabase } from '@/lib/supabaseClient';
import { notifications } from '@mantine/notifications';


const PropertyCard: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PropertyCardData>({
        propertyCardNumber: '',
        identificationNumber: '',
        serviceType: 'private',
        passengerCapacity: '',
        cylinderCapacity: '',
        propertyCardExpeditionDate: '',
        frontFile: undefined,
        backFile: undefined,
        frontPreview: '',
        backPreview: '',
    });
    const [initialFormData, ] = useState<PropertyCardData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, ] = useState('');
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [hasPropertyCard, setHasPropertyCard] = useState(false);
    const [viewMode, setViewMode] = useState(true);
    const [formHasChanged, setFormHasChanged] = useState(false);
    const [propertyCardId, setPropertyCardId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadPropertyCardData = async () => {
            try {
                setLoading(true);

                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                    navigate({ to: '/Login' });
                    return;
                }

                const userId = session.user.id;

                // Cargar datos de la tarjeta de propiedad existente
                const { data: existingCard } = await supabase
                    .from('property_cards')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existingCard) {
                    setPropertyCardId(existingCard.id);
                    setHasPropertyCard(true);
                    setFormData({
                        propertyCardNumber: existingCard.license_number || '',
                        identificationNumber: existingCard.identification_number || '',
                        serviceType: (existingCard.service_type?.toLowerCase() === 'public' ? 'public' : 'private') as 'public' | 'private',
                        passengerCapacity: existingCard.passager_capacity?.toString() || '',
                        cylinderCapacity: existingCard.cylinder_capacity || '',
                        propertyCardExpeditionDate: existingCard.expedition_date?.split('T')[0] || '',
                        frontPreview: existingCard.photo_front_url || undefined,
                        backPreview: existingCard.photo_back_url || undefined
                    });
                    setViewMode(true);
                } else {
                    // Cargar datos del perfil para nuevo registro
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('identification_number')
                        .eq('user_id', userId)
                        .single();

                    if (profileData) {
                        setFormData(prev => ({
                            ...prev,
                            identificationNumber: profileData.identification_number
                        }));
                    }
                    setViewMode(false);
                }

                // Obtener vehicleId
                const { data: vehicleData } = await supabase
                    .from('vehicles')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (vehicleData) {
                    setVehicleId(vehicleData.id);
                }

            } catch (error) {
                console.error('Error loading property card data:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Error al cargar los datos de la tarjeta de propiedad',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        loadPropertyCardData();
    }, [navigate]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.propertyCardNumber) {
            newErrors.propertyCardNumber = 'El número de la tarjeta de propiedad es requerido';
        }

        if (!formData.serviceType) {
            newErrors.serviceType = 'El tipo de servicio es requerido';
        }
        
        if (!formData.passengerCapacity) {
            newErrors.passengerCapacity = 'La capacidad de pasajeros es requerida';
        }
        
        if (!/^\d+$/.test(formData.passengerCapacity)) {
            newErrors.passengerCapacity = 'Capacidad de pasajeros inválida';
        }
        
        if (!formData.cylinderCapacity) {
            newErrors.cylinderCapacity = 'El cilindraje es requerido';
        }
        
        if (!formData.propertyCardExpeditionDate) {
            newErrors.propertyCardExpeditionDate = 'La fecha de expedición de la tarjeta es requerida';
        }

        // Eliminadas las validaciones de fotos requeridas
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!viewMode) {
            const { name, value } = e.target;
            // Validar la capacidad de pasajeros, asegurando que sea un número y que no exceda 10
            if (name === "passengerCapacity") {
                const numericValue = value.replace(/[^0-9]/g, ''); // Elimina caracteres no numéricos

                if (Number.parseInt(numericValue) > 10) {
                    setErrors(prev => ({ ...prev, [name]: "La capacidad máxima es 10 pasajeros" }));
                    return;
                }
                if (initialFormData && initialFormData[name as keyof PropertyCardData] !== value) {
                    setFormHasChanged(true);
                } else if (
                    initialFormData &&
                    initialFormData[name as keyof PropertyCardData] === value &&
                    formHasChanged
                ) {
                    setFormHasChanged(false);
                }

                setFormData(prev => ({ ...prev, [name]: numericValue }));
                if (errors[name]) {
                    if (name) {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[name];
                            return newErrors;
                        });
                    }
                }
                return;
            }
            if (initialFormData && initialFormData[name as keyof PropertyCardData] !== value) {
                setFormHasChanged(true);
            } else if (
                initialFormData &&
                initialFormData[name as keyof PropertyCardData] === value &&
                formHasChanged
            ) {
                setFormHasChanged(false);
            }
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }

        const fieldName = 'name'; // Renombramos la variable para evitar conflictos

        if (errors[fieldName]) {
            if (fieldName) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldName]; // Usamos la variable renombrada
                    return newErrors;
                });
            }
        }

    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !validateForm()) return;

        setIsSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId || !vehicleId) {
                throw new Error('Información necesaria no disponible');
            }

            // Preparar datos base
            const propertyCardData = {
                user_id: userId,
                vehicle_id: vehicleId,
                license_number: formData.propertyCardNumber,
                identification_number: formData.identificationNumber,
                service_type: formData.serviceType.toUpperCase(),
                passager_capacity: parseInt(formData.passengerCapacity),
                cylinder_capacity: formData.cylinderCapacity,
                expedition_date: new Date(formData.propertyCardExpeditionDate).toISOString(),
                photo_front_url: formData.frontPreview,
                photo_back_url: formData.backPreview
            };

            // Procesar fotos si existen
            if (formData.frontFile) {
                const frontUrl = await uploadPhoto(formData.frontFile, 'front');
                if (frontUrl) propertyCardData.photo_front_url = frontUrl;
            }

            if (formData.backFile) {
                const backUrl = await uploadPhoto(formData.backFile, 'back');
                if (backUrl) propertyCardData.photo_back_url = backUrl;
            }

            if (hasPropertyCard && propertyCardId) {
                // Actualizar tarjeta existente
                const { error: updateError } = await supabase
                    .from('property_cards')
                    .update(propertyCardData)
                    .eq('id', propertyCardId);

                if (updateError) throw updateError;

                notifications.show({
                    title: 'Éxito',
                    message: 'Tarjeta de propiedad actualizada correctamente',
                    color: 'green',
                    icon: <CheckCircle />
                });

                setViewMode(true);
            } else {
                // Crear nueva tarjeta
                const { data: newCard, error: insertError } = await supabase
                    .from('property_cards')
                    .insert([propertyCardData])
                    .select()
                    .single();

                if (insertError) throw insertError;

                if (newCard) {
                    setPropertyCardId(newCard.id);
                    setHasPropertyCard(true);
                    setSuccessMessage('Tarjeta de propiedad registrada exitosamente');
                    setIsSuccessModalOpen(true);
                }
            }

            setFormHasChanged(false);

        } catch (error: any) {
            console.error('Error:', error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Error al procesar la tarjeta de propiedad',
                color: 'red',
                icon: <AlertCircle />
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const uploadPhoto = async (file: File, type: 'front' | 'back'): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Math.random()}.${fileExt}`;
            const filePath = `property_cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property_cards')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property_cards')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error(`Error uploading ${type} photo:`, error);
            return null;
        }
    };

    const handleSuccessModalClose = () => {
        setIsSuccessModalOpen(false);
        if (hasPropertyCard) {
            navigate({ to: '/Perfil' });
        } else {
            navigate({
                to: '/Perfil',
                search: { documentType: 'property', status: 'completed' }
            });
        }
    };

    const handleBack = () => {
        if (formHasChanged) {
            setIsModalOpen(true);
        } else {
            navigate({ to: hasPropertyCard ? '/Perfil' : '/RegistrarVehiculo/DocumentsRequired' });
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalConfirm = () => {
        setIsModalOpen(false);
        navigate({ to: hasPropertyCard ? '/Perfil' : '/RegistrarVehiculo/DocumentsRequired' });
    };

    const handleEditClick = () => {
        setViewMode(false);
        setFormHasChanged(false);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <LoadingOverlay visible />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Confirmation Modal */}
            <Modal
                opened={isSuccessModalOpen}
                onClose={handleSuccessModalClose}
                title="Éxito"
                classNames={{
                    root: styles.modalContainer,
                    title: styles.modalTitle,
                    body: styles.modalBody,
                    header: styles.modalHeader,
                    close: styles.modalCloseButton
                }}
            >
                <div className={styles.modalContent}>
                    <CheckCircle size={60} color="green" className={styles.modalIcon} />
                    <Text size="xl" fw={500} mt="md" className={styles.modalParagraph}>{successMessage}</Text>
                    <Button onClick={handleSuccessModalClose} variant="filled" color="green" className={styles.buttonModalPrimary}>
                        {hasPropertyCard ? 'Volver a Perfil' : 'Volver a Documentos'}
                    </Button>
                </div>
            </Modal>

            {/* Confirmation Exit Modal */}
            <Modal
                opened={isModalOpen}
                onClose={handleModalClose}
                title="¿Salir sin guardar cambios?"
                classNames={{
                    root: styles.modalContainer,
                    title: styles.modalTitle,
                    body: styles.modalBody,
                    header: styles.modalHeader,
                    close: styles.modalCloseButton
                }}
            >
                <p className={styles.modalParagraph}>
                    ¿Estás seguro de que deseas salir sin guardar los cambios?
                </p>
                <div className={styles.modalButtons}>
                    <Button onClick={handleModalClose} variant="outline" color="gray" className={styles.buttonModalSecondary} >
                        Cancelar
                    </Button>
                    <Button onClick={handleModalConfirm} variant="filled" color="red" className={styles.buttonModalPrimary}>
                        Salir sin guardar
                    </Button>
                </div>
            </Modal>
            <div className={styles.gradientBackground} />

            <div className={styles.content}>
                <div className={styles.header}>
                    <button onClick={handleBack} className={styles.backButton}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className={styles.title}>Tarjeta de Propiedad</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Información de la Tarjeta de Propiedad */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FileText className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Información de la Tarjeta de Propiedad</h2>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FileText size={16} className={styles.labelIcon} />
                                    Número de Tarjeta de Propiedad
                                </label>
                                <input
                                    type="text"
                                    name="propertyCardNumber"
                                    value={formData.propertyCardNumber}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Número de la tarjeta de propiedad"
                                    disabled={isSubmitting}
                                />
                                {errors.propertyCardNumber && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.propertyCardNumber}
                                    </span>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Calendar size={16} className={styles.labelIcon} />
                                    Fecha de Expedición de la Tarjeta
                                </label>
                                <input
                                    type="date"
                                    name="propertyCardExpeditionDate"
                                    value={formData.propertyCardExpeditionDate}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    disabled={isSubmitting}
                                />
                                {errors.propertyCardExpeditionDate && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.propertyCardExpeditionDate}
                                    </span>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Users size={16} className={styles.labelIcon} />
                                    Tipo de Servicio
                                </label>
                                <select
                                    name="serviceType"
                                    value={formData.serviceType}
                                    onChange={handleInputChange}
                                    className={styles.select}
                                    disabled={isSubmitting}
                                >
                                    {SERVICE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.serviceType && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.serviceType}
                                    </span>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Users size={16} className={styles.labelIcon} />
                                    Capacidad de Pasajeros
                                </label>
                                <input
                                    type="number"
                                    name="passengerCapacity"
                                    value={formData.passengerCapacity}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Capacidad máxima de pasajeros"
                                    disabled={isSubmitting}
                                />
                                {errors.passengerCapacity && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.passengerCapacity}
                                    </span>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Settings size={16} className={styles.labelIcon} />
                                    Cilindraje del Vehículo
                                </label>
                                <input
                                    type="text"
                                    name="cylinderCapacity"
                                    value={formData.cylinderCapacity}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Cilindraje del vehículo"
                                    disabled={isSubmitting}
                                />
                                {errors.cylinderCapacity && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.cylinderCapacity}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Información del Propietario */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <UserRound className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Información del Propietario</h2>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FileText size={16} className={styles.labelIcon} />
                                    Número de Identificación
                                </label>
                                <input
                                    type="text"
                                    value={formData.identificationNumber ?? ''} 
                                    className={styles.input}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>


                    {/* Mensaje de Error General */}
                    {error && (
                        <div className={styles.errorAlert}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Botones de Acción */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            onClick={handleBack}
                            className={styles.buttonSecondary}
                            disabled={isSubmitting}
                        >
                            <ArrowLeft size={20} style={{ marginRight: 8 }} />
                            Volver
                        </button>
                        {hasPropertyCard && viewMode ? (
                            <button
                                type="button"
                                onClick={handleEditClick}
                                className={styles.buttonPrimary}
                                disabled={isSubmitting}
                            >
                                <CheckCircle size={20} />
                                Editar Documento
                            </button>
                        ) : !viewMode && (
                            <button
                                type="submit"
                                className={`${styles.buttonPrimary} ${isSubmitting ? styles.loading : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className={styles.loadingText}>
                                        <span className={styles.loadingSpinner} />
                                        Guardando...
                                    </span>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        {formHasChanged ? 'Guardar Edición' : 'Guardar Documento'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export const Route = createFileRoute('/RegistrarVehiculo/PropertyCard')({
    component: PropertyCard,
});

export default PropertyCard;