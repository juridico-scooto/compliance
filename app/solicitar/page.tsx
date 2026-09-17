"use client";

import { useState } from "react";

const TIPO_LABEL: Record<string, string> = {
  CONTRATO: "Contrato",
  PROCESSO: "Processo",
  CONSULTA_JURIDICA: "Consulta Jurídica",
  DOCUMENTO: "Documento",
  OUTRO: "Outro",
};

export default function SolicitarPage() {
  const [form, setForm] = useState({
    solicitante: "", setor: "", tipo: "CONSULTA_JURIDICA", titulo: "", descricao: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.solicitante || !form.titulo || !form.descricao) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prioridade: "NORMAL" }),
      });
      setStatus(res.ok ? "ok" : "erro");
    } catch {
      setStatus("erro");
    }
  }

  if (status === "ok") {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center p-6">
        <div className="bg-white rounded-card border border-[var(--gray-border)] p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--green-bg)] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#0D7A4E]">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-[16px] font-extrabold text-[var(--text-primary)] mb-2">Solicitação enviada!</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Sua demanda foi registrada e o time jurídico da Scooto irá analisar em breve.
          </p>
          <button
            onClick={() => { setStatus("idle"); setForm({ solicitante: "", setor: "", tipo: "CONSULTA_JURIDICA", titulo: "", descricao: "" }); }}
            className="mt-6 h-[36px] px-6 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold hover:bg-[var(--violet-dark)] transition-colors"
          >
            Nova solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center p-6">
      <div className="bg-white rounded-card border border-[var(--gray-border)] shadow-sm w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[var(--gray-border)]">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="text-[20px] font-extrabold text-[var(--violet)] tracking-tight leading-none">scooto</span>
            <div className="w-px h-4 bg-[var(--gray-border)]" />
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Jurídico</span>
          </div>
          <h1 className="text-[17px] font-extrabold text-[var(--text-primary)] leading-snug">Solicitar demanda jurídica</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">
            Preencha o formulário abaixo. O time jurídico irá receber e dar andamento à sua solicitação.
          </p>
        </div>

        <form onSubmit={enviar} className="px-8 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Seu nome *</label>
              <input
                value={form.solicitante}
                onChange={e => setForm(p => ({ ...p, solicitante: e.target.value }))}
                required
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Setor / Área</label>
              <input
                value={form.setor}
                onChange={e => setForm(p => ({ ...p, setor: e.target.value }))}
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="Ex: Comercial"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Tipo de demanda *</label>
            <select
              value={form.tipo}
              onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
            >
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Assunto *</label>
            <input
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              required
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="Resumo em uma linha"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Descrição *</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              required
              rows={4}
              className="w-full px-3 py-2.5 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-none"
              placeholder="Descreva com detalhes o que você precisa, contexto, documentos envolvidos, prazo que você tem etc."
            />
          </div>

          {status === "erro" && (
            <p className="text-[12px] text-[#8B0030] bg-[var(--red-bg)] border border-[#F5B8CC] rounded-sm px-3 py-2">
              Erro ao enviar. Tente novamente.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full h-[40px] bg-[var(--violet)] text-white rounded-sm text-[13px] font-bold hover:bg-[var(--violet-dark)] disabled:opacity-50 transition-colors mt-2"
          >
            {status === "loading" ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      </div>
    </div>
  );
}
