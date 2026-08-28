"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && !isAdmin) { router.push("/due-diligence"); return; }
    if (isAdmin) fetchStatus();
  }, [status, isAdmin]);

  async function fetchStatus() {
    const res = await fetch("/api/admin/importar-pgfn");
    if (res.ok) {
      const d = await res.json();
      setRegistros(d.registros);
    }
  }

  async function dispararImportacao() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/importar-pgfn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ tipo: "ok", texto: d.mensagem });
        setTimeout(fetchStatus, 3000);
      } else {
        setMsg({ tipo: "erro", texto: d.error });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Falha na requisição." });
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !isAdmin) return null;

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] px-8 py-4 flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] leading-tight">Administração</h1>
          <p className="text-[12px] text-[var(--text-secondary)]">Gerenciamento de bases de dados do sistema</p>
        </div>
      </div>

      <div className="p-8 flex-1">
      <div className="max-w-2xl">

      {/* Card PGFN */}
      <div className="bg-white rounded-card border border-[var(--gray-border)] overflow-hidden">
        <div className="px-[18px] py-3 border-b border-[var(--gray-border)] bg-[var(--off-white)] flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">
            PGFN — Dívida Ativa da União
          </span>
        </div>

        <div className="px-[18px] py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">Base de Devedores</p>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                Dados abertos da PGFN — atualizado trimestralmente.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[var(--text-secondary)]">Registros no banco</p>
              <p className="text-[18px] font-extrabold text-[var(--text-primary)]">
                {registros === null ? "—" : registros.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="bg-[var(--gray-light)] rounded-sm px-4 py-3 text-[11px] text-[var(--text-secondary)] mb-4 leading-relaxed">
            <strong className="text-[var(--text-primary)]">Como funciona:</strong> O botão abaixo dispara um processo no GitHub Actions
            que baixa os arquivos oficiais da PGFN (~1.2GB), extrai e importa para o banco.
            Demora ~20-40 minutos. Roda automaticamente todo trimestre (jan, abr, jul, out).
          </div>

          {msg && (
            <div className={`rounded-sm px-3.5 py-[11px] text-[12px] font-semibold mb-4 ${
              msg.tipo === "ok"
                ? "bg-[var(--green-bg)] text-[#0D7A4E] border border-[#B3E8D1]"
                : "bg-[var(--red-bg)] text-[#8B0030] border border-[#F5B8CC]"
            }`}>
              {msg.texto}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <button
              onClick={dispararImportacao}
              disabled={loading}
              className="h-[38px] px-5 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold flex items-center gap-2 hover:bg-[var(--violet-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <><div className="spinner !w-3.5 !h-3.5" /> Disparando...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Importar agora
                </>
              )}
            </button>
            <a
              href={`https://github.com/juridico-scooto/compliance/actions/workflows/import-pgfn.yml`}
              target="_blank" rel="noopener noreferrer"
              className="h-[38px] px-4 border border-[var(--gray-border)] rounded-sm text-[12px] font-bold text-[var(--text-secondary)] flex items-center gap-2 hover:bg-[var(--gray-light)] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Ver progresso no GitHub
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
