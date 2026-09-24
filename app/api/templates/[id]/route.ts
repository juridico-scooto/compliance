import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { titulo, categoria, situacao, assunto, conteudo, tags, variaveis } = body;

  const template = await prisma.template.update({
    where: { id: params.id },
    data: {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(categoria !== undefined ? { categoria } : {}),
      ...(situacao !== undefined ? { situacao } : {}),
      ...(assunto !== undefined ? { assunto } : {}),
      ...(conteudo !== undefined ? { conteudo } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(variaveis !== undefined ? { variaveis } : {}),
    },
    include: { autor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.template.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
