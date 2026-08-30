import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const MAX_BODY_BYTES = 16_384;

function clientKey(request: Request, userId: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${userId}:${forwarded || "unknown"}`;
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function verifyFirebaseToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) return null;
  const data = await response.json();
  const account = data?.users?.[0];
  if (!account?.localId || account.emailVerified !== true) return null;
  return String(account.localId);
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    }

    const authorization = request.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!idToken) {
      return NextResponse.json({ error: "Debes iniciar sesión para usar LifeBoost AI." }, { status: 401 });
    }

    const userId = await verifyFirebaseToken(idToken);
    if (!userId) {
      return NextResponse.json({ error: "La sesión no es válida o el correo no está verificado." }, { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
    }

    const key = clientKey(request, userId);
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (current.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Has alcanzado el límite temporal de consultas. Inténtalo de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } },
      );
    } else {
      current.count += 1;
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "La pregunta no puede superar 4000 caracteres." }, { status: 400 });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return NextResponse.json({ error: "Falta configurar OPENAI_API_KEY en Vercel." }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model,
        instructions:
          "Eres LifeBoost AI, un asistente financiero personal. Responde en español de forma clara, práctica y responsable. No prometas rendimientos ni des asesoría financiera profesional. Ayuda a organizar presupuesto, ahorro, deudas y metas.",
        input: message,
      }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      const errorCode = data?.error?.code;
      console.error("OpenAI API error", data);

      if (errorCode === "insufficient_quota" || errorCode === "credit_balance_exhausted") {
        return NextResponse.json(
          {
            error:
              "LifeBoost AI no puede responder porque la cuenta de OpenAI no tiene créditos disponibles. Añade saldo a la cuenta asociada a OPENAI_API_KEY y vuelve a intentarlo.",
            code: "credit_balance_exhausted",
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: "OpenAI no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos." },
        { status: response.status >= 400 && response.status < 500 ? 400 : 502 },
      );
    }

    return NextResponse.json({ reply: data.output_text || "No recibí una respuesta de la IA." });
  } catch (error) {
    console.error("LifeBoost AI error", error);
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
