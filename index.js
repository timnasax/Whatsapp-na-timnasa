const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const pino = require('pino');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// 1. DASHBOARD & UI
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f0f0f;color:white;text-align:center;font-family:sans-serif;padding-top:100px;">
            <h1>TIMNASA TMD1 V2 ONLINE ✅</h1>
            <p>Tumia <b>/code?number=255784766591</b> kupata Pairing Code</p>
            <p>Tumia <b>/qr</b> kuona QR Code</p>
        </body>
    `);
});

// 2. PAIRING CODE ENDPOINT
app.get('/code', async (req, res) => {
    let num = req.query.number;
    if(!num) return res.status(400).send({error: "Weka namba! Mfano: /code?number=255784766591"});
    
    const { state, saveCreds } = await useMultiFileAuthState('./temp_session');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Safari")
    });

    if (!sock.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(num);
        if (!res.headersSent) res.send({ code });
    }
});

// 3. QR CODE ENDPOINT
app.get('/qr', async (req, res) => {
    const { state } = await useMultiFileAuthState('./temp_qr');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
    });

    sock.ev.on('connection.update', async (s) => {
        const { qr } = s;
        if (qr && !res.headersSent) {
            res.setHeader('Content-Type', 'image/png');
            res.end(await QRCode.toBuffer(qr));
        }
    });
});

// 4. BOT MAIN ENGINE
async function startTimnasa() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (text.startsWith(prefix)) {
            const cmd = text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

            if (cmd === 'ping') await sock.sendMessage(from, { text: 'Spidi ya TIMNASA TMD1 ni 100%' });
            if (cmd === 'menu') await sock.sendMessage(from, { text: '*MENU*\n.ping\n.owner\n.repo' });
            if (cmd === 'owner') await sock.sendMessage(from, { text: 'Dev: wa.me/255784766591' });
        }
    });

    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log("TIMNASA TMD1 IS ONLINE! ✅");
        if (u.connection === 'close') startTimnasa();
    });
}

// START EVERYTHING
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
startTimnasa();
