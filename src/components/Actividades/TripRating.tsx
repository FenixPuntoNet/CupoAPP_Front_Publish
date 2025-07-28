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
import { supabase } from '@/lib/supabaseClient';
import { notifications } from '@mantine/notifications';
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

      const { data, error } = await supabase
        .from('califications')
        .select('value, report')
        .eq('user_id', userId)
        .eq('trip_id', tripId)
        .maybeSingle();

      if (error) {
        notifications.show({
          color: 'red',
          title: 'Error al cargar calificación',
          message: 'No se pudo cargar tu experiencia previa.',
        });
      } else if (data) {
        setRating(data.value);
        setReport(data.report || '');
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

    const { error } = await supabase.from('califications').insert([
      {
        trip_id: tripId,
        driver_id: driverId,
        user_id: userId,
        value: rating,
        report,
      },
    ]);

    setLoading(false);

    if (error) {
      notifications.show({
        color: 'red',
        title: 'Algo salió mal',
        message: 'No pudimos guardar tu calificación. Intenta de nuevo.',
      });
    } else {
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
