import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
    ArrowLeft,
    Camera,
    Calendar,
    FileText,
    AlertCircle,
    CheckCircle,
    User,
} from 'lucide-react';
import {
    LICENSE_CATEGORIES,
    BLOOD_TYPES,
} from '../../types/DocumentTypes';
import styles from './License.module.css';
import { createFileRoute } from '@tanstack/react-router';
import {
    TextInput,
    Select,
    Modal,
    Button,
    Text,
} from '@mantine/core';
import { getDriverLicense, registerDriverLicense, uploadDriverLicensePhotos, fileToBase64, type DriverLicenseFormData } from '@/services/vehicles';
import { notifications } from '@mantine/notifications';
import { useBackendAuth } from '@/context/BackendAuthContext';

interface ValidationErrors {
    [key: string]: string;
}

interface DriverLicenseData {
    id?: number;
    licenseNumber?: string;
    expeditionDate?: string;
    expiryDate?: string;
    licenseCategory?: string;
    bloodType?: string;
    identificationNumber?: string | null;
    photo_front_url?: string | null;
    photo_back_url?: string | null;
    frontFile?: File;
    backFile?: File;
    frontPreview?: string;
    backPreview?: string;
}

const License: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useBackendAuth();
    const [formData, setFormData] = useState<DriverLicenseData>({
        licenseNumber: '',
        expeditionDate: '',
        expiryDate: '',
        licenseCategory: 'B1',
        bloodType: 'O+',
        frontPreview: undefined,
        backPreview: undefined,
        identificationNumber: '',
        photo_front_url: undefined,
        photo_back_url: undefined,
        frontFile: undefined,
        backFile: undefined,
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasLicense, setHasLicense] = useState(false);
    const [viewMode, setViewMode] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formHasChanged, setFormHasChanged] = useState(false);

    useEffect(() => {
        const loadLicenseData = async () => {
            try {
                setLoading(true);

                if (!user?.id) {
                    navigate({ to: '/Login' });
                    return;
                }

                console.log('Loading license data for user:', user.id);

                // Get driver license data from backend
                const response = await getDriverLicense();

                if (response.success && response.hasLicense && response.license) {
                    const license = response.license;
                    console.log('Found existing license:', license);
                    
                    setHasLicense(true);
                    setFormData({
                        licenseNumber: license.license_number || '',
                        expeditionDate: license.expedition_date?.split('T')[0] || '',
                        expiryDate: license.expiration_date?.split('T')[0] || '',
                        bloodType: license.blood_type || 'O+',
                        licenseCategory: license.license_category || 'B1',
                        identificationNumber: license.identification_number ?? undefined,
                        photo_front_url: license.photo_front_url ?? undefined,
                        photo_back_url: license.photo_back_url ?? undefined,  
                        frontPreview: license.photo_front_url ?? undefined,
                        backPreview: license.photo_back_url ?? undefined,
                        frontFile: undefined,
                        backFile: undefined
                    });
                    setViewMode(true);
                } else {
                    console.log('No existing license found');
                    setHasLicense(false);
                    setViewMode(false);
                }

            } catch (error: any) {
                console.error('Error loading license data:', error);
                showErrorNotification(error.message || 'Error al cargar datos de la licencia');
            } finally {
                setLoading(false);
            }
        };

        loadLicenseData();
    }, [navigate, user?.id]);

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!formData.licenseNumber?.trim())
            newErrors.licenseNumber = 'El número de licencia es requerido';

        if (!formData.expeditionDate)
            newErrors.expeditionDate = 'La fecha de expedición es requerida';

        if (!formData.expiryDate)
            newErrors.expiryDate = 'La fecha de vencimiento es requerida';

        // Validaciones adicionales
        if (formData.expeditionDate && formData.expiryDate) {
            if (new Date(formData.expeditionDate) > new Date(formData.expiryDate)) {
                newErrors.expiryDate = 'La fecha de vencimiento debe ser posterior a la expedición';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (name: string, value: string) => {
        if (!viewMode) {
            setFormHasChanged(true);
        }
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFileUpload =
        (side: 'front' | 'back') => async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setErrors((prev) => ({
                    ...prev,
                    [`${side}File`]: 'La imagen no debe exceder 5MB',
                }));
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image.heic'];
            if (!validTypes.includes(file.type)) {
                setErrors((prev) => ({
                    ...prev,
                    [`${side}File`]: 'Formato no válido. Use JPG, PNG o HEIC',
                }));
                return;
            }
            setFormData((prev) => ({
                ...prev,
                [`${side}File`]: file,
                [`${side}Preview`]: URL.createObjectURL(file)
            }));
            if (errors[`${side}File`]) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[`${side}File`];
                    return newErrors;
                });
            }
        };

    const showErrorNotification = (message: string) => {
        notifications.show({
            title: 'Error',
            message,
            color: 'red',
            icon: <AlertCircle />,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !validateForm()) return;

        setIsSubmitting(true);

        try {
            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }

            // Preparar datos base para el backend
            const licenseData: DriverLicenseFormData = {
                license_number: formData.licenseNumber?.trim() || '',
                identification_number: formData.identificationNumber || '',
                license_category: formData.licenseCategory || 'B1',
                blood_type: formData.bloodType || 'O+',
                expedition_date: formData.expeditionDate || '',
                expiration_date: formData.expiryDate || '',
                photo_front_url: formData.photo_front_url || null,
                photo_back_url: formData.photo_back_url || null
            };

            // Registrar/actualizar licencia usando el backend
            const response = await registerDriverLicense(licenseData);

            if (!response.success) {
                throw new Error(response.error || 'Error al procesar la licencia');
            }

            // Si hay fotos nuevas para subir
            if (response.license && (formData.frontFile || formData.backFile)) {
                const photoUploadPromises: Promise<any>[] = [];

                if (formData.frontFile) {
                    const frontBase64 = await fileToBase64(formData.frontFile);
                    photoUploadPromises.push(
                        uploadDriverLicensePhotos(response.license.id, {
                            photo_front_base64: frontBase64,
                            filename_front: formData.frontFile.name
                        })
                    );
                }

                if (formData.backFile) {
                    const backBase64 = await fileToBase64(formData.backFile);
                    photoUploadPromises.push(
                        uploadDriverLicensePhotos(response.license.id, {
                            photo_back_base64: backBase64,
                            filename_back: formData.backFile.name
                        })
                    );
                }

                // Esperar a que se suban las fotos
                await Promise.all(photoUploadPromises);
            }

            // Actualizar estado local
            if (response.license) {
                setHasLicense(true);
                setFormData(prev => ({
                    ...prev,
                    photo_front_url: response.license?.photo_front_url || prev.photo_front_url,
                    photo_back_url: response.license?.photo_back_url || prev.photo_back_url,
                }));
            }

            notifications.show({
                title: 'Éxito',
                message: response.message || (hasLicense ? 'Licencia actualizada correctamente' : 'Licencia registrada correctamente'),
                color: 'green',
                icon: <CheckCircle />
            });

            setViewMode(true);
            setFormHasChanged(false);

        } catch (error: any) {
            console.error('Error:', error);
            showErrorNotification(error.message || 'Error al procesar la licencia');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = () => {
        setViewMode(false);
        setFormHasChanged(false);
        notifications.show({
            title: 'Modo Edición Activado',
            message: 'Ahora puedes modificar los datos de tu licencia',
            color: 'blue',
            icon: <FileText />
        });
    };

    const handleCancelEdit = () => {
        if (formHasChanged) {
            setIsModalOpen(true);
        } else {
            setViewMode(true);
        }
    };

    const handleBack = () => {
        if (formHasChanged) {
            setIsModalOpen(true);
        } else {
            navigate({ to: hasLicense ? '/Perfil' : '/RegistrarVehiculo/DocumentsRequired' });
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleModalConfirm = () => {
        setIsModalOpen(false);
        navigate({ to: '/Perfil' });
    };

    const renderIdentificationField = () => (
        <div className={styles.formGroup}>
            <TextInput
              value={formData.identificationNumber ?? ''}
              disabled={true}
              className={`${styles.input} ${styles.disabledInput}`}
            />
        </div>
    );

    const renderTextField = (name: keyof typeof formData) => (
        <div className={styles.formGroup}>
            <TextInput
                type="text"
                name={name}
                value={formData[name]?.toString() || ''}
                onChange={(e) => handleInputChange(name, e.currentTarget.value)}
                disabled={viewMode}
                className={`${styles.input} ${viewMode ? styles.viewModeInput : ''}`}
                error={errors[name]}
            />
        </div>
    );

    const renderDateField = (name: keyof typeof formData) => (
        <div className={styles.formGroup}>
            <TextInput
                type="date"
                name={name}
                value={formData[name]?.toString() || ''}
                onChange={(e) => handleInputChange(name, e.currentTarget.value)}
                disabled={viewMode}
                className={`${styles.input} ${viewMode ? styles.viewModeInput : ''}`}
                error={errors[name]}
            />
        </div>
    );

    const renderActionButtons = () => {
        if (hasLicense) {
            if (viewMode) {
                return (
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className={styles.buttonPrimary}
                        disabled={isSubmitting}
                    >
                        <FileText size={20} style={{ marginRight: 8 }} />
                        Editar Licencia
                    </button>
                );
            } else {
                return (
                    <div className={styles.editActions}>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className={styles.buttonSecondary}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.buttonPrimary}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                );
            }
        }
        return (
            <button
                type="submit"
                className={styles.buttonPrimary}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Registrando...' : 'Registrar Licencia'}
            </button>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <Text>Cargando datos de licencia...</Text>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.gradientBackground} />
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.navigationHeader}>
                        <button
                            onClick={handleBack}
                            className={styles.backButton}
                            disabled={isSubmitting}
                        >
                            <ArrowLeft size={20} />
                            <span>Volver</span>
                        </button>
                    </div>
                    <h1 className={styles.title}>Licencia de Conducir</h1>
                    <p className={styles.subtitle}>
                        {hasLicense ? 'Información de tu licencia registrada' : 'Registra tu licencia de conducir'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formSections}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <User size={20} />
                                Datos de la Licencia
                            </h3>
                            <div className={styles.formGrid}>
                                {renderTextField('licenseNumber')}
                                {renderIdentificationField()}
                                <div className={styles.formGroup}>
                                    <Select
                                        value={formData.licenseCategory}
                                        onChange={(value) => handleInputChange('licenseCategory', value || 'B1')}
                                        data={LICENSE_CATEGORIES}
                                        disabled={viewMode}
                                        className={`${styles.input} ${viewMode ? styles.viewModeInput : ''}`}
                                        error={errors.licenseCategory}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <Select
                                        value={formData.bloodType}
                                        onChange={(value) => handleInputChange('bloodType', value || 'O+')}
                                        data={BLOOD_TYPES}
                                        disabled={viewMode}
                                        className={`${styles.input} ${viewMode ? styles.viewModeInput : ''}`}
                                        error={errors.bloodType}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Calendar size={20} />
                                Fechas
                            </h3>
                            <div className={styles.formGrid}>
                                {renderDateField('expeditionDate')}
                                {renderDateField('expiryDate')}
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Camera size={20} />
                                Fotos de la Licencia
                            </h3>
                            <div className={styles.photoGrid}>
                                <div className={styles.photoUpload}>
                                    <h4>Foto Frontal</h4>
                                    <div className={styles.photoPreview}>
                                        {(formData.frontPreview || formData.photo_front_url) && (
                                            <div className={styles.previewContainer}>
                                                <img
                                                    src={formData.frontPreview || formData.photo_front_url || ''}
                                                    alt="Vista previa frontal"
                                                    className={styles.previewImage}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image.heic"
                                        onChange={handleFileUpload('front')}
                                        className={styles.photoInput}
                                        id="front-photo"
                                        disabled={viewMode || isSubmitting}
                                    />
                                    <label htmlFor="front-photo" className={styles.photoLabel}>
                                        <Camera size={16} />
                                        {formData.frontPreview || formData.photo_front_url ? 'Cambiar foto frontal' : 'Agregar foto frontal'}
                                    </label>
                                    {errors.frontFile && (
                                        <span className={styles.errorText}>
                                            <AlertCircle size={14} />
                                            {errors.frontFile}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.photoUpload}>
                                    <h4>Foto Posterior</h4>
                                    <div className={styles.photoPreview}>
                                        {(formData.backPreview || formData.photo_back_url) && (
                                            <div className={styles.previewContainer}>
                                                <img
                                                    src={formData.backPreview || formData.photo_back_url || ''}
                                                    alt="Vista previa posterior"
                                                    className={styles.previewImage}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image.heic"
                                        onChange={handleFileUpload('back')}
                                        className={styles.photoInput}
                                        id="back-photo"
                                        disabled={viewMode || isSubmitting}
                                    />
                                    <label htmlFor="back-photo" className={styles.photoLabel}>
                                        <Camera size={16} />
                                        {formData.backPreview || formData.photo_back_url ? 'Cambiar foto posterior' : 'Agregar foto posterior'}
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
                    </div>

                    {/* Mensaje de Error General */}
                    {errors.submit && (
                        <div className={styles.errorAlert}>
                            <AlertCircle size={20} />
                            <span>{errors.submit}</span>
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
                        {renderActionButtons()}
                    </div>
                </form>
            </div>

            {/* Modal de confirmación */}
            {isModalOpen && (
                <Modal
                    opened={isModalOpen}
                    onClose={handleModalClose}
                    title="¿Descartar cambios?"
                    centered
                >
                    <Text size="sm" style={{ marginBottom: '20px' }}>
                        Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin guardar?
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button variant="outline" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button color="red" onClick={handleModalConfirm}>
                            Descartar
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export const Route = createFileRoute('/RegistrarVehiculo/License')({
    component: License,
});

export default License;
