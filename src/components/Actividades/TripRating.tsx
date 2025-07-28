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
import { getExistingRating, submitRating } from '@/services/ratings';
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
      if (!opened || !tripId) return;
      
      setLoading(true);
      setRating(0);
      setReport('');
      setIsExisting(false);

      console.log('⭐ [TripRating] Fetching existing rating for trip:', tripId);
      
      const result = await getExistingRating(tripId);

      if (result.success && result.data) {
        console.log('⭐ [TripRating] Found existing rating:', result.data);
        setRating(result.data.value);
        setReport(result.data.report || '');
        setIsExisting(true);
      } else if (result.success && !result.data) {
        console.log('⭐ [TripRating] No existing rating found - new rating');
        setIsExisting(false);
      } else if (result.error) {
        console.log('⭐ [TripRating] Error fetching rating:', result.error);
        // Si hay error, asumir que no existe calificación y permitir crear una nueva
        setIsExisting(false);
      }

      setLoading(false);
    };

    fetchExistingRating();
  }, [opened, tripId, userId]);

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

    console.log('⭐ [TripRating] Submitting rating:', {
      trip_id: tripId,
      driver_id: driverId,
      value: rating,
      report
    });

    const result = await submitRating({
      trip_id: tripId,
      driver_id: driverId,
      value: rating,
      report,
    });

    setLoading(false);

    if (result.success) {
      notifications.show({
        color: 'teal',
        title: '¡Gracias por tu feedback!',
        message: 'Tu opinión ayuda a mejorar la experiencia para todos 🚗✨',
      });

      setIsExisting(true);
      onClose(); // Cerrar el modal después de enviar exitosamente
    } else {
      notifications.show({
        color: 'red',
        title: 'Algo salió mal',
        message: result.error || 'No pudimos guardar tu calificación. Intenta de nuevo.',
      });
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
