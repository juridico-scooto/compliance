import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const historico = await prisma.historicoDemanda.findMany({
    where: { demandaId: params.id },
    orderBy: { criadoEm: "desc" },
    include: { usuario: { select: { name: true } } },
  });

  return NextResponse.json(historico);
}
