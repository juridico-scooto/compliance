import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consultarCNPJ } from "@/lib/brasilapi";
import { repNoQSA } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { cnpj, representante } = await req.json();

  if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  try {
    const data = await consultarCNPJ(cnpj);

    const ativa = data.descricao_situacao_cadastral?.toLowerCase() === "ativa";
    const repFound = representante ? repNoQSA(data.qsa, representante) : null;

    let resultado: "OK" | "ATENCAO" | "IRREGULAR";
    if (!ativa) resultado = "IRREGULAR";
    else if (representante && !repFound) resultado = "ATENCAO";
    else resultado = "OK";

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
    const msg = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
