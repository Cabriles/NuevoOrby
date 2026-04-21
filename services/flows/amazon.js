const {
  logLeadEvent,
  logErrorEvent
} = require("../logger");

const { memberships } = require("../memberships");

// ========================================================
// HELPERS GENERALES
// ========================================================
function ensureAmazonFields(user) {
  if (!user) return;

  if (!user.score) user.score = 0;
  if (!user.amazon_rama) user.amazon_rama = null;
  if (!user.amazon_situacion) user.amazon_situacion = null;
  if (!user.amazon_necesidad) user.amazon_necesidad = null;
  if (!user.amazon_plan) user.amazon_plan = null;
  if (!user.callback_phone) user.callback_phone = null;
  if (!user.callback_schedule) user.callback_schedule = null;

  if (!user.amazon_ai_turns) user.amazon_ai_turns = 0;
  if (typeof user.amazon_cta_enabled !== "boolean") {
    user.amazon_cta_enabled = false;
  }
  if (!user.amazon_last_user_reply) user.amazon_last_user_reply = null;
}

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function saveAndLog({
  phone,
  user,
  saveUser,
  eventType,
  detail = {}
}) {
  saveUser(phone, user);

  try {
    logLeadEvent({
      phone,
      module: "amazon",
      event_type: eventType,
      estado: user.estado,
      interes_principal: user.interes_principal,
      subopcion: user.subopcion,
      score: user.score,
      detail
    });
  } catch (error) {
    console.error("Error registrando log amazon:", error.message);
  }
}

function moveToState({
  phone,
  user,
  saveUser,
  nextState,
  eventType = "flow_step",
  detail = {}
}) {
  user.estado = nextState;

  saveAndLog({
    phone,
    user,
    saveUser,
    eventType,
    detail
  });
}

function isLikelyPhoneNumber(text = "") {
  const cleaned = String(text).replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

function getStandardCTA() {
  return `Si quieres avanzar con esto, puedo ayudarte por aquí o también puedes agendar una llamada o reunión con uno de nuestros asesores para revisar tu caso con más detalle.

1️⃣ Que me contacten por WhatsApp
2️⃣ Quiero agendar una reunión`;
}

function buildHybridReply(aiReply, withCTA = false) {
  let cleanReply = String(aiReply || "").trim();

  cleanReply = highlightBrand(cleanReply);

  cleanReply = cleanReply
    .split("\n\n")
    .map((p) => highlightDecisionLead(p))
    .join("\n\n");

  if (withCTA) {
    return `${cleanReply}

${getStandardCTA()}`;
  }

  return cleanReply;
}

function buildCallbackConfirmationReply(callbackPhone, callbackSchedule) {
  return `Perfecto. Hemos tomado tu solicitud.

📞 Número de contacto: ${callbackPhone}
🕒 Horario solicitado: ${callbackSchedule}

Uno de nuestros asesores te contactará por WhatsApp para revisar tu caso con más detalle.`;
}

function buildMeetingReply(CALENDLY_LINK) {
  return `Perfecto. Aquí tienes el enlace para agendar tu reunión:

${CALENDLY_LINK}

Cuando la reserves, ya tendremos una base más clara para revisar tu caso.`;
}

function bold(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return "";
  if (clean.startsWith("*") && clean.endsWith("*")) return clean;
  return `*${clean}*`;
}

function highlightBrand(text = "") {
  return String(text || "").replace(/\bOneOrbix\b/g, "*OneOrbix*");
}

function highlightDecisionLead(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return clean;

  const patterns = [
    /^La prioridad aquí es/i,
    /^El punto clave aquí es/i,
    /^El riesgo aquí es/i,
    /^Lo importante aquí es/i,
    /^En este punto vale la pena/i,
    /^Primero hay que/i,
    /^Aquí conviene/i,
    /^Aquí lo importante/i,
    /^Aquí tendría sentido/i,
    /^Aquí lo más útil/i
  ];

  for (const pattern of patterns) {
    if (pattern.test(clean)) {
      return bold(clean);
    }
  }

  return clean;
}

// ========================================================
// HELPERS MEMBRESÍAS
// ========================================================
function getMembershipByAmazonPlan(planKey) {
  const map = {
    plan_basico: memberships?.basico || null,
    plan_profesional: memberships?.profesional || null,
    plan_premium: memberships?.premium || null
  };

  return map[planKey] || null;
}

function buildPlanIncludesReply(planKey) {
  const plan = getMembershipByAmazonPlan(planKey);

  if (!plan) {
    return `Perfecto. En este momento no pude recuperar la información completa de ese plan.

${getStandardCTA()}`;
  }

  const includesText = Array.isArray(plan.incluye)
    ? plan.incluye.map((item) => `- ${item}`).join("\n")
    : "- Información no disponible";

  return `Perfecto. Aquí tienes lo más importante sobre el ${plan.nombre}:

💰 Valor: ${plan.precio}

✅ Ideal para:
${plan.idealPara}

📦 Incluye:
${includesText}

📝 Resumen:
${plan.resumen}

🔗 Ver plan:
${plan.link}

${getStandardCTA()}`;
}

function buildPlanAccessReply(planKey) {
  const plan = getMembershipByAmazonPlan(planKey);

  if (!plan) {
    return `Perfecto. En este momento no pude recuperar el enlace de ese plan.

${getStandardCTA()}`;
  }

  return `Perfecto. Aquí tienes el acceso directo al ${plan.nombre}:

🔗 Ver detalles del plan:
${plan.link}

💳 Ir al pago directo:
${plan.payLink}

Si antes de avanzar quieres confirmar si este plan es el más adecuado para tu caso, también puedo orientarte.

${getStandardCTA()}`;
}

// ========================================================
// FORMATTERS
// ========================================================
function formatRama(value) {
  const map = {
    ya_tengo_producto: "Ya tengo un producto para vender",
    no_se_producto: "Aún no sé qué producto vender",
    empezar_desde_cero: "Quiero empezar desde cero",
    membresias: "Ver Planes de Membresía"
  };

  return map[value] || value || "No definido";
}

function formatSituacion(value) {
  const map = {
    ya_lo_vendo: "ya lo vendo",
    definido_no_vendo: "aún no lo vendo, pero ya lo tengo definido",
    marca_propia: "quiero crear una marca propia",
    revender_fba: "quiero revender productos en Amazon FBA",
    primera_vez: "es mi primera vez",
    he_investigado: "ya he investigado un poco",
    plan_basico: "Plan básico",
    plan_profesional: "Plan profesional",
    plan_premium: "Plan premium"
  };

  return map[value] || value || "No definido";
}

function formatNecesidad(value) {
  const map = {
    validar_producto: "validar si el producto funciona en Amazon",
    empezar_vender: "saber cómo empezar a vender en Amazon",
    producto_con_potencial: "encontrar un producto con potencial",
    validar_idea_producto: "validar una idea de producto",
    asistencia_paso_a_paso: "empezar a vender en Amazon paso a paso",
    elegir_producto_correctamente: "ver cómo elegir un producto correctamente",
    ver_incluye_plan: "ver qué incluye este plan",
    acceder_plan: "acceder al plan o recibir el enlace"
  };

  return map[value] || value || "No definido";
}

function getPlanName(planKey) {
  const map = {
    plan_basico: "Plan básico",
    plan_profesional: "Plan profesional",
    plan_premium: "Plan premium"
  };

  return map[planKey] || "este plan";
}

// ========================================================
// COPY COMERCIAL / FALLBACKS
// ========================================================
function buildAmazonMembershipSuggestion(user) {
  if (user.amazon_rama === "no_se_producto") {
    return `Además, como todavía estás definiendo producto, una membresía puede ayudarte a ordenar mejor el criterio de selección, validar ideas con más estructura y reducir errores al momento de elegir.`;
  }

  if (user.amazon_rama === "empezar_desde_cero") {
    return `Además, como estás empezando desde cero, una membresía puede darte una ruta más clara para avanzar con orden, entender mejor el proceso y evitar varios errores comunes del inicio.`;
  }

  return "";
}

function buildAmazonPriority(user) {
  if (user.amazon_rama === "ya_tengo_producto") {
    if (user.amazon_necesidad === "validar_producto") {
      return "validar demanda, competencia, márgenes y viabilidad real antes de invertir más";
    }

    if (user.amazon_necesidad === "empezar_vender") {
      return "ordenar los pasos de lanzamiento para no entrar a Amazon sin estructura";
    }
  }

  if (user.amazon_rama === "no_se_producto") {
    if (user.amazon_necesidad === "producto_con_potencial") {
      return "encontrar una opción con demanda suficiente, competencia manejable y espacio comercial";
    }

    if (user.amazon_necesidad === "validar_idea_producto") {
      return "comprobar si esa idea tiene sentido antes de convertirla en proyecto";
    }
  }

  if (user.amazon_rama === "empezar_desde_cero") {
    if (user.amazon_necesidad === "asistencia_paso_a_paso") {
      return "ordenar bien el proceso para entrar a Amazon con una hoja de ruta clara";
    }

    if (user.amazon_necesidad === "elegir_producto_correctamente") {
      return "usar criterio comercial para elegir mejor el producto antes de ejecutar";
    }
  }

  return "priorizar correctamente el siguiente paso según tu etapa actual";
}

function buildFirstTurnQuestion(user) {
  if (user.amazon_rama === "ya_tengo_producto") {
    if (user.amazon_necesidad === "validar_producto") {
      return "Para aterrizarlo mejor, dime algo puntual: hoy te preocupa más la competencia, los márgenes o saber si realmente vale la pena entrar con ese producto?";
    }

    if (user.amazon_necesidad === "empezar_vender") {
      return "Para orientarte mejor, dime qué te frena más hoy: entender el proceso, preparar el lanzamiento o definir qué paso tomar primero?";
    }
  }

  if (user.amazon_rama === "no_se_producto") {
    if (user.amazon_necesidad === "producto_con_potencial") {
      return "Para afinar la recomendación, dime qué te interesa más hoy: encontrar una categoría prometedora, reducir riesgo al elegir o detectar algo con margen real?";
    }

    if (user.amazon_necesidad === "validar_idea_producto") {
      return "Para orientarte mejor, dime qué necesitas comprobar primero: demanda, competencia o posibilidad real de diferenciar esa idea?";
    }
  }

  if (user.amazon_rama === "empezar_desde_cero") {
    if (user.amazon_necesidad === "asistencia_paso_a_paso") {
      return "Para aterrizar mejor esto, dime qué te pesa más hoy: no saber por dónde empezar, no entender el proceso completo o temer cometer errores al inicio?";
    }

    if (user.amazon_necesidad === "elegir_producto_correctamente") {
      return "Para afinar la recomendación, dime qué te preocupa más hoy: elegir mal el producto, no entender la demanda o entrar a una categoría demasiado competida?";
    }
  }

  return "Para orientarte mejor, dime qué necesitas resolver primero dentro de tu proceso con Amazon?";
}

function buildFallbackReply(user) {
  const priority = buildAmazonPriority(user);
  const question = buildFirstTurnQuestion(user);

  if (user.amazon_rama === "ya_tengo_producto") {
    return `Tu caso ya tiene una base bastante clara, pero en esta etapa lo importante no es asumir que por tener producto ya todo está listo, sino revisar con criterio qué tan sólido es el siguiente paso para Amazon.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a aterrizar mejor la decisión para no avanzar a ciegas.

${question}`;
  }

  if (user.amazon_rama === "no_se_producto") {
    return `Aquí el error típico es correr a elegir cualquier producto solo por entusiasmo. En tu caso conviene poner más criterio antes de ejecutar para no entrar con una idea floja o mal validada.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a ordenar mejor el proceso y reducir errores tempranos.

${question}

${buildAmazonMembershipSuggestion(user)}`.trim();
  }

  if (user.amazon_rama === "empezar_desde_cero") {
    return `Cuando alguien empieza desde cero, el riesgo no está solo en no saber qué hacer, sino en avanzar sin estructura y perder tiempo o dinero en decisiones prematuras.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a dar forma al proceso y avanzar con una base más clara.

${question}

${buildAmazonMembershipSuggestion(user)}`.trim();
  }

  if (user.amazon_rama === "membresias") {
    return `Perfecto. Ya veo que te interesa ${getPlanName(user.amazon_plan)} y ahora lo que buscas es ${formatNecesidad(user.amazon_necesidad)}.

Lo importante aquí es entender si este plan encaja realmente con tu etapa actual y cómo puede ayudarte a avanzar con más claridad en Amazon.`;
  }

  return `Ya tengo una idea más clara de tu caso.

El siguiente paso es ordenar mejor la necesidad para orientarte con una recomendación más precisa y útil.

${question}`;
}

function buildSecondTurnAnchor(userMessage = "") {
  const clean = String(userMessage || "").trim().toLowerCase();

  if (!clean) {
    return "Aquí ya conviene bajar esto a una decisión más puntual para que el siguiente paso en Amazon no se tome a ciegas.";
  }

  if (clean.includes("compet")) {
    return "Si hoy lo que más te pesa es la competencia, entonces lo importante no es solo ver cuántos vendedores hay, sino qué tan saturado está el espacio y si todavía existe margen para entrar con criterio.";
  }

  if (clean.includes("margen") || clean.includes("rentab")) {
    return "Si el punto delicado está en los márgenes, entonces conviene revisar con cuidado costos, comisiones, logística y presión de precio antes de asumir que el producto realmente deja utilidad.";
  }

  if (clean.includes("demanda")) {
    return "Si la duda principal está en la demanda, entonces lo más sensato es validar si hay movimiento real y sostenido, no solo señales superficiales que puedan confundir.";
  }

  if (clean.includes("producto")) {
    return "Si el foco está en elegir bien el producto, entonces conviene trabajar el criterio de selección con más rigor para evitar entrar con una opción que se vea atractiva, pero no sea sólida para Amazon.";
  }

  if (clean.includes("empezar") || clean.includes("inicio")) {
    return "Si hoy el reto está en saber cómo empezar, entonces la clave es ordenar primero el recorrido y no lanzarte a ejecutar sin una secuencia clara.";
  }

  if (clean.includes("marca")) {
    return "Si lo que te interesa es marca propia, entonces conviene validar mejor diferenciación, viabilidad y capacidad real de sostener esa propuesta en Amazon.";
  }

  if (clean.includes("fba") || clean.includes("revender")) {
    return "Si el enfoque está en revender por FBA, entonces lo importante es detectar productos con salida real y evitar categorías donde la presión competitiva se coma el margen.";
  }

  return `Con lo que mencionas sobre "${userMessage}", lo importante ahora es aterrizar mejor ese punto para que la decisión no se quede en intuición, sino en criterio comercial real.`;
}

function buildSecondTurnImplementationDetail(user, userMessage = "") {
  const msg = String(userMessage || "").trim().toLowerCase();

  if (user.amazon_rama === "ya_tengo_producto") {
    if (user.amazon_necesidad === "validar_producto") {
      if (msg.includes("compet")) {
        return "Aquí tendría sentido revisar saturación, tipo de competencia, posicionamiento y posibilidad real de diferenciarte, porque no basta con ver que el producto ya se vende.";
      }

      if (msg.includes("margen") || msg.includes("rentab")) {
        return "Aquí lo más útil sería desarmar el número completo para ver si después de comisiones, logística, publicidad y presión de precio el producto sigue siendo defendible.";
      }

      if (msg.includes("demanda")) {
        return "Aquí conviene validar si esa demanda es consistente y si se sostiene en el tiempo, porque entrar por una señal débil puede dar una falsa sensación de oportunidad.";
      }

      return "Aquí conviene revisar la viabilidad real del producto antes de empujar lanzamiento, para que el siguiente paso en Amazon se apoye en datos y no solo en intuición.";
    }

    if (user.amazon_necesidad === "empezar_vender") {
      return "Aquí lo importante sería ordenar bien el arranque, definir prioridades y evitar improvisar el lanzamiento, porque en Amazon los errores del inicio suelen salir caros.";
    }
  }

  if (user.amazon_rama === "no_se_producto") {
    if (user.amazon_necesidad === "producto_con_potencial") {
      if (msg.includes("margen")) {
        return "Aquí conviene buscar una oportunidad donde el margen siga teniendo sentido después de todos los costos reales, porque un producto atractivo sin margen termina siendo una mala elección.";
      }

      if (msg.includes("demanda")) {
        return "Aquí lo más útil sería identificar categorías donde la demanda sea suficientemente clara y no dependa de modas débiles o señales engañosas.";
      }

      return "Aquí tendría sentido trabajar un criterio de selección más fino para detectar una opción con más potencial real y menos riesgo de entrar a una categoría equivocada.";
    }

    if (user.amazon_necesidad === "validar_idea_producto") {
      return "Aquí conviene revisar si esa idea tiene espacio comercial real, si se puede defender mejor frente a la competencia y si vale la pena convertirla en proyecto antes de avanzar.";
    }
  }

  if (user.amazon_rama === "empezar_desde_cero") {
    if (user.amazon_necesidad === "asistencia_paso_a_paso") {
      return "Aquí lo más sano sería ordenar el proceso por etapas, definir qué va primero y quitar ruido desde el inicio para que el avance no dependa de ensayo y error.";
    }

    if (user.amazon_necesidad === "elegir_producto_correctamente") {
      return "Aquí conviene construir un criterio sólido de elección para no dejarte llevar por ideas llamativas pero flojas en demanda, competencia o rentabilidad.";
    }
  }

  return "Aquí conviene aterrizar mejor ese punto específico para que el siguiente paso en Amazon sea más claro, más defendible y con menos riesgo de error.";
}

function buildStrongSecondTurnFallback(user, userMessage) {
  const anchor = buildSecondTurnAnchor(userMessage);
  const detail = buildSecondTurnImplementationDetail(user, userMessage);

  return `${anchor}

${detail} Ahí es donde OneOrbix puede ayudarte a bajar esto a una decisión más clara, con criterio comercial y un siguiente paso mejor definido.`;
}

// ========================================================
// HELPERS DE CALIDAD HÍBRIDA
// ========================================================
function sanitizeHybridText(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text = "") {
  const clean = sanitizeHybridText(text);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(text = "") {
  const clean = sanitizeHybridText(text);
  if (!clean) return 0;

  return clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

function looksLikeQuestion(text = "") {
  const clean = String(text || "").trim();
  return clean.includes("?") || clean.includes("¿");
}

function containsAnyKeyword(text = "", keywords = []) {
  const clean = normalizeText(text);
  return keywords.some((keyword) => clean.includes(normalizeText(keyword)));
}

function stripTrailingQuestionParagraphs(text = "") {
  const paragraphs = sanitizeHybridText(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return "";

  while (paragraphs.length > 1 && looksLikeQuestion(paragraphs[paragraphs.length - 1])) {
    paragraphs.pop();
  }

  return paragraphs.join("\n\n").trim();
}

function ensureTwoParagraphStructure(text = "") {
  const clean = sanitizeHybridText(text);
  if (!clean) return clean;

  if (countParagraphs(clean) >= 2) return clean;

  const parts = clean.split(". ").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return clean;

  const midpoint = Math.ceil(parts.length / 2);
  const first = parts.slice(0, midpoint).join(". ").trim();
  const second = parts.slice(midpoint).join(". ").trim();

  if (!first || !second) return clean;

  return `${first}${first.endsWith(".") ? "" : "."}

${second}${second.endsWith(".") ? "" : "."}`.trim();
}

function ensureFirstTurnHasQuestion(text = "", user) {
  const clean = sanitizeHybridText(text);

  if (looksLikeQuestion(clean)) return clean;

  return `${clean}

${buildFirstTurnQuestion(user)}`.trim();
}

function ensureFirstTurnHasConsultiveDepth(text = "", user) {
  let clean = sanitizeHybridText(text);

  const needsReinforcement =
    countWords(clean) < 50 ||
    countParagraphs(clean) < 2 ||
    !containsAnyKeyword(clean, ["amazon", "producto", "demanda", "competencia", "margen", "oneorbix", "vender"]);

  if (needsReinforcement) {
    clean = buildFallbackReply(user);
  }

  clean = ensureTwoParagraphStructure(clean);
  clean = ensureFirstTurnHasQuestion(clean, user);

  return clean.trim();
}

function ensureSecondTurnNoRepeatedQuestion(text = "") {
  const clean = sanitizeHybridText(text);

  if (!looksLikeQuestion(clean)) return clean;

  return stripTrailingQuestionParagraphs(clean);
}

function ensureSecondTurnHasSubstance(text = "", user, userMessage = "") {
  let clean = sanitizeHybridText(text);

  const needsReinforcement =
    countWords(clean) < 42 ||
    countParagraphs(clean) < 2 ||
    !containsAnyKeyword(clean, ["amazon", "producto", "criterio", "demanda", "competencia", "margen", "oneorbix", "decisión"]);

  if (needsReinforcement) {
    clean = buildStrongSecondTurnFallback(user, userMessage);
  }

  clean = ensureTwoParagraphStructure(clean);
  clean = ensureSecondTurnNoRepeatedQuestion(clean);

  return clean.trim();
}

function maybeReinforceSecondTurnBeforeCTA(text = "", user, userMessage = "") {
  let clean = ensureSecondTurnHasSubstance(text, user, userMessage);

  if (looksLikeQuestion(clean)) {
    clean = stripTrailingQuestionParagraphs(clean).trim();
  }

  if (countWords(clean) < 48) {
    clean = buildStrongSecondTurnFallback(user, userMessage);
  }

  return clean.trim();
}

// ========================================================
// PROMPT GEMINI
// ========================================================
function buildGeminiPrompt(user, isFollowUp = false, userMessage = "", withCTA = false) {
  const firstTurnQuestion = buildFirstTurnQuestion(user);

  const closingInstruction = withCTA
    ? `- Cierra de forma natural, sin hacer preguntas finales, porque el backend añadirá el siguiente paso comercial.`
    : isFollowUp
      ? `- Si todavía conviene profundizar, puedes cerrar con una sola micro-pregunta muy específica.
- No repitas la misma pregunta del primer turno.
- Si ya hay suficiente contexto, no hagas pregunta final.`
      : `- Cierra con una sola pregunta útil para explorar mejor el caso.
- Usa como referencia este tipo de pregunta: "${firstTurnQuestion}"`;

  const contextBlock = isFollowUp
    ? `FOCO DEL SEGUNDO TURNO
- No repitas la arquitectura general ya mencionada.
- No vuelvas a explicar el flujo completo.
- Concéntrate solo en el punto específico que acaba de mencionar el usuario.
- Aporta una implicación práctica, una recomendación puntual y un siguiente paso lógico.`
    : `CONTEXTO DEL CASO
- Módulo: Amazon FBA
- Rama: ${formatRama(user.amazon_rama)}
- Situación actual: ${formatSituacion(user.amazon_situacion)}
- Necesidad principal: ${formatNecesidad(user.amazon_necesidad)}
- Plan seleccionado: ${getPlanName(user.amazon_plan)}`;

  const turnInstruction = isFollowUp
    ? `- Estás en el SEGUNDO Y ÚLTIMO TURNO híbrido.
- El usuario ya respondió la pregunta del primer turno o agregó un matiz importante.
- Debes usar esa respuesta para profundizar con criterio.
- No reformules el mismo resumen del caso.
- No repitas el mismo copy del primer turno.
- Aporta una recomendación más puntual, más práctica y más específica para este caso.
- Explica brevemente cómo OneOrbix ayudaría a aterrizar esa decisión.`
    : `- Estás en el PRIMER TURNO híbrido.
- Debes sonar distinto al backend y aportar valor desde el inicio.
- Explica qué conviene priorizar en este caso.
- Da una recomendación útil y aterrizada.
- Puedes mencionar de forma natural que una membresía ayuda a ordenar mejor el proceso cuando la persona aún no tiene producto o está empezando desde cero.
- Debes cerrar con una pregunta útil.`;

  return `
Eres Orby, asesor comercial senior de OneOrbix especializado en Amazon FBA.

Responde en español.
Sé claro, útil, consultivo y comercial.
No inventes precios, paquetes ni servicios no definidos.
No pongas botones.
No menciones que eres una IA.
No repitas el flujo completo.
No cierres con CTA, porque eso lo agregará el backend.

${contextBlock}

${isFollowUp ? `RESPUESTA MÁS RECIENTE DEL USUARIO:
"${String(userMessage || "").trim()}"` : `MOMENTO:
Primera intervención híbrida después de que el backend ya estructuró el caso.`}

INSTRUCCIONES
- Aporta valor desde la primera línea.
- Debe quedar claro qué conviene priorizar y por qué.
- La respuesta debe sonar a orientación comercial real, no a texto genérico.
- Evita respuestas vacías o demasiado cortas.
- Escribe entre 2 y 3 párrafos cortos.
${turnInstruction}
${closingInstruction}
  `.trim();
}

// ========================================================
// RESOLVERS HÍBRIDOS
// ========================================================
async function resolveQualifiedReply({
  user,
  getGeminiReplyWithFallback,
  withCTA = false
}) {
  if (user.amazon_rama === "membresias") {
    if (user.amazon_necesidad === "ver_incluye_plan") {
      return buildPlanIncludesReply(user.amazon_plan);
    }

    if (user.amazon_necesidad === "acceder_plan") {
      return buildPlanAccessReply(user.amazon_plan);
    }
  }

  const fallbackReply = buildFallbackReply(user);

  if (typeof getGeminiReplyWithFallback !== "function") {
    const safeReply = ensureFirstTurnHasConsultiveDepth(fallbackReply, user);
    return buildHybridReply(safeReply, withCTA);
  }

  const prompt = buildGeminiPrompt(user, false, "", withCTA);
  const aiReply = await getGeminiReplyWithFallback(
    prompt,
    user,
    fallbackReply
  );

  let finalReply = aiReply || fallbackReply;
  finalReply = ensureFirstTurnHasConsultiveDepth(finalReply, user);

  return buildHybridReply(finalReply, withCTA);
}

async function resolveFollowUpReply({
  user,
  rawMessage,
  getGeminiReplyWithFallback,
  withCTA = false
}) {
  const fallbackReply = buildStrongSecondTurnFallback(user, rawMessage);

  if (typeof getGeminiReplyWithFallback !== "function") {
    const safeReply = withCTA
      ? maybeReinforceSecondTurnBeforeCTA(fallbackReply, user, rawMessage)
      : ensureSecondTurnHasSubstance(fallbackReply, user, rawMessage);

    return buildHybridReply(safeReply, withCTA);
  }

  const prompt = buildGeminiPrompt(user, true, rawMessage, withCTA);
  const aiReply = await getGeminiReplyWithFallback(
    prompt,
    user,
    fallbackReply
  );

  let finalReply = aiReply || fallbackReply;

  if (withCTA) {
    finalReply = maybeReinforceSecondTurnBeforeCTA(finalReply, user, rawMessage);
  } else {
    finalReply = ensureSecondTurnHasSubstance(finalReply, user, rawMessage);
  }

  return buildHybridReply(finalReply, withCTA);
}

// ========================================================
// PROMPTS DEL MÓDULO
// ========================================================
function getAmazonIntro() {
  return `Perfecto. Cuéntame, ¿en qué punto estás con Amazon?

1️⃣ Ya tengo un producto para vender
2️⃣ Aún no sé qué producto vender
3️⃣ Quiero empezar desde cero
4️⃣ Ver Planes de Membresía`;
}

function getAmazonProductoP2() {
  return `¿Cuál es tu situación actual?

1️⃣ Ya lo vendo
2️⃣ Aún no lo vendo, pero ya lo tengo definido`;
}

function getAmazonProductoP3() {
  return `¿Qué necesitas ahora mismo?

1️⃣ Validar si ese producto funciona en Amazon
2️⃣ Saber cómo empezar a vender en Amazon`;
}

function getAmazonSinProductoP2() {
  return `¿Cuál es tu situación actual?

1️⃣ Crear una marca propia
2️⃣ Revender productos en Amazon FBA`;
}

function getAmazonSinProductoP3() {
  return `¿Qué necesitas ahora mismo?

1️⃣ Encontrar un producto con potencial
2️⃣ Validar una idea de producto`;
}

function getAmazonCeroP2() {
  return `¿Cuál es tu situación actual?

1️⃣ Es mi primera vez
2️⃣ Ya he investigado un poco`;
}

function getAmazonCeroP3() {
  return `¿Qué necesitas ahora mismo?

1️⃣ Asistencia para empezar a vender en Amazon paso a paso
2️⃣ Ver cómo elegir un producto correctamente`;
}

function getAmazonPlanesP2() {
  return `Perfecto. Estos son nuestros planes disponibles:

1️⃣ Plan básico
2️⃣ Plan profesional
3️⃣ Plan premium`;
}

function getAmazonPlanesP3() {
  return `¿Qué te gustaría hacer ahora?

1️⃣ Ver qué incluye este plan
2️⃣ Acceder al plan o recibir el enlace`;
}

// ========================================================
// MAPS DE OPCIONES
// ========================================================
function mapAmazonRama(option) {
  return {
    "1": "ya_tengo_producto",
    "2": "no_se_producto",
    "3": "empezar_desde_cero",
    "4": "membresias"
  }[option] || null;
}

function mapAmazonSituacion(rama, option) {
  if (rama === "ya_tengo_producto") {
    return {
      "1": "ya_lo_vendo",
      "2": "definido_no_vendo"
    }[option] || null;
  }

  if (rama === "no_se_producto") {
    return {
      "1": "marca_propia",
      "2": "revender_fba"
    }[option] || null;
  }

  if (rama === "empezar_desde_cero") {
    return {
      "1": "primera_vez",
      "2": "he_investigado"
    }[option] || null;
  }

  if (rama === "membresias") {
    return {
      "1": "plan_basico",
      "2": "plan_profesional",
      "3": "plan_premium"
    }[option] || null;
  }

  return null;
}

function mapAmazonNecesidad(rama, option) {
  if (rama === "ya_tengo_producto") {
    return {
      "1": "validar_producto",
      "2": "empezar_vender"
    }[option] || null;
  }

  if (rama === "no_se_producto") {
    return {
      "1": "producto_con_potencial",
      "2": "validar_idea_producto"
    }[option] || null;
  }

  if (rama === "empezar_desde_cero") {
    return {
      "1": "asistencia_paso_a_paso",
      "2": "elegir_producto_correctamente"
    }[option] || null;
  }

  if (rama === "membresias") {
    return {
      "1": "ver_incluye_plan",
      "2": "acceder_plan"
    }[option] || null;
  }

  return null;
}

// ========================================================
// FLOW PRINCIPAL
// ========================================================
async function handleAmazonFlow({
  user,
  phone,
  cleanMessage,
  message,
  saveUser,
  classifyLead,
  getGeminiReplyWithFallback,
  CALENDLY_LINK
}) {
  try {
    ensureAmazonFields(user);
    const rawMessage = String(message || cleanMessage || "").trim();
    const normalizedMessage = normalizeText(rawMessage);

    // =====================================================
    // CAPA 1
    // =====================================================
    if (user.estado === "amazon_p1") {
      const rama = mapAmazonRama(cleanMessage);

      if (!rama) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣, 3️⃣ o 4️⃣.",
          source: "backend"
        };
      }

      user.interes_principal = "amazon";
      user.amazon_rama = rama;
      user.score += rama === "membresias" ? 2 : 3;

      if (rama === "ya_tengo_producto") {
        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_producto_p2",
          detail: {
            selected_option: cleanMessage,
            branch: rama
          }
        });

        return {
          reply: getAmazonProductoP2(),
          source: "backend"
        };
      }

      if (rama === "no_se_producto") {
        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_sin_producto_p2",
          detail: {
            selected_option: cleanMessage,
            branch: rama
          }
        });

        return {
          reply: getAmazonSinProductoP2(),
          source: "backend"
        };
      }

      if (rama === "empezar_desde_cero") {
        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_cero_p2",
          detail: {
            selected_option: cleanMessage,
            branch: rama
          }
        });

        return {
          reply: getAmazonCeroP2(),
          source: "backend"
        };
      }

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_planes_p2",
        detail: {
          selected_option: cleanMessage,
          branch: rama
        }
      });

      return {
        reply: getAmazonPlanesP2(),
        source: "backend"
      };
    }

    // =====================================================
    // RAMA YA TENGO PRODUCTO
    // =====================================================
    if (user.estado === "amazon_producto_p2") {
      const situacion = mapAmazonSituacion("ya_tengo_producto", cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_situacion = situacion;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_producto_p3",
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getAmazonProductoP3(),
        source: "backend"
      };
    }

    if (user.estado === "amazon_producto_p3") {
      const necesidad = mapAmazonNecesidad("ya_tengo_producto", cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_necesidad = necesidad;
      user.score += 3;
      user.estado = classifyLead(user);
      user.amazon_ai_turns = 1;
      user.amazon_cta_enabled = false;
      user.amazon_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.amazon_rama,
          situacion: user.amazon_situacion,
          necesidad: user.amazon_necesidad,
          ai_turns: user.amazon_ai_turns
        }
      });

      return {
        reply: await resolveQualifiedReply({
          user,
          getGeminiReplyWithFallback,
          withCTA: false
        }),
        source: "hybrid"
      };
    }

    // =====================================================
    // RAMA NO SÉ QUÉ PRODUCTO
    // =====================================================
    if (user.estado === "amazon_sin_producto_p2") {
      const situacion = mapAmazonSituacion("no_se_producto", cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_situacion = situacion;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_sin_producto_p3",
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getAmazonSinProductoP3(),
        source: "backend"
      };
    }

    if (user.estado === "amazon_sin_producto_p3") {
      const necesidad = mapAmazonNecesidad("no_se_producto", cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_necesidad = necesidad;
      user.score += 3;
      user.estado = classifyLead(user);
      user.amazon_ai_turns = 1;
      user.amazon_cta_enabled = false;
      user.amazon_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.amazon_rama,
          situacion: user.amazon_situacion,
          necesidad: user.amazon_necesidad,
          ai_turns: user.amazon_ai_turns
        }
      });

      return {
        reply: await resolveQualifiedReply({
          user,
          getGeminiReplyWithFallback,
          withCTA: false
        }),
        source: "hybrid"
      };
    }

    // =====================================================
    // RAMA EMPEZAR DESDE CERO
    // =====================================================
    if (user.estado === "amazon_cero_p2") {
      const situacion = mapAmazonSituacion("empezar_desde_cero", cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_situacion = situacion;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_cero_p3",
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getAmazonCeroP3(),
        source: "backend"
      };
    }

    if (user.estado === "amazon_cero_p3") {
      const necesidad = mapAmazonNecesidad("empezar_desde_cero", cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_necesidad = necesidad;
      user.score += 3;
      user.estado = classifyLead(user);
      user.amazon_ai_turns = 1;
      user.amazon_cta_enabled = false;
      user.amazon_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.amazon_rama,
          situacion: user.amazon_situacion,
          necesidad: user.amazon_necesidad,
          ai_turns: user.amazon_ai_turns
        }
      });

      return {
        reply: await resolveQualifiedReply({
          user,
          getGeminiReplyWithFallback,
          withCTA: false
        }),
        source: "hybrid"
      };
    }

    // =====================================================
    // RAMA MEMBRESÍAS
    // =====================================================
    if (user.estado === "amazon_planes_p2") {
      const plan = mapAmazonSituacion("membresias", cleanMessage);

      if (!plan) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.amazon_situacion = plan;
      user.amazon_plan = plan;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_planes_p3",
        detail: {
          selected_option: cleanMessage,
          plan
        }
      });

      return {
        reply: getAmazonPlanesP3(),
        source: "backend"
      };
    }

    if (user.estado === "amazon_planes_p3") {
      const necesidad = mapAmazonNecesidad("membresias", cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_necesidad = necesidad;
      user.score += 2;
      user.estado = classifyLead(user);

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.amazon_rama,
          plan: user.amazon_plan,
          necesidad: user.amazon_necesidad
        }
      });

      return {
        reply: await resolveQualifiedReply({
          user,
          getGeminiReplyWithFallback,
          withCTA: true
        }),
        source: "backend"
      };
    }

    // =====================================================
    // FOLLOW-UP HÍBRIDO + CTA
    // =====================================================
    if (
      ["lead_curioso", "lead_tibio", "lead_calificado"].includes(user.estado) &&
      user.interes_principal === "amazon" &&
      user.amazon_rama !== "membresias"
    ) {
      if (user.amazon_cta_enabled) {
        if (cleanMessage === "1") {
          user.callback_phone = phone;

          moveToState({
            phone,
            user,
            saveUser,
            nextState: "amazon_asesor_confirmar_numero",
            eventType: "cta_whatsapp_selected",
            detail: {
              selected_option: "1",
              suggested_phone: phone
            }
          });

          return {
            reply: `Perfecto. ¿Deseas que uno de nuestros asesores te contacte a este mismo número?

${phone}

1️⃣ Sí, a este número
2️⃣ No, quiero dar otro número`,
            source: "backend"
          };
        }

        if (cleanMessage === "2") {
          user.estado = "amazon_reunion";

          saveAndLog({
            phone,
            user,
            saveUser,
            eventType: "cta_meeting_selected",
            detail: {
              selected_option: "2"
            }
          });

          return {
            reply: buildMeetingReply(CALENDLY_LINK),
            source: "backend"
          };
        }

        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.amazon_ai_turns += 1;
      user.amazon_last_user_reply = rawMessage;

      const mustShowCTA = user.amazon_ai_turns >= 2;

      if (mustShowCTA) {
        user.amazon_cta_enabled = true;
      }

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "hybrid_followup",
        detail: {
          ai_turns: user.amazon_ai_turns,
          cta_enabled: user.amazon_cta_enabled,
          user_message: rawMessage
        }
      });

      return {
        reply: await resolveFollowUpReply({
          user,
          rawMessage,
          getGeminiReplyWithFallback,
          withCTA: mustShowCTA
        }),
        source: "hybrid"
      };
    }

    // =====================================================
    // CTA FINAL MEMBRESÍAS -> WHATSAPP / REUNIÓN
    // =====================================================
    if (
      ["lead_curioso", "lead_tibio", "lead_calificado"].includes(user.estado) &&
      user.interes_principal === "amazon" &&
      user.amazon_rama === "membresias"
    ) {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_asesor_confirmar_numero",
          eventType: "cta_whatsapp_selected",
          detail: {
            selected_option: "1",
            suggested_phone: phone
          }
        });

        return {
          reply: `Perfecto. ¿Deseas que uno de nuestros asesores te contacte a este mismo número?

${phone}

1️⃣ Sí, a este número
2️⃣ No, quiero dar otro número`,
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.estado = "amazon_reunion";

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "cta_meeting_selected",
          detail: {
            selected_option: "2"
          }
        });

        return {
          reply: buildMeetingReply(CALENDLY_LINK),
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣ o 2️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // CONFIRMAR MISMO NÚMERO
    // =====================================================
    if (user.estado === "amazon_asesor_confirmar_numero") {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_asesor_horario",
          detail: {
            selected_option: "1",
            callback_phone: user.callback_phone
          }
        });

        return {
          reply: "Perfecto. Indícame en qué horario prefieres que te contacten por WhatsApp.",
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.callback_phone = null;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "amazon_asesor_otro_numero",
          detail: {
            selected_option: "2"
          }
        });

        return {
          reply: "Perfecto. Envíame el número al que deseas que te contacten.",
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣ o 2️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // CAPTURA DE OTRO NÚMERO
    // =====================================================
    if (user.estado === "amazon_asesor_otro_numero") {
      if (!isLikelyPhoneNumber(rawMessage)) {
        return {
          reply: "Por favor envíame un número válido para que podamos registrarlo correctamente.",
          source: "backend"
        };
      }

      user.callback_phone = rawMessage;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "amazon_asesor_horario",
        detail: {
          callback_phone: user.callback_phone
        }
      });

      return {
        reply: "Perfecto. Ahora indícame en qué horario prefieres que te contacten por WhatsApp.",
          source: "backend"
      };
    }

    // =====================================================
    // CAPTURA DE HORARIO
    // =====================================================
    if (user.estado === "amazon_asesor_horario") {
      if (!rawMessage || normalizedMessage.length < 2) {
        return {
          reply: "Por favor indícame un horario de contacto para poder registrarlo.",
          source: "backend"
        };
      }

      user.callback_schedule = rawMessage;
      user.estado = "finalizado";

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "callback_requested",
        detail: {
          callback_phone: user.callback_phone,
          callback_schedule: user.callback_schedule
        }
      });

      return {
        reply: buildCallbackConfirmationReply(
          user.callback_phone,
          user.callback_schedule
        ),
        source: "backend"
      };
    }

    // =====================================================
    // ESTADO REUNIÓN
    // =====================================================
    if (user.estado === "amazon_reunion") {
      return {
        reply: buildMeetingReply(CALENDLY_LINK),
        source: "backend"
      };
    }

    return null;
  } catch (error) {
    console.error("Error en handleAmazonFlow:", error);

    try {
      logErrorEvent({
        phone,
        module: "amazon",
        estado: user?.estado || null,
        interes_principal: user?.interes_principal || null,
        incoming_message: cleanMessage || null,
        error_message: error.message,
        stack: error.stack,
        detail: {
          flow: "amazon"
        }
      });
    } catch (logErr) {
      console.error("Error registrando log de error amazon:", logErr.message);
    }

    return {
      reply: "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      source: "backend"
    };
  }
}

module.exports = {
  handleAmazonFlow,
  getAmazonIntro,
  isLikelyPhoneNumber
};