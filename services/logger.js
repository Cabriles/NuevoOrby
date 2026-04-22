const fs = require("fs");
const path = require("path");

// ========================================================
// CONFIG
// ========================================================
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";
const OWNER_ALERT_PHONE = process.env.OWNER_ALERT_PHONE || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

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

function shouldSendOwnerAlert(payload = {}) {
  return payload.type === "conversion_intent";
}

// ========================================================
// GOOGLE SHEETS
// ========================================================
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
      name: payload.name || payload.lead_name || "",
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
// ALERTA AL OWNER POR WHATSAPP
// ========================================================
async function sendOwnerLeadAlert(payload = {}) {
  try {
    if (!shouldSendOwnerAlert(payload)) {
      return;
    }

    if (!OWNER_ALERT_PHONE || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("[LOGGER_ERROR] Faltan variables para alerta al owner.");
      return;
    }

    const leadName = payload.name || payload.lead_name || "N/D";
    const phone = payload.phone || "N/D";
    const moduleName = payload.module || "N/D";
    const action = payload.action || payload.cta || "N/D";

    const messageBody = `🔥 Lead caliente
Nombre: ${leadName}
Teléfono: ${phone}
Módulo: ${moduleName}
Tipo: ${payload.type || "N/D"}
Acción: ${action}
Escríbele ahora: https://wa.me/${phone}`;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: OWNER_ALERT_PHONE,
          type: "text",
          text: {
            body: messageBody
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "[LOGGER_ERROR] No se pudo enviar alerta al owner:",
        response.status,
        response.statusText,
        errorText
      );
    }
  } catch (err) {
    console.error("[LOGGER_ERROR] sendOwnerLeadAlert fallo:", err.message);
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

    // Alerta silenciosa al owner solo para conversion_intent
    void sendOwnerLeadAlert(record);
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