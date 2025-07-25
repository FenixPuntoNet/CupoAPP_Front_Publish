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
import { registerUser, type SignupRequest } from "@/services/auth";

interface RegisterFormValues {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterView: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeEmails, setSubscribeEmails] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    return localStorage.getItem("cookiesAccepted") === "true";
  });

  const navigate = useNavigate();


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
      setLoading(true);
  
      // Preparar datos para el backend
      const userData: SignupRequest = {
        email: values.email,
        password: values.password,
        full_name: values.nombre,
        terms_accepted: acceptTerms,
        email_subscribed: subscribeEmails
      };

      // Registrar usuario usando el backend
      const result = await registerUser(userData);
  
      if (!result.success) {
        setError(result.error || 'Error al registrar usuario');
        return;
      }
  
      // Registro exitoso - mostrar mensaje y redirigir al login
      console.log('Registration successful:', result.message);
      navigate({ to: "/Login" });
  
    } catch (error) {
      console.error("Error durante el registro:", error);
      setError("Error inesperado durante el registro. Intenta nuevamente.");
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
            autoCapitalize="words"
            autoCorrect="off"
            autoComplete="name"
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
            autoComplete="new-password"
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
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="new-password"
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
          onChange={(e) => setAcceptTerms(e?.currentTarget?.checked ?? !acceptTerms)}
          label="Acepto los Términos y Condiciones"
          required
          mt="md"
        />
        <Checkbox
          checked={subscribeEmails}
          onChange={(e) => setSubscribeEmails(e?.currentTarget?.checked ?? !subscribeEmails)}
          label="Deseo recibir correos con información y promociones"
          mt="sm"
        />
        <div style={{ textAlign: "center", marginTop: 8, display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={styles.termsLink}
            tabIndex={0}
            role="button"
            aria-label="Abrir términos y condiciones"
            style={{ 
              textDecoration: "underline", 
              background: "none", 
              border: "none", 
              color: "#00ff9d", 
              fontWeight: 500, 
              font: "inherit", 
              cursor: "pointer",
              outline: "none",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "rgba(0, 255, 157, 0.2)",
              touchAction: "manipulation",
              minHeight: "44px",
              minWidth: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px"
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowTermsModal(true);
              }
            }}
          >
            📄 Términos y Condiciones
          </button>
          
          {/* Alternativa adicional para dispositivos problemáticos */}
          <Text
            size="sm"
            style={{ 
              color: "#00ff9d", 
              cursor: "pointer",
              textDecoration: "underline",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 500,
              touchAction: "manipulation",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "rgba(0, 255, 157, 0.2)",
              padding: "8px",
              borderRadius: "4px",
              transition: "background-color 0.2s ease"
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            role="button"
            tabIndex={0}
            aria-label="Abrir términos y condiciones (alternativo)"
          >
          </Text>
        </div>

        {error && (
          <Text color="red" size="sm" className={styles.errorMessage} mt="sm">
            {error}
          </Text>
        )}

        <Button
          loading={loading}
          fullWidth
          size="lg"
          className={styles.loginButton}
          type="submit"
          mt="xl"
          disabled={loading}
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
