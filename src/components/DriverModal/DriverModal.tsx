import { Drawer, Group, Text, Badge, Box, Stack, Avatar, Image, ActionIcon } from '@mantine/core';
import { 
  Star, 
  Car, 
  FileText, 
  Shield, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import styles from './DriverModal.module.css';

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
        <Star key={i} size={16} fill="currentColor" color="currentColor" className={styles.starFilled} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={16} fill="currentColor" color="currentColor" className={styles.starHalf} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={16} className={styles.starEmpty} />
      );
    }
    
    return stars;
  };

  const getDocumentStatus = (document: string | undefined) => {
    if (!document || document === 'Sin verificar' || document === 'No disponible') {
      return { status: 'pending', color: 'orange', icon: <AlertCircle size={12} />, text: 'Pendiente' };
    }
    return { status: 'verified', color: 'green', icon: <CheckCircle size={12} />, text: 'Verificado' };
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={null}
      position="bottom"
      size="85vh"
      withCloseButton={false}
      classNames={{
        content: styles.drawerContent
      }}
      transitionProps={{
        transition: 'slide-up',
        duration: 400,
        timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Botón X de cierre rojo profesional */}
      <ActionIcon
        onClick={onClose}
        className={styles.closeButton}
      >
        <X size={18} strokeWidth={2.5} />
      </ActionIcon>

      <Box>
        {/* Header con el gradiente mejorado */}
        <Box className={styles.headerGradient}>
          {/* Patrón de fondo sutil */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none'
            }}
          />
          
          {/* Indicador de arrastre */}
          <Box
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '2px',
              zIndex: 1
            }}
          />
          
          <Group align="center" gap="lg" style={{ position: 'relative', zIndex: 1 }}>
            <Box style={{ position: 'relative' }}>
              <Avatar
                src={photo}
                size={70}
                className={styles.driverAvatar}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png';
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Shield size={10} color="white" />
              </Box>
            </Box>
            
            <Box flex={1}>
              <Text size="xl" fw={700} className={styles.primaryText} style={{ marginBottom: '6px' }}>
                {driverName || 'Conductor'}
              </Text>
              
              <Group gap="xs" mb="sm" className={styles.ratingStars}>
                {renderStars(rating || 0)}
                <Text size="md" fw={600} className={styles.primaryText}>
                  {rating ? rating.toFixed(1) : '0.0'}
                </Text>
              </Group>
              
              <Badge className={styles.verifiedBadge}>
                Conductor Verificado
              </Badge>
            </Box>
          </Group>
        </Box>

        <div className={styles.scrollContainer}>
          <Stack gap="sm" p="lg">
            {/* Foto del vehículo grande y prominente */}
            {vehicle?.photo_url ? (
              <Box mb="xs">
                <Image
                  src={vehicle.photo_url}
                  alt="Vehículo"
                  className={styles.vehiclePhoto}
                  fallbackSrc="https://via.placeholder.com/400x200/1f2937/ffffff?text=Sin+Foto+del+Vehículo"
                />
              </Box>
            ) : (
              <Box mb="xs" className={styles.vehiclePhotoPlaceholder}>
                <Camera size={32} color="rgba(255, 255, 255, 0.5)" />
                <Text size="sm" fw={500} className={styles.secondaryText}>
                  Sin foto disponible
                </Text>
              </Box>
            )}

            {/* Información del vehículo */}
            <Box className={styles.driverInfoSection}>
              <Group gap="xs" mb={8} align="center">
                <Car size={12} className={styles.accentText} />
                <Text size="xs" fw={600} className={styles.primaryText}>
                  Información del Vehículo
                </Text>
              </Group>
              
              <Stack gap={3} mb="sm">
                <Group justify="space-between" align="center">
                  <Text size="xs" className={styles.secondaryText}>Marca/Modelo:</Text>
                  <Text size="xs" fw={500} className={styles.primaryText}>
                    {vehicle?.brand && vehicle?.model 
                      ? `${vehicle.brand} ${vehicle.model}` 
                      : 'No disponible'}
                  </Text>
                </Group>
                
                <Group justify="space-between" align="center">
                  <Text size="xs" className={styles.secondaryText}>Placa:</Text>
                  <Badge size="xs" variant="gradient" gradient={{ from: '#00ff9d', to: '#00cc7a' }} style={{ color: 'black', fontWeight: 600 }}>
                    {vehicle?.plate || 'Sin placa'}
                  </Badge>
                </Group>
                
                {(vehicle?.year || vehicle?.color) && (
                  <Group justify="space-between" align="center">
                    <Text size="xs" className={styles.secondaryText}>Detalles:</Text>
                    <Text size="xs" className={styles.primaryText}>
                      {vehicle?.year ? `${vehicle.year}` : ''} 
                      {vehicle?.year && vehicle?.color ? ' • ' : ''}
                      {vehicle?.color ? `${vehicle.color}` : ''}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Box>

            {/* Documentación */}
            <Box className={styles.documentsSection}>
              <Group gap="xs" mb={6} align="center">
                <FileText size={12} color="#a855f7" />
                <Text size="xs" fw={600} className={styles.primaryText}>
                  Documentos Verificados
                </Text>
              </Group>
              
              <Group gap={4} wrap="wrap">
                <Badge 
                  size="xs" 
                  variant="light" 
                  color={getDocumentStatus(license).color}
                  leftSection={getDocumentStatus(license).icon}
                  className={styles.documentBadge}
                >
                  Licencia
                </Badge>
                <Badge 
                  size="xs" 
                  variant="light" 
                  color={getDocumentStatus(propertyCard).color}
                  leftSection={getDocumentStatus(propertyCard).icon}
                  className={styles.documentBadge}
                >
                  Propiedad
                </Badge>
                <Badge 
                  size="xs" 
                  variant="light" 
                  color={getDocumentStatus(soat).color}
                  leftSection={getDocumentStatus(soat).icon}
                  className={styles.documentBadge}
                >
                  SOAT
                </Badge>
              </Group>
            </Box>

            {/* Footer de verificación */}
            <Box className={styles.verificationFooter}>
              <Group justify="center" gap={4}>
                <Shield size={10} color="#22c55e" />
                <Text size="xs" fw={500} style={{ color: '#22c55e' }}>
                  Verificado por CupoApp
                </Text>
              </Group>
            </Box>
          </Stack>
        </div>
      </Box>
    </Drawer>
  );
}
