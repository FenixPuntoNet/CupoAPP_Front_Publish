import { useState, useCallback, useEffect } from 'react'
import {
  Container,
  Text,
  LoadingOverlay,
  Center,
  Title,
  Paper,
  Stack,
  Alert,
  Group,
  Modal,
  ActionIcon,
  Button,
  TextInput,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconAlertCircle, IconCheck, IconQrcode, IconX } from '@tabler/icons-react'
import { supabase } from '@/lib/supabaseClient'
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'
import styles from './ValidarCupo.module.css'
import { Capacitor } from '@capacitor/core'
import { CameraPreview } from '@capacitor-community/camera-preview'

const ValidarCupoComponent = () => {
  const params = Route.useParams() as { bookingId: string }
  const bookingId = Number(params.bookingId)

  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [modoManual, setModoManual] = useState(false)
  const [manualInput, setManualInput] = useState('')
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
      try {
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('id, booking_qr, booking_status')
          .eq('id', bookingId)
          .single()

        if (fetchError || !booking) {
          throw new Error('No se encontró el booking.')
        }

        if (booking.booking_status === 'payed') {
          setModalType('error')
          setError('Este cupo ya fue validado anteriormente.')
          setIsModalOpen(true)
          return
        }

        if (booking.booking_qr !== qrData) {
          setModalType('error')
          setError('Este código QR no coincide con la reserva seleccionada.')
          setIsModalOpen(true)
          return
        }

        await supabase
          .from('booking_passengers')
          .update({ status: 'validated' })
          .eq('booking_id', bookingId)

        await supabase
          .from('bookings')
          .update({ booking_status: 'payed' })
          .eq('id', bookingId)

        setModalType('success')
        setIsModalOpen(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al validar el cupo'
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
      // No uses overlays ni clases, deja que el plugin muestre la cámara
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
    navigate({ to: '/Actividades' })
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
      <Container size="sm" className={styles.container}>
      <LoadingOverlay visible={loading && !isScanning} />
      <Group justify="space-between" mb="sm">
        <Title order={2} className={styles.title}>
          Validar Cupo
        </Title>
        <ActionIcon variant="light" onClick={handleCloseModal}>
          <IconX size={18} />
        </ActionIcon>
      </Group>

      <Text ta="center" size="sm" color="dimmed" mb="md">
        Escanea el código QR del tiquete o ingresa el código manualmente. Esto confirma la llegada del pasajero y activa el pago, descontando la comisión de la plataforma Cupo.
      </Text>

      <Group justify="center" mb="md" gap="md">
        <Button
          leftSection={<IconQrcode size={18} />}
          onClick={() => {
            setModoManual(false)
            setScanResult(null)
            setError(null)
            startQRScan()
          }}
          disabled={isScanning}
          variant={modoManual ? 'outline' : 'filled'}
        >
          Leer código QR con cámara
        </Button>
        <Button
          onClick={() => {
            setModoManual(true)
            setScanResult(null)
            setError(null)
          }}
          disabled={isScanning}
          variant={modoManual ? 'filled' : 'outline'}
        >
          Ingresar código manualmente
        </Button>
      </Group>

      {!modoManual && (
        <Paper shadow="sm" radius="md" p="xl" className={styles.paper}>
          <Stack gap="lg" align="center">
            {isScanning && (
              <div className={`${styles.qrScannerContainer} ${styles.active}`}>
                <div
                  style={{
                    width: '80%',
                    height: '80%',
                    border: '3px dashed #34D399',
                    borderRadius: '16px',
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
                <span className={styles.scanningText}>
                  Cámara activa: Escaneando QR...
                </span>
              </div>
            )}
            {scanResult && (
              <Text ta="center" size="sm" className={styles.scanResult}>
                Código detectado: {scanResult}
              </Text>
            )}
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="filled">
                {error}
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {modoManual && (
        <Paper shadow="sm" radius="md" p="xl" className={styles.paper}>
          <Stack gap="md">
            <TextInput
              label="Código QR manual"
              placeholder="Ingresa el código QR aquí"
              value={manualInput}
              onChange={(e) => setManualInput(e.currentTarget.value)}
              disabled={loading}
            />
            <Button onClick={handleManualValidate} loading={loading} disabled={loading || !manualInput.trim()}>
              Validar código
            </Button>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="filled">
                {error}
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        centered
        title={modalType === 'success' ? 'Pasajero Verificado' : 'QR Incorrecto'}
      >
        <Stack>
          <Center>
            {modalType === 'success' ? (
              <IconCheck size={40} color="green" />
            ) : (
              <IconAlertCircle size={40} color="red" />
            )}
          </Center>
          <Text ta="center" size="lg" fw={500}>
            {modalType === 'success'
              ? '¡Validación exitosa! El pasajero ha sido registrado y el pago fue activado.'
              : 'Este código QR no coincide con la reserva seleccionada.'}
          </Text>
          <Text ta="center" size="xs" color="dimmed">
            {modalType === 'success'
              ? 'Se ha registrado la llegada y se activó el proceso de pago con comisión incluida.'
              : 'Verifica que el pasajero tenga el tiquete correcto.'}
          </Text>
          <Button fullWidth mt="sm" onClick={handleCloseModal}>
            Volver a viajes
          </Button>
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