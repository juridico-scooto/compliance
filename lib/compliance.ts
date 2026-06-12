const BASE = "https://api.portaldatransparencia.gov.br/api-de-dados";
const KEY = process.env.PORTAL_TRANSPARENCIA_KEY ?? "";

export interface PEPRegistro {
  nome: string;
  cpf: string;
  cargo: string;
  orgao: string;
  situacao: string;
  dataInicio: string;
  dataFim: string;
}

export interface CEISRegistro {
  nomeInformadoOrgaoSancionador: string;
  cpfCnpjSancionado: string;
  dataInicioSancao: string;
  dataFimSancao: string;
  tipoSancao: string;
  orgaoSancionador: string;
  ufOrgaoSancionador: string;
}

export interface CNEPRegistro {
  nomeInformadoOrgaoSancionador: string;
  cpfCnpjSancionado: string;
  dataPublicacaoDou: string;
  dataInicioSancao: string;
  dataFimSancao: string;
  tipoSancao: string;
  orgaoSancionador: string;
}

export interface ComplianceResult {
  pep: { verificado: boolean; encontrado: boolean; registros: PEPRegistro[]; erro?: string };
  ceis: { verificado: boolean; encontrado: boolean; registros: CEISRegistro[]; erro?: string };
  cnep: { verificado: boolean; encontrado: boolean; registros: CNEPRegistro[]; erro?: string };
  ceisRep: { verificado: boolean; encontrado: boolean; registros: CEISRegistro[]; erro?: string };
}

async function get(path: string): Promise<unknown> {
  if (!KEY) throw new Error("chave_ausente");
  const res = await fetch(`${BASE}${path}`, {
    headers: { "chave-api-dados": KEY, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 401) throw new Error("chave_invalida");
  if (res.status === 429) throw new Error("rate_limit");
  if (!res.ok) throw new Error(`api_${res.status}`);
  const data = await res.json();
  // A API retorna objeto de erro mesmo com 200 em alguns casos
  if (data && typeof data === "object" && "Erro na API" in data) throw new Error("chave_invalida");
  return data;
}

function erroLabel(msg: string): string {
  if (msg === "chave_ausente") return "Chave do Portal da Transparência não configurada.";
  if (msg === "chave_invalida") return "Chave inativa ou inválida. Verifique o e-mail de ativação.";
  if (msg === "rate_limit") return "Limite de requisições atingido. Tente novamente em instantes.";
  return "Erro ao consultar o Portal da Transparência.";
}

// ── PEP: por nome (e CPF se informado) ──────────────────────────────────────
export async function verificarPEP(
  nome: string,
  cpf?: string
): Promise<ComplianceResult["pep"]> {
  try {
    const param = cpf
      ? `cpf=${cpf.replace(/\D/g, "")}`
      : `nome=${encodeURIComponent(nome)}`;
    const data = (await get(`/pep?${param}&pagina=1&tamanhoPagina=10`)) as { data?: unknown[] } | unknown[];
    const lista: unknown[] = Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);

    const registros: PEPRegistro[] = lista.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        nome: String((item.nome as string | undefined) ?? (item.nomeServidor as string | undefined) ?? "—"),
        cpf: String(item.cpf ?? "***.***.***-**"),
        cargo: String(item.descricaoCargo ?? item.cargo ?? "—"),
        orgao: String((item.orgaoExercicio as Record<string, unknown>)?.nome ?? item.orgaoExercicio ?? "—"),
        situacao: String(item.situacaoVinculo ?? item.situacao ?? "—"),
        dataInicio: String(item.dataInicioExercicio ?? item.dataInicio ?? ""),
        dataFim: String(item.dataFimExercicio ?? item.dataFim ?? ""),
      };
    });

    return { verificado: true, encontrado: registros.length > 0, registros };
  } catch (e: unknown) {
    return { verificado: false, encontrado: false, registros: [], erro: erroLabel(e instanceof Error ? e.message : "") };
  }
}

// ── CEIS: por CNPJ ou nome ───────────────────────────────────────────────────
export async function verificarCEIS(
  cnpjOuNome: string,
  isCnpj = true
): Promise<ComplianceResult["ceis"]> {
  try {
    const digits = cnpjOuNome.replace(/\D/g, "");
    const param = isCnpj
      ? `cnpjCpf=${digits}`
      : `nome=${encodeURIComponent(cnpjOuNome)}`;
    const data = (await get(`/ceis?${param}&pagina=1&tamanhoPagina=10`)) as { data?: unknown[] } | unknown[];
    const lista: unknown[] = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? [];

    const registros: CEISRegistro[] = lista.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        nomeInformadoOrgaoSancionador: String(item.nomeInformadoOrgaoSancionador ?? item.nome ?? "—"),
        cpfCnpjSancionado: String(item.cpfCnpjSancionado ?? "—"),
        dataInicioSancao: String(item.dataInicioSancao ?? ""),
        dataFimSancao: String(item.dataFimSancao ?? ""),
        tipoSancao: String((item.tipoSancao as Record<string, unknown>)?.descricaoResumida ?? item.tipoSancao ?? "—"),
        orgaoSancionador: String((item.orgaoSancionador as Record<string, unknown>)?.nome ?? item.orgaoSancionador ?? "—"),
        ufOrgaoSancionador: String(item.ufOrgaoSancionador ?? ""),
      };
    });

    return { verificado: true, encontrado: registros.length > 0, registros };
  } catch (e: unknown) {
    return { verificado: false, encontrado: false, registros: [], erro: erroLabel(e instanceof Error ? e.message : "") };
  }
}

// ── CNEP: por CNPJ ──────────────────────────────────────────────────────────
export async function verificarCNEP(cnpj: string): Promise<ComplianceResult["cnep"]> {
  try {
    const digits = cnpj.replace(/\D/g, "");
    const data = (await get(`/cnep?cnpjCpf=${digits}&pagina=1&tamanhoPagina=10`)) as { data?: unknown[] } | unknown[];
    const lista: unknown[] = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? [];

    const registros: CNEPRegistro[] = lista.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        nomeInformadoOrgaoSancionador: String(item.nomeInformadoOrgaoSancionador ?? item.nome ?? "—"),
        cpfCnpjSancionado: String(item.cpfCnpjSancionado ?? "—"),
        dataPublicacaoDou: String(item.dataPublicacaoDou ?? ""),
        dataInicioSancao: String(item.dataInicioSancao ?? ""),
        dataFimSancao: String(item.dataFimSancao ?? ""),
        tipoSancao: String((item.tipoSancao as Record<string, unknown>)?.descricaoResumida ?? item.tipoSancao ?? "—"),
        orgaoSancionador: String((item.orgaoSancionador as Record<string, unknown>)?.nome ?? item.orgaoSancionador ?? "—"),
      };
    });

    return { verificado: true, encontrado: registros.length > 0, registros };
  } catch (e: unknown) {
    return { verificado: false, encontrado: false, registros: [], erro: erroLabel(e instanceof Error ? e.message : "") };
  }
}

// ── Orquestrador principal ───────────────────────────────────────────────────
export async function runComplianceChecks(
  cnpj: string,
  representante?: string,
  cpfRepresentante?: string
): Promise<ComplianceResult> {
  const [ceis, cnep, pep, ceisRep] = await Promise.all([
    verificarCEIS(cnpj, true),
    verificarCNEP(cnpj),
    representante ? verificarPEP(representante, cpfRepresentante) : Promise.resolve({ verificado: false, encontrado: false, registros: [] }),
    representante ? verificarCEIS(representante, false) : Promise.resolve({ verificado: false, encontrado: false, registros: [] }),
  ]);
  return { pep, ceis, cnep, ceisRep };
}
