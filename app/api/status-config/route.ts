import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const statuses = await prisma.statusConfig.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json(statuses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, nome, cor, corTexto, ordem } = await req.json();
  if (!id || !nome) return NextResponse.json({ error: "id e nome obrigatórios" }, { status: 400 });

  const status = await prisma.statusConfig.upsert({
    where: { id },
    update: { nome, cor, corTexto, ordem },
    create: { id, nome, cor: cor ?? "#E2E8F0", corTexto: corTexto ?? "#475569", ordem: ordem ?? 99 },
  });
  return NextResponse.json(status);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  await prisma.statusConfig.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
