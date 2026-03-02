const {
  getCapabilityByName,
  isCapability } = require('../managers/capabilities');
const { reportAlexaValueChange, isAlexa } = require('../managers/alexa');
const logger = require('../utils/logger');

async function handleCapabilityState(client, message) {
  try {
    const payload = JSON.parse(message.toString());
    logger.debug(
      { device_id: payload.device_id, capabilityName: payload.capability_name, value: payload.value },
      'Payload de capability parseado'
    );

    if (!isCapability(payload)) {
      logger.debug("Nome de capability inválido");
      return;
    }

    const capability = await getCapabilityByName(payload.capability_name);
    if (!capability) {
      logger.warn({ capability_name: payload.capability_name }, 'Capability não encontrada para o nome fornecido');
      return;
    }

    logger.info({ capability_name: payload.capability_name }, 'Validando Alexa para a capability');
    if (!isAlexa(capability)) {
      logger.warn({ capability_name: payload.capability_name }, 'Capability não pertencece ao Alexa Smart Home');
      return;
    }

    logger.info({ capability_name: payload.capability_name, value: payload.value }, 'Reportando mudança de valor para Alexa');
    await reportAlexaValueChange(capability, payload);

  } catch (err) {
    logger.error({ err }, 'Erro ao processar mensagem MQTT');
  }
}

module.exports = handleCapabilityState;
