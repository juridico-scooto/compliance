import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, responsavelId, prioridade, notas, prazo, titulo, descricao } = body;

  // Verificar responsável anterior para notificação
  let responsavelAnteriorId: string | null = null;
  if (responsavelId !== undefined) {
    const antes = await prisma.demanda.findUnique({ where: { id: params.id }, select: { responsavelId: true, titulo: true } });
    responsavelAnteriorId = antes?.responsavelId ?? null;
  }

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

  // Notificar novo responsável se foi atribuído
  const novoRespId = responsavelId || null;
  if (novoRespId && novoRespId !== responsavelAnteriorId && novoRespId !== session.user.id) {
    try {
      await prisma.notificacao.create({
        data: {
          usuarioId: novoRespId,
          tipo: "RESPONSAVEL",
          titulo: `Você foi atribuído a uma demanda`,
          texto: `"${demanda.titulo}" foi atribuída a você por ${session.user.name}`,
          demandaId: params.id,
        },
      });
    } catch {}
  }

  return NextResponse.json(demanda);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.demanda.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
