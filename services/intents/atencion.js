const { includesAny } = require("../utils");

function detectAtencionIntent(text = "") {
  // ========================================================
  // ENTRADA GENERAL AL MÓDULO
  // ========================================================
  if (
    includesAny(text, [
      "atencion al cliente",
      "atención al cliente",
      "servicio al cliente",
      "soporte",
      "ayuda",
      "consulta",
      "quiero hablar con alguien",
      "necesito ayuda",
      "quiero soporte",
      "hablar con asesor",
      "hablar con un asesor",
      "atencion",
      "atención"
    ])
  ) {
    return "atencion_entry";
  }

  // ========================================================
  // CLIENTE EXISTENTE
  // ========================================================
  if (
    includesAny(text, [
      "ya soy cliente",
      "soy cliente",
      "ya trabajo con ustedes",
      "tengo servicio con ustedes",
      "quiero soporte como cliente",
      "necesito ayuda con mi servicio",
      "soporte tecnico",
      "soporte técnico",
      "facturacion",
      "facturación",
      "problema con mi cuenta",
      "problema con mi servicio"
    ])
  ) {
    return "atencion_cliente";
  }

  // ========================================================
  // CONSULTA GENERAL
  // ========================================================
  if (
    includesAny(text, [
      "tengo una consulta",
      "quiero hacer una consulta",
      "tengo una duda",
      "quiero informacion",
      "quiero información",
      "duda general",
      "quiero saber mas",
      "quiero saber más",
      "necesito informacion",
      "necesito información"
    ])
  ) {
    return "atencion_consulta";
  }

  // ========================================================
  // ESCALADO / ASESOR
  // ========================================================
  if (
    includesAny(text, [
      "quiero hablar con un asesor",
      "quiero hablar con asesor",
      "prefiero hablar con alguien",
      "necesito que me contacten",
      "quiero una llamada",
      "caso urgente",
      "necesito ayuda urgente",
      "quiero que revisen mi caso",
      "quiero atencion directa",
      "quiero atención directa"
    ])
  ) {
    return "atencion_asesor";
  }

  // ========================================================
  // AVANCE / ESCALADO FINAL
  // ========================================================
  if (
    includesAny(text, [
      "quiero que me contacten",
      "contactenme",
      "contáctenme",
      "contactarme por whatsapp",
      "contactenme por whatsapp",
      "contáctenme por whatsapp",
      "agendar reunion",
      "agendar reunión",
      "quiero agendar",
      "quiero una reunion",
      "quiero una reunión"
    ])
  ) {
    return "atencion_next_step";
  }

  return null;
}

module.exports = { detectAtencionIntent };