const { includesAny } = require("../utils");

function detectImportacionIntent(text = "") {
  // ========================================================
  // ENTRADA GENERAL AL MÓDULO
  // ========================================================
  if (
    includesAny(text, [
      "importacion",
      "importación",
      "comercio exterior",
      "importar",
      "exportar",
      "proveedores",
      "fabricantes",
      "quiero importar",
      "quiero exportar",
      "buscar proveedor",
      "buscar proveedores",
      "buscar fabricante",
      "buscar fabricantes",
      "traer productos",
      "comprar en china",
      "comprar fuera",
      "negocio de importacion",
      "negocio de importación"
    ])
  ) {
    return "importacion_entry";
  }

  // ========================================================
  // RAMA 1 — IMPORTAR PRODUCTOS
  // ========================================================
  if (
    includesAny(text, [
      "importar productos",
      "quiero importar productos",
      "quiero importar",
      "traer productos",
      "comprar productos afuera",
      "comprar productos en china",
      "importar desde china",
      "importar mercaderia",
      "importar mercadería",
      "traer mercaderia",
      "traer mercadería"
    ])
  ) {
    return "importacion_importar_productos";
  }

  if (
    includesAny(text, [
      "ya tengo el producto definido",
      "ya se que producto importar",
      "ya sé qué producto importar",
      "ya tengo claro el producto",
      "ya tengo definido el producto",
      "ya se que quiero importar",
      "ya sé qué quiero importar"
    ])
  ) {
    return "importacion_importar_producto_definido";
  }

  if (
    includesAny(text, [
      "estoy buscando que producto importar",
      "estoy buscando qué producto importar",
      "no se que producto importar",
      "no sé qué producto importar",
      "quiero encontrar un producto para importar",
      "quiero definir que producto importar",
      "quiero definir qué producto importar"
    ])
  ) {
    return "importacion_importar_buscando_producto";
  }

  if (
    includesAny(text, [
      "como traer ese producto",
      "cómo traer ese producto",
      "como traerlo",
      "cómo traerlo",
      "logistica de importacion",
      "logística de importación",
      "proceso para importar",
      "como importar ese producto",
      "cómo importar ese producto"
    ])
  ) {
    return "importacion_importar_logistica";
  }

  if (
    includesAny(text, [
      "vale la pena importarlo",
      "quiero saber si vale la pena importarlo",
      "quiero validar si conviene importarlo",
      "viabilidad de importacion",
      "viabilidad de importación",
      "rentabilidad de importar ese producto",
      "si conviene importar ese producto"
    ])
  ) {
    return "importacion_importar_viabilidad";
  }

  if (
    includesAny(text, [
      "identificar un producto rentable",
      "buscar un producto rentable",
      "quiero un producto rentable",
      "encontrar un producto rentable para importar",
      "producto rentable para importar",
      "nicho rentable para importar"
    ])
  ) {
    return "importacion_importar_rentabilidad";
  }

  if (
    includesAny(text, [
      "producto con buena demanda",
      "elegir un producto con demanda",
      "buscar un producto con demanda",
      "quiero un producto con buena demanda",
      "demanda de mercado",
      "validar demanda del producto"
    ])
  ) {
    return "importacion_importar_demanda";
  }

  // ========================================================
  // RAMA 2 — EXPORTAR PRODUCTOS
  // ========================================================
  if (
    includesAny(text, [
      "exportar productos",
      "quiero exportar",
      "quiero exportar productos",
      "vender al exterior",
      "vender fuera del pais",
      "vender fuera del país",
      "exportacion",
      "exportación",
      "negocio de exportacion",
      "negocio de exportación"
    ])
  ) {
    return "importacion_exportar_productos";
  }

  if (
    includesAny(text, [
      "ya tengo producto listo para exportar",
      "ya tengo un producto listo para exportar",
      "mi producto ya esta listo para exportar",
      "mi producto ya está listo para exportar",
      "ya puedo exportar mi producto"
    ])
  ) {
    return "importacion_exportar_producto_listo";
  }

  if (
    includesAny(text, [
      "tengo producto pero necesito validar si es viable",
      "quiero validar si mi producto es exportable",
      "no se si mi producto es viable para exportar",
      "no sé si mi producto es viable para exportar",
      "quiero saber si mi producto se puede exportar",
      "validar viabilidad de exportacion",
      "validar viabilidad de exportación"
    ])
  ) {
    return "importacion_exportar_validar_viabilidad";
  }

  if (
    includesAny(text, [
      "conseguir compradores en el exterior",
      "buscar compradores afuera",
      "buscar clientes en el exterior",
      "captar compradores internacionales",
      "conseguir clientes internacionales",
      "vender a clientes en el exterior"
    ])
  ) {
    return "importacion_exportar_compradores";
  }

  if (
    includesAny(text, [
      "empezar a exportar paso a paso",
      "guia para exportar",
      "guía para exportar",
      "asistencia para exportar",
      "necesito ayuda para empezar a exportar",
      "quiero exportar pero no se como empezar",
      "quiero exportar pero no sé cómo empezar"
    ])
  ) {
    return "importacion_exportar_guia_inicial";
  }

  // ========================================================
  // RAMA 3 — BUSCAR PROVEEDORES O FABRICANTES
  // ========================================================
  if (
    includesAny(text, [
      "buscar proveedores",
      "buscar proveedor",
      "buscar fabricantes",
      "buscar fabricante",
      "encontrar proveedores",
      "encontrar fabricante",
      "necesito proveedores",
      "necesito fabricantes",
      "quiero encontrar proveedores",
      "quiero encontrar fabricantes",
      "sourcing"
    ])
  ) {
    return "importacion_proveedores_entry";
  }

  if (
    includesAny(text, [
      "ya se que producto necesito",
      "ya sé qué producto necesito",
      "ya tengo claro que producto buscar",
      "ya tengo claro qué producto buscar",
      "ya defini el producto",
      "ya definí el producto",
      "ya se que proveedor buscar",
      "ya sé qué proveedor buscar"
    ])
  ) {
    return "importacion_proveedores_producto_definido";
  }

  if (
    includesAny(text, [
      "necesito ayuda para definir que producto buscar",
      "necesito ayuda para definir qué producto buscar",
      "no se que producto buscar",
      "no sé qué producto buscar",
      "quiero ayuda para definir el producto",
      "quiero ayuda para definir que buscar",
      "quiero ayuda para definir qué buscar"
    ])
  ) {
    return "importacion_proveedores_definir_producto";
  }

  if (
    includesAny(text, [
      "encontrar proveedores confiables",
      "encontrar fabricantes confiables",
      "buscar proveedores confiables",
      "proveedores confiables",
      "fabricantes confiables",
      "validar proveedores",
      "validar fabricantes"
    ])
  ) {
    return "importacion_proveedores_confiables";
  }

  if (
    includesAny(text, [
      "cotizar y comparar proveedores",
      "comparar proveedores",
      "comparar fabricantes",
      "pedir cotizaciones",
      "cotizar proveedores",
      "comparar cotizaciones",
      "evaluar cotizaciones"
    ])
  ) {
    return "importacion_proveedores_cotizar_comparar";
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
    return "importacion_next_step";
  }

  return null;
}

module.exports = { detectImportacionIntent };