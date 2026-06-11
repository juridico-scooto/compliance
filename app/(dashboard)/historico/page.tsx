import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/topbar";
import { prisma } from "@/lib/prisma";
import { formatCNPJ, fmtDate } from "@/lib/utils";
import Link from "next/link";

const resultadoLabel: Record<string, { label: string; className: string }> = {
  OK: { label: "Aprovado", className: "bg-[var(--green-bg)] text-[#0D7A4E]" },
  ATENCAO: { label: "Atenção", className: "bg-[var(--yellow-bg)] text-[#7A4E00]" },
  IRREGULAR: { label: "Irregular", className: "bg-[var(--red-bg)] text-[#8B0030]" },
};

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: { resultado?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/acesso-negado");

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 20;
  const resultadoFilter = searchParams.resultado as "OK" | "ATENCAO" | "IRREGULAR" | undefined;

  const where = resultadoFilter ? { resultado: resultadoFilter } : {};

  const [consultas, total] = await Promise.all([
    prisma.consulta.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { usuario: { select: { name: true } } },
    }),
    prisma.consulta.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Topbar
        title="Histórico de Relatórios"
        subtitle="Consultas anteriores realizadas pelo departamento"
      />
      <div className="p-8 flex-1">
        {/* Filtros */}
        <div className="bg-white rounded-card border border-[var(--gray-border)] px-7 py-5 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em] mr-1">Filtrar:</span>
            {[
              { v: "", label: "Todos" },
              { v: "OK", label: "Aprovados" },
              { v: "ATENCAO", label: "Atenção" },
              { v: "IRREGULAR", label: "Irregulares" },
            ].map(({ v, label }) => (
              <Link
                key={v}
                href={v ? `/historico?resultado=${v}` : "/historico"}
                className={`px-3.5 py-[5px] rounded-full text-[11px] font-bold transition-all ${
                  (resultadoFilter ?? "") === v
                    ? "bg-[var(--violet)] text-white"
                    : "bg-[var(--gray-light)] text-[var(--text-secondary)] hover:bg-[var(--violet-light)] hover:text-[var(--violet)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-card border border-[var(--gray-border)] overflow-hidden">
          {consultas.length === 0 ? (
            <div className="px-7 py-12 text-center">
              <p className="text-[13px] text-[var(--text-secondary)] font-medium">Nenhuma consulta encontrada.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["CNPJ", "Representante", "Resultado", "Realizado por", "Data"].map((h) => (
                    <th
                      key={h}
                      className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-secondary)] px-5 py-[10px] text-left bg-[var(--off-white)] border-b-[1.5px] border-[var(--gray-border)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => {
                  const r = resultadoLabel[c.resultado];
                  const data = c.dadosJson as { razao_social?: string };
                  return (
                    <tr key={c.id} className="hover:bg-[var(--off-white)] transition-colors">
                      <td className="px-5 py-3 text-[12px] font-semibold border-b border-[var(--gray-light)]">
                        <span className="font-bold text-[var(--text-primary)]">{formatCNPJ(c.cnpj)}</span>
                        {data.razao_social && (
                          <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
                            {data.razao_social}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[12px] font-semibold text-[var(--text-primary)] border-b border-[var(--gray-light)]">
                        {c.representante || <span className="text-[var(--gray-mid)]">—</span>}
                      </td>
                      <td className="px-5 py-3 border-b border-[var(--gray-light)]">
                        <span className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] font-bold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${r.className}`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] font-semibold text-[var(--text-primary)] border-b border-[var(--gray-light)]">
                        {c.usuario.name}
                      </td>
                      <td className="px-5 py-3 text-[12px] font-semibold text-[var(--text-secondary)] border-b border-[var(--gray-light)]">
                        {new Date(c.criadoEm).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-[12px] text-[var(--text-secondary)] font-medium">
              {total} consultas · Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/historico?page=${page - 1}${resultadoFilter ? `&resultado=${resultadoFilter}` : ""}`}
                  className="px-3.5 py-[7px] rounded-sm text-[12px] font-bold border-[1.5px] border-[var(--gray-border)] text-[var(--text-secondary)] hover:bg-[var(--gray-light)] transition-all"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/historico?page=${page + 1}${resultadoFilter ? `&resultado=${resultadoFilter}` : ""}`}
                  className="px-3.5 py-[7px] rounded-sm text-[12px] font-bold bg-[var(--violet)] text-white hover:bg-[var(--violet-dark)] transition-all"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
