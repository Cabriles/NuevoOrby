// ========================================================
// CONTEXTO BASE DEL MÓDULO AMAZON
// ========================================================
function getAmazonBaseContext(user) {
  return {
    rama: user.amazon_rama || null,
    situacion: user.amazon_situacion || null,
    necesidad: user.amazon_necesidad || null,
    plan: user.amazon_plan || null
  };
}

// ========================================================
// FORMATTERS
// ========================================================
function formatAmazonRama(value) {
  const map = {
    ya_tengo_producto: "Ya tengo un producto para vender",
    no_se_producto: "Aún no sé qué producto vender",
    empezar_desde_cero: "Quiero empezar desde cero",
    membresias: "Ver Planes de Membresía"
  };

  return map[value] || value || "No definido";
}

function formatAmazonSituacion(value) {
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

function formatAmazonNecesidad(value) {
  const map = {
    validar_producto: "validar si ese producto funciona en Amazon",
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

function getAmazonPlanName(planKey) {
  const map = {
    plan_basico: "Plan básico",
    plan_profesional: "Plan profesional",
    plan_premium: "Plan premium"
  };

  return map[planKey] || "este plan";
}

// ========================================================
// COPY COMERCIAL BASE
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

function buildAmazonBaseReply(user) {
  const ctx = getAmazonBaseContext(user);

  if (ctx.rama === "ya_tengo_producto") {
    return `Perfecto. Ya tengo más claro tu caso.

Ahora mismo estás en una etapa donde ${formatAmazonSituacion(ctx.situacion)} y lo que necesitas es ${formatAmazonNecesidad(ctx.necesidad)}.

En esta fase lo importante no es asumir que por tener producto ya todo está listo, sino validar bien viabilidad, competencia, estructura y siguiente paso antes de avanzar.`;
  }

  if (ctx.rama === "no_se_producto") {
    return `Perfecto. Ya entiendo mejor tu punto de partida.

Tu situación hoy es que ${formatAmazonSituacion(ctx.situacion)} y lo que necesitas es ${formatAmazonNecesidad(ctx.necesidad)}.

Aquí lo más importante es no correr a elegir cualquier producto, sino usar criterio comercial para detectar una opción con más sentido para Amazon.

${buildAmazonMembershipSuggestion(user)}`.trim();
  }

  if (ctx.rama === "empezar_desde_cero") {
    return `Perfecto. Ya entiendo mejor tu caso.

Ahora mismo ${formatAmazonSituacion(ctx.situacion)} y necesitas ${formatAmazonNecesidad(ctx.necesidad)}.

Aquí conviene ordenar bien el camino antes de ejecutar, para no entrar a Amazon sin estructura, sin criterio de producto y sin una hoja de ruta clara.

${buildAmazonMembershipSuggestion(user)}`.trim();
  }

  if (ctx.rama === "membresias") {
    return `Perfecto. Ya veo que te interesa ${getAmazonPlanName(ctx.plan)} y ahora lo que buscas es ${formatAmazonNecesidad(ctx.necesidad)}.

Lo importante aquí es entender si este plan encaja realmente con tu etapa actual y cómo puede ayudarte a avanzar con más claridad en Amazon.`;
  }

  return `Ya tengo una idea más clara de tu caso en Amazon. El siguiente paso es aterrizar una recomendación útil según tu etapa actual y lo que realmente necesitas resolver primero.`;
}

// ========================================================
// CONTEXTO PARA GEMINI O HELPERS REUSABLES
// ========================================================
function buildAmazonHybridContext(user) {
  return {
    module: "amazon",
    rama: formatAmazonRama(user.amazon_rama),
    situacion: formatAmazonSituacion(user.amazon_situacion),
    necesidad: formatAmazonNecesidad(user.amazon_necesidad),
    plan: getAmazonPlanName(user.amazon_plan),
    membershipSuggestion: buildAmazonMembershipSuggestion(user)
  };
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  getAmazonBaseContext,
  formatAmazonRama,
  formatAmazonSituacion,
  formatAmazonNecesidad,
  getAmazonPlanName,
  buildAmazonMembershipSuggestion,
  buildAmazonBaseReply,
  buildAmazonHybridContext
};