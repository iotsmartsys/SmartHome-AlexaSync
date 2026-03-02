const {
  getCapabilityById,
  isCapability } = require('../managers/capabilities');
const { reportAlexaCapabilityAddOrUpdate, isAlexa } = require('../managers/alexa');
const logger = require('../utils/logger');

async function handleCapabilityUpdated(client, message) {
  try {
    const payload = JSON.parse(message.toString());
    logger.debug(
      { capabilityUid: payload.capability_uid },
      'Payload de capability parseado'
    );

    if (!payload.capability_uid) {
      logger.debug("Nome de capability inválido");
      return;
    }

    const capability = await getCapabilityById(payload.capability_uid);
    if (!capability) {
      logger.warn({ capability_uid: payload.capability_uid }, 'Capability não encontrada para o UID fornecido');
      return;
    }

    logger.info({ capability_name: payload.capability_name }, 'Validando Alexa para a capability');
    if (!isAlexa(capability)) {
      logger.warn({ capability_name: payload.capability_name }, 'Capability não pertencece ao Alexa Smart Home');
      return;
    }

    logger.info({ capability_name: payload.capability_name, value: payload.value }, 'Reportando mudança de valor para Alexa');
    await reportAlexaCapabilityAddOrUpdate(capability);

  } catch (err) {
    logger.error({ err }, 'Erro ao processar mensagem MQTT');
  }
}

module.exports = handleCapabilityUpdated;
