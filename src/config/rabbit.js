const amqp = require('amqplib');

const RABBIT_URL = 'amqp://127.0.0.1';
const EXCHANGE_NAME = 'helpdesk.events';

let channel = null;

async function connectRabbit() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        channel = await connection.createChannel();
        
        // Creamos el exchange tipo 'topic'
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        
        console.log('Conectado a RabbitMQ y Exchange configurado');
        return channel;
    } catch (error) {
        console.error('Error conectando a RabbitMQ:', error);
        process.exit(1);
    }
}

function getChannel() {
    if (!channel) throw new Error('El canal de RabbitMQ no está inicializado');
    return channel;
}

module.exports = { connectRabbit, getChannel, EXCHANGE_NAME };