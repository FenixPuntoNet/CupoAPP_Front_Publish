import { createRootRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  AppShell,
  Group,
  MantineProvider,
  Text,
  UnstyledButton,
  Button,
  Box,
  createTheme,
  Image,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import '@mantine/dates/styles.css';
import { Search, PlusCircle, Car, User } from "lucide-react";
import { config } from "telefunc/client";
import styles from "./root.module.css";
import { AuthProvider } from '@/context/AuthContext';

// Configure telefunc
config.telefuncUrl = "http://localhost:3000/_telefunc";

// Theme configuration
const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  colors: {
    brand: [
      "#e6fff2",
      "#b3ffe0",
      "#80ffce",
      "#4dffbc",
      "#1affaa",
      "#00e699",
      "#00cc88",
      "#00b377",
      "#009966",
      "#008055",
    ],
  },
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 8 },
});

// Navigation items configuration
const navItems = [
  { icon: Search, label: "Buscar", to: "/reservar" },
  { icon: PlusCircle, label: "Publicar", to: "/publicarviaje" },
  { icon: "logo", label: "", to: "/home" },
  { icon: Car, label: "Actividades", to: "/Actividades" },
  { icon: User, label: "Menú", to: "/perfil" },
];

// Routes that shouldn't show the navigation bar
const noNavBarRoutes = [
  "/",
  "/Login",
  "/Registro",
  "/RecuperarPasword",
  "/Origen",
  "/Destino",
  "/publicarviaje",
  "/RegistrarVehiculo",
  "/RegistrarVehiculo/Documentos",
  "/DetallesViaje",
  "/PagarCupo",
  "/Reservas",
  "/CompletarRegistro",
  "/PagarCupo",
  "/ConfirmarCupo",
];

const RootComponent = () => {
  const location = useLocation();
  const showNavigation = !noNavBarRoutes.includes(location.pathname);

  return (
    <AuthProvider>
      <MantineProvider theme={theme} defaultColorScheme="dark">
          <AppShell
            header={{ height: showNavigation ? 60 : 0 }}
            footer={{ height: 72 }}
            className={styles.appShell}
          >
            <div className={styles.backgroundEffect} />

            {showNavigation && (
              <AppShell.Header className={styles.header}>
                <Group justify="space-between" className={styles.headerContent}>
                  <Image
                    src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png"
                    alt="Logo"
                    className={styles.logoImage}
                  />
                  <Button
                    className={styles.registerButton}
                    component="a"
                    href="https://www.cupo.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Más información</span>
                  </Button>
                </Group>
              </AppShell.Header>
            )}

            <AppShell.Main className={styles.main}>
              <Outlet />
            </AppShell.Main>

            {showNavigation && (
              <AppShell.Footer className={styles.footer}>
                <Group className={styles.navGroup}>
                  {navItems.map((item, index) => (
                    <UnstyledButton
                      key={item.label || `nav-item-${index}`}
                      component={Link}
                      to={item.to}
                      className={`${styles.navButton} ${index === 2 ? styles.centerButton : ""}`}
                    >
                      {index === 2 ? (
                        <Box className={styles.logoWrapper}>
                          <Image
                            src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png"
                            alt="Logo"
                            style={{ width: 60, height: 60 }}
                          />
                        </Box>
                      ) : (
                        <>
                          <Box className={styles.navIcon}>
                            {/* @ts-ignore */}
                            <item.icon size={30} />
                          </Box>
                          <Text className={styles.navLabel}>{item.label}</Text>
                        </>
                      )}
                    </UnstyledButton>
                  ))}
                </Group>
                <Box style={{ height: '16px' }} />
                <Box style={{ height: 'env(safe-area-inset-bottom)' }} />
              </AppShell.Footer>
            )}
          </AppShell>
          <Notifications />
      </MantineProvider>
    </AuthProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent
});