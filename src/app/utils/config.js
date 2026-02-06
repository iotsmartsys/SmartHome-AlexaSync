
const host_name_mqtt = process.env.MQTT_HOST;
const mqtt_topic = process.env.MQTT_TOPIC || 'device/updated';
const mqtt_user_name = process.env.MQTT_USER_NAME;
const mqtt_password = process.env.MQTT_PASSWORD;
const mqtt_client_id = process.env.MQTT_CLIENT_ID || 'alexa_sync_local-client';
const host_port_mqtt = process.env.MQTT_PORT || 1883;
const mqtt_protocol = process.env.MQTT_PROTOCOL || 'mqtt';

const api_url = process.env.API_URL;
const api_key = process.env.API_KEY || '';
const api_authorization = process.env.API_AUTHORIZATION || '';

const api_alexa_url = process.env.API_ALEXA_URL || '';
const api_alexa_key = process.env.API_ALEXA_KEY || '';

module.exports = {
    host_name_mqtt,
    host_port_mqtt,
    mqtt_protocol,
    api_url,
    mqtt_topic,
    mqtt_user_name,
    mqtt_password,
    mqtt_client_id,
    api_key,
    api_authorization,
    api_alexa_url,
    api_alexa_key
};
