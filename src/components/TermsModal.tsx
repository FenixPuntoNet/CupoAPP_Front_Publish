import { Modal, Text, ScrollArea } from "@mantine/core";

interface TermsModalProps {
  opened: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ opened, onClose }) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Términos y Condiciones"
      size="lg"
      centered
      scrollAreaComponent={ScrollArea}
      styles={{
        content: {
          background: "#0f0f0f",
          color: "white",
          border: "1px solid rgba(0, 255, 157, 0.1)",
          borderRadius: 16,
        },
        title: {
          color: "#00ff9d",
          fontWeight: 700,
          fontSize: 20,
          textAlign: "center",
        },
        close: {
          color: "rgba(255, 255, 255, 0.6)",
          transition: "all 0.3s ease",
        },
      }}
    >
      <ScrollArea h={300} offsetScrollbars>
        <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6 }}>
          Al registrarte en la plataforma Cupo, aceptas nuestros términos de uso y condiciones.
          Cupo es una aplicación de movilidad que conecta pasajeros con conductores. Al utilizar
          nuestros servicios, aceptas que proporcionarás información veraz y actualizada, que usarás
          la plataforma de forma responsable y que cumplirás con todas las leyes y normativas locales.

          <br /><br />
          Tu información será tratada conforme a las leyes de protección de datos de Colombia, y
          sólo será utilizada para fines relacionados con la operación de la plataforma, incluyendo
          comunicaciones, mejoras del servicio y validaciones de identidad.

          <br /><br />
          Nos reservamos el derecho de suspender o eliminar cuentas que violen nuestras políticas de uso,
          incurran en fraude o representen un riesgo para otros usuarios.

          <br /><br />
          Para más información sobre nuestras políticas de privacidad y uso, puedes visitar
          nuestra sección legal en el sitio web o escribir a soporte@cupo.com.

          <br /><br />
          Última actualización: Mayo 2025.
        </Text>
      </ScrollArea>
    </Modal>
  );
};
