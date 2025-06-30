import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/carousel/styles.css';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { useJsApiLoader } from '@react-google-maps/api';
import ReservarView from './routes/publicarviaje/index';
import { routeTree } from './routeTree.gen';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  return (
    <MantineProvider>
      <RouterProvider router={router} />
      {/* Solo muestra ReservarView si Google Maps está listo */}
      {isLoaded ? (
        <ReservarView isLoaded={isLoaded} />
      ) : (
        // Puedes reemplazar esto por un esqueleto o simplemente dejarlo vacío
        <Center style={{ height: '100vh' }}>
          <Loader color="green" size="lg" />
        </Center>
      )}
    </MantineProvider>
  );
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
