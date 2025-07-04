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
      '**1. OBJETO Y ACEPTACIÓN DE LOS TÉRMINOS**\n\nCupo es una plataforma tecnológica digital que actúa como intermediario entre conductores particulares y pasajeros que desean compartir viajes de forma segura y eficiente. Nuestra plataforma facilita la conexión entre usuarios que buscan optimizar costos de transporte y contribuir a la movilidad sostenible.\n\nAl crear una cuenta, acceder o utilizar cualquiera de nuestros servicios, ya sea a través de nuestra aplicación móvil, sitio web o cualquier otro medio digital, usted acepta estar legalmente obligado por estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no deberá utilizar nuestros servicios.\n\nEstos términos constituyen un contrato legal vinculante entre usted y Cupo SAS, una sociedad constituida bajo las leyes de Colombia, con domicilio principal en Bogotá D.C.',
      
      '**2. DEFINICIONES Y TERMINOLOGÍA**\n\nPara efectos de claridad y comprensión de estos términos, se establecen las siguientes definiciones:\n\n**"Usuario"** se refiere a cualquier persona natural mayor de edad que se registre en la plataforma, ya sea como conductor o como pasajero, y que haya completado el proceso de verificación requerido.\n\n**"Conductor"** es el usuario que posee un vehículo registrado en la plataforma y que ofrece cupos disponibles para compartir viajes. El conductor debe contar con licencia de conducción vigente y cumplir con todos los requisitos legales para operar un vehículo.\n\n**"Pasajero"** es el usuario que reserva y paga por un cupo en un viaje ofrecido por un conductor a través de la plataforma.\n\n**"Viaje"** se define como el trayecto específico entre un punto de origen y un destino, con fecha y hora determinadas, que incluye las paradas intermedias acordadas.\n\n**"Cupo"** representa cada espacio disponible en un vehículo para un pasajero durante un viaje específico.\n\n**"Plataforma"** incluye la aplicación móvil, el sitio web y cualquier otro canal digital operado por Cupo.',
      
      '**3. PROCESO DE REGISTRO Y GESTIÓN DE CUENTA**\n\nPara utilizar los servicios de Cupo, es obligatorio completar un proceso de registro que incluye la verificación de identidad y el cumplimiento de requisitos mínimos de seguridad.\n\n**Requisitos generales para todos los usuarios:**\nDebe ser mayor de 18 años y tener capacidad legal para celebrar contratos. Debe proporcionar información personal veraz, completa y actualizada, incluyendo nombre completo, documento de identidad válido, número de teléfono móvil verificado y dirección de correo electrónico activa.\n\n**Requisitos adicionales para conductores:**\nDebe poseer licencia de conducción vigente expedida por autoridad competente colombiana. Su vehículo debe contar con SOAT vigente, revisión técnico-mecánica al día y póliza de seguro vehicular. Debe proporcionar fotografías del vehículo y documentación completa para verificación.\n\nEs su responsabilidad mantener toda la información de su cuenta actualizada y notificar inmediatamente cualquier uso no autorizado de sus credenciales. La seguridad de su contraseña es de su exclusiva responsabilidad.',
      
      '**4. DESCRIPCIÓN DETALLADA DE SERVICIOS**\n\nCupo opera como una plataforma de intermediación tecnológica que facilita la conexión entre conductores y pasajeros, pero no presta directamente servicios de transporte.\n\n**Servicios principales que facilitamos:**\n\n**Sistema de conexión:** Permitimos que los conductores publiquen viajes disponibles con detalles específicos como origen, destino, fecha, hora, precio por cupo y condiciones particulares. Los pasajeros pueden buscar, filtrar y reservar cupos en estos viajes según sus necesidades.\n\n**Plataforma de comunicación:** Facilitamos la comunicación directa entre usuarios a través de chat integrado, notificaciones push y llamadas telefónicas cuando sea necesario para coordinar detalles del viaje.\n\n**Sistema de valoraciones:** Implementamos un sistema de calificaciones bidireccional que permite a conductores y pasajeros evaluar su experiencia, contribuyendo a la confianza y calidad de la comunidad.\n\n**Procesamiento de pagos:** Facilitamos el procesamiento seguro de pagos a través de proveedores especializados, manteniendo un sistema de billetera digital para mayor comodidad y seguridad.\n\n**Soporte al cliente:** Ofrecemos asistencia técnica y resolución de conflictos a través de múltiples canales de comunicación.',
      
      '**5. OBLIGACIONES Y RESPONSABILIDADES ESPECÍFICAS**\n\n**OBLIGACIONES DE LOS CONDUCTORES:**\n\nLos conductores deben mantener vigentes todos los documentos legales requeridos para operar su vehículo, incluyendo licencia de conducción, SOAT, revisión técnico-mecánica y seguros correspondientes. Es obligatorio mantener el vehículo en condiciones óptimas de seguridad, limpieza y funcionamiento.\n\nDeben cumplir estrictamente con los horarios, rutas y condiciones publicadas en cada viaje. Cualquier cambio debe ser comunicado con suficiente anticipación a los pasajeros afectados. Es responsabilidad del conductor conducir de manera segura, respetando todas las normas de tránsito y priorizando la seguridad de los pasajeros.\n\nDeben tratar a todos los pasajeros con respeto y cortesía, sin discriminación de ningún tipo. No está permitido solicitar pagos adicionales fuera de la plataforma ni modificar las condiciones del viaje una vez confirmado.\n\n**OBLIGACIONES DE LOS PASAJEROS:**\n\nLos pasajeros deben presentarse puntualmente en el lugar y hora acordados para el viaje. Deben comportarse de manera respetuosa con el conductor y otros pasajeros, manteniendo un ambiente cordial y seguro durante todo el trayecto.\n\nEs obligatorio pagar el precio acordado a través de la plataforma antes o según las condiciones establecidas para cada viaje. Los pasajeros deben cuidar el vehículo y no causar daños, siendo responsables por cualquier deterioro causado por su negligencia.\n\nDeben proporcionar información de contacto actualizada y estar disponibles para comunicación durante el día del viaje.',
      
      '**6. SISTEMA DE PAGOS, TARIFAS Y COMISIONES**\n\nCupo opera un sistema de billetera digital integrada que facilita las transacciones entre usuarios de manera segura y eficiente.\n\n**Estructura de pagos:**\nLos pasajeros realizan el pago del viaje a través de la plataforma, cargando fondos en su billetera digital mediante métodos de pago seguros como tarjetas de crédito, débito o transferencias bancarias. Una vez completado el viaje satisfactoriamente, los fondos se transfieren a la billetera del conductor, descontando la comisión correspondiente de la plataforma.\n\n**Comisiones de servicio:**\nCupo cobra una comisión porcentual sobre el valor de cada viaje completado para sostener y mejorar la plataforma. Este porcentaje se calcula sobre el precio total pagado por el pasajero y se descuenta automáticamente antes de transferir los fondos al conductor.\n\n**Política de reembolsos:**\nLos reembolsos se procesan según el tipo de cancelación y el tiempo transcurrido antes del viaje. El proceso de reembolso puede tomar entre 3 a 10 días hábiles dependiendo del método de pago original.\n\n**Garantías y retenciones:**\nPara proteger a todos los usuarios, mantenemos un sistema de retenciones temporales que se liberan una vez confirmado el cumplimiento satisfactorio de las obligaciones de cada parte.',
      
      '**7. POLÍTICA INTEGRAL DE CANCELACIONES**\n\n**Cancelaciones realizadas por pasajeros:**\n\n**Con más de 24 horas de anticipación:** Reembolso completo del 100% del valor pagado, procesado en un plazo máximo de 5 días hábiles.\n\n**Entre 24 y 2 horas antes del viaje:** Se aplicará una penalización del 25% sobre el valor total, reembolsando el 75% restante.\n\n**Entre 2 horas y 30 minutos antes del viaje:** Se aplicará una penalización del 50% sobre el valor total, reembolsando únicamente el 50%.\n\n**Con menos de 30 minutos de anticipación:** No se procesará reembolso debido al perjuicio causado al conductor y otros pasajeros.\n\n**Cancelaciones realizadas por conductores:**\n\nLas cancelaciones por parte del conductor están fuertemente penalizadas debido al mayor impacto en múltiples usuarios. Se aplicarán sanciones progresivas que pueden incluir suspensión temporal o permanente de la cuenta.\n\n**Cancelaciones por fuerza mayor:**\nEn casos de emergencias, condiciones climáticas extremas, bloqueos viales o situaciones de fuerza mayor debidamente documentadas, se evaluará cada caso individualmente para determinar la política de reembolso más justa.',
      
      '**8. RESPONSABILIDADES LEGALES Y LIMITACIONES**\n\nCupo actúa exclusivamente como intermediario tecnológico entre usuarios independientes. No somos una empresa de transporte público ni prestamos directamente servicios de movilidad.\n\n**Responsabilidades de los usuarios:**\nCada usuario es completamente responsable de su seguridad personal, el cumplimiento de las leyes de tránsito aplicables, su comportamiento durante los viajes y cualquier daño o pérdida que pueda ocurrir durante el trayecto.\n\nLos conductores son responsables de mantener seguros vehiculares adecuados y cumplir con toda la normatividad vigente para la operación de vehículos particulares. Los usuarios deben resolver directamente entre ellos cualquier disputa relacionada con daños materiales o incidentes durante el viaje.\n\n**Limitaciones de responsabilidad de Cupo:**\nNo nos hacemos responsables por accidentes de tránsito, lesiones personales, pérdida o daño de objetos personales, incumplimientos contractuales entre usuarios, o cualquier perjuicio derivado del uso de vehículos particulares.\n\nNuestra responsabilidad se limita estrictamente a proporcionar la plataforma tecnológica y facilitar la conexión entre usuarios, sin asumir obligaciones propias de empresas transportadoras.',
      
      '**9. CONDUCTAS PROHIBIDAS Y SANCIONES**\n\nPara mantener un ambiente seguro y confiable, se prohíben estrictamente las siguientes conductas:\n\n**Prohibiciones generales:**\nUtilizar la plataforma para fines distintos al compartir viajes legítimos, crear múltiples cuentas o suplantar identidades, proporcionar información falsa o documentación fraudulenta, acosar, intimidar o discriminar a otros usuarios por cualquier motivo.\n\n**Prohibiciones específicas para conductores:**\nOperar vehículos sin documentación vigente, solicitar pagos adicionales fuera de la plataforma, modificar rutas o condiciones sin autorización, transportar más pasajeros de los cupos ofrecidos.\n\n**Prohibiciones específicas para pasajeros:**\nRealizar reservas falsas o con intención de no cumplir, comportarse de manera irrespetuosa o violenta, causar daños intencionales al vehículo, consumir sustancias prohibidas durante el viaje.\n\n**Sistema de sanciones:**\nLas violaciones pueden resultar en advertencias, suspensiones temporales o prohibiciones permanentes, dependiendo de la gravedad y frecuencia de las infracciones.',
      
      '**10. PROCEDIMIENTOS DE SUSPENSIÓN Y TERMINACIÓN**\n\nNos reservamos el derecho de suspender o terminar cuentas de usuario cuando se presenten las siguientes situaciones:\n\n**Causales de suspensión inmediata:**\nViolación grave de estos términos y condiciones, actividad fraudulenta o intentos de estafa, reportes múltiples de comportamiento inapropiado o peligroso, incumplimiento reiterado de obligaciones de pago.\n\n**Proceso de suspensión:**\nAntes de aplicar sanciones definitivas, proporcionaremos la oportunidad de explicar o corregir la situación reportada. En casos graves que comprometan la seguridad de otros usuarios, podremos actuar inmediatamente.\n\n**Derecho de apelación:**\nLos usuarios tienen derecho a apelar decisiones de suspensión a través de nuestro sistema de atención al cliente, proporcionando evidencia o explicaciones relevantes para reconsideración del caso.',
      
      '**11. LIMITACIONES DE RESPONSABILIDAD Y EXONERACIÓN**\n\nCupo no asume responsabilidad por las siguientes situaciones:\n\n**Incidentes durante viajes:**\nAccidentes de tránsito, lesiones personales o daños materiales que ocurran durante los viajes, pérdida, robo o daño de objetos personales de los usuarios, conflictos o disputas entre conductores y pasajeros.\n\n**Circunstancias externas:**\nRetrasos o cancelaciones causados por condiciones climáticas, bloqueos viales, manifestaciones u otros eventos de fuerza mayor, fallas técnicas de terceros proveedores de servicios, interrupciones en servicios de telecomunicaciones.\n\n**Limitación monetaria:**\nEn ningún caso nuestra responsabilidad excederá el valor de las comisiones recibidas por la transacción específica objeto de reclamación.',
      
      '**12. POLÍTICA DE MODIFICACIONES Y ACTUALIZACIONES**\n\nNos reservamos el derecho de modificar estos términos y condiciones cuando sea necesario para adaptarnos a cambios legales, mejorar nuestros servicios o abordar nuevas situaciones operativas.\n\n**Proceso de notificación:**\nCualquier modificación será notificada a los usuarios con al menos 15 días de anticipación a través de correo electrónico, notificaciones en la aplicación y publicación en nuestro sitio web.\n\n**Aceptación de cambios:**\nEl uso continuado de la plataforma después de la fecha de entrada en vigor de las modificaciones constituye aceptación automática de los nuevos términos.',
      
      '**13. JURISDICCIÓN Y LEY APLICABLE**\n\nEstos términos y condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa legal será sometida a la jurisdicción exclusiva de los tribunales competentes de Bogotá D.C.\n\n**Resolución de conflictos:**\nAntes de acudir a instancias judiciales, las partes se comprometen a intentar resolver sus diferencias a través de mecanismos alternativos de solución de conflictos como la mediación o conciliación.',
      
      '**14. INFORMACIÓN DE CONTACTO LEGAL**\n\nPara consultas relacionadas con estos términos y condiciones, puede contactarnos a través de:\n\n**Cupo SAS**\nDirección: Carrera 7 #71-21, Oficina 501, Bogotá D.C., Colombia\nTeléfono: +57 (1) 316-215-5870\nCorreo electrónico legal: legal@cupo.dev\nHorario de atención: Lunes a viernes, 8:00 AM a 6:00 PM\n\n**Departamento Legal**\nDirector Legal: Dr. Carlos Mendoza\nCorreo directo: carlos.mendoza@cupo.dev\n\n**Última actualización:** 2 de enero de 2025\n**Versión:** 2.1\n**Vigencia:** A partir del 15 de enero de 2025'
    ]
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    icon: <IconShield size={20} />,
    content: [
      '**1. INTRODUCCIÓN Y COMPROMISO CON LA PRIVACIDAD**\n\nEn Cupo SAS valoramos profundamente la privacidad de nuestros usuarios y estamos comprometidos con la protección de su información personal. Esta Política de Privacidad describe de manera detallada cómo recopilamos, utilizamos, almacenamos, procesamos y protegemos la información personal que nos proporcionan nuestros usuarios.\n\nEsta política se elaboró en estricto cumplimiento de la Ley 1581 de 2012 de Colombia (Ley de Protección de Datos Personales), el Decreto 1377 de 2013 y demás normas aplicables en materia de protección de datos personales. También consideramos mejores prácticas internacionales para garantizar el más alto nivel de protección.\n\nAl utilizar nuestros servicios, usted otorga su consentimiento libre, previo, expreso e informado para el tratamiento de sus datos personales conforme a esta política.',
      
      '**2. INFORMACIÓN PERSONAL QUE RECOPILAMOS**\n\n**INFORMACIÓN DE REGISTRO BÁSICA:**\n\nRecopilamos información esencial para crear y mantener su cuenta de usuario, incluyendo su nombre completo, número de documento de identidad, fecha de nacimiento, correo electrónico, número de teléfono móvil y fotografía de perfil. Esta información es necesaria para verificar su identidad y facilitar la comunicación entre usuarios.\n\n**INFORMACIÓN ESPECÍFICA PARA CONDUCTORES:**\n\nPara los usuarios que desean ofrecer viajes como conductores, recopilamos información adicional que incluye datos de la licencia de conducción (número, categoría, fecha de expedición y vencimiento), información completa del vehículo (marca, modelo, año, placa, color, número de puertas), documentos del vehículo (SOAT, revisión técnico-mecánica, tarjeta de propiedad), fotografías del vehículo (exterior e interior) y comprobantes de seguros vehiculares.\n\n**INFORMACIÓN DE UBICACIÓN Y VIAJES:**\n\nRecopilamos datos de ubicación para facilitar la prestación del servicio, incluyendo ubicaciones de origen y destino de viajes, ubicación en tiempo real durante viajes activos (solo cuando la aplicación está en uso), historial de rutas y trayectos, y ubicaciones frecuentes para mejorar sugerencias de viaje.\n\n**INFORMACIÓN DE USO Y COMPORTAMIENTO:**\n\nRecopilamos información sobre cómo utiliza nuestra plataforma, incluyendo patrones de uso de la aplicación, preferencias de viaje, historial de búsquedas, interacciones con otros usuarios, valoraciones otorgadas y recibidas, y comentarios publicados en la plataforma.',
      
      '**3. FINALIDADES DEL TRATAMIENTO DE DATOS**\n\n**PRESTACIÓN Y MEJORA DE SERVICIOS:**\n\nUtilizamos su información personal para conectar conductores con pasajeros de manera eficiente, facilitar la comunicación entre usuarios durante todo el proceso del viaje, procesar reservas y coordinar los detalles logísticos de cada viaje, y personalizar su experiencia en la plataforma mediante sugerencias relevantes y filtros de búsqueda optimizados.\n\n**SEGURIDAD Y VERIFICACIÓN:**\n\nProcesamos sus datos para verificar la identidad de todos los usuarios y prevenir la creación de cuentas fraudulentas, implementar medidas de seguridad que protejan a toda la comunidad de usuarios, detectar y prevenir actividades sospechosas o fraudulentas, y mantener registros de seguridad para investigaciones cuando sea necesario.\n\n**COMUNICACIÓN Y SOPORTE:**\n\nUtilizamos su información de contacto para enviar notificaciones importantes sobre el estado de sus viajes, actualizaciones de la aplicación y cambios en nuestros servicios, comunicar promociones y ofertas especiales que puedan ser de su interés, proporcionar soporte técnico y atención al cliente de calidad, y facilitar la resolución de conflictos entre usuarios.\n\n**CUMPLIMIENTO LEGAL Y REGULATORIO:**\n\nProcesamos datos cuando sea necesario para cumplir con obligaciones legales y regulatorias, responder a requerimientos de autoridades competentes, mantener registros contables y fiscales según la legislación vigente, y colaborar con investigaciones legales cuando sea requerido por ley.',
      
      '**4. BASES LEGALES PARA EL TRATAMIENTO**\n\nEl tratamiento de sus datos personales se fundamenta en las siguientes bases legales reconocidas por la normatividad colombiana:\n\n**CONSENTIMIENTO INFORMADO:**\nPara la mayoría de tratamientos, contamos con su consentimiento libre, previo, expreso e informado, otorgado al momento de registro y actualizado cuando introducimos nuevas finalidades de tratamiento.\n\n**EJECUCIÓN CONTRACTUAL:**\nAlgunos tratamientos son necesarios para ejecutar el contrato de servicios que tiene con nosotros, incluyendo la facilitación de viajes, procesamiento de pagos y comunicación entre usuarios.\n\n**INTERÉS LEGÍTIMO:**\nEn casos específicos, procesamos datos basados en nuestro interés legítimo de mejorar la seguridad, prevenir fraudes y optimizar nuestros servicios, siempre respetando sus derechos fundamentales.\n\n**OBLIGACIÓN LEGAL:**\nCuando el tratamiento sea requerido por leyes aplicables, como reportes a autoridades fiscales o cooperación con investigaciones legales.',
      
      '**5. COMPARTIR INFORMACIÓN CON TERCEROS**\n\n**INFORMACIÓN VISIBLE ENTRE USUARIOS:**\n\nPara facilitar los viajes, compartimos información específica entre conductores y pasajeros del mismo viaje, incluyendo nombres, fotografías de perfil, valoraciones promedio, información básica del vehículo (para pasajeros) y información de contacto temporal durante viajes activos.\n\n**PROVEEDORES DE SERVICIOS:**\n\nCompartimos información limitada con proveedores tecnológicos que nos ayudan a operar la plataforma, incluyendo servicios de almacenamiento en la nube, procesadores de pagos, proveedores de análisis de datos, servicios de comunicación (SMS, email), y servicios de mapas y geolocalización. Todos estos proveedores están contractualmente obligados a proteger su información.\n\n**AUTORIDADES Y CUMPLIMIENTO LEGAL:**\n\nPodemos compartir información cuando sea legalmente requerido, incluyendo respuestas a órdenes judiciales o requerimientos de autoridades competentes, investigaciones de fraude o actividades ilegales, y protección de derechos, seguridad y propiedad de Cupo y sus usuarios.\n\n**COMPROMISO DE NO VENTA:**\n\nNunca vendemos, alquilamos o comercializamos su información personal a terceros con fines publicitarios o comerciales.',
      
      '**6. MEDIDAS DE SEGURIDAD DE LA INFORMACIÓN**\n\n**PROTECCIÓN TÉCNICA:**\n\nImplementamos múltiples capas de seguridad técnica para proteger su información, incluyendo encriptación de extremo a extremo para datos sensibles, protocolos seguros de transmisión de datos (HTTPS/TLS), sistemas de autenticación multifactor, firewalls y sistemas de detección de intrusiones, y monitoreo continuo de actividades sospechosas.\n\n**PROTECCIÓN ADMINISTRATIVA:**\n\nMantenemos estrictos controles administrativos, incluyendo acceso restringido a datos personales solo para empleados autorizados que requieren acceso para cumplir sus funciones laborales, capacitación regular en protección de datos para todo el personal, políticas internas de manejo seguro de información, y auditorías periódicas de seguridad realizadas por terceros especializados.\n\n**PROTECCIÓN FÍSICA:**\n\nNuestros servidores y sistemas están protegidos mediante medidas físicas, incluyendo centros de datos seguros con acceso controlado, sistemas de respaldo y recuperación ante desastres, copias de seguridad regulares almacenadas en ubicaciones geográficamente distribuidas, y planes de continuidad del negocio.',
      
      '**7. TIEMPOS DE RETENCIÓN DE DATOS**\n\n**DATOS DE CUENTA ACTIVA:**\n\nMientras su cuenta permanezca activa, conservaremos su información de perfil, preferencias y configuraciones para proporcionar servicios continuos. Después del cierre de cuenta, conservaremos datos básicos durante 5 años adicionales para cumplir con obligaciones legales y resolver disputas potenciales.\n\n**HISTORIAL DE VIAJES:**\n\nConservamos registros de viajes durante 3 años después de completados para proporcionar soporte técnico, resolver disputas y cumplir con obligaciones de servicio al cliente. Esta información incluye detalles de ruta, valoraciones y comunicaciones relacionadas.\n\n**DATOS FINANCIEROS:**\n\nPor obligaciones fiscales y contables, conservamos registros de transacciones y pagos durante 10 años conforme a la legislación comercial colombiana.\n\n**REGISTROS DE SEGURIDAD:**\n\nConservamos logs de seguridad, registros de acceso y datos de auditoría durante 1 año para investigaciones de seguridad y cumplimiento regulatorio.',
      
      '**8. SUS DERECHOS COMO TITULAR DE DATOS**\n\nConforme a la legislación colombiana de protección de datos, usted tiene los siguientes derechos:\n\n**DERECHO DE ACCESO:**\n\nPuede solicitar información sobre qué datos personales tenemos sobre usted, cómo los utilizamos, con quién los compartimos y durante cuánto tiempo los conservamos. Proporcionaremos esta información de forma gratuita y en un formato comprensible.\n\n**DERECHO DE RECTIFICACIÓN:**\n\nTiene derecho a corregir información inexacta, incompleta o desactualizada. Puede actualizar la mayoría de su información directamente a través de la configuración de su cuenta.\n\n**DERECHO DE CANCELACIÓN:**\n\nPuede solicitar la eliminación de sus datos personales cuando ya no sean necesarios para las finalidades para las cuales fueron recopilados, sujeto a nuestras obligaciones legales de retención.\n\n**DERECHO DE OPOSICIÓN:**\n\nPuede oponerse al tratamiento de sus datos para finalidades específicas, especialmente para comunicaciones promocionales o análisis de perfiles.\n\n**DERECHO DE PORTABILIDAD:**\n\nPuede solicitar la exportación de sus datos en un formato estructurado y de uso común para transferirlos a otra plataforma.',
      
      '**9. COOKIES Y TECNOLOGÍAS DE SEGUIMIENTO**\n\n**TIPOS DE COOKIES QUE UTILIZAMOS:**\n\nUtilizamos diferentes tipos de cookies para mejorar su experiencia, incluyendo cookies esenciales necesarias para el funcionamiento básico de la plataforma, cookies de rendimiento que nos ayudan a entender cómo usa la aplicación, cookies de funcionalidad que recuerdan sus preferencias y configuraciones, y cookies analíticas que nos proporcionan estadísticas sobre el uso de la plataforma.\n\n**GESTIÓN DE COOKIES:**\n\nPuede controlar y gestionar cookies a través de la configuración de su navegador o dispositivo móvil. Sin embargo, deshabilitar ciertas cookies puede afectar la funcionalidad de algunos servicios.\n\n**TECNOLOGÍAS ADICIONALES:**\n\nTambién utilizamos otras tecnologías como píxeles de seguimiento, identificadores únicos de dispositivo y herramientas de análisis para mejorar nuestros servicios y entender mejor las necesidades de nuestros usuarios.',
      
      '**10. PROTECCIÓN DE MENORES DE EDAD**\n\nNuestros servicios están dirigidos exclusivamente a personas mayores de 18 años. No recopilamos conscientemente información personal de menores de edad.\n\nSi detectamos que hemos recopilado inadvertidamente información de un menor de edad, tomaremos medidas inmediatas para eliminar dicha información de nuestros sistemas y prohibir el acceso futuro a nuestros servicios.\n\nSi es padre o tutor legal y cree que su hijo menor de edad nos ha proporcionado información personal, contacte inmediatamente a nuestro Oficial de Protección de Datos.',
      
      '**11. TRANSFERENCIAS INTERNACIONALES DE DATOS**\n\nAlgunos de nuestros proveedores de servicios tecnológicos pueden estar ubicados fuera de Colombia, lo que puede resultar en transferencias internacionales de datos.\n\n**SALVAGUARDAS IMPLEMENTADAS:**\n\nTodas las transferencias internacionales se realizan únicamente con proveedores que cumplen con estándares internacionales de protección de datos equivalentes o superiores a los requeridos en Colombia, incluyendo certificaciones como ISO 27001, SOC 2 Type II, y marcos de cumplimiento como Privacy Shield o cláusulas contractuales estándar.\n\n**PAÍSES DE DESTINO:**\n\nActualmente, algunos datos pueden procesarse en centros de datos ubicados en Estados Unidos y países de la Unión Europea, todos con marcos regulatorios robustos de protección de datos.',
      
      '**12. CAMBIOS A ESTA POLÍTICA DE PRIVACIDAD**\n\n**PROCESO DE ACTUALIZACIÓN:**\n\nPodemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas, tecnologías utilizadas, o requerimientos legales. Cualquier cambio material será comunicado con al menos 30 días de anticipación.\n\n**MÉTODOS DE NOTIFICACIÓN:**\n\nLe notificaremos sobre cambios importantes a través de correo electrónico a su dirección registrada, notificaciones prominentes en la aplicación, y publicación de la nueva política en nuestro sitio web.\n\n**ACEPTACIÓN DE CAMBIOS:**\n\nEl uso continuado de nuestros servicios después de la fecha de entrada en vigor de los cambios constituye su aceptación de la política actualizada.',
      
      '**13. CONTACTO PARA TEMAS DE PRIVACIDAD**\n\n**OFICIAL DE PROTECCIÓN DE DATOS:**\n\nDra. María Elena Rodríguez\nTítulo: Chief Privacy Officer\nCorreo electrónico: dpo@cupo.dev\nTeléfono directo: +57 (1) 234-5678 ext. 105\n\n**DEPARTAMENTO DE PRIVACIDAD:**\n\nCupo SAS - Departamento de Privacidad\nDirección: Carrera 7 #71-21, Oficina 503, Bogotá D.C.\nCorreo general: privacidad@cupo.dev\nHorario de atención: Lunes a viernes, 8:00 AM a 6:00 PM\n\n**FORMULARIO WEB:**\n\nTambién puede contactarnos a través de nuestro formulario especializado en: www.cupo.dev/privacidad/contacto\n\n**TIEMPO DE RESPUESTA:**\n\nNos comprometemos a responder todas las consultas relacionadas con privacidad dentro de un plazo máximo de 15 días hábiles.\n\n**ÚLTIMA ACTUALIZACIÓN:** 2 de enero de 2025\n**VERSIÓN:** 3.0\n**VIGENCIA:** A partir del 15 de enero de 2025'
    ]
  },
  {
    id: 'community',
    title: 'Normas de Comunidad',
    icon: <IconUsers size={20} />,
    content: [
      '**FUNDAMENTOS DE NUESTRA COMUNIDAD**\n\nCupo es mucho más que una aplicación de transporte compartido: somos una comunidad vibrante de personas que comparten valores fundamentales de respeto, seguridad, colaboración y sostenibilidad ambiental. Creemos firmemente que cada viaje es una oportunidad para crear conexiones positivas, reducir nuestra huella ambiental y construir una sociedad más colaborativa.\n\nNuestra comunidad está compuesta por miles de conductores y pasajeros que han elegido una forma de movilidad más inteligente, económica y social. Estos principios guían todas nuestras interacciones y definen la experiencia que queremos ofrecer a cada miembro de nuestra familia Cupo.\n\nEstas normas han sido desarrolladas con base en la retroalimentación de nuestra comunidad y representan el compromiso colectivo de mantener un ambiente seguro, respetuoso y agradable para todos.',
      
      '**PRINCIPIOS FUNDAMENTALES DE COMPORTAMIENTO**\n\n**RESPETO MUTUO Y DIVERSIDAD:**\n\nTodos los miembros de nuestra comunidad merecen ser tratados con dignidad, cortesía y respeto, independientemente de su origen étnico, género, edad, religión, orientación sexual, discapacidad, nivel socioeconómico o cualquier otra característica personal. Valoramos la diversidad como una fortaleza que enriquece nuestras experiencias de viaje.\n\nProhibimos categóricamente cualquier forma de discriminación, acoso, intimidación o lenguaje ofensivo. Esto incluye comentarios despectivos, chistes inapropiados, comportamientos condescendientes o cualquier acción que pueda hacer sentir incómodo o no bienvenido a otro usuario.\n\n**COMUNICACIÓN EFECTIVA Y TRANSPARENTE:**\n\nLa comunicación clara y honesta es fundamental para el éxito de cada viaje. Los conductores deben proporcionar información precisa sobre su vehículo, ruta planificada, horarios y cualquier condición especial del viaje. Los pasajeros deben ser transparentes sobre sus necesidades, ubicación exacta de recogida y cualquier circunstancia que pueda afectar el viaje.\n\nAlentamos la comunicación proactiva: si surge algún cambio o imprevisto, todas las partes deben informar inmediatamente a través de los canales oficiales de la plataforma.',
      
      '**ESTÁNDARES DE PUNTUALIDAD Y RESPONSABILIDAD**\n\n**COMPROMISO CON LOS HORARIOS:**\n\nLa puntualidad es una muestra de respeto hacia otros miembros de la comunidad. Los conductores deben salir a la hora programada y cumplir con los horarios de recogida acordados. Los pasajeros deben estar listos y presentes en el punto de encuentro a la hora convenida.\n\nEntendemos que ocasionalmente pueden surgir circunstancias imprevistas. En estos casos, la comunicación inmediata es esencial. Retrasos menores de 10 minutos deben comunicarse de inmediato, y retrasos mayores pueden justificar la reprogramación o cancelación del viaje.\n\n**RESPONSABILIDAD COMPARTIDA:**\n\nTodos los usuarios comparten la responsabilidad de mantener un ambiente positivo durante el viaje. Esto incluye mantener conversaciones apropiadas, respetar el espacio personal de otros, cuidar la limpieza del vehículo y contribuir a una atmósfera amigable y relajada.\n\nLos conductores son responsables de mantener su vehículo en condiciones óptimas de limpieza, seguridad y funcionamiento. Los pasajeros son responsables de cuidar el vehículo como si fuera propio y reportar cualquier daño accidental.',
      
      '**PROTOCOLO DE SEGURIDAD INTEGRAL**\n\n**VERIFICACIÓN DE IDENTIDAD:**\n\nAntes de iniciar cualquier viaje, tanto conductores como pasajeros deben verificar mutuamente sus identidades utilizando la información proporcionada en la aplicación. Esto incluye confirmar nombres, fotografías de perfil y, cuando sea necesario, solicitar identificación adicional.\n\nLos conductores deben verificar que su vehículo coincida con la información registrada en la plataforma, incluyendo placa, color, marca y modelo. Los pasajeros tienen derecho a confirmar estos detalles antes de abordar.\n\n**COMUNICACIÓN DE DETALLES DEL VIAJE:**\n\nTodos los usuarios deben compartir detalles relevantes del viaje con personas de confianza, incluyendo información del conductor o pasajeros, ruta planificada, horarios estimados y número de placa del vehículo.\n\n**PROTOCOLO DURANTE EL VIAJE:**\n\nEl uso del cinturón de seguridad es obligatorio para todos los ocupantes del vehículo. Los conductores deben respetar todas las normas de tránsito, mantener velocidades seguras y evitar el uso de dispositivos móviles mientras conducen.\n\nQualquier comportamiento que genere incomodidad o preocupación debe reportarse inmediatamente a través de la función de emergencia de la aplicación.',
      
      '**CONDUCTAS ESTRICTAMENTE PROHIBIDAS**\n\n**COMPORTAMIENTOS BAJO INFLUENCIA:**\n\nEstá terminantemente prohibido conducir o viajar bajo la influencia del alcohol, drogas ilegales o cualquier sustancia que pueda afectar la capacidad de juicio o la seguridad. Los conductores que presenten signos de intoxicación serán reportados inmediatamente a las autoridades competentes.\n\n**ACTIVIDADES ILEGALES:**\n\nNuestra plataforma no debe utilizarse para facilitar o encubrir actividades ilegales de ningún tipo. Esto incluye transporte de sustancias prohibidas, evasión de controles policiales, o cualquier actividad que viole las leyes locales, nacionales o internacionales.\n\n**COMPORTAMIENTO SEXUAL INAPROPIADO:**\n\nCualquier forma de acoso sexual, comentarios de naturaleza sexual, contacto físico no consensuado o comportamiento sexual inapropiado resultará en la suspensión inmediata y permanente de la cuenta, además de reportes a las autoridades correspondientes.\n\n**VIOLENCIA Y AMENAZAS:**\n\nNo toleramos ninguna forma de violencia física, amenazas verbales, intimidación o comportamiento agresivo. Esto incluye alzar la voz de manera intimidante, golpear objetos, o cualquier acción que pueda generar temor en otros usuarios.',
      
      '**POLÍTICA AMBIENTAL Y SOSTENIBILIDAD**\n\n**COMPROMISO ECOLÓGICO:**\n\nComo comunidad comprometida con la sostenibilidad, alentamos prácticas que reduzcan el impacto ambiental. Esto incluye mantener vehículos en buen estado para optimizar el consumo de combustible, promover el uso compartido de vehículos como alternativa al transporte individual, y evitar rutas innecesariamente largas.\n\n**PROHIBICIÓN DE FUMAR:**\n\nEstar prohibido fumar cigarrillos, cigarrillos electrónicos o cualquier sustancia dentro de los vehículos, a menos que el conductor haya dado autorización explícita y todos los pasajeros estén de acuerdo. El respeto por la salud de todos los ocupantes es prioritario.\n\n**GESTIÓN DE RESIDUOS:**\n\nTodos los usuarios deben mantener la limpieza del vehículo y llevarse sus residuos al finalizar el viaje. No está permitido arrojar basura por las ventanas o dejar desperdicios en el vehículo.',
      
      '**SISTEMA DE VALORACIONES Y RETROALIMENTACIÓN**\n\n**IMPORTANCIA DE LAS VALORACIONES:**\n\nNuestro sistema de valoraciones bidireccional es fundamental para mantener la calidad y seguridad de la comunidad. Las calificaciones honestas y constructivas ayudan a otros usuarios a tomar decisiones informadas y contribuyen al mejoramiento continuo de la experiencia.\n\n**CRITERIOS DE EVALUACIÓN:**\n\nLas valoraciones deben basarse en aspectos objetivos como puntualidad, limpieza del vehículo, seguridad de la conducción, amabilidad en el trato y cumplimiento de las condiciones acordadas. Evite valoraciones basadas en prejuicios personales o características físicas de otros usuarios.\n\n**CONSTRUCTIVIDAD EN COMENTARIOS:**\n\nLos comentarios escritos deben ser específicos, útiles y respetuosos. Proporcione información que pueda ayudar a otros usuarios o al evaluado a mejorar su experiencia. Evite comentarios ofensivos, discriminatorios o exageradamente negativos.\n\n**CONSECUENCIAS DE VALORACIONES BAJAS:**\n\nUsuarios con valoraciones consistentemente bajas (por debajo de 4.0 en una escala de 5.0) pueden ser sujetos a revisión de cuenta, suspensión temporal o requerimientos de capacitación adicional.',
      
      '**SISTEMA PROGRESIVO DE CONSECUENCIAS**\n\n**INFRACCIONES MENORES:**\n\nPor primera vez: Advertencia formal con explicación de la norma violada y orientación para mejorar el comportamiento.\nSegunda infracción: Suspensión temporal de 7 días con capacitación obligatoria sobre normas comunitarias.\nTercera infracción: Suspensión temporal de 30 días y revisión exhaustiva de la cuenta.\n\n**INFRACCIONES GRAVES:**\n\nComportamientos que comprometan la seguridad, involucren discriminación severa, o violen leyes resultarán en suspensión inmediata de 90 días a permanente, dependiendo de la gravedad.\n\n**INFRACCIONES CRÍTICAS:**\n\nViolencia física, acoso sexual, actividades ilegales o cualquier comportamiento que ponga en riesgo grave la seguridad de otros usuarios resultará en prohibición permanente inmediata y reporte a autoridades competentes.',
      
      '**PROCESO DE REPORTES Y RESOLUCIÓN DE CONFLICTOS**\n\n**CÓMO REPORTAR PROBLEMAS:**\n\nUtilice la función de reporte inmediato en la aplicación durante o inmediatamente después del incidente. Para situaciones de emergencia, contacte primero a las autoridades locales (policía: 123) y luego repórtenos. Proporcione detalles específicos, incluyendo fechas, horarios, ubicaciones y descripción clara de lo ocurrido.\n\n**PROCESO DE INVESTIGACIÓN:**\n\nTodos los reportes son revisados por nuestro equipo especializado dentro de 24 horas. Investigaciones complejas pueden tomar hasta 72 horas. Durante la investigación, podemos suspender temporalmente las cuentas involucradas como medida preventiva.\n\n**MEDIACIÓN Y RESOLUCIÓN:**\n\nPara conflictos menores, ofrecemos servicios de mediación para ayudar a las partes a llegar a una resolución mutuamente satisfactoria. Nuestro equipo de atención al cliente está capacitado para facilitar estas conversaciones de manera imparcial.\n\n**PROCESO DE APELACIÓN:**\n\nLos usuarios tienen derecho a apelar decisiones de suspensión o penalización dentro de 15 días. El proceso de apelación incluye revisión por un panel independiente y oportunidad de presentar evidencia adicional.',
      
      '**COMPROMISO CONTINUO CON LA EXCELENCIA**\n\nEstas normas son un documento vivo que evoluciona con nuestra comunidad. Valoramos la retroalimentación de nuestros usuarios y actualizamos regularmente nuestras políticas para reflejar las mejores prácticas y las necesidades cambiantes de nuestra comunidad.\n\nJuntos, estamos construyendo no solo una plataforma de transporte, sino una comunidad que demuestra cómo la colaboración, el respeto mutuo y la responsabilidad compartida pueden transformar la manera en que nos movemos por nuestras ciudades.\n\nGracias por ser parte de la familia Cupo y por contribuir a hacer de cada viaje una experiencia positiva y memorable para todos.\n\n**Última actualización:** 2 de enero de 2025\n**Vigencia:** Inmediata para todos los usuarios activos\n**Revisión programada:** Cada 6 meses con participación de la comunidad'
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
