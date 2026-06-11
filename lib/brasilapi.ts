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
  qsa: { nome_socio: string; qualificacao_socio: string; pais_origem: string | null }[];
}

async function fetchComTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": "scooto-compliance/1.0" },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

// ── Fonte 1: CNPJ.ws ────────────────────────────────────────────────────────
async function viaCNPJws(digits: string): Promise<BrasilApiCNPJ> {
  const res = await fetchComTimeout(`https://publica.cnpj.ws/cnpj/${digits}`);
  if (!res.ok) throw new Error(res.status === 404 ? "not_found" : `cnpjws_${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
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
    cnae_fiscal: Number(est.atividade_principal?.id ?? 0),
    cnae_fiscal_descricao: est.atividade_principal?.descricao ?? "—",
    cnaes_secundarios: (est.atividades_secundarias ?? []).map(
      (c: { id: number; descricao: string }) => ({ codigo: c.id, descricao: c.descricao })
    ),
    qsa: (d.socios ?? []).map((s: { nome: string; qualificacao_socio: { descricao: string }; pais?: { descricao: string } }) => ({
      nome_socio: s.nome,
      qualificacao_socio: s.qualificacao_socio?.descricao ?? "—",
      pais_origem: s.pais?.descricao ?? null,
    })),
  };
}

// ── Fonte 2: ReceitaWS ───────────────────────────────────────────────────────
async function viaReceitaWS(digits: string): Promise<BrasilApiCNPJ> {
  const res = await fetchComTimeout(`https://receitaws.com.br/v1/cnpj/${digits}`);
  if (!res.ok) throw new Error(res.status === 404 ? "not_found" : res.status === 429 ? "rate_limit" : `receitaws_${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  if (d.status === "ERROR") throw new Error("not_found");

  const tel = (d.telefone ?? "").replace(/\D/g, "");
  const cnaeCode = (d.atividade_principal?.[0]?.code ?? "").replace(/\D/g, "");

  // ReceitaWS date format: "DD/MM/YYYY" → "YYYYMMDD"
  function toYMD(s: string): string {
    if (!s) return "";
    const [dd, mm, yyyy] = s.split("/");
    return yyyy && mm && dd ? `${yyyy}${mm}${dd}` : s;
  }

  return {
    cnpj: digits,
    razao_social: d.nome ?? "—",
    nome_fantasia: d.fantasia ?? "—",
    descricao_natureza_juridica: d.natureza_juridica ?? "—",
    descricao_porte: d.porte ?? "—",
    capital_social: Number(d.capital_social ?? 0),
    descricao_situacao_cadastral: d.situacao ?? "—",
    data_situacao_cadastral: toYMD(d.data_situacao),
    descricao_motivo_situacao_cadastral: d.motivo_situacao ?? "—",
    data_inicio_atividade: toYMD(d.abertura),
    opcao_pelo_simples: d.simples?.optante === true,
    opcao_pelo_mei: d.simei?.optante === true,
    logradouro: d.logradouro ?? "",
    numero: d.numero ?? "",
    complemento: d.complemento ?? "",
    bairro: d.bairro ?? "",
    municipio: d.municipio ?? "",
    uf: d.uf ?? "",
    cep: d.cep ?? "",
    ddd_telefone_1: tel,
    email: d.email ?? "",
    cnae_fiscal: Number(cnaeCode) || 0,
    cnae_fiscal_descricao: d.atividade_principal?.[0]?.text ?? "—",
    cnaes_secundarios: (d.atividades_secundarias ?? []).map(
      (c: { code: string; text: string }) => ({
        codigo: Number(c.code.replace(/\D/g, "")) || 0,
        descricao: c.text,
      })
    ),
    qsa: (d.qsa ?? []).map((s: { nome: string; qual: string }) => ({
      nome_socio: s.nome,
      qualificacao_socio: s.qual ?? "—",
      pais_origem: null,
    })),
  };
}

// ── Orquestrador com fallback ────────────────────────────────────────────────
export async function consultarCNPJ(cnpj: string): Promise<BrasilApiCNPJ> {
  const digits = cnpj.replace(/\D/g, "");

  // Fonte 1: CNPJ.ws
  try {
    return await viaCNPJws(digits);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "rate_limit") throw new Error("Limite de consultas atingido. Aguarde alguns segundos e tente novamente.");
    // Qualquer outro erro → tenta fonte 2
    console.log(`[CNPJ] CNPJ.ws falhou (${msg}), tentando ReceitaWS...`);
  }

  // Fonte 2: ReceitaWS
  try {
    return await viaReceitaWS(digits);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "rate_limit") throw new Error("Limite de consultas atingido. Aguarde alguns segundos e tente novamente.");
    if (msg === "not_found") throw new Error("CNPJ não encontrado na base da Receita Federal. Verifique o número informado.");
    throw new Error("Erro ao consultar a Receita Federal. Tente novamente em alguns instantes.");
  }
}
