const {
  logLeadEvent,
  logErrorEvent
} = require("../logger");

// ========================================================
// HELPERS GENERALES
// ========================================================
function ensureAutomatizacionFields(user) {
  if (!user) return;

  if (!user.score) user.score = 0;
  if (!user.interes_principal) user.interes_principal = null;

  if (!user.automatizacion_rama) user.automatizacion_rama = null;
  if (!user.automatizacion_canal) user.automatizacion_canal = null;
  if (!user.automatizacion_objetivo) user.automatizacion_objetivo = null;
  if (!user.automatizacion_alcance) user.automatizacion_alcance = null;
  if (!user.automatizacion_metadata) user.automatizacion_metadata = null;
  if (!user.automatizacion_ai_turns) user.automatizacion_ai_turns = 0;
  if (typeof user.automatizacion_cta_enabled !== "boolean") {
    user.automatizacion_cta_enabled = false;
  }
  if (!user.automatizacion_last_user_reply) user.automatizacion_last_user_reply = null;
  if (!user.callback_phone) user.callback_phone = null;
  if (!user.callback_schedule) user.callback_schedule = null;
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
      module: "automatizacion",
      event_type: eventType,
      estado: user.estado,
      interes_principal: user.interes_principal,
      subopcion: user.subopcion,
      score: user.score,
      detail
    });
  } catch (error) {
    console.error("Error registrando log automatizacion:", error.message);
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
  const cleanReply = String(aiReply || "").trim();

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

// ========================================================
// FORMATTERS
// ========================================================
function formatRama(value) {
  const map = {
    atencion_ventas: "Atención al Cliente y Ventas",
    procesos_internos: "Automatización de Procesos Internos",
    agentes_especializados: "Agentes de IA Especializados"
  };

  return map[value] || value || "No definido";
}

function formatCanal(value) {
  const map = {
    whatsapp_redes: "WhatsApp y redes sociales",
    sitio_web_ecommerce: "sitio web o eCommerce",
    omnicanal: "entorno omnicanal",

    gestion_leads_crm: "gestión de leads y CRM",
    contenido_reportes: "generación automática de contenido o reportes",
    conexion_apps_apis: "conexión entre aplicaciones y APIs",

    entrenamiento_documentos: "entrenamiento con documentos o PDFs propios",
    agente_con_herramientas: "agente con acceso a herramientas externas",
    auditoria_ia: "auditoría de IA para procesos existentes"
  };

  return map[value] || value || "No definido";
}

function formatObjetivo(value) {
  const map = {
    calificar_leads_agendar: "calificar leads y agendar reuniones automáticamente",
    faq_soporte: "responder preguntas frecuentes y dar soporte técnico",
    pedidos_pagos: "automatizar la toma de pedidos y pagos",

    notificaciones_seguimiento: "notificaciones automáticas y seguimiento de clientes",
    procesamiento_datos: "extracción y procesamiento de datos masivos",
    sincronizacion_bases: "sincronización de inventarios o bases de datos",

    base_conocimiento: "crear una base de conocimiento inteligente para tu equipo",
    asistente_autonomo: "desarrollar un asistente autónomo con capacidad operativa",
    reduccion_costos: "reducir costos operativos mediante eficiencia con IA"
  };

  return map[value] || value || "No definido";
}

function formatAlcance(value) {
  const map = {
    asistencia_puntual: "asistencia técnica puntual",
    asesoria_integral: "asesoría integral de transformación digital con IA"
  };

  return map[value] || value || "No definido";
}

function formatMetadata(value) {
  const map = {
    chatbot_captacion: "captación automática 24/7",
    chatbot_soporte: "soporte automatizado y resolución frecuente",
    chatbot_pedidos: "automatización comercial de pedidos y pagos",

    crm_followup: "automatización de seguimiento y operación comercial",
    data_processing: "procesamiento masivo de información",
    sync_systems: "sincronización entre sistemas y fuentes de datos",

    knowledge_base: "base de conocimiento inteligente",
    autonomous_agent: "agente autónomo con herramientas",
    ai_efficiency_audit: "eficiencia operativa basada en IA"
  };

  return map[value] || value || "No definido";
}

// ========================================================
// ENFOQUE Y ESTRATEGIA POR CASO
// ========================================================
function buildImplementationFocus(user) {
  if (user.automatizacion_rama === "atencion_ventas") {
    if (user.automatizacion_objetivo === "calificar_leads_agendar") {
      return "calificación automática, filtros de intención, captura de datos clave, agenda y seguimiento comercial";
    }
    if (user.automatizacion_objetivo === "faq_soporte") {
      return "base de respuestas útiles, automatización de consultas frecuentes, escalamiento inteligente y soporte consistente";
    }
    if (user.automatizacion_objetivo === "pedidos_pagos") {
      return "toma de pedidos, validación de datos, confirmación de pago y seguimiento comercial";
    }
    return "automatización comercial y atención más ordenada";
  }

  if (user.automatizacion_rama === "procesos_internos") {
    if (user.automatizacion_objetivo === "notificaciones_seguimiento") {
      return "alertas, seguimiento, disparadores operativos y conexión con CRM o bases de datos";
    }
    if (user.automatizacion_objetivo === "procesamiento_datos") {
      return "reglas de validación, control de errores, automatización de pasos repetitivos y trazabilidad";
    }
    if (user.automatizacion_objetivo === "sincronizacion_bases") {
      return "integración entre sistemas, sincronización de información y reducción de duplicidades";
    }
    return "orden operativo, menos trabajo manual y más consistencia";
  }

  if (user.automatizacion_rama === "agentes_especializados") {
    if (user.automatizacion_objetivo === "base_conocimiento") {
      return "centralización documental, consultas inteligentes y acceso rápido a conocimiento útil";
    }
    if (user.automatizacion_objetivo === "asistente_autonomo") {
      return "reglas operativas, acceso a herramientas y ejecución controlada de tareas útiles";
    }
    if (user.automatizacion_objetivo === "reduccion_costos") {
      return "detección de desperdicio operativo, automatización selectiva y mejora de eficiencia real";
    }
    return "un agente útil para la operación y no solo una demo";
  }

  return "automatización útil, medible y alineada al negocio";
}

function buildCaseStrategy(user) {
  if (user.automatizacion_rama === "atencion_ventas") {
    if (user.automatizacion_objetivo === "calificar_leads_agendar") {
      return `La vía más efectiva sería diseñar un flujo donde el sistema filtre prospectos, detecte intención real, capture datos útiles y derive a agenda o seguimiento comercial con criterio. OneOrbix puede ayudarte a implementar esa lógica para que el bot no solo conteste, sino que ayude a generar oportunidades reales.`;
    }

    if (user.automatizacion_objetivo === "faq_soporte") {
      return `Aquí conviene construir un asistente que resuelva consultas recurrentes con rapidez, mantenga consistencia y reduzca carga operativa del equipo. OneOrbix puede ayudarte a estructurarlo sobre tus preguntas frecuentes, procesos y canales reales de atención.`;
    }

    if (user.automatizacion_objetivo === "pedidos_pagos") {
      return `Lo ideal sería ordenar el recorrido comercial completo, desde la consulta inicial hasta la toma de pedido y confirmación de pago, reduciendo fricción y errores. OneOrbix puede ayudarte a diseñar ese flujo para mejorar experiencia y conversión.`;
    }
  }

  if (user.automatizacion_rama === "procesos_internos") {
    if (user.automatizacion_objetivo === "notificaciones_seguimiento") {
      return `Lo recomendable aquí es automatizar alertas, seguimiento y disparadores operativos para que el equipo deje de depender de tareas manuales repetitivas. OneOrbix puede ayudarte a conectarlo con CRM, hojas de cálculo u otros sistemas para ganar orden y velocidad.`;
    }

    if (user.automatizacion_objetivo === "procesamiento_datos") {
      return `La clave aquí no es solo automatizar, sino incorporar validaciones, reglas claras y trazabilidad para reducir errores y procesar más volumen con menos intervención manual. OneOrbix puede ayudarte a estructurar ese flujo para que sea confiable y útil en operación real.`;
    }

    if (user.automatizacion_objetivo === "sincronizacion_bases") {
      return `En este tipo de caso conviene integrar sistemas y automatizar sincronización para evitar datos duplicados, retrasos y decisiones tomadas con información desactualizada. OneOrbix puede ayudarte a diseñar una arquitectura más limpia entre tus herramientas y fuentes de datos.`;
    }
  }

  if (user.automatizacion_rama === "agentes_especializados") {
    if (user.automatizacion_objetivo === "base_conocimiento") {
      return `Lo ideal sería construir un sistema que centralice conocimiento útil y permita consultas rápidas para soporte interno, operaciones o capacitación. OneOrbix puede ayudarte a estructurarlo con tus propios documentos y procesos para que sea una herramienta de trabajo real.`;
    }

    if (user.automatizacion_objetivo === "asistente_autonomo") {
      return `Aquí conviene diseñar un agente con reglas claras, límites operativos y acceso a herramientas concretas para que ejecute tareas útiles sin volverse una caja negra. OneOrbix puede ayudarte a aterrizar esa arquitectura con foco operativo real.`;
    }

    if (user.automatizacion_objetivo === "reduccion_costos") {
      return `Lo importante aquí es detectar dónde estás perdiendo tiempo, duplicando tareas o generando errores operativos, y automatizar solo lo que realmente mejora eficiencia. OneOrbix puede ayudarte a convertir ese análisis en una solución práctica con impacto medible.`;
    }
  }

  return `Lo recomendable es estructurar una solución que reduzca trabajo manual, ordene mejor la operación y convierta la automatización en una herramienta útil para el negocio. OneOrbix puede ayudarte a aterrizar esa implementación según tu caso real.`;
}

function buildExplorationQuestion(user) {
  if (user.automatizacion_rama === "atencion_ventas") {
    if (user.automatizacion_objetivo === "calificar_leads_agendar") {
      return "Para aterrizarlo mejor, dime algo puntual: hoy te duele más conseguir más leads, filtrar mejor a los prospectos o lograr que más conversaciones terminen en reunión?";
    }

    if (user.automatizacion_objetivo === "faq_soporte") {
      return "Para afinar la solución, dime qué te afecta más hoy: tiempos de respuesta, carga del equipo o inconsistencia en las respuestas?";
    }

    if (user.automatizacion_objetivo === "pedidos_pagos") {
      return "Para aterrizar mejor la recomendación, dime qué te frena más hoy: tomar pedidos, validar pagos o evitar errores en el proceso?";
    }
  }

  if (user.automatizacion_rama === "procesos_internos") {
    if (user.automatizacion_objetivo === "notificaciones_seguimiento") {
      return "Para afinar la solución, dime qué te afecta más hoy: seguimiento tardío, tareas repetitivas o falta de orden entre áreas?";
    }

    if (user.automatizacion_objetivo === "procesamiento_datos") {
      return "Para aterrizar bien esto, dime dónde aparece hoy el mayor problema: en la captura de datos, en la validación o en el procesamiento posterior?";
    }

    if (user.automatizacion_objetivo === "sincronizacion_bases") {
      return "Para orientarte mejor, dime qué te afecta más hoy: datos desactualizados, duplicidad de información o sistemas que no se comunican bien?";
    }
  }

  if (user.automatizacion_rama === "agentes_especializados") {
    if (user.automatizacion_objetivo === "base_conocimiento") {
      return "Para aterrizar mejor la solución, dime qué te interesa más hoy: centralizar conocimiento, responder más rápido o mejorar soporte interno?";
    }

    if (user.automatizacion_objetivo === "asistente_autonomo") {
      return "Para orientarte mejor, dime qué quieres que ese agente haga en la práctica: responder consultas, ejecutar tareas o apoyar decisiones operativas?";
    }

    if (user.automatizacion_objetivo === "reduccion_costos") {
      return "Para afinar la recomendación, dime dónde ves hoy el mayor desperdicio: tiempo del equipo, tareas repetitivas o errores operativos?";
    }
  }

  return "Para orientarte mejor, dime qué necesitas resolver primero en tu operación actual?";
}

function buildConcreteResponseQuestion(user, userMessage = "") {
  const msg = normalizeText(userMessage);

  if (user.automatizacion_rama === "procesos_internos" && user.automatizacion_objetivo === "procesamiento_datos") {
    if (msg.includes("captura")) {
      return "¿Hoy esa captura de datos se hace manualmente, desde formularios, hojas de cálculo o desde varias fuentes al mismo tiempo?";
    }

    if (msg.includes("valid")) {
      return "¿Esa validación hoy la hace una persona revisando datos, o ya existe alguna regla automática aunque sea parcial?";
    }

    if (msg.includes("proces")) {
      return "¿Ese procesamiento posterior hoy se hace en hojas de cálculo, en un sistema interno o combinando varias herramientas?";
    }

    if (msg.includes("errores")) {
      return "¿Esos errores hoy aparecen más por digitación manual, por validaciones débiles o por cruces entre varias fuentes de datos?";
    }
  }

  if (user.automatizacion_rama === "atencion_ventas" && user.automatizacion_objetivo === "calificar_leads_agendar") {
    if (msg.includes("lead")) {
      return "¿Hoy el problema es que entran pocos leads, que entran leads poco calificados o que el seguimiento se enfría antes de agendar?";
    }

    if (msg.includes("reunion") || msg.includes("reunión")) {
      return "¿Hoy la fricción está en conseguir la cita, en confirmar asistencia o en filtrar antes de agendar?";
    }

    if (msg.includes("filtrar") || msg.includes("calific")) {
      return "¿Esa calificación hoy la hace una persona manualmente o ya tienen algún formulario o filtro previo?";
    }
  }

  if (user.automatizacion_rama === "agentes_especializados" && user.automatizacion_objetivo === "base_conocimiento") {
    if (msg.includes("soporte")) {
      return "¿Ese soporte hoy depende más de documentos dispersos, de respuestas del equipo o de conocimiento que no está centralizado?";
    }

    if (msg.includes("responder")) {
      return "¿Las respuestas que necesitan dar hoy salen de manuales, PDFs, WhatsApp o de varias fuentes mezcladas?";
    }
  }

  return "";
}

function looksLikeQuestion(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;

  return clean.includes("?") || clean.includes("¿");
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

function buildFirstTurnQuestion(user) {
  return buildExplorationQuestion(user);
}

function buildSecondTurnAnchor(userMessage = "") {
  const clean = String(userMessage || "").trim().toLowerCase();

  if (!clean) {
    return "Aquí ya conviene bajar esto a una decisión práctica para que la automatización realmente impacte tu operación.";
  }

  // CASOS MÁS COMUNES (más naturales y comerciales)
  if (clean.includes("lead")) {
    return "Si hoy el problema está en generar más leads, ahí no conviene automatizar a ciegas, sino ajustar primero la captación y la calidad de entrada para que la automatización tenga sentido.";
  }

  if (clean.includes("filtrar") || clean.includes("calific")) {
    return "Si el reto está en filtrar mejor los prospectos, entonces la clave no es responder más rápido, sino definir bien criterios de calificación y automatizar ese filtro desde el inicio.";
  }

  if (clean.includes("reunion") || clean.includes("reunión")) {
    return "Si el cuello de botella está en convertir conversaciones en reuniones, entonces hay que trabajar la transición entre interés y agenda, no solo la respuesta inicial.";
  }

  if (clean.includes("ventas") || clean.includes("cerrar")) {
    return "Si el problema está en cerrar ventas, la automatización debe enfocarse en el seguimiento y en mantener vivo el interés, no solo en la primera interacción.";
  }

  if (clean.includes("soporte") || clean.includes("responder")) {
    return "Si el reto está en soporte o respuestas, entonces conviene estructurar bien la base de conocimiento antes de automatizar para evitar respuestas vacías o inconsistentes.";
  }

  if (clean.includes("datos")) {
    return "Si el problema está en el manejo de datos, entonces lo importante es ordenar la entrada, validación y uso de esa información antes de pensar en automatizar todo el flujo.";
  }

  // DEFAULT (mucho más natural que antes)
  return `Con lo que mencionas sobre "${userMessage}", lo importante es no automatizar por automatizar, sino atacar ese punto específico para que realmente tenga impacto en tu operación.`;
}

function buildImplementationMiniPlan(user) {
  if (user.automatizacion_rama === "atencion_ventas") {
    if (user.automatizacion_objetivo === "calificar_leads_agendar") {
      return "Lo normal sería definir criterios de calificación, capturar datos clave, automatizar filtros y dejar listo el paso a agenda o seguimiento comercial.";
    }

    if (user.automatizacion_objetivo === "faq_soporte") {
      return "Lo más útil sería estructurar una base de respuestas, rutas de escalamiento y reglas para resolver consultas frecuentes sin saturar al equipo.";
    }

    if (user.automatizacion_objetivo === "pedidos_pagos") {
      return "Aquí conviene ordenar el flujo comercial, validar datos, confirmar pagos y reducir fricción entre consulta, pedido y cierre.";
    }
  }

  if (user.automatizacion_rama === "procesos_internos") {
    if (user.automatizacion_objetivo === "notificaciones_seguimiento") {
      return "Lo recomendable sería conectar disparadores, alertas y seguimiento con las herramientas que ya usas para evitar retrasos y olvidos.";
    }

    if (user.automatizacion_objetivo === "procesamiento_datos") {
      return "Aquí lo correcto es definir reglas de entrada, validaciones, tratamiento de errores y una secuencia clara para procesar volumen sin caos manual.";
    }

    if (user.automatizacion_objetivo === "sincronizacion_bases") {
      return "Lo más sano sería unificar criterios de datos, sincronizar fuentes y reducir duplicidades para que la operación no trabaje con información rota.";
    }
  }

  if (user.automatizacion_rama === "agentes_especializados") {
    if (user.automatizacion_objetivo === "base_conocimiento") {
      return "Lo ideal sería centralizar fuentes útiles, ordenar documentos y entrenar el agente para responder con consistencia operativa real.";
    }

    if (user.automatizacion_objetivo === "asistente_autonomo") {
      return "Aquí conviene definir reglas, límites, herramientas conectadas y tareas concretas para que el agente sea útil y controlable.";
    }

    if (user.automatizacion_objetivo === "reduccion_costos") {
      return "Lo recomendable sería mapear desperdicios operativos, detectar tareas repetitivas y automatizar solo lo que genera impacto medible.";
    }
  }

  return "Lo recomendable sería ordenar el proceso, automatizar los puntos críticos y aterrizar una implementación útil para la operación real.";
}

function buildStrongFirstTurnFallback(user) {
  const strategy = buildCaseStrategy(user);
  const question = buildFirstTurnQuestion(user);

  return `En tu caso, la oportunidad real no está solo en responder más rápido, sino en estructurar una automatización que mejore control, velocidad y conversión sin añadir más carga manual al equipo.

${strategy}

${question}`;
}
function buildSecondTurnImplementationDetail(user, userMessage = "") {
  const msg = String(userMessage || "").trim().toLowerCase();

  if (user.automatizacion_rama === "atencion_ventas") {
    if (user.automatizacion_objetivo === "calificar_leads_agendar") {
      if (msg.includes("lead")) {
        return "Si hoy el reto principal está en conseguir más leads, entonces antes de automatizar el agendamiento conviene fortalecer la captación, mejorar los puntos de entrada y filtrar mejor desde el inicio para que el sistema trabaje con oportunidades más reales.";
      }

      if (msg.includes("filtrar") || msg.includes("calific")) {
        return "Si el problema está en filtrar mejor, entonces lo más útil es definir criterios de calificación, preguntas clave y reglas de prioridad para que el bot separe mejor a los prospectos antes de pasarlos a agenda o seguimiento.";
      }

      if (msg.includes("reunion") || msg.includes("reunión")) {
        return "Si el cuello de botella está en convertir conversaciones en reuniones, entonces hay que trabajar mejor la transición entre interés, confianza y agenda para reducir fricción y mejorar conversión.";
      }

      return "Aquí conviene revisar exactamente dónde se cae hoy la conversación comercial para automatizar ese tramo con más precisión y no repetir pasos que todavía no están resolviendo el problema.";
    }

    if (user.automatizacion_objetivo === "faq_soporte") {
      return "Aquí tendría más sentido ordenar respuestas frecuentes, criterios de escalamiento y tiempos de atención para que el equipo no cargue con consultas repetitivas y el usuario reciba una experiencia más consistente.";
    }

    if (user.automatizacion_objetivo === "pedidos_pagos") {
      return "Aquí lo importante sería reducir fricción entre consulta, validación y cierre, para que el sistema no solo responda, sino que ayude a mover la operación comercial con más orden.";
    }
  }

  if (user.automatizacion_rama === "procesos_internos") {
    if (user.automatizacion_objetivo === "procesamiento_datos") {
      return "En este caso, el valor real estaría en ordenar validaciones, reducir errores y definir un flujo claro para que el equipo deje de depender de correcciones manuales y gane velocidad operativa.";
    }

    if (user.automatizacion_objetivo === "notificaciones_seguimiento") {
      return "Aquí conviene identificar qué alertas o seguimientos generan más fricción hoy, para automatizar solo lo que realmente le quite carga al equipo y mejore continuidad.";
    }

    if (user.automatizacion_objetivo === "sincronizacion_bases") {
      return "Aquí el punto crítico sería alinear fuentes, evitar duplicidades y asegurar que la información se mantenga actualizada entre herramientas sin intervención manual constante.";
    }
  }

  if (user.automatizacion_rama === "agentes_especializados") {
    if (user.automatizacion_objetivo === "base_conocimiento") {
      return "Aquí tendría más sentido organizar mejor las fuentes de información y entrenar el agente sobre casos reales para que responda con contexto útil y no con respuestas genéricas.";
    }

    if (user.automatizacion_objetivo === "asistente_autonomo") {
      return "Aquí lo importante sería definir límites, permisos y tareas concretas para que el agente aporte valor operativo sin convertirse en una caja negra.";
    }

    if (user.automatizacion_objetivo === "reduccion_costos") {
      return "Aquí el foco debería estar en detectar dónde se desperdicia más tiempo o recursos para automatizar esos puntos y generar una mejora realmente medible.";
    }
  }

  return "Aquí conviene aterrizar mejor ese punto específico para que la automatización resuelva una necesidad real y no se quede en una mejora superficial.";
}

function buildStrongSecondTurnFallback(user, userMessage) {
  const anchor = buildSecondTurnAnchor(userMessage);
  const detail = buildSecondTurnImplementationDetail(user, userMessage);

  return `${anchor}

${detail} Ahí es donde OneOrbix puede ayudarte a aterrizar una implementación más útil, conectada con tu operación y enfocada en resultados reales.`;
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
    countWords(clean) < 34 ||
    (
      countParagraphs(clean) < 1 &&
      !containsAnyKeyword(clean, ["oneorbix", "implementar", "implementación", "flujo", "proceso", "automatizar", "agenda", "seguimiento", "operacion", "operación"])
    ) ||
    !containsAnyKeyword(clean, ["conviene", "clave", "importante", "priorizar", "ordenar", "mejorar", "oneorbix"]);

  if (needsReinforcement) {
    clean = buildStrongFirstTurnFallback(user);
  }

  if (countParagraphs(clean) >= 2) {
    clean = ensureTwoParagraphStructure(clean);
  }

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
    countWords(clean) < 30 ||
    (
      countParagraphs(clean) < 1 &&
      !containsAnyKeyword(clean, ["oneorbix", "implementar", "implementación", "flujo", "reglas", "proceso", "automatizar", "herramientas", "operación", "operativa"])
    ) ||
    !containsAnyKeyword(clean, ["conviene", "clave", "importante", "priorizar", "ordenar", "mejorar", "oneorbix"]);

  if (needsReinforcement) {
    clean = buildStrongSecondTurnFallback(user, userMessage);
  }

  if (countParagraphs(clean) >= 2) {
    clean = ensureTwoParagraphStructure(clean);
  }

  clean = ensureSecondTurnNoRepeatedQuestion(clean);

  return clean.trim();
}

function maybeReinforceSecondTurnBeforeCTA(text = "", user, userMessage = "") {
  let clean = ensureSecondTurnHasSubstance(text, user, userMessage);

  if (looksLikeQuestion(clean)) {
    clean = stripTrailingQuestionParagraphs(clean).trim();
  }

  if (
    countWords(clean) < 34 ||
    !containsAnyKeyword(clean, ["conviene", "clave", "importante", "ordenar", "mejorar", "oneorbix"])
  ) {
    clean = buildStrongSecondTurnFallback(user, userMessage);
  }

  return clean.trim();
}

// ========================================================
// FALLBACKS
// ========================================================
function buildFallbackInitialReply(user) {
  const implementationFocus = buildImplementationFocus(user);
  const strategy = buildCaseStrategy(user);

  return `En tu caso, lo más lógico sería trabajar una solución enfocada en ${implementationFocus}, para que la automatización no solo quite carga manual, sino que también mejore control, velocidad y consistencia operativa.

${strategy}`;
}

function buildFallbackFollowUpReply(user, userMessage) {
  const anchor = buildSecondTurnAnchor(userMessage);
  const detail = buildSecondTurnImplementationDetail(user, userMessage);

  return `${anchor}

${detail} Ahí es donde OneOrbix puede ayudarte a aterrizar una implementación más útil, conectada con tu operación y enfocada en resultados reales.`;
}

// ========================================================
// PROMPT GEMINI
// ========================================================
function buildGeminiPrompt(user, isFollowUp = false, userMessage = "", withCTA = false) {
  const implementationFocus = buildImplementationFocus(user);
  const strategy = buildCaseStrategy(user);
  const explorationQuestion = buildExplorationQuestion(user);
  const secondQuestion = buildConcreteResponseQuestion(user, userMessage);

  const closingInstruction = withCTA
    ? `- Cierra de forma natural, sin hacer preguntas finales, porque el backend añadirá el siguiente paso comercial.
- El cierre debe dejar sensación de claridad, criterio y siguiente paso.`
    : isFollowUp
      ? `- Si todavía conviene profundizar, puedes cerrar con una sola pregunta NUEVA y más específica que la primera.
- No repitas la misma pregunta del turno anterior.
- Si ya tienes suficiente contexto, no hagas pregunta final.`
      : `- Cierra con una sola pregunta estratégica para explorar mejor el caso.
- Usa esta orientación como referencia para el tipo de pregunta que conviene hacer: "${explorationQuestion}"`;

  const turnInstruction = isFollowUp
    ? `- Estás en el SEGUNDO Y ÚLTIMO TURNO híbrido.
- El usuario ya respondió la pregunta del primer turno o hizo una objeción relacionada.
- Debes usar esa respuesta para profundizar con criterio.
- No reformules el mismo resumen del caso.
- No repitas el mismo copy del primer turno.
- No vuelvas a abrir la conversación con otra pregunta general.
- Aporta una recomendación más concreta, más aterrizada y más comercial.
- Explica cómo OneOrbix abordaría este punto en la práctica.
- Si decides hacer una micro-pregunta, debe ser extremadamente específica y solo si aporta valor. Referencia útil: "${secondQuestion || "En la mayoría de casos aquí conviene cerrar sin otra pregunta."}"`
    : `- Estás en el PRIMER TURNO híbrido.
- Debes sonar distinto al backend y aportar valor desde el inicio.
- No reformules el objetivo de forma obvia.
- Propón una solución consultiva y aterrizada.
- Abre la conversación con una sola pregunta estratégica para explorar mejor el problema.
- La respuesta debe sentirse como la de un asesor que vende implementación real, no como la de un bot básico.
- Prioriza claridad y utilidad sobre amplitud.`;

  return `
Eres Orby, asesor comercial senior de OneOrbix especializado en automatización, procesos, agentes de IA y crecimiento operativo.

Responde en español.
Sé claro, específico, útil, consultivo y comercial.
No inventes precios, paquetes ni servicios no definidos.
No pongas botones.
No menciones que eres una IA.
No respondas como profesor ni como soporte genérico.
No uses frases vacías como "entiendo perfectamente" o "ya tengo más claro tu caso".
No copies ni reformules el backend de forma evidente.

CONTEXTO DEL CASO
- Rama: ${formatRama(user.automatizacion_rama)}
- Canal / Área / Especialización: ${formatCanal(user.automatizacion_canal)}
- Objetivo prioritario: ${formatObjetivo(user.automatizacion_objetivo)}
- Alcance requerido: ${formatAlcance(user.automatizacion_alcance)}
- Metadata interna: ${formatMetadata(user.automatizacion_metadata)}

${isFollowUp ? `FOCO DEL SEGUNDO TURNO
- No repitas la arquitectura general ya mencionada.
- No vuelvas a explicar el flujo completo.
- Concéntrate solo en el punto específico que acaba de mencionar el usuario.
- Aporta una implicación práctica, una recomendación puntual y un siguiente paso lógico.` : `ENFOQUE DE IMPLEMENTACIÓN
${implementationFocus}

ESTRATEGIA BASE
${strategy}`}

${isFollowUp ? `RESPUESTA MÁS RECIENTE DEL USUARIO:
"${String(userMessage || "").trim()}"` : `MOMENTO:
Primera intervención híbrida después de que el backend ya estructuró el caso.`}

INSTRUCCIONES
- Aporta valor desde la primera línea.
- Explica qué conviene hacer en este caso y por qué.
- Propón una solución concreta y aterrizada.
- Explica brevemente cómo OneOrbix podría ayudar a implementarla en la práctica, sin sonar agresivo.
- Debe quedar claro el beneficio esperado para el negocio.
- Debes sonar como alguien que entiende negocio, operación e implementación real.
- Evita respuestas de una sola idea o una sola frase corta.
- No repitas la misma idea con palabras distintas.
- Prioriza una respuesta más corta pero más útil.
${turnInstruction}
${closingInstruction}
- Escribe en 1 o 2 párrafos breves.
- Idealmente entre 4 y 6 líneas.
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
  const fallbackReply = buildFallbackInitialReply(user);

  if (typeof getGeminiReplyWithFallback !== "function") {
    const safeReply = ensureFirstTurnHasConsultiveDepth(
      `${fallbackReply}

${buildExplorationQuestion(user)}`,
      user
    );

    return buildHybridReply(safeReply, withCTA);
  }

  const prompt = buildGeminiPrompt(user, false, "", withCTA);
  const aiReply = await getGeminiReplyWithFallback(
    prompt,
    user,
    fallbackReply
  );

  let finalReply = withCTA
    ? (aiReply || fallbackReply)
    : (aiReply || `${fallbackReply}\n\n${buildExplorationQuestion(user)}`);

  finalReply = ensureFirstTurnHasConsultiveDepth(finalReply, user);

  return buildHybridReply(finalReply, withCTA);
}

async function resolveFollowUpReply({
  user,
  rawMessage,
  getGeminiReplyWithFallback,
  withCTA = false
}) {
  const fallbackReply = buildFallbackFollowUpReply(user, rawMessage);

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
function getAutomatizacionIntro() {
  return `Excelente elección. La IA puede transformar tu operativa diaria. ¿Qué tipo de solución buscas?

1️⃣ Atención al Cliente y Ventas (ChatBots)
2️⃣ Automatización de Procesos Internos
3️⃣ Agentes de IA Especializados (Consultoría)`;
}

function getAtencionVentasPromptP2() {
  return `¿Cuál es el canal principal donde necesitas el Agente?

1️⃣ WhatsApp y Redes Sociales (Meta)
2️⃣ Integrado en mi sitio web o eCommerce
3️⃣ Omnicanal (Todos los anteriores)`;
}

function getAtencionVentasPromptP3() {
  return `¿Cuál es tu objetivo prioritario?

1️⃣ Calificar leads y agendar reuniones automáticamente
2️⃣ Responder preguntas frecuentes y dar soporte técnico
3️⃣ Automatizar la toma de pedidos y pagos`;
}

function getProcesosPromptP2() {
  return `¿Qué área de tu negocio quieres optimizar?

1️⃣ Gestión de leads y CRM (Google Sheets, HubSpot, etc.)
2️⃣ Generación automática de contenido o reportes
3️⃣ Conexión entre aplicaciones (Zapier / Make / APIs)`;
}

function getProcesosPromptP3() {
  return `¿Qué flujo necesitas resolver ahora?

1️⃣ Notificaciones automáticas y seguimiento de clientes
2️⃣ Extracción y procesamiento de datos masivos
3️⃣ Sincronización de inventarios o bases de datos`;
}

function getAgentesPromptP2() {
  return `¿Qué nivel de especialización requiere tu Agente?

1️⃣ Entrenamiento con mis propios documentos o PDFs
2️⃣ Agente con acceso a herramientas externas y ejecución de tareas
3️⃣ Auditoría de IA para procesos existentes`;
}

function getAgentesPromptP3() {
  return `¿Qué resultado esperas obtener?

1️⃣ Una base de conocimiento inteligente para mi equipo
2️⃣ Un asistente autónomo que tome decisiones operativas
3️⃣ Reducción de costos operativos mediante eficiencia de IA`;
}

function getAlcancePrompt() {
  return `Perfecto. Para asignarte el nivel de soporte adecuado, ¿qué tipo de asistencia necesitas?

1️⃣ Asistencia técnica puntual: Necesito un bot o automatización específica.
2️⃣ Asesoría integral: Busco una transformación digital completa con agentes de IA.`;
}

// ========================================================
// MAPEO DE OPCIONES
// ========================================================
function mapRama(option) {
  return {
    "1": "atencion_ventas",
    "2": "procesos_internos",
    "3": "agentes_especializados"
  }[option] || null;
}

function mapAtencionCanal(option) {
  return {
    "1": "whatsapp_redes",
    "2": "sitio_web_ecommerce",
    "3": "omnicanal"
  }[option] || null;
}

function mapAtencionObjetivo(option) {
  return {
    "1": "calificar_leads_agendar",
    "2": "faq_soporte",
    "3": "pedidos_pagos"
  }[option] || null;
}

function resolveAtencionMetadata(objetivo) {
  if (objetivo === "calificar_leads_agendar") return "chatbot_captacion";
  if (objetivo === "faq_soporte") return "chatbot_soporte";
  if (objetivo === "pedidos_pagos") return "chatbot_pedidos";
  return null;
}

function mapProcesosCanal(option) {
  return {
    "1": "gestion_leads_crm",
    "2": "contenido_reportes",
    "3": "conexion_apps_apis"
  }[option] || null;
}

function mapProcesosObjetivo(option) {
  return {
    "1": "notificaciones_seguimiento",
    "2": "procesamiento_datos",
    "3": "sincronizacion_bases"
  }[option] || null;
}

function resolveProcesosMetadata(objetivo) {
  if (objetivo === "notificaciones_seguimiento") return "crm_followup";
  if (objetivo === "procesamiento_datos") return "data_processing";
  if (objetivo === "sincronizacion_bases") return "sync_systems";
  return null;
}

function mapAgentesCanal(option) {
  return {
    "1": "entrenamiento_documentos",
    "2": "agente_con_herramientas",
    "3": "auditoria_ia"
  }[option] || null;
}

function mapAgentesObjetivo(option) {
  return {
    "1": "base_conocimiento",
    "2": "asistente_autonomo",
    "3": "reduccion_costos"
  }[option] || null;
}

function resolveAgentesMetadata(objetivo) {
  if (objetivo === "base_conocimiento") return "knowledge_base";
  if (objetivo === "asistente_autonomo") return "autonomous_agent";
  if (objetivo === "reduccion_costos") return "ai_efficiency_audit";
  return null;
}

function mapAlcance(option) {
  return {
    "1": "asistencia_puntual",
    "2": "asesoria_integral"
  }[option] || null;
}

// ========================================================
// FLOW PRINCIPAL
// ========================================================
async function handleAutomatizacionFlow({
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
    ensureAutomatizacionFields(user);

    const rawMessage = String(message || cleanMessage || "").trim();
    const normalizedMessage = normalizeText(rawMessage);

    // =====================================================
    // CAPA 1
    // =====================================================
    if (user.estado === "automatizacion_p1") {
      const rama = mapRama(cleanMessage);

      if (!rama) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.interes_principal = "automatizacion";
      user.automatizacion_rama = rama;

      if (rama === "atencion_ventas") user.score += 3;
      if (rama === "procesos_internos") user.score += 3;
      if (rama === "agentes_especializados") user.score += 4;

      let nextState = "automatizacion_p1";

      if (rama === "atencion_ventas") nextState = "automatizacion_chatbots_p2";
      if (rama === "procesos_internos") nextState = "automatizacion_procesos_p2";
      if (rama === "agentes_especializados") nextState = "automatizacion_agentes_p2";

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

      if (rama === "atencion_ventas") {
        return {
          reply: getAtencionVentasPromptP2(),
          source: "backend"
        };
      }

      if (rama === "procesos_internos") {
        return {
          reply: getProcesosPromptP2(),
          source: "backend"
        };
      }

      return {
        reply: getAgentesPromptP2(),
        source: "backend"
      };
    }

    // =====================================================
    // RAMA 1 — ATENCIÓN AL CLIENTE Y VENTAS
    // =====================================================
    if (user.estado === "automatizacion_chatbots_p2") {
      const canal = mapAtencionCanal(cleanMessage);

      if (!canal) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_canal = canal;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_chatbots_p3",
        detail: {
          selected_option: cleanMessage,
          canal
        }
      });

      return {
        reply: getAtencionVentasPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "automatizacion_chatbots_p3") {
      const objetivo = mapAtencionObjetivo(cleanMessage);

      if (!objetivo) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_objetivo = objetivo;
      user.automatizacion_metadata = resolveAtencionMetadata(objetivo);
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_alcance_p4",
        detail: {
          selected_option: cleanMessage,
          objetivo,
          metadata: user.automatizacion_metadata
        }
      });

      return {
        reply: getAlcancePrompt(),
        source: "backend"
      };
    }
    // =====================================================
    // RAMA 2 — PROCESOS INTERNOS
    // =====================================================
    if (user.estado === "automatizacion_procesos_p2") {
      const canal = mapProcesosCanal(cleanMessage);

      if (!canal) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_canal = canal;
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_procesos_p3",
        detail: {
          selected_option: cleanMessage,
          canal
        }
      });

      return {
        reply: getProcesosPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "automatizacion_procesos_p3") {
      const objetivo = mapProcesosObjetivo(cleanMessage);

      if (!objetivo) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_objetivo = objetivo;
      user.automatizacion_metadata = resolveProcesosMetadata(objetivo);
      user.score += 2;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_alcance_p4",
        detail: {
          selected_option: cleanMessage,
          objetivo,
          metadata: user.automatizacion_metadata
        }
      });

      return {
        reply: getAlcancePrompt(),
        source: "backend"
      };
    }

    // =====================================================
    // RAMA 3 — AGENTES ESPECIALIZADOS
    // =====================================================
    if (user.estado === "automatizacion_agentes_p2") {
      const canal = mapAgentesCanal(cleanMessage);

      if (!canal) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_canal = canal;
      user.score += 3;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_agentes_p3",
        detail: {
          selected_option: cleanMessage,
          canal
        }
      });

      return {
        reply: getAgentesPromptP3(),
        source: "backend"
      };
    }

    if (user.estado === "automatizacion_agentes_p3") {
      const objetivo = mapAgentesObjetivo(cleanMessage);

      if (!objetivo) {
        return {
          reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_objetivo = objetivo;
      user.automatizacion_metadata = resolveAgentesMetadata(objetivo);
      user.score += 3;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "automatizacion_alcance_p4",
        detail: {
          selected_option: cleanMessage,
          objetivo,
          metadata: user.automatizacion_metadata
        }
      });

      return {
        reply: getAlcancePrompt(),
        source: "backend"
      };
    }

    // =====================================================
    // CAPA 4 — ALCANCE / CUALIFICACIÓN
    // =====================================================
    if (user.estado === "automatizacion_alcance_p4") {
      const alcance = mapAlcance(cleanMessage);

      if (!alcance) {
        return {
          reply: "Por favor responde con 1️⃣ o 2️⃣.",
          source: "backend"
        };
      }

      user.automatizacion_alcance = alcance;

      // LÓGICA NUEVA:
      // La salida híbrida que viene ahora será el PRIMER TURNO IA.
      // El siguiente mensaje del usuario debe disparar ya el
      // SEGUNDO TURNO IA + CTA.
      user.automatizacion_ai_turns = 1;
      user.automatizacion_cta_enabled = false;
      user.automatizacion_last_user_reply = null;

      if (alcance === "asistencia_puntual") user.score += 2;
      if (alcance === "asesoria_integral") user.score += 4;

      user.estado = classifyLead(user);

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "lead_profile_completed",
        detail: {
          selected_option: cleanMessage,
          rama: user.automatizacion_rama,
          canal: user.automatizacion_canal,
          objetivo: user.automatizacion_objetivo,
          alcance: user.automatizacion_alcance,
          metadata: user.automatizacion_metadata,
          ai_turns: user.automatizacion_ai_turns
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
      user.interes_principal === "automatizacion"
    ) {
      if (user.automatizacion_cta_enabled) {
        if (cleanMessage === "1") {
          user.callback_phone = phone;

          moveToState({
            phone,
            user,
            saveUser,
            nextState: "automatizacion_asesor_confirmar_numero",
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
          user.estado = "automatizacion_reunion";

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

      user.automatizacion_ai_turns += 1;
      user.automatizacion_last_user_reply = rawMessage;

      // LÓGICA NUEVA:
      // Como el primer turno IA ya se entregó al salir de alcance_p4,
      // este siguiente mensaje del usuario debe activar directamente
      // el SEGUNDO TURNO IA + CTA.
      const mustShowCTA = user.automatizacion_ai_turns >= 2;

      if (mustShowCTA) {
        user.automatizacion_cta_enabled = true;
      }

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "hybrid_followup",
        detail: {
          ai_turns: user.automatizacion_ai_turns,
          cta_enabled: user.automatizacion_cta_enabled,
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
    if (user.estado === "automatizacion_asesor_confirmar_numero") {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "automatizacion_asesor_horario",
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
          nextState: "automatizacion_asesor_otro_numero",
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
    if (user.estado === "automatizacion_asesor_otro_numero") {
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
        nextState: "automatizacion_asesor_horario",
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
    if (user.estado === "automatizacion_asesor_horario") {
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
    if (user.estado === "automatizacion_reunion") {
      return {
        reply: buildMeetingReply(CALENDLY_LINK),
        source: "backend"
      };
    }

    return null;
  } catch (error) {
    console.error("Error en handleAutomatizacionFlow:", error);

    try {
      logErrorEvent({
        phone,
        module: "automatizacion",
        estado: user?.estado || null,
        interes_principal: user?.interes_principal || null,
        incoming_message: cleanMessage || null,
        error_message: error.message,
        stack: error.stack,
        detail: {
          flow: "automatizacion"
        }
      });
    } catch (logErr) {
      console.error("Error registrando log de error automatizacion:", logErr.message);
    }

    return {
      reply: "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      source: "backend"
    };
  }
}

module.exports = {
  handleAutomatizacionFlow,
  getAutomatizacionIntro,
  isLikelyPhoneNumber
};