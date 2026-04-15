const { includesAny } = require("../utils");

function detectAutomatizacionIntent(text = "") {
  // ========================================================
  // ENTRADA GENERAL AL MÓDULO
  // ========================================================
  if (
    includesAny(text, [
      "automatizacion",
      "automatización",
      "agentes de ia",
      "agente de ia",
      "ia para negocios",
      "inteligencia artificial para negocios",
      "chatbot",
      "chatbots",
      "bot de whatsapp",
      "automatizar procesos",
      "automatizar mi negocio",
      "automatizacion con ia",
      "automatización con ia",
      "quiero automatizar",
      "quiero un agente de ia",
      "quiero un chatbot"
    ])
  ) {
    return "automatizacion_entry";
  }

  // ========================================================
  // RAMA 1 — ATENCIÓN AL CLIENTE Y VENTAS
  // ========================================================
  if (
    includesAny(text, [
      "atencion al cliente con ia",
      "atención al cliente con ia",
      "ventas con chatbot",
      "chatbot para ventas",
      "chatbot para atencion al cliente",
      "chatbot para atención al cliente",
      "bot para ventas",
      "bot para whatsapp",
      "agente para ventas",
      "captar leads por whatsapp",
      "automatizar ventas",
      "cerrar ventas con chatbot"
    ])
  ) {
    return "automatizacion_chatbots";
  }

  if (
    includesAny(text, [
      "whatsapp",
      "redes sociales",
      "instagram",
      "facebook",
      "meta",
      "whatsapp y redes",
      "bot para whatsapp y redes"
    ])
  ) {
    return "automatizacion_chatbots_whatsapp_redes";
  }

  if (
    includesAny(text, [
      "sitio web",
      "mi web",
      "pagina web",
      "página web",
      "mi ecommerce",
      "ecommerce",
      "web o ecommerce",
      "chatbot en mi sitio web",
      "chatbot en mi web"
    ])
  ) {
    return "automatizacion_chatbots_web";
  }

  if (
    includesAny(text, [
      "omnicanal",
      "todos los canales",
      "varios canales",
      "whatsapp web y redes",
      "multicanal"
    ])
  ) {
    return "automatizacion_chatbots_omnicanal";
  }

  if (
    includesAny(text, [
      "calificar leads",
      "agendar reuniones automaticamente",
      "agendar reuniones automáticamente",
      "calificar leads y agendar",
      "filtrar prospectos",
      "agendamiento automatico",
      "agendamiento automático"
    ])
  ) {
    return "automatizacion_chatbots_leads";
  }

  if (
    includesAny(text, [
      "preguntas frecuentes",
      "faq",
      "soporte tecnico",
      "soporte técnico",
      "responder dudas frecuentes",
      "dar soporte automatico",
      "dar soporte automático"
    ])
  ) {
    return "automatizacion_chatbots_soporte";
  }

  if (
    includesAny(text, [
      "toma de pedidos",
      "pedidos y pagos",
      "automatizar pedidos",
      "automatizar pagos",
      "cobros automáticos",
      "cobros automaticos",
      "ventas con pago automatizado"
    ])
  ) {
    return "automatizacion_chatbots_pedidos";
  }

  // ========================================================
  // RAMA 2 — AUTOMATIZACIÓN DE PROCESOS INTERNOS
  // ========================================================
  if (
    includesAny(text, [
      "automatizacion de procesos",
      "automatización de procesos",
      "procesos internos",
      "automatizar tareas",
      "eliminar tareas manuales",
      "automatizar operaciones",
      "ahorrar tiempo con automatizacion",
      "ahorrar tiempo con automatización"
    ])
  ) {
    return "automatizacion_procesos";
  }

  if (
    includesAny(text, [
      "crm",
      "hubspot",
      "google sheets",
      "gestion de leads",
      "gestión de leads",
      "automatizar leads",
      "seguimiento de prospectos",
      "automatizar crm"
    ])
  ) {
    return "automatizacion_procesos_crm";
  }

  if (
    includesAny(text, [
      "contenido automatico",
      "contenido automático",
      "reportes automaticos",
      "reportes automáticos",
      "generacion de contenido",
      "generación de contenido",
      "automatizar reportes",
      "generar reportes con ia"
    ])
  ) {
    return "automatizacion_procesos_contenido_reportes";
  }

  if (
    includesAny(text, [
      "zapier",
      "make",
      "api",
      "apis",
      "conectar aplicaciones",
      "integrar aplicaciones",
      "conexion entre apps",
      "conexión entre apps",
      "automatizar con api"
    ])
  ) {
    return "automatizacion_procesos_integraciones";
  }

  if (
    includesAny(text, [
      "notificaciones automaticas",
      "notificaciones automáticas",
      "seguimiento de clientes",
      "seguimiento automatico",
      "seguimiento automático",
      "avisos automaticos",
      "avisos automáticos"
    ])
  ) {
    return "automatizacion_procesos_notificaciones";
  }

  if (
    includesAny(text, [
      "extraccion de datos",
      "extracción de datos",
      "procesamiento de datos",
      "datos masivos",
      "extraer datos",
      "procesar datos masivos",
      "scraping y procesamiento"
    ])
  ) {
    return "automatizacion_procesos_datos";
  }

  if (
    includesAny(text, [
      "sincronizacion de inventarios",
      "sincronización de inventarios",
      "sincronizar inventarios",
      "sincronizar bases de datos",
      "sincronizacion de bases de datos",
      "sincronización de bases de datos",
      "replicar datos entre sistemas"
    ])
  ) {
    return "automatizacion_procesos_sync";
  }

  // ========================================================
  // RAMA 3 — AGENTES DE IA ESPECIALIZADOS
  // ========================================================
  if (
    includesAny(text, [
      "agente de ia especializado",
      "agentes especializados",
      "consultoria de ia",
      "consultoría de ia",
      "entrenar agente con documentos",
      "auditoria de ia",
      "auditoría de ia",
      "agente con herramientas",
      "ia avanzada para mi negocio"
    ])
  ) {
    return "automatizacion_agentes";
  }

  if (
    includesAny(text, [
      "entrenar con documentos",
      "entrenar con pdf",
      "entrenar con mis pdf",
      "base de conocimiento con documentos",
      "agente con mis documentos",
      "subir pdf al agente",
      "agente entrenado con documentos"
    ])
  ) {
    return "automatizacion_agentes_documentos";
  }

  if (
    includesAny(text, [
      "agente con herramientas",
      "agente que ejecute tareas",
      "agente autonomo",
      "agente autónomo",
      "agente con acceso a herramientas externas",
      "agente que tome acciones",
      "agente operativo"
    ])
  ) {
    return "automatizacion_agentes_herramientas";
  }

  if (
    includesAny(text, [
      "auditoria de ia",
      "auditoría de ia",
      "revisar mi ia actual",
      "evaluar automatizaciones existentes",
      "diagnostico de ia",
      "diagnóstico de ia",
      "optimizar procesos con ia"
    ])
  ) {
    return "automatizacion_agentes_auditoria";
  }

  if (
    includesAny(text, [
      "base de conocimiento inteligente",
      "knowledge base",
      "asistente para mi equipo",
      "buscar informacion interna",
      "buscar información interna",
      "asistente con documentos internos"
    ])
  ) {
    return "automatizacion_agentes_base_conocimiento";
  }

  if (
    includesAny(text, [
      "asistente autonomo",
      "asistente autónomo",
      "agente que tome decisiones",
      "agente operativo autonomo",
      "agente operativo autónomo",
      "asistente que ejecute tareas"
    ])
  ) {
    return "automatizacion_agentes_autonomo";
  }

  if (
    includesAny(text, [
      "reducir costos con ia",
      "reducir costos operativos",
      "eficiencia con ia",
      "optimizar costos con ia",
      "mejorar eficiencia operativa"
    ])
  ) {
    return "automatizacion_agentes_eficiencia";
  }

  // ========================================================
  // ALCANCE / CUALIFICACIÓN
  // ========================================================
  if (
    includesAny(text, [
      "asistencia tecnica puntual",
      "asistencia técnica puntual",
      "solo necesito una automatizacion especifica",
      "solo necesito una automatización específica",
      "necesito un bot especifico",
      "necesito un bot específico",
      "solucion puntual",
      "solución puntual"
    ])
  ) {
    return "automatizacion_scope_puntual";
  }

  if (
    includesAny(text, [
      "asesoria integral",
      "asesoría integral",
      "transformacion digital completa",
      "transformación digital completa",
      "quiero una solucion integral",
      "quiero una solución integral",
      "quiero una estrategia completa de ia",
      "quiero una implementacion completa",
      "quiero una implementación completa"
    ])
  ) {
    return "automatizacion_scope_integral";
  }

  // ========================================================
  // INTENCIÓN DE AVANCE
  // ========================================================
  if (
    includesAny(text, [
      "quiero avanzar",
      "quiero empezar",
      "quiero que me contacten",
      "quiero una llamada",
      "quiero agendar",
      "agendar reunion",
      "agendar reunión",
      "hablar con un asesor",
      "quiero una reunion",
      "quiero una reunión",
      "contactenme por whatsapp",
      "contáctenme por whatsapp"
    ])
  ) {
    return "automatizacion_next_step";
  }

  return null;
}

module.exports = { detectAutomatizacionIntent };