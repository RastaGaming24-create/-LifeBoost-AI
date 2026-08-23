import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "El asistente está preparado, pero todavía falta configurar OPENAI_API_KEY en las variables de entorno del servidor." });
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: "Eres LifeBoost AI, un asistente financiero personal. Responde en español de forma clara, práctica y responsable. No prometas rendimientos ni des asesoría financiera profesional. Ayuda a organizar presupuesto, ahorro, deudas y metas.",
      input: message,
    });
    return NextResponse.json({ reply: response.output_text });
  } catch (error) {
    console.error("LifeBoost AI error", error);
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
