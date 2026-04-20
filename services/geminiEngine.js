// ========================================================
// GEMINI ENGINE CENTRAL DE ORBY
// AJUSTADO PARA RESPUESTAS MÁS CORTAS, ÚTILES Y CONTROLADAS
// ========================================================

function sanitizeAiReply(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
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

function countLines(text = "") {
  const clean = sanitizeAiReply(text);
  if (!clean) return 0;

  return clean
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function looksLikeQuestion(text = "") {
  const clean = sanitizeAiReply(text);
  return clean.includes("?") || clean.includes("¿");
}

function endsWithQuestion(text = "") {
  const clean = sanitizeAiReply(text);
  if (!clean) return false;

  return /[?¿]\s*$/.test(clean);
}

function containsAny(text = "", keywords = []) {
  const clean = normalizeText(text);
  return keywords.some((keyword) => clean.includes(normalizeText(keyword)));
}

function isWeakOneLiner(text = "") {
  const clean = sanitizeAiReply(text);
  const words = countWords(clean);
  const paragraphs = countParagraphs(clean);

  if (!clean) return true;
  if (paragraphs > 1) return false;
  if (words >= 18) return false;

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
    "ya tengo una idea general",
    "entiendo perfectamente",
    "claro que si",
    "claro que sí",
    "con gusto",
    "puedo orientarte",
    "puedo ayudarte",
    "depende",
    "todo depende"
  ];

  return weakPatterns.some((pattern) => clean.includes(pattern));
}

function hasConsultiveIntent(text = "") {
  return containsAny(text, [
    "conviene",
    "importa",
    "clave",
    "priorizar",
    "revisar",
    "validar",
    "ordenar",
    "enfocar",
    "implementar",
    "mejorar",
    "reducir",
    "evitar",
    "siguiente paso",
    "oneorbix"
  ]);
}

function isTooLongReply(text = "") {
  const clean = sanitizeAiReply(text);
  const words = countWords(clean);
  const lines = countLines(clean);

  if (!clean) return false;

  return words > 120 || lines > 8 || clean.length > 900;
}

function isUsableAiReply(text = "") {
  const clean = sanitizeAiReply(text);

  if (!clean) return false;
  if (clean.length < 28) return false;
  if (isWeakOneLiner(clean)) return false;
  if (isGenericWeakReply(clean) && countWords(clean) < 45) return false;
  if (!hasConsultiveIntent(clean) && countWords(clean) < 30) return false;
  if (isTooLongReply(clean)) return false;

  return true;
}

function compactReply(text = "", options = {}) {
  const {
    maxSentences = 4,
    maxChars = 700,
    maxParagraphs = 2
  } = options;

  const clean = sanitizeAiReply(text);
  if (!clean) return "";

  const paragraphs = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, maxParagraphs);

  let base = paragraphs.join("\n\n").trim();

  if (base.length <= maxChars && countLines(base) <= 6) {
    return base;
  }

  const sentences = base
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let result = [];
  let total = 0;

  for (const sentence of sentences) {
    if (result.length >= maxSentences) break;
    const projected = total + sentence.length + 1;

    if (projected > maxChars) break;

    result.push(sentence);
    total = projected;
  }

  const compacted = result.join(" ").trim();
  return sanitizeAiReply(compacted || base.slice(0, maxChars).trim());
}

function buildGenericFallback(user = {}) {
  const interes = user?.interes_principal || "general";

  const map = {
    amazon:
      "Ya tengo una base clara de tu caso. Aquí conviene aterrizar el siguiente paso con criterio para no avanzar a ciegas. ¿Qué te preocupa más ahora mismo?",
    automatizacion:
      "Ya veo el enfoque general. Lo importante ahora es definir qué punto conviene resolver primero para que la automatización tenga impacto real. ¿Dónde está hoy el mayor freno?",
    ecommerce:
      "Ya tengo una idea clara del caso. Aquí conviene priorizar el ajuste correcto antes de mover más acciones sueltas. ¿Qué sientes que hoy está frenando más el resultado?",
    importacion:
      "Ya tengo una base de tu caso. Aquí lo importante es validar mejor el siguiente paso antes de asumir costos, riesgo o ejecución. ¿Qué necesitas aclarar primero?",
    atencion:
      "Entiendo el caso general. Voy a orientarte de forma breve y útil para ordenar mejor el siguiente paso."
  };

  return map[interes] || "Ya tengo una base clara de tu caso. Voy a orientarte de forma breve y útil para ordenar el siguiente paso.";
}

function buildRetryPrompt(originalPrompt = "", weakReply = "") {
  const safePrompt = String(originalPrompt || "").trim();
  const safeWeakReply = sanitizeAiReply(weakReply);

  return `
${safePrompt}

AJUSTE OBLIGATORIO DE CALIDAD
La respuesta anterior no sirve porque fue débil, genérica o demasiado larga:
"${safeWeakReply}"

Corrige eso ahora con estas reglas estrictas:
- Responde en español.
- Máximo 4 a 6 líneas.
- Máximo 2 párrafos cortos.
- No repitas la respuesta anterior.
- No uses saludos ni introducciones vacías.
- No expliques el caso completo otra vez.
- Da criterio consultivo real desde la primera línea.
- Di qué conviene hacer y por qué, de forma concreta.
- Si corresponde, cierra con una sola pregunta útil.
- Si el backend añadirá CTA, no pongas CTA tú.
- Evita frases genéricas como "se puede mejorar", "depende" o "podría ayudarte".
  `.trim();
}

function buildHardInstructionWrapper(prompt = "") {
  const safePrompt = String(prompt || "").trim();

  return `
${safePrompt}

REGLAS FIJAS DEL MOTOR
- Respuesta breve y útil.
- Máximo 4 a 6 líneas.
- Máximo 2 párrafos cortos.
- Evita rodeos, relleno y repeticiones.
- Debes sonar consultivo, claro y comercial.
- No uses listas largas.
- No repitas el contexto ya dado por el backend.
  `.trim();
}

// ========================================================
// FACTORY DEL MOTOR
// ========================================================
function createGeminiEngine({
  modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  apiKey = process.env.GEMINI_API_KEY,
  timeoutMs = 18000,
  temperature = 0.35,
  maxOutputTokens = 220
} = {}) {
  async function askGemini(prompt = "") {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada.");
    }

    if (!prompt || String(prompt).trim().length < 8) {
      throw new Error("Prompt vacío o insuficiente.");
    }

    const wrappedPrompt = buildHardInstructionWrapper(prompt);
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
                    text: wrappedPrompt
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

      return compactReply(sanitizeAiReply(aiText));
    } finally {
      clearTimeout(timer);
    }
  }

  async function getGeminiReplyWithFallback(prompt, user = {}, fallbackReply = "") {
    const safeFallback = compactReply(
      sanitizeAiReply(fallbackReply || buildGenericFallback(user)),
      {
        maxSentences: 4,
        maxChars: 700,
        maxParagraphs: 2
      }
    );

    try {
      const aiReply = await askGemini(prompt);

      if (isUsableAiReply(aiReply)) {
        return compactReply(aiReply);
      }

      const retryPrompt = buildRetryPrompt(prompt, aiReply);
      const retriedReply = await askGemini(retryPrompt);

      if (isUsableAiReply(retriedReply)) {
        return compactReply(retriedReply);
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