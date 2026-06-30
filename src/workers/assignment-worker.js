const fs = require('fs');
const path = require('path');
const { connectRabbit, getChannel, EXCHANGE_NAME } = require('../config/rabbit');

const QUEUE_NAME = 'assignment.queue';
const PROCESSED_FILE = path.join(__dirname, '../../processed-events.json');

// Función auxiliar para leer/escribir el historial de eventos (Idempotencia)
function isProcessed(eventId) {
    if (!fs.existsSync(PROCESSED_FILE)) {
        fs.writeFileSync(PROCESSED_FILE, JSON.stringify([]));
    }
    const data = JSON.parse(fs.readFileSync(PROCESSED_FILE));
    return data.includes(eventId);
}

function markAsProcessed(eventId) {
    const data = JSON.parse(fs.readFileSync(PROCESSED_FILE));
    data.push(eventId);
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(data, null, 2));
}

async function startWorker() {
    const channel = await connectRabbit();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // fila de errores
    await channel.assertQueue('error.queue', { durable: true });

    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'ticket.created.#');
    console.log(`Assignment Worker esperando eventos en la cola: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
            const event = JSON.parse(msg.content.toString());
            
            // CHEQUEO DE IDEMPOTENCIA (Evitar duplicados)
            if (isProcessed(event.eventId)) {
                console.log(`Evento duplicado ignorado: ${event.eventId}`);
                return channel.ack(msg); // Lo confirmamos para que RabbitMQ lo borre y no vuelva a molestar
            }

            console.log(`\n Recibido evento: ${event.type} | ID: ${event.eventId}`);

            // SIMULAR FALLO CON PRIORIDAD CRITICAL
            if (event.payload.priority === 'critical') {
                console.log(`FALLO SIMULADO: El ticket ${event.payload.ticketId} es crítico. Enviando a fila de errores...`);
                
                // Lo mandamos a la fila de errores
                channel.sendToQueue('error.queue', Buffer.from(JSON.stringify({
                    error: 'Fallo al procesar ticket crítico',
                    originalEvent: event
                })));
                
                markAsProcessed(event.eventId); // Lo marcamos como procesado para no hacer un bucle
                return channel.ack(msg);
            }

            // FLUJO NORMAL (Si no es critical ni duplicado)
            setTimeout(() => {
                const assignedEvent = {
                    eventId: event.eventId,
                    type: 'ticket.assigned',
                    occurredAt: new Date().toISOString(),
                    payload: {
                        ticketId: event.payload.ticketId,
                        assignedTo: 'Soporte_Nivel_1',
                        status: 'in_progress'
                    }
                };

                channel.publish(EXCHANGE_NAME, 'ticket.assigned', Buffer.from(JSON.stringify(assignedEvent)));
                console.log(`Publicado evento: ticket.assigned para el ticket ${event.payload.ticketId}`);
                
                // Marcamos como procesado y confirmamos
                markAsProcessed(event.eventId);
                channel.ack(msg);
            }, 1000); 
        }
    });
}

startWorker();