import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consultarCNPJ } from "@/lib/brasilapi";
import { repNoQSA } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { runComplianceChecks } from "@/lib/compliance";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });

  const { cnpj, representante, cpfRepresentante } = await req.json();
  if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  // Consulta CNPJ + verificações de compliance em paralelo
  let data;
  try {
    data = await consultarCNPJ(cnpj);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao consultar a Receita Federal.";
    console.error("[CNPJ] erro:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const compliance = await runComplianceChecks(cnpj, representante || undefined, cpfRepresentante || undefined);

  const ativa = data.descricao_situacao_cadastral?.toLowerCase() === "ativa";
  const repFound = representante ? repNoQSA(data.qsa, representante) : null;

  // Resultado considera também CEIS/CNEP
  const temSancao = compliance.ceis.encontrado || compliance.cnep.encontrado || compliance.ceisRep.encontrado;

  let resultado: "OK" | "ATENCAO" | "IRREGULAR";
  if (!ativa) resultado = "IRREGULAR";
  else if (temSancao || compliance.pep.encontrado) resultado = "ATENCAO";
  else if (representante && !repFound) resultado = "ATENCAO";
  else resultado = "OK";

  try {
    const consulta = await prisma.consulta.create({
      data: {
        cnpj: cnpj.replace(/\D/g, ""),
        representante: representante || null,
        resultado,
        dadosJson: { ...data, compliance } as object,
        usuarioId: session.user.id,
      },
    });
    return NextResponse.json({ consulta, data, resultado, repFound, compliance });
  } catch (e: unknown) {
    console.error("[CNPJ] DB error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ data, resultado, repFound, compliance, dbError: true });
  }
}
