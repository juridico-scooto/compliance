import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailNotificacao } from "@/lib/email";

const CAMPO_LABEL: Record<string, string> = {
  status: "Status",
  substatus: "Sub-status",
  responsavelId: "Responsável",
  prioridade: "Prioridade",
  prazo: "Prazo interno",
  titulo: "Título",
  descricao: "Descrição",
  notas: "Notas internas",
};

function fmtValor(campo: string, valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (campo === "prazo") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? valor : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }
  return valor;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, substatus, responsavelId, prioridade, notas, prazo, titulo, descricao } = body;

  // Buscar estado anterior para histórico e notificação
  const antes = await prisma.demanda.findUnique({
    where: { id: params.id },
    select: {
      status: true, substatus: true, responsavelId: true, responsavel: { select: { name: true } },
      prioridade: true, prazo: true, titulo: true, descricao: true, notas: true,
    },
  });

  const demanda = await prisma.demanda.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(substatus !== undefined ? { substatus: substatus || null } : {}),
      ...(responsavelId !== undefined ? { responsavelId: responsavelId || null } : {}),
      ...(prioridade !== undefined ? { prioridade } : {}),
      ...(notas !== undefined ? { notas } : {}),
      ...(prazo !== undefined ? { prazo: prazo ? new Date(prazo) : null } : {}),
      ...(titulo !== undefined ? { titulo } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
    },
    include: {
      responsavel: { select: { id: true, name: true } },
    },
  });

  // Registrar histórico de cada campo alterado
  try {
    const registros: { demandaId: string; usuarioId: string; campo: string; valorAntes: string | null; valorDepois: string | null }[] = [];

    if (status !== undefined && status !== antes?.status) {
      registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "status", valorAntes: antes?.status ?? null, valorDepois: status });
    }
    if (substatus !== undefined && substatus !== antes?.substatus) {
      registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "substatus", valorAntes: antes?.substatus ?? null, valorDepois: substatus || null });
    }
    if (responsavelId !== undefined && responsavelId !== antes?.responsavelId) {
      const novoResp = responsavelId ? await prisma.user.findUnique({ where: { id: responsavelId }, select: { name: true } }) : null;
      registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "responsavelId", valorAntes: antes?.responsavel?.name ?? null, valorDepois: novoResp?.name ?? null });
    }
    if (prioridade !== undefined && prioridade !== antes?.prioridade) {
      registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "prioridade", valorAntes: antes?.prioridade ?? null, valorDepois: prioridade });
    }
    if (prazo !== undefined) {
      const antesStr = antes?.prazo ? antes.prazo.toISOString() : null;
      const depoisStr = prazo || null;
      if (antesStr !== depoisStr) {
        registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "prazo", valorAntes: antesStr, valorDepois: depoisStr });
      }
    }
    if (titulo !== undefined && titulo !== antes?.titulo) {
      registros.push({ demandaId: params.id, usuarioId: session.user.id, campo: "titulo", valorAntes: antes?.titulo ?? null, valorDepois: titulo });
    }

    if (registros.length > 0) {
      await prisma.historicoDemanda.createMany({ data: registros });
    }
  } catch {}

  // Notificar novo responsável se foi atribuído
  const novoRespId = responsavelId || null;
  const responsavelAnteriorId = antes?.responsavelId ?? null;
  if (novoRespId && novoRespId !== responsavelAnteriorId && novoRespId !== session.user.id) {
    try {
      const novoResp = await prisma.user.findUnique({ where: { id: novoRespId }, select: { email: true } });
      await prisma.notificacao.create({
        data: {
          usuarioId: novoRespId,
          tipo: "RESPONSAVEL",
          titulo: `Você foi atribuído a uma demanda`,
          texto: `"${demanda.titulo}" foi atribuída a você por ${session.user.name}`,
          demandaId: params.id,
        },
      });
      if (novoResp?.email) {
        await enviarEmailNotificacao({
          para: novoResp.email,
          titulo: `Você foi atribuído a uma demanda`,
          texto: `"${demanda.titulo}" foi atribuída a você por ${session.user.name}`,
          demandaId: params.id,
        });
      }
    } catch {}
  }

  return NextResponse.json(demanda);
}

// Exportar label para uso no frontend
export { CAMPO_LABEL, fmtValor };

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.demanda.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
