import type React from 'react';
import { useState } from 'react';
import { Popover, TextInput } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { Calendar } from 'lucide-react';
import styles from './CustomerPicker.module.css';

const CustomDatePicker: React.FC<{ value: Date | null; onChange: (date: Date | null) => void }> = ({ value, onChange }) => {
  const [opened, setOpened] = useState(false);

  // Definir la fecha mínima (hoy) y la fecha máxima (1 año desde hoy)
  const today = new Date();
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      position="bottom-start"
      withArrow
      width="target"
    >
      <Popover.Target>
        <TextInput
          placeholder="¿Cuándo viajas?"
          value={value ? value.toLocaleDateString() : ''}
          readOnly
          onClick={() => setOpened(true)}
          className={styles.dateInput}
          rightSection={<Calendar size={20} className={styles.icon} />}
        />
      </Popover.Target>

      <Popover.Dropdown className={styles.popoverContent}>
        <DatePicker
          value={value}
          onChange={(date) => {
            onChange(date);
            setOpened(false); // Cerrar después de seleccionar la fecha
          }}
          minDate={today} // Fechas desde hoy
          maxDate={oneYearFromNow} // Hasta un año adelante
          firstDayOfWeek={1} // 1 corresponde a lunes
          classNames={{
            calendarHeader: styles.calendarHeader,
            day: styles.day, // Para estilizar los días
            month: styles.month, // Para estilizar el mes actual
            weekday: styles.weekday, // Estilo de los días de la semana (Lunes, Martes, etc.)
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
};

export default CustomDatePicker;
