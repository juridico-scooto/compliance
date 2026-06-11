interface InfoRow {
  label: string;
  value: React.ReactNode;
}

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  rows: InfoRow[];
  full?: boolean;
}

export function InfoCard({ title, icon, rows, full }: InfoCardProps) {
  return (
    <div className={`bg-white border-[1.5px] border-[var(--gray-border)] rounded-card overflow-hidden${full ? " col-span-full" : ""}`}>
      <div className="px-[18px] py-3 border-b border-[var(--gray-border)] flex items-center gap-2 bg-[var(--off-white)]">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--violet-light)] flex items-center justify-center shrink-0">
          <span className="text-[var(--violet)]">{icon}</span>
        </div>
        <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-[0.07em]">{title}</span>
      </div>
      <div className="px-[18px] py-3.5">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex justify-between items-start gap-3 py-[7px] ${i < rows.length - 1 ? "border-b border-[var(--gray-light)]" : ""} ${i === 0 ? "pt-0" : ""} ${i === rows.length - 1 ? "pb-0" : ""}`}
          >
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] whitespace-nowrap shrink-0">{r.label}</span>
            <span className="text-[12px] font-bold text-[var(--text-primary)] text-right break-words">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PillProps {
  variant: "green" | "red" | "yellow" | "gray" | "violet";
  children: React.ReactNode;
}

const pillStyles: Record<string, string> = {
  green: "bg-[var(--green-bg)] text-[#0D7A4E]",
  red: "bg-[var(--red-bg)] text-[#8B0030]",
  yellow: "bg-[var(--yellow-bg)] text-[#7A4E00]",
  gray: "bg-[var(--gray-light)] text-[var(--text-secondary)]",
  violet: "bg-[var(--violet-light)] text-[var(--violet-dark)]",
};

export function Pill({ variant, children }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] font-bold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${pillStyles[variant]}`}>
      {children}
    </span>
  );
}
