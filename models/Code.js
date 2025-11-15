// models/Code.js

const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// يمنع Mongoose من إعادة تعريف النموذج في بيئة Serverless
module.exports = mongoose.models.Code || mongoose.model('Code', codeSchema);