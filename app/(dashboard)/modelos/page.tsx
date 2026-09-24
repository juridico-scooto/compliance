"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Autor = { id: string; name: string };

type Template = {
  id: string;
  titulo: string;
  categoria: string;
  situacao: string | null;
  assunto: string | null;
  conteudo: string;
  tags: string[];
  variaveis: string[];
  cc: string[];
  autor: Autor | null;
  criadoEm: string;
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

const CATEGORIAS = [
  { id: "EMAIL",    label: "E-mail",            icon: "✉️",  cor: "#EDE9FE", corTexto: "#6D28D9" },
  { id: "MENSAGEM", label: "Mensagem",           icon: "💬",  cor: "#ECFDF5", corTexto: "#0D7A4E" },
  { id: "DOCUMENTO",label: "Envio de documento", icon: "📎",  cor: "#FFF7ED", corTexto: "#C2410C" },
  { id: "SITUACAO", label: "Resposta a situação",icon: "🔖",  cor: "#EFF6FF", corTexto: "#1D4ED8" },
];

function catInfo(id: string) {
  return CATEGORIAS.find(c => c.id === id) ?? CATEGORIAS[0];
}

// Normaliza nome de variável: trim + colapsa espaços ao redor da "/"
function normVar(s: string): string {
  return s.trim().replace(/\s*\/\s*/g, "/");
}

function extrairVariaveis(texto: string): string[] {
  const matches = texto.match(/\{\{([^}]+)\}\}/g) ?? [];
  return Array.from(new Set(matches.map(m => normVar(m.replace(/^\{\{|\}\}$/g, "")))));
}

function aplicarVariaveis(texto: string, vars: Record<string, string>): string {
  return texto.replace(/\{\{([^}]+)\}\}/g, (_, nome) => {
    const key = normVar(nome);
    const val = vars[key];
    // Se vazio ou não preenchido, mantém o placeholder visível
    return (val !== undefined && val !== "") ? val : `{{${key}}}`;
  });
}

// Se a variável tem "/" → são opções para escolher (ex: "bom dia/boa tarde")
function opcoesVar(nome: string): string[] | null {
  if (!nome.includes("/")) return null;
  return nome.split("/").map(o => o.trim()).filter(Boolean);
}

function ChipInput({ valores, onChange, placeholder }: { valores: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  function adicionar() {
    const val = input.trim();
    if (val && !valores.includes(val)) onChange([...valores, val]);
    setInput("");
  }
  function remover(v: string) { onChange(valores.filter(x => x !== v)); }
  return (
    <div className="border border-[var(--gray-border)] rounded-sm focus-within:border-[var(--violet)] bg-white px-2 py-1.5 min-h-[36px] flex flex-wrap gap-1.5 items-center">
      {valores.map(v => (
        <span key={v} className="flex items-center gap-1 bg-[var(--violet-light)] text-[var(--violet)] text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {v}
          <button type="button" onClick={() => remover(v)} className="text-[var(--violet)] hover:text-[#DC2626] leading-none font-bold ml-0.5">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } if (e.key === "," || e.key === ";") { e.preventDefault(); adicionar(); } }}
        placeholder={valores.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[100px] text-[12px] outline-none bg-transparent h-[22px]"
      />
      {input.trim() && (
        <button type="button" onClick={adicionar} className="text-[var(--violet)] text-[12px] font-bold px-1 hover:bg-[var(--violet-light)] rounded">+</button>
      )}
    </div>
  );
}

const TEMPLATE_VAZIO: { titulo: string; categoria: string; situacao: string; assunto: string; conteudo: string; tags: string[]; variaveis: string[]; cc: string[] } = {
  titulo: "", categoria: "EMAIL", situacao: "", assunto: "", conteudo: "", tags: [], variaveis: [], cc: [],
};

export default function ModelosPage() {
  const { status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("TODOS");
  const [busca, setBusca] = useState("");

  const [detalhe, setDetalhe] = useState<Template | null>(null);
  const [varsPreenchidas, setVarsPreenchidas] = useState<Record<string, string>>({});
  const [copiado, setCopiado] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editando, setEditando] = useState<Template | null>(null);
  const [form, setForm] = useState(TEMPLATE_VAZIO);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  function abrirCriar() {
    setEditando(null);
    setForm(TEMPLATE_VAZIO);
    setEditOpen(true);
  }

  function abrirEditar(t: Template) {
    setEditando(t);
    setForm({
      titulo: t.titulo,
      categoria: t.categoria,
      situacao: t.situacao ?? "",
      assunto: t.assunto ?? "",
      conteudo: t.conteudo,
      tags: t.tags,
      variaveis: t.variaveis,
      cc: t.cc,
    });
    setEditOpen(true);
  }

  async function salvarForm() {
    if (!form.titulo || !form.conteudo) return;
    setSaving(true);

    // Extrai variáveis automaticamente do conteúdo
    const varsAutoDetect = extrairVariaveis(form.conteudo);
    const todasVars = Array.from(new Set([...varsAutoDetect, ...form.variaveis]));

    const payload = {
      titulo: form.titulo,
      categoria: form.categoria,
      situacao: form.situacao || null,
      assunto: form.assunto || null,
      conteudo: form.conteudo,
      tags: form.tags,
      variaveis: todasVars,
      cc: form.cc,
    };

    const url = editando ? `/api/templates/${editando.id}` : "/api/templates";
    const method = editando ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (res.ok) {
      await carregar();
      setEditOpen(false);
    }
    setSaving(false);
  }

  async function excluir(id: string) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (detalhe?.id === id) setDetalhe(null);
    setConfirmDelete(null);
  }

  function abrirDetalhe(t: Template) {
    setDetalhe(t);
    const defaults: Record<string, string> = {};
    t.variaveis.forEach(v => { defaults[v] = ""; });
    setVarsPreenchidas(defaults);
    setCopiado(false);
  }

  async function copiar(t: Template) {
    const partes: string[] = [];
    if (t.categoria === "EMAIL") {
      if (t.assunto) partes.push(`Assunto: ${aplicarVariaveis(t.assunto, varsPreenchidas)}`);
      if (t.cc.length > 0) partes.push(`CC: ${t.cc.join(", ")}`);
      if (partes.length > 0) partes.push("");
    }
    partes.push(aplicarVariaveis(t.conteudo, varsPreenchidas));
    await navigator.clipboard.writeText(partes.join("\n"));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const filtrados = templates
    .filter(t => categoriaSelecionada === "TODOS" || t.categoria === categoriaSelecionada)
    .filter(t => !busca || t.titulo.toLowerCase().includes(busca.toLowerCase()) || (t.situacao ?? "").toLowerCase().includes(busca.toLowerCase()) || t.tags.some(g => g.toLowerCase().includes(busca.toLowerCase())));

  if (status === "loading") return null;

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] px-8 py-4 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] leading-tight">Modelos e Templates</h1>
          <p className="text-[12px] text-[var(--text-secondary)]">E-mails, mensagens e respostas padrão</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar templates..."
            className="h-[32px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] w-48"
          />
          <button onClick={abrirCriar}
            className="h-[32px] px-4 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold flex items-center gap-1.5 hover:bg-[var(--violet-dark)] transition-colors shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de categorias + lista */}
        <div className="w-[340px] shrink-0 border-r border-[var(--gray-border)] flex flex-col overflow-hidden">
          {/* Abas de categoria */}
          <div className="px-4 pt-4 pb-2 flex flex-wrap gap-1.5">
            <button onClick={() => setCategoriaSelecionada("TODOS")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${categoriaSelecionada === "TODOS" ? "bg-[var(--violet)] text-white" : "bg-[var(--gray-light)] text-[var(--text-secondary)] hover:bg-[var(--violet-light)] hover:text-[var(--violet)]"}`}>
              Todos
            </button>
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={() => setCategoriaSelecionada(c.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${categoriaSelecionada === c.id ? "text-white" : "hover:opacity-80"}`}
                style={categoriaSelecionada === c.id ? { background: c.corTexto } : { background: c.cor, color: c.corTexto }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[12px] text-[var(--text-secondary)]">Nenhum template encontrado</p>
                <button onClick={abrirCriar} className="mt-3 text-[12px] text-[var(--violet)] font-semibold hover:underline">Criar o primeiro →</button>
              </div>
            ) : filtrados.map(t => {
              const cat = catInfo(t.categoria);
              return (
                <button key={t.id} onClick={() => abrirDetalhe(t)}
                  className={`w-full text-left px-3 py-3 rounded-card mb-1 transition-all border ${detalhe?.id === t.id ? "border-[var(--violet)] bg-[var(--violet-light)]" : "border-transparent hover:border-[var(--gray-border)] hover:bg-[var(--gray-light)]"}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5 shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{t.titulo}</p>
                      {t.situacao && <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{t.situacao}</p>}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.cor, color: cat.corTexto }}>{cat.label}</span>
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] bg-[var(--gray-light)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe / visualização */}
        <div className="flex-1 overflow-y-auto">
          {!detalhe ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-[14px] font-bold text-[var(--text-primary)]">Selecione um template</p>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">Clique em qualquer template à esquerda para visualizar e copiar</p>
            </div>
          ) : (
            <div className="p-8 max-w-3xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{catInfo(detalhe.categoria).icon}</span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: catInfo(detalhe.categoria).cor, color: catInfo(detalhe.categoria).corTexto }}>
                      {catInfo(detalhe.categoria).label}
                    </span>
                  </div>
                  <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">{detalhe.titulo}</h2>
                  {detalhe.autor && <p className="text-[11px] text-[var(--text-secondary)] mt-1">Criado por {detalhe.autor.name}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => abrirEditar(detalhe)}
                    className="h-[32px] px-3 text-[12px] font-semibold text-[var(--text-secondary)] border border-[var(--gray-border)] rounded-sm hover:bg-[var(--gray-light)] transition-colors flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(detalhe.id)}
                    className="h-[32px] px-3 text-[12px] font-semibold text-[#EF4444] border border-[#FCA5A5] rounded-sm hover:bg-[#FEF2F2] transition-colors">
                    Excluir
                  </button>
                </div>
              </div>

              {/* Quando usar */}
              {detalhe.situacao && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-card px-4 py-3 mb-5">
                  <p className="text-[10px] font-bold text-[#92400E] uppercase tracking-wide mb-1">Quando usar</p>
                  <p className="text-[13px] text-[#78350F] leading-relaxed">{detalhe.situacao}</p>
                </div>
              )}

              {/* Tags */}
              {detalhe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {detalhe.tags.map(tag => (
                    <span key={tag} className="text-[11px] bg-[var(--gray-light)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* CC — só para EMAIL */}
              {detalhe.categoria === "EMAIL" && detalhe.cc.length > 0 && (
                <div className="mb-5">
                  <p className="label-xs mb-2">Cópia (CC)</p>
                  <div className="flex flex-wrap gap-2">
                    {detalhe.cc.map(v => (
                      isEmail(v) ? (
                        <span key={v} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full text-[12px] font-semibold text-[#1D4ED8]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {v}
                        </span>
                      ) : (
                        <span key={v} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-full text-[12px] font-semibold text-[#92400E]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {v}
                          <span className="text-[9px] font-bold bg-[#FDE68A] text-[#92400E] px-1.5 py-0.5 rounded-full ml-0.5">buscar e-mail</span>
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Preenchimento de variáveis */}
              {detalhe.variaveis.length > 0 && (
                <div className="mb-5 bg-[var(--gray-light)] rounded-card p-4">
                  <p className="label-xs mb-3">Preencher variáveis antes de copiar</p>
                  <div className="grid grid-cols-2 gap-3">
                    {detalhe.variaveis.map(v => {
                      const opcoes = opcoesVar(v);
                      return (
                        <div key={v}>
                          <label className="text-[11px] text-[var(--text-secondary)] font-semibold mb-1 block">
                            {`{{${v}}}`}
                            {opcoes && <span className="ml-1 text-[9px] font-bold bg-[var(--violet-light)] text-[var(--violet)] px-1.5 py-0.5 rounded-full">escolha</span>}
                          </label>
                          {opcoes ? (
                            <select
                              value={varsPreenchidas[v] ?? ""}
                              onChange={e => setVarsPreenchidas(prev => ({ ...prev, [v]: e.target.value }))}
                              className="w-full h-[30px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] bg-white"
                            >
                              <option value="">Escolha...</option>
                              {opcoes.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              value={varsPreenchidas[v] ?? ""}
                              onChange={e => setVarsPreenchidas(prev => ({ ...prev, [v]: e.target.value }))}
                              placeholder={v}
                              className="w-full h-[30px] px-2.5 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] bg-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conteúdo */}
              <div className="mb-4">
                {detalhe.assunto && (
                  <div className="mb-3 px-4 py-2.5 bg-[var(--gray-light)] rounded-sm border border-[var(--gray-border)]">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">Assunto</p>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {aplicarVariaveis(detalhe.assunto, varsPreenchidas)}
                    </p>
                  </div>
                )}
                <div className="bg-white border border-[var(--gray-border)] rounded-card p-5">
                  <p className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {aplicarVariaveis(detalhe.conteudo, varsPreenchidas).split(/(\{\{[^}]+\}\})/g).map((part, i) =>
                      part.startsWith("{{")
                        ? <span key={i} className="bg-[#FDE68A] text-[#92400E] px-1 rounded font-semibold">{part}</span>
                        : part
                    )}
                  </p>
                </div>
              </div>

              {/* Botão copiar */}
              <button onClick={() => copiar(detalhe)}
                className={`w-full h-[42px] rounded-card text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${copiado ? "bg-[#D1FAE5] text-[#0D7A4E] border border-[#6EE7B7]" : "bg-[var(--violet)] text-white hover:bg-[var(--violet-dark)]"}`}>
                {copiado ? (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>Copiado!</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar texto</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal criar/editar */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-card border border-[var(--gray-border)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-[14px] font-extrabold text-[var(--text-primary)]">{editando ? "Editar template" : "Novo template"}</h2>
              <button onClick={() => setEditOpen(false)} className="text-[var(--gray-mid)] hover:text-[var(--text-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-xs block mb-1">Título *</label>
                  <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                    className="w-full h-[34px] px-3 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                    placeholder="Ex: Resposta a questionamento sobre prazo de contrato" />
                </div>
                <div>
                  <label className="label-xs block mb-1">Categoria *</label>
                  <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                    className="w-full h-[34px] px-2 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none">
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                {form.categoria === "EMAIL" && (
                  <div>
                    <label className="label-xs block mb-1">Assunto do e-mail</label>
                    <input value={form.assunto} onChange={e => setForm(p => ({ ...p, assunto: e.target.value }))}
                      className="w-full h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                      placeholder="Ex: Encaminhamento de contrato — {{nome_cliente}}" />
                  </div>
                )}
              </div>

              {form.categoria === "EMAIL" && (
                <div>
                  <label className="label-xs block mb-1">
                    CC — Cópia <span className="font-normal normal-case text-[var(--gray-mid)]">(separados por vírgula — e-mail direto ou cargo, ex: &quot;GM da operação&quot;)</span>
                  </label>
                  <ChipInput valores={form.cc} onChange={v => setForm(p => ({ ...p, cc: v }))} placeholder="Ex: juridico@scooto.com.br, GM da operação..." />
                  <p className="text-[10px] text-[var(--gray-mid)] mt-1">E-mails ficam em azul · Cargos ficam em amarelo (precisa buscar o e-mail na hora do envio)</p>
                </div>
              )}

              <div>
                <label className="label-xs block mb-1">Quando usar <span className="font-normal normal-case text-[var(--gray-mid)]">(situação que dispara esse template)</span></label>
                <input value={form.situacao} onChange={e => setForm(p => ({ ...p, situacao: e.target.value }))}
                  className="w-full h-[34px] px-3 text-[12px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)]"
                  placeholder="Ex: Cliente questiona por que o contrato ainda não foi assinado" />
              </div>

              <div>
                <label className="label-xs block mb-1">
                  Conteúdo * <span className="font-normal normal-case text-[var(--gray-mid)]">— use {"{{"}<span>nome</span>{"}}"}  para variáveis substituíveis</span>
                </label>
                <textarea value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2.5 text-[13px] border border-[var(--gray-border)] rounded-sm focus:outline-none focus:border-[var(--violet)] resize-y font-mono leading-relaxed"
                  placeholder={"Olá {{nome_cliente}},\n\nSegue em anexo o contrato referente a {{descricao_servico}}.\n\nQualquer dúvida, estou à disposição.\n\nAtenciosamente,\n{{assinatura}}"} />
                {form.conteudo && (
                  <p className="text-[10px] text-[var(--violet)] mt-1">
                    Variáveis detectadas: {extrairVariaveis(form.conteudo).map(v => `{{${v}}}`).join(", ") || "nenhuma"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs block mb-1">Tags <span className="font-normal normal-case text-[var(--gray-mid)]">(Enter para adicionar)</span></label>
                  <ChipInput valores={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="Ex: contrato, prazo..." />
                </div>
                <div>
                  <label className="label-xs block mb-1">Variáveis extras <span className="font-normal normal-case text-[var(--gray-mid)]">(além das detectadas)</span></label>
                  <ChipInput valores={form.variaveis} onChange={v => setForm(p => ({ ...p, variaveis: v }))} placeholder="Ex: nome_advogado..." />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--gray-border)] flex justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="h-[34px] px-4 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--gray-light)] rounded-sm transition-colors">Cancelar</button>
              <button onClick={salvarForm} disabled={saving || !form.titulo || !form.conteudo}
                className="h-[34px] px-5 bg-[var(--violet)] text-white rounded-sm text-[12px] font-bold hover:bg-[var(--violet-dark)] disabled:opacity-50 transition-colors">
                {saving ? "Salvando..." : editando ? "Salvar alterações" : "Criar template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-card border border-[var(--gray-border)] shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-extrabold text-[var(--text-primary)] mb-2">Excluir template?</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="h-[34px] px-4 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--gray-light)] rounded-sm transition-colors">Cancelar</button>
              <button onClick={() => excluir(confirmDelete)} className="h-[34px] px-5 bg-[#EF4444] text-white rounded-sm text-[12px] font-bold hover:bg-[#DC2626] transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
