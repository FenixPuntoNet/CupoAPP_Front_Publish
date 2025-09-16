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
      '*1. INFORMACIÓN GENERAL**\n\n**Bienvenido a Cupo**\n\nEstos términos y condiciones rigen el uso de nuestra plataforma web y servicios. Al acceder o utilizar nuestros servicios, usted acepta estar sujeto a estos términos.\n\n**Denominación Social:** CUPO S.A.S BIC\n**Correo Electrónico:** soporte@cupo.lat\n\nCupo es una plataforma tecnológica de intermediación de servicios que facilita la movilidad urbana sostenible. Actualmente nos enfocamos principalmente en el carpooling (viajes compartidos) conectando conductores particulares con pasajeros que comparten rutas similares, así como servicios de recarga de billeteras digitales.\n\nCupo NO es una empresa de transporte, sino un facilitador tecnológico que conecta usuarios para diversos servicios.',
      
      '*2. DESCRIPCIÓN DE SERVICIOS**\n\nCupo ofrece los siguientes servicios principales:\n\n**Plataforma de Intermediación de Servicios**\nFacilitamos la conexión entre usuarios para diversos servicios. Actualmente nos enfocamos en carpooling (viajes compartidos), conectando conductores particulares que poseen vehículos propios con pasajeros que desean compartir viajes, promoviendo la movilidad sostenible.\n\n**Servicios Actuales - Carpooling:**\n• Conductores particulares con vehículos propios\n• Viajes planificados con rutas compartidas\n• Contribución a gastos de combustible y peajes\n• Comunidad de usuarios verificados\n\n**Billetera Digital**\nSistema de recarga y gestión de saldos para facilitar los pagos y contribuciones dentro de la plataforma de servicios.\n\n**Importante - Naturaleza de la Plataforma:**\n• Cupo es únicamente un intermediario tecnológico para servicios\n• No somos propietarios de vehículos ni operamos servicios de transporte público\n• Conectamos usuarios particulares que ofrecen y buscan servicios\n• En carpooling: las contribuciones económicas cubren gastos de combustible, peajes y mantenimiento',
      
      '*3. REGISTRO Y CUENTA DE USUARIO**\n\n**3.1 Requisitos de Registro**\n• Ser mayor de 18 años\n• Proporcionar información veraz y actualizada\n• Aceptar estos términos y condiciones\n\n**3.2 Responsabilidades del Usuario**\n• Mantener la confidencialidad de sus credenciales de acceso\n• Notificar inmediatamente cualquier uso no autorizado de su cuenta\n• Actualizar información personal cuando sea necesario\n• Usar la plataforma de manera responsable y ética',
      
      '*4. OBLIGACIONES DEL USUARIO**\n\nAl utilizar nuestros servicios, usted se compromete a:\n\n**Conducta Apropiada**\n• Tratar con respeto a otros usuarios\n• Mantener comportamiento civilizado\n• Cumplir con las normas de convivencia\n\n**Información Veraz**\n• Proporcionar datos reales y actualizados\n• No crear identidades falsas\n• Mantener perfil actualizado\n\n**Uso Responsable**\n• Usar la plataforma según su propósito\n• No sobrecargar los sistemas\n• Reportar problemas técnicos\n\n**Cumplimiento Legal y Carpooling**\n• Respetar las leyes vigentes de tránsito\n• Mantener documentación vehicular al día\n• Cumplir principios del carpooling comunitario\n• Respetar las normas de precios de la comunidad',
      
      '*5. NORMAS DE LA COMUNIDAD DE CARPOOLING**\n\n**Nota:** Las siguientes normas aplican específicamente para nuestro servicio actual de carpooling. A medida que expandamos nuestra plataforma de intermediación de servicios, se establecerán normas específicas para cada nuevo servicio ofrecido.\n\n**5.1 Principios Fundamentales del Carpooling**\n\nEl carpooling en Cupo se basa en:\n\n**Filosofía de Compartir**\n• Optimización de recursos vehiculares existentes\n• Reducción de la huella de carbono\n• Creación de comunidad solidaria\n• Movilidad sostenible y colaborativa\n\n**Diferenciación Clave**\n• NO somos un servicio de taxi\n• Conductores particulares con vehículos propios\n• Viajes planificados, no bajo demanda\n• Contribución a gastos, no ganancia comercial',
      
      '*5.2 Control de Precios y Contribuciones**\n\n**Sistema de Control de Precios Comunitario:**\n\n**Objetivos del Control de Precios**\n• Mantener el principio de contribución justa, no ganancia comercial\n• Preservar la esencia comunitaria del carpooling\n• Evitar la competencia desleal con servicios de transporte público\n• Garantizar accesibilidad económica para todos los usuarios\n• Diferenciarnos claramente de servicios de taxi o transporte comercial\n\n**Contribuciones Permitidas**\n• Proporcional a distancia del viaje\n• Dentro de rangos establecidos por la comunidad\n• Transparente y justificada\n• Aprobada por el sistema de control de Cupo\n\n**Prácticas Prohibidas**\n• Precios excesivos con fines lucrativos\n• Incrementos arbitrarios por demanda\n• Evasión del sistema de control de precios',
      
      '*5.3 Normas de Conducta en la Comunidad**\n\n**Para Conductores**\n• Vehículo en condiciones óptimas\n• Documentación legal vigente\n• Respeto a rutas acordadas\n• Puntualidad en horarios\n• Mantener precios dentro de rangos permitidos\n• Priorizar la seguridad\n\n**Para Pasajeros**\n• Puntualidad en puntos de encuentro\n• Respeto por el vehículo\n• Contribución económica acordada\n• Comportamiento cordial\n• Cumplimiento de compromisos\n\n**Para Toda la Comunidad**\n• Calificaciones honestas y constructivas\n• Comunicación respetuosa\n• Resolución pacífica de conflictos\n• Reporte de comportamientos inadecuados\n• Promoción de valores comunitarios\n• Respeto a las normas de precios',
      
      '*5.4 Sistema de Verificación y Control**\n\nCupo implementa los siguientes controles:\n\n**Control Automatizado**\n• Algoritmos de detección de precios excesivos\n• Monitoreo de patrones de comportamiento\n• Validación automática de contribuciones\n• Alertas de desviaciones de normas\n\n**Supervisión Comunitaria**\n• Sistema de calificaciones bidireccional\n• Reportes de usuarios de la comunidad\n• Revisión manual de casos especiales\n• Intervención en disputas de precios\n\n**Consecuencias por Violación de Normas:**\n• Primera violación: Advertencia y capacitación sobre carpooling\n• Violaciones repetidas: Suspensión temporal de la cuenta\n• Violaciones graves: Expulsión permanente de la comunidad\n• Actividad comercial: Cancelación inmediata y reporte a autoridades',
      
      '*6. PROHIBICIONES**\n\nEstá estrictamente prohibido:\n\n• Establecer precios excesivos fuera de los rangos permitidos\n• Crear múltiples cuentas fraudulentas\n• Intentar hackear o comprometer la seguridad\n• Distribuir malware o virus\n• Acosar o intimidar a otros usuarios de la comunidad\n• Evadir el sistema de control de precios\n• Violar derechos de propiedad intelectual\n• Usar la plataforma para spam o publicidad no autorizada\n• Transferir cuentas a terceros sin autorización',
      
      '*7. LIMITACIÓN DE RESPONSABILIDAD**\n\n**Limitaciones Importantes:**\n• Cupo actúa como plataforma intermediaria de servicios, no como empresa de transporte\n• No somos responsables por actos u omisiones de conductores o pasajeros\n• No garantizamos la disponibilidad continua del servicio\n• Los usuarios asumen riesgos inherentes al transporte\n\n**7.1 Exclusiones de Responsabilidad**\n\nCupo no será responsable por:\n\n**Daños Directos**\n• Accidentes de tránsito\n• Lesiones personales\n• Daños a la propiedad\n• Pérdida de objetos personales\n\n**Daños Indirectos**\n• Pérdida de ganancias\n• Daño a la reputación\n• Pérdida de oportunidades\n• Daños consecuenciales\n\n**7.2 Seguros y Protección**\n\nRecomendamos encarecidamente:\n• Verificar que los conductores tengan seguro vigente\n• Mantener su propio seguro de vida y accidentes\n• Revisar las condiciones del vehículo antes del viaje\n• Reportar inmediatamente cualquier incidente',
      
      '*8. PROPIEDAD INTELECTUAL**\n\nTodos los derechos reservados:\n\n**Propiedad de Cupo**\n• Marca "Cupo" y logotipos\n• Software y código fuente\n• Diseño de la interfaz\n• Contenido del sitio web\n• Metodologías y procesos\n\n**Uso Permitido**\n• Uso personal del servicio\n• Compartir enlaces a la plataforma\n• Referencias en redes sociales\n• Capturas de pantalla para soporte\n\n**8.1 Licencia de Uso**\n\nLe otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar nuestra plataforma únicamente para los fines previstos.\n\n**8.2 Restricciones**\n\nEstá prohibido:\n• Copiar, modificar o distribuir nuestro software\n• Usar nuestras marcas sin autorización\n• Crear obras derivadas de nuestro contenido\n• Realizar ingeniería inversa de la plataforma',
      
      '*9. MODIFICACIONES Y VIGENCIA**\n\n**9.1 Actualizaciones de Términos**\n\nNos reservamos el derecho de modificar estos términos en cualquier momento.\n\n**Proceso de Notificación**\n• Aviso con 30 días de anticipación\n• Notificación por correo electrónico\n• Publicación en la plataforma\n• Destacado en página principal\n\n**Su Respuesta**\n• Revisar cambios propuestos\n• Aceptar o rechazar modificaciones\n• Continuar usando el servicio implica aceptación\n• Derecho a cancelar cuenta si no acepta\n\n**9.2 Vigencia y Terminación**\n\nEstos términos permanecen vigentes mientras utilice nuestros servicios. Cualquier parte puede terminar la relación en cualquier momento.\n\n**Causas de Terminación**\n• Violación de estos términos\n• Uso fraudulento de la plataforma\n• Actividades ilegales\n• Solicitud del usuario\n• Inactividad prolongada\n• Decisión comercial de Cupo',
      
      '*10. LEY APLICABLE Y JURISDICCIÓN**\n\n**Marco Legal:**\nEstos términos se rigen por las leyes de la República de Colombia. Aplicación de la Ley de Protección de Datos (Ley 1581 de 2012).\n\n**10.1 Resolución de Disputas**\n\nPara resolver cualquier controversia, seguiremos este proceso:\n\n**1. Negociación Directa**\nIntentar resolver amigablemente a través de nuestro soporte\n\n**2. Mediación**\nRecurrir a mediación con centro reconocido\n\n**3. Proceso Judicial**\nAcudir a tribunales competentes según la jurisdicción aplicable\n\n**11. INFORMACIÓN DE CONTACTO**\n\nPara cualquier consulta sobre estos términos y condiciones:\n\n**Información de Contacto**\nsoporte@cupo.lat\n\n**Horarios de Atención**\nSoporte técnico:\n• Lunes a Viernes: 8:00 AM - 8:00 PM\n• Sábados: 9:00 AM - 5:00 PM\n• Domingos: 10:00 AM - 2:00 PM\n• Emergencias: 24/7\n\n**Tiempo de Respuesta**\nNos comprometemos a responder todas las consultas en un plazo máximo de 48 horas hábiles. Para emergencias relacionadas con seguridad, el tiempo de respuesta es de 2 horas.\n\n**Gracias por confiar en Cupo**\nAl utilizar nuestros servicios, usted confirma que ha leído, entendido y acepta estos términos y condiciones en su totalidad. Para cualquier duda, no dude en contactarnos.\n\n© 2025 CUPO S.A.S - Todos los derechos reservados | Última actualización: 3 de julio de 2025'
    ]
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    icon: <IconShield size={20} />,
    content: [
      '*7. POLÍTICA DE PRIVACIDAD**\n\n**7.1 Recopilación de Datos**\n\nRecopilamos los siguientes tipos de información:\n\n**Datos Personales Básicos**\n• Nombre completo\n• Número de identificación\n• Correo electrónico\n• Número de teléfono\n• Dirección de residencia\n• Fotografía de perfil\n\n**Datos Específicos de Conductores**\n• Licencia de conducción (foto y datos)\n• Tarjeta de propiedad del vehículo\n• Póliza de seguro vehicular\n• SOAT (Seguro Obligatorio)\n• Fotografías del vehículo\n• Placa del vehículo\n• Modelo, marca y año del vehículo\n• Certificado de revisión tecno-mecánica\n\n**Datos de Uso y Actividad**\n• Historial de viajes\n• Ubicaciones de origen y destino\n• Métodos de pago utilizados\n• Calificaciones y comentarios\n• Datos de geolocalización\n• Patrones de uso de la plataforma\n\n**Verificación de Conductores**\nPara garantizar la seguridad de nuestra comunidad, los conductores deben proporcionar documentación completa que incluye licencia vigente, documentos del vehículo, seguros actualizados y fotografías para verificación. Esta información es validada antes de aprobar cualquier cuenta de conductor.',
      
      '*7.2 Uso de la Información**\n\nUtilizamos sus datos para:\n\n**Prestación del Servicio**\n• Facilitar conexiones entre usuarios y procesar transacciones\n\n**Seguridad y Verificación**\n• Verificar identidades, documentos vehiculares y prevenir fraudes\n\n**Comunicación**\n• Enviar notificaciones importantes y actualizaciones\n\n**Cumplimiento Legal**\n• Validar licencias, seguros y documentación requerida\n\n**Proceso de Verificación de Conductores**\nLos documentos de conductores se utilizan específicamente para:\n• Validar la vigencia de licencias de conducción\n• Verificar la propiedad legal del vehículo\n• Confirmar cobertura de seguros vehiculares\n• Asegurar el cumplimiento de revisiones técnicas\n• Validar identidad mediante fotografías',
      
      '*7.3 Protección de Datos**\n\nImplementamos las siguientes medidas de seguridad:\n\n**Seguridad General**\n• Encriptación de datos sensibles\n• Acceso restringido a información personal\n• Monitoreo continuo de seguridad\n• Cumplimiento con estándares internacionales\n\n**Protección Especial de Documentos**\n• Almacenamiento seguro de licencias de conducción\n• Encriptación de documentos vehiculares\n• Protección de fotografías y datos biométricos\n• Acceso limitado solo a personal autorizado\n\n**Manejo de Documentos Oficiales**\nLos documentos de identidad, licencias y documentación vehicular reciben tratamiento especial con encriptación avanzada y acceso ultra-restringido, cumpliendo con las normativas más estrictas de protección de datos personales.',
      
      '*7.4 Derechos del Usuario**\n\nUsted tiene derecho a:\n\n• Acceder a sus datos personales\n• Solicitar corrección de información incorrecta\n• Solicitar eliminación de sus datos\n• Oponerse al procesamiento de datos\n• Solicitar portabilidad de datos\n• Revocar consentimientos otorgados\n\n**Marco Legal de Protección de Datos**\nEsta política se elaboró en estricto cumplimiento de la Ley 1581 de 2012 de Colombia (Ley de Protección de Datos Personales), el Decreto 1377 de 2013 y demás normas aplicables en materia de protección de datos personales. También consideramos mejores prácticas internacionales para garantizar el más alto nivel de protección.\n\nAl utilizar nuestros servicios, usted otorga su consentimiento libre, previo, expreso e informado para el tratamiento de sus datos personales conforme a esta política.'
    ]
  },
  {
    id: 'community',
    title: 'Normas de Comunidad',
    icon: <IconUsers size={20} />,
    content: [
      '*FUNDAMENTOS DE NUESTRA COMUNIDAD**\n\nCupo es mucho más que una aplicación de transporte compartido: somos una comunidad vibrante de personas que comparten valores fundamentales de respeto, seguridad, colaboración y sostenibilidad ambiental. Creemos firmemente que cada viaje es una oportunidad para crear conexiones positivas, reducir nuestra huella ambiental y construir una sociedad más colaborativa.\n\nNuestra comunidad está compuesta por miles de conductores y pasajeros que han elegido una forma de movilidad más inteligente, económica y social. Estos principios guían todas nuestras interacciones y definen la experiencia que queremos ofrecer a cada miembro de nuestra familia Cupo.\n\nEstas normas han sido desarrolladas con base en la retroalimentación de nuestra comunidad y representan el compromiso colectivo de mantener un ambiente seguro, respetuoso y agradable para todos.',
      
      '*PRINCIPIOS FUNDAMENTALES DE COMPORTAMIENTO**\n\n**RESPETO MUTUO Y DIVERSIDAD:**\n\nTodos los miembros de nuestra comunidad merecen ser tratados con dignidad, cortesía y respeto, independientemente de su origen étnico, género, edad, religión, orientación sexual, discapacidad, nivel socioeconómico o cualquier otra característica personal. Valoramos la diversidad como una fortaleza que enriquece nuestras experiencias de viaje.\n\nProhibimos categóricamente cualquier forma de discriminación, acoso, intimidación o lenguaje ofensivo. Esto incluye comentarios despectivos, chistes inapropiados, comportamientos condescendientes o cualquier acción que pueda hacer sentir incómodo o no bienvenido a otro usuario.\n\n**COMUNICACIÓN EFECTIVA Y TRANSPARENTE:**\n\nLa comunicación clara y honesta es fundamental para el éxito de cada viaje. Los conductores deben proporcionar información precisa sobre su vehículo, ruta planificada, horarios y cualquier condición especial del viaje. Los pasajeros deben ser transparentes sobre sus necesidades, ubicación exacta de recogida y cualquier circunstancia que pueda afectar el viaje.\n\nAlentamos la comunicación proactiva: si surge algún cambio o imprevisto, todas las partes deben informar inmediatamente a través de los canales oficiales de la plataforma.',
      
      '*ESTÁNDARES DE PUNTUALIDAD Y RESPONSABILIDAD**\n\n**COMPROMISO CON LOS HORARIOS:**\n\nLa puntualidad es una muestra de respeto hacia otros miembros de la comunidad. Los conductores deben salir a la hora programada y cumplir con los horarios de recogida acordados. Los pasajeros deben estar listos y presentes en el punto de encuentro a la hora convenida.\n\nEntendemos que ocasionalmente pueden surgir circunstancias imprevistas. En estos casos, la comunicación inmediata es esencial. Retrasos menores de 10 minutos deben comunicarse de inmediato, y retrasos mayores pueden justificar la reprogramación o cancelación del viaje.\n\n**RESPONSABILIDAD COMPARTIDA:**\n\nTodos los usuarios comparten la responsabilidad de mantener un ambiente positivo durante el viaje. Esto incluye mantener conversaciones apropiadas, respetar el espacio personal de otros, cuidar la limpieza del vehículo y contribuir a una atmósfera amigable y relajada.\n\nLos conductores son responsables de mantener su vehículo en condiciones óptimas de limpieza, seguridad y funcionamiento. Los pasajeros son responsables de cuidar el vehículo como si fuera propio y reportar cualquier daño accidental.',
      
      '*PROTOCOLO DE SEGURIDAD INTEGRAL**\n\n**VERIFICACIÓN DE IDENTIDAD:**\n\nAntes de iniciar cualquier viaje, tanto conductores como pasajeros deben verificar mutuamente sus identidades utilizando la información proporcionada en la aplicación. Esto incluye confirmar nombres, fotografías de perfil y, cuando sea necesario, solicitar identificación adicional.\n\nLos conductores deben verificar que su vehículo coincida con la información registrada en la plataforma, incluyendo placa, color, marca y modelo. Los pasajeros tienen derecho a confirmar estos detalles antes de abordar.\n\n**COMUNICACIÓN DE DETALLES DEL VIAJE:**\n\nTodos los usuarios deben compartir detalles relevantes del viaje con personas de confianza, incluyendo información del conductor o pasajeros, ruta planificada, horarios estimados y número de placa del vehículo.\n\n**PROTOCOLO DURANTE EL VIAJE:**\n\nEl uso del cinturón de seguridad es obligatorio para todos los ocupantes del vehículo. Los conductores deben respetar todas las normas de tránsito, mantener velocidades seguras y evitar el uso de dispositivos móviles mientras conducen.\n\nCualquier comportamiento que genere incomodidad o preocupación debe reportarse inmediatamente a través de la función de emergencia de la aplicación.',
      
      '*CONDUCTAS ESTRICTAMENTE PROHIBIDAS**\n\n**COMPORTAMIENTOS BAJO INFLUENCIA:**\n\nEstá terminantemente prohibido conducir o viajar bajo la influencia del alcohol, drogas ilegales o cualquier sustancia que pueda afectar la capacidad de juicio o la seguridad. Los conductores que presenten signos de intoxicación serán reportados inmediatamente a las autoridades competentes.\n\n**ACTIVIDADES ILEGALES:**\n\nNuestra plataforma no debe utilizarse para facilitar o encubrir actividades ilegales de ningún tipo. Esto incluye transporte de sustancias prohibidas, evasión de controles policiales, o cualquier actividad que viole las leyes locales, nacionales o internacionales.\n\n**COMPORTAMIENTO SEXUAL INAPROPIADO:**\n\nCualquier forma de acoso sexual, comentarios de naturaleza sexual, contacto físico no consensuado o comportamiento sexual inapropiado resultará en la suspensión inmediata y permanente de la cuenta, además de reportes a las autoridades correspondientes.\n\n**VIOLENCIA Y AMENAZAS:**\n\nNo toleramos ninguna forma de violencia física, amenazas verbales, intimidación o comportamiento agresivo. Esto incluye alzar la voz de manera intimidante, golpear objetos, o cualquier acción que pueda generar temor en otros usuarios.',
      
      '*POLÍTICA AMBIENTAL Y SOSTENIBILIDAD**\n\n**COMPROMISO ECOLÓGICO:**\n\nComo comunidad comprometida con la sostenibilidad, alentamos prácticas que reduzcan el impacto ambiental. Esto incluye mantener vehículos en buen estado para optimizar el consumo de combustible, promover el uso compartido de vehículos como alternativa al transporte individual, y evitar rutas innecesariamente largas.\n\n**PROHIBICIÓN DE FUMAR:**\n\nEstar prohibido fumar cigarrillos, cigarrillos electrónicos o cualquier sustancia dentro de los vehículos, a menos que el conductor haya dado autorización explícita y todos los pasajeros estén de acuerdo. El respeto por la salud de todos los ocupantes es prioritario.\n\n**GESTIÓN DE RESIDUOS:**\n\nTodos los usuarios deben mantener la limpieza del vehículo y llevarse sus residuos al finalizar el viaje. No está permitido arrojar basura por las ventanas o dejar desperdicios en el vehículo.',
      
      '*SISTEMA DE VALORACIONES Y RETROALIMENTACIÓN**\n\n**IMPORTANCIA DE LAS VALORACIONES:**\n\nNuestro sistema de valoraciones bidireccional es fundamental para mantener la calidad y seguridad de la comunidad. Las calificaciones honestas y constructivas ayudan a otros usuarios a tomar decisiones informadas y contribuyen al mejoramiento continuo de la experiencia.\n\n**CRITERIOS DE EVALUACIÓN:**\n\nLas valoraciones deben basarse en aspectos objetivos como puntualidad, limpieza del vehículo, seguridad de la conducción, amabilidad en el trato y cumplimiento de las condiciones acordadas. Evite valoraciones basadas en prejuicios personales o características físicas de otros usuarios.\n\n**CONSTRUCTIVIDAD EN COMENTARIOS:**\n\nLos comentarios escritos deben ser específicos, útiles y respetuosos. Proporcione información que pueda ayudar a otros usuarios o al evaluado a mejorar su experiencia. Evite comentarios ofensivos, discriminatorios o exageradamente negativos.\n\n**CONSECUENCIAS DE VALORACIONES BAJAS:**\n\nUsuarios con valoraciones consistentemente bajas (por debajo de 4.0 en una escala de 5.0) pueden ser sujetos a revisión de cuenta, suspensión temporal o requerimientos de capacitación adicional.',
      
      '*SISTEMA PROGRESIVO DE CONSECUENCIAS**\n\n**INFRACCIONES MENORES:**\n\nPor primera vez: Advertencia formal con explicación de la norma violada y orientación para mejorar el comportamiento.\nSegunda infracción: Suspensión temporal de 7 días con capacitación obligatoria sobre normas comunitarias.\nTercera infracción: Suspensión temporal de 30 días y revisión exhaustiva de la cuenta.\n\n**INFRACCIONES GRAVES:**\n\nComportamientos que comprometan la seguridad, involucren discriminación severa, o violen leyes resultarán en suspensión inmediata de 90 días a permanente, dependiendo de la gravedad.\n\n**INFRACCIONES CRÍTICAS:**\n\nViolencia física, acoso sexual, actividades ilegales o cualquier comportamiento que ponga en riesgo grave la seguridad de otros usuarios resultará en prohibición permanente inmediata y reporte a autoridades competentes.',
      
      '*PROCESO DE REPORTES Y RESOLUCIÓN DE CONFLICTOS**\n\n**CÓMO REPORTAR PROBLEMAS:**\n\nUtilice la función de reporte inmediato en la aplicación durante o inmediatamente después del incidente. Para situaciones de emergencia, contacte primero a las autoridades locales (policía: 123) y luego repórtenos. Proporcione detalles específicos, incluyendo fechas, horarios, ubicaciones y descripción clara de lo ocurrido.\n\n**PROCESO DE INVESTIGACIÓN:**\n\nTodos los reportes son revisados por nuestro equipo especializado dentro de 24 horas. Investigaciones complejas pueden tomar hasta 72 horas. Durante la investigación, podemos suspender temporalmente las cuentas involucradas como medida preventiva.\n\n**MEDIACIÓN Y RESOLUCIÓN:**\n\nPara conflictos menores, ofrecemos servicios de mediación para ayudar a las partes a llegar a una resolución mutuamente satisfactoria. Nuestro equipo de atención al cliente está capacitado para facilitar estas conversaciones de manera imparcial.\n\n**PROCESO DE APELACIÓN:**\n\nLos usuarios tienen derecho a apelar decisiones de suspensión o penalización dentro de 15 días. El proceso de apelación incluye revisión por un panel independiente y oportunidad de presentar evidencia adicional.',
      
      '*COMPROMISO CONTINUO CON LA EXCELENCIA**\n\nEstas normas son un documento vivo que evoluciona con nuestra comunidad. Valoramos la retroalimentación de nuestros usuarios y actualizamos regularmente nuestras políticas para reflejar las mejores prácticas y las necesidades cambiantes de nuestra comunidad.\n\nJuntos, estamos construyendo no solo una plataforma de transporte, sino una comunidad que demuestra cómo la colaboración, el respeto mutuo y la responsabilidad compartida pueden transformar la manera en que nos movemos por nuestras ciudades.\n\nGracias por ser parte de la familia Cupo y por contribuir a hacer de cada viaje una experiencia positiva y memorable para todos.\n\n**Última actualización:** 3 de julio de 2025\n**Vigencia:** Inmediata para todos los usuarios activos\n**Revisión programada:** Cada 6 meses con participación de la comunidad'
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
              tabIndex={0}
              aria-label="Cerrar términos y condiciones"
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
                tabIndex={0}
                aria-label={`Ver sección ${section.title}`}
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
              tabIndex={0}
              aria-label="Página anterior"
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
              tabIndex={0}
              aria-label="Página siguiente"
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
