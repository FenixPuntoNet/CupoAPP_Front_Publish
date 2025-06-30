import type React from 'react';
import { useState } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { 
  FileText, 
  Shield, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Upload,
  AlertCircle
} from 'lucide-react';
import { 
  DOCUMENT_TYPES, 
  type DocumentType, 
  type DocumentStatus 
} from '../../types/FormsVehicle';
import styles from './DocumentsRequired.module.css';

const DocumentsRequired: React.FC = () => {
  const navigate = useNavigate();
  const [documentsStatus] = useState<DocumentStatus[]>(
    DOCUMENT_TYPES.map(doc => ({
      id: doc.id,
      complete: false,
      required: doc.required
    }))
  );

  const completedDocs = documentsStatus.filter(doc => doc.complete).length;
  const totalRequiredDocs = documentsStatus.filter(doc => doc.required).length;
  const progress = (completedDocs / totalRequiredDocs) * 100;

  const handleDocumentClick = (docId: DocumentType) => {
    if (docId === 'property') {
      navigate({ to: '/RegistrarVehiculo/PropertyCard' });
    } else if (docId === 'insurance') {
      navigate({ to: '/RegistrarVehiculo/Soat' });
    } else if (docId === 'license') {      // Agregar esta condición
      navigate({ to: '/RegistrarVehiculo/License' });
    } else {
      navigate({
        to: '/RegistrarVehiculo/DocumentForm',
        search: { type: docId }
      });
    }
  };

  const getStatusComponent = (doc: DocumentStatus) => {
    if (doc.complete) {
      return (
        <div className={`${styles.documentStatus} ${styles.statusComplete}`}>
          <CheckCircle size={16} /> Completado
        </div>
      );
    }
    if (doc.required) {
      return (
        <div className={`${styles.documentStatus} ${styles.statusPending}`}>
          <AlertCircle size={16} /> Requerido
        </div>
      );
    }
    return (
      <div className={`${styles.documentStatus} ${styles.statusPending}`}>
        <Clock size={16} /> Pendiente
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.gradientBackground} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.navigationHeader}>
            <button
              onClick={() => navigate({ to: '/RegistrarVehiculo' })}
              className={styles.backButton}
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
          </div>
          
          <h1 className={styles.title}>Documentos Requeridos</h1>
          <p className={styles.subtitle}>
            Complete la información de los documentos necesarios para el registro
          </p>

          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={styles.uploadGrid}>
          {DOCUMENT_TYPES.map((doc) => {
            const status = documentsStatus.find(d => d.id === doc.id);
            return (
              <div key={doc.id} className={styles.uploadCard}>
                {doc.required && (
                  <div className={`${styles.documentBadge} ${
                    status?.complete ? styles.badgeComplete : styles.badgeRequired
                  }`}>
                    {status?.complete ? '✓' : '!'}
                  </div>
                )}
                
                <div className={styles.uploadCardContent}>
                  <div className={styles.iconContainer}>
                    {doc.icon === 'Shield' ? (
                      <Shield size={32} className={styles.uploadIcon} />
                    ) : (
                      <FileText size={32} className={styles.uploadIcon} />
                    )}
                  </div>
                  
                  <span className={styles.uploadCardTitle}>{doc.title}</span>
                  <p className={styles.uploadCardDescription}>
                    {doc.description}
                  </p>
                  
                  {status && getStatusComponent(status)}
                  
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <Upload size={20} />
                    {status?.complete ? 'Editar documento' : 'Agregar documento'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {progress === 100 && (
          <div className={styles.summarySection}>
            <h2 className={styles.title}>¡Documentos Completos!</h2>
            <p className={styles.subtitle}>
              Todos los documentos requeridos han sido cargados correctamente
            </p>
            
            <div className={styles.summaryActions}>
              <button 
                className={styles.buttonSecondary}
                onClick={() => navigate({ to: '/RegistrarVehiculo' })}
              >
                Revisar Documentos
              </button>
              <button 
                className={styles.buttonPrimary}
                onClick={() => navigate({ to: '/Perfil' })}
              >
                Finalizar Registro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/RegistrarVehiculo/DocumentsRequired')({
  component: DocumentsRequired,
});

export default DocumentsRequired;