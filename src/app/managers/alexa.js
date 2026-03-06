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
    logger.info({ value }, 'getValueCapability - Capability value');
    switch (capability.value_type) {
        case 'power':
            return String(value || '').toLowerCase() === 'on' || String(value || '').toLowerCase() === 'true' ? 'ON' : 'OFF';
        case 'detection':
            return String(value || '').toLowerCase() === 'detected' ? 'DETECTED' : 'NOT_DETECTED';
        case 'open_closed':
            // Convention: open => DETECTED, closed => NOT_DETECTED
            return String(value || '').toLowerCase() === 'open' ? 'DETECTED' : 'NOT_DETECTED';
        case 'press_count':
            return value;
        case 'pressed':
            return String(value || '').toLowerCase() === 'pressed' ? 'PRESSED' : null;
        default:
            logger.warn({ value_type: capability.value_type }, 'Unknown capability value_type');
            return null;
    }
}

/*
{
  "capability_uid": "e1050702-b686-48fc-b409-a03483c697ed",
  "state": {
    "instance": "e1050702-b686-48fc-b409-a03483c697ed",
    "eventId": "Button.SinglePush.1"
  },
  "ts": "2026-03-05T20:30:00.000Z"
}
*/

function getAlexaEventIdByValueCapability(capability, value) {
    logger.info({ value }, 'getAlexaEventIdByValueCapability - Capability value');

    switch(value) {
        case 'pressed_x1':
            return 'Button.SinglePush.1';
        case 'pressed_x2':
            return 'Button.DoublePress.1';
        case 'long_press':
            return 'Button.LongPress.1';
        default:
            logger.warn({ value }, 'Unknown event value for remote capability');
            return null;
    }
}

function buildAlexaState(capability, newValue) {
    logger.info(`Capability json: ${JSON.stringify(capability)}`);
    const deviceType = capability.smart_home.Alexa.deviceType;

    switch (deviceType) {
        case 'MOTION_SENSOR':
            return { detectionState: getAlexaValueCapability(capability, newValue) };
        case 'DOORBELL':
            return { eventDetectionState: getAlexaValueCapability(capability, newValue) };
        case 'CONTACT_SENSOR':
            return { detectionState: getAlexaValueCapability(capability, newValue) };
        case 'REMOTE':
            return { instance: capability.uid, eventId: getAlexaEventIdByValueCapability(capability, newValue) };
        default:
            return { powerState: getAlexaValueCapability(capability, newValue) };
    }
}

async function reportAlexaCapabilityRemoval(uid) {
    try {
        logger.info(`Reporting Alexa capability removal for capability UID: ${uid}`);
        const payloadAlexa = {
            capability_uid: uid,
            delete: true
        };
        logger.info(`Reporting Alexa capability removal with payload: ${JSON.stringify(payloadAlexa)}`);
        const response = await http.post('', payloadAlexa);
        logger.info(`Alexa capability removal reported successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logger.error({ err: error }, 'Error reporting Alexa capability removal');
    }
}

async function reportAlexaCapabilityAddOrUpdate(capability) {
    try {
        logger.info(`Reporting Alexa capability add/update for capability: ${capability.capability_name}`);
        const payloadAlexa = {
            capability_uid: capability.uid,
            add_or_update: true
        };
        logger.info(`Reporting Alexa capability add/update with payload: ${JSON.stringify(payloadAlexa)}`);
        const response = await http.post('', payloadAlexa);
        logger.info(`Alexa capability add/update reported successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logger.error({ err: error }, 'Error reporting Alexa capability add/update');
    }
}

async function reportAlexaValueChange(capability, payload) {
    try {
        payloadAlexa = {
            capability_uid: capability.uid,
            state: buildAlexaState(capability, payload.value),
            ts: Date.now()
        };

        logger.info(`Reporting Alexa value change with payload: ${JSON.stringify(payloadAlexa)}`);
        const response = await http.post('', payloadAlexa);
        logger.info(`Alexa value change reported successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logger.error({ err: error }, 'Error reporting Alexa value change');
    }
}

function isAlexa(capability) {
    logger.info(`Checking if capability is Alexa Smart Home: ${JSON.stringify(capability)}`);
    return capability && capability.smart_home.Alexa !== undefined;
}

module.exports = {
    reportAlexaValueChange,
    isAlexa,
    reportAlexaCapabilityAddOrUpdate,
    reportAlexaCapabilityRemoval,
};