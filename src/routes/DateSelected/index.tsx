import type React from 'react'
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Box,
  TextInput,
  Button,
  Title,
  Card,
  Text,
  Container,
} from '@mantine/core'
import { Search, Calendar, User, Car } from 'lucide-react'
import PassengerSelector from '../../components/ui/home/PassengerSelector' // Importamos el nuevo componente
import styles from './index.module.css'

interface SearchFormData {
  origin: string
  destination: string
  date: string
  passengers: number
}

const ReservarView: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [formData, setFormData] = useState<SearchFormData>({
    origin: '',
    destination: '',
    date: '',
    passengers: 1,
  })
  const [showPassengerSelector, setShowPassengerSelector] = useState(false)

  const handleInputChange =
    (field: keyof SearchFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === 'passengers'
            ? Number(event.target.value)
            : event.target.value,
      }))
    }

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSearching(true)

    try {
      // Simular búsqueda
      await new Promise((resolve) => setTimeout(resolve, 3000))
      console.log('Searching trips with data:', formData)
    } catch (error) {
      console.error('Error searching trips:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Container fluid className={styles.container}>
      <div className={styles.logoOverlay} />

      <div style={{height: '60px'}} />

      <Container size="md" className={styles.content}>
        <Box className={styles.searchSection}>
          <Title className={styles.searchTitle}>
            Encuentra tu viaje ideal
            <div className={styles.titleUnderline} />
          </Title>

          <Card className={styles.searchCard}>
            <form onSubmit={handleSearch}>
              <div className={styles.searchInputs}>
                <div className={styles.inputContainer}>
                  <div className={styles.inputIcon}>
                    <Search size={20} />
                  </div>
                  <TextInput
                    className={styles.input}
                    placeholder="¿De dónde sales?"
                    value={formData.origin}
                    onChange={handleInputChange('origin')}
                    variant="unstyled"
                    required
                  />
                </div>

                <div className={styles.inputContainer}>
                  <div className={styles.inputIcon}>
                    <Search size={20} />
                  </div>
                  <TextInput
                    className={styles.input}
                    placeholder="¿A dónde vas?"
                    value={formData.destination}
                    onChange={handleInputChange('destination')}
                    variant="unstyled"
                    required
                  />
                </div>

                <div className={styles.inputContainer}>
                  <div className={styles.inputIcon}>
                    <Calendar size={20} />
                  </div>
                  <TextInput
                    className={styles.input}
                    placeholder="¿Cuándo viajas?"
                    value={formData.date}
                    onChange={handleInputChange('date')}
                    variant="unstyled"
                    required
                  />
                </div>

                {/* Selector de pasajeros */}
                <div
                  className={styles.inputContainer}
                  onClick={() =>
                    setShowPassengerSelector(!showPassengerSelector)
                  }
                >
                  <div className={styles.inputIcon}>
                    <User size={20} />
                  </div>
                  <TextInput
                    className={styles.input}
                    value={`${formData.passengers} ${formData.passengers > 1 ? 'Pasajeros' : 'Pasajero'}`}
                    readOnly
                    variant="unstyled"
                    required
                    rightSection={
                      <div className={styles.passengerIconWrapper}>
                        {Array.from({ length: formData.passengers }).map(
                          (_, i) => (
                            <User
                              key={i}
                              size={16}
                              className={styles.passengerIcon}
                            />
                          ),
                        )}
                      </div>
                    }
                  />
                </div>

                {/* Componente PassengerSelector */}
                {showPassengerSelector && (
                  <PassengerSelector
                    value={formData.passengers}
                    onChange={(num) => {
                      setFormData((prev) => ({ ...prev, passengers: num }))
                      setShowPassengerSelector(false) // Ocultar después de seleccionar
                    }}
                  />
                )}

                <Button
                  className={`${styles.searchButton} ${isSearching ? styles.searching : ''}`}
                  type="submit"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className={styles.searchingAnimation}>
                      <Car className={styles.carIcon} size={24} />
                      <div className={styles.road}>
                        <div className={styles.roadLine} />
                        <div className={styles.roadLine} />
                        <div className={styles.roadLine} />
                      </div>
                    </div>
                  ) : (
                    'Buscar'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </Box>

        <Box className={styles.resultsSection}>
          <Title className={styles.resultsTitle}>Viajes disponibles</Title>
          <Text className={styles.resultsSubtitle}>
            Ingresa los detalles de tu viaje para ver las opciones disponibles
          </Text>
        </Box>
      </Container>
    </Container>
  )
}

export const Route = createFileRoute('/DateSelected/')({
  component: ReservarView,
})
