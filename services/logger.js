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

function appendJsonLine(filePath, payload = {}) {
  ensureLogsDir();

  const record = {
    timestamp: new Date().toISOString(),
    ...payload
  };

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