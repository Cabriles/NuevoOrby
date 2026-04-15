require("dotenv").config();

const { handleWebhookPayload } = require("./app");
const express = require("express");

// ========================================================
// CONFIG
// ========================================================
const PORT = process.env.PORT || 3000;

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY cargada:", process.env.GEMINI_API_KEY ? "SI" : "NO");

// ========================================================
// APP
// ========================================================
const app = express();

// ========================================================
// MIDDLEWARES
// ========================================================
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ========================================================
// HEALTHCHECK
// ========================================================
app.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "orby-backend",
    message: "Servidor activo"
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ========================================================
// WEBHOOK PLACEHOLDER
// ========================================================
// Aquí luego conectaremos app.js
app.post("/webhook", async (req, res) => {
  try {
    const result = await handleWebhookPayload(req.body);

    return res.status(200).json({
      ok: true,
      reply: result?.reply || null,
      source: result?.source || null
    });
  } catch (error) {
    console.error("Error en /webhook:", error);

    return res.status(500).json({
      ok: false,
      error: "Error procesando mensaje"
    });
  }
});

// ========================================================
// 404
// ========================================================
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    error: "Ruta no encontrada"
  });
});

// ========================================================
// ERROR HANDLER
// ========================================================
app.use((error, req, res, next) => {
  console.error("Error no controlado:", error);

  return res.status(500).json({
    ok: false,
    error: "Error interno del servidor"
  });
});

// ========================================================
// START
// ========================================================
app.listen(PORT, () => {
  console.log(`✅ Orby backend corriendo en puerto ${PORT}`);
});