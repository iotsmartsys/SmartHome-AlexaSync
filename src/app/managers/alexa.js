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
    logger.info('getValueCapability - Capability value:', value);
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
        case 'pressed':
            return String(value || '').toLowerCase() === 'pressed' ? 'PRESSED' : null;
        default:
            logger.warn('Unknown capability value_type:', capability.value_type);
            return null;
    }
}

function buildAlexaState(capability, newValue) {
    const deviceType = capability.smart_home.Alexa.deviceType;

    switch (deviceType) {
        case 'MOTION_SENSOR':
            return { detectionState: getAlexaValueCapability(capability, newValue) };
        case 'DOORBELL_EVENT_SOURCE':
            return { eventDetectionState: getAlexaValueCapability(capability, newValue) };
        case 'CONTACT_SENSOR':
            return { detectionState: getAlexaValueCapability(capability, newValue) };
        default:
            return { powerState: getAlexaValueCapability(capability, newValue) };
    }
}

async function reportAlexaValueChange(capability, newValue) {
    try {
        const payload = {
            capability_uid: capability.capability_uid,
            state: buildAlexaState(capability, newValue),
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
    isAlexa,
    buildAlexaState,
};