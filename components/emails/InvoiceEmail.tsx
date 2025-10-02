import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface InvoiceEmailProps {
  clienteNombre: string;
  numeroFactura: string;
  total: string;
  fecha: string;
}

export const InvoiceEmail = ({
  clienteNombre,
  numeroFactura,
  total,
  fecha,
}: InvoiceEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu factura #{numeroFactura} - Ricuras del Huila</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={headerText}>Ricuras del Huila</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={title}>Factura Electrónica</Heading>
          <Text style={paragraph}>
            Estimado/a <strong>{clienteNombre}</strong>,
          </Text>
          <Text style={paragraph}>
            Adjunto encontrarás tu factura electrónica.
          </Text>
          
          <Hr style={divider} />
          
          <Section style={detailsSection}>
            <Text style={detailRow}>
              <strong>Número de Factura:</strong> {numeroFactura}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {fecha}
            </Text>
            <Text style={detailRow}>
              <strong>Total:</strong> ${total}
            </Text>
          </Section>
          
          <Hr style={divider} />
          
          <Text style={paragraph}>
            Gracias por tu preferencia.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Ricuras del Huila
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InvoiceEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

const header = {
  backgroundColor: '#E49F35',
  padding: '20px',
  textAlign: 'center' as const,
  borderRadius: '5px 5px 0 0',
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  margin: '0',
};

const content = {
  backgroundColor: '#f9f9f9',
  padding: '30px',
  borderRadius: '0 0 5px 5px',
};

const title = {
  color: '#333333',
  fontSize: '20px',
  marginBottom: '20px',
};

const paragraph = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
};

const divider = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const detailsSection = {
  margin: '20px 0',
};

const detailRow = {
  fontSize: '14px',
  color: '#333333',
  margin: '8px 0',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '20px',
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
};