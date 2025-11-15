// api/activate.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// استيراد نموذج (Model) الكود. يجب أن يكون هذا الملف موجوداً في المجلد الرئيسي (models/Code.js)
const Code = require('../models/Code'); 

// ----------------------------------------------------
// جزء الاتصال بـ MongoDB (مهم جداً للـ Serverless Caching)
// ----------------------------------------------------

// نستخدم هذا المتغير لتخزين الاتصال المفتوح وتجنب الاتصال في كل طلب
let cachedDb = null;

async function connectToDatabase() {
    // إذا كان الاتصال موجوداً، نستخدمه مباشرة
    if (cachedDb) {
        return cachedDb;
    }
    
    // نستخدم متغير البيئة (MONGO_URI) الذي ستحدده في إعدادات Vercel
    const db = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // ليتناسب مع بيئة Serverless
    });
    
    // تخزين الاتصال المفتوح
    cachedDb = db;
    return cachedDb;
}

// ----------------------------------------------------
// إعداد وتصدير Express API
// ----------------------------------------------------

const app = express();
// تفعيل CORS للسماح لملف index.html بالاتصال من أي موقع (لأغراض الاختبار)
app.use(cors());
// تفعيل قراءة طلبات JSON
app.use(express.json());

// هذا هو المسار الفعلي الذي سيتصل به ملف index.html
app.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Access Code is required.' });
        }

        // 1. البحث عن الكود في قاعدة البيانات
        const accessCode = await Code.findOne({ code: code });

        if (!accessCode) {
            return res.status(404).json({ success: false, message: 'Invalid Access Code.' });
        }

        // 2. التحقق مما إذا كان الكود قد استخدم من قبل
        if (accessCode.isUsed) {
            return res.status(200).json({ success: false, message: 'This code has already been activated.' });
        }

        // 3. تفعيل الكود وحفظه
        accessCode.isUsed = true;
        await accessCode.save();

        return res.status(200).json({ success: true, message: 'Access granted. Code activated successfully!' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error during activation process.', error: error.message });
    }
});

// Vercel يقوم بتغليف تطبيق Express هذا تلقائياً
module.exports = app;