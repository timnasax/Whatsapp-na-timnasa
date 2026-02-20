const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const express = require('express');
const fs = require('fs-extra');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 8000;

// --- UKURASA WA PAIRING (HTML UI) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TIMNASA TMD1 - CONNECT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { background: #000; color: #0f0; font-family: 'Courier New', monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .box { border: 2px solid #0f0; padding: 20px; text-align: center; border-radius: 10px; box-shadow: 0 0 15px #0f0; }
            input { padding: 10px; width: 80%; margin: 10px 0; background: #111; border: 1px solid #0f0; color: #0f0; text-align: center; }
            button { padding: 10px 20px; background: #0f0; color: #000; border: none; font-weight: bold; cursor: pointer; }
            #result { margin-top: 20px; font-size: 20px; color: #fff; letter-spacing: 2px; }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>TIMNASA TMD1</h2>
            <p>Ingiza namba yako kuanza (mfano: 255784766591)</p>
            <input type="number" id="num" placeholder="255784766591">
            <br>
            <button onclick="getPair()">PATA KODI</button>
            <div id="result"></div>
        </div>
        <script>
            async function getPair() {
                const n = document.getElementById('num').value;
                const r = document.getElementById('result');
                if(!n) return alert('Weka namba!');
                r.innerText = 'Tafadhali subiri...';
                try {
                    const res = await fetch('/pair?number=' + n);
                    const data = await res.json();
                    r.innerText = data.code || 'Imefeli';
                } catch(e) { r.innerText = 'Error!'; }
            }
        </script>
    </body>
    </html>
    `);
});

// --- BOT LOGIC ---
async function startTimnasa() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Safari")
    });

    sock.ev.on('creds.update', saveCreds);

    // KUPATA PAIRING CODE KUPITIA HTTP
    app.get('/pair', async (req, res) => {
        let number = req.query.number;
        if(!number) return res.json({error: "No number"});
        try {
            if (!sock.authState.creds.registered) {
                await delay(2000);
                number = number.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(number);
                if (!res.headersSent) res.json({ code });
            } else {
                res.json({ code: "Tayari Imeunganishwa!" });
            }
        } catch (e) { res.json({ error: "Try Again" }); }
    });

    // COMMANDS ZIKISHALINKIWA
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const prefix = ".";
        
        if (body.startsWith(prefix)) {
            const cmd = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
            
            if (cmd === 'ping') await sock.sendMessage(from, { text: 'TIMNASA TMD1 Iko Hewani! 🚀' });
            if (cmd === 'menu') await sock.sendMessage(from, { text: '📌 *TIMNASA TMD1 AMRI:*\n\n1. .ping\n2. .owner\n3. .alive' });
            if (cmd === 'alive') await sock.sendMessage(from, { text: 'Niko hai, bosi! ✅' });
            if (cmd === 'owner') await sock.sendMessage(from, { text: 'Miliki: wa.me/255784766591' });
        }
    });

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') console.log("TIMNASA TMD1 IMEUNGANISHWA! ✅");
        if (connection === 'close') {
            const restart = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (restart) startTimnasa();
        }
    });
}

// WASHA SERVER NA BOT
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
startTimnasa();
