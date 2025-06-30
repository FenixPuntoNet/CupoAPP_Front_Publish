import type React from 'react';
import { User } from 'lucide-react';
import styles from './passenger.module.css';

interface PassengerSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PassengerSelector: React.FC<PassengerSelectorProps> = ({ value, onChange }) => {
  return (
    <div className={styles.passengerSelector}>
      {[1, 2, 3, 4].map((num) => (
        <div
          key={num}
          className={`${styles.passengerCard} ${value === num ? styles.selectedCard : ''}`}
          onClick={() => onChange(num)}
        >
          <div className={styles.passengerIcons}>
            {Array.from({ length: num }).map((_, index) => (
              <User 
                key={index} 
                size={16} 
                className={styles.passengerIcon}
                style={{ marginLeft: index !== 0 ? '-8px' : '0' }} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PassengerSelector;
