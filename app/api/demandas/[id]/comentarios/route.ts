import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const comentarios = await prisma.comentario.findMany({
    where: { demandaId: params.id },
    include: { autor: { select: { id: true, name: true } } },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json(comentarios);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { texto } = await req.json();
  if (!texto?.trim()) return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });

  const demanda = await prisma.demanda.findUnique({ where: { id: params.id }, select: { titulo: true } });
  if (!demanda) return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });

  const comentario = await prisma.comentario.create({
    data: { demandaId: params.id, autorId: session.user.id, texto },
    include: { autor: { select: { id: true, name: true } } },
  });

  // Notificar usuários @mencionados
  const mencoes = texto.match(/@([\wÀ-ÿ]+(?:\s+[\wÀ-ÿ]+)?)/g)?.map((m: string) => m.slice(1).trim()) ?? [];
  for (const mencao of mencoes) {
    const usuario = await prisma.user.findFirst({
      where: { name: { contains: mencao, mode: "insensitive" } },
      select: { id: true },
    });
    if (usuario && usuario.id !== session.user.id) {
      await prisma.notificacao.create({
        data: {
          usuarioId: usuario.id,
          tipo: "MENCAO",
          titulo: `${session.user.name} mencionou você`,
          texto: `Na demanda "${demanda.titulo}": ${texto.slice(0, 100)}${texto.length > 100 ? "…" : ""}`,
          demandaId: params.id,
        },
      });
    }
  }

  return NextResponse.json(comentario, { status: 201 });
}
