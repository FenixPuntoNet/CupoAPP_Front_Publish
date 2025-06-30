import type React from 'react';
import { useState } from 'react';
import { useNavigate, useSearch, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { DocumentFormData, DocumentType } from '../../types/DocumentTypes';

import styles from './DocumentForm.module.css';

const validateFileSize = (file: File): boolean => file.size <= 5 * 1024 * 1024; // 5MB
const validateFileType = (file: File): boolean =>
  ['image/jpeg', 'image/png', 'image/heic'].includes(file.type);

const DocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({
    from: '/RegistrarVehiculo/DocumentForm',
  });

  const type = (search.type as DocumentType) || 'property';

  const [formData, setFormData] = useState<DocumentFormData>({
    documentType: type,
    expeditionDate: '',
    expiryDate: '',

  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

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
    (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!validateFileType(file)) {
        setErrors((prev) => ({
          ...prev,
          [side]: 'Formato no soportado. Use JPG, PNG o HEIC',
        }));
        return;
      }

      if (!validateFileSize(file)) {
        setErrors((prev) => ({
          ...prev,
          [side]: 'El archivo no debe exceder 5MB',
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [`${side}File`]: file,
          [`${side}Preview`]: reader.result as string,
        }));
        if (errors[side]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[side];
            return newErrors;
          });
        }
      };
      reader.readAsDataURL(file);
    };

  const handleBack = () => navigate({ to: '/RegistrarVehiculo' });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.expeditionDate) newErrors.expeditionDate = 'Fecha de expedición requerida';
    if (!formData.expiryDate) newErrors.expiryDate = 'Fecha de vencimiento requerida';
 
    if (!formData.frontFile) newErrors.front = 'Foto frontal requerida';
    if (!formData.backFile) newErrors.back = 'Foto posterior requerida';

    if (type === 'license') {

      if (!formData.licenseCategory) newErrors.licenseCategory = 'Categoría requerida';
      if (!formData.bloodType) newErrors.bloodType = 'Tipo de sangre requerido';
    }

    if (type === 'insurance') {
      if (!formData.insuranceCompany) newErrors.insuranceCompany = 'Aseguradora requerida';
      if (!formData.policyNumber) newErrors.policyNumber = 'Número de póliza requerido';
    }

    if (type === 'property') {
      if (!formData.brand) newErrors.brand = 'Marca requerida';
      if (!formData.model) newErrors.model = 'Modelo requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular envío
      navigate({ to: '/RegistrarVehiculo', search: { section: 'documents' } });
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: 'Error al guardar el documento',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.gradientBackground} />
      <div className={styles.content}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
            <span>Volver</span>
          </button>
          <h1 className={styles.title}>
            {type === 'property' && 'Tarjeta de Propiedad'}
            {type === 'insurance' && 'SOAT'}
            {type === 'license' && 'Licencia de Conducción'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Número de documento:
            <input
              type="text"
              name="documentNumber"
            
              onChange={handleInputChange}
            />
            {errors.documentNumber && <span className={styles.error}>{errors.documentNumber}</span>}
          </label>

          <label>
            Fecha de expedición:
            <input
              type="date"
              name="expeditionDate"
              value={formData.expeditionDate}
              onChange={handleInputChange}
            />
            {errors.expeditionDate && <span className={styles.error}>{errors.expeditionDate}</span>}
          </label>

          <label>
            Foto Frontal:
            <input type="file" onChange={handleFileUpload('front')} />
            {errors.front && <span className={styles.error}>{errors.front}</span>}
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/RegistrarVehiculo/DocumentForm')({
  component: DocumentForm,
  validateSearch: (search: Record<string, unknown>) => ({
    type: (search.type as DocumentType) || 'property',
  }),
});

export default DocumentForm;
