"use client";

import { useCallback, useEffect, useState } from "react";

type Email = {
  id: string;
  assunto: string;
  remetente: string;
  emailRemetente: string;
  data: string;
  corpo: string;
};

type FormDemanda = {
  titulo: string;
  descricao: string;
  solicitante: string;
  emailSolicitante: string;
  tipo: string;
  prioridade: string;
};

const TIPOS = ["CONTRATO", "PROCESSO", "CONSULTA_JURIDICA", "DOCUMENTO", "OUTRO"];
const PRIORIDADES = ["BAIXA", "NORMAL", "ALTA", "URGENTE"];
const LABEL_DEFAULT = "demanda";

export default function TriagemPage() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [labelNotFound, setLabelNotFound] = useState(false);
  const [label, setLabel] = useState(LABEL_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<Email | null>(null);
  const [form, setForm] = useState<FormDemanda>({
    titulo: "",
    descricao: "",
    solicitante: "",
    emailSolicitante: "",
    tipo: "OUTRO",
    prioridade: "NORMAL",
  });
  const [salvando, setSalvando] = useState(false);
  const [criados, setCriados] = useState<Set<string>>(new Set());

  const buscar = useCallback(async (lbl = label) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gmail/emails?label=${encodeURIComponent(lbl)}`);
      const data = await res.json();
      setConectado(data.conectado ?? false);
      setGmailEmail(data.gmailEmail ?? null);
      setEmails(data.emails ?? []);
      setLabelNotFound(data.labelNotFound ?? false);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  function abrirEmail(email: Email) {
    setSelecionado(email);
    setForm({
      titulo: email.assunto || "Sem assunto",
      descricao: email.corpo,
      solicitante: email.remetente,
      emailSolicitante: email.emailRemetente,
      tipo: "OUTRO",
      prioridade: "NORMAL",
    });
  }

  async function criarDemanda() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setCriados(prev => new Set(Array.from(prev).concat(selecionado.id)));
        setSelecionado(null);
      }
    } finally {
      setSalvando(false);
    }
  }

  function fmtData(s: string) {
    try { return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return s; }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--violet)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conectado) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-4xl mb-4">📬</div>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">Conectar Gmail</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6">
          Conecte sua conta do Google para importar e-mails com a etiqueta <strong>{label}</strong> como demandas.
        </p>
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--violet)] text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Conectar com Google
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0" style={{ height: "calc(100vh - 64px)" }}>
      {/* Lista de e-mails */}
      <div className="w-[380px] shrink-0 border-r border-[var(--gray-border)] flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--gray-border)]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[14px] font-bold text-[var(--text-primary)]">Triagem de E-mails</h1>
            <button
              onClick={() => buscar()}
              className="text-[11px] text-[var(--violet)] font-semibold hover:underline"
            >
              Atualizar
            </button>
          </div>
          {gmailEmail && (
            <p className="text-[11px] text-[var(--text-secondary)]">📧 {gmailEmail}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-[var(--text-secondary)]">Etiqueta:</span>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscar(label)}
              className="flex-1 text-[11px] border border-[var(--gray-border)] rounded px-2 py-1 outline-none focus:border-[var(--violet)]"
              placeholder="nome da etiqueta no Gmail"
            />
            <button
              onClick={() => buscar(label)}
              className="text-[11px] px-2 py-1 bg-[var(--violet)] text-white rounded font-semibold"
            >
              Buscar
            </button>
          </div>
          {labelNotFound && (
            <p className="text-[11px] text-[#EF4444] mt-1">
              Etiqueta &quot;{label}&quot; não encontrada no Gmail.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[13px] text-[var(--text-secondary)]">Nenhum e-mail com essa etiqueta.</p>
              <p className="text-[11px] text-[var(--gray-mid)] mt-1">
                No Gmail, etiquete um e-mail com <strong>{label}</strong> e atualize.
              </p>
            </div>
          ) : emails.map(email => {
            const jaCriado = criados.has(email.id);
            const ativo = selecionado?.id === email.id;
            return (
              <button
                key={email.id}
                onClick={() => !jaCriado && abrirEmail(email)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--gray-border)] transition-colors ${
                  ativo ? "bg-[var(--violet-light)]" : "hover:bg-[var(--gray-light)]"
                } ${jaCriado ? "opacity-40 cursor-default" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-1 flex-1">
                    {email.assunto || "(sem assunto)"}
                  </p>
                  {jaCriado && (
                    <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded shrink-0">✓ Criada</span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{email.remetente}</p>
                <p className="text-[10px] text-[var(--gray-mid)] mt-0.5">{fmtData(email.data)}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{email.corpo}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel de criação de demanda */}
      <div className="flex-1 overflow-y-auto">
        {!selecionado ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[32px] mb-3">👈</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Selecione um e-mail para criar uma demanda</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Criar demanda a partir do e-mail</h2>
              <button onClick={() => setSelecionado(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Preview do e-mail */}
            <div className="bg-[var(--gray-light)] border border-[var(--gray-border)] rounded-lg p-4 mb-5">
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">E-mail original</p>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">{selecionado.assunto}</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">De: {selecionado.remetente} &lt;{selecionado.emailRemetente}&gt;</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{fmtData(selecionado.data)}</p>
              <p className="text-[12px] text-[var(--text-primary)] mt-3 whitespace-pre-line line-clamp-6">{selecionado.corpo}</p>
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Título da demanda</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Solicitante</label>
                  <input
                    value={form.solicitante}
                    onChange={e => setForm(f => ({ ...f, solicitante: e.target.value }))}
                    className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">E-mail do solicitante</label>
                  <input
                    value={form.emailSolicitante}
                    onChange={e => setForm(f => ({ ...f, emailSolicitante: e.target.value }))}
                    className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-white"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-white"
                  >
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={6}
                  className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelecionado(null)}
                  className="px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarDemanda}
                  disabled={salvando || !form.titulo || !form.solicitante}
                  className="px-5 py-2 bg-[var(--violet)] text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {salvando ? "Criando..." : "Criar demanda"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
