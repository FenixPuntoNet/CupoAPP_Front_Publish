import React, { useState, useCallback } from 'react';
import {
  Modal,
  Text,
  Stack,
  Button,
  Group,
  TextInput,
  Alert,
  Center,
  Loader,
} from '@mantine/core';
import { IconQrcode, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { validateCupo } from '@/services/cupos';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import styles from './ValidateCupoModal.module.css';

interface ValidateCupoModalProps {
  bookingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onValidated?: () => void;
}

export const ValidateCupoModal: React.FC<ValidateCupoModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onValidated
}) => {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [validationMode, setValidationMode] = useState<'select' | 'manual' | 'scan'>('select');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Función para validar QR
  const validateQR = useCallback(async (qrCode: string) => {
    if (!bookingId || !qrCode.trim()) return;
    
    setLoading(true);
    setValidationResult(null);
    
    try {
      const result = await validateCupo(bookingId, qrCode.trim());
      
      if (result.success) {
        setValidationResult({
          success: true,
          message: '¡Cupo validado exitosamente!'
        });
        
        showNotification({
          title: '✅ Validación Exitosa',
          message: 'El cupo ha sido validado correctamente',
          color: 'green',
        });
        
        // Llamar callback para actualizar la lista
        onValidated?.();
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
        
      } else {
        setValidationResult({
          success: false,
          message: result.error || 'Error al validar el cupo'
        });
      }
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Error inesperado al validar'
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, onValidated, onClose]);

  // Función para escanear QR (solo móviles)
  const startQRScan = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      showNotification({
        title: 'Escáner no disponible',
        message: 'Use ingreso manual en navegador web',
        color: 'blue',
      });
      return;
    }

    try {
      setIsScanning(true);
      await BarcodeScanner.stopScan().catch(() => {});
      
      const permission = await BarcodeScanner.checkPermission({ force: true });
      if (!permission.granted) {
        showNotification({
          title: 'Permiso denegado',
          message: 'Se requiere acceso a la cámara',
          color: 'red',
        });
        return;
      }

      await BarcodeScanner.prepare();
      const result = await BarcodeScanner.startScan();
      
      if (result?.hasContent && result.content) {
        setScanResult(result.content);
        await validateQR(result.content);
      }
      
    } catch (error) {
      showNotification({
        title: 'Error de escáner',
        message: 'No se pudo escanear el código QR',
        color: 'red',
      });
    } finally {
      setIsScanning(false);
      await BarcodeScanner.stopScan().catch(() => {});
    }
  }, [validateQR]);

  // Resetear modal
  const resetModal = () => {
    setScanResult('');
    setValidationResult(null);
    setIsScanning(false);
    setValidationMode('select');
    setLoading(false);
  };

  // Manejar cierre del modal
  const handleClose = async () => {
    if (isScanning) {
      await BarcodeScanner.stopScan().catch(() => {});
    }
    resetModal();
    onClose();
  };

  // Validar entrada manual
  const handleManualValidation = () => {
    if (scanResult.trim()) {
      validateQR(scanResult);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      size="md"
      title={`🔍 Validar Cupo #${bookingId}`}
      centered
      overlayProps={{
        blur: 8,
        opacity: 0.6,
      }}
      transitionProps={{
        transition: 'slide-up',
        duration: 300,
      }}
    >
      <div className={styles.modalContent}>
        {/* Estado de validación exitosa */}
        {validationResult?.success ? (
          <Stack align="center" gap="lg">
            <div className={styles.successIcon}>
              <IconCheck size={48} />
            </div>
            <Text size="lg" fw={600} ta="center" c="green">
              {validationResult.message}
            </Text>
            <Text size="sm" ta="center" opacity={0.7}>
              Cerrando automáticamente...
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {/* Mensaje de error si existe */}
            {validationResult?.success === false && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color="red" 
                variant="light"
              >
                {validationResult.message}
              </Alert>
            )}

            {/* Selector de método de validación */}
            {validationMode === 'select' && (
              <Stack gap="xl">
                <Text size="lg" fw={700} ta="center" mb="md">
                  ¿Cómo deseas validar el cupo?
                </Text>
                
                <Stack gap="md">
                  {/* Opción Escáner QR */}
                  <div 
                    className={styles.optionCard}
                    onClick={() => setValidationMode('scan')}
                  >
                    <div className={styles.optionIcon}>
                      <IconQrcode size={32} />
                    </div>
                    <div className={styles.optionContent}>
                      <Text size="lg" fw={700} className={styles.optionTitle}>
                        📱 Escanear Código QR
                      </Text>
                      <Text size="sm" className={styles.optionDescription}>
                        Usar la cámara del dispositivo para escanear
                      </Text>
                    </div>
                    <div className={styles.optionArrow}>→</div>
                  </div>

                  {/* Opción PIN Manual */}
                  <div 
                    className={styles.optionCard}
                    onClick={() => setValidationMode('manual')}
                  >
                    <div className={styles.optionIcon}>
                      <IconAlertCircle size={32} />
                    </div>
                    <div className={styles.optionContent}>
                      <Text size="lg" fw={700} className={styles.optionTitle}>
                        ✏️ Ingresar PIN Manual
                      </Text>
                      <Text size="sm" className={styles.optionDescription}>
                        Escribir el código del tiquete manualmente
                      </Text>
                    </div>
                    <div className={styles.optionArrow}>→</div>
                  </div>
                </Stack>

                <Alert 
                  icon={<IconAlertCircle size={16} />} 
                  color="blue" 
                  variant="light"
                >
                  <Text size="sm">
                    💡 Selecciona el método que prefieras para validar el cupo del pasajero
                  </Text>
                </Alert>
              </Stack>
            )}

            {/* Modo Escáner QR */}
            {validationMode === 'scan' && (
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text size="md" fw={600}>📱 Escáner QR</Text>
                  <Button 
                    size="xs" 
                    variant="subtle" 
                    onClick={() => setValidationMode('select')}
                  >
                    ← Volver
                  </Button>
                </Group>

                {isScanning ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <div className={styles.scanningIndicator}>
                        <IconQrcode size={48} />
                      </div>
                      <Text size="sm" c="blue" fw={600}>
                        🔍 Buscando código QR...
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        color="red"
                        onClick={async () => {
                          setIsScanning(false);
                          await BarcodeScanner.stopScan().catch(() => {});
                        }}
                      >
                        Cancelar Escaneo
                      </Button>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    <Center py="lg">
                      <div className={styles.qrPlaceholder}>
                        <IconQrcode size={64} />
                        <Text size="sm" ta="center" mt="md">
                          Presiona el botón para iniciar el escáner
                        </Text>
                      </div>
                    </Center>

                    <Button
                      variant="filled"
                      color="blue"
                      size="lg"
                      leftSection={<IconQrcode size={18} />}
                      onClick={startQRScan}
                      disabled={loading}
                      fullWidth
                    >
                      Iniciar Escáner de Cámara
                    </Button>

                    {!Capacitor.isNativePlatform() && (
                      <Alert 
                        icon={<IconAlertCircle size={16} />} 
                        color="orange" 
                        variant="light"
                      >
                        <Text size="xs">
                          ⚠️ El escáner solo funciona en dispositivos móviles. En navegador web usa el PIN manual.
                        </Text>
                      </Alert>
                    )}
                  </Stack>
                )}
              </Stack>
            )}

            {/* Modo PIN Manual */}
            {validationMode === 'manual' && (
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text size="md" fw={600}>✏️ Ingresar PIN</Text>
                  <Button 
                    size="xs" 
                    variant="subtle" 
                    onClick={() => setValidationMode('select')}
                  >
                    ← Volver
                  </Button>
                </Group>

                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Código del tiquete:
                  </Text>
                  <TextInput
                    placeholder="Ingresa el código/PIN del tiquete..."
                    value={scanResult}
                    onChange={(e) => setScanResult(e.target.value)}
                    disabled={loading}
                    size="lg"
                    autoFocus
                    rightSection={
                      loading ? <Loader size="sm" /> : null
                    }
                  />
                </Stack>

                <Button
                  variant="filled"
                  color="green"
                  size="lg"
                  leftSection={<IconCheck size={18} />}
                  onClick={handleManualValidation}
                  disabled={!scanResult.trim() || loading}
                  loading={loading}
                  fullWidth
                >
                  {loading ? 'Validando...' : 'Validar Cupo'}
                </Button>

                <Alert 
                  icon={<IconAlertCircle size={16} />} 
                  color="blue" 
                  variant="light"
                >
                  <Text size="xs">
                    💡 Ingresa el código que aparece en el tiquete del pasajero
                  </Text>
                </Alert>
              </Stack>
            )}
          </Stack>
        )}
      </div>
    </Modal>
  );
};

export default ValidateCupoModal;