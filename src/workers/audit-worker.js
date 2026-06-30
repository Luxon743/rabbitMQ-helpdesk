const fs = require('fs');
const path = require('path');
const { connectRabbit, getChannel, EXCHANGE_NAME } = require('../config/rabbit');

const QUEUE_NAME = 'audit.queue';
// El archivo se va a guardar en la raíz del proyecto
const LOG_FILE = path.join(__dirname, '../../audit.log');

async function startWorker() {
    const channel = await connectRabbit();

    // Creamos la fila de auditoría
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Usamos el comodín '#' para escuchar TODOS los eventos del exchange
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '#');

    console.log(`Audit Worker escuchando TODOS los eventos en la cola: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
            const event = JSON.parse(msg.content.toString());
            
            // Armamos la línea de texto que vamos a guardar
            const logEntry = `[${new Date().toISOString()}] EVENTO: ${event.type} | ID: ${event.eventId} | PAYLOAD: ${JSON.stringify(event.payload)}\n`;
            
            // Escribimos en el archivo audit.log (si no existe, lo crea)
            fs.appendFile(LOG_FILE, logEntry, (err) => {
                if (err) {
                    console.error('Error escribiendo el log:', err);
                } else {
                    console.log(`Auditoría guardada: ${event.type}`);
                }
            });

            // Siempre confirmamos (ack) para que el broker sepa que terminamos
            channel.ack(msg);
        }
    });
}

startWorker();