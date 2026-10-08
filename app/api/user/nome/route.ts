import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome } = await req.json();
  if (!nome || nome.trim().length < 2) {
    return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: nome.trim() },
  });

  return NextResponse.json({ ok: true });
}
