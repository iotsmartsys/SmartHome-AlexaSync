const { reportAlexaCapabilityRemoval } = require('../managers/alexa');
const logger = require('../utils/logger');

async function handleCapabilityRemoved(client, message) {
  try {
    const payload = JSON.parse(message.toString());
    logger.debug(
      { capabilityUid: payload.capability_uid },
      'Payload de capability parseado'
    );
    if (!payload.capability_uid) {
      logger.debug({ payload }, 'UID de capability ausente no payload');
      return;
    }

    logger.info({ capability_name: payload.capability_name, capability_uid: payload.capability_uid }, 'Reportando remoção de capability para Alexa');
    await reportAlexaCapabilityRemoval(payload.capability_uid);

  } catch (err) {
    logger.error({ err }, 'Erro ao processar mensagem MQTT');
  }
}

module.exports = {
  handleCapabilityRemoved,
};
