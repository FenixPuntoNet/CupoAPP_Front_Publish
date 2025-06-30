import { createFileRoute } from '@tanstack/react-router';
import Actividades from '../../components/Actividades/Actividades';

const ActividadesPage = () => {
  return <Actividades />;
};

export const Route = createFileRoute('/Actividades/ActividadesPage')({
  component: ActividadesPage,
});

export default ActividadesPage;