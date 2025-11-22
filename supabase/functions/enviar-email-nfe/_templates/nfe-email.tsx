import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NFeEmailProps {
  cliente_nome: string;
  numero_nfe: string;
  serie_nfe: string;
  chave_acesso: string;
  valor_total: number;
  data_emissao: string;
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_email?: string;
  empresa_telefone?: string;
  mensagem_adicional?: string;
}

export const NFeEmail = ({
  cliente_nome,
  numero_nfe,
  serie_nfe,
  chave_acesso,
  valor_total,
  data_emissao,
  empresa_nome,
  empresa_cnpj,
  empresa_email,
  empresa_telefone,
  mensagem_adicional,
}: NFeEmailProps) => (
  <Html>
    <Head />
    <Preview>NFe {numero_nfe} - {empresa_nome}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nota Fiscal Eletrônica</Heading>
        
        <Text style={text}>
          Prezado(a) <strong>{cliente_nome}</strong>,
        </Text>

        <Text style={text}>
          Segue em anexo a Nota Fiscal Eletrônica (NFe) e o DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) 
          referente à operação realizada.
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>Dados da NFe</Text>
          <Hr style={hr} />
          <table style={table}>
            <tbody>
              <tr>
                <td style={labelCell}>Número:</td>
                <td style={valueCell}>{numero_nfe}</td>
              </tr>
              <tr>
                <td style={labelCell}>Série:</td>
                <td style={valueCell}>{serie_nfe}</td>
              </tr>
              <tr>
                <td style={labelCell}>Data de Emissão:</td>
                <td style={valueCell}>
                  {new Date(data_emissao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
              </tr>
              <tr>
                <td style={labelCell}>Valor Total:</td>
                <td style={valueCell}>
                  R$ {valor_total.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>Chave de Acesso</Text>
          <Hr style={hr} />
          <Text style={chaveAcessoText}>{chave_acesso}</Text>
          <Text style={smallText}>
            Esta chave pode ser utilizada para consultar a autenticidade da NFe no site da SEFAZ.
          </Text>
        </Section>

        {mensagem_adicional && (
          <Section style={messageBox}>
            <Text style={text}>{mensagem_adicional}</Text>
          </Section>
        )}

        <Section style={attachmentBox}>
          <Text style={text}>
            <strong>Anexos:</strong>
          </Text>
          <Text style={smallText}>
            • XML da NFe (arquivo digital da nota fiscal)<br />
            • DANFE em PDF (documento auxiliar para transporte)
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={footer}>
          <Text style={footerTitle}>{empresa_nome}</Text>
          <Text style={footerText}>CNPJ: {empresa_cnpj}</Text>
          {empresa_email && (
            <Text style={footerText}>
              Email: <Link href={`mailto:${empresa_email}`} style={link}>{empresa_email}</Link>
            </Text>
          )}
          {empresa_telefone && (
            <Text style={footerText}>Telefone: {empresa_telefone}</Text>
          )}
        </Section>

        <Text style={disclaimer}>
          Este é um e-mail automático. Por favor, não responda a esta mensagem.
          Em caso de dúvidas, entre em contato através dos canais de atendimento informados acima.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NFeEmail;

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 20px 20px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 20px',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  margin: '16px 20px',
  padding: '16px',
};

const messageBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  borderRadius: '4px',
  margin: '16px 20px',
  padding: '16px',
};

const attachmentBox = {
  backgroundColor: '#e7f3ff',
  borderLeft: '4px solid #2196F3',
  borderRadius: '4px',
  margin: '16px 20px',
  padding: '16px',
};

const infoTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  color: '#666',
  fontSize: '14px',
  padding: '8px 0',
  width: '40%',
};

const valueCell = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 0',
};

const chaveAcessoText = {
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  color: '#333',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '12px',
  wordBreak: 'break-all' as const,
  margin: '8px 0',
};

const smallText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '12px 0',
};

const footer = {
  margin: '32px 20px 16px',
};

const footerTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const footerText = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '4px 0',
};

const link = {
  color: '#2196F3',
  textDecoration: 'underline',
};

const disclaimer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 20px',
  textAlign: 'center' as const,
};