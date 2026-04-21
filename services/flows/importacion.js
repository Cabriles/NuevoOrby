const {
  logLeadEvent,
  logErrorEvent
} = require("../logger");

// ========================================================
// HELPERS GENERALES
// ========================================================
function ensureImportacionFields(user) {
  if (!user) return;

  if (!user.score) user.score = 0;
  if (!user.interes_principal) user.interes_principal = null;

  if (!user.importacion_rama) user.importacion_rama = null;
  if (!user.importacion_situacion) user.importacion_situacion = null;
  if (!user.importacion_necesidad) user.importacion_necesidad = null;
  if (!user.importacion_metadata) user.importacion_metadata = null;

  if (!user.callback_phone) user.callback_phone = null;
  if (!user.callback_schedule) user.callback_schedule = null;

  if (!user.importacion_ai_turns) user.importacion_ai_turns = 0;
  if (typeof user.importacion_cta_enabled !== "boolean") {
    user.importacion_cta_enabled = false;
  }
  if (!user.importacion_last_user_reply) user.importacion_last_user_reply = null;
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
      module: "importacion",
      event_type: eventType,
      estado: user.estado,
      interes_principal: user.interes_principal,
      subopcion: user.subopcion,
      score: user.score,
      detail
    });
  } catch (error) {
    console.error("Error registrando log importacion:", error.message);
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
// FORMATTERS
// ========================================================
function formatRama(value) {
  const map = {
    importar_productos: "Importar productos",
    exportar_productos: "Exportar productos",
    buscar_proveedores: "Buscar proveedores o fabricantes"
  };

  return map[value] || value || "No definido";
}

function formatSituacion(value) {
  const map = {
    producto_definido: "ya tener el producto definido",
    buscando_producto: "estar buscando qué producto importar",

    producto_listo_exportar: "ya tener un producto listo para exportar",
    validar_viabilidad_exportacion: "tener un producto y necesitar validar si es viable",

    producto_a_buscar_definido: "ya saber qué producto necesitas",
    ayuda_definir_producto_busqueda: "necesitar ayuda para definir qué producto buscar"
  };

  return map[value] || value || "No definido";
}

function formatNecesidad(value) {
  const map = {
    como_traer_producto: "entender cómo traer ese producto",
    validar_viabilidad_importacion: "saber si vale la pena importarlo",

    identificar_producto_rentable: "identificar un producto rentable",
    elegir_producto_con_demanda: "elegir un producto con buena demanda",

    conseguir_compradores_exterior: "conseguir compradores o clientes en el exterior",
    guia_exportacion_paso_a_paso: "recibir asistencia para empezar a exportar paso a paso",

    encontrar_proveedores_confiables: "encontrar proveedores o fabricantes confiables",
    cotizar_y_comparar_proveedores: "cotizar y comparar proveedores"
  };

  return map[value] || value || "No definido";
}

function formatMetadata(value) {
  const map = {
    logistica_import: "la parte logística de importación",
    viabilidad_import: "la viabilidad comercial de importación",

    rentabilidad_nicho: "la rentabilidad del nicho",
    demanda_mercado: "la demanda del mercado",

    captacion_clientes: "la captación de compradores en el exterior",
    guia_export_inicial: "la estructura inicial para exportar correctamente",

    sourcing_confiable: "el sourcing confiable",
    comparativa_sourcing: "la comparación de proveedores y cotizaciones"
  };

  return map[value] || value || "No definido";
}

// ========================================================
// COPY CONSULTIVO BASE
// ========================================================
function buildImportacionPriority(user) {
  if (user.importacion_rama === "importar_productos") {
    if (user.importacion_metadata === "logistica_import") {
      return "entender bien la logística, los tiempos, la ruta y el impacto real de traer ese producto";
    }

    if (user.importacion_metadata === "viabilidad_import") {
      return "validar si la operación tiene sentido comercial antes de mover dinero o asumir costos";
    }

    if (user.importacion_metadata === "rentabilidad_nicho") {
      return "identificar una opción con mejor margen, menos riesgo y más lógica comercial";
    }

    if (user.importacion_metadata === "demanda_mercado") {
      return "elegir algo con una demanda más clara y menos probabilidad de equivocarse desde el inicio";
    }
  }

  if (user.importacion_rama === "exportar_productos") {
    if (user.importacion_metadata === "captacion_clientes") {
      return "aclarar cómo captar compradores reales antes de salir a mover producto sin estrategia";
    }

    if (user.importacion_metadata === "guia_export_inicial") {
      return "ordenar bien el proceso para exportar con una base más sólida y menos improvisación";
    }
  }

  if (user.importacion_rama === "buscar_proveedores") {
    if (user.importacion_metadata === "sourcing_confiable") {
      return "filtrar mejor proveedores para reducir riesgo y evitar decisiones basadas solo en precio";
    }

    if (user.importacion_metadata === "comparativa_sourcing") {
      return "comparar cotizaciones con más criterio y no quedarse solo en números sueltos";
    }
  }

  return "priorizar correctamente el siguiente paso para tomar una mejor decisión";
}

function buildFirstTurnQuestion(user) {
  if (user.importacion_rama === "importar_productos") {
    if (user.importacion_metadata === "logistica_import") {
      return bold("¿Qué te preocupa más hoy: costos logísticos, tiempos de llegada o entender bien el proceso para traer ese producto?");
    }

    if (user.importacion_metadata === "viabilidad_import") {
      return bold("¿Qué necesitas validar primero: márgenes, demanda o si realmente vale la pena importarlo?");
    }

    if (user.importacion_metadata === "rentabilidad_nicho") {
      return bold("¿Qué te preocupa más hoy: encontrar margen, reducir riesgo o detectar una categoría más rentable?");
    }

    if (user.importacion_metadata === "demanda_mercado") {
      return bold("¿Qué necesitas confirmar primero: demanda real, competencia o qué tan defendible sería ese producto en tu mercado?");
    }
  }

  if (user.importacion_rama === "exportar_productos") {
    if (user.importacion_metadata === "captacion_clientes") {
      return bold("¿Qué te preocupa más hoy: conseguir contactos reales, llegar al mercado correcto o saber cómo presentar mejor tu producto al exterior?");
    }

    if (user.importacion_metadata === "guia_export_inicial") {
      return bold("¿Qué te pesa más hoy: no saber por dónde empezar, entender los pasos correctos o evitar errores al inicio del proceso?");
    }
  }

  if (user.importacion_rama === "buscar_proveedores") {
    if (user.importacion_metadata === "sourcing_confiable") {
      return bold("¿Qué te preocupa más hoy: encontrar un proveedor serio, evitar estafas o saber cómo filtrar mejor las opciones?");
    }

    if (user.importacion_metadata === "comparativa_sourcing") {
      return bold("¿Qué necesitas resolver primero: comparar precios, evaluar calidad o entender cuál cotización realmente te conviene más?");
    }
  }

  return bold("¿Qué necesitas resolver primero dentro de tu caso?");
}

function buildFallbackReply(user) {
  const priority = buildImportacionPriority(user);
  const question = buildFirstTurnQuestion(user);

  if (user.importacion_rama === "importar_productos") {
    return `Aquí el punto importante no es solo mover un producto, sino asegurarte de que la decisión tenga sentido antes de entrar a costos, tiempos o riesgos que luego se vuelven difíciles de corregir.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a aterrizar mejor el siguiente paso con más criterio comercial y operativo.

${question}`;
  }

  if (user.importacion_rama === "exportar_productos") {
    return `Cuando alguien quiere exportar, el error típico es avanzar sin una estructura suficientemente clara y confiar en que el proceso se ordenará solo sobre la marcha.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a bajar esto a una ruta más sólida y menos improvisada.

${question}`;
  }

  return `En la búsqueda de proveedores, el riesgo no está solo en conseguir cotizaciones, sino en comparar mal, elegir sin filtro o asumir confianza donde todavía no hay suficiente base.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a tomar decisiones más confiables y mejor comparadas.

${question}`;
}

// ========================================================
// SEGUNDO TURNO: ANCLA Y DETALLE
// ========================================================
function buildSecondTurnAnchor(userMessage = "") {
  const clean = String(userMessage || "").trim().toLowerCase();

  if (!clean) {
    return "En este punto vale la pena bajar esto a una decisión más puntual para que el siguiente paso no se tome a ciegas.";
  }

  if (clean.includes("costo") || clean.includes("coste") || clean.includes("margen")) {
    return "El punto clave aquí es entender si la operación realmente se sostiene antes de decidir con base solo en intuición.";
  }

  if (clean.includes("demanda")) {
    return "La prioridad aquí es validar si hay movimiento real y suficiente espacio comercial antes de comprometerte con una operación difícil de rotar.";
  }

  if (clean.includes("compet")) {
    return "Lo importante aquí es medir qué tan defendible sería entrar en esa categoría y si todavía existe espacio comercial.";
  }

  if (clean.includes("tiempo") || clean.includes("logist") || clean.includes("envio")) {
    return "La prioridad aquí es ordenar bien la ruta operativa antes de asumir que traer o mover el producto será simple.";
  }

  if (clean.includes("proveedor") || clean.includes("fabrica") || clean.includes("fábrica")) {
    return "El riesgo aquí es quedarte con la cotización más atractiva sin filtrar mejor confiabilidad y respaldo.";
  }

  if (clean.includes("cliente") || clean.includes("comprador")) {
    return "Lo importante aquí es trabajar mejor el acceso al mercado y no confiar en que el producto se venderá por sí solo.";
  }

  if (clean.includes("export")) {
    return "La prioridad aquí es ordenar mejor la estructura inicial antes de salir a ejecutar.";
  }

  return "La prioridad aquí es aterrizar mejor ese punto para que la decisión se apoye en criterio comercial real y no solo en intuición.";
}

function buildSecondTurnImplementationDetail(user, userMessage = "") {
  const msg = String(userMessage || "").trim().toLowerCase();

  if (user.importacion_rama === "importar_productos") {
    if (user.importacion_metadata === "logistica_import") {
      if (msg.includes("costo") || msg.includes("coste")) {
        return "Lo importante aquí es revisar el costo completo puesto en destino, porque mirar solo el precio de origen suele dar una lectura engañosa de la operación.";
      }

      if (msg.includes("tiempo") || msg.includes("logist") || msg.includes("envio")) {
        return "La prioridad aquí es entender mejor tiempos, ruta, tipo de embarque y posibles fricciones para que la logística no termine rompiendo la rentabilidad esperada.";
      }

      return "Primero hay que ordenar bien la parte operativa para que traer ese producto no dependa de suposiciones, sino de un proceso más claro y controlable.";
    }

    if (user.importacion_metadata === "viabilidad_import") {
      if (msg.includes("margen") || msg.includes("costo")) {
        return "El punto clave aquí es desarmar bien la estructura de costos para ver si después de logística, nacionalización y rotación el producto sigue siendo defendible.";
      }

      if (msg.includes("demanda")) {
        return "La prioridad aquí es confirmar si la demanda es suficientemente clara y sostenible antes de convertir esa idea en una operación de importación.";
      }

      return "Lo importante aquí es revisar si el producto realmente se sostiene como negocio y no solo como una idea que parece buena en papel.";
    }

    if (user.importacion_metadata === "rentabilidad_nicho") {
      return "Primero hay que construir mejor el criterio de selección para que la elección no dependa solo de intuición, sino de margen, rotación y sentido comercial real.";
    }

    if (user.importacion_metadata === "demanda_mercado") {
      if (msg.includes("demanda")) {
        return "Lo importante aquí es validar si existe un movimiento real en el mercado y no solo señales superficiales que puedan dar una falsa sensación de oportunidad.";
      }

      if (msg.includes("compet")) {
        return "La prioridad aquí es revisar qué tan saturado está el espacio y si todavía existe margen para entrar con una propuesta defendible.";
      }

      return "El punto clave aquí es confirmar si el producto tiene espacio comercial suficiente para no entrar a una categoría floja o demasiado competida.";
    }
  }

  if (user.importacion_rama === "exportar_productos") {
    if (user.importacion_metadata === "captacion_clientes") {
      if (msg.includes("cliente") || msg.includes("comprador")) {
        return "La prioridad aquí es trabajar mejor cómo identificar, abordar y filtrar compradores potenciales para que la búsqueda no se quede en contactos fríos sin avance real.";
      }

      return "Lo importante aquí es ordenar mejor la estrategia de acceso al mercado para que la captación de compradores tenga una base más realista y comercial.";
    }

    if (user.importacion_metadata === "guia_export_inicial") {
      return "Primero hay que ordenar el proceso por etapas, definir mejor qué va primero y evitar errores típicos del arranque que luego retrasan o encarecen todo.";
    }
  }

  if (user.importacion_rama === "buscar_proveedores") {
    if (user.importacion_metadata === "sourcing_confiable") {
      if (msg.includes("proveedor") || msg.includes("fabrica") || msg.includes("fábrica")) {
        return "El punto clave aquí es establecer mejores filtros de validación para no quedarte solo con una opción que luce bien en precio pero no en confiabilidad.";
      }

      return "La prioridad aquí es trabajar un sourcing más confiable para reducir riesgo y tomar decisiones con más respaldo antes de negociar o avanzar.";
    }

    if (user.importacion_metadata === "comparativa_sourcing") {
      if (msg.includes("precio") || msg.includes("cotiz")) {
        return "Lo importante aquí es comparar cotizaciones con más criterio, revisando qué incluye cada una y no solo el número final.";
      }

      if (msg.includes("calidad")) {
        return "El riesgo aquí es tomar una decisión barata que después salga cara en operación o en producto.";
      }

      return "La prioridad aquí es ordenar mejor la comparación para que la decisión entre proveedores no quede reducida a una lectura superficial de cotizaciones.";
    }
  }

  return "La prioridad aquí es aterrizar mejor ese punto para que el siguiente paso sea más claro, más útil y más defendible comercialmente.";
}

function buildStrongSecondTurnFallback(user, userMessage) {
  const anchor = buildSecondTurnAnchor(userMessage);
  const detail = buildSecondTurnImplementationDetail(user, userMessage);

  return `${anchor}

${detail} Ahí es donde OneOrbix puede ayudarte a bajar esto a una decisión más clara, con criterio comercial y una ejecución mejor orientada.`;
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
    !containsAnyKeyword(clean, ["import", "export", "proveedor", "producto", "mercado", "logistica", "logística", "oneorbix", "costos", "coste"]);

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
    !containsAnyKeyword(clean, ["import", "export", "proveedor", "mercado", "costos", "cliente", "oneorbix", "criterio", "logistica", "logística"]);

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
- No vuelvas a explicar el caso completo.
- Concéntrate solo en el punto específico que acaba de mencionar el usuario.
- Aporta una implicación práctica, una recomendación puntual y un siguiente paso lógico.`
    : `CONTEXTO DEL CASO
- Módulo: Importación y Comercio Exterior
- Rama: ${formatRama(user.importacion_rama)}
- Situación actual: ${formatSituacion(user.importacion_situacion)}
- Necesidad principal: ${formatNecesidad(user.importacion_necesidad)}
- Enfoque específico: ${formatMetadata(user.importacion_metadata)}`;

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
- Debes cerrar con una pregunta útil.`;

  return `
Eres Orby, asesor comercial senior de OneOrbix especializado en importación, exportación, sourcing y comercio exterior.

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
function getImportacionIntro() {
  return `Para ayudarte mejor, dime qué quieres hacer:

1️⃣ Importar productos
2️⃣ Exportar productos
3️⃣ Buscar proveedores o fabricantes`;
}

function getImportarPromptP2() {
  return `¿Cómo estás actualmente?

1️⃣ Ya tengo el producto definido
2️⃣ Estoy buscando qué producto importar`;
}

function getImportarPromptP3(user) {
  if (user.importacion_situacion === "producto_definido") {
    return `¿Qué necesitas ahora mismo?

1️⃣ Cómo traer ese producto
2️⃣ Saber si vale la pena importarlo`;
  }

  return `¿Qué necesitas ahora mismo?

1️⃣ Identificar un producto rentable
2️⃣ Elegir un producto con buena demanda`;
}

function getExportarPromptP2() {
  return `¿Cuál es tu situación actual?

1️⃣ Ya tengo producto listo para exportar
2️⃣ Tengo producto pero necesito validar si es viable`;
}

function getExportarPromptP3() {
  return `¿Qué necesitas ahora mismo?

1️⃣ Conseguir compradores o clientes en el exterior
2️⃣ Asistencia para empezar a exportar paso a paso`;
}

function getProveedoresPromptP2() {
  return `¿Cuál es tu caso?

1️⃣ Ya sé qué producto necesito
2️⃣ Necesito ayuda para definir qué producto buscar`;
}

function getProveedoresPromptP3() {
  return `¿Qué necesitas ahora mismo?

1️⃣ Encontrar proveedores o fabricantes confiables
2️⃣ Asistencia para cotizar y comparar proveedores`;
}

// ========================================================
// MAPEO DE OPCIONES
// ========================================================
function mapRama(option) {
  return {
    "1": "importar_productos",
    "2": "exportar_productos",
    "3": "buscar_proveedores"
  }[option] || null;
}

function mapImportarSituacion(option) {
  return {
    "1": "producto_definido",
    "2": "buscando_producto"
  }[option] || null;
}

function mapImportarNecesidad(situacion, option) {
  if (situacion === "producto_definido") {
    return {
      "1": "como_traer_producto",
      "2": "validar_viabilidad_importacion"
    }[option] || null;
  }

  return {
    "1": "identificar_producto_rentable",
    "2": "elegir_producto_con_demanda"
  }[option] || null;
}

function resolveImportarMetadata(situacion, necesidad) {
  if (situacion === "producto_definido") {
    if (necesidad === "como_traer_producto") return "logistica_import";
    if (necesidad === "validar_viabilidad_importacion") return "viabilidad_import";
  }

  if (situacion === "buscando_producto") {
    if (necesidad === "identificar_producto_rentable") return "rentabilidad_nicho";
    if (necesidad === "elegir_producto_con_demanda") return "demanda_mercado";
  }

  return null;
}

function mapExportarSituacion(option) {
  return {
    "1": "producto_listo_exportar",
    "2": "validar_viabilidad_exportacion"
  }[option] || null;
}

function mapExportarNecesidad(option) {
  return {
    "1": "conseguir_compradores_exterior",
    "2": "guia_exportacion_paso_a_paso"
  }[option] || null;
}

function resolveExportarMetadata(necesidad) {
  if (necesidad === "conseguir_compradores_exterior") return "captacion_clientes";
  if (necesidad === "guia_exportacion_paso_a_paso") return "guia_export_inicial";
  return null;
}

function mapProveedoresSituacion(option) {
  return {
    "1": "producto_a_buscar_definido",
    "2": "ayuda_definir_producto_busqueda"
  }[option] || null;
}

function mapProveedoresNecesidad(option) {
  return {
    "1": "encontrar_proveedores_confiables",
    "2": "cotizar_y_comparar_proveedores"
  }[option] || null;
}

function resolveProveedoresMetadata(necesidad) {
  if (necesidad === "encontrar_proveedores_confiables") return "sourcing_confiable";
  if (necesidad === "cotizar_y_comparar_proveedores") return "comparativa_sourcing";
  return null;
}

// ========================================================
// FLOW PRINCIPAL
// ========================================================
async function handleImportacionFlow({
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
    ensureImportacionFields(user);

    const rawMessage = String(message || cleanMessage || "").trim();
    const normalizedMessage = normalizeText(rawMessage);

    // =====================================================
    // CAPA 1
    // =====================================================
    if (user.estado === "importacion_p1") {
      const rama = mapRama(cleanMessage);

      if (!rama) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.interes_principal = "importacion";
      user.importacion_rama = rama;

      if (rama === "importar_productos") user.score += 3;
      if (rama === "exportar_productos") user.score += 3;
      if (rama === "buscar_proveedores") user.score += 2;

      let nextState = "importacion_p1";

      if (rama === "importar_productos") nextState = "importacion_importar_p2";
      if (rama === "exportar_productos") nextState = "importacion_exportar_p2";
      if (rama === "buscar_proveedores") nextState = "importacion_proveedores_p2";

      moveToState({
        phone,
        user,
        saveUser,
        nextState,
        detail: {
          selected_option: cleanMessage,
          rama
        }
      });

      if (rama === "importar_productos") {
        return {
          reply: getImportarPromptP2(),
          source: "backend"
        };
      }

      if (rama === "exportar_productos") {
        return {
          reply: getExportarPromptP2(),
          source: "backend"
        };
      }

      return {
        reply: getProveedoresPromptP2(),
        source: "backend"
      };
    }

    // =====================================================
    // RAMA 1 — IMPORTAR PRODUCTOS
    // =====================================================
    if (user.estado === "importacion_importar_p2") {
      const situacion = mapImportarSituacion(cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_situacion = situacion;
      user.score += 2;

      const nextState =
        situacion === "producto_definido"
          ? "importacion_importar_definido_p3"
          : "importacion_importar_busqueda_p3";

      moveToState({
        phone,
        user,
        saveUser,
        nextState,
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getImportarPromptP3(user),
        source: "backend"
      };
    }

    if (
      user.estado === "importacion_importar_definido_p3" ||
      user.estado === "importacion_importar_busqueda_p3"
    ) {
      const necesidad = mapImportarNecesidad(
        user.importacion_situacion,
        cleanMessage
      );

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_necesidad = necesidad;
      user.importacion_metadata = resolveImportarMetadata(
        user.importacion_situacion,
        necesidad
      );
      user.score += 3;
      user.estado = classifyLead(user);
      user.importacion_ai_turns = 1;
      user.importacion_cta_enabled = false;
      user.importacion_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.importacion_rama,
          situacion: user.importacion_situacion,
          necesidad: user.importacion_necesidad,
          metadata: user.importacion_metadata,
          ai_turns: user.importacion_ai_turns
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
    // RAMA 2 — EXPORTAR PRODUCTOS
    // =====================================================
    if (user.estado === "importacion_exportar_p2") {
      const situacion = mapExportarSituacion(cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_situacion = situacion;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "importacion_exportar_p3",
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getExportarPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "importacion_exportar_p3") {
      const necesidad = mapExportarNecesidad(cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_necesidad = necesidad;
      user.importacion_metadata = resolveExportarMetadata(necesidad);
      user.score += 3;
      user.estado = classifyLead(user);
      user.importacion_ai_turns = 1;
      user.importacion_cta_enabled = false;
      user.importacion_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.importacion_rama,
          situacion: user.importacion_situacion,
          necesidad: user.importacion_necesidad,
          metadata: user.importacion_metadata,
          ai_turns: user.importacion_ai_turns
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
    // RAMA 3 — BUSCAR PROVEEDORES O FABRICANTES
    // =====================================================
    if (user.estado === "importacion_proveedores_p2") {
      const situacion = mapProveedoresSituacion(cleanMessage);

      if (!situacion) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_situacion = situacion;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "importacion_proveedores_p3",
        detail: {
          selected_option: cleanMessage,
          situacion
        }
      });

      return {
        reply: getProveedoresPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "importacion_proveedores_p3") {
      const necesidad = mapProveedoresNecesidad(cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.importacion_necesidad = necesidad;
      user.importacion_metadata = resolveProveedoresMetadata(necesidad);
      user.score += 3;
      user.estado = classifyLead(user);
      user.importacion_ai_turns = 1;
      user.importacion_cta_enabled = false;
      user.importacion_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.importacion_rama,
          situacion: user.importacion_situacion,
          necesidad: user.importacion_necesidad,
          metadata: user.importacion_metadata,
          ai_turns: user.importacion_ai_turns
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
    // FOLLOW-UP HÍBRIDO + CTA
    // =====================================================
    if (
      ["lead_curioso", "lead_tibio", "lead_calificado"].includes(user.estado) &&
      user.interes_principal === "importacion"
    ) {
      if (user.importacion_cta_enabled) {
        if (cleanMessage === "1") {
          user.callback_phone = phone;

          moveToState({
            phone,
            user,
            saveUser,
            nextState: "importacion_asesor_confirmar_numero",
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
          user.estado = "importacion_reunion";

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

      user.importacion_ai_turns += 1;
      user.importacion_last_user_reply = rawMessage;

      const mustShowCTA = user.importacion_ai_turns >= 2;

      if (mustShowCTA) {
        user.importacion_cta_enabled = true;
      }

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "hybrid_followup",
        detail: {
          ai_turns: user.importacion_ai_turns,
          cta_enabled: user.importacion_cta_enabled,
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
    // CONFIRMAR MISMO NÚMERO
    // =====================================================
    if (user.estado === "importacion_asesor_confirmar_numero") {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "importacion_asesor_horario",
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
          nextState: "importacion_asesor_otro_numero",
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
    if (user.estado === "importacion_asesor_otro_numero") {
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
        nextState: "importacion_asesor_horario",
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
    if (user.estado === "importacion_asesor_horario") {
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
    if (user.estado === "importacion_reunion") {
      return {
        reply: buildMeetingReply(CALENDLY_LINK),
        source: "backend"
      };
    }

    return null;
  } catch (error) {
    console.error("Error en handleImportacionFlow:", error);

    try {
      logErrorEvent({
        phone,
        module: "importacion",
        estado: user?.estado || null,
        interes_principal: user?.interes_principal || null,
        incoming_message: cleanMessage || null,
        error_message: error.message,
        stack: error.stack,
        detail: {
          flow: "importacion"
        }
      });
    } catch (logErr) {
      console.error("Error registrando log de error importacion:", logErr.message);
    }

    return {
      reply: "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      source: "backend"
    };
  }
}

module.exports = {
  handleImportacionFlow,
  getImportacionIntro,
  isLikelyPhoneNumber
};