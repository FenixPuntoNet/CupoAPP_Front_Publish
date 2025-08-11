import { Modal, Group, Text, Badge, Box, Stack, Avatar } from '@mantine/core';
import { 
  Star, 
  Car, 
  Shield, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Vehicle {
  brand?: string | null;
  model?: string | null;
  plate?: string;
  color?: string | null;
  photo_url?: string | null;
  year?: string | number | null;
}

interface DriverModalProps {
  opened: boolean;
  onClose: () => void;
  driverName: string;
  photo: string;
  rating: number;
  vehicle: Vehicle | null;
  license?: string;
  propertyCard?: string;
  soat?: string;
}

export function DriverModal({ 
  opened, 
  onClose, 
  driverName, 
  photo, 
  rating, 
  vehicle,
  license,
  propertyCard,
  soat
}: DriverModalProps) {
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} size={14} fill="var(--mantine-color-yellow-5)" color="var(--mantine-color-yellow-5)" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={14} fill="var(--mantine-color-yellow-5)" color="var(--mantine-color-yellow-5)" style={{ opacity: 0.5 }} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={14} color="var(--mantine-color-gray-4)" />
      );
    }
    
    return stars;
  };

  const getDocumentStatus = (document: string | undefined) => {
    if (!document || document === 'Sin verificar' || document === 'No disponible') {
      return { status: 'pending', color: 'orange', icon: <AlertCircle size={10} />, text: 'Pendiente' };
    }
    return { status: 'verified', color: 'green', icon: <CheckCircle size={10} />, text: 'Ok' };
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Car size={16} color="var(--mantine-color-cyan-6)" />
          <Text size="sm" fw={600} style={{ color: 'white' }}>
            Conductor
          </Text>
        </Group>
      }
      size="xs"
      centered
      withCloseButton={true}
      styles={{
        content: {
          backgroundColor: 'rgba(20, 20, 20, 0.98)',
          border: '1px solid rgba(0, 255, 157, 0.3)',
          borderRadius: '8px',
          maxHeight: '65vh',
          overflow: 'hidden',
          width: '360px !important',
          maxWidth: '90vw'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          paddingBottom: '6px',
          marginBottom: '4px',
          padding: '10px 14px 6px 14px'
        },
        close: {
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          width: '24px',
          height: '24px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white'
          }
        },
        body: {
          padding: '10px',
          maxHeight: 'calc(65vh - 50px)',
          overflowY: 'auto'
        }
      }}
    >
      <Stack gap="xs">
        {/* Información Personal del Conductor - Ultra Compacta */}
        <Box
          p="xs"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '6px'
          }}
        >
          <Group gap="xs" align="center">
            <Avatar
              src={photo}
              size={40}
              style={{
                border: '2px solid var(--mantine-color-blue-5)',
                borderRadius: '50%'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/40x40/2563eb/ffffff?text=👤';
              }}
            />
            
            <Box flex={1}>
              <Text size="sm" fw={600} style={{ color: 'white', marginBottom: '2px' }}>
                {driverName || 'Conductor'}
              </Text>
              
              <Group gap="xs" mb="xs">
                {renderStars(rating || 0)}
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  ({rating ? rating.toFixed(1) : '0.0'})
                </Text>
              </Group>
              
              <Badge 
                size="xs" 
                variant="light" 
                color="blue"
                leftSection={<Shield size={8} />}
              >
                Verificado
              </Badge>
            </Box>
          </Group>
        </Box>

        {/* Vehículo y Documentación Unificados - Ultra Compacto */}
        <Box
          p="xs"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '6px'
          }}
        >
          {/* Vehículo */}
          <Group gap="xs" mb="xs">
            <Car size={12} color="var(--mantine-color-green-6)" />
            <Text size="xs" fw={600} style={{ color: 'white' }}>
              Vehículo
            </Text>
          </Group>
          
          <Group gap="xs" mb="xs" align="center">
            {vehicle?.photo_url && (
              <Box
                style={{
                  width: '28px',
                  height: '20px',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid var(--mantine-color-green-5)',
                  backgroundImage: `url(${vehicle.photo_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            
            <Box flex={1}>
              <Text size="xs" style={{ color: 'white' }}>
                {vehicle?.brand && vehicle?.model 
                  ? `${vehicle.brand} ${vehicle.model}` 
                  : 'Vehículo'}
              </Text>
              <Group gap="xs">
                <Badge size="xs" variant="filled" color="green">
                  {vehicle?.plate || 'Sin placa'}
                </Badge>
                {vehicle?.year && (
                  <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {vehicle.year}
                  </Text>
                )}
              </Group>
            </Box>
          </Group>
          
          {/* Documentación Compacta */}
          <Group gap="xs" mb="xs">
            <FileText size={12} color="var(--mantine-color-violet-6)" />
            <Text size="xs" fw={600} style={{ color: 'white' }}>
              Documentos
            </Text>
          </Group>
          
          <Group gap="xs">
            <Badge 
              size="xs" 
              variant="light" 
              color={getDocumentStatus(license).color}
              leftSection={getDocumentStatus(license).icon}
            >
              Licencia
            </Badge>
            <Badge 
              size="xs" 
              variant="light" 
              color={getDocumentStatus(propertyCard).color}
              leftSection={getDocumentStatus(propertyCard).icon}
            >
              Propiedad
            </Badge>
            <Badge 
              size="xs" 
              variant="light" 
              color={getDocumentStatus(soat).color}
              leftSection={getDocumentStatus(soat).icon}
            >
              SOAT
            </Badge>
          </Group>
        </Box>

        {/* Verificación Ultra Compacta */}
        <Group 
          gap="xs" 
          justify="center" 
          p="xs" 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Shield size={10} color="var(--mantine-color-green-5)" />
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Verificado por CupoApp
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
}
