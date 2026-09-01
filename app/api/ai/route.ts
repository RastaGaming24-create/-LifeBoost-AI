import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../lib/firebase-admin";

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
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

async function financialContext(userId: string) {
  const snapshot = await adminDb().collection("users").doc(userId).collection("transactions").limit(300).get();
  const transactions = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      description: String(data.description || ""),
      amount: Number(data.amount || 0),
      type: data.type === "income" ? "income" : "expense",
      category: String(data.category || "Otros"),
      date: String(data.date || ""),
      source: data.source === "plaid" ? "bank" : "manual",
    };
  });
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of transactions.filter(t => t.type === "expense")) byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  return { income, expenses, balance: income - expenses, byCategory, transactionCount: transactions.length, transactions: transactions.slice(-100) };
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    const decoded = await verifyBearerToken(request);
    if (!decoded || decoded.email_verified !== true) return NextResponse.json({ error: "La sesión no es válida o el correo no está verificado." }, { status: 401 });

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });

    const key = clientKey(request, decoded.uid);
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    else if (current.count >= MAX_REQUESTS) return NextResponse.json({ error: "Has alcanzado el límite temporal de consultas. Inténtalo de nuevo más tarde." }, { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } });
    else current.count += 1;

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
    if (message.length > 4000) return NextResponse.json({ error: "La pregunta no puede superar 4000 caracteres." }, { status: 400 });

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) return NextResponse.json({ error: "Falta configurar OPENAI_API_KEY en Vercel." }, { status: 500 });

    const finances = await financialContext(decoded.uid);
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAIKey}` },
      body: JSON.stringify({
        model,
        instructions: "Eres LifeBoost AI, un asistente financiero personal. Responde en español de forma clara, práctica y responsable. Usa los datos financieros autorizados del usuario para detectar patrones, explicar ahorro y presupuesto y proponer acciones realistas. No prometas ganancias rápidas ni rendimientos garantizados, no inventes datos y aclara cuando falte información. Para inversiones, ofrece información educativa y señala riesgos. Los movimientos pueden venir de un banco sincronizado o de entrada manual.",
        input: `Datos financieros actuales del usuario (privados):\n${JSON.stringify(finances)}\n\nPregunta del usuario:\n${message}`,
      }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error", data);
      const errorCode = data?.error?.code;
      if (errorCode === "insufficient_quota" || errorCode === "credit_balance_exhausted") return NextResponse.json({ error: "LifeBoost AI no puede responder porque la cuenta de OpenAI no tiene créditos disponibles.", code: "credit_balance_exhausted" }, { status: 503 });
      return NextResponse.json({ error: "OpenAI no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos." }, { status: response.status >= 400 && response.status < 500 ? 400 : 502 });
    }

    return NextResponse.json({ reply: data.output_text || "No recibí una respuesta de la IA." });
  } catch (error) {
    console.error("LifeBoost AI error", error);
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
