"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Demanda = {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  solicitante: string;
  criadoEm: string;
};

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  texto: string | null;
  demandaId: string | null;
  lida: boolean;
  criadoEm: string;
};

const PRIORIDADE_DOT: Record<string, string> = {
  BAIXA: "bg-[#94A3B8]", NORMAL: "bg-[#3B82F6]", ALTA: "bg-[#F59E0B]", URGENTE: "bg-[#EF4444]",
};
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", AGUARDANDO: "Aguardando",
  CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};

function fmtData(s: string | null) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function fmtTempo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function prazoClass(prazo: string | null) {
  if (!prazo) return "text-[var(--text-secondary)]";
  const diff = new Date(prazo).getTime() - Date.now();
  if (diff < 0) return "text-[#EF4444] font-bold";
  if (diff < 7 * 86400000) return "text-[#F59E0B] font-bold";
  return "text-[var(--text-secondary)]";
}

function tipoIcon(tipo: string) {
  if (tipo === "NOVA_DEMANDA") return "📋";
  if (tipo === "MENCAO") return "💬";
  return "👤";
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [minhasDemandas, setMinhasDemandas] = useState<Demanda[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (userId: string) => {
    setLoading(true);
    const [rDemandas, rNotifs] = await Promise.all([
      fetch(`/api/demandas?responsavel=${userId}`),
      fetch("/api/notificacoes"),
    ]);
    if (rDemandas.ok) setMinhasDemandas(await rDemandas.json());
    if (rNotifs.ok) setNotificacoes(await rNotifs.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && session?.user?.id) carregar(session.user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function marcarLida(id: string) {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  async function lerTodas() {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lerTodas: true }),
    });
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }

  function clicarNotif(n: Notificacao) {
    marcarLida(n.id);
    if (n.demandaId) router.push(`/demandas?demanda=${n.demandaId}`);
  }

  if (status === "loading") return null;

  const ativas = minhasDemandas.filter(d => d.status !== "CONCLUIDO" && d.status !== "CANCELADO");
  const urgentes = ativas.filter(d => d.prioridade === "URGENTE" || d.prioridade === "ALTA");
  const vencidas = ativas.filter(d => d.prazo && new Date(d.prazo).getTime() < Date.now());
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <>
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] px-8 py-4">
        <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] leading-tight">
          Olá, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-[12px] text-[var(--text-secondary)]">Seu painel pessoal</p>
      </div>

      <div className="p-8 space-y-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Minhas ativas", value: ativas.length, color: "var(--violet)" },
            { label: "Alta prioridade", value: urgentes.length, color: "#F59E0B" },
            { label: "Vencidas", value: vencidas.length, color: "#EF4444" },
            { label: "Não lidas", value: naoLidas, color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[var(--gray-border)] rounded-card p-4">
              <p className="text-[28px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Minhas demandas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-extrabold text-[var(--text-primary)]">Minhas demandas</h2>
              <button onClick={() => router.push("/demandas")} className="text-[11px] text-[var(--violet)] font-semibold hover:underline">
                Ver todas →
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : minhasDemandas.length === 0 ? (
              <div className="border-2 border-dashed border-[var(--gray-border)] rounded-card p-8 text-center">
                <p className="text-[12px] text-[var(--text-secondary)]">Nenhuma demanda atribuída a você</p>
              </div>
            ) : (
              <div className="space-y-2">
                {minhasDemandas.slice(0, 8).map(d => (
                  <button key={d.id} onClick={() => router.push(`/demandas?demanda=${d.id}`)}
                    className="w-full text-left bg-white border border-[var(--gray-border)] rounded-card px-4 py-3 hover:border-[var(--violet)] hover:shadow-sm transition-all">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORIDADE_DOT[d.prioridade]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{d.titulo}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] bg-[var(--gray-light)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full">
                            {STATUS_LABEL[d.status] ?? d.status}
                          </span>
                          {d.prazo && (
                            <span className={`text-[10px] ${prazoClass(d.prazo)}`}>{fmtData(d.prazo)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {minhasDemandas.length > 8 && (
                  <p className="text-[11px] text-[var(--text-secondary)] text-center pt-1">
                    + {minhasDemandas.length - 8} demanda{minhasDemandas.length - 8 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notificações */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-extrabold text-[var(--text-primary)]">
                Notificações {naoLidas > 0 && <span className="text-[var(--violet)]">({naoLidas})</span>}
              </h2>
              {naoLidas > 0 && (
                <button onClick={lerTodas} className="text-[11px] text-[var(--violet)] font-semibold hover:underline">
                  Ler todas
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : notificacoes.length === 0 ? (
              <div className="border-2 border-dashed border-[var(--gray-border)] rounded-card p-8 text-center">
                <p className="text-[12px] text-[var(--text-secondary)]">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacoes.slice(0, 10).map(n => (
                  <button key={n.id} onClick={() => clicarNotif(n)}
                    className={`w-full text-left border rounded-card px-4 py-3 hover:border-[var(--violet)] hover:shadow-sm transition-all flex gap-3 items-start ${!n.lida ? "bg-[#F5F3FF] border-[#DDD6FE]" : "bg-white border-[var(--gray-border)]"}`}>
                    <span className="text-sm shrink-0 mt-0.5">{tipoIcon(n.tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">{n.titulo}</p>
                      {n.texto && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.texto}</p>}
                      <p className="text-[10px] text-[var(--gray-mid)] mt-1">{fmtTempo(n.criadoEm)}</p>
                    </div>
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-[var(--violet)] shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
