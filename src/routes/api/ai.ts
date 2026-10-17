import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AiRequestSchema = z.object({
  prompt: z.string().min(1).max(50000),
  systemInstruction: z.string().max(10000).optional(),
});

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

// In-memory sliding window rate limiter (max 20 requests per minute per client)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientKey);

  // Clean up expired records occasionally
  if (rateLimitMap.size > 500) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const origin = request.headers.get("origin") || request.headers.get("referer") || "";
        const host = request.headers.get("host") || "";
        if (origin && !origin.includes(host) && !origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("montanha")) {
          return new Response(JSON.stringify({ error: "Origem não autorizada para uso da IA." }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }

        const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
        if (!checkRateLimit(clientIp)) {
          return new Response(
            JSON.stringify({
              error: "Limite de requisições excedido. Aguarde um minuto antes de solicitar nova geração com IA.",
            }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", "Retry-After": "60" },
            }
          );
        }

        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error:
                "Chave de API Gemini não configurada no servidor. Defina a variável de ambiente GEMINI_API_KEY.",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          const rawBody = await request.json();
          const parsed = AiRequestSchema.safeParse(rawBody);
          if (!parsed.success) {
            return new Response(
              JSON.stringify({
                error: "Parâmetros de requisição inválidos.",
                details: parsed.error.issues,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const { prompt, systemInstruction } = parsed.data;

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

          const requestBody: Record<string, unknown> = {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          };

          if (systemInstruction) {
            requestBody["systemInstruction"] = {
              parts: [{ text: systemInstruction }],
            };
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errData = (await response.json().catch(() => ({}))) as GeminiResponse;
            const message = errData?.error?.message || "Erro na resposta da API Gemini.";
            console.error("[Gemini API Server Error]:", message);
            return new Response(
              JSON.stringify({
                error: "Falha na comunicação com o serviço de IA.",
              }),
              {
                status: 502,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const data = (await response.json()) as GeminiResponse;
          const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!outputText) {
            return new Response(
              JSON.stringify({ error: "A IA não retornou conteúdo textual." }),
              {
                status: 502,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          return new Response(JSON.stringify({ text: outputText.trim() }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: unknown) {
          console.error("[AI Route Error]:", err);
          return new Response(
            JSON.stringify({ error: "Erro interno no processamento da IA." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
