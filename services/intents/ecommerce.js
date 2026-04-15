const { includesAny } = require("../utils");

function detectEcommerceIntent(text = "") {
  // ========================================================
  // ENTRADA GENERAL AL MÓDULO
  // ========================================================
  if (
    includesAny(text, [
      "ecommerce",
      "comercio electronico",
      "comercio electrónico",
      "tienda online",
      "tienda en linea",
      "tienda en línea",
      "tienda virtual",
      "quiero vender por internet",
      "vender online",
      "vender por internet",
      "negocio online"
    ])
  ) {
    return "ecommerce_entry";
  }

  // ========================================================
  // RAMA 1 — CREAR TIENDA O ECOMMERCE
  // ========================================================
  if (
    includesAny(text, [
      "crear tienda",
      "crear ecommerce",
      "crear mi tienda",
      "quiero crear una tienda",
      "quiero crear un ecommerce",
      "montar una tienda online",
      "hacer una tienda online",
      "abrir una tienda online",
      "necesito una tienda online",
      "crear tienda virtual"
    ])
  ) {
    return "ecommerce_create_store";
  }

  // Plataformas
  if (
    includesAny(text, [
      "shopify",
      "tienda en shopify",
      "crear en shopify",
      "quiero shopify",
      "montar en shopify"
    ])
  ) {
    return "ecommerce_platform_shopify";
  }

  if (
    includesAny(text, [
      "woocommerce",
      "woo commerce",
      "wordpress",
      "wordpress woocommerce",
      "tienda en wordpress",
      "crear en woocommerce",
      "quiero woocommerce"
    ])
  ) {
    return "ecommerce_platform_woocommerce";
  }

  if (
    includesAny(text, [
      "prestashop",
      "presta shop",
      "tienda en prestashop",
      "crear en prestashop",
      "quiero prestashop"
    ])
  ) {
    return "ecommerce_platform_prestashop";
  }

  // Necesidad principal crear tienda
  if (
    includesAny(text, [
      "crear desde cero",
      "empezar desde cero",
      "hacerla desde cero",
      "crear tienda desde cero",
      "quiero empezar desde cero"
    ])
  ) {
    return "ecommerce_create_from_scratch";
  }

  if (
    includesAny(text, [
      "configurar pagos",
      "configurar envios",
      "configurar envíos",
      "configurar estructura",
      "metodos de pago",
      "métodos de pago",
      "envios y logistica",
      "envíos y logística",
      "estructura de catalogo",
      "estructura de catálogo"
    ])
  ) {
    return "ecommerce_configure_store";
  }

  if (
    includesAny(text, [
      "rediseñar tienda",
      "rediseno tienda",
      "rediseño tienda",
      "actualizar tienda",
      "mejorar diseño de mi tienda",
      "renovar mi tienda",
      "optimizar mi tienda"
    ])
  ) {
    return "ecommerce_redesign_store";
  }

  // Crear desde cero → tipo de tienda
  if (
    includesAny(text, [
      "productos fisicos",
      "productos físicos",
      "tienda de productos fisicos",
      "vender productos fisicos",
      "stock y logistica",
      "stock y logística"
    ])
  ) {
    return "ecommerce_store_physical_products";
  }

  if (
    includesAny(text, [
      "servicios",
      "vender servicios",
      "tienda de servicios",
      "reservas",
      "agendas",
      "citas",
      "agenda online"
    ])
  ) {
    return "ecommerce_store_services";
  }

  if (
    includesAny(text, [
      "productos digitales",
      "digitales",
      "descargas",
      "descargas automaticas",
      "descargas automáticas",
      "ebooks",
      "cursos digitales",
      "infoproductos"
    ])
  ) {
    return "ecommerce_store_digital_products";
  }

  // Configuración técnica
  if (
    includesAny(text, [
      "pasarela de pago",
      "pasarelas de pago",
      "checkout",
      "cobros online",
      "formas de pago",
      "metodos de pago",
      "métodos de pago"
    ])
  ) {
    return "ecommerce_setup_payments";
  }

  if (
    includesAny(text, [
      "envios",
      "envíos",
      "logistica",
      "logística",
      "tarifas de envio",
      "tarifas de envío",
      "zonas de envio",
      "zonas de envío",
      "operadores de envio",
      "operadores de envío"
    ])
  ) {
    return "ecommerce_setup_shipping";
  }

  if (
    includesAny(text, [
      "catalogo",
      "catálogo",
      "categorias",
      "categorías",
      "variantes",
      "fichas de producto",
      "ordenar productos",
      "estructura de catalogo",
      "estructura de catálogo"
    ])
  ) {
    return "ecommerce_setup_catalog";
  }

  // Rediseño
  if (
    includesAny(text, [
      "imagen visual",
      "diseño visual",
      "branding visual",
      "mejorar imagen",
      "cambiar imagen",
      "diseño de tienda"
    ])
  ) {
    return "ecommerce_redesign_visual";
  }

  if (
    includesAny(text, [
      "actualizacion tecnica",
      "actualización técnica",
      "parte tecnica",
      "parte técnica",
      "compatibilidad",
      "mejorar estructura tecnica",
      "mejorar estructura técnica"
    ])
  ) {
    return "ecommerce_redesign_technical";
  }

  if (
    includesAny(text, [
      "velocidad",
      "rendimiento",
      "mi tienda esta lenta",
      "mi tienda está lenta",
      "optimizar carga",
      "mejorar velocidad",
      "performance"
    ])
  ) {
    return "ecommerce_redesign_performance";
  }

  // ========================================================
  // RAMA 2 — MEJORAR VENTAS O RESULTADOS
  // ========================================================
  if (
    includesAny(text, [
      "mejorar ventas",
      "mejorar resultados",
      "quiero vender mas",
      "quiero vender más",
      "vendo poco",
      "no vendo suficiente",
      "mi tienda no vende",
      "quiero mejorar conversiones",
      "quiero mejorar mi ecommerce"
    ])
  ) {
    return "ecommerce_improve_results";
  }

  if (
    includesAny(text, [
      "mejorar conversiones",
      "mejorar conversion",
      "mejorar conversión",
      "vendo poco",
      "no convierto",
      "pocas ventas"
    ])
  ) {
    return "ecommerce_improve_conversions";
  }

  if (
    includesAny(text, [
      "tengo visitas pero no vendo",
      "tengo trafico pero no vendo",
      "tengo tráfico pero no vendo",
      "entra gente pero no compra",
      "tengo visitas pero pocas ventas"
    ])
  ) {
    return "ecommerce_more_sales_from_visits";
  }

  if (
    includesAny(text, [
      "estructura comercial",
      "ordenar mi tienda",
      "mejorar estructura comercial",
      "mejorar estructura de ventas",
      "mi tienda necesita una mejor estructura"
    ])
  ) {
    return "ecommerce_commercial_structure";
  }

  // Freno principal
  if (
    includesAny(text, [
      "oferta",
      "propuesta comercial",
      "producto mal presentado",
      "no se vende bien lo que ofrezco",
      "mi oferta no conecta"
    ])
  ) {
    return "ecommerce_block_offer";
  }

  if (
    includesAny(text, [
      "carrito",
      "checkout",
      "proceso de compra",
      "pagina de producto",
      "página de producto",
      "landing",
      "abandono en checkout"
    ])
  ) {
    return "ecommerce_block_checkout";
  }

  if (
    includesAny(text, [
      "confianza",
      "credibilidad",
      "seguimiento",
      "recuperacion de clientes",
      "recuperación de clientes",
      "recuperacion de carritos",
      "recuperación de carritos",
      "seguimiento por whatsapp",
      "seguimiento por email"
    ])
  ) {
    return "ecommerce_block_trust_followup";
  }

  // Objetivo puntual
  if (
    includesAny(text, [
      "mejorar como presento lo que vendo",
      "mejorar cómo presento lo que vendo",
      "presentar mejor mi oferta",
      "mejorar presentacion",
      "mejorar presentación"
    ])
  ) {
    return "ecommerce_goal_offer_presentation";
  }

  if (
    includesAny(text, [
      "precios",
      "promociones",
      "packs",
      "ordenar precios",
      "mejorar promociones"
    ])
  ) {
    return "ecommerce_goal_prices_promotions";
  }

  if (
    includesAny(text, [
      "definir mejor que vender",
      "definir mejor qué vender",
      "que producto empujar",
      "qué producto empujar",
      "que servicio empujar",
      "qué servicio empujar"
    ])
  ) {
    return "ecommerce_goal_push_product";
  }

  if (
    includesAny(text, [
      "pagina de producto",
      "página de producto",
      "landing page",
      "mejorar landing"
    ])
  ) {
    return "ecommerce_goal_product_page";
  }

  if (
    includesAny(text, [
      "carrito y checkout",
      "mejorar checkout",
      "mejorar carrito",
      "checkout lento"
    ])
  ) {
    return "ecommerce_goal_cart_checkout";
  }

  if (
    includesAny(text, [
      "flujo de compra",
      "flujo completo de compra",
      "mejorar proceso de compra",
      "recorrido del cliente"
    ])
  ) {
    return "ecommerce_goal_purchase_flow";
  }

  if (
    includesAny(text, [
      "pruebas de confianza",
      "credibilidad",
      "testimonios",
      "reseñas",
      "generar confianza"
    ])
  ) {
    return "ecommerce_goal_trust";
  }

  if (
    includesAny(text, [
      "seguimiento por whatsapp",
      "seguimiento por email",
      "seguimiento comercial",
      "dar seguimiento a clientes"
    ])
  ) {
    return "ecommerce_goal_followup";
  }

  if (
    includesAny(text, [
      "recuperar carritos",
      "carritos abandonados",
      "automatizar seguimiento",
      "recuperacion de carritos",
      "recuperación de carritos"
    ])
  ) {
    return "ecommerce_goal_recovery";
  }

  // ========================================================
  // RAMA 3 — CONSEGUIR TRÁFICO O CLIENTES
  // ========================================================
  if (
    includesAny(text, [
      "conseguir trafico",
      "conseguir tráfico",
      "conseguir clientes",
      "atraer clientes",
      "necesito trafico",
      "necesito tráfico",
      "quiero mas clientes",
      "quiero más clientes",
      "quiero generar trafico",
      "quiero generar tráfico"
    ])
  ) {
    return "ecommerce_get_traffic";
  }

  if (
    includesAny(text, [
      "publicidad digital",
      "anuncios",
      "campañas",
      "meta ads",
      "facebook ads",
      "instagram ads",
      "google ads",
      "publicidad paga"
    ])
  ) {
    return "ecommerce_channel_ads";
  }

  if (
    includesAny(text, [
      "seo",
      "contenido",
      "posicionamiento",
      "google",
      "aparecer en google",
      "marketing de contenidos"
    ])
  ) {
    return "ecommerce_channel_content";
  }

  if (
    includesAny(text, [
      "automatizacion",
      "automatización",
      "seguimiento comercial",
      "crm",
      "embudo",
      "whatsapp automatico",
      "whatsapp automático",
      "automatizar respuestas"
    ])
  ) {
    return "ecommerce_channel_automation";
  }

  // Publicidad digital
  if (
    includesAny(text, [
      "campañas desde cero",
      "empezar campañas",
      "iniciar campañas",
      "hacer anuncios desde cero"
    ])
  ) {
    return "ecommerce_ads_start";
  }

  if (
    includesAny(text, [
      "mejorar campañas",
      "optimizar campañas",
      "mis campañas no funcionan",
      "ya tengo campañas activas"
    ])
  ) {
    return "ecommerce_ads_improve";
  }

  if (
    includesAny(text, [
      "que campaña me conviene",
      "qué campaña me conviene",
      "que tipo de campaña",
      "qué tipo de campaña",
      "no se que campaña usar",
      "no sé qué campaña usar"
    ])
  ) {
    return "ecommerce_ads_which_campaign";
  }

  if (
    includesAny(text, [
      "campaña para tienda",
      "publicidad para ecommerce",
      "mover mi tienda",
      "anuncios para tienda"
    ])
  ) {
    return "ecommerce_ads_move_store";
  }

  if (
    includesAny(text, [
      "campaña para servicio",
      "anuncios para servicio",
      "mover servicio",
      "publicidad para servicios"
    ])
  ) {
    return "ecommerce_ads_move_service";
  }

  if (
    includesAny(text, [
      "campaña para producto",
      "anuncios para producto",
      "mover producto especifico",
      "mover producto específico",
      "producto especifico",
      "producto específico"
    ])
  ) {
    return "ecommerce_ads_move_product";
  }

  if (
    includesAny(text, [
      "no llega trafico",
      "no llega tráfico",
      "poco trafico",
      "poco tráfico",
      "mis campañas no traen visitas"
    ])
  ) {
    return "ecommerce_ads_problem_low_traffic";
  }

  if (
    includesAny(text, [
      "llega trafico pero no convierte",
      "llega tráfico pero no convierte",
      "mis anuncios no convierten",
      "traigo visitas pero no venden"
    ])
  ) {
    return "ecommerce_ads_problem_no_conversion";
  }

  if (
    includesAny(text, [
      "no se que ajustar",
      "no sé qué ajustar",
      "no tengo claro que ajustar",
      "no tengo claro qué ajustar"
    ])
  ) {
    return "ecommerce_ads_problem_unclear";
  }

  if (
    includesAny(text, [
      "vender mas con anuncios",
      "vender más con anuncios"
    ])
  ) {
    return "ecommerce_ads_goal_sales";
  }

  if (
    includesAny(text, [
      "captar prospectos",
      "captar leads",
      "conseguir contactos",
      "generar prospectos"
    ])
  ) {
    return "ecommerce_ads_goal_leads";
  }

  if (
    includesAny(text, [
      "dar a conocer mi marca",
      "branding",
      "reconocimiento de marca",
      "dar a conocer mi negocio"
    ])
  ) {
    return "ecommerce_ads_goal_brand";
  }

  // Contenido y posicionamiento
  if (
    includesAny(text, [
      "mejorar redes",
      "mejorar presencia en redes",
      "redes sociales",
      "instagram",
      "facebook",
      "tiktok"
    ])
  ) {
    return "ecommerce_content_social";
  }

  if (
    includesAny(text, [
      "google",
      "seo web",
      "seo de la web",
      "visibilidad en google",
      "aparecer en búsquedas",
      "aparecer en busquedas"
    ])
  ) {
    return "ecommerce_content_google";
  }

  if (
    includesAny(text, [
      "estrategia de contenidos",
      "ordenar contenido",
      "plan de contenidos",
      "contenido para vender"
    ])
  ) {
    return "ecommerce_content_strategy";
  }

  if (
    includesAny(text, [
      "mejorar contenido",
      "crear mejor contenido",
      "contenido"
    ])
  ) {
    return "ecommerce_content_goal_content";
  }

  if (
    includesAny(text, [
      "frecuencia",
      "publicacion",
      "publicación",
      "orden de publicacion",
      "orden de publicación"
    ])
  ) {
    return "ecommerce_content_goal_frequency";
  }

  if (
    includesAny(text, [
      "convertir seguidores",
      "seguidores a clientes",
      "monetizar redes"
    ])
  ) {
    return "ecommerce_content_goal_convert_followers";
  }

  if (
    includesAny(text, [
      "seo",
      "optimizar seo",
      "seo web"
    ])
  ) {
    return "ecommerce_google_goal_seo";
  }

  if (
    includesAny(text, [
      "ficha de negocio",
      "google business",
      "presencia local",
      "google maps"
    ])
  ) {
    return "ecommerce_google_goal_local";
  }

  if (
    includesAny(text, [
      "contenido para búsquedas",
      "contenido para busquedas",
      "articulos para seo",
      "artículos para seo"
    ])
  ) {
    return "ecommerce_google_goal_search_content";
  }

  if (
    includesAny(text, [
      "que publicar",
      "qué publicar",
      "ideas de contenido",
      "no se que publicar",
      "no sé qué publicar"
    ])
  ) {
    return "ecommerce_strategy_goal_what_to_publish";
  }

  if (
    includesAny(text, [
      "conectar contenido con ventas",
      "contenido que venda",
      "contenido para vender"
    ])
  ) {
    return "ecommerce_strategy_goal_connect_sales";
  }

  if (
    includesAny(text, [
      "estrategia por etapas",
      "ordenar estrategia",
      "estructura de contenido"
    ])
  ) {
    return "ecommerce_strategy_goal_stages";
  }

  // Automatización y seguimiento
  if (
    includesAny(text, [
      "automatizar respuestas",
      "automatizar atencion",
      "automatizar atención",
      "bot de respuestas",
      "respuestas automaticas",
      "respuestas automáticas"
    ])
  ) {
    return "ecommerce_automation_replies";
  }

  if (
    includesAny(text, [
      "seguimiento a prospectos",
      "seguimiento automatico",
      "seguimiento automático",
      "nutricion de leads",
      "nutrición de leads"
    ])
  ) {
    return "ecommerce_automation_followup";
  }

  if (
    includesAny(text, [
      "integrar formularios",
      "integrar whatsapp",
      "integrar crm",
      "integrar embudo",
      "embudo comercial"
    ])
  ) {
    return "ecommerce_automation_integrations";
  }

  if (
    includesAny(text, [
      "respuestas iniciales",
      "primeras respuestas",
      "respuesta automatica inicial",
      "respuesta automática inicial"
    ])
  ) {
    return "ecommerce_automation_goal_initial_replies";
  }

  if (
    includesAny(text, [
      "atencion por whatsapp",
      "atención por whatsapp",
      "automatizar whatsapp",
      "whatsapp automatico",
      "whatsapp automático"
    ])
  ) {
    return "ecommerce_automation_goal_whatsapp";
  }

  if (
    includesAny(text, [
      "calificar prospectos",
      "calificacion de prospectos",
      "calificación de prospectos",
      "filtrar prospectos",
      "lead scoring"
    ])
  ) {
    return "ecommerce_automation_goal_qualification";
  }

  if (
    includesAny(text, [
      "respuesta a nuevos contactos",
      "responder nuevos leads",
      "primer contacto automatizado"
    ])
  ) {
    return "ecommerce_followup_goal_new_contacts";
  }

  if (
    includesAny(text, [
      "nutricion",
      "nutrición",
      "recontacto",
      "dar seguimiento despues",
      "dar seguimiento después"
    ])
  ) {
    return "ecommerce_followup_goal_nurturing";
  }

  if (
    includesAny(text, [
      "recuperar oportunidades frias",
      "recuperar oportunidades frías",
      "reactivar leads",
      "reactivar clientes"
    ])
  ) {
    return "ecommerce_followup_goal_reactivate";
  }

  if (
    includesAny(text, [
      "formularios y crm",
      "crm",
      "integrar formularios con crm"
    ])
  ) {
    return "ecommerce_integration_goal_forms_crm";
  }

  if (
    includesAny(text, [
      "whatsapp y embudo",
      "whatsapp con embudo",
      "integrar whatsapp con embudo"
    ])
  ) {
    return "ecommerce_integration_goal_whatsapp_funnel";
  }

  if (
    includesAny(text, [
      "captacion seguimiento y cierre",
      "captación seguimiento y cierre",
      "armar embudo completo",
      "integracion comercial completa",
      "integración comercial completa"
    ])
  ) {
    return "ecommerce_integration_goal_full_funnel";
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
      "quiero una reunión"
    ])
  ) {
    return "ecommerce_next_step";
  }

  return null;
}

module.exports = { detectEcommerceIntent };