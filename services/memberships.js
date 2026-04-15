// ========================================================
// CLIENTES / MEMBERSHIPS SERVICE
// ========================================================

// ========================================================
// PLANES DE MEMBRESÍA
// ========================================================
const memberships = {
  basico: {
    nombre: "Plan básico",
    precio: "$49 al año",
    link: "https://oneorbix.com/producto/membresia-basica/",
    payLink: "https://ppls.me/C0mjI47UUwtxBg6VDbmbyg",
    idealPara:
      "Emprendedores que están dando sus primeros pasos en importación o desean validar sus ideas con una guía inicial.",
    incluye: [
      "Acceso a la comunidad OneOrbix y red internacional de importadores",
      "1 asesoría inicial para diagnóstico del proyecto",
      "Plantilla básica para cálculo de costos de importación",
      "1 webinar formativo por trimestre",
      "Soporte vía correo electrónico"
    ],
    resumen:
      "Es la mejor opción para comenzar con una base clara, sin hacer una inversión alta al inicio."
  },

  profesional: {
    nombre: "Plan profesional",
    precio: "$149 al año",
    link: "https://oneorbix.com/producto/membresia-profesional/",
    payLink: "https://ppls.me/PcEAiPxcLjaRIADQOLrY5w",
    idealPara:
      "Usuarios que ya tienen una idea más clara, necesitan más herramientas y quieren acompañamiento más práctico durante el año.",
    incluye: [
      "3 asesorías personalizadas durante el año",
      "Simulador de costos, checklist de importación y contrato modelo",
      "Participación en hasta 3 grupos de importación al año",
      "Acceso a contactos verificados de agentes logísticos y despachantes de aduana",
      "Verificación de un proveedor internacional",
      "Acceso a ferias virtuales y ruedas de negocio",
      "Soporte por correo y WhatsApp"
    ],
    resumen:
      "Es una opción más completa para avanzar con más estructura, herramientas y respaldo."
  },

  premium: {
    nombre: "Plan premium",
    precio: "$290 al año",
    link: "https://oneorbix.com/producto/membresia-premium/",
    payLink: "https://ppls.me/6chTbCk0gx2kS2Rn2oyEZw",
    idealPara:
      "Usuarios que buscan un acompañamiento más completo, constante y estratégico en sus procesos de importación.",
    incluye: [
      "Asesoría mensual personalizada con especialista en comercio exterior",
      "Análisis comparativo de cotizaciones y proveedores",
      "Apoyo completo en trámites logísticos",
      "Acceso preferencial a grupos de importación",
      "Representación del producto en ferias internacionales",
      "Difusión de productos en canales digitales y red comercial de OneOrbix",
      "Soporte premium y acceso a grupo privado de miembros activos"
    ],
    resumen:
      "Es la opción más robusta para quienes quieren apoyo continuo, análisis más profundo y una ejecución más completa."
  }
};

// Base temporal en memoria.
// Luego puedes reemplazar esto por Google Sheets, Airtable, DB, etc.
const clientRegistry = [
  // Ejemplo:
  // {
  //   id: "1",
  //   nombre: "Richard Cabriles",
  //   documento: "1234567890",
  //   telefono: "+593999999999",
  //   email: "richard@example.com",
  //   estado: "activo",
  //   tipo_cliente: "cliente_existente",
  //   servicio: "OneOrbix"
  // }
];

// ========================================================
// HELPERS
// ========================================================
function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeDocument(value = "") {
  return String(value).replace(/\D/g, "").trim();
}

function normalizePhone(value = "") {
  return String(value).replace(/[^\d+]/g, "").trim();
}

// ========================================================
// BÚSQUEDAS
// ========================================================
function findClientByDocument(document = "") {
  const normalizedDoc = normalizeDocument(document);

  if (!normalizedDoc) return null;

  return (
    clientRegistry.find((client) => {
      return normalizeDocument(client.documento) === normalizedDoc;
    }) || null
  );
}

function findClientByPhone(phone = "") {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) return null;

  return (
    clientRegistry.find((client) => {
      return normalizePhone(client.telefono) === normalizedPhone;
    }) || null
  );
}

function findClientByName(name = "") {
  const normalizedName = normalizeText(name);

  if (!normalizedName) return null;

  return (
    clientRegistry.find((client) => {
      return normalizeText(client.nombre).includes(normalizedName);
    }) || null
  );
}

// ========================================================
// ESTADO DE CLIENTE / MEMBERSHIP
// ========================================================
function hasActiveMembership(client = null) {
  if (!client) return false;

  const status = normalizeText(client.estado || "");
  return ["activo", "activa", "active", "vigente"].includes(status);
}

function getClientPriority(client = null) {
  if (!client) return "media";

  if (hasActiveMembership(client)) return "alta";
  return "media";
}

function buildValidatedClientProfile(client = null) {
  if (!client) return null;

  return {
    id: client.id || null,
    nombre: client.nombre || null,
    documento: client.documento || null,
    telefono: client.telefono || null,
    email: client.email || null,
    estado: client.estado || null,
    tipo_cliente: client.tipo_cliente || null,
    servicio: client.servicio || null,
    prioridad: getClientPriority(client),
    membership_active: hasActiveMembership(client)
  };
}

// ========================================================
// REGISTRO EN MEMORIA
// ========================================================
function addClient(client = {}) {
  if (!client || !client.documento) return null;

  const existing = findClientByDocument(client.documento);
  if (existing) return existing;

  const newClient = {
    id: client.id || String(clientRegistry.length + 1),
    nombre: client.nombre || null,
    documento: client.documento || null,
    telefono: client.telefono || null,
    email: client.email || null,
    estado: client.estado || "activo",
    tipo_cliente: client.tipo_cliente || "cliente_existente",
    servicio: client.servicio || null
  };

  clientRegistry.push(newClient);
  return newClient;
}

function getAllClients() {
  return [...clientRegistry];
}

function getClientCount() {
  return clientRegistry.length;
}

// ========================================================
// ADAPTADOR PREPARADO PARA FUENTE EXTERNA
// ========================================================
function createMembershipService(adapter = {}) {
  return {
    async findClientByDocument(document) {
      if (typeof adapter.findClientByDocument === "function") {
        return adapter.findClientByDocument(document);
      }

      return findClientByDocument(document);
    },

    async findClientByPhone(phone) {
      if (typeof adapter.findClientByPhone === "function") {
        return adapter.findClientByPhone(phone);
      }

      return findClientByPhone(phone);
    },

    async buildValidatedClientProfile(document) {
      let client = null;

      if (typeof adapter.findClientByDocument === "function") {
        client = await adapter.findClientByDocument(document);
      } else {
        client = findClientByDocument(document);
      }

      return buildValidatedClientProfile(client);
    }
  };
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  memberships,
  clientRegistry,

  normalizeDocument,
  normalizePhone,

  findClientByDocument,
  findClientByPhone,
  findClientByName,

  hasActiveMembership,
  getClientPriority,
  buildValidatedClientProfile,

  addClient,
  getAllClients,
  getClientCount,

  createMembershipService
};