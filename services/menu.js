const { getMenuOptions } = require("./menuOptions");

// ========================================================
// MENÚ PRINCIPAL
// ========================================================
function getMainMenu() {
  const options = getMenuOptions();

  const header = `Para orientarte mejor, dime qué te interesa en este momento:\n`;

  const menuText = options
    .map((opt) => `${opt.id}️⃣ ${opt.label}`)
    .join("\n");

  return `${header}\n${menuText}`;
}

// ========================================================
// MENÚ CON MENSAJE PERSONALIZADO (OPCIONAL)
// ========================================================
function getMainMenuWithIntro(intro = "") {
  const baseMenu = getMainMenu();

  if (!intro) return baseMenu;

  return `${intro}\n\n${baseMenu}`;
}

// ========================================================
// MENSAJE DE OPCIÓN INVÁLIDA
// ========================================================
function getInvalidOptionMessage() {
  return `Por favor selecciona una opción válida del menú principal.`;
}

// ========================================================
// EXPORTS
// ========================================================
module.exports = {
  getMainMenu,
  getMainMenuWithIntro,
  getInvalidOptionMessage
};