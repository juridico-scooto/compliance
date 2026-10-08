import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.substatusConfig.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { nome, cor, corTexto } = await req.json();
  if (!nome) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });
  const ultima = await prisma.substatusConfig.findFirst({ orderBy: { ordem: "desc" } });
  const item = await prisma.substatusConfig.create({
    data: { nome, cor: cor ?? "#E2E8F0", corTexto: corTexto ?? "#475569", ordem: (ultima?.ordem ?? 0) + 1 },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id, nome, cor, corTexto } = await req.json();
  const item = await prisma.substatusConfig.update({ where: { id }, data: { nome, cor, corTexto } });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await req.json();
  await prisma.substatusConfig.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
