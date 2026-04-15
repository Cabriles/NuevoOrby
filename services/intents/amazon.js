const { includesAny } = require("../utils");

function detectAmazonIntent(text = "") {
  // ========================================================
  // ENTRADA GENERAL AL MÓDULO AMAZON
  // ========================================================
  if (
    includesAny(text, [
      "amazon",
      "amazon fba",
      "vender en amazon",
      "quiero vender en amazon",
      "como vender en amazon",
      "cómo vender en amazon",
      "negocio en amazon",
      "empezar en amazon",
      "comenzar en amazon"
    ])
  ) {
    return "amazon_entry";
  }

  // ========================================================
  // RAMA 1 — YA TENGO PRODUCTO
  // ========================================================
  if (
    includesAny(text, [
      "ya tengo un producto",
      "ya tengo producto",
      "tengo producto para vender",
      "ya defini mi producto",
      "ya definí mi producto",
      "ya se que producto vender",
      "ya sé qué producto vender",
      "ya tengo que vender en amazon"
    ])
  ) {
    return "amazon_have_product";
  }

  if (
    includesAny(text, [
      "ya lo vendo",
      "ya vendo ese producto",
      "ya vendo mi producto",
      "ya esta en venta",
      "ya está en venta"
    ])
  ) {
    return "amazon_product_already_selling";
  }

  if (
    includesAny(text, [
      "no lo vendo todavia",
      "no lo vendo todavía",
      "aun no lo vendo",
      "aún no lo vendo",
      "ya lo tengo definido",
      "ya defini el producto pero no lo vendo",
      "ya definí el producto pero no lo vendo"
    ])
  ) {
    return "amazon_product_defined_not_selling";
  }

  if (
    includesAny(text, [
      "validar si funciona en amazon",
      "validar producto en amazon",
      "quiero validar mi producto",
      "quiero validar si sirve para amazon",
      "quiero saber si funciona en amazon",
      "ver si sirve para amazon"
    ])
  ) {
    return "amazon_validate_product";
  }

  if (
    includesAny(text, [
      "como empezar a vender en amazon",
      "cómo empezar a vender en amazon",
      "saber como empezar a vender",
      "saber cómo empezar a vender",
      "quiero empezar a vender en amazon",
      "quiero saber como arrancar en amazon",
      "quiero saber cómo arrancar en amazon"
    ])
  ) {
    return "amazon_start_selling";
  }

  // ========================================================
  // RAMA 2 — AÚN NO SÉ QUÉ PRODUCTO VENDER
  // ========================================================
  if (
    includesAny(text, [
      "no se que producto vender",
      "no sé qué producto vender",
      "aun no se que vender en amazon",
      "aún no sé qué vender en amazon",
      "todavia no se que producto elegir",
      "todavía no sé qué producto elegir",
      "no tengo producto para amazon",
      "aun no tengo producto",
      "aún no tengo producto"
    ])
  ) {
    return "amazon_no_product";
  }

  if (
    includesAny(text, [
      "marca propia",
      "quiero crear una marca propia",
      "private label",
      "quiero vender mi propia marca",
      "quiero lanzar una marca propia"
    ])
  ) {
    return "amazon_private_label";
  }

  if (
    includesAny(text, [
      "revender productos",
      "quiero revender productos",
      "reventa en amazon",
      "revender en amazon fba",
      "comprar y revender en amazon"
    ])
  ) {
    return "amazon_resell_fba";
  }

  if (
    includesAny(text, [
      "encontrar un producto con potencial",
      "buscar producto con potencial",
      "quiero encontrar un producto ganador",
      "quiero encontrar producto para amazon",
      "buscar producto rentable para amazon"
    ])
  ) {
    return "amazon_find_product";
  }

  if (
    includesAny(text, [
      "validar una idea de producto",
      "tengo una idea de producto",
      "quiero validar una idea",
      "quiero validar mi idea de producto",
      "ver si mi idea sirve para amazon"
    ])
  ) {
    return "amazon_validate_product_idea";
  }

  // ========================================================
  // RAMA 3 — EMPEZAR DESDE CERO
  // ========================================================
  if (
    includesAny(text, [
      "quiero empezar desde cero",
      "quiero comenzar desde cero",
      "empezar en amazon desde cero",
      "comenzar en amazon desde cero",
      "soy nuevo en amazon",
      "soy principiante en amazon",
      "quiero arrancar desde cero en amazon"
    ])
  ) {
    return "amazon_start_from_zero";
  }

  if (
    includesAny(text, [
      "es mi primera vez",
      "primera vez en amazon",
      "nunca he vendido en amazon",
      "nunca he hecho amazon",
      "soy nuevo vendiendo en amazon"
    ])
  ) {
    return "amazon_first_time";
  }

  if (
    includesAny(text, [
      "ya he investigado",
      "ya investigue un poco",
      "ya investigué un poco",
      "ya he visto como funciona",
      "ya he visto cómo funciona",
      "ya revise algo de amazon",
      "ya revisé algo de amazon"
    ])
  ) {
    return "amazon_researched_a_bit";
  }

  if (
    includesAny(text, [
      "asistencia paso a paso",
      "guia paso a paso",
      "guía paso a paso",
      "quiero ayuda paso a paso",
      "quiero acompañamiento paso a paso",
      "necesito una guia para empezar",
      "necesito una guía para empezar"
    ])
  ) {
    return "amazon_step_by_step_help";
  }

  if (
    includesAny(text, [
      "como elegir un producto correctamente",
      "cómo elegir un producto correctamente",
      "quiero saber elegir producto",
      "como elegir producto para amazon",
      "cómo elegir producto para amazon",
      "ayuda para elegir producto"
    ])
  ) {
    return "amazon_choose_product_correctly";
  }

  // ========================================================
  // RAMA 4 — MEMBRESÍAS
  // ========================================================
  if (
    includesAny(text, [
      "ver planes de membresia",
      "ver planes de membresía",
      "ver membresias",
      "ver membresías",
      "planes de membresia",
      "planes de membresía",
      "membresias amazon",
      "membresías amazon",
      "quiero ver los planes"
    ])
  ) {
    return "amazon_memberships";
  }

  if (
    includesAny(text, [
      "plan basico",
      "plan básico",
      "membresia basica",
      "membresía básica",
      "quiero el plan basico",
      "quiero el plan básico"
    ])
  ) {
    return "amazon_plan_basic";
  }

  if (
    includesAny(text, [
      "plan profesional",
      "membresia profesional",
      "membresía profesional",
      "quiero el plan profesional"
    ])
  ) {
    return "amazon_plan_professional";
  }

  if (
    includesAny(text, [
      "plan premium",
      "membresia premium",
      "membresía premium",
      "quiero el plan premium"
    ])
  ) {
    return "amazon_plan_premium";
  }

  if (
    includesAny(text, [
      "que incluye este plan",
      "qué incluye este plan",
      "que incluye el plan",
      "qué incluye el plan",
      "ver que incluye",
      "ver qué incluye",
      "detalles del plan",
      "informacion del plan",
      "información del plan"
    ])
  ) {
    return "amazon_plan_includes";
  }

  if (
    includesAny(text, [
      "quiero acceder al plan",
      "quiero el enlace del plan",
      "quiero el link del plan",
      "acceder al plan",
      "recibir el enlace",
      "recibir el link",
      "comprar el plan",
      "quiero comprar el plan"
    ])
  ) {
    return "amazon_plan_access";
  }

  // ========================================================
  // INTENCIÓN DE AVANCE / CIERRE
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
    return "amazon_next_step";
  }

  return null;
}

module.exports = { detectAmazonIntent };