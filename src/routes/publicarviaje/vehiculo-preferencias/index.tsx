import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, Select, Textarea, Checkbox, Text, Modal, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronLeft, Car, Settings, CheckCircle, AlertCircle, Music, Snowflake, Wifi, Heart, Cigarette, ShoppingBag } from 'lucide-react';
import { tripStore, type TripData } from '../../../types/PublicarViaje/TripDataManagement';
import styles from './index.module.css';

// Tipos para vehículo y preferencias
interface VehicleOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface Preference {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

function VehiculoPreferenciasView() {
  const navigate = useNavigate();
  
  // Estados principales
  const [tripData, setTripData] = useState<TripData>(tripStore.getStoredData());
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Opciones de vehículos
  const vehicleOptions: VehicleOption[] = [
    { value: 'sedan', label: 'Sedán', icon: <Car size={20} /> },
    { value: 'suv', label: 'SUV', icon: <Car size={20} /> },
    { value: 'hatchback', label: 'Hatchback', icon: <Car size={20} /> },
    { value: 'pickup', label: 'Pickup', icon: <Car size={20} /> },
    { value: 'van', label: 'Van', icon: <Car size={20} /> },
    { value: 'otro', label: 'Otro', icon: <Car size={20} /> }
  ];

  // Preferencias del viaje
  const preferences: Preference[] = [
    { 
      id: 'musica', 
      label: 'Música permitida', 
      icon: <Music size={18} />, 
      description: 'Los pasajeros pueden escuchar música'
    },
    { 
      id: 'aire_acondicionado', 
      label: 'Aire acondicionado', 
      icon: <Snowflake size={18} />, 
      description: 'Vehículo con aire acondicionado'
    },
    { 
      id: 'wifi', 
      label: 'WiFi disponible', 
      icon: <Wifi size={18} />, 
      description: 'Internet disponible durante el viaje'
    },
    { 
      id: 'mascotas', 
      label: 'Mascotas permitidas', 
      icon: <Heart size={18} />, 
      description: 'Se permiten mascotas pequeñas'
    },
    { 
      id: 'no_fumar', 
      label: 'Vehículo libre de humo', 
      icon: <Cigarette size={18} />, 
      description: 'Prohibido fumar en el vehículo'
    },
    { 
      id: 'equipaje_extra', 
      label: 'Espacio para equipaje', 
      icon: <ShoppingBag size={18} />, 
      description: 'Espacio adicional para equipaje'
    }
  ];

  // Verificar datos al cargar
  useEffect(() => {
    const storedData = tripStore.getStoredData();
    setTripData(storedData);
    
    if (!storedData.selectedRoute || !storedData.seats || !storedData.pricePerSeat) {
      navigate({ to: '/publicarviaje/asientos-precio' });
      return;
    }

    // Cargar datos guardados si existen (usando any temporalmente)
    const extendedData = storedData as any;
    if (extendedData.vehicle) setSelectedVehicle(extendedData.vehicle);
    if (extendedData.additionalInfo) setAdditionalInfo(extendedData.additionalInfo);
    if (extendedData.preferences) setSelectedPreferences(extendedData.preferences);
  }, [navigate]);

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handlePublishTrip = async () => {
    // Validaciones
    if (!selectedVehicle) {
      notifications.show({
        title: 'Vehículo requerido',
        message: 'Debes seleccionar el tipo de vehículo',
        color: 'red',
      });
      return;
    }

    setIsPublishing(true);

    try {
      // Guardar configuración final usando any temporalmente
      const finalData = {
        vehicle: selectedVehicle,
        additionalInfo: additionalInfo.trim(),
        preferences: selectedPreferences,
        publishedAt: new Date().toISOString()
      };

      (tripStore as any).updateData(finalData);

      // Simular publicación (aquí iría la llamada al backend)
      await new Promise(resolve => setTimeout(resolve, 2000));

      notifications.show({
        title: '¡Viaje publicado exitosamente!',
        message: 'Tu viaje ya está disponible para que otros usuarios se unan',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Limpiar store y redirigir
      tripStore.clearData();
      
      // Redirigir a la página principal
      navigate({ to: '/' });

    } catch (error) {
      console.error('Error publishing trip:', error);
      notifications.show({
        title: 'Error al publicar',
        message: 'Hubo un problema al publicar tu viaje. Inténtalo de nuevo.',
        color: 'red',
        icon: <AlertCircle size={20} />,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    const vehicle = vehicleOptions.find(v => v.value === vehicleType);
    return vehicle?.icon || <Car size={20} />;
  };

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="subtle"
          size="lg"
          className={styles.backButton}
          onClick={() => navigate({ to: '/publicarviaje/asientos-precio' })}
        >
          <ChevronLeft size={20} />
        </Button>
        <h1 className={styles.title}>Finalizar Publicación</h1>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        
        {/* Selección de Vehículo */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Car className={styles.sectionIcon} size={24} />
            <h2 className={styles.sectionTitle}>Tipo de vehículo</h2>
          </div>
          
          <Select
            value={selectedVehicle}
            onChange={(value) => setSelectedVehicle(value || '')}
            placeholder="Selecciona tu tipo de vehículo"
            data={vehicleOptions.map(option => ({
              value: option.value,
              label: option.label
            }))}
            size="lg"
            className={styles.vehicleSelect}
            leftSection={getVehicleIcon(selectedVehicle)}
          />
          
          <Text className={styles.vehicleHelp}>
            Ayuda a los pasajeros a identificar tu vehículo
          </Text>
        </div>

        {/* Preferencias del Viaje */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Settings className={styles.sectionIcon} size={24} />
            <h2 className={styles.sectionTitle}>Preferencias del viaje</h2>
          </div>
          
          <div className={styles.preferencesGrid}>
            {preferences.map((preference) => (
              <div 
                key={preference.id}
                className={`${styles.preferenceCard} ${
                  selectedPreferences.includes(preference.id) ? styles.preferenceSelected : ''
                }`}
                onClick={() => handlePreferenceToggle(preference.id)}
              >
                <div className={styles.preferenceHeader}>
                  <div className={styles.preferenceIcon}>
                    {preference.icon}
                  </div>
                  <Checkbox
                    checked={selectedPreferences.includes(preference.id)}
                    onChange={() => {}} // Controlled by card click
                    className={styles.preferenceCheckbox}
                  />
                </div>
                <div className={styles.preferenceContent}>
                  <Text className={styles.preferenceLabel}>
                    {preference.label}
                  </Text>
                  <Text className={styles.preferenceDescription}>
                    {preference.description}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información Adicional */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>Información adicional (opcional)</Text>
          </div>
          
          <Textarea
            value={additionalInfo}
            onChange={(event) => setAdditionalInfo(event.currentTarget.value)}
            placeholder="Agrega cualquier información adicional sobre el viaje..."
            rows={4}
            maxLength={300}
            className={styles.additionalInfoTextarea}
          />
          
          <Text className={styles.characterCount}>
            {additionalInfo.length}/300 caracteres
          </Text>
        </div>

        {/* Resumen Final y Publicar */}
        <div className={styles.publishSection}>
          <div className={styles.tripSummary}>
            <Text className={styles.summaryTitle}>Resumen del viaje</Text>
            <div className={styles.summaryDetails}>
              <Text className={styles.summaryRoute}>
                {(tripData as any).origin?.description || 'Origen'} → {(tripData as any).destination?.description || 'Destino'}
              </Text>
              <Text className={styles.summaryDateTime}>
                {(tripData as any).date || 'Fecha'} a las {(tripData as any).time || 'Hora'}
              </Text>
              <Text className={styles.summarySeatsPrice}>
                {tripData.seats || 0} asiento{(tripData.seats || 0) > 1 ? 's' : ''} × ${tripData.pricePerSeat?.toLocaleString()} COP
              </Text>
              <Text className={styles.summaryTotal}>
                Total: ${((tripData.seats || 0) * (tripData.pricePerSeat || 0)).toLocaleString()} COP
              </Text>
            </div>
          </div>
          
          <Button
            onClick={handlePublishTrip}
            size="xl"
            className={styles.publishButton}
            loading={isPublishing}
            disabled={!selectedVehicle}
          >
            {isPublishing ? 'Publicando viaje...' : 'Publicar viaje'}
          </Button>
        </div>
      </div>

      {/* Modal de confirmación si es necesario */}
      <Modal
        opened={isPublishing}
        onClose={() => {}}
        title="Publicando tu viaje"
        centered
        withCloseButton={false}
        classNames={{
          header: styles.modalHeader,
          title: styles.modalTitle,
          body: styles.modalBody
        }}
      >
        <Stack align="center" gap="lg">
          <CheckCircle size={48} className={styles.successIcon} />
          <Text className={styles.modalText}>
            Estamos publicando tu viaje...
          </Text>
          <Text className={styles.modalSubtext}>
            En unos segundos estará disponible para otros usuarios
          </Text>
        </Stack>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/vehiculo-preferencias/')({
  component: VehiculoPreferenciasView,
} as any);