import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Falta configurar OPENAI_API_KEY en Vercel." }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
