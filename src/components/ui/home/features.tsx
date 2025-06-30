import { Carousel } from '@mantine/carousel';
import { Card, Text, Button, Box } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import classes from './features.module.css';

interface DestinationCardProps {
  image: string;
  title: string;
  category: string;
  trips: number;
}

function DestinationCard({ image, title, category, trips }: DestinationCardProps) {
  return (
    <Card className={classes.card} style={{ backgroundImage: `url(${image})` }}>
      <Box className={classes.overlay}></Box>
      <Text className={classes.category}>{category}</Text>
      <Text className={classes.title}>{title}</Text>
      <Text className={classes.trips}>{trips} viajes disponibles</Text>
      <Button 
        component={Link} 
        to={`/reservar?destino=${title}`} 
        className={classes.button}
      >
        Reservar ahora
      </Button>
    </Card>
  );
}

const data = [
  {
    image: 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Buga.jpg',
    title: 'Basílica del Señor de los Milagros',
    category: 'Buga',
    trips: 10,
  },
  {
    image: 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Cristo%20Rey.jpg',
    title: 'Cristo Rey',
    category: 'Cali',
    trips: 50,
  },
  {
    image: 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/CAMPUS-UAO-1.jpg',
    title: 'Las mejores Universidades de Cali',
    category: 'Cali',
    trips: 200,
  },
  {
    image: 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/ParquePerro.jpg',
    title: 'Parque del Perro',
    category: 'Cali',
    trips: 20,
  },
  // Más destinos si deseas agregarlos
];

export function CardsCarousel() {
  return (
    <Box className={classes.carouselWrapper}>
      <Carousel
        slideSize="100%"  
        slideGap="md"
        loop
        align="start"
        slidesToScroll={1}
        classNames={{
          root: classes.carousel,
          slide: classes.carouselSlide,
          control: classes.carouselControl,
        }}
        nextControlIcon={<ChevronRight size={24} />}
        previousControlIcon={<ChevronLeft size={24} />}
      >
        {data.map((item) => (
          <Carousel.Slide key={item.title}>
            <DestinationCard {...item} />
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  );
}
