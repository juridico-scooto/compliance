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

async function fetchComTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json", "User-Agent": "scooto-compliance/1.0" },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

// Fonte 1: BrasilAPI
async function viaBrasilAPI(digits: string): Promise<BrasilApiCNPJ> {
  const res = await fetchComTimeout(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new Error("rate_limit");
    if (status === 404) throw new Error("not_found");
    throw new Error(`brasilapi_${status}`);
  }
  return res.json();
}

// Fonte 2: CNPJ.ws (fallback)
async function viaCNPJws(digits: string): Promise<BrasilApiCNPJ> {
  const res = await fetchComTimeout(`https://publica.cnpj.ws/cnpj/${digits}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("not_found");
    throw new Error(`cnpjws_${res.status}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();

  // Mapeia o formato do CNPJ.ws para o nosso formato padrão
  const socios = (d.socios ?? []).map((s: { nome: string; qualificacao_socio: { descricao: string }; pais?: { descricao: string } }) => ({
    nome_socio: s.nome,
    qualificacao_socio: s.qualificacao_socio?.descricao ?? "—",
    pais_origem: s.pais?.descricao ?? null,
  }));

  const cnaePrincipal = d.estabelecimento?.atividade_principal;
  const cnaesSecundarios = (d.estabelecimento?.atividades_secundarias ?? []).map(
    (c: { id: number; descricao: string }) => ({ codigo: c.id, descricao: c.descricao })
  );

  const est = d.estabelecimento ?? {};

  return {
    cnpj: digits,
    razao_social: d.razao_social ?? "—",
    nome_fantasia: est.nome_fantasia ?? "—",
    descricao_natureza_juridica: d.natureza_juridica?.descricao ?? "—",
    descricao_porte: d.porte?.descricao ?? "—",
    capital_social: Number(d.capital_social ?? 0),
    descricao_situacao_cadastral: est.situacao_cadastral ?? "—",
    data_situacao_cadastral: est.data_situacao_cadastral ?? "",
    descricao_motivo_situacao_cadastral: est.motivo_situacao_cadastral?.descricao ?? "—",
    data_inicio_atividade: est.data_inicio_atividade ?? "",
    opcao_pelo_simples: d.simples?.simples === "Sim",
    opcao_pelo_mei: d.simples?.mei === "Sim",
    logradouro: `${est.tipo_logradouro ?? ""} ${est.logradouro ?? ""}`.trim(),
    numero: est.numero ?? "",
    complemento: est.complemento ?? "",
    bairro: est.bairro ?? "",
    municipio: est.cidade?.nome ?? "",
    uf: est.estado?.sigla ?? "",
    cep: est.cep ?? "",
    ddd_telefone_1: est.ddd1 ? `${est.ddd1}${est.telefone1 ?? ""}` : "",
    email: est.email ?? "",
    cnae_fiscal: Number(cnaePrincipal?.id ?? 0),
    cnae_fiscal_descricao: cnaePrincipal?.descricao ?? "—",
    cnaes_secundarios: cnaesSecundarios,
    qsa: socios,
  };
}

export async function consultarCNPJ(cnpj: string): Promise<BrasilApiCNPJ> {
  const digits = cnpj.replace(/\D/g, "");

  // Tenta BrasilAPI primeiro
  try {
    return await viaBrasilAPI(digits);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";

    if (msg === "rate_limit") {
      throw new Error("Limite de consultas atingido. Aguarde alguns segundos e tente novamente.");
    }

    // Se não foi 404 nem rate limit, é erro genérico de rede — tenta fallback mesmo assim
    const isFallbackable = msg === "not_found" || msg.startsWith("brasilapi_") || msg.includes("AbortError") || msg.includes("fetch");
    if (!isFallbackable) throw new Error("Erro ao consultar a Receita Federal. Tente novamente.");

    console.log(`[CNPJ] BrasilAPI falhou (${msg}), tentando CNPJ.ws...`);
  }

  // Fallback: CNPJ.ws
  try {
    return await viaCNPJws(digits);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") {
      throw new Error("CNPJ não encontrado em nenhuma base de dados. Verifique o número e tente novamente.");
    }
    throw new Error("Erro ao consultar a Receita Federal. Tente novamente em alguns instantes.");
  }
}
