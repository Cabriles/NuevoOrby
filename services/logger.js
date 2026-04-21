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
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
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
  ensureLogsDir();

  const record = buildRecord(payload);
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
}

// ========================================================
// LOGS PRINCIPALES
// ========================================================
function logLeadEvent(payload = {}) {
  appendJsonLine(leadsLogPath, payload);
}

function logErrorEvent(payload = {}) {
  appendJsonLine(errorsLogPath, payload);
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  logLeadEvent,
  logErrorEvent
};