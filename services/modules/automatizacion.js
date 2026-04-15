// ========================================================
// RESPUESTAS BASE DEL MÓDULO AUTOMATIZACIÓN
// ========================================================

function getAutomatizacionBaseContext(user) {
  return {
    rama: user.automatizacion_rama || null,
    canal: user.automatizacion_canal || null,
    objetivo: user.automatizacion_objetivo || null,
    alcance: user.automatizacion_alcance || null,
    metadata: user.automatizacion_metadata || null
  };
}

// ========================================================
// COPY COMERCIAL BASE (FALLBACK MÁS LIMPIO)
// ========================================================

function buildAutomatizacionBaseReply(user) {
  const ctx = getAutomatizacionBaseContext(user);

  if (ctx.rama === "atencion_ventas") {
    return `Tu caso tiene una dirección bastante clara: necesitas automatizar atención y ventas con un enfoque práctico.

Lo importante ahora es trabajar ${formatObjetivo(ctx.objetivo)} dentro de ${formatCanal(ctx.canal)} para que la automatización no solo responda, sino que ayude a captar, filtrar y mover oportunidades reales de negocio.`;
  }

  if (ctx.rama === "procesos_internos") {
    return `Aquí el foco está en ahorrar tiempo, reducir tareas manuales y dejar un flujo más ordenado.

Lo más conveniente ahora es estructurar ${formatObjetivo(ctx.objetivo)} dentro de ${formatCanal(ctx.canal)} para que la operación gane eficiencia y continuidad.`;
  }

  if (ctx.rama === "agentes_especializados") {
    return `Este caso requiere un enfoque más estratégico que improvisado.

Lo importante ahora es definir bien ${formatObjetivo(ctx.objetivo)} y alinearlo con ${formatAlcance(ctx.alcance)} para construir una solución de IA que realmente tenga utilidad operativa.`;
  }

  return `Ya tengo una idea general de tu caso.

El siguiente paso es ordenar mejor la necesidad para orientarte con una solución más precisa y útil.`;
}

// ========================================================
// FORMATEADORES (REUTILIZABLES)
// ========================================================

function formatCanal(value) {
  const map = {
    whatsapp_redes: "WhatsApp y redes sociales",
    sitio_web_ecommerce: "tu sitio web o eCommerce",
    omnicanal: "un entorno omnicanal",

    gestion_leads_crm: "la gestión de leads y CRM",
    contenido_reportes: "la generación automática de contenido o reportes",
    conexion_apps_apis: "la conexión entre aplicaciones y APIs",

    entrenamiento_documentos: "el entrenamiento con documentos o PDFs propios",
    agente_con_herramientas: "un agente con acceso a herramientas externas",
    auditoria_ia: "la auditoría de IA sobre procesos existentes"
  };

  return map[value] || "el área principal del proceso";
}

function formatObjetivo(value) {
  const map = {
    calificar_leads_agendar: "calificar leads y agendar reuniones automáticamente",
    faq_soporte: "responder preguntas frecuentes y dar soporte técnico",
    pedidos_pagos: "automatizar la toma de pedidos y pagos",

    notificaciones_seguimiento: "automatizar notificaciones y seguimiento de clientes",
    procesamiento_datos: "extraer y procesar datos masivos",
    sincronizacion_bases: "sincronizar inventarios o bases de datos",

    base_conocimiento: "crear una base de conocimiento inteligente para tu equipo",
    asistente_autonomo: "desarrollar un asistente autónomo con capacidad operativa",
    reduccion_costos: "reducir costos operativos mediante eficiencia de IA"
  };

  return map[value] || "el objetivo principal";
}

function formatAlcance(value) {
  const map = {
    asistencia_puntual: "una asistencia técnica puntual",
    asesoria_integral: "una asesoría integral de transformación digital con IA"
  };

  return map[value] || "el alcance del proyecto";
}

function formatMetadata(value) {
  const map = {
    chatbot_captacion: "la captación automática 24/7",
    chatbot_soporte: "el soporte automatizado y resolución frecuente",
    chatbot_pedidos: "la automatización comercial de pedidos y pagos",

    crm_followup: "la automatización del seguimiento comercial",
    data_processing: "el procesamiento masivo de información",
    sync_systems: "la sincronización entre sistemas y fuentes de datos",

    knowledge_base: "una base de conocimiento inteligente",
    autonomous_agent: "un agente autónomo con herramientas",
    ai_efficiency_audit: "la mejora de eficiencia operativa con IA"
  };

  return map[value] || "el enfoque principal";
}

// ========================================================
// EXPORTS
// ========================================================

module.exports = {
  getAutomatizacionBaseContext,
  buildAutomatizacionBaseReply,
  formatCanal,
  formatObjetivo,
  formatAlcance,
  formatMetadata
};