require("dotenv").config();

const axios = require("axios");
const { handleWebhookPayload } = require("./app");
const express = require("express");
const { getMainMenu } = require("./services/menu");
const { getMenuOptions } = require("./services/menuOptions");

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
// HELPERS WHATSAPP
// ========================================================
function getWhatsAppMessagesUrl() {
  if (!WHATSAPP_TOKEN) {
    throw new Error("Falta WHATSAPP_TOKEN en variables de entorno");
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID en variables de entorno");
  }

  return `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

function truncateText(value = "", maxLength = 72) {
  const text = String(value || "").trim();

  if (!text) return "";
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function getInteractiveRowTitle(option = {}) {
  const titleMap = {
    amazon: "Amazon FBA",
    automatizacion: "Automatización e IA",
    ecommerce: "Ecommerce y Marketing",
    importacion: "Importación y Comercio",
    atencion: "Atención al Cliente"
  };

  return titleMap[option.key] || truncateText(option.label || "Opción", 24);
}

function buildMainMenuRows() {
  return getMenuOptions().map((option) => ({
    id: option.interactive_id,
    title: getInteractiveRowTitle(option),
    description: truncateText(option.descripcion || option.label || "", 72)
  }));
}

function extractMainMenuBodyText(reply = "") {
  const mainMenuText = getMainMenu();
  const normalizedReply = String(reply || "").trim();

  if (!normalizedReply) {
    return "Selecciona una opción para continuar.";
  }

  if (normalizedReply === mainMenuText) {
    return "Selecciona una opción para continuar.";
  }

  if (normalizedReply.includes(mainMenuText)) {
    const bodyText = normalizedReply.replace(mainMenuText, "").trim();
    return bodyText || "Selecciona una opción para continuar.";
  }

  return normalizedReply;
}

function shouldSendInteractiveMainMenu(reply = "") {
  const mainMenuText = getMainMenu();
  const normalizedReply = String(reply || "").trim();

  if (!normalizedReply) return false;

  return (
    normalizedReply === mainMenuText ||
    normalizedReply.includes(mainMenuText)
  );
}

// ========================================================
// WHATSAPP SENDER
// ========================================================
async function sendWhatsAppTextMessage(to, body) {
  if (!to || !body) return null;

  const url = getWhatsAppMessagesUrl();

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

async function sendWhatsAppInteractiveListMessage(to, bodyText) {
  if (!to) return null;

  const url = getWhatsAppMessagesUrl();
  const safeBodyText = truncateText(
    bodyText || "Selecciona una opción para continuar.",
    1024
  );

  return axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "Menú principal"
        },
        body: {
          text: safeBodyText
        },
        footer: {
          text: "También puedes escribir MENU, ATRAS o REINICIAR."
        },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "Opciones disponibles",
              rows: buildMainMenuRows()
            }
          ]
        }
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

async function sendWhatsAppReply(to, reply) {
  if (!to || !reply) return null;

  if (shouldSendInteractiveMainMenu(reply)) {
    const bodyText = extractMainMenuBodyText(reply);
    return sendWhatsAppInteractiveListMessage(to, bodyText);
  }

  return sendWhatsAppTextMessage(to, reply);
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
    console.log("==================================================");
    console.log("📥 WEBHOOK RECIBIDO");
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    const result = await handleWebhookPayload(req.body);

    console.log("🧠 RESULTADO handleWebhookPayload:", result);

    if (result?.to && result?.reply) {
      console.log("📤 Intentando enviar respuesta");
      console.log("TO:", result.to);
      console.log("REPLY:", result.reply);

      const metaResponse = await sendWhatsAppReply(result.to, result.reply);

      console.log("✅ RESPUESTA META OK:", metaResponse?.data || metaResponse);
    } else {
      console.log("⚠️ No se enviará respuesta.");
      console.log("Motivo: result.to o result.reply vacíos.");
      console.log("TO:", result?.to || null);
      console.log("REPLY:", result?.reply || null);
      console.log("SOURCE:", result?.source || null);
    }

    return res.status(200).json({
      ok: true,
      reply: result?.reply || null,
      source: result?.source || null,
      to: result?.to || null
    });
  } catch (error) {
    console.error("❌ Error en /webhook:");
    console.error("MESSAGE:", error?.message || error);
    console.error("META DATA:", error?.response?.data || null);
    console.error("STATUS:", error?.response?.status || null);

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