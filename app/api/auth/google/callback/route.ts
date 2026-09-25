import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect("https://compliance-pearl.vercel.app/admin?gmail=erro");
  }

  const redirectUri = "https://compliance-pearl.vercel.app/api/auth/google/callback";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    return NextResponse.redirect("https://scooto-compliance.vercel.app/admin?gmail=erro");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      gmailRefreshToken: tokens.refresh_token,
      gmailEmail: tokens.id_token
        ? JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64").toString()).email
        : null,
    },
  });

  return NextResponse.redirect("https://compliance-pearl.vercel.app/triagem?gmail=ok");
}
