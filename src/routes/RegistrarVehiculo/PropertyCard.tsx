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
import { getPropertyCard, registerPropertyCard, uploadPropertyCardPhotos, fileToBase64, type PropertyCardFormData } from '@/services/vehicles';
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadPropertyCardData = async () => {
            try {
                setLoading(true);

                // Cargar datos de la tarjeta de propiedad usando el backend
                const response = await getPropertyCard();

                if (!response.success) {
                    console.error('Error loading property card:', response.error);
                    navigate({ to: '/Login' });
                    return;
                }

                if (response.hasPropertyCard && response.propertyCard) {
                    const card = response.propertyCard;
                    setHasPropertyCard(true);
                    setVehicleId(card.vehicle_id);
                    
                    setFormData({
                        propertyCardNumber: card.license_number,
                        identificationNumber: card.identification_number,
                        serviceType: (card.service_type?.toLowerCase() === 'public' ? 'public' : 'private') as 'public' | 'private',
                        passengerCapacity: card.passager_capacity.toString(),
                        cylinderCapacity: card.cylinder_capacity,
                        propertyCardExpeditionDate: card.expedition_date.split('T')[0],
                        frontPreview: card.photo_front_url || undefined,
                        backPreview: card.photo_back_url || undefined
                    });
                    setViewMode(true);
                } else {
                    // No hay tarjeta de propiedad, crear nueva
                    setVehicleId(response.vehicleId || null);
                    setViewMode(false);
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
            if (!vehicleId) {
                throw new Error('Información del vehículo no disponible');
            }

            // Preparar datos para el backend
            const propertyCardData: PropertyCardFormData = {
                vehicle_id: vehicleId,
                license_number: formData.propertyCardNumber,
                identification_number: formData.identificationNumber || '',
                service_type: formData.serviceType.toUpperCase(),
                passager_capacity: parseInt(formData.passengerCapacity),
                cylinder_capacity: formData.cylinderCapacity,
                expedition_date: formData.propertyCardExpeditionDate,
                photo_front_url: formData.frontPreview || null,
                photo_back_url: formData.backPreview || null
            };

            // Registrar/actualizar tarjeta de propiedad usando el backend
            const response = await registerPropertyCard(propertyCardData);

            if (!response.success) {
                throw new Error(response.error || 'Error al procesar tarjeta de propiedad');
            }

            // Si hay fotos nuevas para subir
            if (response.propertyCard && (formData.frontFile || formData.backFile)) {
                const photoUploadPromises: Promise<any>[] = [];

                if (formData.frontFile) {
                    const frontBase64 = await fileToBase64(formData.frontFile);
                    photoUploadPromises.push(
                        uploadPropertyCardPhotos(response.propertyCard.id, {
                            photo_front_base64: frontBase64,
                            filename_front: formData.frontFile.name
                        })
                    );
                }

                if (formData.backFile) {
                    const backBase64 = await fileToBase64(formData.backFile);
                    photoUploadPromises.push(
                        uploadPropertyCardPhotos(response.propertyCard.id, {
                            photo_back_base64: backBase64,
                            filename_back: formData.backFile.name
                        })
                    );
                }

                // Esperar a que se suban las fotos
                await Promise.all(photoUploadPromises);
            }

            notifications.show({
                title: 'Éxito',
                message: response.message || 'Tarjeta de propiedad procesada correctamente',
                color: 'green',
                icon: <CheckCircle />
            });

            if (response.propertyCard) {
                setHasPropertyCard(true);
                
                if (!hasPropertyCard) {
                    setSuccessMessage('Tarjeta de propiedad registrada exitosamente');
                    setIsSuccessModalOpen(true);
                }
            }

            setViewMode(true);
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

    // TODO: Implementar subida de fotos cuando esté disponible en el backend
    // const uploadPhoto = async (file: File, type: 'front' | 'back'): Promise<string | null> => {
    //     console.warn('Photo upload not yet implemented in backend');
    //     return null;
    // };

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