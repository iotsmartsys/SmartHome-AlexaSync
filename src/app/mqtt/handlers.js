const { mqtt_topic, mqtt_topic_capability_updated, mqtt_topic_capability_removed } = require('../utils/config');
const correlation = require('../utils/correlation');
const logger = require('../utils/logger');
const handleCapabilityState = require('./handlers_capability_state');
const handleCapabilityUpdated = require('./handlers_capability_updated');
const { handleCapabilityRemoved } = require('./handlers_capability_removed');

function summarizeMessage(message) {
  const raw = message.toString();
  return {
    payload_: raw,
    length: raw.length,
    preview: raw.slice(0, 300),
  };
}

function registerHandlers(client) {
  for (const topic of [mqtt_topic, mqtt_topic_capability_updated, mqtt_topic_capability_removed]) {
    client.subscribe(topic, (err) => {
      if (err) {
        logger.error({ topic, message: err.message }, 'Erro ao subscrever ao tópico');
      } else {
        logger.info({ topic }, 'Subscrito ao tópico');
      }
    });
  }

  client.on('message', (topic, message) => {
    const id = message.capability_name;

    correlation.runWithId(id, async () => {
      try {
        await handleMessage(client, topic, message);
      } catch (err) {
        logger.error({ err }, 'Erro no processamento da mensagem');
      }
    });
  });
}

async function handleMessage(client, topic, message) {

  switch (topic) {
    case mqtt_topic:
      logger.info({ topic, message: summarizeMessage(message) }, 'Mensagem recebida no tópico principal');
      await handleCapabilityState(client, message);
      break;
    case mqtt_topic_capability_updated:
      logger.info({ topic, message: summarizeMessage(message) }, 'Mensagem recebida no tópico de capacidade atualizada');
      await handleCapabilityUpdated(client, message);
      break;
    case mqtt_topic_capability_removed:
      logger.info({ topic, message: summarizeMessage(message) }, 'Mensagem recebida no tópico de capacidade removida');
      await handleCapabilityRemoved(client, message);
      break;
    default:
      logger.warn({ topic }, 'Mensagem recebida em tópico desconhecido');
      break;
  }
}

module.exports = {
  registerHandlers,
};
