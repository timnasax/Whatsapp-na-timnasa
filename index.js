const express = require('express');
const path = require('path');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('public'));

// UKURASA WA NYUMBANI (Dashboard ya kuingiza namba)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TIMNASA TMD1 PAIRING</title>
        <style>
            body { background: #121212; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e1e1e; padding: 30px; border-radius: 15px; text-align: center; border: 1px solid #FF4500; width: 350px; }
            input { width: 100%; padding: 12px; margin: 15px 0; border-radius: 8px; border: 1px solid #333; background: #252525; color: white; box-sizing: border-box; }
            button { background: #FF4500; color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; cursor: pointer; font-weight: bold; }
            #code { font-size: 24px; color: #00ffe7; margin-top: 20px; font-weight: bold; letter-spacing: 3px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>TIMNASA TMD1</h2>
            <p>Ingiza namba ya simu (mfano: 255784766591)</p>
            <input type="number" id="number" placeholder="255784766591">
            <button onclick="getCode()">GENERATE CODE</button>
            <div id="code"></div>
        </div>
        <script>
            async function getCode() {
                const num = document.getElementById('number').value;
                const display = document.getElementById('code');
                if(!num) return alert("Weka namba!");
                display.innerText = "Generating...";
                try {
                    const res = await fetch('/pair?number=' + num);
                    const data = await res.json();
                    display.innerText = data.code || "FAILED";
                } catch (e) { display.innerText = "ERROR"; }
            }
        </script>
    </body>
    </html>
    `);
});

// LOGIC YA KUTAFUTA PAIRING CODE
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    try {
        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            logger: pino({ level: 'fatal' }),
            browser: Browsers.macOS('Safari'),
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(num);
            if (!res.headersSent) res.send({ code });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Server Error" });
    }
});

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
