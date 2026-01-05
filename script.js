const input = document.getElementById("commandInput");
const output = document.getElementById("output");

// Hapa ndipo tunapofafanua commands zako
const commands = {
    help: `
    <span class="yellow">AVAILABLE COMMANDS:</span>
    ------------------
    <span class="white">ls</span>           : List files and directories
    <span class="white">clear</span>        : Clear terminal screen
    <span class="white">whoami</span>       : Display user info
    <span class="white">logo-gen</span>     : Start Logo Generator Tool
    <span class="white">scam-alert</span>   : WhatsApp Security Scanner
    `,

    ls: `
    <span class="blue">Android/</span>
    <span class="blue">DCIM/</span>
    <span class="blue">Downloads/</span>
    <span class="blue">WhatsApp/</span>
    index.html
    style.css
    script.js
    `,

    whoami: `
    User: <span class="green">TIMNASA Admin</span>
    Device: Samsung Galaxy A04s
    IP: 192.168.1.XX (Local)
    `,

    'logo-gen': `
    <span class="yellow">[!] INITIALIZING LOGO GENERATOR...</span>
    
    Creating 'FUNNY' Logo template...
    Processing graphics...
    
    <span class="green">[SUCCESS]</span> Logo concept created in /Images/logo_funny.png
    (Note: This is a text-based demo interface)
    `,

    'scam-alert': `
    <span class="red">--- WHATSAPP SECURITY PROTOCOL ---</span>
    
    [ANALYSIS] Scanning for threats...
    
    1. <span class="yellow">Verification Code Theft:</span> NEVER share 6-digit SMS code.
    2. <span class="yellow">Impersonation:</span> Check if the number is foreign (+234, etc).
    3. <span class="yellow">Fake Links:</span> Do not click links promising free data.
    
    <span class="green">Status: System Secure. Stay Vigilant.</span>
    `
};

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const cmd = input.value.trim().toLowerCase(); // Badilisha iwe herufi ndogo
        
        // Onyesha command uliyoandika
        output.innerHTML += `<div><span class="user">galaxy-a04s@timnasa:~$</span> ${cmd}</div>`;

        // Logic ya kujibu
        if (cmd === "clear") {
            output.innerHTML = ""; // Futa kila kitu
        } else if (commands[cmd]) {
            output.innerHTML += `<div>${commands[cmd]}</div>`; // Toa jibu sahihi
        } else if (cmd !== "") {
            output.innerHTML += `<div class="red">Command not found: ${cmd}</div>`; // Error message
        }

        // Safisha input na shusha chini (scroll down)
        input.value = "";
        output.scrollTop = output.scrollHeight;
    }
});
