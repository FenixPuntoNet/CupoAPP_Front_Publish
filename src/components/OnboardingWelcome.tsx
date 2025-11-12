import React from 'react';
import { Box, Text, Button, Container, Group, Progress, Card } from '@mantine/core';
import { CheckCircle, User, Car } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useBackendAuth } from '@/context/BackendAuthContext';
import styles from './OnboardingWelcome.module.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface OnboardingWelcomeProps {
  onContinue?: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onContinue }) => {
  const navigate = useNavigate();
  const { user } = useBackendAuth();
  
  const currentStep = 0; // Siempre empezamos en el primer paso

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a Cupo!',
      description: 'Te acompañaremos para configurar tu cuenta paso a paso',
      icon: <CheckCircle className={styles.stepIcon} />,
      completed: true
    },
    {
      id: 'profile',
      title: 'Completar perfil',
      description: 'Agrega tu información personal para mayor seguridad',
      icon: <User className={styles.stepIcon} />,
      completed: false
    },
    {
      id: 'vehicle',
      title: 'Registro de vehículo',
      description: '¿Quieres ofrecer viajes? Registra tu vehículo (opcional)',
      icon: <Car className={styles.stepIcon} />,
      completed: false
    }
  ];

  const handleStartJourney = () => {
    console.log('🚀 Starting user onboarding journey');
    
    // Si hay callback, usarlo (cuando está en modal), sino navegar normalmente
    if (onContinue) {
      console.log('🎯 Using onContinue callback from modal');
      onContinue();
    } else {
      console.log('🎯 Navigating to CompletarRegistro');
      navigate({ to: '/CompletarRegistro', search: { from: 'onboarding' } });
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Container className={styles.container}>
      <Box className={styles.content}>
        {/* Header con logo y bienvenida */}
        <Box className={styles.header}>
          <Box className={styles.logo}>
            <img 
              src="https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/Logo.png" 
              alt="Cupo Logo" 
            />
          </Box>
          <Text className={styles.welcomeTitle}>
            ¡Hola {user?.username || 'Usuario'}! 👋
          </Text>
          <Text className={styles.welcomeSubtitle}>
            Vamos a configurar tu cuenta para que puedas viajar con nosotros
          </Text>
        </Box>

        {/* Barra de progreso */}
        <Box className={styles.progressSection}>
          <Text className={styles.progressLabel}>Progreso de configuración</Text>
          <Progress 
            value={progressPercentage} 
            className={styles.progressBar}
            size="lg"
            radius="xl"
          />
          <Text className={styles.progressText}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
        </Box>

        {/* Lista de pasos */}
        <Box className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              className={`${styles.stepCard} ${index === currentStep ? styles.activeStep : ''} ${step.completed ? styles.completedStep : ''}`}
            >
              <Group>
                <Box className={styles.stepIconContainer}>
                  {step.icon}
                </Box>
                <Box className={styles.stepContent}>
                  <Text className={styles.stepTitle}>{step.title}</Text>
                  <Text className={styles.stepDescription}>{step.description}</Text>
                </Box>
                {step.completed && (
                  <CheckCircle className={styles.completedIcon} />
                )}
              </Group>
            </Card>
          ))}
        </Box>

        {/* Botones de acción */}
        <Box className={styles.actionButtons}>
          <Button
            onClick={handleStartJourney}
            className={styles.primaryButton}
            size="lg"
            fullWidth
          >
            🚀 Comenzar configuración
          </Button>
        </Box>

        {/* Motivación adicional */}
        <Box className={styles.motivation}>
          <Text className={styles.motivationText}>
            ✨ Solo tomará 2 minutos y tendrás acceso completo a todas las funciones
          </Text>
        </Box>
      </Box>
    </Container>
  );
};
