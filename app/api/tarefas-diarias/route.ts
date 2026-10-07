import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function hojeUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET — retorna tarefas ativas com status de hoje
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const hoje = hojeUTC();

  const tarefas = await prisma.tarefaDiaria.findMany({
    where: { ativa: true },
    orderBy: { ordem: "asc" },
    include: {
      registros: {
        where: { data: hoje },
        include: { usuario: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(tarefas.map(t => ({
    id: t.id,
    nome: t.nome,
    descricao: t.descricao,
    concluidaHoje: t.registros.length > 0,
    concluidaPor: t.registros[0]?.usuario ?? null,
    concluidaEm: t.registros[0]?.criadoEm ?? null,
  })));
}

// POST — marca tarefa como concluída hoje (ou cria nova tarefa se admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  // Criar nova tarefa (apenas admin)
  if (body.action === "criar") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "Apenas admins" }, { status: 403 });
    const ultima = await prisma.tarefaDiaria.findFirst({ orderBy: { ordem: "desc" } });
    const tarefa = await prisma.tarefaDiaria.create({
      data: { nome: body.nome, descricao: body.descricao ?? null, ordem: (ultima?.ordem ?? 0) + 1 },
    });
    return NextResponse.json(tarefa);
  }

  // Marcar como concluída hoje
  const { tarefaId } = body;
  if (!tarefaId) return NextResponse.json({ error: "tarefaId obrigatório" }, { status: 400 });

  const hoje = hojeUTC();

  const registro = await prisma.registroDiario.upsert({
    where: { tarefaId_data: { tarefaId, data: hoje } },
    update: { usuarioId: session.user.id },
    create: { tarefaId, usuarioId: session.user.id, data: hoje },
    include: { usuario: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, concluidaPor: registro.usuario, concluidaEm: registro.criadoEm });
}

// PATCH — edita nome/descrição da tarefa (apenas admin)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Apenas admins" }, { status: 403 });

  const { id, nome, descricao } = await req.json();
  if (!id || !nome?.trim()) return NextResponse.json({ error: "id e nome obrigatórios" }, { status: 400 });

  const tarefa = await prisma.tarefaDiaria.update({
    where: { id },
    data: { nome: nome.trim(), descricao: descricao?.trim() || null },
  });

  return NextResponse.json(tarefa);
}

// DELETE — remove conclusão de hoje (desfazer) ou desativa tarefa (admin)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const hoje = hojeUTC();

  if (body.action === "desativar") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "Apenas admins" }, { status: 403 });
    await prisma.tarefaDiaria.update({ where: { id: body.tarefaId }, data: { ativa: false } });
    return NextResponse.json({ ok: true });
  }

  await prisma.registroDiario.deleteMany({
    where: { tarefaId: body.tarefaId, data: hoje },
  });
  return NextResponse.json({ ok: true });
}
