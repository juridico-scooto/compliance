import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Topbar from "@/components/topbar";
import AlterarSenhaForm from "@/components/alterar-senha-form";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Topbar title="Meu Perfil" subtitle="Gerencie suas informações e senha de acesso" />
      <div className="p-8 flex-1 max-w-2xl">

        {/* Info do usuário */}
        <div className="bg-white rounded-card border border-[var(--gray-border)] p-6 mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--magenta))" }}
            >
              {session?.user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-[16px] font-extrabold text-[var(--text-primary)]">{session?.user?.name}</p>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{session?.user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold bg-[var(--violet-light)] text-[var(--violet-dark)] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] inline-block" />
                {session?.user?.role === "ADMIN" ? "Admin · Jurídico" : "Scooteira"}
              </span>
            </div>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="bg-white rounded-card border border-[var(--gray-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--gray-border)] bg-[var(--off-white)] flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] text-[var(--violet)]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">Alterar Senha</span>
          </div>
          <div className="p-6">
            <AlterarSenhaForm />
          </div>
        </div>

      </div>
    </>
  );
}
