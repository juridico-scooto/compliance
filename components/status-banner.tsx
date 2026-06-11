interface StatusBannerProps {
  type: "ok" | "warn" | "fail";
  title: string;
  subtitle: string;
  timestamp: string;
}

const icons = {
  ok: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  fail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const styles = {
  ok: {
    wrapper: "bg-[var(--green-bg)] border-[#A8EDD0]",
    icon: "bg-[var(--green)]",
    title: "text-[#0D6B45]",
    sub: "text-[#1A8F5C]",
  },
  warn: {
    wrapper: "bg-[var(--yellow-bg)] border-[#FAD89B]",
    icon: "bg-[var(--yellow)]",
    title: "text-[#8A5B00]",
    sub: "text-[#A06B00]",
  },
  fail: {
    wrapper: "bg-[var(--red-bg)] border-[#F5B8CC]",
    icon: "bg-[var(--magenta)]",
    title: "text-[#8B0030]",
    sub: "text-[#A0003A]",
  },
};

export default function StatusBanner({ type, title, subtitle, timestamp }: StatusBannerProps) {
  const s = styles[type];
  return (
    <div className={`rounded-card border-[1.5px] p-4 flex items-center gap-3.5 mb-[18px] ${s.wrapper}`}>
      <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-white shrink-0 ${s.icon}`}>
        {icons[type]}
      </div>
      <div className="flex-1">
        <p className={`text-[13px] font-extrabold ${s.title}`}>{title}</p>
        <p className={`text-[12px] font-medium mt-0.5 ${s.sub}`}>{subtitle}</p>
      </div>
      <div className="text-[10px] text-[var(--text-secondary)] text-right font-medium leading-relaxed">
        Consultado em<br/>{timestamp}
      </div>
    </div>
  );
}
