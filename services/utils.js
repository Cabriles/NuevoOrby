// ========================================================
// NORMALIZACIÓN DE TEXTO
// ========================================================
function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// ========================================================
// BÚSQUEDA DE PALABRAS / FRASES
// ========================================================
function includesAny(text = "", terms = []) {
  const normalizedText = normalizeText(text);

  return terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return normalizedText.includes(normalizedTerm);
  });
}

// ========================================================
// VALIDACIÓN DE NÚMERO TELEFÓNICO
// ========================================================
function isLikelyPhoneNumber(text = "") {
  const cleaned = String(text).replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");

  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

// ========================================================
// VALIDACIÓN SIMPLE DE DOCUMENTO (CI / RUC / similares)
// ========================================================
function isLikelyDocument(text = "") {
  const digitsOnly = String(text).replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 13;
}

// ========================================================
// COMANDOS GLOBALES
// ========================================================
function isMenuCommand(text = "") {
  const value = normalizeText(text);
  return ["menu", "menú", "inicio", "home"].includes(value);
}

function isBackCommand(text = "") {
  const value = normalizeText(text);
  return ["atras", "atrás", "volver", "regresar", "retroceder"].includes(value);
}

function isResetCommand(text = "") {
  const value = normalizeText(text);
  return ["reiniciar", "reset", "empezar de nuevo", "reinicio"].includes(value);
}

// ========================================================
// OPCIONES NUMÉRICAS DE MENÚ
// ========================================================
function parseMenuOption(text = "") {
  const value = String(text).trim();

  const match = value.match(/^\d+/);
  if (!match) return null;

  return match[0];
}

function isValidOption(text = "", allowedOptions = []) {
  const option = parseMenuOption(text);
  return allowedOptions.includes(option);
}

// ========================================================
// TEXTO VACÍO / MUY CORTO
// ========================================================
function isEmptyText(text = "") {
  return normalizeText(text).length === 0;
}

function hasMinimumLength(text = "", min = 2) {
  return String(text || "").trim().length >= min;
}

// ========================================================
// DETECCIÓN SIMPLE DE URGENCIA
// ========================================================
function detectUrgency(text = "") {
  return includesAny(text, [
    "urgente",
    "urgencia",
    "ahora",
    "lo antes posible",
    "inmediato",
    "inmediatamente",
    "cuanto antes",
    "rápido",
    "rapido"
  ]);
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  normalizeText,
  includesAny,
  isLikelyPhoneNumber,
  isLikelyDocument,
  isMenuCommand,
  isBackCommand,
  isResetCommand,
  parseMenuOption,
  isValidOption,
  isEmptyText,
  hasMinimumLength,
  detectUrgency
};