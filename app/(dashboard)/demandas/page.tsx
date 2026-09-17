"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Responsavel = { id: string; name: string };
type StatusConfig = { id: string; nome: string; cor: string; corTexto: string; ordem: number };

type Demanda = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  solicitante: string;
  emailSolicitante: string | null;
  setor: string | null;
  operacao: string | null;
  cliente: string | null;
  anexos: string[];
  responsavel: Responsavel | null;
  prazo: string | null;
  prazoSolicitado: string | null;
  notas: string | null;
  criadoEm: string;
};

const PRIORIDADE_LABEL: Record<string, string> = { BAIXA: "Baixa", NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };
const PRIORIDADE_DOT: Record<string, string> = { BAIXA: "bg-[#94A3B8]", NORMAL: "bg-[#3B82F6]", ALTA: "bg-[#F59E0B]", URGENTE: "bg-[#EF4444]" };
const TIPO_LABEL: Record<string, string> = { CONTRATO: "Contrato", PROCESSO: "Processo", CONSULTA_JURIDICA: "Consulta Jurídica", DOCUMENTO: "Documento", OUTRO: "Outro" };

function fmtData(s: string | null) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function prazoClass(prazo: string | null) {
  if (!prazo) return "";
  const diff = new Date(prazo).getTime() - Date.now();
  if (diff < 0) return "text-[#EF4444] font-bold";
  if (diff < 7 * 86400000) return "text-[#F59E0B] font-bold";
  return "text-[var(--text-secondary)]";
}

function nomeArquivo(url: string) {
  return decodeURIComponent(url.split("/").pop() ?? url).replace(/^\d+-[a-z0-9]+\./, "");
}

export default function DemandasPage() {
  const { status } = useSession();
  const router = useRouter();

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [usuarios, setUsuarios] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroSolicitante, setFiltroSolicitante] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [ordenacao, setOrdenacao] = useState<"criadoEm" | "prazo">("criadoEm");

  const [detalhe, setDetalhe] = useState<Demanda | null>(null);
  const [saving, setSaving] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaDemanda, setNovaDemanda] = useState({ titulo: "", descricao: "", tipo: "CONSULTA_JURIDICA", prioridade: "NORMAL", solicitante: "", setor: "", responsavelId: "", prazo: "" });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { carregar(); carregarStatuses(); carregarUsuarios(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/demandas");
    if (res.ok) setDemandas(await res.json());
    setLoading(false);
  }, []);

  async function carregarStatuses() {
    const res = await fetch("/api/status-config");
    if (res.ok) setStatuses(await res.json());
  }

  async function carregarUsuarios() {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios(await res.json());
  }

  async function salvar(campo: Record<string, unknown>) {
    if (!detalhe) return;
    setSaving(true);
    const res = await fetch(`/api/demandas/${detalhe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campo),
    });
    if (res.ok) {
      const updated = await res.json();
      setDetalhe(updated);
      setDemandas(prev => prev.map(d => d.id === updated.id ? updated : d));
    }
    setSaving(false);
  }

  async function criarDemanda() {
    if (!novaDemanda.titulo || !novaDemanda.descricao || !novaDemanda.solicitante) return;
    setSaving(true);
    await fetch("/api/demandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novaDemanda, responsavelId: novaDemanda.responsavelId || null, prazo: novaDemanda.prazo || null }),
    });
    setSaving(false);
    setNovaOpen(false);
    setNovaDemanda({ titulo: "", descricao: "", tipo: "CONSULTA_JURIDICA", prioridade: "NORMAL", solicitante: "", setor: "", responsavelId: "", prazo: "" });
    carregar();
  }

  // Filtra e ordena
  const filtradas = demandas
    .filter(d => !filtroStatus || d.status === filtroStatus)
    .filter(d => !filtroResponsavel || d.responsavel?.id === filtroResponsavel)
    .filter(d => !filtroSolicitante || d.solicitante.toLowerCase().includes(filtroSolicitante.toLowerCase()))
    .filter(d => !filtroPrioridade || d.prioridade === filtroPrioridade)
    .sort((a, b) => {
      if (ordenacao === "prazo") {
        const da = a.prazo ? new Date(a.prazo).getTime() : Infinity;
        const db = b.prazo ? new Date(b.prazo).getTime() : Infinity;
        return da - db;
      }
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });

  const statusCols = statuses.length > 0 ? statuses : [
    { id: "PENDENTE", nome: "Pendente", cor: "#FFF3CD", corTexto: "#856404", ordem: 1 },
    { id: "EM_ANDAMENTO", nome: "Em andamento", cor: "#EDE9FE", corTexto: "#6D28D9", ordem: 2 },
    { id: "AGUARDANDO", nome: "Aguardando", cor: "#E2E8F0", corTexto: "#475569", ordem: 3 },
    { id: "CONCLUIDO", nome: "Concluído", cor: "#D1FAE5", corTexto: "#0D7A4E", ordem: 4 },
  ];

  if (status === "loading") return null;

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] px-8 py-4 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] leading-tight">Demandas Jurídicas</h1>
          <p className="text-[12px] text-[var(--text-secondary)]">Controle de tarefas, prazos e responsáveis</p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={filtroSolicitante}
            onChange={e => setFiltroSolicitante(e.target.value)}
            placeholder="Buscar solicitante..."
            className="h-[32px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] w-40"
          />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
            <option value="">Todos os status</option>
            {statusCols.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)}
            className="h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
            <option value="">Todos responsáveis</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)}
            className="h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
            <option value="">Todas prioridades</option>
            {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={ordenacao} onChange={e => setOrdenacao(e.target.value as "criadoEm" | "prazo")}
            className="h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
            <option value="criadoEm">Mais recentes</option>
            <option value="prazo">Prazo mais próximo</option>
          </select>
          <button onClick={() => setNovaOpen(true)}
            className="h-[32px] px-4 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold flex items-center gap-1.5 hover:bg-[var(--violet-dark)] transition-colors shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full" style={{ minWidth: `${statusCols.length * 300}px` }}>
            {statusCols.map(col => {
              const cards = filtradas.filter(d => d.status === col.id);
              return (
                <div key={col.id} className="flex flex-col w-[280px] shrink-0">
                  {/* Cabeçalho da coluna */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: col.cor, color: col.corTexto }}>
                      {col.nome}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">{cards.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
                    {cards.length === 0 ? (
                      <div className="border-2 border-dashed border-[var(--gray-border)] rounded-card h-16 flex items-center justify-center">
                        <p className="text-[11px] text-[var(--gray-mid)]">Nenhuma demanda</p>
                      </div>
                    ) : cards.map(d => (
                      <button key={d.id} onClick={() => setDetalhe(d)}
                        className="w-full text-left bg-white border border-[var(--gray-border)] rounded-card p-3.5 hover:border-[var(--violet)] hover:shadow-sm transition-all">
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${PRIORIDADE_DOT[d.prioridade]}`} />
                          <p className="text-[13px] font-bold text-[var(--text-primary)] leading-snug">{d.titulo}</p>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mb-2.5 pl-4">{d.descricao}</p>
                        <div className="pl-4 flex items-center justify-between gap-2">
                          <span className="text-[10px] bg-[var(--gray-light)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">{TIPO_LABEL[d.tipo] ?? d.tipo}</span>
                          <div className="text-right">
                            {d.responsavel && <p className="text-[11px] font-semibold text-[var(--text-primary)]">{d.responsavel.name.split(" ")[0]}</p>}
                            {d.prazo && <p className={`text-[10px] ${prazoClass(d.prazo)}`}>{fmtData(d.prazo)}</p>}
                          </div>
                        </div>
                        {d.anexos?.length > 0 && (
                          <div className="pl-4 mt-2 flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-[var(--gray-mid)]"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            <span className="text-[10px] text-[var(--gray-mid)]">{d.anexos.length} anexo{d.anexos.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal detalhe — centralizado */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetalhe(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-card border border-[var(--gray-border)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">{TIPO_LABEL[detalhe.tipo] ?? detalhe.tipo}</p>
                <h2 className="text-[16px] font-extrabold text-[var(--text-primary)] mt-0.5">{detalhe.titulo}</h2>
              </div>
              <button onClick={() => setDetalhe(null)} className="text-[var(--gray-mid)] hover:text-[var(--text-primary)] mt-0.5 shrink-0 ml-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Descrição */}
              <div>
                <p className="label-xs mb-1.5">Descrição</p>
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{detalhe.descricao}</p>
              </div>

              {/* Status + Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-xs mb-1.5">Status</p>
                  <select value={detalhe.status}
                    onChange={e => salvar({ status: e.target.value })}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {statusCols.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <p className="label-xs mb-1.5">Prioridade</p>
                  <select value={detalhe.prioridade}
                    onChange={e => salvar({ prioridade: e.target.value })}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Responsável */}
              <div>
                <p className="label-xs mb-1.5">Responsável</p>
                <select value={detalhe.responsavel?.id ?? ""}
                  onChange={e => salvar({ responsavelId: e.target.value || null })}
                  className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                  <option value="">Sem responsável</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {/* Prazos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-xs mb-1.5">Prazo interno <span className="text-[9px] font-normal normal-case text-[var(--gray-mid)]">(definido pela equipe)</span></p>
                  <input type="date"
                    defaultValue={detalhe.prazo ? detalhe.prazo.slice(0, 10) : ""}
                    onBlur={e => salvar({ prazo: e.target.value || null })}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none" />
                </div>
                <div>
                  <p className="label-xs mb-1.5">Prazo solicitado <span className="text-[9px] font-normal normal-case text-[var(--gray-mid)]">(referência do solicitante)</span></p>
                  <div className="h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm bg-[var(--gray-light)] flex items-center text-[var(--text-secondary)]">
                    {fmtData(detalhe.prazoSolicitado) ?? "—"}
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <p className="label-xs mb-1.5">Notas internas</p>
                <textarea
                  defaultValue={detalhe.notas ?? ""}
                  onBlur={e => salvar({ notas: e.target.value })}
                  rows={3}
                  placeholder="Observações, atualizações, decisões..."
                  className="w-full px-3 py-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none resize-none"
                />
              </div>

              {/* Anexos */}
              {detalhe.anexos?.length > 0 && (
                <div>
                  <p className="label-xs mb-2">Anexos ({detalhe.anexos.length})</p>
                  <div className="space-y-1.5">
                    {detalhe.anexos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 bg-[var(--gray-light)] rounded-sm hover:bg-[var(--violet-light)] hover:text-[var(--violet)] transition-colors group">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[var(--gray-mid)] group-hover:text-[var(--violet)] shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="text-[12px] text-[var(--text-primary)] truncate group-hover:text-[var(--violet)]">{nomeArquivo(url)}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-[var(--gray-mid)] ml-auto shrink-0 group-hover:text-[var(--violet)]">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Info solicitante */}
              <div className="pt-3 border-t border-[var(--gray-border)] grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                <p><span className="font-semibold text-[var(--text-primary)]">Solicitante:</span> {detalhe.solicitante}</p>
                {detalhe.emailSolicitante && <p><span className="font-semibold text-[var(--text-primary)]">E-mail:</span> {detalhe.emailSolicitante}</p>}
                {detalhe.setor && <p><span className="font-semibold text-[var(--text-primary)]">Setor:</span> {detalhe.setor}</p>}
                {detalhe.operacao && <p><span className="font-semibold text-[var(--text-primary)]">Operação:</span> {detalhe.operacao}</p>}
                {detalhe.cliente && <p><span className="font-semibold text-[var(--text-primary)]">Cliente:</span> {detalhe.cliente}</p>}
                <p><span className="font-semibold text-[var(--text-primary)]">Aberto em:</span> {fmtData(detalhe.criadoEm)}</p>
              </div>

              {saving && <p className="text-[11px] text-[var(--text-secondary)]">Salvando...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal nova demanda */}
      {novaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNovaOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-card border border-[var(--gray-border)] shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-center justify-between">
              <h2 className="text-[14px] font-extrabold text-[var(--text-primary)]">Nova demanda</h2>
              <button onClick={() => setNovaOpen(false)} className="text-[var(--gray-mid)] hover:text-[var(--text-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label-xs block mb-1">Título *</label>
                <input value={novaDemanda.titulo} onChange={e => setNovaDemanda(p => ({ ...p, titulo: e.target.value }))}
                  className="w-full h-[34px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" placeholder="Resumo da demanda" />
              </div>
              <div>
                <label className="label-xs block mb-1">Descrição *</label>
                <textarea value={novaDemanda.descricao} onChange={e => setNovaDemanda(p => ({ ...p, descricao: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-xs block mb-1">Tipo *</label>
                  <select value={novaDemanda.tipo} onChange={e => setNovaDemanda(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs block mb-1">Prioridade</label>
                  <select value={novaDemanda.prioridade} onChange={e => setNovaDemanda(p => ({ ...p, prioridade: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-xs block mb-1">Solicitante *</label>
                  <input value={novaDemanda.solicitante} onChange={e => setNovaDemanda(p => ({ ...p, solicitante: e.target.value }))}
                    className="w-full h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" placeholder="Nome" />
                </div>
                <div>
                  <label className="label-xs block mb-1">Responsável</label>
                  <select value={novaDemanda.responsavelId} onChange={e => setNovaDemanda(p => ({ ...p, responsavelId: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    <option value="">Sem responsável</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-xs block mb-1">Prazo interno</label>
                <input type="date" value={novaDemanda.prazo} onChange={e => setNovaDemanda(p => ({ ...p, prazo: e.target.value }))}
                  className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none" />
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
