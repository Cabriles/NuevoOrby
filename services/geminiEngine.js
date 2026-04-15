// ========================================================
// GEMINI ENGINE CENTRAL DE ORBY
// ========================================================

function sanitizeAiReply(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeText(text = "") {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function countWords(text = "") {
  const clean = sanitizeAiReply(text);
  if (!clean) return 0;

  return clean.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(text = "") {
  const clean = sanitizeAiReply(text);
  if (!clean) return 0;

  return clean
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function looksLikeQuestion(text = "") {
  const clean = sanitizeAiReply(text);
  return clean.includes("?") || clean.includes("¿");
}

function containsAny(text = "", keywords = []) {
  const clean = normalizeText(text);
  return keywords.some((keyword) => clean.includes(normalizeText(keyword)));
}

function hasMinimumConsultiveShape(text = "") {
  const clean = sanitizeAiReply(text);

  if (!clean) return false;

  const words = countWords(clean);
  const paragraphs = countParagraphs(clean);

  if (words < 18) return false;

  if (
    words < 28 &&
    paragraphs < 2 &&
    !looksLikeQuestion(clean)
  ) {
    return false;
  }

  return true;
}

function isWeakOneLiner(text = "") {
  const clean = sanitizeAiReply(text);
  const words = countWords(clean);
  const paragraphs = countParagraphs(clean);

  if (!clean) return true;
  if (paragraphs > 1) return false;
  if (words >= 22) return false;

  return true;
}

function isGenericWeakReply(text = "") {
  const clean = normalizeText(text);

  if (!clean) return true;

  const weakPatterns = [
    "la oportunidad es muy",
    "es muy buena",
    "es una buena oportunidad",
    "se puede optimizar",
    "se puede mejorar",
    "conviene automatizar",
    "podria ayudarte",
    "podemos ayudarte",
    "hay una oportunidad",
    "se puede aterrizar mejor",
    "ya se puede aterrizar",
    "ya tengo una idea general"
  ];

  return weakPatterns.some((pattern) => clean.includes(pattern));
}

function isUsableAiReply(text = "") {
  const clean = sanitizeAiReply(text);

  if (!clean) return false;
  if (clean.length < 40) return false;
  if (!hasMinimumConsultiveShape(clean)) return false;
  if (isWeakOneLiner(clean)) return false;
  if (isGenericWeakReply(clean) && countWords(clean) < 35) return false;

  return true;
}

function buildGenericFallback(user = {}) {
  const interes = user?.interes_principal || "general";

  const map = {
    amazon:
      "Ya tengo una idea general de tu caso. Puedo orientarte de forma más clara con base en lo que estás buscando dentro de Amazon.",
    automatizacion:
      "Ya tengo una idea general de tu caso. Puedo orientarte mejor para aterrizar una solución útil en automatización o agentes de IA.",
    ecommerce:
      "Ya tengo una idea general de tu caso. Puedo orientarte mejor para estructurar una solución con foco comercial real.",
    importacion:
      "Ya tengo una idea general de tu caso. Puedo ayudarte a ordenar mejor el siguiente paso dentro de importación o comercio exterior.",
    atencion:
      "Ya tengo una idea general de tu consulta. Voy a orientarte de la forma más clara posible para ayudarte con tu caso."
  };

  return map[interes] || "Ya tengo una idea general de tu caso. Voy a orientarte de la forma más clara posible.";
}

function buildRetryPrompt(originalPrompt = "", weakReply = "") {
  const safePrompt = String(originalPrompt || "").trim();
  const safeWeakReply = sanitizeAiReply(weakReply);

  return `
${safePrompt}

AJUSTE OBLIGATORIO DE CALIDAD
La respuesta anterior fue insuficiente o demasiado débil:
"${safeWeakReply}"

Corrige eso ahora con estas reglas:
- No respondas con una sola frase corta.
- No des una observación genérica.
- Aporta criterio consultivo real.
- Explica qué conviene hacer y por qué.
- Da una recomendación más aterrizada.
- Si corresponde, menciona brevemente cómo se implementaría.
- Mantén el tono comercial y profesional.
- No repitas literal la respuesta anterior.
- Responde con más sustancia y claridad.
  `.trim();
}

// ========================================================
// FACTORY DEL MOTOR
// ========================================================
function createGeminiEngine({
  modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  apiKey = process.env.GEMINI_API_KEY,
  timeoutMs = 20000,
  temperature = 0.5,
  maxOutputTokens = 700
} = {}) {
  async function askGemini(prompt = "") {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada.");
    }

    if (!prompt || String(prompt).trim().length < 8) {
      throw new Error("Prompt vacío o insuficiente.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: String(prompt).trim()
                  }
                ]
              }
            ],
            generationConfig: {
              temperature,
              maxOutputTokens
            }
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      const aiText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("\n")
          .trim() || "";

      return sanitizeAiReply(aiText);
    } finally {
      clearTimeout(timer);
    }
  }

  async function getGeminiReplyWithFallback(prompt, user = {}, fallbackReply = "") {
    const safeFallback = sanitizeAiReply(
      fallbackReply || buildGenericFallback(user)
    );

    try {
      const aiReply = await askGemini(prompt);

      if (isUsableAiReply(aiReply)) {
        return aiReply;
      }

      const retryPrompt = buildRetryPrompt(prompt, aiReply);
      const retriedReply = await askGemini(retryPrompt);

      if (isUsableAiReply(retriedReply)) {
        return retriedReply;
      }

      return safeFallback;
    } catch (error) {
      console.error("Gemini fallback activado:", error.message);
      return safeFallback;
    }
  }

  return {
    askGemini,
    getGeminiReplyWithFallback
  };
}

// ========================================================
// INSTANCIA POR DEFECTO
// ========================================================
const geminiEngine = createGeminiEngine();

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  sanitizeAiReply,
  isUsableAiReply,
  buildGenericFallback,
  createGeminiEngine,
  askGemini: geminiEngine.askGemini,
  getGeminiReplyWithFallback: geminiEngine.getGeminiReplyWithFallback
};