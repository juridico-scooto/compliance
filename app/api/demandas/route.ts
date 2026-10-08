import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailNotificacao } from "@/lib/email";

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { titulo, descricao, tipo, prioridade, solicitante, emailSolicitante, setor, operacao, cliente, anexos, responsavelId, prazo, prazoSolicitado } = body;

  if (!titulo || !tipo || !solicitante) {
    return NextResponse.json({ error: "Campos obrigatórios: titulo, tipo, solicitante" }, { status: 400 });
  }

  const demanda = await prisma.demanda.create({
    data: {
      titulo,
      descricao,
      tipo,
      prioridade: prioridade ?? "NORMAL",
      solicitante,
      emailSolicitante: emailSolicitante ?? null,
      setor: setor ?? null,
      operacao: operacao ?? null,
      cliente: cliente ?? null,
      anexos: anexos ?? [],
      responsavelId: responsavelId ?? null,
      prazo: prazo ? new Date(prazo) : null,
      prazoSolicitado: prazoSolicitado ? new Date(prazoSolicitado) : null,
    },
  });

  // Notificar apenas o responsável (sininho + e-mail), se diferente de quem criou
  try {
    if (responsavelId && responsavelId !== session.user.id) {
      const responsavel = await prisma.user.findUnique({ where: { id: responsavelId }, select: { email: true } });
      await prisma.notificacao.create({
        data: {
          usuarioId: responsavelId,
          tipo: "NOVA_DEMANDA",
          titulo: `Nova demanda atribuída a você: ${titulo}`,
          texto: `Solicitante: ${solicitante}`,
          demandaId: demanda.id,
        },
      });
      if (responsavel?.email) {
        await enviarEmailNotificacao({
          para: responsavel.email,
          titulo: `Nova demanda atribuída a você: ${titulo}`,
          texto: `Solicitante: ${solicitante}`,
          demandaId: demanda.id,
        });
      }
    }
  } catch {}

  return NextResponse.json(demanda, { status: 201 });
}
