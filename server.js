require("dotenv").config();

const axios = require("axios");
const { handleWebhookPayload } = require("./app");
const express = require("express");

// ========================================================
// CONFIG
// ========================================================
const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY cargada:", process.env.GEMINI_API_KEY ? "SI" : "NO");
console.log("WHATSAPP_TOKEN cargado:", WHATSAPP_TOKEN ? "SI" : "NO");
console.log(
  "WHATSAPP_PHONE_NUMBER_ID cargado:",
  WHATSAPP_PHONE_NUMBER_ID ? "SI" : "NO"
);

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
// WHATSAPP SENDER
// ========================================================
async function sendWhatsAppTextMessage(to, body) {
  if (!to || !body) return null;

  if (!WHATSAPP_TOKEN) {
    throw new Error("Falta WHATSAPP_TOKEN en variables de entorno");
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID en variables de entorno");
  }

  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  return axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body
      }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

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
// WEBHOOK META
// ========================================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const result = await handleWebhookPayload(req.body);

    if (result?.to && result?.reply) {
      await sendWhatsAppTextMessage(result.to, result.reply);
    }

    return res.status(200).json({
      ok: true,
      reply: result?.reply || null,
      source: result?.source || null,
      to: result?.to || null
    });
  } catch (error) {
    console.error(
      "Error en /webhook:",
      error?.response?.data || error?.message || error
    );

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