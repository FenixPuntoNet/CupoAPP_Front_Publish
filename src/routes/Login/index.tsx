import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  TextInput,
  Button,
  Container,
  Text,
  Group,
  UnstyledButton,
  LoadingOverlay,
} from "@mantine/core";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { RecoverAccountModal } from "@/components/RecoverAccountModal";
import { useBackendAuth } from "@/context/BackendAuthContext";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import styles from "./index.module.css";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverModalOpened, setRecoverModalOpened] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useBackendAuth();
  const { handleValidationError, handleBackendError, showSuccess } = useErrorHandling();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        const validationError = handleValidationError('email', value);
        return validationError ? validationError.message : null;
      },
      password: (value) => {
        const validationError = handleValidationError('password', value);
        return validationError ? validationError.message : null;
      },
    }
  });

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      
      console.log('🔍 Login button clicked');

      const result = await signIn(values.email, values.password);
      console.log('🔄 Login result:', result);

      if (!result.success) {
        console.log('❌ Login failed:', result.error);
        handleBackendError(result.error || 'Error al iniciar sesión', {
          id: 'login-error',
          autoClose: 6000
        });
        return;
      }

      // Verificar si se recibió un token de autenticación
      if (result.token) {
        console.log('🔑 Login successful with auth token - AuthGuard will handle navigation');
        showSuccess(
          'Inicio de sesión exitoso',
          'Bienvenido de vuelta. Serás redirigido automáticamente.',
          { 
            id: 'login-success',
            autoClose: 2000 
          }
        );
      } else {
        console.log('⚠️ Login successful but no auth token received');
        showSuccess(
          'Inicio de sesión exitoso',
          'Has iniciado sesión correctamente.',
          { 
            id: 'login-success',
            autoClose: 2000 
          }
        );
      }
      
      // No navegar manualmente - dejar que el AuthGuard detecte el cambio de estado

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Usar el hook para manejar el error
      handleBackendError(error, {
        id: 'login-error',
        autoClose: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={styles.container}>
      <LoadingOverlay visible={loading} />
      
      <Group justify="flex-start" mb="xl">
        <UnstyledButton component={Link} to="/" className={styles.backButton}>
          <ArrowLeft size={24} />
        </UnstyledButton>
      </Group>

      <Box className={styles.logoSection}>
        <Box className={styles.logo}>
          <img src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png" alt="Cupo Logo" /> 
        </Box>
        <Text className={styles.title}>
          Hola de nuevo, <span className={styles.userName}>Usuario</span>
        </Text>
        <Text className={styles.subtitle}>
          Hoy es un gran día para viajar con nosotros.
        </Text>
      </Box>

      <form onSubmit={form.onSubmit(handleLogin)} className={styles.form}>
        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Correo electrónico</Text>
          <TextInput
            placeholder="ejemplo@correo.com"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            {...form.getInputProps("email")}
          />
        </Box>

        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Contraseña</Text>
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            {...form.getInputProps("password")}
            rightSection={
              <UnstyledButton
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>

        <Button
          loading={loading}
          fullWidth
          size="lg"
          className={styles.loginButton}
          type="submit"
        >
          Ingresar
        </Button>

        <UnstyledButton
          className={styles.forgotPassword}
          onClick={() => navigate({ to: "/RecuperarPasword/ForgotPassword" })}
        >
          Olvidé mi contraseña
        </UnstyledButton>

        <UnstyledButton
          className={styles.recoverAccount}
          onClick={() => setRecoverModalOpened(true)}
        >
          Recuperar cuenta desactivada
        </UnstyledButton>
      </form>

      <RecoverAccountModal
        opened={recoverModalOpened}
        onClose={() => setRecoverModalOpened(false)}
      />

      <Text className={styles.version}>v 0.0.1 (0)</Text>
    </Container>
  );
};

export const Route = createFileRoute("/Login/")({
  component: LoginView,
});