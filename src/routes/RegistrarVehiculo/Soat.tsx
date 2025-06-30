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
    RotateCw,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { INSURANCE_COMPANIES } from '../../types/SoatTypes';
import styles from './Soat.module.css';
import { TextInput, Modal, Button, Text } from '@mantine/core';
import { supabase } from '@/lib/supabaseClient';
import { notifications } from '@mantine/notifications';


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
    const [formData, setFormData] = useState<SoatFormData>({
        expedition_date: '',
        expiry_date: '',
        insurance_company: '',
        policy_number: '',
        identification_number: '',
        frontPreview: undefined,
        backPreview: undefined,
    })
    const [initialFormData, ] = useState<SoatFormData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasSoat, setHasSoat] = useState(false);
    const [viewMode, setViewMode] = useState(true);
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [soatId, setSoatId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formHasChanged, setFormHasChanged] = useState(false);
    const [submitMessage, ] = useState<string | null>(null);
     const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
     const [successMessage, setSuccessMessage] = useState<string>('');

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

                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                    navigate({ to: '/Login' });
                    return;
                }

                const userId = session.user.id;

                // Cargar datos del SOAT existente
                const { data: existingSoat } = await supabase
                    .from('soat_details')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existingSoat) {
                    setSoatId(existingSoat.id);
                    setHasSoat(true);
                    setFormData({
                        policy_number: existingSoat.policy_number || '',
                        insurance_company: existingSoat.insurance_company || '',
                        identification_number: existingSoat.identification_number || '',
                        expedition_date: existingSoat.validity_from?.split('T')[0] || '',
                        expiry_date: existingSoat.validity_to?.split('T')[0] || '',
                        photo_front_url: existingSoat.photo_front_url,
                        photo_back_url: existingSoat.photo_back_url
                    });
                    setViewMode(true);
                } else {
                    // Cargar datos del perfil para nuevo SOAT
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('identification_number')
                        .eq('user_id', userId)
                        .single();

                    if (profileData) {
                        setFormData(prev => ({
                            ...prev,
                            identification_number: profileData.identification_number
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
                console.error('Error loading SOAT data:', error);
                showErrorNotification('Error al cargar los datos del SOAT');
            } finally {
                setLoading(false);
            }
        };

        loadSoatData();
    }, [navigate]);

  // Validaciones específicas para SOAT
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

  

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
         if (!formData.insurance_company) {
            newErrors.insurance_company = 'La aseguradora es requerida';
        }
       

       if (!formData.identification_number) {
            newErrors.identification_number = 'El número de identificación es requerido';
       }
      else if (!/^\d+$/.test(formData.identification_number)) {
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


        // Asegúrate de que 'name' sea un string o el tipo correcto
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

        setFormData(prev => ({
            ...prev,
            [`${side}File`]: file,
            [`${side}Preview`]: file.name
        }));

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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId || !vehicleId) {
        throw new Error('Información necesaria no disponible');
      }

      // Preparar datos base
      const soatData = {
        user_id: userId,
        vehicle_id: vehicleId,
        policy_number: formData.policy_number,
        identification_number: formData.identification_number,
        insurance_company: formData.insurance_company,
        validity_from: new Date(formData.expedition_date).toISOString(),
        validity_to: new Date(formData.expiry_date).toISOString(),
        photo_front_url: formData.photo_front_url,
        photo_back_url: formData.photo_back_url
      };

      // Procesar fotos nuevas si existen
      if (formData.frontFile) {
        const frontUrl = await uploadPhoto(formData.frontFile, 'front');
        if (frontUrl) soatData.photo_front_url = frontUrl;
      }

      if (formData.backFile) {
        const backUrl = await uploadPhoto(formData.backFile, 'back');
        if (backUrl) soatData.photo_back_url = backUrl;
      }

      if (hasSoat && soatId) {
        // Actualizar SOAT existente
        const { error: updateError } = await supabase
          .from('soat_details')
          .update(soatData)
          .eq('id', soatId);

        if (updateError) throw updateError;

        notifications.show({
          title: 'SOAT Actualizado',
          message: 'La información del SOAT ha sido actualizada correctamente',
          color: 'green',
          icon: <CheckCircle />,
          autoClose: 4000
        });

        setViewMode(true);
      } else {
        // Crear nuevo SOAT
        const { data: newSoat, error: insertError } = await supabase
          .from('soat_details')
          .insert([soatData])
          .select()
          .single();

        if (insertError) throw insertError;

        if (newSoat) {
          setSoatId(newSoat.id);
          setHasSoat(true);
          showSuccessModal();
        }
      }

      setFormHasChanged(false);

    } catch (error: any) {
      console.error('Error:', error);
      showErrorNotification(error.message || 'Error al procesar el SOAT');
    } finally {
      setIsSubmitting(false);
    }
  };

    //  función para subir fotos
   const uploadPhoto = async (file: File, type: 'front' | 'back'): Promise<string | null> => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error('Usuario no autenticado');
   
       const fileExt = file.name.split('.').pop();
       const fileName = `${type}_${Date.now()}.${fileExt}`;
       const filePath = `VehiclesDocuments/${userId}/soat/${fileName}`;
   
       const { error: uploadError } = await supabase.storage
         .from('Resources')
         .upload(filePath, file, {
           upsert: true,
           cacheControl: '3600'
         });
   
       if (uploadError) throw uploadError;
   
       const { data: { publicUrl } } = supabase.storage
         .from('Resources')
         .getPublicUrl(filePath);
   
       return publicUrl;
     } catch (error) {
       console.error(`Error uploading ${type} photo:`, error);
       return null;
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
                                    disabled={true}
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
                                    disabled={isSubmitting}
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
                                     disabled={isSubmitting}
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
                                    disabled={isSubmitting}
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
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileUpload('front')}
                                    className={styles.photoInput}
                                    id="front-photo"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="front-photo" className={styles.photoLabel}>
                                    <Camera size={16} />
                                    {formData.frontPreview || formData.frontPreview ? 'Cambiar foto frontal' : 'Agregar foto frontal'}
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
                                            <RotateCw size={40} className={styles.placeholderIcon} />
                                            <span className={styles.placeholderText}>
                                                Cara posterior
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileUpload('back')}
                                    className={styles.photoInput}
                                    id="back-photo"
                                     disabled={isSubmitting}
                                />
                                <label htmlFor="back-photo" className={styles.photoLabel}>
                                    <RotateCw size={16} />
                                    {formData.backPreview || formData.backPreview ? 'Cambiar foto posterior' : 'Agregar foto posterior'}
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