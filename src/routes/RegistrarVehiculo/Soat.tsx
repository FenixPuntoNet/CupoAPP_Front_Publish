import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import {
    ArrowLeft,
    Camera,
    FileText,
    Calendar,
    Shield,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import styles from './Soat.module.css';
import { TextInput, Modal, Button, Text } from '@mantine/core';
import { getSoat, registerSoat, uploadSoatPhotos, fileToBase64, getMyVehicle, type SoatFormData as BackendSoatFormData } from '@/services/vehicles';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { notifications } from '@mantine/notifications';

// Constantes para las aseguradoras
const INSURANCE_COMPANIES = [
    { value: 'SURAMERICANA', label: 'Suramericana' },
    { value: 'SURA', label: 'SURA' },
    { value: 'MAPFRE', label: 'MAPFRE' },
    { value: 'BOLIVAR', label: 'Bolívar' },
    { value: 'LIBERTY', label: 'Liberty' },
    { value: 'MUNDIAL', label: 'Mundial' },
    { value: 'PREVISORA', label: 'Previsora' },
    { value: 'AXA_COLPATRIA', label: 'AXA Colpatria' },
    { value: 'ALLIANZ', label: 'Allianz' },
    { value: 'OTRA', label: 'Otra' }
];

interface SoatFormData {
  policy_number: string;
  insurance_company: string;
  identification_number: string | null;
  expedition_date: string;
  expiry_date: string;
  validity_from?: string;
  validity_to?: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  frontFile?: File;
  backFile?: File;
  frontPreview?: string;
  backPreview?: string;
}

const Soat: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useBackendAuth();
    const [formData, setFormData] = useState<SoatFormData>({
        expedition_date: '',
        expiry_date: '',
        insurance_company: '',
        policy_number: '',
        identification_number: '',
        frontPreview: undefined,
        backPreview: undefined,
    });
    
    const [initialFormData] = useState<SoatFormData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasSoat, setHasSoat] = useState(false);
    const [viewMode, setViewMode] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formHasChanged, setFormHasChanged] = useState(false);
    const [submitMessage] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [vehicleId, setVehicleId] = useState<number | null>(null);

    const showErrorNotification = (message: string) => {
        notifications.show({
            title: 'Error',
            message,
            color: 'red',
            icon: <AlertCircle />
        });
    };
    
    useEffect(() => {
        const loadSoatData = async () => {
            try {
                setLoading(true);

                if (!user?.id) {
                    navigate({ to: '/Login' });
                    return;
                }

                console.log('Loading SOAT data for user:', user.id);

                // Primero obtener el vehículo del usuario
                const vehicleResponse = await getMyVehicle();
                
                if (!vehicleResponse.success || !vehicleResponse.vehicle) {
                    showErrorNotification('Debes registrar un vehículo antes de registrar el SOAT');
                    navigate({ to: '/RegistrarVehiculo' });
                    return;
                }

                const vehicle = vehicleResponse.vehicle;
                setVehicleId(vehicle.id);
                console.log('Vehicle found:', vehicle.id);

                // Luego obtener los datos del SOAT
                const response = await getSoat();

                if (response.success && response.hasSoat && response.soat) {
                    const soat = response.soat;
                    console.log('Found existing SOAT:', soat);
                    
                    setHasSoat(true);
                    setFormData({
                        policy_number: soat.policy_number || '',
                        insurance_company: soat.insurance_company || '',
                        identification_number: soat.identification_number || '',
                        expedition_date: soat.validity_from?.split('T')[0] || '',
                        expiry_date: soat.validity_to?.split('T')[0] || '',
                        photo_front_url: soat.photo_front_url,
                        photo_back_url: soat.photo_back_url
                    });
                    setViewMode(true);
                } else {
                    console.log('No existing SOAT found');
                    setHasSoat(false);
                    setViewMode(false);
                }

            } catch (error: any) {
                console.error('Error loading SOAT data:', error);
                showErrorNotification(error.message || 'Error al cargar los datos del SOAT');
            } finally {
                setLoading(false);
            }
        };

        loadSoatData();
    }, [navigate, user?.id]);

    // Validaciones específicas para SOAT
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.policy_number) {
            newErrors.policy_number = 'El número de póliza es requerido';
        }

        if (!formData.insurance_company) {
            newErrors.insurance_company = 'La aseguradora es requerida';
        }

        if (!formData.expedition_date) {
            newErrors.expedition_date = 'La fecha de expedición es requerida';
        }

        if (!formData.expiry_date) {
            newErrors.expiry_date = 'La fecha de vencimiento es requerida';
        } else {
            const expiry = new Date(formData.expiry_date);
            const today = new Date();
            if (expiry <= today) {
                newErrors.expiry_date = 'El SOAT debe tener una fecha de vencimiento futura';
            }
        }

        if (!formData.identification_number) {
            newErrors.identification_number = 'El número de identificación es requerido';
        } else if (!/^\d+$/.test(formData.identification_number)) {
            newErrors.identification_number = 'Número de identificación inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        if (!viewMode) {
            const { name, value } = e.currentTarget;
            if (initialFormData && initialFormData[name as keyof SoatFormData] !== value) {
                setFormHasChanged(true);
            } else if (
                initialFormData &&
                initialFormData[name as keyof SoatFormData] === value &&
                formHasChanged
            ) {
                setFormHasChanged(false);
            }
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        } else {
            const { name, value } = e.currentTarget;
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Limpiar errores cuando se corrige el campo
        if (typeof name === "string" && errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };

    // Manejador de archivos
    const handleFileUpload = (side: 'front' | 'back') => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                [`${side}File`]: 'La imagen no debe exceder 5MB'
            }));
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                [`${side}File`]: 'Formato no válido. Use JPG, PNG o WebP'
            }));
            return;
        }

        try {
            // Crear preview usando FileReader
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setFormData(prev => ({
                    ...prev,
                    [`${side}File`]: file,
                    [`${side}Preview`]: result
                }));
            };
            reader.readAsDataURL(file);

            // Limpiar errores previos
            if (errors[`${side}File`]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[`${side}File`];
                    return newErrors;
                });
            }
            
            if (!viewMode) {
                setFormHasChanged(true);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            setErrors(prev => ({
                ...prev,
                [`${side}File`]: 'Error al procesar la imagen'
            }));
        }
    };

    const showSuccessModal = () => {
        setSuccessMessage('SOAT registrado exitosamente');
        setIsSuccessModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !validateForm()) return;

        setIsSubmitting(true);

        try {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }

            if (!vehicleId) {
                throw new Error('No se encontró el vehículo asociado');
            }

            // Preparar datos base para el backend
            const soatData: BackendSoatFormData = {
                vehicle_id: vehicleId,
                policy_number: formData.policy_number,
                identification_number: formData.identification_number || '',
                insurance_company: formData.insurance_company,
                validity_from: formData.expedition_date,
                validity_to: formData.expiry_date,
                photo_front_url: formData.photo_front_url || null,
                photo_back_url: formData.photo_back_url || null
            };

            console.log('Sending SOAT data:', soatData);

            // Registrar/actualizar SOAT usando el backend
            const response = await registerSoat(soatData);

            if (!response.success) {
                throw new Error(response.error || 'Error al procesar el SOAT');
            }

            // Si hay fotos nuevas para subir
            if (response.soat && (formData.frontFile || formData.backFile)) {
                const photoUploadPromises: Promise<any>[] = [];

                if (formData.frontFile) {
                    const frontBase64 = await fileToBase64(formData.frontFile);
                    photoUploadPromises.push(
                        uploadSoatPhotos(response.soat.id, {
                            photo_front_base64: frontBase64,
                            filename_front: formData.frontFile.name
                        })
                    );
                }

                if (formData.backFile) {
                    const backBase64 = await fileToBase64(formData.backFile);
                    photoUploadPromises.push(
                        uploadSoatPhotos(response.soat.id, {
                            photo_back_base64: backBase64,
                            filename_back: formData.backFile.name
                        })
                    );
                }

                // Esperar a que se suban las fotos
                await Promise.all(photoUploadPromises);
            }

            // Actualizar estado local
            if (response.soat) {
                setHasSoat(true);
                setFormData(prev => ({
                    ...prev,
                    photo_front_url: response.soat?.photo_front_url || prev.photo_front_url,
                    photo_back_url: response.soat?.photo_back_url || prev.photo_back_url,
                }));
            }

            if (hasSoat) {
                notifications.show({
                    title: 'SOAT Actualizado',
                    message: 'La información del SOAT ha sido actualizada correctamente',
                    color: 'green',
                    icon: <CheckCircle />,
                    autoClose: 4000
                });
                setViewMode(true);
            } else {
                showSuccessModal();
            }

            setFormHasChanged(false);

        } catch (error: any) {
            console.error('Error:', error);
            showErrorNotification(error.message || 'Error al procesar el SOAT');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (formHasChanged) {
            setIsModalOpen(true);
        } else {
            navigate({ to: '/Perfil' });
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalConfirm = () => {
        setIsModalOpen(false);
        navigate({ to: '/Perfil' });
    };

    const handleSuccessModalClose = () => {
        setIsSuccessModalOpen(false);
        if (hasSoat) {
            navigate({ to: '/Perfil' });
        } else {
            navigate({
                to: '/Perfil',
                search: { documentType: 'soat', status: 'completed' },
            });
        }
    };

    const handleEditClick = () => {
        setViewMode(false);
        setFormHasChanged(false);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.gradientBackground} />
                <div className={styles.loadingContainer}>
                    <span className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Success Modal */}
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
                    <CheckCircle size={60} color="green" className={styles.modalIcon}/>
                    <Text size="xl" fw={500} mt="md" className={styles.modalParagraph}>{successMessage}</Text>
                    <Button onClick={handleSuccessModalClose} variant="filled" color="green" className={styles.buttonModalPrimary}>
                        {hasSoat ? 'Volver a Perfil' : 'Volver a Documentos'}
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
                    <Button onClick={handleModalClose} variant="outline" color="gray" className={styles.buttonModalSecondary}>
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
                    <div className={styles.navigationHeader}>
                        <button onClick={handleBack} className={styles.backButton}>
                            <ArrowLeft size={20} />
                            <span>Volver</span>
                        </button>
                    </div>
                    <h1 className={styles.title}>SOAT</h1>
                    <p className={styles.subtitle}>
                        Registro del Seguro Obligatorio de Accidentes de Tránsito
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Información del Documento */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FileText className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Información del SOAT</h2>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FileText size={16} className={styles.labelIcon} />
                                    Número de Identificación
                                </label>
                                <TextInput
                                    type="text"
                                    name="identification_number"
                                    value={formData.identification_number ?? ''}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Número de identificación del usuario"
                                    disabled={viewMode}
                                    error={errors.identification_number}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Shield size={16} className={styles.labelIcon} />
                                    Aseguradora
                                </label>
                                <select
                                    name="insurance_company"
                                    value={formData.insurance_company}
                                    onChange={handleInputChange}
                                    className={`${styles.select} ${viewMode ? styles.viewModeInput : ''}`}
                                    disabled={viewMode || isSubmitting}
                                >
                                    <option value="">Seleccione aseguradora</option>
                                    {INSURANCE_COMPANIES.map(company => (
                                        <option key={company.value} value={company.value}>
                                            {company.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.insurance_company && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.insurance_company}
                                    </span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FileText size={16} className={styles.labelIcon} />
                                    Número de Póliza
                                </label>
                                <TextInput
                                    type="text"
                                    name="policy_number"
                                    value={formData.policy_number}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Número de póliza SOAT"
                                    disabled={viewMode || isSubmitting}
                                    error={errors.policy_number}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Calendar size={16} className={styles.labelIcon} />
                                    Fecha de Expedición
                                </label>
                                <TextInput
                                    type="date"
                                    name="expedition_date"
                                    value={formData.expedition_date}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    max={new Date().toISOString().split('T')[0]}
                                    disabled={viewMode || isSubmitting}
                                    error={errors.expedition_date}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <Calendar size={16} className={styles.labelIcon} />
                                    Fecha de Vencimiento
                                </label>
                                <TextInput
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={viewMode || isSubmitting}
                                    error={errors.expiry_date}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fotos del Documento */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Camera className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Fotos del SOAT</h2>
                            <Text size="sm" color="dimmed" className={styles.optionalText}>
                                (Opcional)
                            </Text>
                        </div>
                        <div className={styles.photosGrid}>
                            {/* Foto Frontal */}
                            <div className={styles.photoUpload}>
                                <div className={styles.photoPreview} onClick={() => !viewMode && document.getElementById('frontPhoto')?.click()}>
                                    {formData.frontPreview || formData.photo_front_url ? (
                                        <img
                                            src={formData.frontPreview || formData.photo_front_url || ""}
                                            alt="Cara frontal"
                                            className={styles.previewImage}
                                        />
                                    ) : (
                                        <div className={styles.photoPlaceholder}>
                                            <Camera size={40} className={styles.placeholderIcon} />
                                            <span className={styles.placeholderText}>
                                                Cara frontal del SOAT
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="frontPhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload('front')}
                                    className={styles.photoInput}
                                    disabled={viewMode || isSubmitting}
                                />
                                <label 
                                    htmlFor="frontPhoto" 
                                    className={`${styles.photoLabel} ${viewMode ? styles.disabled : ''}`}
                                >
                                    <Camera size={16} />
                                    {formData.frontPreview || formData.photo_front_url ? 'Cambiar foto' : 'Subir foto frontal'}
                                </label>
                                {errors.frontFile && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.frontFile}
                                    </span>
                                )}
                            </div>

                            {/* Foto Trasera */}
                            <div className={styles.photoUpload}>
                                <div className={styles.photoPreview} onClick={() => !viewMode && document.getElementById('backPhoto')?.click()}>
                                    {formData.backPreview || formData.photo_back_url ? (
                                        <img
                                            src={formData.backPreview || formData.photo_back_url || ""}
                                            alt="Cara trasera"
                                            className={styles.previewImage}
                                        />
                                    ) : (
                                        <div className={styles.photoPlaceholder}>
                                            <Camera size={40} className={styles.placeholderIcon} />
                                            <span className={styles.placeholderText}>
                                                Cara trasera del SOAT
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="backPhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload('back')}
                                    className={styles.photoInput}
                                    disabled={viewMode || isSubmitting}
                                />
                                <label 
                                    htmlFor="backPhoto" 
                                    className={`${styles.photoLabel} ${viewMode ? styles.disabled : ''}`}
                                >
                                    <Camera size={16} />
                                    {formData.backPreview || formData.photo_back_url ? 'Cambiar foto' : 'Subir foto trasera'}
                                </label>
                                {errors.backFile && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} />
                                        {errors.backFile}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mensaje de Error General */}
                    {submitMessage && (
                        <div
                            className={`${styles.submitMessage} ${
                                submitMessage.includes('exitosamente')
                                    ? styles.successMessage
                                    : styles.errorMessage
                            }`}
                        >
                            <span>{submitMessage}</span>
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
                        {hasSoat && viewMode ? (
                            <button
                                type="button"
                                onClick={handleEditClick}
                                className={styles.buttonPrimary}
                                disabled={isSubmitting}
                            >
                                <CheckCircle size={20} />
                                Editar SOAT
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
                                        Guardar SOAT
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

export const Route = createFileRoute('/RegistrarVehiculo/Soat')({
    component: Soat,
});

export default Soat;
