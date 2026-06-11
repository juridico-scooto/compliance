import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off-white)]">
      <div className="text-center">
        <div className="w-16 h-16 bg-[var(--red-bg)] rounded-[18px] flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[var(--magenta)]">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] mb-2">Acesso Negado</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6 font-medium">
          Você não tem permissão para acessar esta página.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-[13px] font-bold bg-[var(--violet)] text-white hover:bg-[var(--violet-dark)] transition-all"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
