import { normalizar } from "@/lib/utils";

interface QSAEntry {
  nome_socio: string;
  qualificacao_socio: string;
  pais_origem: string | null;
}

interface QSATableProps {
  qsa: QSAEntry[];
  representante?: string;
}

export default function QSATable({ qsa, representante }: QSATableProps) {
  if (!qsa.length) {
    return (
      <p className="px-[18px] py-3.5 text-[12px] font-medium text-[var(--text-secondary)]">
        Nenhum sócio encontrado no QSA.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["Nome", "Qualificação", "Origem", "Verificação"].map((h) => (
            <th
              key={h}
              className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-secondary)] px-3.5 py-[7px] text-left bg-[var(--off-white)] border-b-[1.5px] border-[var(--gray-border)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {qsa.map((s, i) => {
          const isRep =
            representante &&
            normalizar(s.nome_socio).includes(normalizar(representante));
          return (
            <tr key={i} className="hover:bg-[var(--off-white)] transition-colors">
              <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[var(--text-primary)] border-b border-[var(--gray-light)]">
                <strong>{s.nome_socio || "—"}</strong>
              </td>
              <td className="px-3.5 py-2.5 text-[12px] font-semibold border-b border-[var(--gray-light)]">
                {s.qualificacao_socio || "—"}
              </td>
              <td className="px-3.5 py-2.5 text-[12px] font-semibold border-b border-[var(--gray-light)]">
                {s.pais_origem || "Brasil"}
              </td>
              <td className="px-3.5 py-2.5 border-b border-[var(--gray-light)]">
                {isRep && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-[var(--green-bg)] text-[#0D7A4E]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Representante indicado
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
