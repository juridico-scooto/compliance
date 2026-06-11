export function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function repNoQSA(
  qsa: { nome_socio: string }[] | null | undefined,
  rep: string
): boolean {
  if (!qsa || !rep) return false;
  const r = normalizar(rep);
  return qsa.some(
    (s) =>
      normalizar(s.nome_socio).includes(r) ||
      r.includes(normalizar(s.nome_socio).split(" ")[0])
  );
}

export function formatCNPJ(v: string | null | undefined): string {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = String(s);
  if (d.length === 8) return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}
