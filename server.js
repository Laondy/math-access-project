// server.js

// 1. استيراد المكتبات الضرورية
require('dotenv').config(); // تحميل المتغيرات من ملف .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // إضافة cors للسماح للوصول من index.html

// 2. إنشاء تطبيق Express
const app = express();
app.use(express.json()); // لتمكين تحليل بيانات JSON في الطلبات
app.use(cors()); // تفعيل CORS للسماح لصفحة index.html بالاتصال

// 3. الاتصال بقاعدة البيانات (باستخدام الرابط من ملف .env)
const mongoURI = process.env.MONGO_URI;

// التحقق من وجود الرابط لتجنب خطأ "undefined"
if (!mongoURI) {
    console.error("❌ MONGO_URI is not defined in the .env file!");
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error. Check your MONGO_URI in .env file!');
        console.error('Error details:', error.message);
    });


// 4. تحديد نموذج بيانات (Schema) لكود التفعيل
const accessCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    }
});

const AccessCode = mongoose.model('AccessCode', accessCodeSchema);


// 5. مسار (Route) معالجة التفعيل
app.post('/api/activate', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Access code is required.' });
    }

    try {
        const accessCode = await AccessCode.findOne({ code: code });

        if (!accessCode) {
            return res.status(404).json({ success: false, message: 'Invalid access code.' });
        }

        if (accessCode.isUsed) {
            return res.status(403).json({ success: false, message: 'Access code has already been used.' });
        }

        // تفعيل الكود لمرة واحدة
        accessCode.isUsed = true;
        await accessCode.save();

        res.json({ success: true, message: 'Access granted. Code activated successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during activation.' });
    }
});


// 6. تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});