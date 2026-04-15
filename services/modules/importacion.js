// ========================================================
// RESPUESTAS BASE DEL MÓDULO IMPORTACIÓN
// ========================================================

function getImportacionBaseContext(user) {
  return {
    rama: user.importacion_rama || null,
    situacion: user.importacion_situacion || null,
    necesidad: user.importacion_necesidad || null,
    metadata: user.importacion_metadata || null
  };
}

// ========================================================
// COPY COMERCIAL BASE (FALLBACK MÁS LIMPIO)
// ========================================================

function buildImportacionBaseReply(user) {
  const ctx = getImportacionBaseContext(user);

  if (ctx.rama === "importar_productos") {
    return `Tu caso ya tiene una base clara: quieres avanzar en importación con más criterio y menos improvisación.

Lo importante ahora es enfocarnos en ${formatNecesidad(ctx.necesidad)} y ordenar correctamente ${formatMetadata(ctx.metadata)} para que la decisión tenga sentido comercial y operativo.`;
  }

  if (ctx.rama === "exportar_productos") {
    return `Aquí lo importante no es solo querer exportar, sino estructurar bien el proceso desde el inicio.

Ahora mismo conviene enfocarnos en ${formatNecesidad(ctx.necesidad)} y trabajar ${formatMetadata(ctx.metadata)} para que el avance tenga una base real.`;
  }

  if (ctx.rama === "buscar_proveedores") {
    return `En esta etapa, lo clave no es solo conseguir contactos, sino filtrar mejor y comparar con criterio.

Lo importante ahora es resolver ${formatNecesidad(ctx.necesidad)} y dar prioridad a ${formatMetadata(ctx.metadata)} para tomar decisiones más confiables.`;
  }

  return `Ya tengo una idea general de tu caso.

El siguiente paso es ordenar mejor lo que buscas para orientarte con más precisión.`;
}

// ========================================================
// FORMATEADORES (REUTILIZABLES)
// ========================================================

function formatSituacion(value) {
  const map = {
    producto_definido: "ya tener el producto definido",
    buscando_producto: "estar buscando qué producto importar",

    producto_listo_exportar: "ya tener un producto listo para exportar",
    validar_viabilidad_exportacion: "tener un producto y validar si es viable para exportar",

    producto_a_buscar_definido: "ya saber qué producto necesitas buscar",
    ayuda_definir_producto_busqueda: "necesitar ayuda para definir qué producto buscar"
  };

  return map[value] || "la situación actual del proceso";
}

function formatNecesidad(value) {
  const map = {
    como_traer_producto: "entender cómo traer ese producto",
    validar_viabilidad_importacion: "validar si vale la pena importarlo",

    identificar_producto_rentable: "identificar un producto rentable",
    elegir_producto_con_demanda: "elegir un producto con buena demanda",

    conseguir_compradores_exterior: "conseguir compradores o clientes en el exterior",
    guia_exportacion_paso_a_paso: "recibir asistencia para empezar a exportar paso a paso",

    encontrar_proveedores_confiables: "encontrar proveedores o fabricantes confiables",
    cotizar_y_comparar_proveedores: "cotizar y comparar proveedores"
  };

  return map[value] || "el punto principal del proceso";
}

function formatMetadata(value) {
  const map = {
    logistica_import: "la logística de importación",
    viabilidad_import: "la viabilidad comercial de importación",

    rentabilidad_nicho: "la rentabilidad del nicho",
    demanda_mercado: "la demanda del mercado",

    captacion_clientes: "la captación de compradores en el exterior",
    guia_export_inicial: "la estructura inicial para exportar correctamente",

    sourcing_confiable: "el sourcing confiable",
    comparativa_sourcing: "la comparación de proveedores y cotizaciones"
  };

  return map[value] || "el enfoque principal";
}

// ========================================================
// EXPORTS
// ========================================================

module.exports = {
  getImportacionBaseContext,
  buildImportacionBaseReply,
  formatSituacion,
  formatNecesidad,
  formatMetadata
};