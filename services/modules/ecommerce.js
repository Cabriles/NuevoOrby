// ========================================================
// RESPUESTAS BASE DEL MÓDULO ECOMMERCE
// ========================================================

function getEcommerceBaseContext(user) {
  return {
    rama: user.ecommerce_rama || null,
    plataforma: user.ecommerce_plataforma || null,
    necesidad: user.ecommerce_necesidad || null,
    contexto: user.ecommerce_contexto || null,
    objetivo: user.ecommerce_objetivo || null
  };
}

// ========================================================
// COPY COMERCIAL BASE (FALLBACK MÁS LIMPIO)
// ========================================================

function buildEcommerceBaseReply(user) {
  const ctx = getEcommerceBaseContext(user);

  if (ctx.rama === "crear_tienda") {
    return `Estás en una fase clave: construir tu ecommerce bien desde el inicio.

No se trata solo de tener una tienda, sino de estructurarla correctamente para que pueda vender desde el primer momento.

Lo importante ahora es enfocarnos en ${formatNecesidad(ctx.necesidad)} y asegurar que ${formatContexto(ctx.contexto)} esté bien resuelto.`;
  }

  if (ctx.rama === "mejorar_resultados") {
    return `Tu caso es bastante claro: ya tienes algo funcionando, pero hay un punto que está frenando resultados.

Aquí no se trata de hacer más, sino de ajustar mejor.

Lo más importante ahora es trabajar ${formatObjetivo(ctx.objetivo)} para destrabar el crecimiento de tu ecommerce.`;
  }

  if (ctx.rama === "conseguir_trafico") {
    return `Aquí el enfoque es claro: generar flujo constante de clientes.

Pero no cualquier tráfico, sino tráfico que realmente convierta.

Lo ideal es trabajar ${formatObjetivo(ctx.objetivo)} dentro de una estrategia que tenga sentido comercial.`;
  }

  return `Ya tengo una idea general de tu caso.

El siguiente paso es organizar mejor lo que estás buscando para que tenga un impacto real en resultados.`;
}

// ========================================================
// FORMATEADORES (REUTILIZABLES)
// ========================================================

function formatNecesidad(value) {
  const map = {
    crear_desde_cero: "crear la tienda desde cero",
    configurar_estructura: "configurar la estructura de la tienda",
    redisenar_actualizar: "rediseñar o actualizar la tienda",

    mejorar_conversiones: "mejorar conversiones",
    mas_ventas_desde_visitas: "convertir mejor el tráfico actual",
    estructura_comercial: "ordenar la estructura comercial",

    publicidad_digital: "la publicidad digital",
    contenido_posicionamiento: "el contenido y posicionamiento",
    automatizacion_seguimiento: "la automatización comercial"
  };

  return map[value] || "el punto principal del proceso";
}

function formatContexto(value) {
  const map = {
    productos_fisicos: "el tipo de producto que vas a vender",
    servicios: "la estructura de venta de servicios",
    productos_digitales: "la entrega y automatización digital",

    metodos_pago: "los métodos de pago",
    envios_logistica: "la logística y envíos",
    estructura_catalogo: "el catálogo de productos",

    imagen_visual: "la presentación visual",
    actualizacion_tecnica: "la base técnica",
    velocidad_rendimiento: "el rendimiento de la tienda"
  };

  return map[value] || "la estructura del ecommerce";
}

function formatObjetivo(value) {
  const map = {
    presentacion_oferta: "la presentación de tu oferta",
    precios_promociones: "precios y promociones",
    producto_servicio_a_empujar: "el enfoque del producto o servicio",

    pagina_producto_landing: "la página de producto",
    carrito_checkout: "el proceso de compra",
    flujo_completo_compra: "el flujo completo del cliente",

    vender_mas: "vender más",
    captar_prospectos: "captar clientes",
    dar_conocer_marca: "posicionar tu marca"
  };

  return map[value] || "el objetivo principal";
}

// ========================================================
// EXPORTS
// ========================================================

module.exports = {
  getEcommerceBaseContext,
  buildEcommerceBaseReply,
  formatNecesidad,
  formatContexto,
  formatObjetivo
};