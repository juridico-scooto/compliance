import { ComplianceResult } from "@/lib/compliance";

function fmtDate(s: string): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("pt-BR"); } catch { return s; }
}

interface CheckRowProps {
  label: string;
  result: { verificado: boolean; encontrado: boolean; registros: unknown[]; erro?: string };
  detail?: string;
}

function CheckRow({ label, result, detail }: CheckRowProps) {
  if (!result.verificado) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-[var(--gray-light)] last:border-0">
        <div>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{label}</p>
          {detail && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{detail}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-[var(--yellow-bg)] text-[#7A4E00]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {result.erro ?? "Não verificado"}
        </span>
      </div>
    );
  }

  if (result.encontrado) {
    return (
      <div className="py-3 border-b border-[var(--gray-light)] last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[12px] font-bold text-[var(--text-primary)]">{label}</p>
            {detail && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{detail}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-[var(--red-bg)] text-[#8B0030]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {result.registros.length} ocorrência{result.registros.length > 1 ? "s" : ""}
          </span>
        </div>
        {/* Mini-table com os registros */}
        <div className="bg-[var(--red-bg)] border border-[#F5B8CC] rounded-sm overflow-hidden text-[11px]">
          {result.registros.slice(0, 5).map((r, i) => {
            const row = r as Record<string, string>;
            return (
              <div key={i} className="px-3 py-2 border-b border-[#F5B8CC] last:border-0">
                <p className="font-bold text-[#8B0030]">{row.nome ?? row.nomeInformadoOrgaoSancionador ?? "—"}</p>
                <p className="text-[#A0003A] mt-0.5">
                  {row.cargo ? `${row.cargo} · ${row.orgao}` : ""}
                  {row.tipoSancao ? `${row.tipoSancao} · ${row.orgaoSancionador}` : ""}
                  {row.situacao ? ` · ${row.situacao}` : ""}
                  {row.dataInicioSancao ? ` · Desde ${fmtDate(row.dataInicioSancao)}` : ""}
                  {row.dataInicio ? ` · ${fmtDate(row.dataInicio)}` : ""}
                </p>
              </div>
            );
          })}
          {result.registros.length > 5 && (
            <p className="px-3 py-2 text-[#A0003A] font-semibold">+ {result.registros.length - 5} registro(s) adicionais</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--gray-light)] last:border-0">
      <div>
        <p className="text-[12px] font-bold text-[var(--text-primary)]">{label}</p>
        {detail && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{detail}</p>}
      </div>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-[var(--green-bg)] text-[#0D7A4E]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
        Nada consta
      </span>
    </div>
  );
}

interface Props {
  compliance: ComplianceResult;
  representante?: string;
  cpfRepresentante?: string;
}

export default function ComplianceSection({ compliance, representante, cpfRepresentante }: Props) {
  const temRepresentante = !!representante;

  return (
    <div className="col-span-full bg-white border-[1.5px] border-[var(--gray-border)] rounded-card overflow-hidden">
      <div className="px-[18px] py-3 border-b border-[var(--gray-border)] flex items-center gap-2 bg-[var(--off-white)]">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">
          Verificações de Compliance
        </span>
        <span className="ml-auto text-[9px] font-bold bg-[var(--violet-light)] text-[var(--violet-dark)] px-2 py-0.5 rounded-full uppercase tracking-wide">
          Portal da Transparência · CGU
        </span>
      </div>
      <div className="px-[18px] py-1">

        <p className="text-[10px] font-bold text-[var(--gray-mid)] uppercase tracking-widest pt-3 pb-1">Empresa (CNPJ)</p>

        <CheckRow
          label="CEIS — Cadastro de Empresas Inidôneas e Suspensas"
          detail="Sanções aplicadas por órgãos federais"
          result={compliance.ceis}
        />
        <CheckRow
          label="CNEP — Cadastro Nacional de Empresas Punidas"
          detail="Punições por improbidade administrativa"
          result={compliance.cnep}
        />

        {temRepresentante && (
          <>
            <p className="text-[10px] font-bold text-[var(--gray-mid)] uppercase tracking-widest pt-4 pb-1">
              Representante — {representante}{cpfRepresentante ? ` · ${cpfRepresentante}` : ""}
            </p>
            <CheckRow
              label="PEP — Pessoa Politicamente Exposta"
              detail="Cargos públicos federais, militares e funções de alta administração"
              result={compliance.pep}
            />
            <CheckRow
              label="CEIS — Sanções pessoa física"
              detail="Representante em listas de sanção federal"
              result={compliance.ceisRep}
            />
          </>
        )}

        {!temRepresentante && (
          <p className="text-[11px] text-[var(--text-secondary)] py-3 font-medium">
            Informe o representante no formulário para habilitar a verificação PEP e CEIS da pessoa física.
          </p>
        )}

        <p className="text-[10px] text-[var(--gray-mid)] py-3 font-medium leading-relaxed border-t border-[var(--gray-light)] mt-2">
          Fontes: CGU/Portal da Transparência · CEIS · CNEP · PEP federal.
          Em breve: OFAC · Interpol · Processos judiciais.
        </p>
      </div>
    </div>
  );
}
