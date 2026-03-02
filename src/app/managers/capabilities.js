const http = require('../utils/http');
const logger = require('../utils/logger');

const capabilityCache = new Map();

// GET smart-home/Alexa/capabilities/a52469a1-1ab0-42d5-8b86-a892350242a2

async function getCapabilityById(capability_uid) {
  const path = `smart-home/Alexa/capabilities/${encodeURIComponent(capability_uid)}`;
  return await getCapability(path, capability_uid);
}

// GET smart-home/Alexa/capabilities/?group_name=Alexa&name=capability_name
async function getCapabilityByName(capability_name) {
  const path = `smart-home/Alexa/capabilities/?group_name=Alexa&name=${encodeURIComponent(capability_name)}`;
  return await getCapability(path, capability_name);
}

async function getCapability(path, key) {
  try {
    const cached = getCapabilityFromCache(key);
    if (cached) {
      logger.info(`Capability referenceId encontrada no cache: ${JSON.stringify(cached)}`);
      return cached;
    }

  logger.info({ capability_name: key }, 'Getting capability');
    const response = await http.get(path);
    logger.info(`Capability API response status: ${response.status} for name: ${key}`);
    logger.debug(`Capability API response data: ${JSON.stringify(response.data)} for name: ${key}`);

    if (response.status !== 200) {
      return null;
    }
    let capability = response.data;
    logger.info(`Capability response: ${JSON.stringify(capability)}`);

    // API may return an array of capabilities — use the first item when present
    if (Array.isArray(capability)) {
      if (capability.length === 0) {
        logger.warn(`Capability array is empty for name: ${key}`);
        return null;
      }
      capability = capability[0];
    }

    // API may return an empty string for no-result — normalize to null
    if (typeof capability === 'string' && capability.trim() === '') {
      logger.warn(`Capability is null or undefined for name: ${key}`);
      return null;
    }

    return addCapabilityToCache(key, capability);
  } catch (error) {
    // Log the error object so pino captures stack and structured error fields
    logger.error({ err: error, capability_name: key }, 'Error getting capability');
    if (error.response && error.response.status === 404) {
      logger.warn(`Capability ${key} not found in API`);
    }
    return null;
  }
}

function getCapabilityFromCache(capability_name) {
  return capabilityCache.get(capability_name) || null;
}

function addCapabilityToCache(capability_name, capability) {
  if (!capability) {
    logger.warn(`Capability is null or undefined for name: ${capability_name}`);
    return null;
  }
  const cached = {
    uid: capability.uid,
    capability_name: capability.capability_name,
    device_id: capability.device_id,
    owner: capability.owner,
    smart_home: capability.smart_home,
    value_type: capability.value_type,
  };

  logger.info(`Adding capability to cache: ${JSON.stringify(cached)}`);
  capabilityCache.set(capability_name, cached);
  return cached;
}

function isCapability(payload) {
  if (!payload || !payload.capability_name) {
    return false;
  }
  switch (payload.capability_name) {
    case 'device_state':
    case 'wifi_signal':
    case 'wifi_ssid':
  logger.info({ capability_name: payload.capability_name }, 'Ignoring capability');
      return false;
    default:
      if (payload.capability_name.includes('battery_level')) {
        return false;
      }
      return true;
  }
}

module.exports = {
  getCapabilityByName,
  getCapabilityById,
  isCapability,
};
