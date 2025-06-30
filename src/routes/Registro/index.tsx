import React, { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  TextInput,
  Button,
  Container,
  Text,
  Group,
  UnstyledButton,
  LoadingOverlay,
  Checkbox,
} from "@mantine/core";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "@mantine/form";
import styles from "./index.module.css";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface RegisterFormValues {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterView: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeEmails, setSubscribeEmails] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    return localStorage.getItem("cookiesAccepted") === "true";
  });

  const navigate = useNavigate();
  const { signup, loading: authLoading } = useAuth();


  const form = useForm<RegisterFormValues>({
    initialValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      nombre: (value) => (value.length < 3 ? "El nombre debe tener al menos 3 caracteres" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Correo electrónico inválido"),
      password: (value) => {
        if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
        if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
        if (!/[0-9]/.test(value)) return "La contraseña debe incluir al menos un número";
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? "Las contraseñas no coinciden" : null,
    },
  });

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setError(null);
  
      // 1. Registrar usuario
      const success = await signup(
        values.email,
        values.password,
        values.nombre,
        acceptTerms ? "aceptado" : "rechazado",
        subscribeEmails ? "aceptado" : "rechazado"
      );
  
      if (!success) {
        setError("Ocurrió un error al registrar el usuario. Verifica los datos e intenta nuevamente.");
        return;
      }
  
      // 2. Iniciar sesión automáticamente
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
  
      if (authError || !authData.user) {
        setError("No se pudo iniciar sesión automáticamente. Intenta ingresar manualmente.");
        return;
      }
  
      // 3. Guardar datos mínimos en localStorage
      localStorage.setItem('userEmail', values.email);
      localStorage.setItem('userId', authData.user.id);
  
      // 4. Redirigir según perfil
      // (puedes consultar si el perfil está completo aquí si lo deseas)
      navigate({ to: "/CompletarRegistro", replace: true });
  
    } catch (error) {
      console.error("Registration error:", error);
      let message = "Ocurrió un error al registrar el usuario. Verifica los datos e intenta nuevamente.";
      if (
        error instanceof Error &&
        (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists") ||
          (error.message.toLowerCase().includes("email") && error.message.toLowerCase().includes("exist")) ||
          error.message.toLowerCase().includes("correo ya registrado")
        )
      ) {
        message = "Correo ya registrado";
      }
      setError(message);
    }
  };

  return (
    <Container className={styles.container}>
      <LoadingOverlay visible={authLoading} />

      <Group justify="flex-start" mb="xl">
        <UnstyledButton component={Link} to="/" className={styles.backButton}>
          <ArrowLeft size={24} />
        </UnstyledButton>
      </Group>

      <Box className={styles.logoSection}>
        <Box className={styles.logo}>
          <img
            src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png"
            alt="Cupo Logo"
          />
        </Box>
        <Text className={styles.title}>Crear una cuenta</Text>
        <Text className={styles.subtitle}>Únete a nosotros y empieza a viajar.</Text>
      </Box>

      <form
        onSubmit={form.onSubmit((values) => {
          if (!acceptTerms) {
            setError("Debes aceptar los Términos y Condiciones para continuar.");
            return;
          }
          handleRegister(values);
        })}
        className={styles.form}
      >
        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Nombre completo</Text>
          <TextInput
            placeholder="Tu nombre completo"
            className={styles.input}
            size="lg"
            required
            {...form.getInputProps("nombre")}
          />
        </Box>

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
              <UnstyledButton onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>

        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Confirmar Contraseña</Text>
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="Confirma tu contraseña"
            className={styles.input}
            size="lg"
            required
            {...form.getInputProps("confirmPassword")}
            rightSection={
              <UnstyledButton onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>
        <Checkbox
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.currentTarget.checked)}
          label="Acepto los Términos y Condiciones"
          required
          mt="md"
        />
        <Checkbox
          checked={subscribeEmails}
          onChange={(e) => setSubscribeEmails(e.currentTarget.checked)}
          label="Deseo recibir correos con información y promociones"
          mt="sm"
        />
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className={styles.termsLink}
            tabIndex={0}
            style={{ textDecoration: "underline", background: "none", border: "none", color: "#00ff9d", fontWeight: 500, font: "inherit", cursor: "pointer" }}
          >
            Haz clic aquí para leer los Términos y Condiciones
          </button>
        </div>

        {error && (
          <Text color="red" size="sm" className={styles.errorMessage} mt="sm">
            {error}
          </Text>
        )}

        <Button
          loading={authLoading}
          fullWidth
          size="lg"
          className={styles.loginButton}
          type="submit"
          mt="xl"
          disabled={authLoading}
        >
          Registrarse
        </Button>
      </form>

      {/* Modal profesional y reutilizable */}
      <TermsModal opened={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {!cookiesAccepted && (
        <Box className={styles.cookiesBanner}>
          <Text size="sm" className={styles.cookiesText}>
            Usamos cookies para mejorar tu experiencia. Al continuar, aceptas su uso.
          </Text>
          <Button
            size="xs"
            color="green"
            onClick={() => {
              localStorage.setItem("cookiesAccepted", "true");
              setCookiesAccepted(true);
            }}
          >
            Aceptar
          </Button>
        </Box>
      )}
    </Container>
  );
};

export const Route = createFileRoute("/Registro/")({
  component: RegisterView,
});
