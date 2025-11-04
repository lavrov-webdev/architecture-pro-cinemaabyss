const express = require('express');
const { Kafka } = require('kafkajs')

const app = express();
const subApp = express.Router();
const PORT = process.env.PORT || 8082;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'kafka:9092';

app.use('/api/events', subApp);
subApp.use(express.json());

const kafka = new Kafka({
    clientId: 'events-service',
    brokers: [KAFKA_BROKERS],
})

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "main" })

subApp.get('/health', (req, res) => {
    res.json({ status: true });
});

subApp.post('/movie', async (req, res) => {
    await producer.send({
        topic: 'movie-events',
        messages: [{ value: JSON.stringify(req.body) }],
    });
    res.status(201).json({ status: 'success' }).end()
});

subApp.post('/payment', async (req, res) => {
    await producer.send({
        topic: 'payment-events',
        messages: [{ value: JSON.stringify(req.body) }],
    });
    res.status(201).json({ status: 'success' }).end()
});

subApp.post('/user', async (req, res) => {
    await producer.send({
        topic: 'user-events',
        messages: [{ value: JSON.stringify(req.body) }],
    });
    res.status(201).json({ status: 'success' }).end()
});

const run = async () => {
    await producer.connect();
    await consumer.connect()
    await consumer.subscribe({
        topics: [
            'movie-events',
            'payment-events',
            'user-events'
        ]
    })
    await consumer.run({
        eachMessage({ message, topic }) {
            console.log(`Topic: ${topic}; message: ${message.value}`)
        }
    })
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

run();