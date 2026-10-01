import { BrasilApiCnpjResponse } from '../types/crm';

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export interface CNPJLookupResult {
  success: boolean;
  data?: {
    cnpj: string;
    corporateName: string;
    tradeName: string;
    phone: string;
    email: string;
    cnae: string;
    statusCadastral: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  error?: string;
}

export async function fetchCompanyByCNPJ(rawCnpj: string): Promise<CNPJLookupResult> {
  const cleaned = cleanDigits(rawCnpj);
  if (cleaned.length !== 14) {
    return {
      success: false,
      error: 'CNPJ deve conter exatamente 14 dígitos numéricos.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'CNPJ não encontrado na base da Receita Federal.',
        };
      }
      return {
        success: false,
        error: `Erro na consulta da BrasilAPI (Código: ${response.status}). Verifique o número digitado.`,
      };
    }

    const json: BrasilApiCnpjResponse = await response.json();

    // Format phone if present
    let rawPhone = json.ddd_telefone_1 || json.ddd_telefone_2 || '';
    if (rawPhone && !rawPhone.startsWith('(')) {
      rawPhone = formatPhone(rawPhone);
    }

    return {
      success: true,
      data: {
        cnpj: formatCNPJ(json.cnpj || cleaned),
        corporateName: json.razao_social || '',
        tradeName: json.nome_fantasia || json.razao_social || '',
        phone: rawPhone,
        email: (json.email || '').toLowerCase().trim(),
        cnae: json.cnae_fiscal_descricao || '',
        statusCadastral: json.descricao_situacao_cadastral || 'ATIVA',
        street: json.logradouro || '',
        number: json.numero || '',
        complement: json.complemento || '',
        neighborhood: json.bairro || '',
        city: json.municipio || '',
        state: json.uf || '',
        zipCode: json.cep ? json.cep.replace(/^(\d{5})(\d)/, '$1-$2') : '',
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'A consulta demorou muito para responder. Tente novamente ou preencha os dados manualmente.',
      };
    }
    return {
      success: false,
      error: 'Falha de conexão com a BrasilAPI. Verifique sua conexão à internet.',
    };
  }
}
