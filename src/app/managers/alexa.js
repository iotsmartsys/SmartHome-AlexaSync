const axios = require('axios');
const logger = require('../utils/logger');
const { api_alexa_url, api_alexa_key } = require('../utils/config');

const http = axios.create({
    baseURL: api_alexa_url,
    headers: {
        'x-internal-key': api_alexa_key,
        'Content-Type': 'application/json'
    },
    maxBodyLength: Infinity,
});

function getAlexaValueCapability(capability, value) {
    logger.info('getValueCapability - Capability value:', capability.value);
    switch (capability.value_type) {
        case 'power':
            return String(value || '').toLowerCase() === 'on' || String(value || '').toLowerCase() === 'true' ? 'ON' : 'OFF';
        case 'detection':
            return String(value || '').toLowerCase() === 'detected' ? 'DETECTED' : 'NOT_DETECTED';
        case 'open_closed':
            // Convention: open => DETECTED, closed => NOT_DETECTED
            return String(value || '').toLowerCase() === 'open' ? 'DETECTED' : 'NOT_DETECTED';
        case 'press_count':
            return value === 'pressed_x1' ? 'pressed' : null;
        default:
            logger.warn('Unknown capability value_type:', capability.value_type);
            return null;
    }
}

function buildAlexaState(capability, alexaValue) {
    const deviceType = capability?.smart_home?.Alexa?.deviceType ? String(capability.smart_home.Alexa.deviceType).trim().toUpperCase() : '';

    if (deviceType === 'CONTACT_SENSOR') {
        return { detectionState: alexaValue };
    }

    // Default: PowerController devices
    return { powerState: alexaValue };
}

async function reportAlexaValueChange(device_id, capability_name, alexaValue, capability) {
    try {
        const payload = {
            device_id: device_id,
            capability_name: capability_name,
            alexa_device_type: capability?.smart_home?.Alexa?.deviceType,
            state: buildAlexaState(capability, alexaValue),
            ts: Date.now()
        };
        console.log(payload);
        logger.info('Reporting Alexa value change with payload:', payload);
        const response = await http.post('alexa/report', payload);
        logger.info('Alexa value change reported successfully:', response.data);
    } catch (error) {
        logger.error('Error reporting Alexa value change:', error.message);
    }
}

function isAlexa(capability) {
    return capability && capability.smart_home.Alexa !== undefined;
}


module.exports = {
    getAlexaValueCapability,
    reportAlexaValueChange,
    isAlexa,
    buildAlexaState,
};