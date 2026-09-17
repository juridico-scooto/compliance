import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const responsavelId = searchParams.get("responsavel");

  const demandas = await prisma.demanda.findMany({
    where: {
      ...(status ? { status: status as "PENDENTE" | "EM_ANDAMENTO" | "AGUARDANDO" | "CONCLUIDO" | "CANCELADO" } : {}),
      ...(responsavelId ? { responsavelId } : {}),
    },
    include: { responsavel: { select: { id: true, name: true } } },
    orderBy: [{ prioridade: "desc" }, { criadoEm: "desc" }],
  });

  return NextResponse.json(demandas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { titulo, descricao, tipo, prioridade, solicitante, setor, operacao, cliente, anexos, responsavelId, prazo } = body;

  if (!titulo || !descricao || !tipo || !solicitante) {
    return NextResponse.json({ error: "Campos obrigatórios: titulo, descricao, tipo, solicitante" }, { status: 400 });
  }

  const demanda = await prisma.demanda.create({
    data: {
      titulo,
      descricao,
      tipo,
      prioridade: prioridade ?? "NORMAL",
      solicitante,
      setor: setor ?? null,
      operacao: operacao ?? null,
      cliente: cliente ?? null,
      anexos: anexos ?? [],
      responsavelId: responsavelId ?? null,
      prazo: prazo ? new Date(prazo) : null,
    },
  });

  return NextResponse.json(demanda, { status: 201 });
}
