import { createFileRoute } from '@tanstack/react-router';
import ActividadesPage from './ActividadesPage';

const ActividadesRoute = () => {
  return <ActividadesPage />;
};

export const Route = createFileRoute('/Actividades/')({
  component: ActividadesRoute,
});

export default ActividadesRoute;