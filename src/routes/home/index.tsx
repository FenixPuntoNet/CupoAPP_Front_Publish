import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Box,
  Group,
  Paper,
  Space,
} from '@mantine/core';
import {
  // Car,
  // Globe,
  // PiggyBank,
  // Users,
  // MapPin,
  // Leaf,
  Shield as _Shield,
  // ChevronRight,
  // Star,
  // MessageCircle,
  // TrendingUp,
  // Phone,
  // Zap,
  // Calendar,
  Target,
  Trophy,
  Coins,
  Gift,
  ArrowRight,
} from 'lucide-react';
import styles from './home.module.css';
// import { FeatureCarousel } from '../../components/ui/home/FeatureCarousel';
// import { title } from "process";

const HomeView = () => {
  // Características principales
  /* const features = [
    {
      icon: Car,
      title: "Viajes compartidos",
      description: "Conecta con conductores y viajeros que comparten tu ruta.",
      color: "#00ff9d",
    },
    {
      icon: Globe,
      title: "Destinos nacionales",
      description: "Viaja a cualquier destino dentro del país de manera segura.",
      color: "#00ccff",
    },
    {
      icon: PiggyBank,
      title: "Ahorra en viajes",
      description: "Reduce tus costos de transporte compartiendo gastos.",
      color: "#ff9d00",
    },
    {
      icon: Users,
      title: "Comunidad confiable",
      description: "Usuarios verificados y sistema de reputación.",
      color: "#ff00ff",
    },
    {
      icon: MapPin,
      title: "Rutas flexibles",
      description: "Encuentra o publica viajes que se ajusten a tus necesidades.",
      color: "#9d00ff",
    },
    {
      icon: _Shield,
      title: "Viajes seguros",
      description: "Sistema de verificación y seguimiento en tiempo real.",
      color: "#ff5722",
    },
  ]; */  // NUEVO: Bloque visual para explicar el sistema de objetivos, recompensas y UniCoins
  const rewards = [
    {
      icon: (
        <span className={styles.objectiveIconWrap}>
          <Target size={22} color="#fff" />
          <Trophy size={10} color="#00cc7a" style={{ position: 'absolute', right: -6, top: -6, background: 'transparent', borderRadius: '50%' }} />
        </span>
      ),
      title: "Objetivos & Retos",
      desc: "Cumple retos y gana UniCoins y premios exclusivos.",
      to: "/account",
      badge: "Retos",
    },
    {
      icon: <Coins size={22} color="#fff" />,
      title: "UniCoins",
      desc: "Gana UniCoins por tus viajes y participación.",
      to: "/account",
      badge: "Wallet"
    },
    {
      icon: <Gift size={22} color="#fff" />,
      title: "Tienda de Recompensas",
      desc: "Canjea tus UniCoins por productos y experiencias.",
      to: "/change",
      badge: "Canjea",
    },
  ];  

  return (
    <Container fluid className={styles.container}>
      {/* 1. HERO SECTION */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div style={{height: '30px'}} />
          <Title className={styles.heroTitle}>
            Tu viaje más inteligente
            <span className={styles.heroHighlight}> Empieza aquí</span>
          </Title>
          <Text className={styles.heroSubtitle}>
            Conecta, comparte y viaja de manera sostenible con la comunidad Cupo.
          </Text>
          <Group className={styles.heroButtons}>
            <Button
              size="lg"
              className={styles.primaryButton}
              component={Link}
              to="/reservar"
              rightSection={<ArrowRight size={18} />}              
            >
              Buscar viaje
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={styles.secondaryButton}
              component={Link}
              to="/publicarviaje/Origen"
              rightSection={<ArrowRight size={18} />}
            >
              Publicar viaje
            </Button>            
          </Group>
          <div className={styles.sectionHeader}>
            <Title order={2} className={styles.sectionTitle}>
              <span className={styles.titleGlow}></span>
            </Title>
            {/* <Text className={styles.sectionSubtitle}>
              Descubre por qué miles de personas eligen Cupo para sus viajes diarios.
            </Text> */}
          </div>
          {/* <FeatureCarousel features={features} /> */}
          
          
        </div>
        <div className={styles.heroVisual} />
      </div>


      {/* 5. REWARDS */}
      <Box className="py-20">
        <div className={styles.rewardsHeader}>
          <Title order={2} className={styles.rewardsTitle}>
            ¡Desbloquea tu experiencia Cupo!
          </Title>
          <Text className={styles.rewardsSubtitle}>
            <b>Participa, cumple objetivos y canjea tus UniCoins</b> por productos y experiencias únicas. <span className={styles.rewardsAccent}>¡Haz que cada viaje cuente!</span>
          </Text>
        </div>
        <div className={styles.rewardsGrid}>
          {rewards.map((item) => (
            <Paper
              className={styles.rewardCard}
              shadow="md"
              radius="xl"
              p="md"
              key={item.title}
            >
              <div className={styles.rewardIcon}>{item.icon}</div>
              <div className={styles.rewardCardContent}>
                <Text className={styles.rewardCardTitle}>{item.title}</Text>
                <Text className={styles.rewardCardDesc}>{item.desc}</Text>
              </div>
              <Button
                className={styles.rewardCardBtn}
                component={Link}
                to={item.to}
                variant="light"
                size="xs"
                rightSection={<ArrowRight size={14} />}
              >
                {item.badge}
              </Button>
            </Paper>
          ))}
        </div>
      </Box>

      {/* CTA Section */}
      <Box className="px-4">
        <Card className={styles.ctaCard}>
          <Title order={2} className={styles.ctaTitle}>
            ¿Listo para empezar?
          </Title>
          <Text className={styles.ctaText}>
            Únete a nuestra comunidad y comienza a ahorrar
          </Text>
          <Button
            className={styles.registerButton}
            component="a"
            href="https://www.cupo.lat"
            target="_blank"
            rel="noopener noreferrer"
            rightSection={<ArrowRight size={18} />}
          >
            <span>Más información</span>
          </Button>
          <div className={styles.ctaGlow} />
        </Card>
      </Box>
      <Space h={40} />
    </Container>
  );
};

export const Route = createFileRoute("/home/")({
  component: HomeView,
});