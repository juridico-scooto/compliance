"use client";

import { useState } from "react";

export default function AlterarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (novaSenha !== confirmar) {
      setErro("A nova senha e a confirmação não coincidem.");
      return;
    }
    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao alterar a senha.");
      } else {
        setSucesso(true);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmar("");
      }
    } catch {
      setErro("Falha na conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">
          Senha atual
        </label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="••••••••"
          required
          className="h-[42px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">
          Nova senha
        </label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
          className="h-[42px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">
          Confirmar nova senha
        </label>
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Repita a nova senha"
          required
          className="h-[42px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
        />
      </div>

      {erro && (
        <div className="bg-[var(--red-bg)] border-[1.5px] border-[#F5B8CC] rounded-sm px-3.5 py-[11px] text-[12px] font-semibold text-[#9B0A35]">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-[var(--green-bg)] border-[1.5px] border-[#A8EDD0] rounded-sm px-3.5 py-[11px] text-[12px] font-semibold text-[#0D6B45]">
          Senha alterada com sucesso!
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="h-[42px] px-6 bg-[var(--violet)] text-white rounded-sm text-[13px] font-bold flex items-center gap-2 transition-colors hover:bg-[var(--violet-dark)] disabled:bg-[var(--gray-mid)] disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Salvar nova senha
            </>
          )}
        </button>
      </div>
    </form>
  );
}
