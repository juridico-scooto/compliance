"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type StatusCfg = { id: string; nome: string; cor: string; corTexto: string; ordem: number; ativo: boolean };
type SubstatusCfg = { id: string; nome: string; cor: string; corTexto: string; ordem: number };

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registros, setRegistros] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Status
  const [statuses, setStatuses] = useState<StatusCfg[]>([]);
  const [novoStatusNome, setNovoStatusNome] = useState("");
  const [novoStatusCor, setNovoStatusCor] = useState("#E2E8F0");
  const [novoStatusCorTexto, setNovoStatusCorTexto] = useState("#475569");
  const [editandoStatus, setEditandoStatus] = useState<StatusCfg | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Sub-status
  const [substatuses, setSubstatuses] = useState<SubstatusCfg[]>([]);
  const [novoSubNome, setNovoSubNome] = useState("");
  const [novoSubCor, setNovoSubCor] = useState("#FEF3C7");
  const [novoSubCorTexto, setNovoSubCorTexto] = useState("#92400E");
  const [editandoSub, setEditandoSub] = useState<SubstatusCfg | null>(null);
  const [savingSub, setSavingSub] = useState(false);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && !isAdmin) { router.push("/due-diligence"); return; }
    if (isAdmin) { fetchStatus(); carregarStatuses(); carregarSubstatuses(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdmin]);

  async function fetchStatus() {
    const res = await fetch("/api/admin/importar-pgfn");
    if (res.ok) { const d = await res.json(); setRegistros(d.registros); }
  }

  async function carregarStatuses() {
    const res = await fetch("/api/status-config");
    if (res.ok) setStatuses(await res.json());
  }

  async function carregarSubstatuses() {
    const res = await fetch("/api/substatus-config");
    if (res.ok) setSubstatuses(await res.json());
  }

  async function criarStatus() {
    if (!novoStatusNome.trim()) return;
    setSavingStatus(true);
    await fetch("/api/status-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: novoStatusNome.toUpperCase().replace(/\s+/g, "_"), nome: novoStatusNome, cor: novoStatusCor, corTexto: novoStatusCorTexto }) });
    setNovoStatusNome(""); setNovoStatusCor("#E2E8F0"); setNovoStatusCorTexto("#475569");
    await carregarStatuses(); setSavingStatus(false);
  }

  async function salvarStatus() {
    if (!editandoStatus) return;
    setSavingStatus(true);
    await fetch("/api/status-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editandoStatus) });
    setEditandoStatus(null); await carregarStatuses(); setSavingStatus(false);
  }

  async function removerStatus(id: string) {
    if (!confirm("Remover este status? Demandas com esse status não serão afetadas.")) return;
    await fetch("/api/status-config", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await carregarStatuses();
  }

  async function criarSubstatus() {
    if (!novoSubNome.trim()) return;
    setSavingSub(true);
    await fetch("/api/substatus-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: novoSubNome, cor: novoSubCor, corTexto: novoSubCorTexto }) });
    setNovoSubNome(""); setNovoSubCor("#FEF3C7"); setNovoSubCorTexto("#92400E");
    await carregarSubstatuses(); setSavingSub(false);
  }

  async function salvarSubstatus() {
    if (!editandoSub) return;
    setSavingSub(true);
    await fetch("/api/substatus-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editandoSub) });
    setEditandoSub(null); await carregarSubstatuses(); setSavingSub(false);
  }

  async function removerSubstatus(id: string) {
    if (!confirm("Remover este sub-status?")) return;
    await fetch("/api/substatus-config", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await carregarSubstatuses();
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

      {/* Card Status */}
      <div className="bg-white rounded-card border border-[var(--gray-border)] overflow-hidden mt-6">
        <div className="px-[18px] py-3 border-b border-[var(--gray-border)] bg-[var(--off-white)] flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">Status das Demandas</span>
        </div>
        <div className="px-[18px] py-5 space-y-3">
          {/* Lista */}
          {statuses.map(s => (
            <div key={s.id} className="flex items-center gap-3">
              {editandoStatus?.id === s.id ? (
                <>
                  <input value={editandoStatus.nome} onChange={e => setEditandoStatus(p => p ? { ...p, nome: e.target.value } : p)} className="flex-1 h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" />
                  <input type="color" value={editandoStatus.cor} onChange={e => setEditandoStatus(p => p ? { ...p, cor: e.target.value } : p)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor de fundo" />
                  <input type="color" value={editandoStatus.corTexto} onChange={e => setEditandoStatus(p => p ? { ...p, corTexto: e.target.value } : p)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor do texto" />
                  <button onClick={salvarStatus} disabled={savingStatus} className="h-[32px] px-3 bg-[var(--violet)] text-white rounded-sm text-[11px] font-bold disabled:opacity-50">Salvar</button>
                  <button onClick={() => setEditandoStatus(null)} className="h-[32px] px-3 border border-[var(--gray-border)] rounded-sm text-[11px] text-[var(--text-secondary)] hover:bg-[var(--gray-light)]">Cancelar</button>
                </>
              ) : (
                <>
                  <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{ background: s.cor, color: s.corTexto }}>{s.nome}</span>
                  <span className="text-[10px] text-[var(--gray-mid)] font-mono ml-1">{s.id}</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setEditandoStatus(s)} className="h-[28px] px-2.5 border border-[var(--gray-border)] rounded-sm text-[11px] text-[var(--text-secondary)] hover:bg-[var(--gray-light)] transition-colors">Editar</button>
                    <button onClick={() => removerStatus(s.id)} className="h-[28px] px-2.5 border border-[#F5B8CC] rounded-sm text-[11px] text-[#9B0A35] hover:bg-[var(--red-bg)] transition-colors">Remover</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {/* Novo status */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--gray-border)]">
            <input value={novoStatusNome} onChange={e => setNovoStatusNome(e.target.value)} placeholder="Nome do status..." className="flex-1 h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" />
            <input type="color" value={novoStatusCor} onChange={e => setNovoStatusCor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor de fundo" />
            <input type="color" value={novoStatusCorTexto} onChange={e => setNovoStatusCorTexto(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor do texto" />
            <button onClick={criarStatus} disabled={savingStatus || !novoStatusNome.trim()} className="h-[32px] px-4 bg-[var(--violet)] text-white rounded-sm text-[11px] font-bold disabled:opacity-50 hover:bg-[var(--violet-dark)] transition-colors">+ Adicionar</button>
          </div>
          <p className="text-[10px] text-[var(--gray-mid)]">Primeiro color picker = fundo do badge · Segundo = cor do texto</p>
        </div>
      </div>

      {/* Card Sub-status */}
      <div className="bg-white rounded-card border border-[var(--gray-border)] overflow-hidden mt-6">
        <div className="px-[18px] py-3 border-b border-[var(--gray-border)] bg-[var(--off-white)] flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">Sub-status (Em andamento)</span>
        </div>
        <div className="px-[18px] py-5 space-y-3">
          <p className="text-[11px] text-[var(--text-secondary)]">Sub-status aparecem nas demandas com status <strong>Em andamento</strong>.</p>
          {/* Lista */}
          {substatuses.map(ss => (
            <div key={ss.id} className="flex items-center gap-3">
              {editandoSub?.id === ss.id ? (
                <>
                  <input value={editandoSub.nome} onChange={e => setEditandoSub(p => p ? { ...p, nome: e.target.value } : p)} className="flex-1 h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" />
                  <input type="color" value={editandoSub.cor} onChange={e => setEditandoSub(p => p ? { ...p, cor: e.target.value } : p)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor de fundo" />
                  <input type="color" value={editandoSub.corTexto} onChange={e => setEditandoSub(p => p ? { ...p, corTexto: e.target.value } : p)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor do texto" />
                  <button onClick={salvarSubstatus} disabled={savingSub} className="h-[32px] px-3 bg-[var(--violet)] text-white rounded-sm text-[11px] font-bold disabled:opacity-50">Salvar</button>
                  <button onClick={() => setEditandoSub(null)} className="h-[32px] px-3 border border-[var(--gray-border)] rounded-sm text-[11px] text-[var(--text-secondary)] hover:bg-[var(--gray-light)]">Cancelar</button>
                </>
              ) : (
                <>
                  <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{ background: ss.cor, color: ss.corTexto }}>{ss.nome}</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setEditandoSub(ss)} className="h-[28px] px-2.5 border border-[var(--gray-border)] rounded-sm text-[11px] text-[var(--text-secondary)] hover:bg-[var(--gray-light)] transition-colors">Editar</button>
                    <button onClick={() => removerSubstatus(ss.id)} className="h-[28px] px-2.5 border border-[#F5B8CC] rounded-sm text-[11px] text-[#9B0A35] hover:bg-[var(--red-bg)] transition-colors">Remover</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {/* Novo sub-status */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--gray-border)]">
            <input value={novoSubNome} onChange={e => setNovoSubNome(e.target.value)} placeholder="Nome do sub-status..." className="flex-1 h-[32px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]" />
            <input type="color" value={novoSubCor} onChange={e => setNovoSubCor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor de fundo" />
            <input type="color" value={novoSubCorTexto} onChange={e => setNovoSubCorTexto(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--gray-border)]" title="Cor do texto" />
            <button onClick={criarSubstatus} disabled={savingSub || !novoSubNome.trim()} className="h-[32px] px-4 bg-[var(--violet)] text-white rounded-sm text-[11px] font-bold disabled:opacity-50 hover:bg-[var(--violet-dark)] transition-colors">+ Adicionar</button>
          </div>
        </div>
      </div>

      </div>
      </div>
    </>
  );
}
