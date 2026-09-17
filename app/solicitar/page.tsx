"use client";

import { useState, useRef } from "react";

const TIPO_LABEL: Record<string, string> = {
  CONTRATO: "Contrato",
  CONSULTA_JURIDICA: "Consulta Jurídica",
  DOCUMENTO: "Documento",
  OUTRO: "Outro",
};

const SETORES = ["Comercial", "Marketing", "Operações", "Financeiro", "Jurídico", "People"];

type Arquivo = { nome: string; tamanho: number; file: File };

export default function SolicitarPage() {
  const [form, setForm] = useState({
    solicitante: "",
    email: "",
    setor: "",
    operacao: "",
    cliente: "",
    tipo: "CONSULTA_JURIDICA",
    titulo: "",
    descricao: "",
    prazo: "",
  });
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [erroMsg, setErroMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function adicionarArquivos(files: FileList | null) {
    if (!files) return;
    const novos: Arquivo[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { setErroMsg(`${file.name} excede 10MB`); continue; }
      novos.push({ nome: file.name, tamanho: file.size, file });
    }
    setArquivos(prev => [...prev, ...novos]);
    setErroMsg("");
  }

  function removerArquivo(i: number) {
    setArquivos(prev => prev.filter((_, idx) => idx !== i));
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.solicitante || !form.titulo || !form.descricao) return;
    setStatus("loading");
    setErroMsg("");

    try {
      // Upload dos arquivos primeiro
      const urlsAnexos: string[] = [];
      for (const arq of arquivos) {
        const fd = new FormData();
        fd.append("file", arq.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const d = await res.json();
          urlsAnexos.push(d.url);
        }
      }

      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, emailSolicitante: form.email, prioridade: "NORMAL", anexos: urlsAnexos }),
      });

      if (res.ok) {
        setStatus("ok");
      } else {
        const d = await res.json();
        setErroMsg(d.error ?? "Erro ao enviar.");
        setStatus("erro");
      }
    } catch {
      setErroMsg("Erro de conexão. Tente novamente.");
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
            onClick={() => {
              setStatus("idle");
              setForm({ solicitante: "", email: "", setor: "", operacao: "", cliente: "", tipo: "CONSULTA_JURIDICA", titulo: "", descricao: "", prazo: "" });
              setArquivos([]);
            }}
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

          {/* Solicitante + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
                Seu nome <span className="text-[#EF4444]">*</span>
              </label>
              <input
                value={form.solicitante}
                onChange={e => setForm(p => ({ ...p, solicitante: e.target.value }))}
                required
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
                E-mail <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Setor */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Setor / Área</label>
            <select
              value={form.setor}
              onChange={e => setForm(p => ({ ...p, setor: e.target.value }))}
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] text-[var(--text-primary)]"
            >
              <option value="">Selecione...</option>
              {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Operação + Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Qual operação?</label>
              <input
                value={form.operacao}
                onChange={e => setForm(p => ({ ...p, operacao: e.target.value }))}
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="Ex: Franquia, Parceria..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Qual cliente?</label>
              <input
                value={form.cliente}
                onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))}
                className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
              Tipo de demanda <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
            >
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Assunto */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
              Assunto <span className="text-[#EF4444]">*</span>
            </label>
            <input
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              required
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
              placeholder="Resumo em uma linha"
            />
          </div>

          {/* Prazo ideal */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              Prazo ideal
              <span className="relative group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[var(--gray-mid)] cursor-default">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-[var(--text-primary)] text-white text-[10px] leading-relaxed rounded px-2.5 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 font-normal normal-case tracking-normal">
                  Esta data é apenas para nos ajudar a entender a urgência da sua demanda. Não é uma garantia de cumprimento, pois outras demandas internas também são consideradas no planejamento do time jurídico.
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
                </span>
              </span>
            </label>
            <input
              type="date"
              value={form.prazo ?? ""}
              onChange={e => setForm(p => ({ ...p, prazo: e.target.value }))}
              className="w-full h-[36px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">
              Descrição <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              required
              rows={4}
              className="w-full px-3 py-2.5 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-none"
              placeholder="Descreva com detalhes o que você precisa, contexto, documentos envolvidos, prazo etc."
            />
          </div>

          {/* Anexos */}
          <div>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide block mb-1.5">Anexos</label>
            <div
              className="border border-dashed border-[var(--gray-border)] rounded-sm p-4 text-center cursor-pointer hover:border-[var(--violet)] hover:bg-[var(--violet-light)] transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); adicionarArquivos(e.dataTransfer.files); }}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={e => adicionarArquivos(e.target.files)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[var(--gray-mid)] mx-auto mb-1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-[12px] text-[var(--text-secondary)]">Clique ou arraste arquivos aqui</p>
              <p className="text-[10px] text-[var(--gray-mid)] mt-0.5">Imagens, PDF, Word, Excel — máx. 10MB por arquivo</p>
            </div>

            {arquivos.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {arquivos.map((arq, i) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--gray-light)] rounded-sm px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[var(--gray-mid)] shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="text-[12px] text-[var(--text-primary)] truncate">{arq.nome}</span>
                      <span className="text-[10px] text-[var(--gray-mid)] shrink-0">{fmtSize(arq.tamanho)}</span>
                    </div>
                    <button type="button" onClick={() => removerArquivo(i)} className="text-[var(--gray-mid)] hover:text-[#EF4444] ml-2 shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {erroMsg && (
            <p className="text-[12px] text-[#8B0030] bg-[var(--red-bg)] border border-[#F5B8CC] rounded-sm px-3 py-2">
              {erroMsg}
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
