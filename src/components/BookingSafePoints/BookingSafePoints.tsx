import {
  Group,
  Text,
  Stack,
  Button,
  Modal,
  Alert
} from '@mantine/core';
import {
  MapPin
} from 'lucide-react';
import BookingSafePointSelector from '@/components/BookingSafePointSelector/BookingSafePointSelector';

interface BookingSafePointsProps {
  bookingId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingSafePoints({ bookingId, isOpen, onClose }: BookingSafePointsProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <MapPin size={20} />
          <Text fw={600}>SafePoints del Booking</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        <Alert color="blue" variant="light">
          <Text size="sm">
            🎉 ¡Componente actualizado! Ahora puedes seleccionar tus puntos de encuentro directamente.
          </Text>
        </Alert>

        <BookingSafePointSelector
          bookingId={bookingId}
          onSelectionChange={(hasSelections) => {
            console.log('SafePoint selections changed:', hasSelections);
          }}
        />

        <Group justify="flex-end">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
