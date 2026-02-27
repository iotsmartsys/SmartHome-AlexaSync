const http = require('../utils/http');
const logger = require('../utils/logger');

const capabilityCache = new Map();

async function getCapabilityByName(capability_name) {
  try {
    const cached = getCapabilityFromCache(capability_name);
    if (cached) {
      logger.info(`Capability referenceId encontrada no cache: ${JSON.stringify(cached)}`);
      return cached;
    }

    logger.info('Getting capability:', capability_name);
    const response = await http.get(`smart-home/Alexa/capabilities/?group_name=Alexa&name=${capability_name}`);
    if (response.status !== 200) {
      logger.warn(`Capability API returned non-200 status: ${response.status} for name: ${capability_name}`);
      return null;
    }
    let capability = response.data;
    logger.info(`Capability response: ${JSON.stringify(capability)}`);

    // API may return an array of capabilities — use the first item when present
    if (Array.isArray(capability)) {
      if (capability.length === 0) {
        logger.warn(`Capability array is empty for name: ${capability_name}`);
        return null;
      }
      capability = capability[0];
    }

    // API may return an empty string for no-result — normalize to null
    if (typeof capability === 'string' && capability.trim() === '') {
      logger.warn(`Capability is null or undefined for name: ${capability_name}`);
      return null;
    }

    return addCapabilityToCache(capability_name, capability);
  } catch (error) {
    logger.error(`Error getting capability: ${error}`);
    if (error.response && error.response.status === 404) {
      logger.warn(`Capability ${capability_name} not found in API`);
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
      logger.info('Ignoring capability:', payload.capability_name);
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
  isCapability,
};
