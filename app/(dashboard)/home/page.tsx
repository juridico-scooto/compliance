"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type TarefaDiaria = {
  id: string;
  nome: string;
  descricao: string | null;
  concluidaHoje: boolean;
  concluidaPor: { id: string; name: string } | null;
  concluidaEm: string | null;
};

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
  const [tarefasDiarias, setTarefasDiarias] = useState<TarefaDiaria[]>([]);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [novaRotinaOpen, setNovaRotinaOpen] = useState(false);
  const [novaRotinaNome, setNovaRotinaNome] = useState("");
  const [novaRotinaDesc, setNovaRotinaDesc] = useState("");
  const [salvandoRotina, setSalvandoRotina] = useState(false);

  const carregarTarefas = useCallback(async () => {
    const r = await fetch("/api/tarefas-diarias");
    if (r.ok) setTarefasDiarias(await r.json());
  }, []);

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
    if (status === "authenticated" && session?.user?.id) {
      carregar(session.user.id);
      carregarTarefas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function concluirTarefa(tarefaId: string) {
    setMarcando(tarefaId);
    const r = await fetch("/api/tarefas-diarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarefaId }),
    });
    if (r.ok) {
      const data = await r.json();
      setTarefasDiarias(prev => prev.map(t =>
        t.id === tarefaId
          ? { ...t, concluidaHoje: true, concluidaPor: data.concluidaPor, concluidaEm: data.concluidaEm }
          : t
      ));
    }
    setMarcando(null);
  }

  async function desfazerTarefa(tarefaId: string) {
    setMarcando(tarefaId);
    await fetch("/api/tarefas-diarias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarefaId }),
    });
    setTarefasDiarias(prev => prev.map(t =>
      t.id === tarefaId ? { ...t, concluidaHoje: false, concluidaPor: null, concluidaEm: null } : t
    ));
    setMarcando(null);
  }

  async function criarRotina() {
    if (!novaRotinaNome.trim()) return;
    setSalvandoRotina(true);
    const r = await fetch("/api/tarefas-diarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "criar", nome: novaRotinaNome.trim(), descricao: novaRotinaDesc.trim() || null }),
    });
    if (r.ok) {
      await carregarTarefas();
      setNovaRotinaNome("");
      setNovaRotinaDesc("");
      setNovaRotinaOpen(false);
    }
    setSalvandoRotina(false);
  }

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

        {/* Rotinas diárias */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[13px] font-extrabold text-[var(--text-primary)]">Rotinas do dia</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            {session?.user?.role === "ADMIN" && (
              <button onClick={() => setNovaRotinaOpen(true)}
                className="text-[11px] text-[var(--violet)] font-semibold hover:underline flex items-center gap-1">
                + Nova rotina
              </button>
            )}
          </div>

          {tarefasDiarias.length === 0 ? (
            <div className="border-2 border-dashed border-[var(--gray-border)] rounded-card p-6 text-center">
              <p className="text-[12px] text-[var(--text-secondary)]">Nenhuma rotina cadastrada</p>
              {session?.user?.role === "ADMIN" && (
                <button onClick={() => setNovaRotinaOpen(true)} className="text-[11px] text-[var(--violet)] mt-1 hover:underline">
                  Adicionar primeira rotina
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tarefasDiarias.map(t => (
                <div key={t.id}
                  className={`border rounded-card px-4 py-3 flex items-start gap-3 transition-all ${t.concluidaHoje ? "bg-[#F0FDF4] border-[#86EFAC]" : "bg-white border-[var(--gray-border)]"}`}>
                  <button
                    onClick={() => t.concluidaHoje ? desfazerTarefa(t.id) : concluirTarefa(t.id)}
                    disabled={marcando === t.id}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${t.concluidaHoje ? "bg-[#22C55E] border-[#22C55E]" : "border-[var(--gray-mid)] hover:border-[#22C55E]"}`}>
                    {t.concluidaHoje && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold leading-tight ${t.concluidaHoje ? "text-[#15803D] line-through decoration-[#86EFAC]" : "text-[var(--text-primary)]"}`}>
                      {t.nome}
                    </p>
                    {t.concluidaHoje && t.concluidaPor ? (
                      <p className="text-[10px] text-[#16A34A] mt-0.5">
                        Feito por {t.concluidaPor.name.split(" ")[0]} às {new Date(t.concluidaEm!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    ) : t.descricao ? (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{t.descricao}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal nova rotina */}
        {novaRotinaOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setNovaRotinaOpen(false)}>
            <div className="bg-white rounded-card p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-[14px] font-extrabold text-[var(--text-primary)] mb-4">Nova rotina diária</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Nome *</label>
                  <input value={novaRotinaNome} onChange={e => setNovaRotinaNome(e.target.value)}
                    placeholder="Ex: Verificar documentos das escuteiras"
                    className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Descrição</label>
                  <textarea value={novaRotinaDesc} onChange={e => setNovaRotinaDesc(e.target.value)}
                    placeholder="Detalhes opcionais..."
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setNovaRotinaOpen(false)}
                  className="h-[34px] px-4 text-[12px] border border-[var(--gray-border)] rounded-sm text-[var(--text-secondary)] hover:bg-[var(--gray-light)]">
                  Cancelar
                </button>
                <button onClick={criarRotina} disabled={salvandoRotina || !novaRotinaNome.trim()}
                  className="h-[34px] px-4 text-[12px] bg-[var(--violet)] text-white rounded-sm font-bold hover:bg-[var(--violet-dark)] disabled:opacity-50">
                  {salvandoRotina ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}

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
