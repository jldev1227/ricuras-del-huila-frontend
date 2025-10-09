import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OTPEmailProps {
  nombre: string;
  otp: string;
}

export const OTPEmail = ({ nombre, otp }: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu código de recuperación es {otp}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={headerText}>Ricuras del Huila</Heading>
        </Section>

        <Section style={content}>
          <Heading style={title}>Recuperación de Contraseña</Heading>
          <Text style={paragraph}>
            Hola <strong>{nombre}</strong>,
          </Text>
          <Text style={paragraph}>
            Recibimos una solicitud para restablecer tu contraseña. Usa el
            siguiente código para continuar:
          </Text>

          <Section style={otpContainer}>
            <Text style={otpCode}>{otp}</Text>
          </Section>

          <Text style={paragraph}>
            <strong>Este código expirará en 10 minutos.</strong>
          </Text>
          <Text style={paragraph}>
            Si no solicitaste este cambio, ignora este mensaje y tu contraseña
            permanecerá segura.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Ricuras del Huila - Sistema de Gestión
          </Text>
          <Text style={footerText}>
            Este es un correo automático, por favor no respondas.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OTPEmail;

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
};

const otpContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const otpCode = {
  fontSize: "36px",
  fontWeight: "bold",
  letterSpacing: "8px",
  color: "#E49F35",
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "5px",
  display: "inline-block",
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
