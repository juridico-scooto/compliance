export interface BrasilApiCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  descricao_natureza_juridica: string;
  descricao_porte: string;
  capital_social: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  descricao_motivo_situacao_cadastral: string;
  data_inicio_atividade: string;
  opcao_pelo_simples: boolean;
  opcao_pelo_mei: boolean;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  email: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: { codigo: number; descricao: string }[];
  qsa: {
    nome_socio: string;
    qualificacao_socio: string;
    pais_origem: string | null;
  }[];
}

export async function consultarCNPJ(cnpj: string): Promise<BrasilApiCNPJ> {
  const digits = cnpj.replace(/\D/g, "");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "scooto-compliance/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[BrasilAPI] status=${res.status} body=${body.slice(0, 200)}`);

      if (res.status === 404) {
        throw new Error("CNPJ não encontrado na base da Receita Federal.");
      }
      if (res.status === 429) {
        throw new Error("Limite de consultas atingido. Aguarde alguns segundos e tente novamente.");
      }
      throw new Error(`Erro ${res.status} ao consultar a Receita Federal. Tente novamente.`);
    }

    return res.json();
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Timeout: a Receita Federal demorou para responder. Tente novamente.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
