"use client";

import { BrasilApiCNPJ } from "@/lib/brasilapi";
import { formatCNPJ, fmtDate } from "@/lib/utils";
import StatusBanner from "./status-banner";
import { InfoCard, Pill } from "./info-card";
import QSATable from "./qsa-table";

interface ResultReportProps {
  data: BrasilApiCNPJ;
  resultado: "OK" | "ATENCAO" | "IRREGULAR";
  representante?: string;
  repFound: boolean | null;
  timestamp: string;
  userName?: string;
}

export default function ResultReport({
  data,
  resultado,
  representante,
  repFound,
  timestamp,
  userName,
}: ResultReportProps) {
  const ativa = data.descricao_situacao_cadastral?.toLowerCase() === "ativa";

  const bannerProps = {
    OK: {
      type: "ok" as const,
      title: "Verificação concluída — Sem impedimentos cadastrais",
      subtitle: `Empresa ativa na Receita Federal${representante ? " e representante confirmado no QSA" : ""}.`,
    },
    ATENCAO: {
      type: "warn" as const,
      title: "Empresa ativa — Representante não localizado no QSA",
      subtitle:
        "A empresa está ativa, mas o representante indicado não consta como sócio ou administrador. Solicite procuração com poderes específicos.",
    },
    IRREGULAR: {
      type: "fail" as const,
      title: "Empresa com situação irregular",
      subtitle: `Situação: ${data.descricao_situacao_cadastral || "Desconhecida"} — recomenda-se não prosseguir com a contratação.`,
    },
  }[resultado];

  const end = [data.logradouro, data.numero, data.complemento, data.bairro]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      {/* Meta */}
      <div className="bg-[var(--violet-light)] rounded-sm px-3.5 py-[9px] flex items-center gap-2 text-[11px] font-semibold text-[var(--violet-dark)] mb-3.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] shrink-0">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Relatório gerado em <strong className="mx-0.5">{timestamp}</strong> · Fonte: Receita Federal (BrasilAPI) · Responsável: <strong className="ml-0.5">{userName ?? "—"}</strong>
      </div>

      {/* Status Banner */}
      <StatusBanner {...bannerProps} timestamp={timestamp} />

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Dados Cadastrais */}
        <InfoCard
          title="Dados Cadastrais"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
          rows={[
            { label: "Razão Social", value: data.razao_social || "—" },
            { label: "Nome Fantasia", value: data.nome_fantasia || "—" },
            { label: "CNPJ", value: formatCNPJ(data.cnpj) },
            { label: "Natureza Jurídica", value: data.descricao_natureza_juridica || "—" },
            { label: "Porte", value: data.descricao_porte || "—" },
            {
              label: "Capital Social",
              value: data.capital_social
                ? "R$ " + Number(data.capital_social).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                : "—",
            },
          ]}
        />

        {/* Situação */}
        <InfoCard
          title="Situação na Receita"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          rows={[
            {
              label: "Situação",
              value: (
                <Pill variant={ativa ? "green" : "red"}>
                  {data.descricao_situacao_cadastral || "—"}
                </Pill>
              ),
            },
            { label: "Desde", value: fmtDate(data.data_situacao_cadastral) },
            { label: "Motivo", value: data.descricao_motivo_situacao_cadastral || "—" },
            { label: "Início de Atividade", value: fmtDate(data.data_inicio_atividade) },
            { label: "Optante Simples", value: data.opcao_pelo_simples ? "Sim" : "Não" },
            { label: "Optante MEI", value: data.opcao_pelo_mei ? "Sim" : "Não" },
          ]}
        />

        {/* Endereço */}
        <InfoCard
          title="Endereço"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
          rows={[
            { label: "Logradouro", value: end || "—" },
            { label: "Cidade / UF", value: [data.municipio, data.uf].filter(Boolean).join(" · ") || "—" },
            { label: "CEP", value: data.cep || "—" },
            {
              label: "Telefone",
              value: data.ddd_telefone_1
                ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}`
                : "—",
            },
            { label: "E-mail", value: data.email || "—" },
          ]}
        />

        {/* CNAE */}
        <InfoCard
          title="Atividade Principal (CNAE)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          rows={[
            { label: "Código", value: data.cnae_fiscal?.toString() || "—" },
            { label: "Descrição", value: data.cnae_fiscal_descricao || "—" },
            {
              label: "Secundárias",
              value: data.cnaes_secundarios?.length
                ? `${data.cnaes_secundarios.length} atividades`
                : "—",
            },
          ]}
        />

        {/* QSA */}
        <div className="col-span-full bg-white border-[1.5px] border-[var(--gray-border)] rounded-card overflow-hidden">
          <div className="px-[18px] py-3 border-b border-[var(--gray-border)] flex items-center gap-2 bg-[var(--off-white)]">
            <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">
              Quadro de Sócios e Administradores (QSA)
            </span>
          </div>
          <QSATable qsa={data.qsa ?? []} representante={representante} />
        </div>

        {/* Representante */}
        {representante && (
          <div className="col-span-full bg-white border-[1.5px] border-[var(--gray-border)] rounded-card overflow-hidden">
            <div className="px-[18px] py-3 border-b border-[var(--gray-border)] flex items-center gap-2 bg-[var(--off-white)]">
              <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">
                Verificação do Representante Indicado
              </span>
            </div>
            <div className="px-[18px] py-3.5">
              <div className="flex justify-between items-start gap-3 py-[7px] border-b border-[var(--gray-light)] pt-0">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Representante informado</span>
                <span className="text-[12px] font-bold text-[var(--text-primary)]">{representante}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-[7px] pb-0">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Consta no QSA?</span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-[9px] py-[3px] rounded-full ${repFound ? "bg-[var(--green-bg)] text-[#0D7A4E]" : "bg-[var(--red-bg)] text-[#8B0030]"}`}>
                  {repFound ? (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"/></svg>Sim, confirmado</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Não localizado</>
                  )}
                </span>
              </div>
              {!repFound && (
                <div className="mt-2.5 bg-[var(--yellow-bg)] border-[1.5px] border-[#FAD89B] rounded-sm px-3.5 py-[11px] text-[12px] font-semibold text-[#7A4E00]">
                  <strong>Atenção:</strong> O representante indicado não consta no QSA. Solicite procuração ou documentação comprobatória dos poderes de representação antes de prosseguir com a contratação.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance futuro */}
        <div className="col-span-full bg-white border-[1.5px] border-[var(--gray-border)] rounded-card overflow-hidden">
          <div className="px-[18px] py-3 border-b border-[var(--gray-border)] flex items-center gap-2 bg-[var(--off-white)]">
            <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">
              Verificações de Compliance — Em implementação
            </span>
          </div>
          <div className="px-[18px] py-3.5">
            <div className="flex gap-2 flex-wrap">
              {["CEIS · Sancionados Federais", "CNEP · Improbidade", "Listas OFAC", "PEP · Expostos Politicamente", "Processos Judiciais", "Interpol"].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[var(--gray-light)] text-[var(--text-secondary)] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-2.5 leading-relaxed">
              Estas verificações serão integradas progressivamente ao relatório. O resultado final consolidará todas as fontes em um único parecer de compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
