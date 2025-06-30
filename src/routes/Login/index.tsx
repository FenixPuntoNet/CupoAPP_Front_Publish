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
import { supabase } from "@/lib/supabaseClient";
import styles from "./index.module.css";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const checkUserProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking user profile:', error);
      return false;
    }
  };

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setError("");

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No user data received');
      }

      // Store session data
      const session = authData.session;
      if (session) {
        // Store only necessary session data
        localStorage.setItem('userEmail', values.email);
        localStorage.setItem('userId', authData.user.id);
      }

      // Check user profile
      const hasProfile = await checkUserProfile(authData.user.id);
      
      // Navigate based on profile status
      if (hasProfile) {
        console.log('User has profile, redirecting to home');
        navigate({ to: "/home" });
      } else {
        console.log('User needs to complete profile');
        navigate({ to: "/CompletarRegistro" });
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(
        (error instanceof Error ? error.message : "") === 'Invalid login credentials'
          ? 'Credenciales inválidas'
          : 'Error al iniciar sesión'
      );
      localStorage.clear();
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
      </form>

      <Text className={styles.version}>v 0.0.1 (0)</Text>
    </Container>
  );
};

export const Route = createFileRoute("/Login/")({
  component: LoginView,
});