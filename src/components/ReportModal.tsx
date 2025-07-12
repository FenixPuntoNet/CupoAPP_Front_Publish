import React, { useState } from 'react';
import { Modal, Button, Text, Textarea, Group, Select, Alert } from '@mantine/core';
import { IconFlag, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { reportContent } from '@/lib/contentModeration';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  opened: boolean;
  onClose: () => void;
  contentType: 'message' | 'profile' | 'trip';
  contentId: number;
  reporterId: string;
  targetUserName?: string;
}

const reportReasons = [
  { value: 'spam', label: 'Spam o contenido repetitivo' },
  { value: 'harassment', label: 'Acoso o intimidación' },
  { value: 'offensive_language', label: 'Lenguaje ofensivo o inapropiado' },
  { value: 'discrimination', label: 'Discriminación o hate speech' },
  { value: 'inappropriate_content', label: 'Contenido inapropiado' },
  { value: 'personal_information', label: 'Compartir información personal' },
  { value: 'illegal_activity', label: 'Actividad ilegal' },
  { value: 'fake_profile', label: 'Perfil falso o suplantación' },
  { value: 'other', label: 'Otro' }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  opened,
  onClose,
  contentType,
  contentId,
  reporterId,
  targetUserName
}) => {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Por favor selecciona una razón para el reporte');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await reportContent(
        reporterId,
        contentType,
        contentId,
        reason,
        description.trim() || undefined
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(result.error || 'Error al enviar el reporte');
      }
    } catch (err) {
      setError('Error inesperado al enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconFlag size={20} className="text-red-500" />
          <Text size="lg" fw={600}>
            Reportar {contentType === 'message' ? 'mensaje' : contentType === 'profile' ? 'perfil' : 'viaje'}
          </Text>
        </Group>
      }
      centered
      size="md"
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        body: styles.modalBody
      }}
    >
      {success ? (
        <div className="text-center py-6">
          <IconCheck size={48} className="text-green-500 mx-auto mb-4" />
          <Text size="lg" fw={600} className="text-green-600 mb-2">
            Reporte enviado exitosamente
          </Text>
          <Text size="sm" className="text-gray-600">
            Nuestro equipo revisará tu reporte en las próximas 24 horas
          </Text>
        </div>
      ) : (
        <div>
          {targetUserName && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              color="yellow"
              className="mb-4"
            >
              Estás reportando contenido de <strong>{targetUserName}</strong>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Text size="sm" fw={500} className="mb-2">
                Razón del reporte *
              </Text>
              <Select
                data={reportReasons}
                value={reason}
                onChange={(value) => setReason(value || '')}
                placeholder="Selecciona una razón"
                className={styles.select}
              />
            </div>

            <div>
              <Text size="sm" fw={500} className="mb-2">
                Descripción adicional (opcional)
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Proporciona detalles adicionales que puedan ayudar a nuestro equipo a entender el problema..."
                rows={4}
                maxLength={500}
                className={styles.textarea}
              />
              <Text size="xs" className="text-gray-500 mt-1">
                {description.length}/500 caracteres
              </Text>
            </div>

            {error && (
              <Alert color="red" className="mb-2">
                {error}
              </Alert>
            )}

            <Group justify="flex-end" gap="sm" className="mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                loading={loading}
                className={styles.submitButton}
              >
                Enviar reporte
              </Button>
            </Group>
          </div>

          <div className={styles.importantNote}>
            <Text size="xs" className={styles.importantText}>
              <strong>Importante:</strong> Los reportes falsos o malintencionados pueden resultar en acciones disciplinarias en tu cuenta. Solo reporta contenido que genuinamente viole nuestras normas de comunidad.
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
};
