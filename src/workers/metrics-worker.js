const fs = require('fs');
const path = require('path');
const { connectRabbit, getChannel, EXCHANGE_NAME } = require('../config/rabbit');

const QUEUE_NAME = 'metrics.queue';
const METRICS_FILE = path.join(__dirname, '../../metrics.json');

async function startWorker() {
    const channel = await connectRabbit();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // Escuchamos solo cuando se crean tickets
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'ticket.created.#');

    console.log(`Metrics Worker escuchando en la cola: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
            const today = new Date().toISOString().split('T')[0]; // Ejemplo: "2026-06-28"
            
            let metrics = {};
            if (fs.existsSync(METRICS_FILE)) {
                metrics = JSON.parse(fs.readFileSync(METRICS_FILE));
            }

            // Sumamos 1 al día actual
            if (!metrics[today]) metrics[today] = 0;
            metrics[today] += 1;

            // Guardamos en el archivo json
            fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
            console.log(`Métrica actualizada: ${metrics[today]} tickets el día ${today}`);

            channel.ack(msg);
        }
    });
}

startWorker();