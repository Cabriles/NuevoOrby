// ========================================================
// STORE EN MEMORIA
// ========================================================
const userStore = new Map();

// ========================================================
// MODELO BASE DE USUARIO
// ========================================================
function createEmptyUser(phone) {
  return {
    phone: phone || null,
    estado: null,
    score: 0,
    interes_principal: null,
    subopcion: null,

    callback_phone: null,
    callback_schedule: null,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ========================================================
// HELPERS INTERNOS
// ========================================================
function touchUser(user) {
  if (!user) return user;

  user.updated_at = new Date().toISOString();
  return user;
}

// ========================================================
// OPERACIONES PRINCIPALES
// ========================================================
function getUser(phone) {
  if (!phone) return null;
  return userStore.get(phone) || null;
}

function hasUser(phone) {
  if (!phone) return false;
  return userStore.has(phone);
}

function saveUser(phone, user) {
  if (!phone || !user) return null;

  const userToSave = {
    ...user,
    phone: phone,
    updated_at: new Date().toISOString()
  };

  if (!userToSave.created_at) {
    userToSave.created_at = new Date().toISOString();
  }

  userStore.set(phone, userToSave);
  return userToSave;
}

function getOrCreateUser(phone) {
  if (!phone) return null;

  const existingUser = getUser(phone);
  if (existingUser) return existingUser;

  const newUser = createEmptyUser(phone);
  saveUser(phone, newUser);
  return getUser(phone);
}

function updateUser(phone, patch = {}) {
  if (!phone) return null;

  const currentUser = getOrCreateUser(phone);
  const updatedUser = {
    ...currentUser,
    ...patch,
    phone,
    updated_at: new Date().toISOString()
  };

  saveUser(phone, updatedUser);
  return updatedUser;
}

function resetUser(phone, extraFields = {}) {
  if (!phone) return null;

  const freshUser = {
    ...createEmptyUser(phone),
    ...extraFields,
    phone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  userStore.set(phone, freshUser);
  return freshUser;
}

function deleteUser(phone) {
  if (!phone) return false;
  return userStore.delete(phone);
}

// ========================================================
// HELPERS DE ESTADO
// ========================================================
function setUserState(phone, estado, extraFields = {}) {
  if (!phone) return null;

  return updateUser(phone, {
    estado,
    ...extraFields
  });
}

function getUserState(phone) {
  const user = getUser(phone);
  return user ? user.estado : null;
}

function clearUserState(phone, extraFields = {}) {
  if (!phone) return null;

  return updateUser(phone, {
    estado: null,
    ...extraFields
  });
}

// ========================================================
// CLASIFICACIÓN SIMPLE DE LEAD
// ========================================================
function classifyLead(user = {}) {
  const score = Number(user.score || 0);

  if (score >= 8) return "lead_calificado";
  if (score >= 4) return "lead_tibio";
  return "lead_curioso";
}

// ========================================================
// UTILIDADES DE DEPURACIÓN
// ========================================================
function getAllUsers() {
  return Array.from(userStore.values());
}

function getUserCount() {
  return userStore.size;
}

function clearAllUsers() {
  userStore.clear();
  return true;
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  userStore,

  createEmptyUser,
  getUser,
  hasUser,
  saveUser,
  getOrCreateUser,
  updateUser,
  resetUser,
  deleteUser,

  setUserState,
  getUserState,
  clearUserState,

  classifyLead,

  getAllUsers,
  getUserCount,
  clearAllUsers
};