import { createRootRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  AppShell,
  Group,
  MantineProvider,
  Text,
  UnstyledButton,
  Button as _Button,
  Box,  
  createTheme,
  Image,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import '@mantine/dates/styles.css';
import { Search, PlusCircle, History, User } from "lucide-react";
import { config } from "telefunc/client";
import styles from "./root.module.css";
import { BackendAuthProvider, useBackendAuth } from '@/context/BackendAuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';
import { ThemeToggle as _ThemeToggle } from '@/components/ThemeToggle';
import { useNotifications } from '@/hooks/useNotifications';
// import { usePushNotifications } from '@/modules/push';
import { setGlobalNavigate } from '@/services/notificationDisplay';

// Configure telefunc to use external backend
config.telefuncUrl = "https://cupo.site/_telefunc";

// Theme configuration
const theme = createTheme({
  fontFamily: "Onest, sans-serif",
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
  { icon: PlusCircle, label: "Publicar", to: "/publicarviaje/Origen" },
  { icon: "logo", label: "", to: "/home" },
  { icon: History, label: "Actividades", to: "/Actividades" },
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
    <ThemeProvider>
      <AppContent showNavigation={showNavigation} />
    </ThemeProvider>
  );
};

// 🔔 Componente para inicializar notificaciones globales SIN bloquear eventos
const GlobalNotificationManager = () => {
  const { isAuthenticated, loading } = useBackendAuth();
  const navigate = useNavigate();
  
  // ✅ EXISTENTE - Sistema de notificaciones internas (ya funciona)
  const notificationsHook = useNotifications({
    autoRefresh: isAuthenticated && !loading,
    enableRealTime: isAuthenticated && !loading,
    maxNotifications: 50
  });
  
  // 📱 NUEVO - Sistema de notificaciones push móviles
  // usePushNotifications();
  
  // 🎯 Configurar navegación global para las notificaciones
  useEffect(() => {
    setGlobalNavigate((to: string) => navigate({ to }));
    // 🔇 PRODUCCIÓN: Navegación configurada silenciosamente
  }, [navigate]);
  
  // 🚀 Inicializar sistema completo de notificaciones cuando el usuario se autentica
  useEffect(() => {
    if (!isAuthenticated || loading) {
      console.log('🔔 [GLOBAL-NOTIFICATIONS] Waiting for authentication...');
      return;
    }

    console.log('🔔 [NOTIFICATIONS] Initializing notification system...');
    
    // 📊 Log simple del estado
    console.log(`📊 [NOTIFICATIONS] Internal: ${notificationsHook.notifications.length} total, ${notificationsHook.unreadCount} unread`);

    // 🔇 PRODUCCIÓN: Sistema de notificaciones funciona silenciosamente

  }, [
    isAuthenticated, 
    loading, 
    notificationsHook.notifications.length, 
    notificationsHook.unreadCount,
  ]);
  
  return null; // No renderiza nada, solo gestiona las notificaciones
};

const AppContent = ({ showNavigation }: { showNavigation: boolean }) => {
  const { mantineColorScheme } = useTheme();

  return (
    <BackendAuthProvider>
      <MantineProvider theme={theme} defaultColorScheme={mantineColorScheme}>
        <GoogleMapsProvider>
          <AuthGuard>
          <AppShell
            header={{ height: showNavigation ? 60 : 0 }}
            footer={{ height: showNavigation ? 85 : 0 }}
            className={styles.appShell}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              overflow: 'hidden'
            }}
          >
            <div className={styles.backgroundEffect} />

            {/* {showNavigation && (
              <AppShell.Header className={styles.header}>
                <Group justify="space-between" className={styles.headerContent}>
                  <Image
                    src="https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/Logo.png"
                    alt="Logo"
                    className={styles.logoImage}
                  />
                  <Group gap="sm">
                    <_ThemeToggle />
                    <_Button
                      className={styles.registerButton}
                      component="a"
                      href="https://www.cupo.lat"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Más información</span>
                    </_Button>
                  </Group>
                </Group>
              </AppShell.Header>
            )} */}

            {/* <div className="flex items-center justify-end">
              <_ThemeToggle />
            </div> */}

            <AppShell.Main 
              className={styles.main}
              style={{
                height: '100vh',
                overflow: 'auto',
                paddingBottom: showNavigation ? '85px' : '0px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* 🔔 Gestor global de notificaciones - AQUÍ ES SEGURO */}
              <GlobalNotificationManager />
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
                            src="https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/Logo.png"
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
          <Notifications 
            position="bottom-right" 
            zIndex={1000}
            limit={4}
            containerWidth={320}
            style={{
              bottom: showNavigation ? '100px' : '20px',
              right: '16px',
              pointerEvents: 'none' // ¡CRÍTICO! Permite que los eventos pasen por debajo
            }}
          />
        </AuthGuard>
        </GoogleMapsProvider>
      </MantineProvider>
    </BackendAuthProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent
});