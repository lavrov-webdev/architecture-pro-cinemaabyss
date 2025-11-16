const express = require('express');
const { Kafka } = require('kafkajs')

const app = express();
const subApp = express.Router();
const PORT = process.env.PORT || 8082;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'kafka:9092';

app.use('/api/events', subApp);
subApp.use(express.json());

subApp.use((req, res, next) => {
    const startTime = Date.now();
    const requestLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        query: req.query,
        body: req.body,
        headers: req.headers
    };
    
    // console.log('→ Incoming Request:', JSON.stringify(requestLog, null, 2));
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to log response
    res.json = function(data) {
        const duration = Date.now() - startTime;
        const responseLog = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            body: data
        };
        
        // console.log('← Outgoing Response:', JSON.stringify(responseLog, null, 2));
        
        return originalJson(data);
    };
    
    next();
});

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