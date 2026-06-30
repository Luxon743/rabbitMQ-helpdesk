const express = require('express');
const crypto = require('crypto');
const { connectRabbit, getChannel, EXCHANGE_NAME } = require('../config/rabbit');

const app = express();
app.use(express.json());

app.post('/tickets', (req, res) => {
    const { title, description, priority } = req.body;

    // Validación rápida
    if (!title || !priority) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (title, priority)' });
    }

    // Armamos el contrato del evento
    const eventPayload = {
        eventId: crypto.randomUUID(),
        type: 'ticket.created',
        occurredAt: new Date().toISOString(),
        version: 1,
        payload: {
            ticketId: `TCK-${Math.floor(Math.random() * 10000)}`,
            title,
            description,
            priority
        }
    };

    // Publicar el evento en el broker
    const channel = getChannel();
    
    // Usamos de routing key el formato "ticket.created.<prioridad>"
    const routingKey = `ticket.created.${priority}`; 

    channel.publish(
        EXCHANGE_NAME, 
        routingKey, 
        Buffer.from(JSON.stringify(eventPayload))
    );

    console.log(`Evento publicado exitosamente con routing key: ${routingKey}`);
    
    res.status(201).json({ 
        message: 'Ticket recibido y evento encolado', 
        eventId: eventPayload.eventId 
    });
});

// Primero conectamos a Rabbit, si todo sale bien, levantamos Express
connectRabbit().then(() => {
    app.listen(3000, () => {
        console.log('API Service corriendo en http://localhost:3000');
    });
});