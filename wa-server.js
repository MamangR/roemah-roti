const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = 3001;
const API_KEY = process.env.LOCAL_WA_API_KEY || 'roemah_roti_secret_test_key';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('\n=============================================');
    console.log('QR RECEIVED. Scan this with WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('=============================================\n');
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.initialize();

app.post('/send-message', async (req, res) => {
    const { apiKey, phone, message } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    // WhatsApp ID format: number@c.us
    const chatId = `${phone}@c.us`;

    try {
        await client.sendMessage(chatId, message);
        console.log(`Message sent to ${phone}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`Failed to send message to ${phone}:`, error);
        res.status(500).json({ error: 'Failed to send message', details: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`Local WA Gateway listening on port ${PORT}`);
});
