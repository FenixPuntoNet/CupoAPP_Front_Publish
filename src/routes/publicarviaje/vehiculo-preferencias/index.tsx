import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, Textarea, Text, Modal, Stack, TextInput, Group, FileInput, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronLeft, Car, Settings, CheckCircle, AlertCircle, Music, Snowflake, Wifi, Heart, Cigarette, ShoppingBag, Plus, X, Camera } from 'lucide-react';
import { tripStore, type TripData } from '../../../types/PublicarViaje/TripDataManagement';
import { getMyVehicle, registerSimpleVehicleModal, uploadVehiclePhotoBase64, Vehicle } from '@/services/vehicles';
import styles from './index.module.css';

// Tipos para preferencias
interface Preference {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Modal de registro de vehículo simple
interface LocalVehicleData {
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
  const [vehicleData, setVehicleData] = useState<LocalVehicleData>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: '',
    body_type: '',
    passenger_capacity: 4
  });
  const [loading, setLoading] = useState(false);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<Record<string, string>>({});

  const BRANDS = [
    'Audi', 'BMW', 'BYD', 'Changan', 'Chery', 'Chevrolet', 'Citroën', 'Dacia', 'Daewoo', 
    'Daihatsu', 'DFSK', 'Dodge', 'FAW', 'Ferrari', 'Fiat', 'Ford', 'Foton', 'GAC', 
    'Geely', 'Great Wall', 'Haval', 'Honda', 'Hyundai', 'Infiniti', 'Isuzu', 'JAC', 
    'Jaguar', 'Jeep', 'KIA', 'Land Rover', 'Lexus', 'Lifan', 'Mahindra', 'Mazda', 
    'Mercedes', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 
    'RAM', 'Renault', 'Seat', 'Skoda', 'SsangYong', 'Subaru', 'Suzuki', 'Tata', 
    'Toyota', 'Volkswagen', 'Volvo', 'Zotye', 'Lada', 'Brilliance', 'Chang An', 'Dongfeng',
    'JAC Motors', 'King Long', 'Yutong', 'Karry', 'Chevrolet Sail', 'Spark', 'Aveo',
    'Kia Rio', 'Picanto', 'Cerato', 'Hyundai Accent', 'i10', 'i20', 'Elantra', 'Tucson',
    'Toyota Yaris', 'Corolla', 'Hilux', 'Fortuner', 'Prado', 'Nissan Sentra', 'Versa', 'March',
    'Frontier', 'X-Trail', 'Renault Logan', 'Sandero', 'Duster', 'Stepway', 'Kwid',
    'Volkswagen Gol', 'Polo', 'Jetta', 'Tiguan', 'Amarok', 'Ford Ka', 'Fiesta', 'Focus',
    'EcoSport', 'Ranger', 'Chevrolet Onix', 'Prisma', 'Cruze', 'Tracker', 'S10',
    'Fiat Uno', 'Palio', 'Siena', 'Strada', 'Toro', 'Argo', 'Cronos', 'Mobi',
    'Peugeot 208', '2008', '3008', '5008', 'Partner', 'Boxer', 'Otra'
  ];

  const BODY_TYPES = [
    'Sedán', 'Hatchback', 'SUV', 'Crossover', 'Camioneta', 'Pick-up', 'Van', 'Minivan', 
    'Coupé', 'Convertible', 'Station Wagon', 'Compacto', 'Subcompacto', 'Familiar', 
    'Todo Terreno', 'Deportivo', 'Furgón', 'Panel', 'Otro'
  ];

  const COLORS = [
    'Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Plata', 'Otro'
  ];

  // Generar años desde 1990 hasta año siguiente
  const YEARS = Array.from(
    { length: new Date().getFullYear() - 1989 }, 
    (_, i) => new Date().getFullYear() + 1 - i
  );

  // Opciones de capacidad de pasajeros
  const PASSENGER_CAPACITIES = [1, 2, 3, 4, 5, 6, 7, 8];

  // Tipos de archivo permitidos (COPIADO DE REGISTRARVEHICULO)
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

  // 🍎 Componente Select Nativo para iOS/Android - Diseño elegante y funcional
  const NativeSelect = ({ 
    label, 
    value, 
    onChange, 
    options, 
    placeholder, 
    required = false 
  }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }> | (string | number)[];
    placeholder: string;
    required?: boolean;
  }) => (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && (
        <label 
          style={{ 
            display: 'block', 
            fontWeight: 600, 
            color: 'white', 
            marginBottom: '6px',
            fontSize: '0.9rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {label} {required && <span style={{ color: '#fbbf24' }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.95rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          appearance: 'menulist',
          WebkitAppearance: 'menulist',
          MozAppearance: 'menulist',
          minHeight: '44px',
          outline: 'none',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#22c55e';
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>
          {placeholder}
        </option>
        {options.map((option, index) => {
          const optionValue = typeof option === 'object' ? option.value : option.toString();
          const optionLabel = typeof option === 'object' ? option.label : option.toString();
          return (
            <option 
              key={index} 
              value={optionValue} 
              style={{ backgroundColor: '#374151', color: 'white' }}
            >
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );

  // Función para validar tipo de archivo (COPIADO DE REGISTRARVEHICULO)
  const validateImageFile = (file: File): boolean => {
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return isValidType && hasValidExtension;
  };

  // Función para manejar preview de imágenes (COPIADO DE REGISTRARVEHICULO)
  const handlePhotoChange = (photoType: string, file: File | null) => {
    if (file) {
      // Validar tipo de archivo
      if (!validateImageFile(file)) {
        notifications.show({
          title: 'Tipo de archivo no válido',
          message: 'Solo se permiten archivos JPG, JPEG y PNG',
          color: 'red'
        });
        return;
      }

      // Validar tamaño de archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        notifications.show({
          title: 'Archivo muy grande',
          message: 'El archivo debe ser menor a 5MB',
          color: 'red'
        });
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(prev => ({
          ...prev,
          [photoType]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);

      // Guardar archivo para vehículo
      if (photoType === 'vehiclePhoto') {
        setVehiclePhoto(file);
      }
    }
  };

  // Componente mejorado para subir fotos (COPIADO DE REGISTRARVEHICULO)
  const PhotoUpload = ({ 
    label, 
    photoType, 
    isRequired = false 
  }: { 
    label: string; 
    photoType: string; 
    isRequired?: boolean; 
  }) => {
    const preview = photoPreview[photoType];
    
    return (
      <div className={styles.imageCard}>
        <div className={styles.imageCardLabel}>
          {label} {isRequired && <span style={{ color: '#fa5252' }}>*</span>}
        </div>
        
        {preview ? (
          <div className={styles.photoPreview}>
            <img src={preview} alt={`Preview ${label}`} />
            <ActionIcon
              className={styles.removePhotoButton}
              onClick={() => {
                setPhotoPreview(prev => {
                  const newPreviews = { ...prev };
                  delete newPreviews[photoType];
                  return newPreviews;
                });
                
                // Limpiar archivo del vehículo
                if (photoType === 'vehiclePhoto') {
                  setVehiclePhoto(null);
                }
              }}
            >
              <X size={14} />
            </ActionIcon>
          </div>
        ) : (
          <FileInput
            placeholder="JPG, JPEG o PNG únicamente"
            accept=".jpg,.jpeg,.png"
            leftSection={<Camera size={16} />}
            onChange={(file) => handlePhotoChange(photoType, file)}
            classNames={{
              input: styles.photoUploadArea
            }}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(0, 255, 157, 0.25)',
                color: 'white'
              }
            }}
          />
        )}
      </div>
    );
  };

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

    // Validar que se haya subido la foto del vehículo (OBLIGATORIO)
    if (!vehiclePhoto || !photoPreview['vehiclePhoto']) {
      notifications.show({
        title: 'Foto requerida',
        message: 'La foto del vehículo es obligatoria para registrar tu vehículo',
        color: 'red',
        icon: <AlertCircle size={20} />,
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
      console.log('🚗 [VEHICULO-PREFERENCIAS] Starting separated vehicle registration flow...');
      console.log('🔑 [VEHICULO-PREFERENCIAS] Checking token:', localStorage.getItem('token') ? 'Token exists' : 'No token found');
      
      // PASO 1: Registrar vehículo SIN foto
      console.log('📝 [VEHICULO-PREFERENCIAS] Step 1: Registering vehicle without photo...');
      const vehicleResponse = await registerSimpleVehicleModal(vehicleData);
      
      if (!vehicleResponse.success || !vehicleResponse.data) {
        throw new Error(vehicleResponse.error || 'Error registrando vehículo');
      }

      const registeredVehicle = vehicleResponse.data;
      console.log('✅ [VEHICULO-PREFERENCIAS] Step 1 completed - Vehicle registered:', registeredVehicle);

      // PASO 2: Subir foto del vehículo
      console.log('📸 [VEHICULO-PREFERENCIAS] Step 2: Uploading vehicle photo...');
      const photoResponse = await uploadVehiclePhotoBase64(registeredVehicle.id, vehiclePhoto);
      
      let finalVehicle = registeredVehicle;
      
      if (!photoResponse.success) {
        console.warn('⚠️ [VEHICULO-PREFERENCIAS] Photo upload failed:', photoResponse.error);
        // No fallar el registro completo por la foto
        notifications.show({
          title: 'Advertencia',
          message: 'El vehículo se registró pero la foto no se pudo subir. Puedes intentar subirla más tarde.',
          color: 'yellow',
        });
      } else {
        console.log('✅ [VEHICULO-PREFERENCIAS] Step 2 completed - Photo uploaded:', photoResponse.photo_url);
        
        // Actualizar el vehículo con la URL de la foto
        finalVehicle = {
          ...registeredVehicle,
          photo_url: photoResponse.photo_url
        };
        
        // PASO 3: Verificar que el vehículo tiene la foto actualizada consultando el backend
        console.log('🔄 [VEHICULO-PREFERENCIAS] Step 3: Reloading vehicle with updated photo...');
        try {
          const updatedVehicleResponse = await getMyVehicle();
          if (updatedVehicleResponse.success && updatedVehicleResponse.vehicle) {
            finalVehicle = updatedVehicleResponse.vehicle;
            console.log('✅ [VEHICULO-PREFERENCIAS] Vehicle reloaded with photo:', finalVehicle.photo_url);
          }
        } catch (reloadError) {
          console.warn('⚠️ [VEHICULO-PREFERENCIAS] Failed to reload vehicle, using local data');
        }
      }

      notifications.show({
        title: '¡Vehículo registrado!',
        message: finalVehicle.photo_url 
          ? 'Tu vehículo y foto han sido registrados exitosamente' 
          : 'Tu vehículo se registró exitosamente. La foto se está procesando.',
        color: 'green',
        icon: <CheckCircle size={20} />,
        autoClose: 4000,
      });
      
      // Llamar el callback de éxito con el vehículo FINAL (con foto actualizada)
      onSuccess(finalVehicle);
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
      setVehiclePhoto(null);
      setPhotoPreview({});
      
      // Cerrar modal
      onClose();
      
    } catch (error) {
      console.error('❌ Error in vehicle registration flow:', error);
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
      title="📷 Registrar Vehículo + Foto"
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
          <div>
            <NativeSelect
              label="Marca"
              value={vehicleData.brand}
              onChange={(value) => setVehicleData(prev => ({ ...prev, brand: value }))}
              options={BRANDS}
              placeholder="Selecciona marca"
              required
            />
          </div>
          <TextInput
            label="Modelo *"
            placeholder="Ej: Corolla"
            value={vehicleData.model}
            onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
            required
          />
        </Group>

        <Group grow>
          <div>
            <NativeSelect
              label="Año"
              value={vehicleData.year}
              onChange={(value) => setVehicleData(prev => ({ ...prev, year: Number(value) }))}
              options={YEARS}
              placeholder="Selecciona año"
              required
            />
          </div>
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
          <div>
            <NativeSelect
              label="Color"
              value={vehicleData.color}
              onChange={(value) => setVehicleData(prev => ({ ...prev, color: value }))}
              options={COLORS}
              placeholder="Selecciona color"
              required
            />
          </div>
          <div>
            <NativeSelect
              label="Tipo de carrocería"
              value={vehicleData.body_type}
              onChange={(value) => setVehicleData(prev => ({ ...prev, body_type: value }))}
              options={BODY_TYPES}
              placeholder="Selecciona tipo"
              required
            />
          </div>
        </Group>

        <div>
          <NativeSelect
            label="Capacidad de pasajeros"
            value={vehicleData.passenger_capacity}
            onChange={(value) => setVehicleData(prev => ({ ...prev, passenger_capacity: Number(value) }))}
            options={PASSENGER_CAPACITIES}
            placeholder="Selecciona capacidad"
          />
        </div>

        {/* Sección de foto del vehículo - COPIADO DEL SISTEMA REGISTRARVEHICULO */}
        <Stack gap="sm">
          <Text size="sm" fw={500} style={{ color: 'white' }}>
            Foto del vehículo <span style={{ color: '#ff6b6b' }}>*</span>
          </Text>
          
          <div className={styles.imageGallery}>
            <PhotoUpload
              label="Foto del vehículo (obligatoria)"
              photoType="vehiclePhoto"
              isRequired={true}
            />
          </div>
          
          <Text size="xs" c="dimmed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <strong>Obligatorio:</strong> Formatos aceptados: JPG, JPEG, PNG. Tamaño máximo: 5MB
          </Text>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={loading}
            disabled={!vehiclePhoto || !photoPreview['vehiclePhoto'] || !vehicleData.brand || !vehicleData.model || !vehicleData.plate || !vehicleData.color || !vehicleData.body_type}
            color={!vehiclePhoto || !photoPreview['vehiclePhoto'] || !vehicleData.brand || !vehicleData.model || !vehicleData.plate || !vehicleData.color || !vehicleData.body_type ? 'red' : 'green'}
          >
            {!vehiclePhoto || !photoPreview['vehiclePhoto']
              ? '📷 Foto requerida' 
              : (!vehicleData.brand || !vehicleData.model || !vehicleData.plate || !vehicleData.color || !vehicleData.body_type)
                ? 'Completa los campos'
                : 'Registrar Vehículo'
            }
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
    
    // 🔍 DEBUG: Verificar datos al llegar a vehiculo-preferencias
    console.log('🔍 [VEHICULO-PREFERENCIAS] Datos recibidos del tripStore:', storedData);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene origin al llegar?:', !!storedData.origin);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene destination al llegar?:', !!storedData.destination);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene selectedRoute al llegar?:', !!storedData.selectedRoute);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene seats al llegar?:', !!storedData.seats);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene pricePerSeat al llegar?:', !!storedData.pricePerSeat);
    
    setTripData(storedData);
    
    if (!storedData.selectedRoute || !storedData.seats || !storedData.pricePerSeat) {
      console.log('❌ [VEHICULO-PREFERENCIAS] Datos insuficientes, redirigiendo a asientos-precio');
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
        console.log('🚗 [VEHICULO-PREFERENCIAS] Vehicle found:', response.vehicle);
        setUserVehicles([response.vehicle]);
        setHasVehicle(true);
        
        // Auto-seleccionar el vehículo solo si no hay uno ya seleccionado
        const currentSelectedVehicle = selectedVehicle || '';
        if (!currentSelectedVehicle || currentSelectedVehicle.trim() === '') {
          setSelectedVehicle(response.vehicle.id.toString());
          console.log('🔧 [VEHICULO-PREFERENCIAS] Auto-selected vehicle (no previous selection):', response.vehicle.id);
        } else {
          // Si ya hay una selección, verificar que el ID coincida y actualizar si es necesario
          const currentVehicleId = response.vehicle.id.toString();
          if (currentSelectedVehicle !== currentVehicleId) {
            setSelectedVehicle(currentVehicleId);
            console.log('🔧 [VEHICULO-PREFERENCIAS] Updated vehicle selection to match backend:', currentVehicleId);
          } else {
            console.log('✅ [VEHICULO-PREFERENCIAS] Vehicle selection already correct:', currentVehicleId);
          }
        }
        console.log('✅ User vehicle loaded and selected properly');
      } else {
        console.log('ℹ️ [VEHICULO-PREFERENCIAS] No vehicle found for user');
        setUserVehicles([]);
        setHasVehicle(false);
        setSelectedVehicle('');
        console.log('ℹ️ No user vehicle found, cleared selection');
      }
    } catch (error) {
      console.error('❌ Error loading vehicles:', error);
      setUserVehicles([]);
      setHasVehicle(false);
      setSelectedVehicle('');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleVehicleSuccess = (vehicle: Vehicle) => {
    console.log('🎉 [VEHICULO-PREFERENCIAS] Vehicle registration successful!', vehicle);
    console.log('📷 [VEHICULO-PREFERENCIAS] Vehicle photo URL:', vehicle.photo_url);
    
    // Actualizar inmediatamente la interfaz con el nuevo vehículo
    setUserVehicles([vehicle]);
    setHasVehicle(true);
    setSelectedVehicle(vehicle.id.toString());
    
    console.log('✅ Vehicle registered and selected immediately with photo:', {
      id: vehicle.id,
      plate: vehicle.plate,
      hasPhoto: !!vehicle.photo_url,
      photoUrl: vehicle.photo_url
    });
    
    // Recargar vehículos del backend para sincronizar datos y asegurar que la foto se muestre
    setTimeout(async () => {
      console.log('🔄 [VEHICULO-PREFERENCIAS] Reloading vehicles from backend to sync photo...');
      try {
        const response = await getMyVehicle();
        
        if (response.success && response.vehicle) {
          console.log('🔄 [VEHICULO-PREFERENCIAS] Backend vehicle loaded with photo:', {
            id: response.vehicle.id,
            plate: response.vehicle.plate,
            hasPhoto: !!response.vehicle.photo_url,
            photoUrl: response.vehicle.photo_url
          });
          
          // Actualizar con los datos del backend manteniendo la selección
          setUserVehicles([response.vehicle]);
          setHasVehicle(true);
          
          // Mantener el vehículo seleccionado (el que acabamos de registrar)
          const currentSelectedVehicleId = selectedVehicle || vehicle.id.toString();
          if (currentSelectedVehicleId === vehicle.id.toString()) {
            setSelectedVehicle(response.vehicle.id.toString());
            console.log('🔧 [VEHICULO-PREFERENCIAS] Vehicle selection maintained after reload with photo:', response.vehicle.id);
          }
          
          // Mostrar notificación si la foto se cargó correctamente
          if (response.vehicle.photo_url && response.vehicle.photo_url !== vehicle.photo_url) {
            console.log('📸 [VEHICULO-PREFERENCIAS] Photo URL updated after backend sync');
          }
        } else {
          console.warn('⚠️ [VEHICULO-PREFERENCIAS] Backend reload failed, keeping current vehicle');
        }
      } catch (error) {
        console.error('❌ [VEHICULO-PREFERENCIAS] Error reloading from backend:', error);
        // Mantener el vehículo actual en caso de error
      }
    }, 1500); // Aumentado a 1.5 segundos para dar tiempo al backend a procesar la foto
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

    // 🔍 DEBUG: Verificar datos actuales antes de guardar
    console.log('🔍 [VEHICULO-PREFERENCIAS] Datos actuales del tripStore ANTES de guardar:', tripData);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene origin?:', !!tripData.origin);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene destination?:', !!tripData.destination);
    console.log('🔍 [VEHICULO-PREFERENCIAS] ¿Tiene selectedRoute?:', !!tripData.selectedRoute);

    // Guardar datos en el store
    const extendedData = {
      ...tripData,
      vehicle: selectedVehicle,
      additionalInfo: additionalInfo.trim(),
      preferences: selectedPreferences
    };

    console.log('🔍 [VEHICULO-PREFERENCIAS] Datos a guardar:', extendedData);
    console.log('🔍 [VEHICULO-PREFERENCIAS] Origin en datos a guardar:', extendedData.origin);
    console.log('🔍 [VEHICULO-PREFERENCIAS] Destination en datos a guardar:', extendedData.destination);

    tripStore.updateData(extendedData);
    
    // 🔍 DEBUG: Verificar datos después de guardar
    const finalData = tripStore.getStoredData();
    console.log('🔍 [VEHICULO-PREFERENCIAS] Datos del tripStore DESPUÉS de guardar:', finalData);
    console.log('🔍 [VEHICULO-PREFERENCIAS] Origin preservado:', !!finalData.origin);
    console.log('🔍 [VEHICULO-PREFERENCIAS] Destination preservado:', !!finalData.destination);
    
    // Navegar al resumen y confirmación
    console.log('🚀 [VEHICULO-PREFERENCIAS] Navegando a resumen-confirmacion...');
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
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value || '')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '0.95rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  appearance: 'menulist',
                  WebkitAppearance: 'menulist',
                  MozAppearance: 'menulist',
                  minHeight: '44px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  marginRight: '8px',
                  flex: 1,
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#22c55e';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>
                  Selecciona tu vehículo
                </option>
                {userVehicles.map(vehicle => (
                  <option 
                    key={vehicle.id} 
                    value={vehicle.id.toString()}
                    style={{ backgroundColor: '#374151', color: 'white' }}
                  >
                    {`${vehicle.brand} ${vehicle.model} (${vehicle.plate})`}
                  </option>
                ))}
              </select>
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
                No tienes vehículos registrados. Registra tu vehículo con su foto para continuar.
              </Text>
              <Button 
                leftSection={<Plus size={16} />}
                onClick={() => setShowVehicleModal(true)}
                variant="filled"
                size="sm"
                className={styles.registerButton}
              >
                📷 Registrar Vehículo + Foto
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