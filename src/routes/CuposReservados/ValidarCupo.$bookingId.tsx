import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  LoadingOverlay,
  Modal,
  Alert,
  SimpleGrid
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconAlertCircle, IconCheck, IconQrcode, IconX } from '@tabler/icons-react'
import { validateCupo } from '@/services/cupos'
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'
import styles from './ValidarCupo.module.css'
import { Capacitor } from '@capacitor/core'
import { CameraPreview } from '@capacitor-community/camera-preview'
import ValidateTicketInfo from '@/components/pricing/ValidateTicketInfo'
import { useAssumptions } from '@/hooks/useAssumptions'

// Estilos CSS mejorados
const animationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  @keyframes slideIn {
    0% { width: 0%; opacity: 0; }
    100% { width: 100%; opacity: 1; }
  }
  
  .hover-lift {
    transition: all 0.3s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }
`

// Agregar estilos al head
if (typeof document !== 'undefined' && !document.getElementById('validar-cupo-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'validar-cupo-styles'
  styleSheet.textContent = animationStyles
  document.head.appendChild(styleSheet)
}

const ValidarCupoComponent = () => {
  const params = Route.useParams() as { bookingId: string }
  const bookingId = Number(params.bookingId)
  const { assumptions } = useAssumptions()

  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [modoManual, setModoManual] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [commissionInfo, setCommissionInfo] = useState<{
    bookingPrice: number;
    commissionCharged: number;
    commissionPercentage: number;
  } | null>(null)
  const navigate = useNavigate()

  // Validar el QR contra la base de datos
  const validateQR = useCallback(
    async (qrData: string) => {
      if (scanResult === qrData) {
        setError('Este código ya fue escaneado.')
        setModalType('error')
        setIsModalOpen(true)
        setLoading(false)
        return
      }
      
      setLoading(true)
      console.log(`🔍 [ValidarCupo] Validating QR for booking ${bookingId} with code: ${qrData}`);
      
      try {
        const result = await validateCupo(bookingId, qrData);
        
        console.log(`✅ [ValidarCupo] Validation result:`, result);
        
        if (result.success && result.data) {
          console.log(`✅ [ValidarCupo] Cupo validated successfully`);
          setModalType('success')
          setIsModalOpen(true)
          setScanResult(qrData)
          
          // Guardar información de comisión para mostrar el desglose
          if (result.data.booking_price && result.data.commission_charged) {
            setCommissionInfo({
              bookingPrice: result.data.booking_price,
              commissionCharged: result.data.commission_charged,
              commissionPercentage: result.data.commission_percentage || 0
            });
          }
          
          // Mensaje mejorado que incluye información de comisión si está disponible
          let notificationMessage = 'El cupo ha sido validado correctamente';
          if (result.data.commission_charged && result.data.commission_percentage) {
            notificationMessage += `. Comisión: ${result.data.commission_percentage}% ($${result.data.commission_charged.toLocaleString()})`;
          }
          
          showNotification({
            title: '¡Validación exitosa!',
            message: notificationMessage,
            color: 'green',
          });
        } else {
          console.error(`❌ [ValidarCupo] Validation failed:`, result.error);
          setModalType('error')
          
          // Manejar diferentes tipos de errores
          let errorMessage = 'Error al validar el cupo';
          
          if (result.error?.includes('QR inválido') || result.error?.includes('no coincide')) {
            errorMessage = 'El código QR no coincide con esta reserva';
          } else if (result.error?.includes('ya fue validado') || result.error?.includes('ya validado')) {
            errorMessage = 'Este cupo ya fue validado anteriormente';
          } else if (result.error?.includes('permisos')) {
            errorMessage = 'No tienes permisos para validar este cupo';
          } else if (result.error?.includes('no encontrada')) {
            errorMessage = 'Reserva no encontrada';
          } else if (result.error?.includes('saldo insuficiente')) {
            errorMessage = 'Saldo congelado insuficiente para procesar la comisión';
          } else if (result.error) {
            errorMessage = result.error;
          }
          
          setError(errorMessage)
          setIsModalOpen(true)
        }
      } catch (err) {
        console.error(`❌ [ValidarCupo] Unexpected error:`, err);
        const msg = err instanceof Error ? err.message : 'Error inesperado al validar el cupo'
        setError(msg)
        setModalType('error')
        setIsModalOpen(true)
      } finally {
        setLoading(false)
      }
    },
    [bookingId, scanResult]
  )

  // Iniciar escaneo de QR
  const startQRScan = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('El escáner solo está disponible en dispositivos móviles.')
      setModalType('error')
      setIsModalOpen(true)
      return
    }
    try {
      await BarcodeScanner.stopScan().catch(() => {})
      setIsScanning(true)
      const permission = await BarcodeScanner.checkPermission({ force: true })
      if (!permission.granted) {
        setError('Permiso de cámara denegado.')
        setModalType('error')
        setIsModalOpen(true)
        setIsScanning(false)
        return
      }
      await BarcodeScanner.prepare()
      const result = await BarcodeScanner.startScan()
      setIsScanning(false)
      if (!result || !result.hasContent || !result.content) {
        setError('No se pudo leer el código QR.')
        setModalType('error')
        setIsModalOpen(true)
        return
      }
      const qrData = result.content
      if (scanResult === qrData) return
      setScanResult(qrData)
      showNotification({
        title: 'QR Escaneado',
        message: `Código detectado: ${qrData}`,
        color: 'blue',
        icon: <IconQrcode size={16} />,
      })
      await validateQR(qrData)
      await BarcodeScanner.stopScan().catch(() => {})
    } catch (err) {
      setIsScanning(false)
      setError('No se pudo leer el código QR.')
      setModalType('error')
      setIsModalOpen(true)
      await BarcodeScanner.stopScan().catch(() => {})
    }
  }, [validateQR, scanResult])

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      BarcodeScanner.stopScan().catch(() => {})
    }
  }, [])

  // Iniciar cámara nativa detrás del DOM
  useEffect(() => {
    const startCamera = async () => {
      if (!Capacitor.isNativePlatform()) return
      try {
        await CameraPreview.start({
          parent: 'cameraPreview',
          position: 'rear',
          toBack: true,
          className: 'cameraPreview',
        })
      } catch (err) {
        console.error('Error al iniciar CameraPreview:', err)
      }
    }

    startCamera()

    return () => {
      CameraPreview.stop().catch(() => {})
    }
  }, [])

  // Cerrar modal y limpiar overlays
  const handleCloseModal = async () => {
    setIsModalOpen(false)
    try {
      await BarcodeScanner.stopScan()
    } catch (_) {}
    navigate({ to: '/CuposReservados', search: { tripId: undefined } })
  }

  // Validar input manual
  const handleManualValidate = async () => {
    if (!manualInput.trim()) {
      setError('Por favor, ingresa un código QR válido.')
      setModalType('error')
      setIsModalOpen(true)
      return
    }
    setScanResult(manualInput.trim())
    await validateQR(manualInput.trim())
  }

  return (
    <>
      <div
        id="cameraPreview"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
      <Container size="md" className={styles.container}>
        <LoadingOverlay visible={loading && !isScanning} />
        
        {/* Header Mejorado */}
        <Paper 
          shadow="lg" 
          radius="xl" 
          p="xl" 
          mb="xl" 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Group justify="space-between" align="center">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconQrcode size={32} color="white" />
              </div>
              <div>
                <Title order={1} size="h2" style={{ 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '24px'
                }}>
                  Validar Cupo
                </Title>
                <Text size="md" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Booking ID: #{bookingId}
                </Text>
              </div>
            </div>
            
            <Button
              variant="white"
              size="md"
              radius="lg"
              leftSection={<IconX size={20} />}
              onClick={() => navigate({ to: '/CuposReservados', search: { tripId: undefined } })}
            >
              Cerrar
            </Button>
          </Group>
        </Paper>

        {/* Instrucciones */}
        <Paper shadow="md" radius="lg" p="xl" mb="lg" style={{ backgroundColor: '#f8fafc' }}>
          <Stack gap="md" align="center">
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <IconQrcode size={36} color="white" />
              </div>
              
              <Title order={2} size="h3" mb="md" style={{ color: '#1f2937' }}>
                Verificación de Pasajero
              </Title>
              
              <Text size="md" c="dimmed" style={{ lineHeight: 1.6, maxWidth: '500px' }}>
                Escanea el código QR del tiquete del pasajero o ingresa el código manualmente. 
                Al validar confirmas su llegada y se activa automáticamente el proceso de pago.
              </Text>
            </div>
          </Stack>
        </Paper>

        {/* Botones de Acción */}
        <Paper shadow="md" radius="lg" p="lg" mb="lg">
          <Title order={3} size="h4" mb="lg" ta="center" style={{ color: '#1f2937' }}>
            Métodos de Validación
          </Title>
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              size="lg"
              radius="md"
              leftSection={<IconQrcode size={20} />}
              onClick={startQRScan}
              disabled={isScanning}
              style={{ height: '60px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  📱 Escanear con Cámara
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Usa la cámara para escanear
                </div>
              </div>
            </Button>

            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape' }}
              size="lg"
              radius="md"
              leftSection={<IconQrcode size={20} />}
              onClick={() => setModoManual(true)}
              disabled={isScanning}
              style={{ height: '60px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  ✏️ Ingresar Código
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Escribir código manualmente
                </div>
              </div>
            </Button>
          </SimpleGrid>

          <Alert icon={<IconAlertCircle size={16} />} variant="light" color="blue" mt="md">
            <Text size="sm">
              💡 El código QR es la forma más rápida y segura de validar. Si tienes problemas con la cámara, puedes ingresar el código manualmente.
            </Text>
          </Alert>
        </Paper>

        {/* Interfaz de Escáner */}
        {!modoManual && (
          <Paper shadow="sm" radius="md" p="lg" mb="lg">
            <Stack gap="lg" align="center">
              <div className={styles.qrScannerContainer + (isScanning ? ' ' + styles.scanning : '')}>
                {isScanning && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    color: '#34D399'
                  }}>
                    <IconQrcode size={48} style={{ marginBottom: '8px' }} />
                    <Text size="sm" fw={600} style={{ color: '#34D399' }}>
                      Buscando código QR...
                    </Text>
                  </div>
                )}
                
                {!isScanning && !scanResult && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b'
                  }}>
                    <IconQrcode size={64} style={{ marginBottom: '12px' }} />
                    <Text size="sm" fw={600} c="dimmed">
                      Listo para escanear
                    </Text>
                  </div>
                )}
              </div>

              {scanResult && (
                <div style={{ textAlign: 'center' }}>
                  <Text className={styles.scanResult}>
                    ✅ QR detectado: {scanResult}
                  </Text>
                </div>
              )}

              {isScanning ? (
                <Button
                  color="red"
                  size="lg"
                  radius="md"
                  fullWidth
                  leftSection={<IconX size={18} />}
                  onClick={async () => {
                    setIsScanning(false)
                    await BarcodeScanner.stopScan().catch(() => {})
                  }}
                  style={{ maxWidth: '280px' }}
                >
                  Cancelar Escaneo
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  gradient={{ from: 'teal', to: 'blue' }}
                  size="lg"
                  radius="md"
                  fullWidth
                  leftSection={<IconQrcode size={18} />}
                  onClick={startQRScan}
                  style={{ maxWidth: '280px' }}
                >
                  Iniciar Escáner
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {/* Modo Manual */}
        {modoManual && (
          <Paper shadow="sm" radius="md" p="lg" mb="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4} size="h5">Ingreso Manual</Title>
                <Button variant="subtle" size="sm" onClick={() => setModoManual(false)}>
                  Volver al escáner
                </Button>
              </Group>
              
              <input
                type="text"
                placeholder="Ingresa el código QR del tiquete..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className={styles.manualInput}
                autoFocus
              />
              
              <Group justify="space-between" mt="md">
                <Button variant="light" onClick={() => setModoManual(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="gradient" 
                  gradient={{ from: 'teal', to: 'blue' }}
                  onClick={handleManualValidate}
                  disabled={!manualInput.trim()}
                >
                  Validar Código
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Modal de Resultados */}
        <Modal
          opened={isModalOpen}
          onClose={handleCloseModal}
          size="md"
          radius="md"
          centered
          padding="lg"
          overlayProps={{ blur: 3 }}
          withCloseButton={false}
        >
          <Stack gap="lg" align="center">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: modalType === 'success' ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {modalType === 'success' ? (
                <IconCheck size={40} color="white" />
              ) : (
                <IconX size={40} color="white" />
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Title order={2} size="h3" mb="xs" c={modalType === 'success' ? 'green' : 'red'}>
                {modalType === 'success' ? '🎉 ¡Validación Exitosa!' : '❌ Validación Fallida'}
              </Title>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {modalType === 'success'
                  ? 'El pasajero ha sido validado correctamente. La reserva está ahora activa y el proceso de pago se ha iniciado automáticamente.'
                  : error || 'No se pudo validar el código. Por favor, verifica que el código QR sea correcto e intenta nuevamente.'}
              </Text>
            </div>

            <Paper p="md" radius="md" style={{ 
              backgroundColor: modalType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${modalType === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              <Text size="sm" ta="center">
                {modalType === 'success'
                  ? '💰 La comisión de Cupo se agregará automáticamente al proceso de pago.'
                  : '🔍 Asegúrate de que el código QR esté bien escaneado o que el código manual sea correcto.'}
              </Text>
            </Paper>

            {/* Mostrar desglose de comisión cuando la validación es exitosa */}
            {modalType === 'success' && commissionInfo && assumptions && (
              <div style={{ width: '100%', marginTop: '16px' }}>
                <ValidateTicketInfo
                  commission={{
                    bookingPrice: commissionInfo.bookingPrice,
                    percentageCommission: Math.ceil(commissionInfo.bookingPrice * ((assumptions.fee_percentage || 0) / 100)),
                    fixedRate: assumptions.fixed_rate || 0,
                    totalCommission: commissionInfo.commissionCharged,
                    refund: commissionInfo.bookingPrice - commissionInfo.commissionCharged,
                    breakdown: `${assumptions.fee_percentage || 0}% ($${Math.ceil(commissionInfo.bookingPrice * ((assumptions.fee_percentage || 0) / 100)).toLocaleString()}) + Tarifa fija ($${(assumptions.fixed_rate || 0).toLocaleString()}) = $${commissionInfo.commissionCharged.toLocaleString()}`
                  }}
                  assumptions={assumptions}
                />
              </div>
            )}

            {modalType === 'success' && (
              <Group gap="md" justify="center">
                <Button 
                  variant="filled" 
                  color="blue"
                  size="md"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => {
                    setIsModalOpen(false)
                    navigate({ to: '/CuposReservados', search: { tripId: undefined } })
                  }}
                >
                  Ver Reservas
                </Button>
                
                <Button 
                  variant="outline" 
                  color="blue"
                  size="md"
                  leftSection={<IconQrcode size={16} />}
                  onClick={() => {
                    setIsModalOpen(false)
                    setScanResult(null)
                    setManualInput('')
                    setError(null)
                    setModalType(null)
                  }}
                >
                  Validar Otro
                </Button>
              </Group>
            )}

            {modalType !== 'success' && (
              <Button 
                variant="filled" 
                color="red"
                size="md"
                leftSection={<IconX size={16} />}
                onClick={() => {
                  setIsModalOpen(false)
                  setError(null)
                  setModalType(null)
                }}
              >
                Intentar de Nuevo
              </Button>
            )}
          </Stack>
        </Modal>
      </Container>
    </>
  )
}

export const Route = createFileRoute('/CuposReservados/ValidarCupo/$bookingId')({
  component: ValidarCupoComponent,
})

export default ValidarCupoComponent
