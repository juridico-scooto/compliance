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
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("CNPJ não encontrado na base da Receita Federal.");
    throw new Error("Erro ao consultar a Receita Federal. Tente novamente.");
  }

  return res.json();
}
