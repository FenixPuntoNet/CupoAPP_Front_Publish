import { useState, useEffect } from "react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { ChevronDown } from "lucide-react";
import styles from "./indexlazy.module.css";
// import { hello } from "$/hello.telefunc.ts";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animatingText, setAnimatingText] = useState(false);

  const slides = [
    {
      title: "Viaja seguro",
      subtitle: "Conecta con conductores verificados",
    },
    {
      title: "Ahorra tiempo",
      subtitle: "Encuentra rutas eficientes",
    },
    {
      title: "Cuida el planeta",
      subtitle: "Reduce tu huella de carbono",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatingText(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAnimatingText(false);
      }, 500);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.backgroundEffect} />
      <header className={styles.header}>
      {/* <Button onClick={() => hello().then((v) => console.log(v))}>
        Telefunc
      </Button> */}
        <div className={styles.logo}>
          <span className={styles.logoIcon} />
          <span className={styles.logoText}>cupo</span>
        </div>
        <Button variant="ghost" className={styles.langButton}>
          <span className={styles.flagText}>CO</span>
          <ChevronDown className={styles.chevron} />
        </Button>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.slideContent}>
            <h1
              className={`${styles.title} ${animatingText ? styles.fadeOut : styles.fadeIn}`}
            >
              {slides[currentSlide].title}
            </h1>
            <p
              className={`${styles.subtitle} ${animatingText ? styles.fadeOut : styles.fadeIn}`}
            >
              {slides[currentSlide].subtitle}
            </p>
          </div>

          <div className={styles.indicators}>
            {slides.map((slide, index) => (
              <button
                type="button"
                key={`slide-${slide.title}`}
                className={`${styles.indicator} ${currentSlide === index ? styles.activeIndicator : ""}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        <div className={styles.actionButtons}>
          <Link to="/Registro" className={styles.registerLink}>
            <Button className={styles.registerButton}>Crear cuenta</Button>
          </Link>
          <Link to="/Login" className={styles.loginLink}>
            <Button variant="outline" className={styles.loginButton}>
              Iniciar sesión
            </Button>
          </Link>
          <Link to="/home" className={styles.noLoginLink}>
          </Link>
        </div>
      </main>
    </div>
  );
}
