import type React from 'react';
import { useState, useEffect } from 'react';
import {  Card, Text } from '@mantine/core';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './FeatureCarousel.module.css';

interface FeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

export const FeatureCarousel: React.FC<{ features: FeatureProps[] }> = ({ features }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoplay, features.length]);

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % features.length);
  };

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + features.length) % features.length);
  };

  const getPositionClass = (index: number) => {
    const diff = (index - activeIndex + features.length) % features.length;
    if (diff === 0) return styles.active;
    if (diff === 1 || diff === -2) return styles.next;
    if (diff === -1 || diff === 2) return styles.prev;
    return styles.hidden;
  };

  return (
    <div 
      className={styles.carouselContainer}
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      <div className={styles.carouselTrack}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className={`${styles.featureCard} ${getPositionClass(index)}`}
              style={{ '--feature-color': feature.color } as React.CSSProperties}
            >
              <div className={styles.cardContent}>
                <div className={styles.iconWrapper}>
                  <Icon size={32} className={styles.icon} />
                  <div className={styles.iconGlow} />
                </div>
                <Text className={styles.title}>{feature.title}</Text>
                <Text className={styles.description}>{feature.description}</Text>
              </div>
              <div className={styles.cardGlow} />
            </Card>
          );
        })}
      </div>

      <button 
        className={`${styles.navigationButton} ${styles.prevButton}`}
        onClick={handlePrev}
      >
        <ArrowLeft size={24} />
      </button>
      <button 
        className={`${styles.navigationButton} ${styles.nextButton}`}
        onClick={handleNext}
      >
        <ArrowRight size={24} />
      </button>

      <div className={styles.indicators}>
        {features.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === activeIndex ? styles.activeIndicator : ''}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};