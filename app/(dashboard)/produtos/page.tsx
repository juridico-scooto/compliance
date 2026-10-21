"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Material3D = {
  id: string; nome: string; precoRolo: number; gramasRolo: number;
  cor?: string | null; marca?: string | null; ativo: boolean;
};

type Embalagem3D = {
  id: string; nome: string; custo: number; descricao?: string | null; ativo: boolean;
};

type ProdutoMaterialFull = { materialId: string; gramasPeca: number; material: Material3D };
type ProdutoEmbalagemFull = { embalagemId: string; embalagem: Embalagem3D };

type Produto3D = {
  id: string; nome: string; descricao?: string | null;
  horasImpressao: number; potenciaKW: number; tarifaKwh: number;
  precoImpressora: number; manutencaoEst: number; vidaUtilH: number;
  taxaFalha: number; minutosTrabalho: number; valorHora: number;
  fixosMes: number; pecasMes: number; pecasPorPedido: number;
  acabamento: number; taxas: number; margemDesejada: number;
  custoTotal?: number | null; precoSugerido?: number | null; ativo: boolean;
  materiais: ProdutoMaterialFull[]; embalagens: ProdutoEmbalagemFull[];
};

type ProdForm = {
  nome: string; descricao: string;
  horasImpressao: number; potenciaKW: number; tarifaKwh: number;
  precoImpressora: number; manutencaoEst: number; vidaUtilH: number;
  taxaFalha: number; minutosTrabalho: number; valorHora: number;
  fixosMes: number; pecasMes: number; pecasPorPedido: number;
  acabamento: number; taxas: number; margemDesejada: number;
  materiaisForm: { materialId: string; gramasPeca: number }[];
  embalagensForm: string[];
};

type MatForm = { nome: string; precoRolo: number; gramasRolo: number; cor: string; marca: string };
type EmbForm = { nome: string; custo: number; descricao: string };

// ─── Defaults ────────────────────────────────────────────────────────────────

const PROD_DEFAULT: ProdForm = {
  nome: "", descricao: "",
  horasImpressao: 4, potenciaKW: 0.18, tarifaKwh: 0.80,
  precoImpressora: 2000, manutencaoEst: 600, vidaUtilH: 4000,
  taxaFalha: 15, minutosTrabalho: 20, valorHora: 50,
  fixosMes: 200, pecasMes: 50, pecasPorPedido: 1,
  acabamento: 0, taxas: 12, margemDesejada: 30,
  materiaisForm: [{ materialId: "", gramasPeca: 50 }],
  embalagensForm: [],
};

const MAT_DEFAULT: MatForm = { nome: "", precoRolo: 100, gramasRolo: 1000, cor: "", marca: "" };
const EMB_DEFAULT: EmbForm = { nome: "", custo: 0, descricao: "" };

// ─── Calc ─────────────────────────────────────────────────────────────────────

function calcular(form: ProdForm, mats: Material3D[], embs: Embalagem3D[]) {
  let custoMat = 0;
  for (const pm of form.materiaisForm) {
    const m = mats.find(x => x.id === pm.materialId);
    if (m && pm.gramasPeca > 0) custoMat += (m.precoRolo / (m.gramasRolo || 1)) * pm.gramasPeca;
  }
  const energia = form.potenciaKW * form.horasImpressao * form.tarifaKwh;
  const desgaste = ((form.precoImpressora + form.manutencaoEst) / (form.vidaUtilH || 1)) * form.horasImpressao;
  const subProd = custoMat + energia + desgaste;
  const fator = Math.max(0.001, 1 - form.taxaFalha / 100);
  const custoProd = subProd / fator;
  let custoEmbalTotal = 0;
  for (const eid of form.embalagensForm) {
    const e = embs.find(x => x.id === eid);
    if (e) custoEmbalTotal += e.custo;
  }
  const embalPeca = custoEmbalTotal / Math.max(1, form.pecasPorPedido);
  const mdo = (form.minutosTrabalho / 60) * form.valorHora;
  const fixos = form.fixosMes / Math.max(1, form.pecasMes);
  const custoTotal = custoProd + form.acabamento + embalPeca + mdo + fixos;
  const divisor = 1 - form.taxas / 100 - form.margemDesejada / 100;
  const valido = divisor > 0.001;
  const preco = valido ? custoTotal / divisor : 0;
  const lucro = preco - custoTotal;
  const margemReal = preco > 0 ? (lucro / preco) * 100 : 0;
  return { custoMat, energia, desgaste, subProd, custoProd, falhaAdj: custoProd - subProd, embalPeca, mdo, fixos, custoTotal, preco, lucro, margemReal, valido };
}

// ─── Format ──────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v: number, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{children}</p>;
}

function NumInput({ value, onChange, prefix, suffix, step = 1 }: {
  value: number; onChange: (v: string) => void; prefix?: string; suffix?: string; step?: number;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-[11px] text-[var(--gray-mid)] pointer-events-none font-medium">{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(e.target.value)}
        className={`w-full border border-[var(--gray-border)] rounded-lg py-2 text-[13px] font-mono text-[var(--text-primary)] bg-[var(--gray-light)] outline-none focus:border-[var(--violet)] focus:bg-white transition-colors ${prefix ? "pl-8" : "pl-3"} ${suffix ? "pr-10" : "pr-3"}`}
        style={{ MozAppearance: "textfield" } as React.CSSProperties}
        onWheel={e => (e.target as HTMLInputElement).blur()}
      />
      {suffix && <span className="absolute right-3 text-[11px] text-[var(--gray-mid)] pointer-events-none font-medium">{suffix}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--gray-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-[var(--gray-light)] border-b border-[var(--gray-border)]">
        <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}

// ─── Product Editor ───────────────────────────────────────────────────────────

function ProductEditor({
  form, mats, embs, editingId, salvando, salvandoRef,
  setF, setFNum, onSave, onCancel,
}: {
  form: ProdForm;
  mats: Material3D[];
  embs: Embalagem3D[];
  editingId: string | null;
  salvando: boolean;
  salvandoRef: React.MutableRefObject<boolean>;
  setF: <K extends keyof ProdForm>(k: K, v: ProdForm[K]) => void;
  setFNum: (k: keyof ProdForm, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const calc = calcular(form, mats, embs);

  function addMatLine() {
    setF("materiaisForm", [...form.materiaisForm, { materialId: "", gramasPeca: 50 }]);
  }
  function removeMatLine(i: number) {
    setF("materiaisForm", form.materiaisForm.filter((_, idx) => idx !== i));
  }
  function setMatLine(i: number, field: "materialId" | "gramasPeca", v: string | number) {
    const arr = [...form.materiaisForm];
    arr[i] = { ...arr[i], [field]: v };
    setF("materiaisForm", arr);
  }
  function toggleEmb(id: string) {
    setF("embalagensForm",
      form.embalagensForm.includes(id)
        ? form.embalagensForm.filter(e => e !== id)
        : [...form.embalagensForm, id]
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor header */}
      <div className="px-5 py-3.5 border-b border-[var(--gray-border)] flex items-center justify-between bg-white sticky top-0 z-10">
        <h2 className="text-[14px] font-bold text-[var(--text-primary)]">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>
        <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Identificação */}
          <Section title="Identificação">
            <div>
              <Label>Nome do produto *</Label>
              <input
                value={form.nome}
                onChange={e => setF("nome", e.target.value)}
                placeholder="Ex: Chaveiro Logo Scooto"
                className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <textarea
                value={form.descricao}
                onChange={e => setF("descricao", e.target.value)}
                rows={2}
                placeholder="Descrição opcional"
                className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white resize-none"
              />
            </div>
          </Section>

          {/* Material */}
          <Section title="1. Material (filamentos)">
            {form.materiaisForm.map((pm, i) => {
              const mat = mats.find(m => m.id === pm.materialId);
              const custoPorGrama = mat ? mat.precoRolo / mat.gramasRolo : 0;
              const custoLinha = mat ? custoPorGrama * pm.gramasPeca : 0;
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      {i === 0 && <Label>Filamento</Label>}
                      <select
                        value={pm.materialId}
                        onChange={e => setMatLine(i, "materialId", e.target.value)}
                        className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] bg-[var(--gray-light)] outline-none focus:border-[var(--violet)] focus:bg-white"
                      >
                        <option value="">— selecione o material —</option>
                        {mats.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nome}{m.cor ? ` · ${m.cor}` : ""}{m.marca ? ` (${m.marca})` : ""} — R${fmtN(m.precoRolo)}/{m.gramasRolo}g
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      {i === 0 && <Label>Gramas</Label>}
                      <NumInput
                        value={pm.gramasPeca}
                        onChange={v => setMatLine(i, "gramasPeca", parseFloat(v) || 0)}
                        suffix="g"
                        step={0.5}
                      />
                    </div>
                    {form.materiaisForm.length > 1 && (
                      <button onClick={() => removeMatLine(i)} className="mb-0.5 text-[var(--gray-mid)] hover:text-red-500 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  {mat && (
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                      R$ {fmtN(custoPorGrama, 4)}/g × {fmtN(pm.gramasPeca, 1)}g = <strong className="text-[var(--violet)]">{fmt(custoLinha)}</strong>
                    </p>
                  )}
                </div>
              );
            })}
            {mats.length > 0 && (
              <button
                onClick={addMatLine}
                className="text-[11px] text-[var(--violet)] font-semibold hover:underline self-start"
              >
                + Adicionar outro filamento (multicolor)
              </button>
            )}
            {mats.length === 0 && (
              <p className="text-[11px] text-[var(--gray-mid)]">Cadastre materiais na aba &quot;Materiais&quot; primeiro.</p>
            )}
          </Section>

          {/* Impressão */}
          <Section title="2. Impressão e energia">
            <Row3>
              <div>
                <Label>Horas de impressão</Label>
                <NumInput value={form.horasImpressao} onChange={v => setFNum("horasImpressao", v)} suffix="h" step={0.5} />
              </div>
              <div>
                <Label>Potência média</Label>
                <NumInput value={form.potenciaKW} onChange={v => setFNum("potenciaKW", v)} suffix="kW" step={0.01} />
              </div>
              <div>
                <Label>Tarifa (c/ impostos)</Label>
                <NumInput value={form.tarifaKwh} onChange={v => setFNum("tarifaKwh", v)} prefix="R$" step={0.01} />
              </div>
            </Row3>
            <p className="text-[11px] text-[var(--gray-mid)]">
              Energia = {fmt(calc.energia)} · Tarifa da sua conta de luz já com bandeira.
            </p>
          </Section>

          {/* Máquina */}
          <Section title="3. Desgaste da máquina">
            <Row2>
              <div>
                <Label>Preço da impressora</Label>
                <NumInput value={form.precoImpressora} onChange={v => setFNum("precoImpressora", v)} prefix="R$" step={100} />
              </div>
              <div>
                <Label>Manutenção estimada</Label>
                <NumInput value={form.manutencaoEst} onChange={v => setFNum("manutencaoEst", v)} prefix="R$" step={50} />
              </div>
            </Row2>
            <div className="w-1/2">
              <Label>Vida útil estimada</Label>
              <NumInput value={form.vidaUtilH} onChange={v => setFNum("vidaUtilH", v)} suffix="h" step={500} />
            </div>
            <p className="text-[11px] text-[var(--gray-mid)]">
              {fmt(((form.precoImpressora + form.manutencaoEst) / (form.vidaUtilH || 1)))} /h — Desgaste nesta peça: {fmt(calc.desgaste)}
            </p>
          </Section>

          {/* Falha */}
          <Section title="4. Taxa de falha">
            <div className="w-1/3">
              <Label>Taxa de falha</Label>
              <NumInput value={form.taxaFalha} onChange={v => setFNum("taxaFalha", v)} suffix="%" step={1} />
            </div>
            <p className="text-[11px] text-[var(--gray-mid)]">
              Divisor: {fmtN(1 - form.taxaFalha / 100, 3)} — Acréscimo no custo de produção: {fmt(calc.falhaAdj)}
            </p>
          </Section>

          {/* Acabamento */}
          <Section title="5. Acabamento e componentes">
            <div className="w-1/2">
              <Label>Custo por peça</Label>
              <NumInput value={form.acabamento} onChange={v => setFNum("acabamento", v)} prefix="R$" step={0.5} />
            </div>
            <p className="text-[11px] text-[var(--gray-mid)]">Argolas, ímãs, tinta, cola, lixa — tudo além do filamento.</p>
          </Section>

          {/* Embalagem */}
          <Section title="6. Embalagem">
            {embs.length === 0 ? (
              <p className="text-[11px] text-[var(--gray-mid)]">Cadastre embalagens na aba &quot;Embalagens&quot; primeiro.</p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {embs.map(emb => (
                    <label key={emb.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.embalagensForm.includes(emb.id)}
                        onChange={() => toggleEmb(emb.id)}
                        className="accent-[var(--violet)] w-3.5 h-3.5"
                      />
                      <span className="text-[12px] text-[var(--text-primary)]">{emb.nome}</span>
                      <span className="text-[11px] text-[var(--gray-mid)] font-mono">{fmt(emb.custo)}</span>
                      {emb.descricao && <span className="text-[10px] text-[var(--gray-mid)]">· {emb.descricao}</span>}
                    </label>
                  ))}
                </div>
                {form.embalagensForm.length > 0 && (
                  <div className="w-1/2">
                    <Label>Peças por pedido</Label>
                    <NumInput value={form.pecasPorPedido} onChange={v => setFNum("pecasPorPedido", v)} suffix="un" step={1} />
                  </div>
                )}
                <p className="text-[11px] text-[var(--gray-mid)]">
                  Total embalagem: {fmt(form.embalagensForm.reduce((s, id) => s + (embs.find(e => e.id === id)?.custo ?? 0), 0))} ÷ {form.pecasPorPedido} peça(s) = <strong>{fmt(calc.embalPeca)}</strong> por peça
                </p>
              </>
            )}
          </Section>

          {/* Mão de obra */}
          <Section title="7. Mão de obra">
            <Row2>
              <div>
                <Label>Minutos de trabalho</Label>
                <NumInput value={form.minutosTrabalho} onChange={v => setFNum("minutosTrabalho", v)} suffix="min" step={5} />
              </div>
              <div>
                <Label>Valor da sua hora</Label>
                <NumInput value={form.valorHora} onChange={v => setFNum("valorHora", v)} prefix="R$" step={5} />
              </div>
            </Row2>
            <p className="text-[11px] text-[var(--gray-mid)]">
              {fmtN(form.minutosTrabalho)}min × R${fmtN(form.valorHora)}/h = <strong>{fmt(calc.mdo)}</strong>
            </p>
          </Section>

          {/* Custos fixos */}
          <Section title="8. Custos fixos rateados">
            <Row2>
              <div>
                <Label>Total fixos por mês</Label>
                <NumInput value={form.fixosMes} onChange={v => setFNum("fixosMes", v)} prefix="R$" step={10} />
              </div>
              <div>
                <Label>Peças esperadas/mês</Label>
                <NumInput value={form.pecasMes} onChange={v => setFNum("pecasMes", v)} suffix="un" step={5} />
              </div>
            </Row2>
            <p className="text-[11px] text-[var(--gray-mid)]">
              {fmt(form.fixosMes)} ÷ {form.pecasMes} peças = <strong>{fmt(calc.fixos)}</strong> por peça
            </p>
          </Section>

          {/* Taxas e margem */}
          <Section title="Taxas e margem desejada">
            <Row2>
              <div>
                <Label>Taxas (cartão / marketplace)</Label>
                <NumInput value={form.taxas} onChange={v => setFNum("taxas", v)} suffix="%" step={0.5} />
              </div>
              <div>
                <Label>Margem de lucro</Label>
                <NumInput value={form.margemDesejada} onChange={v => setFNum("margemDesejada", v)} suffix="%" step={1} />
              </div>
            </Row2>
            <p className="text-[11px] text-[var(--gray-mid)]">
              Preço = custo ÷ (1 − {fmtN(form.taxas + form.margemDesejada, 0)}%) · Fórmula que protege a margem real.
            </p>
          </Section>

          <div className="h-4" />
        </div>

        {/* Summary sidebar */}
        <div className="w-[220px] shrink-0 border-l border-[var(--gray-border)] overflow-y-auto flex flex-col bg-white">
          <div className="px-4 py-3 bg-[var(--text-primary)] text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider">Resumo</p>
          </div>

          <div className="flex-1 px-4 py-3 flex flex-col gap-0.5 text-[11px]">
            {[
              ["Material", calc.custoMat],
              ["Energia", calc.energia],
              ["Desgaste", calc.desgaste],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between py-1 border-b border-[var(--gray-border)]">
                <span className="text-[var(--text-secondary)]">{l as string}</span>
                <span className="font-mono text-[var(--text-primary)]">{fmt(v as number)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1 border-b border-[var(--gray-border)]">
              <span className="text-[var(--text-secondary)]">+ Falha ({form.taxaFalha}%)</span>
              <span className="font-mono text-[var(--text-secondary)]">+{fmt(calc.falhaAdj)}</span>
            </div>
            {[
              ["Acabamento", calc.custoTotal - calc.custoProd - calc.embalPeca - calc.mdo - calc.fixos + (calc.custoProd - calc.subProd - calc.falhaAdj)],
              ["Embalagem", calc.embalPeca],
              ["Mão de obra", calc.mdo],
              ["Fixos rateados", calc.fixos],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between py-1 border-b border-[var(--gray-border)]">
                <span className="text-[var(--text-secondary)]">{l as string}</span>
                <span className="font-mono text-[var(--text-primary)]">{fmt(v as number)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-b-2 border-[var(--gray-border)] mt-1">
              <span className="font-bold text-[var(--text-primary)]">Custo total</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{fmt(calc.custoTotal)}</span>
            </div>
          </div>

          {calc.valido ? (
            <div className="mx-3 my-3 bg-[#F0F0FF] border border-[var(--violet)] rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Preço sugerido</p>
              <p className="text-[22px] font-bold text-[var(--violet)] font-mono leading-none">{fmt(calc.preco)}</p>
              <p className="text-[10px] text-[var(--gray-mid)] mt-1.5">Lucro: {fmt(calc.lucro)}</p>
              <p className="text-[10px] text-[var(--gray-mid)]">Margem real: {fmtN(calc.margemReal, 1)}%</p>
            </div>
          ) : (
            <div className="mx-3 my-3 bg-orange-50 border border-orange-300 rounded-xl p-3 text-center">
              <p className="text-[11px] text-orange-700 font-semibold">Taxas + margem ≥ 100%</p>
            </div>
          )}

          <div className="px-3 pb-4 flex flex-col gap-2">
            <button
              onClick={onSave}
              disabled={salvando || !form.nome.trim() || salvandoRef.current}
              className="w-full py-2 bg-[var(--violet)] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editingId ? "Salvar alterações" : "Criar produto"}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const [tab, setTab] = useState<"produtos" | "materiais" | "embalagens">("produtos");
  const [mats, setMats] = useState<Material3D[]>([]);
  const [embs, setEmbs] = useState<Embalagem3D[]>([]);
  const [prods, setProds] = useState<Produto3D[]>([]);
  const [loading, setLoading] = useState(true);

  // Product editor
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProdForm>(PROD_DEFAULT);
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  // Material form
  const [matForm, setMatForm] = useState<MatForm>(MAT_DEFAULT);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [savingMat, setSavingMat] = useState(false);

  // Embalagem form
  const [embForm, setEmbForm] = useState<EmbForm>(EMB_DEFAULT);
  const [editingEmbId, setEditingEmbId] = useState<string | null>(null);
  const [savingEmb, setSavingEmb] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rM, rE, rP] = await Promise.all([
        fetch("/api/materiais3d").then(r => r.json()),
        fetch("/api/embalagens3d").then(r => r.json()),
        fetch("/api/produtos3d").then(r => r.json()),
      ]);
      setMats(Array.isArray(rM) ? rM : []);
      setEmbs(Array.isArray(rE) ? rE : []);
      setProds(Array.isArray(rP) ? rP : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Product handlers ──────────────────────────────────────────────────────

  function setF<K extends keyof ProdForm>(k: K, v: ProdForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }
  function setFNum(k: keyof ProdForm, v: string) {
    const n = parseFloat(v);
    setForm(prev => ({ ...prev, [k]: isNaN(n) ? 0 : n }));
  }

  function novoProduto() {
    setForm(PROD_DEFAULT);
    setEditingId(null);
    setShowEditor(true);
  }

  function editarProduto(p: Produto3D) {
    setForm({
      nome: p.nome,
      descricao: p.descricao || "",
      horasImpressao: p.horasImpressao, potenciaKW: p.potenciaKW, tarifaKwh: p.tarifaKwh,
      precoImpressora: p.precoImpressora, manutencaoEst: p.manutencaoEst, vidaUtilH: p.vidaUtilH,
      taxaFalha: p.taxaFalha, minutosTrabalho: p.minutosTrabalho, valorHora: p.valorHora,
      fixosMes: p.fixosMes, pecasMes: p.pecasMes, pecasPorPedido: p.pecasPorPedido,
      acabamento: p.acabamento, taxas: p.taxas, margemDesejada: p.margemDesejada,
      materiaisForm: p.materiais.length > 0
        ? p.materiais.map(m => ({ materialId: m.materialId, gramasPeca: m.gramasPeca }))
        : [{ materialId: "", gramasPeca: 50 }],
      embalagensForm: p.embalagens.map(e => e.embalagemId),
    });
    setEditingId(p.id);
    setShowEditor(true);
  }

  async function salvarProduto() {
    if (salvandoRef.current || !form.nome.trim()) return;
    salvandoRef.current = true;
    setSalvando(true);
    try {
      const calc = calcular(form, mats, embs);
      const res = await fetch(
        editingId ? `/api/produtos3d/${editingId}` : "/api/produtos3d",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, custoTotal: calc.custoTotal, precoSugerido: calc.preco }),
        }
      );
      if (res.ok) {
        await loadAll();
        setShowEditor(false);
      }
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

  async function deletarProduto(id: string) {
    if (!window.confirm("Remover produto?")) return;
    await fetch(`/api/produtos3d/${id}`, { method: "DELETE" });
    setProds(prev => prev.filter(p => p.id !== id));
  }

  // ── Material handlers ─────────────────────────────────────────────────────

  function editarMat(m: Material3D) {
    setMatForm({ nome: m.nome, precoRolo: m.precoRolo, gramasRolo: m.gramasRolo, cor: m.cor || "", marca: m.marca || "" });
    setEditingMatId(m.id);
  }
  function cancelarMat() { setMatForm(MAT_DEFAULT); setEditingMatId(null); }
  async function salvarMat() {
    if (savingMat || !matForm.nome.trim()) return;
    setSavingMat(true);
    try {
      await fetch(editingMatId ? `/api/materiais3d/${editingMatId}` : "/api/materiais3d", {
        method: editingMatId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matForm),
      });
      await loadAll();
      cancelarMat();
    } finally { setSavingMat(false); }
  }
  async function deletarMat(id: string) {
    if (!window.confirm("Remover material?")) return;
    await fetch(`/api/materiais3d/${id}`, { method: "DELETE" });
    setMats(prev => prev.filter(m => m.id !== id));
  }

  // ── Embalagem handlers ────────────────────────────────────────────────────

  function editarEmb(e: Embalagem3D) {
    setEmbForm({ nome: e.nome, custo: e.custo, descricao: e.descricao || "" });
    setEditingEmbId(e.id);
  }
  function cancelarEmb() { setEmbForm(EMB_DEFAULT); setEditingEmbId(null); }
  async function salvarEmb() {
    if (savingEmb || !embForm.nome.trim()) return;
    setSavingEmb(true);
    try {
      await fetch(editingEmbId ? `/api/embalagens3d/${editingEmbId}` : "/api/embalagens3d", {
        method: editingEmbId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embForm),
      });
      await loadAll();
      cancelarEmb();
    } finally { setSavingEmb(false); }
  }
  async function deletarEmb(id: string) {
    if (!window.confirm("Remover embalagem?")) return;
    await fetch(`/api/embalagens3d/${id}`, { method: "DELETE" });
    setEmbs(prev => prev.filter(e => e.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--violet)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>

      {/* Page header */}
      <div className="px-6 py-4 border-b border-[var(--gray-border)] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[18px] font-bold text-[var(--text-primary)]">Produtos 3D</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">Catálogo com cálculo automático de custo e preço de venda</p>
        </div>
        {tab === "produtos" && !showEditor && (
          <button
            onClick={novoProduto}
            className="px-4 py-2 bg-[var(--violet)] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo produto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--gray-border)] flex gap-0 shrink-0">
        {(["produtos", "materiais", "embalagens"] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== "produtos") setShowEditor(false); }}
            className={`px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-[var(--violet)] text-[var(--violet)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "produtos" ? `Produtos (${prods.length})` : t === "materiais" ? `Materiais · Filamentos (${mats.length})` : `Embalagens (${embs.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── PRODUTOS ── */}
        {tab === "produtos" && !showEditor && (
          <div className="flex-1 overflow-y-auto p-6">
            {prods.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🖨️</p>
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Nenhum produto cadastrado</p>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1 mb-5">Clique em &quot;Novo produto&quot; para começar</p>
                <button onClick={novoProduto} className="px-4 py-2 bg-[var(--violet)] text-white text-[12px] font-semibold rounded-lg hover:opacity-90">
                  + Novo produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {prods.map(p => {
                  const custoEmbalTotal = p.embalagens.reduce((s, e) => s + e.embalagem.custo, 0);
                  return (
                    <div
                      key={p.id}
                      onClick={() => editarProduto(p)}
                      className="bg-white border border-[var(--gray-border)] rounded-xl p-4 hover:border-[var(--violet)] hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[14px] font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--violet)] transition-colors">{p.nome}</p>
                        <button
                          onClick={e => { e.stopPropagation(); deletarProduto(p.id); }}
                          className="text-[var(--gray-mid)] hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          title="Remover"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                      {p.descricao && <p className="text-[11px] text-[var(--text-secondary)] mb-3 line-clamp-2">{p.descricao}</p>}

                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <p className="text-[9px] font-bold text-[var(--gray-mid)] uppercase tracking-wider">Custo total</p>
                          <p className="text-[13px] font-semibold text-[var(--text-primary)] font-mono">{fmt(p.custoTotal ?? 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-[var(--gray-mid)] uppercase tracking-wider">Preço sugerido</p>
                          <p className="text-[18px] font-bold text-[var(--violet)] font-mono">{fmt(p.precoSugerido ?? 0)}</p>
                        </div>
                      </div>

                      {p.materiais.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {p.materiais.map(m => (
                            <span key={m.materialId} className="text-[10px] bg-[var(--gray-light)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-medium">
                              {m.material.nome} · {fmtN(m.gramasPeca, 1)}g
                            </span>
                          ))}
                        </div>
                      )}
                      {p.embalagens.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.embalagens.map(e => (
                            <span key={e.embalagemId} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                              📦 {e.embalagem.nome}
                            </span>
                          ))}
                          {p.pecasPorPedido > 1 && (
                            <span className="text-[10px] text-[var(--gray-mid)]">÷{p.pecasPorPedido} peças</span>
                          )}
                          {custoEmbalTotal > 0 && (
                            <span className="text-[10px] text-[var(--gray-mid)]">= {fmt(custoEmbalTotal / p.pecasPorPedido)}/peça</span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 text-[10px] text-[var(--gray-mid)]">
                        {p.horasImpressao}h impressão · falha {p.taxaFalha}% · margem {p.margemDesejada}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "produtos" && showEditor && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Compact product list at top when editor is open */}
            <div className="flex flex-1 overflow-hidden">
              {/* Mini list sidebar */}
              <div className="w-[240px] shrink-0 border-r border-[var(--gray-border)] overflow-y-auto flex flex-col">
                <div className="p-3 border-b border-[var(--gray-border)]">
                  <button
                    onClick={novoProduto}
                    className="w-full py-1.5 text-[11px] font-semibold text-[var(--violet)] border border-[var(--violet)] rounded-lg hover:bg-[var(--violet-light)] transition-colors"
                  >
                    + Novo produto
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {prods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => editarProduto(p)}
                      className={`w-full text-left px-3 py-2.5 border-b border-[var(--gray-border)] hover:bg-[var(--gray-light)] transition-colors ${editingId === p.id ? "bg-[var(--violet-light)] border-l-2 border-l-[var(--violet)]" : ""}`}
                    >
                      <p className="text-[12px] font-semibold text-[var(--text-primary)] line-clamp-1">{p.nome}</p>
                      <p className="text-[11px] text-[var(--violet)] font-mono mt-0.5">{fmt(p.precoSugerido ?? 0)}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <ProductEditor
                  form={form}
                  mats={mats}
                  embs={embs}
                  editingId={editingId}
                  salvando={salvando}
                  salvandoRef={salvandoRef}
                  setF={setF}
                  setFNum={setFNum}
                  onSave={salvarProduto}
                  onCancel={() => setShowEditor(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── MATERIAIS ── */}
        {tab === "materiais" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <p className="text-[12px] text-[var(--text-secondary)] mb-5">
                Cadastre os rolos de filamento que você usa. O custo por grama é calculado automaticamente e aplicado aos produtos.
              </p>

              {/* Form */}
              <div className="bg-white border border-[var(--gray-border)] rounded-xl p-4 mb-6">
                <p className="text-[12px] font-bold text-[var(--text-primary)] mb-3">
                  {editingMatId ? "Editando material" : "Novo material"}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <Label>Nome *</Label>
                    <input
                      value={matForm.nome}
                      onChange={e => setMatForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Ex: PLA Preto 1kg — Bambu Lab"
                      className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label>Preço do rolo *</Label>
                    <NumInput value={matForm.precoRolo} onChange={v => setMatForm(f => ({ ...f, precoRolo: parseFloat(v) || 0 }))} prefix="R$" step={5} />
                  </div>
                  <div>
                    <Label>Gramas do rolo</Label>
                    <NumInput value={matForm.gramasRolo} onChange={v => setMatForm(f => ({ ...f, gramasRolo: parseFloat(v) || 1000 }))} suffix="g" step={50} />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <input value={matForm.cor} onChange={e => setMatForm(f => ({ ...f, cor: e.target.value }))} placeholder="Preto, Branco, Vermelho..."
                      className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white" />
                  </div>
                  <div>
                    <Label>Marca</Label>
                    <input value={matForm.marca} onChange={e => setMatForm(f => ({ ...f, marca: e.target.value }))} placeholder="Bambu Lab, Polymaker..."
                      className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white" />
                  </div>
                </div>
                {matForm.precoRolo > 0 && matForm.gramasRolo > 0 && (
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono mb-3">
                    → R$ {fmtN(matForm.precoRolo / matForm.gramasRolo, 4)} por grama
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={salvarMat}
                    disabled={savingMat || !matForm.nome.trim()}
                    className="px-4 py-2 bg-[var(--violet)] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {savingMat ? "Salvando..." : editingMatId ? "Salvar" : "Adicionar"}
                  </button>
                  {editingMatId && (
                    <button onClick={cancelarMat} className="px-4 py-2 text-[12px] text-[var(--text-secondary)] font-semibold hover:text-[var(--text-primary)]">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              {mats.length === 0 ? (
                <p className="text-[12px] text-[var(--text-secondary)] text-center py-8">Nenhum material cadastrado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {mats.map(m => (
                    <div key={m.id} className="bg-white border border-[var(--gray-border)] rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{m.nome}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                          R$ {fmtN(m.precoRolo)} / {fmtN(m.gramasRolo, 0)}g = R$ {fmtN(m.precoRolo / m.gramasRolo, 4)}/g
                          {m.cor && ` · ${m.cor}`}{m.marca && ` · ${m.marca}`}
                        </p>
                      </div>
                      <button onClick={() => editarMat(m)} className="text-[11px] text-[var(--violet)] font-semibold hover:underline shrink-0">Editar</button>
                      <button onClick={() => deletarMat(m.id)} className="text-[var(--gray-mid)] hover:text-red-500 transition-colors shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EMBALAGENS ── */}
        {tab === "embalagens" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <p className="text-[12px] text-[var(--text-secondary)] mb-5">
                Cadastre os itens de embalagem disponíveis. Ao criar um produto, você seleciona quais itens usar — o custo é dividido automaticamente pelo número de peças por pedido.
              </p>

              {/* Form */}
              <div className="bg-white border border-[var(--gray-border)] rounded-xl p-4 mb-6">
                <p className="text-[12px] font-bold text-[var(--text-primary)] mb-3">
                  {editingEmbId ? "Editando embalagem" : "Nova embalagem"}
                </p>
                <div className="flex flex-col gap-3 mb-3">
                  <div>
                    <Label>Nome *</Label>
                    <input
                      value={embForm.nome}
                      onChange={e => setEmbForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Ex: Caixinha kraft 10x10, Saco zip pequeno..."
                      className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Custo *</Label>
                      <NumInput value={embForm.custo} onChange={v => setEmbForm(f => ({ ...f, custo: parseFloat(v) || 0 }))} prefix="R$" step={0.10} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <input value={embForm.descricao} onChange={e => setEmbForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Papel de seda, adesivo..."
                        className="w-full border border-[var(--gray-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--violet)] bg-[var(--gray-light)] focus:bg-white" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={salvarEmb}
                    disabled={savingEmb || !embForm.nome.trim()}
                    className="px-4 py-2 bg-[var(--violet)] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {savingEmb ? "Salvando..." : editingEmbId ? "Salvar" : "Adicionar"}
                  </button>
                  {editingEmbId && (
                    <button onClick={cancelarEmb} className="px-4 py-2 text-[12px] text-[var(--text-secondary)] font-semibold hover:text-[var(--text-primary)]">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              {embs.length === 0 ? (
                <p className="text-[12px] text-[var(--text-secondary)] text-center py-8">Nenhuma embalagem cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {embs.map(e => (
                    <div key={e.id} className="bg-white border border-[var(--gray-border)] rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{e.nome}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                          {fmt(e.custo)}{e.descricao ? ` · ${e.descricao}` : ""}
                        </p>
                      </div>
                      <button onClick={() => editarEmb(e)} className="text-[11px] text-[var(--violet)] font-semibold hover:underline shrink-0">Editar</button>
                      <button onClick={() => deletarEmb(e.id)} className="text-[var(--gray-mid)] hover:text-red-500 transition-colors shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
