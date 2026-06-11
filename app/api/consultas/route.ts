import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resultado = searchParams.get("resultado");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const where = resultado ? { resultado: resultado as "OK" | "ATENCAO" | "IRREGULAR" } : {};

  const [consultas, total] = await Promise.all([
    prisma.consulta.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { usuario: { select: { name: true } } },
    }),
    prisma.consulta.count({ where }),
  ]);

  return NextResponse.json({ consultas, total, page, pageSize });
}
