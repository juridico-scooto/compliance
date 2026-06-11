interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] text-center gap-3">
      <div className="w-16 h-16 bg-[var(--violet-light)] rounded-[18px] flex items-center justify-center mb-1.5 text-[var(--violet)]">
        {icon}
      </div>
      <h2 className="text-[20px] font-extrabold text-[var(--text-primary)]">{title}</h2>
      <p className="text-[13px] text-[var(--text-secondary)] max-w-[380px] leading-relaxed font-medium">{description}</p>
      <span
        className="text-[11px] font-bold px-3.5 py-[5px] rounded-full text-white uppercase tracking-[0.05em] mt-1"
        style={{ background: "linear-gradient(135deg, var(--violet), var(--magenta))" }}
      >
        Em breve
      </span>
    </div>
  );
}
