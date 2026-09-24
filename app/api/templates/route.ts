import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const busca = searchParams.get("busca");

  const templates = await prisma.template.findMany({
    where: {
      ...(categoria ? { categoria } : {}),
      ...(busca ? {
        OR: [
          { titulo: { contains: busca, mode: "insensitive" } },
          { situacao: { contains: busca, mode: "insensitive" } },
          { conteudo: { contains: busca, mode: "insensitive" } },
          { tags: { hasSome: [busca] } },
        ],
      } : {}),
    },
    include: { autor: { select: { id: true, name: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { titulo, categoria, situacao, assunto, conteudo, tags, variaveis, cc } = body;

  if (!titulo || !categoria || !conteudo) {
    return NextResponse.json({ error: "título, categoria e conteúdo são obrigatórios" }, { status: 400 });
  }

  const template = await prisma.template.create({
    data: {
      titulo,
      categoria,
      situacao: situacao ?? null,
      assunto: assunto ?? null,
      conteudo,
      tags: tags ?? [],
      variaveis: variaveis ?? [],
      cc: cc ?? [],
      autorId: session.user.id,
    },
    include: { autor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(template, { status: 201 });
}
