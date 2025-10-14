import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { DatePicker } from '@mantine/dates';
import { Text, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { tripStore } from '../../../types/PublicarViaje/TripDataManagement';
import styles from './index.module.css';

function FechaHoraView() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const handleDateChange = (value: Date | null) => {
    setSelectedDate(value);
    if (value) {
      setShowTimeSelector(true);
    } else {
      setShowTimeSelector(false);
    }
  };

  const handleTimeConfirm = () => {
    if (!selectedDate) return;
    
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(selectedHour, selectedMinute, 0, 0);
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (selectedDateTime < oneHourFromNow) {
      notifications.show({
        title: 'Error',
        message: 'La fecha debe ser al menos 1 hora en el futuro',
        color: 'red',
      });
      return;
    }

    // ✅ GUARDAR EN TRIPSTORE ANTES DE NAVEGAR - PRESERVANDO DATOS EXISTENTES
    console.log('💾 [FECHA-HORA] Guardando fecha y hora:', selectedDateTime.toISOString());
    
    // 🔍 DEBUG: Verificar datos actuales antes de guardar
    const currentData = tripStore.getStoredData();
    console.log('🔍 [FECHA-HORA] Datos actuales del tripStore ANTES de guardar:', currentData);
    console.log('🔍 [FECHA-HORA] ¿Tiene selectedRoute?:', !!currentData.selectedRoute);
    console.log('🔍 [FECHA-HORA] ¿Tiene origin?:', !!currentData.origin);
    console.log('🔍 [FECHA-HORA] ¿Tiene destination?:', !!currentData.destination);
    
    // 🔧 IMPORTANTE: Solo actualizar dateTime, preservar el resto de datos
    const updatedData = {
      ...currentData,
      dateTime: selectedDateTime.toISOString()
    };
    
    tripStore.updateData(updatedData);

    // 🔍 DEBUG: Verificar datos después de guardar
    const finalData = tripStore.getStoredData();
    console.log('🔍 [FECHA-HORA] Datos actuales del tripStore DESPUÉS de guardar:', finalData);
    console.log('🔍 [FECHA-HORA] selectedRoute preservada:', !!finalData.selectedRoute);

    notifications.show({
      title: 'Éxito',
      message: 'Fecha y hora guardadas correctamente',
      color: 'green',
    });

    // Navigate automatically
    console.log('🚀 [FECHA-HORA] Navegando a asientos-precio...');
    navigate({
      to: '/publicarviaje/asientos-precio',
    });
  };

  const handleBackToDate = () => {
    setShowTimeSelector(false);
    setSelectedDate(null);
  };

  const getSelectedDateTime = () => {
    if (!selectedDate) return null;
    const dateTime = new Date(selectedDate);
    dateTime.setHours(selectedHour, selectedMinute, 0, 0);
    return dateTime;
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate({ to: '/publicarviaje/rutas' })}
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Title Section */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>¿Cuándo vas a viajar?</h1>
        <p className={styles.subtitle}>Selecciona la fecha y hora de salida de tu viaje</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Main Selector Card - Changes between Date and Time */}
        <div className={styles.dateTimeCard}>
          {!showTimeSelector ? (
            // Date Picker
            <>
              <div className={styles.iconSection}>
                <Calendar className={styles.calendarIcon} size={32} />
              </div>
              
              <div className={styles.pickerSection}>
                <Stack gap="md" align="center">
                  <Text size="lg" fw={600} c="dark.8" mb="xs" className={styles.sectionTitle}>
                    Selecciona la fecha
                  </Text>
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    size="lg"
                    className={styles.datePicker}
                  />
                </Stack>
              </div>
            </>
          ) : (
            // Time Picker
            <>
              <div className={styles.iconSection}>
                <Clock className={styles.calendarIcon} size={32} />
              </div>
              
              <div className={styles.pickerSection}>
                <Stack gap="lg" align="center">
                  <Text size="lg" fw={600} c="dark.8" mb="xs" className={styles.sectionTitle}>
                    Selecciona la hora
                  </Text>
                  
                  {/* Current Time Display */}
                  <div className={styles.timeDisplay}>
                    {formatTime(selectedHour, selectedMinute)}
                  </div>
                  
                  {/* Hour Selector */}
                  <div className={styles.timeSliderSection}>
                    <Text size="sm" fw={500} c="dark.6" mb="xs" className={styles.sliderLabel}>Hora</Text>
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                      className={styles.timeSlider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>00</span>
                      <span>12</span>
                      <span>23</span>
                    </div>
                  </div>
                  
                  {/* Minute Selector */}
                  <div className={styles.timeSliderSection}>
                    <Text size="sm" fw={500} c="dark.6" mb="xs" className={styles.sliderLabel}>Minutos</Text>
                    <input
                      type="range"
                      min="0"
                      max="59"
                      step="5"
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                      className={styles.timeSlider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>00</span>
                      <span>30</span>
                      <span>59</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className={styles.timeActions}>
                    <button 
                      onClick={handleBackToDate}
                      className={styles.backToDateButton}
                    >
                      ← Cambiar fecha
                    </button>
                    <button 
                      onClick={handleTimeConfirm}
                      className={styles.confirmTimeButton}
                    >
                      Confirmar hora
                    </button>
                  </div>
                </Stack>
              </div>
            </>
          )}
        </div>

        {/* Selected Date Preview */}
        {getSelectedDateTime() && showTimeSelector && (
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <Clock className={styles.clockIcon} size={20} />
              <Text className={styles.previewTitle}>Fecha y hora seleccionada</Text>
            </div>
            <Text className={styles.previewDate}>
              {getSelectedDateTime()!.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text className={styles.previewTime}>
              {getSelectedDateTime()!.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/fecha-hora/')({
  component: FechaHoraView,
});

export default FechaHoraView;