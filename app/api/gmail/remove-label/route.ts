import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function getLabelId(accessToken: string, labelName: string): Promise<string | null> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  const label = (data.labels ?? []).find(
    (l: { name: string; id: string }) => l.name.toLowerCase() === labelName.toLowerCase()
  );
  return label?.id ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { messageId, labelName = "demanda" } = await req.json();
  if (!messageId) return NextResponse.json({ error: "messageId obrigatório" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.gmailRefreshToken) return NextResponse.json({ error: "Gmail não conectado" }, { status: 400 });

  try {
    const accessToken = await getAccessToken(user.gmailRefreshToken);
    const labelId = await getLabelId(accessToken, labelName);
    if (!labelId) return NextResponse.json({ ok: true });

    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ removeLabelIds: [labelId] }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao remover etiqueta" }, { status: 500 });
  }
}
