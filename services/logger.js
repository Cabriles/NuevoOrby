const fs = require("fs");
const path = require("path");

// ========================================================
// CONFIG
// ========================================================
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";
const OWNER_ALERT_PHONE = process.env.OWNER_ALERT_PHONE || "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const NODE_ENV = process.env.NODE_ENV || "development";

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
// HELPERS DE SEGURIDAD / SANITIZACIÓN
// ========================================================
function truncateString(value = "", maxLength = 500) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}... [truncated]`;
}

function maskPhone(phone = "") {
  const value = String(phone || "").trim();
  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return value;

  const visibleEnd = digits.slice(-4);
  return `***${visibleEnd}`;
}

function sanitizeStack(stack = "") {
  if (!stack) return null;

  const cleanStack = String(stack)
    .split("\n")
    .slice(0, 5)
    .map((line) => truncateString(line, 220))
    .join("\n");

  if (NODE_ENV === "production") {
    return "[stack hidden in production]";
  }

  return cleanStack;
}

function redactSensitiveKeys(obj = {}) {
  const blockedKeys = [
    "authorization",
    "token",
    "access_token",
    "refresh_token",
    "id_token",
    "api_key",
    "apikey",
    "secret",
    "client_secret",
    "password",
    "headers",
    "cookie",
    "set-cookie"
  ];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const output = {};

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = String(key || "").toLowerCase();

    if (blockedKeys.some((blocked) => normalizedKey.includes(blocked))) {
      output[key] = "[redacted]";
      continue;
    }

    output[key] = value;
  }

  return output;
}

function buildSafeConsoleErrorParts(...parts) {
  return parts.map((part) => {
    if (part == null) return part;

    if (typeof part === "string") {
      return truncateString(part, 500);
    }

    if (typeof part === "object") {
      try {
        return JSON.stringify(part);
      } catch (error) {
        return "[unserializable object]";
      }
    }

    return part;
  });
}

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

function sanitizeValue(value, parentKey = "") {
  const normalizedParentKey = String(parentKey || "").toLowerCase();

  if (
    normalizedParentKey.includes("token") ||
    normalizedParentKey.includes("secret") ||
    normalizedParentKey.includes("password") ||
    normalizedParentKey.includes("authorization") ||
    normalizedParentKey.includes("cookie") ||
    normalizedParentKey.includes("headers") ||
    normalizedParentKey.includes("api_key") ||
    normalizedParentKey.includes("apikey")
  ) {
    return "[redacted]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message || "", 500),
      stack: sanitizeStack(value.stack || "")
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, parentKey));
  }

  if (value && typeof value === "object") {
    const safeObject = redactSensitiveKeys(value);
    const output = {};

    for (const [key, nestedValue] of Object.entries(safeObject)) {
      output[key] = sanitizeValue(nestedValue, key);
    }

    return output;
  }

  if (typeof value === "string") {
    return truncateString(value, 1200);
  }

  return value;
}

function sanitizeLeadPayload(payload = {}) {
  return {
    timestamp: payload.timestamp || new Date().toISOString(),
    type: payload.type || "",
    name: truncateString(payload.name || payload.lead_name || "", 180),
    phone: String(payload.phone || "").trim(),
    module: payload.module || "",
    estado: payload.estado || "",
    score: payload.score ?? "",
    lead_type: payload.lead_type || "",
    cta: payload.cta || "",
    action: payload.action || "",
    via: payload.via || "",
    source: payload.source || ""
  };
}

function sanitizeErrorPayload(payload = {}) {
  return {
    timestamp: payload.timestamp || new Date().toISOString(),
    type: payload.type || "error",
    phone: maskPhone(payload.phone || ""),
    estado: payload.estado || "",
    module: payload.module || "",
    message: truncateString(payload.message || "", 500),
    error_message: truncateString(payload.error_message || "", 500),
    stack: sanitizeStack(payload.stack || ""),
    extra: sanitizeValue(payload.extra || {})
  };
}

function buildRecord(payload = {}, mode = "generic") {
  if (mode === "lead") {
    return sanitizeLeadPayload(payload);
  }

  if (mode === "error") {
    return sanitizeErrorPayload(payload);
  }

  return {
    timestamp: new Date().toISOString(),
    ...sanitizeValue(payload)
  };
}

function appendJsonLine(filePath, payload = {}, mode = "generic") {
  try {
    ensureLogsDir();
    const record = buildRecord(payload, mode);
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
      cta_whatsapp_selected: "cta_click"
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
        ...buildSafeConsoleErrorParts(
          "[LOGGER_ERROR] Google Sheets respondió con error:",
          response.status,
          response.statusText
        )
      );
    }
  } catch (err) {
    console.error(
      ...buildSafeConsoleErrorParts(
        "[LOGGER_ERROR] No se pudo enviar lead a Google Sheets:",
        err.message
      )
    );
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

    console.log("🚨 [OWNER_ALERT] Intentando enviar alerta...");
console.log("[OWNER_ALERT] Payload:", JSON.stringify(payload));
console.log("[OWNER_ALERT] OWNER_ALERT_PHONE:", OWNER_ALERT_PHONE ? "SI" : "NO");
console.log("[OWNER_ALERT] WHATSAPP_TOKEN:", WHATSAPP_TOKEN ? "SI" : "NO");
console.log("[OWNER_ALERT] WHATSAPP_PHONE_NUMBER_ID:", WHATSAPP_PHONE_NUMBER_ID ? "SI" : "NO");

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

    const responseText = await response.text().catch(() => "");

console.log("[OWNER_ALERT] Status Meta:", response.status);
console.log("[OWNER_ALERT] Response Meta:", responseText);

    if (!response.ok) {
      const errorText = responseText;
      console.error(
        ...buildSafeConsoleErrorParts(
          "[LOGGER_ERROR] No se pudo enviar alerta al owner:",
          response.status,
          response.statusText,
          truncateString(errorText, 350)
        )
      );
    }
  } catch (err) {
    console.error(
      ...buildSafeConsoleErrorParts(
        "[LOGGER_ERROR] sendOwnerLeadAlert fallo:",
        err.message
      )
    );
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

    const record = buildRecord(normalizedPayload, "lead");

    console.log("[LEAD_EVENT]", JSON.stringify(record));
    appendJsonLine(leadsLogPath, record, "lead");

    // Envío silencioso a Google Sheets
    void forwardLeadToGoogleSheets(record);

    // Alerta silenciosa al owner solo para conversion_intent
    void sendOwnerLeadAlert(record);
  } catch (err) {
    console.error(
      ...buildSafeConsoleErrorParts(
        "[LOGGER_ERROR] logLeadEvent fallo:",
        err.message
      )
    );
  }
}

function logErrorEvent(payload = {}) {
  try {
    const record = buildRecord(payload, "error");

    console.error("[ERROR_EVENT]", JSON.stringify(record));
    appendJsonLine(errorsLogPath, record, "error");
  } catch (err) {
    console.error(
      ...buildSafeConsoleErrorParts(
        "[LOGGER_ERROR] logErrorEvent fallo:",
        err.message
      )
    );
  }
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  logLeadEvent,
  logErrorEvent
};