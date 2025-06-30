import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
    ArrowLeft,
    Camera,
    Calendar,
    Heart,
    FileText,
    Shield,
    AlertCircle,
    CheckCircle,
    User,
} from 'lucide-react';
import {
    type DocumentFormData,
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
import { supabase } from '@/lib/supabaseClient';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';



interface ValidationErrors {
    [key: string]: string;
}

interface DriverLicenseData extends Omit<DocumentFormData, 'vehicle_id' | 'documentType' | 'identificationNumber'> {
    id?: number;
    photo_front_url?: string | null;
    photo_back_url?: string | null;
    expedition_date?: string;
    expiry_date?: string;
    user_id?: string;
    frontFile?: File;
    backFile?: File;
    licenseNumber?: string;
    identificationNumber?: string | null; // ahora es válido
  }
  

interface UserProfileData {
    identification_number: string | null;
    identification_type: string;
}

const License: React.FC = () => {
    const navigate = useNavigate();
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
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [licenseId, setLicenseId] = useState<number | null>(null);
    const [] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formHasChanged, setFormHasChanged] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('identification_number, identification_type')
                .eq('user_id', userId)
                .single();

            if (error) {
                showErrorNotification('Error al cargar datos del perfil');
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    useEffect(() => {
        const loadLicenseData = async () => {
            try {
                setLoading(true);

                // Obtener sesión y validar
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                    navigate({ to: '/Login' });
                    return;
                }

                const userId = session.user.id;
                console.log('Loading license data for user:', userId);

                // Cargar datos de la licencia existente primero
                const { data: existingLicense } = await supabase
                    .from('driver_licenses')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existingLicense) {
                    // Si existe licencia, guardar su ID
                    setLicenseId(existingLicense.id);
                    setHasLicense(true);
                }

                // Cargar datos del perfil primero
                const profileData = await fetchUserProfile(userId);
                if (!profileData) {
                    showErrorNotification('Debe completar su perfil primero');
                    navigate({ to: '/CompletarRegistro' });
                    return;
                }
                setUserProfile(profileData);

                // Obtener primero el vehículo asociado
                const { data: vehicleData, error: vehicleError } = await supabase
                    .from('vehicles')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (vehicleError) {
                    console.error('Error fetching vehicle:', vehicleError);
                    throw new Error('Debe registrar primero un vehículo');
                }

                // Consultar datos de la licencia
                const { data: licenseData, error: licenseError } = await supabase
                    .from('driver_licenses')
                    .select('id, license_number, identification_number, blood_type, license_category, expedition_date, expiration_date, photo_front_url, photo_back_url')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (licenseError && licenseError.code !== 'PGRST116') {
                    throw licenseError;
                }

                if (licenseData) {
                    console.log('Found existing license:', licenseData);
                    setHasLicense(true);
                    setFormData({
                        licenseNumber: licenseData.license_number || '',
                        expeditionDate: licenseData.expedition_date?.split('T')[0] || '',
                        expiryDate: licenseData.expiration_date?.split('T')[0] || '',
                        bloodType: licenseData.blood_type || 'O+',
                        licenseCategory: licenseData.license_category || 'B1',
                        identificationNumber: licenseData.identification_number ?? undefined,
                        photo_front_url: licenseData.photo_front_url ?? undefined,
                        photo_back_url: licenseData.photo_back_url ?? undefined,
                        frontPreview: undefined,
                        backPreview: undefined,
                        frontFile: undefined,
                        backFile: undefined
                    });
                    setViewMode(true);
                } else {
                    console.log('No existing license found');
                    setFormData(prev => ({
                        ...prev,
                        identificationNumber: profileData.identification_number
                    }));
                    setHasLicense(false);
                    setViewMode(false);
                }

                setVehicleId(vehicleData.id);

            } catch (error: any) {
                console.error('Error loading license data:', error);
                showErrorNotification(error.message);
                if (error.message.includes('vehículo')) {
                    navigate({ to: '/RegistrarVehiculo' });
                }
            } finally {
                setLoading(false);
            }
        };

        loadLicenseData();
    }, [navigate]);

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
                newErrors.expeditionDate = 'La fecha de expedición no puede ser posterior a la fecha de vencimiento';
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

    const uploadPhoto = async (file: File, type: 'front' | 'back', userId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Date.now()}.${fileExt}`;
            const filePath = `VehiclesDocuments/${userId}/${fileName}`;
    
            const { error: uploadError } = await supabase.storage
                .from('Resources')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: '3600'
                });
    
            if (uploadError) throw uploadError;
    
            const { data } = supabase.storage.from('Resources').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error(`Error uploading ${type} photo:`, error);
            return null;
        }
    };
    

    const showSuccessModal = () => {
        modals.open({
            title: 'Operación Exitosa',
            children: (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircle size={50} color="green" style={{ marginBottom: '15px' }} />
                    <Text size="lg">
                        {hasLicense ? 'Licencia actualizada correctamente' : 'Licencia registrada correctamente'}
                    </Text>
                    <Button
                        onClick={() => {
                            modals.closeAll();
                            navigate({ to: '/Perfil' });
                        }}
                        style={{ marginTop: '20px' }}
                    >
                        Aceptar
                    </Button>
                </div>
            ),
            closeOnClickOutside: false,
            closeOnEscape: false,
        });
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId || !vehicleId) {
                throw new Error('Información de usuario o vehículo no disponible');
            }

            // Preparar datos base
            if (!formData.licenseNumber) {
                throw new Error('Número de licencia es requerido');
            }
            
            const licenseData = {
                user_id: userId,
                vehicle_id: vehicleId,
                license_number: formData.licenseNumber.trim(),
                identification_number: userProfile?.identification_number ?? null,
                expedition_date: new Date(formData.expeditionDate).toISOString(),
                expiration_date: new Date(formData.expiryDate).toISOString(),
                license_category: formData.licenseCategory || 'B1',
                blood_type: formData.bloodType || 'O+',
                photo_front_url: formData.photo_front_url ?? null,
                photo_back_url: formData.photo_back_url ?? null
            };

            // Procesar fotos solo si se subieron nuevas
            if (formData.frontFile) {
                const frontUrl = await uploadPhoto(formData.frontFile, 'front', userId);
                if (frontUrl) licenseData.photo_front_url = frontUrl;
            }

            if (formData.backFile) {
                const backUrl = await uploadPhoto(formData.backFile, 'back', userId);
                if (backUrl) licenseData.photo_back_url = backUrl;
            }

            if (hasLicense && licenseId) {
                // Actualizar licencia existente
                const { error: updateError } = await supabase
                    .from('driver_licenses')
                    .update(licenseData)
                    .eq('id', licenseId);

                if (updateError) throw updateError;

                // Actualizar estado local después de actualización exitosa
                setFormData(prev => ({
                    ...prev,
                    ...licenseData,
                    expeditionDate: licenseData.expedition_date.split('T')[0],
                    expiryDate: licenseData.expiration_date.split('T')[0],
                }));

                notifications.show({
                    title: 'Actualización Exitosa',
                    message: 'Los cambios han sido guardados correctamente',
                    color: 'green',
                    icon: <CheckCircle />
                });

                setViewMode(true); // Volver a modo vista
                setFormHasChanged(false);
            } else {
                // Crear nueva licencia
                const { data: newLicense, error: insertError } = await supabase
                    .from('driver_licenses')
                    .insert([licenseData])
                    .select()
                    .single();

                if (insertError) throw insertError;

                if (newLicense) {
                    setLicenseId(newLicense.id);
                    setHasLicense(true);
                    showSuccessModal();
                    setViewMode(true);
                }
            }

        } catch (error: any) {
            console.error('Error:', error);
            showErrorNotification(
                error.message || 'Error al procesar la licencia. Por favor, intente nuevamente.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = () => {
        setViewMode(false); // Desbloquear campos
        setFormHasChanged(false);
        notifications.show({
            title: 'Modo Edición Activado',
            message: 'Ahora puedes modificar los datos de tu licencia',
            color: 'blue',
            icon: <FileText />
        });
    };

    const loadLicenseData = async () => {
        try {
            setLoading(true);

            // Obtener sesión y validar
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                navigate({ to: '/Login' });
                return;
            }

            const userId = session.user.id;
            console.log('Loading license data for user:', userId);

            // Cargar datos de la licencia existente primero
            const { data: existingLicense } = await supabase
                .from('driver_licenses')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (existingLicense) {
                // Si existe licencia, guardar su ID
                setLicenseId(existingLicense.id);
                setHasLicense(true);
            }

            // Cargar datos del perfil primero
            const profileData = await fetchUserProfile(userId);
            if (!profileData) {
                showErrorNotification('Debe completar su perfil primero');
                navigate({ to: '/CompletarRegistro' });
                return;
            }
            setUserProfile(profileData);

            // Obtener primero el vehículo asociado
            const { data: vehicleData, error: vehicleError } = await supabase
                .from('vehicles')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (vehicleError) {
                console.error('Error fetching vehicle:', vehicleError);
                throw new Error('Debe registrar primero un vehículo');
            }

            // Consultar datos de la licencia
            const { data: licenseData, error: licenseError } = await supabase
                .from('driver_licenses')
                .select('id, license_number, identification_number, blood_type, license_category, expedition_date, expiration_date, photo_front_url, photo_back_url')
                .eq('user_id', userId)
                .maybeSingle();

            if (licenseError && licenseError.code !== 'PGRST116') {
                throw licenseError;
            }

            if (licenseData) {
                console.log('Found existing license:', licenseData);
                setHasLicense(true);
                setFormData({
                    licenseNumber: licenseData.license_number || '',
                    expeditionDate: licenseData.expedition_date?.split('T')[0] || '',
                    expiryDate: licenseData.expiration_date?.split('T')[0] || '',
                    bloodType: licenseData.blood_type || 'O+',
                    licenseCategory: licenseData.license_category || 'B1',
                    identificationNumber: licenseData.identification_number ?? undefined,
                    photo_front_url: licenseData.photo_front_url ?? undefined,
                    photo_back_url: licenseData.photo_back_url ?? undefined,
                    frontPreview: undefined,
                    backPreview: undefined,
                    frontFile: undefined,
                    backFile: undefined
                });
                setViewMode(true);
            } else {
                console.log('No existing license found');
                setFormData(prev => ({
                    ...prev,
                    identificationNumber: profileData.identification_number
                }));
                setHasLicense(false);
                setViewMode(false);
            }

            setVehicleId(vehicleData.id);

        } catch (error: any) {
            console.error('Error loading license data:', error);
            showErrorNotification(error.message);
            if (error.message.includes('vehículo')) {
                navigate({ to: '/RegistrarVehiculo' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (formHasChanged) {
            // Mostrar confirmación si hay cambios
            modals.openConfirmModal({
                title: 'Cancelar edición',
                children: (
                    <Text>¿Estás seguro de que deseas cancelar la edición? Los cambios no guardados se perderán.</Text>
                ),
                labels: { confirm: 'Sí, cancelar', cancel: 'Seguir editando' },
                confirmProps: { color: 'red' },
                onConfirm: () => {
                    setViewMode(true);
                    setFormHasChanged(false);
                    // Recargar datos originales
                    loadLicenseData();
                },
            });
        } else {
            setViewMode(true);
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

    const renderIdentificationField = () => (
        <div className={styles.formGroup}>
            <label className={styles.label}>
                <User size={16} className={styles.labelIcon} />
                Número de Identificación
            </label>
            <TextInput
              value={formData.identificationNumber ?? ''}
              disabled={true}
              className={`${styles.input} ${styles.disabledInput}`}
            />
            
            <small className={styles.helperText}>
                Este campo no es editable y se obtiene de su perfil
            </small>
        </div>
    );

    const renderTextField = (label: string, name: keyof typeof formData, icon: React.ReactNode) => (
        <div className={styles.formGroup}>
            <label className={styles.label}>
                {icon}
                {label}
            </label>
            <TextInput
                type="text" // Explicitly set the type to "text"
                name={name}    // Set the name attribute to match the formData key
                value={formData[name]?.toString() || ''}
                onChange={(e) => handleInputChange(name, e.currentTarget.value)}
                disabled={viewMode}
                className={`${styles.input} ${viewMode ? styles.viewModeInput : ''}`}
                error={errors[name]}
            />
        </div>
    );

    const renderDateField = (label: string, name: keyof typeof formData, icon: React.ReactNode) => (
        <div className={styles.formGroup}>
            <label className={styles.label}>
                {icon}
                {label}
            </label>
            <TextInput
                type="date"
                name={name}    // Set the name attribute to match the formData key
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
                    >
                        <FileText size={20} />
                        Editar Licencia
                    </button>
                );
            } else {
                return (
                    <>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className={styles.buttonSecondary}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.buttonPrimary}
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
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </>
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
                <div className={styles.gradientBackground} />
                <div className={styles.loadingContainer}>
                    <span className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
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
                    <button
                        onClick={handleBack}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={20} />
                        <span>Volver</span>
                    </button>
                    <h1 className={styles.title}>Licencia de Conducción</h1>
                </div>
                <form onSubmit={handleSubmit} className={`${styles.form} ${!viewMode ? styles.editing : ''}`} >
                    {/* Información de la Licencia */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FileText className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Información de la Licencia</h2>
                        </div>
                        <div className={styles.formGrid}>
                             {renderTextField(
                                  'Número de Licencia',
                                  'licenseNumber',
                                  <Shield size={16} className={styles.labelIcon} />
                              )}
                            {renderIdentificationField()}
                             <div className={styles.formGroup}>
                                 <label className={styles.label}>
                                     <Shield size={16} className={styles.labelIcon} />
                                     Categoría
                                 </label>
                                 <Select
                                     name="licenseCategory"
                                     value={formData.licenseCategory}
                                     onChange={(value) => handleInputChange('licenseCategory', value || '')}
                                     className={styles.select}
                                     disabled={viewMode || isSubmitting}
                                     data={LICENSE_CATEGORIES.map(category => ({ value: category.value, label: category.label }))}
                                 />
                             </div>
                             <div className={styles.formGroup}>
                                 <label className={styles.label}>
                                     <Heart size={16} className={styles.labelIcon} />
                                     Tipo de Sangre
                                 </label>
                                 <Select
                                     name="bloodType"
                                     value={formData.bloodType}
                                     onChange={(value) => handleInputChange('bloodType', value || '')}
                                     className={styles.select}
                                     disabled={viewMode || isSubmitting}
                                     data={BLOOD_TYPES.map(type => ({ value: type, label: type }))}
                                 />
                             </div>
                             {renderDateField(
                                  'Fecha de Expedición',
                                  'expeditionDate',
                                  <Calendar size={16} className={styles.labelIcon} />
                              )}
                             {renderDateField(
                                  'Fecha de Vencimiento',
                                  'expiryDate',
                                  <Calendar size={16} className={styles.labelIcon} />
                              )}
                        </div>
                    </div>
                    {/* Fotos del Documento */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Camera className={styles.sectionIcon} size={24} />
                            <h2 className={styles.sectionTitle}>Fotos de la Licencia</h2>
                        </div>
                        <div className={styles.photosGrid}>
                            {/* Foto Frontal */}
                            <div className={styles.photoUpload}>
                                <div className={styles.photoPreview}>
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
                                                Cara frontal
                                            </span>
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
                            {/* Foto Posterior */}
                            <div className={styles.photoUpload}>
                                <div className={styles.photoPreview}>
                                    {formData.backPreview || formData.photo_back_url ? (
                                        <img
                                            src={formData.backPreview || formData.photo_back_url || ""}
                                            alt="Cara posterior"
                                            className={styles.previewImage}
                                        />
                                    ) : (
                                        <div className={styles.photoPlaceholder}>
                                            <Camera size={40} className={styles.placeholderIcon} />
                                            <span className={styles.placeholderText}>
                                                Cara posterior
                                            </span>
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
        </div>
    );
};

export const Route = createFileRoute('/RegistrarVehiculo/License')({
    component: License,
});

export default License;