const { getMainMenu } = require("./services/menu");
const {
  detectIntent,
  resolveModuleEntry
} = require("./services/intentDetector");

const {
  getOrCreateUser,
  saveUser,
  resetUser,
  classifyLead
} = require("./services/stateManager");

const {
  getGeminiReplyWithFallback
} = require("./services/geminiEngine");

const {
  findClientByDocument
} = require("./services/memberships");

const {
  normalizeText,
  isMenuCommand,
  isBackCommand,
  isResetCommand
} = require("./services/utils");

const {
  handleAmazonFlow,
  getAmazonIntro
} = require("./services/flows/amazon");

const {
  handleAutomatizacionFlow,
  getAutomatizacionIntro
} = require("./services/flows/automatizacion");

const {
  handleEcommerceFlow,
  getEcommerceIntro
} = require("./services/flows/ecommerce");

const {
  handleImportacionFlow,
  getImportacionIntro
} = require("./services/flows/importacion");

const {
  handleAtencionFlow,
  getAtencionIntro
} = require("./services/flows/atencion");

// ========================================================
// CONFIG
// ========================================================
const CALENDLY_LINK =
  process.env.CALENDLY_LINK || "https://calendly.com/tu-enlace";

// ========================================================
// HELPERS GENERALES
// ========================================================
function buildResponse(reply, extra = {}) {
  return {
    reply,
    source: extra.source || "backend",
    ...extra
  };
}

function appendNavigationHint(reply = "") {
  if (!reply) return reply;

  return `${reply}

También puedes usar:
📋 MENU
↩️ ATRAS
🔄 REINICIAR`;
}

function isLeadState(state = "") {
  return ["lead_curioso", "lead_tibio", "lead_calificado"].includes(state);
}

function shouldAppendNavigationHint(state = "") {
  if (!state) return false;
  if (isLeadState(state)) return false;
  if (state === "finalizado") return false;

  const blockedFragments = [
    "reunion",
    "asesor",
    "callback",
    "confirmar_numero",
    "otro_numero",
    "horario"
  ];

  return !blockedFragments.some((fragment) => String(state).includes(fragment));
}

function buildResponseWithNavigation(reply, extra = {}, state = "") {
  const finalReply = shouldAppendNavigationHint(state)
    ? appendNavigationHint(reply)
    : reply;

  return buildResponse(finalReply, extra);
}

function getModuleIntroByKey(moduleKey) {
  const introMap = {
    amazon: getAmazonIntro,
    automatizacion: getAutomatizacionIntro,
    ecommerce: getEcommerceIntro,
    importacion: getImportacionIntro,
    atencion: getAtencionIntro
  };

  const fn = introMap[moduleKey];
  return typeof fn === "function" ? fn() : getMainMenu();
}

function getStateModule(user = {}) {
  const estado = user?.estado || "";

  if (estado.startsWith("amazon")) return "amazon";
  if (estado.startsWith("automatizacion")) return "automatizacion";
  if (estado.startsWith("ecommerce")) return "ecommerce";
  if (estado.startsWith("importacion")) return "importacion";
  if (estado.startsWith("atencion")) return "atencion";

  if (user?.interes_principal) return user.interes_principal;

  return null;
}

function getPreviousStateFallback(moduleKey) {
  const fallbackMap = {
    amazon: "amazon_p1",
    automatizacion: "automatizacion_p1",
    ecommerce: "ecommerce_p1",
    importacion: "importacion_p1",
    atencion: "atencion_p1"
  };

  return fallbackMap[moduleKey] || null;
}

function buildWelcomeMenu() {
  return getMainMenu();
}

function buildGreetingWelcomeMessage() {
  return `Hola, soy Orby.\n\nEstoy aquí para orientarte de forma rápida y clara.\n\n${buildWelcomeMenu()}`;
}

function buildUnknownMessage() {
  return `No logré identificar bien tu mensaje.\n\n${getMainMenu()}`;
}

function isGreetingMessage(text = "") {
  const value = normalizeText(text);

  const greetings = [
    "hola",
    "hola!",
    "hola.",
    "holi",
    "buenas",
    "buenos dias",
    "buen día",
    "buen dia",
    "buenas tardes",
    "buenas noches",
    "hello",
    "hi",
    "hey",
    "que tal",
    "qué tal",
    "saludos"
  ];

  return greetings.includes(value);
}

// ========================================================
// DISPATCH A FLOWS
// ========================================================
async function dispatchToModuleFlow({
  moduleKey,
  user,
  phone,
  cleanMessage,
  message
}) {
  const commonPayload = {
    user,
    phone,
    cleanMessage,
    message,
    saveUser,
    classifyLead,
    getGeminiReplyWithFallback,
    CALENDLY_LINK
  };

  if (moduleKey === "amazon") {
    return handleAmazonFlow(commonPayload);
  }

  if (moduleKey === "automatizacion") {
    return handleAutomatizacionFlow(commonPayload);
  }

  if (moduleKey === "ecommerce") {
    return handleEcommerceFlow(commonPayload);
  }

  if (moduleKey === "importacion") {
    return handleImportacionFlow(commonPayload);
  }

  if (moduleKey === "atencion") {
    return handleAtencionFlow({
      ...commonPayload,
      findClientByDocument
    });
  }

  return null;
}

// ========================================================
// COMANDOS GLOBALES
// ========================================================
function handleGlobalCommands({ user, phone, rawMessage }) {
  if (isResetCommand(rawMessage)) {
    resetUser(phone);

    return buildResponseWithNavigation(
      `Perfecto. Empecemos de nuevo.\n\n${buildWelcomeMenu()}`,
      { source: "backend" },
      null
    );
  }

  if (isMenuCommand(rawMessage)) {
    const currentUser = getOrCreateUser(phone);
    currentUser.estado = null;
    currentUser.interes_principal = null;
    saveUser(phone, currentUser);

    return buildResponseWithNavigation(
      buildWelcomeMenu(),
      { source: "backend" },
      null
    );
  }

  if (isBackCommand(rawMessage)) {
    const moduleKey = getStateModule(user);
    const fallbackState = getPreviousStateFallback(moduleKey);

    if (!fallbackState) {
      return buildResponseWithNavigation(
        buildWelcomeMenu(),
        { source: "backend" },
        null
      );
    }

    user.estado = fallbackState;
    user.interes_principal = moduleKey;
    saveUser(phone, user);

    return buildResponseWithNavigation(
      getModuleIntroByKey(moduleKey),
      { source: "backend" },
      fallbackState
    );
  }

  return null;
}

// ========================================================
// ENTRADA A MÓDULO
// ========================================================
function handleModuleEntry({ user, phone, rawMessage }) {
  const entry = resolveModuleEntry(rawMessage);

  if (!entry) return null;

  user.estado = entry.estado_inicial;
  user.interes_principal = entry.module;
  saveUser(phone, user);

  return buildResponseWithNavigation(
    getModuleIntroByKey(entry.module),
    {
      source: "backend",
      matched_module: entry.module,
      matched_intent: entry.intent,
      via: entry.via
    },
    entry.estado_inicial
  );
}

// ========================================================
// CONTROLADOR PRINCIPAL
// ========================================================
async function processIncomingMessage({
  phone,
  message
}) {
  try {
    const rawMessage = String(message || "").trim();
    const cleanMessage = normalizeText(rawMessage);

    if (!phone) {
      return buildResponse("No se pudo identificar el número del usuario.", {
        source: "backend",
        error: true
      });
    }

    const user = getOrCreateUser(phone);

    // 1. Mensaje vacío -> mostrar menú
    if (!cleanMessage) {
      return buildResponseWithNavigation(
        buildWelcomeMenu(),
        { source: "backend" },
        null
      );
    }

    // 1.1 Saludo simple sin estado activo -> bienvenida UX
    if ((!user.estado || user.estado === "finalizado") && isGreetingMessage(rawMessage)) {
      user.estado = null;
      user.interes_principal = null;
      saveUser(phone, user);

      return buildResponseWithNavigation(
        buildGreetingWelcomeMessage(),
        { source: "backend" },
        null
      );
    }

    // 2. Comandos globales
    const globalCommandResponse = handleGlobalCommands({
      user,
      phone,
      rawMessage
    });

    if (globalCommandResponse) {
      return globalCommandResponse;
    }

    // 3. Si el usuario no tiene estado activo, intentar entrada a módulo
    if (!user.estado || user.estado === "finalizado") {
      const moduleEntryResponse = handleModuleEntry({
        user,
        phone,
        rawMessage
      });

      if (moduleEntryResponse) {
        return moduleEntryResponse;
      }

      return buildResponseWithNavigation(
        buildUnknownMessage(),
        { source: "backend" },
        null
      );
    }

    // 4. Si está dentro de un módulo, despachar al flow correspondiente
    const currentModule = getStateModule(user);

    if (currentModule) {
      const flowResponse = await dispatchToModuleFlow({
        moduleKey: currentModule,
        user,
        phone,
        cleanMessage,
        message: rawMessage
      });

      if (flowResponse?.reply) {
        return buildResponseWithNavigation(
          flowResponse.reply,
          {
            source: flowResponse.source || "backend",
            module: currentModule
          },
          user.estado
        );
      }
    }

    // 5. Si está en lead state pero no resolvió por flow, insistir con CTA o volver a menú
    if (isLeadState(user.estado)) {
      return buildResponse(
        "Puedo seguir ayudándote dentro de este caso o, si prefieres, escribe MENU para volver al menú principal.",
        { source: "backend" }
      );
    }

    // 6. Fallback final
    return buildResponseWithNavigation(
      buildUnknownMessage(),
      { source: "backend" },
      user.estado
    );
  } catch (error) {
    console.error("Error en processIncomingMessage:", error);

    return buildResponse(
      "Hubo un problema al procesar tu mensaje. Inténtalo nuevamente.",
      {
        source: "backend",
        error: true
      }
    );
  }
}

// ========================================================
// WEBHOOK HELPER (opcional para server.js)
// ========================================================
async function handleWebhookPayload(payload = {}) {
  try {
    // --------------------------------------------------------
    // 1) Compatibilidad con payload simple de Thunder / pruebas manuales
    // --------------------------------------------------------
    const simplePhone =
      payload?.phone ||
      payload?.from ||
      payload?.sender ||
      payload?.user_phone ||
      null;

    const simpleMessage =
      payload?.message ||
      payload?.text ||
      payload?.body ||
      payload?.incoming_message ||
      "";

    if (simplePhone && String(simpleMessage || "").trim()) {
      const result = await processIncomingMessage({
        phone: simplePhone,
        message: simpleMessage
      });

      return {
        ...result,
        to: simplePhone
      };
    }

    // --------------------------------------------------------
    // 2) Payload real de WhatsApp Cloud API (Meta)
    // --------------------------------------------------------
    const change = payload?.entry?.[0]?.changes?.[0];
    const value = change?.value;
    const incomingMessage = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!incomingMessage) {
      return {
        reply: null,
        source: "meta_webhook_no_message_event",
        to: null
      };
    }

    const phone = incomingMessage?.from || contact?.wa_id || null;

    let message = "";

    if (incomingMessage?.type === "text") {
      message = incomingMessage?.text?.body || "";
    } else if (incomingMessage?.type === "button") {
      message = incomingMessage?.button?.text || "";
    } else if (incomingMessage?.type === "interactive") {
      message =
        incomingMessage?.interactive?.button_reply?.title ||
        incomingMessage?.interactive?.list_reply?.title ||
        "";
    }

    if (!phone || !String(message || "").trim()) {
      return {
        reply: null,
        source: "meta_webhook_unsupported_event",
        to: null
      };
    }

    const result = await processIncomingMessage({
      phone,
      message
    });

    return {
      ...result,
      to: phone
    };
  } catch (error) {
    console.error("Error en handleWebhookPayload:", error);

    return {
      reply: null,
      source: "meta_webhook_error",
      error: true,
      to: null
    };
  }
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  processIncomingMessage,
  handleWebhookPayload
};