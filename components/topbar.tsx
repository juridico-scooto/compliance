"use client";

interface TopbarProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--gray-border)] h-[60px] flex items-center justify-between px-8">
      <div>
        <h1 className="text-[15px] font-extrabold text-[var(--text-primary)]">{title}</h1>
        <p className="text-[11px] text-[var(--text-secondary)] mt-px">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
