// api/activate.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// استيراد نموذج الكود. تأكد أن المسار صحيح (models/Code.js)
const Code = require('../models/Code'); 

// ----------------------------------------------------
// جزء الاتصال بـ MongoDB لبيئة Serverless
// ----------------------------------------------------

// نستخدم متغير لتخزين الاتصال المفتوح وتجنب الاتصال في كل طلب (Caching)
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    // استخدام متغير البيئة (MONGO_URI) الذي ستضيفه في إعدادات Vercel
    const db = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // تحسين لأداء Serverless
    });
    
    cachedDb = db;
    return cachedDb;
}

// ----------------------------------------------------
// إعداد وتصدير Express API
// ----------------------------------------------------

const app = express();
app.use(cors()); // السماح بالاتصال من الواجهة الأمامية (index.html)
app.use(express.json());

// المسار الذي سيتصل به index.html هو /api/activate
app.post('/api/activate', async (req, res) => {
    try {
        await connectToDatabase();
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Access Code is required.' });
        }

        const accessCode = await Code.findOne({ code: code });

        if (!accessCode) {
            return res.status(404).json({ success: false, message: 'Invalid Access Code.' });
        }

        if (accessCode.isUsed) {
            return res.status(200).json({ success: false, message: 'This code has already been activated.' });
        }

        // التفعيل والحفظ
        accessCode.isUsed = true;
        await accessCode.save();

        return res.status(200).json({ success: true, message: 'Access granted. Code activated successfully!' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error during activation process.', error: error.message });
    }
});

// التصدير كـ Serverless Function (مطلوب من Vercel)
module.exports = app;