import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Textarea,
  Group,
  Text,
  Rating,
  LoadingOverlay,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getTripRating, submitRating } from '@/services/ratings';
import styles from './index.module.css';

interface TripRatingProps {
  tripId: number;
  driverId: string;
  userId: string;
  opened: boolean;
  onClose: () => void;
}

export const TripRating: React.FC<TripRatingProps> = ({
  tripId,
  driverId,
  userId,
  opened,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    const fetchExistingRating = async () => {
      setLoading(true);
      setRating(0);
      setReport('');
      setIsExisting(false);

      const result = await getTripRating(tripId);

      if (!result.success) {
        // Solo mostrar error si no es un 404 (que es normal cuando no hay calificación)
        if (!result.error?.includes('Not Found')) {
          notifications.show({
            color: 'red',
            title: 'Error al cargar calificación',
            message: result.error || 'No se pudo cargar tu experiencia previa.',
          });
        }
      } else if (result.data?.rating) {
        setRating(result.data.rating.value);
        setReport(result.data.rating.report || '');
        setIsExisting(true);
      }

      setLoading(false);
    };

    if (opened && tripId && userId) {
      fetchExistingRating();
    }
  }, [tripId, userId, opened]);

  const handleSubmit = async () => {
    if (rating === 0) {
      notifications.show({
        color: 'yellow',
        title: '¡Ups!',
        message: 'Selecciona una puntuación para compartir tu experiencia.',
      });
      return;
    }

    setLoading(true);

    // Log para debugging - información detallada
    console.log('🚀 [TripRating] Submitting rating with data:', {
      trip_id: tripId,
      driver_id: driverId,
      value: rating,
      report: report.trim() || undefined,
      user_id: userId,
      driver_id_type: typeof driverId,
      driver_id_length: driverId?.length,
      is_driver_id_unknown: driverId === 'unknown',
      is_driver_id_valid: driverId !== 'unknown' && driverId.length > 0
    });

    const result = await submitRating({
      trip_id: tripId,
      driver_id: driverId,
      value: rating,
      report: report.trim() || undefined,
    });

    console.log('📊 Rating submission result:', result);

    setLoading(false);

    if (!result.success) {
      console.error('❌ Rating submission failed:', result.error);
      notifications.show({
        color: 'red',
        title: 'Algo salió mal',
        message: result.error || 'No pudimos guardar tu calificación. Intenta de nuevo.',
      });
    } else {
      console.log('✅ Rating submitted successfully');
      notifications.show({
        color: 'teal',
        title: '¡Gracias por tu feedback!',
        message: 'Tu opinión ayuda a mejorar la experiencia para todos 🚗✨',
      });

      setIsExisting(true);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Tu opinión importa"
      centered
      overlayProps={{ blur: 3, opacity: 0.45 }}
      classNames={{ body: styles.modalBody, title: styles.modalTitle }}
    >
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

      {isExisting ? (
        <>
          <Text className={styles.label}>Ya calificaste este viaje:</Text>
          <Rating size="xl" value={rating} readOnly className={styles.rating} />
          <Divider my="sm" className={styles.divider} />
          <Textarea
            label="Tu comentario"
            value={report}
            readOnly
            autosize
            minRows={3}
            className={styles.textarea}
          />
          <Group mt="lg" justify="right">
            <Button onClick={onClose} className={styles.closeButton}>Cerrar</Button>
          </Group>
        </>
      ) : (
        <>
          <Text className={styles.label}>¿Cómo fue tu experiencia?</Text>
          <Rating size="xl" value={rating} onChange={setRating} className={styles.rating} />
          <Divider my="sm" className={styles.divider} />
          <Textarea
            label="Comentario (opcional)"
            placeholder="¿Algo que quieras destacar o mejorar?"
            value={report}
            onChange={(e) => setReport(e.currentTarget.value)}
            autosize
            minRows={3}
            className={styles.textarea}
          />
          <Group mt="lg" justify="right">
            <Button variant="subtle" onClick={onClose} className={styles.closeButton}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className={styles.submitButton}>
              Enviar opinión
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
};
