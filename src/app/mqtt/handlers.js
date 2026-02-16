const {
  getCapabilityByName,
  isCapability } = require('../managers/capabilities');
const { getAlexaValueCapability, reportAlexaValueChange, isAlexa } = require('../managers/alexa');
const { mqtt_topic } = require('../utils/config');
const { publish } = require('./publisher');
const correlation = require('../utils/correlation');
const logger = require('../utils/logger');

function summarizeMessage(message) {
  const raw = message.toString();
  return {
    length: raw.length,
    preview: raw.slice(0, 300),
  };
}

function registerHandlers(client) {
  // Subscriptions
  client.subscribe(mqtt_topic, (err) => {
    if (err) {
      logger.error({ topic: mqtt_topic, message: err.message }, 'Erro ao subscrever ao tópico');
    } else {
      logger.info({ topic: mqtt_topic }, 'Subscrito ao tópico');
    }
  });


  client.on('message', (topic, message) => {
    const id = correlation.generateId();

    correlation.runWithId(id, async () => {
      try {
        await handleMessage(client, topic, message);
      } catch (err) {
        logger.error('Erro no processamento da mensagem:', err);
      }
    });
  });
}

async function handleMessage(client, topic, message) {
  switch (topic) {
    case mqtt_topic:
      logger.info(
        { topic, message: summarizeMessage(message) },
        'Mensagem recebida no tópico principal'
      );
      await handleCapabilityMessage(client, message);
      break;
    default:
      logger.warn({ topic }, 'Mensagem recebida em tópico desconhecido');
      return;
  }
}

async function handleCapabilityMessage(client, message) {
  try {
    6
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
    if (!isAlexa(capability)) {
      logger.warn(
        { capability_name: payload.capability_name },
        'Capability não pertencece ao Alexa Smart Home'
      );
      return;
    }

    const newValue = payload.value;
    const alexaValue = getAlexaValueCapability(capability, newValue);
    await reportAlexaValueChange(capability.device_id, capability.capability_name, alexaValue, capability);

  } catch (err) {
    logger.error({ message: err.message }, 'Erro ao processar mensagem MQTT');
  }
}

module.exports = {
  registerHandlers,
};
