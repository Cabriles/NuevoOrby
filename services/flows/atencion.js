const {
  logLeadEvent,
  logErrorEvent
} = require("../logger");

// ========================================================
// HELPERS GENERALES
// ========================================================
function ensureAtencionFields(user) {
  if (!user) return;

  if (!user.score) user.score = 0;
  if (!user.interes_principal) user.interes_principal = null;

  if (!user.atencion_tipo_usuario) user.atencion_tipo_usuario = null;
  if (typeof user.atencion_cliente_validado !== "boolean") {
    user.atencion_cliente_validado = false;
  }
  if (!user.atencion_nombre) user.atencion_nombre = null;
  if (!user.atencion_prioridad) user.atencion_prioridad = null;
  if (!user.atencion_ai_turns) user.atencion_ai_turns = 0;
  if (typeof user.atencion_cta_enabled !== "boolean") {
    user.atencion_cta_enabled = false;
  }
  if (!user.atencion_last_user_reply) user.atencion_last_user_reply = null;

  if (!user.callback_phone) user.callback_phone = null;
  if (!user.callback_schedule) user.callback_schedule = null;
}

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function saveAndLog({
  phone,
  user,
  saveUser,
  eventType,
  detail = {}
}) {
  saveUser(phone, user);

  try {
    logLeadEvent({
      phone,
      module: "atencion",
      event_type: eventType,
      estado: user.estado,
      interes_principal: user.interes_principal,
      subopcion: user.subopcion,
      score: user.score,
      detail
    });
  } catch (error) {
    console.error("Error registrando log atencion:", error.message);
  }
}

function moveToState({
  phone,
  user,
  saveUser,
  nextState,
  eventType = "flow_step",
  detail = {}
}) {
  user.estado = nextState;

  saveAndLog({
    phone,
    user,
    saveUser,
    eventType,
    detail
  });
}

function isLikelyPhoneNumber(text = "") {
  const cleaned = String(text).replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

function isLikelyDocument(text = "") {
  const cleaned = String(text).replace(/\D/g, "");
  return cleaned.length >= 8 && cleaned.length <= 13;
}

function getStandardCTA() {
  return `Si deseas, puedo dejar tu caso listo ahora para que un asesor te contacte directamente por WhatsApp.

1️⃣ Que me contacten por WhatsApp`;
}

function buildHybridReply(aiReply, withCTA = false) {
  const cleanReply = String(aiReply || "").trim();

  if (withCTA) {
    return `${cleanReply}

${getStandardCTA()}`;
  }

  return cleanReply;
}

function buildCallbackConfirmationReply(callbackPhone, callbackSchedule, user) {
  const priorityLabel =
    user.atencion_tipo_usuario === "cliente_validado"
      ? "Cliente existente"
      : "Consulta general";

  return `Perfecto. Hemos tomado tu solicitud.

📞 Número de contacto: ${callbackPhone}
🕒 Horario solicitado: ${callbackSchedule}
🏷️ Prioridad: ${priorityLabel}

Uno de nuestros asesores revisará tu caso y te contactará por WhatsApp.`;
}

function buildMeetingReply(CALENDLY_LINK) {
  return `Perfecto. Aquí tienes el enlace para agendar tu reunión:

${CALENDLY_LINK}

Cuando la reserves, tu caso quedará listo para revisión.`;
}

// ========================================================
// COPY BASE / FALLBACKS
// ========================================================
function buildAtencionTypeLabel(user) {
  if (user.atencion_tipo_usuario === "cliente_validado") {
    return "cliente existente";
  }

  if (user.atencion_tipo_usuario === "escalado_directo") {
    return "caso para revisión directa";
  }

  return "consulta general";
}

function buildSupportOpening(user) {
  if (user.atencion_tipo_usuario === "cliente_validado") {
    return `Perfecto${user.atencion_nombre ? `, ${user.atencion_nombre}` : ""}. Ya tengo contexto de que eres cliente y eso permite orientarte con más continuidad.`;
  }

  if (user.atencion_tipo_usuario === "escalado_directo") {
    return `Perfecto. Un asesor puede revisar tu caso y darte seguimiento.`;
  }

  return `Entiendo. Voy a ayudarte a canalizar tu consulta de forma clara para que pueda revisarse correctamente.`;
}

function buildSupportFocus(user, userMessage = "") {
  const msg = normalizeText(userMessage);

  if (user.atencion_tipo_usuario === "cliente_validado") {
    if (msg.includes("factura") || msg.includes("pago")) {
      return "Aquí conviene revisar bien el contexto del cobro o la facturación para que la atención sea más precisa y no se pierda tiempo en pasos innecesarios.";
    }

    if (msg.includes("envio") || msg.includes("envío") || msg.includes("entrega")) {
      return "Aquí lo más útil es ordenar bien el estado del caso y los datos relevantes para que la continuidad de la atención sea más clara.";
    }

    if (msg.includes("soporte") || msg.includes("problema") || msg.includes("error")) {
      return "Aquí conviene dejar claro qué está fallando y desde cuándo, para que el soporte o la revisión no arranque a ciegas.";
    }

    return "Aquí lo importante es entender bien el punto concreto de tu caso para darte continuidad con más criterio y, si hace falta, dejarlo listo para revisión.";
  }

  if (user.atencion_tipo_usuario === "escalado_directo") {
    return "¿Quieres que te contacten ahora?";
  }

  if (msg.includes("ventas")) {
    return "Aquí conviene dejar clara tu intención para que la derivación llegue bien enfocada al equipo correspondiente y no como una consulta ambigua.";
  }

  if (msg.includes("precio") || msg.includes("costo") || msg.includes("plan")) {
    return "Aquí conviene aclarar bien qué necesitas entender o comparar, para que la orientación sea útil y no quede demasiado general.";
  }

  if (msg.includes("servicio") || msg.includes("como funciona") || msg.includes("cómo funciona")) {
    return "Puedo ayudarte a dejar tu consulta lista ahora para que te contacten directamente por WhatsApp.";
  }

  if (msg.includes("soporte") || msg.includes("problema") || msg.includes("error")) {
    return "Puedo ayudarte a dejar tu caso listo ahora para que un asesor lo revise y te contacte directamente por WhatsApp.";
  }

  return "Puedes dejar tu solicitud lista ahora y te contactamos directamente por WhatsApp.";
}

function buildFallbackReply(user, userMessage = "") {
  const opening = buildSupportOpening(user);
  const focus = buildSupportFocus(user, userMessage);
  const typeLabel = buildAtencionTypeLabel(user);

  if (user.atencion_tipo_usuario === "cliente_validado") {
    return `${opening}

${focus} Voy a mantener la orientación en tono de continuidad y soporte, y si hace falta también puedo dejar el caso listo para revisión con prioridad de ${typeLabel}.`;
  }

  if (user.atencion_tipo_usuario === "escalado_directo") {
    return `${opening}

${focus}`;
  }

  return `${opening}

${focus}`;
}

// ========================================================
// PROMPT GEMINI
// ========================================================
function buildGeminiPrompt(user, userMessage = "") {
  const userTypeBlock =
    user.atencion_tipo_usuario === "cliente_validado"
      ? `TIPO DE ATENCIÓN
- Es un cliente validado.
- Debes responder con continuidad, tono de soporte y sensación de seguimiento.
- No lo trates como prospecto ni como venta nueva.
- Si no hay suficiente detalle para resolver del todo, orienta de forma útil y ordenada.`
      : user.atencion_tipo_usuario === "escalado_directo"
        ? `TIPO DE ATENCIÓN
- Es un caso de escalado directo.
- Debes responder breve, ordenado y profesional.
- El objetivo es dar una primera orientación útil antes de derivar.
- No ofrezcas reunión ni alternativas innecesarias.`
        : `TIPO DE ATENCIÓN
- Es una consulta general.
- Debes orientar con claridad, utilidad y tono profesional.
- No suenes demasiado comercial ni demasiado técnico.
- No ofrezcas reunión ni alternativas innecesarias.`;

  return `
Eres Orby, asistente de atención de OneOrbix.

Responde en español.
Sé claro, útil, breve y profesional.
No inventes precios, paquetes ni servicios no definidos.
No pongas botones.
No cierres con CTA, porque eso lo agrega el backend.
No repitas el flujo completo; solo resuelve u orienta.

CONTEXTO DEL CASO
- Módulo: Atención al Cliente
- Tipo de usuario: ${user.atencion_tipo_usuario || "no definido"}
- Cliente validado: ${user.atencion_cliente_validado ? "sí" : "no"}
- Nombre del usuario: ${user.atencion_nombre || "no disponible"}
- Prioridad: ${user.atencion_prioridad || "media"}

${userTypeBlock}

MENSAJE DEL USUARIO:
${userMessage}

INSTRUCCIONES
- Responde con sentido práctico, no con relleno.
- Si es cliente validado, responde con continuidad y criterio de soporte.
- Si es prospecto, responde con orientación clara y útil.
- Si es escalado directo, responde de forma breve, ordenada y profesional.
- Evita frases vacías o genéricas.
- No prometas acciones que no estén confirmadas.
- No digas que visite la sección de contacto, que escriba por contacto, ni que use otra vía externa.
- No menciones página web, formulario, sección de contacto ni canal alterno, porque el usuario ya está siendo atendido aquí.
- Si corresponde escalar, limita tu respuesta a orientar brevemente y dejar natural el paso a revisión por WhatsApp.
- No ofrezcas agendar reunión en este módulo.
- Máximo 2 párrafos o 5 bullets.
- Debe sonar a atención real y bien llevada.
  `.trim();
}

// ========================================================
// RESOLVER RESPUESTA HÍBRIDA
// ========================================================
async function resolveFollowUpReply({
  user,
  rawMessage,
  getGeminiReplyWithFallback,
  withCTA = false
}) {
  const fallbackReply = buildFallbackReply(user, rawMessage);

  if (typeof getGeminiReplyWithFallback !== "function") {
    return buildHybridReply(fallbackReply, withCTA);
  }

  const prompt = buildGeminiPrompt(user, rawMessage);
  const aiReply = await getGeminiReplyWithFallback(
    prompt,
    user,
    fallbackReply
  );

  return buildHybridReply(aiReply || fallbackReply, withCTA);
}

// ========================================================
// PROMPTS DEL MÓDULO
// ========================================================
function getAtencionIntro() {
  return `Estoy aquí para ayudarte. Elige la opción que mejor describa tu caso:

1️⃣ Ya soy cliente
2️⃣ Tengo una consulta
3️⃣ Quiero hablar con un asesor`;
}

function getClienteValidacionPrompt() {
  return `Perfecto. Para ayudarte de forma más segura, envíame tu RUC o número de C.I.`;
}

function getConsultaLibrePrompt() {
  return `Perfecto. Cuéntame brevemente qué necesitas y te ayudo.`;
}

function getAsesorLibrePrompt() {
  return `Claro. Cuéntame brevemente tu caso para poder derivarlo correctamente.`;
}

// ========================================================
// FLOW PRINCIPAL
// ========================================================
async function handleAtencionFlow({
  user,
  phone,
  cleanMessage,
  message,
  saveUser,
  classifyLead,
  getGeminiReplyWithFallback,
  CALENDLY_LINK,
  findClientByDocument
}) {
  try {
    ensureAtencionFields(user);

    const rawMessage = String(message || cleanMessage || "").trim();
    const normalizedMessage = normalizeText(rawMessage);

    // =====================================================
    // CAPA 1
    // =====================================================
    if (user.estado === "atencion_p1") {
      if (cleanMessage === "1") {
        user.interes_principal = "atencion";
        user.atencion_tipo_usuario = "cliente_pendiente_validacion";
        user.atencion_prioridad = "alta";

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "atencion_cliente_validacion",
          detail: {
            selected_option: "1",
            tipo_usuario: user.atencion_tipo_usuario
          }
        });

        return {
          reply: getClienteValidacionPrompt(),
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.interes_principal = "atencion";
        user.atencion_tipo_usuario = "prospecto";
        user.atencion_prioridad = "media";
        user.atencion_ai_turns = 0;
        user.atencion_cta_enabled = false;
        user.atencion_last_user_reply = null;
        user.score += 1;
        user.estado = classifyLead(user);

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "lead_profile_completed",
          detail: {
            selected_option: "2",
            tipo_usuario: user.atencion_tipo_usuario,
            prioridad: user.atencion_prioridad
          }
        });

        return {
          reply: getConsultaLibrePrompt(),
          source: "backend"
        };
      }

      if (cleanMessage === "3") {
        user.interes_principal = "atencion";
        user.atencion_tipo_usuario = "escalado_directo";
        user.atencion_prioridad = "media";
        user.atencion_ai_turns = 0;
        user.atencion_cta_enabled = false;
        user.atencion_last_user_reply = null;
        user.score += 2;
        user.estado = classifyLead(user);

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "lead_profile_completed",
          detail: {
            selected_option: "3",
            tipo_usuario: user.atencion_tipo_usuario,
            prioridad: user.atencion_prioridad
          }
        });

        return {
          reply: getAsesorLibrePrompt(),
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣, 2️⃣ o 3️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // VALIDACIÓN CLIENTE
    // =====================================================
    if (user.estado === "atencion_cliente_validacion") {
      if (!isLikelyDocument(rawMessage)) {
        return {
          reply: "Por favor envíame un RUC o número de C.I. válido para poder revisarlo.",
          source: "backend"
        };
      }

      let clientRecord = null;

      if (typeof findClientByDocument === "function") {
        clientRecord = await findClientByDocument(rawMessage);
      }

      if (clientRecord) {
        user.atencion_tipo_usuario = "cliente_validado";
        user.atencion_cliente_validado = true;
        user.atencion_nombre =
          clientRecord.nombre ||
          clientRecord.name ||
          clientRecord.cliente ||
          null;
        user.atencion_prioridad = "alta";
        user.atencion_ai_turns = 0;
        user.atencion_cta_enabled = false;
        user.atencion_last_user_reply = null;
        user.score += 4;
        user.estado = classifyLead(user);

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "client_validated",
          detail: {
            document: rawMessage,
            nombre: user.atencion_nombre
          }
        });

        return {
          reply: `Perfecto${user.atencion_nombre ? `, ${user.atencion_nombre}` : ""}. Ya encontré tu registro.

Cuéntame brevemente en qué puedo ayudarte.`,
          source: "backend"
        };
      }

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "atencion_cliente_no_encontrado",
        eventType: "client_validation_failed",
        detail: {
          document: rawMessage
        }
      });

      return {
        reply: `No encontramos un registro con esos datos.

Puede ser un error de digitación o que el servicio esté registrado con otra información.

1️⃣ Intentar nuevamente
2️⃣ Continuar con una consulta general`,
        source: "backend"
      };
    }

    if (user.estado === "atencion_cliente_no_encontrado") {
      if (cleanMessage === "1") {
        moveToState({
          phone,
          user,
          saveUser,
          nextState: "atencion_cliente_validacion",
          detail: {
            selected_option: "1"
          }
        });

        return {
          reply: getClienteValidacionPrompt(),
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.atencion_tipo_usuario = "prospecto";
        user.atencion_cliente_validado = false;
        user.atencion_nombre = null;
        user.atencion_prioridad = "media";
        user.atencion_ai_turns = 0;
        user.atencion_cta_enabled = false;
        user.atencion_last_user_reply = null;
        user.score += 1;
        user.estado = classifyLead(user);

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "switched_to_general_consultation",
          detail: {
            selected_option: "2"
          }
        });

        return {
          reply: getConsultaLibrePrompt(),
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣ o 2️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // FOLLOW-UP HÍBRIDO -> CONSULTA / CLIENTE / ASESOR
    // =====================================================
    if (
      ["lead_curioso", "lead_tibio", "lead_calificado"].includes(user.estado) &&
      user.interes_principal === "atencion"
    ) {
      if (user.atencion_cta_enabled) {
        if (cleanMessage === "1") {
          user.callback_phone = phone;

          moveToState({
            phone,
            user,
            saveUser,
            nextState: "atencion_asesor_confirmar_numero",
            eventType: "cta_whatsapp_selected",
            detail: {
              selected_option: "1",
              suggested_phone: phone,
              tipo_usuario: user.atencion_tipo_usuario
            }
          });

          return {
            reply: `Perfecto. ¿Deseas que te contacten a este mismo número?

${phone}

1️⃣ Sí, a este número
2️⃣ No, quiero dar otro número`,
            source: "backend"
          };
        }

        return {
          reply: "Por favor responde con 1️⃣.",
          source: "backend"
        };
      }

      user.atencion_ai_turns += 1;
      user.atencion_last_user_reply = rawMessage;

      // Cliente validado = hasta 2 respuestas IA antes del CTA
      if (user.atencion_tipo_usuario === "cliente_validado") {
        const mustShowCTA = user.atencion_ai_turns >= 2;

        if (mustShowCTA) {
          user.atencion_cta_enabled = true;
        }

        saveAndLog({
          phone,
          user,
          saveUser,
          eventType: "hybrid_followup",
          detail: {
            ai_turns: user.atencion_ai_turns,
            cta_enabled: user.atencion_cta_enabled,
            tipo_usuario: user.atencion_tipo_usuario,
            user_message: rawMessage
          }
        });

        return {
          reply: await resolveFollowUpReply({
            user,
            rawMessage,
            getGeminiReplyWithFallback,
            withCTA: mustShowCTA
          }),
          source: "hybrid"
        };
      }

      // Prospecto y escalado directo = 1 respuesta IA + CTA inmediato
      user.atencion_cta_enabled = true;

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "hybrid_followup",
        detail: {
          ai_turns: user.atencion_ai_turns,
          cta_enabled: user.atencion_cta_enabled,
          tipo_usuario: user.atencion_tipo_usuario,
          user_message: rawMessage
        }
      });

      return {
        reply: await resolveFollowUpReply({
          user,
          rawMessage,
          getGeminiReplyWithFallback,
          withCTA: true
        }),
        source: "hybrid"
      };
    }

    // =====================================================
    // CONFIRMAR MISMO NÚMERO
    // =====================================================
    if (user.estado === "atencion_asesor_confirmar_numero") {
      if (cleanMessage === "1") {
        user.callback_phone = phone;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "atencion_asesor_horario",
          detail: {
            selected_option: "1",
            callback_phone: user.callback_phone
          }
        });

        return {
          reply: "Indícame en qué horario prefieres que te contacten.",
          source: "backend"
        };
      }

      if (cleanMessage === "2") {
        user.callback_phone = null;

        moveToState({
          phone,
          user,
          saveUser,
          nextState: "atencion_asesor_otro_numero",
          detail: {
            selected_option: "2"
          }
        });

        return {
          reply: "Envíame el número al que deseas que te contacten.",
          source: "backend"
        };
      }

      return {
        reply: "Por favor responde con 1️⃣ o 2️⃣.",
        source: "backend"
      };
    }

    // =====================================================
    // CAPTURA DE OTRO NÚMERO
    // =====================================================
    if (user.estado === "atencion_asesor_otro_numero") {
      if (!isLikelyPhoneNumber(rawMessage)) {
        return {
          reply: "Por favor envíame un número válido para que podamos registrarlo correctamente.",
          source: "backend"
        };
      }

      user.callback_phone = rawMessage;

      moveToState({
        phone,
        user,
        saveUser,
        nextState: "atencion_asesor_horario",
        detail: {
          callback_phone: user.callback_phone
        }
      });

      return {
        reply: "Perfecto. Ahora indícame en qué horario prefieres que te contacten.",
        source: "backend"
      };
    }

    // =====================================================
    // CAPTURA DE HORARIO
    // =====================================================
    if (user.estado === "atencion_asesor_horario") {
      if (!rawMessage || normalizedMessage.length < 2) {
        return {
          reply: "Por favor indícame un horario de contacto para poder registrarlo.",
          source: "backend"
        };
      }

      user.callback_schedule = rawMessage;
      user.estado = "finalizado";

      saveAndLog({
        phone,
        user,
        saveUser,
        eventType: "callback_requested",
        detail: {
          callback_phone: user.callback_phone,
          callback_schedule: user.callback_schedule,
          tipo_usuario: user.atencion_tipo_usuario,
          prioridad: user.atencion_prioridad
        }
      });

      return {
        reply: buildCallbackConfirmationReply(
          user.callback_phone,
          user.callback_schedule,
          user
        ),
        source: "backend"
      };
    }

    // =====================================================
    // ESTADO REUNIÓN
    // =====================================================
    if (user.estado === "atencion_reunion") {
      return {
        reply: buildMeetingReply(CALENDLY_LINK),
        source: "backend"
      };
    }

    return null;
  } catch (error) {
    console.error("Error en handleAtencionFlow:", error);

    try {
      logErrorEvent({
        phone,
        module: "atencion",
        estado: user?.estado || null,
        interes_principal: user?.interes_principal || null,
        incoming_message: cleanMessage || null,
        error_message: error.message,
        stack: error.stack,
        detail: {
          flow: "atencion"
        }
      });
    } catch (logErr) {
      console.error("Error registrando log de error atencion:", logErr.message);
    }

    return {
      reply: "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      source: "backend"
    };
  }
}

module.exports = {
  handleAtencionFlow,
  getAtencionIntro,
  isLikelyPhoneNumber
};