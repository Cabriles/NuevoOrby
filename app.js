const { getMainMenu } = require("./services/menu");
const {
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

const {
  logLeadEvent,
  logErrorEvent
} = require("./services/logger");

// ========================================================
// CONFIG
// ========================================================
const CALENDLY_LINK =
  process.env.CALENDLY_LINK || "https://calendly.com/oneorbix/30min";

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

  const introStates = [
    "amazon_p1",
    "automatizacion_p1",
    "ecommerce_p1",
    "importacion_p1",
    "atencion_p1"
  ];

  if (introStates.includes(state)) return false;

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
  return `Hola, soy Orby.

Estoy aquí para orientarte de forma rápida y clara.

${buildWelcomeMenu()}`;
}

function buildUnknownMessage() {
  return `No logré identificar bien tu mensaje.

${getMainMenu()}`;
}

function isHighIntentAmazon(message = "") {
  const msg = normalizeText(message);

  const triggers = [
    "membresia",
    "membresía",
    "curso",
    "programa",
    "empezar",
    "ya",
    "iniciar"
  ];

  return triggers.some((t) => msg.includes(t));
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

function detectDirectCampaignModule(rawMessage = "") {
  const text = normalizeText(rawMessage);

  const directTriggers = {
    amazon: [
      "amazon",
      "amazon fba",
      "vender en amazon",
      "quiero vender en amazon",
      "necesito mas informacion sobre amazon fba",
      "necesito más información sobre amazon fba",
      "membresia amazon",
      "membresía amazon",
      "curso amazon",
      "programa amazon",
      "quiero empezar en amazon",
      "quiero vender ya en amazon",
      "como empiezo en amazon"
    ],

    importacion: [
      "importar",
      "importar desde china",
      "quiero importar desde china",
      "proveedor en china",
      "proveedores en china",
      "comprar en china"
    ],

    automatizacion: [
      "automatizar",
      "automatizar negocio",
      "automatizar mi negocio",
      "agentes ia",
      "agentes bots",
      "bots ia",
      "inteligencia artificial",
      "quiero automatizar mi negocio"
    ],

    ecommerce: [
      "ecommerce",
      "crear tienda",
      "tienda online",
      "shopify",
      "woocommerce",
      "quiero una tienda online"
    ],

    atencion: [
      "asesoria",
      "asesoría",
      "quiero asesoria",
      "quiero asesoría",
      "necesito ayuda",
      "necesito asesoria",
      "necesito asesoría"
    ],

    club: [
      "club oneorbix",
      "club de importadores",
      "membresia club oneorbix",
      "membresía club oneorbix",
      "quiero unirme al club"
    ]
  };

  for (const [moduleKey, triggers] of Object.entries(directTriggers)) {
    if (triggers.some((trigger) => text.includes(trigger))) {
      return moduleKey;
    }
  }

  return null;
}

function resolveDirectModuleState(moduleKey) {
  const stateMap = {
    amazon: "amazon_p1",
    automatizacion: "automatizacion_p1",
    ecommerce: "ecommerce_p1",
    importacion: "importacion_p1",
    atencion: "atencion_p1",
    club: "atencion_p1"
  };

  return stateMap[moduleKey] || null;
}

// ========================================================
// HELPERS DE MÉTRICAS DE NEGOCIO
// ========================================================
function safeLogLeadEvent(payload = {}) {
  try {
    logLeadEvent(payload);
  } catch (error) {
    console.error("Error al registrar lead event:", error);
  }
}

function safeLogErrorEvent(payload = {}) {
  try {
    logErrorEvent(payload);
  } catch (error) {
    console.error("Error al registrar error event:", error);
  }
}

function isCtaState(state = "") {
  const value = String(state || "");

  const ctaFragments = [
    "reunion",
    "asesor",
    "callback",
    "confirmar_numero",
    "otro_numero",
    "horario"
  ];

  return ctaFragments.some((fragment) => value.includes(fragment));
}

function inferCtaName(state = "", message = "") {
  const normalizedState = String(state || "");
  const normalizedMessage = normalizeText(message);

  if (normalizedState.includes("reunion")) return "reunion";
  if (
    normalizedState.includes("asesor") ||
    normalizedState.includes("callback") ||
    normalizedState.includes("confirmar_numero") ||
    normalizedState.includes("otro_numero") ||
    normalizedState.includes("horario")
  ) {
    return "whatsapp";
  }

  if (normalizedMessage.includes("reunion")) return "reunion";
  if (normalizedMessage.includes("whatsapp")) return "whatsapp";

  return "general";
}

function trackBusinessMetrics({
  phone,
  userBefore = {},
  userAfter = {},
  moduleKey = null,
  message = "",
  source = "backend"
}) {
  const fromState = userBefore?.estado || null;
  const toState = userAfter?.estado || null;
  const score = Number(userAfter?.score || 0);
  const leadType = classifyLead(userAfter);
  const module = moduleKey || getStateModule(userAfter) || getStateModule(userBefore);

  const enteredLeadState =
    !isLeadState(fromState) &&
    isLeadState(toState);

  if (enteredLeadState) {
    safeLogLeadEvent({
      type: "qualified",
      phone,
      module,
      estado: toState,
      score,
      lead_type: leadType,
      source
    });
  }

  const enteredCtaState =
    !isCtaState(fromState) &&
    isCtaState(toState);

  if (enteredCtaState) {
    safeLogLeadEvent({
      type: "cta_click",
      phone,
      module,
      cta: inferCtaName(toState, message),
      estado: toState,
      score,
      lead_type: leadType,
      source
    });
  }

  const strongIntentState =
    String(toState || "").includes("reunion") ||
    String(toState || "").includes("horario") ||
    String(toState || "").includes("confirmar_numero") ||
    String(toState || "").includes("callback") ||
    (toState === "finalizado" && isCtaState(fromState));

  if (strongIntentState) {
    safeLogLeadEvent({
      type: "conversion_intent",
      phone,
      module,
      action: inferCtaName(toState || fromState, message),
      estado: toState,
      score,
      lead_type: leadType,
      source
    });
  }
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
      `Perfecto. Empecemos de nuevo.

${buildWelcomeMenu()}`,
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
  const directModule = detectDirectCampaignModule(rawMessage);
  const safeModule = directModule === "club" ? "atencion" : directModule;

  if (safeModule === "amazon" && isHighIntentAmazon(rawMessage)) {
    user.amazon_high_intent = true;
    saveUser(phone, user);
  }

  if (directModule) {
    const initialState = resolveDirectModuleState(directModule);

    if (!initialState) return null;

    user.estado = initialState;
    user.interes_principal = directModule === "club" ? "atencion" : directModule;
    const updatedUser = saveUser(phone, user);

    safeLogLeadEvent({
      type: "entry",
      phone,
      module: directModule === "club" ? "atencion" : directModule,
      via: "direct_trigger",
      estado: updatedUser?.estado || initialState,
      source: "backend"
    });

    return buildResponseWithNavigation(
      getModuleIntroByKey(directModule === "club" ? "atencion" : directModule),
      {
        source: "backend",
        matched_module: directModule,
        matched_intent: "direct_campaign_entry",
        via: "direct_trigger"
      },
      initialState
    );
  }

  const entry = resolveModuleEntry(rawMessage);

  if (!entry) return null;

  user.estado = entry.estado_inicial;
  user.interes_principal = entry.module;
  const updatedUser = saveUser(phone, user);

  safeLogLeadEvent({
    type: "entry",
    phone,
    module: entry.module,
    via: entry.via,
    estado: updatedUser?.estado || entry.estado_inicial,
    source: "backend"
  });

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
      const userBeforeFlow = { ...user };

      const flowResponse = await dispatchToModuleFlow({
        moduleKey: currentModule,
        user,
        phone,
        cleanMessage,
        message: rawMessage
      });

      const userAfterFlow = getOrCreateUser(phone) || user;

      trackBusinessMetrics({
        phone,
        userBefore: userBeforeFlow,
        userAfter: userAfterFlow,
        moduleKey: currentModule,
        message: rawMessage,
        source: flowResponse?.source || "backend"
      });

      if (flowResponse?.reply) {
        return buildResponseWithNavigation(
          flowResponse.reply,
          {
            source: flowResponse.source || "backend",
            module: currentModule
          },
          userAfterFlow.estado
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

    safeLogErrorEvent({
      type: "process_incoming_message_error",
      phone: phone || null,
      message: message || null,
      error_message: error?.message || "unknown_error",
      stack: error?.stack || null
    });

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
        incomingMessage?.interactive?.list_reply?.id ||
        incomingMessage?.interactive?.button_reply?.id ||
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

    safeLogErrorEvent({
      type: "handle_webhook_payload_error",
      error_message: error?.message || "unknown_error",
      stack: error?.stack || null,
      payload_preview: {
        has_entry: Boolean(payload?.entry),
        object: payload?.object || null
      }
    });

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