import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, responsavelId, prioridade, notas, prazo, titulo, descricao } = body;

  const demanda = await prisma.demanda.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(responsavelId !== undefined ? { responsavelId: responsavelId || null } : {}),
      ...(prioridade !== undefined ? { prioridade } : {}),
      ...(notas !== undefined ? { notas } : {}),
      ...(prazo !== undefined ? { prazo: prazo ? new Date(prazo) : null } : {}),
      ...(titulo !== undefined ? { titulo } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
    },
    include: { responsavel: { select: { id: true, name: true } } },
  });

  return NextResponse.json(demanda);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.demanda.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
