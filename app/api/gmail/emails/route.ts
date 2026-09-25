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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.gmailRefreshToken) {
    return NextResponse.json({ conectado: false, emails: [] });
  }

  try {
    const accessToken = await getAccessToken(user.gmailRefreshToken);

    const labelName = req.nextUrl.searchParams.get("label") ?? "demanda";
    const labelId = await getLabelId(accessToken, labelName);

    if (!labelId) {
      return NextResponse.json({ conectado: true, emails: [], labelNotFound: true, labelName });
    }

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${labelId}&maxResults=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json();
    const messages = listData.messages ?? [];

    const emails = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const msgData = await msgRes.json();

        const headers = msgData.payload?.headers ?? [];
        const get = (name: string) =>
          headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

        const subject = get("Subject");
        const from = get("From");
        const date = get("Date");

        // Extract body text
        let body = "";
        const parts = msgData.payload?.parts ?? [];
        const textPart =
          parts.find((p: { mimeType: string }) => p.mimeType === "text/plain") ??
          (msgData.payload?.mimeType === "text/plain" ? msgData.payload : null);

        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        } else {
          // try html part
          const htmlPart = parts.find((p: { mimeType: string }) => p.mimeType === "text/html");
          if (htmlPart?.body?.data) {
            const html = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
            body = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }
        }

        // Extract sender name and email
        const fromMatch = from.match(/^(.*?)\s*<(.+)>$/);
        const remetente = fromMatch ? fromMatch[1].replace(/"/g, "").trim() : from;
        const emailRemetente = fromMatch ? fromMatch[2] : from;

        return {
          id: msg.id,
          assunto: subject,
          remetente,
          emailRemetente,
          data: date,
          corpo: body.slice(0, 2000),
        };
      })
    );

    return NextResponse.json({ conectado: true, emails, gmailEmail: user.gmailEmail });
  } catch {
    return NextResponse.json({ conectado: false, emails: [], erro: "Falha ao buscar e-mails" });
  }
}
