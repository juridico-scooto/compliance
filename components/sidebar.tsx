"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  {
    section: "Due Diligence",
    items: [
      {
        href: "/due-diligence",
        label: "Consulta de Cliente",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        ),
        adminOnly: true,
      },
      {
        href: "/historico",
        label: "Histórico de Relatórios",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        ),
        adminOnly: true,
      },
    ],
  },
  {
    section: "Políticas",
    items: [
      {
        href: "/politicas",
        label: "Políticas de Compliance",
        badge: "Em breve",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        href: "/seguranca",
        label: "Políticas de Segurança",
        badge: "Em breve",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Scooteiras",
    items: [
      {
        href: "/treinamentos",
        label: "Treinamentos",
        badge: "Em breve",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Conta",
    items: [
      {
        href: "/perfil",
        label: "Meu Perfil",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white border-r border-[var(--gray-border)]"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Logo */}
      <div className="px-5 py-[22px] border-b border-[var(--gray-border)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-extrabold text-[var(--violet)] tracking-tight leading-none">scooto</span>
          <div className="w-px h-5 bg-[var(--gray-border)]" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Compliance</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3.5 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="px-[18px] pt-2.5 pb-1.5 text-[10px] font-bold text-[var(--gray-mid)] uppercase tracking-widest">
              {group.section}
            </p>
            {group.items.map((item) => {
              if ("adminOnly" in item && item.adminOnly && !isAdmin) return null;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-[18px] py-2.5 text-[13px] font-semibold border-l-[3px] transition-all my-px ${
                    active
                      ? "bg-[var(--violet-light)] border-[var(--violet)] text-[var(--violet)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--violet-light)] hover:text-[var(--violet)]"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="text-[9px] font-bold bg-[var(--gray-light)] text-[var(--gray-mid)] px-[7px] py-0.5 rounded-full uppercase tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-[18px] py-3.5 border-t border-[var(--gray-border)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, var(--violet), var(--magenta))" }}
          >
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{session?.user?.name ?? "—"}</p>
            <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-px">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] inline-block" />
              {isAdmin ? "Admin · Jurídico" : "Scooteira"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
