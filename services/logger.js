const fs = require("fs");
const path = require("path");

// ========================================================
// RUTAS DE LOGS
// ========================================================
const logsDir = path.join(__dirname, "../logs");
const leadsLogPath = path.join(logsDir, "leads.jsonl");
const errorsLogPath = path.join(logsDir, "errors.jsonl");

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
// LOGS PRINCIPALES
// ========================================================
function logLeadEvent(payload = {}) {
  try {
    const record = buildRecord(payload);

    // 🔥 LOG EN TIEMPO REAL PARA RAILWAY
    console.log("[LEAD_EVENT]", JSON.stringify(record));

    appendJsonLine(leadsLogPath, payload);
  } catch (err) {
    console.error("[LOGGER_ERROR] logLeadEvent fallo:", err.message);
  }
}

function logErrorEvent(payload = {}) {
  try {
    const record = buildRecord(payload);

    // 🔥 LOG EN TIEMPO REAL PARA RAILWAY
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