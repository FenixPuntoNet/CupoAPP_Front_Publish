import { Modal, Text, Button, Group, ScrollArea, Divider, Badge } from "@mantine/core";
import { useState } from "react";
import { IconChevronLeft, IconChevronRight, IconCheck, IconShield, IconUsers, IconScale } from "@tabler/icons-react";
import styles from './TermsModal.module.css';

interface TermsModalProps {
  opened: boolean;
  onClose: () => void;
}

interface LegalSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const legalSections: LegalSection[] = [
  {
    id: 'terms',
    title: 'Términos y Condiciones',
    icon: <IconScale size={20} />,
    content: [
      '**1. OBJETO Y ACEPTACIÓN**\n\nCupo es una plataforma digital que conecta conductores con pasajeros para compartir viajes. Al registrarte y usar nuestros servicios, aceptas estos términos en su totalidad.',
      
      '**2. DEFINICIONES**\n\n• **Usuario**: Toda persona que se registre en la plataforma\n• **Conductor**: Usuario que ofrece cupos en su vehículo\n• **Pasajero**: Usuario que reserva cupos ofrecidos\n• **Viaje**: Trayecto compartido entre origen y destino\n• **Cupo**: Espacio disponible en un vehículo',
      
      '**3. REGISTRO Y CUENTA**\n\nPara usar Cupo debes:\n• Ser mayor de 18 años\n• Proporcionar información veraz y actualizada\n• Mantener la confidencialidad de tu cuenta\n• Notificar cualquier uso no autorizado',
      
      '**4. SERVICIOS DE LA PLATAFORMA**\n\nCupo facilita:\n• Conexión entre conductores y pasajeros\n• Sistema de reservas y pagos\n• Comunicación entre usuarios\n• Valoraciones y comentarios\n• Soporte al cliente',
      
      '**5. OBLIGACIONES DE LOS USUARIOS**\n\n**Conductores deben:**\n• Poseer licencia de conducción vigente\n• Mantener vehículo en buen estado\n• Cumplir con horarios acordados\n• Respetar cupos publicados\n\n**Pasajeros deben:**\n• Respetar horarios de recogida\n• Comportarse adecuadamente\n• Pagar tarifas acordadas\n• Cuidar el vehículo',
      
      '**6. PAGOS Y TARIFAS**\n\n• Los pagos entre partes NO se procesan a través de nuestra plataforma\n• Las tarifas incluyen costos operativos\n• Los reembolsos se procesan según políticas específicas\n• Cupo cobra una comisión por intermediación',
      
      '**7. CANCELACIONES**\n\n• Cancelaciones con 2+ horas: Reembolso completo\n• Cancelaciones 1-2 horas: 50% de penalización\n• Cancelaciones últimos 60 min: Sin reembolso\n• Conductores: Penalizaciones por cancelaciones frecuentes',
      
      '**8. RESPONSABILIDADES**\n\nCupo actúa como intermediario. Los usuarios son responsables de:\n• Su seguridad personal\n• Cumplimiento de leyes de tránsito\n• Comportamiento durante viajes\n• Daños o pérdidas durante el trayecto',
      
      '**9. PROHIBICIONES**\n\nQueda prohibido:\n• Usar la plataforma para fines ilegales\n• Crear múltiples cuentas\n• Proporcionar información falsa\n• Acosar o discriminar a otros usuarios\n• Realizar pagos fuera de la plataforma',
      
      '**10. SUSPENSIÓN Y TERMINACIÓN**\n\nPodemos suspender o terminar cuentas por:\n• Violación de términos\n• Actividad fraudulenta\n• Reportes múltiples de mal comportamiento\n• Incumplimiento de obligaciones de pago',
      
      '**11. LIMITACIÓN DE RESPONSABILIDAD**\n\nCupo no se hace responsable por:\n• Accidentes durante viajes\n• Pérdida de objetos personales\n• Daños entre usuarios\n• Retrasos o cancelaciones por fuerza mayor',
      
      '**12. MODIFICACIONES**\n\nNos reservamos el derecho de modificar estos términos. Los cambios serán notificados con 15 días de anticipación.',
      
      '**13. LEY APLICABLE**\n\nEstos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales de Bogotá D.C.',
      
      '**14. CONTACTO**\n\nPara consultas sobre estos términos:\n• Email: legal@cupo.dev\n• Teléfono: +57 (316) 215-5870\n\n**Última actualización: Enero 2025**'
    ]
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    icon: <IconShield size={20} />,
    content: [
      '**1. INTRODUCCIÓN**\n\nEsta política describe cómo Cupo recopila, usa y protege tu información personal conforme a la Ley 1581 de 2012 de Colombia.',
      
      '**2. INFORMACIÓN QUE RECOPILAMOS**\n\n**Información de registro:**\n• Nombre completo\n• Documento de identidad\n• Correo electrónico\n• Número de teléfono\n• Fotografía de perfil',
      
      '**Información de conductores:**\n• Licencia de conducción\n• Datos del vehículo\n• SOAT y seguro',
      
      '**Información de uso:**\n• Ubicaciones de origen y destino\n• Historial de viajes\n• Valoraciones y comentarios\n• Patrones de uso de la aplicación',
      
      '**3. CÓMO USAMOS TU INFORMACIÓN**\n\n• **Prestación del servicio**: Conectar usuarios y facilitar viajes\n• **Seguridad**: Verificar identidad y prevenir fraudes\n• **Comunicación**: Enviar notificaciones y actualizaciones\n• **Mejoras**: Analizar uso para optimizar la plataforma\n• **Legal**: Cumplir obligaciones regulatorias',
      
      '**4. COMPARTIR INFORMACIÓN**\n\nCompartimos información limitada:\n• **Entre usuarios**: Nombre, foto, valoraciones para viajes\n• **Autoridades**: Cuando sea requerido por ley\n• **Proveedores**: Procesamiento de pagos y análisis\n• **Nunca vendemos** tu información personal',
      
      '**5. SEGURIDAD DE DATOS**\n\nProtegemos tu información mediante:\n• Encriptación de datos sensibles\n• Acceso restringido a empleados\n• Monitoreo continuo de seguridad\n• Copias de seguridad regulares\n• Auditorías de seguridad anuales',
      
      '**6. RETENCIÓN DE DATOS**\n\n• **Datos de cuenta**: Durante la vigencia + 5 años\n• **Historial de viajes**: 3 años para soporte\n• **Datos financieros**: 10 años por obligaciones fiscales\n• **Logs de seguridad**: 1 año para investigaciones',
      
      '**7. TUS DERECHOS**\n\nConforme a la ley, tienes derecho a:\n• **Acceso**: Conocer qué datos tenemos\n• **Rectificación**: Corregir información inexacta\n• **Cancelación**: Eliminar datos cuando sea posible\n• **Oposición**: Limitar uso de tus datos\n• **Portabilidad**: Exportar tu información',
      
      '**8. COOKIES Y TECNOLOGÍAS**\n\nUsamos cookies para:\n• Mantener sesiones activas\n• Recordar preferencias\n• Analizar uso de la aplicación\n• Mejorar funcionalidad\n\nPuedes gestionar cookies en tu navegador.',
      
      '**9. MENORES DE EDAD**\n\nNo recopilamos conscientemente información de menores de 18 años. Si detectamos tal información, la eliminaremos inmediatamente.',
      
      '**10. TRANSFERENCIAS INTERNACIONALES**\n\nAlgunos datos pueden procesarse fuera de Colombia con proveedores que cumplen estándares internacionales de protección.',
      
      '**11. CAMBIOS A ESTA POLÍTICA**\n\nNotificaremos cambios importantes con 30 días de anticipación. El uso continuado constituye aceptación.',
      
      '**12. CONTACTO - PROTECCIÓN DE DATOS**\n\nPara ejercer tus derechos o consultas:\n• **Email**: privacidad@cupo.dev\n• **Formulario web**: cupo.dev/privacidad\n• **Teléfono**: +57 (1) 234-5678\n• **Dirección**: Carrera 7 #71-21, Bogotá\n\n**Oficial de Protección de Datos**: Maria Rodriguez\n**Email directo**: dpo@cupo.dev\n\n**Última actualización: Enero 2025**'
    ]
  },
  {
    id: 'community',
    title: 'Normas de Comunidad',
    icon: <IconUsers size={20} />,
    content: [
      '**NUESTRA COMUNIDAD**\n\nCupo es más que una app de transporte: somos una comunidad que valora el respeto, la seguridad y la colaboración.',
      
      '**COMPORTAMIENTO ESPERADO**\n\n• **Respeto mutuo**: Trata a todos con cortesía\n• **Puntualidad**: Respeta los horarios acordados\n• **Comunicación clara**: Mantén informados a otros usuarios\n• **Honestidad**: Proporciona información precisa\n• **Responsabilidad**: Cuida el vehículo y pertenencias',
      
      '**COMPORTAMIENTOS INACEPTABLES**\n\n• Discriminación por raza, género, religión o preferencias\n• Acoso, intimidación o lenguaje ofensivo\n• Comportamiento bajo influencia de alcohol/drogas\n• Fumar en vehículos sin autorización\n• Música muy alta o comportamiento disruptivo',
      
      '**SEGURIDAD PRIMERO**\n\n• Verifica identidad antes de abordar\n• Comparte detalles del viaje con conocidos\n• Reporta comportamientos sospechosos\n• Usa cinturón de seguridad siempre\n• No compartas información personal sensible',
      
      '**SISTEMA DE VALORACIONES**\n\nLas valoraciones ayudan a mantener la calidad:\n• Sé honesto pero constructivo\n• Considera circunstancias especiales\n• Reporta problemas serios directamente\n• Las valoraciones muy bajas pueden resultar en suspensión',
      
      '**CONSECUENCIAS**\n\n• **Primera infracción**: Advertencia\n• **Infracciones repetidas**: Suspensión temporal\n• **Infracciones graves**: Suspensión permanente\n• **Actividad ilegal**: Reporte a autoridades',
      
      '**REPORTAR PROBLEMAS**\n\nSi experimentas problemas:\n1. Documenta la situación\n2. Reporta inmediatamente en la app\n3. Para emergencias, contacta autoridades\n4. Nuestro equipo investigará en 24 horas',
      
      '**RESOLUCIÓN DE CONFLICTOS**\n\nPromovemos la resolución pacífica:\n• Comunicación directa entre usuarios\n• Mediación por parte del equipo de Cupo\n• Proceso de apelación transparente\n• Última instancia: arbitraje legal\n\n**Juntos construimos una mejor experiencia de viaje para todos.**'
    ]
  }
];

export const TermsModal: React.FC<TermsModalProps> = ({ opened, onClose }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const currentSection = legalSections[currentSectionIndex];
  const currentContent = currentSection?.content[currentPageIndex] || '';
  
  const nextPage = () => {
    if (currentPageIndex < currentSection.content.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentSectionIndex < legalSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentPageIndex(0);
    }
  };
  
  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentPageIndex(legalSections[currentSectionIndex - 1].content.length - 1);
    }
  };
  
  const goToSection = (sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentPageIndex(0);
  };
  
  const getTotalPages = () => {
    return legalSections.reduce((total, section) => total + section.content.length, 0);
  };
  
  const getCurrentGlobalPage = () => {
    let globalPage = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      globalPage += legalSections[i].content.length;
    }
    return globalPage + currentPageIndex + 1;
  };
  
  const canGoNext = currentSectionIndex < legalSections.length - 1 || currentPageIndex < currentSection.content.length - 1;
  const canGoPrev = currentSectionIndex > 0 || currentPageIndex > 0;
  
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} fw={700} size="sm" mb="xs" className={styles.sectionTitle}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (line.startsWith('•')) {
        return (
          <Text key={index} size="sm" className={styles.bulletPoint} mb={4}>
            {line}
          </Text>
        );
      }
      if (line.trim() === '') {
        return <div key={index} style={{ height: 8 }} />;
      }
      return (
        <Text key={index} size="sm" className={styles.content} mb={4}>
          {line}
        </Text>
      );
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      withCloseButton={false}
      padding={0}
      className={styles.modal}
      styles={{
        content: {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          border: '1px solid rgba(0, 255, 157, 0.1)',
          borderRadius: 24,
          overflow: 'hidden',
        },
      }}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Group justify="space-between" align="center">
            <Group gap="sm">
              {currentSection.icon}
              <Text size="xl" fw={700} className={styles.title}>
                {currentSection.title}
              </Text>
            </Group>
            <Button
              variant="subtle"
              size="sm"
              onClick={onClose}
              className={styles.closeButton}
            >
              <IconCheck size={16} />
            </Button>
          </Group>
          
          {/* Section Pills */}
          <Group gap="xs" mt="md">
            {legalSections.map((section, index) => (
              <Button
                key={section.id}
                variant={index === currentSectionIndex ? "filled" : "outline"}
                size="xs"
                onClick={() => goToSection(index)}
                className={index === currentSectionIndex ? styles.activePill : styles.pill}
              >
                {section.icon}
                <Text ml={4} size="xs">
                  {section.title.split(' ')[0]}
                </Text>
              </Button>
            ))}
          </Group>
        </div>

        <Divider className={styles.divider} />

        {/* Content */}
        <ScrollArea className={styles.content}>
          <div className={styles.contentInner}>
            {formatContent(currentContent)}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={styles.footer}>
          <Group justify="space-between" align="center">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={!canGoPrev}
              className={styles.navButton}
            >
              <IconChevronLeft size={16} />
              Anterior
            </Button>
            
            <Group gap="xs" align="center">
              <Badge size="sm" className={styles.pageBadge}>
                {getCurrentGlobalPage()} de {getTotalPages()}
              </Badge>
              <Text size="xs" className={styles.pageIndicator}>
                Página {currentPageIndex + 1} de {currentSection.content.length} en esta sección
              </Text>
            </Group>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!canGoNext}
              className={styles.navButton}
            >
              Siguiente
              <IconChevronRight size={16} />
            </Button>
          </Group>
          
          <Text size="xs" ta="center" mt="sm" className={styles.disclaimer}>
            Esta información es solo para consulta. La aceptación se realiza mediante el checkbox en el formulario.
          </Text>
        </div>
      </div>
    </Modal>
  );
};
