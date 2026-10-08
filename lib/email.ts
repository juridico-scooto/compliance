import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Scooto Jurídico <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL?.replace("http://localhost:3000", "https://scooto-juridico.vercel.app") ?? "https://scooto-juridico.vercel.app";

export async function enviarEmailNotificacao({
  para,
  titulo,
  texto,
  demandaId,
}: {
  para: string;
  titulo: string;
  texto?: string | null;
  demandaId?: string | null;
}) {
  try {
    const link = demandaId ? `${APP_URL}/demandas?demanda=${demandaId}` : `${APP_URL}/home`;

    await resend.emails.send({
      from: FROM,
      to: para,
      subject: titulo,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1E1E2E;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 900; color: #5B2EFF; letter-spacing: -0.5px;">scooto</span>
            <span style="color: #CBD5E1; margin: 0 8px;">|</span>
            <span style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px;">Jurídico</span>
          </div>

          <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 8px;">${titulo}</h2>
          ${texto ? `<p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.6;">${texto}</p>` : ""}

          <a href="${link}" style="display: inline-block; background: #5B2EFF; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 13px; font-weight: 700;">
            Ver no sistema →
          </a>

          <p style="font-size: 11px; color: #94A3B8; margin-top: 32px;">
            Você recebeu este e-mail porque está no sistema Scooto Jurídico.<br/>
            Acesse <a href="${APP_URL}" style="color: #5B2EFF;">${APP_URL}</a>
          </p>
        </div>
      `,
    });
  } catch {
    // e-mail falha silenciosamente — não interrompe o fluxo principal
  }
}
