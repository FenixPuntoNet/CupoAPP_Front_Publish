/**
 * 🎨 Componente para mostrar información adicional de notificaciones de forma amigable
 */

import React from 'react';
import { Text, Card, Group, Badge, Avatar, Stack, Grid, Button } from '@mantine/core';
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Users, 
  DollarSign,
  MessageCircle,
  Phone,
  Star,
  Navigation,
  ExternalLink
} from 'lucide-react';

// 🎯 Función helper para navegar (usando window.location por compatibilidad)
const navigateToPage = (path: string) => {
  console.log(`🎯 [DATA-DISPLAY] Navigating to: ${path}`);
  window.location.href = path;
};

// 🚀 Función para determinar la mejor ruta según los datos
const getOptimalRoute = (data: Record<string, any>, action: 'chat' | 'booking' | 'trip') => {
  switch (action) {
    case 'chat':
      return '/Actividades'; // Página de actividades donde está el chat
    case 'booking':
      if (data.bookingId) {
        return `/CuposReservados`; // Página de cupos reservados
      }
      return '/Actividades'; // Fallback a actividades
    case 'trip':
      if (data.tripId) {
        return `/publicarviaje/DetallesViaje`; // Detalles del viaje
      }
      return '/Actividades'; // Fallback a actividades
    default:
      return '/Actividades';
  }
};

interface NotificationDataDisplayProps {
  data: Record<string, any>;
}

// 🎨 Componente principal
export const NotificationDataDisplay: React.FC<NotificationDataDisplayProps> = ({ data }) => {
  // Si no hay datos, no mostrar nada
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // 💬 Renderizar datos de mensaje/chat
  const renderChatData = () => {
    if (data.chatId || data.senderId || data.senderName) {
      return (
        <Card p="md" radius="md" bg="rgba(0, 255, 157, 0.05)" mb="sm">
          <Group gap="sm" align="flex-start">
            <Avatar color="teal" radius="xl" size="sm">
              <MessageCircle size={16} />
            </Avatar>
            <Stack gap={4} flex={1}>
              <Text fw={500} size="sm" c="teal">Información del Chat</Text>
              {data.senderName && (
                <Group gap={8}>
                  <User size={14} />
                  <Text size="sm">{data.senderName}</Text>
                </Group>
              )}
              {data.messagePreview && (
                <Text size="xs" c="dimmed" fs="italic">
                  "{data.messagePreview}"
                </Text>
              )}
              {data.chatId && (
                <Text size="xs" c="dimmed">
                  Chat ID: {data.chatId}
                </Text>
              )}
              
              {/* 🎯 Botón para ir al chat */}
              <Group gap={8} mt="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<MessageCircle size={14} />}
                  onClick={() => navigateToPage(getOptimalRoute(data, 'chat'))}
                >
                  Ir al Chat
                </Button>
                {data.chatId && (
                  <Button
                    size="xs"
                    variant="outline"
                    color="teal"
                    leftSection={<ExternalLink size={14} />}
                    onClick={() => navigateToPage(`/Chat?chatId=${data.chatId}`)}
                  >
                    Abrir Chat Directo
                  </Button>
                )}
              </Group>
            </Stack>
          </Group>
        </Card>
      );
    }
    return null;
  };

  // 🎫 Renderizar datos de reserva
  const renderBookingData = () => {
    if (data.bookingId || data.tripId || data.passengerName || data.seats) {
      return (
        <Card p="md" radius="md" bg="rgba(255, 146, 43, 0.05)" mb="sm">
          <Group gap="sm" align="flex-start">
            <Avatar color="orange" radius="xl" size="sm">
              <Users size={16} />
            </Avatar>
            <Stack gap={6} flex={1}>
              <Text fw={500} size="sm" c="orange">Detalles de la Reserva</Text>
              
              <Grid>
                {data.passengerName && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <User size={14} />
                      <Text size="sm">{data.passengerName}</Text>
                    </Group>
                  </Grid.Col>
                )}
                
                {data.seats && (
                  <Grid.Col span={6}>
                    <Group gap={8}>
                      <Users size={14} />
                      <Text size="sm">{data.seats} cupo{data.seats > 1 ? 's' : ''}</Text>
                    </Group>
                  </Grid.Col>
                )}
                
                {data.destination && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <MapPin size={14} />
                      <Text size="sm">{data.destination}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.price && (
                  <Grid.Col span={6}>
                    <Group gap={8}>
                      <DollarSign size={14} />
                      <Text size="sm">${new Intl.NumberFormat('es-CO').format(data.price)}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.bookingId && (
                  <Grid.Col span={12}>
                    <Text size="xs" c="dimmed">
                      Reserva #{data.bookingId}
                    </Text>
                  </Grid.Col>
                )}
              </Grid>
              
              {/* 🎯 Botones de acción para reservas */}
              <Group gap={8} mt="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<Users size={14} />}
                  onClick={() => navigateToPage(getOptimalRoute(data, 'booking'))}
                >
                  Ver Reservas
                </Button>
                {data.bookingId && (
                  <Button
                    size="xs"
                    variant="outline"
                    color="orange"
                    leftSection={<ExternalLink size={14} />}
                    onClick={() => navigateToPage(`/CuposReservados`)}
                  >
                    Mis Cupos
                  </Button>
                )}
                {(data.tripId || data.passengerName) && (
                  <Button
                    size="xs"
                    variant="filled"
                    color="orange"
                    leftSection={<MessageCircle size={14} />}
                    onClick={() => navigateToPage('/Actividades')}
                  >
                    Contactar
                  </Button>
                )}
              </Group>
            </Stack>
          </Group>
        </Card>
      );
    }
    return null;
  };

  // 🚗 Renderizar datos de viaje
  const renderTripData = () => {
    if (data.tripId || data.driverName || data.changeType || data.destination) {
      return (
        <Card p="md" radius="md" bg="rgba(151, 117, 250, 0.05)" mb="sm">
          <Group gap="sm" align="flex-start">
            <Avatar color="violet" radius="xl" size="sm">
              <Car size={16} />
            </Avatar>
            <Stack gap={6} flex={1}>
              <Text fw={500} size="sm" c="violet">Información del Viaje</Text>
              
              <Grid>
                {data.driverName && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <User size={14} />
                      <Text size="sm">{data.driverName}</Text>
                    </Group>
                  </Grid.Col>
                )}
                
                {data.destination && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <Navigation size={14} />
                      <Text size="sm">{data.destination}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.changeType && (
                  <Grid.Col span={12}>
                    <Badge color="yellow" size="sm" variant="light">
                      Cambio: {data.changeType}
                    </Badge>
                  </Grid.Col>
                )}

                {data.oldValue && data.newValue && (
                  <Grid.Col span={12}>
                    <Group gap={8} align="center">
                      <Text size="xs" c="red" td="line-through">{data.oldValue}</Text>
                      <Text size="xs" c="dimmed">→</Text>
                      <Text size="xs" c="green" fw={500}>{data.newValue}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.departureTime && (
                  <Grid.Col span={6}>
                    <Group gap={8}>
                      <Clock size={14} />
                      <Text size="sm">{new Date(data.departureTime).toLocaleTimeString('es-CO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.departureDate && (
                  <Grid.Col span={6}>
                    <Group gap={8}>
                      <Calendar size={14} />
                      <Text size="sm">{new Date(data.departureDate).toLocaleDateString('es-CO')}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.tripId && (
                  <Grid.Col span={12}>
                    <Text size="xs" c="dimmed">
                      Viaje #{data.tripId}
                    </Text>
                  </Grid.Col>
                )}
              </Grid>
              
              {/* 🎯 Botones de acción para viajes */}
              <Group gap={8} mt="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftSection={<Car size={14} />}
                  onClick={() => navigateToPage('/Actividades')}
                >
                  Ver Viajes
                </Button>
                {data.tripId && (
                  <Button
                    size="xs"
                    variant="outline"
                    color="violet"
                    leftSection={<ExternalLink size={14} />}
                    onClick={() => navigateToPage(getOptimalRoute(data, 'trip'))}
                  >
                    Detalles del Viaje
                  </Button>
                )}
                {data.driverName && (
                  <Button
                    size="xs"
                    variant="filled"
                    color="violet"
                    leftSection={<MessageCircle size={14} />}
                    onClick={() => navigateToPage('/Actividades')}
                  >
                    Contactar Conductor
                  </Button>
                )}
              </Group>
            </Stack>
          </Group>
        </Card>
      );
    }
    return null;
  };

  // 📞 Renderizar información de contacto
  const renderContactData = () => {
    if (data.phone || data.email || data.rating) {
      return (
        <Card p="md" radius="md" bg="rgba(0, 204, 125, 0.05)" mb="sm">
          <Group gap="sm" align="flex-start">
            <Avatar color="green" radius="xl" size="sm">
              <Phone size={16} />
            </Avatar>
            <Stack gap={6} flex={1}>
              <Text fw={500} size="sm" c="green">Información de Contacto</Text>
              
              <Grid>
                {data.phone && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <Phone size={14} />
                      <Text size="sm">{data.phone}</Text>
                    </Group>
                  </Grid.Col>
                )}
                
                {data.email && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <User size={14} />
                      <Text size="sm">{data.email}</Text>
                    </Group>
                  </Grid.Col>
                )}

                {data.rating && (
                  <Grid.Col span={12}>
                    <Group gap={8}>
                      <Star size={14} />
                      <Text size="sm">Calificación: {data.rating}/5</Text>
                    </Group>
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Group>
        </Card>
      );
    }
    return null;
  };

  // 🎯 Renderizar campos adicionales de manera genérica
  const renderGenericData = () => {
    const knownFields = new Set([
      'chatId', 'senderId', 'senderName', 'messagePreview',
      'bookingId', 'tripId', 'passengerName', 'seats', 'destination', 'price',
      'driverName', 'changeType', 'oldValue', 'newValue', 'departureTime', 'departureDate',
      'phone', 'email', 'rating'
    ]);

    const unknownFields = Object.entries(data).filter(([key]) => !knownFields.has(key));

    if (unknownFields.length === 0) {
      return null;
    }

    return (
      <Card p="md" radius="md" bg="rgba(134, 142, 150, 0.05)" mb="sm">
        <Group gap="sm" align="flex-start">
          <Avatar color="gray" radius="xl" size="sm">
            <User size={16} />
          </Avatar>
          <Stack gap={6} flex={1}>
            <Text fw={500} size="sm" c="gray">Información Adicional</Text>
            
            <Grid>
              {unknownFields.map(([key, value]) => (
                <Grid.Col key={key} span={12}>
                  <Group gap={8} align="flex-start">
                    <Text size="xs" fw={500} c="dimmed" tt="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                    <Text size="sm" flex={1}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </Group>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Group>
      </Card>
    );
  };

  return (
    <Stack gap="xs">
      {renderChatData()}
      {renderBookingData()}
      {renderTripData()}
      {renderContactData()}
      {renderGenericData()}
    </Stack>
  );
};

export default NotificationDataDisplay;