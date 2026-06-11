"use client";

import { useState } from "react";
import ResultReport from "./result-report";
import { BrasilApiCNPJ } from "@/lib/brasilapi";
import { useSession } from "next-auth/react";

function maskCNPJ(v: string): string {
  let d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length > 12) d = d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
  else if (d.length > 8) d = d.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
  else if (d.length > 5) d = d.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
  else if (d.length > 2) d = d.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
  return d;
}

interface ResultState {
  data: BrasilApiCNPJ;
  resultado: "OK" | "ATENCAO" | "IRREGULAR";
  representante?: string;
  repFound: boolean | null;
  timestamp: string;
}

export default function CNPJSearchForm() {
  const { data: session } = useSession();
  const [cnpj, setCnpj] = useState("");
  const [rep, setRep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);

  async function buscar() {
    setError("");
    if (cnpj.replace(/\D/g, "").length !== 14) {
      setError("Informe um CNPJ válido com 14 dígitos.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cnpj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj, representante: rep || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro inesperado.");
      setResult({
        data: json.data,
        resultado: json.resultado,
        representante: rep || undefined,
        repFound: json.repFound,
        timestamp: new Date().toLocaleString("pt-BR"),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  }

  function nova() {
    setCnpj("");
    setRep("");
    setResult(null);
    setError("");
  }

  return (
    <div>
      {/* Search Card */}
      <div className="bg-white rounded-card border border-[var(--gray-border)] px-7 py-[26px] mb-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--violet), var(--magenta), var(--orange))" }} />
        <h2 className="text-[15px] font-extrabold text-[var(--text-primary)] mb-1">Nova Consulta</h2>
        <p className="text-[12px] text-[var(--text-secondary)] mb-5">
          Informe o CNPJ do cliente e o nome do representante indicado para assinatura do contrato.
        </p>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="h-[42px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">Representante indicado</label>
            <input
              type="text"
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              placeholder="Nome completo do signatário"
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="h-[42px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
            />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="h-[42px] px-[22px] bg-[var(--violet)] text-white rounded-sm text-[13px] font-bold flex items-center gap-[7px] transition-colors hover:bg-[var(--violet-dark)] disabled:bg-[var(--gray-mid)] disabled:cursor-not-allowed whitespace-nowrap"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Consultar
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2.5 pt-[18px] text-[12px] font-semibold text-[var(--text-secondary)]">
            <div className="spinner" />
            Consultando Receita Federal...
          </div>
        )}

        {error && (
          <div className="bg-[var(--red-bg)] border-[1.5px] border-[#F5B8CC] rounded-sm px-3.5 py-[11px] text-[12px] font-semibold text-[#9B0A35] mt-3">
            {error}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="bg-white border-[1.5px] border-dashed border-[var(--gray-border)] rounded-card px-6 py-12 text-center">
          <div className="w-[52px] h-[52px] bg-[var(--violet-light)] rounded-[14px] inline-flex items-center justify-center mb-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] text-[var(--violet)]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <strong className="block text-[14px] font-extrabold text-[var(--text-primary)] mb-1.5">Nenhuma consulta realizada</strong>
          <p className="text-[12px] text-[var(--text-secondary)]">Informe o CNPJ do novo cliente acima para iniciar a verificação cadastral.</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[15px] font-extrabold text-[var(--text-primary)]">Resultado da Verificação</h2>
            <div className="flex gap-2.5">
              <button
                onClick={nova}
                className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-sm text-[12px] font-bold text-[var(--text-secondary)] border-[1.5px] border-[var(--gray-border)] bg-transparent hover:bg-[var(--gray-light)] hover:text-[var(--text-primary)] transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova consulta
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-sm text-[12px] font-bold bg-[var(--violet)] text-white hover:bg-[var(--violet-dark)] transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar PDF
              </button>
            </div>
          </div>
          <ResultReport
            data={result.data}
            resultado={result.resultado}
            representante={result.representante}
            repFound={result.repFound}
            timestamp={result.timestamp}
            userName={session?.user?.name ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
