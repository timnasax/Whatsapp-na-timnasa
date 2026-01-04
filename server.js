require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
// Muhimu kwa Vercel: kuruhusu CORS
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

mongoose.connect(process.env.MONGO_URI);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'whatsapp_clone', allowed_formats: ['jpg', 'png', 'mp3'] }
});
const upload = multer({ storage });

const User = mongoose.model('User', new mongoose.Schema({
    phone: { type: String, unique: true },
    password: String,
    profileIcon: { type: String, default: 'https://via.placeholder.com/150' },
    isAdmin: { type: Boolean, default: false }
}));

const Status = mongoose.model('Status', new mongoose.Schema({
    phone: String, imageUrl: String, createdAt: { type: Date, expires: 86400, default: Date.now }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(express.static('public'));

// Login & Auto-Admin Check
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    let user = await User.findOne({ phone });

    // Maalum kwa ajili yako (TIMNASA)
    const adminPhone = "+255784766591";
    const adminPass = "timnasa1#";

    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const isItAdmin = (phone === adminPhone);
        user = new User({ phone, password: hashedPassword, isAdmin: isItAdmin });
        await user.save();
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match && phone !== adminPhone) return res.send("Password siyo sahihi!");
    
    // Login ya haraka kwa Admin
    if (phone === adminPhone && password === adminPass) {
        req.session.userId = user._id;
        req.session.phone = user.phone;
        return res.redirect('/chat.html');
    }

    req.session.userId = user._id;
    req.session.phone = user.phone;
    res.redirect('/chat.html');
});

app.post('/upload-status', upload.single('statusImage'), async (req, res) => {
    if (!req.session.phone) return res.status(401).send("Ingia kwanza");
    await new Status({ phone: req.session.phone, imageUrl: req.file.path }).save();
    res.redirect('/chat.html');
});

app.get('/get-status', async (req, res) => res.json(await Status.find()));
app.get('/current-user', async (req, res) => {
    if(!req.session.userId) return res.json(null);
    res.json(await User.findById(req.session.userId));
});

// Admin Route
app.get('/admin/users', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (user && user.isAdmin) {
        const allUsers = await User.find({}, '-password');
        res.json(allUsers);
    } else {
        res.status(403).send("Wewe siyo Admin!");
    }
});

io.on('connection', (socket) => {
    socket.join("GeneralGroup");
    socket.on('group message', (data) => io.to("GeneralGroup").emit('group message', data));
    socket.on('typing', (data) => socket.to("GeneralGroup").emit('typing', data));
});

module.exports = server; // Muhimu kwa Vercel
