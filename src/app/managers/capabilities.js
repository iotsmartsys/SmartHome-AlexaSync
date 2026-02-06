const http = require('../utils/http');
const logger = require('../utils/logger');

const capabilityCache = new Map();

async function getCapability(payload) {
  try {
    logger.info('Getting capability:', payload.capability_name);
    const capabilityName = payload.capability_name;
    const cached = getCapabilityFromCache(capabilityName);
    if (cached && cached.value_type && Array.isArray(cached.platforms)) {
      logger.info('Capability encontrada no cache:', cached);
      return cached;
    }
    const response = await http.get(`capabilities/${capabilityName}`);
    logger.info('Capability response:', response.data);
    return addCapabilityToCache(capabilityName, response.data);
  } catch (error) {
    logger.error('Error getting capability:', error.message);
    return null;
  }
}

async function getCapabilityByName(capability_name) {
  try {
    const cached = getCapabilityFromCache(capability_name);
    if (cached) {
      logger.info('Capability referenceId encontrada no cache:', cached);
      return cached;
    }

    logger.info('Getting capability:', capability_name);
    const response = await http.get(`capabilities/${capability_name}`);
    logger.info('Capability response:', response.data);
    return addCapabilityToCache(capability_name, response.data);
  } catch (error) {
    logger.error('Error getting capability:', error.message);
    return null;
  }
}

function getCapabilityFromCache(capability_name) {
  return capabilityCache.get(capability_name) || null;
}

function addCapabilityToCache(capability_name, capability) {
  if (!capability) {
    return null;
  }
  const cached = {
    capability_name: capability.capability_name,
    device_id: capability.device_id,
    owner: capability.owner,
    smart_home: capability.smart_home,
    value_type: capability.value_type,
  };

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
  getCapability,
  getCapabilityByName,
  isCapability,
};
