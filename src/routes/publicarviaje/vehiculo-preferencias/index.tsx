import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, Select, Textarea, Text, Modal, Stack, TextInput, NumberInput, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronLeft, Car, Settings, CheckCircle, AlertCircle, Music, Snowflake, Wifi, Heart, Cigarette, ShoppingBag, Plus } from 'lucide-react';
import { tripStore, type TripData } from '../../../types/PublicarViaje/TripDataManagement';
import { getMyVehicle, registerCompleteVehicleWithPromotion, Vehicle } from '@/services/vehicles';
import styles from './index.module.css';

// Tipos para preferencias
interface Preference {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Modal de registro de vehículo simple
interface SimpleVehicleData {
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  body_type: string;
  passenger_capacity: number;
}

const SimpleVehicleModal = ({ 
  opened, 
  onClose, 
  onSuccess 
}: { 
  opened: boolean; 
  onClose: () => void; 
  onSuccess: (vehicle: Vehicle) => void; 
}) => {
  const [vehicleData, setVehicleData] = useState<SimpleVehicleData>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: '',
    body_type: '',
    passenger_capacity: 4
  });
  const [loading, setLoading] = useState(false);

  const BRANDS = [
    'Toyota', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Ford', 'Honda',
    'Volkswagen', 'Renault', 'Suzuki', 'Mitsubishi', 'Fiat', 'Peugeot', 'Citroën', 'Otro'
  ];

  const BODY_TYPES = [
    'Sedán', 'Hatchback', 'SUV', 'Crossover', 'Camioneta', 'Pick-up', 'Van', 'Otro'
  ];

  const COLORS = [
    'Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Plata', 'Otro'
  ];

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!vehicleData.brand || !vehicleData.model || !vehicleData.plate || !vehicleData.color || !vehicleData.body_type) {
      notifications.show({
        title: 'Campos requeridos',
        message: 'Por favor completa todos los campos obligatorios',
        color: 'red',
      });
      return;
    }

    // Validar formato de placa (3 letras + 3 números)
    const plateRegex = /^[A-Z]{3}\d{3}$/;
    if (!plateRegex.test(vehicleData.plate.toUpperCase())) {
      notifications.show({
        title: 'Placa inválida',
        message: 'El formato de placa debe ser ABC123 (3 letras + 3 números)',
        color: 'red',
      });
      return;
    }

    // Validar capacidad de pasajeros
    if (vehicleData.passenger_capacity < 1 || vehicleData.passenger_capacity > 8) {
      notifications.show({
        title: 'Capacidad inválida',
        message: 'La capacidad debe estar entre 1 y 8 pasajeros',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar datos completos pero realistas
      const completeVehicleData = {
        vehicle: {
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          plate: vehicleData.plate.toUpperCase(),
          color: vehicleData.color,
          body_type: vehicleData.body_type,
          passenger_capacity: vehicleData.passenger_capacity
        },
        license: {
          license_number: `${vehicleData.plate.toUpperCase()}LIC`,
          license_category: "C1", 
          blood_type: "O+",
          expedition_date: "2020-01-01",
          expiration_date: "2030-12-31"
        },
        soat: {
          policy_number: `${vehicleData.plate.toUpperCase()}SOAT`,
          insurance_company: "Seguros del Estado S.A.",
          validity_from: "2024-01-01", 
          validity_to: "2025-12-31"
        }
      };

      console.log('🚗 [VEHICULO-PREFERENCIAS] Registering vehicle with realistic data:', completeVehicleData);
      console.log('🔑 [VEHICULO-PREFERENCIAS] Checking token:', localStorage.getItem('token') ? 'Token exists' : 'No token found');
      
      // Usar el servicio completo con datos realistas
      console.log('📡 [VEHICULO-PREFERENCIAS] Calling registerCompleteVehicleWithPromotion...');
      const response = await registerCompleteVehicleWithPromotion(completeVehicleData);
      
      console.log('✅ [VEHICULO-PREFERENCIAS] Registration response:', response);
      
      if (response.success && response.data?.vehicle) {        notifications.show({
          title: '¡Vehículo registrado!',
          message: 'Tu vehículo ha sido registrado exitosamente',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
        
        onSuccess(response.data.vehicle);
        onClose();
        
        // Resetear formulario
        setVehicleData({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          plate: '',
          color: '',
          body_type: '',
          passenger_capacity: 4
        });
      } else {
        throw new Error(response.error || 'Error desconocido al registrar vehículo');
      }
    } catch (error) {
      console.error('❌ Error registering vehicle:', error);
      notifications.show({
        title: 'Error al registrar vehículo',
        message: error instanceof Error ? error.message : 'Error desconocido',
        color: 'red',
        icon: <AlertCircle size={20} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title="Registrar Vehículo"
      size="md"
      centered
      className={styles.vehicleModal}
      classNames={{
        header: styles.modalHeader,
        title: styles.modalTitle,
        body: styles.modalBody
      }}
    >
      <Stack gap="md">
        <Group grow>
          <Select
            label="Marca *"
            placeholder="Selecciona marca"
            data={BRANDS}
            value={vehicleData.brand}
            onChange={(value) => setVehicleData(prev => ({ ...prev, brand: value || '' }))}
            searchable
            required
          />
          <TextInput
            label="Modelo *"
            placeholder="Ej: Corolla"
            value={vehicleData.model}
            onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
            required
          />
        </Group>

        <Group grow>
          <NumberInput
            label="Año *"
            placeholder="2020"
            value={vehicleData.year}
            onChange={(value) => setVehicleData(prev => ({ ...prev, year: Number(value) || new Date().getFullYear() }))}
            min={1990}
            max={new Date().getFullYear() + 1}
            required
          />
          <TextInput
            label="Placa *"
            placeholder="ABC123"
            value={vehicleData.plate}
            onChange={(e) => setVehicleData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            maxLength={6}
            required
          />
        </Group>

        <Group grow>
          <Select
            label="Color *"
            placeholder="Selecciona color"
            data={COLORS}
            value={vehicleData.color}
            onChange={(value) => setVehicleData(prev => ({ ...prev, color: value || '' }))}
            required
          />
          <Select
            label="Tipo de carrocería *"
            placeholder="Selecciona tipo"
            data={BODY_TYPES}
            value={vehicleData.body_type}
            onChange={(value) => setVehicleData(prev => ({ ...prev, body_type: value || '' }))}
            required
          />
        </Group>

        <NumberInput
          label="Capacidad de pasajeros"
          placeholder="4"
          value={vehicleData.passenger_capacity}
          onChange={(value) => setVehicleData(prev => ({ ...prev, passenger_capacity: Number(value) || 4 }))}
          min={1}
          max={8}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Registrar Vehículo
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

function VehiculoPreferenciasView() {
  const navigate = useNavigate();
  
  // Estados principales
  const [tripData, setTripData] = useState<TripData>(tripStore.getStoredData());
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  
  // Estados para vehículos
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);

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

  // Verificar datos al cargar y cargar vehículos
  useEffect(() => {
    const storedData = tripStore.getStoredData();
    setTripData(storedData);
    
    if (!storedData.selectedRoute || !storedData.seats || !storedData.pricePerSeat) {
      navigate({ to: '/publicarviaje/asientos-precio' });
      return;
    }

    // Cargar vehículos del usuario
    loadUserVehicles();

    // Cargar datos guardados si existen
    const extendedData = storedData as any;
    if (extendedData.vehicle) setSelectedVehicle(extendedData.vehicle);
    if (extendedData.additionalInfo) setAdditionalInfo(extendedData.additionalInfo);
    if (extendedData.preferences) setSelectedPreferences(extendedData.preferences);
  }, [navigate]);

  const loadUserVehicles = async () => {
    setLoadingVehicles(true);
    try {
      console.log('🚗 [VEHICULO-PREFERENCIAS] Loading user vehicles...');
      console.log('🔑 [VEHICULO-PREFERENCIAS] Token check:', localStorage.getItem('token') ? 'Token exists' : 'No token found');
      
      const response = await getMyVehicle();
      
      console.log('✅ [VEHICULO-PREFERENCIAS] getMyVehicle response:', response);
      
      if (response.success && response.vehicle) {
        setUserVehicles([response.vehicle]);
        setHasVehicle(true);
        setSelectedVehicle(response.vehicle.id.toString());
        console.log('✅ User vehicle loaded:', response.vehicle);
      } else {
        setUserVehicles([]);
        setHasVehicle(false);
        console.log('ℹ️ No user vehicle found');
      }
    } catch (error) {
      console.error('❌ Error loading vehicles:', error);
      setUserVehicles([]);
      setHasVehicle(false);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleVehicleSuccess = (vehicle: Vehicle) => {
    setUserVehicles([vehicle]);
    setHasVehicle(true);
    setSelectedVehicle(vehicle.id.toString());
    console.log('✅ Vehicle registered and selected:', vehicle);
  };

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleContinue = () => {
    // Validaciones
    if (!selectedVehicle) {
      notifications.show({
        title: 'Vehículo requerido',
        message: 'Por favor selecciona un vehículo para continuar',
        color: 'red',
        position: 'top-center',
      });
      return;
    }

    // Guardar datos en el store
    const extendedData = {
      ...tripData,
      vehicle: selectedVehicle,
      additionalInfo: additionalInfo.trim(),
      preferences: selectedPreferences
    };

    tripStore.updateData(extendedData);
    
    // Navegar al resumen y confirmación
    navigate({ to: '/publicarviaje/resumen-confirmacion' });
  };

  // Variable para verificar si puede continuar
  const canContinue = selectedVehicle && selectedVehicle.trim() !== '';

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
        <h1 className={styles.title}>Vehículo y Preferencias</h1>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        
        {/* Sección de Vehículo */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Car className={styles.sectionIcon} size={24} />
            <h2 className={styles.sectionTitle}>Selecciona tu vehículo</h2>
          </div>
          
          {loadingVehicles ? (
            <Text>Cargando vehículos...</Text>
          ) : hasVehicle ? (
            <div className={styles.vehicleSelectContainer}>
              <Select
                placeholder="Selecciona tu vehículo"
                data={userVehicles.map(vehicle => ({
                  value: vehicle.id.toString(),
                  label: `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
                }))}
                value={selectedVehicle}
                onChange={(value) => setSelectedVehicle(value || '')}
                className={styles.vehicleSelect}
              />
              <Button 
                variant="light" 
                size="sm" 
                className={styles.addVehicleButtonSide}
                onClick={() => setShowVehicleModal(true)}
              >
                <Plus size={16} />
              </Button>
            </div>
          ) : (
            <div className={styles.vehicleRegistration}>
              <Text size="sm" className={styles.vehicleHelp} mb="sm">
                No tienes vehículos registrados. Registra tu vehículo para continuar.
              </Text>
              <Button 
                leftSection={<Plus size={16} />}
                onClick={() => setShowVehicleModal(true)}
                variant="filled"
                size="sm"
                className={styles.registerButton}
              >
                Registrar Vehículo
              </Button>
            </div>
          )}
        </div>

        {/* Sección de Preferencias */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Settings className={styles.sectionIcon} size={24} />
            <h2 className={styles.sectionTitle}>Preferencias del viaje</h2>
          </div>
          
          <div className={styles.compactPreferencesGrid}>
            {preferences.map((preference) => (
              <div 
                key={preference.id}
                className={`${styles.compactPreferenceItem} ${
                  selectedPreferences.includes(preference.id) ? styles.compactPreferenceActive : ''
                }`}
                onClick={() => handlePreferenceToggle(preference.id)}
              >
                <div className={styles.compactPreferenceIcon}>
                  {preference.icon}
                </div>
                <Text className={styles.compactPreferenceLabel} size="xs">
                  {preference.label}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Información Adicional - NUEVA Y COMPACTA */}
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <Text className={styles.infoCardIcon}>💬</Text>
            <Text className={styles.infoCardTitle}>Información adicional</Text>
          </div>
          
          <Textarea
            placeholder="Ej: Viaje directo, acepto equipaje extra..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={2}
            maxLength={200}
            className={styles.miniTextarea}
            autosize={false}
          />
          
          <Text size="xs" className={styles.miniCounter}>
            {additionalInfo.length}/200
          </Text>
        </div>

        {/* Sección de Continuar */}
        <div className={styles.continueSection}>
          <Button
            size="md"
            className={`${styles.continueButton} ${!canContinue ? styles.continueButtonDisabled : ''}`}
            onClick={handleContinue}
            disabled={!canContinue}
            leftSection={<CheckCircle size={18} />}
          >
            {canContinue ? 'Continuar al Resumen' : 'Selecciona un vehículo'}
          </Button>
        </div>
      </div>

      {/* Modal de registro de vehículo */}
      <SimpleVehicleModal 
        opened={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSuccess={handleVehicleSuccess}
      />
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/vehiculo-preferencias/')({
  component: VehiculoPreferenciasView,
} as any);