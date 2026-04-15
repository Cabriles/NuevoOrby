const { parseMenuOption, normalizeText } = require("./utils");
const {
  isValidMainMenuOption,
  getMenuOptionById,
  getInitialStateByOption
} = require("./menuOptions");

const { detectAmazonIntent } = require("./intents/amazon");
const { detectAutomatizacionIntent } = require("./intents/automatizacion");
const { detectEcommerceIntent } = require("./intents/ecommerce");
const { detectImportacionIntent } = require("./intents/importacion");
const { detectAtencionIntent } = require("./intents/atencion");

// ========================================================
// MAPA DE MÓDULOS
// ========================================================
const MODULES_BY_KEY = {
  amazon: {
    key: "amazon",
    estado_inicial: "amazon_p1",
    entry_intent: "amazon_entry"
  },
  automatizacion: {
    key: "automatizacion",
    estado_inicial: "automatizacion_p1",
    entry_intent: "automatizacion_entry"
  },
  ecommerce: {
    key: "ecommerce",
    estado_inicial: "ecommerce_p1",
    entry_intent: "ecommerce_entry"
  },
  importacion: {
    key: "importacion",
    estado_inicial: "importacion_p1",
    entry_intent: "importacion_entry"
  },
  atencion: {
    key: "atencion",
    estado_inicial: "atencion_p1",
    entry_intent: "atencion_entry"
  }
};

// ========================================================
// DETECTORES REGISTRADOS
// ========================================================
const INTENT_DETECTORS = [
  {
    module: "amazon",
    detect: detectAmazonIntent
  },
  {
    module: "automatizacion",
    detect: detectAutomatizacionIntent
  },
  {
    module: "ecommerce",
    detect: detectEcommerceIntent
  },
  {
    module: "importacion",
    detect: detectImportacionIntent
  },
  {
    module: "atencion",
    detect: detectAtencionIntent
  }
];

// ========================================================
// HELPERS
// ========================================================
function buildMenuSelectionResult(optionId) {
  const option = getMenuOptionById(optionId);

  if (!option) return null;

  return {
    source: "menu",
    matched: true,
    option_id: option.id,
    module: option.key,
    intent: option.intent,
    estado_inicial: option.estado_inicial,
    option
  };
}

function buildIntentResult({ module, intent }) {
  const moduleConfig = MODULES_BY_KEY[module];

  if (!moduleConfig) return null;

  return {
    source: "text",
    matched: true,
    module,
    intent,
    estado_inicial: moduleConfig.estado_inicial,
    entry_intent: moduleConfig.entry_intent
  };
}

function isDirectEntryIntent(intent = "") {
  return [
    "amazon_entry",
    "automatizacion_entry",
    "ecommerce_entry",
    "importacion_entry",
    "atencion_entry"
  ].includes(intent);
}

// ========================================================
// DETECCIÓN POR MENÚ
// ========================================================
function detectMenuSelection(text = "") {
  const option = parseMenuOption(text);

  if (!option) return null;
  if (!isValidMainMenuOption(option)) return null;

  return buildMenuSelectionResult(option);
}

// ========================================================
// DETECCIÓN POR TEXTO LIBRE
// ========================================================
function detectFreeTextIntent(text = "") {
  for (const detector of INTENT_DETECTORS) {
    if (typeof detector.detect !== "function") continue;

    const intent = detector.detect(text);

    if (intent) {
      return buildIntentResult({
        module: detector.module,
        intent
      });
    }
  }

  return null;
}

// ========================================================
// DETECTOR PRINCIPAL
// ========================================================
function detectIntent(text = "") {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return {
      matched: false,
      source: "empty",
      module: null,
      intent: null,
      estado_inicial: null
    };
  }

  const menuMatch = detectMenuSelection(normalizedText);
  if (menuMatch) return menuMatch;

  const textMatch = detectFreeTextIntent(normalizedText);
  if (textMatch) return textMatch;

  return {
    matched: false,
    source: "unknown",
    module: null,
    intent: null,
    estado_inicial: null
  };
}

// ========================================================
// DETECCIÓN PARA ENTRADA A MÓDULO
// ========================================================
function resolveModuleEntry(text = "") {
  const result = detectIntent(text);

  if (!result?.matched) return null;

  if (result.source === "menu") {
    return {
      module: result.module,
      intent: result.intent,
      estado_inicial: result.estado_inicial,
      via: "menu"
    };
  }

  if (isDirectEntryIntent(result.intent)) {
    return {
      module: result.module,
      intent: result.intent,
      estado_inicial: result.estado_inicial,
      via: "direct_intent"
    };
  }

  return {
    module: result.module,
    intent: result.intent,
    estado_inicial: result.estado_inicial,
    via: "subintent"
  };
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  MODULES_BY_KEY,
  INTENT_DETECTORS,
  detectMenuSelection,
  detectFreeTextIntent,
  detectIntent,
  resolveModuleEntry,
  isDirectEntryIntent,
  getInitialStateByOption
};