"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  texto: string | null;
  demandaId: string | null;
  lida: boolean;
  criadoEm: string;
};

function fmtTempo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function tipoIcon(tipo: string) {
  if (tipo === "NOVA_DEMANDA") return "📋";
  if (tipo === "MENCAO") return "💬";
  return "👤";
}

function NotificationBell({ onNavDemanda }: { onNavDemanda: (id: string) => void }) {
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const buscar = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes");
      if (res.ok) setNotifs(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    buscar();
    const timer = setInterval(buscar, 30000);
    return () => clearInterval(timer);
  }, [buscar]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const naoLidas = notifs.filter(n => !n.lida).length;

  async function marcarLida(id: string) {
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  async function lerTodas() {
    await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lerTodas: true }) });
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  }

  function clicarNotif(n: Notificacao) {
    marcarLida(n.id);
    if (n.demandaId) onNavDemanda(n.demandaId);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--gray-light)] transition-colors"
        title="Notificações"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--text-secondary)]">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 w-[320px] bg-white border border-[var(--gray-border)] rounded-card shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--gray-border)] flex items-center justify-between">
            <p className="text-[12px] font-bold text-[var(--text-primary)]">Notificações {naoLidas > 0 && <span className="text-[var(--violet)]">({naoLidas} nova{naoLidas > 1 ? "s" : ""})</span>}</p>
            {naoLidas > 0 && (
              <button onClick={lerTodas} className="text-[11px] text-[var(--violet)] hover:underline font-semibold">Ler todas</button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifs.length === 0 ? (
              <p className="text-[12px] text-[var(--text-secondary)] text-center py-8">Nenhuma notificação</p>
            ) : notifs.map(n => (
              <button key={n.id} onClick={() => clicarNotif(n)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--gray-border)] hover:bg-[var(--gray-light)] transition-colors flex gap-3 items-start ${!n.lida ? "bg-[#F5F3FF]" : ""}`}>
                <span className="text-base mt-0.5 shrink-0">{tipoIcon(n.tipo)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">{n.titulo}</p>
                  {n.texto && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.texto}</p>}
                  <p className="text-[10px] text-[var(--gray-mid)] mt-1">{fmtTempo(n.criadoEm)}</p>
                </div>
                {!n.lida && <span className="w-2 h-2 rounded-full bg-[var(--violet)] shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const navItems = [
  {
    section: "Início",
    items: [
      {
        href: "/home",
        label: "Meu Painel",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Jurídico",
    items: [
      {
        href: "/demandas",
        label: "Demandas",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        href: "/prazos",
        label: "Prazos Judiciais",
        badge: "Em breve",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ),
      },
      {
        href: "/clientes-juridico",
        label: "Clientes — Especificações",
        badge: "Em breve",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        href: "/triagem",
        label: "Triagem de E-mails",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        ),
      },
      {
        href: "/modelos",
        label: "Modelos e Templates",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Compliance",
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
    section: "Sistema",
    items: [
      {
        href: "/admin",
        label: "Administração",
        adminOnly: true,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
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
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  function navParaDemanda(demandaId: string) {
    router.push(`/demandas?demanda=${demandaId}`);
  }

  return (
    <aside
      data-sidebar
      className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white border-r border-[var(--gray-border)]"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Logo */}
      <div className="px-5 py-[22px] border-b border-[var(--gray-border)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-extrabold text-[var(--violet)] tracking-tight leading-none">scooto</span>
          <div className="w-px h-5 bg-[var(--gray-border)]" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Jurídico</span>
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
          <div className="overflow-hidden flex-1">
            <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{session?.user?.name ?? "—"}</p>
            <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-px">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] inline-block" />
              {isAdmin ? "Admin · Jurídico" : "Scooteira"}
            </p>
          </div>
          {session && <NotificationBell onNavDemanda={navParaDemanda} />}
        </div>
      </div>
    </aside>
  );
}
