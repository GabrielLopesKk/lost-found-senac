import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { CATEGORY_IDS, COLOR_IDS } from "@/app/ai/photo-constants";

export type PhotoAnalysis = {
  source: "ai";
  category: string;
  color: string;
  keywords: string[];
  characteristics: string[];
  sensitiveWarning: boolean;
  note: string;
};

export const analyzePhoto = createServerFn({ method: "POST" })
  .inputValidator((input: { dataUrl: string }) => {
    if (typeof input?.dataUrl !== "string" || !input.dataUrl.startsWith("data:image/jpeg;base64,"))
      throw new Error("Imagem inválida.");
    if (input.dataUrl.length > 4_000_000) throw new Error("Imagem muito grande.");
    return { dataUrl: input.dataUrl };
  })
  .handler(async ({ data }): Promise<{ ok: true; analysis: PhotoAnalysis } | { ok: false; error: string }> => {
    const prompt = `Você analisa fotos de objetos perdidos em um campus. Responda SOMENTE com JSON:
{"category": um de ${JSON.stringify(CATEGORY_IDS)}, "color": um de ${JSON.stringify(COLOR_IDS)},
"keywords": até 5 palavras-chave curtas em português (ex.: "garrafa","térmica","adesivo"),
"characteristics": até 4 frases curtas descrevendo detalhes visíveis,
"sensitive": true se a foto mostrar rosto, documento ou cartão}`;
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: data.dataUrl, detail: "low" },
            ],
          },
        ],
      });
      const text = extractText(res);
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<string, unknown>;
      const category = CATEGORY_IDS.includes(String(json["category"])) ? String(json["category"]) : "outros";
      const color = COLOR_IDS.includes(String(json["color"])) ? String(json["color"]) : "";
      const list = (v: unknown, n: number) =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, 80)).slice(0, n) : [];
      return {
        ok: true,
        analysis: {
          source: "ai",
          category,
          color,
          keywords: list(json["keywords"], 5),
          characteristics: list(json["characteristics"], 4),
          sensitiveWarning: json["sensitive"] === true || category === "documentos",
          note: "Sugestões geradas por IA a partir da foto. Revise antes de usar.",
        },
      };
    } catch (err) {
      if (err instanceof GatewayError) console.error("analyzePhoto gateway error", err.code, err.ids);
      else console.error("analyzePhoto failed", err);
      return { ok: false, error: "Não foi possível analisar a foto agora." };
    }
  });

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}
