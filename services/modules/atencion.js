// ========================================================
// RESPUESTAS BASE DEL MÓDULO ATENCIÓN
// ========================================================

function getAtencionBaseContext(user) {
  return {
    tipo_usuario: user.atencion_tipo_usuario || null,
    cliente_validado: Boolean(user.atencion_cliente_validado),
    nombre: user.atencion_nombre || null,
    prioridad: user.atencion_prioridad || null
  };
}

// ========================================================
// COPY COMERCIAL / SOPORTE BASE (FALLBACK LIMPIO)
// ========================================================

function buildAtencionBaseReply(user) {
  const ctx = getAtencionBaseContext(user);

  if (ctx.tipo_usuario === "cliente_validado") {
    return `Perfecto${ctx.nombre ? `, ${ctx.nombre}` : ""}. Ya tengo contexto de que eres cliente.

Voy a orientarte con la mayor claridad posible para ayudarte a resolver tu caso y, si hace falta, dejarlo listo para revisión con un asesor.`;
  }

  if (ctx.tipo_usuario === "escalado_directo") {
    return `Entiendo. Ya tengo una idea general de tu caso.

Voy a darte una orientación inicial breve y, si lo prefieres, dejar tu solicitud lista para revisión directa con un asesor.`;
  }

  return `Perfecto. Ya tengo una idea general de tu consulta.

Voy a orientarte de la forma más clara posible y, si hace falta, puedo dejar tu caso listo para que un asesor lo revise contigo.`;
}

// ========================================================
// FORMATEADORES (REUTILIZABLES)
// ========================================================

function formatTipoUsuario(value) {
  const map = {
    cliente_pendiente_validacion: "cliente pendiente de validación",
    cliente_validado: "cliente validado",
    prospecto: "prospecto",
    escalado_directo: "caso de escalado directo"
  };

  return map[value] || "usuario general";
}

function formatPrioridad(value) {
  const map = {
    alta: "alta",
    media: "media",
    baja: "baja"
  };

  return map[value] || "media";
}

// ========================================================
// EXPORTS
// ========================================================

module.exports = {
  getAtencionBaseContext,
  buildAtencionBaseReply,
  formatTipoUsuario,
  formatPrioridad
};