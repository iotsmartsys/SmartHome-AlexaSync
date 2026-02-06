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
            return value === 'on' || capability.value === 'true' ? 'ON' : 'OFF';
        case 'detection':
            return value === 'detected' ? 'detected' : 'notDetected';
        case 'press_count':
            return value === 'pressed_x1' ? 'pressed' : null;
        default:
            logger.warn('Unknown capability value_type:', capability.value_type);
            return null;
    }
}

async function reportAlexaValueChange(device_id, capability_name, alexaValue) {
    try {
        const payload = {
            device_id: device_id,
            capability_name: capability_name,
            state: { powerState: alexaValue },
            ts: Date.now()
        };
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
    isAlexa
};