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
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { RecoverAccountModal } from "@/components/RecoverAccountModal";
import styles from "./index.module.css";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoverModalOpened, setRecoverModalOpened] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useSupabaseAuth();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Correo electrónico inválido"),
      password: (value) => (value.length < 6 ? "La contraseña debe tener al menos 6 caracteres" : null),
    }
  });

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setError("");

      const result = await signIn(values.email, values.password);

      if (!result.success) {
        const errorMessage = result.error === 'Invalid login credentials'
          ? 'Credenciales inválidas'
          : result.error || 'Error al iniciar sesión';
        
        setError(errorMessage);
        return;
      }

      // El AuthGuard se encargará de la navegación automática
      console.log('Login successful');

    } catch (error) {
      console.error('Login error:', error);
      setError('Error inesperado al iniciar sesión');
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

        {error && (
          <Text color="red" size="sm" className={styles.errorMessage}>
            {error}
          </Text>
        )}

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