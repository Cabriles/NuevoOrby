const {
  logLeadEvent,
  logErrorEvent
} = require("../logger");

// ========================================================
// HELPERS GENERALES
// ========================================================
function ensureEcommerceFields(user) {
  if (!user) return;

  if (!user.score) user.score = 0;
  if (!user.ecommerce_rama) user.ecommerce_rama = null;
  if (!user.ecommerce_plataforma) user.ecommerce_plataforma = null;
  if (!user.ecommerce_necesidad) user.ecommerce_necesidad = null;
  if (!user.ecommerce_contexto) user.ecommerce_contexto = null;
  if (!user.ecommerce_objetivo) user.ecommerce_objetivo = null;
  if (!user.callback_phone) user.callback_phone = null;
  if (!user.callback_schedule) user.callback_schedule = null;

  if (!user.ecommerce_ai_turns) user.ecommerce_ai_turns = 0;
  if (typeof user.ecommerce_cta_enabled !== "boolean") {
    user.ecommerce_cta_enabled = false;
  }
  if (!user.ecommerce_last_user_reply) user.ecommerce_last_user_reply = null;
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
      module: "ecommerce",
      event_type: eventType,
      estado: user.estado,
      interes_principal: user.interes_principal,
      subopcion: user.subopcion,
      score: user.score,
      detail
    });
  } catch (error) {
    console.error("Error registrando log ecommerce:", error.message);
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

  // 🔹 Aplicar resaltado SIEMPRE al final
  cleanReply = highlightBrand(cleanReply);

  // 🔹 Resaltar frases clave en TODOS los párrafos
  cleanReply = cleanReply
    .split("\n\n")
    .map(p => highlightDecisionLead(p))
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
    /^Aquí conviene/i,
    /^Lo importante/i,
    /^El punto clave/i,
    /^Aquí lo importante/i,
    /^Aquí tendría sentido/i,
    /^Aquí lo más útil/i
  ];

  for (const pattern of patterns) {
    if (pattern.test(clean)) {
      return bold(clean); // 🔥 ahora resalta TODA la frase
    }
  }

  return clean;
}

// ========================================================
// FORMATTERS
// ========================================================
function formatRama(value) {
  const map = {
    crear_tienda: "Crear una tienda o ecommerce",
    mejorar_resultados: "Mejorar ventas o resultados",
    conseguir_trafico: "Conseguir tráfico o clientes"
  };

  return map[value] || value || "No definido";
}

function formatPlataforma(value) {
  const map = {
    shopify: "Shopify",
    woocommerce: "WordPress (WooCommerce)",
    prestashop: "PrestaShop"
  };

  return map[value] || value || "No aplica";
}

function formatNecesidad(value) {
  const map = {
    crear_desde_cero: "crear la tienda desde cero",
    configurar_estructura: "configurar pagos, envíos y estructura",
    redisenar_actualizar: "rediseñar o actualizar la tienda",

    mejorar_conversiones: "mejorar conversiones",
    mas_ventas_desde_visitas: "lograr más ventas con el tráfico actual",
    estructura_comercial: "ordenar mejor la estructura comercial",

    publicidad_digital: "publicidad digital",
    contenido_posicionamiento: "contenido y posicionamiento",
    automatizacion_seguimiento: "automatización y seguimiento comercial"
  };

  return map[value] || value || "No definido";
}

function formatContexto(value) {
  const map = {
    productos_fisicos: "una tienda para productos físicos",
    servicios: "una tienda para servicios",
    productos_digitales: "una tienda para productos digitales",

    metodos_pago: "métodos de pago",
    envios_logistica: "envíos y logística",
    estructura_catalogo: "estructura de catálogo",

    imagen_visual: "imagen visual y diseño",
    actualizacion_tecnica: "la parte técnica de la tienda",
    velocidad_rendimiento: "velocidad y rendimiento",

    oferta_propuesta: "la oferta, el producto o la propuesta comercial",
    pagina_carrito_checkout: "la página, el carrito o el proceso de compra",
    confianza_seguimiento: "la confianza, el seguimiento o la recuperación de clientes",

    campanas_desde_cero: "empezar campañas desde cero",
    mejorar_campanas: "mejorar campañas activas",
    tipo_campana_conveniente: "definir qué campaña conviene",

    presencia_redes: "la presencia en redes",
    google_visibilidad: "la visibilidad en Google",
    estrategia_contenidos: "la estrategia de contenidos",

    automatizar_respuestas: "la automatización de respuestas y atención",
    seguimiento_prospectos: "el seguimiento automático a prospectos",
    integracion_embudos: "la integración de formularios, WhatsApp o embudos"
  };

  return map[value] || value || "No definido";
}

function formatObjetivo(value) {
  const map = {
    presentacion_oferta: "cómo presentas lo que vendes",
    precios_promociones: "precios, packs o promociones",
    producto_servicio_a_empujar: "qué producto o servicio conviene empujar",

    pagina_producto_landing: "la página de producto o landing",
    carrito_checkout: "el carrito y checkout",
    flujo_completo_compra: "el flujo completo de compra",

    pruebas_confianza: "pruebas de confianza y credibilidad",
    seguimiento_whatsapp_email: "seguimiento comercial por WhatsApp o email",
    recuperacion_carritos: "la recuperación de carritos o automatización de seguimiento",

    mover_tienda: "mover una tienda o ecommerce",
    mover_servicio: "mover un servicio",
    mover_producto_especifico: "mover un producto específico",

    poco_trafico: "resolver el problema de poco tráfico",
    trafico_no_convierte: "resolver que el tráfico no convierte",
    no_claro_ajuste: "aclarar qué conviene ajustar",

    vender_mas: "vender más",
    captar_prospectos: "conseguir prospectos o contactos",
    dar_conocer_marca: "dar a conocer marca o negocio",

    contenido_redes: "el contenido en redes",
    frecuencia_publicacion: "la frecuencia y el orden de publicación",
    convertir_seguidores: "convertir seguidores en clientes",

    seo_web: "el SEO de la web",
    ficha_local: "la ficha de negocio y presencia local",
    contenido_busquedas: "el contenido para aparecer en búsquedas",

    que_publicar: "definir qué contenido publicar",
    conectar_contenido_ventas: "conectar contenido con ventas",
    estrategia_por_etapas: "ordenar una estrategia por etapas",

    respuestas_iniciales: "automatizar respuestas iniciales",
    atencion_whatsapp: "automatizar atención por WhatsApp",
    calificacion_prospectos: "mejorar la calificación de prospectos",

    respuesta_nuevos_contactos: "mejorar la respuesta a nuevos contactos",
    nutricion_recontacto: "mejorar nutrición y recontacto",
    recuperacion_oportunidades_frias: "recuperar oportunidades frías",

    formularios_crm: "integrar formularios y CRM",
    whatsapp_embudo: "integrar WhatsApp y embudo comercial",
    captacion_seguimiento_cierre: "integrar captación, seguimiento y cierre"
  };

  return map[value] || value || "No definido";
}

// ========================================================
// COPY CONSULTIVO BASE
// ========================================================
function buildEcommercePriority(user) {
  if (user.ecommerce_rama === "crear_tienda") {
    if (user.ecommerce_necesidad === "crear_desde_cero") {
      return "dar forma a una tienda bien pensada desde el inicio, no solo montarla técnicamente";
    }

    if (user.ecommerce_necesidad === "configurar_estructura") {
      return "dejar lista la estructura crítica para que la tienda pueda operar con más orden";
    }

    if (user.ecommerce_necesidad === "redisenar_actualizar") {
      return "corregir lo que hoy está frenando claridad, experiencia o rendimiento";
    }
  }

  if (user.ecommerce_rama === "mejorar_resultados") {
    if (user.ecommerce_necesidad === "mejorar_conversiones") {
      return "atacar el punto donde hoy se está perdiendo conversión";
    }

    if (user.ecommerce_necesidad === "mas_ventas_desde_visitas") {
      return "mejorar cómo ese tráfico actual se convierte en ventas reales";
    }

    if (user.ecommerce_necesidad === "estructura_comercial") {
      return "ordenar mejor la lógica comercial para que la tienda venda con más sentido";
    }
  }

  if (user.ecommerce_rama === "conseguir_trafico") {
    if (user.ecommerce_necesidad === "publicidad_digital") {
      return "usar mejor la publicidad para atraer tráfico con intención más clara";
    }

    if (user.ecommerce_necesidad === "contenido_posicionamiento") {
      return "construir una presencia que no solo genere visibilidad, sino oportunidades";
    }

    if (user.ecommerce_necesidad === "automatizacion_seguimiento") {
      return "ordenar mejor la respuesta, el seguimiento y la captación";
    }
  }

  return "priorizar correctamente el siguiente paso para vender mejor";
}

function buildFirstTurnQuestion(user) {
  if (user.ecommerce_rama === "crear_tienda") {
    if (user.ecommerce_necesidad === "crear_desde_cero") {
      return bold("Para orientarte mejor, dime qué te preocupa más hoy: empezar con buena estructura, elegir bien la plataforma o no cometer errores desde el inicio?");
    }

    if (user.ecommerce_necesidad === "configurar_estructura") {
      return bold("Para afinar la recomendación, dime qué necesitas resolver primero: pagos, logística o dejar mejor organizado el catálogo?");
    }

    if (user.ecommerce_necesidad === "redisenar_actualizar") {
      return bold("Para aterrizarlo mejor, dime qué te pesa más hoy: imagen visual, parte técnica o velocidad y rendimiento?");
    }
  }

  if (user.ecommerce_rama === "mejorar_resultados") {
    if (user.ecommerce_contexto === "oferta_propuesta") {
      return bold("Para afinar la recomendación, dime qué te preocupa más hoy: cómo presentas lo que vendes, los precios o qué producto empujar mejor?");
    }

    if (user.ecommerce_contexto === "pagina_carrito_checkout") {
      return bold("Para orientarte mejor, dime dónde sientes más fricción hoy: en la landing, en el carrito o en todo el flujo de compra?");
    }

    if (user.ecommerce_contexto === "confianza_seguimiento") {
      return bold("Para aterrizarlo mejor, dime qué te falta más hoy: confianza para cerrar, seguimiento comercial o recuperar oportunidades que se enfrían?");
    }

    return bold("Para orientarte mejor, dime qué es lo que más sientes que hoy está frenando tus resultados?");
  }

  if (user.ecommerce_rama === "conseguir_trafico") {
    if (user.ecommerce_necesidad === "publicidad_digital") {
      return bold("Para aterrizar mejor esto, dime qué necesitas resolver primero: arrancar campañas, corregir campañas activas o entender qué tipo de campaña te conviene?");
    }

    if (user.ecommerce_necesidad === "contenido_posicionamiento") {
      return bold("Para afinar la recomendación, dime qué necesitas fortalecer primero: redes, visibilidad en Google o una estrategia de contenidos conectada con ventas?");
    }

    if (user.ecommerce_necesidad === "automatizacion_seguimiento") {
      return bold("Para orientarte mejor, dime qué te pesa más hoy: responder más rápido, dar seguimiento a prospectos o integrar mejor formularios, WhatsApp y embudo?");
    }
  }

  return bold("Para orientarte mejor, dime qué necesitas resolver primero dentro de tu caso?");
}

function buildFallbackReply(user) {
  const priority = buildEcommercePriority(user);
  const question = buildFirstTurnQuestion(user);

  if (user.ecommerce_rama === "crear_tienda") {
    return `En tu caso, lo más importante no es solo montar una tienda, sino estructurarla de forma que tenga sentido comercial desde el inicio y no quede como una vitrina mal armada.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a aterrizar mejor la decisión para que el proyecto arranque con más claridad.

${question}`;
  }

  if (user.ecommerce_rama === "mejorar_resultados") {
    return `Aquí el punto clave no es hacer cambios por hacer, sino detectar qué parte del recorrido comercial está frenando conversiones, ventas o claridad de oferta.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a bajar esto a ajustes con más sentido comercial.

${question}`;
  }

  return `Cuando el foco está en tráfico y captación, el error típico es mover acciones sueltas sin una lógica clara entre visibilidad, seguimiento y conversión.

Ahora mismo conviene priorizar ${priority}. Ahí es donde OneOrbix puede ayudarte a ordenar mejor el siguiente paso para que el esfuerzo tenga impacto real.

${question}`;
}

// ========================================================
// SEGUNDO TURNO: ANCLA Y DETALLE
// ========================================================
function buildSecondTurnAnchor(userMessage = "") {
  const clean = String(userMessage || "").trim().toLowerCase();

  if (!clean) {
    return highlightDecisionLead("Aquí ya conviene bajar esto a una decisión más puntual para que el siguiente ajuste tenga impacto real.");
  }

  if (clean.includes("landing") || clean.includes("pagina") || clean.includes("página")) {
    return highlightDecisionLead("Si hoy la fricción está en la página o landing, entonces no conviene seguir enviando tráfico sin revisar primero cómo estás presentando la oferta y guiando la acción.");
  }

  if (clean.includes("checkout") || clean.includes("carrito")) {
    return highlightDecisionLead("Si el punto débil está en carrito o checkout, entonces el foco debería estar en reducir fricción, simplificar el proceso y evitar abandonos innecesarios.");
  }

  if (clean.includes("precio") || clean.includes("promoc")) {
    return highlightDecisionLead("Si la duda principal está en precios o promociones, entonces conviene revisar cómo se percibe el valor antes de tocar descuentos a ciegas.");
  }

  if (clean.includes("trafico") || clean.includes("tráfico")) {
    return highlightDecisionLead("Si el problema hoy está en el tráfico, entonces hay que separar si falta volumen, si falta intención o si el recorrido posterior no está convirtiendo bien.");
  }

  if (clean.includes("google") || clean.includes("seo")) {
    return highlightDecisionLead("Si el foco está en Google o SEO, entonces conviene trabajar visibilidad con intención comercial, no solo contenido por publicar.");
  }

  if (clean.includes("redes") || clean.includes("contenido")) {
    return highlightDecisionLead("Si el reto está en redes o contenido, entonces la clave no es publicar más por publicar, sino conectar mejor mensaje, propuesta y conversión.");
  }

  if (clean.includes("whatsapp") || clean.includes("seguimiento")) {
    return highlightDecisionLead("Si el problema está en WhatsApp o seguimiento, entonces conviene ordenar mejor la respuesta, la secuencia y el criterio de avance comercial.");
  }

  if (clean.includes("formulario") || clean.includes("crm") || clean.includes("embudo")) {
    return highlightDecisionLead("Si el reto está en formularios, CRM o embudo, entonces el punto importante es que la captura y el seguimiento trabajen como un sistema y no como piezas sueltas.");
  }

  return `Con lo que mencionas sobre "${userMessage}", lo importante ahora es aterrizar mejor ese punto para que el ajuste no se quede en intuición, sino en criterio comercial real.`;
}

function buildSecondTurnImplementationDetail(user, userMessage = "") {
  const msg = String(userMessage || "").trim().toLowerCase();

  if (user.ecommerce_rama === "crear_tienda") {
    if (user.ecommerce_necesidad === "crear_desde_cero") {
      return "Conviene definir primero una estructura clara de oferta, recorrido y conversión para que la tienda arranque con lógica comercial y no solo técnica.";
    }

    if (user.ecommerce_necesidad === "configurar_estructura") {
      if (msg.includes("pago")) {
        return "Aquí lo importante sería dejar el cobro claro y sin fricción para no afectar confianza ni cierre desde el arranque.";
      }

      if (msg.includes("logist") || msg.includes("envio")) {
        return "Aquí conviene ordenar bien la parte operativa y de entrega para que la promesa comercial se sostenga en la experiencia real.";
      }

      return "Aquí conviene dejar bien resuelta la base operativa para que la tienda funcione mejor al momento de vender.";
    }

    if (user.ecommerce_necesidad === "redisenar_actualizar") {
      return "Aquí tendría sentido identificar si el ajuste debe mejorar percepción, claridad o rendimiento para no hacer cambios visuales que no resuelvan el freno real.";
    }
  }

  if (user.ecommerce_rama === "mejorar_resultados") {
    if (user.ecommerce_contexto === "oferta_propuesta") {
      if (msg.includes("precio") || msg.includes("promoc")) {
        return "Si el problema está en precios o promociones, el riesgo es bajar precios sin corregir la propuesta, lo que termina afectando margen sin mejorar conversión. Primero hay que asegurar que el valor esté bien percibido antes de ajustar precios.";
      }

      return "Lo importante sería hacer más clara y deseable la propuesta para que sea más fácil convertir.";
    }

    if (user.ecommerce_contexto === "pagina_carrito_checkout") {
      if (msg.includes("checkout") || msg.includes("carrito")) {
        return "Aquí conviene simplificar pasos y reducir fricción para evitar que la intención se enfríe antes del cierre.";
      }

      return "Aquí tendría sentido revisar el recorrido completo para conectar mejor navegación, oferta y acción.";
    }

    if (user.ecommerce_contexto === "confianza_seguimiento") {
      if (msg.includes("whatsapp") || msg.includes("seguimiento")) {
        return "Aquí lo más útil sería ordenar mejor el seguimiento comercial para que el interés no se pierda después del primer contacto.";
      }

      return "Aquí conviene reforzar credibilidad y recuperación para no depender solo del impulso inicial del usuario.";
    }
  }

  if (user.ecommerce_rama === "conseguir_trafico") {
    if (user.ecommerce_necesidad === "publicidad_digital") {
      if (msg.includes("trafico") || msg.includes("tráfico")) {
        return "Aquí conviene separar si falta volumen o si falta calidad del tráfico antes de meter más presupuesto.";
      }

      return "Aquí lo importante sería ordenar mejor objetivo, mensaje y tipo de campaña para atraer tráfico con más intención.";
    }

    if (user.ecommerce_necesidad === "contenido_posicionamiento") {
      if (msg.includes("google") || msg.includes("seo")) {
        return "Aquí conviene trabajar visibilidad con intención comercial para aparecer donde la búsqueda ya está más cerca de una necesidad real.";
      }

      if (msg.includes("redes") || msg.includes("contenido")) {
        return "Aquí tendría sentido ordenar una línea de contenidos más conectada con la oferta y con una acción concreta.";
      }

      return "Aquí conviene conectar mejor visibilidad y conversión para que el contenido no se quede solo en alcance.";
    }

    if (user.ecommerce_necesidad === "automatizacion_seguimiento") {
      if (msg.includes("whatsapp") || msg.includes("seguimiento")) {
        return "Aquí lo más útil sería diseñar una secuencia más clara de respuesta y seguimiento para que los prospectos no se enfríen.";
      }

      if (msg.includes("formulario") || msg.includes("crm") || msg.includes("embudo")) {
        return "Aquí conviene integrar mejor captura, clasificación y seguimiento para que el proceso comercial no quede fragmentado.";
      }

      return "Aquí tendría sentido automatizar mejor la respuesta y el seguimiento para que la captación no dependa de acciones manuales desordenadas.";
    }
  }

  return "Aquí conviene aterrizar mejor ese punto para que el siguiente paso sea más claro y más conectado con resultados reales.";
}

function buildStrongSecondTurnFallback(user, userMessage) {
  const anchor = buildSecondTurnAnchor(userMessage);
  const detail = buildSecondTurnImplementationDetail(user, userMessage);

  return `${anchor}

${detail}`;
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
    !containsAnyKeyword(clean, ["tienda", "ventas", "trafico", "tráfico", "conversión", "conversion", "whatsapp", "contenido", "oneorbix"]);

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
    !containsAnyKeyword(clean, ["ventas", "tienda", "tráfico", "trafico", "seguimiento", "contenido", "oneorbix", "criterio", "comercial"]);

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

  if (
    countWords(clean) < 26 ||
    !containsAnyKeyword(clean, ["conviene", "clave", "importante", "ordenar", "mejorar"])
  ) {
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
- Módulo: Ecommerce y marketing digital
- Rama: ${formatRama(user.ecommerce_rama)}
- Plataforma: ${formatPlataforma(user.ecommerce_plataforma)}
- Necesidad principal: ${formatNecesidad(user.ecommerce_necesidad)}
- Contexto específico: ${formatContexto(user.ecommerce_contexto)}
- Objetivo puntual: ${formatObjetivo(user.ecommerce_objetivo)}`;

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
Eres Orby, asesor comercial senior de OneOrbix especializado en ecommerce, marketing digital, conversión y automatización comercial.

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
function getEcommerceIntro() {
  return `Perfecto. Cuéntame, ¿qué necesitas en este momento?

1️⃣ Crear una tienda o ecommerce
2️⃣ Mejorar ventas o resultados
3️⃣ Conseguir tráfico o clientes`;
}

function getCrearPlataformaPrompt() {
  return `¿En qué plataforma quieres crear o gestionar tu tienda?

1️⃣ Shopify
2️⃣ WordPress (WooCommerce)
3️⃣ PrestaShop`;
}

function getCrearNecesidadPrompt() {
  return `¿Qué necesitas resolver ahora mismo?

1️⃣ Crear la tienda desde cero
2️⃣ Configurar pagos, envíos y estructura
3️⃣ Rediseñar o actualizar mi tienda`;
}

function getCrearContextoPrompt(user) {
  if (user.ecommerce_necesidad === "crear_desde_cero") {
    return `Para orientarte mejor, dime qué tipo de tienda quieres crear:

1️⃣ Tienda para productos físicos
2️⃣ Tienda para servicios
3️⃣ Tienda para productos digitales`;
  }

  if (user.ecommerce_necesidad === "configurar_estructura") {
    return `Entiendo. ¿Qué parte técnica necesitas dejar lista ahora?

1️⃣ Métodos de pago
2️⃣ Envíos y logística
3️⃣ Estructura de catálogo`;
  }

  return `Un rediseño requiere enfoque. ¿Cuál es tu prioridad principal?

1️⃣ Mejorar imagen visual y diseño
2️⃣ Actualizar la parte técnica de la tienda
3️⃣ Optimizar velocidad y rendimiento`;
}

function getMejorarPromptP2() {
  return `Entiendo. ¿Qué resultado quieres mejorar primero?

1️⃣ Vendo poco y quiero mejorar conversiones
2️⃣ Tengo visitas, pero no logro suficientes ventas
3️⃣ Mi tienda necesita una mejor estructura comercial`;
}

function getMejorarPromptP3() {
  return `Para orientarte mejor, dime dónde sientes hoy el mayor freno:

1️⃣ Oferta, producto o propuesta comercial
2️⃣ Página de producto, carrito o proceso de compra
3️⃣ Confianza, seguimiento o recuperación de clientes`;
}

function getMejorarPromptP4(user) {
  if (user.ecommerce_contexto === "oferta_propuesta") {
    return `Perfecto. ¿Qué necesitas trabajar primero?

1️⃣ Mejorar cómo presento lo que vendo
2️⃣ Ordenar precios, packs o promociones
3️⃣ Definir mejor qué producto o servicio empujar`;
  }

  if (user.ecommerce_contexto === "pagina_carrito_checkout") {
    return `Perfecto. ¿Qué necesitas revisar primero?

1️⃣ Página de producto o landing
2️⃣ Carrito y checkout
3️⃣ Flujo completo de compra`;
  }

  return `Perfecto. ¿Qué necesitas activar o mejorar?

1️⃣ Pruebas de confianza y credibilidad
2️⃣ Seguimiento comercial por WhatsApp o email
3️⃣ Recuperación de carritos o automatización de seguimiento`;
}

function getTraficoPromptP2() {
  return `Perfecto. ¿Por dónde quieres conseguir más clientes?

1️⃣ Publicidad digital
2️⃣ Contenido y posicionamiento
3️⃣ Automatización y seguimiento comercial`;
}

function getTraficoPromptP3(user) {
  if (user.ecommerce_necesidad === "publicidad_digital") {
    return `¿Qué necesitas resolver ahora mismo?

1️⃣ Empezar campañas desde cero
2️⃣ Mejorar campañas que ya tengo activas
3️⃣ Entender qué tipo de campaña me conviene`;
  }

  if (user.ecommerce_necesidad === "contenido_posicionamiento") {
    return `¿Qué necesitas resolver ahora mismo?

1️⃣ Mejorar presencia en redes
2️⃣ Trabajar contenido y visibilidad en Google
3️⃣ Ordenar una estrategia de contenidos para vender mejor`;
  }

  return `¿Qué necesitas resolver ahora mismo?

1️⃣ Automatizar respuestas y atención
2️⃣ Hacer seguimiento automático a prospectos
3️⃣ Integrar formularios, WhatsApp o embudos`;
}

function getTraficoPromptP4(user) {
  if (user.ecommerce_necesidad === "publicidad_digital") {
    if (user.ecommerce_contexto === "campanas_desde_cero") {
      return `Para orientarte mejor, dime qué quieres mover primero con publicidad:

1️⃣ Una tienda o ecommerce
2️⃣ Un servicio
3️⃣ Un producto específico`;
    }

    if (user.ecommerce_contexto === "mejorar_campanas") {
      return `Entiendo. ¿Dónde sientes hoy el mayor problema en tus campañas?

1️⃣ No llega suficiente tráfico
2️⃣ Llega tráfico, pero no convierte
3️⃣ No tengo claro qué ajustar`;
    }

    return `Perfecto. ¿Cuál es tu objetivo principal con la campaña?

1️⃣ Vender más
2️⃣ Conseguir prospectos o contactos
3️⃣ Dar a conocer marca o negocio`;
  }

  if (user.ecommerce_necesidad === "contenido_posicionamiento") {
    if (user.ecommerce_contexto === "presencia_redes") {
      return `Perfecto. ¿Qué necesitas mejorar primero en redes?

1️⃣ Contenido
2️⃣ Frecuencia y orden de publicación
3️⃣ Estrategia para convertir seguidores en clientes`;
    }

    if (user.ecommerce_contexto === "google_visibilidad") {
      return `Perfecto. ¿Qué necesitas trabajar primero en Google?

1️⃣ SEO de la web
2️⃣ Ficha de negocio y presencia local
3️⃣ Contenido para aparecer en búsquedas`;
    }

    return `Perfecto. ¿Qué necesitas estructurar primero?

1️⃣ Qué contenido publicar
2️⃣ Cómo conectar contenido con ventas
3️⃣ Cómo organizar una estrategia por etapas`;
  }

  if (user.ecommerce_contexto === "automatizar_respuestas") {
    return `Perfecto. ¿Qué quieres automatizar primero?

1️⃣ Respuestas iniciales
2️⃣ Atención por WhatsApp
3️⃣ Calificación de prospectos`;
  }

  if (user.ecommerce_contexto === "seguimiento_prospectos") {
    return `Perfecto. ¿Qué seguimiento quieres mejorar?

1️⃣ Respuesta a nuevos contactos
2️⃣ Nutrición y recontacto
3️⃣ Recuperación de oportunidades frías`;
  }

  return `Perfecto. ¿Qué integración necesitas resolver primero?

1️⃣ Formularios y CRM
2️⃣ WhatsApp y embudo comercial
3️⃣ Captación, seguimiento y cierre`;
}

// ========================================================
// MAPEO DE OPCIONES
// ========================================================
function mapCrearPlataforma(option) {
  return {
    "1": "shopify",
    "2": "woocommerce",
    "3": "prestashop"
  }[option] || null;
}

function mapCrearNecesidad(option) {
  return {
    "1": "crear_desde_cero",
    "2": "configurar_estructura",
    "3": "redisenar_actualizar"
  }[option] || null;
}

function mapCrearContexto(necesidad, option) {
  if (necesidad === "crear_desde_cero") {
    return {
      "1": "productos_fisicos",
      "2": "servicios",
      "3": "productos_digitales"
    }[option] || null;
  }

  if (necesidad === "configurar_estructura") {
    return {
      "1": "metodos_pago",
      "2": "envios_logistica",
      "3": "estructura_catalogo"
    }[option] || null;
  }

  return {
    "1": "imagen_visual",
    "2": "actualizacion_tecnica",
    "3": "velocidad_rendimiento"
  }[option] || null;
}

function mapMejorarNecesidad(option) {
  return {
    "1": "mejorar_conversiones",
    "2": "mas_ventas_desde_visitas",
    "3": "estructura_comercial"
  }[option] || null;
}

function mapMejorarContexto(option) {
  return {
    "1": "oferta_propuesta",
    "2": "pagina_carrito_checkout",
    "3": "confianza_seguimiento"
  }[option] || null;
}

function mapMejorarObjetivo(contexto, option) {
  if (contexto === "oferta_propuesta") {
    return {
      "1": "presentacion_oferta",
      "2": "precios_promociones",
      "3": "producto_servicio_a_empujar"
    }[option] || null;
  }

  if (contexto === "pagina_carrito_checkout") {
    return {
      "1": "pagina_producto_landing",
      "2": "carrito_checkout",
      "3": "flujo_completo_compra"
    }[option] || null;
  }

  return {
    "1": "pruebas_confianza",
    "2": "seguimiento_whatsapp_email",
    "3": "recuperacion_carritos"
  }[option] || null;
}

function mapTraficoNecesidad(option) {
  return {
    "1": "publicidad_digital",
    "2": "contenido_posicionamiento",
    "3": "automatizacion_seguimiento"
  }[option] || null;
}

function mapTraficoContexto(necesidad, option) {
  if (necesidad === "publicidad_digital") {
    return {
      "1": "campanas_desde_cero",
      "2": "mejorar_campanas",
      "3": "tipo_campana_conveniente"
    }[option] || null;
  }

  if (necesidad === "contenido_posicionamiento") {
    return {
      "1": "presencia_redes",
      "2": "google_visibilidad",
      "3": "estrategia_contenidos"
    }[option] || null;
  }

  return {
    "1": "automatizar_respuestas",
    "2": "seguimiento_prospectos",
    "3": "integracion_embudos"
  }[option] || null;
}

function mapTraficoObjetivo(necesidad, contexto, option) {
  if (necesidad === "publicidad_digital") {
    if (contexto === "campanas_desde_cero") {
      return {
        "1": "mover_tienda",
        "2": "mover_servicio",
        "3": "mover_producto_especifico"
      }[option] || null;
    }

    if (contexto === "mejorar_campanas") {
      return {
        "1": "poco_trafico",
        "2": "trafico_no_convierte",
        "3": "no_claro_ajuste"
      }[option] || null;
    }

    return {
      "1": "vender_mas",
      "2": "captar_prospectos",
      "3": "dar_conocer_marca"
    }[option] || null;
  }

  if (necesidad === "contenido_posicionamiento") {
    if (contexto === "presencia_redes") {
      return {
        "1": "contenido_redes",
        "2": "frecuencia_publicacion",
        "3": "convertir_seguidores"
      }[option] || null;
    }

    if (contexto === "google_visibilidad") {
      return {
        "1": "seo_web",
        "2": "ficha_local",
        "3": "contenido_busquedas"
      }[option] || null;
    }

    return {
      "1": "que_publicar",
      "2": "conectar_contenido_ventas",
      "3": "estrategia_por_etapas"
    }[option] || null;
  }

  if (contexto === "automatizar_respuestas") {
    return {
      "1": "respuestas_iniciales",
      "2": "atencion_whatsapp",
      "3": "calificacion_prospectos"
    }[option] || null;
  }

  if (contexto === "seguimiento_prospectos") {
    return {
      "1": "respuesta_nuevos_contactos",
      "2": "nutricion_recontacto",
      "3": "recuperacion_oportunidades_frias"
    }[option] || null;
  }

  return {
    "1": "formularios_crm",
    "2": "whatsapp_embudo",
    "3": "captacion_seguimiento_cierre"
  }[option] || null;
}

// ========================================================
// FLOW PRINCIPAL
// ========================================================
async function handleEcommerceFlow({
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
    ensureEcommerceFields(user);
    const rawMessage = String(message || cleanMessage || "").trim();
    const normalizedMessage = normalizeText(rawMessage);

    // =====================================================
    // CAPA 1
    // =====================================================
    if (user.estado === "ecommerce_p1") {
      if (cleanMessage === "1") {
        user.interes_principal = "ecommerce";
        user.ecommerce_rama = "crear_tienda";
        user.score += 2;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "ecommerce_crear_p2",
          detail: {
            selected_option: "1",
            branch: "crear_tienda"
          }
        });

        return {
          reply: getCrearPlataformaPrompt(),
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.interes_principal = "ecommerce";
        user.ecommerce_rama = "mejorar_resultados";
        user.score += 3;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "ecommerce_mejorar_p2",
          detail: {
            selected_option: "2",
            branch: "mejorar_resultados"
          }
        });

        return {
          reply: getMejorarPromptP2(),
          source: "backend"
        };
      }

      if (cleanMessage === "3") {
        user.interes_principal = "ecommerce";
        user.ecommerce_rama = "conseguir_trafico";
        user.score += 3;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "ecommerce_trafico_p2",
          detail: {
            selected_option: "3",
            branch: "conseguir_trafico"
          }
        });

        return {
          reply: getTraficoPromptP2(),
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // RAMA CREAR TIENDA
    // =====================================================
    if (user.estado === "ecommerce_crear_p2") {
      const plataforma = mapCrearPlataforma(cleanMessage);

      if (!plataforma) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_plataforma = plataforma;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_crear_p3",
        detail: {
          selected_option: cleanMessage,
          plataforma
        }
      });

      return {
        reply: getCrearNecesidadPrompt(),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_crear_p3") {
      const necesidad = mapCrearNecesidad(cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_necesidad = necesidad;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_crear_p4",
        detail: {
          selected_option: cleanMessage,
          necesidad
        }
      });

      return {
        reply: getCrearContextoPrompt(user),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_crear_p4") {
      const contexto = mapCrearContexto(user.ecommerce_necesidad, cleanMessage);

      if (!contexto) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_contexto = contexto;
      user.score += 3;
      user.estado = classifyLead(user);
      user.ecommerce_ai_turns = 1;
      user.ecommerce_cta_enabled = false;
      user.ecommerce_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.ecommerce_rama,
          plataforma: user.ecommerce_plataforma,
          necesidad: user.ecommerce_necesidad,
          contexto: user.ecommerce_contexto,
          ai_turns: user.ecommerce_ai_turns
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
    // RAMA MEJORAR RESULTADOS
    // =====================================================
    if (user.estado === "ecommerce_mejorar_p2") {
      const necesidad = mapMejorarNecesidad(cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_necesidad = necesidad;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_mejorar_p3",
        detail: {
          selected_option: cleanMessage,
          necesidad
        }
      });

      return {
        reply: getMejorarPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_mejorar_p3") {
      const contexto = mapMejorarContexto(cleanMessage);

      if (!contexto) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_contexto = contexto;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_mejorar_p4",
        detail: {
          selected_option: cleanMessage,
          contexto
        }
      });

      return {
        reply: getMejorarPromptP4(user),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_mejorar_p4") {
      const objetivo = mapMejorarObjetivo(user.ecommerce_contexto, cleanMessage);

      if (!objetivo) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_objetivo = objetivo;
      user.score += 3;
      user.estado = classifyLead(user);
      user.ecommerce_ai_turns = 1;
      user.ecommerce_cta_enabled = false;
      user.ecommerce_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.ecommerce_rama,
          necesidad: user.ecommerce_necesidad,
          contexto: user.ecommerce_contexto,
          objetivo: user.ecommerce_objetivo,
          ai_turns: user.ecommerce_ai_turns
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
    // RAMA CONSEGUIR TRÁFICO
    // =====================================================
    if (user.estado === "ecommerce_trafico_p2") {
      const necesidad = mapTraficoNecesidad(cleanMessage);

      if (!necesidad) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_necesidad = necesidad;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_trafico_p3",
        detail: {
          selected_option: cleanMessage,
          necesidad
        }
      });

      return {
        reply: getTraficoPromptP3(user),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_trafico_p3") {
      const contexto = mapTraficoContexto(user.ecommerce_necesidad, cleanMessage);

      if (!contexto) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_contexto = contexto;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "ecommerce_trafico_p4",
        detail: {
          selected_option: cleanMessage,
          contexto
        }
      });

      return {
        reply: getTraficoPromptP4(user),
        source: "backend"
      };
    }

    if (user.estado === "ecommerce_trafico_p4") {
      const objetivo = mapTraficoObjetivo(
        user.ecommerce_necesidad,
        user.ecommerce_contexto,
        cleanMessage
      );

      if (!objetivo) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.ecommerce_objetivo = objetivo;
      user.score += 3;
      user.estado = classifyLead(user);
      user.ecommerce_ai_turns = 1;
      user.ecommerce_cta_enabled = false;
      user.ecommerce_last_user_reply = null;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.ecommerce_rama,
          necesidad: user.ecommerce_necesidad,
          contexto: user.ecommerce_contexto,
          objetivo: user.ecommerce_objetivo,
          ai_turns: user.ecommerce_ai_turns
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
      user.interes_principal === "ecommerce"
    ) {
      if (user.ecommerce_cta_enabled) {
        if (cleanMessage === "1") {
          user.callback_phone = phone;

          moveToState({
            phone,
            user,
            saveUser,
            nextState: "ecommerce_asesor_confirmar_numero",
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
          user.estado = "ecommerce_reunion";

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

      user.ecommerce_ai_turns += 1;
      user.ecommerce_last_user_reply = rawMessage;

      const mustShowCTA = user.ecommerce_ai_turns >= 2;

      if (mustShowCTA) {
        user.ecommerce_cta_enabled = true;
      }

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "hybrid_followup",
        detail: {
          ai_turns: user.ecommerce_ai_turns,
          cta_enabled: user.ecommerce_cta_enabled,
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
    if (user.estado === "ecommerce_asesor_confirmar_numero") {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "ecommerce_asesor_horario",
          detail: {
            selected_option: "1",
            callback_phone: user.callback_phone
          }
        });

        return {
          reply: `Perfecto. Indícame en qué horario prefieres que te contacten por WhatsApp.`,
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.callback_phone = null;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "ecommerce_asesor_otro_numero",
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
    if (user.estado === "ecommerce_asesor_otro_numero") {
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
        nextState: "ecommerce_asesor_horario",
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
    if (user.estado === "ecommerce_asesor_horario") {
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
    if (user.estado === "ecommerce_reunion") {
      return {
        reply: buildMeetingReply(CALENDLY_LINK),
        source: "backend"
      };
    }

    return null;
  } catch (error) {
    console.error("Error en handleEcommerceFlow:", error);

    try {
      logErrorEvent({
        phone,
        module: "ecommerce",
        estado: user?.estado || null,
        interes_principal: user?.interes_principal || null,
        incoming_message: cleanMessage || null,
        error_message: error.message,
        stack: error.stack,
        detail: {
          flow: "ecommerce"
        }
      });
    } catch (logErr) {
      console.error("Error registrando log de error ecommerce:", logErr.message);
    }

    return {
      reply: "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      source: "backend"
    };
  }
}

module.exports = {
  handleEcommerceFlow,
  getEcommerceIntro,
  isLikelyPhoneNumber
};