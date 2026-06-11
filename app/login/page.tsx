"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
    } else {
      router.push("/due-diligence");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off-white)]">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 justify-center">
            <span className="text-[28px] font-extrabold text-[var(--violet)] tracking-tight leading-none">scooto</span>
            <div className="w-px h-6 bg-[var(--gray-border)]" />
            <span className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Compliance</span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-3 font-medium">
            Acesse o sistema regulatório interno
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card border border-[var(--gray-border)] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                className="h-[44px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.07em]">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-[44px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 text-[13px] font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
              />
            </div>

            {error && (
              <div className="bg-[var(--red-bg)] border-[1.5px] border-[#F5B8CC] rounded-sm px-3.5 py-[11px] text-[12px] font-semibold text-[#9B0A35]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-[44px] bg-[var(--violet)] text-white rounded-sm text-[13px] font-bold flex items-center justify-center gap-2 transition-colors hover:bg-[var(--violet-dark)] disabled:bg-[var(--gray-mid)] disabled:cursor-not-allowed mt-1"
            >
              {loading ? <div className="spinner" /> : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--text-secondary)] mt-5 font-medium">
          Acesso restrito ao departamento jurídico e scooteiras da Scooto.
        </p>
      </div>
    </div>
  );
}
