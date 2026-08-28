import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { trimestre } = await req.json().catch(() => ({}));

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "juridico-scooto/compliance";

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN não configurado nas variáveis de ambiente." },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/import-pgfn.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { trimestre: trimestre ?? "" },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `GitHub API: ${res.status} — ${body}` }, { status: 500 });
  }

  // Salva log da importação
  const count = await prisma.pgfnDevedor.count();

  return NextResponse.json({
    ok: true,
    mensagem: "Workflow disparado com sucesso. A importação começa em instantes no GitHub Actions.",
    registrosAtual: count,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const count = await prisma.pgfnDevedor.count();
  return NextResponse.json({ registros: count });
}
