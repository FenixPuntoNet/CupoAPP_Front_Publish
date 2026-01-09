import { useEffect } from 'react';
import { pushService } from '../services/pushService';

export const usePush = () => {
  useEffect(() => {
    pushService.initialize();
  }, []);
  
  return pushService;
};