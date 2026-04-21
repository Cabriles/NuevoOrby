const fs = require("fs");
const path = require("path");

// ========================================================
// CONFIG
// ========================================================
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";

// ========================================================
// RUTAS DE LOGS
// ========================================================
const logsDir = path.join(__dirname, "../logs");
const leadsLogPath = path.join(logsDir, "leads.jsonl");
const errorsLogPath = path.join(logsDir, "errors.jsonl");

// ========================================================
// EVENTOS QUE SÍ APORTAN A NEGOCIO
// ========================================================
const ALLOWED_LEAD_EVENTS = [
  "entry",
  "qualified",
  "cta_click",
  "conversion_intent"
];

const SHEETS_FORWARD_EVENTS = [
  "qualified",
  "cta_click",
  "conversion_intent"
];

// ========================================================
// HELPERS
// ========================================================
function ensureLogsDir() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    console.error("[LOGGER_ERROR] No se pudo crear carpeta logs:", err.message);
  }
}

function sanitizeValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack || null
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = sanitizeValue(nestedValue);
    }
    return output;
  }

  return value;
}

function buildRecord(payload = {}) {
  return {
    timestamp: new Date().toISOString(),
    ...sanitizeValue(payload)
  };
}

function appendJsonLine(filePath, payload = {}) {
  try {
    ensureLogsDir();
    const record = buildRecord(payload);
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[LOGGER_ERROR] No se pudo escribir en archivo:", err.message);
  }
}

// ========================================================
// NORMALIZACIÓN DE EVENTOS
// ========================================================
function normalizeEventType(payload = {}) {
  const normalizedPayload = { ...payload };

  if (!normalizedPayload.type && normalizedPayload.event_type) {
    const legacyMap = {
      flow_step: "entry",
      lead_profile_completed: "qualified",
      cta_meeting_selected: "cta_click",
      cta_whatsapp_selected: "cta_click",
      callback_requested: "conversion_intent"
    };

    normalizedPayload.type = legacyMap[normalizedPayload.event_type] || null;
  }

  return normalizedPayload;
}

function isAllowedLeadEvent(payload = {}) {
  return Boolean(payload.type) && ALLOWED_LEAD_EVENTS.includes(payload.type);
}

function shouldForwardToSheets(payload = {}) {
  return Boolean(payload.type) && SHEETS_FORWARD_EVENTS.includes(payload.type);
}

async function forwardLeadToGoogleSheets(payload = {}) {
  try {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) {
      return;
    }

    if (!shouldForwardToSheets(payload)) {
      return;
    }

    const body = {
      timestamp: payload.timestamp || new Date().toISOString(),
      phone: payload.phone || "",
      module: payload.module || "",
      type: payload.type || "",
      estado: payload.estado || "",
      score: payload.score ?? "",
      lead_type: payload.lead_type || "",
      cta: payload.cta || "",
      action: payload.action || "",
      via: payload.via || "",
      source: payload.source || ""
    };

    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(
        "[LOGGER_ERROR] Google Sheets respondió con error:",
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error("[LOGGER_ERROR] No se pudo enviar lead a Google Sheets:", err.message);
  }
}

// ========================================================
// LOGS PRINCIPALES
// ========================================================
function logLeadEvent(payload = {}) {
  try {
    const normalizedPayload = normalizeEventType(payload);

    if (!isAllowedLeadEvent(normalizedPayload)) {
      return;
    }

    const record = buildRecord(normalizedPayload);

    console.log("[LEAD_EVENT]", JSON.stringify(record));
    appendJsonLine(leadsLogPath, normalizedPayload);

    // Envío silencioso a Google Sheets
    void forwardLeadToGoogleSheets(record);
  } catch (err) {
    console.error("[LOGGER_ERROR] logLeadEvent fallo:", err.message);
  }
}

function logErrorEvent(payload = {}) {
  try {
    const record = buildRecord(payload);

    console.error("[ERROR_EVENT]", JSON.stringify(record));
    appendJsonLine(errorsLogPath, payload);
  } catch (err) {
    console.error("[LOGGER_ERROR] logErrorEvent fallo:", err.message);
  }
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  logLeadEvent,
  logErrorEvent
};