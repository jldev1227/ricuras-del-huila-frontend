import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordChangedEmailProps {
  nombre: string;
  fecha: string;
  ipAddress?: string;
}

export const PasswordChangedEmail = ({
  nombre,
  fecha,
  ipAddress,
}: PasswordChangedEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu contraseña ha sido actualizada - Ricuras del Huila</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={headerText}>Ricuras del Huila</Heading>
        </Section>

        <Section style={content}>
          <Heading style={title}>Contraseña Actualizada</Heading>
          <Text style={paragraph}>
            Hola <strong>{nombre}</strong>,
          </Text>
          <Text style={paragraph}>
            Te confirmamos que tu contraseña ha sido actualizada exitosamente.
          </Text>

          <Hr style={divider} />

          <Section style={detailsSection}>
            <Text style={detailRow}>
              <strong>Fecha y hora:</strong> {fecha}
            </Text>
            {ipAddress && (
              <Text style={detailRow}>
                <strong>Dirección IP:</strong> {ipAddress}
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={warningBox}>
            <Text style={warningTitle}>⚠️ ¿No fuiste tú?</Text>
            <Text style={warningText}>
              Si NO realizaste este cambio, tu cuenta puede estar comprometida.
              Por favor, toma las siguientes acciones inmediatamente:
            </Text>
            <Text style={warningText}>
              1. Intenta recuperar tu contraseña usando tu correo registrado
            </Text>
            <Text style={warningText}>
              2. Contacta al administrador del sistema
            </Text>
            <Text style={warningText}>
              3. Verifica que no haya actividad sospechosa en tu cuenta
            </Text>
          </Section>

          <Text style={paragraph}>
            Si fuiste tú quien realizó este cambio, puedes ignorar este mensaje.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Ricuras del Huila - Sistema de Gestión
          </Text>
          <Text style={footerText}>
            Este es un correo automático de seguridad, por favor no respondas.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordChangedEmail;

// Estilos
const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Arial, sans-serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const header = {
  backgroundColor: "#E49F35",
  padding: "20px",
  textAlign: "center" as const,
  borderRadius: "5px 5px 0 0",
};

const headerText = {
  color: "#ffffff",
  fontSize: "24px",
  margin: "0",
};

const content = {
  backgroundColor: "#f9f9f9",
  padding: "30px",
  borderRadius: "0 0 5px 5px",
};

const title = {
  color: "#333333",
  fontSize: "20px",
  marginBottom: "20px",
};

const paragraph = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "10px 0",
};

const divider = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const detailsSection = {
  margin: "20px 0",
};

const detailRow = {
  fontSize: "14px",
  color: "#333333",
  margin: "8px 0",
};

const warningBox = {
  backgroundColor: "#FEF2F2",
  border: "2px solid #EF4444",
  borderRadius: "5px",
  padding: "20px",
  margin: "20px 0",
};

const warningTitle = {
  color: "#DC2626",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const warningText = {
  color: "#991B1B",
  fontSize: "14px",
  margin: "8px 0",
  lineHeight: "1.5",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const footerText = {
  color: "#666666",
  fontSize: "12px",
  margin: "5px 0",
};
