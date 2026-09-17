"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Responsavel = { id: string; name: string };

type Demanda = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  solicitante: string;
  setor: string | null;
  responsavel: Responsavel | null;
  prazo: string | null;
  notas: string | null;
  criadoEm: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "bg-[#FFF3CD] text-[#856404]",
  EM_ANDAMENTO: "bg-[var(--violet-light)] text-[var(--violet)]",
  AGUARDANDO: "bg-[#E2E8F0] text-[#475569]",
  CONCLUIDO: "bg-[var(--green-bg)] text-[#0D7A4E]",
  CANCELADO: "bg-[var(--red-bg)] text-[#8B0030]",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const PRIORIDADE_DOT: Record<string, string> = {
  BAIXA: "bg-[#94A3B8]",
  NORMAL: "bg-[#3B82F6]",
  ALTA: "bg-[#F59E0B]",
  URGENTE: "bg-[#EF4444]",
};

const TIPO_LABEL: Record<string, string> = {
  CONTRATO: "Contrato",
  PROCESSO: "Processo",
  CONSULTA_JURIDICA: "Consulta Jurídica",
  DOCUMENTO: "Documento",
  OUTRO: "Outro",
};

function fmtData(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function prazoClass(prazo: string | null, status: string) {
  if (!prazo || status === "CONCLUIDO" || status === "CANCELADO") return "";
  const diff = new Date(prazo).getTime() - Date.now();
  if (diff < 0) return "text-[#EF4444] font-bold";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "text-[#F59E0B] font-bold";
  return "";
}

export default function DemandasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [detalhe, setDetalhe] = useState<Demanda | null>(null);
  const [usuarios, setUsuarios] = useState<Responsavel[]>([]);
  const [saving, setSaving] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaDemanda, setNovaDemanda] = useState({
    titulo: "", descricao: "", tipo: "CONSULTA_JURIDICA",
    prioridade: "NORMAL", solicitante: "", setor: "", responsavelId: "", prazo: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { carregar(); carregarUsuarios(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const carregar = useCallback(async () => {
    setLoading(true);
    const url = filtroStatus ? `/api/demandas?status=${filtroStatus}` : "/api/demandas";
    const res = await fetch(url);
    if (res.ok) setDemandas(await res.json());
    setLoading(false);
  }, [filtroStatus]);

  useEffect(() => { if (status === "authenticated") carregar(); }, [filtroStatus, status, carregar]);

  async function carregarUsuarios() {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios(await res.json());
  }

  async function salvarDetalhe(campo: Partial<Demanda> & { responsavelId?: string | null; status?: string; prioridade?: string; prazo?: string | null }) {
    if (!detalhe) return;
    setSaving(true);
    await fetch(`/api/demandas/${detalhe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campo),
    });
    setSaving(false);
    await carregar();
    setDetalhe(prev => prev ? { ...prev, ...campo } : null);
  }

  async function criarDemanda() {
    if (!novaDemanda.titulo || !novaDemanda.descricao || !novaDemanda.solicitante) return;
    setSaving(true);
    await fetch("/api/demandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novaDemanda,
        responsavelId: novaDemanda.responsavelId || null,
        prazo: novaDemanda.prazo || null,
        setor: novaDemanda.setor || null,
      }),
    });
    setSaving(false);
    setNovaOpen(false);
    setNovaDemanda({ titulo: "", descricao: "", tipo: "CONSULTA_JURIDICA", prioridade: "NORMAL", solicitante: "", setor: "", responsavelId: "", prazo: "" });
    carregar();
  }

  const grupos: Record<string, Demanda[]> = {
    PENDENTE: [], EM_ANDAMENTO: [], AGUARDANDO: [], CONCLUIDO: [], CANCELADO: [],
  };
  demandas.forEach(d => { if (grupos[d.status]) grupos[d.status].push(d); });
  const vistos = filtroStatus ? [filtroStatus] : ["PENDENTE", "EM_ANDAMENTO", "AGUARDANDO", "CONCLUIDO"];

  if (status === "loading") return null;

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] leading-tight">Demandas Jurídicas</h1>
          <p className="text-[12px] text-[var(--text-secondary)]">Controle de tarefas, prazos e responsáveis</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm text-[var(--text-secondary)] focus:outline-none"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button
            onClick={() => setNovaOpen(true)}
            className="h-[34px] px-4 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold flex items-center gap-1.5 hover:bg-[var(--violet-dark)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova demanda
          </button>
        </div>
      </div>

      <div className="p-8 flex-1">
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : (
          <div className="space-y-6">
            {vistos.map(s => (
              <div key={s}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{grupos[s].length} demanda{grupos[s].length !== 1 ? "s" : ""}</span>
                </div>
                {grupos[s].length === 0 ? (
                  <p className="text-[12px] text-[var(--text-secondary)] pl-1">Nenhuma</p>
                ) : (
                  <div className="grid gap-2">
                    {grupos[s].map(d => (
                      <button
                        key={d.id}
                        onClick={() => setDetalhe(d)}
                        className="w-full text-left bg-white border border-[var(--gray-border)] rounded-card px-4 py-3.5 hover:border-[var(--violet)] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORIDADE_DOT[d.prioridade]}`} />
                              <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">{d.titulo}</span>
                              <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--gray-light)] px-2 py-0.5 rounded-full shrink-0">{TIPO_LABEL[d.tipo]}</span>
                            </div>
                            <p className="text-[12px] text-[var(--text-secondary)] line-clamp-1 pl-3.5">{d.descricao}</p>
                          </div>
                          <div className="text-right shrink-0 space-y-0.5">
                            {d.responsavel && (
                              <p className="text-[11px] font-semibold text-[var(--text-primary)]">{d.responsavel.name.split(" ")[0]}</p>
                            )}
                            {d.prazo && (
                              <p className={`text-[11px] ${prazoClass(d.prazo, d.status)} text-[var(--text-secondary)]`}>
                                {fmtData(d.prazo)}
                              </p>
                            )}
                            <p className="text-[10px] text-[var(--gray-mid)]">{d.solicitante}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel de detalhe */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDetalhe(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative ml-auto w-full max-w-md bg-white border-l border-[var(--gray-border)] h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">{TIPO_LABEL[detalhe.tipo]}</p>
                <h2 className="text-[15px] font-extrabold text-[var(--text-primary)] mt-0.5">{detalhe.titulo}</h2>
              </div>
              <button onClick={() => setDetalhe(null)} className="text-[var(--gray-mid)] hover:text-[var(--text-primary)] mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Descrição</p>
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{detalhe.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Status</p>
                  <select
                    value={detalhe.status}
                    onChange={e => { setDetalhe(p => p ? { ...p, status: e.target.value } : null); salvarDetalhe({ status: e.target.value }); }}
                    className="w-full h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none"
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Prioridade</p>
                  <select
                    value={detalhe.prioridade}
                    onChange={e => { setDetalhe(p => p ? { ...p, prioridade: e.target.value } : null); salvarDetalhe({ prioridade: e.target.value }); }}
                    className="w-full h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none"
                  >
                    {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Responsável</p>
                <select
                  value={detalhe.responsavel?.id ?? ""}
                  onChange={e => { salvarDetalhe({ responsavelId: e.target.value || null }); }}
                  className="w-full h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none"
                >
                  <option value="">Sem responsável</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Prazo</p>
                <input
                  type="date"
                  defaultValue={detalhe.prazo ? detalhe.prazo.slice(0, 10) : ""}
                  onBlur={e => salvarDetalhe({ prazo: e.target.value || null })}
                  className="w-full h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Notas internas</p>
                <textarea
                  defaultValue={detalhe.notas ?? ""}
                  onBlur={e => salvarDetalhe({ notas: e.target.value })}
                  rows={4}
                  placeholder="Adicione observações, atualizações..."
                  className="w-full px-3 py-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[var(--gray-border)] text-[11px] text-[var(--text-secondary)] space-y-0.5">
                <p><span className="font-semibold">Solicitante:</span> {detalhe.solicitante}{detalhe.setor ? ` · ${detalhe.setor}` : ""}</p>
                <p><span className="font-semibold">Aberto em:</span> {fmtData(detalhe.criadoEm)}</p>
              </div>

              {saving && <p className="text-[11px] text-[var(--text-secondary)]">Salvando...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal nova demanda */}
      {novaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setNovaOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative bg-white rounded-card border border-[var(--gray-border)] shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-center justify-between">
              <h2 className="text-[14px] font-extrabold text-[var(--text-primary)]">Nova demanda</h2>
              <button onClick={() => setNovaOpen(false)} className="text-[var(--gray-mid)] hover:text-[var(--text-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Título *</label>
                <input value={novaDemanda.titulo} onChange={e => setNovaDemanda(p => ({ ...p, titulo: e.target.value }))}
                  className="w-full h-[34px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" placeholder="Resumo da demanda" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Descrição *</label>
                <textarea value={novaDemanda.descricao} onChange={e => setNovaDemanda(p => ({ ...p, descricao: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-none" placeholder="Descreva a demanda com detalhes" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Tipo *</label>
                  <select value={novaDemanda.tipo} onChange={e => setNovaDemanda(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Prioridade</label>
                  <select value={novaDemanda.prioridade} onChange={e => setNovaDemanda(p => ({ ...p, prioridade: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Solicitante *</label>
                  <input value={novaDemanda.solicitante} onChange={e => setNovaDemanda(p => ({ ...p, solicitante: e.target.value }))}
                    className="w-full h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" placeholder="Nome" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Setor</label>
                  <input value={novaDemanda.setor} onChange={e => setNovaDemanda(p => ({ ...p, setor: e.target.value }))}
                    className="w-full h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" placeholder="Opcional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Responsável</label>
                  <select value={novaDemanda.responsavelId} onChange={e => setNovaDemanda(p => ({ ...p, responsavelId: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    <option value="">Sem responsável</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1">Prazo</label>
                  <input type="date" value={novaDemanda.prazo} onChange={e => setNovaDemanda(p => ({ ...p, prazo: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--gray-border)] flex justify-end gap-2">
              <button onClick={() => setNovaOpen(false)} className="h-[34px] px-4 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--gray-light)] rounded-sm transition-colors">Cancelar</button>
              <button onClick={criarDemanda} disabled={saving || !novaDemanda.titulo || !novaDemanda.descricao || !novaDemanda.solicitante}
                className="h-[34px] px-5 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold hover:bg-[var(--violet-dark)] disabled:opacity-50 transition-colors">
                {saving ? "Criando..." : "Criar demanda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
