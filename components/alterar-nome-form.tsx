"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AlterarNomeForm({ nomeAtual }: { nomeAtual: string }) {
  const { update } = useSession();
  const [nome, setNome] = useState(nomeAtual);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (nome.trim() === nomeAtual) {
      setErro("O nome não foi alterado.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/nome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao atualizar o nome.");
      } else {
        setSucesso(true);
        await update({ name: nome.trim() });
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
          Nome visível no sistema
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setSucesso(false); setErro(""); }}
          placeholder="Seu nome"
          required
          minLength={2}
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
          Nome atualizado com sucesso! Recarregue a página para ver o avatar atualizado.
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Salvar nome
            </>
          )}
        </button>
      </div>
    </form>
  );
}
