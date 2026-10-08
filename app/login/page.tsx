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
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
      router.push("/home");
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
            <span className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Jurídico</span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-3 font-medium">
            Sistema jurídico interno da Scooto
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
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[44px] border-[1.5px] border-[var(--gray-border)] rounded-sm px-3.5 pr-11 text-[13px] font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--violet)] focus:shadow-[0_0_0_3px_rgba(91,46,255,0.1)] placeholder:text-[var(--gray-mid)]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-mid)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {mostrarSenha ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 w-[18px] h-[18px]">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
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
          Acesso restrito ao jurídico
        </p>
      </div>
    </div>
  );
}
