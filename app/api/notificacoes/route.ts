import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const notificacoes = await prisma.notificacao.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  return NextResponse.json(notificacoes);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, lerTodas } = body;

  if (lerTodas) {
    await prisma.notificacao.updateMany({
      where: { usuarioId: session.user.id, lida: false },
      data: { lida: true },
    });
  } else if (id) {
    await prisma.notificacao.updateMany({
      where: { id, usuarioId: session.user.id },
      data: { lida: true },
    });
  }

  return NextResponse.json({ ok: true });
}
