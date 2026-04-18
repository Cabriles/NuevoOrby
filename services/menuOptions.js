// ========================================================
// OPCIONES DEL MENÚ PRINCIPAL DE ORBY
// ========================================================

const MENU_OPTIONS = [
  {
    id: "1",
    interactive_id: "menu_amazon",
    key: "amazon",
    label: "Amazon FBA",
    estado_inicial: "amazon_p1",
    intent: "amazon_entry",
    descripcion: "Venta en Amazon FBA, validación de producto y orientación inicial."
  },
  {
    id: "2",
    interactive_id: "menu_automatizacion",
    key: "automatizacion",
    label: "Automatización y Agentes de IA",
    estado_inicial: "automatizacion_p1",
    intent: "automatizacion_entry",
    descripcion: "Bots, automatización, agentes inteligentes e integraciones."
  },
  {
    id: "3",
    interactive_id: "menu_ecommerce",
    key: "ecommerce",
    label: "Ecommerce y Marketing Digital",
    estado_inicial: "ecommerce_p1",
    intent: "ecommerce_entry",
    descripcion: "Tiendas online, tráfico, conversión y crecimiento digital."
  },
  {
    id: "4",
    interactive_id: "menu_importacion",
    key: "importacion",
    label: "Importación y Comercio Exterior",
    estado_inicial: "importacion_p1",
    intent: "importacion_entry",
    descripcion: "Importar, exportar, buscar proveedores y validar oportunidades."
  },
  {
    id: "5",
    interactive_id: "menu_atencion",
    key: "atencion",
    label: "Atención al Cliente",
    estado_inicial: "atencion_p1",
    intent: "atencion_entry",
    descripcion: "Consultas generales, soporte, validación de cliente y escalado."
  }
];

// ========================================================
// HELPERS DEL MENÚ
// ========================================================
function getMenuOptions() {
  return MENU_OPTIONS;
}

function getMenuOptionById(id) {
  return MENU_OPTIONS.find((option) => option.id === String(id)) || null;
}

function getMenuOptionByInteractiveId(interactiveId) {
  return (
    MENU_OPTIONS.find(
      (option) => option.interactive_id === String(interactiveId).trim().toLowerCase()
    ) || null
  );
}

function getMenuOptionByKey(key) {
  return (
    MENU_OPTIONS.find((option) => option.key === String(key).trim().toLowerCase()) ||
    null
  );
}

function getInitialStateByOption(id) {
  const option = getMenuOptionById(id);
  return option ? option.estado_inicial : null;
}

function getInitialStateByInteractiveId(interactiveId) {
  const option = getMenuOptionByInteractiveId(interactiveId);
  return option ? option.estado_inicial : null;
}

function getIntentByOption(id) {
  const option = getMenuOptionById(id);
  return option ? option.intent : null;
}

function getIntentByInteractiveId(interactiveId) {
  const option = getMenuOptionByInteractiveId(interactiveId);
  return option ? option.intent : null;
}

function isValidMainMenuOption(id) {
  return MENU_OPTIONS.some((option) => option.id === String(id));
}

function isValidMainMenuInteractiveOption(interactiveId) {
  return MENU_OPTIONS.some(
    (option) => option.interactive_id === String(interactiveId).trim().toLowerCase()
  );
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  MENU_OPTIONS,
  getMenuOptions,
  getMenuOptionById,
  getMenuOptionByInteractiveId,
  getMenuOptionByKey,
  getInitialStateByOption,
  getInitialStateByInteractiveId,
  getIntentByOption,
  getIntentByInteractiveId,
  isValidMainMenuOption,
  isValidMainMenuInteractiveOption
};