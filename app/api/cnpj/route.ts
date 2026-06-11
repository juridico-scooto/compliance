import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consultarCNPJ } from "@/lib/brasilapi";
import { repNoQSA } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const { cnpj, representante } = await req.json();

  if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  // Etapa 1: consultar BrasilAPI
  let data;
  try {
    data = await consultarCNPJ(cnpj);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao consultar a Receita Federal.";
    console.error("[CNPJ] BrasilAPI error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Etapa 2: calcular resultado
  const ativa = data.descricao_situacao_cadastral?.toLowerCase() === "ativa";
  const repFound = representante ? repNoQSA(data.qsa, representante) : null;

  let resultado: "OK" | "ATENCAO" | "IRREGULAR";
  if (!ativa) resultado = "IRREGULAR";
  else if (representante && !repFound) resultado = "ATENCAO";
  else resultado = "OK";

  // Etapa 3: salvar no banco
  try {
    const consulta = await prisma.consulta.create({
      data: {
        cnpj: cnpj.replace(/\D/g, ""),
        representante: representante || null,
        resultado,
        dadosJson: data as object,
        usuarioId: session.user.id,
      },
    });
    return NextResponse.json({ consulta, data, resultado, repFound });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar no banco.";
    console.error("[CNPJ] DB error:", msg);
    // Retorna o resultado mesmo sem salvar para não travar o usuário
    return NextResponse.json({ data, resultado, repFound, dbError: true });
  }
}
